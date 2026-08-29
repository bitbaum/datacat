'use client';

import React from 'react';
import { Modal } from './Modal';
import { FieldConfig } from '../types/form';

interface FormPreviewModalProps {
  isOpen: boolean;
  form: { title?: string; description?: string; fields: FieldConfig[] } | null;
  onClose: () => void;
}

export function FormPreviewModal({ isOpen, form, onClose }: FormPreviewModalProps) {
  if (!isOpen || !form) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {form.title || 'Formular-Vorschau'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
        {form.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{form.description}</p>
        )}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {form.fields.map((field) => (
            <div
              key={field.name}
              className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
            >
              <span className="font-medium text-gray-900 dark:text-white">{field.label}</span>
              <span className="text-gray-500 dark:text-gray-300">{field.type}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Schliessen
          </button>
        </div>
      </div>
    </Modal>
  );
}
