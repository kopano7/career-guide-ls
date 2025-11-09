// src/components/admin/Users/UserList.jsx
import React from 'react';

const UserList = ({ users, filters, onStatusUpdate, onDeleteUser }) => {
  const filteredUsers = users.filter(user => {
    if (filters.role !== 'all' && user.role !== filters.role) return false;
    if (filters.status !== 'all' && user.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!user.name.toLowerCase().includes(searchLower) && 
          !user.email.toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'student': return '#3b82f6';
      case 'institute': return '#10b981';
      case 'company': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'suspended': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="user-list">
      <div className="list-header">
        <h3>Users ({filteredUsers.length})</h3>
      </div>

      <div className="users-container">
        {filteredUsers.length > 0 ? (
          <div className="users-grid">
            {filteredUsers.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <div className="user-avatar">
                    {user.name?.charAt(0) || user.email?.charAt(0)}
                  </div>
                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p className="user-email">{user.email}</p>
                  </div>
                </div>

                <div className="user-details">
                  <div className="detail-item">
                    <span className="label">Role:</span>
                    <span 
                      className="role-badge"
                      style={{ backgroundColor: getRoleColor(user.role) }}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(user.status) }}
                    >
                      {user.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Verified:</span>
                    <span className={`verification ${user.emailVerified ? 'verified' : 'not-verified'}`}>
                      {user.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Registered:</span>
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="user-actions">
                  {user.status === 'active' ? (
                    <button 
                      className="btn-warning"
                      onClick={() => onStatusUpdate(user.id, 'suspended')}
                    >
                      Suspend
                    </button>
                  ) : user.status === 'suspended' ? (
                    <button 
                      className="btn-success"
                      onClick={() => onStatusUpdate(user.id, 'active')}
                    >
                      Activate
                    </button>
                  ) : user.status === 'pending' ? (
                    <button 
                      className="btn-success"
                      onClick={() => onStatusUpdate(user.id, 'active')}
                    >
                      Approve
                    </button>
                  ) : null}
                  
                  <button 
                    className="btn-danger"
                    onClick={() => onDeleteUser(user.id)}
                    disabled={user.role === 'admin'}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No users found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;