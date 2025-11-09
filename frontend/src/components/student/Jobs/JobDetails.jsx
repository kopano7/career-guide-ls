// src/components/student/Jobs/JobDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import ConfirmationModal from '../../common/Modal/ConfirmationModal';
import { useApi } from '../../../hooks/useApi';
import { useNotifications } from '../../../hooks/useNotifications';
import { useAuth } from '../../../hooks/useAuth';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const { get, post } = useApi();
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await get(`/student/jobs/${jobId}`);
      
      if (response.data.success) {
        setJob(response.data.job);
      } else {
        throw new Error(response.data.message || 'Failed to fetch job details');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      addNotification(
        error.response?.data?.message || 'Error loading job details', 
        'error'
      );
      navigate('/student/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      const response = await post(`/student/jobs/${jobId}/apply`);
      
      if (response.data.success) {
        addNotification('Application submitted successfully!', 'success');
        setShowApplyModal(false);
        // Update job data to reflect application status
        setJob(prev => ({ ...prev, hasApplied: true, applicationId: response.data.applicationId }));
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      addNotification(
        error.response?.data?.message || 'Error submitting application', 
        'error'
      );
    } finally {
      setApplying(false);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const isApplicationClosed = job && new Date(job.applicationDeadline) < new Date();
  const isFullyQualified = job?.matchScore >= 60;

  if (loading) return <LoadingSpinner />;
  if (!job) return <div className="error-page">Job not found</div>;

  return (
    <div className="job-details-page">
      <div className="page-header">
        <button 
          className="back-button"
          onClick={() => navigate('/student/jobs')}
        >
          ← Back to Jobs
        </button>
        <h1>Job Details</h1>
      </div>

      <div className="job-details-container">
        {/* Header Section */}
        <div className="job-header-card">
          <div className="job-main-info">
            <h1>{job.title}</h1>
            <div className="company-section">
              <h2>{job.companyName}</h2>
              {job.industry && <span className="industry-badge">{job.industry}</span>}
            </div>
          </div>

          <div className="job-action-section">
            {job.matchScore !== undefined && (
              <div className="match-score-display">
                <div 
                  className="score-circle"
                  style={{ backgroundColor: getMatchScoreColor(job.matchScore) }}
                >
                  {job.matchScore}%
                </div>
                <div className="score-info">
                  <strong>Qualification Match</strong>
                  <p>
                    {job.matchScore >= 80 ? 'Excellent match!' :
                     job.matchScore >= 60 ? 'Good match' :
                     job.matchScore >= 40 ? 'Partial match' :
                     'Low match'}
                  </p>
                </div>
              </div>
            )}

            <div className="action-buttons">
              {job.hasApplied ? (
                <div className="application-status-panel">
                  <span className="status-badge applied">✓ Applied</span>
                  <p>Application submitted</p>
                  <button 
                    className="btn-outline"
                    onClick={() => navigate('/student/applications')}
                  >
                    View Application
                  </button>
                </div>
              ) : isApplicationClosed ? (
                <div className="application-status-panel">
                  <span className="status-badge closed">Applications Closed</span>
                  <p>This position is no longer accepting applications</p>
                </div>
              ) : !isFullyQualified ? (
                <div className="application-status-panel">
                  <span className="status-badge warning">Not Fully Qualified</span>
                  <p>You may still apply, but your match score is low</p>
                  <button 
                    className="btn-warning"
                    onClick={() => setShowApplyModal(true)}
                  >
                    Apply Anyway
                  </button>
                </div>
              ) : (
                <button
                  className="apply-now-btn btn-primary"
                  onClick={() => setShowApplyModal(true)}
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Job Metadata */}
        <div className="job-metadata-grid">
          <div className="metadata-item">
            <span className="metadata-label">📍 Location</span>
            <span className="metadata-value">{job.location}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">⏱️ Job Type</span>
            <span className="metadata-value">{job.jobType}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">💰 Salary</span>
            <span className="metadata-value">{job.salaryRange || 'Negotiable'}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">📅 Deadline</span>
            <span className={`metadata-value ${isApplicationClosed ? 'deadline-passed' : ''}`}>
              {new Date(job.applicationDeadline).toLocaleDateString()}
              {isApplicationClosed && ' (Closed)'}
            </span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">🏢 Company Size</span>
            <span className="metadata-value">{job.companySize || 'Not specified'}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">🌐 Website</span>
            <span className="metadata-value">
              {job.companyWebsite ? (
                <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer">
                  Visit Website
                </a>
              ) : 'Not provided'}
            </span>
          </div>
        </div>

        {/* Job Content Sections */}
        <div className="job-content-sections">
          <section className="content-section">
            <h3>📝 Job Description</h3>
            <div className="content-text">
              {job.description || 'No description provided.'}
            </div>
          </section>

          <section className="content-section">
            <h3>🎯 Key Responsibilities</h3>
            <ul className="content-list">
              {job.responsibilities?.map((resp, index) => (
                <li key={index}>{resp}</li>
              )) || <li>No specific responsibilities listed.</li>}
            </ul>
          </section>

          <section className="content-section">
            <h3>✅ Required Qualifications</h3>
            <ul className="content-list">
              {job.requiredQualifications?.map((qual, index) => (
                <li key={index}>{qual}</li>
              )) || <li>No specific qualifications listed.</li>}
            </ul>
          </section>

          {job.preferredQualifications?.length > 0 && (
            <section className="content-section">
              <h3>⭐ Preferred Qualifications</h3>
              <ul className="content-list">
                {job.preferredQualifications.map((qual, index) => (
                  <li key={index}>{qual}</li>
                ))}
              </ul>
            </section>
          )}

          {job.benefits?.length > 0 && (
            <section className="content-section">
              <h3>🎁 Benefits & Perks</h3>
              <ul className="content-list">
                {job.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </section>
          )}

          {job.applicationProcess && (
            <section className="content-section">
              <h3>📋 Application Process</h3>
              <div className="content-text">
                {job.applicationProcess}
              </div>
            </section>
          )}
        </div>

        {/* Bottom Action Section */}
        <div className="bottom-actions">
          <button 
            className="btn-outline"
            onClick={() => navigate('/student/jobs')}
          >
            Back to Jobs
          </button>
          
          {!job.hasApplied && !isApplicationClosed && (
            <button
              className="btn-primary"
              onClick={() => setShowApplyModal(true)}
            >
              Apply for this Position
            </button>
          )}
        </div>
      </div>

      {/* Application Confirmation Modal */}
      <ConfirmationModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onConfirm={handleApply}
        title="Confirm Job Application"
        confirmText={applying ? "Submitting Application..." : "Confirm Application"}
        cancelText="Cancel"
        disabled={applying}
        type="warning"
      >
        <div className="application-confirmation-content">
          <p>You are about to apply for:</p>
          <div className="job-application-summary">
            <h4>{job.title}</h4>
            <p>at <strong>{job.companyName}</strong></p>
          </div>
          
          {job.matchScore < 60 && (
            <div className="qualification-warning">
              <h5>⚠️ Qualification Notice</h5>
              <p>Your match score is {job.matchScore}%. You may want to review the requirements before applying.</p>
            </div>
          )}

          <div className="application-terms">
            <p>By applying, you agree to:</p>
            <ul>
              <li>Share your profile and qualifications with the employer</li>
              <li>Allow the company to contact you regarding this position</li>
              <li>Receive notifications about your application status</li>
            </ul>
          </div>
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default JobDetails;