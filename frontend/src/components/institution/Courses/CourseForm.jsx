// src/components/institute/Courses/CourseForm.jsx
import React, { useState, useEffect } from 'react';

const CourseForm = ({ mode, course, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    tuitionFee: '',
    requirements: [],
    capacity: '',
    startDate: '',
    applicationDeadline: ''
  });
  const [saving, setSaving] = useState(false);
  const [newRequirement, setNewRequirement] = useState('');

  useEffect(() => {
    if (mode === 'edit' && course) {
      setFormData({
        name: course.name || '',
        description: course.description || '',
        duration: course.duration || '',
        tuitionFee: course.tuitionFee || '',
        requirements: course.requirements || [],
        capacity: course.capacity || '',
        startDate: course.startDate || '',
        applicationDeadline: course.applicationDeadline || ''
      });
    }
  }, [mode, course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(formData);
    setSaving(false);
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{mode === 'create' ? 'Create New Course' : 'Edit Course'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Course Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="Enter course name"
              />
            </div>

            <div className="form-group">
              <label>Duration *</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                required
                placeholder="e.g., 4 years, 2 semesters"
              />
            </div>

            <div className="form-group">
              <label>Tuition Fee ($) *</label>
              <input
                type="number"
                value={formData.tuitionFee}
                onChange={(e) => handleInputChange('tuitionFee', e.target.value)}
                required
                placeholder="Enter tuition fee"
              />
            </div>

            <div className="form-group">
              <label>Capacity *</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                required
                placeholder="Maximum number of students"
              />
            </div>

            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Application Deadline *</label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
                placeholder="Describe the course content, objectives, and outcomes"
                rows="4"
              />
            </div>

            <div className="form-group full-width">
              <label>Requirements</label>
              <div className="requirements-section">
                <div className="requirements-input">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Add a requirement"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                  />
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddRequirement}
                  >
                    Add
                  </button>
                </div>
                <div className="requirements-list">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="requirement-tag">
                      {req}
                      <button 
                        type="button"
                        onClick={() => handleRemoveRequirement(index)}
                        className="remove-tag"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : (mode === 'create' ? 'Create Course' : 'Update Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;