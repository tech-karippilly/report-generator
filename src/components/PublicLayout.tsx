import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

export default function PublicLayout() {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Navigation />
      <main className="w-full h-full">
        <Outlet />
      </main>
    </div>
  );
}
