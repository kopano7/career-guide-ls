const { db } = require('../config/firebase');
const { successResponse, errorResponse } = require('../utils/helpers');
const { jobMatch } = require('../utils/notifications');

// Post job
const postJob = async (req, res) => {
  try {
    const { uid } = req.user;
    const { title, description, requirements, qualifications, deadline, location, jobType, salaryRange, experience } = req.body;

    const jobData = {
      title,
      description,
      requirements: requirements || [],
      qualifications: qualifications || [],
      deadline: new Date(deadline),
      location: location || 'Remote',
      jobType: jobType || 'full-time',
      salaryRange: salaryRange || { min: 0, max: 0, currency: 'USD' },
      experience: experience || '0 years',
      companyId: uid,
      postedAt: new Date(),
      status: 'active',
      applicationCount: 0
    };

    const jobRef = await db.collection('jobs').add(jobData);

    // Send job match notifications to qualified students
    setTimeout(async () => {
      try {
        await sendJobMatchNotifications(jobRef.id, jobData);
      } catch (notificationError) {
        console.error('Job notification error:', notificationError);
      }
    }, 1000);

    res.status(201).json(successResponse(
      {
        job: { id: jobRef.id, ...jobData }
      },
      'Job posted successfully'
    ));
  } catch (error) {
    console.error('Post job error:', error);
    res.status(500).json(errorResponse('Failed to post job', error.message));
  }
};

// Get company jobs
const getJobs = async (req, res) => {
  try {
    const { uid } = req.user;

    const snapshot = await db.collection('jobs')
      .where('companyId', '==', uid)
      .orderBy('postedAt', 'desc')
      .get();

    const jobs = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      postedAt: doc.data().postedAt?.toDate?.() || doc.data().postedAt,
      deadline: doc.data().deadline?.toDate?.() || doc.data().deadline
    }));

    res.json(successResponse({ jobs }, 'Jobs retrieved successfully'));
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json(errorResponse('Failed to get jobs', error.message));
  }
};

// Enhanced job matching with intelligent filtering
const getQualifiedApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { uid } = req.user;

    // Get job details
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json(errorResponse('Job not found'));
    }

    const job = jobDoc.data();

    // Verify job belongs to company
    if (job.companyId !== uid) {
      return res.status(403).json(errorResponse('Access denied'));
    }

    // Get all students with verified transcripts
    const studentsSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .get();

    const qualifiedApplicants = [];

    for (const studentDoc of studentsSnapshot.docs) {
      const student = studentDoc.data();
      
      // Get student transcript
      const transcriptDoc = await db.collection('transcripts').doc(studentDoc.id).get();
      const transcript = transcriptDoc.exists ? transcriptDoc.data() : null;

      // Only consider students with verified transcripts
      if (transcript && transcript.verified) {
        // Calculate match score
        const matchScore = await calculateJobMatch(student, transcript, job);
        
        if (matchScore >= 0.6) { // 60% match threshold
          qualifiedApplicants.push({
            id: studentDoc.id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            academicLevel: student.academicLevel,
            skills: student.skills || [],
            experience: student.experience || 0,
            matchScore: Math.round(matchScore * 100),
            transcript: transcript ? {
              gpa: transcript.gpa,
              verified: transcript.verified,
              institution: transcript.institution,
              graduationYear: transcript.graduationYear
            } : null,
            matchDetails: await getMatchDetails(student, transcript, job)
          });
        }
      }
    }

    // Sort by match score (highest first)
    qualifiedApplicants.sort((a, b) => b.matchScore - a.matchScore);

    res.json(successResponse({ 
      applicants: qualifiedApplicants,
      total: qualifiedApplicants.length,
      job: {
        title: job.title,
        requirements: job.requirements,
        qualifications: job.qualifications,
        experience: job.experience
      }
    }, 'Qualified applicants retrieved successfully'));

  } catch (error) {
    console.error('Get qualified applicants error:', error);
    res.status(500).json(errorResponse('Failed to get qualified applicants', error.message));
  }
};

// Job matching algorithm
const calculateJobMatch = async (student, transcript, job) => {
  let score = 0;
  let criteriaCount = 0;

  // 1. Academic Performance (40% weight)
  if (transcript && transcript.gpa) {
    const gpaScore = Math.min(transcript.gpa / 4.0, 1); // Normalize to 0-1
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

// Get detailed match breakdown
const getMatchDetails = async (student, transcript, job) => {
  const details = [];

  // Academic match
  if (transcript && transcript.gpa) {
    details.push({
      category: 'Academic Performance',
      score: Math.min(transcript.gpa / 4.0, 1),
      details: `GPA: ${transcript.gpa}/4.0`
    });
  }

  // Skills match
  if (job.requirements && Array.isArray(job.requirements)) {
    const studentSkills = student.skills || [];
    const matchedSkills = job.requirements.filter(req => 
      studentSkills.some(skill => 
        skill.toLowerCase().includes(req.toLowerCase())
      )
    );
    details.push({
      category: 'Skills Match',
      score: job.requirements.length > 0 ? matchedSkills.length / job.requirements.length : 0,
      details: `Matched ${matchedSkills.length} of ${job.requirements.length} required skills`
    });
  }

  // Experience match
  if (job.experience && student.experience) {
    const requiredExp = parseFloat(job.experience) || 0;
    const studentExp = parseFloat(student.experience) || 0;
    details.push({
      category: 'Experience',
      score: Math.min(studentExp / Math.max(requiredExp, 1), 1),
      details: `${studentExp} years vs required ${requiredExp} years`
    });
  }

  return details;
};

// Send job match notifications to qualified students
const sendJobMatchNotifications = async (jobId, jobData) => {
  try {
    // Get company details
    const companyDoc = await db.collection('users').doc(jobData.companyId).get();
    const company = companyDoc.data();

    // Get all students with verified transcripts
    const studentsSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .get();

    for (const studentDoc of studentsSnapshot.docs) {
      const student = studentDoc.data();
      const transcriptDoc = await db.collection('transcripts').doc(studentDoc.id).get();
      const transcript = transcriptDoc.exists ? transcriptDoc.data() : null;

      // Only notify students with verified transcripts
      if (transcript && transcript.verified) {
        const matchScore = await calculateJobMatch(student, transcript, jobData);
        
        if (matchScore >= 0.6) {
          await jobMatch(
            studentDoc.id,
            jobId,
            jobData.title,
            company.companyName || company.name
          );
        }
      }
    }

    console.log(`✅ Job match notifications sent for job: ${jobData.title}`);
  } catch (error) {
    console.error('Error sending job match notifications:', error);
  }
};

// Update job
const updateJob = async (req, res) => {
  try {
    const { uid } = req.user;
    const { jobId } = req.params;
    const updateData = req.body;

    // Verify job belongs to company
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json(errorResponse('Job not found'));
    }

    const job = jobDoc.data();
    if (job.companyId !== uid) {
      return res.status(403).json(errorResponse('Access denied'));
    }

    // Update job
    await db.collection('jobs').doc(jobId).update({
      ...updateData,
      updatedAt: new Date()
    });

    res.json(successResponse(null, 'Job updated successfully'));
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json(errorResponse('Failed to update job', error.message));
  }
};

// Close job
const closeJob = async (req, res) => {
  try {
    const { uid } = req.user;
    const { jobId } = req.params;

    // Verify job belongs to company
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json(errorResponse('Job not found'));
    }

    const job = jobDoc.data();
    if (job.companyId !== uid) {
      return res.status(403).json(errorResponse('Access denied'));
    }

    // Close job
    await db.collection('jobs').doc(jobId).update({
      status: 'closed',
      updatedAt: new Date()
    });

    res.json(successResponse(null, 'Job closed successfully'));
  } catch (error) {
    console.error('Close job error:', error);
    res.status(500).json(errorResponse('Failed to close job', error.message));
  }
};

// Get job application statistics
const getJobApplicationStats = async (req, res) => {
  try {
    const { uid } = req.user;

    const jobsSnapshot = await db.collection('jobs')
      .where('companyId', '==', uid)
      .get();

    const stats = {
      totalJobs: jobsSnapshot.size,
      activeJobs: jobsSnapshot.docs.filter(doc => doc.data().status === 'active').length,
      closedJobs: jobsSnapshot.docs.filter(doc => doc.data().status === 'closed').length,
      totalApplicants: 0,
      applicantsByJob: {}
    };

    // Count applicants for each job
    for (const jobDoc of jobsSnapshot.docs) {
      const jobId = jobDoc.id;
      const jobApplicationsSnapshot = await db.collection('job_applications')
        .where('jobId', '==', jobId)
        .get();

      stats.applicantsByJob[jobId] = {
        jobTitle: jobDoc.data().title,
        applicantCount: jobApplicationsSnapshot.size,
        qualifiedApplicants: 0, // You can add logic to count qualified applicants
        applicants: jobApplicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      };

      stats.totalApplicants += jobApplicationsSnapshot.size;
    }

    res.json(successResponse({ stats }, 'Job application statistics retrieved successfully'));
  } catch (error) {
    console.error('Get job application stats error:', error);
    res.status(500).json(errorResponse('Failed to get job application statistics', error.message));
  }
};

// Get company dashboard data
const getCompanyDashboard = async (req, res) => {
  try {
    const { uid } = req.user;

    const [jobsSnapshot, companyDoc] = await Promise.all([
      db.collection('jobs').where('companyId', '==', uid).get(),
      db.collection('users').doc(uid).get()
    ]);

    const jobs = jobsSnapshot.docs.map(doc => doc.data());

    const stats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job => job.status === 'active').length,
      totalApplicants: 0,
      companyStatus: companyDoc.exists ? companyDoc.data().status : 'unknown'
    };

    // Calculate total applicants
    for (const jobDoc of jobsSnapshot.docs) {
      const jobApplicationsSnapshot = await db.collection('job_applications')
        .where('jobId', '==', jobDoc.id)
        .get();
      stats.totalApplicants += jobApplicationsSnapshot.size;
    }

    // Recent job postings (last 5)
    const recentJobs = jobsSnapshot.docs
      .slice(0, 5)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        postedAt: doc.data().postedAt?.toDate?.() || doc.data().postedAt
      }));

    res.json(successResponse(
      { 
        stats,
        recentJobs
      },
      'Company dashboard data retrieved successfully'
    ));
  } catch (error) {
    console.error('Get company dashboard error:', error);
    res.status(500).json(errorResponse('Failed to get dashboard data', error.message));
  }
};

module.exports = { 
  postJob, 
  getJobs, 
  getQualifiedApplicants,
  updateJob,
  closeJob,
  getJobApplicationStats,
  getCompanyDashboard
};