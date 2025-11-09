import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';

const UserMenu = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { logout } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    showSuccess('Logged out', 'You have been successfully logged out');
    navigate('/');
    setIsOpen(false);
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'student': return '/student/dashboard';
      case 'institute': return '/institute/dashboard';
      case 'company': return '/company/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  const getProfilePath = () => {
    switch (user?.role) {
      case 'student': return '/student/profile';
      case 'institute': return '/institute/profile';
      case 'company': return '/company/profile';
      default: return '/';
    }
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email[0].toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.institutionName) return user.institutionName;
    if (user?.companyName) return user.companyName;
    return user?.email || 'User';
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button 
        className="user-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="user-avatar">
          {getUserInitials()}
        </div>
        <span className="user-name">{getDisplayName()}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <div className="user-details">
              <strong>{getDisplayName()}</strong>
              <span className="user-role">{user?.role}</span>
              {user?.requiresApproval && (
                <span className="approval-status">Pending Approval</span>
              )}
            </div>
          </div>

          <div className="menu-divider"></div>

          <Link 
            to={getDashboardPath()} 
            className="menu-item"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>

          <Link 
            to={getProfilePath()} 
            className="menu-item"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>

          <div className="menu-divider"></div>

          <button 
            className="menu-item logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;