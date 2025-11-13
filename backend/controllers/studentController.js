const { db } = require('../config/firebase');
const { successResponse, errorResponse, calculateGPA } = require('../utils/helpers');
const { applicationSubmitted, applicationStatusChanged } = require('../utils/notifications');

// Helper function to check student qualification - WITH DEBUGGING
const checkStudentQualification = async (grades, courseRequirements) => {
  console.log('🔍 Qualification Check Debug:');
  console.log('   Student grades:', grades);
  console.log('   Course requirements:', courseRequirements);

  if (!courseRequirements || !courseRequirements.minimumGrades) {
    console.log('✅ No specific requirements - automatically qualified');
    return true; // No specific requirements
  }

  const minimumGrades = courseRequirements.minimumGrades;
  console.log('   Minimum grades required:', minimumGrades);
  
  for (const [subject, minGrade] of Object.entries(minimumGrades)) {
    const studentGrade = grades[subject];
    console.log(`   Checking ${subject}: Student=${studentGrade}, Required=${minGrade}`);
    
    if (!studentGrade || !isGradeSufficient(studentGrade, minGrade)) {
      console.log(`❌ Failed requirement: ${subject}`);
      return false;
    }
  }
  
  console.log('✅ All requirements met');
  return true;
};

// Helper function to compare grades
const isGradeSufficient = (studentGrade, minGrade) => {
  const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'A+'];
  const studentIndex = gradeOrder.indexOf(studentGrade.toUpperCase());
  const minIndex = gradeOrder.indexOf(minGrade.toUpperCase());
  
  const isSufficient = studentIndex >= minIndex;
  console.log(`   Grade comparison: ${studentGrade} vs ${minGrade} = ${isSufficient}`);
  
  return isSufficient;
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

// Update course application count - WITH DEBUGGING
const updateCourseApplicationCount = async (courseId) => {
  try {
    console.log('🔢 Updating application count for course:', courseId);
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    
    if (courseDoc.exists) {
      const currentCount = courseDoc.data().applicationCount || 0;
      console.log('   Current application count:', currentCount);
      
      await courseRef.update({
        applicationCount: currentCount + 1,
        updatedAt: new Date()
      });
      
      console.log('✅ Application count updated to:', currentCount + 1);
    } else {
      console.log('❌ Course document not found for count update');
    }
  } catch (error) {
    console.error('❌ Error updating application count:', error);
  }
};

// ✅ FIXED: Generate application number - NO INSTITUTE LOOKUP
const generateApplicationNumber = () => {
  try {
    console.log('🔢 Generating application number');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 6);
    return `APP-${timestamp}-${random}`;
  } catch (error) {
    console.error('❌ Error generating application number:', error.message);
    return `APP-${Date.now()}`;
  }
};

// ✅ FIXED: Apply for course - HANDLES COURSEID AS OBJECT AND NO INSTITUTE LOOKUPS
const applyForCourse = async (req, res) => {
  try {
    console.log('🔄 ========== APPLICATION START (FINAL FIX) ==========');
    
    const { uid, studentName } = req.user;
    
    // ✅ FIX: Handle courseId whether it's a string or object
    let courseId;
    if (typeof req.body.courseId === 'string') {
      courseId = req.body.courseId;
    } else if (req.body.courseId && typeof req.body.courseId === 'object' && req.body.courseId.courseId) {
      courseId = req.body.courseId.courseId;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    console.log('👤 User:', uid);
    console.log('🎯 Course ID:', courseId);
    console.log('📦 Request body:', req.body);

    // Basic validation
    if (!uid || !courseId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate courseId is a non-empty string
    if (typeof courseId !== 'string' || courseId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID'
      });
    }

    console.log('🔍 Step 1: Getting course data...');
    const courseDoc = await db.collection('courses').doc(courseId).get();
    
    if (!courseDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    const course = courseDoc.data();
    console.log('✅ Course found:', course.name);

    // Get student data
    const studentDoc = await db.collection('users').doc(uid).get();
    if (!studentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    const student = studentDoc.data();

    // ✅ CRITICAL: Use institute data directly from course - NO LOOKUPS!
    const instituteId = course.instituteId || 'no-institute-id';
    const instituteName = course.instituteName || 'Unknown Institution';

    console.log('🎯 Institute info:', { instituteId, instituteName });

    // Check if already applied to this course
    const existingApplication = await db.collection('applications')
      .where('studentId', '==', uid)
      .where('courseId', '==', courseId)
      .get();

    if (!existingApplication.empty) {
      console.log('❌ Already applied to this course');
      return res.status(400).json({
        success: false,
        error: 'Already applied to this course'
      });
    }

    // Check application limits per institute
    if (instituteId && instituteId !== 'no-institute-id') {
      const existingApplications = await db.collection('applications')
        .where('studentId', '==', uid)
        .where('instituteId', '==', instituteId)
        .get();

      console.log('📋 Existing applications for institute:', existingApplications.size);

      if (existingApplications.size >= 2) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 2 applications per institution allowed'
        });
      }
    }

    // QUALIFICATION CHECK using profile grades
    console.log('🎓 Step 5: Checking qualification...');
    const isQualified = await checkStudentQualification(student.grades || {}, course.requirements || {});
    console.log('✅ Qualification result:', isQualified);

    if (!isQualified) {
      console.log('❌ Student does not meet requirements');
      return res.status(400).json({
        success: false,
        error: 'You do not meet the course requirements',
        message: 'Your profile grades do not meet the minimum requirements for this course'
      });
    }

    // Calculate GPA from profile grades
    const gpa = calculateGPA(student.grades || {});
    console.log('📈 Calculated GPA:', gpa);

    // Generate application number safely - NO INSTITUTE LOOKUP!
    const applicationNumber = generateApplicationNumber();
    
    // Create application - USING ONLY RELIABLE DATA
    const applicationData = {
      studentId: uid,
      courseId: courseId,
      instituteId: instituteId,
      status: 'pending',
      appliedAt: new Date(),
      studentName: studentName || student.name || 'Student',
      studentEmail: student.email,
      courseName: course.name,
      instituteName: instituteName,
      grades: student.grades || {},
      calculatedGPA: gpa,
      isQualified: isQualified,
      qualificationScore: await calculateQualificationScore(student.grades || {}, course.requirements || {}),
      applicationNumber: applicationNumber,
      usedProfileGrades: true,
      updatedAt: new Date()
    };

    console.log('💾 Creating application...');
    const applicationRef = await db.collection('applications').add(applicationData);
    console.log('✅ Application created with ID:', applicationRef.id);

    // Update course count
    await updateCourseApplicationCount(courseId);

    // Send notification
    try {
      await applicationSubmitted(uid, applicationRef.id, course.name, instituteName);
      console.log('✅ Notification sent');
    } catch (notificationError) {
      console.error('⚠️ Notification failed:', notificationError.message);
    }

    console.log('✅ ========== APPLICATION SUCCESS ==========');

    res.status(201).json({
      success: true,
      data: {
        application: { 
          id: applicationRef.id, 
          ...applicationData
        }
      },
      message: 'Application submitted successfully! Your qualifications have been verified.'
    });

  } catch (error) {
    console.error('💥 ========== APPLICATION ERROR ==========');
    console.error('💥 Error:', error.message);
    console.error('💥 Stack:', error.stack);
    console.error('💥 Request body:', req.body);
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit application',
      message: 'Please try again or contact support'
    });
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
        
        // Safe institute lookup - only if instituteId is valid
        let institute = null;
        if (appData.instituteId && appData.instituteId !== 'no-institute-id') {
          try {
            // Validate instituteId before using it
            if (appData.instituteId && typeof appData.instituteId === 'string' && appData.instituteId.trim() !== '') {
              const instituteDoc = await db.collection('users').doc(appData.instituteId).get();
              if (instituteDoc.exists) {
                institute = instituteDoc.data();
              }
            }
          } catch (error) {
            console.error('Error fetching institute:', error.message);
          }
        }
        
        return {
          id: doc.id,
          ...appData,
          appliedAt: appData.appliedAt?.toDate?.() || appData.appliedAt,
          course: courseDoc.exists ? courseDoc.data() : null,
          institute: institute
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
