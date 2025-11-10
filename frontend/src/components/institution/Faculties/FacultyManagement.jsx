// frontend/src/components/institute/Faculties/FacultyManagement.jsx
import React, { useState, useEffect } from 'react';
import FacultyForm from './FacultyForm';
import FacultyList from './FacultyList';

const FacultyManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="faculty-management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Faculty Management</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Faculty
        </button>
      </div>
      
      {showForm && (
        <FacultyForm 
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            // Reload faculties
          }}
        />
      )}
      
      <FacultyList faculties={faculties} />
    </div>
  );
};

export default FacultyManagement;