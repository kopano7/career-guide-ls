import React, { useState, useEffect } from 'react';
import { companyAPI } from '../../services/api/company';
import useNotifications from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import ApplicantDetailsModal from '../../components/company/Applicants/ApplicantDetailsModal';
import './ApplicantManagement.css';

const ApplicantManagement = () => {
  const { addNotification } = useNotifications();
  
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompanyJobs();
  }, []);

  useEffect(() => {
    if (selectedJob !== 'all') {
      fetchApplicantsForJob(selectedJob);
    } else {
      fetchAllApplicants();
    }
  }, [selectedJob]);

  useEffect(() => {
    applyFilters();
  }, [applicants, statusFilter, searchTerm]);

  const fetchCompanyJobs = async () => {
    try {
      const response = await companyAPI.getJobs();
      if (response.success) {
        setJobs(response.jobs || []);
        // Auto-select first job if available
        if (response.jobs.length > 0) {
          setSelectedJob(response.jobs[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      addNotification('Error loading company jobs', 'error');
    }
  };

  const fetchAllApplicants = async () => {
    try {
      setLoading(true);
      // This would need a new endpoint to get all applicants across jobs
      // For now, we'll use the job-specific endpoint for each job
      const allApplicants = [];
      
      for (const job of jobs) {
        try {
          const response = await companyAPI.getQualifiedApplicants(job.id);
          if (response.success && response.applicants) {
            const jobApplicants = response.applicants.map(applicant => ({
              ...applicant,
              jobId: job.id,
              jobTitle: job.title,
              jobRequirements: job.requirements,
              jobQualifications: job.qualifications
            }));
            allApplicants.push(...jobApplicants);
          }
        } catch (error) {
          console.error(`Error fetching applicants for job ${job.id}:`, error);
        }
      }
      
      setApplicants(allApplicants);
    } catch (error) {
      console.error('Error fetching all applicants:', error);
      addNotification('Error loading applicants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicantsForJob = async (jobId) => {
    try {
      setLoading(true);
      const response = await companyAPI.getQualifiedApplicants(jobId);
      
      if (response.success) {
        const job = jobs.find(j => j.id === jobId);
        const applicantsWithJobInfo = (response.applicants || []).map(applicant => ({
          ...applicant,
          jobId: jobId,
          jobTitle: job?.title || 'Unknown Job',
          jobRequirements: job?.requirements || [],
          jobQualifications: job?.qualifications || []
        }));
        
        setApplicants(applicantsWithJobInfo);
      } else {
        throw new Error(response.message || 'Failed to fetch applicants');
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
      addNotification(
        error.response?.data?.message || error.message || 'Error loading applicants', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...applicants];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(applicant => applicant.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(applicant =>
        applicant.name?.toLowerCase().includes(term) ||
        applicant.email?.toLowerCase().includes(term) ||
        applicant.jobTitle?.toLowerCase().includes(term) ||
        applicant.academicLevel?.toLowerCase().includes(term)
      );
    }

    setFilteredApplicants(filtered);
  };

  const handleStatusUpdate = async (applicantId, newStatus, applicantName) => {
    try {
      setActionLoading(applicantId);
      
      // In a real implementation, you'd have an API endpoint for this
      // For now, we'll simulate the update locally
      const updatedApplicants = applicants.map(applicant =>
        applicant.id === applicantId
          ? { ...applicant, status: newStatus }
          : applicant
      );
      
      setApplicants(updatedApplicants);
      
      addNotification(
        `${applicantName} status updated to ${newStatus}`,
        'success'
      );

      // Here you would typically make an API call to update the status in the database
      // await companyAPI.updateApplicantStatus(applicantId, newStatus);
      
    } catch (error) {
      console.error('Error updating applicant status:', error);
      addNotification(
        error.response?.data?.message || error.message || 'Error updating status', 
        'error'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (applicant) => {
    setSelectedApplicant(applicant);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', label: 'Under Review', icon: '⏳' },
      shortlisted: { class: 'status-shortlisted', label: 'Shortlisted', icon: '✅' },
      interviewed: { class: 'status-interviewed', label: 'Interviewed', icon: '💼' },
      rejected: { class: 'status-rejected', label: 'Rejected', icon: '❌' },
      hired: { class: 'status-hired', label: 'Hired', icon: '🎉' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  };

  const calculateOverallMatch = (applicant) => {
    return applicant.matchScore || 0;
  };

  if (loading && applicants.length === 0) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <LoadingSpinner />
          <p>Loading applicants...</p>
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
            Review qualified applicants, manage interviews, and make hiring decisions
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-outline"
            onClick={() => selectedJob !== 'all' ? fetchApplicantsForJob(selectedJob) : fetchAllApplicants()}
            disabled={actionLoading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Filters Section */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Filter by Job:</label>
            <select 
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Jobs</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.applicationCount || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Filter by Status:</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewed">Interviewed</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Search Applicants:</label>
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Stats Summary */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{filteredApplicants.length}</div>
              <div className="stat-label">Total Applicants</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">
                {filteredApplicants.filter(a => a.status === 'shortlisted').length}
              </div>
              <div className="stat-label">Shortlisted</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-content">
              <div className="stat-number">
                {filteredApplicants.filter(a => a.status === 'interviewed').length}
              </div>
              <div className="stat-label">Interviewed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎉</div>
            <div className="stat-content">
              <div className="stat-number">
                {filteredApplicants.filter(a => a.status === 'hired').length}
              </div>
              <div className="stat-label">Hired</div>
            </div>
          </div>
        </div>

        {/* Applicants List */}
        <div className="content-card">
          <div className="card-header">
            <h3>
              {selectedJob === 'all' ? 'All Applicants' : 'Job Applicants'} 
              ({filteredApplicants.length})
            </h3>
            <div className="card-info">
              {selectedJob !== 'all' && (
                <span className="job-title-info">
                  For: {jobs.find(j => j.id === selectedJob)?.title}
                </span>
              )}
            </div>
          </div>
          
          <div className="card-content">
            {filteredApplicants.length > 0 ? (
              <div className="applicants-grid">
                {filteredApplicants.map(applicant => {
                  const overallMatch = calculateOverallMatch(applicant);
                  
                  return (
                    <div key={applicant.id} className="applicant-card">
                      <div className="applicant-header">
                        <div className="applicant-basic-info">
                          <h4 className="applicant-name">{applicant.name}</h4>
                          <p className="applicant-email">{applicant.email}</p>
                          <p className="applicant-phone">{applicant.phone || 'No phone'}</p>
                        </div>
                        <div className="applicant-match">
                          <div className="match-score">
                            <div className={`score-circle ${getMatchScoreColor(overallMatch)}`}>
                              {overallMatch}%
                            </div>
                            <span>Match Score</span>
                          </div>
                        </div>
                      </div>

                      <div className="applicant-details">
                        <div className="detail-row">
                          <span className="detail-label">Academic Level:</span>
                          <span className="detail-value">{applicant.academicLevel}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Experience:</span>
                          <span className="detail-value">{applicant.experience || '0'} years</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Applied For:</span>
                          <span className="detail-value">{applicant.jobTitle}</span>
                        </div>
                        {applicant.transcript && (
                          <div className="detail-row">
                            <span className="detail-label">GPA:</span>
                            <span className="detail-value">
                              {applicant.transcript.gpa}/4.0
                              {applicant.transcript.verified && (
                                <span className="verified-badge">✅ Verified</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {applicant.skills && applicant.skills.length > 0 && (
                        <div className="applicant-skills">
                          <strong>Skills:</strong>
                          <div className="skills-tags">
                            {applicant.skills.slice(0, 4).map((skill, index) => (
                              <span key={index} className="skill-tag">{skill}</span>
                            ))}
                            {applicant.skills.length > 4 && (
                              <span className="skill-tag-more">
                                +{applicant.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="applicant-footer">
                        <div className="applicant-status">
                          {getStatusBadge(applicant.status || 'pending')}
                        </div>
                        <div className="applicant-actions">
                          <button 
                            className="btn-outline sm"
                            onClick={() => handleViewDetails(applicant)}
                          >
                            View Details
                          </button>
                          
                          {applicant.status !== 'shortlisted' && applicant.status !== 'rejected' && (
                            <button 
                              className="btn-success sm"
                              onClick={() => handleStatusUpdate(applicant.id, 'shortlisted', applicant.name)}
                              disabled={actionLoading === applicant.id}
                            >
                              {actionLoading === applicant.id ? '...' : 'Shortlist'}
                            </button>
                          )}
                          
                          {applicant.status === 'shortlisted' && (
                            <button 
                              className="btn-primary sm"
                              onClick={() => handleStatusUpdate(applicant.id, 'interviewed', applicant.name)}
                              disabled={actionLoading === applicant.id}
                            >
                              {actionLoading === applicant.id ? '...' : 'Mark Interviewed'}
                            </button>
                          )}
                          
                          {applicant.status === 'interviewed' && (
                            <button 
                              className="btn-success sm"
                              onClick={() => handleStatusUpdate(applicant.id, 'hired', applicant.name)}
                              disabled={actionLoading === applicant.id}
                            >
                              {actionLoading === applicant.id ? '...' : 'Hire'}
                            </button>
                          )}
                          
                          {applicant.status !== 'rejected' && (
                            <button 
                              className="btn-danger sm"
                              onClick={() => handleStatusUpdate(applicant.id, 'rejected', applicant.name)}
                              disabled={actionLoading === applicant.id}
                            >
                              {actionLoading === applicant.id ? '...' : 'Reject'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h4>No applicants found</h4>
                <p>
                  {selectedJob !== 'all' 
                    ? `No applicants found for the selected job${searchTerm ? ' matching your search' : ''}.`
                    : `No applicants found${searchTerm ? ' matching your search' : ''}.`
                  }
                </p>
                {(selectedJob !== 'all' || searchTerm || statusFilter !== 'all') && (
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedJob('all');
                      setStatusFilter('all');
                      setSearchTerm('');
                    }}
                  >
                    View All Applicants
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Applicant Details Modal */}
      {showDetailsModal && selectedApplicant && (
        <ApplicantDetailsModal
          applicant={selectedApplicant}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedApplicant(null);
          }}
          onStatusUpdate={handleStatusUpdate}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default ApplicantManagement;