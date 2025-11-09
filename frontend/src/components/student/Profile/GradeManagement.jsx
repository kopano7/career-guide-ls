// GradesManagement.jsx
import React, { useState } from 'react';

const GradesManagement = ({ profile, onProfileUpdate }) => {
  const [subjects, setSubjects] = useState(profile.subjects || []);
  const [grades, setGrades] = useState(profile.grades || {});
  const [newSubject, setNewSubject] = useState('');
  const [newGrade, setNewGrade] = useState('');

  const addSubjectGrade = () => {
    if (newSubject && newGrade) {
      const updatedSubjects = [...subjects, newSubject];
      const updatedGrades = { ...grades, [newSubject]: newGrade };
      
      setSubjects(updatedSubjects);
      setGrades(updatedGrades);
      setNewSubject('');
      setNewGrade('');
      
      // Update profile
      onProfileUpdate({
        subjects: updatedSubjects,
        grades: updatedGrades
      });
    }
  };

  const removeSubject = (subject) => {
    const updatedSubjects = subjects.filter(s => s !== subject);
    const updatedGrades = { ...grades };
    delete updatedGrades[subject];
    
    setSubjects(updatedSubjects);
    setGrades(updatedGrades);
    
    onProfileUpdate({
      subjects: updatedSubjects,
      grades: updatedGrades
    });
  };

  return (
    <div className="grades-management">
      <h4>Academic Grades</h4>
      <p>Enter your subjects and grades once, use them for all applications</p>
      
      <div className="add-subject-form">
        <input
          type="text"
          placeholder="Subject (e.g., Mathematics)"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
        />
        <select 
          value={newGrade} 
          onChange={(e) => setNewGrade(e.target.value)}
        >
          <option value="">Select Grade</option>
          <option value="A+">A+</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="E">E</option>
          <option value="F">F</option>
        </select>
        <button onClick={addSubjectGrade}>Add Subject</button>
      </div>

      <div className="subjects-list">
        {subjects.map(subject => (
          <div key={subject} className="subject-grade-item">
            <span className="subject">{subject}</span>
            <span className="grade">{grades[subject]}</span>
            <button onClick={() => removeSubject(subject)}>Remove</button>
          </div>
        ))}
      </div>

      {profile.gpa && (
        <div className="gpa-display">
          <strong>Calculated GPA: {profile.gpa}</strong>
        </div>
      )}
    </div>
  );
};

export default GradesManagement;