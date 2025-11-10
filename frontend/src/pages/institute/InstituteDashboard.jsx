import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { instituteAPI } from '../../services/api/institute';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';

const InstituteDashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Fetching institute dashboard data...');
      
      const response = await instituteAPI.getDashboardData();
      console.log('📥 Dashboard API response:', response);
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('❌ Dashboard data fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    // Navigate to different pages based on action
    console.log('🚀 Quick action:', action);
    // You can use react-router navigation here
    // navigate(`/institute/${action}`);
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error Loading Dashboard</h2>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button 
          onClick={fetchDashboardData}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, recentApplications } = dashboardData || {};

  console.log('🎯 InstituteDashboard: User data:', user);
  console.log('📊 Dashboard stats:', stats);
  console.log('📝 Recent applications:', recentApplications);

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
          {user?.status && (
            <span style={{ 
              padding: '4px 8px', 
              background: user.status === 'approved' ? '#d1fae5' : '#fef3c7',
              color: user.status === 'approved' ? '#065f46' : '#92400e',
              borderRadius: '12px',
              fontSize: '12px',
              marginTop: '5px',
              display: 'inline-block'
            }}>
              Status: {user.status}
            </span>
          )}
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
          <h3 style={{ margin: 0, fontSize: '24px' }}>
            {stats?.totalCourses || 0}
          </h3>
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
          <h3 style={{ margin: 0, fontSize: '24px' }}>
            {stats?.totalApplications || 0}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Total Applications</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>
            {stats?.pendingApplications || 0}
          </h3>
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
          <h3 style={{ margin: 0, fontSize: '24px' }}>
            {stats?.admittedStudents || 0}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Admitted Students</p>
        </div>

        {/* Additional Stats */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>
            {stats?.qualifiedApplications || 0}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Qualified</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🪑</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>
            {stats?.availableSeats || 0}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Available Seats</p>
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
          <div 
            style={{
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => handleQuickAction('courses')}
            onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>➕</div>
            <h4 style={{ margin: 0 }}>Add Course</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Create new course offering
            </p>
          </div>

          <div 
            style={{
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => handleQuickAction('applications')}
            onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📋</div>
            <h4 style={{ margin: 0 }}>Review Applications</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Process student applications
            </p>
          </div>

          <div 
            style={{
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => handleQuickAction('profile')}
            onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏫</div>
            <h4 style={{ margin: 0 }}>Institute Profile</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Update institution info
            </p>
          </div>

          <div 
            style={{
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => handleQuickAction('reports')}
            onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0 }}>Recent Applications</h2>
          <button 
            onClick={() => handleQuickAction('applications')}
            style={{
              padding: '6px 12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            View All
          </button>
        </div>
        
        {recentApplications && recentApplications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {recentApplications.slice(0, 5).map((application) => (
              <div 
                key={application.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  padding: '15px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px'
                }}
              >
                <div style={{ fontSize: '20px' }}>
                  {application.status === 'pending' ? '⏳' : 
                   application.status === 'admitted' ? '✅' : 
                   application.status === 'rejected' ? '❌' : '📄'}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{application.courseName}</h4>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                    {application.studentName} • 
                    GPA: {application.calculatedGPA?.toFixed(2) || 'N/A'} • 
                    {application.isQualified ? ' ✅ Qualified' : ' ❌ Not Qualified'}
                  </p>
                  <small style={{ color: '#999' }}>
                    Applied: {new Date(application.appliedAt).toLocaleDateString()}
                  </small>
                </div>
                <span style={{ 
                  padding: '4px 8px', 
                  background: application.status === 'admitted' ? '#d1fae5' : 
                             application.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                  color: application.status === 'admitted' ? '#065f46' : 
                         application.status === 'rejected' ? '#dc2626' : '#92400e',
                  borderRadius: '12px',
                  fontSize: '12px',
                  textTransform: 'capitalize'
                }}>
                  {application.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📝</div>
            <p>No applications yet</p>
            <p style={{ fontSize: '14px' }}>Applications will appear here when students apply to your courses</p>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={fetchDashboardData}
          style={{
            padding: '8px 16px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          background: '#f3f4f6',
          padding: '15px',
          borderRadius: '6px',
          fontSize: '14px',
          marginTop: '30px',
          fontFamily: 'monospace'
        }}>
          <strong>Debug Info:</strong>
          <div>Email: {user?.email}</div>
          <div>Role: {user?.role}</div>
          <div>Status: {user?.status}</div>
          <div>ID: {user?.id}</div>
          <div>Courses: {stats?.totalCourses}</div>
          <div>Applications: {stats?.totalApplications}</div>
          <div>Recent Apps: {recentApplications?.length}</div>
        </div>
      )}
    </div>
  );
};

export default InstituteDashboard;