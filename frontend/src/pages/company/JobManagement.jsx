import React, { useState, useEffect } from 'react';
import { companyAPI } from '../../services/api/company';
import useNotifications from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import JobForm from '../../components/company/Jobs/JobForm';
import './JobManagement.css';

const JobManagement = () => {
  const { addNotification } = useNotifications();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching company jobs...');
      
      const response = await companyAPI.getJobs();
      console.log('📦 Jobs API response:', response);
      
      if (response.success) {
        // Handle the response data structure from your backend
        const jobsData = response.data?.jobs || response.jobs || [];
        console.log(`📋 Found ${jobsData.length} jobs:`, jobsData);
        
        const processedJobs = jobsData.map(job => {
          // Handle Firestore timestamp conversion safely
          const processDate = (dateField) => {
            if (!dateField) return null;
            if (typeof dateField.toDate === 'function') {
              return dateField.toDate();
            }
            if (dateField.seconds) {
              return new Date(dateField.seconds * 1000);
            }
            return new Date(dateField);
          };

          return {
            ...job,
            postedAt: processDate(job.postedAt),
            deadline: processDate(job.deadline),
            updatedAt: processDate(job.updatedAt),
            // Ensure applicationCount is a number
            applicationCount: job.applicationCount || 0,
            // Ensure arrays exist
            requirements: job.requirements || [],
            qualifications: job.qualifications || [],
            // Ensure status exists
            status: job.status || 'active'
          };
        });
        
        setJobs(processedJobs);
        console.log('✅ Jobs processed and set:', processedJobs);
      } else {
        console.warn('⚠️ API response indicates failure:', response);
        setJobs([]); // Set empty array on failure
      }
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      addNotification(
        error.response?.data?.message || error.message || 'Error loading jobs', 
        'error'
      );
      setJobs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (jobData) => {
    try {
      setActionLoading('creating');
      console.log('📤 Creating new job:', jobData);
      
      const response = await companyAPI.postJob(jobData);
      console.log('✅ Job creation response:', response);
      
      if (response.success) {
        addNotification('Job posted successfully! Qualified students will be notified.', 'success');
        setShowForm(false);
        await fetchJobs(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to create job');
      }
    } catch (error) {
      console.error('❌ Error creating job:', error);
      addNotification(
        error.response?.data?.message || error.message || 'Error creating job', 
        'error'
      );
      throw error; // Re-throw to let form handle it
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateJob = async (jobId, jobData) => {
    try {
      setActionLoading(jobId);
      console.log('📝 Updating job:', jobId, jobData);
      
      const response = await companyAPI.updateJob(jobId, jobData);
      console.log('✅ Job update response:', response);
      
      if (response.success) {
        addNotification('Job updated successfully!', 'success');
        setEditingJob(null);
        await fetchJobs(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to update job');
      }
    } catch (error) {
      console.error('❌ Error updating job:', error);
      addNotification(
        error.response?.data?.message || error.message || 'Error updating job', 
        'error'
      );
      throw error; // Re-throw to let form handle it
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to close this job? New applicants will not be able to apply.')) return;

    try {
      setActionLoading(`close-${jobId}`);
      console.log('🔒 Closing job:', jobId);
      
      const response = await companyAPI.closeJob(jobId);
      console.log('✅ Job close response:', response);
      
      if (response.success) {
        addNotification('Job closed successfully!', 'success');
        await fetchJobs(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to close job');
      }
    } catch (error) {
      console.error('❌ Error closing job:', error);
      addNotification(
        error.response?.data?.message || error.message || 'Error closing job', 
        'error'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'status-active', label: 'Active', icon: '🟢' },
      closed: { class: 'status-closed', label: 'Closed', icon: '🔴' },
      draft: { class: 'status-draft', label: 'Draft', icon: '📝' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getJobTypeIcon = (jobType) => {
    const icons = {
      'full-time': '💼',
      'part-time': '⏰',
      'contract': '📝',
      'internship': '🎓',
      'remote': '🏠',
      'hybrid': '🔀'
    };
    return icons[jobType] || '💼';
  };

  const isJobExpired = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const formatSalary = (salaryRange) => {
    if (!salaryRange || (!salaryRange.min && !salaryRange.max)) {
      return 'Not specified';
    }
    
    const min = salaryRange.min || '0';
    const max = salaryRange.max || '0';
    const currency = salaryRange.currency || 'USD';
    
    return `${currency} ${min} - ${max}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <LoadingSpinner />
          <p>Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Job Management</h1>
          <p className="page-description">
            Manage your company's job postings and track applications. Post new opportunities and find qualified candidates.
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
            disabled={actionLoading}
          >
            + Post New Job
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            <strong>Debug Info:</strong>
            <div>Total Jobs: {jobs.length}</div>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div>Action Loading: {actionLoading || 'None'}</div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-number">{jobs.length}</div>
              <div className="stat-label">Total Jobs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <div className="stat-number">
                {jobs.filter(job => job.status === 'active').length}
              </div>
              <div className="stat-label">Active Jobs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">
                {jobs.reduce((total, job) => total + (job.applicationCount || 0), 0)}
              </div>
              <div className="stat-label">Total Applicants</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-number">
                {jobs.filter(job => job.status === 'active' && !isJobExpired(job.deadline)).length}
              </div>
              <div className="stat-label">Open Positions</div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="content-card">
          <div className="card-header">
            <h3>Your Job Postings ({jobs.length})</h3>
            <div className="card-actions">
              <button 
                className="btn-outline"
                onClick={fetchJobs}
                disabled={actionLoading}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
          <div className="card-content">
            {jobs.length > 0 ? (
              <div className="jobs-list">
                {jobs.map(job => (
                  <div key={job.id} className={`job-item ${job.status === 'closed' ? 'job-closed' : ''}`}>
                    <div className="job-header">
                      <div className="job-title-section">
                        <h4 className="job-title">{job.title || 'Untitled Job'}</h4>
                        <div className="job-status-info">
                          {getStatusBadge(job.status)}
                          {job.status === 'active' && isJobExpired(job.deadline) && (
                            <span className="status-expired">⏰ Expired</span>
                          )}
                        </div>
                      </div>
                      <div className="job-meta">
                        <span className="job-type">
                          {getJobTypeIcon(job.jobType)} {job.jobType || 'Not specified'}
                        </span>
                        <span className="job-location">📍 {job.location || 'Remote'}</span>
                        <span className="job-applicants">
                          👥 {job.applicationCount || 0} applicants
                        </span>
                        <span className="job-posted">
                          📅 Posted: {formatDate(job.postedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="job-details">
                      <p className="job-description">
                        {job.description || 'No description provided.'}
                      </p>
                      
                      {job.requirements && job.requirements.length > 0 && (
                        <div className="job-requirements">
                          <strong>Requirements:</strong>
                          <div className="tags">
                            {job.requirements.slice(0, 4).map((req, index) => (
                              <span key={index} className="tag">{req}</span>
                            ))}
                            {job.requirements.length > 4 && (
                              <span className="tag-more">+{job.requirements.length - 4} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="job-footer">
                        <div className="job-info">
                          <span className="info-item">
                            💰 {formatSalary(job.salaryRange)}
                          </span>
                          <span className="info-item">
                            🎯 {job.experience || 'Not specified'}
                          </span>
                          <span className="info-item">
                            📅 Closes: {formatDate(job.deadline)}
                          </span>
                          {job.updatedAt && (
                            <span className="info-item">
                              ✏️ Updated: {formatDate(job.updatedAt)}
                            </span>
                          )}
                        </div>
                        
                        <div className="job-actions">
                          <button 
                            className="btn-outline"
                            onClick={() => setEditingJob(job)}
                            disabled={actionLoading}
                          >
                            Edit
                          </button>
                          
                          {job.status === 'active' ? (
                            <button 
                              className="btn-warning"
                              onClick={() => handleCloseJob(job.id)}
                              disabled={actionLoading === `close-${job.id}`}
                            >
                              {actionLoading === `close-${job.id}` ? 'Closing...' : 'Close Job'}
                            </button>
                          ) : (
                            <button 
                              className="btn-danger"
                              onClick={() => handleCloseJob(job.id)}
                              disabled={actionLoading === `close-${job.id}`}
                            >
                              {actionLoading === `close-${job.id}` ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                          
                          <button 
                            className="btn-primary"
                            onClick={() => window.location.href = `/company/jobs/${job.id}/applicants`}
                          >
                            View Applicants ({job.applicationCount || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h4>No jobs posted yet</h4>
                <p>Start by posting your first job opportunity to attract qualified candidates from our platform.</p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowForm(true)}
                  disabled={actionLoading}
                >
                  Post Your First Job
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Form Modals */}
      {showForm && (
        <JobForm
          mode="create"
          onSubmit={handleCreateJob}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingJob && (
        <JobForm
          mode="edit"
          job={editingJob}
          onSubmit={(data) => handleUpdateJob(editingJob.id, data)}
          onClose={() => setEditingJob(null)}
        />
      )}
    </div>
  );
};

export default JobManagement;