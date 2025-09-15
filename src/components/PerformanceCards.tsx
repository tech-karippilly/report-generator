import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Batch, StudentPoints } from '../types';

interface PerformanceCardsProps {
  selectedBatchId: string;
  batches: Batch[];
}

interface StudentWithBatch extends StudentPoints {
  batchCode: string;
  groupName?: string;
}

export default function PerformanceCards({ selectedBatchId, batches }: PerformanceCardsProps) {
  const [allStudentPoints, setAllStudentPoints] = useState<StudentWithBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (batches.length === 0 || !db) {
      setLoading(false);
      return;
    }

    const loadAllStudentPoints = () => {
      const allPoints: StudentWithBatch[] = [];

      // Process each batch
      for (const batch of batches) {
        if (batch.students && batch.students.length > 0) {
          const batchStudents: StudentWithBatch[] = batch.students.map(student => ({
            studentId: student.id,
            studentName: student.name,
            currentPoints: student.points || 100,
            totalPointsEarned: 0,
            totalPointsLost: 0,
            lastUpdated: Date.now(),
            batchCode: batch.code,
            groupName: batch.groupName
          }));
          allPoints.push(...batchStudents);
        }
      }

      // Load point updates to calculate earned/lost points
      if (!db) return;
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

    return loadAllStudentPoints();
  }, [batches]);

  // Filter students based on selected batch
  const filteredStudents = allStudentPoints.filter(student => 
    selectedBatchId ? student.studentId === selectedBatchId : true
  );

  // Get top 3 performers
  const topPerformers = [...filteredStudents]
    .sort((a, b) => b.currentPoints - a.currentPoints)
    .slice(0, 3);

  // Get bottom 3 performers
  const bottomPerformers = [...filteredStudents]
    .sort((a, b) => a.currentPoints - b.currentPoints)
    .slice(0, 3);

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🏆</span>
          Top Performers
        </h3>
        <div className="space-y-3">
          {topPerformers.length === 0 ? (
            <p className="text-gray-500 text-sm">No students found</p>
          ) : (
            topPerformers.map((student, index) => (
              <div key={student.studentId} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getRankIcon(index)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{student.studentName}</p>
                    {!selectedBatchId && (
                      <p className="text-xs text-gray-500">{student.batchCode}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${getPointsColor(student.currentPoints)}`}>
                    {student.currentPoints}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    +{student.totalPointsEarned} / -{student.totalPointsLost}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lowest Performers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📉</span>
          Need Improvement
        </h3>
        <div className="space-y-3">
          {bottomPerformers.length === 0 ? (
            <p className="text-gray-500 text-sm">No students found</p>
          ) : (
            bottomPerformers.map((student, index) => (
              <div key={student.studentId} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{student.studentName}</p>
                    {!selectedBatchId && (
                      <p className="text-xs text-gray-500">{student.batchCode}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${getPointsColor(student.currentPoints)}`}>
                    {student.currentPoints}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    +{student.totalPointsEarned} / -{student.totalPointsLost}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
