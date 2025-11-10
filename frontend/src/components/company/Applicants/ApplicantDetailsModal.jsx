import React from 'react';
import './ApplicantDetailsModal.css';

const ApplicantDetailsModal = ({ applicant, onClose, onStatusUpdate, actionLoading }) => {
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

  const renderMatchDetails = (matchDetails) => {
    if (!matchDetails || !Array.isArray(matchDetails)) return null;

    return matchDetails.map((detail, index) => (
      <div key={index} className="match-detail-item">
        <div className="match-detail-header">
          <span className="match-category">{detail.category}</span>
          <span className="match-score">{Math.round(detail.score * 100)}%</span>
        </div>
        <div className="match-detail-info">{detail.details}</div>
        <div className="match-progress-bar">
          <div 
            className="match-progress-fill"
            style={{ width: `${detail.score * 100}%` }}
          ></div>
        </div>
      </div>
    ));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content applicant-details-modal">
        <div className="modal-header">
          <h2>Applicant Details</h2>
          <button 
            type="button"
            className="close-button" 
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Applicant Header */}
          <div className="applicant-header-section">
            <div className="applicant-main-info">
              <h3>{applicant.name}</h3>
              <p className="applicant-email">{applicant.email}</p>
              <p className="applicant-phone">{applicant.phone || 'No phone provided'}</p>
            </div>
            <div className="applicant-stats">
              <div className="match-score-large">
                <div className={`score-circle-large ${getMatchScoreColor(applicant.matchScore)}`}>
                  {applicant.matchScore}%
                </div>
                <span>Overall Match</span>
              </div>
              <div className="applicant-status">
                {getStatusBadge(applicant.status || 'pending')}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="details-section">
            <h4>Basic Information</h4>
            <div className="details-grid">
              <div className="detail-item">
                <label>Academic Level:</label>
                <span>{applicant.academicLevel}</span>
              </div>
              <div className="detail-item">
                <label>Experience:</label>
                <span>{applicant.experience || '0'} years</span>
              </div>
              <div className="detail-item">
                <label>Applied Position:</label>
                <span>{applicant.jobTitle}</span>
              </div>
            </div>
          </div>

          {/* Transcript Information */}
          {applicant.transcript && (
            <div className="details-section">
              <h4>Academic Information</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <label>GPA:</label>
                  <span>
                    {applicant.transcript.gpa}/4.0
                    {applicant.transcript.verified && (
                      <span className="verified-badge">✅ Verified</span>
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Institution:</label>
                  <span>{applicant.transcript.institution || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <label>Graduation Year:</label>
                  <span>{applicant.transcript.graduationYear || 'Not specified'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {applicant.skills && applicant.skills.length > 0 && (
            <div className="details-section">
              <h4>Skills</h4>
              <div className="skills-container">
                {applicant.skills.map((skill, index) => (
                  <span key={index} className="skill-tag-large">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Match Breakdown */}
          {applicant.matchDetails && applicant.matchDetails.length > 0 && (
            <div className="details-section">
              <h4>Match Breakdown</h4>
              <div className="match-breakdown">
                {renderMatchDetails(applicant.matchDetails)}
              </div>
            </div>
          )}

          {/* Job Requirements vs Applicant Skills */}
          {applicant.jobRequirements && (
            <div className="details-section">
              <h4>Job Requirements Match</h4>
              <div className="requirements-match">
                {applicant.jobRequirements.map((requirement, index) => {
                  const hasSkill = applicant.skills?.some(skill => 
                    skill.toLowerCase().includes(requirement.toLowerCase()) ||
                    requirement.toLowerCase().includes(skill.toLowerCase())
                  );
                  
                  return (
                    <div key={index} className="requirement-item">
                      <span className="requirement-text">{requirement}</span>
                      <span className={`requirement-status ${hasSkill ? 'met' : 'not-met'}`}>
                        {hasSkill ? '✅' : '❌'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="action-buttons">
            <button 
              className="btn-outline"
              onClick={onClose}
            >
              Close
            </button>
            
            <div className="status-actions">
              {applicant.status !== 'shortlisted' && applicant.status !== 'rejected' && (
                <button 
                  className="btn-success"
                  onClick={() => onStatusUpdate(applicant.id, 'shortlisted', applicant.name)}
                  disabled={actionLoading === applicant.id}
                >
                  {actionLoading === applicant.id ? '...' : 'Shortlist'}
                </button>
              )}
              
              {applicant.status === 'shortlisted' && (
                <button 
                  className="btn-primary"
                  onClick={() => onStatusUpdate(applicant.id, 'interviewed', applicant.name)}
                  disabled={actionLoading === applicant.id}
                >
                  {actionLoading === applicant.id ? '...' : 'Mark Interviewed'}
                </button>
              )}
              
              {applicant.status === 'interviewed' && (
                <button 
                  className="btn-success"
                  onClick={() => onStatusUpdate(applicant.id, 'hired', applicant.name)}
                  disabled={actionLoading === applicant.id}
                >
                  {actionLoading === applicant.id ? '...' : 'Hire'}
                </button>
              )}
              
              {applicant.status !== 'rejected' && (
                <button 
                  className="btn-danger"
                  onClick={() => onStatusUpdate(applicant.id, 'rejected', applicant.name)}
                  disabled={actionLoading === applicant.id}
                >
                  {actionLoading === applicant.id ? '...' : 'Reject'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetailsModal;