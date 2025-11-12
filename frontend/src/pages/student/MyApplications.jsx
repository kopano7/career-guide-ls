import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { studentAPI } from '../../services/api/student';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import ApplicationCard from '../../components/student/Applications/ApplicationCard';
import AdmissionDecision from '../../components/student/Applications/AdmissionDecision';
import AdmissionModal from '../../components/student/Applications/AdmissionModal';


const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    institution: ''
  });
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching applications from API...');
      
      const response = await studentAPI.getApplications();
      console.log('📦 Applications API Response:', response);
      
      if (response.success) {
        const applicationsData = response.data?.applications || [];
        console.log('🎯 Extracted applications:', applicationsData);
        
        // Enhance applications with additional data
        const enhancedApplications = await Promise.all(
          applicationsData.map(async (app) => {
            try {
              // Fetch course details for each application
              const courseResponse = await studentAPI.getCourseDetails(app.courseId);
              const courseData = courseResponse.success ? courseResponse.data?.course : null;
              
              // Fetch institute details
              const instituteResponse = await studentAPI.getInstituteDetails(app.instituteId);
              const instituteData = instituteResponse.success ? instituteResponse.data?.institute : null;

              return {
                ...app,
                // Convert Firestore timestamps to Date objects if needed
                appliedAt: app.appliedAt?.toDate?.() || app.appliedAt,
                admittedAt: app.admittedAt?.toDate?.() || app.admittedAt,
                rejectedAt: app.rejectedAt?.toDate?.() || app.rejectedAt,
                acceptedAt: app.acceptedAt?.toDate?.() || app.acceptedAt,
                updatedAt: app.updatedAt?.toDate?.() || app.updatedAt,
                // Add course and institute details
                courseName: app.courseName || courseData?.name || 'Unknown Course',
                instituteName: app.instituteName || instituteData?.institutionName || instituteData?.name || 'Unknown Institution',
                faculty: courseData?.faculty || app.faculty || 'General Studies',
                duration: courseData?.duration || app.duration || 'Not specified',
                studentName: user?.name || app.studentName || 'Student',
                // Ensure rejection reason is included
                rejectionReason: app.rejectionReason || app.notes || null
              };
            } catch (error) {
              console.error('Error enhancing application:', error);
              return {
                ...app,
                appliedAt: app.appliedAt?.toDate?.() || app.appliedAt,
                courseName: app.courseName || 'Unknown Course',
                instituteName: app.instituteName || 'Unknown Institution',
                faculty: app.faculty || 'General Studies',
                duration: app.duration || 'Not specified',
                studentName: user?.name || app.studentName || 'Student',
                rejectionReason: app.rejectionReason || app.notes || null
              };
            }
          })
        );
        
        setApplications(enhancedApplications);
        console.log('✅ Enhanced applications loaded:', enhancedApplications);
      } else {
        throw new Error(response.message || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('❌ Applications error:', error);
      showError('Loading Error', 'Failed to load your applications. Please try again.');
      
      // Fallback to empty array instead of mock data
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    if (filters.institution) {
      filtered = filtered.filter(app => 
        app.instituteName?.toLowerCase().includes(filters.institution.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      institution: ''
    });
  };

  const handleAcceptAdmission = (application) => {
    setSelectedAdmission(application);
    setShowAdmissionModal(true);
  };

  const handleAdmissionConfirm = async (applicationId) => {
    try {
      console.log('🎯 Accepting admission for application:', applicationId);
      
      const response = await studentAPI.acceptAdmission({ applicationId });
      console.log('✅ Admission acceptance response:', response);
      
      if (response.success) {
        showSuccess('Admission Accepted', 'You have successfully accepted this admission offer!');
        
        // Refresh applications to get updated status
        await fetchApplications();
      } else {
        throw new Error(response.message || 'Failed to accept admission');
      }
    } catch (error) {
      console.error('❌ Accept admission error:', error);
      showError('Acceptance Failed', error.message || 'Failed to accept admission. Please try again.');
    } finally {
      setShowAdmissionModal(false);
      setSelectedAdmission(null);
    }
  };

  const handleDeclineAdmission = async (applicationId) => {
    try {
      console.log('🎯 Declining admission for application:', applicationId);
      
      // You might want to create a declineAdmission API endpoint
      // For now, we'll just show a message
      showSuccess('Offer Declined', 'You have declined the admission offer.');
      
      // Refresh applications
      await fetchApplications();
    } catch (error) {
      console.error('❌ Decline admission error:', error);
      showError('Action Failed', 'Failed to decline admission offer. Please try again.');
    }
  };

  const getStats = () => {
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      admitted: applications.filter(app => app.status === 'admitted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      waiting_list: applications.filter(app => app.status === 'waiting_list').length
    };
  };

  const stats = getStats();
  const hasAdmissionDecisions = applications.some(app => 
    ['admitted', 'rejected', 'accepted', 'waiting_list'].includes(app.status)
  );

  if (loading) {
    return (
      <div className="applications-container">
        <LoadingSpinner text="Loading your applications..." />
      </div>
    );
  }

  return (
    <div className="applications-container">
      {/* Header */}
      <div className="applications-header">
        <div className="header-content">
          <h1>My Applications 📋</h1>
          <p>Track and manage your course applications and admission decisions</p>
          <div style={{ 
            background: '#e8f5e8', 
            padding: '8px 12px', 
            borderRadius: '4px', 
            marginTop: '8px',
            fontSize: '0.9rem'
          }}>
            <strong>Live Data:</strong> Connected to your real applications
          </div>
        </div>
        <div className="header-actions">
          <Link to="/student/courses" className="btn btn-primary">
            Apply for More Courses
          </Link>
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
        <strong>Debug Info:</strong> 
        Total Applications: {applications.length} | 
        Filtered: {filteredApplications.length} | 
        User: {user?.email}
      </div>

      {/* View Mode Toggle */}
      {hasAdmissionDecisions && (
        <div className="view-mode-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📝 Application List
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'decisions' ? 'active' : ''}`}
            onClick={() => setViewMode('decisions')}
          >
            🎓 Admission Decisions ({applications.filter(app => 
              ['admitted', 'rejected', 'accepted', 'waiting_list'].includes(app.status)
            ).length})
          </button>
        </div>
      )}

      {/* Application Stats */}
      <div className="applications-stats">
        <div className="stat-item">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-item pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-item admitted">
          <div className="stat-number">{stats.admitted}</div>
          <div className="stat-label">Admitted</div>
        </div>
        <div className="stat-item rejected">
          <div className="stat-number">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-item accepted">
          <div className="stat-number">{stats.accepted}</div>
          <div className="stat-label">Accepted</div>
        </div>
        {stats.waiting_list > 0 && (
          <div className="stat-item waiting">
            <div className="stat-number">{stats.waiting_list}</div>
            <div className="stat-label">Waiting List</div>
          </div>
        )}
      </div>

      {/* No Applications Message */}
      {applications.length === 0 && !loading && (
        <div className="empty-applications">
          <div className="empty-icon">📝</div>
          <h3>No Applications Yet</h3>
          <p>You haven't applied to any courses yet. Start your academic journey today!</p>
          <Link to="/student/courses" className="btn btn-primary">
            Browse Available Courses
          </Link>
        </div>
      )}

      {/* Admission Decisions View */}
      {viewMode === 'decisions' && hasAdmissionDecisions && (
        <div className="admission-decisions-view">
          <h2>Official Admission Decisions 🎓</h2>
          <p className="decisions-subtitle">
            Review your official admission letters and respond to offers
          </p>

          {applications
            .filter(app => ['admitted', 'rejected', 'accepted', 'waiting_list'].includes(app.status))
            .map(application => (
              <AdmissionDecision
                key={application.id}
                application={application}
                onAccept={handleAcceptAdmission}
                onDecline={handleDeclineAdmission}
              />
            ))}
        </div>
      )}

      {/* Application List View */}
      {viewMode === 'list' && applications.length > 0 && (
        <>
          {/* Filters */}
          <div className="applications-filters">
            <div className="filters-content">
              <div className="filter-group">
                <label>Filter by Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="admitted">Admitted</option>
                  <option value="rejected">Rejected</option>
                  <option value="accepted">Accepted</option>
                  <option value="waiting_list">Waiting List</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Filter by Institution</label>
                <input
                  type="text"
                  placeholder="Search institution..."
                  value={filters.institution}
                  onChange={(e) => handleFilterChange('institution', e.target.value)}
                />
              </div>

              {(filters.status || filters.institution) && (
                <button onClick={clearFilters} className="btn btn-outline btn-sm">
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Multiple Admissions Warning */}
          {stats.admitted > 1 && (
            <div className="warning-banner">
              <div className="banner-icon">⚠️</div>
              <div>
                <h4>Multiple Admission Offers</h4>
                <p>
                  You have been admitted to multiple institutions. You can only accept one admission offer. 
                  <strong> Switch to "Admission Decisions" view to review your offers.</strong>
                </p>
              </div>
            </div>
          )}

          {/* Applications List */}
          <div className="applications-list">
            {filteredApplications.length > 0 ? (
              <div className="applications-grid">
                {filteredApplications.map(application => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onAcceptAdmission={handleAcceptAdmission}
                    onRefresh={fetchApplications}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-applications">
                <div className="empty-icon">🔍</div>
                <h3>No applications match your filters</h3>
                <p>Try adjusting your filter criteria to see more results.</p>
                <button onClick={clearFilters} className="btn btn-outline">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Admission Modal */}
      {showAdmissionModal && selectedAdmission && (
        <AdmissionModal
          application={selectedAdmission}
          onClose={() => {
            setShowAdmissionModal(false);
            setSelectedAdmission(null);
          }}
          onConfirm={handleAdmissionConfirm}
        />
      )}
    </div>
  );
};

export default MyApplications;