import { useState } from "react";
import type { Batch } from "../types";
import BatchList from "../components/BatchList";
import BatchForm from "../components/BatchForm";

export default function BatchesPage() {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const handleCreateNew = () => {
    setEditingBatch(null);
    setCurrentView('create');
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setCurrentView('edit');
  };

  const handleSave = () => {
    setCurrentView('list');
    setEditingBatch(null);
  };

  const handleCancel = () => {
    setCurrentView('list');
    setEditingBatch(null);
  };

  if (currentView === 'list') {
    return <BatchList onEdit={handleEdit} onCreateNew={handleCreateNew} />;
  }

  return (
    <BatchForm
      batch={editingBatch}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}


