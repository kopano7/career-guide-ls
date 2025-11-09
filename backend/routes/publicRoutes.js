const express = require('express');
const { db } = require('../config/firebase');
const { successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

// Get all active courses from approved institutions
router.get('/courses', async (req, res) => {
  try {
    console.log('📚 Fetching public courses...');
    
    // Get approved institutions
    const institutionsSnapshot = await db.collection('users')
      .where('role', '==', 'institute')
      .where('status', '==', 'approved')
      .get();

    const approvedInstitutionIds = institutionsSnapshot.docs.map(doc => doc.data().uid || doc.id);
    console.log(`✅ Found ${approvedInstitutionIds.length} approved institutions`);

    // Get all active courses
    const coursesSnapshot = await db.collection('courses')
      .where('status', '==', 'active')
      .get();

    const allCourses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to JavaScript dates
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    }));

    console.log(`📚 Found ${allCourses.length} active courses`);

    // Filter courses to only include those from approved institutions
    const approvedCourses = allCourses.filter(course => 
      approvedInstitutionIds.includes(course.instituteId)
    );

    console.log(`✅ ${approvedCourses.length} courses from approved institutions`);

    // Enhance courses with institution data
    const enhancedCourses = await Promise.all(
      approvedCourses.map(async (course) => {
        try {
          const institutionDoc = await db.collection('users').doc(course.instituteId).get();
          const institutionData = institutionDoc.data();
          
          return {
            ...course,
            institutionName: institutionData?.institutionName || institutionData?.name || 'Unknown Institution',
            instituteName: institutionData?.institutionName || institutionData?.name || 'Unknown Institution'
          };
        } catch (error) {
          console.error(`Error fetching institution data for course ${course.id}:`, error);
          return {
            ...course,
            institutionName: 'Unknown Institution',
            instituteName: 'Unknown Institution'
          };
        }
      })
    );

    res.json(successResponse(
      { courses: enhancedCourses },
      'Courses retrieved successfully'
    ));

  } catch (error) {
    console.error('❌ Error fetching public courses:', error);
    res.status(500).json(errorResponse('Failed to fetch courses'));
  }
});

// Get all approved institutions
router.get('/institutions', async (req, res) => {
  try {
    const institutionsSnapshot = await db.collection('users')
      .where('role', '==', 'institute')
      .where('status', '==', 'approved')
      .get();

    const institutions = institutionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    }));

    res.json(successResponse(
      { institutions },
      'Institutions retrieved successfully'
    ));

  } catch (error) {
    console.error('Error fetching institutions:', error);
    res.status(500).json(errorResponse('Failed to fetch institutions'));
  }
});

// Get all active jobs
router.get('/jobs', async (req, res) => {
  try {
    const jobsSnapshot = await db.collection('jobs')
      .where('status', '==', 'active')
      .get();

    const jobs = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    }));

    // Enhance jobs with company data
    const enhancedJobs = await Promise.all(
      jobs.map(async (job) => {
        try {
          const companyDoc = await db.collection('users').doc(job.companyId).get();
          const companyData = companyDoc.data();
          
          return {
            ...job,
            companyName: companyData?.companyName || companyData?.name || 'Unknown Company'
          };
        } catch (error) {
          console.error(`Error fetching company data for job ${job.id}:`, error);
          return {
            ...job,
            companyName: 'Unknown Company'
          };
        }
      })
    );

    res.json(successResponse(
      { jobs: enhancedJobs },
      'Jobs retrieved successfully'
    ));

  } catch (error) {
    console.error('Error fetching public jobs:', error);
    res.status(500).json(errorResponse('Failed to fetch jobs'));
  }
});

module.exports = router;