// src/pages/institute/InstitutionProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import useNotifications from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import '../../App.css';

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
      console.log('Starting profile fetch...');
      
      const response = await get('/institute/profile');
      
      console.log('Full API Response:', response);
      console.log('Response data:', response.data);
      
      // FIX: Handle different response structures
      if (response.data) {
        // Case 1: Direct profile object {profile: {...}}
        if (response.data.profile) {
          console.log('✅ Found profile in response.data.profile');
          setProfile(response.data.profile);
          setFormData(response.data.profile);
        } 
        // Case 2: Nested structure {data: {profile: {...}}}
        else if (response.data.data?.profile) {
          console.log('✅ Found profile in response.data.data.profile');
          setProfile(response.data.data.profile);
          setFormData(response.data.data.profile);
        }
        // Case 3: Direct data {data: {...}} (profile is the data)
        else if (response.data.data) {
          console.log('✅ Found profile in response.data.data');
          setProfile(response.data.data);
          setFormData(response.data.data);
        }
        // Case 4: Success-based structure {success: true, data: {profile: {...}}}
        else if (response.data.success && response.data.data) {
          console.log('✅ Found success-based structure');
          const profileData = response.data.data.profile || response.data.data;
          setProfile(profileData);
          setFormData(profileData);
        }
        else {
          console.warn('Unexpected response structure, using fallback');
          createFallbackProfile();
        }
      } else {
        console.warn('No data in response, using fallback');
        createFallbackProfile();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to load profile. Please try again.';
      
      setError(errorMessage);
      addNotification(errorMessage, 'error');
      createFallbackProfile();
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create fallback profile
  const createFallbackProfile = () => {
    const fallbackProfile = {
      name: user?.institutionName || user?.name || 'Your Institution',
      email: user?.email || '',
      phone: user?.phone || user?.phoneNumber || '',
      website: user?.website || '',
      address: user?.address || '',
      description: user?.description || '',
      institutionType: user?.institutionType || '',
      establishedYear: user?.establishedYear || '',
      accreditation: user?.accreditation || '',
      logo: user?.logo || user?.profileImage || '',
      status: user?.status || 'pending',
      createdAt: user?.createdAt || new Date(),
      updatedAt: user?.updatedAt || new Date()
    };
    
    setProfile(fallbackProfile);
    setFormData(fallbackProfile);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      console.log('Starting profile update...');
      
      // Prepare update data with proper field mapping
      const updateData = {
        name: formData.name || '',
        phone: formData.phone || '',
        website: formData.website || '',
        address: formData.address || '',
        description: formData.description || '',
        institutionType: formData.institutionType || '',
        establishedYear: formData.establishedYear || '',
        accreditation: formData.accreditation || '',
        logo: formData.logo || '',
        profileImage: formData.logo || ''
      };

      // Remove empty fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
          delete updateData[key];
        }
      });

      console.log('Update data:', updateData);

      const response = await put('/institute/profile', updateData);
      
      console.log('Update response:', response);
      
      // Handle different response structures for update
      if (response.data) {
        let updatedProfile;
        
        if (response.data.profile) {
          updatedProfile = response.data.profile;
        } else if (response.data.data?.profile) {
          updatedProfile = response.data.data.profile;
        } else if (response.data.data) {
          updatedProfile = response.data.data;
        } else {
          updatedProfile = formData; // Use current form data as fallback
        }
        
        addNotification('Profile updated successfully!', 'success');
        setEditing(false);
        setProfile(updatedProfile);
        refreshUser(); // Refresh auth context
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error updating profile';
      setError(errorMessage);
      addNotification(errorMessage, 'error');
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

  // Enhanced form data initialization
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || profile.phoneNumber || '',
        website: profile.website || '',
        address: profile.address || '',
        description: profile.description || '',
        institutionType: profile.institutionType || '',
        establishedYear: profile.establishedYear || '',
        accreditation: profile.accreditation || '',
        logo: profile.logo || profile.profileImage || ''
      });
    }
  }, [profile, user]);

  // Institution types for dropdown
  const institutionTypes = [
    'University',
    'College',
    'Technical Institute',
    'Vocational School',
    'Polytechnic',
    'Community College',
    'Other'
  ];

  // Accreditation bodies
  const accreditationBodies = [
    'Council on Higher Education (CHE)',
    'Lesotho Qualifications Authority (LQA)',
    'International Accreditation',
    'Other'
  ];

  // Show loading state
  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800">Debug Info</h3>
            <p className="text-blue-700 text-sm">Profile Loaded: {profile ? 'Yes' : 'No'}</p>
            <p className="text-blue-700 text-sm">Profile Name: {profile?.name || 'None'}</p>
            <p className="text-blue-700 text-sm">Editing Mode: {editing ? 'On' : 'Off'}</p>
            <div className="flex space-x-2 mt-2">
              <button 
                onClick={() => {
                  console.log('Current profile:', profile);
                  console.log('Current formData:', formData);
                  console.log('Current user:', user);
                }}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
              >
                Log State
              </button>
              <button 
                onClick={fetchProfile}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded"
              >
                Reload Profile
              </button>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="relative">
                {profile?.logo || profile?.profileImage ? (
                  <img
                    src={profile.logo || profile.profileImage}
                    alt={`${profile.name} logo`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200 ${
                  (profile?.logo || profile?.profileImage) ? 'hidden' : 'flex'
                }`}>
                  <span className="text-blue-600 font-bold text-xl">
                    {profile?.name?.charAt(0) || 'I'}
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.name || 'Your Institution'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {profile?.institutionType || 'Educational Institution'}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user?.status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : user?.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : user?.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
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
                      setError(null);
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

        {/* Only show form if we have profile data */}
        {profile && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institute Name {editing && <span className="text-red-500">*</span>}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  ) : (
                    <div className="text-gray-900 font-medium">{profile.name}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="text-gray-900">{user?.email}</div>
                  <small className="text-gray-500">Email cannot be changed</small>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+266 1234 5678"
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
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://institute.com"
                    />
                  ) : (
                    <div className="text-gray-900">
                      {profile.website ? (
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {profile.website}
                        </a>
                      ) : 'Not provided'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution Type</label>
                  {editing ? (
                    <select
                      value={formData.institutionType || ''}
                      onChange={(e) => handleInputChange('institutionType', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select type</option>
                      {institutionTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-gray-900">{profile.institutionType || 'Not specified'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Established Year</label>
                  {editing ? (
                    <input
                      type="number"
                      value={formData.establishedYear || ''}
                      onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1900"
                      max={new Date().getFullYear()}
                      placeholder="1990"
                    />
                  ) : (
                    <div className="text-gray-900">{profile.establishedYear || 'Not specified'}</div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accreditation</label>
                  {editing ? (
                    <select
                      value={formData.accreditation || ''}
                      onChange={(e) => handleInputChange('accreditation', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select accreditation</option>
                      {accreditationBodies.map(accreditation => (
                        <option key={accreditation} value={accreditation}>{accreditation}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-gray-900">{profile.accreditation || 'Not specified'}</div>
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
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Full physical address of your institution"
                    />
                  ) : (
                    <div className="text-gray-900 whitespace-pre-line">
                      {profile.address || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About Us</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  {editing ? (
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows="6"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your institution, programs, facilities, mission, vision, and achievements..."
                    />
                  ) : (
                    <div className="text-gray-900 whitespace-pre-line">
                      {profile.description || 'No description provided. Add a description to tell students about your institution.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionProfile;