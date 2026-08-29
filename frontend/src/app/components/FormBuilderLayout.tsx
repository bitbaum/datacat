'use client';

import React, { useState } from 'react';
import { FormBuilderSidebar } from './FormBuilderSidebar';
import { FieldConfig, FormData } from '../types/form';

interface FormBuilderLayoutProps {
  children: React.ReactNode;
  onAddField: (field: FieldConfig) => void;
  onSaveTemplate: () => void;
  onSaveDraft: () => void;
  onManageGroups: () => void;
  canSubmit: boolean;
}

export function FormBuilderLayout({
  children,
  onAddField,
  onSaveTemplate,
  onSaveDraft,
  onManageGroups,
  canSubmit,
}: FormBuilderLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData('text/plain');

    if (fieldType) {
      const fieldNames = {
        text: 'Textfeld',
        email: 'E-Mail',
        tel: 'Telefon',
        date: 'Datum',
        select: 'Auswahl',
        textarea: 'Textbereich',
      };

      const fieldConfig: FieldConfig = {
        id: `drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: fieldType as FieldConfig['type'],
        name: `${fieldNames[fieldType as keyof typeof fieldNames]?.toLowerCase().replace(/[^a-z]/g, '_') || fieldType}_${Date.now()}`,
        label: fieldNames[fieldType as keyof typeof fieldNames] || fieldType,
        required: false,
        placeholder:
          fieldType === 'select'
            ? undefined
            : `${fieldNames[fieldType as keyof typeof fieldNames]} eingeben...`,
        options:
          fieldType === 'select'
            ? [
                { value: '', label: 'Auswahl treffen' },
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
              ]
            : undefined,
        rows: fieldType === 'textarea' ? 3 : undefined,
      };

      onAddField(fieldConfig);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <FormBuilderSidebar
        onAddField={onAddField}
        onSaveTemplate={onSaveTemplate}
        onSaveDraft={onSaveDraft}
        onManageGroups={onManageGroups}
        canSubmit={canSubmit}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}
      >
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Formular-Editor</h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Erstellen Sie Ihr individuelles Formular
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Felder hinzufügen: Sidebar öffnen oder per Drag & Drop
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6" onDrop={handleDrop} onDragOver={handleDragOver}>
          <div className="max-w-4xl mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
