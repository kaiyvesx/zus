import React from 'react';
import './ZusAlert.css';

const ZusAlert = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', type = 'confirm' }) => {
  if (!isOpen) return null;

  return (
    <div className="zus-alert-overlay" onClick={onCancel}>
      <div className="zus-alert-modal" onClick={(e) => e.stopPropagation()}>
        <div className="zus-alert-header">
          <div className="zus-alert-title">{title || 'ZUS Coffee'}</div>
        </div>
        <div className="zus-alert-body">
          <div className="zus-alert-message">{message}</div>
        </div>
        <div className="zus-alert-footer">
          {type === 'confirm' && (
            <button
              type="button"
              className="zus-alert-button zus-alert-button-cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className="zus-alert-button zus-alert-button-confirm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZusAlert;

