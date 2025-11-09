// src/components/admin/Users/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import UserList from './UserList';

const UserManagement = () => {
  const { get, put, delete: deleteApi } = useApi();
  const { addNotification } = useNotifications();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await get('/admin/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification('Error loading users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      const response = await put(`/admin/users/${userId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        addNotification('User status updated successfully!', 'success');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      addNotification(
        error.response?.data?.message || 'Error updating user status', 
        'error'
      );
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await deleteApi(`/admin/users/${userId}`);
      if (response.data.success) {
        addNotification('User deleted successfully!', 'success');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      addNotification(
        error.response?.data?.message || 'Error deleting user', 
        'error'
      );
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-management">
      <div className="management-header">
        <h1>User Management</h1>
        <p>Manage all platform users and their accounts</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-grid">
          <div className="filter-group">
            <label>Role</label>
            <select 
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="institute">Institute</option>
              <option value="company">Company</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Users List */}
      <UserList
        users={users}
        filters={filters}
        onStatusUpdate={handleStatusUpdate}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
};

export default UserManagement;