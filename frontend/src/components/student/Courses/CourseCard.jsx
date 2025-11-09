// components/student/Courses/CourseCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ 
  course, 
  onApply, 
  applying, 
  applicationStatus, 
  qualificationInfo, 
  profile, 
  applicationBadge 
}) => {
  const getQualificationBadge = () => {
    if (!profile?.grades || Object.keys(profile.grades).length === 0) {
      return {
        type: 'warning',
        text: 'Add grades to check eligibility',
        icon: '⚠️'
      };
    }

    if (qualificationInfo.qualified) {
      return {
        type: 'success',
        text: 'You qualify for this course',
        icon: '✅'
      };
    }

    return {
      type: 'error',
      text: 'Requirements not met',
      icon: '❌'
    };
  };

  const qualificationBadge = getQualificationBadge();

  return (
    <div className={`course-card ${applicationBadge.type}`}>
      {/* Application Eligibility Badge */}
      <div className={`application-badge ${applicationBadge.type}`}>
        <span className="badge-icon">{applicationBadge.icon}</span>
        <span className="badge-text">{applicationBadge.text}</span>
      </div>

      <div className="course-header">
        <h3 className="course-title">{course.name}</h3>
        <span className="course-faculty">{course.faculty}</span>
      </div>

      <div className="course-institution">
        <span className="institution-name">{course.institutionName}</span>
      </div>

      <p className="course-description">{course.description}</p>

      <div className="course-details">
        <div className="detail-item">
          <span className="detail-label">Duration:</span>
          <span className="detail-value">{course.duration} months</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Seats:</span>
          <span className="detail-value">
            {course.availableSeats || course.seats} available
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Applications:</span>
          <span className="detail-value">{course.applicationCount || 0}</span>
        </div>
      </div>

      {/* Qualification Status */}
      <div className={`qualification-status ${qualificationBadge.type}`}>
        <div className="status-header">
          <span className="status-icon">{qualificationBadge.icon}</span>
          <span className="status-text">{qualificationBadge.text}</span>
        </div>
      </div>

      {/* Course Requirements */}
      {course.minimumGrades && Object.keys(course.minimumGrades).length > 0 && (
        <div className="course-requirements">
          <h4>Minimum Requirements:</h4>
          <div className="requirements-list">
            {Object.entries(course.minimumGrades).map(([subject, grade]) => {
              const studentGrade = profile?.grades?.[subject];
              const meetsRequirement = studentGrade && 
                ['A+', 'A', 'B', 'C', 'D', 'E', 'F'].indexOf(studentGrade.toUpperCase()) <= 
                ['A+', 'A', 'B', 'C', 'D', 'E', 'F'].indexOf(grade.toUpperCase());
              
              return (
                <div key={subject} className={`requirement-item ${meetsRequirement ? 'met' : 'not-met'}`}>
                  <span className="requirement-subject">{subject}:</span>
                  <span className="requirement-grade">{grade}</span>
                  {studentGrade && (
                    <span className="student-grade">
                      (Your grade: {studentGrade})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Application Blockers */}
      {applicationStatus.missingTranscript && (
        <div className="application-blocker">
          <div className="blocker-icon">📄❌</div>
          <div className="blocker-text">
            <strong>Transcript Required:</strong> Upload your academic transcript to apply
          </div>
          <Link to="/student/profile" className="btn btn-outline btn-sm">
            Upload Transcript
          </Link>
        </div>
      )}

      {!applicationStatus.missingTranscript && !profile?.transcript?.verified && (
        <div className="application-blocker">
          <div className="blocker-icon">⏳</div>
          <div className="blocker-text">
            <strong>Transcript Pending Verification:</strong> Wait for verification to complete
          </div>
        </div>
      )}

      <div className="course-actions">
        <button
          onClick={onApply}
          disabled={applying || !applicationStatus.canApply}
          className={`btn btn-primary ${applying ? 'loading' : ''}`}
        >
          {applying ? 'Applying...' : 'Apply Now'}
        </button>
        
        {!applicationStatus.canApply && (
          <button className="btn btn-outline">
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCard;