// src/pages/institute/ApplicationReview.jsx
import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import useNotifications from '../../hooks/useNotifications';
import './Review.css';

// Import both components
import ApplicationManagement from '../../components/institution/Applications/ApplicationManagement';
import ApplicationReview from '../../components/institution/Applications/ApplicationReview';

const ApplicationReviewPage = () => {
  const { get, put } = useApi();
  const { addNotification } = useNotifications();
  
  // State for applications data
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for application review modal
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Fetch applications on component mount
  useEffect(() => {
    fetchApplications();
  }, []);

  // Fetch applications from API
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await get('/institute/applications');
      
      if (response.data.success) {
        setApplications(response.data.applications || []);
      } else {
        addNotification('Failed to load applications', 'error');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      addNotification('Error loading applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening application review
  const handleOpenReview = (application) => {
    setSelectedApplication(application);
    setShowReviewModal(true);
  };

  // Handle closing application review
  const handleCloseReview = () => {
    setSelectedApplication(null);
    setShowReviewModal(false);
  };

  // Handle application status update
  const handleApplicationUpdate = async (applicationId, status, notes = '') => {
    try {
      const response = await put(`/institute/applications/${applicationId}`, {
        status,
        notes: notes || undefined
      });

      if (response.data.success) {
        addNotification(`Application ${status} successfully!`, 'success');
        fetchApplications(); // Refresh the list
        handleCloseReview();
      }
    } catch (error) {
      console.error('Error updating application:', error);
      addNotification(
        error.response?.data?.message || 'Error updating application', 
        'error'
      );
    }
  };

  // Handle waitlist action
  const handleWaitlist = async (applicationId) => {
    try {
      const response = await put(`/institute/applications/${applicationId}/waitlist`);
      
      if (response.data.success) {
        addNotification('Application waitlisted successfully!', 'success');
        fetchApplications(); // Refresh the list
        handleCloseReview();
      }
    } catch (error) {
      console.error('Error waitlisting application:', error);
      addNotification('Error waitlisting application', 'error');
    }
  };

  // Handle transcript viewing
  const handleViewTranscript = (application) => {
    if (application.transcript && application.transcript.url) {
      window.open(application.transcript.url, '_blank');
    } else {
      addNotification('No transcript available for this student', 'warning');
    }
  };

  // Handle transcript download
  const handleDownloadTranscript = (application) => {
    try {
      if (application.transcript && application.transcript.url) {
        const link = document.createElement('a');
        link.href = application.transcript.url;
        link.download = `transcript_${application.studentName}_${application.courseName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification('Transcript download started', 'success');
      } else {
        addNotification('No transcript available for download', 'warning');
      }
    } catch (error) {
      console.error('Error downloading transcript:', error);
      addNotification('Error downloading transcript', 'error');
    }
  };

  return (
    <div className="application-review-page min-h-screen bg-gray-50">
      {/* Main Application Management Component */}
      <ApplicationManagement 
        applications={applications}
        loading={loading}
        onRefresh={fetchApplications}
        onReviewApplication={handleOpenReview}
        onApplicationUpdate={handleApplicationUpdate}
      />

      {/* Application Review Modal */}
      {showReviewModal && selectedApplication && (
        <ApplicationReview
          application={selectedApplication}
          onClose={handleCloseReview}
          onApplicationUpdate={fetchApplications}
          onAdmissionDecision={handleApplicationUpdate}
          onWaitlist={handleWaitlist}
          onViewTranscript={handleViewTranscript}
          onDownloadTranscript={handleDownloadTranscript}
        />
      )}
    </div>
  );
};

export default ApplicationReview;
