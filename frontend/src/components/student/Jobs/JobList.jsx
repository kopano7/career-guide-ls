// src/components/student/Jobs/JobList.jsx
import React, { useState, useEffect } from 'react';
import JobCard from './JobCard';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    industry: '',
    location: '',
    jobType: '',
    qualificationMatch: 'all'
  });
  
  const { get } = useApi();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchQualifiedJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters]);

  const fetchQualifiedJobs = async () => {
    try {
      setLoading(true);
      const response = await get('/student/jobs/qualified');
      
      if (response.data.success) {
        setJobs(response.data.jobs || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching qualified jobs:', error);
      addNotification(
        error.response?.data?.message || 'Error loading job opportunities', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = jobs;

    if (filters.industry) {
      filtered = filtered.filter(job => 
        job.industry?.toLowerCase().includes(filters.industry.toLowerCase())
      );
    }

    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.jobType) {
      filtered = filtered.filter(job => job.jobType === filters.jobType);
    }

    if (filters.qualificationMatch === 'high') {
      filtered = filtered.filter(job => job.matchScore >= 80);
    } else if (filters.qualificationMatch === 'medium') {
      filtered = filtered.filter(job => job.matchScore >= 60 && job.matchScore < 80);
    }

    setFilteredJobs(filtered);
  };

  const industries = [...new Set(jobs.map(job => job.industry).filter(Boolean))];
  const locations = [...new Set(jobs.map(job => job.location).filter(Boolean))];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="job-list-container">
      <div className="job-list-header">
        <h1>Job Opportunities</h1>
        <p>These jobs match your qualifications and profile</p>
      </div>

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
            <label>Location</label>
            <select 
              value={filters.location} 
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
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
            <label>Match Score</label>
            <select 
              value={filters.qualificationMatch} 
              onChange={(e) => setFilters({...filters, qualificationMatch: e.target.value})}
            >
              <option value="all">All Matches</option>
              <option value="high">High Match (80%+)</option>
              <option value="medium">Medium Match (60%+)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="jobs-stats">
        <p>Showing {filteredJobs.length} of {jobs.length} matching jobs</p>
      </div>

      <div className="jobs-grid">
        {filteredJobs.length === 0 ? (
          <div className="no-jobs-found">
            <div className="no-jobs-icon">🔍</div>
            <h3>No jobs match your current filters</h3>
            <p>Try adjusting your filters or check back later for new opportunities.</p>
            <button 
              className="btn-secondary"
              onClick={() => setFilters({
                industry: '',
                location: '',
                jobType: '',
                qualificationMatch: 'all'
              })}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          filteredJobs.map(job => (
            <JobCard key={job.id} job={job} onApplicationUpdate={fetchQualifiedJobs} />
          ))
        )}
      </div>
    </div>
  );
};

export default JobList;