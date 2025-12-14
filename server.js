const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store sessions (in production, use Redis or database)
const sessions = {};

// Helper function to generate device ID
function generateDeviceId() {
  return crypto.randomBytes(8).toString('hex');
}

// Helper function to get or create session
function getSession(sessionId) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      deviceId: generateDeviceId(),
      phone: null,
      signupBearer: null,
    };
  }
  return sessions[sessionId];
}

// Helper function to make API requests
async function makeRequest(url, method = 'GET', data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'User-Agent': 'Dart/3.5 (dart:io)',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'accept-language': 'en',
        'app-version': '5.5.12',
        ...headers,
      },
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status
    };

    if (method === 'POST' || method === 'DELETE') {
      if (data instanceof FormData) {
        config.data = data;
        config.headers = {
          ...config.headers,
          ...data.getHeaders(),
        };
      } else {
        config.data = new URLSearchParams(data).toString();
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
      }
    }

    const response = await axios(config);
    return {
      status: response.status,
      body: response.data,
      error: null,
    };
  } catch (error) {
    return {
      status: 0,
      body: null,
      error: error.message,
    };
  }
}

// Request OTP
app.post('/api/request-otp', async (req, res) => {
  const { phone, bearer, sessionId } = req.body;

  if (!phone) {
    return res.json({ success: false, error: 'Phone number is required' });
  }

  // Process phone number
  let processedPhone = phone.replace(/\D/g, '');
  if (!processedPhone.startsWith('63')) {
    processedPhone = '63' + processedPhone;
  }

  if (processedPhone.length !== 12) {
    return res.json({
      success: false,
      error: 'Phone number must be 10 digits (e.g., 9308201445). Country code 63 will be added automatically.',
    });
  }

  const session = getSession(sessionId || 'default');
  const authBearer = bearer || 'false';

  if (bearer) {
    session.signupBearer = bearer;
  }

  session.phone = processedPhone;

  const formData = new FormData();
  formData.append('phone', processedPhone);
  formData.append('type', 'SMS');
  formData.append('calling_code_id', '175');

  const headers = {
    'authorization': `Bearer ${authBearer}`,
    'device-id': session.deviceId,
  };

  const result = await makeRequest(
    'https://appv2.zuscoffee.ph/api/v3/auth/phone',
    'POST',
    formData,
    headers
  );

  if (result.error) {
    return res.json({ success: false, error: result.error, error_type: 'network' });
  }

  if (result.status === 200 && result.body && result.body.success) {
    return res.json({ success: true, message: 'Verification code sent to your phone!' });
  }

  if (result.status === 429) {
    return res.json({
      success: false,
      error: result.body?.message || 'Please wait a while before requesting a new code.',
      error_type: 'rate_limit',
      status_code: 429,
    });
  }

  if (result.status === 422) {
    const errorMsg = result.body?.message || 'Validation error. Please check your input.';
    return res.json({
      success: false,
      error: errorMsg,
      error_type: 'validation',
      status_code: 422,
    });
  }

  return res.json({
    success: false,
    error: result.body?.message || 'Failed to send OTP',
    error_type: 'unknown',
    status_code: result.status,
  });
});

