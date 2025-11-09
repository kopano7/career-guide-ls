import React from 'react';

const Home = () => {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      backgroundColor: '#f0f8ff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#007bff', marginBottom: '20px' }}>
        🎓 CareerGuide LS - Lesotho Career Platform
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>
        Connecting students with higher education and career opportunities in Lesotho
      </p>
      
      <div style={{ marginTop: '40px' }}>
        <h2>Quick Links</h2>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
          <a 
            href="/courses" 
            style={{ 
              padding: '15px 25px', 
              background: '#007bff', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Browse Courses
          </a>
          <a 
            href="/institutions" 
            style={{ 
              padding: '15px 25px', 
              background: '#28a745', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Find Institutions
          </a>
          <a 
            href="/jobs" 
            style={{ 
              padding: '15px 25px', 
              background: '#dc3545', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Job Opportunities
          </a>
          <a 
            href="/login" 
            style={{ 
              padding: '15px 25px', 
              background: '#6c757d', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Login
          </a>
        </div>
      </div>

      <div style={{ marginTop: '50px', padding: '20px', background: 'white', borderRadius: '10px', maxWidth: '800px', margin: '50px auto' }}>
        <h3>Platform Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h4>🎯 Course Applications</h4>
            <p>Apply to courses from approved institutions in Lesotho</p>
          </div>
          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h4>📊 Job Matching</h4>
            <p>Intelligent job matching based on your qualifications</p>
          </div>
          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h4>📝 Transcript Management</h4>
            <p>Upload and verify your academic transcripts</p>
          </div>
          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h4>👥 Multi-role Platform</h4>
            <p>Students, Institutions, Companies, and Administrators</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;