import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { PointUpdate } from '../types';

interface StudentPointLogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  batchId: string;
}

export default function StudentPointLog({ isOpen, onClose, studentId, studentName, batchId }: StudentPointLogProps) {
  const [pointUpdates, setPointUpdates] = useState<PointUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !studentId || !db) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'pointUpdates'),
      where('studentId', '==', studentId),
      where('batchId', '==', batchId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PointUpdate));
      setPointUpdates(updates);
      setLoading(false);
    }, (error) => {
      console.error('Error loading point updates:', error);
      setError('Failed to load point updates');
      setLoading(false);
    });

    return unsubscribe;
  }, [isOpen, studentId, batchId]);

  const getTotalPoints = () => {
    return pointUpdates.reduce((sum, update) => sum + update.pointsChange, 0);
  };

  const getPointsEarned = () => {
    return pointUpdates
      .filter(update => update.pointsChange > 0)
      .reduce((sum, update) => sum + update.pointsChange, 0);
  };

  const getPointsLost = () => {
    return pointUpdates
      .filter(update => update.pointsChange < 0)
      .reduce((sum, update) => sum + Math.abs(update.pointsChange), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Point History</h2>
              <p className="text-gray-600 mt-1">{studentName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading point history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">+{getPointsEarned()}</div>
                  <div className="text-sm text-green-700">Points Earned</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">-{getPointsLost()}</div>
                  <div className="text-sm text-red-700">Points Lost</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {getTotalPoints() >= 0 ? '+' : ''}{getTotalPoints()}
                  </div>
                  <div className="text-sm text-blue-700">Net Change</div>
                </div>
              </div>

              {/* Point Updates List */}
              {pointUpdates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No point updates found for this student.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Point Transactions</h3>
                  {pointUpdates.map((update) => (
                    <div key={update.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            update.pointsChange > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {update.pointsChange > 0 ? '+' : ''}{update.pointsChange}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(update.dateISO).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(update.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{update.reason}</p>
                      <p className="text-xs text-gray-500">Updated by: {update.updatedBy}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
