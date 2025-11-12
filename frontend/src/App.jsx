// src/App.jsx
import React from 'react'
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext'; // ← import ThemeProvider
import AppRoutes from './routes/AppRoutes';
import Toast from './components/common/Notification/Toast';
import { ThemeToggle } from './components/common/Header/ThemeToggle';
import './App.css';
import ModeToggle from './components/common/ModeToggle';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider> {/* Wrap the app in ThemeProvider */}
        <AuthProvider>
          <NotificationProvider>
            <div className="app">
              <ThemeToggle />
              <ModeToggle />
              <AppRoutes />
              <Toast />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App;
