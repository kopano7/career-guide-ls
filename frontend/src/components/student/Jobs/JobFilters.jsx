// File: src/components/student/Jobs/JobFilters.jsx
import React from 'react';

const JobFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const handleFilterChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const hasActiveFilters = filters.company || filters.jobType || filters.location || filters.search;

  return (
    <div className="job-filters">
      <div className="filters-header">
        <h3>🔍 Filter Jobs</h3>
        {hasActiveFilters && (
          <button onClick={onClearFilters} className="btn btn-outline btn-sm">
            Clear All
          </button>
        )}
      </div>

      <div className="filters-content">
        {/* Search Filter */}
        <div className="filter-group">
          <label>Search Jobs</label>
          <input
            type="text"
            placeholder="Search by title, company, or skills..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="filter-input"
          />
        </div>

        {/* Job Type Filter */}
        <div className="filter-group">
          <label>Job Type</label>
          <select
            value={filters.jobType}
            onChange={(e) => handleFilterChange('jobType', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="remote">Remote</option>
          </select>
        </div>

        {/* Location Filter */}
        <div className="filter-group">
          <label>Location</label>
          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="filter-select"
          >
            <option value="">All Locations</option>
            <option value="maseru">Maseru</option>
            <option value="berea">Berea</option>
            <option value="leribe">Leribe</option>
            <option value="mohales-hoek">Mohale's Hoek</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {/* Company Filter */}
        <div className="filter-group">
          <label>Company</label>
          <input
            type="text"
            placeholder="Filter by company..."
            value={filters.company}
            onChange={(e) => handleFilterChange('company', e.target.value)}
            className="filter-input"
          />
        </div>
      </div>
    </div>
  );
};

export default JobFilters;