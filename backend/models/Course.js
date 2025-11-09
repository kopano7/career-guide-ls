const { db } = require('../config/firebase');

class Course {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.duration = data.duration; // in months
    this.requirements = data.requirements || {};
    this.faculty = data.faculty;
    this.seats = data.seats;
    this.availableSeats = data.availableSeats || data.seats;
    this.instituteId = data.instituteId;
    this.status = data.status || 'active'; // 'active', 'inactive', 'full'
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Static method to create a new course
  static async create(courseData) {
    try {
      const courseRef = await db.collection('courses').add(courseData);
      return new Course({ id: courseRef.id, ...courseData });
    } catch (error) {
      throw new Error(`Error creating course: ${error.message}`);
    }
  }

  // Static method to find course by ID
  static async findById(id) {
    try {
      const courseDoc = await db.collection('courses').doc(id).get();
      if (!courseDoc.exists) return null;
      return new Course({ id, ...courseDoc.data() });
    } catch (error) {
      throw new Error(`Error finding course: ${error.message}`);
    }
  }

  // Static method to find courses by institute
  static async findByInstitute(instituteId, status = 'active') {
    try {
      let query = db.collection('courses').where('instituteId', '==', instituteId);
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Course({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding courses by institute: ${error.message}`);
    }
  }

  // Static method to find all active courses
  static async findActive() {
    try {
      const snapshot = await db.collection('courses')
        .where('status', '==', 'active')
        .get();
      
      return snapshot.docs.map(doc => new Course({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding active courses: ${error.message}`);
    }
  }

  // Static method to search courses
  static async search(queryParams) {
    try {
      let query = db.collection('courses').where('status', '==', 'active');
      
      if (queryParams.faculty) {
        query = query.where('faculty', '==', queryParams.faculty);
      }
      
      if (queryParams.instituteId) {
        query = query.where('instituteId', '==', queryParams.instituteId);
      }
      
      // Note: Firestore doesn't support OR queries or full-text search natively
      // For name search, you'd need to use a separate search service
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Course({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error searching courses: ${error.message}`);
    }
  }

  // Update course
  async update(updateData) {
    try {
      updateData.updatedAt = new Date();
      await db.collection('courses').doc(this.id).update(updateData);
      
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      throw new Error(`Error updating course: ${error.message}`);
    }
  }

  // Delete course
  async delete() {
    try {
      // Check if there are applications for this course
      const applications = await db.collection('applications')
        .where('courseId', '==', this.id)
        .get();
      
      if (!applications.empty) {
        throw new Error('Cannot delete course with existing applications');
      }
      
      await db.collection('courses').doc(this.id).delete();
    } catch (error) {
      throw new Error(`Error deleting course: ${error.message}`);
    }
  }

  // Check if course has available seats
  hasAvailableSeats() {
    return this.availableSeats > 0;
  }

  // Reserve a seat (when application is submitted)
  async reserveSeat() {
    if (!this.hasAvailableSeats()) {
      throw new Error('No available seats');
    }
    
    this.availableSeats -= 1;
    
    // Update status if full
    if (this.availableSeats === 0) {
      this.status = 'full';
    }
    
    await this.update({
      availableSeats: this.availableSeats,
      status: this.status
    });
    
    return this;
  }

  // Release a seat (when application is rejected/withdrawn)
  async releaseSeat() {
    this.availableSeats += 1;
    
    // Update status if seats become available
    if (this.status === 'full' && this.availableSeats > 0) {
      this.status = 'active';
    }
    
    await this.update({
      availableSeats: this.availableSeats,
      status: this.status
    });
    
    return this;
  }

  // Get course applications
  async getApplications(status = null) {
    try {
      let query = db.collection('applications').where('courseId', '==', this.id);
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting course applications: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      duration: this.duration,
      requirements: this.requirements,
      faculty: this.faculty,
      seats: this.seats,
      availableSeats: this.availableSeats,
      instituteId: this.instituteId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Course;