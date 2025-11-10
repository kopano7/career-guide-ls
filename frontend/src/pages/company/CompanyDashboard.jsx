import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { companyAPI } from '../../services/api/company';

const CompanyDashboard = () => {
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
      const response = await companyAPI.getDashboardData();
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#d1fae5';
      case 'closed': return '#f3f4f6';
      case 'draft': return '#fef3c7';
      default: return '#f3f4f6';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'active': return '#065f46';
      case 'closed': return '#6b7280';
      case 'draft': return '#92400e';
      default: return '#6b7280';
    }
  };

  const getJobTypeIcon = (jobType) => {
    switch (jobType) {
      case 'remote': return '🏠';
      case 'hybrid': return '🔀';
      case 'part-time': return '⏰';
      default: return '🏢';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</div>
        <button 
          onClick={fetchDashboardData}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, recentJobs } = dashboardData || {};

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
            {user?.status === 'pending' && (
              <span style={{ 
                marginLeft: '10px', 
                padding: '2px 8px', 
                background: '#fef3c7', 
                color: '#92400e',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                ⏳ Pending Approval
              </span>
            )}
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
          <h3 style={{ margin: 0, fontSize: '24px' }}>{stats?.totalJobs || 0}</h3>
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
          <h3 style={{ margin: 0, fontSize: '24px' }}>{stats?.activeJobs || 0}</h3>
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
          <h3 style={{ margin: 0, fontSize: '24px' }}>{stats?.totalApplicants || 0}</h3>
          <p style={{ margin: 0, color: '#666' }}>Total Applicants</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>
            {stats?.qualifiedApplicants || 'AI'}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>
            {stats?.qualifiedApplicants ? 'Qualified Matches' : 'Smart Matching'}
          </p>
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
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e0e0e0';
            }}
            onClick={() => window.location.href = '/company/job-management'}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>➕</div>
            <h4 style={{ margin: 0 }}>Post New Job</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Create job opportunities
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
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e0e0e0';
            }}
            onClick={() => window.location.href = '/company/applicant-management'}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔍</div>
            <h4 style={{ margin: 0 }}>Find Candidates</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Browse qualified applicants
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
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e0e0e0';
            }}
            onClick={() => window.location.href = '/company/profile'}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏢</div>
            <h4 style={{ margin: 0 }}>Company Profile</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Update company info
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
            onMouseEnter={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e0e0e0';
            }}
            onClick={() => window.location.href = '/company/job-management'}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📋</div>
            <h4 style={{ margin: 0 }}>Manage Jobs</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              View and edit job postings
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0 }}>Recent Job Postings</h2>
          <button 
            onClick={() => window.location.href = '/company/job-management'}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            View All
          </button>
        </div>
        
        {recentJobs && recentJobs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {recentJobs.map((job, index) => (
              <div 
                key={job.id || index}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  padding: '15px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#f0f0f0';
                }}
                onClick={() => window.location.href = `/company/job-management`}
              >
                <div style={{ fontSize: '20px' }}>
                  {getJobTypeIcon(job.jobType)}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{job.title}</h4>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                    {job.location} • {job.jobType}
                    {job.deadline && (
                      <span> • Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    background: '#d1fae5', 
                    color: '#065f46',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {job.applicationCount || 0} applicants
                  </span>
                  <span style={{ 
                    padding: '4px 8px', 
                    background: getStatusColor(job.status),
                    color: getStatusTextColor(job.status),
                    borderRadius: '12px',
                    fontSize: '12px',
                    textTransform: 'capitalize'
                  }}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div>
            <h4 style={{ margin: '0 0 10px 0' }}>No Jobs Posted Yet</h4>
            <p style={{ margin: 0 }}>Get started by posting your first job opportunity</p>
            <button 
              onClick={() => window.location.href = '/company/job-management'}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Post Your First Job
            </button>
          </div>
        )}
      </div>

      {/* Company Status Alert */}
      {user?.status === 'pending' && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '20px' }}>⏳</div>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: '#92400e' }}>
                Account Pending Approval
              </h4>
              <p style={{ margin: 0, color: '#92400e' }}>
                Your company account is awaiting admin approval. Some features may be limited until your account is approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Requirements Info */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '30px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>🎯 Assignment Features</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px' }}>
          <div>✅ Post job opportunities</div>
          <div>✅ View qualified applicants</div>
          <div>✅ Smart matching algorithm</div>
          <div>✅ Company profile management</div>
          <div>✅ Application statistics</div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;