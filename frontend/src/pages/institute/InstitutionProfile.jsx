// src/pages/institute/InstituteProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { useNotifications } from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';

const InstituteProfile = () => {
  const { user, refreshUser } = useAuth();
  const { get, put } = useApi();
  const { addNotification } = useNotifications();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await get('/institute/profile');
      if (response.data.success) {
        setProfile(response.data.profile);
        setFormData(response.data.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      addNotification('Error loading profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await put('/institute/profile', formData);
      
      if (response.data.success) {
        addNotification('Profile updated successfully!', 'success');
        setEditing(false);
        setProfile(response.data.profile);
        refreshUser(); // Update auth context
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification(
        error.response?.data?.message || 'Error updating profile', 
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Institute Profile</h1>
          <p className="page-description">
            Manage your institution's information and settings
          </p>
        </div>
        <div className="header-actions">
          {!editing ? (
            <button 
              className="btn-primary"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setFormData(profile);
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="content-grid">
          {/* Basic Information */}
          <div className="content-card">
            <div className="card-header">
              <h3>Basic Information</h3>
            </div>
            <div className="card-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Institute Name *</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  ) : (
                    <div className="display-value">{profile.name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <div className="display-value email">{user?.email}</div>
                  <div className="verification-status">
                    {user?.isVerified ? '✓ Verified' : '⚠ Not Verified'}
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phoneNumber || ''}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    />
                  ) : (
                    <div className="display-value">{profile.phoneNumber || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Website</label>
                  {editing ? (
                    <input
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://example.com"
                    />
                  ) : (
                    <div className="display-value">
                      {profile.website ? (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer">
                          {profile.website}
                        </a>
                      ) : 'Not provided'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="content-card">
            <div className="card-header">
              <h3>Location Information</h3>
            </div>
            <div className="card-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Address</label>
                  {editing ? (
                    <textarea
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows="3"
                    />
                  ) : (
                    <div className="display-value">{profile.address || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>City</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  ) : (
                    <div className="display-value">{profile.city || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Country</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                    />
                  ) : (
                    <div className="display-value">{profile.country || 'Not provided'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="content-card">
            <div className="card-header">
              <h3>Additional Information</h3>
            </div>
            <div className="card-content">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Description</label>
                  {editing ? (
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your institution, programs, and achievements..."
                      rows="4"
                    />
                  ) : (
                    <div className="display-value">
                      {profile.description || 'No description provided'}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Established Year</label>
                  {editing ? (
                    <input
                      type="number"
                      value={formData.establishedYear || ''}
                      onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                      min="1800"
                      max="2030"
                    />
                  ) : (
                    <div className="display-value">{profile.establishedYear || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Institution Type</label>
                  {editing ? (
                    <select
                      value={formData.institutionType || ''}
                      onChange={(e) => handleInputChange('institutionType', e.target.value)}
                    >
                      <option value="">Select Type</option>
                      <option value="university">University</option>
                      <option value="college">College</option>
                      <option value="polytechnic">Polytechnic</option>
                      <option value="vocational">Vocational School</option>
                      <option value="high-school">High School</option>
                    </select>
                  ) : (
                    <div className="display-value">{profile.institutionType || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Accreditation</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.accreditation || ''}
                      onChange={(e) => handleInputChange('accreditation', e.target.value)}
                      placeholder="e.g., National Accreditation Board"
                    />
                  ) : (
                    <div className="display-value">{profile.accreditation || 'Not provided'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="content-card">
            <div className="card-header">
              <h3>Institution Statistics</h3>
            </div>
            <div className="card-content">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">{profile.stats?.totalCourses || 0}</div>
                  <div className="stat-label">Courses Offered</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{profile.stats?.totalStudents || 0}</div>
                  <div className="stat-label">Students</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{profile.stats?.pendingApplications || 0}</div>
                  <div className="stat-label">Pending Applications</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{profile.stats?.admissionRate || 0}%</div>
                  <div className="stat-label">Admission Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstituteProfile;