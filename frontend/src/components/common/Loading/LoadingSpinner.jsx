import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  type = 'spinner', // 'spinner', 'dots', 'skeleton', 'progress'
  size = 'medium', // 'small', 'medium', 'large'
  text = 'Loading...',
  inline = false,
  progress = 0, // For progress type only
  fullScreen = false,
  overlay = false
}) => {
  const containerClass = `loading-container ${inline ? 'loading-inline' : ''} ${fullScreen ? 'loading-fullscreen' : ''} ${overlay ? 'loading-overlay' : ''}`;
  
  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return (
          <div className={`dots-loader dots-${size}`}>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
      
      case 'skeleton':
        return (
          <div className={`skeleton-loader skeleton-${size}`}>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
        );
      
      case 'progress':
        return (
          <div className={`progress-loader progress-${size}`}>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        );
      
      default: // spinner
        return (
          <div className={`spinner-loader spinner-${size}`}>
            <div className="spinner-circle">
              <div className="spinner-inner"></div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={containerClass}>
      <div className="loading-content">
        {renderLoader()}
        {text && <p className="loading-text">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;