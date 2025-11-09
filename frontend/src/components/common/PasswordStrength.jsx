import React from 'react';
import './PasswordStrength.css';

const PasswordStrength = ({ password }) => {
  const calculateStrength = (password) => {
    let strength = 0;
    let feedback = [];

    if (password.length >= 8) strength += 1;
    else feedback.push('At least 8 characters');

    if (/[a-z]/.test(password)) strength += 1;
    else feedback.push('One lowercase letter');

    if (/[A-Z]/.test(password)) strength += 1;
    else feedback.push('One uppercase letter');

    if (/[0-9]/.test(password)) strength += 1;
    else feedback.push('One number');

    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    else feedback.push('One special character');

    return { strength, feedback };
  };

  const { strength, feedback } = calculateStrength(password);

  const getStrengthClass = () => {
    if (password.length === 0) return '';
    if (strength <= 2) return 'strength-weak';
    if (strength <= 3) return 'strength-medium';
    return 'strength-strong';
  };

  const getStrengthText = () => {
    if (password.length === 0) return 'Enter a password';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="password-strength">
      <div className="strength-bar">
        <div className={`strength-fill ${getStrengthClass()}`}></div>
      </div>
      <div className="strength-text">
        {getStrengthText()}
        {feedback.length > 0 && password.length > 0 && (
          <div className="strength-feedback">
            Requirements: {feedback.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordStrength;