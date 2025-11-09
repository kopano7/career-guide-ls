const { db } = require('../config/firebase');
const { successResponse, errorResponse, calculateGPA } = require('../utils/helpers');
const { applicationSubmitted, applicationStatusChanged } = require('../utils/notifications');

// Helper function to check student qualification
const checkStudentQualification = async (grades, courseRequirements) => {
  if (!courseRequirements || !courseRequirements.minimumGrades) {
    return true; // No specific requirements
  }

  const minimumGrades = courseRequirements.minimumGrades;
  
  for (const [subject, minGrade] of Object.entries(minimumGrades)) {
    const studentGrade = grades[subject];
    if (!studentGrade || !isGradeSufficient(studentGrade, minGrade)) {
      return false;
    }
  }
  
  return true;
};

// Helper function to compare grades
const isGradeSufficient = (studentGrade, minGrade) => {
  const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'A+'];
  const studentIndex = gradeOrder.indexOf(studentGrade.toUpperCase());
  const minIndex = gradeOrder.indexOf(minGrade.toUpperCase());
  
  return studentIndex >= minIndex;
};

// Calculate qualification score
const calculateQualificationScore = async (grades, requirements) => {
  if (!requirements || !requirements.minimumGrades) return 100;
  
  let matchedSubjects = 0;
  let totalRequired = Object.keys(requirements.minimumGrades).length;
  
  for (const [subject, minGrade] of Object.entries(requirements.minimumGrades)) {
    const studentGrade = grades[subject];
    if (studentGrade && isGradeSufficient(studentGrade, minGrade)) {
      matchedSubjects++;
    }
  }
  
  return totalRequired > 0 ? (matchedSubjects / totalRequired) * 100 : 100;
};

// Update course application count
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

// Generate unique application number
const generateApplicationNumber = async (instituteId) => {
  const instituteDoc = await db.collection('users').doc(instituteId).get();
  const instituteCode = instituteDoc.data().institutionCode || 'INST';
  const timestamp = Date.now().toString().slice(-6);
  return `${instituteCode}-${timestamp}`;
};

// Apply for course using profile grades
const applyForCourse = async (req, res) => {
  try {
    const { uid } = req.user;
    const { courseId } = req.body; // Remove grades from request body

    // Get student profile to extract grades
    const studentDoc = await db.collection('users').doc(uid).get();
    if (!studentDoc.exists) {
      return res.status(404).json(errorResponse('Student profile not found'));
    }

    const student = studentDoc.data();
    const profileGrades = student.grades || {};

    // Check if student has entered grades in profile
    if (!profileGrades || Object.keys(profileGrades).length === 0) {
      return res.status(400).json(errorResponse(
        'No grades found in profile',
        'Please update your profile with your academic grades before applying'
      ));
    }

    console.log('📊 Using grades from student profile:', profileGrades);

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json(errorResponse('Course not found'));
    }

    const course = courseDoc.data();

    // Check if student has already applied to 2 courses in this institute
    const existingApplications = await db.collection('applications')
      .where('studentId', '==', uid)
      .where('instituteId', '==', course.instituteId)
      .get();

    if (existingApplications.size >= 2) {
      return res.status(400).json(errorResponse('Maximum 2 applications per institution allowed'));
    }

    // Check if already applied to this course
    const existingApplication = await db.collection('applications')
      .where('studentId', '==', uid)
      .where('courseId', '==', courseId)
      .get();

    if (!existingApplication.empty) {
      return res.status(400).json(errorResponse('Already applied to this course'));
    }

    // QUALIFICATION CHECK using profile grades
    const isQualified = await checkStudentQualification(profileGrades, course.requirements);
    if (!isQualified) {
      return res.status(400).json(errorResponse(
        'You do not meet the course requirements',
        'Your profile grades do not meet the minimum requirements for this course'
      ));
    }

    // Calculate GPA from profile grades
    const gpa = calculateGPA(profileGrades);

    // Get institute details
    const instituteDoc = await db.collection('users').doc(course.instituteId).get();
    const institute = instituteDoc.data();

    // Create application using profile grades
    const applicationData = {
      studentId: uid,
      courseId,
      instituteId: course.instituteId,
      status: 'pending',
      appliedAt: new Date(),
      studentName: student.name || req.user.name,
      courseName: course.name,
      instituteName: institute.institutionName || institute.name,
      // USING PROFILE GRADES
      grades: profileGrades,
      calculatedGPA: gpa,
      isQualified: isQualified,
      qualificationScore: await calculateQualificationScore(profileGrades, course.requirements),
      applicationNumber: await generateApplicationNumber(course.instituteId),
      usedProfileGrades: true // Flag to indicate grades came from profile
    };

    const applicationRef = await db.collection('applications').add(applicationData);

    // Update course application count
    await updateCourseApplicationCount(courseId);

    // Send notification
    await applicationSubmitted(uid, applicationRef.id, course.name, institute.institutionName || institute.name);

    res.status(201).json(successResponse(
      {
        application: { 
          id: applicationRef.id, 
          ...applicationData,
          qualified: isQualified
        }
      },
      'Application submitted successfully using your profile grades. Your qualifications have been verified.'
    ));
  } catch (error) {
    console.error('Apply for course error:', error);
    res.status(500).json(errorResponse('Failed to submit application', error.message));
  }
};

