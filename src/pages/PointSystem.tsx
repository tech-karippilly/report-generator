import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Batch, Student, PointUpdate, StudentPoints } from '../types';
import Button from '../components/Button';
import Alert from '../components/Alert';
import PointsReport from '../components/PointsReport';

export default function PointSystemPage() {
  const { currentUser } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [studentPoints, setStudentPoints] = useState<StudentPoints[]>([]);
  const [pointUpdates, setPointUpdates] = useState<PointUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form state for updating points
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [pointsChange, setPointsChange] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentView, setCurrentView] = useState<'manage' | 'report'>('manage');

  // Load batches
  useEffect(() => {
    const q = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const batchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Batch));
      setBatches(batchesData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading batches:', error);
      setError('Failed to load batches');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load students and their points when batch is selected
  useEffect(() => {
    if (!selectedBatchId) {
      setStudents([]);
      setStudentPoints([]);
      setPointUpdates([]);
      return;
    }

    const selectedBatch = batches.find(b => b.id === selectedBatchId);
    if (selectedBatch) {
      setStudents(selectedBatch.students || []);
      
      // Initialize student points (default to 100 if not set)
      const initialPoints: StudentPoints[] = (selectedBatch.students || []).map(student => ({
        studentId: student.id,
        studentName: student.name,
        currentPoints: student.points || 100,
        totalPointsEarned: 0,
        totalPointsLost: 0,
        lastUpdated: Date.now()
      }));
      setStudentPoints(initialPoints);

      // Load point updates for this batch
      const updatesQuery = query(
        collection(db, 'pointUpdates'),
        where('batchId', '==', selectedBatchId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(updatesQuery, (snapshot) => {
        const updates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PointUpdate));
        setPointUpdates(updates);
      }, (error) => {
        console.error('Error loading point updates:', error);
        setError('Failed to load point updates');
      });

      return unsubscribe;
    }
  }, [selectedBatchId, batches]);

  const handleUpdatePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentId || !pointsChange || !reason.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const pointsChangeNum = parseInt(pointsChange);
    if (isNaN(pointsChangeNum) || pointsChangeNum === 0) {
      setError('Points change must be a non-zero number');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to update points');
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      const selectedStudent = students.find(s => s.id === selectedStudentId);
      if (!selectedStudent) {
        throw new Error('Student not found');
      }

      const selectedBatch = batches.find(b => b.id === selectedBatchId);
      if (!selectedBatch) {
        throw new Error('Batch not found');
      }

      // Create point update record
      const pointUpdate: Omit<PointUpdate, 'id'> = {
        studentId: selectedStudentId,
        studentName: selectedStudent.name,
        batchId: selectedBatchId,
        batchCode: selectedBatch.code,
        pointsChange: pointsChangeNum,
        reason: reason.trim(),
        updatedBy: currentUser.email || 'Unknown',
        dateISO: new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      };

      // Add point update to Firestore
      await addDoc(collection(db, 'pointUpdates'), pointUpdate);

      // Update student's current points in the batch
      const studentIndex = selectedBatch.students.findIndex(s => s.id === selectedStudentId);
      if (studentIndex !== -1) {
        const updatedStudents = [...selectedBatch.students];
        updatedStudents[studentIndex] = {
          ...updatedStudents[studentIndex],
          points: (updatedStudents[studentIndex].points || 100) + pointsChangeNum
        };

        await updateDoc(doc(db, 'batches', selectedBatchId), {
          students: updatedStudents
        });
      }

      // Update local state
      setStudentPoints(prev => prev.map(sp => 
        sp.studentId === selectedStudentId 
          ? {
              ...sp,
              currentPoints: sp.currentPoints + pointsChangeNum,
              totalPointsEarned: pointsChangeNum > 0 ? sp.totalPointsEarned + pointsChangeNum : sp.totalPointsEarned,
              totalPointsLost: pointsChangeNum < 0 ? sp.totalPointsLost + Math.abs(pointsChangeNum) : sp.totalPointsLost,
              lastUpdated: Date.now()
            }
          : sp
      ));

      setSuccess(`Points ${pointsChangeNum > 0 ? 'added' : 'removed'} successfully!`);
      setPointsChange('');
      setReason('');
      setSelectedStudentId('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error updating points:', error);
      setError('Failed to update points. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPointsColor = (points: number) => {
    if (points >= 80) return 'text-green-600';
    if (points >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Point System</h1>
              <p className="text-gray-600">Monitor and update student points based on their performance</p>
            </div>
            
            {/* View Toggle */}
            <div className="flex mt-4 sm:mt-0">
              <div className="bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentView('manage')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'manage'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Manage Points
                </button>
                <button
                  onClick={() => setCurrentView('report')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'report'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Points Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {currentView === 'report' ? (
          <PointsReport selectedBatchId={selectedBatchId} batches={batches} />
        ) : (
          <>
            {/* Batch Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Batch</h2>
          <div className="flex flex-wrap gap-4">
            {batches.map((batch) => (
              <button
                key={batch.id}
                onClick={() => setSelectedBatchId(batch.id)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedBatchId === batch.id
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {batch.code}
                {batch.groupName && ` - ${batch.groupName}`}
              </button>
            ))}
          </div>
        </div>

        {selectedBatchId && (
          <>
            {/* Students Points Display */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Points</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Earned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Lost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentPoints.map((student) => (
                      <tr key={student.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.studentName}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${getPointsColor(student.currentPoints)}`}>
                          {student.currentPoints}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          +{student.totalPointsEarned}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          -{student.totalPointsLost}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(student.lastUpdated).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Update Points Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Points</h2>
              <form onSubmit={handleUpdatePoints} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Student
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose a student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points Change
                    </label>
                    <input
                      type="number"
                      value={pointsChange}
                      onChange={(e) => setPointsChange(e.target.value)}
                      placeholder="e.g., +10 or -5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use positive numbers to add points, negative to subtract
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., Good participation in class"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="px-6 py-2"
                  >
                    {isUpdating ? 'Updating...' : 'Update Points'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Point Updates History */}
            {pointUpdates.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Point Updates</h2>
                <div className="space-y-3">
                  {pointUpdates.slice(0, 10).map((update) => (
                    <div key={update.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{update.studentName}</span>
                          <span className={`text-sm font-bold ${
                            update.pointsChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {update.pointsChange > 0 ? '+' : ''}{update.pointsChange}
                          </span>
                          <span className="text-sm text-gray-500">points</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{update.reason}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(update.createdAt).toLocaleString()} by {update.updatedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
