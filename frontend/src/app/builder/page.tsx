'use client';

import React, { useEffect, useState } from 'react';
import { ModernFormBuilderLayout } from '../components/ModernFormBuilderLayout';
import { FormCaptureLanding } from '../components/FormCaptureLanding';
import type { SavedForm } from '../types/saved-form';

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

  const handleStartBuilding = () => {
    setShowFormBuilder(true);
  };

  if (!showFormBuilder) {
    return <FormCaptureLanding onStartBuilding={handleStartBuilding} />;
  }

  return <ModernFormBuilderLayout editingForm={editingForm} />;
}