// Get student applications
const getApplications = async (req, res) => {
  try {
    const { uid } = req.user;

    const snapshot = await db.collection('applications')
      .where('studentId', '==', uid)
      .orderBy('appliedAt', 'desc')
      .get();

    const applications = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const appData = doc.data();
        const courseDoc = await db.collection('courses').doc(appData.courseId).get();
        const instituteDoc = await db.collection('users').doc(appData.instituteId).get();
        
        return {
          id: doc.id,
          ...appData,
          appliedAt: appData.appliedAt?.toDate?.() || appData.appliedAt,
          course: courseDoc.exists ? courseDoc.data() : null,
          institute: instituteDoc.exists ? instituteDoc.data() : null
        };
      })
    );

    res.json(successResponse({ applications }, 'Applications retrieved successfully'));
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json(errorResponse('Failed to get applications', error.message));
  }
};

// Upload transcript (for manual grade entry without file upload)
const uploadTranscript = async (req, res) => {
  try {
    const { uid } = req.user;
    const { fileUrl, fileName, fileSize, grades, gpa, institution, graduationYear } = req.body;

    console.log('📄 Uploading transcript for student:', uid);
    console.log('📦 Request body:', req.body);

    const transcriptData = {
      studentId: uid,
      fileUrl: fileUrl || '',
      fileName: fileName || 'academic_transcript.pdf',
      fileSize: fileSize || 0,
      grades: grades || {},
      gpa: gpa || null,
      institution: institution || '',
      graduationYear: graduationYear || null,
      uploadedAt: new Date(),
      verified: false,
      status: 'pending',
      verificationStatus: 'pending'
    };

    // Calculate GPA if grades are provided but gpa is not
    if (grades && !gpa) {
      const calculatedGPA = calculateGPA(grades);
      transcriptData.gpa = calculatedGPA;
    }

    await db.collection('transcripts').doc(uid).set(transcriptData);

    console.log('✅ Transcript uploaded successfully for:', uid);
    
    res.json(successResponse(
      { transcript: transcriptData },
      'Transcript uploaded successfully'
    ));
  } catch (error) {
    console.error('Upload transcript error:', error);
    res.status(500).json(errorResponse('Failed to upload transcript', error.message));
  }
};

// Enhanced upload transcript with file support
const uploadTranscriptWithFile = async (req, res) => {
  try {
    const { uid } = req.user;
    
    console.log('📄 Uploading transcript with file for student:', uid);
    console.log('📦 Request file:', req.file);
    console.log('📦 Request body:', req.body);

    // For file uploads with multipart/form-data, req.body might be empty
    // Use safe destructuring with defaults
    const bodyData = req.body || {};
    
    const grades = bodyData.grades || {};
    const gpa = bodyData.gpa || null;
    const institution = bodyData.institution || '';
    const graduationYear = bodyData.graduationYear || null;

    let fileUrl = '';
    let fileName = 'academic_transcript.pdf';
    let fileSize = 0;

    // If file was uploaded via multer, use that data
    if (req.file) {
      fileUrl = req.file.path || `/uploads/transcripts/${req.file.filename}`;
      fileName = req.file.originalname || fileName;
      fileSize = req.file.size || fileSize;
      console.log('✅ File uploaded via multer:', { fileUrl, fileName, fileSize });
    }

    // Parse grades if it's a string (from form data)
    let parsedGrades = grades;
    if (typeof grades === 'string') {
      try {
        parsedGrades = JSON.parse(grades);
      } catch (parseError) {
        console.error('Error parsing grades:', parseError);
        parsedGrades = {};
      }
    }

    const transcriptData = {
      studentId: uid,
      fileUrl,
      fileName,
      fileSize,
      grades: parsedGrades,
      gpa: gpa ? parseFloat(gpa) : null,
      institution: institution || '',
      graduationYear: graduationYear || null,
      uploadedAt: new Date(),
      verified: false,
      status: 'pending',
      verificationStatus: 'pending'
    };

    // Calculate GPA if grades are provided but gpa is not
    if (transcriptData.grades && Object.keys(transcriptData.grades).length > 0 && !transcriptData.gpa) {
      const calculatedGPA = calculateGPA(transcriptData.grades);
      transcriptData.gpa = calculatedGPA;
    }

    await db.collection('transcripts').doc(uid).set(transcriptData);

    console.log('✅ Transcript uploaded successfully for:', uid);
    
    res.json({
      success: true,
      data: { transcript: transcriptData },
      message: 'Transcript uploaded successfully'
    });

  } catch (error) {
    console.error('Upload transcript error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload transcript',
      message: error.message
    });
  }
};

