import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <div className="header">
      <div className="header-inner">
        <img 
          className="logo" 
          src="https://zuscoffee.ph/wp-content/uploads/2022/03/zus_logo.png" 
          alt="ZUS Coffee" 
        />
        <div className="brand">ZUS COFFEE</div>
      </div>
    </div>
  );
};

export default Header;

