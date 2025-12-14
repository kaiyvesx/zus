import React, { useState } from 'react';
import api from '../services/api';
import { useAlert } from './AlertProvider';
import './FormStyles.css';

const DeleteAccountForm = ({ bearerToken, onBearerTokenChange, onClose }) => {
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('');
  const { showConfirm } = useAlert();

  const deleteAccount = async () => {
    if (!bearerToken) {
      setStatus('Please enter Bearer token first');
      return;
    }

    const firstConfirm = await showConfirm(
      'WARNING: This will permanently delete your account!\n\nAre you sure you want to proceed?',
      'Delete Account'
    );
    
    if (!firstConfirm) {
      return;
    }

    const secondConfirm = await showConfirm(
      'FINAL WARNING: This action cannot be undone!\n\nClick OK to confirm account deletion.',
      'Final Confirmation'
    );
    
    if (!secondConfirm) {
      return;
    }

    setStatus('Deleting account...');

    try {
      const data = await api.deleteAccount(bearerToken, reason);
      if (data.success) {
        setStatus('Account deleted successfully!');
        onBearerTokenChange('');
        setTimeout(() => {
          onClose();
          setReason('');
          setStatus('');
        }, 3000);
      } else {
        setStatus(data.error || 'Failed to delete account');
      }
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <label className="form-label">Reason (Optional)</label>
        <input
          type="text"
          className="form-input"
          placeholder="Enter reason for account deletion (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          type="button"
          className="button button-small"
          onClick={deleteAccount}
          style={{ background: 'linear-gradient(135deg, var(--zus-navy) 0%, var(--zus-blue) 100%)' }}
        >
          Confirm Delete Account
        </button>
        <small style={{ color: 'var(--zus-navy)' }}>{status}</small>
      </div>
    </div>
  );
};

export default DeleteAccountForm;

