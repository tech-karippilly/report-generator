import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Batch, Student, PointUpdate, WeeklyBestPerformer } from '../types';
import Button from '../components/Button';
import Alert from '../components/Alert';
import AddPointsModal from '../components/AddPointsModal';

// Utility functions for week calculations (Monday to Saturday)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

const getWeekEnd = (date: Date): Date => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 5); // Saturday is 5 days after Monday
  return end;
};

const getWeekNumber = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export default function PointSystemPage() {
  const { currentUser } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [pointUpdates, setPointUpdates] = useState<PointUpdate[]>([]);
  const [weeklyBestPerformers, setWeeklyBestPerformers] = useState<WeeklyBestPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form state for updating points
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [pointsChange, setPointsChange] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddPointsModal, setShowAddPointsModal] = useState(false);

  // Load batches
  useEffect(() => {
    if (!db) return;
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
      setPointUpdates([]);
      return;
    }

    const selectedBatch = batches.find(b => b.id === selectedBatchId);
    if (selectedBatch) {
      setStudents(selectedBatch.students || []);

      // Load point updates for this batch
      if (!db) return;
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

  // Load weekly best performers
  useEffect(() => {
    if (!db) return;

    const weeklyQuery = query(
      collection(db, 'weeklyBestPerformers'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(weeklyQuery, (snapshot) => {
      const performers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WeeklyBestPerformer));
      setWeeklyBestPerformers(performers);
    }, (error) => {
      console.error('Error loading weekly best performers:', error);
    });

    return unsubscribe;
  }, []);

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
      if (!db) throw new Error('Database not available');
      await addDoc(collection(db, 'pointUpdates'), pointUpdate);

      // Update student's current points in the batch
      const studentIndex = selectedBatch.students.findIndex(s => s.id === selectedStudentId);
      if (studentIndex !== -1) {
        const updatedStudents = [...selectedBatch.students];
        updatedStudents[studentIndex] = {
          ...updatedStudents[studentIndex],
          points: (updatedStudents[studentIndex].points || 100) + pointsChangeNum
        };

        if (!db) throw new Error('Database not available');
        await updateDoc(doc(db, 'batches', selectedBatchId), {
          students: updatedStudents
        });
      }

      // Update local students state
      setStudents(prev => prev.map(student => 
        student.id === selectedStudentId 
          ? {
              ...student,
              points: (student.points || 100) + pointsChangeNum
            }
          : student
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

  // Function to reset points only (without saving best performer)
  const resetPointsOnly = async () => {
    if (!selectedBatchId || !currentUser || !db) {
      setError('Please select a batch and ensure you are logged in');
      return;
    }

    const selectedBatch = batches.find(b => b.id === selectedBatchId);
    if (!selectedBatch || students.length === 0) {
      setError('No students found in this batch');
      return;
    }

    try {
      // Reset all student points to 100
      const resetStudents = students.map(student => ({
        ...student,
        points: 100
      }));

      await updateDoc(doc(db, 'batches', selectedBatchId), {
        students: resetStudents
      });

      // Update local state
      setStudents(resetStudents);

      setSuccess('All student points have been reset to 100!');
      
      setTimeout(() => setSuccess(''), 5000);

    } catch (error) {
      console.error('Error resetting points:', error);
      setError('Failed to reset points. Please try again.');
    }
  };

  // Function to save weekly best performer and reset points
  const saveWeeklyBestPerformerAndReset = async () => {
    if (!selectedBatchId || !currentUser || !db) {
      setError('Please select a batch and ensure you are logged in');
      return;
    }

    const selectedBatch = batches.find(b => b.id === selectedBatchId);
    if (!selectedBatch || students.length === 0) {
      setError('No students found in this batch');
      return;
    }

    try {
      // Find the best performer
      const bestStudent = students.reduce((best, current) => 
        (current.points || 100) > (best.points || 100) ? current : best
      );

      // Calculate week information
      const now = new Date();
      const weekStart = getWeekStart(now);
      const weekEnd = getWeekEnd(now);
      const weekNumber = getWeekNumber(now);

      // Calculate points earned and lost for the week
      const weekStartDate = formatDate(weekStart);
      const weekEndDate = formatDate(weekEnd);
      
      const weekUpdates = pointUpdates.filter(update => 
        update.dateISO >= weekStartDate && update.dateISO <= weekEndDate
      );

      const studentUpdates = weekUpdates.filter(update => update.studentId === bestStudent.id);
      const pointsEarned = studentUpdates
        .filter(update => update.pointsChange > 0)
        .reduce((sum, update) => sum + update.pointsChange, 0);
      const pointsLost = Math.abs(studentUpdates
        .filter(update => update.pointsChange < 0)
        .reduce((sum, update) => sum + update.pointsChange, 0));

      // Create weekly best performer record
      const weeklyBestPerformer: Omit<WeeklyBestPerformer, 'id'> = {
        weekStartDate,
        weekEndDate,
        weekNumber,
        batchId: selectedBatchId,
        batchCode: selectedBatch.code,
        bestPerformer: {
          studentId: bestStudent.id,
          studentName: bestStudent.name,
          finalPoints: bestStudent.points || 100,
          pointsEarned,
          pointsLost
        },
        totalStudents: students.length,
        averagePoints: Math.round(students.reduce((sum, s) => sum + (s.points || 100), 0) / students.length),
        createdAt: Date.now(),
        createdBy: currentUser.email || 'Unknown'
      };

      // Save to Firestore
      await addDoc(collection(db, 'weeklyBestPerformers'), weeklyBestPerformer);

      // Reset all student points to 100
      const resetStudents = students.map(student => ({
        ...student,
        points: 100
      }));

      await updateDoc(doc(db, 'batches', selectedBatchId), {
        students: resetStudents
      });

      // Update local state
      setStudents(resetStudents);

      setSuccess(`Weekly best performer saved! ${bestStudent.name} won with ${bestStudent.points || 100} points. All points reset to 100.`);
      
      setTimeout(() => setSuccess(''), 5000);

    } catch (error) {
      console.error('Error saving weekly best performer:', error);
      setError('Failed to save weekly best performer. Please try again.');
    }
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
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-end mt-4 sm:mt-0">
              <Button
                onClick={resetPointsOnly}
                className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white text-lg"
                disabled={!selectedBatchId || students.length === 0}
              >
                🔄 Reset Points
              </Button>
              <Button
                onClick={() => setShowAddPointsModal(true)}
                className="px-6 py-3 text-lg"
              >
                + Add Points
              </Button>
            </div>
          </div>
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

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

            {/* Weekly Best Performer Section */}
            {selectedBatchId && students.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Weekly Best Performer</h2>
                  <div className="text-sm text-gray-500">
                    Week {getWeekNumber(new Date())} ({formatDate(getWeekStart(new Date()))} - {formatDate(getWeekEnd(new Date()))})
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Best Performer */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Current Week Leader</h3>
                    {(() => {
                      const bestStudent = students.reduce((best, current) => 
                        (current.points || 100) > (best.points || 100) ? current : best
                      );
                      return (
                        <div>
                          <div className="text-2xl font-bold text-yellow-900">{bestStudent.name}</div>
                          <div className="text-lg text-yellow-700">{bestStudent.points || 100} points</div>
                          <div className="text-sm text-yellow-600 mt-1">
                            {bestStudent.email}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 items-center justify-center">
                    <Button
                      onClick={saveWeeklyBestPerformerAndReset}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold"
                    >
                      🏆 Save Best Performer & Reset Points
                    </Button>
                    <Button
                      onClick={resetPointsOnly}
                      className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-lg font-semibold"
                    >
                      🔄 Reset Points Only
                    </Button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> 
                    <br />• <strong>Save Best Performer & Reset Points:</strong> Saves the current week's winner and resets all points to 100
                    <br />• <strong>Reset Points Only:</strong> Just resets all student points to 100 without saving winner
                    <br />• Week runs from Monday to Saturday
                  </p>
                </div>
              </div>
            )}

            {selectedBatchId && (
              <>
                {/* Students Points Display */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Student Points</h2>
                    <div className="text-sm text-gray-500">
                      {students.length} students in this batch
                    </div>
                  </div>
                  
                  {students.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No students found in this batch.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {students
                        .sort((a, b) => (b.points || 100) - (a.points || 100))
                        .map((student, index) => (
                        <div key={student.id} className={`rounded-lg p-4 border hover:shadow-md transition-shadow ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' :
                          index === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300' :
                          index === 2 ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                index === 0 ? 'bg-yellow-500 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-orange-600 text-white' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                                {index + 1}
                              </span>
                              <h3 className="font-medium text-gray-900">{student.name}</h3>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${getPointsColor(student.points || 100)}`}>
                              {student.points || 100} pts
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Email:</span>
                              <span className="text-gray-900">{student.email}</span>
                            </div>
                            {student.phone && (
                              <div className="flex justify-between">
                                <span>Phone:</span>
                                <span className="text-gray-900">{student.phone}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                index === 1 ? 'bg-gray-100 text-gray-800' :
                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                (student.points || 100) >= 80 
                                  ? 'bg-green-100 text-green-800' 
                                  : (student.points || 100) >= 60 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {index === 0 ? '🥇 1st Place' :
                                 index === 1 ? '🥈 2nd Place' :
                                 index === 2 ? '🥉 3rd Place' :
                                 (student.points || 100) >= 80 ? 'Excellent' : 
                                 (student.points || 100) >= 60 ? 'Good' : 'Needs Improvement'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Batch Summary */}
                {students.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Batch Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                        <div className="text-sm text-blue-700">Total Students</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(students.reduce((sum, s) => sum + (s.points || 100), 0) / students.length)}
                        </div>
                        <div className="text-sm text-green-700">Average Points</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {Math.max(...students.map(s => s.points || 100))}
                        </div>
                        <div className="text-sm text-yellow-700">Highest Points</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {Math.min(...students.map(s => s.points || 100))}
                        </div>
                        <div className="text-sm text-red-700">Lowest Points</div>
                      </div>
                    </div>
                  </div>
                )}

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

            {/* Weekly Best Performers History */}
            {selectedBatchId && weeklyBestPerformers.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous Week Winners</h2>
                <div className="space-y-4">
                  {weeklyBestPerformers
                    .filter(wbp => wbp.batchId === selectedBatchId)
                    .sort((a, b) => b.weekNumber - a.weekNumber)
                    .slice(0, 5)
                    .map((wbp) => (
                      <div key={wbp.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-bold text-purple-900">🏆 {wbp.bestPerformer.studentName}</span>
                              <span className="text-sm text-purple-600">Week {wbp.weekNumber}</span>
                            </div>
                            <div className="text-sm text-purple-700">
                              {wbp.weekStartDate} to {wbp.weekEndDate}
                            </div>
                            <div className="text-sm text-purple-600 mt-1">
                              Final Points: {wbp.bestPerformer.finalPoints} | 
                              Earned: +{wbp.bestPerformer.pointsEarned} | 
                              Lost: -{wbp.bestPerformer.pointsLost}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-900">{wbp.bestPerformer.finalPoints}</div>
                            <div className="text-sm text-purple-600">points</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </>

        {/* Add Points Modal */}
        <AddPointsModal
          isOpen={showAddPointsModal}
          onClose={() => setShowAddPointsModal(false)}
          batches={batches}
          onPointsUpdated={() => {
            // Refresh the current view
            setSuccess('Points updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      </div>
    </div>
  );
}