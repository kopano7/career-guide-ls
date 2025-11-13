// src/components/public/Jobs/PublicJobList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext';

const PublicJobList = () => {
  const { get } = useApi();
  const { addNotification } = useNotifications();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    industry: '',
    jobType: '',
    location: '',
    search: '',
    sortBy: 'date'
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Use the correct endpoint from your publicRoutes.js
      const response = await get('/api/public/jobs');
      
      console.log(' API Response:', response);
      
      // Match the response structure from your backend publicRoutes.js
      if (response && response.success) {
        const jobsData = response.data?.jobs || [];
        setJobs(jobsData);
        console.log('Fetched jobs:', jobsData.length);
      } else {
        console.error(' Unexpected response format:', response);
        addNotification('Failed to load jobs from server', 'error');
      }
    } catch (error) {
      console.error(' Error fetching jobs:', error);
      addNotification('Error loading jobs. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle View Details click
  const handleViewDetails = (jobId, jobTitle, e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      addNotification('Please register or login to view job details', 'info');
      navigate('/register', { 
        state: { 
          redirectTo: `/jobs/${jobId}`,
          message: `Register to view detailed information about: ${jobTitle}`
        }
      });
    }
    // If authenticated, let the Link work normally
  };

  // Handle Apply Now click
  const handleApplyNow = (jobId, jobTitle, companyName, e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      addNotification('Please register as a student to apply for this job', 'info');
      navigate('/register', { 
        state: { 
          redirectTo: `/apply/job/${jobId}`,
          message: `Register as a student to apply for: ${jobTitle} at ${companyName}`,
          preferredRole: 'student'
        }
      });
    } else if (user?.role !== 'student') {
      e.preventDefault();
      addNotification('Only students can apply for jobs. Please login with a student account.', 'warning');
    }
    // If authenticated as student, let the Link work normally
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Industry filter
    if (filters.industry) {
      filtered = filtered.filter(job => 
        job.industry?.toLowerCase().includes(filters.industry.toLowerCase()) ||
        job.category?.toLowerCase().includes(filters.industry.toLowerCase()) ||
        job.field?.toLowerCase().includes(filters.industry.toLowerCase())
      );
    }

    // Job Type filter
    if (filters.jobType) {
      filtered = filtered.filter(job => 
        job.jobType?.toLowerCase() === filters.jobType.toLowerCase() ||
        job.type?.toLowerCase() === filters.jobType.toLowerCase() ||
        job.employmentType?.toLowerCase() === filters.jobType.toLowerCase()
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
        job.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
        job.country?.toLowerCase().includes(filters.location.toLowerCase()) ||
        job.workLocation?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(searchLower) ||
        job.companyName?.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower) ||
        job.requirements?.toLowerCase().includes(searchLower) ||
        job.qualifications?.toLowerCase().includes(searchLower)
      );
    }

    // Sorting with fallbacks
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'company':
          return (a.companyName || '').localeCompare(b.companyName || '');
        case 'date':
          return new Date(b.createdAt || b.postedDate || 0) - new Date(a.createdAt || a.postedDate || 0);
        case 'salary':
          return (b.salary || b.salaryRange || 0) - (a.salary || a.salaryRange || 0);
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      industry: '',
      jobType: '',
      location: '',
      search: '',
      sortBy: 'date'
    });
  };

  // Get unique values for filters from actual job data
  const industries = [...new Set(jobs
    .map(job => job.industry || job.category)
    .filter(Boolean)
  )].sort();

  const jobTypes = [...new Set(jobs
    .map(job => job.jobType || job.type || job.employmentType)
    .filter(Boolean)
  )].sort();

  const locations = [...new Set(jobs
    .map(job => job.location || job.city)
    .filter(Boolean)
  )].sort();

  const formatSalary = (salary) => {
    if (!salary) return 'Salary negotiable';
    if (typeof salary === 'string') return salary;
    return new Intl.NumberFormat('en-LS', {
      style: 'currency',
      currency: 'LSL',
      minimumFractionDigits: 0
    }).format(salary);
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

  const getDaysAgo = (dateString) => {
    if (!dateString) return '';
    try {
      const postedDate = dateString?.toDate ? dateString.toDate() : new Date(dateString);
      const today = new Date();
      const diffTime = Math.abs(today - postedDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    } catch (error) {
      return 'Recently';
    }
  };

  const isNewJob = (dateString) => {
    if (!dateString) return false;
    try {
      const postedDate = dateString?.toDate ? dateString.toDate() : new Date(dateString);
      const today = new Date();
      const diffTime = Math.abs(today - postedDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7; // New if posted within last 7 days
    } catch (error) {
      return false;
    }
  };

  // Show authentication prompt for public users
  const AuthPrompt = () => (
    <div className="auth-prompt">
      <div className="auth-prompt-content">
        <h4> Create a Student Account</h4>
        <p>Register as a student to view job details and apply for career opportunities</p>
        <div className="auth-prompt-actions">
          <Link to="/register" className="btn-primary">
            Register as Student
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
        <p>Loading job opportunities from companies in Lesotho...</p>
      </div>
    );
  }

  return (
    <div className="public-job-list">
      <div className="page-header">
        <h1>Job Opportunities</h1>
        <p>
          Discover {jobs.length} active career opportunities from leading companies in Lesotho
          {jobs.length > 0 && ` • ${filteredJobs.length} match your filters`}
        </p>
        
        {/* Show auth prompt for non-authenticated users */}
        {!isAuthenticated && <AuthPrompt />}
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filter Jobs</h3>
          <button 
            className="clear-filters-btn"
            onClick={clearFilters}
            disabled={!filters.industry && !filters.jobType && !filters.location && !filters.search}
          >
            Clear All Filters
          </button>
        </div>

        <div className="filter-grid">
          {/* Search Input */}
          <div className="filter-group search-group">
            <label>Search Jobs</label>
            <input
              type="text"
              placeholder="Search by job title, company, or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>

          {/* Industry Filter */}
          <div className="filter-group">
            <label>Industry</label>
            <select 
              value={filters.industry}
              onChange={(e) => handleFilterChange('industry', e.target.value)}
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          {/* Job Type Filter */}
          <div className="filter-group">
            <label>Job Type</label>
            <select 
              value={filters.jobType}
              onChange={(e) => handleFilterChange('jobType', e.target.value)}
            >
              <option value="">All Types</option>
              {jobTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
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
              <option value="date">Newest First</option>
              <option value="title">Job Title</option>
              <option value="company">Company Name</option>
              <option value="salary">Highest Salary</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.industry || filters.jobType || filters.location || filters.search) && (
          <div className="active-filters">
            <span>Active filters:</span>
            {filters.industry && (
              <span className="filter-tag">
                Industry: {filters.industry}
                <button onClick={() => handleFilterChange('industry', '')}>×</button>
              </span>
            )}
            {filters.jobType && (
              <span className="filter-tag">
                Type: {filters.jobType}
                <button onClick={() => handleFilterChange('jobType', '')}>×</button>
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

      {/* Jobs Grid */}
      <div className="jobs-section">
        <div className="section-header">
          <h2>
            Available Jobs 
            <span className="results-count">({filteredJobs.length} of {jobs.length})</span>
          </h2>
          {!isAuthenticated && (
            <div className="auth-reminder">
              <span> Register as student to apply for jobs</span>
            </div>
          )}
        </div>

        {filteredJobs.length > 0 ? (
          <div className="jobs-grid">
            {filteredJobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  {isNewJob(job.createdAt || job.postedDate) && (
                    <div className="job-badge new">NEW</div>
                  )}
                  <div className={`job-status ${job.status === 'active' ? 'active' : 'inactive'}`}>
                    {job.status === 'active' ? 'ACTIVE' : job.status?.toUpperCase() || 'INACTIVE'}
                  </div>
                  <h3 className="job-title">{job.title || 'Untitled Position'}</h3>
                  <div className="company-name">
                     {job.companyName || 'Unknown Company'}
                  </div>
                </div>

                <div className="job-meta">
                  <div className="meta-item">
                    
                    <span className="value">{job.location || 'Location not specified'}</span>
                  </div>
                  <div className="meta-item">
                    
                    <span className="value">
                      {job.jobType || job.type || job.employmentType || 'Full-time'}
                    </span>
                  </div>
                  <div className="meta-item">
                    
                    <span className="value">{formatSalary(job.salary || job.salaryRange)}</span>
                  </div>
                  <div className="meta-item">
                   
                    <span className="value">
                      {job.applicationDeadline ? 
                        `Apply by ${formatDate(job.applicationDeadline)}` : 
                        'No deadline'
                      }
                    </span>
                  </div>
                </div>

                <div className="job-description">
                  {job.description ? (
                    job.description.length > 150 ? 
                      `${job.description.substring(0, 150)}...` : 
                      job.description
                  ) : 'No description available.'}
                </div>

                {(job.requirements || job.qualifications) && (
                  <div className="qualification-preview">
                    <strong>Key Requirements:</strong>
                    <ul>
                      {((job.requirements && Array.isArray(job.requirements) ? job.requirements : 
                        job.qualifications && Array.isArray(job.qualifications) ? job.qualifications : 
                        [job.requirements || job.qualifications || 'Not specified']
                      ).slice(0, 2).map((qual, index) => (
                        <li key={index}>{qual}</li>
                      )))}
                      {((job.requirements && Array.isArray(job.requirements) ? job.requirements.length : 
                        job.qualifications && Array.isArray(job.qualifications) ? job.qualifications.length : 0
                      ) > 2) && (
                        <li>+{((job.requirements && Array.isArray(job.requirements) ? job.requirements.length : 
                             job.qualifications && Array.isArray(job.qualifications) ? job.qualifications.length : 0) - 2)} more requirements</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="job-footer">
                  <div className="posted-date">
                    Posted {getDaysAgo(job.createdAt || job.postedDate)}
                  </div>
                  <div className="job-actions">
                    <Link 
                      to={`/jobs/${job.id}`}
                      className="btn-outline"
                      onClick={(e) => handleViewDetails(
                        job.id, 
                        job.title || 'this job', 
                        e
                      )}
                    >
                      {isAuthenticated ? 'View Details' : 'View Details '}
                    </Link>
                    <Link 
                      to={`/apply/job/${job.id}`}
                      className="btn-primary"
                      onClick={(e) => handleApplyNow(
                        job.id, 
                        job.title || 'this job',
                        job.companyName || 'the company',
                        e
                      )}
                    >
                      {isAuthenticated ? 'Apply Now' : 'Apply Now '}
                    </Link>
                  </div>
                </div>

                {/* Show message for non-students */}
                {isAuthenticated && user?.role !== 'student' && (
                  <div className="role-warning">
                    <small> Only student accounts can apply for jobs</small>
                  </div>
                )}

                {/* Job metadata */}
                <div className="job-meta-footer">
                  <small>
                    ID: {job.id} • 
                    Posted: {formatDate(job.createdAt || job.postedDate)}
                    {job.updatedAt && ` • Updated: ${formatDate(job.updatedAt)}`}
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h3>No jobs found</h3>
            <p>
              {jobs.length === 0 
                ? 'No active job opportunities are currently available.' 
                : 'Try adjusting your filters or search terms to find what you\'re looking for.'
              }
            </p>
            {jobs.length > 0 && (
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

export default PublicJobList;
