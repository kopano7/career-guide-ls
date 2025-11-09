// src/pages/institute/ApplicationManagement.jsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useNotifications } from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import ApplicationReview from '../../components/institute/Applications/ApplicationReview';

const ApplicationManagement = () => {
  const { get } = useApi();
  const { addNotification } = useNotifications();
  
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    course: 'all',
    search: ''
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const fetchApplications = async () => {
    try {
      const response = await get('/institute/applications');
      if (response.data.success) {
        setApplications(response.data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      addNotification('Error loading applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = applications;

    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    if (filters.course !== 'all') {
      filtered = filtered.filter(app => app.courseId === filters.course);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.studentName.toLowerCase().includes(searchLower) ||
        app.courseName.toLowerCase().includes(searchLower)
      );
    }

    setFilteredApplications(filtered);
  };

  const getStatusCount = (status) => {
    return applications.filter(app => app.status === status).length;
  };

  const courses = [...new Set(applications.map(app => ({ id: app.courseId, name: app.courseName })))];
  const uniqueCourses = courses.filter((course, index, self) => 
    index === self.findIndex(c => c.id === course.id)
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Application Management</h1>
          <p className="page-description">
            Review and manage student applications for your courses
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-badge pending">{getStatusCount('pending')} Pending</div>
          <div className="stat-badge admitted">{getStatusCount('admitted')} Admitted</div>
          <div className="stat-badge rejected">{getStatusCount('rejected')} Rejected</div>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="content-card">
          <div className="card-header">
            <h3>Filters</h3>
          </div>
          <div className="card-content">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="admitted">Admitted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Course</label>
                <select 
                  value={filters.course}
                  onChange={(e) => setFilters({...filters, course: e.target.value})}
                >
                  <option value="all">All Courses</option>
                  {uniqueCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search by student or course name..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="content-card">
          <div className="card-header">
            <h3>Applications ({filteredApplications.length})</h3>
          </div>
          <div className="card-content">
            {filteredApplications.length > 0 ? (
              <div className="applications-table">
                <div className="table-header">
                  <div className="table-cell">Student</div>
                  <div className="table-cell">Course</div>
                  <div className="table-cell">Applied Date</div>
                  <div className="table-cell">Status</div>
                  <div className="table-cell">Match Score</div>
                  <div className="table-cell">Actions</div>
                </div>
                <div className="table-body">
                  {filteredApplications.map(application => (
                    <div key={application.id} className="table-row">
                      <div className="table-cell">
                        <div className="student-info">
                          <strong>{application.studentName}</strong>
                          <span>{application.studentEmail}</span>
                        </div>
                      </div>
                      <div className="table-cell">
                        {application.courseName}
                      </div>
                      <div className="table-cell">
                        {new Date(application.appliedAt).toLocaleDateString()}
                      </div>
                      <div className="table-cell">
                        <span className={`status-badge ${application.status}`}>
                          {application.status}
                        </span>
                      </div>
                      <div className="table-cell">
                        {application.matchScore ? (
                          <div className="score-indicator">
                            <div 
                              className="score-bar"
                              style={{ width: `${application.matchScore}%` }}
                            ></div>
                            <span>{application.matchScore}%</span>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </div>
                      <div className="table-cell">
                        <button 
                          className="btn-outline"
                          onClick={() => setSelectedApplication(application)}
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No applications found matching your filters</p>
                <button 
                  className="btn-secondary"
                  onClick={() => setFilters({ status: 'all', course: 'all', search: '' })}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Review Modal */}
      {selectedApplication && (
        <ApplicationReview
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onApplicationUpdate={fetchApplications}
        />
      )}
    </div>
  );
};

export default ApplicationManagement;