// src/components/institute/Profile/InstituteProfile.jsx
import React, { useState, useEffect } from 'react';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
//import './InstituteProfile.css';

const InstituteProfile = () => {
  const { get, put, post } = useApi();
  const { addNotification } = useNotifications();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    description: '',
    institutionType: '',
    establishedYear: '',
    accreditation: '',
    logo: '',
    faculties: []
  });

  // Fetch institute profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await get('/institute/profile');
      if (response.data.success) {
        const profileData = response.data.data.profile;
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || profileData.phoneNumber || '',
          website: profileData.website || '',
          address: profileData.address || '',
          description: profileData.description || '',
          institutionType: profileData.institutionType || '',
          establishedYear: profileData.establishedYear || '',
          accreditation: profileData.accreditation || '',
          logo: profileData.logo || profileData.profileImage || '',
          faculties: profileData.faculties || []
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      addNotification('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle faculty management
  const handleAddFaculty = () => {
    setFormData(prev => ({
      ...prev,
      faculties: [...prev.faculties, { name: '', description: '', departments: [] }]
    }));
  };

  const handleFacultyChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      faculties: prev.faculties.map((faculty, i) => 
        i === index ? { ...faculty, [field]: value } : faculty
      )
    }));
  };

  const handleRemoveFaculty = (index) => {
    setFormData(prev => ({
      ...prev,
      faculties: prev.faculties.filter((_, i) => i !== index)
    }));
  };

  const handleAddDepartment = (facultyIndex) => {
    setFormData(prev => ({
      ...prev,
      faculties: prev.faculties.map((faculty, i) => 
        i === facultyIndex 
          ? { ...faculty, departments: [...faculty.departments, ''] }
          : faculty
      )
    }));
  };

  const handleDepartmentChange = (facultyIndex, deptIndex, value) => {
    setFormData(prev => ({
      ...prev,
      faculties: prev.faculties.map((faculty, i) => 
        i === facultyIndex 
          ? { 
              ...faculty, 
              departments: faculty.departments.map((dept, j) => 
                j === deptIndex ? value : dept
              )
            }
          : faculty
      )
    }));
  };

  const handleRemoveDepartment = (facultyIndex, deptIndex) => {
    setFormData(prev => ({
      ...prev,
      faculties: prev.faculties.map((faculty, i) => 
        i === facultyIndex 
          ? { 
              ...faculty, 
              departments: faculty.departments.filter((_, j) => j !== deptIndex)
            }
          : faculty
      )
    }));
  };

  // Handle logo upload
  const handleLogoUpload = async (file) => {
    if (!file) return;

    try {
      setUploadingLogo(true);
      
      // Create form data for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('logo', file);

      // Upload to your file storage service (e.g., Cloudinary, Firebase Storage)
      const uploadResponse = await post('/upload/logo', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadResponse.data.success) {
        const logoUrl = uploadResponse.data.data.url;
        
        // Update profile with new logo
        const updateResponse = await put('/institute/upload-logo', { logoUrl });
        
        if (updateResponse.data.success) {
          setFormData(prev => ({ ...prev, logo: logoUrl }));
          setProfile(prev => ({ ...prev, logo: logoUrl, profileImage: logoUrl }));
          addNotification('Logo uploaded successfully!', 'success');
        }
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      addNotification('Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      
      // Prepare update data
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        description: formData.description,
        institutionType: formData.institutionType,
        establishedYear: formData.establishedYear,
        accreditation: formData.accreditation,
        logo: formData.logo,
        profileImage: formData.logo
      };

      const response = await put('/institute/profile', updateData);
      
      if (response.data.success) {
        setProfile(response.data.data.profile);
        addNotification('Profile updated successfully!', 'success');
        
        // Sync faculties if they were modified
        if (formData.faculties.length > 0) {
          await syncFaculties();
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification(
        error.response?.data?.message || 'Failed to update profile', 
        'error'
      );
    } finally {
      setUpdating(false);
    }
  };

  // Sync faculties with backend
  const syncFaculties = async () => {
    try {
      // Remove existing faculties first
      const existingFaculties = await get('/institute/faculties');
      
      // Add new faculties
      for (const faculty of formData.faculties) {
        if (faculty.name.trim()) {
          await post('/institute/faculties', {
            name: faculty.name,
            description: faculty.description,
            departments: faculty.departments.filter(dept => dept.trim())
          });
        }
      }
      
      addNotification('Faculties updated successfully!', 'success');
    } catch (error) {
      console.error('Error syncing faculties:', error);
      addNotification('Failed to update faculties', 'error');
    }
  };

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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="institute-profile">
      <div className="profile-header">
        <h1 className="profile-title">Institute Profile</h1>
        <p className="profile-subtitle">Manage your institution's information and settings</p>
      </div>

      <div className="profile-container">
        {/* Navigation Tabs */}
        <div className="profile-tabs">
          <nav className="tab-navigation">
            {['basic', 'academic', 'settings', 'preview'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'basic' && (
            <div className="basic-info">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3 className="section-title">Basic Information</h3>
                  
                  {/* Logo Upload */}
                  <div className="logo-section">
                    <div className="logo-preview">
                      <img 
                        src={formData.logo || '/default-institute-logo.png'} 
                        alt="Institute Logo"
                        className="logo-image"
                      />
                    </div>
                    <div className="logo-actions">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e.target.files[0])}
                        className="file-input"
                        disabled={uploadingLogo}
                      />
                      <label htmlFor="logo-upload" className="upload-button">
                        {uploadingLogo ? 'Uploading...' : 'Change Logo'}
                      </label>
                      <p className="upload-hint">Recommended: 200x200px, PNG or JPG</p>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Institution Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        className="form-input"
                        disabled
                      />
                      <small className="form-hint">Email cannot be changed</small>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="+266 1234 5678"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="https://www.institute.edu.ls"
                      />
                    </div>

                    <div className="form-group col-span-2">
                      <label className="form-label">Address</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="form-textarea"
                        rows="3"
                        placeholder="Full physical address of your institution"
                      />
                    </div>

                    <div className="form-group col-span-2">
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="form-textarea"
                        rows="4"
                        placeholder="Brief description of your institution, mission, and values..."
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="save-button"
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="academic-info">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3 className="section-title">Academic Information</h3>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Institution Type</label>
                      <select
                        name="institutionType"
                        value={formData.institutionType}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="">Select type</option>
                        {institutionTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Established Year</label>
                      <input
                        type="number"
                        name="establishedYear"
                        value={formData.establishedYear}
                        onChange={handleInputChange}
                        className="form-input"
                        min="1900"
                        max={new Date().getFullYear()}
                        placeholder="1990"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Accreditation</label>
                      <select
                        name="accreditation"
                        value={formData.accreditation}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="">Select accreditation</option>
                        {accreditationBodies.map(accreditation => (
                          <option key={accreditation} value={accreditation}>
                            {accreditation}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Faculties Management */}
                <div className="form-section">
                  <div className="section-header">
                    <h3 className="section-title">Faculties & Departments</h3>
                    <button
                      type="button"
                      onClick={handleAddFaculty}
                      className="add-button"
                    >
                      + Add Faculty
                    </button>
                  </div>

                  {formData.faculties.map((faculty, index) => (
                    <div key={index} className="faculty-card">
                      <div className="faculty-header">
                        <input
                          type="text"
                          value={faculty.name}
                          onChange={(e) => handleFacultyChange(index, 'name', e.target.value)}
                          className="form-input faculty-name"
                          placeholder="Faculty Name"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFaculty(index)}
                          className="remove-button"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <textarea
                        value={faculty.description}
                        onChange={(e) => handleFacultyChange(index, 'description', e.target.value)}
                        className="form-textarea faculty-description"
                        placeholder="Faculty description..."
                        rows="2"
                      />

                      <div className="departments-section">
                        <div className="departments-header">
                          <label className="form-label">Departments</label>
                          <button
                            type="button"
                            onClick={() => handleAddDepartment(index)}
                            className="add-department-button"
                          >
                            + Add Department
                          </button>
                        </div>
                        
                        {faculty.departments.map((department, deptIndex) => (
                          <div key={deptIndex} className="department-item">
                            <input
                              type="text"
                              value={department}
                              onChange={(e) => handleDepartmentChange(index, deptIndex, e.target.value)}
                              className="form-input department-input"
                              placeholder="Department name"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveDepartment(index, deptIndex)}
                              className="remove-department-button"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {formData.faculties.length === 0 && (
                    <div className="empty-state">
                      <p>No faculties added yet. Click "Add Faculty" to get started.</p>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="save-button"
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save Academic Info'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-info">
              <div className="form-section">
                <h3 className="section-title">Notification Settings</h3>
                
                <div className="settings-grid">
                  <div className="setting-item">
                    <label className="setting-label">
                      <input type="checkbox" defaultChecked />
                      Email notifications for new applications
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <label className="setting-label">
                      <input type="checkbox" defaultChecked />
                      Application status change alerts
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <label className="setting-label">
                      <input type="checkbox" />
                      SMS notifications
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <label className="setting-label">
                      <input type="checkbox" defaultChecked />
                      Course application deadlines
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Account Status</h3>
                
                <div className="status-card">
                  <div className="status-info">
                    <strong>Current Status:</strong>
                    <span className={`status-badge ${profile?.status || 'pending'}`}>
                      {profile?.status || 'Pending'}
                    </span>
                  </div>
                  
                  {profile?.status === 'pending' && (
                    <div className="status-message">
                      <p>Your account is pending admin approval. You'll be able to access all features once approved.</p>
                    </div>
                  )}
                  
                  {profile?.status === 'approved' && (
                    <div className="status-message">
                      <p>Your account is approved and active. You can manage courses and applications.</p>
                    </div>
                  )}
                  
                  {profile?.approvedAt && (
                    <div className="status-detail">
                      <strong>Approved on:</strong> {new Date(profile.approvedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="preview-info">
              <div className="preview-card">
                <div className="preview-header">
                  <img 
                    src={formData.logo || '/default-institute-logo.png'} 
                    alt="Institute Logo"
                    className="preview-logo"
                  />
                  <div className="preview-title">
                    <h2>{formData.name || 'Institution Name'}</h2>
                    <p className="preview-type">{formData.institutionType || 'Institution Type'}</p>
                  </div>
                </div>

                <div className="preview-details">
                  <div className="detail-row">
                    <strong>Email:</strong> {formData.email || 'Not provided'}
                  </div>
                  <div className="detail-row">
                    <strong>Phone:</strong> {formData.phone || 'Not provided'}
                  </div>
                  <div className="detail-row">
                    <strong>Website:</strong> 
                    {formData.website ? (
                      <a href={formData.website} target="_blank" rel="noopener noreferrer">
                        {formData.website}
                      </a>
                    ) : 'Not provided'}
                  </div>
                  <div className="detail-row">
                    <strong>Address:</strong> {formData.address || 'Not provided'}
                  </div>
                  <div className="detail-row">
                    <strong>Established:</strong> {formData.establishedYear || 'Not provided'}
                  </div>
                  <div className="detail-row">
                    <strong>Accreditation:</strong> {formData.accreditation || 'Not provided'}
                  </div>
                </div>

                <div className="preview-description">
                  <h4>About Us</h4>
                  <p>{formData.description || 'No description provided.'}</p>
                </div>

                {formData.faculties.length > 0 && (
                  <div className="preview-faculties">
                    <h4>Faculties & Departments</h4>
                    {formData.faculties.map((faculty, index) => (
                      <div key={index} className="preview-faculty">
                        <h5>{faculty.name || 'Unnamed Faculty'}</h5>
                        {faculty.description && <p>{faculty.description}</p>}
                        {faculty.departments.length > 0 && (
                          <div className="preview-departments">
                            <strong>Departments:</strong> {faculty.departments.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstituteProfile;