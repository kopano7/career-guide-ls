// src/pages/admin/InstituteApproval.jsx - WITH COMPREHENSIVE DEBUG
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api/admin';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import './InstituteApproval.css';

const InstituteApproval = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [apiStatus, setApiStatus] = useState('unknown');

  // ✅ ADDED: Comprehensive debug function
  const debugAuthFlow = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('=== 🔍 COMPREHENSIVE AUTH DEBUG START ===');
      console.log('🔐 Token exists:', !!token);
      console.log('🔐 Token type:', token?.startsWith('eyJ') ? 'JWT' : 'Unknown');
      console.log('🔐 Token preview:', token?.substring(0, 50));
      console.log('👤 User from context:', user);
      console.log('🔑 Is authenticated:', isAuthenticated);
      console.log('🎯 User role:', user?.role);
      
      // Test the API endpoint directly with detailed logging
      console.log('🌐 Testing API endpoint directly...');
      const testResponse = await fetch('/api/admin/institutes/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🌐 API Response status:', testResponse.status);
      console.log('🌐 API Response ok:', testResponse.ok);
      console.log('🌐 API Response headers:', Object.fromEntries(testResponse.headers.entries()));
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.log('❌ API Error response text:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          console.log('❌ API Error response JSON:', errorJson);
        } catch (e) {
          console.log('❌ API Error response (not JSON):', errorText);
        }
      } else {
        const data = await testResponse.json();
        console.log('✅ API Success response:', data);
      }
      
      // Test the simple auth endpoint if it exists
      console.log('🌐 Testing auth endpoint...');
      try {
        const authTestResponse = await fetch('/api/admin/test-auth', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('🌐 Auth test status:', authTestResponse.status);
        if (authTestResponse.ok) {
          const authData = await authTestResponse.json();
          console.log('✅ Auth test success:', authData);
        }
      } catch (authError) {
        console.log('⚠️ Auth test endpoint not available');
      }
      
      console.log('=== 🔍 COMPREHENSIVE AUTH DEBUG END ===');
    } catch (error) {
      console.error('💥 Debug error:', error);
    }
  };

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
    
    // ✅ ADDED: Run debug on component mount
    console.log('🔄 Component mounted, running auth debug...');
    debugAuthFlow();
    
    fetchPendingInstitutes();
  }, [isAuthenticated, user, navigate]);

  const fetchPendingInstitutes = async () => {
    try {
      console.log('🔄 DEBUG: Starting API call with auth...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔑 Token being sent:', token.substring(0, 20) + '...');
      
      setLoading(true);
      setApiStatus('loading');
      
      const data = await adminAPI.getPendingInstitutes();
      console.log('📨 API response:', data);
      
      if (data && data.success) {
        setApiStatus('success');
        setInstitutes(data.data?.institutes || []);
        console.log(`✅ Loaded ${data.data?.institutes?.length || 0} institutes`);
      } else {
        throw new Error(data?.message || 'API returned unsuccessful response');
      }
      
    } catch (error) {
      console.error('❌ API Error:', error);
      setApiStatus('error');
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        alert('Session expired or invalid. Please login again.');
        logout();
        navigate('/login');
      } else if (error.message.includes('No authentication token')) {
        alert('Not logged in. Please login first.');
        navigate('/login');
      } else {
        alert('Error loading institutes: ' + error.message);
        // Fallback to empty array
        setInstitutes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (instituteId, approved) => {
    try {
      setProcessing(prev => ({ ...prev, [instituteId]: true }));
      
      const data = await adminAPI.approveInstitute(instituteId, approved);
      
      if (data.success) {
        setInstitutes(prev => prev.filter(inst => inst.id !== instituteId));
        alert(`Institute ${approved ? 'approved' : 'rejected'} successfully!`);
      } else {
        throw new Error(data.message || 'Approval failed');
      }
      
    } catch (error) {
      console.error('Error processing approval:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        alert('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        alert('Error processing approval: ' + error.message);
      }
    } finally {
      setProcessing(prev => ({ ...prev, [instituteId]: false }));
    }
  };

  // Add debug buttons to header
  const debugAuth = () => {
    const token = localStorage.getItem('token');
    console.log('🔐 AUTH DEBUG:');
    console.log('   Token:', token ? 'Present' : 'Missing');
    console.log('   User:', user);
    console.log('   Is Authenticated:', isAuthenticated);
    alert('Check console for auth details');
  };

  const testApiWithToken = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🧪 Testing API with token:', token?.substring(0, 20) + '...');
      
      const response = await fetch('http://localhost:5000/api/admin/institutes/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🧪 Response status:', response.status);
      const data = await response.json();
      console.log('🧪 Response data:', data);
      
      if (response.status === 401) {
        alert('❌ 401 Unauthorized - Token is invalid or expired');
      } else if (response.ok) {
        alert('✅ API call successful with current token!');
      } else {
        alert(`API Error: ${response.status} - ${data.message}`);
      }
    } catch (error) {
      console.error('🧪 Test failed:', error);
      alert('Test failed: ' + error.message);
    }
  };

  // ✅ ADDED: Quick manual debug function
  const quickDebug = () => {
    debugAuthFlow();
    alert('Comprehensive debug running - check browser console for details!');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <LoadingSpinner />
          <p>Loading institutes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">🏫 Institute Approvals</h1>
          <p className="page-description">
            Review and approve institution registration requests
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-badge pending">{institutes.length} Pending</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn-refresh" onClick={fetchPendingInstitutes}>
              🔄 Refresh
            </button>
            <button 
              className="btn-refresh" 
              onClick={debugAuth}
              style={{ background: '#8b5cf6' }}
            >
              🔐 Debug Auth
            </button>
            <button 
              className="btn-refresh" 
              onClick={testApiWithToken}
              style={{ background: '#f59e0b' }}
            >
              🧪 Test Token
            </button>
            {/* ✅ ADDED: Quick debug button */}
            <button 
              className="btn-refresh" 
              onClick={quickDebug}
              style={{ background: '#10b981' }}
            >
              🔍 Quick Debug
            </button>
          </div>
        </div>
      </div>

      {/* Rest of your component remains the same */}
      <div className="page-content">
        <div className="content-card">
          <div className="card-header">
            <h3>Pending Institute Registrations</h3>
            <div className="card-subtitle">
              Status: <span style={{ 
                color: apiStatus === 'success' ? '#10b981' : '#ef4444',
                fontWeight: 'bold'
              }}>{apiStatus}</span>
            </div>
          </div>
          <div className="card-content">
            {institutes.length > 0 ? (
              <div className="institutes-list">
                {institutes.map(institute => (
                  <div key={institute.id} className="institute-card">
                    {/* Institute card content */}
                    <div className="institute-info">
                      <div className="institute-main">
                        <h4>{institute.name}</h4>
                        <p className="institute-email">📧 {institute.email}</p>
                        <p className="institute-phone">📞 {institute.phoneNumber || 'No phone'}</p>
                      </div>
                      <div className="institute-details">
                        <div className="detail-item">
                          <strong>📍 Address:</strong>
                          <span>{institute.address || 'Not provided'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>🎓 Type:</strong>
                          <span>{institute.institutionType || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="institute-actions">
                      <div className="action-buttons">
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
                <p>📭 No pending institutes</p>
                <p>All requests have been processed or none found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="debug-info">
          <strong>Authentication Status:</strong>
          <div>User: {user?.email || 'Not logged in'}</div>
          <div>Role: {user?.role || 'Unknown'}</div>
          <div>Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</div>
          <div>API: {apiStatus === 'success' ? '✅ Connected' : '❌ Issue'}</div>
          {/* ✅ ADDED: Quick debug info */}
          <div style={{ marginTop: '10px', padding: '10px', background: '#f3f4f6', borderRadius: '4px' }}>
            <strong>Debug Instructions:</strong>
            <div>1. Click "Quick Debug" button</div>
            <div>2. Check browser console for detailed logs</div>
            <div>3. Look for 401 status codes or JWT errors</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstituteApproval;