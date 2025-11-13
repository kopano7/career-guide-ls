// src/pages/Home/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Empower Your Career with <span className="highlight">CareerGuide</span>
          </h1>
          <p className="hero-subtitle">
            Discover the excellence of CareerGuide, your premier education and career development platform in Lesotho.  
            Elevate your skills and career opportunities with our dedicated platform, ensuring accessible, quality education 
            and job opportunities tailored to meet your unique needs.
          </p>
          
          <div className="hero-buttons">
            <Link to="/courses" className="cta-button primary">
              Explore Courses
            </Link>
            <Link to="/jobs" className="cta-button secondary">
              Find Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="services-grid">
          {/* Course Catalog */}
          <div className="service-card">
            <h3>COURSES</h3>
            <p>
              CareerGuide's comprehensive course catalog offers a wide variety of educational programs 
              for students, professionals, and organizations across Lesotho.
            </p>
            <Link to="/courses" className="service-link">
              EXPLORE
            </Link>
          </div>

          {/* Job Opportunities */}
          <div className="service-card">
            <h3>JOB OPPORTUNITIES</h3>
            <p>
              Do you need career opportunities that match your skills and qualifications?  
              CareerGuide connects talented individuals with top employers in Lesotho.
            </p>
            <Link to="/jobs" className="service-link">
              EXPLORE
            </Link>
          </div>

          {/* Institution Partnerships */}
          <div className="service-card">
            <h3>INSTITUTION</h3>
            <p>
              CareerGuide offers comprehensive partnerships with educational institutions across Lesotho. 
              Our platform connects students with quality education providers.
            </p>
            <Link to="/institutions" className="service-link">
              EXPLORE
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta-section">
        <div className="cta-content">
          <h2>Ready to Advance Your Career?</h2>
          <p>
            Join thousands of students and professionals advancing their careers through CareerGuide. 
            Unleash your potential through quality education and career opportunities in collaboration 
            with trusted educational and employment partners.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-button primary">
              Get Started Today
            </Link>
            <Link to="/about" className="cta-button secondary">
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
