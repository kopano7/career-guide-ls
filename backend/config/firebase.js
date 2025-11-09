const admin = require('firebase-admin');

// Enhanced environment variable validation
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL'
];

console.log('🔧 Checking Firebase environment variables...');
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error(`💡 Please check your .env file configuration`);
    process.exit(1);
  } else {
    console.log(`   ✅ ${envVar}: ${envVar.includes('KEY') ? '***' : process.env[envVar]}`);
  }
}

// Enhanced private key processing
const processPrivateKey = (privateKey) => {
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY is undefined or empty');
  }

  // Handle both formats: with \n escapes and actual newlines
  let processedKey = privateKey;
  
  // If key contains \n sequences, replace them with actual newlines
  if (privateKey.includes('\\n')) {
    console.log('   🔧 Processing private key: replacing \\n with actual newlines');
    processedKey = privateKey.replace(/\\n/g, '\n');
  }
  
  // Validate the key format
  if (!processedKey.includes('-----BEGIN PRIVATE KEY-----') || 
      !processedKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid private key format. Must contain BEGIN/END PRIVATE KEY markers');
  }
  
  return processedKey;
};

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: processPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: "googleapis.com"
};

// Log service account info (safely)
console.log('🔧 Service Account Configuration:');
console.log(`   📧 Client Email: ${serviceAccount.client_email}`);
console.log(`   🆔 Project ID: ${serviceAccount.project_id}`);
console.log(`   🔑 Private Key: ${serviceAccount.private_key ? '✓ Present' : '✗ Missing'}`);

let db, auth, bucket;

