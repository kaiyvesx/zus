import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getRandomFirstName, getRandomLastName, generateEmail, generateDOB, areNamesLoaded } from '../utils/generators';
import { formatPhoneInput, getFullPhoneNumber } from '../utils/phoneFormatter';
import CoffeeProgressBar from './CoffeeProgressBar';
import './FormStyles.css';

const SignupForm = ({ bearerToken, onBearerTokenChange, onClose }) => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [dobPrivate, setDobPrivate] = useState(true);
  const [otpStatus, setOtpStatus] = useState('');
  const [verifyStatus, setVerifyStatus] = useState('');
  const [registerStatus, setRegisterStatus] = useState('');
  const [signupBearerToken, setSignupBearerToken] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Set max date for DOB (18+ only)
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const maxDateString = maxDate.toISOString().split('T')[0];
    const dobInput = document.getElementById('signupDOB');
    if (dobInput) {
      dobInput.setAttribute('max', maxDateString);
    }
  }, []);

  const generateSignupData = () => {
    if (!areNamesLoaded()) {
      alert('Names library still loading...');
      return;
    }

    setFirstName(getRandomFirstName());
    setLastName(getRandomLastName());
    setEmail(generateEmail());
    setDob(generateDOB());
  };

  const requestSignupOTP = async () => {
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
      const data = await api.requestOTP(fullPhoneNumber, bearerToken);
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

  const verifySignupOTP = async () => {
    if (!phone || !otp) {
      setVerifyStatus('Please enter phone and OTP code');
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber(phone);
    if (!fullPhoneNumber || fullPhoneNumber.length !== 12) {
      setVerifyStatus('Please enter a valid 10-digit phone number (e.g., 9308201445)');
      return;
    }

    setVerifyStatus('Verifying OTP...');

    try {
      const data = await api.getBearerToken(fullPhoneNumber, otp);
      if (data.success && (data.bearer_token || data.new_user)) {
        if (data.bearer_token) {
          setSignupBearerToken(data.bearer_token);
        } else {
          setSignupBearerToken(null);
        }
        setVerifyStatus('OTP verified! Please complete registration.');
        setStep(3);
      } else {
        setVerifyStatus(data.error || 'OTP verification failed');
      }
    } catch (err) {
      setVerifyStatus('Error: ' + err.message);
    }
  };

  const registerAccount = async () => {
    if (!firstName || !lastName || !email || !dob || !phone) {
      setRegisterStatus('Please fill all required fields');
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber(phone);
    if (!fullPhoneNumber || fullPhoneNumber.length !== 12) {
      setRegisterStatus('Please enter a valid 10-digit phone number (e.g., 9308201445)');
      return;
    }

    setIsRegistering(true);
    setRegisterStatus('');
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
      const data = await api.registerAccount({
        bearer: signupBearerToken || '',
        firstName,
        lastName,
        email,
        dob,
        phone: fullPhoneNumber,
        dobPrivate,
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Small delay before showing result
      await new Promise(resolve => setTimeout(resolve, 300));

      if (data.success) {
        const finalToken = data.bearer_token || signupBearerToken || '';
        onBearerTokenChange(finalToken);
        setRegisterStatus('Account registered successfully!');
        setTimeout(() => {
          onClose();
          setStep(1);
          setPhone('');
          setOtp('');
          setFirstName('');
          setLastName('');
          setEmail('');
          setDob('');
          setDobPrivate(true);
          setOtpStatus('');
          setVerifyStatus('');
          setRegisterStatus('');
          setSignupBearerToken(null);
        }, 2000);
      } else {
        setRegisterStatus(data.error || 'Registration failed');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setRegisterStatus('Error: ' + err.message);
    } finally {
      setIsRegistering(false);
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
            <button type="button" className="button button-small" onClick={requestSignupOTP}>
              Request OTP Code
            </button>
            <small style={{ color: 'var(--zus-muted)' }}>{otpStatus}</small>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--zus-gold)' }}>
          <div style={{ marginBottom: '12px' }}>
            <label className="form-label">Verification Code (OTP)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter 6-digit code from SMS"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="button" className="button button-small" onClick={verifySignupOTP}>
              Verify OTP
            </button>
            <small style={{ color: 'var(--zus-muted)' }}>{verifyStatus}</small>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--zus-gold)' }}>
          {isRegistering && (
            <CoffeeProgressBar 
              progress={progress} 
              message="Completing Registration..." 
            />
          )}
          <div style={{ marginBottom: '16px' }}>
            <button type="button" className="button button-small" onClick={generateSignupData} style={{ background: 'linear-gradient(135deg, var(--zus-navy) 0%, var(--zus-blue) 100%)' }}>
              Generate All Fields
            </button>
            <small style={{ display: 'block', marginTop: '6px', color: 'var(--zus-muted)', fontSize: '12px' }}>
              Auto-generates first name, last name, email, and date of birth (18+ only)
            </small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="form-input"
                style={{ background: 'white', border: '2px solid var(--zus-gold)' }}
                placeholder="e.g., Jaema"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                className="form-input"
                style={{ background: 'white', border: '2px solid var(--zus-gold)' }}
                placeholder="e.g., Rondieq"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              style={{ background: 'white', border: '2px solid var(--zus-gold)' }}
              placeholder="e.g., demsldk@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label className="form-label">Date of Birth * <small style={{ color: 'var(--zus-muted)', fontWeight: 'normal' }}>(18+ only)</small></label>
              <input
                type="date"
                id="signupDOB"
                className="form-input"
                style={{ background: 'white', border: '2px solid var(--zus-gold)' }}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--zus-navy)' }}>
                <input
                  type="checkbox"
                  checked={dobPrivate}
                  onChange={(e) => setDobPrivate(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--zus-gold)' }}
                />
                <span>Keep DOB private</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={registerAccount}
              disabled={isRegistering}
              style={{ padding: '12px 24px', fontSize: '14px' }}
            >
              Complete Registration
            </button>
            {!isRegistering && <small style={{ color: 'var(--zus-muted)' }}>{registerStatus}</small>}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupForm;

