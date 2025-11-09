import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const LoginForm = ({ onSuccess }) => {
  const { login } = useAuth();
  
  return (
    <div>
      <h2>Login Form Component</h2>
      {/* Basic login form implementation */}
    </div>
  );
};

export default LoginForm;