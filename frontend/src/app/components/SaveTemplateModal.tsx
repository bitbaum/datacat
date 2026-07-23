'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { FormField } from './FormField';
import { FieldConfig } from '../types/form';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  fields: FieldConfig[];
  initialName?: string;
  initialDescription?: string;
}

export function SaveTemplateModal({ 
  isOpen, 
  onClose, 
  onSave, 
  fields, 
  initialName = '', 
  initialDescription = '' 
}: SaveTemplateModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Name muss mindestens 3 Zeichen haben';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Beschreibung muss mindestens 10 Zeichen haben';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError(null);
    try {
      await onSave(name.trim(), description.trim());
      setName('');
      setDescription('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      setSubmitError('Vorlage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName(initialName);
    setDescription(initialDescription);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  if (!isOpen) return null;

  const totalFields = fields.length;
  const requiredFields = fields.filter(f => f.required).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Vorlage speichern
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center space-x-2 text-sm text-blue-800 dark:text-blue-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                {totalFields} Felder, {requiredFields} Pflichtfelder
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <FormField
              type="text"
              id="templateName"
              name="templateName"
              label="Vorlagen-Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. HR Mitarbeiter-Onboarding"
              required
              error={errors.name}
            />

            <FormField
              type="textarea"
              id="templateDescription"
              name="templateDescription"
              label="Beschreibung"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreiben Sie den Zweck und Einsatzbereich dieser Vorlage..."
              rows={3}
              required
              error={errors.description}
            />
          </div>

          {submitError && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800/50 text-sm text-red-800 dark:text-red-200">
              {submitError}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !name.trim() || !description.trim()}
          >
            {isLoading ? 'Speichern...' : 'Vorlage speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}