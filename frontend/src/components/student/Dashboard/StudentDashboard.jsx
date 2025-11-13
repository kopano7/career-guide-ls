// File: src/components/student/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import LoadingSpinner from '../common/Loading/LoadingSpinner';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    calculateProfileCompletion();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/student/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/student/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const calculateProfileCompletion = async () => {
    try {
      const response = await fetch('/api/student/profile/completion', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfileCompletion(data.percentage || 0);
      }
    } catch (error) {
      console.error('Error calculating profile completion:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await fetch(`/api/student/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'admission_decision':
        navigate('/student/applications');
        break;
      case 'job_match':
        navigate('/student/jobs');
        break;
      case 'course_recommendation':
        navigate('/student/courses');
        break;
      case 'application_update':
        navigate('/student/applications');
        break;
      default:
        break;
    }
  };

  const getApplicationStatusCount = (status) => {
    return dashboardData?.recentApplications?.filter(app => app.status === status).length || 0;
  };

  const getUnreadNotificationsCount = () => {
    return notifications.filter(notification => !notification.read).length;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.firstName || 'Student'}!</h1>
        <p>Here's your academic and career overview</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>{dashboardData?.applicationStats?.totalApplications || 0}</h3>
            <p>Total Applications</p>
          </div>
          <Link to="/student/applications" className="stat-link">View All</Link>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>{getApplicationStatusCount('pending')}</h3>
            <p>Pending Reviews</p>
          </div>
          <Link to="/student/applications" className="stat-link">Check Status</Link>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>{getApplicationStatusCount('admitted')}</h3>
            <p>Admission Offers</p>
          </div>
          <Link to="/student/applications" className="stat-link">View Offers</Link>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>{dashboardData?.jobStats?.matchingJobs || 0}</h3>
            <p>Matching Jobs</p>
          </div>
          <Link to="/student/jobs" className="stat-link">Browse Jobs</Link>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Left Column - Applications & Notifications */}
        <div className="dashboard-left">
          {/* Recent Applications */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Applications</h2>
              <Link to="/student/applications" className="view-all-link">View All</Link>
            </div>
            <div className="applications-list">
              {dashboardData?.recentApplications?.length > 0 ? (
                dashboardData.recentApplications.slice(0, 5).map(application => (
                  <div key={application.id} className="application-item">
                    <div className="application-info">
                      <h4>{application.courseName}</h4>
                      <p>{application.instituteName}</p>
                      <span className="application-date">
                        Applied: {new Date(application.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`application-status ${application.status}`}>
                      {application.status === 'pending' && 'Under Review'}
                      {application.status === 'admitted' && 'Admission Offered'}
                      {application.status === 'rejected' && 'Not Admitted'}
                      {application.status === 'accepted' && 'Accepted'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No applications yet</p>
                  <Link to="/student/courses" className="btn btn-outline">
                    Browse Courses
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Notifications</h2>
              {getUnreadNotificationsCount() > 0 && (
                <span className="notification-count">
                  {getUnreadNotificationsCount()}
                </span>
              )}
            </div>
            <div className="notifications-list">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {!notification.read && <div className="unread-dot"></div>}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No new notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Recommended Jobs */}
        <div className="dashboard-right">
          {/* Quick Actions */}
          <div className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions-grid">
              <Link to="/student/courses" className="quick-action-card">
                <div className="action-icon"></div>
                <h4>Browse Courses</h4>
                <p>Find and apply for courses</p>
              </Link>

              <Link to="/student/jobs" className="quick-action-card">
                <div className="action-icon"></div>
                <h4>Find Jobs</h4>
                <p>Explore job opportunities</p>
              </Link>

              <Link to="/student/profile" className="quick-action-card">
                <div className="action-icon"></div>
                <h4>Update Profile</h4>
                <p>Manage your information</p>
              </Link>

              <Link to="/student/documents" className="quick-action-card">
                <div className="action-icon"></div>
                <h4>Upload Documents</h4>
                <p>Transcripts & certificates</p>
              </Link>
            </div>
          </div>

          {/* Recommended Jobs */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recommended Jobs</h2>
              <Link to="/student/jobs" className="view-all-link">View All</Link>
            </div>
            <div className="recommended-jobs">
              {dashboardData?.recommendedJobs?.length > 0 ? (
                dashboardData.recommendedJobs.slice(0, 3).map(job => (
                  <div key={job.id} className="job-recommendation">
                    <div className="job-info">
                      <h4>{job.title}</h4>
                      <p>{job.companyName} • {job.location}</p>
                      {job.matchScore && (
                        <div 
                          className="match-score"
                          style={{ 
                            color: job.matchScore >= 80 ? '#10b981' : 
                                   job.matchScore >= 60 ? '#f59e0b' : 
                                   '#ef4444' 
                          }}
                        >
                          Match: {job.matchScore}%
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => navigate(`/student/jobs/${job.id}`)}
                      className="btn btn-outline btn-sm"
                    >
                      View
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No job recommendations yet</p>
                  <p className="small-text">Complete your profile for better matches</p>
                </div>
              )}
            </div>
          </div>

          {/* Profile Completion */}
          <div className="dashboard-section">
            <h2>Profile Completion</h2>
            <div className="profile-completion">
              <div className="completion-header">
                <span>{profileCompletion}% Complete</span>
              </div>
              <div className="completion-bar">
                <div 
                  className="completion-progress"
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
              <div className="completion-actions">
                {profileCompletion < 100 ? (
                  <>
                    <p>Complete your profile to get better course and job recommendations</p>
                    <Link to="/student/profile" className="btn btn-primary">
                      Complete Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <p>Your profile is complete! Great job.</p>
                    <Link to="/student/profile" className="btn btn-outline">
                      Update Profile
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          {dashboardData?.upcomingDeadlines?.length > 0 && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Upcoming Deadlines</h2>
              </div>
              <div className="deadlines-list">
                {dashboardData.upcomingDeadlines.slice(0, 3).map(deadline => (
                  <div key={deadline.id} className="deadline-item">
                    <div className="deadline-info">
                      <h4>{deadline.title}</h4>
                      <p>{deadline.description}</p>
                    </div>
                    <div className="deadline-date">
                      {new Date(deadline.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section full-width">
        <div className="section-header">
          <h2>Recent Activity</h2>
        </div>
        <div className="activity-timeline">
          {dashboardData?.recentActivity?.length > 0 ? (
            dashboardData.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-time">
                  {new Date(activity.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="activity-content">
                  <p>{activity.description}</p>
                  <span className="activity-date">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