try {
  console.log('🚀 Initializing Firebase Admin SDK...');
  
  // Initialize Firebase only if not already initialized
  if (admin.apps.length === 0) {
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`   📍 Project: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`   🏠 Database: https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`);
  } else {
    console.log('⚠️ Firebase app already initialized, using existing instance');
  }

  // Initialize services (synchronously - no await)
  console.log('🔄 Initializing Firebase services...');
  
  db = admin.firestore();
  auth = admin.auth();
  bucket = admin.storage().bucket();

  console.log('✅ Firebase services initialized');
  console.log('   🔥 Firestore: Ready');
  console.log('   🔐 Auth: Ready'); 
  console.log('   📦 Storage: Ready');

  // Test connections asynchronously (but don't await at top level)
  testConnections().catch(console.error);

} catch (error) {
  console.error('💥 Firebase initialization failed:');
  console.error('   Error:', error.message);
  
  if (error.code === 'app/duplicate-app') {
    console.error('   💡 Firebase app already initialized');
  } else if (error.code === 'app/no-app') {
    console.error('   💡 Firebase app not properly configured');
  } else if (error.message.includes('private')) {
    console.error('   🔑 Private key issue detected:');
    console.error('   💡 Check FIREBASE_PRIVATE_KEY format in .env file');
  } else if (error.message.includes('certificate')) {
    console.error('   📧 Service account email issue:');
    console.error('   💡 Verify FIREBASE_CLIENT_EMAIL matches your service account');
  } else if (error.message.includes('project')) {
    console.error('   🆔 Project ID issue:');
    console.error('   💡 Verify FIREBASE_PROJECT_ID matches your Firebase project');
  }
  
  process.exit(1);
}

// Async connection testing (called but not awaited at top level)
async function testConnections() {
  try {
    console.log('🧪 Testing Firestore connection...');
    const testDocRef = db.collection('connection_tests').doc('init');
    await testDocRef.set({
      message: 'Firestore connection test',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    await testDocRef.get();
    console.log('   ✅ Firestore: Read/Write test passed');

    console.log('🧪 Testing Auth service...');
    const authTest = await auth.listUsers(1);
    console.log('   ✅ Auth: Connection test passed');

    console.log('🎉 All Firebase connection tests passed');
  } catch (error) {
    console.error('⚠️ Connection test failed (non-critical):', error.message);
  }
}

// Firebase Schema Definitions
const firebaseSchema = {
  // Users Collection
  users: {
    collection: 'users',
    fields: {
      // Basic Info
      uid: 'string',
      email: 'string',
      role: ['student', 'institute', 'company', 'admin'],
      status: ['pending', 'approved', 'suspended', 'active'],
      
      // Profile Info
      name: 'string',
      phone: 'string',
      address: 'string',
      profileImage: 'string',
      
      // Role-specific fields
      institutionName: 'string',
      companyName: 'string',
      
      // Academic Info (for students)
      dateOfBirth: 'timestamp',
      gender: ['male', 'female', 'other'],
      academicLevel: ['high_school', 'undergraduate', 'graduate'],
      
      // Timestamps
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      lastLoginAt: 'timestamp',
      approvedAt: 'timestamp',
      
      // Preferences
      emailNotifications: 'boolean',
      smsNotifications: 'boolean',
      
      // System
      isEmailVerified: 'boolean'
    }
  },

  // Institutions Collection
  institutions: {
    collection: 'institutions',
    fields: {
      uid: 'string',
      name: 'string',
      email: 'string',
      phone: 'string',
      address: 'string',
      website: 'string',
      description: 'string',
      logo: 'string',
      
      // Accreditation & Details
      accreditationNumber: 'string',
      establishedYear: 'number',
      institutionType: ['university', 'college', 'vocational', 'training_center'],
      
      // Contact Persons
      contactPersons: 'array',
      
      // Status
      status: ['pending', 'approved', 'suspended'],
      
      // Statistics
      totalCourses: 'number',
      totalStudents: 'number',
      totalApplications: 'number',
      
      // Timestamps
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      approvedAt: 'timestamp'
    }
  },

  // Companies Collection
  companies: {
    collection: 'companies',
    fields: {
      uid: 'string',
      name: 'string',
      email: 'string',
      phone: 'string',
      address: 'string',
      website: 'string',
      description: 'string',
      logo: 'string',
      
      // Company Details
      industry: 'string',
      companySize: ['startup', 'small', 'medium', 'large', 'enterprise'],
      foundedYear: 'number',
      
      // Contact Persons
      contactPersons: 'array',
      
      // Status
      status: ['pending', 'approved', 'suspended'],
      
      // Statistics
      totalJobs: 'number',
      totalApplicants: 'number',
      
      // Timestamps
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      approvedAt: 'timestamp'
    }
  },

  // Courses Collection
  courses: {
    collection: 'courses',
    fields: {
      // Basic Info
      name: 'string',
      description: 'string',
      code: 'string',
      
      // Institution Reference
      instituteId: 'string',
      instituteName: 'string',
      
      // Course Details
      duration: 'string',
      level: ['certificate', 'diploma', 'undergraduate', 'postgraduate'],
      field: 'string',
      faculty: 'string',
      
      // Requirements
      requirements: 'string',
      minimumGrade: 'string',
      entranceExamRequired: 'boolean',
      
      // Capacity & Dates
      seats: 'number',
      availableSeats: 'number',
      applicationDeadline: 'timestamp',
      startDate: 'timestamp',
      
      // Fees
      tuitionFee: 'number',
      applicationFee: 'number',
      currency: ['LSL', 'USD', 'ZAR'],
      
      // Status
      status: ['active', 'inactive', 'full'],
      
      // Statistics
      totalApplications: 'number',
      admittedStudents: 'number',
      
      // Timestamps
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    }
  },

  // Applications Collection
  applications: {
    collection: 'applications',
    fields: {
      // References
      studentId: 'string',
      studentName: 'string',
      studentEmail: 'string',
      
      courseId: 'string',
      courseName: 'string',
      
      instituteId: 'string',
      instituteName: 'string',
      
      // Application Details
      status: ['pending', 'under_review', 'admitted', 'rejected', 'waitlisted'],
      appliedAt: 'timestamp',
      reviewedAt: 'timestamp',
      decisionAt: 'timestamp',
      
      // Application Content
      personalStatement: 'string',
      qualifications: 'string',
      
      // Supporting Documents
      documents: 'array',
      
      // Review Information
      reviewerNotes: 'string',
      admissionScore: 'number',
      priority: ['high', 'medium', 'low'],
      
      // Decision
      decisionReason: 'string',
      conditionalAdmission: 'boolean',
      conditions: 'string',
      
      // Student Transcript
      transcriptScore: 'number',
      transcriptVerified: 'boolean',
      
      // Timestamps
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    }
  },

  // Jobs Collection
  jobs: {
    collection: 'jobs',
    fields: {
      // Basic Info
      title: 'string',
      description: 'string',
      type: ['full_time', 'part_time', 'internship', 'contract', 'remote'],
      
      // Company Reference
      companyId: 'string',
      companyName: 'string',
      
      // Job Details
      location: 'string',
      salaryRange: 'object',
      
      // Requirements
      qualifications: 'string',
      experience: 'string',
      skills: 'array',
      
      // Application Process
      applicationDeadline: 'timestamp',
      applicationProcess: 'string',
      
      // Status
      status: ['active', 'inactive', 'filled', 'expired'],
      
      // Statistics
      totalApplicants: 'number',
      views: 'number',
      
      // Timestamps
      postedAt: 'timestamp',
      updatedAt: 'timestamp',
      expiresAt: 'timestamp'
    }
  },

  // Job Applications Collection
  jobApplications: {
    collection: 'jobApplications',
    fields: {
      // References
      applicantId: 'string',
      applicantName: 'string',
      applicantEmail: 'string',
      
      jobId: 'string',
      jobTitle: 'string',
      
      companyId: 'string',
      companyName: 'string',
      
      // Application Details
      status: ['pending', 'reviewing', 'interviewed', 'offered', 'rejected'],
      appliedAt: 'timestamp',
      
      // Application Content
      coverLetter: 'string',
      resumeUrl: 'string',
      
      // Qualifications Match
      qualificationScore: 'number',
      skillMatch: 'number',
      experienceMatch: 'number',
      
      // Review Process
      reviewerNotes: 'string',
      interviewScheduled: 'boolean',
      interviewDate: 'timestamp',
      
      // Documents
      supportingDocuments: 'array',
      
      // Timestamps
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    }
  },

  // Transcripts Collection
  transcripts: {
    collection: 'transcripts',
    fields: {
      studentId: 'string',
      studentName: 'string',
      
      // Transcript File
      fileUrl: 'string',
      fileName: 'string',
      fileSize: 'number',
      
      // Academic Information
      institution: 'string',
      graduationYear: 'number',
      gpa: 'number',
      scale: 'number',
      
      // Subjects/Grades
      subjects: 'array',
      
      // Verification
      verified: 'boolean',
      verifiedBy: 'string',
      verifiedAt: 'timestamp',
      verificationNotes: 'string',
      
      // Status
      status: ['pending', 'verified', 'rejected'],
      
      // Timestamps
      uploadedAt: 'timestamp',
      updatedAt: 'timestamp'
    }
  },

  // Notifications Collection
  notifications: {
    collection: 'notifications',
    fields: {
      // Recipient
      userId: 'string',
      userEmail: 'string',
      
      // Notification Details
      title: 'string',
      message: 'string',
      type: ['application_update', 'job_match', 'system', 'approval'],
      
      // Related Entity
      relatedTo: ['application', 'job', 'course', 'user'],
      relatedId: 'string',
      
      // Status
      status: ['unread', 'read', 'dismissed'],
      
      // Actions
      actionUrl: 'string',
      actionText: 'string',
      
      // Timestamps
      createdAt: 'timestamp',
      readAt: 'timestamp'
    }
  },

  // System Settings Collection
  system: {
    collection: 'system',
    fields: {
      // Application Settings
      maxApplicationsPerStudent: 'number',
      applicationDeadlineExtension: 'number',
      
      // Email Templates
      emailTemplates: 'object',
      
      // Platform Configuration
      maintenanceMode: 'boolean',
      registrationEnabled: 'boolean',
      
      // Academic Years
      currentAcademicYear: 'string',
      availableAcademicYears: 'array',
      
      // Timestamps
      updatedAt: 'timestamp',
      updatedBy: 'string'
    }
  }
};

// Enhanced schema validation helper functions
const schemaHelpers = {
  // Validate data against schema
  validateData: (collectionName, data) => {
    const schema = firebaseSchema[collectionName];
    if (!schema) {
      throw new Error(`Unknown collection: ${collectionName}`);
    }

    const errors = [];
    
    for (const [field, value] of Object.entries(data)) {
      const fieldSchema = schema.fields[field];
      
      if (!fieldSchema) {
        errors.push(`Unknown field: ${field}`);
        continue;
      }
      
      if (Array.isArray(fieldSchema)) {
        // Enum validation
        if (!fieldSchema.includes(value)) {
          errors.push(`Invalid value for ${field}. Expected one of: ${fieldSchema.join(', ')}`);
        }
      } else if (fieldSchema === 'array' && !Array.isArray(value)) {
        errors.push(`Field ${field} must be an array`);
      } else if (fieldSchema === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        errors.push(`Field ${field} must be an object`);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Schema validation failed for ${collectionName}: ${errors.join(', ')}`);
    }
    
    return true;
  },

  // Get collection reference with schema awareness
  getCollection: (collectionName) => {
    if (!firebaseSchema[collectionName]) {
      throw new Error(`Unknown collection: ${collectionName}`);
    }
    return db.collection(firebaseSchema[collectionName].collection);
  },

  // Create document with schema validation
  createDocument: async (collectionName, data) => {
    schemaHelpers.validateData(collectionName, data);
    
    // Add timestamps
    const documentData = {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    console.log(`📝 Creating document in ${collectionName}:`, documentData);
    const result = await db.collection(firebaseSchema[collectionName].collection).add(documentData);
    console.log(`✅ Document created with ID: ${result.id}`);
    return result;
  },

  // Update document with schema validation
  updateDocument: async (collectionName, docId, data) => {
    schemaHelpers.validateData(collectionName, data);
    
    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    console.log(`📝 Updating document ${docId} in ${collectionName}`);
    const result = await db.collection(firebaseSchema[collectionName].collection).doc(docId).update(updateData);
    console.log(`✅ Document ${docId} updated successfully`);
    return result;
  },

  // Debug helper to list all collections
  listCollections: async () => {
    try {
      const collections = await db.listCollections();
      console.log('📁 Available collections in Firestore:');
      collections.forEach(collection => {
        console.log(`   - ${collection.id}`);
      });
      return collections.map(col => col.id);
    } catch (error) {
      console.error('❌ Failed to list collections:', error.message);
      throw error;
    }
  }
};

// Export everything
module.exports = { 
  admin, 
  db, 
  auth, 
  bucket,
  schema: firebaseSchema,
  ...schemaHelpers
};