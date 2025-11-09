// components/student/Courses/CourseFilters.jsx
import React from 'react';

const CourseFilters = ({ filters, institutions, faculties, onFilterChange, onClearFilters, hasProfileGrades }) => {
  const handleFilterUpdate = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = filters.institution || filters.faculty || filters.search || filters.duration || filters.qualification !== 'all';

  return (
    <div className="course-filters">
      <div className="filters-header">
        <h3>Filter Courses</h3>
        {hasActiveFilters && (
          <button onClick={onClearFilters} className="btn btn-outline btn-sm">
            Clear All
          </button>
        )}
      </div>

      <div className="filters-grid">
        {/* Search */}
        <div className="filter-group">
          <label>Search Courses</label>
          <input
            type="text"
            placeholder="Search by course name, description, or institution..."
            value={filters.search}
            onChange={(e) => handleFilterUpdate('search', e.target.value)}
            className="form-input"
          />
        </div>

        {/* Institution */}
        <div className="filter-group">
          <label>Institution</label>
          <select
            value={filters.institution}
            onChange={(e) => handleFilterUpdate('institution', e.target.value)}
            className="form-select"
          >
            <option value="">All Institutions</option>
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.institutionName || inst.name}
              </option>
            ))}
          </select>
        </div>

        {/* Faculty */}
        <div className="filter-group">
          <label>Faculty</label>
          <select
            value={filters.faculty}
            onChange={(e) => handleFilterUpdate('faculty', e.target.value)}
            className="form-select"
          >
            <option value="">All Faculties</option>
            {faculties.map(faculty => (
              <option key={faculty} value={faculty}>
                {faculty}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div className="filter-group">
          <label>Max Duration (months)</label>
          <select
            value={filters.duration}
            onChange={(e) => handleFilterUpdate('duration', e.target.value)}
            className="form-select"
          >
            <option value="">Any Duration</option>
            <option value="6">6 months or less</option>
            <option value="12">12 months or less</option>
            <option value="24">24 months or less</option>
            <option value="36">36 months or less</option>
          </select>
        </div>

        {/* Qualification Status - Only show if profile has grades */}
        {hasProfileGrades && (
          <div className="filter-group">
            <label>Qualification Status</label>
            <select
              value={filters.qualification}
              onChange={(e) => handleFilterUpdate('qualification', e.target.value)}
              className="form-select"
            >
              <option value="all">All Courses</option>
              <option value="qualified">I Qualify</option>
              <option value="unqualified">Need Improvement</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseFilters;