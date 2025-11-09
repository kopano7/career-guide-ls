// src/components/admin/Institutions/InstituteManagement.jsx
import React, { useState, useEffect } from 'react';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';

const InstituteManagement = () => {
  const { get, put } = useApi();
  const { addNotification } = useNotifications();
  
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingInstitutes();
  }, []);

  const fetchPendingInstitutes = async () => {
    try {
      const response = await get('/admin/institutes/pending');
      if (response.data.success) {
        setInstitutes(response.data.institutes);
      }
    } catch (error) {
      console.error('Error fetching pending institutes:', error);
      addNotification('Error loading pending institutes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (instituteId, approved) => {
    try {
      const response = await put(`/admin/institutes/${instituteId}/approve`, {
        approved: approved
      });

      if (response.data.success) {
        addNotification(
          `Institute ${approved ? 'approved' : 'rejected'} successfully!`, 
          'success'
        );
        fetchPendingInstitutes();
      }
    } catch (error) {
      console.error('Error processing institute approval:', error);
      addNotification(
        error.response?.data?.message || 'Error processing approval', 
        'error'
      );
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="institute-management">
      <div className="management-header">
        <h1>Institute Approvals</h1>
        <p>Review and approve institution registration requests</p>
        <div className="pending-badge">
          {institutes.length} Pending Approval
        </div>
      </div>

      <div className="institutes-list">
        {institutes.length > 0 ? (
          institutes.map(institute => (
            <div key={institute.id} className="institute-card">
              <div className="institute-header">
                <div className="institute-avatar">🏫</div>
                <div className="institute-info">
                  <h3>{institute.name}</h3>
                  <p className="institute-email">{institute.email}</p>
                  <p className="institute-phone">{institute.phoneNumber || 'No phone provided'}</p>
                </div>
              </div>

              <div className="institute-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Address:</strong>
                    <span>{institute.address || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Type:</strong>
                    <span>{institute.institutionType || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Established:</strong>
                    <span>{institute.establishedYear || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Accreditation:</strong>
                    <span>{institute.accreditation || 'Not provided'}</span>
                  </div>
                </div>

                {institute.description && (
                  <div className="description-section">
                    <strong>Description:</strong>
                    <p>{institute.description}</p>
                  </div>
                )}
              </div>

              <div className="institute-footer">
                <div className="registration-date">
                  Registered: {new Date(institute.createdAt).toLocaleDateString()}
                </div>
                <div className="approval-actions">
                  <button 
                    className="btn-success"
                    onClick={() => handleApproval(institute.id, true)}
                  >
                    Approve Institute
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleApproval(institute.id, false)}
                  >
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No pending institute approvals</p>
            <p>All institution registration requests have been processed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstituteManagement;