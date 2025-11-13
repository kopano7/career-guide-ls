// src/components/institute/Courses/CourseForm.jsx
import React, { useState } from 'react';

const CourseForm = ({ mode = 'create', course, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: course?.name || '',
    description: course?.description || '',
    duration: course?.duration || '',
    faculty: course?.faculty || '',
    seats: course?.seats || 50,
    requirements: course?.requirements || {},
    subjectRequirements: course?.subjectRequirements || [] // New field for subject requirements
  });

  const [errors, setErrors] = useState({});
  const [newSubject, setNewSubject] = useState({ 
    subject: '', 
    minGrade: 'C', 
    required: true 
  });

  const availableGrades = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];
  const commonSubjects = [
    'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Computer Science', 'Business Studies',
    'Accounting', 'Economics', 'Art', 'Music', 'Physical Education',
    'Statistics', 'Literature', 'Languages', 'Social Studies'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Course name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
    if (!formData.faculty.trim()) newErrors.faculty = 'Faculty is required';
    if (!formData.seats || formData.seats < 1) newErrors.seats = 'Seats must be at least 1';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSubjectRequirement = () => {
    if (!newSubject.subject.trim()) {
      alert('Please select a subject');
      return;
    }

    const subjectExists = formData.subjectRequirements.some(
      req => req.subject === newSubject.subject
    );

    if (subjectExists) {
      alert('This subject requirement already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      subjectRequirements: [
        ...prev.subjectRequirements,
        {
          subject: newSubject.subject.trim(),
          minGrade: newSubject.minGrade,
          required: newSubject.required
        }
      ]
    }));

    setNewSubject({ subject: '', minGrade: 'C', required: true });
  };

  const handleRemoveSubjectRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      subjectRequirements: prev.subjectRequirements.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submissionData = {
      name: formData.name.toString().trim(),
      description: formData.description.toString().trim(),
      duration: formData.duration.toString(),
      faculty: formData.faculty.toString().trim(),
      seats: parseInt(formData.seats),
      requirements: formData.requirements,
      subjectRequirements: formData.subjectRequirements // Include subject requirements
    };

    console.log(' Submitting course data with subject requirements:', submissionData);
    onSubmit(submissionData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '30px',
      maxWidth: '700px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
        paddingBottom: '15px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>
          {mode === 'create' ? ' Add New Course' : ' Edit Course'}
        </h2>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Course Information */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Basic Information</h3>
          
          {/* Course Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Course Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.name ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="e.g., Computer Science BSc"
            />
            {errors.name && (
              <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.name}
              </span>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows="3"
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.description ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '16px',
                resize: 'vertical'
              }}
              placeholder="Describe the course content, objectives, and outcomes..."
            />
            {errors.description && (
              <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.description}
              </span>
            )}
          </div>

          {/* Duration */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Duration *
            </label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.duration ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="e.g., 4 years, 2 semesters, 6 months"
            />
            {errors.duration && (
              <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.duration}
              </span>
            )}
          </div>

          {/* Faculty */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Faculty/Department *
            </label>
            <input
              type="text"
              value={formData.faculty}
              onChange={(e) => handleChange('faculty', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.faculty ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="e.g., Faculty of Science, Department of Engineering"
            />
            {errors.faculty && (
              <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.faculty}
              </span>
            )}
          </div>

          {/* Seats */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Available Seats *
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={formData.seats}
              onChange={(e) => handleChange('seats', parseInt(e.target.value) || 1)}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.seats ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
            {errors.seats && (
              <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.seats}
              </span>
            )}
          </div>
        </div>

        {/* Subject Requirements Section */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>
            Subject Requirements
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
              (Students must meet these grade requirements to qualify)
            </span>
          </h3>

          {/* Add New Subject Requirement */}
          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#475569' }}>
              Add Subject Requirement
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
              {/* Subject Select */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Subject
                </label>
                <select
                  value={newSubject.subject}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, subject: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select a subject</option>
                  {commonSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              {/* Minimum Grade */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Min Grade
                </label>
                <select
                  value={newSubject.minGrade}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, minGrade: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  {availableGrades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              {/* Required/Optional */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Type
                </label>
                <select
                  value={newSubject.required}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, required: e.target.value === 'true' }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value={true}>Required</option>
                  <option value={false}>Optional</option>
                </select>
              </div>

              {/* Add Button */}
              <div>
                <button
                  type="button"
                  onClick={handleAddSubjectRequirement}
                  disabled={!newSubject.subject}
                  style={{
                    padding: '10px 16px',
                    background: newSubject.subject ? '#3b82f6' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: newSubject.subject ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Current Requirements List */}
          {formData.subjectRequirements.length > 0 ? (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#475569' }}>
                Current Requirements ({formData.subjectRequirements.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.subjectRequirements.map((requirement, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: requirement.required ? '#fef3c7' : '#f0f9ff',
                      border: `1px solid ${requirement.required ? '#fcd34d' : '#7dd3fc'}`,
                      borderRadius: '6px'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>
                        {requirement.subject}
                      </span>
                      <span style={{ margin: '0 8px', color: '#6b7280' }}>•</span>
                      <span style={{ 
                        background: requirement.required ? '#f59e0b' : '#0ea5e9',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Min: {requirement.minGrade}
                      </span>
                      <span style={{ 
                        marginLeft: '8px',
                        background: requirement.required ? '#dc2626' : '#059669',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {requirement.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubjectRequirement(index)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '2px dashed #d1d5db'
            }}>
              
              <p style={{ margin: '0 0 10px 0', color: '#6b7280' }}>
                No subject requirements added yet
              </p>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
                Add subject requirements to automatically check student qualifications
              </p>
            </div>
          )}
        </div>

        {/* General Requirements (Optional) */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>
            Additional Requirements (Optional)
          </h3>
          <textarea
            value={formData.requirements.description || ''}
            onChange={(e) => handleChange('requirements', { 
              ...formData.requirements, 
              description: e.target.value 
            })}
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="e.g., High school diploma, Entrance exam, Interview required, Portfolio submission..."
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            {mode === 'create' ? 'Create Course' : 'Update Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
