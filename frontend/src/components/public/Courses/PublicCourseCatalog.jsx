// src/components/public/Courses/PublicCourseCatalog.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import './PublicCourseCatalog.css';

const PublicCourseCatalog = () => {
  const { get } = useApi();
  const { addNotification } = useNotifications();
  
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
      
      if (response && response.data && response.data.success) {
        const coursesData = response.data.data.courses || response.data.courses || [];
        setCourses(coursesData);
        console.log('Fetched courses:', coursesData.length);
      } else {
        console.error('Unexpected response format:', response);
        addNotification('Unexpected response format from server', 'error');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      addNotification('Error loading courses. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
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
        course.field?.toLowerCase().includes(filters.field.toLowerCase()) ||
        course.category?.toLowerCase().includes(filters.field.toLowerCase()) ||
        course.tags?.some(tag => tag.toLowerCase().includes(filters.field.toLowerCase()))
      );
    }

    // Level filter
    if (filters.level) {
      filtered = filtered.filter(course => 
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
        course.field?.toLowerCase().includes(searchLower)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return (a.title || a.name).localeCompare(b.title || b.name);
        case 'institution':
          return (a.institutionName || a.instituteName).localeCompare(b.institutionName || b.instituteName);
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'fee':
          return (a.tuitionFee || 0) - (b.tuitionFee || 0);
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

  // Get unique values for filters
  const institutions = [...new Set(courses
    .map(course => course.institutionName || course.instituteName)
    .filter(Boolean)
  )].sort();

  const fields = [...new Set(courses
    .map(course => course.field || course.category)
    .filter(Boolean)
  )].sort();

  const levels = [...new Set(courses
    .map(course => course.level)
    .filter(Boolean)
  )].sort();

  const formatCurrency = (amount) => {
    if (!amount) return 'Free';
    return new Intl.NumberFormat('en-LS', {
      style: 'currency',
      currency: 'LSL'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-LS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="public-course-catalog">
      <div className="catalog-header">
        <h1>Course Catalog</h1>
        <p>Discover {courses.length} courses from approved educational institutions in Lesotho</p>
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
                <option key={institution} value={institution}>{institution}</option>
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
                <option key={field} value={field}>{field}</option>
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
                <option key={level} value={level}>{level}</option>
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
        </div>

        {filteredCourses.length > 0 ? (
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <div className="course-badge">
                    {course.status === 'active' ? 'ACTIVE' : course.status?.toUpperCase()}
                  </div>
                  <h3 className="course-title">{course.title || course.name}</h3>
                  <div className="course-institution">
                    {course.institutionName || course.instituteName}
                  </div>
                </div>

                <div className="course-details">
                  <div className="detail-item">
                    <span className="label">📚 Field:</span>
                    <span className="value">{course.field || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">🎯 Level:</span>
                    <span className="value">{course.level || 'All Levels'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">⏱️ Duration:</span>
                    <span className="value">{course.duration || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">💰 Fee:</span>
                    <span className="value">{formatCurrency(course.tuitionFee)}</span>
                  </div>
                  {course.applicationDeadline && (
                    <div className="detail-item deadline">
                      <span className="label">📅 Deadline:</span>
                      <span className="value">{formatDate(course.applicationDeadline)}</span>
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
                  >
                    View Details
                  </Link>
                  <Link 
                    to={`/apply/course/${course.id}`}
                    className="btn-primary"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No courses found</h3>
            <p>Try adjusting your filters or search terms to find what you're looking for.</p>
            <button 
              className="btn-secondary"
              onClick={clearFilters}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCourseCatalog;