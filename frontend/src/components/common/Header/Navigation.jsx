import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext'; // Import ThemeContext

const Navigation = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Use theme context
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  // Public navigation links
  const publicLinks = [
    { path: '/courses', label: 'Courses' },
    { path: '/institute', label: 'Institutions' },
    { path: '/jobs', label: 'Jobs' },
    { path: '/about', label: 'About' }
  ];

  // Role-based navigation
  const getRoleLinks = () => {
    if (!isAuthenticated) return [];
    
    console.log(' getRoleLinks called:', {
      userRole: user?.role,
      userEmail: user?.email,
      isAuthenticated
    });
    
    switch (user?.role) {
      case 'student':
        const studentLinks = [
          { path: '/student/dashboard', label: 'Dashboard' },
          { path: '/student/courses', label: 'Courses' },
          { path: '/student/applications', label: 'My Applications' },
          { path: '/student/jobs', label: 'Jobs' }
        ];
        console.log(' Returning student links:', studentLinks);
        return studentLinks;
        
      case 'institute':
        const instituteLinks = [
          { path: '/institute/dashboard', label: 'Dashboard' },
          { path: '/institute/courses', label: 'Courses' },
          { path: '/institute/applications', label: 'Applications' }
        ];
        console.log(' Returning institute links:', instituteLinks);
        return instituteLinks;
        
      case 'company':
        const companyLinks = [
          { path: '/company/dashboard', label: 'Dashboard' },
          { path: '/company/jobs', label: 'Jobs' },
          { path: '/company/applicants', label: 'Applicants' }
        ];
        console.log(' Returning company links:', companyLinks);
        return companyLinks;
        
      case 'admin':
        const adminLinks = [
          { path: '/admin/dashboard', label: 'Dashboard' },
          { path: '/admin/users', label: 'Users' },
          { path: '/admin/institutes', label: 'Institutes' },
          { path: '/admin/companies', label: 'Companies' }
        ];
        console.log(' Returning admin links:', adminLinks);
        return adminLinks;
        
      default:
        console.log(' Unknown role, returning empty links');
        return [];
    }
  };

  // Determine which links to show
  const links = isAuthenticated ? getRoleLinks() : publicLinks;

  console.log(' NAVIGATION DEBUG:', {
    isAuthenticated,
    userRole: user?.role,
    userEmail: user?.email,
    currentPath: location.pathname,
    showingLinks: isAuthenticated ? 'role-based' : 'public',
    numberOfLinks: links.length,
    links: links.map(link => `${link.path} (${link.label})`)
  });

  return (
    <nav className="navigation">
      <ul className="nav-list">
        {links.map((link) => (
          <li key={link.path} className="nav-item">
            <Link to={link.path} className={isActive(link.path)}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      
      {/* Dark/Light mode toggle and Logout button */}
      <div className="nav-controls">
        {/* Dark/Light mode toggle using ThemeContext */}
        <button 
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label="Toggle dark/light mode"
        >
          {theme === 'dark' ? }
        </button>
        
        {/* Logout button - only show when authenticated */}
        {isAuthenticated && (
          <button 
            onClick={logout}
            className="logout-btn"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
