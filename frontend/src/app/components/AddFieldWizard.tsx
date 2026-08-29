'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { FormField } from './FormField';
import { FieldTypeSelector } from './FieldTypeSelector';
import { FieldConfig } from '../types/form';

interface AddFieldWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAddField: (field: FieldConfig) => void;
  availableGroups: string[];
  className?: string;
}

export function AddFieldWizard({
  isOpen,
  onClose,
  onAddField,
  availableGroups,
  className = '',
}: AddFieldWizardProps) {
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [fieldType, setFieldType] = useState<string>('');
  const [fieldData, setFieldData] = useState({
    label: '',
    placeholder: '',
    required: false,
    group: '',
  });

  const handleTypeSelect = (type: string) => {
    setFieldType(type);
    setStep('details');
  };

  const handleBack = () => {
    setStep('type');
  };

  const handleAddField = () => {
    if (!fieldData.label.trim()) return;

    const newField: FieldConfig = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType as FieldConfig['type'],
      name: fieldData.label.toLowerCase().replace(/\s+/g, '_'),
      label: fieldData.label.trim(),
      required: fieldData.required,
      placeholder: fieldData.placeholder.trim() || undefined,
      group: fieldData.group.trim() || undefined,
      options:
        fieldType === 'select'
          ? [
              { value: '', label: `${fieldData.label} auswählen` },
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
            ]
          : undefined,
      rows: fieldType === 'textarea' ? 3 : undefined,
    };

    onAddField(newField);
    handleClose();
  };

  const handleClose = () => {
    setStep('type');
    setFieldType('');
    setFieldData({
      label: '',
      placeholder: '',
      required: false,
      group: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Text',
      email: 'E-Mail',
      tel: 'Telefon',
      date: 'Datum',
      select: 'Auswahl',
      textarea: 'Textbereich',
    };
    return labels[type] || type;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 animate-scale-in ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Neues Feld hinzufügen
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {step === 'type'
                    ? 'Wählen Sie einen Feldtyp'
                    : `${getFieldTypeLabel(fieldType)}-Feld konfigurieren`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mt-4 flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'type' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
              }`}
            >
              {step === 'type' ? '1' : '✓'}
            </div>
            <div
              className={`flex-1 h-1 rounded-full ${
                step === 'details' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'details'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 'type' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Welche Art von Feld möchten Sie hinzufügen?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Wählen Sie den passenden Feldtyp für Ihre Daten aus.
                </p>
              </div>

              <FieldTypeSelector onSelect={handleTypeSelect} selectedType={fieldType} />
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {getFieldTypeLabel(fieldType)}-Feld wird erstellt
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Geben Sie die Details für Ihr neues Feld ein.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  type="text"
                  id="fieldLabel"
                  name="fieldLabel"
                  label="Feldbezeichnung"
                  value={fieldData.label}
                  onChange={(e) => setFieldData((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="z.B. Vollständiger Name"
                  required
                />

                <FormField
                  type="text"
                  id="fieldPlaceholder"
                  name="fieldPlaceholder"
                  label="Platzhaltertext (optional)"
                  value={fieldData.placeholder}
                  onChange={(e) =>
                    setFieldData((prev) => ({ ...prev, placeholder: e.target.value }))
                  }
                  placeholder="z.B. Max Mustermann"
                />

                {availableGroups.length > 0 && (
                  <FormField
                    type="select"
                    id="fieldGroup"
                    name="fieldGroup"
                    label="Gruppe (optional)"
                    value={fieldData.group}
                    onChange={(e) => setFieldData((prev) => ({ ...prev, group: e.target.value }))}
                    options={[
                      { value: '', label: 'Keine Gruppe' },
                      ...availableGroups.map((group) => ({ value: group, label: group })),
                    ]}
                  />
                )}

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <input
                      type="checkbox"
                      id="fieldRequired"
                      checked={fieldData.required}
                      onChange={(e) =>
                        setFieldData((prev) => ({ ...prev, required: e.target.checked }))
                      }
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="fieldRequired" className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-white">Pflichtfeld</span>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Dieses Feld muss ausgefüllt werden, bevor das Formular abgesendet werden
                        kann.
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Vorschau:</h4>
                <div className="pointer-events-none">
                  <FormField
                    type={fieldType as 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea'}
                    id="preview"
                    name="preview"
                    label={fieldData.label || 'Feldbezeichnung'}
                    value=""
                    onChange={() => {}}
                    placeholder={fieldData.placeholder || 'Platzhaltertext...'}
                    required={fieldData.required}
                    options={
                      fieldType === 'select'
                        ? [
                            { value: '', label: `${fieldData.label || 'Feld'} auswählen` },
                            { value: 'option1', label: 'Option 1' },
                            { value: 'option2', label: 'Option 2' },
                          ]
                        : undefined
                    }
                    rows={fieldType === 'textarea' ? 3 : undefined}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div>
            {step === 'details' && (
              <Button type="button" variant="outline" onClick={handleBack}>
                ← Zurück
              </Button>
            )}
          </div>
          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            {step === 'details' && (
              <Button type="button" onClick={handleAddField} disabled={!fieldData.label.trim()}>
                Feld hinzufügen
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
