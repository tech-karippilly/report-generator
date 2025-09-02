import { Link, Outlet, useLocation } from 'react-router-dom'

export default function App() {
  const location = useLocation()
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold">Comm Reports</span>
            <div className="flex items-center gap-4 text-sm">
              <Link className={"hover:underline " + (location.pathname === '/' ? 'text-blue-600' : 'text-gray-700')} to="/">Batches</Link>
              <Link className={"hover:underline " + (location.pathname.startsWith('/report') ? 'text-blue-600' : 'text-gray-700')} to="/report">Session Report</Link>
            </div>
          </div>
          <div className="text-xs text-gray-500">v0.1</div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
