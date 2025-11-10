// src/pages/institute/InstitutionProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import useNotifications from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';

const InstitutionProfile = () => {
  const { user, refreshUser } = useAuth();
  const { get, put, post } = useApi();
  const { addNotification } = useNotifications();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get('/institute/profile');
      
      if (response.data.success) {
        setProfile(response.data.profile);
        setFormData(response.data.profile);
      } else {
        throw new Error(response.data.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
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
        refreshUser(); // Refresh auth context
      } else {
        throw new Error(response.data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
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

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  // Show error state
  if (error && !profile) {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <h3 className="text-red-800 font-medium mb-2">Failed to Load Profile</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="relative">
                {profile?.logo ? (
                  <img
                    src={profile.logo}
                    alt={`${profile.name} logo`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                    <span className="text-blue-600 font-bold text-xl">
                      {profile?.name?.charAt(0) || 'I'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile?.name}</h1>
                <p className="text-gray-600 mt-1">{profile?.institutionType || 'Educational Institution'}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user?.status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : user?.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                  {user?.isEmailVerified && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Email Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {!editing ? (
                <button 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button 
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    onClick={() => {
                      setEditing(false);
                      setFormData(profile);
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button 
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              <strong>Note:</strong> {error}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institute Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-900 font-medium">{profile.name}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="text-gray-900">{user?.email}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone || formData.phoneNumber || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-900">{profile.phone || profile.phoneNumber || 'Not provided'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                {editing ? (
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                ) : (
                  <div className="text-gray-900">
                    {profile.website ? (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {profile.website}
                      </a>
                    ) : 'Not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {editing ? (
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-900">{profile.address || 'Not provided'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                {editing ? (
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="4"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your institution, programs, facilities, and achievements..."
                  />
                ) : (
                  <div className="text-gray-900 whitespace-pre-line">
                    {profile.description || 'No description provided'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstituteProfile;
