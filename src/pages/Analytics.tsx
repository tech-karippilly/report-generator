import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { trackPageView } from '../utils/analytics';

interface UsageData {
  id: string;
  action: string;
  timestamp: string;
  details?: Record<string, any>;
}

export default function AnalyticsPage() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackPageView('Analytics Dashboard');
    
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }

    // Note: This is a simplified example. In a real implementation, you would need to:
    // 1. Set up Firebase Analytics data export to Firestore
    // 2. Or use Firebase Analytics dashboard directly
    // 3. Or implement custom event logging to Firestore
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600 mb-8">
              Track app usage and user engagement
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">📊</div>
                <div className="text-sm text-blue-800 font-medium">Page Views</div>
                <div className="text-xs text-blue-600">Tracked via Firebase Analytics</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">📁</div>
                <div className="text-sm text-green-800 font-medium">CSV Uploads</div>
                <div className="text-xs text-green-600">File processing events</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">📱</div>
                <div className="text-sm text-purple-800 font-medium">WhatsApp Shares</div>
                <div className="text-xs text-purple-600">Report sharing events</div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">👥</div>
                <div className="text-sm text-orange-800 font-medium">Active Users</div>
                <div className="text-xs text-orange-600">Real-time usage tracking</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How to View Analytics</h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Firebase Analytics Dashboard</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase Console</a> → Your Project → Analytics → Events
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-gray-900">Real-time Data</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    View real-time user activity, page views, and custom events
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-medium text-gray-900">Custom Events Tracked</h3>
                  <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                    <li>Page views (Home, Automated Report, etc.)</li>
                    <li>CSV file uploads</li>
                    <li>CSV processing results</li>
                    <li>WhatsApp report sharing</li>
                    <li>Report generation</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-yellow-600 mr-3">⚠️</div>
                <div>
                  <h3 className="font-medium text-yellow-800">Note</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Analytics data may take a few minutes to appear in the Firebase console. 
                    All tracking is anonymous and doesn't require user login.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