// Get available jobs with intelligent matching
const getJobs = async (req, res) => {
  try {
    const { uid } = req.user;

    const snapshot = await db.collection('jobs')
      .where('status', '==', 'active')
      .where('deadline', '>', new Date())
      .orderBy('deadline', 'asc')
      .get();

    // Get student transcript for matching
    const transcriptDoc = await db.collection('transcripts').doc(uid).get();
    const transcript = transcriptDoc.exists ? transcriptDoc.data() : null;

    // Get student profile
    const studentDoc = await db.collection('users').doc(uid).get();
    const student = studentDoc.data();

    const jobs = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const jobData = doc.data();
        const companyDoc = await db.collection('users').doc(jobData.companyId).get();
        const company = companyDoc.data();
        
        // Calculate match score
        const matchScore = await calculateJobMatch(student, transcript, jobData);
        
        return {
          id: doc.id,
          ...jobData,
          postedAt: jobData.postedAt?.toDate?.() || jobData.postedAt,
          deadline: jobData.deadline?.toDate?.() || jobData.deadline,
          company: companyDoc.exists ? {
            id: companyDoc.id,
            name: company.companyName || company.name,
            email: company.email,
            phone: company.phone
          } : null,
          matchScore: Math.round(matchScore * 100),
          isGoodMatch: matchScore >= 0.7
        };
      })
    );

    // Sort by match score (highest first), then by deadline
    jobs.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return new Date(a.deadline) - new Date(b.deadline);
    });

    res.json(successResponse({ jobs }, 'Jobs retrieved successfully'));
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json(errorResponse('Failed to get jobs', error.message));
  }
};

// Handle admission acceptance (when student chooses one institution)
const acceptAdmission = async (req, res) => {
  try {
    const { uid } = req.user;
    const { applicationId } = req.body;

    // Get the application to accept
    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json(errorResponse('Application not found'));
    }

    const application = applicationDoc.data();

    // Verify the application belongs to the student and is admitted
    if (application.studentId !== uid || application.status !== 'admitted') {
      return res.status(400).json(errorResponse('Invalid application'));
    }

    // Get all other admitted applications
    const otherAdmittedApps = await db.collection('applications')
      .where('studentId', '==', uid)
      .where('status', '==', 'admitted')
      .get();

    // Reject all other admitted applications
    const batch = db.batch();
    otherAdmittedApps.docs.forEach(doc => {
      if (doc.id !== applicationId) {
        batch.update(doc.ref, { 
          status: 'rejected',
          notes: 'Student accepted admission at another institution',
          updatedAt: new Date()
        });

        // Send notification for rejected applications
        applicationStatusChanged(
          uid,
          doc.id,
          doc.data().courseName,
          'rejected',
          'Student accepted admission at another institution'
        );
      }
    });

    await batch.commit();

    // Update the accepted application
    await db.collection('applications').doc(applicationId).update({
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date()
    });

    res.json(successResponse(
      { 
        acceptedApplication: { id: applicationId, ...application, status: 'accepted' }
      },
      'Admission accepted successfully. Other applications have been rejected.'
    ));

  } catch (error) {
    console.error('Accept admission error:', error);
    res.status(500).json(errorResponse('Failed to accept admission', error.message));
  }
};

