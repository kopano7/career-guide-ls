const { db } = require('../config/firebase');
const { successResponse, errorResponse } = require('../utils/helpers');
const { applicationStatusChanged } = require('../utils/notifications');

// Helper function to process subject requirements
const processSubjectRequirements = (subjectRequirements) => {
  if (!subjectRequirements || !Array.isArray(subjectRequirements)) {
    return [];
  }

  return subjectRequirements
    .filter(req => req.subject && req.minGrade && req.required !== undefined)
    .map(req => ({
      subject: req.subject.toString().trim(),
      minGrade: req.minGrade.toString().toUpperCase(),
      required: Boolean(req.required)
    }));
};

// Helper function to compare grades
const checkGradeMeetsRequirement = (studentGrade, requiredGrade) => {
  if (!studentGrade) return false;

  const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'A+'];
  const studentIndex = gradeOrder.indexOf(studentGrade.toUpperCase());
  const requiredIndex = gradeOrder.indexOf(requiredGrade.toUpperCase());

  return studentIndex >= requiredIndex;
};

// Helper function to get next waitlist position
const getNextWaitlistPosition = async (courseId) => {
  try {
    const waitlistedApps = await db.collection('applications')
      .where('courseId', '==', courseId)
      .where('status', '==', 'waitlisted')
      .get();

    return waitlistedApps.size + 1;
  } catch (error) {
    console.error('Error getting waitlist position:', error);
    return 1;
  }
};

// Add course with subject requirements
const addCourse = async (req, res) => {
  try {
    console.log('🎯 ADD COURSE REQUEST DEBUG:');
    console.log('   User object:', req.user);
    console.log('   Request body:', req.body);
    
    const { uid } = req.user;
    const { name, description, duration, requirements, faculty, seats, subjectRequirements } = req.body;

    // Validate required fields
    if (!name || !description || !duration || !faculty || !seats) {
      console.log('❌ Missing required fields');
      return res.status(400).json(errorResponse('Name, description, duration, faculty, and seats are required'));
    }

    // Ensure faculty is not undefined or empty
    const sanitizedFaculty = faculty ? faculty.toString().trim() : '';
    if (!sanitizedFaculty) {
      return res.status(400).json(errorResponse('Faculty field is required and cannot be empty'));
    }

    console.log('✅ All required fields present and sanitized');

    // Process subject requirements
    const processedRequirements = processSubjectRequirements(subjectRequirements);

    const courseData = {
      name: name.toString().trim(),
      description: description.toString().trim(),
      duration: duration.toString(),
      requirements: requirements || {},
      subjectRequirements: processedRequirements, // New field for subject-grade requirements
      faculty: sanitizedFaculty,
      seats: parseInt(seats),
      availableSeats: parseInt(seats),
      instituteId: uid,
      createdAt: new Date(),
      status: 'active',
      applicationCount: 0,
      updatedAt: new Date()
    };

    console.log('📝 Course data prepared with requirements:', courseData);

    // Create course in Firestore
    const courseRef = await db.collection('courses').add(courseData);
    console.log('✅ Course created with ID:', courseRef.id);

    res.status(201).json(successResponse(
      { course: { id: courseRef.id, ...courseData } },
      'Course added successfully'
    ));

  } catch (error) {
    console.error('💥 Add course error:', error);
    console.error('💥 Error stack:', error.stack);
    res.status(500).json(errorResponse('Failed to add course', error.message));
  }
};

// Check student qualification against course requirements
const checkStudentQualification = async (studentId, courseId) => {
  try {
    console.log('🎓 Checking qualification:', { studentId, courseId });

    // Get student profile with grades
    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return { isQualified: false, reason: 'Student profile not found' };
    }

    const student = studentDoc.data();
    const studentGrades = student.grades || {};

    // Get course requirements
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return { isQualified: false, reason: 'Course not found' };
    }

    const course = courseDoc.data();
    const subjectRequirements = course.subjectRequirements || [];

    if (subjectRequirements.length === 0) {
      return { isQualified: true, reason: 'No specific requirements' };
    }

    // Check each requirement
    const qualificationResults = [];
    let meetsAllRequirements = true;

    for (const requirement of subjectRequirements) {
      const studentGrade = studentGrades[requirement.subject];
      const meetsRequirement = checkGradeMeetsRequirement(studentGrade, requirement.minGrade);
      
      qualificationResults.push({
        subject: requirement.subject,
        requiredGrade: requirement.minGrade,
        studentGrade: studentGrade || 'Not provided',
        meetsRequirement,
        isRequired: requirement.required
      });

      if (requirement.required && !meetsRequirement) {
        meetsAllRequirements = false;
      }
    }

    const qualifiedSubjects = qualificationResults.filter(r => r.meetsRequirement).length;
    const totalRequired = qualificationResults.filter(r => r.isRequired).length;

    return {
      isQualified: meetsAllRequirements,
      qualificationScore: totalRequired > 0 ? (qualifiedSubjects / totalRequired) * 100 : 100,
      details: qualificationResults,
      metRequirements: qualifiedSubjects,
      totalRequirements: totalRequired
    };

  } catch (error) {
    console.error('💥 Qualification check error:', error);
    return { isQualified: false, reason: 'Error checking qualification' };
  }
};

// Enhanced application submission with automatic qualification check
const submitApplication = async (req, res) => {
  try {
    const { uid: studentId } = req.user;
    const { courseId } = req.body;

    console.log('📝 Application submission:', { studentId, courseId });

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json(errorResponse('Course not found'));
    }

    const course = courseDoc.data();

    // Check if student has already applied to 2 courses in this institute
    const existingApplications = await db.collection('applications')
      .where('studentId', '==', studentId)
      .where('instituteId', '==', course.instituteId)
      .get();

    if (existingApplications.size >= 2) {
      return res.status(400).json(errorResponse('Maximum 2 applications per institution allowed'));
    }

    // Check if already applied to this course
    const existingApplication = await db.collection('applications')
      .where('studentId', '==', studentId)
      .where('courseId', '==', courseId)
      .get();

    if (!existingApplication.empty) {
      return res.status(400).json(errorResponse('Already applied to this course'));
    }

    // Get student profile for qualification check
    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json(errorResponse('Student profile not found'));
    }

    const student = studentDoc.data();

    // Check qualification
    const qualificationResult = await checkStudentQualification(studentId, courseId);

    // Create application
    const applicationData = {
      studentId,
      courseId,
      instituteId: course.instituteId,
      status: 'pending',
      appliedAt: new Date(),
      studentName: student.name || 'Unknown Student',
      studentEmail: student.email,
      courseName: course.name,
      instituteName: course.instituteName || 'Unknown Institute',
      studentGrades: student.grades || {},
      isQualified: qualificationResult.isQualified,
      qualificationScore: qualificationResult.qualificationScore,
      qualificationDetails: qualificationResult.details,
      applicationNumber: await generateApplicationNumber(course.instituteId),
      updatedAt: new Date()
    };

    const applicationRef = await db.collection('applications').add(applicationData);

    // Update course application count
    await updateCourseApplicationCount(courseId);

    console.log('✅ Application submitted with qualification check:', {
      applicationId: applicationRef.id,
      isQualified: qualificationResult.isQualified,
      score: qualificationResult.qualificationScore
    });

    res.status(201).json(successResponse(
      {
        application: { 
          id: applicationRef.id, 
          ...applicationData 
        },
        qualification: qualificationResult
      },
      qualificationResult.isQualified ? 
        'Application submitted successfully! You meet the course requirements.' :
        'Application submitted! Note: You do not meet all course requirements.'
    ));

  } catch (error) {
    console.error('💥 Submit application error:', error);
    res.status(500).json(errorResponse('Failed to submit application', error.message));
  }
};

// Helper function to generate application number
const generateApplicationNumber = async (instituteId) => {
  const instituteDoc = await db.collection('users').doc(instituteId).get();
  const instituteCode = instituteDoc.exists ? 
    (instituteDoc.data().institutionCode || 'INST') : 'INST';
  const timestamp = Date.now().toString().slice(-6);
  return `${instituteCode}-${timestamp}`;
};

// Helper function to update course application count
const updateCourseApplicationCount = async (courseId) => {
  try {
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    
    if (courseDoc.exists) {
      const currentCount = courseDoc.data().applicationCount || 0;
      await courseRef.update({
        applicationCount: currentCount + 1,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating application count:', error);
  }
};

// Get course requirements analysis
const getCourseRequirementsAnalysis = async (req, res) => {
  try {
    const { uid } = req.user;
    const { courseId } = req.params;

    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json(errorResponse('Course not found'));
    }

    const course = courseDoc.data();

    // Verify ownership
    if (course.instituteId !== uid) {
      return res.status(403).json(errorResponse('Access denied'));
    }

    // Get all applications for this course
    const applicationsSnapshot = await db.collection('applications')
      .where('courseId', '==', courseId)
      .get();

    const applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Analyze requirements fulfillment
    const analysis = {
      totalApplications: applications.length,
      qualifiedApplications: applications.filter(app => app.isQualified).length,
      unqualifiedApplications: applications.filter(app => !app.isQualified).length,
      requirementBreakdown: {},
      commonMissingRequirements: {}
    };

    // Analyze each requirement
    const subjectRequirements = course.subjectRequirements || [];
    subjectRequirements.forEach(requirement => {
      const subject = requirement.subject;
      const metCount = applications.filter(app => {
        const qualificationDetails = app.qualificationDetails || [];
        const subjectResult = qualificationDetails.find(d => d.subject === subject);
        return subjectResult ? subjectResult.meetsRequirement : false;
      }).length;

      analysis.requirementBreakdown[subject] = {
        requiredGrade: requirement.minGrade,
        metCount: metCount,
        totalCount: applications.length,
        successRate: applications.length > 0 ? (metCount / applications.length) * 100 : 0
      };
    });

    // Find common missing requirements
    applications
      .filter(app => !app.isQualified)
      .forEach(app => {
        const qualificationDetails = app.qualificationDetails || [];
        qualificationDetails
          .filter(detail => !detail.meetsRequirement && detail.isRequired)
          .forEach(detail => {
            analysis.commonMissingRequirements[detail.subject] = 
              (analysis.commonMissingRequirements[detail.subject] || 0) + 1;
          });
      });

    res.json(successResponse(
      { analysis, requirements: subjectRequirements },
      'Course requirements analysis retrieved successfully'
    ));

  } catch (error) {
    console.error('💥 Get course requirements analysis error:', error);
    res.status(500).json(errorResponse('Failed to get requirements analysis', error.message));
  }
};

// Update course with subject requirements
const updateCourse = async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const { name, description, duration, requirements, faculty, seats, status, subjectRequirements } = req.body;

    console.log('✏️ Update course request:', { courseId: id, instituteId: uid, updateData: req.body });

    // Verify the course belongs to this institute
    const courseDoc = await db.collection('courses').doc(id).get();
    
    if (!courseDoc.exists) {
      console.log('❌ Course not found:', id);
      return res.status(404).json(errorResponse('Course not found'));
    }

    const course = courseDoc.data();
    
    if (course.instituteId !== uid) {
      console.log('❌ Access denied - course owner mismatch:', { courseOwner: course.instituteId, requester: uid });
      return res.status(403).json(errorResponse('Access denied. You do not own this course.'));
    }

    const updateData = {
      updatedAt: new Date()
    };

    // Only update provided fields
    if (name !== undefined) updateData.name = name.toString().trim();
    if (description !== undefined) updateData.description = description.toString().trim();
    if (duration !== undefined) updateData.duration = duration.toString();
    if (requirements !== undefined) updateData.requirements = requirements;
    if (faculty !== undefined) updateData.faculty = faculty.toString().trim();
    if (status !== undefined) updateData.status = status;
    
    // Process subject requirements if provided
    if (subjectRequirements !== undefined) {
      updateData.subjectRequirements = processSubjectRequirements(subjectRequirements);
    }

    // Handle seats update with available seats calculation
    if (seats !== undefined) {
      const newSeats = parseInt(seats);
      const currentSeats = course.seats || 0;
      updateData.seats = newSeats;
      updateData.availableSeats = (course.availableSeats || 0) + (newSeats - currentSeats);
    }

    console.log('📝 Updating course with data:', updateData);

    await db.collection('courses').doc(id).update(updateData);

    res.json(successResponse(
      { course: { id, ...updateData } },
      'Course updated successfully'
    ));

  } catch (error) {
    console.error('💥 Update course error:', error);
    res.status(500).json(errorResponse('Failed to update course', error.message));
  }
};

// Get institute courses with error handling
const getCourses = async (req, res) => {
  try {
    const { uid } = req.user;

    console.log('📚 Fetching courses for institute:', uid);

    const snapshot = await db.collection('courses')
      .where('instituteId', '==', uid)
      .get();

    const courses = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    }));

    console.log(`✅ Found ${courses.length} courses for institute ${uid}`);

    res.json(successResponse({ courses }, 'Courses retrieved successfully'));
  } catch (error) {
    console.error('💥 Get courses error:', error);
    res.status(500).json(errorResponse('Failed to get courses', error.message));
  }
};

// Delete course with application check
const deleteCourse = async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    console.log('🗑️ Delete course request:', { courseId: id, instituteId: uid });

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
      return res.status(400).json(errorResponse(
        'Cannot delete course with existing applications',
        `There are ${applicationsSnapshot.size} applications for this course.`
      ));
    }

    await db.collection('courses').doc(id).delete();

    console.log('✅ Course deleted successfully:', id);

    res.json(successResponse(null, 'Course deleted successfully'));
  } catch (error) {
    console.error('💥 Delete course error:', error);
    res.status(500).json(errorResponse('Failed to delete course', error.message));
  }
};

// Enhanced: Get applications for institute courses with advanced filtering
const getApplications = async (req, res) => {
  try {
    const { uid } = req.user;
    const { courseId, status, faculty, search } = req.query;

    console.log('📋 Fetching applications for institute:', { instituteId: uid, courseId, status, faculty, search });

    let query = db.collection('applications')
      .where('instituteId', '==', uid);

    if (courseId) query = query.where('courseId', '==', courseId);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.get();
    
    let applications = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const appData = doc.data();
        
        // Fetch related data in parallel
        const [studentDoc, courseDoc, transcriptDoc] = await Promise.all([
          db.collection('users').doc(appData.studentId).get(),
          db.collection('courses').doc(appData.courseId).get(),
          db.collection('transcripts').doc(appData.studentId).get()
        ]);
        
        const course = courseDoc.exists ? courseDoc.data() : {};
        
        return {
          id: doc.id,
          ...appData,
          appliedAt: appData.appliedAt?.toDate?.() || appData.appliedAt,
          student: studentDoc.exists ? { 
            id: studentDoc.id, 
            ...studentDoc.data() 
          } : null,
          course: {
            id: courseDoc.id,
            ...course
          },
          transcript: transcriptDoc.exists ? transcriptDoc.data() : null,
          courseFaculty: course.faculty || 'Unknown'
        };
      })
    );

    // Apply additional filters that can't be done in Firestore query
    if (faculty) {
      applications = applications.filter(app => app.courseFaculty === faculty);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      applications = applications.filter(app => 
        app.studentName.toLowerCase().includes(searchTerm) ||
        app.courseName.toLowerCase().includes(searchTerm) ||
        (app.studentEmail && app.studentEmail.toLowerCase().includes(searchTerm)) ||
        (app.applicationNumber && app.applicationNumber.toLowerCase().includes(searchTerm))
      );
    }

    console.log(`✅ Found ${applications.length} applications for institute ${uid}`);

    res.json(successResponse({ applications }, 'Applications retrieved successfully'));
  } catch (error) {
    console.error('💥 Get applications error:', error);
    res.status(500).json(errorResponse('Failed to get applications', error.message));
  }
};

// Enhanced: Update application status with waitlist support
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    const { uid } = req.user;

    console.log('🔄 Update application status:', { applicationId, status, instituteId: uid });

    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json(errorResponse('Application not found'));
    }

    const application = applicationDoc.data();

    // Verify the application belongs to this institute
    if (application.instituteId !== uid) {
      return res.status(403).json(errorResponse('Access denied. This application does not belong to your institute.'));
    }

    // Check if student is qualified before admitting
    if (status === 'admitted' && !application.isQualified) {
      return res.status(400).json(errorResponse(
        'Cannot admit unqualified student',
        'This student does not meet the course requirements'
      ));
    }

    const updateData = {
      status,
      updatedAt: new Date(),
      reviewedBy: uid,
      reviewedAt: new Date()
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'admitted') {
      updateData.admittedAt = new Date();
      
      // Update course available seats if admitted
      const courseDoc = await db.collection('courses').doc(application.courseId).get();
      if (courseDoc.exists) {
        const course = courseDoc.data();
        if (course.availableSeats > 0) {
          await db.collection('courses').doc(application.courseId).update({
            availableSeats: course.availableSeats - 1,
            updatedAt: new Date()
          });
        }
      }
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
    } else if (status === 'waitlisted') {
      updateData.waitlistedAt = new Date();
      updateData.waitlistPosition = await getNextWaitlistPosition(application.courseId);
    }

    await db.collection('applications').doc(applicationId).update(updateData);

    // Send notification to student
    try {
      await applicationStatusChanged(
        application.studentId,
        applicationId,
        application.courseName,
        status,
        notes || ''
      );
    } catch (notificationError) {
      console.error('⚠️ Failed to send notification:', notificationError);
      // Don't fail the request if notification fails
    }

    console.log('✅ Application status updated successfully:', { applicationId, status });

    res.json(successResponse(
      { 
        application: {
          id: applicationId,
          ...updateData
        }
      }, 
      `Application ${status} successfully`
    ));
  } catch (error) {
    console.error('💥 Update application status error:', error);
    res.status(500).json(errorResponse('Failed to update application status', error.message));
  }
};

// Waitlist application
const waitlistApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { position } = req.body;
    const { uid } = req.user;

    console.log('⏳ Waitlisting application:', { applicationId, position, instituteId: uid });

    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json(errorResponse('Application not found'));
    }

    const application = applicationDoc.data();
    
    // Verify the application belongs to this institute
    if (application.instituteId !== uid) {
      return res.status(403).json(errorResponse('Access denied. This application does not belong to your institute.'));
    }

    // Get next waitlist position if not provided
    let waitlistPosition = position;
    if (!waitlistPosition) {
      waitlistPosition = await getNextWaitlistPosition(application.courseId);
    }

    const updateData = {
      status: 'waitlisted',
      waitlistPosition: waitlistPosition,
      updatedAt: new Date(),
      waitlistedAt: new Date(),
      reviewedBy: uid,
      reviewedAt: new Date()
    };

    await db.collection('applications').doc(applicationId).update(updateData);

    // Send notification to student
    try {
      await applicationStatusChanged(
        application.studentId,
        applicationId,
        application.courseName,
        'waitlisted',
        `You have been placed on waitlist position ${waitlistPosition}`
      );
    } catch (notificationError) {
      console.error('⚠️ Failed to send waitlist notification:', notificationError);
    }

    console.log('✅ Application waitlisted successfully:', { applicationId, waitlistPosition });

    res.json(successResponse(
      { 
        application: {
          id: applicationId,
          ...updateData
        }
      },
      'Application waitlisted successfully'
    ));

  } catch (error) {
    console.error('💥 Waitlist application error:', error);
    res.status(500).json(errorResponse('Failed to waitlist application', error.message));
  }
};

