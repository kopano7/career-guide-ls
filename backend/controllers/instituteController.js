const { db } = require('../config/firebase');
const { successResponse, errorResponse } = require('../utils/helpers');

// Add course
const addCourse = async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, description, duration, requirements, faculty, seats, minimumGrades } = req.body;

    const courseData = {
      name,
      description,
      duration,
      requirements: requirements || {},
      faculty,
      seats: parseInt(seats),
      availableSeats: parseInt(seats),
      instituteId: uid,
      createdAt: new Date(),
      status: 'active',
      applicationCount: 0,
      // Add minimum grade requirements
      minimumGrades: minimumGrades || {}
    };

    const courseRef = await db.collection('courses').add(courseData);

    res.status(201).json(successResponse(
      { course: { id: courseRef.id, ...courseData } },
      'Course added successfully'
    ));
  } catch (error) {
    console.error('Add course error:', error);
    res.status(500).json(errorResponse('Failed to add course', error.message));
  }
};

// Get institute courses
const getCourses = async (req, res) => {
  try {
    const { uid } = req.user;

    const snapshot = await db.collection('courses')
      .where('instituteId', '==', uid)
      .get();

    const courses = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    res.json(successResponse({ courses }, 'Courses retrieved successfully'));
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json(errorResponse('Failed to get courses', error.message));
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const { name, description, duration, requirements, faculty, seats, status, minimumGrades } = req.body;

    // Verify the course belongs to this institute
    const courseDoc = await db.collection('courses').doc(id).get();
    
    if (!courseDoc.exists) {
      return res.status(404).json(errorResponse('Course not found'));
    }

    const course = courseDoc.data();
    
    if (course.instituteId !== uid) {
      return res.status(403).json(errorResponse('Access denied. You do not own this course.'));
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (duration) updateData.duration = duration;
    if (requirements) updateData.requirements = requirements;
    if (faculty) updateData.faculty = faculty;
    if (seats) {
      updateData.seats = parseInt(seats);
      // Update available seats accordingly
      const currentSeats = course.seats;
      const newSeats = parseInt(seats);
      updateData.availableSeats = course.availableSeats + (newSeats - currentSeats);
    }
    if (status) updateData.status = status;
    if (minimumGrades) updateData.minimumGrades = minimumGrades;
    
    updateData.updatedAt = new Date();

    await db.collection('courses').doc(id).update(updateData);

    res.json(successResponse(
      { course: { id, ...updateData } },
      'Course updated successfully'
    ));
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json(errorResponse('Failed to update course', error.message));
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    // Verify the course belongs to this institute
    const courseDoc = await db.collection('courses').doc(id).get();
    
    if (!courseDoc.exists) {
      return res.status(404).json(errorResponse('Course not found'));
    }

    const course = courseDoc.data();
    
    if (course.instituteId !== uid) {
      return res.status(403).json(errorResponse('Access denied. You do not own this course.'));
    }

    // Check if there are any applications for this course
    const applicationsSnapshot = await db.collection('applications')
      .where('courseId', '==', id)
      .get();

    if (!applicationsSnapshot.empty) {
      return res.status(400).json(errorResponse('Cannot delete course with existing applications'));
    }

    await db.collection('courses').doc(id).delete();

    res.json(successResponse(null, 'Course deleted successfully'));
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json(errorResponse('Failed to delete course', error.message));
  }
};

// Get applications for institute courses
const getApplications = async (req, res) => {
  try {
    const { uid } = req.user;
    const { courseId, status } = req.query;

    let query = db.collection('applications')
      .where('instituteId', '==', uid);

    if (courseId) query = query.where('courseId', '==', courseId);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.get();
    
    const applications = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const appData = doc.data();
        const studentDoc = await db.collection('users').doc(appData.studentId).get();
        const courseDoc = await db.collection('courses').doc(appData.courseId).get();
        const transcriptDoc = await db.collection('transcripts').doc(appData.studentId).get();
        
        return {
          id: doc.id,
          ...appData,
          appliedAt: appData.appliedAt?.toDate?.() || appData.appliedAt,
          student: studentDoc.exists ? studentDoc.data() : null,
          course: courseDoc.exists ? courseDoc.data() : null,
          transcript: transcriptDoc.exists ? transcriptDoc.data() : null
        };
      })
    );

    res.json(successResponse({ applications }, 'Applications retrieved successfully'));
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json(errorResponse('Failed to get applications', error.message));
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json(errorResponse('Application not found'));
    }

    const application = applicationDoc.data();

    // Check if student is qualified before admitting
    if (status === 'admitted' && !application.isQualified) {
      return res.status(400).json(errorResponse(
        'Cannot admit unqualified student',
        'This student does not meet the course requirements'
      ));
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'admitted') {
      updateData.admittedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
    }

    await db.collection('applications').doc(applicationId).update(updateData);

    // Send notification to student
    const { applicationStatusChanged } = require('../utils/notifications');
    await applicationStatusChanged(
      application.studentId,
      applicationId,
      application.courseName,
      status,
      notes || ''
    );

    res.json(successResponse(null, `Application ${status} successfully`));
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json(errorResponse('Failed to update application status', error.message));
  }
};

