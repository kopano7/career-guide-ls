// src/pages/admin/UserManagement.jsx - FULL DEBUG VERSION
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

  // Test API connection directly
  const testApiConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('=== 🔍 API CONNECTION DEBUG START ===');
      console.log('🔐 Token:', token ? 'Present' : 'Missing');
      console.log('🔐 Token preview:', token?.substring(0, 50) + '...');
      
      // Test the API endpoint directly
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🌐 Direct API test - Status:', response.status);
      console.log('🌐 Direct API test - OK:', response.ok);
      console.log('🌐 Direct API test - Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Direct API test - Success:', data);
      } else {
        const errorText = await response.text();
        console.log('❌ Direct API test - Error status:', response.status);
        console.log('❌ Direct API test - Error response:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          console.log('❌ Direct API test - Error JSON:', errorJson);
        } catch (e) {
          console.log('❌ Direct API test - Error text (not JSON):', errorText);
        }
      }
      console.log('=== 🔍 API CONNECTION DEBUG END ===');
    } catch (error) {
      console.error('💥 Direct API test failed:', error);
      console.error('💥 Error details:', error.message);
    }
  };

  useEffect(() => {
    console.log('🔄 UserManagement component mounted');
    testApiConnection(); // Test connection on component mount
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      console.log('=== 🔍 FETCH USERS DEBUG START ===');
      console.log('🔄 Fetching users with filter:', filter);
      
      const data = await adminAPI.getUsers(filter !== 'all' ? filter : undefined);
      
      console.log('📨 API Response received:', data);
      console.log('👥 Users data type:', typeof data?.users);
      console.log('👥 Users data:', data?.users);
      console.log('👥 Users array length:', data?.users?.length);
      
      // ✅ FIX: Ensure users is always an array, even if data.users is undefined
      const usersData = data?.users || [];
      console.log('✅ Final users array length:', usersData.length);
      
      setUsers(usersData);
      console.log('=== 🔍 FETCH USERS DEBUG END ===');
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      console.error('❌ Error stack:', error.stack);
      addNotification('Error loading users', 'error');
      // ✅ FIX: Set empty array on error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, action) => {
    try {
      console.log(`🔄 Handling status change: ${action} for user ${userId}`);
      
      if (action === 'approve') {
        await adminAPI.approveUser(userId);
        addNotification('User approved successfully', 'success');
      } else if (action === 'suspend') {
        await adminAPI.suspendUser(userId);
        addNotification('User suspended successfully', 'success');
      }
      
      // Refresh the list after status change
      console.log('🔄 Refreshing user list after status change...');
      fetchUsers();
    } catch (error) {
      console.error('❌ Error updating user status:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      addNotification('Error updating user status', 'error');
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setLoading(true);
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <LoadingSpinner />
        <p>Loading users...</p>
      </div>
    );
  }

  // ✅ FIX: Ensure users is always defined before using .length
  const usersToDisplay = users || [];
  const filteredUsers = usersToDisplay.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

  console.log('🎯 Rendering users:', {
    totalUsers: usersToDisplay.length,
    filteredUsers: filteredUsers.length,
    filter: filter
  });

  return (
    <div className="user-management">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">👥 User Management</h1>
          <p className="page-description">
            Manage all platform users and their status
          </p>
          <div className="debug-stats" style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
            Showing {filteredUsers.length} of {usersToDisplay.length} users
          </div>
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
          
          {/* ✅ ADD DEBUG BUTTONS */}
          <div style={{ display: 'flex', gap: '10px', marginLeft: '10px' }}>
            <button 
              onClick={handleRefresh}
              style={{ 
                padding: '8px 12px', 
                background: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🔄 Refresh
            </button>
            <button 
              onClick={testApiConnection}
              style={{ 
                padding: '8px 12px', 
                background: '#8b5cf6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🐛 Debug API
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info Panel */}
      <div style={{ 
        background: '#f3f4f6', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #e5e7eb'
      }}>
        <strong>🔧 Debug Information:</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
          <div>Total Users: <strong>{usersToDisplay.length}</strong></div>
          <div>Filtered Users: <strong>{filteredUsers.length}</strong></div>
          <div>Current Filter: <strong>{filter}</strong></div>
          <div>Loading: <strong>{loading ? 'Yes' : 'No'}</strong></div>
        </div>
      </div>

      <div className="users-list">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <div className="user-main">
                  <h4 className="user-name">{user.name || 'Unknown User'}</h4>
                  <p className="user-email">{user.email}</p>
                  <div className="user-meta">
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                    <span className={`status-badge status-${user.status}`}>
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
                  <div className="detail-item">
                    <strong>User ID:</strong>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{user.id}</span>
                  </div>
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
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No users found</p>
            <p className="empty-description">
              {filter !== 'all' 
                ? `No ${filter} users match your criteria`
                : 'No users registered yet'
              }
            </p>
            <button 
              onClick={testApiConnection}
              style={{ 
                marginTop: '10px', 
                padding: '8px 16px', 
                background: '#6b7280', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Test API Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;