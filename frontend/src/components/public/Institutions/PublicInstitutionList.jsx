// src/components/public/Institutions/PublicInstitutionList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext';

const PublicInstitutionList = () => {
  const { get } = useApi();
  const { addNotification } = useNotifications();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [institutions, setInstitutions] = useState([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    search: '',
    sortBy: 'name'
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [institutions, filters]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      // Use the correct endpoint from your publicRoutes.js
      const response = await get('/api/public/institutions');
      
      console.log(' API Response:', response);
      
      // Match the response structure from your backend publicRoutes.js
      if (response && response.success) {
        const institutionsData = response.data?.institutions || [];
        setInstitutions(institutionsData);
        console.log('Fetched institutions:', institutionsData.length);
      } else {
        console.error(' Unexpected response format:', response);
        addNotification('Failed to load institutions from server', 'error');
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
      addNotification('Error loading institutions. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle View Profile click
  const handleViewProfile = (institutionId, institutionName, e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      addNotification('Please register or login to view institution profiles', 'info');
      navigate('/register', { 
        state: { 
          redirectTo: `/institutions/${institutionId}`,
          message: `Register to view detailed profile of ${institutionName}`
        }
      });
    }
    // If authenticated, let the Link work normally
  };

  // Handle View Courses click
  const handleViewCourses = (institutionName, e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      addNotification('Please register or login to view institution courses', 'info');
      navigate('/register', { 
        state: { 
          redirectTo: `/courses?institution=${encodeURIComponent(institutionName)}`,
          message: `Register to view courses offered by ${institutionName}`
        }
      });
    }
    // If authenticated, let the Link work normally
  };

  const applyFilters = () => {
    let filtered = [...institutions];

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(inst => 
        inst.institutionType?.toLowerCase().includes(filters.type.toLowerCase()) ||
        inst.type?.toLowerCase().includes(filters.type.toLowerCase())
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(inst => 
        inst.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
        inst.address?.toLowerCase().includes(filters.location.toLowerCase()) ||
        inst.country?.toLowerCase().includes(filters.location.toLowerCase()) ||
        inst.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(inst => 
        inst.institutionName?.toLowerCase().includes(searchLower) ||
        inst.name?.toLowerCase().includes(searchLower) ||
        inst.description?.toLowerCase().includes(searchLower) ||
        inst.email?.toLowerCase().includes(searchLower)
      );
    }

    // Sorting with fallbacks
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return (a.institutionName || a.name || '').localeCompare(b.institutionName || b.name || '');
        case 'location':
          return (a.city || a.address || '').localeCompare(b.city || b.address || '');
        case 'date':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'courses':
          return (b.courseCount || 0) - (a.courseCount || 0);
        default:
          return 0;
      }
    });

    setFilteredInstitutions(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      location: '',
      search: '',
      sortBy: 'name'
    });
  };

  // Get unique values for filters from actual institution data
  const institutionTypes = [...new Set(institutions
    .map(inst => inst.institutionType || inst.type)
    .filter(Boolean)
  )].sort();

  const locations = [...new Set(institutions
    .flatMap(inst => [
      inst.city,
      inst.location
    ].filter(Boolean))
  )].sort();

  const getInstitutionName = (institution) => {
    return institution.institutionName || institution.name || 'Unknown Institution';
  };

  const getInstitutionLocation = (institution) => {
    if (institution.city && institution.country) {
      return `${institution.city}, ${institution.country}`;
    }
    return institution.address || institution.location || 'Location not specified';
  };

  const getCourseCount = (institution) => {
    return institution.courseCount || institution.coursesCount || 0;
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

  // Show authentication prompt for public users
  const AuthPrompt = () => (
    <div className="auth-prompt">
      <div className="auth-prompt-content">
        <h4> Create an Account</h4>
        <p>Register to view detailed institution profiles and explore their course offerings</p>
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
        <p>Loading approved institutions from Lesotho...</p>
      </div>
    );
  }

  return (
    <div className="public-institution-list">
      <div className="page-header">
        <h1>Educational Institutions</h1>
        <p>
          Discover {institutions.length} approved educational institutions and their programs in Lesotho
          {institutions.length > 0 && ` • ${filteredInstitutions.length} match your filters`}
        </p>
        
        {/* Show auth prompt for non-authenticated users */}
        {!isAuthenticated && <AuthPrompt />}
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filter Institutions</h3>
          <button 
            className="clear-filters-btn"
            onClick={clearFilters}
            disabled={!filters.type && !filters.location && !filters.search}
          >
            Clear All Filters
          </button>
        </div>

        <div className="filter-grid">
          {/* Search Input */}
          <div className="filter-group search-group">
            <label>Search Institutions</label>
            <input
              type="text"
              placeholder="Search by institution name, description, or location..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>

          {/* Type Filter */}
          <div className="filter-group">
            <label>Institution Type</label>
            <select 
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              {institutionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="filter-group">
            <label>Location</label>
            <select 
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
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
              <option value="name">Institution Name</option>
              <option value="location">Location</option>
              <option value="date">Newest First</option>
              <option value="courses">Most Courses</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.type || filters.location || filters.search) && (
          <div className="active-filters">
            <span>Active filters:</span>
            {filters.type && (
              <span className="filter-tag">
                Type: {filters.type}
                <button onClick={() => handleFilterChange('type', '')}>×</button>
              </span>
            )}
            {filters.location && (
              <span className="filter-tag">
                Location: {filters.location}
                <button onClick={() => handleFilterChange('location', '')}>×</button>
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

      {/* Institutions Grid */}
      <div className="institutions-section">
        <div className="section-header">
          <h2>
            Partner Institutions 
            <span className="results-count">({filteredInstitutions.length} of {institutions.length})</span>
          </h2>
          {!isAuthenticated && (
            <div className="auth-reminder">
              <span> Register to view detailed profiles and courses</span>
            </div>
          )}
        </div>

        {filteredInstitutions.length > 0 ? (
          <div className="institutions-grid">
            {filteredInstitutions.map(institution => (
              <div key={institution.id} className="institution-card">
                <div className="institution-header">
                  <div className="institution-avatar">
                    {getInstitutionName(institution).charAt(0).toUpperCase()}
                  </div>
                  <div className="institution-info">
                    <h3 className="institution-name">{getInstitutionName(institution)}</h3>
                    <div className="institution-meta">
                      <span className="institution-type">
                        {institution.institutionType || institution.type || 'Educational Institution'}
                      </span>
                      <span className="institution-status approved">
                        ✓ Approved
                      </span>
                    </div>
                  </div>
                </div>

                <div className="institution-details">
                  <div className="detail-item">
                    <span className="label"> Location:</span>
                    <span className="value">{getInstitutionLocation(institution)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label"> Email:</span>
                    <span className="value">{institution.email || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label"> Phone:</span>
                    <span className="value">{institution.phone || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label"> Courses:</span>
                    <span className="value">{getCourseCount(institution)} programs available</span>
                  </div>
                  <div className="detail-item">
                    <span className="label"> Joined:</span>
                    <span className="value">{formatDate(institution.createdAt)}</span>
                  </div>
                </div>

                <div className="institution-description">
                  {institution.description ? (
                    institution.description.length > 120 ? 
                      `${institution.description.substring(0, 120)}...` : 
                      institution.description
                  ) : 'No description available.'}
                </div>

                <div className="institution-actions">
                  <Link 
                    to={`/institutions/${institution.id}`}
                    className="btn-outline"
                    onClick={(e) => handleViewProfile(
                      institution.id, 
                      getInstitutionName(institution), 
                      e
                    )}
                  >
                    {isAuthenticated ? 'View Profile' : 'View Profile '}
                  </Link>
                  <Link 
                    to={`/courses?institution=${encodeURIComponent(getInstitutionName(institution))}`}
                    className="btn-primary"
                    onClick={(e) => handleViewCourses(
                      getInstitutionName(institution), 
                      e
                    )}
                  >
                    {isAuthenticated ? 'View Courses' : 'View Courses '}
                  </Link>
                </div>

                {/* Institution metadata */}
                <div className="institution-meta-footer">
                  <small>
                    Status: {institution.status || 'approved'} • 
                    Last updated: {formatDate(institution.updatedAt)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            
            <h3>No institutions found</h3>
            <p>
              {institutions.length === 0 
                ? 'No approved institutions are currently available.' 
                : 'Try adjusting your filters or search terms to find what you\'re looking for.'
              }
            </p>
            {institutions.length > 0 && (
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

export default PublicInstitutionList;
