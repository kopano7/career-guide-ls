// src/components/admin/common/QuickActions.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ actions, title = "Quick Actions" }) => {
  const navigate = useNavigate();

  const handleActionClick = (path) => {
    navigate(path);
  };

  return (
    <div className="quick-actions-card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-content">
        <div className="actions-grid">
          {actions.map((action, index) => (
            <button
              key={index}
              className="action-button"
              onClick={() => handleActionClick(action.path)}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <div className="action-label">{action.label}</div>
                <div className="action-description">{action.description}</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;