// Get Bearer Token (Login)
app.post('/api/get-bearer-token', async (req, res) => {
  const { phone, otp_code, sessionId } = req.body;

  if (!otp_code) {
    return res.json({ success: false, error: 'OTP code is required' });
  }

  const session = getSession(sessionId || 'default');
  let processedPhone = phone;

  if (processedPhone) {
    processedPhone = processedPhone.replace(/\D/g, '');
    if (!processedPhone.startsWith('63')) {
      processedPhone = '63' + processedPhone;
    }
  } else if (session.phone) {
    processedPhone = session.phone;
  } else {
    return res.json({ success: false, error: 'Phone number is required' });
  }

  const authBearer = session.signupBearer || 'false';

  const formData = new FormData();
  formData.append('phone', processedPhone);
  formData.append('code', otp_code);
  formData.append('calling_code_id', '175');
  formData.append('device_id', session.deviceId);

  const headers = {
    'authorization': `Bearer ${authBearer}`,
    'device-id': session.deviceId,
  };

  const result = await makeRequest(
    'https://appv2.zuscoffee.ph/api/v3/auth/login',
    'POST',
    formData,
    headers
  );

  if (result.error) {
    return res.json({ success: false, error: result.error, error_type: 'network' });
  }

  if (result.status === 200) {
    // Check for "account does not exist" (new user for signup)
    if (
      result.body &&
      result.body.success === false &&
      result.body.message &&
      (result.body.message.includes('account does not exist') ||
        result.body.message.includes('login account does not exist'))
    ) {
      return res.json({
        success: true,
        otp_verified: true,
        new_user: true,
        message: 'OTP verified. Please proceed with registration.',
        bearer_token: null,
      });
    }

    // Extract token
    let bearerToken = null;
    if (result.body?.data?.token) {
      bearerToken = result.body.data.token;
    } else if (result.body?.token) {
      bearerToken = result.body.token;
    } else if (result.body?.data?.access_token) {
      bearerToken = result.body.data.access_token;
    } else if (result.body?.access_token) {
      bearerToken = result.body.access_token;
    }

    if (bearerToken) {
      // Clear session
      delete sessions[sessionId || 'default'];
      return res.json({
        success: true,
        bearer_token: bearerToken,
        message: 'Bearer token retrieved successfully!',
      });
    }
  }

  // Handle errors
  if (result.status === 429) {
    return res.json({
      success: false,
      error: result.body?.message || 'Rate limit exceeded.',
      error_type: 'rate_limit',
      status_code: 429,
    });
  }

  if (result.status === 422) {
    return res.json({
      success: false,
      error: result.body?.message || 'Invalid OTP code.',
      error_type: 'validation',
      status_code: 422,
    });
  }

  return res.json({
    success: false,
    error: result.body?.message || 'Failed to get bearer token',
    error_type: 'unknown',
    status_code: result.status,
  });
});

// Register Account
app.post('/api/register-account', async (req, res) => {
  const { bearer, firstName, lastName, email, dob, phone, dobPrivate, sessionId } = req.body;

  if (!firstName || !lastName || !email || !dob || !phone) {
    return res.json({ success: false, error: 'All fields are required' });
  }

  const session = getSession(sessionId || 'default');
  const useBearer = bearer || session.signupBearer || 'false';

  let processedPhone = phone.replace(/\D/g, '');
  if (!processedPhone.startsWith('63')) {
    processedPhone = '63' + processedPhone;
  }

  const formData = new FormData();
  formData.append('first_name', firstName);
  formData.append('last_name', lastName);
  formData.append('email', email);
  formData.append('dob', dob);
  formData.append('phone', processedPhone);
  formData.append('calling_code_id', '175');
  formData.append('device_id', session.deviceId);
  formData.append('dob_private', dobPrivate ? '1' : '0');

  const headers = {
    'authorization': `Bearer ${useBearer}`,
    'device-id': session.deviceId,
  };

  const result = await makeRequest(
    'https://appv2.zuscoffee.ph/api/v3/auth/register',
    'POST',
    formData,
    headers
  );

  if (result.error) {
    return res.json({ success: false, error: result.error, error_type: 'network' });
  }

  if (result.status === 200 && result.body && result.body.success) {
    let newBearerToken = null;
    if (result.body.data?.token) {
      newBearerToken = result.body.data.token;
    } else if (result.body.token) {
      newBearerToken = result.body.token;
    }

    // Clear session
    delete sessions[sessionId || 'default'];

    return res.json({
      success: true,
      message: 'Account registered successfully!',
      bearer_token: newBearerToken,
    });
  }

  return res.json({
    success: false,
    error: result.body?.message || 'Registration failed',
    error_type: 'validation',
    status_code: result.status,
  });
});

