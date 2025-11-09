const express = require('express');
const multer = require('multer');
const path = require('path');
const { 
  applyForCourse, 
  getApplications, 
  uploadTranscript, 
  getJobs,
  acceptAdmission,
  getDashboardData,
  getStudentProfile,
  updateStudentProfile,
  getStudentTranscript,
  uploadTranscriptWithFile
} = require('../controllers/studentController');

const { verifyToken, requireStudent, debugMiddleware } = require('../middleware/auth');

const router = express.Router();

// Simple and reliable Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use simple relative path - you'll create this directory manually
    const uploadPath = 'uploads/transcripts/';
    console.log('📁 Multer destination path:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'transcript-' + uniqueSuffix + path.extname(file.originalname);
    console.log('📄 Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    console.log('🔍 File filter - MIME type:', file.mimetype);
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.log('❌ Invalid file type:', file.mimetype);
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'));
    }
  }
});

// Apply middleware
router.use(debugMiddleware);
router.use(verifyToken);
router.use(requireStudent);

// Student Profile Routes
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);

// Student applications
router.post('/applications', applyForCourse);
router.get('/applications', getApplications);

// Transcript routes
router.post('/transcript/upload', upload.single('transcript'), uploadTranscriptWithFile);
router.post('/transcript', uploadTranscript);
router.get('/transcript', getStudentTranscript);

// Jobs
router.get('/jobs', getJobs);

// Admission management
router.post('/admissions/accept', acceptAdmission);

// Dashboard data
router.get('/dashboard', getDashboardData);

// Enhanced test upload route with better debugging
router.post('/test-upload', upload.single('transcript'), (req, res) => {
  console.log('🎯 TEST UPLOAD ROUTE HIT!');
  console.log('📦 File details:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    encoding: req.file.encoding,
    mimetype: req.file.mimetype,
    size: req.file.size,
    destination: req.file.destination,
    filename: req.file.filename,
    path: req.file.path
  } : 'No file received');
  console.log('📦 Request body:', req.body);
  console.log('👤 User:', req.user ? { uid: req.user.uid, role: req.user.role } : 'No user');
  
  res.json({
    success: true,
    message: 'File upload test successful!',
    fileInfo: req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
      destination: req.file.destination
    } : null,
    user: req.user ? { uid: req.user.uid, role: req.user.role } : null
  });
});

module.exports = router;