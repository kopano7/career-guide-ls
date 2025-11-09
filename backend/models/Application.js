const { db } = require('../config/firebase');

class Application {
  constructor(data) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.courseId = data.courseId;
    this.instituteId = data.instituteId;
    this.status = data.status || 'pending'; // 'pending', 'admitted', 'rejected', 'waiting_list'
    this.appliedAt = data.appliedAt || new Date();
    this.processedAt = data.processedAt;
    this.notes = data.notes;
    this.documents = data.documents || [];
  }

  // Static method to create a new application
  static async create(applicationData) {
    try {
      const applicationRef = await db.collection('applications').add(applicationData);
      return new Application({ id: applicationRef.id, ...applicationData });
    } catch (error) {
      throw new Error(`Error creating application: ${error.message}`);
    }
  }

  // Static method to find application by ID
  static async findById(id) {
    try {
      const applicationDoc = await db.collection('applications').doc(id).get();
      if (!applicationDoc.exists) return null;
      return new Application({ id, ...applicationDoc.data() });
    } catch (error) {
      throw new Error(`Error finding application: ${error.message}`);
    }
  }

  // Static method to find applications by student
  static async findByStudent(studentId, status = null) {
    try {
      let query = db.collection('applications').where('studentId', '==', studentId);
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Application({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding applications by student: ${error.message}`);
    }
  }

  // Static method to find applications by institute
  static async findByInstitute(instituteId, status = null) {
    try {
      let query = db.collection('applications').where('instituteId', '==', instituteId);
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Application({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding applications by institute: ${error.message}`);
    }
  }

  // Static method to find applications by course
  static async findByCourse(courseId, status = null) {
    try {
      let query = db.collection('applications').where('courseId', '==', courseId);
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Application({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding applications by course: ${error.message}`);
    }
  }

  // Update application status
  async updateStatus(status, notes = null) {
    try {
      const updateData = {
        status,
        processedAt: new Date()
      };
      
      if (notes) {
        updateData.notes = notes;
      }
      
      await db.collection('applications').doc(this.id).update(updateData);
      
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      throw new Error(`Error updating application status: ${error.message}`);
    }
  }

  // Admit student
  async admit(notes = null) {
    return await this.updateStatus('admitted', notes);
  }

  // Reject application
  async reject(notes = null) {
    return await this.updateStatus('rejected', notes);
  }

  // Put on waiting list
  async waitlist(notes = null) {
    return await this.updateStatus('waiting_list', notes);
  }

  // Check if student can apply to more courses in this institute
  static async canStudentApplyToInstitute(studentId, instituteId) {
    try {
      const existingApplications = await db.collection('applications')
        .where('studentId', '==', studentId)
        .where('instituteId', '==', instituteId)
        .get();
      
      return existingApplications.size < 2;
    } catch (error) {
      throw new Error(`Error checking application limit: ${error.message}`);
    }
  }

  // Get application with details (student, course, institute)
  async getDetails() {
    try {
      const [studentDoc, courseDoc, instituteDoc] = await Promise.all([
        db.collection('users').doc(this.studentId).get(),
        db.collection('courses').doc(this.courseId).get(),
        db.collection('users').doc(this.instituteId).get()
      ]);
      
      return {
        application: this.toJSON(),
        student: studentDoc.exists ? studentDoc.data() : null,
        course: courseDoc.exists ? courseDoc.data() : null,
        institute: instituteDoc.exists ? instituteDoc.data() : null
      };
    } catch (error) {
      throw new Error(`Error getting application details: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      studentId: this.studentId,
      courseId: this.courseId,
      instituteId: this.instituteId,
      status: this.status,
      appliedAt: this.appliedAt,
      processedAt: this.processedAt,
      notes: this.notes,
      documents: this.documents
    };
  }
}

module.exports = Application;