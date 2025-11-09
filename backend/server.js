const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { db, auth } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 5000;

// **ADMIN PASSWORD CONSTANT**
const ADMIN_PASSWORD = "xlxu erob upbn gcti";

// **Environment variable validation**
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY', 
  'FIREBASE_CLIENT_EMAIL',
  'EMAIL_USER',
  'EMAIL_PASS'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// **COMPLETE CORS FIX - SIMPLIFIED**
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.CLIENT_URL
].filter(Boolean);

// Apply CORS middleware with ALL origins allowed in development
app.use(cors({
  origin: function (origin, callback) {
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Manual CORS headers as additional protection
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const instituteRoutes = require('./routes/instituteRoutes');
const studentRoutes = require('./routes/studentRoutes');
const companyRoutes = require('./routes/companyRoutes');
const publicRoutes = require('./routes/publicRoutes');
const rulesRoutes = require('./routes/rulesRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin/rules', rulesRoutes);
app.use('/api', notificationRoutes);

// **NEW: EMAIL VERIFICATION TEST ENDPOINT**
app.post('/api/test-email-verification', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required'
      });
    }

    const { sendEmail } = require('./utils/emailService');
    
    // Generate test verification code
    const testCode = Math.floor(10000 + Math.random() * 90000).toString();
    
    const result = await sendEmail(email, 'verification', {
      name: name,
      code: testCode
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Test verification email sent successfully',
        testCode: testCode,
        email: email
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: 'Test email failed',
      details: error.message
    });
  }
});

