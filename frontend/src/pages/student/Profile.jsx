// src/pages/student/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import useNotifications from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import StudentProfile from '../../components/student/Profile/StudentProfile';
import TranscriptUpload from '../../components/student/Profile/TranscriptUpload';


const Profile = () => {
  const { user } = useAuth();
  const { get, put } = useApi();
  const { showError, showSuccess } = useNotifications();
  
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    console.log('🔐 Current token check:');
    console.log('   Token:', localStorage.getItem('token'));
    console.log('   Is JWT:', localStorage.getItem('token')?.startsWith('eyJ'));
    
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await get('/student/profile');
      console.log(' Profile API Response:', response);
      
      if (response.success) {
        const profileData = response.data?.profile || {};
        console.log(' Profile data structure:', {
          hasGrades: !!profileData.grades,
          subjectsCount: profileData.subjects?.length || 0,
          hasTranscript: !!profileData.transcript,
          gpa: profileData.gpa
        });
        setProfile(profileData);
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.message !== 'Invalid Firebase token') {
        showError('Error loading profile data', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      console.log(' Saving profile data to database:', updatedData);
      
      const response = await put('/student/profile', updatedData);
      console.log(' Update Profile Response:', response);
      
      if (response.success) {
        const updatedProfile = response.data?.profile || updatedData;
        setProfile(updatedProfile);
        showSuccess('Profile Updated', 'Profile updated successfully and saved to database!');
        
        // Log what was saved for debugging
        console.log(' Profile saved to database with:', {
          gradesCount: Object.keys(updatedProfile.grades || {}).length,
          subjectsCount: updatedProfile.subjects?.length || 0,
          hasTranscript: !!updatedProfile.transcript,
          gpa: updatedProfile.gpa
        });
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Update Failed', error.message || 'Error updating profile. Please try again.');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <LoadingSpinner text="Loading your profile..." />
        </div>
      </div>
    );
  }

  const safeProfile = profile || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">My Profile</h1>
          <p className="page-description">
            Manage your personal information, academic details, and documents. 
            All data is saved to your database and accessible across the platform.
          </p>
          <div style={{ 
            background: '#e8f5e8', 
            padding: '8px 12px', 
            borderRadius: '4px', 
            marginTop: '8px',
            fontSize: '0.9rem'
          }}>
            <strong>Database Connected:</strong> All changes are saved to Firestore
          </div>
        </div>
        <div className="header-actions">
          <div className="verification-badge">
            {user?.isVerified ? (
              <span className="badge verified">✓ Email Verified</span>
            ) : (
              <span className="badge not-verified">⚠ Email Not Verified</span>
            )}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '10px', 
        marginBottom: '20px', 
        borderRadius: '5px',
        fontSize: '12px',
        border: '1px solid #e9ecef'
      }}>
        <strong>Profile Data Status:</strong> 
        Grades: {Object.keys(safeProfile.grades || {}).length} subjects | 
        Transcript: {safeProfile.transcript ? 'Uploaded' : 'Not uploaded'} |
        GPA: {safeProfile.gpa || 'Not calculated'} |
        Skills: {safeProfile.skills?.length || 0}
      </div>

      <div className="page-content">
        <div className="profile-container">
          {/* Profile Overview Card */}
          <div className="profile-overview-card">
            <div className="overview-header">
              <div className="avatar-section">
                <div className="avatar">
                  {safeProfile.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div className="user-info">
                  <h2>{safeProfile.fullName || 'Student'}</h2>
                  <p className="user-email">{user?.email}</p>
                  <p className="user-role">Student Account</p>
                </div>
              </div>
              <div className="stats-section">
                <div className="stat">
                  <span className="stat-number">
                    {safeProfile.applicationStats?.totalApplications || 0}
                  </span>
                  <span className="stat-label">Applications</span>
                </div>
                <div className="stat">
                  <span className="stat-number">
                    {safeProfile.applicationStats?.admittedApplications || 0}
                  </span>
                  <span className="stat-label">Admitted</span>
                </div>
                <div className="stat">
                  <span className="stat-number">
                    {safeProfile.transcript ? 1 : 0}
                  </span>
                  <span className="stat-label">Transcripts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="profile-tabs">
            <button 
              className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Information
            </button>
            <button 
              className={`tab-button ${activeTab === 'academic' ? 'active' : ''}`}
              onClick={() => setActiveTab('academic')}
            >
              Academic Details
            </button>
            <button 
              className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'personal' && (
              <PersonalInfoTab 
                profile={safeProfile}
                onProfileUpdate={handleProfileUpdate}
              />
            )}
            
            {activeTab === 'academic' && (
              <AcademicInfoTab 
                profile={safeProfile}
                onProfileUpdate={handleProfileUpdate}
              />
            )}
            
            {activeTab === 'documents' && (
              <DocumentsTab 
                profile={safeProfile}
                onProfileUpdate={fetchProfileData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Personal Information Tab Component
const PersonalInfoTab = ({ profile, onProfileUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(profile || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    // Prepare data for database
    const saveData = {
      name: formData.fullName || formData.name,
      phone: formData.phoneNumber || formData.phone,
      dateOfBirth: formData.dateOfBirth,
      address: formData.address,
      // Preserve existing academic data
      grades: profile.grades,
      subjects: profile.subjects,
      gpa: profile.gpa,
      highSchool: profile.highSchool,
      graduationYear: profile.graduationYear,
      academicInterests: profile.academicInterests,
      skills: profile.skills,
      certifications: profile.certifications,
      transcript: profile.transcript
    };
    
    const success = await onProfileUpdate(saveData);
    if (success) {
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setEditing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const safeProfile = profile || {};

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h3>Personal Information</h3>
        {!editing ? (
          <button 
            className="btn-primary"
            onClick={() => setEditing(true)}
          >
            Edit Information
          </button>
        ) : (
          <div className="edit-actions">
            <button 
              className="btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving to Database...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="info-cards-grid">
        <div className="info-card">
          <div className="card-header">
            <h4>Basic Information</h4>
          </div>
          <div className="card-content">
            <div className="info-field">
              <label>Full Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.fullName || formData.name || ''}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="form-input"
                />
              ) : (
                <div className="display-value">{safeProfile.fullName || safeProfile.name || 'Not provided'}</div>
              )}
            </div>

            <div className="info-field">
              <label>Phone Number</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phoneNumber || safeProfile.phone || ''}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                  className="form-input"
                />
              ) : (
                <div className="display-value">{safeProfile.phoneNumber || safeProfile.phone || 'Not provided'}</div>
              )}
            </div>

            <div className="info-field">
              <label>Date of Birth</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="form-input"
                />
              ) : (
                <div className="display-value">
                  {safeProfile.dateOfBirth ? new Date(safeProfile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="info-card full-width">
          <div className="card-header">
            <h4>Address</h4>
          </div>
          <div className="card-content">
            <div className="info-field">
              {editing ? (
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your address"
                  rows="3"
                  className="form-textarea"
                />
              ) : (
                <div className="display-value">{safeProfile.address || 'Not provided'}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Academic Information Tab Component
const AcademicInfoTab = ({ profile, onProfileUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(profile || {});
  const [saving, setSaving] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newGrade, setNewGrade] = useState('');

  const handleSave = async () => {
    setSaving(true);
    
    // Calculate GPA if grades are provided
    let calculatedGPA = formData.gpa;
    if (formData.grades && Object.keys(formData.grades).length > 0) {
      calculatedGPA = calculateGPA(formData.grades);
    }
    
    // Prepare data for database
    const saveData = {
      // Academic data
      grades: formData.grades || {},
      subjects: formData.subjects || [],
      gpa: calculatedGPA,
      highSchool: formData.highSchool,
      graduationYear: formData.graduationYear,
      academicInterests: formData.academicInterests,
      skills: formData.skills || [],
      certifications: formData.certifications || [],
      // Preserve personal data
      name: profile.name || profile.fullName,
      phone: profile.phone || profile.phoneNumber,
      dateOfBirth: profile.dateOfBirth,
      address: profile.address,
      transcript: profile.transcript
    };
    
    console.log(' Saving academic data to database:', {
      subjectsCount: saveData.subjects.length,
      gradesCount: Object.keys(saveData.grades).length,
      calculatedGPA: saveData.gpa
    });
    
    const success = await onProfileUpdate(saveData);
    if (success) {
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setEditing(false);
    setNewSubject('');
    setNewGrade('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // GPA calculation function
  const calculateGPA = (grades) => {
    const gradePoints = {
      'A+': 4.0, 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'E': 0.5, 'F': 0.0
    };
    
    let totalPoints = 0;
    let subjectCount = 0;
    
    Object.values(grades).forEach(grade => {
      const points = gradePoints[grade.toUpperCase()];
      if (points !== undefined) {
        totalPoints += points;
        subjectCount++;
      }
    });
    
    return subjectCount > 0 ? (totalPoints / subjectCount).toFixed(2) : 0;
  };

  const addSubjectGrade = () => {
    if (newSubject.trim() && newGrade) {
      const updatedSubjects = [...(formData.subjects || []), newSubject.trim()];
      const updatedGrades = { 
        ...(formData.grades || {}), 
        [newSubject.trim()]: newGrade 
      };
      
      setFormData(prev => ({
        ...prev,
        subjects: updatedSubjects,
        grades: updatedGrades
      }));
      
      setNewSubject('');
      setNewGrade('');
    }
  };

  const removeSubject = (subject) => {
    const updatedSubjects = (formData.subjects || []).filter(s => s !== subject);
    const updatedGrades = { ...(formData.grades || {}) };
    delete updatedGrades[subject];
    
    setFormData(prev => ({
      ...prev,
      subjects: updatedSubjects,
      grades: updatedGrades
    }));
  };

  const safeProfile = profile || {};

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h3>Academic Information</h3>
        <p>This data is used for automatic course qualification checking</p>
        {!editing ? (
          <button 
            className="btn-primary"
            onClick={() => setEditing(true)}
          >
            Edit Academic Info
          </button>
        ) : (
          <div className="edit-actions">
            <button 
              className="btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving to Database...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="info-cards-grid">
        {/* Academic Background Card */}
        <div className="info-card">
          <div className="card-header">
            <h4>Academic Background</h4>
          </div>
          <div className="card-content">
            <div className="info-field">
              <label>High School</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.highSchool || ''}
                  onChange={(e) => handleInputChange('highSchool', e.target.value)}
                  placeholder="Enter your high school name"
                  className="form-input"
                />
              ) : (
                <div className="display-value">{safeProfile.highSchool || 'Not provided'}</div>
              )}
            </div>

            <div className="info-field">
              <label>Academic Interests</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.academicInterests || ''}
                  onChange={(e) => handleInputChange('academicInterests', e.target.value)}
                  placeholder="e.g., Computer Science, Business"
                  className="form-input"
                />
              ) : (
                <div className="display-value">{safeProfile.academicInterests || 'Not provided'}</div>
              )}
            </div>

            {/* Subjects and Grades Section */}
            <div className="info-field full-width">
              <label>Subjects & Grades</label>
              <p className="field-description">
                Add your high school subjects and grades. This data is used to automatically check 
                if you qualify for courses.
              </p>
              {editing ? (
                <div className="grades-management">
                  <div className="add-subject-form">
                    <input
                      type="text"
                      placeholder="Subject (e.g., Mathematics)"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="form-input subject-input"
                    />
                    <select 
                      value={newGrade} 
                      onChange={(e) => setNewGrade(e.target.value)}
                      className="form-select grade-select"
                    >
                      <option value="">Select Grade</option>
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                    </select>
                    <button 
                      onClick={addSubjectGrade}
                      className="btn-primary sm"
                      disabled={!newSubject.trim() || !newGrade}
                    >
                      Add Subject
                    </button>
                  </div>

                  <div className="subjects-list">
                    {formData.subjects?.map((subject, index) => (
                      <div key={index} className="subject-grade-item">
                        <span className="subject-name">{subject}</span>
                        <span className="subject-grade">{formData.grades?.[subject]}</span>
                        <button 
                          onClick={() => removeSubject(subject)}
                          className="btn-danger sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {(!formData.subjects || formData.subjects.length === 0) && (
                      <div className="no-subjects">
                        <p>No subjects added yet. Add your subjects and grades above.</p>
                      </div>
                    )}
                  </div>
                  
                  {formData.grades && Object.keys(formData.grades).length > 0 && (
                    <div className="gpa-calculation">
                      <strong>Calculated GPA: {calculateGPA(formData.grades)}</strong>
                      <p className="gpa-note">GPA is automatically calculated and saved to your profile</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grades-display">
                  {safeProfile.subjects?.length > 0 ? (
                    <>
                      <div className="subjects-grid">
                        {safeProfile.subjects.map((subject, index) => (
                          <div key={index} className="subject-card">
                            <div className="subject-title">{subject}</div>
                            <div className="subject-grade">{safeProfile.grades?.[subject] || 'No grade'}</div>
                          </div>
                        ))}
                      </div>
                      {safeProfile.gpa && (
                        <div className="gpa-display">
                          <strong>GPA: {safeProfile.gpa}</strong>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="display-value">No subjects and grades recorded</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Academic Performance Card */}
        <div className="info-card">
          <div className="card-header">
            <h4>Academic Performance</h4>
          </div>
          <div className="card-content">
            <div className="info-field">
              <label>Graduation Year</label>
              {editing ? (
                <input
                  type="number"
                  value={formData.graduationYear || ''}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                  placeholder="YYYY"
                  min="2000"
                  max="2030"
                  className="form-input"
                />
              ) : (
                <div className="display-value">{safeProfile.graduationYear || 'Not provided'}</div>
              )}
            </div>

            <div className="info-field">
              <label>GPA</label>
              {editing ? (
                <div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4.0"
                    value={formData.gpa || ''}
                    onChange={(e) => handleInputChange('gpa', e.target.value)}
                    placeholder="0.0 - 4.0"
                    className="form-input"
                  />
                  <p className="field-note">Leave empty to auto-calculate from grades</p>
                </div>
              ) : (
                <div className="display-value">{safeProfile.gpa || 'Not provided'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Skills & Certifications Card */}
        <div className="info-card">
          <div className="card-header">
            <h4>Skills & Certifications</h4>
          </div>
          <div className="card-content">
            <div className="info-field">
              <label>Skills</label>
              {editing ? (
                <textarea
                  value={formData.skills ? formData.skills.join(', ') : ''}
                  onChange={(e) => handleInputChange('skills', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="List your skills separated by commas"
                  rows="3"
                  className="form-textarea"
                />
              ) : (
                <div className="skills-display">
                  {safeProfile.skills?.length > 0 ? (
                    <div className="tags-list">
                      {safeProfile.skills.map((skill, index) => (
                        <span key={index} className="tag">{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="display-value">No skills listed</div>
                  )}
                </div>
              )}
            </div>

            <div className="info-field">
              <label>Certifications</label>
              {editing ? (
                <textarea
                  value={formData.certifications ? formData.certifications.join(', ') : ''}
                  onChange={(e) => handleInputChange('certifications', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="List your certifications separated by commas"
                  rows="3"
                  className="form-textarea"
                />
              ) : (
                <div className="certifications-display">
                  {safeProfile.certifications?.length > 0 ? (
                    <div className="tags-list">
                      {safeProfile.certifications.map((cert, index) => (
                        <span key={index} className="tag">{cert}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="display-value">No certifications listed</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Documents Tab Component
const DocumentsTab = ({ profile, onProfileUpdate }) => {
  const safeProfile = profile || {};

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h3>Documents & Transcripts</h3>
        <p>Upload and manage your academic documents. Transcripts are required for course applications.</p>
      </div>

      <div className="info-cards-grid">
        <div className="info-card full-width">
          <div className="card-header">
            <h4>Transcript Upload</h4>
          </div>
          <div className="card-content">
            <TranscriptUpload 
              currentTranscript={safeProfile.transcript}
              onTranscriptUpdate={onProfileUpdate}
            />
          </div>
        </div>

        {/* Application Documents Section */}
        <div className="info-card full-width">
          <div className="card-header">
            <h4>Application Documents</h4>
          </div>
          <div className="card-content">
            <div className="documents-grid">
              {safeProfile.documents?.map((doc, index) => (
                <div key={index} className="document-card">
                  <div className="document-icon"></div>
                  <div className="document-info">
                    <div className="document-name">{doc.name}</div>
                    <div className="document-meta">
                      <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      <span className={`status ${doc.status}`}>{doc.status}</span>
                    </div>
                  </div>
                  <div className="document-actions">
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-outline sm"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            {(!safeProfile.documents || safeProfile.documents.length === 0) && (
              <div className="no-documents">
                <p>No additional documents uploaded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;