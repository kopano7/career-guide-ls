import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { studentAPI } from '../../services/api/student';
import { publicAPI } from '../../services/api/public';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import CourseCard from '../../components/student/Courses/CourseCard';
import CourseFilters from '../../components/student/Courses/CourseFilters';

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [filters, setFilters] = useState({
    institution: '',
    faculty: '',
    search: '',
    duration: '',
    qualification: 'all'
  });
  const [institutions, setInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [userApplications, setUserApplications] = useState([]);

  const { user } = useAuth();
  const { showError, showSuccess, showInfo } = useNotification();

  useEffect(() => {
    fetchCourses();
    fetchInstitutions();
    fetchStudentProfile();
    fetchUserApplications();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, filters, profile, userApplications]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('Fetching courses from API...');
      const response = await publicAPI.getCourses();
      console.log('Courses API Response:', response);
      
      if (response.success) {
        const coursesData = response.data?.courses || [];
        console.log('Extracted courses:', coursesData.length);
        
        // Enhance courses with additional data
        const enhancedCourses = coursesData.map(course => ({
          ...course,
          // Ensure all required fields are present
          name: course.name || 'Unnamed Course',
          description: course.description || 'No description available',
          faculty: course.faculty || 'General Studies',
          duration: course.duration || 'Not specified',
          institutionName: course.institutionName || course.instituteName || 'Unknown Institution',
          minimumGrades: course.minimumGrades || course.requirements?.minimumGrades || {},
          seats: course.seats || 0,
          availableSeats: course.availableSeats || course.seats || 0,
          applicationCount: course.applicationCount || 0
        }));
        
        setCourses(enhancedCourses);
        
        // Extract unique faculties
        const uniqueFaculties = [...new Set(enhancedCourses.map(course => course.faculty).filter(Boolean))];
        console.log('Unique faculties:', uniqueFaculties);
        setFaculties(uniqueFaculties);
      } else {
        throw new Error(response.message || 'Failed to fetch courses');
      }
    } catch (error) {
      console.error('Courses error:', error);
      showError('Loading Error', 'Failed to load courses. Please try again.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      console.log('Fetching institutions from API...');
      const response = await publicAPI.getInstitutions();
      console.log('Institutions API Response:', response);
      
      if (response.success) {
        const institutionsData = response.data?.institutions || [];
        console.log('Extracted institutions:', institutionsData.length);
        setInstitutions(institutionsData);
      } else {
        throw new Error(response.message || 'Failed to fetch institutions');
      }
    } catch (error) {
      console.error('Institutions error:', error);
      showError('Loading Error', 'Failed to load institutions.');
      setInstitutions([]);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      setProfileLoading(true);
      console.log('Fetching student profile from API...');
      const response = await studentAPI.getProfile();
      console.log('Profile API Response:', response);
      
      if (response.success) {
        const profileData = response.data?.profile || {};
        console.log('Student profile loaded:', {
          hasGrades: !!profileData.grades,
          subjectsCount: profileData.subjects?.length || 0,
          hasTranscript: !!profileData.transcript,
          transcriptVerified: profileData.transcript?.verified || false,
          gpa: profileData.gpa
        });
        setProfile(profileData);
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Profile error:', error);
      showError('Profile Error', 'Failed to load your profile data.');
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    try {
      console.log('Fetching user applications...');
      const response = await studentAPI.getApplications();
      
      if (response.success) {
        const applications = response.data?.applications || [];
        console.log('User applications loaded:', applications.length);
        setUserApplications(applications);
      }
    } catch (error) {
      console.error('Applications fetch error:', error);
      setUserApplications([]);
    }
  };

  // Check if student has already applied to this course
  const hasAppliedToCourse = (courseId) => {
    return userApplications.some(app => app.courseId === courseId);
  };

  // Check application count for a specific institution
  const getApplicationCountForInstitution = (instituteId) => {
    return userApplications.filter(app => app.instituteId === instituteId).length;
  };

  // Check if student meets course requirements using profile grades
  const checkCourseQualification = (course) => {
    if (!profile || !profile.grades || Object.keys(profile.grades).length === 0) {
      return {
        qualified: false,
        reason: 'No grades found in profile',
        missingSubjects: [],
        insufficientGrades: []
      };
    }

    if (!course.minimumGrades || Object.keys(course.minimumGrades).length === 0) {
      return {
        qualified: true,
        reason: 'No specific requirements',
        missingSubjects: [],
        insufficientGrades: []
      };
    }

    const missingSubjects = [];
    const insufficientGrades = [];

    // Check each required subject and grade
    for (const [requiredSubject, requiredGrade] of Object.entries(course.minimumGrades)) {
      const studentGrade = profile.grades[requiredSubject];
      
      if (!studentGrade) {
        missingSubjects.push(requiredSubject);
        continue;
      }

      // Compare grades (A+ is highest, F is lowest)
      const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'A+'];
      const studentIndex = gradeOrder.indexOf(studentGrade.toUpperCase());
      const requiredIndex = gradeOrder.indexOf(requiredGrade.toUpperCase());
      
      if (studentIndex < requiredIndex) {
        insufficientGrades.push({
          subject: requiredSubject,
          studentGrade: studentGrade,
          requiredGrade: requiredGrade
        });
      }
    }

    const qualified = missingSubjects.length === 0 && insufficientGrades.length === 0;
    
    return {
      qualified,
      reason: qualified ? 'Meets all requirements' : 'Does not meet requirements',
      missingSubjects,
      insufficientGrades,
      hasProfileGrades: true
    };
  };

  // Check if student can apply (has transcript, meets requirements, and within limits)
  const canApplyToCourse = (course) => {
    // Check if transcript is uploaded and verified
    const hasValidTranscript = profile?.transcript && profile.transcript.verified;
    
    // Check course qualification
    const qualification = checkCourseQualification(course);
    
    // Check if already applied
    const alreadyApplied = hasAppliedToCourse(course.id);
    
    // Check application limit for this institution
    const institutionApplicationCount = getApplicationCountForInstitution(course.instituteId);
    const atApplicationLimit = institutionApplicationCount >= 2;
    
    return {
      canApply: hasValidTranscript && qualification.qualified && !alreadyApplied && !atApplicationLimit,
      missingTranscript: !hasValidTranscript,
      notQualified: !qualification.qualified,
      alreadyApplied,
      atApplicationLimit,
      qualificationInfo: qualification,
      institutionApplicationCount
    };
  };

  const filterCourses = () => {
    let filtered = courses;

    if (filters.institution) {
      filtered = filtered.filter(course => 
        course.instituteId === filters.institution
      );
    }

    if (filters.faculty) {
      filtered = filtered.filter(course => 
        course.faculty === filters.faculty
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchLower) ||
        course.description.toLowerCase().includes(searchLower) ||
        course.institutionName.toLowerCase().includes(searchLower)
      );
    }

    if (filters.duration) {
      filtered = filtered.filter(course =>
        course.duration <= parseInt(filters.duration)
      );
    }

    // Apply qualification filter
    if (filters.qualification !== 'all' && profile) {
      filtered = filtered.filter(course => {
        const qualification = checkCourseQualification(course);
        return filters.qualification === 'qualified' 
          ? qualification.qualified 
          : !qualification.qualified;
      });
    }

    console.log('Filtered courses:', filtered.length);
    setFilteredCourses(filtered);
  };

  const handleFilterChange = (newFilters) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
  };

  const clearFilters = () => {
    console.log('Clearing filters');
    setFilters({
      institution: '',
      faculty: '',
      search: '',
      duration: '',
      qualification: 'all'
    });
  };

  // Enhanced CourseCard with real application checks
  const EnhancedCourseCard = ({ course, onApplySuccess }) => {
    const [applying, setApplying] = useState(false);
    const applicationStatus = canApplyToCourse(course);
    const qualification = checkCourseQualification(course);

    const handleApply = async () => {
      // Check transcript requirement
      if (!profile?.transcript) {
        showInfo(
          'Transcript Required',
          'You need to upload and verify your academic transcript before applying to courses.'
        );
        return;
      }

      if (!profile.transcript.verified) {
        showInfo(
          'Transcript Pending Verification',
          'Your transcript is still being verified. Please wait for verification to complete before applying.'
        );
        return;
      }

      // Check qualification
      if (!qualification.qualified) {
        showInfo(
          'Requirements Not Met', 
          `You don't meet the course requirements. Check the requirements below.`
        );
        return;
      }

      // Check if already applied
      if (applicationStatus.alreadyApplied) {
        showInfo(
          'Already Applied',
          'You have already applied to this course. Check your applications for status updates.'
        );
        return;
      }

      // Check application limit
      if (applicationStatus.atApplicationLimit) {
        showInfo(
          'Application Limit Reached',
          `You have already applied to 2 courses at ${course.institutionName}. You cannot apply to more courses at this institution.`
        );
        return;
      }

      try {
        setApplying(true);
        console.log('Applying to course:', course.id);
        
        const response = await studentAPI.applyForCourse({ courseId: course.id });
        console.log('Application response:', response);
        
        if (response.success) {
          showSuccess('Application Submitted!', 'Your application has been submitted successfully.');
          
          // Refresh data
          await Promise.all([
            onApplySuccess?.(),
            fetchUserApplications()
          ]);
        } else {
          throw new Error(response.message || 'Failed to submit application');
        }
      } catch (error) {
        console.error('Application error:', error);
        showError('Application Failed', error.message || 'Failed to submit application. Please try again.');
      } finally {
        setApplying(false);
      }
    };

    const getApplicationBadge = () => {
      if (applicationStatus.alreadyApplied) {
        return {
          type: 'info',
          text: 'Already Applied',
          
        };
      }

      if (applicationStatus.atApplicationLimit) {
        return {
          type: 'warning',
          text: 'Institution limit reached',
          
        };
      }

      if (!profile?.transcript) {
        return {
          type: 'error',
          text: 'Upload transcript to apply',
         
        };
      }

      if (!profile.transcript.verified) {
        return {
          type: 'warning',
          text: 'Transcript verification pending',
          
        };
      }

      if (!qualification.qualified) {
        return {
          type: 'error',
          text: 'Requirements not met',
          
        };
      }

      return {
        type: 'success',
        text: 'Eligible to apply',
        
      };
    };

    const applicationBadge = getApplicationBadge();

    return (
      <CourseCard
        key={course.id}
        course={course}
        onApply={handleApply}
        applying={applying}
        applicationStatus={applicationStatus}
        qualificationInfo={qualification}
        profile={profile}
        applicationBadge={applicationBadge}
        userApplications={userApplications}
      />
    );
  };

  if (loading || profileLoading) {
    return (
      <div className="catalog-container">
        <LoadingSpinner text="Loading courses and your profile..." />
      </div>
    );
  }

  const hasGrades = profile?.grades && Object.keys(profile.grades).length > 0;
  const hasTranscript = profile?.transcript;
  const isTranscriptVerified = profile?.transcript?.verified;
  const totalApplications = userApplications.length;

  return (
    <div className="catalog-container">
      {/* Header */}
      <div className="catalog-header">
        <div className="header-content">
          <h1>Course Catalog </h1>
          <p>Discover courses from approved institutions in Lesotho</p>
          <div style={{ 
          }}>
            <strong>Live Data:</strong> Connected to real courses and your profile
          </div>
        </div>
        <div className="header-actions">
          <Link to="/student/applications" className="btn btn-outline">
            My Applications ({totalApplications})
          </Link>
          <Link to="/student/profile" className="btn btn-primary">
            Manage Profile & Transcript
          </Link>
        </div>
      </div>

      {/* Application Requirements Status */}
      <div className="requirements-status-banner">
        <div className="banner-content">
          <div className="banner-icon"></div>
          <div className="banner-text">
            <h4>Application Requirements Status</h4>
            <div className="requirements-list">
              <div className={`requirement-item ${hasGrades ? 'met' : 'pending'}`}>
                <span className="requirement-icon">
                  {hasGrades ? 'Yes' : 'No'}
                </span>
                <span className="requirement-text">
                  <strong>Academic Grades:</strong> 
                  {hasGrades ? ` ${Object.keys(profile.grades).length} subjects loaded` : ' Not added'}
                </span>
              </div>
              
              <div className={`requirement-item ${hasTranscript ? 'met' : 'pending'}`}>
                <span className="requirement-icon">
                  {hasTranscript ? (isTranscriptVerified ? 'Yes' : 'Pending') : 'No'}
                </span>
                <span className="requirement-text">
                  <strong>Academic Transcript:</strong> 
                  {hasTranscript 
                    ? (isTranscriptVerified ? ' Verified and ready' : ' Uploaded, pending verification')
                    : ' Not uploaded'
                  }
                </span>
              </div>

              <div className="requirement-item info">
                <span className="requirement-icon"></span>
                <span className="requirement-text">
                  <strong>Current Applications:</strong> {totalApplications} submitted
                </span>
              </div>
            </div>
          </div>
          {(!hasGrades || !hasTranscript || !isTranscriptVerified) && (
            <Link to="/student/profile" className="btn btn-primary btn-sm">
              Complete Requirements
            </Link>
          )}
        </div>
      </div>

      {/* Transcript Requirement Notice */}
      {(!hasTranscript || !isTranscriptVerified) && (
        <div className="transcript-requirement-banner">
          <div className="banner-content">
            <div className="banner-icon"></div>
            <div>
              <h4>Transcript Required for Applications</h4>
              <p>
                You must upload and verify your academic transcript before you can apply to any courses. 
                This ensures institutions can properly evaluate your academic background.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters with Qualification Filter */}
      <CourseFilters
        filters={filters}
        institutions={institutions}
        faculties={faculties}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        hasProfileGrades={hasGrades}
      />

      {/* Results Summary */}
      <div className="results-summary">
        <div className="summary-content">
          <h3>
            {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
            {filters.search && ` for "${filters.search}"`}
            {filters.qualification !== 'all' && (
              filters.qualification === 'qualified' 
                ? ' (You qualify)' 
                : ' (Need improvement)'
            )}
          </h3>
          <div className="summary-actions">
            <button 
              onClick={clearFilters}
              className="btn btn-outline btn-sm"
              disabled={!filters.institution && !filters.faculty && !filters.search && !filters.duration && filters.qualification === 'all'}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="courses-grid">
          {filteredCourses.map(course => (
            <EnhancedCourseCard
              key={course.id}
              course={course}
              onApplySuccess={fetchCourses}
            />
          ))}
        </div>
      ) : (
        <div className="empty-catalog">
          <div className="empty-icon">🔍</div>
          <h3>No courses found</h3>
          <p>
            {courses.length === 0 
              ? 'No courses are currently available. Please check back later.'
              : 'Try adjusting your filters or search terms to see more results.'
            }
          </p>
          {courses.length > 0 && (
            <button onClick={clearFilters} className="btn btn-primary">
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Application Requirements Info */}
      <div className="info-banner">
        <div className="banner-content">
          <div className="banner-icon">ℹ</div>
          <div>
            <h4>Application Requirements</h4>
            <p>
              • <strong>Academic Transcript:</strong> Must be uploaded and verified<br/>
              • <strong>Profile Grades:</strong> Used for automatic qualification checking<br/>
              • <strong>Course Requirements:</strong> Must meet minimum grade requirements<br/>
              • <strong>Institution Limit:</strong> Maximum 2 applications per institution<br/>
              • <strong>Real-time Validation:</strong> System checks your eligibility before applying
            </p>
          </div>
        </div>
      </div>

      {/* How to Apply Guide */}
      {(!hasTranscript || !hasGrades) && (
        <div className="help-banner">
          <div className="banner-content">
            <div className="banner-icon"></div>
            <div>
              <h4>Ready to Apply? Complete These Steps:</h4>
              <p>
                1. Go to your Profile → Academic Details → Add your subjects and grades<br/>
                2. Go to Documents → Upload your academic transcript<br/>
                3. Wait for transcript verification<br/>
                4. Return here to apply to courses you qualify for
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;