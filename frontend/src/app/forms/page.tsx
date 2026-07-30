'use client';

import React from 'react';
// @ts-ignore – Typings for react-hot-toast available in dev deps
import { toast, Toaster } from 'react-hot-toast';
import { SavedFormsLibrary } from '../components/SavedFormsLibrary';
import type { SavedForm } from '../components/SavedFormsLibrary';
import { FormPreviewModal } from '../components/FormPreviewModal';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SavedFormsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [previewForm, setPreviewForm] = React.useState<SavedForm | null>(null);
  // Bumped after any mutation to force SavedFormsLibrary to remount and refetch
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleLoadForm = (form: SavedForm) => {
    localStorage.setItem('loadedForm', JSON.stringify(form));
    router.push('/builder?from=saved');
  };

  const handleDuplicateForm = async (form: SavedForm) => {
    if (!token) return;
    try {
      const response = await fetch('/api/v1/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          title: `${form.title} (Kopie)`,
          description: form.description,
          structure: { fields: form.fields, steps: form.steps, isMultiStep: form.isMultiStep, tags: form.tags },
          status: 'draft',
          isTemplate: true,
        }),
      });
      if (!response.ok) throw new Error('Failed to duplicate form');
      toast.success('Formular dupliziert.');
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error('Formular konnte nicht dupliziert werden.');
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/v1/forms/${formId}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
      if (!response.ok) throw new Error('Failed to delete form');
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Formular konnte nicht gelöscht werden.');
    }
  };

  const handleStatusChange = async (formId: string, newStatus: 'draft' | 'published' | 'archived') => {
    if (!token) return;
    try {
      const response = await fetch(`/api/v1/forms/${formId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Status konnte nicht aktualisiert werden.');
    }
  };

  const handlePreviewForm = (form: SavedForm) => {
    setPreviewForm(form);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Toaster position="top-right" />
      <div className="flex-1">
        <SavedFormsLibrary
          key={refreshKey}
          onLoadForm={handleLoadForm}
          onDuplicateForm={handleDuplicateForm}
          onDeleteForm={handleDeleteForm}
          onPreviewForm={handlePreviewForm}
          onStatusChange={handleStatusChange}
        />
        <FormPreviewModal
          isOpen={!!previewForm}
          form={previewForm}
          onClose={() => setPreviewForm(null)}
        />
      </div>
    </div>
  );
}
