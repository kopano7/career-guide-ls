import React from 'react';
import { Link } from 'react-router-dom'; // ADD THIS IMPORT
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/pages/dashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  
  console.log('🎯 StudentDashboard: User data:', user);

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header - unchanged */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>🎓 Student Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Welcome back, {user?.name || user?.email}!
          </p>
        </div>
        <button 
          onClick={logout}
          style={{
            padding: '8px 16px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Stats Grid - unchanged */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* ... your stats cards ... */}
      </div>

      {/* Quick Actions - FIXED WITH LINKS */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0 }}>Quick Actions</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {/* Browse Courses - FIXED */}
          <Link 
            to="/student/courses" 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              ':hover': {
                borderColor: '#3b82f6',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎓</div>
              <h4 style={{ margin: 0 }}>Browse Courses</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                Find courses to apply
              </p>
            </div>
          </Link>

          {/* Find Jobs - FIXED (THIS WAS THE PROBLEM) */}
          <Link 
            to="/student/jobs" 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              ':hover': {
                borderColor: '#3b82f6',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>💼</div>
              <h4 style={{ margin: 0 }}>Find Jobs</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                Explore job opportunities
              </p>
            </div>
          </Link>

          {/* Upload Transcript - FIXED */}
          <Link 
            to="/student/profile" 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              ':hover': {
                borderColor: '#3b82f6',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📄</div>
              <h4 style={{ margin: 0 }}>Upload Transcript</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                Submit your documents
              </p>
            </div>
          </Link>

          {/* My Profile - FIXED */}
          <Link 
            to="/student/profile" 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              ':hover': {
                borderColor: '#3b82f6',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>👤</div>
              <h4 style={{ margin: 0 }}>My Profile</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                Update your information
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity - unchanged */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0 }}>Recent Activity</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* ... your activity items ... */}
        </div>
      </div>

      {/* User Info Debug - unchanged */}
      <div style={{
        background: '#f3f4f6',
        padding: '15px',
        borderRadius: '6px',
        fontSize: '14px',
        marginTop: '30px'
      }}>
        <strong>Debug Info:</strong>
        <div>Email: {user?.email}</div>
        <div>Role: {user?.role}</div>
        <div>ID: {user?.id}</div>
        <div>Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</div>
      </div>
    </div>
  );
};

export default StudentDashboard;