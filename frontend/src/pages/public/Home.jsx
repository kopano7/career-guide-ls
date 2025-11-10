import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typewriterText, setTypewriterText] = useState('');
  const [courses, setCourses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({

  });

  const typewriterWords = [
    'Data Science courses...',
    'Higher Education...',
    'Career Opportunities...',
    'Technical Skills...',
    'Professional Development...'
  ];

  // Typewriter effect
  useEffect(() => {
    let currentWordIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    const type = () => {
      const currentWord = typewriterWords[currentWordIndex];
      
      if (isDeleting) {
        setTypewriterText(currentWord.substring(0, currentCharIndex - 1));
        currentCharIndex--;
        typeSpeed = 50;
      } else {
        setTypewriterText(currentWord.substring(0, currentCharIndex + 1));
        currentCharIndex++;
        typeSpeed = 100;
      }

      if (!isDeleting && currentCharIndex === currentWord.length) {
        typeSpeed = 1000;
        isDeleting = true;
      } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentWordIndex = (currentWordIndex + 1) % typewriterWords.length;
      }

      setTimeout(type, typeSpeed);
    };

    type();
  }, []);

  // Fetch all data from public APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [coursesRes, institutionsRes, jobsRes] = await Promise.all([
          fetch('/api/public/courses'),
          fetch('/api/public/institutions'),
          fetch('/api/public/jobs')
        ]);

        const coursesData = coursesRes.ok ? (await coursesRes.json()).data.courses : [];
        const institutionsData = institutionsRes.ok ? (await institutionsRes.json()).data.institutions : [];
        const jobsData = jobsRes.ok ? (await jobsRes.json()).data.jobs : [];

        // Extract companies from jobs and institutions
        const companyIds = [...new Set(jobsData.map(job => job.companyId))];
        
        setCourses(coursesData);
        setInstitutions(institutionsData);
        setJobs(jobsData);
        
        // Calculate stats
        setStats({
          totalCourses: coursesData.length,
          totalInstitutions: institutionsData.length,
          totalCompanies: companyIds.length,
          totalJobs: jobsData.length
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Categorize courses by field/tags
  const getCoursesByCategory = (category) => {
    return courses.filter(course => 
      course.field?.toLowerCase().includes(category.toLowerCase()) ||
      course.tags?.some(tag => tag.toLowerCase().includes(category.toLowerCase())) ||
      course.title?.toLowerCase().includes(category.toLowerCase())
    ).slice(0, 4);
  };

  // Get featured items
  const featuredCourses = courses
    .filter(course => course.status === 'active')
    .slice(0, 6);

  const featuredInstitutions = institutions
    .filter(inst => inst.status === 'approved')
    .slice(0, 4);

  const featuredJobs = jobs
    .filter(job => job.status === 'active')
    .slice(0, 4);

  // Popular categories based on actual course data
  const popularCategories = [
    { name: 'Data Science', count: getCoursesByCategory('data science').length },
    { name: 'Computer Science', count: getCoursesByCategory('computer science').length },
    { name: 'Business', count: getCoursesByCategory('business').length },
    { name: 'Engineering', count: getCoursesByCategory('engineering').length },
    { name: 'Healthcare', count: getCoursesByCategory('health').length },
    { name: 'Arts', count: getCoursesByCategory('art').length },
  ].filter(cat => cat.count > 0);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Hello, What Do You Want To <span className="highlight">Learn?</span>
          </h1>
          <p className="hero-subtitle">
            Discover courses, institutions, and career opportunities in Lesotho
          </p>
          
          {/* Search Bar with Typewriter */}
          <div className="search-container">
            <div className="search-box">
              <input
                type="text"
                placeholder={typewriterText}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button className="search-btn">
                🔍 Search
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-number">{stats.totalCourses}</span>
              <span className="stat-label">Courses</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.totalInstitutions}</span>
              <span className="stat-label">Institutions</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.totalCompanies}</span>
              <span className="stat-label">Companies</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.totalJobs}</span>
              <span className="stat-label">Job Opportunities</span>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Browse by Category</h2>
          <Link to="/courses" className="view-all-link">
            View All Categories →
          </Link>
        </div>
        <div className="categories-grid">
          {popularCategories.map((category, index) => (
            <Link 
              key={category.name} 
              to={`/courses?category=${category.name.toLowerCase()}`}
              className="category-card"
            >
              <div className="category-icon">
                {['📊', '💻', '📈', '⚙️', '🏥', '🎨'][index]}
              </div>
              <h3>{category.name}</h3>
              <p>{category.count} courses available</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="courses-section">
        <div className="section-header">
          <h2>Featured Courses</h2>
          <Link to="/courses" className="view-all-link">
            View All Courses →
          </Link>
        </div>
        
        <div className="courses-grid">
          {loading ? (
            <div className="loading">Loading courses...</div>
          ) : featuredCourses.length > 0 ? (
            featuredCourses.map((course) => (
              <div key={course.id} className="course-card">
                {course.status === 'active' && (
                  <div className="course-badge">ACTIVE</div>
                )}
                <h3>{course.title || 'Untitled Course'}</h3>
                <p className="instructor">{course.instituteName || course.institutionName || 'Unknown Institution'}</p>
                <div className="course-meta">
                  <span className="course-level">{course.level || 'All Levels'}</span>
                  <span className="course-field">{course.field || 'General'}</span>
                </div>
                <div className="course-description">
                  {course.description ? 
                    (course.description.length > 100 
                      ? `${course.description.substring(0, 100)}...` 
                      : course.description
                    ) 
                    : 'No description available'
                  }
                </div>
                <div className="course-actions">
                  <Link 
                    to={`/courses/${course.id}`} 
                    className="primary-btn"
                  >
                    View Details
                  </Link>
                  <button className="secondary-btn">Save</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">No courses available at the moment</div>
          )}
        </div>
      </section>

      {/* Data Science Courses Section */}
      {getCoursesByCategory('data science').length > 0 && (
        <section className="category-section">
          <div className="section-header">
            <h2>Data Science & Analytics</h2>
            <span className="category-subtitle">Project Based Learning</span>
          </div>
          
          <div className="category-courses-grid">
            {getCoursesByCategory('data science').map((course) => (
              <div key={course.id} className="featured-course-card">
                <div className="course-badge">POPULAR</div>
                <div className="course-content">
                  <h3>{course.title}</h3>
                  <div className="course-meta">
                    <span className="course-level">{course.level || 'Beginner to Advanced'}</span>
                    <span className="institution-name">{course.instituteName}</span>
                  </div>
                  <div className="interest-count">
                    {Math.floor(Math.random() * 500) + 50}+ interested students
                  </div>
                  <Link 
                    to={`/courses/${course.id}`} 
                    className="explore-btn-large"
                  >
                    Explore now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Technology & Programming Courses */}
      {getCoursesByCategory('programming').length > 0 || getCoursesByCategory('computer').length > 0 && (
        <section className="category-section">
          <div className="section-header">
            <h2>Technology & Programming</h2>
            <Link to="/courses?category=technology" className="view-all-link">
              View All →
            </Link>
          </div>
          
          <div className="category-courses-grid">
            {(getCoursesByCategory('programming').length > 0 ? getCoursesByCategory('programming') : getCoursesByCategory('computer'))
              .slice(0, 2)
              .map((course) => (
              <div key={course.id} className="featured-course-card">
                <div className="course-badge">HOT</div>
                <div className="course-content">
                  <h3>{course.title}</h3>
                  <div className="course-meta">
                    <span className="course-level">{course.level || 'All Levels'}</span>
                    <span className="institution-name">{course.instituteName}</span>
                  </div>
                  <div className="interest-count">
                    {Math.floor(Math.random() * 300) + 30}+ interested students
                  </div>
                  <Link 
                    to={`/courses/${course.id}`} 
                    className="explore-btn-large"
                  >
                    Explore now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Approved Institutions Section */}
      <section className="institutions-section">
        <div className="section-header">
          <h2>Approved Institutions</h2>
          <Link to="/institutions" className="view-all-link">
            View All Institutions →
          </Link>
        </div>
        
        <div className="institutions-grid">
          {loading ? (
            <div className="loading">Loading institutions...</div>
          ) : featuredInstitutions.length > 0 ? (
            featuredInstitutions.map((institution) => (
              <div key={institution.id} className="institution-card">
                <div className="institution-logo">
                  {institution.institutionName?.charAt(0) || institution.name?.charAt(0) || 'I'}
                </div>
                <h3>{institution.institutionName || institution.name || 'Unknown Institution'}</h3>
                <p className="institution-location">
                  {institution.address || 'Location not specified'}
                </p>
                <p className="institution-email">{institution.email}</p>
                <div className="institution-status approved">
                  ✓ Approved Institution
                </div>
                <Link 
                  to={`/institutions/${institution.id}`} 
                  className="view-institution-btn"
                >
                  View Profile
                </Link>
              </div>
            ))
          ) : (
            <div className="no-data">No institutions available</div>
          )}
        </div>
      </section>

      {/* Job Opportunities Section */}
      <section className="jobs-section">
        <div className="section-header">
          <h2>Latest Job Opportunities</h2>
          <Link to="/jobs" className="view-all-link">
            View All Jobs →
          </Link>
        </div>
        
        <div className="jobs-grid">
          {loading ? (
            <div className="loading">Loading jobs...</div>
          ) : featuredJobs.length > 0 ? (
            featuredJobs.map((job) => (
              <div key={job.id} className="job-card">
                <h3>{job.title || 'Untitled Position'}</h3>
                <p className="company">{job.companyName || 'Unknown Company'}</p>
                <div className="job-description">
                  {job.description ? 
                    (job.description.length > 120 
                      ? `${job.description.substring(0, 120)}...` 
                      : job.description
                    ) 
                    : 'No description available'
                  }
                </div>
                <div className="job-meta">
                  <span className="job-type">{job.type || 'Full-time'}</span>
                  <span className="job-location">{job.location || 'Maseru'}</span>
                  <span className="job-salary">
                    {job.salary ? `M${job.salary}` : 'Salary not specified'}
                  </span>
                </div>
                <div className="job-actions">
                  <Link 
                    to={`/jobs/${job.id}`} 
                    className="apply-btn"
                  >
                    Apply Now
                  </Link>
                  <button className="save-job-btn">Save</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">No job opportunities available at the moment</div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join thousands of students and professionals advancing their careers in Lesotho</p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-btn primary">
              Get Started Free
            </Link>
            <Link to="/courses" className="cta-btn secondary">
              Browse Courses
            </Link>
            <Link to="/jobs" className="cta-btn secondary">
              Find Jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;