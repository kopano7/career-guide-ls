// File: src/components/student/Jobs/JobCard.jsx
import React from 'react';

const JobCard = ({ job, onApply }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysLeft = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isExpired = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const getJobTypeColor = (jobType) => {
    switch (jobType) {
      case 'full-time': return '#10b981';
      case 'part-time': return '#3b82f6';
      case 'contract': return '#f59e0b';
      case 'internship': return '#8b5cf6';
      case 'remote': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const daysLeft = getDaysLeft(job.deadline);
  const expired = isExpired(job.deadline);

  const handleApply = () => {
    if (expired) {
      alert('This job posting has expired.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to apply for "${job.title}" at ${job.companyName}?`)) {
      onApply(job);
    }
  };

  const handleSave = () => {
    // TODO: Implement save job functionality
    alert('Job saved to your favorites!');
  };

  const handleViewDetails = () => {
    // TODO: Implement view details functionality
    alert('Showing job details...');
  };

  return (
    <div className={`job-card ${expired ? 'expired' : ''}`}>
      {/* Job Header */}
      <div className="job-header">
        <div className="job-title-section">
          <h3 className="job-title">{job.title}</h3>
          <div className="company-info">
            <span className="company-name">{job.companyName}</span>
            <span className="job-location">📍 {job.location}</span>
          </div>
        </div>
        <div className="job-meta">
          <span 
            className="job-type"
            style={{ backgroundColor: getJobTypeColor(job.jobType) }}
          >
            {job.jobType}
          </span>
          {job.matchScore && (
            <span className="match-score">
              {job.matchScore}% Match
            </span>
          )}
        </div>
      </div>

      {/* Job Description */}
      <div className="job-description">
        <p>{job.description?.substring(0, 150)}...</p>
      </div>

      {/* Job Requirements */}
      {job.requirements && job.requirements.length > 0 && (
        <div className="job-requirements">
          <h4>Requirements:</h4>
          <div className="requirements-list">
            {job.requirements.slice(0, 3).map((requirement, index) => (
              <span key={index} className="requirement-tag">
                {requirement}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className="requirement-tag">
                +{job.requirements.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Job Details */}
      <div className="job-details">
        <div className="detail-item">
          <span className="detail-label">Experience:</span>
          <span className="detail-value">{job.experience || 'Not specified'}</span>
        </div>
        
        {job.salaryRange && (
          <div className="detail-item">
            <span className="detail-label">Salary:</span>
            <span className="detail-value">
              {job.salaryRange.currency} {job.salaryRange.min} - {job.salaryRange.max}
            </span>
          </div>
        )}

        <div className="detail-item">
          <span className="detail-label">Deadline:</span>
          <span className={`detail-value ${expired ? 'expired' : daysLeft <= 3 ? 'urgent' : ''}`}>
            {formatDate(job.deadline)}
            {!expired && (
              <span className="days-left"> ({daysLeft} days left)</span>
            )}
          </span>
        </div>
      </div>

      {/* Job Actions */}
      <div className="job-actions">
        <button
          onClick={handleApply}
          className="btn btn-primary apply-btn"
          disabled={expired}
        >
          {expired ? 'Expired' : 'Apply Now'}
        </button>
        
        <button onClick={handleSave} className="btn btn-outline save-btn">
          💾 Save
        </button>
        
        <button onClick={handleViewDetails} className="btn btn-outline details-btn">
          View Details
        </button>
      </div>

      {/* Match Details */}
      {job.isGoodMatch && (
        <div className="match-banner">
          🎯 Great match for your profile!
        </div>
      )}
    </div>
  );
};

export default JobCard;