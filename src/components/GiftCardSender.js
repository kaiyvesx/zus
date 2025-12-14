import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { generateAll } from '../utils/generators';
import './GiftCardSender.css';

const GiftCardSender = ({ bearerToken, onBearerTokenChange, activeForm, setActiveForm }) => {
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActivatingBalance, setIsActivatingBalance] = useState(false);
  const [activateBalanceStatus, setActivateBalanceStatus] = useState('');
  const [attemptedTokens, setAttemptedTokens] = useState(new Set()); // Track tokens we've already tried
  const [balance, setBalance] = useState(null); // Current balance
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch balance function
  const fetchBalance = async () => {
    if (!bearerToken || bearerToken.length <= 20) {
      setBalance(null);
      return;
    }

    setIsLoadingBalance(true);
    try {
      const data = await api.getBalance(bearerToken);
      if (data.success) {
        setBalance({
          balance: parseFloat(data.balance || 0),
          promotional_balance: parseFloat(data.promotional_balance || 0),
          total: parseFloat(data.total_balance || 0),
        });
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch balance when bearer token changes (only once, no auto-refresh)
  useEffect(() => {
    if (bearerToken && bearerToken.length > 20) {
      fetchBalance();
      
      // Listen for balance refresh events (from redeem, send, etc.)
      const handleRefresh = () => fetchBalance();
      window.addEventListener('refreshBalance', handleRefresh);
      
      return () => {
        window.removeEventListener('refreshBalance', handleRefresh);
      };
    } else {
      setBalance(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bearerToken]);

  // Auto-activate balance when bearer token is detected
  useEffect(() => {
    // Only activate if:
    // 1. Token exists and is valid (length > 20)
    // 2. Token hasn't been attempted yet
    // 3. Not already activating
    if (bearerToken && bearerToken.length > 20 && !attemptedTokens.has(bearerToken) && !isActivatingBalance) {
      // Mark this token as attempted immediately to prevent duplicate attempts
      setAttemptedTokens(prev => new Set([...prev, bearerToken]));
      
      const activateWithDelay = async () => {
        // Add delay (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsActivatingBalance(true);
        setActivateBalanceStatus('Activating wallet balance...');
        
        try {
          const data = await api.activateBalance(bearerToken);
          if (data.success) {
            setActivateBalanceStatus('Balance activated successfully!');
            // Refresh balance after activation
            fetchBalance();
            
            // Clear status message after 3 seconds
            setTimeout(() => {
              setActivateBalanceStatus('');
            }, 3000);
          } else {
            // Better error handling - check for specific error messages
            const errorMsg = data.error || data.message || 'Failed to activate balance';
            let displayMsg = 'Failed to activate balance';
            
            // Check if balance is already activated
            if (errorMsg.toLowerCase().includes('already') || 
                errorMsg.toLowerCase().includes('activated') ||
                errorMsg.toLowerCase().includes('exist')) {
              displayMsg = 'Balance already activated';
            } else if (errorMsg.toLowerCase().includes('unauthorized') || 
                       errorMsg.toLowerCase().includes('invalid token')) {
              displayMsg = 'Invalid bearer token';
            } else {
              displayMsg = errorMsg.length > 50 ? 'Failed to activate balance' : errorMsg;
            }
            
            setActivateBalanceStatus(displayMsg);
            
            // Clear status message after 3 seconds
            setTimeout(() => {
              setActivateBalanceStatus('');
            }, 3000);
          }
        } catch (err) {
          // Handle network/API errors
          const errorMsg = err.message || 'Network error';
          let displayMsg = 'Failed to activate balance';
          
          if (errorMsg.toLowerCase().includes('network') || 
              errorMsg.toLowerCase().includes('fetch')) {
            displayMsg = 'Network error - check connection';
          } else {
            displayMsg = errorMsg.length > 50 ? 'Failed to activate balance' : errorMsg;
          }
          
          setActivateBalanceStatus(displayMsg);
          
          // Clear status message after 3 seconds
          setTimeout(() => {
            setActivateBalanceStatus('');
          }, 3000);
        } finally {
          setIsActivatingBalance(false);
        }
      };

      activateWithDelay();
    }

    // Reset if token is cleared
    if (!bearerToken || bearerToken.length <= 20) {
      setActivateBalanceStatus('');
      setIsActivatingBalance(false);
    }
  }, [bearerToken, attemptedTokens, isActivatingBalance]);

  const handleGenerateAll = () => {
    const generated = generateAll();
    if (generated.error) {
      alert(generated.error);
      return;
    }
    setSenderName(generated.senderName);
    setRecipientName(generated.recipientName);
    setMessage(generated.message);
  };


  const sendRequests = async () => {
    if (!recipientPhone.trim()) {
      alert('Please enter a recipient phone number');
      return;
    }

    setIsLoading(true);
    setResults([{ type: 'loading', message: 'Sending 100 requests in parallel (FAST like Python!)...' }]);

    try {
      const data = await api.batchSendGiftCards({
        bearer: bearerToken,
        senderName: senderName || 'Jenski Rende',
        recipientName: recipientName || 'James Carl',
        recipientPhone,
        message: message || 'You\'re the light in the dark. You cheer me up when I\'m down. Here are some drinks for you!',
        count: 100,
      });

      // Process results
      const sortedResults = data.sort((a, b) => (a.index || 0) - (b.index || 0));
      
      // Count successes and calculate total
      let successCount = 0;
      let totalAmount = 0.0;
      let shouldStop = false;

      sortedResults.forEach(item => {
        if (item.success) {
          successCount++;
          totalAmount += parseFloat(item.amount || 0);
        }
        if (item.stop) {
          shouldStop = true;
        }
      });

      // Filter to show only success and stopped message
      const filteredResults = sortedResults.filter(item => item.success);
      
      if (shouldStop) {
        filteredResults.push({ type: 'stopped', message: 'Stopped: Insufficient balance detected' });
      }

      setResults([
        { type: 'summary', successCount, totalAmount },
        ...filteredResults,
      ]);

      // Refresh balance after sending gift cards
      fetchBalance();
    } catch (err) {
      setResults([{ type: 'error', message: 'ERROR: ' + err.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const htmlEscape = (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  };

  return (
    <div>
      {/* All Buttons in One Clean Row */}
      <div className="full" style={{ 
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '2px solid rgba(26, 36, 86, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button 
            type="button" 
            className="button button-secondary button-small"
            onClick={() => setActiveForm(activeForm === 'login' ? null : 'login')}
          >
            Login
          </button>
          <button 
            type="button" 
            className="button button-secondary button-small"
            onClick={() => setActiveForm(activeForm === 'signup' ? null : 'signup')}
          >
            Sign Up
          </button>
          <button 
            type="button" 
            className="button button-secondary button-small"
            onClick={() => setActiveForm(activeForm === 'redeem' ? null : 'redeem')}
          >
            Redeem
          </button>
          <button 
            type="button" 
            className="button button-small"
            style={{ background: 'linear-gradient(135deg, var(--zus-navy) 0%, var(--zus-blue) 100%)' }}
            onClick={() => setActiveForm(activeForm === 'delete' ? null : 'delete')}
          >
            Delete
          </button>
          <button 
            type="button" 
            className="button button-secondary button-small"
            onClick={() => setActiveForm(activeForm === 'custom-send' ? null : 'custom-send')}
          >
            Custom Send
          </button>
        </div>
      </div>

      {/* Authorization Bearer */}
      <div className="full">
        <label className="form-label" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span>Authorization Bearer</span>
          {bearerToken && bearerToken.length > 20 && (
            <span style={{ 
              fontSize: '13px', 
              color: 'var(--zus-muted)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {isLoadingBalance ? (
                <>
                  <span className="spinner" style={{ width: '10px', height: '10px', borderWidth: '1.5px' }}></span>
                  <span>Loading...</span>
                </>
              ) : balance ? (
                <>
                  <span>Balance:</span>
                  <span style={{ color: 'var(--zus-navy)', fontWeight: 700 }}>₱{balance.total.toFixed(2)}</span>
                  <span style={{ color: 'var(--zus-muted)', fontSize: '11px' }}>
                    (R: ₱{balance.balance.toFixed(2)} | P: ₱{balance.promotional_balance.toFixed(2)})
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      fetchBalance();
                    }}
                    disabled={isLoadingBalance}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--zus-gold)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      color: 'var(--zus-gold)',
                      cursor: isLoadingBalance ? 'not-allowed' : 'pointer',
                      marginLeft: '4px'
                    }}
                  >
                    Refresh
                  </button>
                </>
              ) : null}
            </span>
          )}
          {(isActivatingBalance || activateBalanceStatus) && (
            <span style={{ 
              fontSize: '12px', 
              color: isActivatingBalance ? 'var(--zus-gold)' : (activateBalanceStatus.includes('successfully') ? 'var(--zus-gold)' : 'var(--zus-navy)'),
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {isActivatingBalance && (
                <span className="spinner" style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderWidth: '2px'
                }}></span>
              )}
              {activateBalanceStatus || (isActivatingBalance && 'Activating wallet balance...')}
            </span>
          )}
        </label>
        <input
          type="text"
          className="form-input"
          id="bearer"
          placeholder="Paste your Bearer token or use Get Bearer Token button above"
          value={bearerToken}
          onChange={(e) => {
            onBearerTokenChange(e.target.value);
            // Clear status when token changes
            if (e.target.value !== bearerToken) {
              setActivateBalanceStatus('');
              setIsActivatingBalance(false);
            }
          }}
        />
      </div>

      <div>
        <label className="form-label">Sender Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., Jenski Rende"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
        />
      </div>

      <div>
        <label className="form-label">Recipient Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., James Carl"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />
      </div>

      <div>
        <label className="form-label">Recipient Phone Number</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., 639308201445"
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
        />
      </div>

      <div className="full">
        <label className="form-label">Message</label>
        <textarea
          className="form-textarea"
          placeholder="Write a sweet gift card note or use generator..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Action Buttons Above Results */}
      <div className="full" style={{ 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <button 
          type="button" 
          className="button button-secondary"
          onClick={handleGenerateAll}
        >
          Generate Names & Message
        </button>
        <button 
          type="button" 
          className="button"
          id="sendBtn"
          onClick={sendRequests}
          disabled={isLoading}
          style={{ padding: '14px 32px', fontWeight: 900, fontSize: '16px' }}
        >
          {isLoading ? 'SENDING...' : 'START'}
        </button>
      </div>

      <div className="result-box">
        <div className="header-row">
          <strong>Live Results</strong>
          <div className="badge">Live</div>
        </div>
        <div id="resultsContainer">
          {results.length === 0 ? (
            <div className="result-item">No results yet — click Send to start.</div>
          ) : (
            results.map((result, index) => {
              if (result.type === 'loading') {
                return (
                  <div key={index} className="result-item">
                    <span className="spinner"></span> {result.message}
                  </div>
                );
              }
              if (result.type === 'summary') {
                return (
                  <div key={index} className="result-item" style={{ background: 'rgba(212, 175, 55, 0.15)', borderLeft: '4px solid var(--zus-gold)', padding: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--zus-gold)', fontSize: '16px' }}>Success Count: {result.successCount}</strong>
                    <strong style={{ color: 'var(--zus-navy)', fontSize: '16px' }}>Total Amount: ₱{result.totalAmount.toFixed(2)}</strong>
                  </div>
                );
              }
              if (result.type === 'stopped') {
                return (
                  <div key={index} className="result-item" style={{ background: 'rgba(26, 36, 86, 0.1)', borderLeft: '4px solid var(--zus-navy)', paddingLeft: '12px' }}>
                    <strong style={{ color: 'var(--zus-navy)' }}>{result.message}</strong>
                  </div>
                );
              }
              if (result.type === 'error') {
                return (
                  <div key={index} className="result-item">
                    <span className="status-err">{result.message}</span>
                  </div>
                );
              }
              if (result.success) {
                return (
                  <div key={index} className="result-item">
                    <span className="status-ok">SUCCESS</span> <span style={{ color: 'var(--zus-navy)', fontWeight: 800 }}>₱{result.amount}</span>
                    <span style={{ color: 'var(--zus-gold)', fontWeight: 700 }}> Ref: {result.ref_id}</span>
                    <br />
                    <small style={{ color: 'var(--zus-muted)' }}>
                      From: <strong>{htmlEscape(result.sender_name)}</strong> → To: <strong>{htmlEscape(result.recipient_name)}</strong> ({htmlEscape(result.recipient_phone)})
                    </small>
                  </div>
                );
              }
              return null;
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftCardSender;

