import React, { useState } from 'react';
import api from '../services/api';
import CoffeeProgressBar from './CoffeeProgressBar';
import './FormStyles.css';

const RedeemForm = ({ bearerToken, onClose }) => {
  const [codes, setCodes] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isRedeemingAll, setIsRedeemingAll] = useState(false);
  const [progress, setProgress] = useState(0);

  const redeemGiftCard = async () => {
    if (!bearerToken) {
      setStatus('Please enter Bearer token first');
      return;
    }

    if (!codes.trim()) {
      setStatus('Please enter at least one gift card code');
      return;
    }

    const codeList = codes.split(/[,\n\r]+/).map(c => c.trim()).filter(c => c.length > 0);

    if (codeList.length === 0) {
      setStatus('No valid gift card codes found');
      return;
    }

    setStatus(`Redeeming ${codeList.length} gift card(s)...`);
    setShowResults(false);
    setResults([]);

    try {
      if (codeList.length === 1) {
        const data = await api.redeemGiftCard(bearerToken, codeList[0]);
        if (data.success) {
          setStatus(`Redeemed successfully! Amount: ₱${data.amount}, New Balance: ₱${data.new_promotional_balance}`);
          setResults([{ success: true, code: codeList[0], ...data }]);
          setShowResults(true);
          
          // Trigger balance refresh
          window.dispatchEvent(new Event('refreshBalance'));
        } else {
          setStatus(data.error || 'Failed to redeem gift card');
        }
      } else {
        const codesString = codeList.join('\n');
        const allResults = await api.batchRedeemGiftCards(bearerToken, codesString);
        const sortedResults = allResults.sort((a, b) => (a.index || 0) - (b.index || 0));
        
        let successCount = 0;
        let totalAmount = 0;
        let lastBalance = '0';

        sortedResults.forEach(data => {
          if (data.success) {
            successCount++;
            totalAmount += parseFloat(data.amount || 0);
            lastBalance = data.new_promotional_balance || '0';
          }
        });

        setStatus(`Redeemed ${successCount}/${sortedResults.length} gift card(s). Total: ₱${totalAmount.toFixed(2)}, Final Balance: ₱${lastBalance}`);
        setResults(sortedResults);
        setShowResults(true);
        
        // Trigger balance refresh
        window.dispatchEvent(new Event('refreshBalance'));
      }
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  const redeemAllGiftCards = async () => {
    if (!bearerToken) {
      setStatus('Please enter Bearer token first');
      return;
    }

    setIsRedeemingAll(true);
    setStatus('');
    setShowResults(false);
    setResults([]);
    setProgress(0);

    // Simulate progress with delay
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 5;
      });
    }, 300);

    try {
      // Fetch all pages
      let allGiftCards = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const fetchData = await api.getIncomingGiftCards(bearerToken, currentPage);
        if (!fetchData.success) {
          throw new Error(fetchData.error || 'Failed to fetch gift cards');
        }

        if (fetchData.gift_cards && Array.isArray(fetchData.gift_cards)) {
          allGiftCards = allGiftCards.concat(fetchData.gift_cards);
        }

        lastPage = fetchData.last_page || 1;
        currentPage++;
      } while (currentPage <= lastPage);

      if (allGiftCards.length === 0) {
        clearInterval(progressInterval);
        setProgress(0);
        setStatus('No incoming gift cards found');
        return;
      }

      const redemptionCodes = allGiftCards
        .map(gc => gc.redemption_code)
        .filter(code => code && code.length > 0);

      if (redemptionCodes.length === 0) {
        clearInterval(progressInterval);
        setProgress(0);
        setStatus('No valid redemption codes found');
        return;
      }

      setCodes(redemptionCodes.join('\n'));

      // Redeem all
      const codesString = redemptionCodes.join('\n');
      const allResults = await api.batchRedeemGiftCards(bearerToken, codesString);
      const sortedResults = allResults.sort((a, b) => (a.index || 0) - (b.index || 0));

      clearInterval(progressInterval);
      setProgress(100);

      // Small delay before showing result
      await new Promise(resolve => setTimeout(resolve, 300));

      let successCount = 0;
      let totalAmount = 0;
      let lastBalance = '0';

      sortedResults.forEach(data => {
        if (data.success) {
          successCount++;
          totalAmount += parseFloat(data.amount || 0);
          lastBalance = data.new_promotional_balance || '0';
        }
      });

      setStatus(`Redeemed ${successCount}/${sortedResults.length} gift card(s). Total: ₱${totalAmount.toFixed(2)}, Final Balance: ₱${lastBalance}`);
      setResults(sortedResults);
      setShowResults(true);
      
      // Trigger balance refresh
      window.dispatchEvent(new Event('refreshBalance'));
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setStatus('Error: ' + err.message);
    } finally {
      setIsRedeemingAll(false);
      setTimeout(() => setProgress(0), 500);
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
      {isRedeemingAll && (
        <CoffeeProgressBar 
          progress={progress} 
          message="Redeeming All Gift Cards..." 
        />
      )}
      <div style={{ marginBottom: '12px' }}>
        <label className="form-label">Gift Card Code(s)</label>
        <textarea
          className="form-textarea"
          style={{ minHeight: '100px' }}
          placeholder="Enter gift card code(s) - one per line or comma-separated"
          value={codes}
          onChange={(e) => setCodes(e.target.value)}
        />
        <small className="small-text" style={{ display: 'block', marginTop: '6px' }}>
          You can enter multiple codes - one per line or separated by commas
        </small>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          type="button" 
          className="button button-secondary button-small" 
          onClick={redeemGiftCard}
          disabled={isRedeemingAll}
        >
          Redeem Gift Card(s)
        </button>
        <button 
          type="button" 
          className="button button-small" 
          onClick={redeemAllGiftCards} 
          disabled={isRedeemingAll}
          style={{ background: 'linear-gradient(135deg, var(--zus-navy) 0%, var(--zus-blue) 100%)' }}
        >
          Redeem All Gift Cards
        </button>
        {!isRedeemingAll && <small style={{ color: 'var(--zus-muted)' }}>{status}</small>}
      </div>

      {showResults && results.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--zus-blue)', maxHeight: '300px', overflowY: 'auto' }}>
          {results.map((result, index) => {
            if (result.success) {
              return (
                <div key={index} style={{ background: 'rgba(39, 56, 128, 0.1)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--zus-blue)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--zus-navy)', marginBottom: '4px' }}>Code: {htmlEscape(result.code)}</div>
                  <div style={{ color: 'var(--zus-blue)', fontWeight: 600 }}>Amount: ₱{result.amount}</div>
                  <div style={{ color: 'var(--zus-navy)', fontSize: '12px' }}>Balance: ₱{result.new_promotional_balance}</div>
                </div>
              );
            } else {
              return (
                <div key={index} style={{ background: 'rgba(26, 36, 86, 0.1)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--zus-navy)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--zus-navy)', marginBottom: '4px' }}>Code: {htmlEscape(result.code)}</div>
                  <div style={{ color: 'var(--zus-navy)' }}>Error: {htmlEscape(result.error || 'Failed')}</div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};

export default RedeemForm;

