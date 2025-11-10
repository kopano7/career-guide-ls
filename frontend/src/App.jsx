import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import AuthProvider from './contexts/AuthContext'  // ← Context version
import { NotificationProvider } from './contexts/NotificationContext'
import AppRoutes from './routes/AppRoutes'
import Toast from './components/common/Notification/Toast'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>  {/* This now uses the single source */}
        <NotificationProvider>
          <div className="app">
            <AppRoutes />
            <Toast />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App;