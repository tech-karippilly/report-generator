import { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import type { Batch } from '../types';
import { db, isFirebaseConfigured } from '../firebase';
import Button from './Button';
import Alert from './Alert';

interface BatchListProps {
  onEdit: (batch: Batch) => void;
  onCreateNew: () => void;
}

export default function BatchList({ onEdit, onCreateNew }: BatchListProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    
    const unsub = onSnapshot(
      collection(db, "batches"),
      (snap) => {
        const list: Batch[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setBatches(list);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setError(`Error loading batches: ${(err as any)?.message ?? "Failed to load"}`);
      }
    );
    return () => unsub();
  }, []);

  const filteredBatches = batches.filter(batch =>
    batch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.trainers.some(trainer => 
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBatches = filteredBatches.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    if (!db) return;
    
    try {
      await deleteDoc(doc(db, "batches", id));
    } catch (error) {
      setError('Failed to delete batch');
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="space-y-4">
        <Alert tone="warning">Create a .env.local with your VITE_FIREBASE_* values, then restart the dev server.</Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading batches...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Batch List</h2>
        <Button variant="primary" onClick={onCreateNew}>
          Create New Batch
        </Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search batches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trainer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinators
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{batch.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{batch.groupName || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {batch.trainers.length > 0 ? batch.trainers[0].name : '-'}
                      {batch.trainers.length > 1 && (
                        <span className="text-gray-500"> +{batch.trainers.length - 1} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{batch.students.length}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{batch.coordinators.length}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="primary"
                        className="text-xs px-3 py-1"
                        onClick={() => onEdit(batch)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="text-xs px-3 py-1"
                        onClick={() => handleDelete(batch.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedBatches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm ? 'No batches found matching your search.' : 'No batches created yet.'}
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBatches.length)} of {filteredBatches.length} batches
            </div>
            <div className="flex space-x-2">
              <Button
                variant="primary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1"
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="primary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
