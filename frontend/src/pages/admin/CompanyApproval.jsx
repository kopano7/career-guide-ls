// src/pages/admin/CompanyApproval.jsx
import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import useNotifications from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';

const CompanyApproval = () => {
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Company Approvals</h1>
          <p className="page-description">
            Review and approve company registration requests
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-badge pending">{companies.length} Pending Approval</div>
        </div>
      </div>

      <div className="page-content">
        <div className="content-card">
          <div className="card-header">
            <h3>Pending Company Registrations</h3>
          </div>
          <div className="card-content">
            {companies.length > 0 ? (
              <div className="companies-list">
                {companies.map(company => (
                  <div key={company.id} className="company-card">
                    <div className="company-info">
                      <div className="company-main">
                        <h4>{company.name}</h4>
                        <p className="company-email">{company.email}</p>
                        <p className="company-phone">{company.phoneNumber || 'No phone provided'}</p>
                      </div>
                      
                      <div className="company-details">
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
                        <div className="company-description">
                          <strong>Company Description:</strong>
                          <p>{company.description}</p>
                        </div>
                      )}

                      <div className="company-address">
                        <strong>Address:</strong>
                        <span>{company.address || 'Not provided'}</span>
                      </div>
                    </div>

                    <div className="company-actions">
                      <div className="action-buttons">
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
                      <div className="registration-date">
                        Registered: {new Date(company.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No pending company approvals</p>
                <p className="empty-description">
                  All company registration requests have been processed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyApproval;