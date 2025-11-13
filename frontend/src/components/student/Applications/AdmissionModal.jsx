import React from 'react';
import './AdmissionModal.css';

const AdmissionModal = ({ application, onClose, onConfirm }) => {
  const handleConfirm = () => {
    onConfirm(application.id);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="admission-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <h2> Accept Admission Offer</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {/* Admission Details */}
        <div className="admission-content">
         
          <div className="admission-info">
            <h3>Congratulations!</h3>
            <p>You have been offered admission to:</p>
            
            <div className="admission-details">
              <div className="detail-card">
                <h4>{application.courseName}</h4>
                <p className="institution">{application.instituteName}</p>
                <p className="admission-date">
                  Offered on: {formatDate(application.admittedAt)}
                </p>
              </div>
            </div>

            {/* Important Notice */}
            <div className="admission-notice">
              <h4>Important Information</h4>
              <ul>
                <li> By accepting this offer, you confirm your intention to enroll</li>
                <li> You can only accept ONE admission offer</li>
                <li> All other pending applications will be automatically withdrawn</li>
                <li> You will receive further instructions via email</li>
                <li> Please respond before the deadline (if applicable)</li>
              </ul>
            </div>

            {/* Confirmation Check */}
            <div className="confirmation-check">
              <label className="confirmation-label">
                <input type="checkbox" className="confirmation-checkbox" />
                <span className="checkmark"></span>
                I understand that this action is final and I can only accept one admission offer
              </label>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button
            onClick={onClose}
            className="btn btn-outline decline-btn"
          >
            Decline for Now
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-success accept-btn"
          >
            Accept Admission Offer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdmissionModal;
