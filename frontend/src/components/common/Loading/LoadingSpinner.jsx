import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...', inline = false }) => {
  const spinnerClass = `spinner spinner-${size}`;
  const containerClass = inline ? 'loading-inline' : 'loading-container';

  return (
    <div className={containerClass}>
      <div className={spinnerClass}>
        <div className="spinner-circle"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;