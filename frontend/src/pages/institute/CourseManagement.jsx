// src/pages/institute/CourseManagement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { instituteAPI } from '../../services/api/institute';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import CourseForm from '../../components/institution/Courses/CourseForm';
import CourseCard from '../../components/institution/Courses/CourseCard';

const CourseManagement = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📚 Fetching courses for institute:', user?.id);
      
      const response = await instituteAPI.getCourses();
      console.log('📥 Courses API response:', response);
      
      if (response.success) {
        setCourses(response.data.courses || []);
      } else {
        throw new Error(response.message || 'Failed to load courses');
      }
    } catch (err) {
      console.error('❌ Error fetching courses:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (courseData) => {
    try {
      setError(null);
      console.log('➕ Creating course:', courseData);
      
      const response = await instituteAPI.addCourse(courseData);
      console.log('📥 Create course response:', response);
      
      if (response.success) {
        setSuccess('Course created successfully!');
        setShowForm(false);
        await fetchCourses(); // Refresh the list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || 'Failed to create course');
      }
    } catch (err) {
      console.error('❌ Error creating course:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create course');
    }
  };

  const handleUpdateCourse = async (courseId, courseData) => {
    try {
      setError(null);
      console.log('✏️ Updating course:', courseId, courseData);
      
      const response = await instituteAPI.updateCourse(courseId, courseData);
      console.log('📥 Update course response:', response);
      
      if (response.success) {
        setSuccess('Course updated successfully!');
        setEditingCourse(null);
        await fetchCourses(); // Refresh the list
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || 'Failed to update course');
      }
    } catch (err) {
      console.error('❌ Error updating course:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      console.log('🗑️ Deleting course:', courseId);
      
      const response = await instituteAPI.deleteCourse(courseId);
      console.log('📥 Delete course response:', response);
      
      if (response.success) {
        setSuccess('Course deleted successfully!');
        await fetchCourses(); // Refresh the list
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || 'Failed to delete course');
      }
    } catch (err) {
      console.error('❌ Error deleting course:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete course');
    }
  };

  const handleToggleCourseStatus = async (courseId, currentStatus) => {
    try {
      setError(null);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const response = await instituteAPI.updateCourse(courseId, { status: newStatus });
      
      if (response.success) {
        setSuccess(`Course ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
        await fetchCourses();
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || 'Failed to update course status');
      }
    } catch (err) {
      console.error('❌ Error updating course status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update course status');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <LoadingSpinner text="Loading your courses..." />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1200px',
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
          <h1 style={{ margin: 0, color: '#333', fontSize: '2rem' }}>📚 Course Management</h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '1.1rem' }}>
            Manage your institution's courses and programs
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9rem' }}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} • {courses.filter(c => c.status === 'active').length} active
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>➕</span>
          Add New Course
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>❌ {error}</span>
          <button 
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>✅ {success}</span>
          <button 
            onClick={() => setSuccess(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#065f46',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Courses Grid */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {courses.length > 0 ? (
            courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={() => setEditingCourse(course)}
                onDelete={() => handleDeleteCourse(course.id)}
                onToggleStatus={() => handleToggleCourseStatus(course.id, course.status)}
                onViewApplications={() => {
                  // Navigate to applications page for this course
                  console.log('View applications for:', course.id);
                  // You can implement navigation here
                }}
              />
            ))
          ) : (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px 20px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>No Courses Yet</h3>
              <p style={{ margin: '0 0 20px 0', color: '#666', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                Start by creating your first course to attract students to your institution.
              </p>
              <button 
                onClick={() => setShowForm(true)}
                style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Create Your First Course
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Course Form Modal */}
      {(showForm || editingCourse) && (
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
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <CourseForm
              mode={editingCourse ? 'edit' : 'create'}
              course={editingCourse}
              onSubmit={editingCourse ? 
                (data) => handleUpdateCourse(editingCourse.id, data) : 
                handleCreateCourse
              }
              onClose={() => {
                setShowForm(false);
                setEditingCourse(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          background: '#f3f4f6',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '14px',
          marginTop: '30px',
          fontFamily: 'monospace'
        }}>
          <strong>Debug Info:</strong>
          <div>Institute ID: {user?.id}</div>
          <div>Total Courses: {courses.length}</div>
          <div>Active Courses: {courses.filter(c => c.status === 'active').length}</div>
          <div>API Response: {JSON.stringify(courses.slice(0, 1))}</div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;