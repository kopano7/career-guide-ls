// src/components/public/Courses/PublicCourseCatalog.jsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import { useNotifications } from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';

const PublicCourseCatalog = () => {
  const { get } = useApi();
  const { addNotification } = useNotifications();
  
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    institution: '',
    field: '',
    duration: '',
    search: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, filters]);

  const fetchCourses = async () => {
    try {
      const response = await get('/public/courses');
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      addNotification('Error loading courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = courses;

    if (filters.institution) {
      filtered = filtered.filter(course => 
        course.institutionName?.toLowerCase().includes(filters.institution.toLowerCase())
      );
    }

    if (filters.field) {
      filtered = filtered.filter(course => 
        course.field?.toLowerCase().includes(filters.field.toLowerCase())
      );
    }

    if (filters.duration) {
      filtered = filtered.filter(course => course.duration === filters.duration);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(searchLower) ||
        course.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCourses(filtered);
  };

  const institutions = [...new Set(courses.map(course => course.institutionName).filter(Boolean))];
  const fields = [...new Set(courses.map(course => course.field).filter(Boolean))];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="public-course-catalog">
      <div className="catalog-header">
        <h1>Course Catalog</h1>
        <p>Discover courses from top educational institutions</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-grid">
          <div className="filter-group">
            <label>Institution</label>
            <select 
              value={filters.institution}
              onChange={(e) => setFilters({...filters, institution: e.target.value})}
            >
              <option value="">All Institutions</option>
              {institutions.map(institution => (
                <option key={institution} value={institution}>{institution}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Field of Study</label>
            <select 
              value={filters.field}
              onChange={(e) => setFilters({...filters, field: e.target.value})}
            >
              <option value="">All Fields</option>
              {fields.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Duration</label>
            <select 
              value={filters.duration}
              onChange={(e) => setFilters({...filters, duration: e.target.value})}
            >
              <option value="">Any Duration</option>
              <option value="1 year">1 Year</option>
              <option value="2 years">2 Years</option>
              <option value="3 years">3 Years</option>
              <option value="4 years">4 Years</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search courses..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="courses-section">
        <div className="section-header">
          <h2>Available Courses ({filteredCourses.length})</h2>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <h3 className="course-title">{course.name}</h3>
                  <div className="course-institution">{course.institutionName}</div>
                </div>

                <div className="course-details">
                  <div className="detail-item">
                    <span className="label">Field:</span>
                    <span className="value">{course.field}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Duration:</span>
                    <span className="value">{course.duration}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Fee:</span>
                    <span className="value">${course.tuitionFee}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Application Deadline:</span>
                    <span className="value">
                      {new Date(course.applicationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="course-description">
                  {course.description}
                </div>

                <div className="course-actions">
                  <button className="btn-outline">View Details</button>
                  <button className="btn-primary">Apply Now</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No courses found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button 
              className="btn-secondary"
              onClick={() => setFilters({ institution: '', field: '', duration: '', search: '' })}
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