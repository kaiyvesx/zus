import React, { useState, createContext, useContext } from 'react';
import ZusAlert from './ZusAlert';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = (message, title = 'ZUS Coffee', type = 'alert') => {
    return new Promise((resolve) => {
      setAlert({
        isOpen: true,
        title,
        message,
        type,
        onConfirm: () => {
          setAlert(null);
          resolve(true);
        },
        onCancel: () => {
          setAlert(null);
          resolve(false);
        },
      });
    });
  };

  const showConfirm = (message, title = 'ZUS Coffee') => {
    return showAlert(message, title, 'confirm');
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {alert && (
        <ZusAlert
          isOpen={alert.isOpen}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          onConfirm={alert.onConfirm}
          onCancel={alert.onCancel}
        />
      )}
    </AlertContext.Provider>
  );
};

