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

interface StudentPointUpdate {
  studentId: string;
  studentName: string;
  pointsChange: number;
  reason: string;
}

export default function AddPointsModal({ isOpen, onClose, batches, onPointsUpdated }: AddPointsModalProps) {
  const { currentUser } = useAuth();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentUpdates, setStudentUpdates] = useState<StudentPointUpdate[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load students when batch is selected
  useEffect(() => {
    if (selectedBatchId) {
      const selectedBatch = batches.find(b => b.id === selectedBatchId);
      if (selectedBatch) {
        setStudents(selectedBatch.students || []);
        // Initialize student updates
        const initialUpdates: StudentPointUpdate[] = (selectedBatch.students || []).map(student => ({
          studentId: student.id,
          studentName: student.name,
          pointsChange: 0,
          reason: ''
        }));
        setStudentUpdates(initialUpdates);
      }
    } else {
      setStudents([]);
      setStudentUpdates([]);
    }
  }, [selectedBatchId, batches]);

  const handlePointsChange = (studentId: string, pointsChange: number) => {
    setStudentUpdates(prev => prev.map(update => 
      update.studentId === studentId 
        ? { ...update, pointsChange }
        : update
    ));
  };

  const handleReasonChange = (studentId: string, reason: string) => {
    setStudentUpdates(prev => prev.map(update => 
      update.studentId === studentId 
        ? { ...update, reason }
        : update
    ));
  };

  const handleSave = async () => {
    if (!selectedBatchId || !currentUser) {
      setError('Please select a batch and ensure you are logged in');
      return;
    }

    const updatesToSave = studentUpdates.filter(update => update.pointsChange !== 0 && update.reason.trim());
    if (updatesToSave.length === 0) {
      setError('Please add at least one point update with a reason');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const selectedBatch = batches.find(b => b.id === selectedBatchId);
      if (!selectedBatch || !db) {
        throw new Error('Batch not found or database not available');
      }

      // Save each point update
      for (const update of updatesToSave) {
        const pointUpdate: Omit<PointUpdate, 'id'> = {
          studentId: update.studentId,
          studentName: update.studentName,
          batchId: selectedBatchId,
          batchCode: selectedBatch.code,
          pointsChange: update.pointsChange,
          reason: update.reason.trim(),
          updatedBy: currentUser.email || 'Unknown',
          dateISO: selectedDate,
          createdAt: Date.now()
        };

        await addDoc(collection(db, 'pointUpdates'), pointUpdate);
      }

      // Update student points in the batch
      const updatedStudents = selectedBatch.students.map(student => {
        const update = updatesToSave.find(u => u.studentId === student.id);
        if (update) {
          return {
            ...student,
            points: (student.points || 100) + update.pointsChange
          };
        }
        return student;
      });

      await updateDoc(doc(db, 'batches', selectedBatchId), {
        students: updatedStudents
      });

      setSuccess('Points updated successfully!');
      onPointsUpdated();
      
      // Reset form
      setStudentUpdates(prev => prev.map(update => ({
        ...update,
        pointsChange: 0,
        reason: ''
      })));

      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error updating points:', error);
      setError('Failed to update points. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStudentUpdates(prev => prev.map(update => ({
      ...update,
      pointsChange: 0,
      reason: ''
    })));
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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

          {/* Batch and Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
          </div>

          {/* Students Points Update Table */}
          {selectedBatchId && students.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Update Points for Students
              </h3>
              
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
                        Points Change
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => {
                      const update = studentUpdates.find(u => u.studentId === student.id);
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.points || 100}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={update?.pointsChange || 0}
                              onChange={(e) => handlePointsChange(student.id, parseInt(e.target.value) || 0)}
                              placeholder="+10 or -5"
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={update?.reason || ''}
                              onChange={(e) => handleReasonChange(student.id, e.target.value)}
                              placeholder="Reason for change"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !selectedBatchId}
          >
            {isSaving ? 'Saving...' : 'Save Points'}
          </Button>
        </div>
      </div>
    </div>
  );
}
