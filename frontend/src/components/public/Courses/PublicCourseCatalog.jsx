// src/components/public/Courses/PublicCourseCatalog.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext'; // Import auth context

const PublicCourseCatalog = () => {
  const { get } = useApi();
  const { addNotification } = useNotifications();
  const { user, isAuthenticated } = useAuth(); // Get auth state
  const navigate = useNavigate(); // For programmatic navigation
  
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    institution: '',
    field: '',
    level: '',
    search: '',
    sortBy: 'name'
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await get('/api/public/courses');
      
      console.log('API Response:', response);
      
      if (response && response.success) {
        const coursesData = response.data.courses || [];
        setCourses(coursesData);
        console.log('✅ Fetched courses:', coursesData.length);
      } else {
        console.error('❌ Unexpected response format:', response);
        addNotification('Failed to load courses from server', 'error');
      }
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      addNotification('Error loading courses. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle View Details click
  const handleViewDetails = (courseId, e) => {
    if (!isAuthenticated) {
      e.preventDefault(); // Prevent default Link behavior
      addNotification('Please register or login to view course details', 'info');
      navigate('/register', { 
        state: { 
          redirectTo: `/courses/${courseId}`,
          message: 'Register to view course details and apply'
        }
      });
    }
    // If authenticated, let the Link work normally
  };

  // Handle Apply Now click
  const handleApplyNow = (courseId, courseTitle, e) => {
    if (!isAuthenticated) {
      e.preventDefault(); // Prevent default Link behavior
      addNotification('Please register as a student to apply for this course', 'info');
      navigate('/register', { 
        state: { 
          redirectTo: `/apply/course/${courseId}`,
          message: `Register as a student to apply for: ${courseTitle}`,
          preferredRole: 'student' // Suggest student role
        }
      });
    } else if (user?.role !== 'student') {
      e.preventDefault(); // Prevent default Link behavior
      addNotification('Only students can apply for courses. Please login with a student account.', 'warning');
      // Optionally redirect to login or show role switch option
    }
    // If authenticated as student, let the Link work normally
  };

  const applyFilters = () => {
    let filtered = [...courses];

    // Institution filter
    if (filters.institution) {
      filtered = filtered.filter(course => 
        course.institutionName?.toLowerCase().includes(filters.institution.toLowerCase()) ||
        course.instituteName?.toLowerCase().includes(filters.institution.toLowerCase())
      );
    }

    // Field filter
    if (filters.field) {
      filtered = filtered.filter(course => 
        course.category?.toLowerCase().includes(filters.field.toLowerCase()) ||
        course.fieldOfStudy?.toLowerCase().includes(filters.field.toLowerCase()) ||
        course.department?.toLowerCase().includes(filters.field.toLowerCase())
      );
    }

    // Level filter
    if (filters.level) {
      filtered = filtered.filter(course => 
        course.qualificationLevel?.toLowerCase() === filters.level.toLowerCase() ||
        course.level?.toLowerCase() === filters.level.toLowerCase()
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(course => 
        course.title?.toLowerCase().includes(searchLower) ||
        course.name?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower) ||
        course.institutionName?.toLowerCase().includes(searchLower) ||
        course.instituteName?.toLowerCase().includes(searchLower) ||
        course.category?.toLowerCase().includes(searchLower) ||
        course.fieldOfStudy?.toLowerCase().includes(searchLower)
      );
    }

    // Sorting with fallbacks
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        case 'institution':
          return (a.institutionName || a.instituteName || '').localeCompare(b.institutionName || b.instituteName || '');
        case 'date':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'fee':
          return (a.tuitionFee || a.fee || 0) - (b.tuitionFee || b.fee || 0);
        default:
          return 0;
      }
    });

    setFilteredCourses(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      institution: '',
      field: '',
      level: '',
      search: '',
      sortBy: 'name'
    });
  };

  // Get unique values for filters from actual course data
  const institutions = [...new Set(courses
    .map(course => course.institutionName || course.instituteName)
    .filter(Boolean)
  )].sort();

  const fields = [...new Set(courses
    .flatMap(course => [
      course.category,
      course.fieldOfStudy,
      course.department,
      course.field
    ].filter(Boolean))
  )].sort();

  const levels = [...new Set(courses
    .map(course => course.qualificationLevel || course.level)
    .filter(Boolean)
  )].sort();

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'Free';
    return new Intl.NumberFormat('en-LS', {
      style: 'currency',
      currency: 'LSL'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleDateString('en-LS', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get course status with proper styling
  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { text: 'ACTIVE', class: 'status-active' },
      'inactive': { text: 'INACTIVE', class: 'status-inactive' },
      'pending': { text: 'PENDING', class: 'status-pending' }
    };
    
    const statusInfo = statusMap[status] || { text: status?.toUpperCase() || 'UNKNOWN', class: 'status-unknown' };
    return (
      <div className={`course-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </div>
    );
  };

  // Show authentication prompt for public users
  const AuthPrompt = () => (
    <div className="auth-prompt">
      <div className="auth-prompt-content">
        <h4>🔐 Create an Account</h4>
        <p>Register as a student to view course details and apply for courses</p>
        <div className="auth-prompt-actions">
          <Link to="/register" className="btn-primary">
            Register Now
          </Link>
          <Link to="/login" className="btn-outline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p>Loading courses from approved institutions...</p>
      </div>
    );
  }

  return (
    <div className="public-course-catalog">
      <div className="catalog-header">
        <h1>Course Catalog</h1>
        <p>
          Discover {courses.length} active courses from approved educational institutions in Lesotho
          {courses.length > 0 && ` • ${filteredCourses.length} match your filters`}
        </p>
        
        {/* Show auth prompt for non-authenticated users */}
        {!isAuthenticated && <AuthPrompt />}
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filter Courses</h3>
          <button 
            className="clear-filters-btn"
            onClick={clearFilters}
            disabled={!filters.institution && !filters.field && !filters.level && !filters.search}
          >
            Clear All Filters
          </button>
        </div>

        <div className="filter-grid">
          {/* Search Input */}
          <div className="filter-group search-group">
            <label>Search Courses</label>
            <input
              type="text"
              placeholder="Search by course name, description, or institution..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>

          {/* Institution Filter */}
          <div className="filter-group">
            <label>Institution</label>
            <select 
              value={filters.institution}
              onChange={(e) => handleFilterChange('institution', e.target.value)}
            >
              <option value="">All Institutions</option>
              {institutions.map(institution => (
                <option key={institution} value={institution}>
                  {institution}
                </option>
              ))}
            </select>
          </div>

          {/* Field Filter */}
          <div className="filter-group">
            <label>Field of Study</label>
            <select 
              value={filters.field}
              onChange={(e) => handleFilterChange('field', e.target.value)}
            >
              <option value="">All Fields</option>
              {fields.map(field => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="filter-group">
            <label>Course Level</label>
            <select 
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              <option value="">All Levels</option>
              {levels.map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="filter-group">
            <label>Sort By</label>
            <select 
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="name">Course Name</option>
              <option value="institution">Institution</option>
              <option value="date">Newest First</option>
              <option value="fee">Tuition Fee (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.institution || filters.field || filters.level || filters.search) && (
          <div className="active-filters">
            <span>Active filters:</span>
            {filters.institution && (
              <span className="filter-tag">
                Institution: {filters.institution}
                <button onClick={() => handleFilterChange('institution', '')}>×</button>
              </span>
            )}
            {filters.field && (
              <span className="filter-tag">
                Field: {filters.field}
                <button onClick={() => handleFilterChange('field', '')}>×</button>
              </span>
            )}
            {filters.level && (
              <span className="filter-tag">
                Level: {filters.level}
                <button onClick={() => handleFilterChange('level', '')}>×</button>
              </span>
            )}
            {filters.search && (
              <span className="filter-tag">
                Search: "{filters.search}"
                <button onClick={() => handleFilterChange('search', '')}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Courses Grid */}
      <div className="courses-section">
        <div className="section-header">
          <h2>
            Available Courses 
            <span className="results-count">({filteredCourses.length} of {courses.length})</span>
          </h2>
          {!isAuthenticated && (
            <div className="auth-reminder">
              <span>🔐 Register to apply for courses</span>
            </div>
          )}
        </div>

        {filteredCourses.length > 0 ? (
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  {getStatusBadge(course.status)}
                  <h3 className="course-title">
                    {course.title || course.name || 'Untitled Course'}
                  </h3>
                  <div className="course-institution">
                    📍 {course.institutionName || course.instituteName || 'Unknown Institution'}
                  </div>
                </div>

                <div className="course-details">
                  <div className="detail-item">
                    <span className="label">📚 Field:</span>
                    <span className="value">
                      {course.category || course.fieldOfStudy || 'Not specified'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">🎯 Level:</span>
                    <span className="value">
                      {course.qualificationLevel || course.level || 'Not specified'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">⏱️ Duration:</span>
                    <span className="value">
                      {course.duration || course.durationMonths || 'Not specified'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">💰 Fee:</span>
                    <span className="value">
                      {formatCurrency(course.tuitionFee || course.fee)}
                    </span>
                  </div>
                  {course.applicationDeadline && (
                    <div className="detail-item deadline">
                      <span className="label">📅 Deadline:</span>
                      <span className="value">
                        {formatDate(course.applicationDeadline)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="course-description">
                  {course.description ? (
                    course.description.length > 120 ? 
                      `${course.description.substring(0, 120)}...` : 
                      course.description
                  ) : 'No description available.'}
                </div>

                <div className="course-actions">
                  <Link 
                    to={`/courses/${course.id}`}
                    className="btn-outline"
                    onClick={(e) => handleViewDetails(course.id, e)}
                  >
                    {isAuthenticated ? 'View Details' : 'View Details 🔒'}
                  </Link>
                  <Link 
                    to={`/apply/course/${course.id}`}
                    className="btn-primary"
                    onClick={(e) => handleApplyNow(
                      course.id, 
                      course.title || course.name, 
                      e
                    )}
                  >
                    {isAuthenticated ? 'Apply Now' : 'Apply Now 🔒'}
                  </Link>
                </div>

                {/* Show message for non-students */}
                {isAuthenticated && user?.role !== 'student' && (
                  <div className="role-warning">
                    <small>⚠️ Only student accounts can apply for courses</small>
                  </div>
                )}

                {/* Course metadata */}
                <div className="course-meta">
                  <small>
                    Added: {formatDate(course.createdAt)}
                    {course.updatedAt && ` • Updated: ${formatDate(course.updatedAt)}`}
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No courses found</h3>
            <p>
              {courses.length === 0 
                ? 'No courses are currently available from approved institutions.' 
                : 'Try adjusting your filters or search terms to find what you\'re looking for.'
              }
            </p>
            {courses.length > 0 && (
              <button 
                className="btn-secondary"
                onClick={clearFilters}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCourseCatalog;