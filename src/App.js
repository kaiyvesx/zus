import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import GiftCardSender from './components/GiftCardSender';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import RedeemForm from './components/RedeemForm';
import DeleteAccountForm from './components/DeleteAccountForm';
import CustomSendForm from './components/CustomSendForm';
import Modal from './components/Modal';
import { AlertProvider } from './components/AlertProvider';

function App() {
  const [bearerToken, setBearerToken] = useState('');
  const [activeForm, setActiveForm] = useState(null);

  useEffect(() => {
    // Load bearer token from localStorage if available
    const savedToken = localStorage.getItem('zus_bearer_token');
    if (savedToken) {
      setBearerToken(savedToken);
    }
  }, []);

  const handleBearerTokenChange = (token) => {
    setBearerToken(token);
    if (token) {
      localStorage.setItem('zus_bearer_token', token);
    } else {
      localStorage.removeItem('zus_bearer_token');
    }
  };

  const closeAllForms = () => {
    setActiveForm(null);
  };

  return (
    <AlertProvider>
      <div className="App">
        <Header />
        <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img 
            src="https://zuscoffee.ph/wp-content/uploads/2022/03/zus_logo.png" 
            alt="ZUS Coffee" 
            style={{ width: '80px', height: '80px', objectFit: 'contain' }}
          />
        </div>
        <h1>ZUS COFFEE</h1>
        <div className="sub">
          a Necessity, not a <span style={{ color: 'var(--zus-blue)' }}>Luxury</span>
        </div>

        <GiftCardSender
          bearerToken={bearerToken}
          onBearerTokenChange={handleBearerTokenChange}
          activeForm={activeForm}
          setActiveForm={setActiveForm}
        />

        <Modal
          isOpen={activeForm === 'login'}
          onClose={closeAllForms}
          title="Login to Get Bearer Token"
        >
          <LoginForm
            bearerToken={bearerToken}
            onBearerTokenChange={handleBearerTokenChange}
            onClose={closeAllForms}
          />
        </Modal>

        <Modal
          isOpen={activeForm === 'signup'}
          onClose={closeAllForms}
          title="Sign Up New Account"
        >
          <SignupForm
            bearerToken={bearerToken}
            onBearerTokenChange={handleBearerTokenChange}
            onClose={closeAllForms}
          />
        </Modal>

        <Modal
          isOpen={activeForm === 'redeem'}
          onClose={closeAllForms}
          title="Redeem Gift Card"
        >
          <RedeemForm
            bearerToken={bearerToken}
            onClose={closeAllForms}
          />
        </Modal>

        <Modal
          isOpen={activeForm === 'delete'}
          onClose={closeAllForms}
          title="Delete Account"
        >
          <DeleteAccountForm
            bearerToken={bearerToken}
            onBearerTokenChange={handleBearerTokenChange}
            onClose={closeAllForms}
          />
        </Modal>

        <Modal
          isOpen={activeForm === 'custom-send'}
          onClose={closeAllForms}
          title="Send Custom Gift Card"
        >
          <CustomSendForm
            bearerToken={bearerToken}
            onClose={closeAllForms}
          />
        </Modal>
        </div>
      </div>
    </AlertProvider>
  );
}

export default App;

