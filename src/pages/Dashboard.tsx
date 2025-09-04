import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Comm Reports</h1>
        <p className="text-gray-600 text-lg mb-8">
          Manage your training batches, generate session reports, and create daily session announcements.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 mb-3">Manage Batches</h3>
            <p className="text-blue-700 mb-4">
              Create and manage training batches with trainers, coordinators, and students.
            </p>
            <Link to="/batches">
              <Button variant="primary" className="w-full">
                Go to Batches
              </Button>
            </Link>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-xl font-semibold text-green-900 mb-3">Session Reports</h3>
            <p className="text-green-700 mb-4">
              Generate detailed session reports with attendance and activity information.
            </p>
            <Link to="/report">
              <Button variant="primary" className="w-full">
                Create Report
              </Button>
            </Link>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-xl font-semibold text-purple-900 mb-3">Daily Sessions</h3>
            <p className="text-purple-700 mb-4">
              Generate daily session announcements with meeting links and schedules.
            </p>
            <Link to="/daily">
              <Button variant="primary" className="w-full">
                Daily Session
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/batches">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              View All Batches
            </Button>
          </Link>
          <Link to="/report">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              New Session Report
            </Button>
          </Link>
          <Link to="/daily">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              Create Daily Session
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
