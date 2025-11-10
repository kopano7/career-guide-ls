// src/components/institute/Profile/InstituteProfile.jsx
import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';

const InstituteProfile = () => {
  const { user } = useAuth();
  const { get, put } = useApi();
  const { addNotification } = useNotifications();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
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
      const response = await put('/institute/profile', formData);
      
      if (response.data.success) {
        addNotification('Profile updated successfully!', 'success');
        setEditing(false);
        setProfile(response.data.profile);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification(
        error.response?.data?.message || 'Error updating profile', 
        'error'
      );
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="institute-profile">
      <div className="page-header">
        <div className="header-content">
          <h1>Institute Profile</h1>
          <p>Manage your institution's information</p>
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
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleSave}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Institute Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              ) : (
                <div className="display-value">{profile.name}</div>
              )}
            </div>

            <div className="form-group">
              <label>Email</label>
              <div className="display-value email">{user?.email}</div>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
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

        <div className="profile-section">
          <h2>Location Information</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Address</label>
              {editing ? (
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="3"
                />
              ) : (
                <div className="display-value">{profile.address || 'Not provided'}</div>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Additional Information</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Description</label>
              {editing ? (
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
    </div>
  );
};

export default InstituteProfile;