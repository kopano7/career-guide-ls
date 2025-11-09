// src/pages/public/About.jsx
import React from 'react';

const About = () => {
  return (
    <div className="about-page">
      <div className="page-header">
        <h1>About Career Guidance Platform</h1>
        <p>Connecting students with opportunities</p>
      </div>

      <div className="about-content">
        <div className="content-section">
          <h2>Our Mission</h2>
          <p>
            We bridge the gap between education and employment by providing a comprehensive 
            platform where students can discover educational opportunities and career paths 
            that match their skills and aspirations.
          </p>
        </div>

        <div className="content-section">
          <h2>What We Offer</h2>
          <div className="features-grid">
            <div className="feature">
              <h3>For Students</h3>
              <p>Find courses that match your qualifications and career goals</p>
            </div>
            <div className="feature">
              <h3>For Institutions</h3>
              <p>Connect with qualified students for your programs</p>
            </div>
            <div className="feature">
              <h3>For Companies</h3>
              <p>Discover talented candidates for your organization</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Contact Us</h2>
          <p>
            Have questions or need support? Reach out to our team at 
            <a href="mailto:support@careerguidance.com"> support@careerguidance.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;