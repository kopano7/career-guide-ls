// src/pages/company/JobManagement.jsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useNotifications } from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import JobForm from '../../components/company/Jobs/JobForm';

const JobManagement = () => {
  const { get, post, put, delete: deleteApi } = useApi();
  const { addNotification } = useNotifications();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await get('/company/jobs');
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      addNotification('Error loading jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (jobData) => {
    try {
      const response = await post('/company/jobs', jobData);
      if (response.data.success) {
        addNotification('Job posted successfully!', 'success');
        setShowForm(false);
        fetchJobs();
      }
    } catch (error) {
      console.error('Error creating job:', error);
      addNotification(
        error.response?.data?.message || 'Error creating job', 
        'error'
      );
    }
  };

  const handleUpdateJob = async (jobId, jobData) => {
    try {
      const response = await put(`/company/jobs/${jobId}`, jobData);
      if (response.data.success) {
        addNotification('Job updated successfully!', 'success');
        setEditingJob(null);
        fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job:', error);
      addNotification(
        error.response?.data?.message || 'Error updating job', 
        'error'
      );
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await deleteApi(`/company/jobs/${jobId}`);
      if (response.data.success) {
        addNotification('Job deleted successfully!', 'success');
        fetchJobs();
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      addNotification(
        error.response?.data?.message || 'Error deleting job', 
        'error'
      );
    }
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
          <h1 className="page-title">Job Management</h1>
          <p className="page-description">
            Manage your company's job postings and applications
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            Post New Job
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Jobs List */}
        <div className="content-card">
          <div className="card-header">
            <h3>Your Job Postings ({jobs.length})</h3>
          </div>
          <div className="card-content">
            {jobs.length > 0 ? (
              <div className="jobs-list">
                {jobs.map(job => (
                  <div key={job.id} className="job-item">
                    <div className="job-info">
                      <div className="job-main">
                        <h4>{job.title}</h4>
                        <p className="job-description">{job.description}</p>
                      </div>
                      <div className="job-details">
                        <span className="detail">📍 {job.location}</span>
                        <span className="detail">⏱️ {job.jobType}</span>
                        <span className="detail">💰 ${job.salaryRange}</span>
                        <span className="detail">📅 Closes {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                        <span className="detail">👥 {job.applicationCount} applicants</span>
                      </div>
                    </div>
                    <div className="job-actions">
                      <button 
                        className="btn-outline"
                        onClick={() => setEditingJob(job)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No jobs posted yet</p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  Post Your First Job
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Form Modal */}
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