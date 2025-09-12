import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMemo } from 'react';
import Button from './Button';
import iconImage from '../assets/icon.png';

export default function Navigation() {
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const isActive = useMemo(() => {
    return (path: string) => {
      if (path === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(path);
    };
  }, [location.pathname]);


  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              {/* App Icon */}
              <img 
                src={iconImage} 
                alt="Report Generator" 
                className="w-10 h-10 rounded-lg"
              />
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold text-gray-900">REPORT</span>
                <span className="text-base font-bold text-gray-900">GENERATOR</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Home
              </Link>
              <Link
                to="/report"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/report') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Session Report
              </Link>
              <Link
                to="/daily"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/daily') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Daily Session
              </Link>
              {currentUser && (
                <>
                  <Link
                    to="/batches"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/batches') 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Manage Batches
                  </Link>
                  <Link
                    to="/notifications"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/notifications') 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Notifications
                  </Link>
                  <Link
                    to="/points"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/points') 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Points System
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-600">Welcome,</span>
                  <span className="text-sm font-medium text-gray-900 ml-1">
                    {currentUser.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="secondary" className="text-sm px-4 py-2">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="text-sm px-4 py-2">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          <Link
            to="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/') 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Home
          </Link>
          <Link
            to="/report"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/report') 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Session Report
          </Link>
          <Link
            to="/daily"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/daily') 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Daily Session
          </Link>
          {currentUser && (
            <>
              <Link
                to="/batches"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/batches') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Manage Batches
              </Link>
              <Link
                to="/notifications"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/notifications') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Notifications
              </Link>
              <Link
                to="/points"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/points') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Points System
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
