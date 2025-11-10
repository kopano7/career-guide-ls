// src/components/public/Home/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import './HomePage.css';
//import { useAuth } from '../../../contexts/AuthContext'; 

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: '🎓',
      title: 'Find Your Perfect Course',
      description: 'Discover courses that match your interests and qualifications from top institutions.'
    },
    {
      icon: '💼',
      title: 'Land Your Dream Job',
      description: 'Get matched with companies looking for your skills and qualifications.'
    },
    {
      icon: '🏫',
      title: 'Connect with Institutions',
      description: 'Educational institutions can find qualified students for their programs.'
    },
    {
      icon: '🔍',
      title: 'Smart Matching',
      description: 'Our intelligent algorithm matches students with the right opportunities.'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Active Students' },
    { number: '500+', label: 'Partner Institutions' },
    { number: '1,000+', label: 'Hiring Companies' },
    { number: '50,000+', label: 'Successful Placements' }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Your Career Journey <span className="highlight">Starts Here</span>
          </h1>
          <p className="hero-description">
            Connect with top educational institutions and leading companies. 
            Find the perfect course or job that matches your qualifications and aspirations.
          </p>
          <div className="hero-actions">
            {!user ? (
              <>
                <button 
                  className="btn-primary large"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </button>
                <button 
                  className="btn-outline large"
                  onClick={() => navigate('/courses')}
                >
                  Browse Courses
                </button>
              </>
            ) : (
              <button 
                className="btn-primary large"
                onClick={() => navigate(`/${user.role}/dashboard`)}
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
        <div className="hero-image">
          <div className="placeholder-image">
            🎓💼🚀
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Our Platform?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Your Journey?</h2>
            <p className="cta-description">
              Join thousands of students and professionals who have found their path through our platform.
            </p>
            {!user && (
              <button 
                className="btn-primary large"
                onClick={() => navigate('/register')}
              >
                Create Your Account
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;