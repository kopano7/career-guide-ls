import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { companyAPI } from '../../services/api/company';
import useNotifications from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import './CompanyProfile.css';

const CompanyProfile = () => {
  const { user, logout, refreshUser } = useAuth();
  const { addNotification } = useNotifications();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchCompanyProfile();
    fetchCompanyStats();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching company profile...');
      
      // Use the company profile endpoint
      const response = await companyAPI.getCompanyProfile(user?.id);
      
      if (response.success) {
        const profileData = response.data || response.profile;
        setProfile(profileData);
        setFormData(profileData);
        console.log('✅ Company profile loaded:', profileData);
      } else {
        // Fallback to user data if no company profile exists
        const defaultProfile = {
          name: user.companyName || user.name || '',
          email: user.email,
          phone: user.phone || '',
          address: user.address || '',
          status: user.status || 'pending',
          description: '',
          industry: '',
          companySize: '',
          foundedYear: '',
          website: '',
          city: '',
          country: 'Lesotho'
        };
        setProfile(defaultProfile);
        setFormData(defaultProfile);
      }
    } catch (error) {
      console.error('❌ Error fetching company profile:', error);
      // If endpoint doesn't exist, use user data
      const defaultProfile = {
        name: user.companyName || user.name || '',
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        status: user.status || 'pending',
        description: '',
        industry: '',
        companySize: '',
        foundedYear: '',
        website: '',
        city: '',
        country: 'Lesotho'
      };
      setProfile(defaultProfile);
      setFormData(defaultProfile);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyStats = async () => {
    try {
      const response = await companyAPI.getDashboardData();
      if (response.success) {
        setStats(response.data?.stats || {});
      }
    } catch (error) {
      console.error('Error fetching company stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving company profile:', formData);
      
      // Prepare update data
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        companyName: formData.name,
        description: formData.description,
        industry: formData.industry,
        companySize: formData.companySize,
        foundedYear: formData.foundedYear,
        website: formData.website,
        city: formData.city,
        country: formData.country
      };

      // Remove empty fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null || updateData[key] === '') {
          delete updateData[key];
        }
      });

      // Update profile via API
      const response = await companyAPI.updateProfile(updateData);
      
      if (response.success) {
        addNotification('Company profile updated successfully!', 'success');
        setEditing(false);
        setProfile(formData);
        await refreshUser(); // Refresh user context
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Error updating company profile:', error);
      addNotification(
        error.response?.data?.message || error.message || 'Error updating profile', 
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

  const handleCancelEdit = () => {
    setEditing(false);
    setFormData(profile);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { class: 'status-approved', label: 'Approved', icon: '✅' },
      pending: { class: 'status-pending', label: 'Pending Review', icon: '⏳' },
      suspended: { class: 'status-suspended', label: 'Suspended', icon: '❌' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <LoadingSpinner />
          <p>Loading company profile...</p>
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
            Manage your company information, track hiring metrics, and update settings
          </p>
          <div className="profile-status">
            {getStatusBadge(profile?.status || user?.status)}
            {user?.warningCount > 0 && (
              <span className="warning-badge">
                ⚠️ {user.warningCount} warning{user.warningCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="header-actions">
          {!editing ? (
            <button 
              className="btn-primary"
              onClick={() => setEditing(true)}
              disabled={user?.status === 'suspended'}
            >
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading-spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          🏢 Company Information
        </button>
        <button 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Hiring Analytics
        </button>
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Account Settings
        </button>
      </div>

      <div className="page-content">
        {activeTab === 'profile' && (
          <div className="content-grid">
            {/* Basic Company Information */}
            <div className="content-card">
              <div className="card-header">
                <h3>Basic Information</h3>
                <div className="card-subtitle">
                  Core details about your company
                </div>
              </div>
              <div className="card-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    {editing ? (
                      <input
                        type="text"
                        className="form-input"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        placeholder="Enter your company name"
                      />
                    ) : (
                      <div className="display-value">{profile.name || 'Not provided'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="display-value email">{user?.email}</div>
                    <div className="verification-status">
                      {user?.isEmailVerified ? '✅ Verified' : '⚠️ Not Verified'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    {editing ? (
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+266 1234 5678"
                      />
                    ) : (
                      <div className="display-value">{profile.phone || 'Not provided'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Website</label>
                    {editing ? (
                      <input
                        type="url"
                        className="form-input"
                        value={formData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://example.com"
                      />
                    ) : (
                      <div className="display-value">
                        {profile.website ? (
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="website-link">
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
                <div className="card-subtitle">
                  Industry and company specifics
                </div>
              </div>
              <div className="card-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    {editing ? (
                      <select
                        className="form-select"
                        value={formData.industry || ''}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                      >
                        <option value="">Select Industry</option>
                        <option value="technology">Technology & IT</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="finance">Finance & Banking</option>
                        <option value="education">Education</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="retail">Retail & E-commerce</option>
                        <option value="hospitality">Hospitality & Tourism</option>
                        <option value="construction">Construction</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="display-value">{profile.industry || 'Not specified'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Company Size</label>
                    {editing ? (
                      <select
                        className="form-select"
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
                      <div className="display-value">{profile.companySize || 'Not specified'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Founded Year</label>
                    {editing ? (
                      <input
                        type="number"
                        className="form-input"
                        value={formData.foundedYear || ''}
                        onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                        min="1800"
                        max={new Date().getFullYear()}
                        placeholder="2020"
                      />
                    ) : (
                      <div className="display-value">{profile.foundedYear || 'Not specified'}</div>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Company Description</label>
                    {editing ? (
                      <textarea
                        className="form-textarea"
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your company's mission, values, and what makes you unique..."
                        rows="4"
                      />
                    ) : (
                      <div className="display-value description">
                        {profile.description || 'No description provided. Add a compelling description to attract top talent.'}
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
                <div className="card-subtitle">
                  Where your company is based
                </div>
              </div>
              <div className="card-content">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Full Address</label>
                    {editing ? (
                      <textarea
                        className="form-textarea"
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter your company's physical address"
                        rows="3"
                      />
                    ) : (
                      <div className="display-value">{profile.address || 'Not provided'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">City/Town</label>
                    {editing ? (
                      <input
                        type="text"
                        className="form-input"
                        value={formData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Maseru"
                      />
                    ) : (
                      <div className="display-value">{profile.city || 'Not provided'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Country</label>
                    {editing ? (
                      <select
                        className="form-select"
                        value={formData.country || 'Lesotho'}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                      >
                        <option value="Lesotho">Lesotho</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <div className="display-value">{profile.country || 'Lesotho'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="content-grid">
            {/* Hiring Statistics */}
            <div className="content-card">
              <div className="card-header">
                <h3>Hiring Analytics</h3>
                <div className="card-subtitle">
                  Track your recruitment performance
                </div>
              </div>
              <div className="card-content">
                <div className="stats-grid-large">
                  <div className="stat-card-large">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                      <div className="stat-number">{stats.totalJobs || 0}</div>
                      <div className="stat-label">Total Jobs Posted</div>
                    </div>
                  </div>
                  <div className="stat-card-large">
                    <div className="stat-icon">🟢</div>
                    <div className="stat-content">
                      <div className="stat-number">{stats.activeJobs || 0}</div>
                      <div className="stat-label">Active Jobs</div>
                    </div>
                  </div>
                  <div className="stat-card-large">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <div className="stat-number">{stats.totalApplicants || 0}</div>
                      <div className="stat-label">Total Applicants</div>
                    </div>
                  </div>
                  <div className="stat-card-large">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                      <div className="stat-number">{stats.hiredCandidates || 0}</div>
                      <div className="stat-label">Successful Hires</div>
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">Average Applicants per Job</span>
                    <span className="metric-value">
                      {stats.totalJobs ? Math.round((stats.totalApplicants || 0) / stats.totalJobs) : 0}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Hiring Success Rate</span>
                    <span className="metric-value">
                      {stats.totalApplicants ? Math.round(((stats.hiredCandidates || 0) / stats.totalApplicants) * 100) : 0}%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Platform Member Since</span>
                    <span className="metric-value">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="content-card">
              <div className="card-header">
                <h3>Recent Activity</h3>
              </div>
              <div className="card-content">
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-content">
                      <div className="activity-title">Profile Updated</div>
                      <div className="activity-time">Just now</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">💼</div>
                    <div className="activity-content">
                      <div className="activity-title">New Job Posted</div>
                      <div className="activity-time">2 days ago</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">👥</div>
                    <div className="activity-content">
                      <div className="activity-title">5 New Applicants</div>
                      <div className="activity-time">1 week ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="content-grid">
            {/* Account Settings */}
            <div className="content-card">
              <div className="card-header">
                <h3>Account Settings</h3>
                <div className="card-subtitle">
                  Manage your account preferences and security
                </div>
              </div>
              <div className="card-content">
                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <div className="setting-title">Email Notifications</div>
                      <div className="setting-description">
                        Receive email alerts for new applicants and platform updates
                      </div>
                    </div>
                    <div className="setting-action">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          defaultChecked={user?.emailNotifications !== false}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <div className="setting-title">SMS Notifications</div>
                      <div className="setting-description">
                        Get text message alerts for urgent updates
                      </div>
                    </div>
                    <div className="setting-action">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          defaultChecked={user?.smsNotifications === true}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <div className="setting-title">Two-Factor Authentication</div>
                      <div className="setting-description">
                        Add an extra layer of security to your account
                      </div>
                    </div>
                    <div className="setting-action">
                      <button className="btn-outline sm">Enable</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="content-card">
              <div className="card-header">
                <h3>Account Actions</h3>
              </div>
              <div className="card-content">
                <div className="action-buttons-vertical">
                  <button className="btn-outline full-width">
                    📧 Resend Verification Email
                  </button>
                  <button className="btn-outline full-width">
                    🔑 Change Password
                  </button>
                  <button className="btn-outline full-width">
                    📥 Export Company Data
                  </button>
                  <button 
                    className="btn-danger full-width"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to logout?')) {
                        logout();
                      }
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Warnings & Compliance */}
            {user?.warnings && user.warnings.length > 0 && (
              <div className="content-card warning-card">
                <div className="card-header">
                  <h3>⚠️ Account Warnings</h3>
                </div>
                <div className="card-content">
                  <div className="warnings-list">
                    {user.warnings.map((warning, index) => (
                      <div key={index} className="warning-item">
                        <div className="warning-message">{warning.message}</div>
                        <div className="warning-date">
                          {new Date(warning.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="warning-footer">
                    <p>Please address these issues to maintain full platform access.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfile;