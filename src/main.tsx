import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import PublicLayout from './components/PublicLayout.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import Home from './pages/Home.tsx'
import BatchesPage from './pages/Batches.tsx'
import SessionReportPage from './pages/SessionReport.tsx'
import DailySessionPage from './pages/DailySession.tsx'
import NotificationsPage from './pages/Notifications.tsx'
import EmailAutomationPage from './pages/EmailAutomation.tsx'
import EmailTestPage from './pages/EmailTest.tsx'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import ForgotPassword from './pages/ForgotPassword.tsx'
import ResetPassword from './pages/ResetPassword.tsx'
import EmailDebug from './pages/EmailDebug.tsx'
import PointSystemPage from './pages/PointSystem.tsx'
import { AuthProvider } from './contexts/AuthContext'

const router = createBrowserRouter([
  // Public routes (accessible without authentication)
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> }, // Default to Home page
      { path: 'report', element: <SessionReportPage /> },
      { path: 'daily', element: <DailySessionPage /> },
    ],
  },
  // Protected routes (require authentication)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <BatchesPage /> },
      { path: 'batches', element: <BatchesPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'points', element: <PointSystemPage /> },
      { path: 'email-automation', element: <EmailAutomationPage /> },
      { path: 'email-test', element: <EmailTestPage /> },
      { path: 'email-debug', element: <EmailDebug /> },
    ],
  },
  // Authentication routes (no layout needed)
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
