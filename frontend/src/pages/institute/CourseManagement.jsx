// src/pages/institute/CourseManagement.jsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useNotifications } from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import CourseForm from '../../components/institute/Courses/CourseForm';

const CourseManagement = () => {
  const { get, post, put, delete: deleteApi } = useApi();
  const { addNotification } = useNotifications();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await get('/institute/courses');
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      addNotification('Error loading courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (courseData) => {
    try {
      const response = await post('/institute/courses', courseData);
      if (response.data.success) {
        addNotification('Course created successfully!', 'success');
        setShowForm(false);
        fetchCourses();
      }
    } catch (error) {
      console.error('Error creating course:', error);
      addNotification(
        error.response?.data?.message || 'Error creating course', 
        'error'
      );
    }
  };

  const handleUpdateCourse = async (courseId, courseData) => {
    try {
      const response = await put(`/institute/courses/${courseId}`, courseData);
      if (response.data.success) {
        addNotification('Course updated successfully!', 'success');
        setEditingCourse(null);
        fetchCourses();
      }
    } catch (error) {
      console.error('Error updating course:', error);
      addNotification(
        error.response?.data?.message || 'Error updating course', 
        'error'
      );
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await deleteApi(`/institute/courses/${courseId}`);
      if (response.data.success) {
        addNotification('Course deleted successfully!', 'success');
        fetchCourses();
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      addNotification(
        error.response?.data?.message || 'Error deleting course', 
        'error'
      );
    }
  };

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
          <h1 className="page-title">Course Management</h1>
          <p className="page-description">
            Manage your institution's courses and programs
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            Add New Course
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Courses List */}
        <div className="content-card">
          <div className="card-header">
            <h3>Your Courses ({courses.length})</h3>
          </div>
          <div className="card-content">
            {courses.length > 0 ? (
              <div className="courses-list">
                {courses.map(course => (
                  <div key={course.id} className="course-item">
                    <div className="course-info">
                      <div className="course-main">
                        <h4>{course.name}</h4>
                        <p className="course-description">{course.description}</p>
                      </div>
                      <div className="course-details">
                        <span className="detail">Duration: {course.duration}</span>
                        <span className="detail">Fee: ${course.tuitionFee}</span>
                        <span className="detail">Applications: {course.applicationCount}</span>
                      </div>
                    </div>
                    <div className="course-actions">
                      <button 
                        className="btn-outline"
                        onClick={() => setEditingCourse(course)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No courses created yet</p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  Create Your First Course
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Form Modal */}
      {showForm && (
        <CourseForm
          mode="create"
          onSubmit={handleCreateCourse}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingCourse && (
        <CourseForm
          mode="edit"
          course={editingCourse}
          onSubmit={(data) => handleUpdateCourse(editingCourse.id, data)}
          onClose={() => setEditingCourse(null)}
        />
      )}
    </div>
  );
};

export default CourseManagement;