// Send Single Custom Gift Card
app.post('/api/send-custom-gift-card', async (req, res) => {
  const { bearer, template_id, amount, payment_method, sender_name, recipient_name, message, recipient_phone_number } = req.body;

  if (!bearer) {
    return res.json({ success: false, error: 'Bearer token is required' });
  }

  if (!recipient_phone_number || !amount || !sender_name || !recipient_name) {
    return res.json({ success: false, error: 'Recipient phone, amount, sender name, and recipient name are required' });
  }

  const session = getSession('default');
  const formData = new FormData();
  formData.append('template_id', template_id || '1');
  formData.append('amount', amount);
  formData.append('payment_method', payment_method || '99');
  formData.append('sender_name', sender_name);
  formData.append('recipient_name', recipient_name);
  formData.append('message', message || "You're the light in the dark. You cheer me up when I'm down. Here are some drinks for you!");
  formData.append('recipient_phone_number', recipient_phone_number);

  const headers = {
    'authorization': `Bearer ${bearer}`,
    'device-id': session.deviceId,
  };

  const result = await makeRequest(
    'https://appv2.zuscoffee.ph/api/v1/balance/gift-card/zb-create-gc',
    'POST',
    formData,
    headers
  );

  if (result.error) {
    return res.json({ success: false, error: result.error });
  }

  if (result.status === 200 && result.body?.data) {
    return res.json({
      success: true,
      data: result.body.data,
      ref_id: result.body.data.ref_id,
      amount: result.body.data.amount,
      message: 'Gift card sent successfully!',
    });
  }

  return res.json({
    success: false,
    error: result.body?.message || 'Failed to send gift card',
  });
});

// Batch Send Gift Cards
app.post('/api/batch-send', async (req, res) => {
  const { bearer, senderName, recipientName, recipientPhone, message, count } = req.body;

  if (!recipientPhone) {
    return res.json({ error: 'Recipient phone number is required' });
  }

  const numCount = Math.min(Math.max(parseInt(count) || 100, 1), 100);
  const amounts = [];
  for (let i = 300; i >= 250; i--) {
    amounts.push(i.toFixed(2));
  }

  const results = [];
  const promises = [];

  for (let i = 0; i < numCount; i++) {
    const amount = amounts[i % amounts.length];
    const payload = {
      template_id: '1',
      amount: amount,
      payment_method: '99',
      sender_name: senderName || 'Jenski Rende',
      recipient_name: recipientName || 'James Carl',
      message: message || "You're the light in the dark. You cheer me up when I'm down. Here are some drinks for you!",
      recipient_phone_number: recipientPhone,
    };

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const headers = {};
    if (bearer) {
      headers['authorization'] = `Bearer ${bearer}`;
    }

    promises.push(
      makeRequest(
        'https://appv2.zuscoffee.ph/api/v1/balance/gift-card/zb-create-gc',
        'POST',
        formData,
        headers
      ).then((result) => {
        let success = false;
        let refId = null;
        let insufficientBalance = false;
        let errorMessage = null;
        let shouldStop = false;

        if (result.status === 200 && result.body) {
          const msg = (result.body.message || '').toLowerCase();
          if (msg.includes('insufficient balance') || msg.includes('insufficient funds') || msg.includes('balance!')) {
            shouldStop = true;
            insufficientBalance = true;
          } else if (result.body.data?.ref_id) {
            success = true;
            refId = result.body.data.ref_id;
          } else {
            errorMessage = result.body.message || 'Unknown API response';
          }
        } else {
          errorMessage = `HTTP ${result.status}`;
        }

        return {
          index: i,
          success,
          insufficient: insufficientBalance,
          status: result.status,
          amount: amount,
          ref_id: refId,
          sender_name: senderName || 'Jenski Rende',
          recipient_name: recipientName || 'James Carl',
          recipient_phone: recipientPhone,
          error: errorMessage,
          stop: shouldStop,
        };
      })
    );
  }

  const allResults = await Promise.all(promises);
  res.json(allResults);
});

// Redeem Gift Card (Single)
app.post('/api/redeem-gift-card', async (req, res) => {
  const { bearer, code } = req.body;

  if (!bearer || !code) {
    return res.json({ success: false, error: 'Bearer token and code are required' });
  }

  const session = getSession('default');
  const formData = new FormData();
  formData.append('code', code);

  const headers = {
    'authorization': `Bearer ${bearer}`,
    'device-id': session.deviceId,
  };

  const result = await makeRequest(
    'https://appv2.zuscoffee.ph/api/v1/balance/redeem',
    'POST',
    formData,
    headers
  );

  if (result.error) {
    return res.json({ success: false, error: result.error });
  }

  if (result.status === 200 && result.body?.data) {
    return res.json({
      success: true,
      amount: result.body.data.amount || '0.00',
      new_promotional_balance: result.body.data.new_promotional_balance || '0',
      description: result.body.data.description || '',
      balance_log_ref_no: result.body.data.balance_log_ref_no || '',
    });
  }

  return res.json({
    success: false,
    error: result.body?.message || 'Failed to redeem gift card',
  });
});

// Batch Redeem Gift Cards
app.post('/api/batch-redeem', async (req, res) => {
  const { bearer, codes } = req.body;

  if (!bearer || !codes) {
    return res.json({ success: false, error: 'Bearer token and codes are required' });
  }

  const codeList = codes
    .split(/[,\n\r]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  if (codeList.length === 0) {
    return res.json({ success: false, error: 'No valid gift card codes found' });
  }

  const session = getSession('default');
  const promises = codeList.map((code, index) => {
    const formData = new FormData();
    formData.append('code', code);

    const headers = {
      'authorization': `Bearer ${bearer}`,
      'device-id': session.deviceId,
    };

    return makeRequest(
      'https://appv2.zuscoffee.ph/api/v1/balance/redeem',
      'POST',
      formData,
      headers
    ).then((result) => {
      if (result.status === 200 && result.body?.data) {
        return {
          index,
          code,
          success: true,
          amount: result.body.data.amount || '0.00',
          new_promotional_balance: result.body.data.new_promotional_balance || '0',
          description: result.body.data.description || '',
          balance_log_ref_no: result.body.data.balance_log_ref_no || '',
          error: null,
        };
      }

      return {
        index,
        code,
        success: false,
        amount: '0.00',
        new_promotional_balance: '0',
        description: '',
        balance_log_ref_no: '',
        error: result.body?.message || `HTTP ${result.status}`,
      };
    });
  });

  const allResults = await Promise.all(promises);
  res.json(allResults);
});

// Get Incoming Gift Cards
app.post('/api/get-incoming-gift-cards', async (req, res) => {
  const { bearer, page = 1 } = req.body;

  if (!bearer) {
    return res.json({ success: false, error: 'Bearer token is required' });
  }

  const session = getSession('default');
  const headers = {
    'authorization': `Bearer ${bearer}`,
    'device-id': session.deviceId,
  };

  const result = await makeRequest(
    `https://appv2.zuscoffee.ph/api/v1/balance/gift-card/incoming-gc?page=${page}`,
    'GET',
    null,
    headers
  );

  if (result.error) {
    return res.json({ success: false, error: result.error });
  }

  if (result.status === 200 && result.body?.data) {
    return res.json({
      success: true,
      data: result.body.data,
      gift_cards: result.body.data.data || [],
      current_page: result.body.data.current_page || 1,
      last_page: result.body.data.last_page || 1,
      total: result.body.data.total || 0,
    });
  }

  return res.json({
    success: false,
    error: result.body?.message || `HTTP ${result.status} error occurred.`,
  });
});

// Activate Balance
app.post('/api/activate-balance', async (req, res) => {
  const { bearer } = req.body;

  if (!bearer) {
    return res.json({ success: false, error: 'Bearer token is required' });
  }

  const session = getSession('default');
  const formData = new FormData();

  const headers = {
    'authorization': `Bearer ${bearer}`,
    'device-id': session.deviceId,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const result = await makeRequest(
    'https://appv2.zuscoffee.ph/api/v1/balance/activate',
    'POST',
    formData,
    headers
  );

  if (result.error) {
    return res.json({ success: false, error: result.error });
  }

  if (result.status === 200) {
    return res.json({
      success: true,
      message: 'Balance activated successfully!',
    });
  }

  return res.json({
    success: false,
    error: result.body?.message || `HTTP ${result.status} error occurred.`,
  });
});

// Get Balance
app.post('/api/get-balance', async (req, res) => {
  const { bearer } = req.body;

  if (!bearer) {
    return res.json({ success: false, error: 'Bearer token is required' });
  }

  const session = getSession('default');
  const headers = {
    'authorization': `Bearer ${bearer}`,
    'device-id': session.deviceId,
    'Content-Type': 'application/json',
  };

  const result = await makeRequest(
    'https://appv2.zuscoffee.ph/api/v2/user',
    'GET',
    null,
    headers
  );

  if (result.error) {
    return res.json({ success: false, error: result.error });
  }

  if (result.status === 200 && result.body?.data?.balance) {
    const balanceData = result.body.data.balance;
    const realBalance = parseFloat(balanceData.real_balance || '0.00');
    const promotionBalance = parseFloat(balanceData.promotion_balance || '0.00');
    const totalBalance = parseFloat(balanceData.balance || '0.00');

    return res.json({
      success: true,
      balance: realBalance.toFixed(2),
      promotional_balance: promotionBalance.toFixed(2),
      total_balance: totalBalance.toFixed(2),
      currency: balanceData.currency || '₱',
      promotion_balance_expiry_date: balanceData.promotion_balance_expiry_date || null,
    });
  }

  return res.json({
    success: false,
    error: result.body?.message || 'Unable to fetch balance',
  });
});

// Get Redeemed Gift Cards Total
app.post('/api/get-redeemed-gift-cards', async (req, res) => {
  const { bearer } = req.body;

  if (!bearer) {
    return res.json({ success: false, error: 'Bearer token is required' });
  }

  const session = getSession('default');
  const headers = {
    'authorization': `Bearer ${bearer}`,
    'device-id': session.deviceId,
    'Content-Type': 'application/json',
  };

  try {
    // Fetch first page to get total pages
    const firstPageResult = await makeRequest(
      'https://appv2.zuscoffee.ph/api/v1/balance/gift-card/list-redeemed?page=1',
      'GET',
      null,
      headers
    );

    if (firstPageResult.error) {
      return res.json({ success: false, error: firstPageResult.error });
    }

    if (firstPageResult.status !== 200 || !firstPageResult.body?.data) {
      return res.json({
        success: false,
        error: firstPageResult.body?.message || 'Unable to fetch redeemed gift cards',
      });
    }

    const firstPageData = firstPageResult.body.data;
    const totalCount = firstPageData.total || 0;
    const lastPage = firstPageData.last_page || 1;

    // Sum amounts from first page
    let totalAmount = 0;
    if (firstPageData.data && Array.isArray(firstPageData.data)) {
      firstPageData.data.forEach((card) => {
        totalAmount += parseFloat(card.amount || '0.00');
      });
    }

    // Fetch remaining pages if any
    if (lastPage > 1) {
      const pagePromises = [];
      for (let page = 2; page <= lastPage; page++) {
        pagePromises.push(
          makeRequest(
            `https://appv2.zuscoffee.ph/api/v1/balance/gift-card/list-redeemed?page=${page}`,
            'GET',
            null,
            headers
          )
        );
      }

      const pageResults = await Promise.all(pagePromises);
      pageResults.forEach((pageResult) => {
        if (pageResult.status === 200 && pageResult.body?.data?.data && Array.isArray(pageResult.body.data.data)) {
          pageResult.body.data.data.forEach((card) => {
            totalAmount += parseFloat(card.amount || '0.00');
          });
        }
      });
    }

    return res.json({
      success: true,
      total: totalCount,
      totalAmount: totalAmount.toFixed(2),
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.message || 'Unable to fetch redeemed gift cards',
    });
  }
});

// Delete Account
app.post('/api/delete-account', async (req, res) => {
  const { bearer, reason = '' } = req.body;

  if (!bearer) {
    return res.json({ success: false, error: 'Bearer token is required' });
  }

  const session = getSession('default');
  const formData = new FormData();
  formData.append('reason', reason);

  const headers = {
    'authorization': `Bearer ${bearer}`,
    'device-id': session.deviceId,
  };

  const result = await makeRequest(
    'https://appv2.zuscoffee.ph/api/v1/user/deactivate',
    'DELETE',
    formData,
    headers
  );

  if (result.error) {
    return res.json({ success: false, error: result.error });
  }

  if (result.status === 200 || result.status === 204) {
    return res.json({
      success: true,
      message: 'Account deactivated successfully!',
    });
  }

  return res.json({
    success: false,
    error: result.body?.message || `HTTP ${result.status} error occurred.`,
  });
});

app.listen(PORT, () => {
  console.log(`ZUS Coffee API Server running on http://localhost:${PORT}`);
});

