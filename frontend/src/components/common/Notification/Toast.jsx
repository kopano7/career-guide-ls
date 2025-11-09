import React from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import './Toast.css';

const Toast = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '💡';
    }
  };

  const getClassName = (type) => {
    return `toast toast-${type}`;
  };

  if (notifications.length === 0) return null;

  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={getClassName(notification.type)}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="toast-icon">
            {getIcon(notification.type)}
          </div>
          <div className="toast-content">
            <div className="toast-title">{notification.title}</div>
            {notification.message && (
              <div className="toast-message">{notification.message}</div>
            )}
          </div>
          <button
            className="toast-close"
            onClick={() => removeNotification(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;