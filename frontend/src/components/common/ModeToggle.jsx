// src/components/common/ModeToggle.jsx
import React, { useEffect, useState } from 'react';

const ModeToggle = () => {
  const [isLightMode, setIsLightMode] = useState(() => {
    // Check localStorage first
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    // Save preference
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  const toggleMode = () => setIsLightMode(prev => !prev);

  return (
    <button className="mode-toggle-btn" onClick={toggleMode}>
      {isLightMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
    </button>
  );
};

export default ModeToggle;
