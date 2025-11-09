const { db } = require('../config/firebase');

class Institution {
  constructor(data) {
    this.uid = data.uid; // Reference to users collection
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.address = data.address;
    this.website = data.website;
    this.description = data.description;
    this.logo = data.logo;
    this.faculties = data.faculties || [];
    this.status = data.status || 'pending'; // 'pending', 'approved', 'suspended'
    this.approvedAt = data.approvedAt;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Static method to create institution (linked to user)
  static async create(institutionData) {
    try {
      const institution = new Institution(institutionData);
      await db.collection('institutions').doc(institution.uid).set(institution);
      return institution;
    } catch (error) {
      throw new Error(`Error creating institution: ${error.message}`);
    }
  }

  // Static method to find institution by ID
  static async findById(uid) {
    try {
      const institutionDoc = await db.collection('institutions').doc(uid).get();
      if (!institutionDoc.exists) return null;
      return new Institution({ uid, ...institutionDoc.data() });
    } catch (error) {
      throw new Error(`Error finding institution: ${error.message}`);
    }
  }

  // Static method to get all approved institutions
  static async findApproved() {
    try {
      const snapshot = await db.collection('institutions')
        .where('status', '==', 'approved')
        .get();
      
      return snapshot.docs.map(doc => new Institution({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding approved institutions: ${error.message}`);
    }
  }

  // Static method to get institutions by status
  static async findByStatus(status) {
    try {
      const snapshot = await db.collection('institutions')
        .where('status', '==', status)
        .get();
      
      return snapshot.docs.map(doc => new Institution({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding institutions by status: ${error.message}`);
    }
  }

  // Update institution
  async update(updateData) {
    try {
      updateData.updatedAt = new Date();
      await db.collection('institutions').doc(this.uid).update(updateData);
      
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      throw new Error(`Error updating institution: ${error.message}`);
    }
  }

  // Approve institution
  async approve() {
    try {
      await this.update({
        status: 'approved',
        approvedAt: new Date()
      });
      return this;
    } catch (error) {
      throw new Error(`Error approving institution: ${error.message}`);
    }
  }

  // Add faculty
  async addFaculty(facultyName) {
    try {
      if (!this.faculties.includes(facultyName)) {
        this.faculties.push(facultyName);
        await this.update({ faculties: this.faculties });
      }
      return this;
    } catch (error) {
      throw new Error(`Error adding faculty: ${error.message}`);
    }
  }

  // Get institution statistics
  async getStats() {
    try {
      const [coursesCount, applicationsCount] = await Promise.all([
        db.collection('courses').where('instituteId', '==', this.uid).get(),
        db.collection('applications').where('instituteId', '==', this.uid).get()
      ]);

      return {
        courses: coursesCount.size,
        applications: applicationsCount.size,
        faculties: this.faculties.length
      };
    } catch (error) {
      throw new Error(`Error getting institution stats: ${error.message}`);
    }
  }

  toJSON() {
    return {
      uid: this.uid,
      name: this.name,
      email: this.email,
      phone: this.phone,
      address: this.address,
      website: this.website,
      description: this.description,
      logo: this.logo,
      faculties: this.faculties,
      status: this.status,
      approvedAt: this.approvedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Institution;