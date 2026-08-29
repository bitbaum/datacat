'use client';

import React, { useState } from 'react';
import { FormField } from './FormField';
import { Button } from './Button';
import { FieldConfig, FormData } from '../types/form';
import { useFormValidation } from '../hooks/useFormValidation';

interface FormPreviewProps {
  fields: FieldConfig[];
  title?: string;
  description?: string;
  onSubmit?: (data: FormData) => void;
  showSubmitButton?: boolean;
}

export function FormPreview({
  fields,
  title = 'Formular Vorschau',
  description = 'So wird das Formular für Ihre Benutzer aussehen',
  onSubmit,
  showSubmitButton = true,
}: FormPreviewProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    const data: FormData = {};
    fields.forEach((field) => {
      data[field.name] = '';
    });
    return data;
  });

  const { validateForm, validateSingleField, getFieldError, hasErrors } = useFormValidation(fields);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFieldBlur = (fieldName: string) => {
    const value = formData[fieldName] || '';
    validateSingleField(fieldName, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);

    if (errors.length === 0) {
      onSubmit?.(formData);
      alert('Formular erfolgreich abgesendet! (Dies ist nur eine Vorschau)');
    }
  };

  // Group fields by their group property
  const groupedFields = fields.reduce(
    (groups, field) => {
      const groupName = field.group || 'Allgemeine Felder';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(field);
      return groups;
    },
    {} as Record<string, FieldConfig[]>,
  );

  if (fields.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Keine Felder zum Anzeigen
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Fügen Sie Felder hinzu, um eine Vorschau zu sehen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Form Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-blue-100">{description}</p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-8">
        <div className="space-y-8">
          {Object.entries(groupedFields).map(([groupName, groupFields]) => (
            <div key={groupName}>
              {Object.keys(groupedFields).length > 1 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                    {groupName}
                  </h3>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groupFields.map((field) => (
                  <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <FormField
                      type={field.type}
                      id={field.id}
                      name={field.name}
                      label={field.label}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur(field.name)}
                      required={field.required}
                      placeholder={field.placeholder}
                      options={field.options}
                      rows={field.rows}
                      error={getFieldError(field.name)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Validation Summary */}
        {hasErrors && (
          <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Bitte korrigieren Sie die Fehler
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Überprüfen Sie die markierten Felder und versuchen Sie es erneut.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {showSubmitButton && (
          <div className="mt-8 flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={hasErrors}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Formular absenden
            </Button>
          </div>
        )}

        {/* Form Info */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>
                {fields.length} Feld{fields.length !== 1 ? 'er' : ''}
              </span>
              <span>•</span>
              <span>
                {fields.filter((f) => f.required).length} Pflichtfeld
                {fields.filter((f) => f.required).length !== 1 ? 'er' : ''}
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Erstellt mit Form Builder
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
