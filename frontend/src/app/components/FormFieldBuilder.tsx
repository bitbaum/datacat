'use client';

import React, { useState } from 'react';
import { FormField } from './FormField';
import { FieldConfig } from '../types/form';

interface FormFieldBuilderProps {
  field: FieldConfig;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onBlur: () => void;
  onRemove: () => void;
  onEdit: () => void;
  error?: string | null;
  isEditing?: boolean;
}

export function FormFieldBuilder({
  field,
  value,
  onChange,
  onBlur,
  onRemove,
  onEdit,
  error,
  isEditing = false,
}: FormFieldBuilderProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative group transition-all duration-200 ${
        isEditing ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Field */}
      <FormField
        type={field.type}
        id={field.id}
        name={field.name}
        label={field.label}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={field.required}
        placeholder={field.placeholder}
        options={field.options}
        rows={field.rows}
        error={error}
      />

      {/* Controls */}
      <div
        className={`absolute -top-2 -right-2 flex space-x-1 transition-opacity duration-200 ${
          isHovered || isEditing ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Edit Button */}
        <button
          type="button"
          onClick={onEdit}
          className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm transition-all duration-200 hover:scale-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-center"
          title="Feld bearbeiten"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>

        {/* Remove Button */}
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm transition-all duration-200 hover:scale-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 flex items-center justify-center"
          title="Feld entfernen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Visual Feedback */}
      {field.required && (
        <div className="absolute top-2 left-2">
          <div className="w-2 h-2 bg-red-500 rounded-full" title="Pflichtfeld" />
        </div>
      )}

      {error && (
        <div
          className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"
          title="Validierungsfehler"
        />
      )}
    </div>
  );
}
