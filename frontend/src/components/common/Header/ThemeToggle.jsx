// src/components/common/Header/ThemeToggle.jsx
import React, { useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  // Apply dark class to body
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button 
      onClick={toggleTheme} 
      className="theme-toggle-btn"
      style={{
        background: 'transparent',
        border: 'none',
        fontSize: '1.2rem',
        cursor: 'pointer',
        margin: '10px'
      }}
      aria-label="Toggle Theme"
    >
      {isDark ? <FaSun color="#FFD700" /> : <FaMoon color="#333" />}
    </button>
  );
};
