// src/pages/company/ApplicantManagement.jsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useNotifications } from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';

const ApplicantManagement = () => {
  const { get, put } = useApi();
  const { addNotification } = useNotifications();
  
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState('all');
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchApplicants();
    fetchCompanyJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applicants, selectedJob]);

  const fetchApplicants = async () => {
    try {
      const response = await get('/company/applicants');
      if (response.data.success) {
        setApplicants(response.data.applicants);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
      addNotification('Error loading applicants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyJobs = async () => {
    try {
      const response = await get('/company/jobs');
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const applyFilters = () => {
    let filtered = applicants;

    if (selectedJob !== 'all') {
      filtered = filtered.filter(applicant => applicant.jobId === selectedJob);
    }

    setFilteredApplicants(filtered);
  };

  const handleStatusUpdate = async (applicantId, newStatus) => {
    try {
      const response = await put(`/company/applicants/${applicantId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        addNotification('Applicant status updated!', 'success');
        fetchApplicants();
      }
    } catch (error) {
      console.error('Error updating applicant status:', error);
      addNotification(
        error.response?.data?.message || 'Error updating status', 
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
          <h1 className="page-title">Applicant Management</h1>
          <p className="page-description">
            Review and manage job applicants
          </p>
        </div>
        <div className="header-actions">
          <select 
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Jobs</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="page-content">
        <div className="content-card">
          <div className="card-header">
            <h3>Applicants ({filteredApplicants.length})</h3>
          </div>
          <div className="card-content">
            {filteredApplicants.length > 0 ? (
              <div className="applicants-table">
                <div className="table-header">
                  <div className="table-cell">Candidate</div>
                  <div className="table-cell">Job Position</div>
                  <div className="table-cell">Applied Date</div>
                  <div className="table-cell">Match Score</div>
                  <div className="table-cell">Status</div>
                  <div className="table-cell">Actions</div>
                </div>
                <div className="table-body">
                  {filteredApplicants.map(applicant => (
                    <div key={applicant.id} className="table-row">
                      <div className="table-cell">
                        <div className="candidate-info">
                          <strong>{applicant.studentName}</strong>
                          <span>{applicant.studentEmail}</span>
                        </div>
                      </div>
                      <div className="table-cell">
                        {applicant.jobTitle}
                      </div>
                      <div className="table-cell">
                        {new Date(applicant.appliedAt).toLocaleDateString()}
                      </div>
                      <div className="table-cell">
                        {applicant.matchScore ? (
                          <div className="score-indicator">
                            <div 
                              className="score-bar"
                              style={{ width: `${applicant.matchScore}%` }}
                            ></div>
                            <span>{applicant.matchScore}%</span>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </div>
                      <div className="table-cell">
                        <span className={`status-badge ${applicant.status}`}>
                          {applicant.status}
                        </span>
                      </div>
                      <div className="table-cell">
                        <div className="action-buttons">
                          <button 
                            className="btn-outline sm"
                            onClick={() => handleStatusUpdate(applicant.id, 'shortlisted')}
                            disabled={applicant.status === 'shortlisted'}
                          >
                            Shortlist
                          </button>
                          <button 
                            className="btn-success sm"
                            onClick={() => handleStatusUpdate(applicant.id, 'hired')}
                            disabled={applicant.status === 'hired'}
                          >
                            Hire
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No applicants found</p>
                {selectedJob !== 'all' && (
                  <button 
                    className="btn-secondary"
                    onClick={() => setSelectedJob('all')}
                  >
                    View All Applicants
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantManagement;