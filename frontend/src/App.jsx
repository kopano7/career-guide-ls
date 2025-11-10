import React from 'react'
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppRoutes from './routes/AppRoutes';
import Toast from './components/common/Notification/Toast';
import { ThemeToggle } from './components/common/Header/ThemeToggle'; // ← Import the theme toggle component
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <div className="app">
            {/* Theme Toggle Button with Icons */}
            <ThemeToggle />
            <AppRoutes />
            <Toast />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App