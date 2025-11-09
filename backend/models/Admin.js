const { db } = require('../config/firebase');

class Admin {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.role = 'admin'; // Always admin
    this.status = data.status || 'approved';
    this.passwordHash = data.passwordHash;
    this.isEmailVerified = data.isEmailVerified || true;
    this.permissions = data.permissions || ['all']; // Admin-specific permissions
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Static method to create admin in admins collection
  static async create(adminData) {
    try {
      const adminRef = await db.collection('admins').add(adminData);
      return new Admin({ id: adminRef.id, ...adminData });
    } catch (error) {
      throw new Error(`Error creating admin: ${error.message}`);
    }
  }

  // Static method to find admin by email
  static async findByEmail(email) {
    try {
      const snapshot = await db.collection('admins')
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new Admin({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Error finding admin: ${error.message}`);
    }
  }

  // Static method to get all admins
  static async findAll() {
    try {
      const snapshot = await db.collection('admins').get();
      return snapshot.docs.map(doc => new Admin({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding admins: ${error.message}`);
    }
  }

  // Update admin
  async update(updateData) {
    try {
      updateData.updatedAt = new Date();
      await db.collection('admins').doc(this.id).update(updateData);
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      throw new Error(`Error updating admin: ${error.message}`);
    }
  }

  // Admin-specific methods
  async getSystemStats() {
    try {
      const [users, courses, applications, jobs] = await Promise.all([
        db.collection('users').get(),
        db.collection('courses').get(),
        db.collection('applications').get(),
        db.collection('jobs').get()
      ]);

      return {
        totalUsers: users.size,
        totalCourses: courses.size,
        totalApplications: applications.size,
        totalJobs: jobs.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error getting system stats: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      status: this.status,
      isEmailVerified: this.isEmailVerified,
      permissions: this.permissions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Admin;