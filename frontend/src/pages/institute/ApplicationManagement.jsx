// src/pages/institute/ApplicationManagement.jsx
import React, { useState, useEffect } from 'react';
import { instituteAPI } from '../../services/api/institute';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import ApplicationReview from '../../components/institute/Applications/ApplicationReview';

const ApplicationManagement = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    course: 'all',
    faculty: 'all',
    qualification: 'all',
    search: ''
  });

  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    fetchApplications();
    fetchCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await instituteAPI.getApplications();
      console.log('📋 Applications API response:', response);
      
      if (response.success) {
        setApplications(response.data.applications || []);
      } else {
        throw new Error(response.message || 'Failed to load applications');
      }
    } catch (err) {
      console.error('❌ Error fetching applications:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await instituteAPI.getCourses();
      if (response.success) {
        setCourses(response.data.courses || []);
        
        // Extract unique faculties from courses
        const uniqueFaculties = [...new Set(response.data.courses
          .filter(course => course.faculty)
          .map(course => course.faculty)
        )];
        setFaculties(uniqueFaculties);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const applyFilters = () => {
    let filtered = applications;

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Course filter
    if (filters.course !== 'all') {
      filtered = filtered.filter(app => app.courseId === filters.course);
    }

    // Faculty filter
    if (filters.faculty !== 'all') {
      filtered = filtered.filter(app => {
        const course = courses.find(c => c.id === app.courseId);
        return course && course.faculty === filters.faculty;
      });
    }

    // Qualification filter
    if (filters.qualification !== 'all') {
      filtered = filtered.filter(app => {
        if (filters.qualification === 'qualified') return app.isQualified === true;
        if (filters.qualification === 'unqualified') return app.isQualified === false;
        return true;
      });
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.studentName?.toLowerCase().includes(searchLower) ||
        app.courseName?.toLowerCase().includes(searchLower) ||
        app.applicationNumber?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredApplications(filtered);
  };

  const getStatusCount = (status) => {
    return applications.filter(app => app.status === status).length;
  };

  const getQualificationCount = (qualified) => {
    return applications.filter(app => app.isQualified === qualified).length;
  };

  const handleExportApplications = () => {
    try {
      const dataToExport = filteredApplications.map(app => ({
        'Application Number': app.applicationNumber || 'N/A',
        'Student Name': app.studentName || 'N/A',
        'Course': app.courseName || 'N/A',
        'Faculty': courses.find(c => c.id === app.courseId)?.faculty || 'N/A',
        'Applied Date': app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A',
        'Status': app.status || 'N/A',
        'Qualified': app.isQualified ? 'Yes' : 'No',
        'Qualification Score': app.qualificationScore ? `${app.qualificationScore}%` : 'N/A',
        'GPA': app.calculatedGPA || 'N/A'
      }));

      // Create CSV content
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting applications:', error);
      alert('Failed to export applications');
    }
  };

  const handleViewTranscript = (application) => {
    if (application.transcript?.fileUrl) {
      // Open transcript in new tab
      window.open(application.transcript.fileUrl, '_blank');
    } else if (application.student?.transcript?.fileUrl) {
      window.open(application.student.transcript.fileUrl, '_blank');
    } else {
      alert('No transcript available for this student');
    }
  };

  const handleDownloadTranscript = (application) => {
    const transcriptUrl = application.transcript?.fileUrl || application.student?.transcript?.fileUrl;
    
    if (transcriptUrl) {
      const link = document.createElement('a');
      link.href = transcriptUrl;
      link.download = `transcript-${application.studentName || 'student'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No transcript available for download');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <LoadingSpinner text="Loading applications..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Error Loading Applications</h2>
        <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={fetchApplications}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333', fontSize: '2rem' }}>📋 Application Management</h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '1.1rem' }}>
            Review and manage student applications for your courses
          </p>
        </div>
        
        {/* Export Button */}
        {filteredApplications.length > 0 && (
          <button 
            onClick={handleExportApplications}
            style={{
              padding: '10px 20px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            📊 Export CSV
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📥</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>{applications.length}</h3>
          <p style={{ margin: 0, color: '#666' }}>Total Applications</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>{getStatusCount('pending')}</h3>
          <p style={{ margin: 0, color: '#666' }}>Pending Review</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>{getQualificationCount(true)}</h3>
          <p style={{ margin: 0, color: '#666' }}>Qualified</p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎓</div>
          <h3 style={{ margin: 0, fontSize: '24px' }}>{getStatusCount('admitted')}</h3>
          <p style={{ margin: 0, color: '#666' }}>Admitted</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Filters</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Status
            </label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="admitted">Admitted</option>
              <option value="rejected">Rejected</option>
              <option value="waitlisted">Waitlisted</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Course
            </label>
            <select 
              value={filters.course}
              onChange={(e) => setFilters({...filters, course: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Faculty Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Faculty
            </label>
            <select 
              value={filters.faculty}
              onChange={(e) => setFilters({...filters, faculty: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">All Faculties</option>
              {faculties.map(faculty => (
                <option key={faculty} value={faculty}>
                  {faculty}
                </option>
              ))}
            </select>
          </div>

          {/* Qualification Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Qualification
            </label>
            <select 
              value={filters.qualification}
              onChange={(e) => setFilters({...filters, qualification: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">All Qualifications</option>
              <option value="qualified">Qualified Only</option>
              <option value="unqualified">Unqualified Only</option>
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search by student, course, or application #..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.status !== 'all' || filters.course !== 'all' || filters.faculty !== 'all' || filters.qualification !== 'all' || filters.search) && (
          <div style={{ marginTop: '15px', textAlign: 'right' }}>
            <button
              onClick={() => setFilters({ status: 'all', course: 'all', faculty: 'all', qualification: 'all', search: '' })}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#6b7280'
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Applications List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 25px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>
            Applications ({filteredApplications.length})
          </h3>
          
          {filteredApplications.length > 0 && (
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          )}
        </div>

        <div style={{ padding: '0' }}>
          {filteredApplications.length > 0 ? (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1.5fr',
                gap: '15px',
                padding: '15px 25px',
                background: '#f8fafc',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                <div>Student & Application</div>
                <div>Course & Faculty</div>
                <div>Applied</div>
                <div>Status</div>
                <div>Qualification</div>
                <div>GPA</div>
                <div>Actions</div>
              </div>

              {/* Table Body */}
              <div>
                {filteredApplications.map((application, index) => (
                  <div
                    key={application.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1.5fr',
                      gap: '15px',
                      padding: '20px 25px',
                      borderBottom: '1px solid #f3f4f6',
                      alignItems: 'center',
                      background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fafafa'}
                  >
                    {/* Student & Application */}
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {application.studentName || 'Unknown Student'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {application.applicationNumber || 'N/A'}
                      </div>
                    </div>

                    {/* Course & Faculty */}
                    <div>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {application.courseName || 'Unknown Course'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {courses.find(c => c.id === application.courseId)?.faculty || 'N/A'}
                      </div>
                    </div>

                    {/* Applied Date */}
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        background: 
                          application.status === 'admitted' ? '#d1fae5' :
                          application.status === 'rejected' ? '#fee2e2' :
                          application.status === 'waitlisted' ? '#fef3c7' : '#e0f2fe',
                        color:
                          application.status === 'admitted' ? '#065f46' :
                          application.status === 'rejected' ? '#dc2626' :
                          application.status === 'waitlisted' ? '#92400e' : '#0369a1'
                      }}>
                        {application.status || 'pending'}
                      </span>
                    </div>

                    {/* Qualification */}
                    <div>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: application.isQualified ? '#d1fae5' : '#fee2e2',
                        color: application.isQualified ? '#065f46' : '#dc2626'
                      }}>
                        {application.isQualified ? '✅ Qualified' : '❌ Unqualified'}
                      </span>
                      {application.qualificationScore && (
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                          {application.qualificationScore}% match
                        </div>
                      )}
                    </div>

                    {/* GPA */}
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {application.calculatedGPA ? application.calculatedGPA.toFixed(2) : 'N/A'}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setSelectedApplication(application)}
                        style={{
                          padding: '8px 12px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Review
                      </button>
                      
                      <button
                        onClick={() => handleViewTranscript(application)}
                        style={{
                          padding: '8px 12px',
                          background: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        📄 View PDF
                      </button>
                      
                      <button
                        onClick={() => handleDownloadTranscript(application)}
                        style={{
                          padding: '8px 12px',
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No Applications Found</h3>
              <p style={{ margin: '0 0 20px 0' }}>
                {applications.length === 0 
                  ? 'No applications have been submitted yet.' 
                  : 'No applications match your current filters.'}
              </p>
              {applications.length > 0 && (
                <button
                  onClick={() => setFilters({ status: 'all', course: 'all', faculty: 'all', qualification: 'all', search: '' })}
                  style={{
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Application Review Modal */}
      {selectedApplication && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <ApplicationReview
            application={selectedApplication}
            onClose={() => setSelectedApplication(null)}
            onApplicationUpdate={fetchApplications}
          />
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;