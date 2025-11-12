// src/pages/admin/SystemReports.jsx
import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import useNotifications from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';

const SystemReports = () => {
  const { get } = useApi();
  const { addNotification } = useNotifications();
  
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days'); // 7days, 30days, 90days, 1year

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

  const exportReport = (format) => {
    // Implementation for exporting reports
    addNotification(`Exporting report as ${format.toUpperCase()}...`, 'info');
    // Actual export logic would go here
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">System Reports</h1>
          <p className="page-description">
            Platform analytics and performance metrics
          </p>
        </div>
        <div className="header-actions">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="filter-select"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
          <button 
            className="btn-primary"
            onClick={() => exportReport('pdf')}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Key Metrics */}
        <div className="stats-grid">
          <div className="stat-card">
            
            <div className="stat-content">
              <div className="stat-number">{reports?.userGrowth || 0}</div>
              <div className="stat-label">New Users ({dateRange})</div>
            </div>
          </div>

          <div className="stat-card">
            
            <div className="stat-content">
              <div className="stat-number">{reports?.courseApplications || 0}</div>
              <div className="stat-label">Course Applications</div>
            </div>
          </div>

          <div className="stat-card">
            
            <div className="stat-content">
              <div className="stat-number">{reports?.jobApplications || 0}</div>
              <div className="stat-label">Job Applications</div>
            </div>
          </div>

          <div className="stat-card">
            
            <div className="stat-content">
              <div className="stat-number">{reports?.approvalRate || 0}%</div>
              <div className="stat-label">Approval Rate</div>
            </div>
          </div>
        </div>

        {/* Platform Usage Statistics */}
        <div className="content-grid">
          <div className="content-card">
            <div className="card-header">
              <h3>Platform Usage</h3>
            </div>
            <div className="card-content">
              <div className="usage-stats">
                <div className="usage-item">
                  <div className="usage-label">Active Students</div>
                  <div className="usage-value">{reports?.activeStudents || 0}</div>
                </div>
                <div className="usage-item">
                  <div className="usage-label">Active Institutions</div>
                  <div className="usage-value">{reports?.activeInstitutions || 0}</div>
                </div>
                <div className="usage-item">
                  <div className="usage-label">Active Companies</div>
                  <div className="usage-value">{reports?.activeCompanies || 0}</div>
                </div>
                <div className="usage-item">
                  <div className="usage-label">Total Courses</div>
                  <div className="usage-value">{reports?.totalCourses || 0}</div>
                </div>
                <div className="usage-item">
                  <div className="usage-label">Active Jobs</div>
                  <div className="usage-value">{reports?.activeJobs || 0}</div>
                </div>
                <div className="usage-item">
                  <div className="usage-label">System Uptime</div>
                  <div className="usage-value">{reports?.systemUptime || '99.9%'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Application Statistics */}
          <div className="content-card">
            <div className="card-header">
              <h3>Application Statistics</h3>
            </div>
            <div className="card-content">
              <div className="application-stats">
                <div className="stat-item">
                  <div className="stat-label">Total Course Applications</div>
                  <div className="stat-number">{reports?.totalCourseApplications || 0}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Total Job Applications</div>
                  <div className="stat-number">{reports?.totalJobApplications || 0}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Average Match Score</div>
                  <div className="stat-number">{reports?.averageMatchScore || 0}%</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Admission Rate</div>
                  <div className="stat-number">{reports?.admissionRate || 0}%</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Hiring Rate</div>
                  <div className="stat-number">{reports?.hiringRate || 0}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent System Activity */}
        <div className="content-card">
          <div className="card-header">
            <h3>System Performance</h3>
          </div>
          <div className="card-content">
            <div className="performance-metrics">
              <div className="metric">
                <div className="metric-label">API Response Time</div>
                <div className="metric-value">{reports?.apiResponseTime || '120ms'}</div>
              </div>
              <div className="metric">
                <div className="metric-label">Database Performance</div>
                <div className="metric-value">{reports?.databasePerformance || 'Excellent'}</div>
              </div>
              <div className="metric">
                <div className="metric-label">Error Rate</div>
                <div className="metric-value">{reports?.errorRate || '0.2%'}</div>
              </div>
              <div className="metric">
                <div className="metric-label">Active Sessions</div>
                <div className="metric-value">{reports?.activeSessions || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="content-card">
          <div className="card-header">
            <h3>Export Reports</h3>
          </div>
          <div className="card-content">
            <div className="export-options">
              <button 
                className="btn-outline"
                onClick={() => exportReport('csv')}
              >
                Export as CSV
              </button>
              <button 
                className="btn-outline"
                onClick={() => exportReport('excel')}
              >
                Export as Excel
              </button>
              <button 
                className="btn-outline"
                onClick={() => exportReport('json')}
              >
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemReports;