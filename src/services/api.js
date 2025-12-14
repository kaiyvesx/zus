// API Service for ZUS Coffee backend (Node.js/Express)
// Smart detection: Use localhost if running locally, otherwise use Render backend
const getApiBase = () => {
  // If in development mode, always use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  
  // If running on localhost (even in production build), use localhost backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // Otherwise, use Render backend (production)
  return 'https://zus-wla0.onrender.com';
};

const API_BASE = getApiBase();

// Helper function to handle API responses
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`API returned non-JSON response. Make sure the backend server is running at ${API_BASE}. Response: ${text.substring(0, 200)}`);
  }
  
  return response.json();
};

const api = {
  // Request OTP
  requestOTP: async (phone, bearer = '') => {
    const response = await fetch(`${API_BASE}/api/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        bearer,
        sessionId: 'default', // In production, use proper session management
      }),
    });

    return handleResponse(response);
  },

  // Get Bearer Token (Login)
  getBearerToken: async (phone, otpCode) => {
    const response = await fetch(`${API_BASE}/api/get-bearer-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        otp_code: otpCode,
        sessionId: 'default',
      }),
    });

    return handleResponse(response);
  },

  // Register Account
  registerAccount: async (data) => {
    const response = await fetch(`${API_BASE}/api/register-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bearer: data.bearer || '',
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        dob: data.dob,
        phone: data.phone,
        dobPrivate: data.dobPrivate,
        sessionId: 'default',
      }),
    });

    return handleResponse(response);
  },

  // Batch Send Gift Cards
  batchSendGiftCards: async (data) => {
    const response = await fetch(`${API_BASE}/api/batch-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bearer: data.bearer || '',
        senderName: data.senderName,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        message: data.message,
        count: data.count || 100,
      }),
    });

    return handleResponse(response);
  },

  // Redeem Gift Card (Single)
  redeemGiftCard: async (bearer, code) => {
    const response = await fetch(`${API_BASE}/api/redeem-gift-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bearer,
        code,
      }),
    });

    return handleResponse(response);
  },

  // Batch Redeem Gift Cards
  batchRedeemGiftCards: async (bearer, codes) => {
    const response = await fetch(`${API_BASE}/api/batch-redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bearer,
        codes,
      }),
    });

    return handleResponse(response);
  },

  // Get Incoming Gift Cards
  getIncomingGiftCards: async (bearer, page = 1) => {
    const response = await fetch(`${API_BASE}/api/get-incoming-gift-cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bearer,
        page,
      }),
    });

    return handleResponse(response);
  },

  // Activate Balance
  activateBalance: async (bearer) => {
    const response = await fetch(`${API_BASE}/api/activate-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bearer,
      }),
    });

    return handleResponse(response);
  },

  // Get Balance
  getBalance: async (bearer) => {
    const response = await fetch(`${API_BASE}/api/get-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bearer,
      }),
    });

    return handleResponse(response);
  },

  // Delete Account
  deleteAccount: async (bearer, reason = '') => {
    const response = await fetch(`${API_BASE}/api/delete-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bearer,
        reason,
      }),
    });

    return handleResponse(response);
  },

  // Send Custom Single Gift Card
  sendCustomGiftCard: async (bearer, data) => {
    const response = await fetch(`${API_BASE}/api/send-custom-gift-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bearer,
        template_id: data.template_id || '1',
        amount: data.amount,
        payment_method: data.payment_method || '99',
        sender_name: data.sender_name,
        recipient_name: data.recipient_name,
        message: data.message,
        recipient_phone_number: data.recipient_phone_number,
      }),
    });

    return handleResponse(response);
  },
};

export default api;