// **NEW: VERIFICATION SYSTEM STATUS ENDPOINT**
app.get('/api/verification-status', async (req, res) => {
  try {
    const verificationCodes = await db.collection('verification_codes').get();
    const pendingRegistrations = await db.collection('pending_registrations').get();
    
    res.json({
      success: true,
      data: {
        verificationSystem: 'Active',
        pendingVerifications: verificationCodes.size,
        pendingRegistrations: pendingRegistrations.size,
        emailService: process.env.EMAIL_USER ? 'Configured' : 'Not Configured',
        features: {
          realFirebaseAuth: 'Enabled',
          emailVerification: 'Enabled',
          fiveDigitCodes: 'Enabled',
          tokenBasedAuth: 'Enabled'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get verification status'
    });
  }
});

// **NEW: CLEANUP EXPIRED VERIFICATION CODES**
app.post('/api/cleanup-verification-codes', async (req, res) => {
  try {
    const now = new Date();
    const verificationCodes = await db.collection('verification_codes').get();
    
    let deletedCount = 0;
    const batch = db.batch();
    
    verificationCodes.docs.forEach(doc => {
      const codeData = doc.data();
      if (codeData.expiresAt.toDate() < now) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });
    
    await batch.commit();
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired verification codes`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Cleanup failed'
    });
  }
});

// **ADMIN CREATION ENDPOINT - SECURE (Users Collection) WITH PASSWORD VALIDATION**
app.post('/api/create-first-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');

    const { email, password, name } = req.body;

    // **PASSWORD VALIDATION**
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin password. Please use the correct admin password.'
      });
    }

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Check if any admin already exists
    const existingAdmins = await db.collection('users')
      .where('role', '==', 'admin')
      .get();

    if (!existingAdmins.empty) {
      return res.status(409).json({
        success: false,
        error: 'Admin user already exists in the system'
      });
    }

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create admin user
    const adminData = {
      email: email.toLowerCase().trim(),
      role: 'admin',
      name: name.trim(),
      status: 'approved',
      passwordHash: await bcrypt.hash(password, 12),
      isEmailVerified: true,
      emailNotifications: true,
      smsNotifications: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const adminUser = await User.create(adminData);

    console.log('✅ FIRST ADMIN USER CREATED SUCCESSFULLY:');
    console.log('   📧 Email:', adminData.email);
    console.log('   👑 Role: admin');
    console.log('   🆔 ID:', adminUser.id);
    console.log('   📁 Collection: users');

    res.status(201).json({
      success: true,
      message: 'First admin user created successfully',
      data: {
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          status: adminUser.status,
          collection: 'users'
        },
        loginInstructions: 'You can now login with these credentials'
      }
    });

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user',
      details: error.message
    });
  }
});

// **CREATE ADDITIONAL ADMIN ENDPOINT WITH PASSWORD VALIDATION**
app.post('/api/create-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');

    const { email, password, name } = req.body;

    // **PASSWORD VALIDATION**
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin password. Please use the correct admin password.'
      });
    }

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Check if email already exists in users collection
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create admin user in users collection
    const adminData = {
      email: email.toLowerCase().trim(),
      role: 'admin',
      name: name.trim(),
      status: 'approved',
      passwordHash: await bcrypt.hash(password, 12),
      isEmailVerified: true,
      emailNotifications: true,
      smsNotifications: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const adminUser = await User.create(adminData);

    console.log('✅ ADDITIONAL ADMIN USER CREATED SUCCESSFULLY:');
    console.log('   📧 Email:', adminData.email);
    console.log('   👑 Role: admin');
    console.log('   🆔 ID:', adminUser.id);
    console.log('   📁 Collection: users');

    res.status(201).json({
      success: true,
      message: 'Additional admin user created successfully',
      data: {
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          status: adminUser.status,
          collection: 'users'
        },
        loginInstructions: 'You can now login with these credentials'
      }
    });

  } catch (error) {
    console.error('❌ Error creating additional admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user',
      details: error.message
    });
  }
});

// **CREATE ADMIN IN SEPARATE ADMINS COLLECTION WITH PASSWORD VALIDATION**
app.post('/api/create-admin-separate', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');

    const { email, password, name } = req.body;

    // **PASSWORD VALIDATION**
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin password. Please use the correct admin password.'
      });
    }

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Check if admin already exists in admins collection
    const existingAdmin = await db.collection('admins')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!existingAdmin.empty) {
      return res.status(409).json({
        success: false,
        error: 'Admin user already exists in admins collection'
      });
    }

    // Create admin ONLY in admins collection (not in users collection)
    const adminData = {
      email: email.toLowerCase().trim(),
      role: 'admin',
      name: name.trim(),
      status: 'approved',
      passwordHash: await bcrypt.hash(password, 12),
      isEmailVerified: true,
      emailNotifications: true,
      smsNotifications: false,
      permissions: ['all'], // Admin-specific permissions
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create ONLY in admins collection
    const adminRef = await db.collection('admins').add(adminData);

    console.log('✅ ADMIN CREATED IN SEPARATE COLLECTION:');
    console.log('   📧 Email:', adminData.email);
    console.log('   👑 Role: admin');
    console.log('   🆔 Admin ID:', adminRef.id);
    console.log('   📁 Collection: admins ✅');

    res.status(201).json({
      success: true,
      message: 'Admin created in separate collection successfully',
      data: {
        admin: {
          id: adminRef.id,
          email: adminData.email,
          name: adminData.name,
          role: adminData.role,
          collection: 'admins',
          permissions: adminData.permissions
        }
      }
    });

  } catch (error) {
    console.error('❌ Error creating admin in separate collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin in separate collection',
      details: error.message
    });
  }
});

// **QUICK ADMIN CHECK ENDPOINT**
app.get('/api/check-admin-exists', async (req, res) => {
  try {
    const adminsSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .get();

    const admins = adminsSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      status: doc.data().status,
      collection: 'users'
    }));

    res.json({
      success: true,
      data: {
        adminCount: admins.length,
        admins: admins,
        exists: admins.length > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check admin users',
      details: error.message
    });
  }
});

// **CHECK SEPARATE ADMIN COLLECTION**
app.get('/api/check-admins-collection', async (req, res) => {
  try {
    const adminsSnapshot = await db.collection('admins').get();
    const usersAdminSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .get();

    const admins = adminsSnapshot.docs.map(doc => ({
      id: doc.id,
      collection: 'admins',
      ...doc.data()
    }));

    const usersAdmins = usersAdminSnapshot.docs.map(doc => ({
      id: doc.id,
      collection: 'users',
      ...doc.data()
    }));

    res.json({
      success: true,
      data: {
        adminsCollection: {
          count: admins.length,
          admins: admins
        },
        usersCollection: {
          count: usersAdmins.length,
          admins: usersAdmins
        },
        totalAdmins: admins.length + usersAdmins.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check admin collections',
      details: error.message
    });
  }
});

// **GET PLATFORM RULES (PUBLIC ENDPOINT)**
app.get('/api/rules', async (req, res) => {
  try {
    const rulesDoc = await db.collection('platform_rules').doc('current').get();
    
    if (!rulesDoc.exists) {
      return res.json({
        success: true,
        data: { rules: [] },
        message: 'No platform rules set yet'
      });
    }

    res.json({
      success: true,
      data: { rules: rulesDoc.data() },
      message: 'Platform rules retrieved successfully'
    });
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform rules'
    });
  }
});

// **NEW: FIREBASE AUTH STATUS ENDPOINT**
app.get('/api/auth-status', async (req, res) => {
  try {
    const usersCount = await db.collection('users').get();
    const adminsCount = await db.collection('admins').get();
    const verificationCodesCount = await db.collection('verification_codes').get();
    const pendingRegistrationsCount = await db.collection('pending_registrations').get();

    res.json({
      success: true,
      data: {
        authenticationSystem: 'Real Firebase Auth - ACTIVE',
        totalUsers: usersCount.size,
        totalAdmins: adminsCount.size,
        pendingVerifications: verificationCodesCount.size,
        pendingRegistrations: pendingRegistrationsCount.size,
        features: {
          realTokens: '✅ Enabled',
          emailVerification: '✅ 5-digit codes',
          secureRegistration: '✅ Two-step process',
          passwordHashing: '✅ Bcrypt',
          tokenValidation: '✅ Firebase Admin SDK'
        },
        security: {
          mockTokens: '❌ DISABLED',
          realFirebaseAuth: '✅ ENABLED'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get auth status'
    });
  }
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Career Guidance Platform API',
    version: '2.0.0',
    description: 'Complete API for Career Guidance and Employment Integration Platform',
    features: 'REAL Firebase Authentication + Email Verification System',
    adminPassword: 'Required for admin creation: "xlxu erob upbn gcti"',
    
    newFeatures: {
      authentication: 'Real Firebase Auth (No Mock Tokens)',
      emailVerification: '5-digit code system',
      registration: 'Two-step process (Start → Verify → Complete)',
      security: 'Enhanced password hashing and token management'
    },

    authEndpoints: {
      'POST /api/auth/register/start': 'Start registration - Send verification code',
      'POST /api/auth/register/complete': 'Complete registration - Verify code',
      'POST /api/auth/register/resend-code': 'Resend verification code',
      'POST /api/auth/login': 'User login (Real Firebase tokens)',
      'GET /api/auth/profile': 'Get user profile',
      'PUT /api/auth/profile': 'Update user profile'
    },

    verificationEndpoints: {
      'GET /api/verification-status': 'Check verification system status',
      'POST /api/test-email-verification': 'Test email verification system',
      'POST /api/cleanup-verification-codes': 'Cleanup expired codes'
    },

    adminEndpoints: {
      'POST /api/create-first-admin': 'Create first admin user (Password Protected)',
      'POST /api/create-admin': 'Create additional admin users (Password Protected)',
      'POST /api/create-admin-separate': 'Create admin in separate collection (Password Protected)',
      'GET /api/check-admin-exists': 'Check if admin users exist',
      'GET /api/check-admins-collection': 'Check both admin collections',
      'GET /api/auth-status': 'Check authentication system status'
    },

    rulesManagement: {
      'POST /api/admin/rules/rules': 'Set platform rules and regulations (Admin only)',
      'GET /api/admin/rules/rules': 'Get platform rules (Admin only)',
      'POST /api/admin/rules/users/:userId/warn': 'Warn user for rule violation (Admin only)',
      'DELETE /api/admin/rules/users/:userId': 'Delete user immediately (Admin only)',
      'GET /api/admin/rules/users/:userId/warnings': 'Get user warnings (Admin only)',
      'GET /api/rules': 'Get platform rules (Public)'
    },

    publicEndpoints: {
      'GET /api/public/courses': 'Get all active courses from approved institutions',
      'GET /api/public/institutions': 'Get all approved institutions',
      'GET /api/public/jobs': 'Get all active jobs'
    },

    studentEndpoints: {
      'GET /api/student/applications': 'Get student applications',
      'POST /api/student/applications': 'Apply for course (with grades and qualification check)',
      'POST /api/student/transcript': 'Upload transcript',
      'GET /api/student/jobs': 'Get available jobs',
      'POST /api/student/admissions/accept': 'Accept admission offer',
      'GET /api/student/dashboard': 'Get student dashboard'
    },

    instituteEndpoints: {
      'GET /api/institute/courses': 'Get institute courses',
      'POST /api/institute/courses': 'Add new course (with minimum grade requirements)',
      'PATCH /api/institute/courses/:id': 'Update course',
      'DELETE /api/institute/courses/:id': 'Delete course',
      'GET /api/institute/applications': 'Get course applications',
      'PATCH /api/institute/applications/:applicationId': 'Update application status',
      'GET /api/institute/stats/applications': 'Get application statistics',
      'GET /api/institute/dashboard': 'Get institute dashboard'
    },

    companyEndpoints: {
      'GET /api/company/jobs': 'Get company jobs',
      'POST /api/company/jobs': 'Post new job',
      'GET /api/company/jobs/:jobId/applicants': 'Get qualified applicants',
      'GET /api/company/stats/applications': 'Get job application statistics',
      'GET /api/company/dashboard': 'Get company dashboard'
    },

    adminEndpoints: {
      'GET /api/admin/users': 'Get all users with filtering',
      'PATCH /api/admin/users/:userId/approve': 'Approve user account',
      'PATCH /api/admin/users/:userId/suspend': 'Suspend user account',
      'GET /api/admin/stats': 'Get system statistics'
    },

    features: {
      qualificationCheck: 'Students must meet course grade requirements to apply',
      applicationLimits: 'Max 2 applications per institution per student',
      gradeValidation: 'Automatic grade validation against course requirements',
      transcriptVerification: 'Transcript upload and verification system',
      ruleEnforcement: '3-strike warning system with account suspension',
      jobMatching: 'Intelligent job matching based on qualifications',
      realAuthentication: 'Real Firebase Auth with email verification',
      secureRegistration: '5-digit code verification system'
    }
  });
});

// Test routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Career Guidance Platform Backend is working!',
    version: '2.0.0 - REAL FIREBASE AUTH',
    timestamp: new Date().toISOString(),
    firebase: 'Connected successfully',
    authentication: 'Real Firebase Tokens',
    emailVerification: '5-digit code system active',
    cors: 'CORS is configured correctly',
    yourOrigin: req.headers.origin,
    environment: process.env.NODE_ENV || 'development',
    adminPassword: 'Protected with: "xlxu erob upbn gcti"'
  });
});

// CORS test endpoint
app.get('/api/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS test successful!',
    origin: req.headers.origin,
    allowedOrigins: allowedOrigins,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// REAL Firestore debugging route
app.get('/api/debug/firestore', async (req, res) => {
  try {
    const [usersSnapshot, coursesSnapshot, applicationsSnapshot, jobsSnapshot, adminsSnapshot, rulesSnapshot, verificationCodesSnapshot, pendingRegistrationsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('courses').get(),
      db.collection('applications').get(),
      db.collection('jobs').get(),
      db.collection('admins').get(),
      db.collection('platform_rules').get(),
      db.collection('verification_codes').get(),
      db.collection('pending_registrations').get()
    ]);

    const stats = {
      database: 'Firestore (Real Database)',
      authentication: 'Real Firebase Auth - ACTIVE',
      collections: {
        users: usersSnapshot.size,
        courses: coursesSnapshot.size,
        applications: applicationsSnapshot.size,
        jobs: jobsSnapshot.size,
        admins: adminsSnapshot.size,
        platform_rules: rulesSnapshot.size,
        verification_codes: verificationCodesSnapshot.size,
        pending_registrations: pendingRegistrationsSnapshot.size
      },
      features: {
        realTokens: 'Enabled',
        emailVerification: 'Active',
        twoStepRegistration: 'Active'
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Firestore Database Statistics',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Firestore statistics',
      details: error.message
    });
  }
});

// Debug endpoint to check user data
app.get('/api/debug/user/:email', async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findByEmail(req.params.email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.toJSON(),
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash ? user.passwordHash.length : 0,
      warnings: user.warnings || [],
      warningCount: user.warningCount || 0,
      authentication: {
        hasFirebaseUID: !!user.uid,
        isEmailVerified: user.isEmailVerified,
        usesRealTokens: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enhanced Firebase test route
app.get('/api/test-firebase', async (req, res) => {
  try {
    const testRef = db.collection('server_tests');
    const writeResult = await testRef.add({
      message: 'Firestore connection test',
      timestamp: new Date(),
      server: 'Career Guidance Platform',
      version: '2.0.0 - Real Firebase Auth',
      features: 'Email Verification + Real Tokens'
    });

    const readResult = await testRef.doc(writeResult.id).get();

    res.json({ 
      success: true,
      message: 'Firebase services are working correctly!',
      data: {
        firestore: {
          write: 'Successful',
          read: 'Successful',
          testId: writeResult.id
        },
        authentication: 'Real Firebase Auth - ACTIVE',
        emailVerification: '5-digit code system - READY',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Firebase connection failed',
      details: error.message,
      troubleshooting: [
        'Check Firebase service account credentials',
        'Verify Firestore database is enabled',
        'Check project permissions'
      ]
    });
  }
});

// Database health check
app.get('/api/health/database', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const testRef = db.collection('health_checks');
    await testRef.add({
      check: 'database_health',
      timestamp: new Date(),
      version: '2.0.0'
    });

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        database: 'Firestore',
        status: 'healthy',
        authentication: 'Real Firebase Auth',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Database health check failed',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Career Guidance Platform API',
    version: '2.0.0 - REAL FIREBASE AUTH',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'Enabled - All origins allowed in development',
    adminProtection: 'Enabled - Password required for admin creation',
    features: {
      authentication: 'Real Firebase Auth ✅',
      email_verification: '5-digit codes ✅',
      role_management: 'Active ✅',
      course_management: 'Active ✅',
      job_matching: 'Active ✅',
      notifications: 'Active ✅',
      file_uploads: 'Active ✅',
      qualification_check: 'Active ✅',
      application_limits: 'Active (2 per institution) ✅',
      rules_enforcement: 'Active (3-strike system) ✅',
      admin_creation: 'Password Protected ✅'
    },
    security: {
      mock_tokens: 'DISABLED ❌',
      real_firebase_auth: 'ENABLED ✅',
      email_verification: 'ENABLED ✅',
      password_hashing: 'ENABLED ✅'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Career Guidance Platform API',
    version: '2.0.0 - REAL FIREBASE AUTH',
    status: 'running',
    features: 'Email Verification + Real Tokens + Secure Registration',
    adminPassword: 'Required for admin creation: "xlxu erob upbn gcti"',
    
    newAuthentication: {
      system: 'Real Firebase Authentication',
      tokens: 'No more mock tokens',
      verification: '5-digit email codes',
      security: 'Enhanced password hashing'
    },

    documentation: '/api/docs',
    
    authSystem: {
      checkStatus: 'GET /api/auth-status',
      testEmail: 'POST /api/test-email-verification',
      verificationStatus: 'GET /api/verification-status'
    },

    adminSetup: {
      checkAdmin: 'GET /api/check-admin-exists',
      createFirstAdmin: 'POST /api/create-first-admin (Password Protected)',
      createAdditionalAdmin: 'POST /api/create-admin (Password Protected)',
      createSeparateAdmin: 'POST /api/create-admin-separate (Password Protected)',
      checkBothCollections: 'GET /api/check-admins-collection'
    },

    rulesManagement: {
      setRules: 'POST /api/admin/rules/rules',
      getRules: 'GET /api/rules (Public)',
      warnUser: 'POST /api/admin/rules/users/:userId/warn',
      deleteUser: 'DELETE /api/admin/rules/users/:userId'
    },

    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      institute: '/api/institute',
      student: '/api/student',
      company: '/api/company',
      public: '/api/public',
      rules: '/api/admin/rules',
      health: '/health',
      test: '/api/test',
      testCors: '/api/test-cors',
      docs: '/api/docs',
      authStatus: '/api/auth-status'
    }
  });
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Unhandled Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS Error',
      message: 'Request blocked by CORS policy',
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    version: '2.0.0 - Real Firebase Auth',
    availableEndpoints: [
      'GET /health',
      'GET /api/test',
      'GET /api/test-cors',
      'GET /api/test-firebase',
      'GET /api/debug/firestore',
      'GET /api/docs',
      'GET /api/auth-status',
      'GET /api/verification-status',
      'POST /api/test-email-verification',
      'POST /api/auth/register/start',
      'POST /api/auth/register/complete',
      'POST /api/auth/login',
      'POST /api/create-first-admin (Password Protected)',
      'POST /api/create-admin (Password Protected)',
      'POST /api/create-admin-separate (Password Protected)',
      'GET /api/check-admin-exists',
      'GET /api/check-admins-collection',
      'GET /api/rules'
    ]
  });
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🔻 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔻 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Career Guidance Platform Backend - VERSION 2.0.0`);
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`\n🎯 NEW FEATURES IMPLEMENTED:`);
  console.log(`   ✅ Real Firebase Authentication (No Mock Tokens)`);
  console.log(`   ✅ 5-digit Email Verification System`);
  console.log(`   ✅ Two-step Registration Process`);
  console.log(`   ✅ Enhanced Security & Password Hashing`);
  console.log(`\n📚 API Routes:`);
  console.log(`   🔐 /api/auth     - Authentication & User Management`);
  console.log(`   👑 /api/admin    - Administration & System Management`);
  console.log(`   🏫 /api/institute - Institution & Course Management`);
  console.log(`   👨‍🎓 /api/student  - Student Features & Applications`);
  console.log(`   💼 /api/company  - Company & Job Management`);
  console.log(`   🌐 /api/public   - Public Access Endpoints`);
  console.log(`   ⚖️  /api/admin/rules - Rules & Regulations Management`);
  console.log(`\n🔐 ADMIN PASSWORD: "xlxu erob upbn gcti"`);
  console.log(`\n📧 EMAIL VERIFICATION SYSTEM:`);
  console.log(`   📋 GET  /api/verification-status     - Check system status`);
  console.log(`   🧪 POST /api/test-email-verification - Test email sending`);
  console.log(`   🧹 POST /api/cleanup-verification-codes - Cleanup expired codes`);
  console.log(`\n🔐 AUTHENTICATION SYSTEM:`);
  console.log(`   📊 GET  /api/auth-status            - Check auth system status`);
  console.log(`   ➕ POST /api/auth/register/start    - Start registration (send code)`);
  console.log(`   ✅ POST /api/auth/register/complete - Complete registration (verify code)`);
  console.log(`   🔄 POST /api/auth/register/resend-code - Resend verification code`);
  console.log(`\n👑 ADMIN SETUP (PASSWORD PROTECTED):`);
  console.log(`   📋 GET  /api/check-admin-exists     - Check if admin exists in users collection`);
  console.log(`   ➕ POST /api/create-first-admin     - Create first admin in users collection 🔐`);
  console.log(`   ➕ POST /api/create-admin           - Create additional admin in users collection 🔐`);
  console.log(`   ➕ POST /api/create-admin-separate  - Create admin in separate admins collection 🔐`);
  console.log(`   📊 GET  /api/check-admins-collection - Check both admin collections`);
  console.log(`\n⚖️ RULES MANAGEMENT:`);
  console.log(`   📝 POST /api/admin/rules/rules      - Set platform rules (Admin only)`);
  console.log(`   📖 GET  /api/rules                  - Get platform rules (Public)`);
  console.log(`   ⚠️  POST /api/admin/rules/users/:id/warn - Warn user for violations`);
  console.log(`   🗑️  DELETE /api/admin/rules/users/:id   - Delete user immediately`);
  console.log(`\n🎓 KEY FEATURES:`);
  console.log(`   ✅ Real Firebase Authentication`);
  console.log(`   ✅ 5-digit Email Verification`);
  console.log(`   ✅ Grade-based qualification checking`);
  console.log(`   ✅ 2-application limit per institution`);
  console.log(`   ✅ Transcript verification system`);
  console.log(`   ✅ 3-strike warning system`);
  console.log(`   ✅ Intelligent job matching`);
  console.log(`\n🔧 Debug Endpoints:`);
  console.log(`   ❤️  /health              - Health check`);
  console.log(`   🧪 /api/test             - Basic API test`);
  console.log(`   🌐 /api/test-cors        - CORS test`);
  console.log(`   🔥 /api/test-firebase    - Firebase connection test`);
  console.log(`   📊 /api/debug/firestore  - Real database statistics`);
  console.log(`   📖 /api/docs             - API documentation`);
  console.log(`   🔐 /api/auth-status      - Authentication system status`);
  console.log(`\n🌐 CORS Configuration:`);
  console.log(`   Mode: ${process.env.NODE_ENV === 'development' ? 'ALL origins allowed (development)' : 'Restricted origins (production)'}`);
  console.log(`   Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`   Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`);
  console.log(`   Headers: Content-Type, Authorization, X-Requested-With`);
  console.log(`   Credentials: Enabled`);
  console.log(`\n⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`\n✅ Backend successfully initialized with REAL FIREBASE AUTH & EMAIL VERIFICATION SYSTEM\n`);
});