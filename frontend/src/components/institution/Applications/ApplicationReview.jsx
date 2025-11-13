// src/components/institution/Applications/ApplicationReview.jsx
import React, { useState } from 'react';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import './Application.css';

const ApplicationReview = ({ 
  application, 
  onClose, 
  onApplicationUpdate,
  onAdmissionDecision,
  onWaitlist,
  onViewTranscript,
  onDownloadTranscript 
}) => {
  const { put } = useApi();
  const { addNotification } = useNotifications();
  
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Safe application data with fallbacks
  const safeApplication = application || {};
  const {
    id: applicationId,
    studentName = 'Unknown Student',
    studentEmail = 'No email provided',
    applicationNumber = 'N/A',
    status = 'unknown',
    courseName = 'Unknown Course',
    appliedAt,
    isQualified = false,
    qualificationScore = 0,
    qualificationDetails = [],
    transcript,
    course = {},
    waitlistPosition
  } = safeApplication;

  // Early return if no application data
  if (!application) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="text-xl font-bold text-gray-900">Application Not Found</h2>
            <button 
              className="modal-close text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="modal-body text-center py-8">
            
            <p className="text-gray-500 mb-4">Application data is not available.</p>
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleAdmissionDecision = async (status) => {
    if (!window.confirm(`Are you sure you want to ${status} this application?`)) return;

    try {
      setUpdating(true);
      
      if (onAdmissionDecision) {
        await onAdmissionDecision(applicationId, status, feedback);
      } else {
        // Fallback to direct API call
        const response = await put(`/institute/applications/${applicationId}`, {
          status: status,
          notes: feedback || undefined
        });

        if (response.data.success) {
          addNotification(`Application ${status} successfully!`, 'success');
          onApplicationUpdate?.();
          onClose?.();
        }
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

  const handleWaitlist = async () => {
    if (!window.confirm('Are you sure you want to waitlist this application?')) return;

    try {
      setUpdating(true);
      
      if (onWaitlist) {
        await onWaitlist(applicationId);
      } else {
        // Fallback to direct API call
        const response = await put(`/institute/applications/${applicationId}/waitlist`);
        
        if (response.data.success) {
          addNotification('Application waitlisted successfully!', 'success');
          onApplicationUpdate?.();
          onClose?.();
        }
      }
    } catch (error) {
      console.error('Error waitlisting application:', error);
      addNotification('Error waitlisting application', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadTranscript = () => {
    if (onDownloadTranscript) {
      onDownloadTranscript(safeApplication);
    } else if (transcript?.url) {
      // Fallback download logic
      const link = document.createElement('a');
      link.href = transcript.url;
      link.download = `transcript_${studentName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      addNotification('Transcript not available for download', 'warning');
    }
  };

  const handleViewTranscript = () => {
    if (onViewTranscript) {
      onViewTranscript(safeApplication);
    } else if (transcript?.url) {
      window.open(transcript.url, '_blank');
    } else {
      addNotification('Transcript not available for viewing', 'warning');
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      admitted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      waitlisted: 'bg-blue-100 text-blue-800',
      accepted: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderQualificationDetails = () => {
    if (!qualificationDetails || qualificationDetails.length === 0) {
      return <p className="text-gray-500">No specific qualification requirements for this course.</p>;
    }

    return (
      <div className="space-y-3">
        {qualificationDetails.map((detail, index) => (
          <div key={index} className={`p-3 rounded-lg border ${
            detail.meetsRequirement ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{detail.subject || 'Unknown Subject'}</span>
                <span className="text-sm text-gray-600 ml-2">
                  {detail.isRequired ? '(Required)' : '(Optional)'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Required: </span>
                <span className="font-medium">{detail.requiredGrade || 'N/A'}</span>
                <span className="mx-2">→</span>
                <span className="text-gray-600">Student: </span>
                <span className={`font-medium ${
                  detail.meetsRequirement ? 'text-green-700' : 'text-red-700'
                }`}>
                  {detail.studentGrade || 'No grade'}
                </span>
              </div>
            </div>
            <div className={`mt-1 text-sm ${
              detail.meetsRequirement ? 'text-green-700' : 'text-red-700'
            }`}>
              {detail.meetsRequirement ? '✓ Meets requirement' : '✗ Does not meet requirement'}
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Overall Qualification Score:</span>
            <span className="text-lg font-bold" style={{ color: getMatchScoreColor(qualificationScore) }}>
              {qualificationScore}%
            </span>
          </div>
          <div className="mt-2 text-sm text-blue-700">
            {isQualified 
              ? 'Student meets all required qualifications' 
              : 'Student does not meet all required qualifications'
            }
          </div>
        </div>
      </div>
    );
  };

  const renderTranscriptSection = () => {
    if (!transcript) {
      return (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-400 text-4xl mb-2">📄</div>
          <p className="text-gray-500">No transcript uploaded</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">📄</div>
              <div>
                <div className="font-medium text-gray-900">{transcript.name || 'Transcript.pdf'}</div>
                <div className="text-sm text-gray-500">
                  {transcript.size ? `${(transcript.size / 1024 / 1024).toFixed(2)} MB` : 'Size not available'}
                </div>
                {transcript.uploadedAt && (
                  <div className="text-sm text-gray-500">
                    Uploaded: {new Date(transcript.uploadedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleViewTranscript}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                disabled={!transcript?.url}
              >
                View Transcript
              </button>
              <button
                onClick={handleDownloadTranscript}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!transcript?.url}
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
        
        {transcript.grades && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Transcript Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(transcript.grades).map(([subject, grade]) => (
                <div key={subject} className="text-center">
                  <div className="text-sm text-gray-600">{subject}</div>
                  <div className="font-medium text-gray-900">{grade}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content xl">
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900">Review Application</h2>
          <button 
            className="modal-close text-gray-400 hover:text-gray-600"
            onClick={onClose}
            disabled={updating}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Application Header */}
          <div className="bg-white border-b border-gray-200 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{studentName}</h1>
                <p className="text-gray-600">{studentEmail}</p>
                <p className="text-sm text-gray-500">Application: {applicationNumber}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                {waitlistPosition && (
                  <div className="text-sm text-blue-600 mt-1">
                    Waitlist Position: #{waitlistPosition}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'qualifications', 'transcript', 'decision'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Student Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm text-gray-600">Full Name</label>
                        <div className="font-medium">{studentName}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <div className="font-medium">{studentEmail}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Applied Date</label>
                        <div className="font-medium">
                          {formatDate(appliedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Course Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm text-gray-600">Course</label>
                        <div className="font-medium">{courseName}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Faculty</label>
                        <div className="font-medium">{course?.faculty || 'Not specified'}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Qualification Status</label>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: isQualified ? '#10b981' : '#ef4444' 
                            }}
                          ></div>
                          <span className={`font-medium ${
                            isQualified ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {isQualified ? 'Qualified' : 'Not Qualified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Application Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-700">
                        {qualificationScore}%
                      </div>
                      <div className="text-sm text-blue-600">Match Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-700">
                        {qualificationDetails.filter(d => d.isRequired && d.meetsRequirement).length}
                      </div>
                      <div className="text-sm text-blue-600">Met Requirements</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-700">
                        {qualificationDetails.filter(d => d.isRequired).length}
                      </div>
                      <div className="text-sm text-blue-600">Total Requirements</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-700">
                        {course?.availableSeats || 'N/A'}
                      </div>
                      <div className="text-sm text-blue-600">Available Seats</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'qualifications' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Qualification Details</h3>
                {renderQualificationDetails()}
              </div>
            )}

            {activeTab === 'transcript' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Transcript</h3>
                {renderTranscriptSection()}
              </div>
            )}

            {activeTab === 'decision' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Admission Decision</h4>
                  <p className="text-yellow-700 text-sm">
                    Make a final decision on this application. The student will be notified of your decision.
                  </p>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision Feedback (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide constructive feedback to the student about your decision..."
                    rows="4"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleAdmissionDecision('rejected')}
                    disabled={updating || status === 'rejected'}
                    className="bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {updating ? 'Processing...' : 'Reject Application'}
                  </button>

                  <button
                    onClick={handleWaitlist}
                    disabled={updating || status === 'waitlisted'}
                    className="bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {updating ? 'Processing...' : 'Waitlist Student'}
                  </button>

                  <button
                    onClick={() => handleAdmissionDecision('admitted')}
                    disabled={updating || status === 'admitted' || !isQualified}
                    className="bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                    title={!isQualified ? 'Cannot admit unqualified student' : ''}
                  >
                    {updating ? 'Processing...' : 'Admit Student'}
                  </button>
                </div>

                {!isQualified && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm">
                      This student does not meet all course requirements and cannot be admitted.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
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
