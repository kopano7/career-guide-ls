// src/components/institute/Courses/CourseCard.jsx
import React from 'react';

const CourseCard = ({ course, onEdit, onDelete, onToggleStatus, onViewApplications }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { background: '#d1fae5', color: '#065f46' };
      case 'inactive': return { background: '#f3f4f6', color: '#6b7280' };
      case 'full': return { background: '#fef3c7', color: '#92400e' };
      default: return { background: '#f3f4f6', color: '#6b7280' };
    }
  };

  const statusStyle = getStatusColor(course.status);

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      transition: 'all 0.2s'
    }}>
      {/* Course Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '15px'
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '18px',
            color: '#1f2937'
          }}>
            {course.name}
          </h3>
          <span style={{
            padding: '4px 8px',
            background: statusStyle.background,
            color: statusStyle.color,
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {course.status}
          </span>
        </div>
      </div>

      {/* Course Description */}
      <p style={{
        margin: '0 0 15px 0',
        color: '#6b7280',
        fontSize: '14px',
        lineHeight: '1.4'
      }}>
        {course.description || 'No description provided.'}
      </p>

      {/* Course Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Duration</span>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            {course.duration || 'N/A'}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Faculty</span>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            {course.faculty || 'N/A'}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Seats</span>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            {course.availableSeats || 0}/{course.seats || 0}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Applications</span>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            {course.applicationCount || 0}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={onEdit}
          style={{
            padding: '8px 12px',
            background: 'none',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            flex: 1
          }}
        >
           Edit
        </button>
        <button 
          onClick={onViewApplications}
          style={{
            padding: '8px 12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            flex: 1
          }}
        >
           Applications
        </button>
        <button 
          onClick={onToggleStatus}
          style={{
            padding: '8px 12px',
            background: course.status === 'active' ? '#f59e0b' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {course.status === 'active' ? ' Pause' : ' Activate'}
        </button>
        <button 
          onClick={onDelete}
          style={{
            padding: '8px 12px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
           Delete
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
