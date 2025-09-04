import { Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Button from './components/Button'

export default function App() {
  const location = useLocation()
  const { currentUser, logout } = useAuth()

  // If user is not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-xl text-gray-800">Comm Reports</span>
            <div className="flex items-center gap-6 text-sm">
              <Link 
                className={`hover:text-blue-600 transition-colors font-medium ${
                  location.pathname === '/' || location.pathname.startsWith('/batches') ? 'text-blue-600' : 'text-gray-600'
                }`} 
                to="/"
              >
                Manage Batch
              </Link>
              <Link 
                className={`hover:text-blue-600 transition-colors font-medium ${
                  location.pathname.startsWith('/report') ? 'text-blue-600' : 'text-gray-600'
                }`} 
                to="/report"
              >
                Session Report
              </Link>
              <Link 
                className={`hover:text-blue-600 transition-colors font-medium ${
                  location.pathname.startsWith('/daily') ? 'text-blue-600' : 'text-gray-600'
                }`} 
                to="/daily"
              >
                Daily Session
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">v0.1</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{currentUser.email}</span>
              <Button 
                variant="danger" 
                className="text-sm px-3 py-1"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
