'use client';

import React, { useEffect, useState } from 'react';
import { ModernFormBuilderLayout } from '../components/ModernFormBuilderLayout';
import { FormCaptureLanding } from '../components/FormCaptureLanding';
import { FieldConfig, FormData } from '../types/form';
import type { SavedForm } from '../components/SavedForms';

export default function FormBuilderPage() {
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<SavedForm | undefined>(undefined);

  useEffect(() => {
    const stored = localStorage.getItem('loadedForm');
    if (!stored) return;
    localStorage.removeItem('loadedForm');
    try {
      setEditingForm(JSON.parse(stored));
      setShowFormBuilder(true);
    } catch (error) {
      console.error('Failed to parse loaded form:', error);
    }
  }, []);

  const handleSubmit = (data: FormData) => {
    // For MVP: persist form data locally until backend is ready
    const submissions = JSON.parse(localStorage.getItem('submittedForms') || '[]');
    submissions.push({ id: Date.now(), data });
    localStorage.setItem('submittedForms', JSON.stringify(submissions));
  };

  const handleFieldsChange = (_fields: FieldConfig[]) => {
    // Placeholder for side-effects (e.g., analytics) – intentionally left blank
  };

  const handleStartBuilding = () => {
    setShowFormBuilder(true);
  };

  if (!showFormBuilder) {
    return (
      <FormCaptureLanding
        onStartBuilding={handleStartBuilding}
      />
    );
  }

  return (
    <ModernFormBuilderLayout
      editingForm={editingForm}
      onSubmit={handleSubmit}
      onFieldsChange={handleFieldsChange}
    />
  );
} 