// Get student dashboard data
const getDashboardData = async (req, res) => {
  try {
    const { uid } = req.user;

    const [applicationsSnapshot, jobsSnapshot, transcriptDoc, studentDoc] = await Promise.all([
      db.collection('applications').where('studentId', '==', uid).get(),
      db.collection('jobs').where('status', '==', 'active').get(),
      db.collection('transcripts').doc(uid).get(),
      db.collection('users').doc(uid).get()
    ]);

    const applications = applicationsSnapshot.docs.map(doc => doc.data());
    const student = studentDoc.data();
    
    const stats = {
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      admittedApplications: applications.filter(app => app.status === 'admitted').length,
      rejectedApplications: applications.filter(app => app.status === 'rejected').length,
      availableJobs: jobsSnapshot.size,
      hasTranscript: transcriptDoc.exists,
      transcriptVerified: transcriptDoc.exists ? transcriptDoc.data().verified : false,
      hasProfileGrades: student.grades && Object.keys(student.grades).length > 0,
      profileGPA: student.gpa || 'Not calculated'
    };

    // Get recommended jobs (top 3 matches)
    if (transcriptDoc.exists) {
      const transcript = transcriptDoc.data();

      const jobs = await Promise.all(
        jobsSnapshot.docs.slice(0, 10).map(async (doc) => {
          const jobData = doc.data();
          const matchScore = await calculateJobMatch(student, transcript, jobData);
          return {
            id: doc.id,
            title: jobData.title,
            companyId: jobData.companyId,
            matchScore: Math.round(matchScore * 100)
          };
        })
      );

      jobs.sort((a, b) => b.matchScore - a.matchScore);
      stats.recommendedJobs = jobs.slice(0, 3);
    }

    res.json(successResponse({ stats }, 'Dashboard data retrieved successfully'));
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json(errorResponse('Failed to get dashboard data', error.message));
  }
};

// Job matching algorithm
const calculateJobMatch = async (student, transcript, job) => {
  let score = 0;
  let criteriaCount = 0;

  // 1. Academic Performance (40% weight)
  if (transcript && transcript.gpa) {
    const gpaScore = Math.min(transcript.gpa / 4.0, 1);
    score += gpaScore * 0.4;
    criteriaCount++;
  }

  // 2. Skills Matching (30% weight)
  if (job.requirements && Array.isArray(job.requirements)) {
    const studentSkills = student.skills || [];
    const matchedSkills = job.requirements.filter(req => 
      studentSkills.some(skill => 
        skill.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );
    const skillScore = job.requirements.length > 0 ? matchedSkills.length / job.requirements.length : 0;
    score += skillScore * 0.3;
    criteriaCount++;
  }

  // 3. Experience Matching (20% weight)
  if (job.experience && student.experience) {
    const requiredExp = parseFloat(job.experience) || 0;
    const studentExp = parseFloat(student.experience) || 0;
    const expScore = Math.min(studentExp / Math.max(requiredExp, 1), 1);
    score += expScore * 0.2;
    criteriaCount++;
  }

  // 4. Qualifications (10% weight)
  if (job.qualifications && student.qualifications) {
    const studentQuals = Array.isArray(student.qualifications) ? student.qualifications : [student.qualifications];
    const jobQuals = Array.isArray(job.qualifications) ? job.qualifications : [job.qualifications];
    
    const qualScore = jobQuals.some(qual => 
      studentQuals.some(studentQual => 
        studentQual.toLowerCase().includes(qual.toLowerCase())
      )
    ) ? 1 : 0;
    score += qualScore * 0.1;
    criteriaCount++;
  }

  return criteriaCount > 0 ? score / (criteriaCount / 4) : 0;
};

// ========== PROFILE CONTROLLER FUNCTIONS ==========

// Get student profile
const getStudentProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    
    console.log('📋 Fetching profile for student:', uid);

    // Get user data
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const userData = userDoc.data();
    
    // Get transcript data
    const transcriptDoc = await db.collection('transcripts').doc(uid).get();
    const transcript = transcriptDoc.exists ? transcriptDoc.data() : null;
    
    // Get application stats
    const applicationsSnapshot = await db.collection('applications')
      .where('studentId', '==', uid)
      .get();

    const applications = applicationsSnapshot.docs.map(doc => doc.data());
    
    // Build profile response
    const profileData = {
      // Personal info
      fullName: userData.name || '',
      phoneNumber: userData.phone || '',
      address: userData.address || '',
      dateOfBirth: userData.dateOfBirth || '',
      
      // Academic info
      highSchool: userData.highSchool || '',
      graduationYear: userData.graduationYear || '',
      gpa: userData.gpa || '',
      academicInterests: userData.academicInterests || '',
      
      // NEW: Grades and subjects
      subjects: userData.subjects || [],
      grades: userData.grades || {},
      
      // Skills & qualifications
      skills: userData.skills || [],
      certifications: userData.certifications || [],
      
      // Transcript
      transcript: transcript,
      
      // Application stats
      applicationStats: {
        totalApplications: applications.length,
        pendingApplications: applications.filter(app => app.status === 'pending').length,
        admittedApplications: applications.filter(app => app.status === 'admitted').length,
        rejectedApplications: applications.filter(app => app.status === 'rejected').length,
        acceptedApplications: applications.filter(app => app.status === 'accepted').length,
      }
    };

    console.log('✅ Profile data retrieved for:', uid);
    
    res.json(successResponse({ profile: profileData }, 'Profile retrieved successfully'));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(errorResponse('Failed to get profile', error.message));
  }
};

// Update student profile - WITH COMPREHENSIVE DEBUGGING
const updateStudentProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    const updateData = req.body;

    console.log('🚨 ========== BACKEND DEBUG START ==========');
    console.log('📨 REQUEST BODY RECEIVED:');
    console.log('Full body:', JSON.stringify(req.body, null, 2));
    console.log('Subjects in request:', req.body.subjects);
    console.log('Grades in request:', req.body.grades);
    console.log('All keys in request:', Object.keys(req.body));
    console.log('User UID:', uid);
    console.log('🚨 ========== BACKEND DEBUG END ==========');

    // Allowed fields to update
    const allowedFields = [
      'name', 'phone', 'address', 'dateOfBirth', 
      'highSchool', 'graduationYear', 'gpa', 'academicInterests',
      'skills', 'certifications',
      'subjects', 'grades' // THESE SHOULD BE ALLOWED
    ];

    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        // Map frontend field names to backend field names
        const backendField = key === 'fullName' ? 'name' : key;
        filteredData[backendField] = updateData[key];
        console.log(`✅ Field "${key}" → "${backendField}":`, updateData[key]);
      } else {
        console.log(`❌ Field "${key}" NOT ALLOWED - skipping`);
      }
    });

    console.log('🔍 FILTERED DATA FOR FIRESTORE:', filteredData);
    console.log('🔍 Subjects in filtered data:', filteredData.subjects);
    console.log('🔍 Grades in filtered data:', filteredData.grades);

    // Calculate GPA if grades are provided
    if (filteredData.grades && Object.keys(filteredData.grades).length > 0) {
      const calculatedGPA = calculateGPA(filteredData.grades);
      filteredData.gpa = calculatedGPA;
      console.log('📊 Auto-calculated GPA:', calculatedGPA);
    }

    // Save to Firestore
    console.log('💾 SAVING TO FIRESTORE...');
    await db.collection('users').doc(uid).update({
      ...filteredData,
      updatedAt: new Date()
    });

    console.log('✅ SUCCESS: Data saved to Firestore');
    
    // Return updated profile data
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    console.log('🔍 VERIFICATION - What is actually in Firestore now:');
    console.log('Subjects in Firestore:', userData.subjects);
    console.log('Grades in Firestore:', userData.grades);
    console.log('GPA in Firestore:', userData.gpa);

    const updatedProfile = {
      fullName: userData.name || '',
      phoneNumber: userData.phone || '',
      address: userData.address || '',
      dateOfBirth: userData.dateOfBirth || '',
      highSchool: userData.highSchool || '',
      graduationYear: userData.graduationYear || '',
      gpa: userData.gpa || '',
      academicInterests: userData.academicInterests || '',
      skills: userData.skills || [],
      certifications: userData.certifications || [],
      subjects: userData.subjects || [],
      grades: userData.grades || {}
    };

    console.log('✅ Profile updated successfully for:', uid);
    
    res.json(successResponse(
      { profile: updatedProfile },
      'Profile updated successfully'
    ));

  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json(errorResponse('Failed to update profile', error.message));
  }
};

// Get student transcript
const getStudentTranscript = async (req, res) => {
  try {
    const { uid } = req.user;
    
    console.log('📄 Fetching transcript for student:', uid);

    const transcriptDoc = await db.collection('transcripts').doc(uid).get();
    
    if (!transcriptDoc.exists) {
      return res.json(successResponse(
        { transcript: null },
        'No transcript found'
      ));
    }
    
    const transcript = transcriptDoc.data();
    
    console.log('✅ Transcript retrieved for:', uid);
    
    res.json(successResponse(
      { transcript },
      'Transcript retrieved successfully'
    ));
  } catch (error) {
    console.error('Get transcript error:', error);
    res.status(500).json(errorResponse('Failed to get transcript', error.message));
  }
};

module.exports = { 
  applyForCourse, 
  getApplications, 
  uploadTranscript, 
  uploadTranscriptWithFile,
  getJobs,
  acceptAdmission,
  getDashboardData,
  getStudentProfile,
  updateStudentProfile,
  getStudentTranscript
};