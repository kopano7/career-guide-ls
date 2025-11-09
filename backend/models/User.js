// models/User.js
const { db, admin } = require('../config/firebase');

class User {
  constructor(data) {
    this.id = data.id;
    this.uid = data.uid || data.id; // Firebase Auth UID
    this.email = data.email;
    this.role = data.role;
    this.name = data.name;
    this.status = data.status || 'pending';
    this.passwordHash = data.passwordHash;
    
    // Profile Information
    this.phone = data.phone || '';
    this.address = data.address || '';
    this.profileImage = data.profileImage || '';
    
    // Role-specific fields
    this.institutionName = data.institutionName || '';
    this.companyName = data.companyName || '';
    
    // Academic Info (for students)
    this.dateOfBirth = data.dateOfBirth || null;
    this.gender = data.gender || null;
    this.academicLevel = data.academicLevel || null;
    
    // Timestamps
    this.createdAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    this.updatedAt = data.updatedAt || admin.firestore.FieldValue.serverTimestamp();
    this.lastLoginAt = data.lastLoginAt || null;
    this.approvedAt = data.approvedAt || null;
    
    // Preferences
    this.emailNotifications = data.emailNotifications !== undefined ? data.emailNotifications : true;
    this.smsNotifications = data.smsNotifications !== undefined ? data.smsNotifications : false;
    
    // System
    this.isEmailVerified = data.isEmailVerified || false;
    
    // Password reset
    this.resetToken = data.resetToken || null;
    this.resetTokenExpires = data.resetTokenExpires || null;
  }

  // Static method to create a new user
  static async create(userData) {
    try {
      console.log('📝 Creating user in Firestore:', userData.email);
      
      const userRef = await db.collection('users').add({
        ...userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ User created successfully with ID:', userRef.id);
      return new User({ id: userRef.id, ...userData });
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Static method to find user by email
  static async findByEmail(email) {
    try {
      const snapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new User({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('❌ Error finding user by email:', error);
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Static method to find user by Firebase UID
  static async findByUid(uid) {
    try {
      const snapshot = await db.collection('users')
        .where('uid', '==', uid)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new User({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('❌ Error finding user by UID:', error);
      throw new Error(`Error finding user by UID: ${error.message}`);
    }
  }

  // Static method to find user by ID
  static async findById(id) {
    try {
      const doc = await db.collection('users').doc(id).get();
      if (!doc.exists) return null;
      return new User({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('❌ Error finding user by ID:', error);
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Static method to find users by role
  static async findByRole(role, status = null) {
    try {
      let query = db.collection('users').where('role', '==', role);
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => new User({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error finding users by role:', error);
      throw new Error(`Error finding users by role: ${error.message}`);
    }
  }

  // Static method to find pending approvals (institutes & companies)
  static async findPendingApprovals() {
    try {
      const snapshot = await db.collection('users')
        .where('status', '==', 'pending')
        .where('role', 'in', ['institute', 'company'])
        .get();
      
      return snapshot.docs.map(doc => new User({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Error finding pending approvals:', error);
      throw new Error(`Error finding pending approvals: ${error.message}`);
    }
  }

  // Update user
  async update(updateData) {
    try {
      const updateWithTimestamp = {
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(this.id).update(updateWithTimestamp);
      
      // Update current instance
      Object.assign(this, updateWithTimestamp);
      return this;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Update last login timestamp
  async updateLastLogin() {
    return await this.update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Approve user (for institutes and companies)
  async approve() {
    if (this.role !== 'institute' && this.role !== 'company') {
      throw new Error('Only institute and company accounts can be approved');
    }

    return await this.update({
      status: 'approved',
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Suspend user
  async suspend() {
    return await this.update({
      status: 'suspended'
    });
  }

  // Activate user
  async activate() {
    return await this.update({
      status: 'active'
    });
  }

  // Verify email
  async verifyEmail() {
    return await this.update({
      isEmailVerified: true
    });
  }

  // Set password reset token
  async setResetToken(token, expiresInHours = 1) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    return await this.update({
      resetToken: token,
      resetTokenExpires: expiresAt
    });
  }

  // Clear password reset token
  async clearResetToken() {
    return await this.update({
      resetToken: null,
      resetTokenExpires: null
    });
  }

  // Check if user can login
  canLogin() {
    if (this.status === 'suspended') {
      return { canLogin: false, reason: 'Account suspended' };
    }

    if ((this.role === 'institute' || this.role === 'company') && this.status !== 'approved') {
      return { canLogin: false, reason: 'Account pending approval' };
    }

    return { canLogin: true };
  }

  // Get user statistics for dashboard
  async getStats() {
    try {
      let stats = {};

      if (this.role === 'student') {
        const [applications, jobs] = await Promise.all([
          db.collection('applications').where('studentId', '==', this.id).get(),
          db.collection('jobs').where('status', '==', 'active').get()
        ]);

        const pendingApplications = applications.docs.filter(doc => 
          doc.data().status === 'pending'
        ).length;

        const admittedApplications = applications.docs.filter(doc => 
          doc.data().status === 'admitted'
        ).length;

        stats = {
          totalApplications: applications.size,
          pendingApplications,
          admittedApplications,
          availableJobs: jobs.size
        };

      } else if (this.role === 'institute') {
        const [courses, applications] = await Promise.all([
          db.collection('courses').where('instituteId', '==', this.id).get(),
          db.collection('applications').where('instituteId', '==', this.id).get()
        ]);

        const pendingApplications = applications.docs.filter(doc => 
          doc.data().status === 'pending'
        ).length;

        const admittedApplications = applications.docs.filter(doc => 
          doc.data().status === 'admitted'
        ).length;

        const totalSeats = courses.docs.reduce((sum, doc) => sum + (doc.data().seats || 0), 0);
        const availableSeats = courses.docs.reduce((sum, doc) => sum + (doc.data().availableSeats || 0), 0);

        stats = {
          totalCourses: courses.size,
          totalApplications: applications.size,
          pendingApplications,
          admittedStudents: admittedApplications,
          totalSeats,
          availableSeats
        };

      } else if (this.role === 'company') {
        const [jobs, applications] = await Promise.all([
          db.collection('jobs').where('companyId', '==', this.id).get(),
          db.collection('applications').where('companyId', '==', this.id).get()
        ]);

        const activeJobs = jobs.docs.filter(doc => 
          doc.data().status === 'active'
        ).length;

        stats = {
          totalJobs: jobs.size,
          activeJobs,
          totalApplicants: applications.size
        };

      } else if (this.role === 'admin') {
        const [users, applications, jobs, courses] = await Promise.all([
          db.collection('users').get(),
          db.collection('applications').get(),
          db.collection('jobs').get(),
          db.collection('courses').get()
        ]);

        const pendingApprovals = users.docs.filter(doc => 
          doc.data().status === 'pending' && 
          ['institute', 'company'].includes(doc.data().role)
        ).length;

        stats = {
          totalUsers: users.size,
          pendingApprovals,
          totalApplications: applications.size,
          totalJobs: jobs.size,
          totalCourses: courses.size
        };
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      throw new Error(`Error getting user statistics: ${error.message}`);
    }
  }

  // Convert to JSON (exclude sensitive fields)
  toJSON() {
    const json = {
      id: this.id,
      uid: this.uid,
      email: this.email,
      role: this.role,
      name: this.name,
      status: this.status,
      
      // Profile Information
      phone: this.phone,
      address: this.address,
      profileImage: this.profileImage,
      
      // Role-specific fields
      institutionName: this.institutionName,
      companyName: this.companyName,
      
      // Academic Info
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      academicLevel: this.academicLevel,
      
      // Timestamps
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      approvedAt: this.approvedAt,
      
      // Preferences
      emailNotifications: this.emailNotifications,
      smsNotifications: this.smsNotifications,
      
      // System
      isEmailVerified: this.isEmailVerified
    };

    // Remove null/undefined fields
    Object.keys(json).forEach(key => {
      if (json[key] === null || json[key] === undefined || json[key] === '') {
        delete json[key];
      }
    });

    return json;
  }

  // Get public profile (for other users to view)
  toPublicJSON() {
    const publicData = {
      id: this.id,
      name: this.name,
      role: this.role,
      
      // Role-specific public info
      ...(this.role === 'institute' && { institutionName: this.institutionName }),
      ...(this.role === 'company' && { companyName: this.companyName }),
      
      profileImage: this.profileImage,
      isEmailVerified: this.isEmailVerified
    };

    return publicData;
  }
}

module.exports = User;