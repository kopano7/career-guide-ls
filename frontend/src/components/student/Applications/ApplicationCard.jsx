import React, { useState } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import './ApplicationCard.css';

const ApplicationCard = ({ application, onAcceptAdmission, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  const { showError, showSuccess } = useNotification();

 
  const getStatusColor = () => {
    switch (application.status) {
      case 'pending': return 'status-pending';
      case 'admitted': return 'status-admitted';
      case 'rejected': return 'status-rejected';
      case 'accepted': return 'status-accepted';
      default: return 'status-default';
    }
  };

  const getStatusText = () => {
    switch (application.status) {
      case 'pending': return 'Under Review';
      case 'admitted': return 'Admission Offered';
      case 'rejected': return 'Not Admitted';
      case 'accepted': return 'Admission Accepted';
      default: return application.status;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAcceptClick = () => {
    onAcceptAdmission(application);
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement withdraw API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      showSuccess('Application Withdrawn', 'Your application has been withdrawn successfully');
      onRefresh();
    } catch (error) {
      showError('Withdrawal Failed', 'Failed to withdraw application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`application-card ${getStatusColor()}`}>
      {/* Application Header */}
      <div className="application-header">
        <div className="application-status">
          
          <span className="status-text">{getStatusText()}</span>
        </div>
        <div className="application-date">
          Applied: {formatDate(application.appliedAt)}
        </div>
      </div>

      {/* Application Content */}
      <div className="application-content">
        <h3 className="course-name">{application.courseName}</h3>
        <p className="institution-name">{application.instituteName}</p>
        
        {/* Application Details */}
        <div className="application-details">
          <div className="detail-row">
            <span className="detail-label">Application Number:</span>
            <span className="detail-value">{application.applicationNumber}</span>
          </div>
          
          {application.qualificationScore && (
            <div className="detail-row">
              <span className="detail-label">Qualification Score:</span>
              <span className="detail-value">{application.qualificationScore}%</span>
            </div>
          )}

          {application.calculatedGPA && (
            <div className="detail-row">
              <span className="detail-label">Calculated GPA:</span>
              <span className="detail-value">{application.calculatedGPA}</span>
            </div>
          )}

          {application.isQualified !== undefined && (
            <div className="detail-row">
              <span className="detail-label">Qualified:</span>
              <span className={`detail-value ${application.isQualified ? 'qualified' : 'not-qualified'}`}>
                {application.isQualified ? 'Yes' : 'No'}
              </span>
            </div>
          )}
        </div>

        {/* Notes from Institution */}
        {application.notes && (
          <div className="application-notes">
            <h4>Institution Notes:</h4>
            <p>{application.notes}</p>
          </div>
        )}

        {/* Important Dates */}
        <div className="application-timeline">
          {application.admittedAt && (
            <div className="timeline-item">
              <span className="timeline-label">Admission Offered:</span>
              <span className="timeline-date">{formatDate(application.admittedAt)}</span>
            </div>
          )}
          {application.acceptedAt && (
            <div className="timeline-item">
              <span className="timeline-label">Accepted On:</span>
              <span className="timeline-date">{formatDate(application.acceptedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Application Actions */}
      <div className="application-actions">
        {application.status === 'admitted' && (
          <button
            onClick={handleAcceptClick}
            className="btn btn-success accept-btn"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" text="" /> : 'Accept Admission'}
          </button>
        )}

        {application.status === 'pending' && (
          <button
            onClick={handleWithdraw}
            className="btn btn-outline withdraw-btn"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" text="" /> : 'Withdraw Application'}
          </button>
        )}

        {(application.status === 'rejected' || application.status === 'accepted') && (
          <button className="btn btn-outline view-details-btn">
            View Details
          </button>
        )}

        {/* REMOVED THE LINK THAT WAS CAUSING THE ERROR */}
        <button className="btn btn-outline apply-again-btn">
          Apply to Similar Courses
        </button>
      </div>
    </div>
  );
};

export default ApplicationCard;
