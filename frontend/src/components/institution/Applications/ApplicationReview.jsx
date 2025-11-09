// src/components/institute/Applications/ApplicationReview.jsx
import React, { useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import { useNotifications } from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';

const ApplicationReview = ({ application, onClose, onApplicationUpdate }) => {
  const { put } = useApi();
  const { addNotification } = useNotifications();
  
  const [updating, setUpdating] = useState(false);
  const [decision, setDecision] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleAdmissionDecision = async (status) => {
    if (!window.confirm(`Are you sure you want to ${status} this application?`)) return;

    try {
      setUpdating(true);
      const response = await put(`/institute/applications/${application.id}/decision`, {
        status: status,
        feedback: feedback || undefined
      });

      if (response.data.success) {
        addNotification(`Application ${status} successfully!`, 'success');
        onApplicationUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating application:', error);
      addNotification(
        error.response?.data?.message || 'Error updating application', 
        'error'
      );
    } finally {
      setUpdating(false);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>Review Application</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Application Overview */}
          <div className="application-overview">
            <div className="overview-section">
              <h3>Student Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name:</label>
                  <span>{application.studentName}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{application.studentEmail}</span>
                </div>
                <div className="info-item">
                  <label>Phone:</label>
                  <span>{application.studentPhone || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <label>Applied Date:</label>
                  <span>{new Date(application.appliedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="overview-section">
              <h3>Course Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Course:</label>
                  <span>{application.courseName}</span>
                </div>
                <div className="info-item">
                  <label>Current Status:</label>
                  <span className={`status-badge ${application.status}`}>
                    {application.status}
                  </span>
                </div>
                {application.matchScore && (
                  <div className="info-item">
                    <label>Qualification Match:</label>
                    <div className="match-score">
                      <div 
                        className="score-bar"
                        style={{ 
                          width: `${application.matchScore}%`,
                          backgroundColor: getMatchScoreColor(application.matchScore)
                        }}
                      ></div>
                      <span>{application.matchScore}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student Qualifications */}
          <div className="qualifications-section">
            <h3>Student Qualifications</h3>
            <div className="qualifications-grid">
              <div className="qualification-item">
                <label>High School:</label>
                <span>{application.studentHighSchool || 'Not provided'}</span>
              </div>
              <div className="qualification-item">
                <label>Graduation Year:</label>
                <span>{application.studentGraduationYear || 'Not provided'}</span>
              </div>
              <div className="qualification-item">
                <label>GPA:</label>
                <span>{application.studentGPA || 'Not provided'}</span>
              </div>
              {application.studentSkills?.length > 0 && (
                <div className="qualification-item full-width">
                  <label>Skills:</label>
                  <div className="skills-list">
                    {application.studentSkills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transcript */}
          {application.transcript && (
            <div className="transcript-section">
              <h3>Academic Transcript</h3>
              <div className="transcript-preview">
                <div className="file-info">
                  <span className="file-icon">📄</span>
                  <div className="file-details">
                    <div className="file-name">{application.transcript.name}</div>
                    <div className="file-size">
                      {(application.transcript.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <a 
                  href={application.transcript.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-outline"
                >
                  View Transcript
                </a>
              </div>
            </div>
          )}

          {/* Admission Decision */}
          <div className="decision-section">
            <h3>Admission Decision</h3>
            <div className="decision-form">
              <div className="form-group">
                <label>Decision Feedback (Optional)</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback to the student..."
                  rows="3"
                />
              </div>
              
              <div className="decision-actions">
                <button 
                  className="btn-danger"
                  onClick={() => handleAdmissionDecision('rejected')}
                  disabled={updating || application.status === 'rejected'}
                >
                  {updating ? 'Processing...' : 'Reject Application'}
                </button>
                <button 
                  className="btn-success"
                  onClick={() => handleAdmissionDecision('admitted')}
                  disabled={updating || application.status === 'admitted'}
                >
                  {updating ? 'Processing...' : 'Admit Student'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="btn-secondary"
            onClick={onClose}
            disabled={updating}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationReview;