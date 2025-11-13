// src/pages/admin/CompanyApproval.jsx - UPDATED FOR REAL BACKEND
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import './CompanyApproval.css';

const CompanyApproval = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [backendStatus, setBackendStatus] = useState('checking');
  const [apiBaseUrl] = useState('https://career-guide-ls.onrender.com');

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      console.log(' Not authenticated, redirecting to login...');
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'admin') {
      console.log('User is not admin, redirecting...');
      alert('Access denied. Admin privileges required.');
      navigate('/dashboard');
      return;
    }
    
    fetchPendingCompanies();
  }, [isAuthenticated, user, navigate]);

  const fetchPendingCompanies = async () => {
    try {
      console.log(' Fetching pending companies from backend...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      setLoading(true);
      setBackendStatus('loading');

      // Direct API call to backend
      const response = await fetch(`${apiBaseUrl}/api/admin/companies/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📨 API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📨 API Response data:', data);

      if (data.success) {
        setBackendStatus('connected');
        const companiesData = data.data?.companies || data.companies || [];
        setCompanies(companiesData);
        console.log(`Loaded ${companiesData.length} pending companies`);
      } else {
        throw new Error(data.message || 'Invalid response format');
      }
      
    } catch (error) {
      console.error('Error fetching companies:', error);
      setBackendStatus('error');
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        alert('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        alert('Access denied. Admin privileges required.');
        navigate('/dashboard');
      } else {
        alert('Error loading companies: ' + error.message);
        // Fallback to demo data
        setCompanies(generateDemoCompanies());
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate realistic demo data
  const generateDemoCompanies = () => {
    return [
      {
        id: 'demo-1',
        name: 'Tech Solutions Inc',
        email: 'hr@techsolutions.com',
        phoneNumber: '+1 (555) 123-4567',
        address: '123 Tech Park, Silicon Valley, CA',
        industry: 'Technology',
        companySize: '51-200 employees',
        foundedYear: '2018',
        website: 'https://techsolutions.com',
        description: 'Leading provider of innovative software solutions for businesses worldwide',
        createdAt: new Date('2024-01-15').toISOString()
      },
      {
        id: 'demo-2',
        name: 'Green Energy Corp',
        email: 'careers@greenenergy.com',
        phoneNumber: '+1 (555) 987-6543',
        address: '456 Renewable Street, Eco City',
        industry: 'Energy & Utilities',
        companySize: '201-500 employees',
        foundedYear: '2015',
        website: 'https://greenenergy.com',
        description: 'Pioneering sustainable energy solutions for a cleaner future',
        createdAt: new Date('2024-01-20').toISOString()
      },
      {
        id: 'demo-3',
        name: 'Creative Marketing Agency',
        email: 'info@creativemarketing.com',
        phoneNumber: '+1 (555) 456-7890',
        address: '789 Innovation Drive, Marketing District',
        industry: 'Marketing & Advertising',
        companySize: '11-50 employees',
        foundedYear: '2020',
        website: 'https://creativemarketing.com',
        description: 'Full-service digital marketing agency specializing in brand growth',
        createdAt: new Date('2024-01-25').toISOString()
      },
      {
        id: 'demo-4',
        name: 'Healthcare Innovations',
        email: 'admin@healthcareinnovations.com',
        phoneNumber: '+1 (555) 321-0987',
        address: '321 Medical Center, Health City',
        industry: 'Healthcare',
        companySize: '501-1000 employees',
        foundedYear: '2012',
        website: 'https://healthcareinnovations.com',
        description: 'Advancing medical technology and healthcare solutions',
        createdAt: new Date('2024-01-28').toISOString()
      }
    ];
  };

  const handleApproval = async (companyId, approved) => {
    try {
      console.log(` Processing ${approved ? 'approval' : 'rejection'} for company:`, companyId);
      
      setProcessing(prev => ({ ...prev, [companyId]: true }));

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      // Direct API call for approval/rejection
      const response = await fetch(`${apiBaseUrl}/api/admin/companies/${companyId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approved })
      });

      console.log(' Approval response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(' Approval response data:', data);

      if (data.success) {
        // Remove the company from the list
        setCompanies(prev => prev.filter(company => company.id !== companyId));
        
        // Show success notification
        if (approved) {
          alert(' Company approved! They can now access the platform and post jobs.');
        } else {
          alert(' Company rejected. They will be notified of the decision.');
        }
      } else {
        throw new Error(data.message || 'Approval process failed');
      }
      
    } catch (error) {
      console.error(' Error processing approval:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        alert('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        alert('Access denied. Admin privileges required.');
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setProcessing(prev => ({ ...prev, [companyId]: false }));
    }
  };

  const testBackendConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/health`);
      
      if (response.ok) {
        alert(` Backend is running at ${apiBaseUrl}`);
      } else {
        alert(` Backend returned ${response.status}`);
      }
    } catch (error) {
      alert(` Cannot connect to backend: ${error.message}`);
    }
  };

  const viewCompanyDetails = (company) => {
    const details = `
 Company Details:

Name: ${company.name}
Email: ${company.email}
Phone: ${company.phoneNumber || 'Not provided'}
Address: ${company.address || 'Not provided'}
Industry: ${company.industry || 'Not specified'}
Company Size: ${company.companySize || 'Not specified'}
Founded: ${company.foundedYear || 'Not specified'}
Website: ${company.website || 'Not provided'}
Description: ${company.description || 'No description provided'}
Registered: ${company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'Unknown'}
    `;
    alert(details);
  };

  const openWebsite = (url) => {
    if (url && !url.startsWith('http')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <LoadingSpinner />
          <p>Loading pending companies...</p>
          <div className="loading-details">
            <div>Backend: {apiBaseUrl}</div>
            <div>Status: {backendStatus}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            Company Approvals
            <span className={`status-badge ${backendStatus}`}>
              {backendStatus === 'connected' ? 'LIVE' : 'DEMO'}
            </span>
          </h1>
          <p className="page-description">
            Review and approve company registration requests
            {backendStatus !== 'connected' && (
              <span className="demo-notice"> • Using demo data</span>
            )}
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-badge pending">
            {companies.length} Pending
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={fetchPendingCompanies}>
             Refresh
            </button>
            <button 
              className="btn-test" 
              onClick={testBackendConnection}
            >
               Test Connection
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status Banner */}
      {backendStatus !== 'connected' && (
        <div className="connection-banner warning">
          <div className="banner-content">
            
            <div className="banner-text">
              <strong>Backend Connection Issue</strong>
              <p>Displaying demo data. Real company data will appear when backend is connected.</p>
            </div>
          </div>
          <button onClick={fetchPendingCompanies} className="banner-action">
            Retry Connection
          </button>
        </div>
      )}

      <div className="page-content">
        <div className="content-card">
          <div className="card-header">
            <h3>Pending Company Registrations</h3>
            <div className="card-subtitle">
              {companies.length} company(s) awaiting review
            </div>
          </div>
          
          <div className="card-content">
            {companies.length > 0 ? (
              <div className="companies-list">
                {companies.map(company => (
                  <div key={company.id} className="company-card">
                    <div className="company-header">
                      <div className="company-avatar">
                        <div className="avatar-placeholder">
                          {company.name ? company.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                      </div>
                      <div className="company-main">
                        <h4 className="company-name">{company.name}</h4>
                        <p className="company-email"> {company.email}</p>
                        <p className="company-phone"> {company.phoneNumber || 'No phone provided'}</p>
                        {company.website && (
                          <p className="company-website">
                            {' '}
                            <button 
                              className="website-link"
                              onClick={() => openWebsite(company.website)}
                            >
                              {company.website}
                            </button>
                          </p>
                        )}
                      </div>
                      <div className="company-meta">
                        <span className="industry-badge">{company.industry || 'Unknown Industry'}</span>
                        <span className="size-badge">{company.companySize || 'Unknown Size'}</span>
                        <span className="date-badge">
                          Applied: {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <div className="company-details">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <strong> Industry:</strong>
                          <span>{company.industry || 'Not specified'}</span>
                        </div>
                        <div className="detail-item">
                          <strong> Company Size:</strong>
                          <span>{company.companySize || 'Not specified'}</span>
                        </div>
                        <div className="detail-item">
                          <strong> Founded:</strong>
                          <span>{company.foundedYear || 'Not specified'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Address:</strong>
                          <span>{company.address || 'Not provided'}</span>
                        </div>
                      </div>

                      {company.description && (
                        <div className="company-description">
                          <strong> Company Description:</strong>
                          <p className="description-text">{company.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="company-actions">
                      <div className="action-buttons">
                        <button 
                          className="btn-view"
                          onClick={() => viewCompanyDetails(company)}
                        >
                           View Details
                        </button>
                        <button 
                          className="btn-success"
                          onClick={() => handleApproval(company.id, true)}
                          disabled={processing[company.id]}
                        >
                          {processing[company.id] ? } Approve
                        </button>
                        <button 
                          className="btn-danger"
                          onClick={() => handleApproval(company.id, false)}
                          disabled={processing[company.id]}
                        >
                          {processing[company.id] ? } Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
               
                <h4>No Pending Companies</h4>
                <p>All registration requests have been processed.</p>
                {backendStatus === 'connected' ? (
                  <p className="empty-subtitle">Great job! Check back later for new submissions.</p>
                ) : (
                  <p className="empty-subtitle">When connected to backend, real data will appear here.</p>
                )}
                <button onClick={fetchPendingCompanies} className="btn-retry">
                  Check for New Requests
                </button>
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="system-info">
          <h4>System Information</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Backend Status:</span>
              <span className={`info-value ${backendStatus}`}>
                {backendStatus === 'connected' ? ' Connected' : ' Disconnected'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Server URL:</span>
              <span className="info-value">{apiBaseUrl}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Pending Companies:</span>
              <span className="info-value">{companies.length}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Data Source:</span>
              <span className="info-value">
                {backendStatus === 'connected' ? 'Firebase Database' : 'Demo Data'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyApproval;
