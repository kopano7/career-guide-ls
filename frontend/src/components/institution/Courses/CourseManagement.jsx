// src/components/institute/Courses/CourseManagement.jsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import { useNotifications } from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/Loading/LoadingSpinner';

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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="course-management">
      <div className="page-header">
        <div className="header-content">
          <h1>Course Management</h1>
          <p>Manage your institution's courses and programs</p>
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

      <div className="courses-list">
        {courses.length > 0 ? (
          courses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-header">
                <h3>{course.name}</h3>
                <span className="application-count">
                  {course.applicationCount || 0} applications
                </span>
              </div>
              
              <div className="course-details">
                <div className="detail-item">
                  <strong>Duration:</strong> {course.duration}
                </div>
                <div className="detail-item">
                  <strong>Tuition Fee:</strong> ${course.tuitionFee}
                </div>
                <div className="detail-item">
                  <strong>Capacity:</strong> {course.capacity} students
                </div>
                <div className="detail-item">
                  <strong>Deadline:</strong> {new Date(course.applicationDeadline).toLocaleDateString()}
                </div>
              </div>

              <div className="course-description">
                {course.description}
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
          ))
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

      {/* Course Form Modal */}
      {showForm && (
        <CourseForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateCourse}
        />
      )}

      {editingCourse && (
        <CourseForm
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSubmit={(data) => console.log('Update course:', data)}
        />
      )}
    </div>
  );
};

// Simple Course Form Component
const CourseForm = ({ course, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: course?.name || '',
    description: course?.description || '',
    duration: course?.duration || '',
    tuitionFee: course?.tuitionFee || '',
    capacity: course?.capacity || '',
    applicationDeadline: course?.applicationDeadline || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{course ? 'Edit Course' : 'Create New Course'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Course Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                placeholder="e.g., 4 years"
                required
              />
            </div>

            <div className="form-group">
              <label>Tuition Fee ($)</label>
              <input
                type="number"
                value={formData.tuitionFee}
                onChange={(e) => setFormData({...formData, tuitionFee: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Capacity</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Application Deadline</label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => setFormData({...formData, applicationDeadline: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {course ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseManagement;