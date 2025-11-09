// src/pages/admin/AdminDashboard.jsx - WITHOUT NOTIFICATIONS
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading admin dashboard data...');
      // For now, use mock data
      setStats({
        totalUsers: 150,
        pendingApprovals: 5,
        totalCourses: 45,
        totalJobs: 23,
      });
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      // Simple console error instead of notification
      console.error('Error loading dashboard data');
      
      // Fallback to mock data
      setStats({
        totalUsers: 150,
        pendingApprovals: 5,
        totalCourses: 45,
        totalJobs: 23,
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      label: 'Manage Users',
      path: '/admin/users',
      color: '#3b82f6',
      icon: '👥'
    },
    {
      label: 'Institute Approvals',
      path: '/admin/institute-approvals', 
      color: '#10b981',
      icon: '🏫'
    },
    {
      label: 'Company Approvals',
      path: '/admin/company-approvals',
      color: '#f59e0b',
      icon: '💼'
    },
    {
      label: 'System Reports',
      path: '/admin/reports',
      color: '#8b5cf6',
      icon: '📊'
    }
  ];

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div className="header-content">
          <h1 className="page-title">⚙️ Admin Dashboard</h1>
          <p className="welcome-message">
            Welcome back, {user?.name || user?.email}!
          </p>
        </div>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <h3 className="stat-number">{stats?.totalUsers || 0}</h3>
          <p className="stat-label">Total Users</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <h3 className="stat-number">{stats?.pendingApprovals || 0}</h3>
          <p className="stat-label">Pending Approvals</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <h3 className="stat-number">{stats?.totalCourses || 0}</h3>
          <p className="stat-label">Total Courses</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💼</div>
          <h3 className="stat-number">{stats?.totalJobs || 0}</h3>
          <p className="stat-label">Active Jobs</p>
        </div>
      </div>

      <div className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <button 
              key={index}
              onClick={() => navigate(action.path)}
              className="quick-action-btn"
              style={{ backgroundColor: action.color }}
            >
              <span className="action-icon">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="debug-info">
        <strong>Debug Info:</strong>
        <div>Email: {user?.email}</div>
        <div>Role: {user?.role}</div>
        <div>ID: {user?.id}</div>
        <div>Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</div>
        <div>✅ Admin Dashboard Loaded Successfully</div>
      </div>
    </div>
  );
};

export default AdminDashboard;