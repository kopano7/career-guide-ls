import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import LoadingSpinner from '../components/common/Loading/LoadingSpinner';

// Public Pages
const Home = React.lazy(() => import('../pages/public/Home'));
const Courses = React.lazy(() => import('../pages/public/Courses'));
const Institutions = React.lazy(() => import('../pages/public/Institutions'));
const Jobs = React.lazy(() => import('../pages/public/Jobs'));
const About = React.lazy(() => import('../pages/public/About'));

// Auth Pages
const Login = React.lazy(() => import('../pages/auth/Login'));
const Register = React.lazy(() => import('../pages/auth/Register'));
const VerifyEmail = React.lazy(() => import('../pages/auth/VerifyEmail'));
const ResetPassword = React.lazy(() => import('../pages/auth/ResetPassword'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const UserManagement = React.lazy(() => import('../pages/admin/UserManagement'));
const InstituteApproval = React.lazy(() => import('../pages/admin/InstituteApproval'));
const CompanyApproval = React.lazy(() => import('../pages/admin/CompanyApproval'));
const SystemReports = React.lazy(() => import('../pages/admin/SystemReports'));

// Student Pages
const StudentDashboard = React.lazy(() => import('../pages/student/StudentDashboard'));
const CourseCatalog = React.lazy(() => import('../pages/student/CourseCatalog'));
const MyApplications = React.lazy(() => import('../pages/student/MyApplications'));
const JobPortal = React.lazy(() => import('../pages/student/JobPortal'));
const StudentProfile = React.lazy(() => import('../pages/student/Profile'));

// Institute Pages
const InstituteDashboard = React.lazy(() => import('../pages/institute/InstituteDashboard'));
const CourseManagement = React.lazy(() => import('../pages/institute/CourseManagement'));
const ApplicationReview = React.lazy(() => import('../pages/institute/ApplicationReview'));
const InstituteProfile = React.lazy(() => import('../pages/institute/InstitutionProfile'));

// Company Pages
const CompanyDashboard = React.lazy(() => import('../pages/company/CompanyDashboard'));
const JobManagement = React.lazy(() => import('../pages/company/JobManagement'));
const ApplicantManagement = React.lazy(() => import('../pages/company/ApplicantManagement'));
const CompanyProfile = React.lazy(() => import('../pages/company/CompanyProfile'));

// Common Components
const MainLayout = React.lazy(() => import('../components/common/Layout/MainLayout'));

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Initializing application..." />;
  }

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/institutions" element={<Institutions />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/about" element={<About />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes with Layout */}
        <Route path="/admin/*" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="institutes" element={<InstituteApproval />} />
                <Route path="companies" element={<CompanyApproval />} />
                <Route path="reports" element={<SystemReports />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* FIXED STUDENT ROUTES */}
        <Route path="/student/*" element={
          <ProtectedRoute requiredRole="student">
            <MainLayout>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="courses" element={<CourseCatalog />} />
                <Route path="applications" element={<MyApplications />} />
                <Route path="jobs" element={<JobPortal />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
                {/* Add catch-all route for student section */}
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/institute/*" element={
          <ProtectedRoute requiredRole="institute">
            <MainLayout>
              <Routes>
                <Route path="dashboard" element={<InstituteDashboard />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="applications" element={<ApplicationReview />} />
                <Route path="profile" element={<InstituteProfile />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/company/*" element={
          <ProtectedRoute requiredRole="company">
            <MainLayout>
              <Routes>
                <Route path="dashboard" element={<CompanyDashboard />} />
                <Route path="jobs" element={<JobManagement />} />
                <Route path="applicants" element={<ApplicantManagement />} />
                <Route path="profile" element={<CompanyProfile />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Redirect based on user role */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            {user?.role === 'admin' && <Navigate to="/admin/dashboard" replace />}
            {user?.role === 'student' && <Navigate to="/student/dashboard" replace />}
            {user?.role === 'institute' && <Navigate to="/institute/dashboard" replace />}
            {user?.role === 'company' && <Navigate to="/company/dashboard" replace />}
            <Navigate to="/" replace />
          </ProtectedRoute>
        } />

        {/* 404 Page */}
        <Route path="*" element={
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>404 - Page Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>
            <a href="/">Return to Home</a>
          </div>
        } />
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes;