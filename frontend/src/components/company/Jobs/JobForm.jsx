import React, { useState, useEffect } from 'react';
import './JobForm.css';

const JobForm = ({ mode = 'create', job = null, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [''],
    qualifications: [''],
    deadline: '',
    location: 'Remote',
    jobType: 'full-time',
    salaryRange: { min: '', max: '', currency: 'USD' },
    experience: '0 years'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && job) {
      // Convert Firestore timestamps to date strings if needed
      const deadline = job.deadline?.toDate ? job.deadline.toDate() : new Date(job.deadline);
      
      setFormData({
        title: job.title || '',
        description: job.description || '',
        requirements: job.requirements && job.requirements.length > 0 ? job.requirements : [''],
        qualifications: job.qualifications && job.qualifications.length > 0 ? job.qualifications : [''],
        deadline: deadline ? deadline.toISOString().split('T')[0] : '',
        location: job.location || 'Remote',
        jobType: job.jobType || 'full-time',
        salaryRange: job.salaryRange || { min: '', max: '', currency: 'USD' },
        experience: job.experience || '0 years'
      });
    }
  }, [mode, job]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Application deadline is required';
    } else if (new Date(formData.deadline) <= new Date()) {
      newErrors.deadline = 'Deadline must be in the future';
    }

    if (formData.requirements.filter(req => req.trim() !== '').length === 0) {
      newErrors.requirements = 'At least one requirement is required';
    }

    if (formData.qualifications.filter(qual => qual.trim() !== '').length === 0) {
      newErrors.qualifications = 'At least one qualification is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSalaryChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      salaryRange: {
        ...prev.salaryRange,
        [field]: value
      }
    }));
  };

  const handleArrayFieldChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));

    // Clear array field errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Filter out empty requirements and qualifications
      const submitData = {
        ...formData,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        qualifications: formData.qualifications.filter(qual => qual.trim() !== ''),
        deadline: new Date(formData.deadline).toISOString()
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content job-form-modal">
        <div className="modal-header">
          <h2>{mode === 'create' ? 'Post New Job' : 'Edit Job'}</h2>
          <button 
            type="button"
            className="close-button" 
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="job-form">
          <div className="form-grid">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="title">Job Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Senior Frontend Developer"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Job Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                  >
                    <option value="Remote">Remote</option>
                    <option value="Maseru">Maseru</option>
                    <option value="Johannesburg">Johannesburg</option>
                    <option value="Cape Town">Cape Town</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="jobType">Job Type</label>
                  <select
                    id="jobType"
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleInputChange}
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Requirements & Qualifications */}
            <div className="form-section">
              <h3>Requirements & Qualifications</h3>

              <div className="form-group">
                <label>Requirements *</label>
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="array-field-group">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                      placeholder="e.g., React, Node.js, MongoDB"
                      className={errors.requirements ? 'error' : ''}
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        className="remove-field"
                        onClick={() => removeArrayField('requirements', index)}
                        disabled={loading}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-field"
                  onClick={() => addArrayField('requirements')}
                  disabled={loading}
                >
                  + Add Requirement
                </button>
                {errors.requirements && <span className="error-message">{errors.requirements}</span>}
              </div>

              <div className="form-group">
                <label>Qualifications *</label>
                {formData.qualifications.map((qualification, index) => (
                  <div key={index} className="array-field-group">
                    <input
                      type="text"
                      value={qualification}
                      onChange={(e) => handleArrayFieldChange('qualifications', index, e.target.value)}
                      placeholder="e.g., Bachelor's in Computer Science"
                      className={errors.qualifications ? 'error' : ''}
                    />
                    {formData.qualifications.length > 1 && (
                      <button
                        type="button"
                        className="remove-field"
                        onClick={() => removeArrayField('qualifications', index)}
                        disabled={loading}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-field"
                  onClick={() => addArrayField('qualifications')}
                  disabled={loading}
                >
                  + Add Qualification
                </button>
                {errors.qualifications && <span className="error-message">{errors.qualifications}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="experience">Experience Required</label>
                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                >
                  <option value="0 years">No experience</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>
            </div>

            {/* Salary & Deadline */}
            <div className="form-section">
              <h3>Salary & Timeline</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="salaryMin">Salary Range (Min)</label>
                  <input
                    type="number"
                    id="salaryMin"
                    value={formData.salaryRange.min}
                    onChange={(e) => handleSalaryChange('min', e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="salaryMax">Salary Range (Max)</label>
                  <input
                    type="number"
                    id="salaryMax"
                    value={formData.salaryRange.max}
                    onChange={(e) => handleSalaryChange('max', e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="currency">Currency</label>
                  <select
                    id="currency"
                    value={formData.salaryRange.currency}
                    onChange={(e) => handleSalaryChange('currency', e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="ZAR">ZAR</option>
                    <option value="LSL">LSL</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="deadline">Application Deadline *</label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.deadline ? 'error' : ''}
                />
                {errors.deadline && <span className="error-message">{errors.deadline}</span>}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {mode === 'create' ? 'Posting...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Post Job' : 'Update Job'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm;