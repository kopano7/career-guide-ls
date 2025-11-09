const { db } = require('../config/firebase');

class Job {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.requirements = data.requirements || [];
    this.qualifications = data.qualifications || [];
    this.salaryRange = data.salaryRange; // { min: number, max: number, currency: string }
    this.location = data.location;
    this.jobType = data.jobType; // 'full-time', 'part-time', 'contract', 'internship'
    this.deadline = data.deadline;
    this.companyId = data.companyId;
    this.status = data.status || 'active'; // 'active', 'closed', 'draft'
    this.postedAt = data.postedAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Static method to create a new job
  static async create(jobData) {
    try {
      const jobRef = await db.collection('jobs').add(jobData);
      return new Job({ id: jobRef.id, ...jobData });
    } catch (error) {
      throw new Error(`Error creating job: ${error.message}`);
    }
  }

  // Static method to find job by ID
  static async findById(id) {
    try {
      const jobDoc = await db.collection('jobs').doc(id).get();
      if (!jobDoc.exists) return null;
      return new Job({ id, ...jobDoc.data() });
    } catch (error) {
      throw new Error(`Error finding job: ${error.message}`);
    }
  }

  // Static method to find jobs by company
  static async findByCompany(companyId, status = 'active') {
    try {
      let query = db.collection('jobs').where('companyId', '==', companyId);
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Job({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding jobs by company: ${error.message}`);
    }
  }

  // Static method to find active jobs
  static async findActive() {
    try {
      const snapshot = await db.collection('jobs')
        .where('status', '==', 'active')
        .where('deadline', '>', new Date())
        .get();
      
      return snapshot.docs.map(doc => new Job({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding active jobs: ${error.message}`);
    }
  }

  // Static method to search jobs
  static async search(queryParams) {
    try {
      let query = db.collection('jobs')
        .where('status', '==', 'active')
        .where('deadline', '>', new Date());
      
      if (queryParams.jobType) {
        query = query.where('jobType', '==', queryParams.jobType);
      }
      
      if (queryParams.location) {
        query = query.where('location', '==', queryParams.location);
      }
      
      // Note: More complex search would require a search service
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Job({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error searching jobs: ${error.message}`);
    }
  }

  // Update job
  async update(updateData) {
    try {
      updateData.updatedAt = new Date();
      await db.collection('jobs').doc(this.id).update(updateData);
      
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      throw new Error(`Error updating job: ${error.message}`);
    }
  }

  // Close job
  async close() {
    return await this.update({ status: 'closed' });
  }

  // Check if job is expired
  isExpired() {
    return new Date() > new Date(this.deadline);
  }

  // Get qualified applicants (simplified version)
  async getQualifiedApplicants() {
    try {
      // This is a simplified version - in a real app, you'd have more complex matching logic
      const students = await db.collection('users')
        .where('role', '==', 'student')
        .get();
      
      // Filter students based on basic criteria
      const qualified = students.docs.filter(doc => {
        const student = doc.data();
        // Add your qualification logic here based on:
        // - Academic performance
        // - Certificates
        // - Work experience
        // - Skills matching job requirements
        return true; // Placeholder
      });
      
      return qualified.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting qualified applicants: ${error.message}`);
    }
  }

  // Get job with company details
  async getDetails() {
    try {
      const companyDoc = await db.collection('users').doc(this.companyId).get();
      
      return {
        job: this.toJSON(),
        company: companyDoc.exists ? companyDoc.data() : null
      };
    } catch (error) {
      throw new Error(`Error getting job details: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      requirements: this.requirements,
      qualifications: this.qualifications,
      salaryRange: this.salaryRange,
      location: this.location,
      jobType: this.jobType,
      deadline: this.deadline,
      companyId: this.companyId,
      status: this.status,
      postedAt: this.postedAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Job;