'use client';

import React, { useState } from 'react';
import { FieldConfig } from '../types/form';

interface FormSettings {
  title: string;
  description: string;
  successMessage: string;
  allowMultipleSubmissions: boolean;
  requireAuthentication: boolean;
}

interface FunctionalSidebarProps {
  mode: 'build' | 'preview' | 'settings';
  fields: FieldConfig[];
  onAddField: (type: FieldConfig['type']) => void;
  onFieldSelect: (fieldId: string) => void;
  onFieldDuplicate: (fieldId: string) => void;
  onFieldDelete: (fieldId: string) => void;
  selectedFieldId?: string;
  formSettings: FormSettings;
  onSettingsChange: (settings: FormSettings) => void;
}

interface FieldTypeOption {
  type: FieldConfig['type'];
  label: string;
  description: string;
  icon: string;
}

export function FunctionalSidebar({
  mode,
  fields,
  onAddField,
  onFieldSelect,
  onFieldDuplicate,
  onFieldDelete,
  selectedFieldId,
  formSettings,
  onSettingsChange,
}: FunctionalSidebarProps) {
  const [activeSection, setActiveSection] = useState<'elements' | 'structure' | 'settings'>(
    'elements',
  );

  const fieldTypes: FieldTypeOption[] = [
    { type: 'text', label: 'Text', description: 'Einfache Texteingabe', icon: '📝' },
    { type: 'email', label: 'E-Mail', description: 'E-Mail Adresse', icon: '📧' },
    { type: 'tel', label: 'Telefon', description: 'Telefonnummer', icon: '📞' },
    { type: 'date', label: 'Datum', description: 'Datumsauswahl', icon: '📅' },
    { type: 'select', label: 'Auswahl', description: 'Dropdown-Liste', icon: '📋' },
    { type: 'textarea', label: 'Textbereich', description: 'Mehrzeiliger Text', icon: '📄' },
  ];

  if (mode === 'preview') {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Vorschau-Modus
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            So sehen Ihre Benutzer das Formular
          </p>
        </div>

        <div className="flex-1 p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-blue-500 mr-2"
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
              <span className="font-medium text-blue-900 dark:text-blue-100">Info</span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              In der Vorschau können Sie das Formular testen, ohne Änderungen vorzunehmen.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Formular-Statistiken
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Anzahl Felder:</span>
                  <span className="font-medium">{fields.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pflichtfelder:</span>
                  <span className="font-medium">{fields.filter((f) => f.required).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gruppen:</span>
                  <span className="font-medium">
                    {new Set(fields.map((f) => f.group).filter(Boolean)).size}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'settings') {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Formular-Einstellungen
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Konfigurieren Sie Ihr Formular</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Allgemein
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  value={formSettings.title}
                  onChange={(e) => onSettingsChange({ ...formSettings, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={formSettings.description}
                  onChange={(e) =>
                    onSettingsChange({ ...formSettings, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Erfolgsmeldung
                </label>
                <input
                  type="text"
                  value={formSettings.successMessage}
                  onChange={(e) =>
                    onSettingsChange({ ...formSettings, successMessage: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Submission Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Einreichung
            </h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formSettings.allowMultipleSubmissions}
                  onChange={(e) =>
                    onSettingsChange({
                      ...formSettings,
                      allowMultipleSubmissions: e.target.checked,
                    })
                  }
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mehrfache Einreichungen
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Erlaubt Benutzern mehrere Einreichungen
                  </div>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formSettings.requireAuthentication}
                  onChange={(e) =>
                    onSettingsChange({ ...formSettings, requireAuthentication: e.target.checked })
                  }
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Anmeldung erforderlich
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Nur angemeldete Benutzer können das Formular ausfüllen
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Build mode
  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Form Builder</h2>

        {/* Section Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mt-4">
          <button
            onClick={() => setActiveSection('elements')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              activeSection === 'elements'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Elemente
          </button>
          <button
            onClick={() => setActiveSection('structure')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              activeSection === 'structure'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Struktur
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'elements' && (
          <div className="p-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Feldtypen
              </h3>

              {fieldTypes.map((field) => (
                <button
                  key={field.type}
                  onClick={() => onAddField(field.type)}
                  className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 text-left group"
                >
                  <div className="text-xl mr-3">{field.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {field.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {field.description}
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'structure' && (
          <div className="p-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Formular-Struktur
              </h3>

              {fields.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <svg
                      className="w-12 h-12 mx-auto"
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Keine Felder vorhanden</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedFieldId === field.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      onClick={() => onFieldSelect(field.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded text-xs flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {field.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {fieldTypes.find((t) => t.type === field.type)?.label}
                              {field.required && ' • Pflichtfeld'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onFieldDuplicate(field.id);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Duplizieren"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onFieldDelete(field.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Löschen"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
