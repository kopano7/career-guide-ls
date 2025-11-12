import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
//import './ApplicationModal.css';

const ApplicationModal = ({ course, onClose, onSubmit, loading }) => {
  const [grades, setGrades] = useState({});
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [errors, setErrors] = useState({});

  const { user } = useAuth();

  const commonSubjects = [
    'Mathematics', 'English', 'Physical Science', 'Sesotho', 
    'Biology', 'Physics', 'Chemistry', 'Geography',
    'History', 'Commerce', 'Accounting', 'Computer', 'Economics',
    'Agriculture', 'Development Studies'
  ];

  const gradeOptions = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];

  const handleGradeChange = (subject, grade) => {
    setGrades(prev => ({
      ...prev,
      [subject]: grade
    }));
    
    // Clear error for this subject
    if (errors[subject]) {
      setErrors(prev => ({
        ...prev,
        [subject]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setTranscriptFile(file);
      if (errors.transcriptFile) {
        setErrors(prev => ({ ...prev, transcriptFile: '' }));
      }
    } else {
      setErrors(prev => ({ ...prev, transcriptFile: 'Please upload a PDF file' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Check if grades meet minimum requirements
    if (course.requirements?.minimumGrades) {
      Object.entries(course.requirements.minimumGrades).forEach(([subject, minGrade]) => {
        const studentGrade = grades[subject];
        if (!studentGrade) {
          newErrors[subject] = `Grade for ${subject} is required`;
        } else if (!isGradeSufficient(studentGrade, minGrade)) {
          newErrors[subject] = `Minimum grade required: ${minGrade}`;
        }
      });
    }

    // Check if at least some grades are provided
    if (Object.keys(grades).length === 0) {
      newErrors.general = 'Please enter your grades for relevant subjects';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isGradeSufficient = (studentGrade, minGrade) => {
    const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'A+'];
    const studentIndex = gradeOrder.indexOf(studentGrade);
    const minIndex = gradeOrder.indexOf(minGrade);
    return studentIndex >= minIndex;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSubmit({
      grades,
      transcriptFile
    });
  };

  const getQualificationStatus = () => {
    if (!course.requirements?.minimumGrades) return 'no-requirements';

    const unmetRequirements = Object.entries(course.requirements.minimumGrades).filter(
      ([subject, minGrade]) => {
        const studentGrade = grades[subject];
        return !studentGrade || !isGradeSufficient(studentGrade, minGrade);
      }
    );

    if (unmetRequirements.length === 0) return 'qualified';
    if (unmetRequirements.length === Object.keys(course.requirements.minimumGrades).length) return 'not-qualified';
    return 'partially-qualified';
  };

  const qualificationStatus = getQualificationStatus();
  const qualificationMessages = {
    'no-requirements': { message: 'No specific grade requirements', type: 'info' },
    'qualified': { message: 'You meet all requirements!', type: 'success' },
    'partially-qualified': { message: 'You meet some requirements', type: 'warning' },
    'not-qualified': { message: 'You do not meet the requirements', type: 'error' }
  };

  return (
    <div className="modal-overlay">
      <div className="application-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Apply for {course.name}</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {/* Course Info */}
        <div className="course-info">
          <h3>{course.institutionName}</h3>
          <p>{course.description}</p>
        </div>

        {/* Qualification Status */}
        <div className={`qualification-status ${qualificationStatus}`}>
          <div className="status-icon">
            {qualificationStatus === 'qualified' && '✅'}
            {qualificationStatus === 'partially-qualified' && '⚠️'}
            {qualificationStatus === 'not-qualified' && '❌'}
            {qualificationStatus === 'no-requirements' && 'ℹ️'}
          </div>
          <div className="status-content">
            <h4>{qualificationMessages[qualificationStatus].message}</h4>
            {course.requirements?.minimumGrades && (
              <p>Minimum requirements: {Object.entries(course.requirements.minimumGrades).map(([sub, grade]) => `${sub}: ${grade}`).join(', ')}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="application-form">
          {/* Grades Input */}
          <div className="form-section">
            <h3>Enter Your Grades</h3>
            <p>Provide your grades for the relevant subjects</p>
            
            <div className="grades-grid">
              {commonSubjects.map(subject => (
                <div key={subject} className="grade-input-group">
                  <label className="grade-label">{subject}</label>
                  <select
                    value={grades[subject] || ''}
                    onChange={(e) => handleGradeChange(subject, e.target.value)}
                    className={`grade-select ${errors[subject] ? 'error' : ''}`}
                  >
                    <option value="">Select Grade</option>
                    {gradeOptions.map(grade => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                  {errors[subject] && (
                    <span className="grade-error">{errors[subject]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Transcript Upload */}
          <div className="form-section">
            <h3>Upload Transcript (Optional)</h3>
            <p>Upload your academic transcript for verification</p>
            
            <div className="file-upload">
              <input
                type="file"
                id="transcript"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="transcript" className="file-label">
                {transcriptFile ? transcriptFile.name : 'Choose PDF file'}
              </label>
              {errors.transcriptFile && (
                <span className="file-error">{errors.transcriptFile}</span>
              )}
            </div>
          </div>

          {errors.general && (
            <div className="form-error">
              {errors.general}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || qualificationStatus === 'not-qualified'}
            >
              {loading ? <LoadingSpinner size="small" text="" /> : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;