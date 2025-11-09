// src/components/admin/common/RecentActivity.jsx
import React from 'react';

const RecentActivity = ({ activities, title = "Recent Activity" }) => {
  const getActivityIcon = (type) => {
    const icons = {
      user: '👤',
      institute: '🏫',
      company: '💼',
      course: '📚',
      job: '💼',
      system: '⚙️',
      security: '🔒',
      default: '📢'
    };
    return icons[type] || icons.default;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return activityTime.toLocaleDateString();
  };

  return (
    <div className="recent-activity-card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-content">
        {activities.length > 0 ? (
          <div className="activity-list">
            {activities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-content">
                  <div className="activity-message">
                    {activity.description}
                  </div>
                  <div className="activity-meta">
                    <span className="activity-time">
                      {formatTime(activity.timestamp)}
                    </span>
                    {activity.user && (
                      <span className="activity-user">by {activity.user}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;