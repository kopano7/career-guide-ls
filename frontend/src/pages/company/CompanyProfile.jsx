// src/pages/company/CompanyProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { useNotifications } from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';

const CompanyProfile = () => {
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
      const response = await get('/company/profile');
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
      const response = await put('/company/profile', formData);
      
      if (response.data.success) {
        addNotification('Profile updated successfully!', 'success');
        setEditing(false);
        setProfile(response.data.profile);
        refreshUser();
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
          <h1 className="page-title">Company Profile</h1>
          <p className="page-description">
            Manage your company information and settings
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
          {/* Company Information */}
          <div className="content-card">
            <div className="card-header">
              <h3>Company Information</h3>
            </div>
            <div className="card-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name *</label>
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

          {/* Business Details */}
          <div className="content-card">
            <div className="card-header">
              <h3>Business Details</h3>
            </div>
            <div className="card-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Industry</label>
                  {editing ? (
                    <select
                      value={formData.industry || ''}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                    >
                      <option value="">Select Industry</option>
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="finance">Finance</option>
                      <option value="education">Education</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="retail">Retail</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <div className="display-value">{profile.industry || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Company Size</label>
                  {editing ? (
                    <select
                      value={formData.companySize || ''}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                    >
                      <option value="">Select Size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  ) : (
                    <div className="display-value">{profile.companySize || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Founded Year</label>
                  {editing ? (
                    <input
                      type="number"
                      value={formData.foundedYear || ''}
                      onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                      min="1800"
                      max="2030"
                    />
                  ) : (
                    <div className="display-value">{profile.foundedYear || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Company Description</label>
                  {editing ? (
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your company, mission, and values..."
                      rows="4"
                    />
                  ) : (
                    <div className="display-value">
                      {profile.description || 'No description provided'}
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
                <div className="form-group full-width">
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

          {/* Company Statistics */}
          <div className="content-card">
            <div className="card-header">
              <h3>Company Statistics</h3>
            </div>
            <div className="card-content">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">{profile.stats?.activeJobs || 0}</div>
                  <div className="stat-label">Active Jobs</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{profile.stats?.totalApplications || 0}</div>
                  <div className="stat-label">Total Applications</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{profile.stats?.hiredCandidates || 0}</div>
                  <div className="stat-label">Hired Candidates</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{profile.stats?.successRate || 0}%</div>
                  <div className="stat-label">Hiring Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;