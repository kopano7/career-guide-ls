// src/components/admin/Reports/SystemReports.jsx
import React, { useState, useEffect } from 'react';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';

const SystemReports = () => {
  const { get } = useApi();
  const { addNotification } = useNotifications();
  
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    fetchSystemReports();
  }, [dateRange]);

  const fetchSystemReports = async () => {
    try {
      const response = await get('/admin/reports', {
        params: { period: dateRange }
      });
      if (response.data.success) {
        setReports(response.data.reports);
      }
    } catch (error) {
      console.error('Error fetching system reports:', error);
      addNotification('Error loading system reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="system-reports">
      <div className="reports-header">
        <h1>System Reports</h1>
        <p>Platform analytics and performance metrics</p>
        <div className="header-actions">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
          <button className="btn-primary">Export PDF</button>
        </div>
      </div>

      <div className="reports-content">
        {/* Key Metrics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-number">{reports?.userGrowth || 0}</div>
              <div className="stat-label">New Users</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-number">{reports?.courseApplications || 0}</div>
              <div className="stat-label">Course Applications</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-content">
              <div className="stat-number">{reports?.jobApplications || 0}</div>
              <div className="stat-label">Job Applications</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{reports?.approvalRate || 0}%</div>
              <div className="stat-label">Approval Rate</div>
            </div>
          </div>
        </div>

        <div className="content-grid">
          {/* Platform Usage */}
          <div className="content-card">
            <h3>Platform Usage</h3>
            <div className="usage-stats">
              <div className="usage-item">
                <span className="label">Active Students:</span>
                <span className="value">{reports?.activeStudents || 0}</span>
              </div>
              <div className="usage-item">
                <span className="label">Active Institutions:</span>
                <span className="value">{reports?.activeInstitutions || 0}</span>
              </div>
              <div className="usage-item">
                <span className="label">Active Companies:</span>
                <span className="value">{reports?.activeCompanies || 0}</span>
              </div>
              <div className="usage-item">
                <span className="label">Total Courses:</span>
                <span className="value">{reports?.totalCourses || 0}</span>
              </div>
              <div className="usage-item">
                <span className="label">Active Jobs:</span>
                <span className="value">{reports?.activeJobs || 0}</span>
              </div>
            </div>
          </div>

          {/* Application Statistics */}
          <div className="content-card">
            <h3>Application Statistics</h3>
            <div className="app-stats">
              <div className="stat-item">
                <span className="label">Total Course Applications:</span>
                <span className="value">{reports?.totalCourseApplications || 0}</span>
              </div>
              <div className="stat-item">
                <span className="label">Total Job Applications:</span>
                <span className="value">{reports?.totalJobApplications || 0}</span>
              </div>
              <div className="stat-item">
                <span className="label">Average Match Score:</span>
                <span className="value">{reports?.averageMatchScore || 0}%</span>
              </div>
              <div className="stat-item">
                <span className="label">Admission Rate:</span>
                <span className="value">{reports?.admissionRate || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="content-card">
          <h3>Export Reports</h3>
          <div className="export-options">
            <button className="btn-outline">Export as CSV</button>
            <button className="btn-outline">Export as Excel</button>
            <button className="btn-outline">Export as JSON</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemReports;