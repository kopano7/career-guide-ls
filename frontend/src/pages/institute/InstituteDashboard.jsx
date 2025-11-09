import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const InstituteDashboard = () => {
  const { user, logout } = useAuth();
  
  console.log('🎯 InstituteDashboard: User data:', user);

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>🏫 Institute Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Welcome, {user?.institutionName || user?.name || user?.email}!
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

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📚</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>15</h3>
          <p style={{ margin: 0, color: '#666' }}>Total Courses</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>127</h3>
          <p style={{ margin: 0, color: '#666' }}>Applications</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>23</h3>
          <p style={{ margin: 0, color: '#666' }}>Pending Review</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>42</h3>
          <p style={{ margin: 0, color: '#666' }}>Admitted</p>
        </div>
      </div>

      {/* Quick Actions */}
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
          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>➕</div>
            <h4 style={{ margin: 0 }}>Add Course</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Create new course offering
            </p>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📋</div>
            <h4 style={{ margin: 0 }}>Review Applications</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Process student applications
            </p>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏫</div>
            <h4 style={{ margin: 0 }}>Institute Profile</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Update institution info
            </p>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
            <h4 style={{ margin: 0 }}>Reports</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              View admission analytics
            </p>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0 }}>Recent Applications</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            padding: '15px',
            border: '1px solid #f0f0f0',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '20px' }}>⏳</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>Computer Science BSc</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>John Smith • GPA: 3.8/4.0</p>
            </div>
            <span style={{ 
              padding: '4px 8px', 
              background: '#fef3c7', 
              color: '#92400e',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              Under Review
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            padding: '15px',
            border: '1px solid #f0f0f0',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '20px' }}>✅</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>Business Administration</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>Sarah Johnson • GPA: 3.9/4.0</p>
            </div>
            <span style={{ 
              padding: '4px 8px', 
              background: '#d1fae5', 
              color: '#065f46',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              Admitted
            </span>
          </div>
        </div>
      </div>

      {/* Popular Courses */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0 }}>Popular Courses</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            padding: '15px',
            border: '1px solid #f0f0f0',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '20px' }}>💻</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>Computer Science</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>Bachelor of Science</p>
            </div>
            <span style={{ 
              padding: '4px 8px', 
              background: '#e0f2fe', 
              color: '#0369a1',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              45 applications
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            padding: '15px',
            border: '1px solid #f0f0f0',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '20px' }}>📊</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>Business Analytics</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>Master Program</p>
            </div>
            <span style={{ 
              padding: '4px 8px', 
              background: '#e0f2fe', 
              color: '#0369a1',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              32 applications
            </span>
          </div>
        </div>
      </div>

      {/* User Info Debug */}
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

export default InstituteDashboard;