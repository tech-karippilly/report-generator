import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import BatchesPage from './pages/Batches.tsx'
import SessionReportPage from './pages/SessionReport.tsx'
import DailySessionPage from './pages/DailySession.tsx'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import ForgotPassword from './pages/ForgotPassword.tsx'
import ResetPassword from './pages/ResetPassword.tsx'
import EmailDebug from './pages/EmailDebug.tsx'
import { AuthProvider } from './contexts/AuthContext'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <BatchesPage /> },
      { path: 'batches', element: <BatchesPage /> },
      { path: 'report', element: <SessionReportPage /> },
      { path: 'daily', element: <DailySessionPage /> },
      { path: 'email-debug', element: <EmailDebug /> },
    ],
  },
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