// Get application statistics
const getApplicationStats = async (req, res) => {
  try {
    const { uid } = req.user;

    const applicationsSnapshot = await db.collection('applications')
      .where('instituteId', '==', uid)
      .get();

    const coursesSnapshot = await db.collection('courses')
      .where('instituteId', '==', uid)
      .get();

    const stats = {
      totalApplications: applicationsSnapshot.size,
      applicationsByStatus: {
        pending: applicationsSnapshot.docs.filter(doc => doc.data().status === 'pending').length,
        admitted: applicationsSnapshot.docs.filter(doc => doc.data().status === 'admitted').length,
        rejected: applicationsSnapshot.docs.filter(doc => doc.data().status === 'rejected').length,
        accepted: applicationsSnapshot.docs.filter(doc => doc.data().status === 'accepted').length
      },
      applicationsByCourse: {},
      qualificationStats: {
        qualified: applicationsSnapshot.docs.filter(doc => doc.data().isQualified === true).length,
        unqualified: applicationsSnapshot.docs.filter(doc => doc.data().isQualified === false).length
      },
      totalCourses: coursesSnapshot.size
    };

    // Count applications per course
    coursesSnapshot.docs.forEach(courseDoc => {
      const courseId = courseDoc.id;
      const courseApplications = applicationsSnapshot.docs.filter(
        doc => doc.data().courseId === courseId
      );
      stats.applicationsByCourse[courseId] = {
        courseName: courseDoc.data().name,
        count: courseApplications.length,
        qualified: courseApplications.filter(doc => doc.data().isQualified === true).length,
        admitted: courseApplications.filter(doc => doc.data().status === 'admitted').length
      };
    });

    res.json(successResponse({ stats }, 'Application statistics retrieved successfully'));
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json(errorResponse('Failed to get application statistics', error.message));
  }
};

// Get institute dashboard data
const getInstituteDashboard = async (req, res) => {
  try {
    const { uid } = req.user;

    const [coursesSnapshot, applicationsSnapshot, instituteDoc] = await Promise.all([
      db.collection('courses').where('instituteId', '==', uid).get(),
      db.collection('applications').where('instituteId', '==', uid).get(),
      db.collection('users').doc(uid).get()
    ]);

    const applications = applicationsSnapshot.docs.map(doc => doc.data());
    const courses = coursesSnapshot.docs.map(doc => doc.data());

    const stats = {
      totalCourses: courses.length,
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      admittedStudents: applications.filter(app => app.status === 'admitted').length,
      qualifiedApplications: applications.filter(app => app.isQualified === true).length,
      totalSeats: courses.reduce((sum, course) => sum + (course.seats || 0), 0),
      availableSeats: courses.reduce((sum, course) => sum + (course.availableSeats || 0), 0),
      instituteStatus: instituteDoc.exists ? instituteDoc.data().status : 'unknown'
    };

    // Recent applications (last 10)
    const recentApplications = await db.collection('applications')
      .where('instituteId', '==', uid)
      .orderBy('appliedAt', 'desc')
      .limit(10)
      .get();

    const recentAppsData = await Promise.all(
      recentApplications.docs.map(async (doc) => {
        const appData = doc.data();
        const studentDoc = await db.collection('users').doc(appData.studentId).get();
        const courseDoc = await db.collection('courses').doc(appData.courseId).get();
        
        return {
          id: doc.id,
          ...appData,
          appliedAt: appData.appliedAt?.toDate?.() || appData.appliedAt,
          student: studentDoc.exists ? studentDoc.data() : null,
          course: courseDoc.exists ? courseDoc.data() : null
        };
      })
    );

    res.json(successResponse(
      { 
        stats,
        recentApplications: recentAppsData
      },
      'Institute dashboard data retrieved successfully'
    ));
  } catch (error) {
    console.error('Get institute dashboard error:', error);
    res.status(500).json(errorResponse('Failed to get dashboard data', error.message));
  }
};

module.exports = { 
  addCourse, 
  getCourses, 
  updateCourse, 
  deleteCourse, 
  getApplications, 
  updateApplicationStatus,
  getApplicationStats,
  getInstituteDashboard
};