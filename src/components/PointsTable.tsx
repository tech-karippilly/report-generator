import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Batch, PointUpdate } from '../types';
import StudentPointLog from './StudentPointLog';

interface PointsTableProps {
  selectedBatchId: string;
  batches: Batch[];
}

interface PointUpdateWithStudent extends PointUpdate {
  studentName: string;
  batchCode: string;
}

export default function PointsTable({ selectedBatchId }: PointsTableProps) {
  const [pointUpdates, setPointUpdates] = useState<PointUpdateWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<{
    studentId: string;
    studentName: string;
    batchId: string;
  } | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'points' | 'student'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!selectedBatchId || !db) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'pointUpdates'),
      where('batchId', '==', selectedBatchId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PointUpdateWithStudent));
      setPointUpdates(updates);
      setLoading(false);
    }, (error) => {
      console.error('Error loading point updates:', error);
      setError('Failed to load point updates');
      setLoading(false);
    });

    return unsubscribe;
  }, [selectedBatchId]);

  // Filter and sort updates
  const filteredUpdates = pointUpdates
    .filter(update => {
      if (!filterDate) return true;
      return update.dateISO === filterDate;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.dateISO);
          bValue = new Date(b.dateISO);
          break;
        case 'points':
          aValue = a.pointsChange;
          bValue = b.pointsChange;
          break;
        case 'student':
          aValue = a.studentName.toLowerCase();
          bValue = b.studentName.toLowerCase();
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      return sortOrder === 'desc' ? 
        (aValue > bValue ? -1 : aValue < bValue ? 1 : 0) :
        (aValue < bValue ? -1 : aValue > bValue ? 1 : 0);
    });

  const handleStudentClick = (studentId: string, studentName: string) => {
    setSelectedStudent({
      studentId,
      studentName,
      batchId: selectedBatchId
    });
  };

  const getPointsColor = (points: number) => {
    if (points > 0) return 'text-green-600 bg-green-50';
    if (points < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Points History</h2>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'points' | 'student')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="points">Points</option>
                <option value="student">Student</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No point updates found for the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUpdates.map((update) => (
                  <tr key={update.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(update.dateISO).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {update.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getPointsColor(update.pointsChange)}`}>
                        {update.pointsChange > 0 ? '+' : ''}{update.pointsChange}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {update.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {update.updatedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleStudentClick(update.studentId, update.studentName)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {filteredUpdates.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredUpdates.length}
              </div>
              <div className="text-sm text-gray-600">Total Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{filteredUpdates.filter(u => u.pointsChange > 0).reduce((sum, u) => sum + u.pointsChange, 0)}
              </div>
              <div className="text-sm text-gray-600">Points Added</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                -{Math.abs(filteredUpdates.filter(u => u.pointsChange < 0).reduce((sum, u) => sum + u.pointsChange, 0))}
              </div>
              <div className="text-sm text-gray-600">Points Deducted</div>
            </div>
          </div>
        )}
      </div>

      {/* Student Point Log Modal */}
      {selectedStudent && (
        <StudentPointLog
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          studentId={selectedStudent.studentId}
          studentName={selectedStudent.studentName}
          batchId={selectedStudent.batchId}
        />
      )}
    </>
  );
}
