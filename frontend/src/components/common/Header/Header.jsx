import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Navigation from './Navigation';
import UserMenu from './UserMenu';
import './Header.css';

const Header = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <Link to="/" className="logo-link">
            <h1>CareerGuide LS</h1>
            <span>Lesotho Career Platform</span>
          </Link>
        </div>

        {/* Navigation */}
        <Navigation />

        {/* User Menu / Auth Buttons */}
        <div className="header-actions">
          {isAuthenticated ? (
            <UserMenu user={user} />
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;