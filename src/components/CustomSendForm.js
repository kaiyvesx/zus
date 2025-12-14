import React, { useState } from 'react';
import api from '../services/api';
import { generateAll } from '../utils/generators';
import CoffeeProgressBar from './CoffeeProgressBar';
import './FormStyles.css';

const CustomSendForm = ({ bearerToken, onClose }) => {
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('50.00');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleGenerateAll = () => {
    const generated = generateAll();
    if (generated.error) {
      setStatus(generated.error);
      return;
    }
    setSenderName(generated.senderName);
    setRecipientName(generated.recipientName);
    setMessage(generated.message);
  };

  const sendGiftCard = async () => {
    if (!bearerToken) {
      setStatus('Please enter Bearer token first');
      return;
    }

    if (!recipientPhone.trim()) {
      setStatus('Please enter recipient phone number');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus('Please enter a valid amount');
      return;
    }

    if (!senderName.trim()) {
      setStatus('Please enter sender name');
      return;
    }

    if (!recipientName.trim()) {
      setStatus('Please enter recipient name');
      return;
    }

    setIsLoading(true);
    setStatus('');
    setSuccessData(null);
    setProgress(0);

    // Simulate progress with delay
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const data = await api.sendCustomGiftCard(bearerToken, {
        template_id: '1',
        amount: parseFloat(amount).toFixed(2),
        payment_method: '99',
        sender_name: senderName.trim(),
        recipient_name: recipientName.trim(),
        message: message.trim() || "You're the light in the dark. You cheer me up when I'm down. Here are some drinks for you!",
        recipient_phone_number: recipientPhone.trim(),
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Small delay before showing result
      await new Promise(resolve => setTimeout(resolve, 300));

      if (data.success) {
        setStatus(`Gift card sent successfully! Ref ID: ${data.ref_id}`);
        setSuccessData(data);
        
        // Trigger balance refresh
        window.dispatchEvent(new Event('refreshBalance'));
      } else {
        setStatus(data.error || 'Failed to send gift card');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setStatus('ERROR: ' + err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleSendAnother = () => {
    setSuccessData(null);
    setStatus('');
    // Keep the form fields filled for convenience
  };

  return (
    <div className="form-container">
      {isLoading && (
        <CoffeeProgressBar 
          progress={progress} 
          message="Sending gift card..." 
        />
      )}
      {status && !successData && !isLoading && (
        <div className="full" style={{ marginBottom: '15px' }}>
          <div
            className="result-item"
            style={{
              background: status.includes('successfully') || status.includes('Ref ID')
                ? 'rgba(212, 175, 55, 0.15)'
                : 'rgba(26, 36, 86, 0.1)',
              borderLeft: `4px solid ${status.includes('successfully') || status.includes('Ref ID') ? 'var(--zus-gold)' : 'var(--zus-navy)'}`,
              padding: '12px',
            }}
          >
            {status.includes('successfully') || status.includes('Ref ID') ? (
              <span>
                <span className="status-ok">SUCCESS</span> {status}
              </span>
            ) : (
              <span className="status-err">{status}</span>
            )}
          </div>
        </div>
      )}

      {successData && (
        <div className="full" style={{ marginBottom: '15px' }}>
          <div
            className="result-item"
            style={{
              background: 'rgba(212, 175, 55, 0.15)',
              borderLeft: '4px solid var(--zus-gold)',
              padding: '16px',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <span className="status-ok">SUCCESS</span>
              <span style={{ color: 'var(--zus-navy)', fontWeight: 800, marginLeft: '8px' }}>
                ₱{successData.amount}
              </span>
              <span style={{ color: 'var(--zus-gold)', fontWeight: 700, marginLeft: '8px' }}>
                Ref: {successData.ref_id}
              </span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--zus-muted)', marginBottom: '12px' }}>
              <div>
                <strong style={{ color: 'var(--zus-navy)' }}>From:</strong>{' '}
                <strong>{successData.data?.sender_name || senderName}</strong>
              </div>
              <div>
                <strong style={{ color: 'var(--zus-navy)' }}>To:</strong>{' '}
                <strong>{successData.data?.recipient_name || recipientName}</strong>{' '}
                ({successData.data?.recipient_phone_number || recipientPhone})
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={handleSendAnother}
              >
                Send Another Gift
              </button>
              <button
                type="button"
                className="button"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="form-label">Sender Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., Juan Dela Cruz"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="form-label">Recipient Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., Maria Santos"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="form-label">Recipient Phone Number</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., 639123456789"
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="form-label">Amount (₱)</label>
        <input
          type="number"
          className="form-input"
          placeholder="e.g., 50.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          disabled={isLoading}
        />
      </div>

      <div className="full">
        <label className="form-label">Message</label>
        <textarea
          className="form-textarea"
          placeholder="Write a sweet gift card note..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="full" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button
          type="button"
          className="button button-secondary"
          onClick={handleGenerateAll}
          disabled={isLoading}
        >
          Generate Names & Message
        </button>
        <button
          type="button"
          className="button"
          onClick={sendGiftCard}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Gift Card'}
        </button>
      </div>
    </div>
  );
};

export default CustomSendForm;

