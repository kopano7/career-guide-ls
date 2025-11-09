import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CompanyDashboard = () => {
  const { user, logout } = useAuth();
  
  console.log('🎯 CompanyDashboard: User data:', user);

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
          <h1 style={{ margin: 0, color: '#333' }}>💼 Company Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Welcome, {user?.companyName || user?.name || user?.email}!
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
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>5</h3>
          <p style={{ margin: 0, color: '#666' }}>Total Jobs</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🟢</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>3</h3>
          <p style={{ margin: 0, color: '#666' }}>Active Jobs</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>47</h3>
          <p style={{ margin: 0, color: '#666' }}>Applicants</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>AI Ready</h3>
          <p style={{ margin: 0, color: '#666' }}>Smart Matching</p>
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
            <h4 style={{ margin: 0 }}>Post New Job</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Create job opportunities
            </p>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔍</div>
            <h4 style={{ margin: 0 }}>Find Candidates</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Browse qualified applicants
            </p>
          </div>

          <div style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏢</div>
            <h4 style={{ margin: 0 }}>Company Profile</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Update company info
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
            <h4 style={{ margin: 0 }}>Analytics</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              View hiring metrics
            </p>
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0 }}>Recent Job Postings</h2>
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
              <h4 style={{ margin: 0 }}>Frontend Developer</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>Remote • Full-time</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ 
                padding: '4px 8px', 
                background: '#d1fae5', 
                color: '#065f46',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                12 applicants
              </span>
              <span style={{ 
                padding: '4px 8px', 
                background: '#fef3c7', 
                color: '#92400e',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                Active
              </span>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            padding: '15px',
            border: '1px solid #f0f0f0',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '20px' }}>🔧</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>DevOps Engineer</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>New York • Contract</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ 
                padding: '4px 8px', 
                background: '#d1fae5', 
                color: '#065f46',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                8 applicants
              </span>
              <span style={{ 
                padding: '4px 8px', 
                background: '#fef3c7', 
                color: '#92400e',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Applicants */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0 }}>Top Applicants</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            padding: '15px',
            border: '1px solid #f0f0f0',
            borderRadius: '6px'
          }}>
            <div style={{ 
              width: '30px', 
              height: '30px', 
              background: '#3b82f6', 
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>1</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>Sarah Johnson</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>Computer Science Graduate</p>
            </div>
            <span style={{ 
              padding: '4px 8px', 
              background: '#e0f2fe', 
              color: '#0369a1',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              95% match
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
            <div style={{ 
              width: '30px', 
              height: '30px', 
              background: '#10b981', 
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>2</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>Michael Chen</h4>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>Software Engineering</p>
            </div>
            <span style={{ 
              padding: '4px 8px', 
              background: '#e0f2fe', 
              color: '#0369a1',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              92% match
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

export default CompanyDashboard;