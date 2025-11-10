// src/components/public/Jobs/PublicJobList.jsx
import React, { useState, useEffect } from 'react';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';

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
    search: ''
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
      if (response.success) {
        setJobs(response.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      addNotification('Error loading jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = jobs;

    if (filters.industry) {
      filtered = filtered.filter(job => job.industry === filters.industry);
    }

    if (filters.jobType) {
      filtered = filtered.filter(job => job.jobType === filters.jobType);
    }

    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.companyName.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredJobs(filtered);
  };

  const industries = [...new Set(jobs.map(job => job.industry).filter(Boolean))];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="public-job-list">
      <div className="page-header">
        <h1>Job Opportunities</h1>
        <p>Discover career opportunities from leading companies</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-grid">
          <div className="filter-group">
            <label>Industry</label>
            <select 
              value={filters.industry}
              onChange={(e) => setFilters({...filters, industry: e.target.value})}
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Job Type</label>
            <select 
              value={filters.jobType}
              onChange={(e) => setFilters({...filters, jobType: e.target.value})}
            >
              <option value="">All Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Location</label>
            <input
              type="text"
              placeholder="City or remote..."
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search jobs or companies..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="jobs-section">
        <div className="section-header">
          <h2>Available Jobs ({filteredJobs.length})</h2>
        </div>

        {filteredJobs.length > 0 ? (
          <div className="jobs-grid">
            {filteredJobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  <h3 className="job-title">{job.title}</h3>
                  <div className="company-name">{job.companyName}</div>
                </div>

                <div className="job-meta">
                  <div className="meta-item">
                    <span className="label">📍</span>
                    <span>{job.location}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">⏱️</span>
                    <span>{job.jobType}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">💰</span>
                    <span>{job.salaryRange || 'Salary negotiable'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">📅</span>
                    <span>
                      {new Date(job.applicationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="job-description">
                  {job.description?.length > 200 
                    ? `${job.description.substring(0, 200)}...`
                    : job.description
                  }
                </div>

                <div className="qualification-preview">
                  <strong>Key Requirements:</strong>
                  <ul>
                    {job.requiredQualifications?.slice(0, 2).map((qual, index) => (
                      <li key={index}>{qual}</li>
                    ))}
                    {job.requiredQualifications?.length > 2 && (
                      <li>+{job.requiredQualifications.length - 2} more requirements</li>
                    )}
                  </ul>
                </div>

                <div className="job-actions">
                  <button className="btn-outline">View Details</button>
                  <button className="btn-primary">Apply Now</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💼</div>
            <h3>No jobs found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button 
              className="btn-secondary"
              onClick={() => setFilters({ industry: '', jobType: '', location: '', search: '' })}
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
