// frontend/src/components/institute/Admissions/AdmissionPublisher.jsx
import React, { useState, useEffect } from 'react';

const AdmissionPublisher = ({ courseId }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApps, setSelectedApps] = useState(new Set());

  const loadQualifiedApplications = async () => {
    // instituteAPI.getApplications(courseId, 'pending')
    // Filter by isQualified: true
  };

  const publishAdmissions = async () => {
    const admissionList = Array.from(selectedApps).map(appId => ({
      applicationId: appId,
      studentId: applications.find(app => app.id === appId).studentId
    }));
    
    // instituteAPI.publishAdmissions({ courseId, admissionList })
  };

  return (
    <div className="admission-publisher">
      <h3 className="text-xl font-bold mb-4">Publish Admissions</h3>
      
      <div className="applications-list">
        {applications.map(app => (
          <div key={app.id} className="application-item flex items-center gap-3 p-3 border">
            <input
              type="checkbox"
              checked={selectedApps.has(app.id)}
              onChange={(e) => {
                const newSelected = new Set(selectedApps);
                e.target.checked ? newSelected.add(app.id) : newSelected.delete(app.id);
                setSelectedApps(newSelected);
              }}
            />
            <div>
              <h4 className="font-semibold">{app.studentName}</h4>
              <p className="text-sm">GPA: {app.calculatedGPA} | Qualified: {app.isQualified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={publishAdmissions}
        disabled={selectedApps.size === 0}
        className="btn-primary mt-4"
      >
        Publish Admissions ({selectedApps.size} selected)
      </button>
    </div>
  );
};