const { db } = require('../config/firebase');

class Transcript {
  constructor(data) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.fileUrl = data.fileUrl;
    this.fileName = data.fileName;
    this.fileSize = data.fileSize;
    this.uploadedAt = data.uploadedAt || new Date();
    this.verified = data.verified || false;
    this.verifiedAt = data.verifiedAt;
    this.verifiedBy = data.verifiedBy; // admin ID who verified
    this.grades = data.grades || {}; // { subject: grade, ... }
    this.gpa = data.gpa;
    this.institution = data.institution;
    this.graduationYear = data.graduationYear;
  }

  // Static method to create/update transcript
  static async create(transcriptData) {
    try {
      // Use studentId as document ID to ensure one transcript per student
      await db.collection('transcripts').doc(transcriptData.studentId).set(transcriptData);
      return new Transcript({ id: transcriptData.studentId, ...transcriptData });
    } catch (error) {
      throw new Error(`Error creating transcript: ${error.message}`);
    }
  }

  // Static method to find transcript by student ID
  static async findByStudentId(studentId) {
    try {
      const transcriptDoc = await db.collection('transcripts').doc(studentId).get();
      if (!transcriptDoc.exists) return null;
      return new Transcript({ id: studentId, ...transcriptDoc.data() });
    } catch (error) {
      throw new Error(`Error finding transcript: ${error.message}`);
    }
  }

  // Static method to find verified transcripts
  static async findVerified() {
    try {
      const snapshot = await db.collection('transcripts')
        .where('verified', '==', true)
        .get();
      
      return snapshot.docs.map(doc => new Transcript({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error finding verified transcripts: ${error.message}`);
    }
  }

  // Update transcript
  async update(updateData) {
    try {
      await db.collection('transcripts').doc(this.id).update(updateData);
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      throw new Error(`Error updating transcript: ${error.message}`);
    }
  }

  // Verify transcript
  async verify(adminId) {
    return await this.update({
      verified: true,
      verifiedAt: new Date(),
      verifiedBy: adminId
    });
  }

  // Calculate GPA from grades (simplified)
  calculateGPA() {
    if (!this.grades || Object.keys(this.grades).length === 0) {
      return null;
    }

    // Simple GPA calculation - adjust based on your grading system
    const gradePoints = {
      'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
    };

    let totalPoints = 0;
    let totalSubjects = 0;

    for (const [subject, grade] of Object.entries(this.grades)) {
      const points = gradePoints[grade.toUpperCase()];
      if (points !== undefined) {
        totalPoints += points;
        totalSubjects++;
      }
    }

    this.gpa = totalSubjects > 0 ? totalPoints / totalSubjects : null;
    return this.gpa;
  }

  // Get transcript with student details
  async getDetails() {
    try {
      const studentDoc = await db.collection('users').doc(this.studentId).get();
      
      return {
        transcript: this.toJSON(),
        student: studentDoc.exists ? studentDoc.data() : null
      };
    } catch (error) {
      throw new Error(`Error getting transcript details: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      studentId: this.studentId,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      fileSize: this.fileSize,
      uploadedAt: this.uploadedAt,
      verified: this.verified,
      verifiedAt: this.verifiedAt,
      verifiedBy: this.verifiedBy,
      grades: this.grades,
      gpa: this.gpa,
      institution: this.institution,
      graduationYear: this.graduationYear
    };
  }
}

module.exports = Transcript;