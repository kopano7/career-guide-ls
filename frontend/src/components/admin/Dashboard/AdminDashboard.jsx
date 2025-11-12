// src/components/admin/Dashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import useApi  from '../../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import './Admindashbord.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { get } = useApi();
  const { addNotification } = useNotifications();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await get('/admin/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addNotification('Error loading dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.displayName || 'Administrator'}</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.totalUsers || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.totalInstitutes || 0}</div>
            <div className="stat-label">Institutions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.totalCompanies || 0}</div>
            <div className="stat-label">Companies</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.totalCourses || 0}</div>
            <div className="stat-label">Courses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.pendingApprovals || 0}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.reportedIssues || 0}</div>
            <div className="stat-label">Reported Issues</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-row">
          {/* Pending Approvals */}
          <div className="content-card">
            <h3>Pending Approvals</h3>
            <div className="approvals-list">
              {dashboardData?.pendingApprovalsList?.length > 0 ? (
                dashboardData.pendingApprovalsList.map(approval => (
                  <div key={approval.id} className="approval-item">
                    <div className="approval-info">
                      <strong>{approval.name}</strong>
                      <span>{approval.type} • {approval.email}</span>
                    </div>
                    <span className="approval-date">
                      {new Date(approval.requestedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p>No pending approvals</p>
              )}
            </div>
            <button className="btn-outline full-width">
              View All Approvals
            </button>
          </div>

          {/* Quick Actions */}
          <div className="content-card">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <button className="action-btn">
                <span className="action-icon">👥</span>
                <span>Manage Users</span>
              </button>
              <button className="action-btn">
                <span className="action-icon"></span>
                <span>Institute Approvals</span>
              </button>
              <button className="action-btn">
                <span className="action-icon"></span>
                <span>Company Approvals</span>
              </button>
              <button className="action-btn">
                <span className="action-icon"></span>
                <span>View Reports</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="content-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {dashboardData?.recentActivity?.length > 0 ? (
              dashboardData.recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-content">
                    <p>{activity.description}</p>
                    <span className="activity-time">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p>No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
