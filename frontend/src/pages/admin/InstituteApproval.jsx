// src/pages/admin/InstituteApproval.jsx - UPDATED FOR REAL BACKEND
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import './InstituteApproval.css';

const InstituteApproval = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [backendStatus, setBackendStatus] = useState('checking');
  const [apiBaseUrl] = useState('https://career-guide-ls.onrender.com');

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('🔐 Not authenticated, redirecting to login...');
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'admin') {
      console.log('🚫 User is not admin, redirecting...');
      alert('Access denied. Admin privileges required.');
      navigate('/dashboard');
      return;
    }
    
    fetchPendingInstitutes();
  }, [isAuthenticated, user, navigate]);

  const fetchPendingInstitutes = async () => {
    try {
      console.log('🔄 Fetching pending institutes from backend...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      setLoading(true);
      setBackendStatus('loading');

      // Direct API call to backend
      const response = await fetch(`${apiBaseUrl}/api/admin/institutes/pending`, {
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
        const institutesData = data.data?.institutes || data.institutes || [];
        setInstitutes(institutesData);
        console.log(`✅ Loaded ${institutesData.length} pending institutes`);
      } else {
        throw new Error(data.message || 'Invalid response format');
      }
      
    } catch (error) {
      console.error('❌ Error fetching institutes:', error);
      setBackendStatus('error');
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        alert('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        alert('Access denied. Admin privileges required.');
        navigate('/dashboard');
      } else {
        alert('Error loading institutes: ' + error.message);
        // Fallback to demo data
        setInstitutes(generateDemoInstitutes());
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate realistic demo data
  const generateDemoInstitutes = () => {
    return [
      {
        id: 'demo-1',
        name: 'Global University',
        email: 'admin@globaluniversity.edu',
        phoneNumber: '+1 (555) 123-4567',
        address: '123 Education Street, Knowledge City',
        institutionType: 'University',
        description: 'A leading international university offering diverse programs',
        createdAt: new Date('2024-01-15').toISOString()
      },
      {
        id: 'demo-2',
        name: 'Tech Institute of Science',
        email: 'registrar@techinstitute.edu',
        phoneNumber: '+1 (555) 987-6543',
        address: '456 Innovation Drive, Tech Park',
        institutionType: 'Technical College',
        description: 'Specialized in technology and engineering education',
        createdAt: new Date('2024-01-20').toISOString()
      },
      {
        id: 'demo-3',
        name: 'Community College of Arts',
        email: 'info@communityarts.edu',
        phoneNumber: '+1 (555) 456-7890',
        address: '789 Creative Avenue, Arts District',
        institutionType: 'Community College',
        description: 'Focusing on arts, design, and creative industries',
        createdAt: new Date('2024-01-25').toISOString()
      }
    ];
  };

  const handleApproval = async (instituteId, approved) => {
    try {
      console.log(`🔄 Processing ${approved ? 'approval' : 'rejection'} for institute:`, instituteId);
      
      setProcessing(prev => ({ ...prev, [instituteId]: true }));

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      // Direct API call for approval/rejection
      const response = await fetch(`${apiBaseUrl}/api/admin/institutes/${instituteId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approved })
      });

      console.log('📨 Approval response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('📨 Approval response data:', data);

      if (data.success) {
        // Remove the institute from the list
        setInstitutes(prev => prev.filter(inst => inst.id !== instituteId));
        alert(`Institute ${approved ? 'approved' : 'rejected'} successfully!`);
        
        // Show success notification
        if (approved) {
          alert('✅ Institute approved! They can now access the platform.');
        } else {
          alert('❌ Institute rejected. They will be notified of the decision.');
        }
      } else {
        throw new Error(data.message || 'Approval process failed');
      }
      
    } catch (error) {
      console.error('❌ Error processing approval:', error);
      
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
      setProcessing(prev => ({ ...prev, [instituteId]: false }));
    }
  };

  const testBackendConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/health`);
      
      if (response.ok) {
        alert(`✅ Backend is running at ${apiBaseUrl}`);
      } else {
        alert(`❌ Backend returned ${response.status}`);
      }
    } catch (error) {
      alert(`❌ Cannot connect to backend: ${error.message}`);
    }
  };

  const viewInstituteDetails = (institute) => {
    const details = `
🏫 Institute Details:

Name: ${institute.name}
Email: ${institute.email}
Phone: ${institute.phoneNumber || 'Not provided'}
Address: ${institute.address || 'Not provided'}
Type: ${institute.institutionType || 'Not specified'}
Description: ${institute.description || 'No description provided'}
Registered: ${institute.createdAt ? new Date(institute.createdAt).toLocaleDateString() : 'Unknown'}
    `;
    alert(details);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <LoadingSpinner />
          <p>Loading pending institutes...</p>
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
            🏫 Institute Approvals
            <span className={`status-badge ${backendStatus}`}>
              {backendStatus === 'connected' ? 'LIVE' : 'DEMO'}
            </span>
          </h1>
          <p className="page-description">
            Review and approve institution registration requests
            {backendStatus !== 'connected' && (
              <span className="demo-notice"> • Using demo data</span>
            )}
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-badge pending">
            {institutes.length} Pending
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={fetchPendingInstitutes}>
              🔄 Refresh
            </button>
            <button 
              className="btn-test" 
              onClick={testBackendConnection}
            >
              🔌 Test Connection
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status Banner */}
      {backendStatus !== 'connected' && (
        <div className="connection-banner warning">
          <div className="banner-content">
            <span className="banner-icon">⚠️</span>
            <div className="banner-text">
              <strong>Backend Connection Issue</strong>
              <p>Displaying demo data. Real institute data will appear when backend is connected.</p>
            </div>
          </div>
          <button onClick={fetchPendingInstitutes} className="banner-action">
            Retry Connection
          </button>
        </div>
      )}

      <div className="page-content">
        <div className="content-card">
          <div className="card-header">
            <h3>Pending Institute Registrations</h3>
            <div className="card-subtitle">
              {institutes.length} institute(s) awaiting review
            </div>
          </div>
          
          <div className="card-content">
            {institutes.length > 0 ? (
              <div className="institutes-list">
                {institutes.map(institute => (
                  <div key={institute.id} className="institute-card">
                    <div className="institute-header">
                      <div className="institute-avatar">
                        <div className="avatar-placeholder">
                          {institute.name ? institute.name.charAt(0).toUpperCase() : 'I'}
                        </div>
                      </div>
                      <div className="institute-main">
                        <h4 className="institute-name">{institute.name}</h4>
                        <p className="institute-email">📧 {institute.email}</p>
                        <p className="institute-phone">📞 {institute.phoneNumber || 'No phone provided'}</p>
                      </div>
                      <div className="institute-meta">
                        <span className="type-badge">{institute.institutionType || 'Unknown Type'}</span>
                        <span className="date-badge">
                          Applied: {institute.createdAt ? new Date(institute.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <div className="institute-details">
                      <div className="detail-section">
                        <div className="detail-item">
                          <strong>📍 Address:</strong>
                          <span>{institute.address || 'Not provided'}</span>
                        </div>
                        {institute.description && (
                          <div className="detail-item">
                            <strong>📝 Description:</strong>
                            <span className="description-text">{institute.description}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="institute-actions">
                      <div className="action-buttons">
                        <button 
                          className="btn-view"
                          onClick={() => viewInstituteDetails(institute)}
                        >
                          👁️ View Details
                        </button>
                        <button 
                          className="btn-success"
                          onClick={() => handleApproval(institute.id, true)}
                          disabled={processing[institute.id]}
                        >
                          {processing[institute.id] ? '⏳' : '✅'} Approve
                        </button>
                        <button 
                          className="btn-danger"
                          onClick={() => handleApproval(institute.id, false)}
                          disabled={processing[institute.id]}
                        >
                          {processing[institute.id] ? '⏳' : '❌'} Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <h4>No Pending Institutes</h4>
                <p>All registration requests have been processed.</p>
                {backendStatus === 'connected' ? (
                  <p className="empty-subtitle">Great job! Check back later for new submissions.</p>
                ) : (
                  <p className="empty-subtitle">When connected to backend, real data will appear here.</p>
                )}
                <button onClick={fetchPendingInstitutes} className="btn-retry">
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
                {backendStatus === 'connected' ? '✅ Connected' : '❌ Disconnected'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Server URL:</span>
              <span className="info-value">{apiBaseUrl}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Pending Institutes:</span>
              <span className="info-value">{institutes.length}</span>
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

export default InstituteApproval;
