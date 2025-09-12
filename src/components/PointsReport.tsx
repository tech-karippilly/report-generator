import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Batch, StudentPoints } from '../types';
import Button from './Button';

interface PointsReportProps {
  selectedBatchId: string;
  batches: Batch[];
}

interface StudentWithBatch extends StudentPoints {
  batchCode: string;
  groupName?: string;
}

export default function PointsReport({ selectedBatchId, batches }: PointsReportProps) {
  const [allStudentPoints, setAllStudentPoints] = useState<StudentWithBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'points' | 'earned' | 'lost'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAllBatches, setShowAllBatches] = useState(false);

  // Load all student points from all batches
  useEffect(() => {
    if (batches.length === 0) {
      setLoading(false);
      return;
    }

    const loadAllStudentPoints = async () => {
      const allPoints: StudentWithBatch[] = [];

      // Process each batch
      for (const batch of batches) {
        if (batch.students && batch.students.length > 0) {
          const batchStudents: StudentWithBatch[] = batch.students.map(student => ({
            studentId: student.id,
            studentName: student.name,
            currentPoints: student.points || 100,
            totalPointsEarned: 0, // We'll calculate this from point updates
            totalPointsLost: 0,   // We'll calculate this from point updates
            lastUpdated: Date.now(),
            batchCode: batch.code,
            groupName: batch.groupName
          }));
          allPoints.push(...batchStudents);
        }
      }

      // Load point updates to calculate earned/lost points
      const updatesQuery = query(
        collection(db, 'pointUpdates'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(updatesQuery, (snapshot) => {
        const updates = snapshot.docs.map(doc => doc.data());
        
        // Calculate earned and lost points for each student
        const updatedPoints = allPoints.map(student => {
          const studentUpdates = updates.filter(update => update.studentId === student.studentId);
          const earned = studentUpdates
            .filter(update => update.pointsChange > 0)
            .reduce((sum, update) => sum + update.pointsChange, 0);
          const lost = studentUpdates
            .filter(update => update.pointsChange < 0)
            .reduce((sum, update) => sum + Math.abs(update.pointsChange), 0);

          return {
            ...student,
            totalPointsEarned: earned,
            totalPointsLost: lost
          };
        });

        setAllStudentPoints(updatedPoints);
        setLoading(false);
      }, (error) => {
        console.error('Error loading point updates:', error);
        setLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribe = loadAllStudentPoints();
    return unsubscribe;
  }, [batches]);

  // Filter and sort students
  const filteredStudents = allStudentPoints
    .filter(student => showAllBatches || student.studentId === selectedBatchId)
    .sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'points':
          aValue = a.currentPoints;
          bValue = b.currentPoints;
          break;
        case 'earned':
          aValue = a.totalPointsEarned;
          bValue = b.totalPointsEarned;
          break;
        case 'lost':
          aValue = a.totalPointsLost;
          bValue = b.totalPointsLost;
          break;
        default:
          aValue = a.currentPoints;
          bValue = b.currentPoints;
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getPointsColor = (points: number) => {
    if (points >= 80) return 'text-green-600 bg-green-50';
    if (points >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Points Report</h2>
          <p className="text-gray-600">
            {showAllBatches ? 'All Students' : 'Selected Batch'} - Ranked by Performance
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <Button
            variant={showAllBatches ? 'primary' : 'secondary'}
            onClick={() => setShowAllBatches(!showAllBatches)}
            className="text-sm px-3 py-1"
          >
            {showAllBatches ? 'Show Selected Batch' : 'Show All Batches'}
          </Button>
        </div>
      </div>

      {/* Sorting Controls */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'points' | 'earned' | 'lost')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="points">Current Points</option>
            <option value="earned">Points Earned</option>
            <option value="lost">Points Lost</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Order:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">High to Low</option>
            <option value="asc">Low to High</option>
          </select>
        </div>
      </div>

      {/* Report Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              {showAllBatches && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points Earned
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points Lost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Change
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student, index) => (
              <tr key={student.studentId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {getRankIcon(index)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.studentName}
                </td>
                {showAllBatches && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.batchCode}
                    {student.groupName && ` - ${student.groupName}`}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getPointsColor(student.currentPoints)}`}>
                    {student.currentPoints}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  +{student.totalPointsEarned}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                  -{student.totalPointsLost}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span className={student.totalPointsEarned - student.totalPointsLost >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {student.totalPointsEarned - student.totalPointsLost >= 0 ? '+' : ''}
                    {student.totalPointsEarned - student.totalPointsLost}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No students found for the selected criteria.</p>
        </div>
      )}

      {/* Summary Statistics */}
      {filteredStudents.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredStudents.length}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(filteredStudents.reduce((sum, s) => sum + s.currentPoints, 0) / filteredStudents.length)}
            </div>
            <div className="text-sm text-gray-600">Avg Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {Math.max(...filteredStudents.map(s => s.currentPoints))}
            </div>
            <div className="text-sm text-gray-600">Highest Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {Math.min(...filteredStudents.map(s => s.currentPoints))}
            </div>
            <div className="text-sm text-gray-600">Lowest Points</div>
          </div>
        </div>
      )}
    </div>
  );
}
