import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import JobCard from '../../components/student/Jobs/JobCard';
import JobFilters from '../../components/student/Jobs/JobFilters';

const JobPortal = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(false); // Set to false initially
  const [filters, setFilters] = useState({
    jobType: '',
    location: '',
    experience: '',
    search: ''
  });
  const [hasTranscript, setHasTranscript] = useState(false);

  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    // Use mock data instead of API call
    loadMockJobs();
    checkTranscriptStatus();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, filters]);

  const loadMockJobs = () => {
    setLoading(true);
    
    // Mock job data
    const mockJobs = [
      {
        id: 'job1',
        title: 'Junior Software Developer',
        companyName: 'Tech Solutions Ltd',
        location: 'Maseru',
        jobType: 'full-time',
        description: 'We are looking for a passionate Junior Software Developer to design, develop and install software solutions...',
        requirements: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        experience: '1-2 years',
        salaryRange: { min: 15000, max: 25000, currency: 'LSL' },
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
        matchScore: 85,
        isGoodMatch: true
      },
      {
        id: 'job2',
        title: 'IT Support Specialist',
        companyName: 'Business Systems Inc',
        location: 'Berea',
        jobType: 'full-time',
        description: 'Provide technical assistance to our clients and resolve their IT issues...',
        requirements: ['Technical Support', 'Troubleshooting', 'Windows OS', 'Networking'],
        experience: '0-1 years',
        salaryRange: { min: 12000, max: 18000, currency: 'LSL' },
        deadline: new Date(Date.now() + 86400000 * 14).toISOString(), // 14 days from now
        matchScore: 72,
        isGoodMatch: true
      },
      {
        id: 'job3',
        title: 'Data Analyst Intern',
        companyName: 'Analytics Pro',
        location: 'Remote',
        jobType: 'internship',
        description: 'Join our data team to analyze business data and provide insights...',
        requirements: ['Excel', 'SQL', 'Data Analysis', 'Statistics'],
        experience: '0 years',
        salaryRange: { min: 8000, max: 12000, currency: 'LSL' },
        deadline: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
        matchScore: 65,
        isGoodMatch: false
      }
    ];
    
    setTimeout(() => {
      setJobs(mockJobs);
      setLoading(false);
    }, 1000); // Simulate loading
  };

  const checkTranscriptStatus = async () => {
    // Mock transcript check
    setHasTranscript(false); // Placeholder - you can set based on user data
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (filters.jobType) {
      filtered = filtered.filter(job => job.jobType === filters.jobType);
    }

    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.experience) {
      filtered = filtered.filter(job => {
        const jobExp = parseFloat(job.experience) || 0;
        const filterExp = parseFloat(filters.experience);
        return jobExp <= filterExp;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.companyName.toLowerCase().includes(searchLower) ||
        job.requirements.some(req => req.toLowerCase().includes(searchLower))
      );
    }

    setFilteredJobs(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      jobType: '',
      location: '',
      experience: '',
      search: ''
    });
  };

  const handleJobApply = async (job) => {
    // Mock application - no API call
    showSuccess('Application Submitted', `Successfully applied for ${job.title} at ${job.companyName}! (Demo Mode)`);
    
    // Update local state to show application
    setJobs(prevJobs => 
      prevJobs.map(j => 
        j.id === job.id ? { ...j, hasApplied: true } : j
      )
    );
  };

  if (loading) {
    return (
      <div className="job-portal-container">
        <LoadingSpinner text="Loading job opportunities..." />
      </div>
    );
  }

  return (
    <div className="job-portal-container">
      {/* Header */}
      <div className="job-portal-header">
        <div className="header-content">
          <h1>Job Opportunities 💼</h1>
          <p>Discover career opportunities matching your qualifications</p>
          <div style={{ 
            background: '#e8f5e8', 
            padding: '8px 12px', 
            borderRadius: '4px', 
            marginTop: '8px',
            fontSize: '0.9rem'
          }}>
            <strong>Demo Mode:</strong> Using sample job data
          </div>
        </div>
        <div className="header-actions">
          <Link to="/student/profile" className="btn btn-outline">
            My Profile
          </Link>
        </div>
      </div>

      {/* Rest of your JobPortal JSX remains the same */}
      {/* Just update JobCard to use the mock handler */}
      <JobCard
        key={jobs.id}
        job={jobs}
        hasTranscript={hasTranscript}
        onApply={handleJobApply} // Use the mock handler
      />
    </div>
  );
};

export default JobPortal;