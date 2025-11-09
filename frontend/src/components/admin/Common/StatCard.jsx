// src/components/admin/common/StatCard.jsx
import React from 'react';

const StatCard = ({ icon, value, label, trend, trendLabel, alert = false }) => {
  const getTrendColor = () => {
    if (trend > 0) return '#10b981'; // Positive - green
    if (trend < 0) return '#ef4444'; // Negative - red
    return '#6b7280'; // Neutral - gray
  };

  const getTrendIcon = () => {
    if (trend > 0) return '↗️';
    if (trend < 0) return '↘️';
    return '➡️';
  };

  return (
    <div className={`stat-card ${alert ? 'alert' : ''}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-number">{value.toLocaleString()}</div>
        <div className="stat-label">{label}</div>
        {trend !== undefined && (
          <div className="stat-trend">
            <span 
              className="trend-value"
              style={{ color: getTrendColor() }}
            >
              {getTrendIcon()} {Math.abs(trend)}%
            </span>
            <span className="trend-label">{trendLabel}</span>
          </div>
        )}
      </div>
      {alert && <div className="stat-alert"></div>}
    </div>
  );
};

export default StatCard;