import React from 'react';
import './CoffeeProgressBar.css';

const CoffeeProgressBar = ({ progress = 0, message = 'Loading...' }) => {
  return (
    <div className="coffee-progress-overlay">
      <div className="coffee-progress-modal">
        <div className="coffee-cup">
          <div className="coffee-cup-body">
            <div className="coffee-cup-logo">Z</div>
            <div 
              className="coffee-liquid" 
              style={{ height: `${progress}%` }}
            >
              <div className="coffee-foam"></div>
            </div>
          </div>
          <div className="coffee-cup-handle"></div>
        </div>
        <div className="coffee-progress-text">
          <div className="coffee-progress-message">{message}</div>
          <div className="coffee-progress-percent">{Math.round(progress)}%</div>
        </div>
        <div className="coffee-progress-bar">
          <div 
            className="coffee-progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default CoffeeProgressBar;

