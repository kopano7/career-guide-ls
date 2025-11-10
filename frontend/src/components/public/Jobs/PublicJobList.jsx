// src/components/public/Jobs/PublicJobList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import './PublicJobList.css';

const PublicJobList = () => {
  const { get } = useApi();
  const { addNotification } = useNotifications();
  
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
      const response = await get('/public/jobs');
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      addNotification('Error loading jobs. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
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
        job.type?.toLowerCase() === filters.jobType.toLowerCase()
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

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'company':
          return (a.companyName || '').localeCompare(b.companyName || '');
        case 'date':
          return new Date(b.createdAt || b.postedDate) - new Date(a.createdAt || a.postedDate);
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

  // Get unique values for filters
  const industries = [...new Set(jobs
    .map(job => job.industry || job.category)
    .filter(Boolean)
  )].sort();

  const jobTypes = [...new Set(jobs
    .map(job => job.jobType || job.type)
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
    return new Date(dateString).toLocaleDateString('en-LS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysAgo = (dateString) => {
    if (!dateString) return '';
    const postedDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - postedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const isNewJob = (dateString) => {
    if (!dateString) return false;
    const postedDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - postedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // New if posted within last 7 days
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="public-job-list">
      <div className="page-header">
        <h1>Job Opportunities</h1>
        <p>Discover {jobs.length} career opportunities from leading companies in Lesotho</p>
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
        </div>

        {filteredJobs.length > 0 ? (
          <div className="jobs-grid">
            {filteredJobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  {isNewJob(job.createdAt || job.postedDate) && (
                    <div className="job-badge new">NEW</div>
                  )}
                  <div className="job-status">
                    {job.status === 'active' ? 'ACTIVE' : job.status?.toUpperCase()}
                  </div>
                  <h3 className="job-title">{job.title}</h3>
                  <div className="company-name">{job.companyName}</div>
                </div>

                <div className="job-meta">
                  <div className="meta-item">
                    <span className="label">📍</span>
                    <span className="value">{job.location || 'Location not specified'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">⏱️</span>
                    <span className="value">
                      {job.jobType || job.type || 'Full-time'}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="label">💰</span>
                    <span className="value">{formatSalary(job.salary || job.salaryRange)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">📅</span>
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
                    >
                      View Details
                    </Link>
                    <Link 
                      to={`/apply/job/${job.id}`}
                      className="btn-primary"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💼</div>
            <h3>No jobs found</h3>
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

export default PublicJobList;
