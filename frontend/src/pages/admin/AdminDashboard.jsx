// src/pages/admin/AdminDashboard.jsx - FINAL VERSION
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
  const [backendStatus, setBackendStatus] = useState('checking');
  const [apiBaseUrl] = useState('https://career-guide-ls.onrender.com');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    console.log(' Loading dashboard data from:', apiBaseUrl);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Test backend connection first
      console.log('Testing backend connection...');
      const healthResponse = await fetch(`${apiBaseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!healthResponse.ok) {
        throw new Error('Backend health check failed');
      }

      setBackendStatus('connected');
      console.log(' Backend connected, loading admin stats...');

      // Load real admin stats
      const statsResponse = await fetch(`${apiBaseUrl}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Stats response status:', statsResponse.status);

      if (!statsResponse.ok) {
        // If /stats endpoint doesn't exist, try to get data from individual endpoints
        console.log('Stats endpoint not available, trying alternative approach...');
        await loadDataFromMultipleEndpoints(token);
        return;
      }

      const data = await statsResponse.json();
      console.log('Stats data received:', data);

      if (data.success) {
        // Handle different response formats
        const statsData = data.data?.stats || data.data || data;
        setStats(statsData);
        console.log(' Real admin stats loaded successfully');
      } else {
        throw new Error(data.message || 'Invalid response from server');
      }

    } catch (error) {
      console.error(' Failed to load real data:', error);
      setBackendStatus('disconnected');
      
      // Fallback to demo data
      setStats({
        totalUsers: 187,
        pendingApprovals: 12,
        totalCourses: 56,
        totalJobs: 34,
        totalApplications: 243,
        students: 145,
        institutes: 28,
        companies: 14
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDataFromMultipleEndpoints = async (token) => {
    try {
      console.log(' Loading data from multiple endpoints...');
      
      const endpoints = [
        { key: 'users', url: '/api/admin/users' },
        { key: 'pendingInstitutes', url: '/api/admin/institutes/pending' },
        { key: 'pendingCompanies', url: '/api/admin/companies/pending' },
        { key: 'courses', url: '/api/public/courses' },
        { key: 'jobs', url: '/api/public/jobs' },
      ];

      const collectedData = {
        totalUsers: 0,
        pendingApprovals: 0,
        totalCourses: 0,
        totalJobs: 0,
        totalApplications: 0,
        students: 0,
        institutes: 0,
        companies: 0
      };

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${apiBaseUrl}${endpoint.url}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            switch (endpoint.key) {
              case 'users':
                if (data.data?.users) {
                  collectedData.totalUsers = data.data.users.length;
                  // Count by role
                  collectedData.students = data.data.users.filter(u => u.role === 'student').length;
                  collectedData.institutes = data.data.users.filter(u => u.role === 'institute').length;
                  collectedData.companies = data.data.users.filter(u => u.role === 'company').length;
                }
                break;
              case 'pendingInstitutes':
                if (data.data?.institutes) {
                  collectedData.pendingApprovals += data.data.institutes.length;
                }
                break;
              case 'pendingCompanies':
                if (data.data?.companies) {
                  collectedData.pendingApprovals += data.data.companies.length;
                }
                break;
              case 'courses':
                if (data.data?.courses) {
                  collectedData.totalCourses = data.data.courses.length;
                }
                break;
              case 'jobs':
                if (data.data?.jobs) {
                  collectedData.totalJobs = data.data.jobs.length;
                }
                break;
            }
          }
        } catch (endpointError) {
          console.warn(`Failed to load ${endpoint.key}:`, endpointError.message);
        }
      }

      setStats(collectedData);
      console.log(' Data loaded from multiple endpoints');

    } catch (error) {
      console.error('Failed to load from multiple endpoints:', error);
      throw error;
    }
  };

  const quickActions = [
    {
      label: 'Manage Users',
      path: '/admin/users',
      color: '#3b82f6',
      
      count: stats?.totalUsers,
      description: 'View and manage all users'
    },
    {
      label: 'Institute Approvals',
      path: '/admin/institute-approvals', 
      color: '#10b981',
      
      count: stats?.pendingApprovals,
      description: 'Review pending institute applications'
    },
    {
      label: 'Company Approvals',
      path: '/admin/company-approvals',
      color: '#f59e0b',
      
      count: stats?.pendingApprovals,
      description: 'Review pending company registrations'
    },
    {
      label: 'View Courses',
      path: '/admin/courses',
      color: '#ef4444',
      
      count: stats?.totalCourses,
      description: 'Browse all available courses'
    },
    {
      label: 'View Jobs',
      path: '/admin/jobs',
      color: '#8b5cf6',
      
      count: stats?.totalJobs,
      description: 'Browse all job postings'
    },
    {
      label: 'System Settings',
      path: '/admin/settings',
      color: '#6b7280',
      
      description: 'Platform configuration'
    }
  ];

  const handleQuickAction = (path) => {
    navigate(path);
  };

  const refreshData = () => {
    setLoading(true);
    loadDashboardData();
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/health`);
      alert(`Backend Status: ${response.ok ? ' Connected' : ' Error'}\nURL: ${apiBaseUrl}`);
    } catch (error) {
      alert(` Backend Connection Failed:\n${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <LoadingSpinner />
        <p>Loading Admin Dashboard...</p>
        <div className="loading-details">
          <div>Connecting to: {apiBaseUrl}</div>
          <div>Status: {backendStatus}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-dashboard-header">
        <div className="header-content">
          <h1 className="page-title">
             Admin Dashboard
            <span className={`status-badge ${backendStatus}`}>
              {backendStatus === 'connected' ? 'LIVE' : 'DEMO'}
            </span>
          </h1>
          <p className="welcome-message">
            Welcome back, <strong>{user?.name || user?.email}</strong>!
          </p>
        </div>
        <div className="header-actions">
          <button className="test-btn" onClick={testBackendConnection}>
             Test Connection
          </button>
          <button className="refresh-btn" onClick={refreshData}>
             Refresh
          </button>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {backendStatus === 'connected' ? (
        <div className="success-banner">
          <span>Connected to backend server</span>
          <small>Displaying real data from Firebase</small>
        </div>
      ) : (
        <div className="warning-banner">
          <span> Using demo data</span>
          <small>Backend connection failed - showing sample statistics</small>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-section">
        <h2 className="section-title">
          System Overview
          {backendStatus === 'connected' && <span className="live-indicator">● LIVE DATA</span>}
        </h2>
        <div className="stats-grid">
          <div className="stat-card">
            
            <div className="stat-content">
              <h3 className="stat-number">{stats?.totalUsers || 0}</h3>
              <p className="stat-label">Total Users</p>
              <div className="stat-breakdown">
                <span className="breakdown-item">
                  <span className="dot student"></span>
                  Students: {stats?.students || 0}
                </span>
                <span className="breakdown-item">
                  <span className="dot institute"></span>
                  Institutes: {stats?.institutes || 0}
                </span>
                <span className="breakdown-item">
                  <span className="dot company"></span>
                  Companies: {stats?.companies || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="stat-card highlight">
            
            <div className="stat-content">
              <h3 className="stat-number">{stats?.pendingApprovals || 0}</h3>
              <p className="stat-label">Pending Approvals</p>
              <div className="stat-subtext">
                Institutes & Companies awaiting review
              </div>
            </div>
          </div>

          <div className="stat-card">
          
            <div className="stat-content">
              <h3 className="stat-number">{stats?.totalCourses || 0}</h3>
              <p className="stat-label">Total Courses</p>
              <div className="stat-subtext">
                Active courses across all institutions
              </div>
            </div>
          </div>

          <div className="stat-card">
            
            <div className="stat-content">
              <h3 className="stat-number">{stats?.totalApplications || 0}</h3>
              <p className="stat-label">Applications</p>
              <div className="stat-subtext">
                Course applications submitted
              </div>
            </div>
          </div>

          <div className="stat-card">
          
            <div className="stat-content">
              <h3 className="stat-number">{stats?.totalJobs || 0}</h3>
              <p className="stat-label">Active Jobs</p>
              <div className="stat-subtext">
                Job postings by companies
              </div>
            </div>
          </div>

          <div className="stat-card">
            
            <div className="stat-content">
              <h3 className="stat-number">24</h3>
              <p className="stat-label">Active Today</p>
              <div className="stat-subtext">
                Users currently online
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <button 
              key={index}
              onClick={() => handleQuickAction(action.path)}
              className="quick-action-btn"
              style={{ borderLeftColor: action.color }}
            >
              <div className="action-header">
                <span className="action-icon">{action.icon}</span>
                {action.count !== undefined && action.count > 0 && (
                  <span className="action-count">{action.count}</span>
                )}
              </div>
              <div className="action-content">
                <span className="action-label">{action.label}</span>
                <span className="action-description">{action.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* System Information */}
      <div className="system-info">
        <h3>System Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Backend Status:</span>
            <span className={`info-value ${backendStatus}`}>
              {backendStatus === 'connected' ? ' Connected' : ' Disconnected'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Server URL:</span>
            <span className="info-value">{apiBaseUrl}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Data Source:</span>
            <span className="info-value">
              {backendStatus === 'connected' ? 'Firebase Database' : 'Demo Data'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Updated:</span>
            <span className="info-value">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
