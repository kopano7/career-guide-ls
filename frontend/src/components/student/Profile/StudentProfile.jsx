// src/components/student/Profile/StudentProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import useApi from '/src/hooks/useApi';
import useNotifications  from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import TranscriptUpload from './TranscriptUpload';

const StudentProfile = () => {
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
      const response = await get('/student/profile');
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
      const response = await put('/student/profile', formData);
      
      if (response.data.success) {
        addNotification('Profile updated successfully!', 'success');
        setEditing(false);
        setProfile(response.data.profile);
        refreshUser(); // Update auth context if needed
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="student-profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and academic details</p>
      </div>

      <div className="profile-content">
        {/* Personal Information Section */}
        <div className="profile-section">
          <div className="section-header">
            <h2>Personal Information</h2>
            {!editing ? (
              <button 
                className="btn-outline"
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

          <div className="profile-details-grid">
            <div className="detail-group">
              <label>Full Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.fullName || ''}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="detail-value">{profile.fullName || 'Not provided'}</p>
              )}
            </div>

            <div className="detail-group">
              <label>Email</label>
              <p className="detail-value email">{user?.email}</p>
              <span className="verification-status">
                {user?.isVerified ? '✓ Verified' : '⚠ Not Verified'}
              </span>
            </div>

            <div className="detail-group">
              <label>Phone Number</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="detail-value">{profile.phoneNumber || 'Not provided'}</p>
              )}
            </div>

            <div className="detail-group">
              <label>Date of Birth</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              ) : (
                <p className="detail-value">
                  {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </p>
              )}
            </div>

            <div className="detail-group">
              <label>Address</label>
              {editing ? (
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your address"
                  rows="3"
                />
              ) : (
                <p className="detail-value">{profile.address || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Academic Information Section */}
        <div className="profile-section">
          <h2>Academic Information</h2>
          
          <div className="academic-details-grid">
            <div className="detail-group">
              <label>High School</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.highSchool || ''}
                  onChange={(e) => handleInputChange('highSchool', e.target.value)}
                  placeholder="Enter your high school name"
                />
              ) : (
                <p className="detail-value">{profile.highSchool || 'Not provided'}</p>
              )}
            </div>

            <div className="detail-group">
              <label>Graduation Year</label>
              {editing ? (
                <input
                  type="number"
                  value={formData.graduationYear || ''}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                  placeholder="YYYY"
                  min="2000"
                  max="2030"
                />
              ) : (
                <p className="detail-value">{profile.graduationYear || 'Not provided'}</p>
              )}
            </div>

            <div className="detail-group">
              <label>GPA</label>
              {editing ? (
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="4.0"
                  value={formData.gpa || ''}
                  onChange={(e) => handleInputChange('gpa', e.target.value)}
                  placeholder="0.0 - 4.0"
                />
              ) : (
                <p className="detail-value">{profile.gpa || 'Not provided'}</p>
              )}
            </div>

            <div className="detail-group">
              <label>Academic Interests</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.academicInterests || ''}
                  onChange={(e) => handleInputChange('academicInterests', e.target.value)}
                  placeholder="e.g., Computer Science, Business, Medicine"
                />
              ) : (
                <p className="detail-value">{profile.academicInterests || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Qualifications & Skills Section */}
        <div className="profile-section">
          <h2>Qualifications & Skills</h2>
          
          <div className="qualifications-section">
            <div className="detail-group full-width">
              <label>Skills</label>
              {editing ? (
                <textarea
                  value={formData.skills ? formData.skills.join(', ') : ''}
                  onChange={(e) => handleInputChange('skills', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="List your skills separated by commas"
                  rows="3"
                />
              ) : (
                <div className="skills-list">
                  {profile.skills?.length > 0 ? (
                    profile.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))
                  ) : (
                    <p className="detail-value">No skills listed</p>
                  )}
                </div>
              )}
            </div>

            <div className="detail-group full-width">
              <label>Certifications</label>
              {editing ? (
                <textarea
                  value={formData.certifications ? formData.certifications.join(', ') : ''}
                  onChange={(e) => handleInputChange('certifications', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="List your certifications separated by commas"
                  rows="3"
                />
              ) : (
                <div className="certifications-list">
                  {profile.certifications?.length > 0 ? (
                    profile.certifications.map((cert, index) => (
                      <span key={index} className="cert-tag">{cert}</span>
                    ))
                  ) : (
                    <p className="detail-value">No certifications listed</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transcript Section */}
        <div className="profile-section">
          <h2>Academic Transcript</h2>
          <TranscriptUpload 
            currentTranscript={profile.transcript}
            onTranscriptUpdate={fetchProfile}
          />
        </div>

        {/* Application Statistics */}
        <div className="profile-section">
          <h2>Application Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{profile.applicationStats?.totalApplications || 0}</div>
              <div className="stat-label">Total Applications</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{profile.applicationStats?.pendingApplications || 0}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{profile.applicationStats?.admittedApplications || 0}</div>
              <div className="stat-label">Admitted</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{profile.applicationStats?.rejectedApplications || 0}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;