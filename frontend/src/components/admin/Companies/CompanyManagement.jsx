// src/components/admin/Companies/CompanyManagement.jsx
import React, { useState, useEffect } from 'react';
import useApi  from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';

const CompanyManagement = () => {
  const { get, put } = useApi();
  const { addNotification } = useNotifications();
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const fetchPendingCompanies = async () => {
    try {
      const response = await get('/admin/companies/pending');
      if (response.data.success) {
        setCompanies(response.data.companies);
      }
    } catch (error) {
      console.error('Error fetching pending companies:', error);
      addNotification('Error loading pending companies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (companyId, approved) => {
    try {
      const response = await put(`/admin/companies/${companyId}/approve`, {
        approved: approved
      });

      if (response.data.success) {
        addNotification(
          `Company ${approved ? 'approved' : 'rejected'} successfully!`, 
          'success'
        );
        fetchPendingCompanies();
      }
    } catch (error) {
      console.error('Error processing company approval:', error);
      addNotification(
        error.response?.data?.message || 'Error processing approval', 
        'error'
      );
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="company-management">
      <div className="management-header">
        <h1>Company Approvals</h1>
        <p>Review and approve company registration requests</p>
        <div className="pending-badge">
          {companies.length} Pending Approval
        </div>
      </div>

      <div className="companies-list">
        {companies.length > 0 ? (
          companies.map(company => (
            <div key={company.id} className="company-card">
              <div className="company-header">
                <div className="company-avatar"></div>
                <div className="company-info">
                  <h3>{company.name}</h3>
                  <p className="company-email">{company.email}</p>
                  <p className="company-phone">{company.phoneNumber || 'No phone provided'}</p>
                </div>
              </div>

              <div className="company-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Industry:</strong>
                    <span>{company.industry || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Company Size:</strong>
                    <span>{company.companySize || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Founded:</strong>
                    <span>{company.foundedYear || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Website:</strong>
                    <span>
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer">
                          {company.website}
                        </a>
                      ) : 'Not provided'}
                    </span>
                  </div>
                </div>

                {company.description && (
                  <div className="description-section">
                    <strong>Company Description:</strong>
                    <p>{company.description}</p>
                  </div>
                )}

                <div className="address-section">
                  <strong>Address:</strong>
                  <p>{company.address || 'Not provided'}</p>
                </div>
              </div>

              <div className="company-footer">
                <div className="registration-date">
                  Registered: {new Date(company.createdAt).toLocaleDateString()}
                </div>
                <div className="approval-actions">
                  <button 
                    className="btn-success"
                    onClick={() => handleApproval(company.id, true)}
                  >
                    Approve Company
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleApproval(company.id, false)}
                  >
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No pending company approvals</p>
            <p>All company registration requests have been processed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyManagement;
