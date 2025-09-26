import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Batch, PointUpdate, Student } from '../types';

interface WeeklyPointsTableProps {
  selectedBatchId: string;
  batches: Batch[];
}

interface StudentPointData {
  studentId: string;
  studentName: string;
  currentPoints: number;
  dailyPoints: { [date: string]: number };
  dailyReasons: { [date: string]: string[] };
}

interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  dates: string[];
}

export default function WeeklyPointsTable({ selectedBatchId, batches }: WeeklyPointsTableProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [pointUpdates, setPointUpdates] = useState<PointUpdate[]>([]);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Generate weeks from current month onwards
  useEffect(() => {
    const generateWeeks = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Start from the first day of current month
      const startDate = new Date(currentYear, currentMonth, 1);
      const weeks: WeekData[] = [];
      let weekNumber = 1;
      
      // Generate 12 weeks (3 months)
      for (let i = 0; i < 12; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (i * 7));
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const dates: string[] = [];
        for (let j = 0; j < 7; j++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + j);
          dates.push(date.toISOString().split('T')[0]);
        }
        
        weeks.push({
          weekNumber: weekNumber++,
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0],
          dates
        });
      }
      
      setWeeks(weeks);
    };
    
    generateWeeks();
  }, []);

  // Load students and point updates
  useEffect(() => {
    if (!selectedBatchId || !db) {
      setLoading(false);
      return;
    }

    const selectedBatch = batches.find(b => b.id === selectedBatchId);
    if (selectedBatch) {
      setStudents(selectedBatch.students || []);
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
      } as PointUpdate));
      setPointUpdates(updates);
      setLoading(false);
    }, (error) => {
      console.error('Error loading point updates:', error);
      setError('Failed to load point updates');
      setLoading(false);
    });

    return unsubscribe;
  }, [selectedBatchId, batches]);

  // Process student point data
  const getStudentPointData = (): StudentPointData[] => {
    return students.map(student => {
      const dailyPoints: { [date: string]: number } = {};
      const dailyReasons: { [date: string]: string[] } = {};
      
      // Initialize with current points
      const currentPoints = student.points || 100;
      
      // Process point updates for this student
      const studentUpdates = pointUpdates.filter(update => update.studentId === student.id);
      
      // Group updates by date
      studentUpdates.forEach(update => {
        const date = update.dateISO;
        if (!dailyPoints[date]) {
          dailyPoints[date] = 0;
          dailyReasons[date] = [];
        }
        dailyPoints[date] += update.pointsChange;
        dailyReasons[date].push(update.reason);
      });
      
      return {
        studentId: student.id,
        studentName: student.name,
        currentPoints,
        dailyPoints,
        dailyReasons
      };
    });
  };

  const getPointsForDate = (studentData: StudentPointData, date: string): { points: number; reasons: string[] } => {
    return {
      points: studentData.dailyPoints[date] || 0,
      reasons: studentData.dailyReasons[date] || []
    };
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getPointsColor = (points: number) => {
    if (points > 0) return 'text-green-600 bg-green-50';
    if (points < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-500 bg-gray-50';
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

  if (!selectedBatchId) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Please select a batch to view weekly points table.</p>
        </div>
      </div>
    );
  }

  const studentData = getStudentPointData();
  const currentWeek = weeks[selectedWeek];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Points Table</h2>
        
        {/* Week Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {weeks.map((week, index) => (
            <button
              key={week.weekNumber}
              onClick={() => setSelectedWeek(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedWeek === index
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week {week.weekNumber}
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(week.startDate)} - {formatDate(week.endDate)}
              </div>
            </button>
          ))}
        </div>

        {/* Current Week Info */}
        {currentWeek && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">
              Week {currentWeek.weekNumber} ({formatDate(currentWeek.startDate)} - {formatDate(currentWeek.endDate)})
            </h3>
            <p className="text-sm text-blue-700">
              Showing points updates for all students in this week
            </p>
          </div>
        )}
      </div>

      {error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Points
                </th>
                {currentWeek?.dates.map((date) => (
                  <th key={date} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    <div className="flex flex-col">
                      <span>{formatDate(date)}</span>
                      <span className="text-gray-400 font-normal">{date}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentData.map((student) => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {student.studentName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                      {student.currentPoints}
                    </span>
                  </td>
                  {currentWeek?.dates.map((date) => {
                    const dayData = getPointsForDate(student, date);
                    return (
                      <td key={date} className="px-3 py-4 text-center">
                        {dayData.points !== 0 ? (
                          <div className="space-y-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${getPointsColor(dayData.points)}`}>
                              {dayData.points > 0 ? '+' : ''}{dayData.points}
                            </span>
                            {dayData.reasons.length > 0 && (
                              <div className="text-xs text-gray-500 max-w-[80px] truncate" title={dayData.reasons.join(', ')}>
                                {dayData.reasons[0]}
                                {dayData.reasons.length > 1 && ` +${dayData.reasons.length - 1} more`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Statistics */}
      {studentData.length > 0 && currentWeek && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {studentData.length}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {studentData.reduce((sum, student) => {
                return sum + currentWeek.dates.reduce((daySum, date) => {
                  const dayData = getPointsForDate(student, date);
                  return daySum + (dayData.points > 0 ? dayData.points : 0);
                }, 0);
              }, 0)}
            </div>
            <div className="text-sm text-gray-600">Points Added This Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {Math.abs(studentData.reduce((sum, student) => {
                return sum + currentWeek.dates.reduce((daySum, date) => {
                  const dayData = getPointsForDate(student, date);
                  return daySum + (dayData.points < 0 ? dayData.points : 0);
                }, 0);
              }, 0))}
            </div>
            <div className="text-sm text-gray-600">Points Deducted This Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {currentWeek.dates.filter(date => 
                studentData.some(student => getPointsForDate(student, date).points !== 0)
              ).length}
            </div>
            <div className="text-sm text-gray-600">Active Days</div>
          </div>
        </div>
      )}
    </div>
  );
}
