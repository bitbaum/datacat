'use client';

import React from 'react';

interface FieldType {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  example: string;
}

interface FieldTypeSelectorProps {
  onSelect: (type: string) => void;
  selectedType?: string;
  className?: string;
}

export function FieldTypeSelector({
  onSelect,
  selectedType,
  className = '',
}: FieldTypeSelectorProps) {
  const fieldTypes: FieldType[] = [
    {
      type: 'text',
      label: 'Text',
      description: 'Einfache Texteingabe',
      example: 'Max Mustermann',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
      ),
    },
    {
      type: 'email',
      label: 'E-Mail',
      description: 'E-Mail-Adresse mit Validierung',
      example: 'max@example.com',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
        </svg>
      ),
    },
    {
      type: 'tel',
      label: 'Telefon',
      description: 'Telefonnummer',
      example: '+49 123 456789',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      ),
    },
    {
      type: 'date',
      label: 'Datum',
      description: 'Datumsauswahl',
      example: '15.12.2024',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      type: 'select',
      label: 'Auswahl',
      description: 'Dropdown-Liste',
      example: 'Option wählen...',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
          />
        </svg>
      ),
    },
    {
      type: 'textarea',
      label: 'Textbereich',
      description: 'Mehrzeiliger Text',
      example: 'Längere Beschreibung...',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${className}`}>
      {fieldTypes.map((fieldType) => (
        <button
          key={fieldType.type}
          type="button"
          onClick={() => onSelect(fieldType.type)}
          className={`group relative p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
            selectedType === fieldType.type
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`p-2 rounded-lg ${
                selectedType === fieldType.type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400'
              }`}
            >
              {fieldType.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold ${
                  selectedType === fieldType.type
                    ? 'text-blue-900 dark:text-blue-100'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {fieldType.label}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  selectedType === fieldType.type
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {fieldType.description}
              </p>
              <p
                className={`text-xs mt-2 font-mono ${
                  selectedType === fieldType.type
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {fieldType.example}
              </p>
            </div>
          </div>

          {selectedType === fieldType.type && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
