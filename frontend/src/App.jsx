// src/App.jsx
import React from 'react'
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes/AppRoutes';
import Toast from './components/common/Notification/Toast';
import { ThemeToggle } from './components/common/Header/ThemeToggle';
import Header from './components/common/Header/Header';
import './App.css';
import ModeToggle from './components/common/ModeToggle';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <div className="app">
              {/* Header at the top */}
              <Header />
              
              {/* Theme controls - you might want to move these to header */}
              <div className="theme-controls">
                <ThemeToggle />
                <ModeToggle />
              </div>
              
              {/* Main content area */}
              <main className="main-content">
                <AppRoutes />
              </main>
              
              {/* Footer at the bottom */}
              <Footer />
              
              {/* Toast notifications */}
              <Toast />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App;
