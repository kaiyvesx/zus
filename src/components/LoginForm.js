import React, { useState } from 'react';
import api from '../services/api';
import { formatPhoneInput, getFullPhoneNumber } from '../utils/phoneFormatter';
import CoffeeProgressBar from './CoffeeProgressBar';
import './FormStyles.css';

const LoginForm = ({ bearerToken, onBearerTokenChange, onClose }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [otpStatus, setOtpStatus] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const requestOTP = async () => {
    if (!phone.trim()) {
      setOtpStatus('Please enter phone number');
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber(phone);
    if (!fullPhoneNumber || fullPhoneNumber.length !== 12) {
      setOtpStatus('Please enter a valid 10-digit phone number (e.g., 9308201445)');
      return;
    }

    setOtpStatus('Sending OTP code...');

    try {
      const data = await api.requestOTP(fullPhoneNumber);
      if (data.success) {
        setOtpStatus('OTP code sent! Check your SMS.');
        setStep(2);
      } else {
        setOtpStatus(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setOtpStatus('Error: ' + err.message);
    }
  };

  const getBearerToken = async () => {
    if (!phone || !otp) {
      setLoginStatus('Please enter phone and OTP code');
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber(phone);
    if (!fullPhoneNumber || fullPhoneNumber.length !== 12) {
      setLoginStatus('Please enter a valid 10-digit phone number (e.g., 9308201445)');
      return;
    }

    setIsLoading(true);
    setLoginStatus('');
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
      const data = await api.getBearerToken(fullPhoneNumber, otp);
      
      clearInterval(progressInterval);
      setProgress(100);

      // Small delay before showing result
      await new Promise(resolve => setTimeout(resolve, 300));

      if (data.success && data.bearer_token) {
        onBearerTokenChange(data.bearer_token);
        setLoginStatus('Token retrieved successfully!');
        setTimeout(() => {
          onClose();
          setStep(1);
          setPhone('');
          setOtp('');
          setOtpStatus('');
          setLoginStatus('');
        }, 2000);
      } else {
        setLoginStatus(data.error || 'Login failed');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setLoginStatus('Error: ' + err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  return (
    <div>
      {step === 1 && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label className="form-label">Phone Number <small style={{ color: 'var(--zus-muted)', fontWeight: 'normal' }}>(10 digits only)</small></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., 9308201445 (63 will be added automatically)"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              maxLength={10}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="button" className="button button-small" onClick={requestOTP}>
              Request OTP Code
            </button>
            <small style={{ color: 'var(--zus-muted)' }}>{otpStatus}</small>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--zus-gold)' }}>
          {isLoading && (
            <CoffeeProgressBar 
              progress={progress} 
              message="Logging in & Getting Token..." 
            />
          )}
          <div style={{ marginBottom: '12px' }}>
            <label className="form-label">Verification Code (OTP)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter 6-digit code from SMS"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              disabled={isLoading}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              type="button" 
              className="button button-small" 
              onClick={getBearerToken}
              disabled={isLoading}
            >
              Login & Get Token
            </button>
            {!isLoading && <small style={{ color: 'var(--zus-muted)' }}>{loginStatus}</small>}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;

