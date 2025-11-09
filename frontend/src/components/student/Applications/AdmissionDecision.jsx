// src/components/student/Applications/AdmissionDecision.jsx
import React from 'react';
import './AdmissionDecision.css';

const AdmissionDecision = ({ application, onAccept, onDecline }) => {
  const getDecisionBadge = () => {
    switch (application.status) {
      case 'admitted':
        return { type: 'success', text: 'Admission Offered', icon: '🎉' };
      case 'rejected':
        return { type: 'error', text: 'Not Admitted', icon: '❌' };
      case 'accepted':
        return { type: 'success', text: 'Admission Accepted', icon: '✅' };
      case 'waiting_list':
        return { type: 'warning', text: 'Waiting List', icon: '⏳' };
      default:
        return { type: 'info', text: 'Under Review', icon: '📝' };
    }
  };

  const decisionBadge = getDecisionBadge();

  const formatDecisionDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAdmissionDeadline = () => {
    const decisionDate = new Date(application.admittedAt || application.updatedAt);
    const deadline = new Date(decisionDate);
    deadline.setDate(deadline.getDate() + 14);
    return deadline;
  };

  return (
    <div className={`admission-decision ${decisionBadge.type}`}>
      <div className="decision-header">
        <div className="decision-badge">
          <span className="badge-icon">{decisionBadge.icon}</span>
          <span className="badge-text">{decisionBadge.text}</span>
        </div>
        <div className="decision-date">
          Decision Date: {formatDecisionDate(application.updatedAt)}
        </div>
      </div>

      <div className="admission-letter">
        <div className="letter-header">
          <h3>OFFICIAL ADMISSION DECISION</h3>
          <div className="institution-seal">
            <div className="seal-icon">🏛️</div>
            <span>{application.instituteName}</span>
          </div>
        </div>

        <div className="letter-content">
          <div className="student-info">
            <p><strong>Dear {application.studentName},</strong></p>
          </div>

          <div className="decision-message">
            {application.status === 'admitted' && (
              <>
                <p>
                  We are pleased to inform you that you have been <strong>admitted</strong> to the{' '}
                  <strong>{application.courseName}</strong> program at {application.instituteName}.
                </p>
                <p>
                  Your application demonstrated strong academic potential and we believe you will be 
                  a valuable addition to our institution.
                </p>
                
                <div className="admission-details">
                  <h4>Admission Details:</h4>
                  <ul>
                    <li><strong>Program:</strong> {application.courseName}</li>
                    <li><strong>Faculty:</strong> {application.faculty}</li>
                    <li><strong>Duration:</strong> {application.duration}</li>
                    <li><strong>Qualification Score:</strong> {application.qualificationScore}%</li>
                  </ul>
                </div>

                <div className="acceptance-deadline">
                  <h4>📅 Response Deadline</h4>
                  <p>
                    Please respond to this admission offer by{' '}
                    <strong>{formatDecisionDate(getAdmissionDeadline())}</strong>.
                  </p>
                </div>
              </>
            )}

            {application.status === 'rejected' && (
              <>
                <p>
                  After careful consideration of your application to the{' '}
                  <strong>{application.courseName}</strong> program, we regret to inform you that 
                  we are unable to offer you admission at this time.
                </p>
                
                {application.rejectionReason && (
                  <div className="rejection-reason">
                    <h4>Application Feedback:</h4>
                    <p>{application.rejectionReason}</p>
                  </div>
                )}

                <div className="encouragement">
                  <p>
                    We encourage you to consider other programs or reapply in the future. 
                    Thank you for your interest in {application.instituteName}.
                  </p>
                </div>
              </>
            )}

            {application.status === 'waiting_list' && (
              <>
                <p>
                  Your application to the <strong>{application.courseName}</strong> program 
                  has been placed on our waiting list.
                </p>
                <p>
                  While we cannot offer you immediate admission, you may be considered if spaces 
                  become available. We will notify you by{' '}
                  <strong>{formatDecisionDate(getAdmissionDeadline())}</strong> if your status changes.
                </p>
              </>
            )}

            {application.status === 'accepted' && (
              <>
                <p>
                  Congratulations! You have <strong>accepted</strong> your admission to the{' '}
                  <strong>{application.courseName}</strong> program at {application.instituteName}.
                </p>
                <p>
                  Welcome to our academic community. Further instructions regarding registration 
                  and orientation will be sent to you shortly.
                </p>
              </>
            )}
          </div>

          <div className="letter-closing">
            <p>Sincerely,</p>
            <p><strong>Admissions Committee</strong></p>
            <p>{application.instituteName}</p>
          </div>
        </div>
      </div>

      {application.status === 'admitted' && (
        <div className="decision-actions">
          <button 
            onClick={() => onAccept(application.id)}
            className="btn btn-success"
          >
            ✅ Accept Admission Offer
          </button>
          <button 
            onClick={() => onDecline(application.id)}
            className="btn btn-outline"
          >
            ❌ Decline Offer
          </button>
        </div>
      )}

      <div className="download-section">
        <button className="btn btn-outline btn-sm">
          📄 Download Decision Letter
        </button>
      </div>
    </div>
  );
};

export default AdmissionDecision;