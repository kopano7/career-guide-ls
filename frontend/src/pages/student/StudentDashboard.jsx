import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  
  console.log('StudentDashboard: User data:', user);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Student Dashboard</h1>
          <p>Welcome back, {user?.name || user?.email}!</p>
        </div>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* ... your stats cards ... */}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          {/* Browse Courses */}
          <Link to="/student/courses" className="action-link">
            <div className="action-card">
              <div className="action-icon">🎓</div>
              <h4>Browse Courses</h4>
              <p>Find courses to apply</p>
            </div>
          </Link>

          {/* Find Jobs */}
          <Link to="/student/jobs" className="action-link">
            <div className="action-card">
              <div className="action-icon"></div>
              <h4>Find Jobs</h4>
              <p>Explore job opportunities</p>
            </div>
          </Link>

          {/* Upload Transcript */}
          <Link to="/student/profile" className="action-link">
            <div className="action-card">
              <div className="action-icon"></div>
              <h4>Upload Transcript</h4>
              <p>Submit your documents</p>
            </div>
          </Link>

          {/* My Profile */}
          <Link to="/student/profile" className="action-link">
            <div className="action-card">
              <div className="action-icon">👤</div>
              <h4>My Profile</h4>
              <p>Update your information</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {/* ... your activity items ... */}
        </div>
      </div>

      {/* User Info Debug */}
      <div className="debug-info">
        <strong>Debug Info:</strong>
        <div>Email: {user?.email}</div>
        <div>Role: {user?.role}</div>
        <div>ID: {user?.id}</div>
        <div>Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</div>
      </div>
    </div>
  );
};

export default StudentDashboard;