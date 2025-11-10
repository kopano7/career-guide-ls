// src/components/institute/Applications/ApplicationManagement.jsx
import React, { useState, useEffect } from 'react';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';
import ApplicationReview from './ApplicationReview';
import './Application.css';

const ApplicationManagement = () => {
  const { get, put, post } = useApi();
  const { addNotification } = useNotifications();
  
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [filters, setFilters] = useState({
    faculty: '',
    status: '',
    course: '',
    search: ''
  });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchApplications();
    fetchFaculties();
    fetchCourses();
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

  const fetchFaculties = async () => {
    try {
      const response = await get('/institute/faculties');
      if (response.data.success) {
        setFaculties(response.data.faculties);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await get('/institute/courses');
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    // Filter by faculty (through course faculty)
    if (filters.faculty) {
      filtered = filtered.filter(app => {
        const course = courses.find(c => c.id === app.courseId);
        return course && course.faculty === filters.faculty;
      });
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Filter by course
    if (filters.course) {
      filtered = filtered.filter(app => app.courseId === filters.course);
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.studentName.toLowerCase().includes(searchTerm) ||
        app.courseName.toLowerCase().includes(searchTerm) ||
        (app.studentEmail && app.studentEmail.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredApplications(filtered);
  };

  const handleAdmissionDecision = async (applicationId, status, notes = '') => {
    try {
      const response = await put(`/institute/applications/${applicationId}`, {
        status: status,
        notes: notes
      });

      if (response.data.success) {
        addNotification(`Application ${status} successfully!`, 'success');
        fetchApplications();
        setShowReviewModal(false);
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      addNotification(
        error.response?.data?.message || 'Error updating application', 
        'error'
      );
    }
  };

  const handleWaitlist = async (applicationId, position = null) => {
    try {
      const response = await put(`/institute/applications/${applicationId}/waitlist`, {
        position: position
      });

      if (response.data.success) {
        addNotification('Application waitlisted successfully!', 'success');
        fetchApplications();
      }
    } catch (error) {
      console.error('Error waitlisting application:', error);
      addNotification('Error waitlisting application', 'error');
    }
  };

  const viewTranscript = (application) => {
    if (application.transcript && application.transcript.url) {
      window.open(application.transcript.url, '_blank');
    } else {
      addNotification('No transcript available for this student', 'warning');
    }
  };

  const downloadTranscript = async (application) => {
    try {
      if (application.transcript && application.transcript.url) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = application.transcript.url;
        link.download = `transcript_${application.studentName}_${application.courseName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification('Transcript download started', 'success');
      } else {
        addNotification('No transcript available for download', 'warning');
      }
    } catch (error) {
      console.error('Error downloading transcript:', error);
      addNotification('Error downloading transcript', 'error');
    }
  };

  const exportApplications = async () => {
    try {
      const response = await post('/institute/applications/export', {
        filters: filters,
        applications: filteredApplications
      });

      if (response.data.success && response.data.downloadUrl) {
        // Download the exported file
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `applications_export_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification('Applications exported successfully!', 'success');
      }
    } catch (error) {
      console.error('Error exporting applications:', error);
      addNotification('Error exporting applications', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      admitted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      waitlisted: 'bg-blue-100 text-blue-800',
      accepted: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCoursesByFaculty = (faculty) => {
    return courses.filter(course => course.faculty === faculty);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="application-management">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-gray-900">Application Review</h1>
        <p className="text-gray-600">Review and manage student applications</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Faculty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Faculty
            </label>
            <select
              value={filters.faculty}
              onChange={(e) => setFilters({...filters, faculty: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Faculties</option>
              {faculties.map(faculty => (
                <option key={faculty.id} value={faculty.name}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <select
              value={filters.course}
              onChange={(e) => setFilters({...filters, course: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Courses</option>
              {getCoursesByFaculty(filters.faculty).map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="admitted">Admitted</option>
              <option value="rejected">Rejected</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search students..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Export Button */}
          <div className="flex items-end">
            <button
              onClick={exportApplications}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="applications-grid">
        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map(application => (
              <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.studentName}
                    </h3>
                    <p className="text-gray-600">{application.studentEmail}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                    {application.isQualified === false && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Not Qualified
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Course</label>
                    <p className="text-gray-900">{application.courseName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Applied</label>
                    <p className="text-gray-900">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Qualification Score</label>
                    <p className="text-gray-900">
                      {application.qualificationScore ? `${application.qualificationScore}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewTranscript(application)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View Transcript
                    </button>
                    <button
                      onClick={() => downloadTranscript(application)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Download PDF
                    </button>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedApplication(application);
                        setShowReviewModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Review
                    </button>

                    {application.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAdmissionDecision(application.id, 'admitted')}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Admit
                        </button>
                        <button
                          onClick={() => handleAdmissionDecision(application.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleWaitlist(application.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Waitlist
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">No applications found matching your filters</p>
            <button
              onClick={() => setFilters({ faculty: '', status: '', course: '', search: '' })}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Application Review Modal */}
      {showReviewModal && selectedApplication && (
        <ApplicationReview
          application={selectedApplication}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedApplication(null);
          }}
          onApplicationUpdate={fetchApplications}
          onAdmissionDecision={handleAdmissionDecision}
          onWaitlist={handleWaitlist}
          onViewTranscript={viewTranscript}
          onDownloadTranscript={downloadTranscript}
        />
      )}
    </div>
  );
};

export default ApplicationManagement;