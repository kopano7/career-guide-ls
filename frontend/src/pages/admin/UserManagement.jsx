// src/pages/admin/UserManagement.jsx - UPDATED FOR REAL BACKEND
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api/admin';
import useNotifications from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import './UserManagement.css';

const UserManagement = () => {
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [apiBaseUrl] = useState('https://career-guide-ls.onrender.com');

  // Test API connection directly
  const testApiConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('===  API CONNECTION DEBUG START ===');
      console.log(' Token:', token ? 'Present' : 'Missing');
      console.log(' Backend URL:', apiBaseUrl);
      
      // Test the API endpoint directly
      const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(' Direct API test - Status:', response.status);
      console.log(' Direct API test - OK:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log(' Direct API test - Success:', data);
        setBackendStatus('connected');
        return true;
      } else {
        const errorText = await response.text();
        console.log('❌ Direct API test - Error status:', response.status);
        console.log('❌ Direct API test - Error response:', errorText);
        setBackendStatus('error');
        return false;
      }
    } catch (error) {
      console.error(' Direct API test failed:', error);
      console.error(' Error details:', error.message);
      setBackendStatus('disconnected');
      return false;
    }
  };

  const fetchUsersDirect = async () => {
    try {
      console.log(' Fetching users directly from backend...');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(' Raw API response:', data);

      // Handle different response formats
      let usersData = [];
      if (data.success && data.data) {
        usersData = data.data.users || data.data || [];
      } else if (Array.isArray(data)) {
        usersData = data;
      } else if (data.users) {
        usersData = data.users;
      }

      console.log('✅ Processed users data:', usersData);
      setUsers(usersData);
      setBackendStatus('connected');
      
    } catch (error) {
      console.error('❌ Error fetching users directly:', error);
      setBackendStatus('disconnected');
      addNotification('Failed to load users from backend', 'error');
      setUsers([]);
    }
  };

  useEffect(() => {
    console.log('🔄 UserManagement component mounted');
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    setLoading(true);
    
    try {
      // First test the connection
      const connectionOk = await testApiConnection();
      
      if (connectionOk) {
        // Try using the API service first
        console.log('🔄 Trying to fetch users via adminAPI service...');
        try {
          const data = await adminAPI.getUsers(filter !== 'all' ? filter : undefined);
          console.log(' adminAPI response:', data);
          
          const usersData = data?.users || data?.data?.users || data?.data || [];
          setUsers(usersData);
          setBackendStatus('connected');
        } catch (apiError) {
          console.warn('❌ adminAPI failed, trying direct fetch...', apiError);
          // Fallback to direct fetch
          await fetchUsersDirect();
        }
      } else {
        // Backend not available, use demo data
        console.log('⚠️ Backend not available, using demo data');
        setBackendStatus('disconnected');
        setUsers(generateDemoUsers());
        addNotification('Using demo data - Backend not connected', 'warning');
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setBackendStatus('error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate realistic demo data
  const generateDemoUsers = () => {
    return [
      {
        id: 'demo-1',
        name: 'John Student',
        email: 'john.student@example.com',
        role: 'student',
        status: 'approved',
        createdAt: new Date('2024-01-15').toISOString(),
        lastLoginAt: new Date().toISOString()
      },
      {
        id: 'demo-2',
        name: 'Global University',
        email: 'admin@globaluniversity.edu',
        role: 'institute',
        status: 'approved',
        createdAt: new Date('2024-01-10').toISOString(),
        lastLoginAt: new Date().toISOString()
      },
      {
        id: 'demo-3',
        name: 'Tech Solutions Inc',
        email: 'hr@techsolutions.com',
        role: 'company',
        status: 'approved',
        createdAt: new Date('2024-01-20').toISOString(),
        lastLoginAt: new Date().toISOString()
      },
      {
        id: 'demo-4',
        name: 'New College',
        email: 'admin@newcollege.edu',
        role: 'institute',
        status: 'pending',
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      },
      {
        id: 'demo-5',
        name: 'Startup Ventures',
        email: 'info@startupventures.com',
        role: 'company',
        status: 'pending',
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      },
      {
        id: 'demo-6',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        role: 'student',
        status: 'suspended',
        createdAt: new Date('2024-01-05').toISOString(),
        lastLoginAt: new Date('2024-01-25').toISOString()
      }
    ];
  };

  const handleStatusChange = async (userId, action) => {
    try {
      console.log(`🔄 Handling status change: ${action} for user ${userId}`);
      
      const token = localStorage.getItem('token');
      
      if (action === 'approve') {
        // Direct API call for approval
        const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/approve`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Approval failed: ${response.status}`);
        }

        addNotification('User approved successfully', 'success');
      } else if (action === 'suspend') {
        // Direct API call for suspension
        const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/suspend`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Suspension failed: ${response.status}`);
        }

        addNotification('User suspended successfully', 'success');
      }
      
      // Refresh the list after status change
      console.log('🔄 Refreshing user list after status change...');
      loadUsers();
    } catch (error) {
      console.error('❌ Error updating user status:', error);
      addNotification('Error updating user status', 'error');
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setLoading(true);
    loadUsers();
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'student': return '#3b82f6';
      case 'institute': return '#8b5cf6';
      case 'company': return '#f59e0b';
      case 'admin': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <LoadingSpinner />
        <p>Loading users...</p>
        <div className="loading-details">
          <div>Backend: {apiBaseUrl}</div>
          <div>Status: {backendStatus}</div>
        </div>
      </div>
    );
  }

  const usersToDisplay = users || [];
  const filteredUsers = usersToDisplay.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'pending') return user.status === 'pending';
    return user.role === filter;
  });

  return (
    <div className="user-management">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">👥 User Management</h1>
          <p className="page-description">
            Manage all platform users and their status
            <span className={`backend-status ${backendStatus}`}>
              • {backendStatus === 'connected' ? 'LIVE DATA' : 'DEMO DATA'}
            </span>
          </p>
        </div>
        <div className="header-actions">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="student">Students</option>
            <option value="institute">Institutes</option>
            <option value="company">Companies</option>
            <option value="pending">Pending Approval</option>
          </select>
          
          <div className="action-buttons">
            <button 
              onClick={handleRefresh}
              className="btn-refresh"
            >
             Refresh
            </button>
            <button 
              onClick={testApiConnection}
              className="btn-debug"
            >
              Debug API
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status Banner */}
      {backendStatus !== 'connected' && (
        <div className="connection-banner warning">
          <div className="banner-content">
            <span className="banner-icon">⚠️</span>
            <div className="banner-text">
              <strong>Backend Connection Issue</strong>
              <p>Displaying demo data. Real user data will appear when backend is connected.</p>
            </div>
          </div>
          <button onClick={handleRefresh} className="banner-action">
            Retry Connection
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-number">{usersToDisplay.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{usersToDisplay.filter(u => u.status === 'pending').length}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{usersToDisplay.filter(u => u.role === 'student').length}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{usersToDisplay.filter(u => u.role === 'institute').length}</div>
          <div className="stat-label">Institutes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{usersToDisplay.filter(u => u.role === 'company').length}</div>
          <div className="stat-label">Companies</div>
        </div>
      </div>

      <div className="users-list">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-avatar">
                <div 
                  className="avatar-placeholder"
                  style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              
              <div className="user-info">
                <div className="user-main">
                  <h4 className="user-name">{user.name || 'Unknown User'}</h4>
                  <p className="user-email">{user.email}</p>
                  <div className="user-meta">
                    <span 
                      className="role-badge"
                      style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                    >
                      {user.role}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusBadgeColor(user.status) }}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>
                
                <div className="user-details">
                  <div className="detail-item">
                    <strong>Registered:</strong>
                    <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Last Login:</strong>
                    <span>
                      {user.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  {user.id && (
                    <div className="detail-item">
                      <strong>ID:</strong>
                      <span className="user-id">{user.id.substring(0, 8)}...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="user-actions">
                {user.status === 'pending' && (
                  <div className="action-buttons">
                    <button 
                      className="btn-success"
                      onClick={() => handleStatusChange(user.id, 'approve')}
                    >
                      Approve
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={() => handleStatusChange(user.id, 'suspend')}
                    >
                      Reject
                    </button>
                  </div>
                )}
                
                {user.status === 'approved' && (
                  <button 
                    className="btn-warning"
                    onClick={() => handleStatusChange(user.id, 'suspend')}
                  >
                    Suspend
                  </button>
                )}
                
                {user.status === 'suspended' && (
                  <button 
                    className="btn-success"
                    onClick={() => handleStatusChange(user.id, 'approve')}
                  >
                    Activate
                  </button>
                )}

                {user.role === 'admin' && (
                  <span className="admin-badge">Administrator</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>No users found</p>
            <p className="empty-description">
              {filter !== 'all' 
                ? `No ${filter} users match your criteria`
                : 'No users registered in the system'
              }
            </p>
            <button 
              onClick={handleRefresh}
              className="btn-retry"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="system-info">
        <h4>System Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Backend Status:</span>
            <span className={`info-value ${backendStatus}`}>
              {backendStatus === 'connected' ? '✅ Connected' : '❌ Disconnected'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Server URL:</span>
            <span className="info-value">{apiBaseUrl}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Users:</span>
            <span className="info-value">{usersToDisplay.length}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Data Source:</span>
            <span className="info-value">
              {backendStatus === 'connected' ? 'Firebase Database' : 'Demo Data'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;