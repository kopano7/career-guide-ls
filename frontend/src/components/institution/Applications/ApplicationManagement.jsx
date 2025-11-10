// src/components/institute/Applications/ApplicationManagement.jsx
import React, { useState, useEffect } from 'react';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';

const ApplicationManagement = () => {
  const { get, put } = useApi();
  const { addNotification } = useNotifications();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await get('/institute/applications');
      if (response.data.success) {
        setApplications(response.data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      addNotification('Error loading applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdmissionDecision = async (applicationId, status) => {
    try {
      const response = await put(`/institute/applications/${applicationId}/decision`, {
        status: status
      });

      if (response.data.success) {
        addNotification(`Application ${status} successfully!`, 'success');
        fetchApplications();
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      addNotification(
        error.response?.data?.message || 'Error updating application', 
        'error'
      );
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="application-management">
      <div className="page-header">
        <h1>Application Review</h1>
        <p>Review and manage student applications</p>
      </div>

      <div className="applications-list">
        {applications.length > 0 ? (
          applications.map(application => (
            <div key={application.id} className="application-card">
              <div className="application-header">
                <h3>{application.studentName}</h3>
                <span className={`status-badge ${application.status}`}>
                  {application.status}
                </span>
              </div>
              
              <div className="application-details">
                <div className="detail-item">
                  <strong>Course:</strong> {application.courseName}
                </div>
                <div className="detail-item">
                  <strong>Applied:</strong> {new Date(application.appliedAt).toLocaleDateString()}
                </div>
                <div className="detail-item">
                  <strong>Email:</strong> {application.studentEmail}
                </div>
                {application.matchScore && (
                  <div className="detail-item">
                    <strong>Match Score:</strong> {application.matchScore}%
                  </div>
                )}
              </div>

              <div className="application-actions">
                <button 
                  className="btn-outline"
                  onClick={() => setSelectedApplication(application)}
                >
                  Review Details
                </button>
                
                {application.status === 'pending' && (
                  <div className="decision-buttons">
                    <button 
                      className="btn-success"
                      onClick={() => handleAdmissionDecision(application.id, 'admitted')}
                    >
                      Admit
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={() => handleAdmissionDecision(application.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No applications found</p>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Application Details</h2>
              <button 
                className="modal-close"
                onClick={() => setSelectedApplication(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="student-info">
                <h3>{selectedApplication.studentName}</h3>
                <p>Email: {selectedApplication.studentEmail}</p>
                <p>Course: {selectedApplication.courseName}</p>
                <p>Applied: {new Date(selectedApplication.appliedAt).toLocaleDateString()}</p>
                <p>Status: <span className={`status-badge ${selectedApplication.status}`}>
                  {selectedApplication.status}
                </span></p>
              </div>

              {selectedApplication.transcript && (
                <div className="transcript-section">
                  <h4>Transcript</h4>
                  <a 
                    href={selectedApplication.transcript.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-outline"
                  >
                    View Transcript
                  </a>
                </div>
              )}

              {selectedApplication.status === 'pending' && (
                <div className="decision-section">
                  <h4>Admission Decision</h4>
                  <div className="decision-buttons">
                    <button 
                      className="btn-success"
                      onClick={() => handleAdmissionDecision(selectedApplication.id, 'admitted')}
                    >
                      Admit Student
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={() => handleAdmissionDecision(selectedApplication.id, 'rejected')}
                    >
                      Reject Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;