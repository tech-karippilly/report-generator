import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Batch, Student, PointUpdate } from '../types';
import Button from './Button';
import Alert from './Alert';

interface AddPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: Batch[];
  onPointsUpdated: () => void;
}

interface PointEntry {
  id: string;
  pointsChange: number;
  reason: string;
  category?: string;
}

export default function AddPointsModal({ isOpen, onClose, batches, onPointsUpdated }: AddPointsModalProps) {
  const { currentUser } = useAuth();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [pointEntries, setPointEntries] = useState<PointEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Predefined point categories
  const pointCategories = [
    { label: 'Late Attendance', points: -5, reason: 'Arrived late to class' },
    { label: 'Active Participation', points: 10, reason: 'Actively participated in discussion' },
    { label: 'Excellent Answer', points: 15, reason: 'Gave excellent answer to question' },
    { label: 'Helping Others', points: 8, reason: 'Helped fellow students' },
    { label: 'Disruptive Behavior', points: -10, reason: 'Disrupted class with inappropriate behavior' },
    { label: 'Missing Assignment', points: -15, reason: 'Did not submit assigned work' },
    { label: 'Outstanding Performance', points: 20, reason: 'Exceptional performance in activity' },
    { label: 'Incomplete Work', points: -8, reason: 'Submitted incomplete work' },
    { label: 'Leadership', points: 12, reason: 'Showed leadership qualities' },
    { label: 'Absent', points: -20, reason: 'Absent from class without notice' }
  ];

  // Load students when batch is selected
  useEffect(() => {
    if (selectedBatchId) {
      const selectedBatch = batches.find(b => b.id === selectedBatchId);
      if (selectedBatch) {
        setStudents(selectedBatch.students || []);
      }
    } else {
      setStudents([]);
    }
    // Reset student selection and point entries when batch changes
    setSelectedStudentId('');
    setPointEntries([]);
  }, [selectedBatchId, batches]);

  // Reset point entries when student changes
  useEffect(() => {
    setPointEntries([]);
  }, [selectedStudentId]);

  const addPointEntry = (category: typeof pointCategories[0]) => {
    const newEntry: PointEntry = {
      id: Date.now().toString(),
      pointsChange: category.points,
      reason: category.reason,
      category: category.label
    };
    setPointEntries(prev => [...prev, newEntry]);
  };

  const updatePointEntry = (id: string, field: 'pointsChange' | 'reason', value: string | number) => {
    setPointEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { ...entry, [field]: value }
        : entry
    ));
  };

  const removePointEntry = (id: string) => {
    setPointEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const addCustomPointEntry = () => {
    const newEntry: PointEntry = {
      id: Date.now().toString(),
      pointsChange: 0,
      reason: '',
      category: 'Custom'
    };
    setPointEntries(prev => [...prev, newEntry]);
  };

  const handleSave = async () => {
    if (!selectedBatchId || !selectedStudentId || !currentUser) {
      setError('Please select a batch, student, and ensure you are logged in');
      return;
    }

    const validEntries = pointEntries.filter(entry => entry.pointsChange !== 0 && entry.reason.trim());
    if (validEntries.length === 0) {
      setError('Please add at least one point entry with a reason');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const selectedBatch = batches.find(b => b.id === selectedBatchId);
      const selectedStudent = students.find(s => s.id === selectedStudentId);
      if (!selectedBatch || !selectedStudent || !db) {
        throw new Error('Batch or student not found or database not available');
      }

      // Calculate total points change
      const totalPointsChange = validEntries.reduce((sum, entry) => sum + entry.pointsChange, 0);

      // Save each point entry as a separate update
      for (const entry of validEntries) {
        const pointUpdate: Omit<PointUpdate, 'id'> = {
          studentId: selectedStudentId,
          studentName: selectedStudent.name,
          batchId: selectedBatchId,
          batchCode: selectedBatch.code,
          pointsChange: entry.pointsChange,
          reason: entry.reason.trim(),
          updatedBy: currentUser.email || 'Unknown',
          dateISO: selectedDate,
          createdAt: Date.now()
        };

        await addDoc(collection(db, 'pointUpdates'), pointUpdate);
      }

      // Update student points in the batch
      const updatedStudents = selectedBatch.students.map(student => {
        if (student.id === selectedStudentId) {
          return {
            ...student,
            points: (student.points || 100) + totalPointsChange
          };
        }
        return student;
      });

      await updateDoc(doc(db, 'batches', selectedBatchId), {
        students: updatedStudents
      });

      setSuccess(`Points updated successfully for ${selectedStudent.name}! Total change: ${totalPointsChange >= 0 ? '+' : ''}${totalPointsChange}. You can now select another student or close the modal.`);
      onPointsUpdated();
      
      // Reset form for next student (don't close modal)
      setPointEntries([]);
      setSelectedStudentId('');

      setTimeout(() => {
        setSuccess('');
      }, 5000);

    } catch (error) {
      console.error('Error updating points:', error);
      setError('Failed to update points. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setPointEntries([]);
    setSelectedStudentId('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add Points</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && <Alert tone="error">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}

          {/* Batch, Date, and Student Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.code} {batch.groupName && `- ${batch.groupName}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Student
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!selectedBatchId}
              >
                <option value="">Choose a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} (Current: {student.points || 100} pts)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Point Categories */}
          {selectedStudentId && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Add Points
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {pointCategories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => addPointEntry(category)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        category.points > 0
                          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                          : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      <div className="font-bold">
                        {category.points > 0 ? '+' : ''}{category.points}
                      </div>
                      <div className="text-xs mt-1">{category.label}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    onClick={addCustomPointEntry}
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    + Add Custom Entry
                  </button>
                </div>
              </div>

              {/* Point Entries */}
              {pointEntries.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Point Entries for {students.find(s => s.id === selectedStudentId)?.name}
                  </h3>
                  <div className="space-y-3">
                    {pointEntries.map((entry) => (
                      <div key={entry.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            {entry.category}
                          </span>
                          <button
                            onClick={() => removePointEntry(entry.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Points Change
                            </label>
                            <input
                              type="number"
                              value={entry.pointsChange}
                              onChange={(e) => updatePointEntry(entry.id, 'pointsChange', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Reason
                            </label>
                            <input
                              type="text"
                              value={entry.reason}
                              onChange={(e) => updatePointEntry(entry.id, 'reason', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter reason for this point change"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total Summary */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total Points Change:</span>
                      <span className={`text-lg font-bold ${
                        pointEntries.reduce((sum, entry) => sum + entry.pointsChange, 0) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {pointEntries.reduce((sum, entry) => sum + entry.pointsChange, 0) >= 0 ? '+' : ''}
                        {pointEntries.reduce((sum, entry) => sum + entry.pointsChange, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <div className="text-sm text-gray-500">
            💡 Tip: After saving points for one student, you can select another student to continue adding points.
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isSaving}
            >
              Close Modal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !selectedBatchId || !selectedStudentId || pointEntries.length === 0}
            >
              {isSaving ? 'Saving...' : 'Save Points'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
