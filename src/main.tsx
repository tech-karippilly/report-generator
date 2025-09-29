import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
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
import AutomatedSessionReportPage from './pages/AutomatedSessionReport.tsx'
import AnalyticsPage from './pages/Analytics.tsx'
import BestPerformerPage from './pages/BestPerformer.tsx'
import { AuthProvider } from './contexts/AuthContext'

const router = createBrowserRouter([
  // All routes use the same layout with Navigation component
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> }, // Default to Home page
      { path: 'report', element: <SessionReportPage /> },
      { path: 'automated-report', element: <AutomatedSessionReportPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'best-performer', element: <BestPerformerPage /> },
      { path: 'daily', element: <DailySessionPage /> },
      // Protected routes (require authentication)
      {
        path: 'batches',
        element: (
          <ProtectedRoute>
            <BatchesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'points',
        element: (
          <ProtectedRoute>
            <PointSystemPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'email-automation',
        element: (
          <ProtectedRoute>
            <EmailAutomationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'email-test',
        element: (
          <ProtectedRoute>
            <EmailTestPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'email-debug',
        element: (
          <ProtectedRoute>
            <EmailDebug />
          </ProtectedRoute>
        ),
      },
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
