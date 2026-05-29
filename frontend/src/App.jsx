import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import OAuthCallback from './pages/OAuthCallback'
import ProtectedRoute from './components/ProtectedRoute'

import Dashboard from './pages/Dashboard'
import Skills from './pages/Skills'
import Assessments from './pages/Assessments'
import Opportunities from './pages/Opportunities'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import SaaSLayout from './layouts/SaaSLayout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
        <Route path="/oauth-success" element={<OAuthCallback />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SaaSLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="skills" element={<Skills />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