// Export applications to PDF
const exportApplications = async (req, res) => {
  try {
    const { uid } = req.user;
    const { filters, applicationIds } = req.body;

    console.log('📤 Exporting applications:', { instituteId: uid, filters, applicationIds });

    let applicationsToExport = [];

    if (applicationIds && applicationIds.length > 0) {
      // Export specific applications
      const applicationsSnapshot = await db.collection('applications')
        .where('instituteId', '==', uid)
        .get();

      applicationsToExport = applicationsSnapshot.docs
        .filter(doc => applicationIds.includes(doc.id))
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    } else {
      // Export based on filters
      let query = db.collection('applications').where('instituteId', '==', uid);
      
      if (filters) {
        if (filters.courseId) query = query.where('courseId', '==', filters.courseId);
        if (filters.status) query = query.where('status', '==', filters.status);
      }

      const snapshot = await query.get();
      applicationsToExport = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply additional filters
      if (filters) {
        if (filters.faculty) {
          // Get courses for faculty filter
          const coursesSnapshot = await db.collection('courses')
            .where('instituteId', '==', uid)
            .where('faculty', '==', filters.faculty)
            .get();
          
          const facultyCourseIds = coursesSnapshot.docs.map(doc => doc.id);
          applicationsToExport = applicationsToExport.filter(app => 
            facultyCourseIds.includes(app.courseId)
          );
        }

        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          applicationsToExport = applicationsToExport.filter(app => 
            app.studentName.toLowerCase().includes(searchTerm) ||
            app.courseName.toLowerCase().includes(searchTerm)
          );
        }
      }
    }

    // For now, return the data - you can integrate with a PDF generation service later
    // In a real implementation, you would use a library like pdfkit or puppeteer
    
    console.log(`✅ Exporting ${applicationsToExport.length} applications`);

    res.json(successResponse(
      { 
        applications: applicationsToExport,
        exportInfo: {
          total: applicationsToExport.length,
          generatedAt: new Date().toISOString(),
          filters: filters || 'all'
        }
      },
      'Applications data ready for export'
    ));

  } catch (error) {
    console.error('💥 Export applications error:', error);
    res.status(500).json(errorResponse('Failed to export applications', error.message));
  }
};

