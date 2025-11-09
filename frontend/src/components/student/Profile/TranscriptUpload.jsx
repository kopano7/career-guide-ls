import React, { useState } from 'react';
import axios from 'axios';
import useNotifications from '/src/hooks/useNotifications';

const TranscriptUpload = ({ currentTranscript, onTranscriptUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const { addNotification } = useNotifications();

  const handleFileUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      addNotification('Please upload a PDF, JPEG, or PNG file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification('File size must be less than 5MB', 'error');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('transcript', file);

      // ✅ FIXED: Use the correct backend URL
      const response = await axios.post('http://localhost:5000/api/student/transcript/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          // Also add authorization header if needed
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (response.data.success) {
        addNotification('Transcript uploaded successfully!', 'success');
        onTranscriptUpdate?.();
      }
    } catch (error) {
      console.error('Error uploading transcript:', error);
      addNotification(
        error.response?.data?.message || 'Error uploading transcript', 
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="transcript-upload">
      <div className="upload-header">
        <h4>Academic Transcript</h4>
        <p>Upload your official academic transcript for verification</p>
      </div>

      {currentTranscript ? (
        <div className="current-transcript">
          <div className="transcript-info">
            <div className="file-preview">
              <span className="file-icon">📄</span>
              <div className="file-details">
                <div className="file-name">{currentTranscript.fileName}</div>
                <div className="file-size">{(currentTranscript.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                <div className="upload-date">
                  Uploaded: {new Date(currentTranscript.uploadedAt).toLocaleDateString()}
                </div>
                {currentTranscript.verificationStatus && (
                  <div className={`verification-status ${currentTranscript.verificationStatus}`}>
                    {currentTranscript.verificationStatus.charAt(0).toUpperCase() + currentTranscript.verificationStatus.slice(1)}
                  </div>
                )}
              </div>
            </div>
            <div className="transcript-actions">
              <a 
                href={currentTranscript.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-outline"
              >
                View
              </a>
              <label className="btn-secondary">
                Replace
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInput}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="upload-area">
          <div className="upload-content">
            <div className="upload-icon">📤</div>
            <div className="upload-text">
              <p>Upload your academic transcript</p>
              <p className="upload-hint">PDF, JPEG, or PNG (Max 5MB)</p>
            </div>
            <label className="btn-primary">
              {uploading ? 'Uploading...' : 'Choose File'}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInput}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptUpload;