import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const getPageTitle = (pathname: string): string => {
      if (pathname === '/') return 'Home';
      if (pathname.startsWith('/report')) return 'Session Report';
      if (pathname.startsWith('/daily')) return 'Daily Session';
      if (pathname.startsWith('/batches')) return 'Manage Batches';
      if (pathname.startsWith('/notifications')) return 'Notifications';
      if (pathname.startsWith('/email-automation')) return 'Email Automation';
      if (pathname.startsWith('/email-test')) return 'Email Test';
      if (pathname.startsWith('/email-debug')) return 'Email Debug';
      if (pathname.startsWith('/login')) return 'Login';
      if (pathname.startsWith('/register')) return 'Register';
      if (pathname.startsWith('/forgot-password')) return 'Forgot Password';
      if (pathname.startsWith('/reset-password')) return 'Reset Password';
      return 'Neurforge';
    };

    const pageTitle = getPageTitle(location.pathname);
    document.title = `${pageTitle} - Neurforge`;
  }, [location.pathname]);
};