// Get application statistics
const getApplicationStats = async (req, res) => {
  try {
    const { uid } = req.user;

    console.log('📊 Fetching application stats for institute:', uid);

    const [applicationsSnapshot, coursesSnapshot] = await Promise.all([
      db.collection('applications').where('instituteId', '==', uid).get(),
      db.collection('courses').where('instituteId', '==', uid).get()
    ]);

    const applications = applicationsSnapshot.docs.map(doc => doc.data());
    const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const stats = {
      totalApplications: applications.length,
      applicationsByStatus: {
        pending: applications.filter(app => app.status === 'pending').length,
        admitted: applications.filter(app => app.status === 'admitted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        waitlisted: applications.filter(app => app.status === 'waitlisted').length,
        accepted: applications.filter(app => app.status === 'accepted').length
      },
      applicationsByCourse: {},
      qualificationStats: {
        qualified: applications.filter(app => app.isQualified === true).length,
        unqualified: applications.filter(app => app.isQualified === false).length
      },
      totalCourses: courses.length
    };

    // Count applications per course
    courses.forEach(course => {
      const courseApplications = applications.filter(app => app.courseId === course.id);
      stats.applicationsByCourse[course.id] = {
        courseName: course.name,
        count: courseApplications.length,
        qualified: courseApplications.filter(app => app.isQualified === true).length,
        admitted: courseApplications.filter(app => app.status === 'admitted').length,
        pending: courseApplications.filter(app => app.status === 'pending').length,
        waitlisted: courseApplications.filter(app => app.status === 'waitlisted').length
      };
    });

    console.log('✅ Application stats calculated:', stats);

    res.json(successResponse({ stats }, 'Application statistics retrieved successfully'));
  } catch (error) {
    console.error('💥 Get application stats error:', error);
    res.status(500).json(errorResponse('Failed to get application statistics', error.message));
  }
};

// Get institute dashboard data
const getInstituteDashboard = async (req, res) => {
  try {
    const { uid } = req.user;

    console.log('📈 Fetching dashboard data for institute:', uid);

    const [coursesSnapshot, applicationsSnapshot, instituteDoc] = await Promise.all([
      db.collection('courses').where('instituteId', '==', uid).get(),
      db.collection('applications').where('instituteId', '==', uid).get(),
      db.collection('users').doc(uid).get()
    ]);

    const applications = applicationsSnapshot.docs.map(doc => doc.data());
    const courses = coursesSnapshot.docs.map(doc => doc.data());

    // Calculate stats
    const stats = {
      totalCourses: courses.length,
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      admittedStudents: applications.filter(app => app.status === 'admitted').length,
      waitlistedStudents: applications.filter(app => app.status === 'waitlisted').length,
      qualifiedApplications: applications.filter(app => app.isQualified === true).length,
      totalSeats: courses.reduce((sum, course) => sum + (course.seats || 0), 0),
      availableSeats: courses.reduce((sum, course) => sum + (course.availableSeats || 0), 0),
      instituteStatus: instituteDoc.exists ? instituteDoc.data().status : 'unknown'
    };

    // Get recent applications (simple approach without composite index)
    const allApplications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appliedAt: doc.data().appliedAt?.toDate?.() || doc.data().appliedAt
    }));

    // Sort by appliedAt descending and take top 10
    const recentApplications = allApplications
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
      .slice(0, 10);

    // Enhance recent applications with student and course data
    const recentAppsData = await Promise.all(
      recentApplications.map(async (app) => {
        const [studentDoc, courseDoc] = await Promise.all([
          db.collection('users').doc(app.studentId).get(),
          db.collection('courses').doc(app.courseId).get()
        ]);
        
        return {
          id: app.id,
          ...app,
          studentName: studentDoc.exists ? studentDoc.data().name : 'Unknown Student',
          courseName: courseDoc.exists ? courseDoc.data().name : 'Unknown Course'
        };
      })
    );

    console.log('✅ Dashboard data fetched successfully for institute:', uid);

    res.json(successResponse(
      { 
        stats,
        recentApplications: recentAppsData
      },
      'Institute dashboard data retrieved successfully'
    ));

  } catch (error) {
    console.error('💥 Get institute dashboard error:', error);
    res.status(500).json(errorResponse('Failed to get dashboard data', error.message));
  }
};

// Faculty management functions
const addFaculty = async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, description, departments } = req.body;

    if (!name) {
      return res.status(400).json(errorResponse('Faculty name is required'));
    }

    const facultyData = {
      name: name.toString().trim(),
      description: description ? description.toString().trim() : '',
      departments: Array.isArray(departments) ? departments : [],
      instituteId: uid,
      createdAt: new Date(),
      status: 'active'
    };

    const facultyRef = await db.collection('faculties').add(facultyData);

    // Also update institution's faculties array
    await db.collection('institutions').doc(uid).update({
      faculties: db.FieldValue.arrayUnion(name.toString().trim()),
      updatedAt: new Date()
    });

    res.status(201).json(successResponse(
      { faculty: { id: facultyRef.id, ...facultyData } },
      'Faculty added successfully'
    ));
  } catch (error) {
    console.error('Add faculty error:', error);
    res.status(500).json(errorResponse('Failed to add faculty', error.message));
  }
};

const getFaculties = async (req, res) => {
  try {
    const { uid } = req.user;

    const snapshot = await db.collection('faculties')
      .where('instituteId', '==', uid)
      .get();

    const faculties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(successResponse({ faculties }, 'Faculties retrieved successfully'));
  } catch (error) {
    console.error('Get faculties error:', error);
    res.status(500).json(errorResponse('Failed to get faculties', error.message));
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
  getInstituteDashboard,
  addFaculty,
  getFaculties,
  getCourseRequirementsAnalysis,
  checkStudentQualification,
  submitApplication,
  waitlistApplication,
  exportApplications
};