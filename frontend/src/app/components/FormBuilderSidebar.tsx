'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { FieldConfig } from '../types/form';

interface FormBuilderSidebarProps {
  onAddField: (field: FieldConfig) => void;
  onSaveTemplate: () => void;
  onSaveDraft: () => void;
  onManageGroups: () => void;
  canSubmit: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function FormBuilderSidebar({
  onAddField,
  onSaveTemplate,
  onSaveDraft,
  onManageGroups,
  canSubmit,
  isOpen,
  onToggle,
}: FormBuilderSidebarProps) {
  const [activeSection, setActiveSection] = useState<'fields' | 'actions' | 'templates'>('fields');

  const fieldTypes = [
    {
      type: 'text',
      label: 'Text',
      description: 'Einfache Texteingabe',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      description: 'E-Mail-Adresse',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const handleDragStart = (e: React.DragEvent, fieldType: string) => {
    e.dataTransfer.setData('text/plain', fieldType);
  };

  const createQuickField = (type: string) => {
    const fieldNames = {
      text: 'Textfeld',
      email: 'E-Mail',
      tel: 'Telefon',
      date: 'Datum',
      select: 'Auswahl',
      textarea: 'Textbereich',
    };

    const fieldConfig: FieldConfig = {
      id: `quick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as FieldConfig['type'],
      name: `${fieldNames[type as keyof typeof fieldNames]?.toLowerCase().replace(/[^a-z]/g, '_') || type}_${Date.now()}`,
      label: fieldNames[type as keyof typeof fieldNames] || type,
      required: false,
      placeholder:
        type === 'select'
          ? undefined
          : `${fieldNames[type as keyof typeof fieldNames]} eingeben...`,
      options:
        type === 'select'
          ? [
              { value: '', label: 'Auswahl treffen' },
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
            ]
          : undefined,
      rows: type === 'textarea' ? 3 : undefined,
    };

    onAddField(fieldConfig);
  };

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed left-4 top-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
          isOpen ? 'translate-x-80' : 'translate-x-0'
        }`}
      >
        <svg
          className="w-6 h-6 text-gray-600 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Formular-Builder</h2>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveSection('fields')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === 'fields'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Felder
            </button>
            <button
              onClick={() => setActiveSection('actions')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === 'actions'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Aktionen
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeSection === 'fields' && (
              <div className="p-4 space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Ziehen Sie Felder in das Formular oder klicken Sie zum Hinzufügen
                </div>

                <div className="space-y-2">
                  {fieldTypes.map((field) => (
                    <div
                      key={field.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, field.type)}
                      onClick={() => createQuickField(field.type)}
                      className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex-shrink-0 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 group-hover:border-blue-300 dark:group-hover:border-blue-500 transition-colors">
                        {field.icon}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {field.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {field.description}
                        </div>
                      </div>
                      <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
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
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'actions' && (
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={onManageGroups}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    Gruppen verwalten
                  </Button>

                  <Button
                    onClick={onSaveTemplate}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Als Vorlage speichern
                  </Button>

                  <Button onClick={onSaveDraft} variant="outline" className="w-full justify-start">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Entwurf speichern
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-30" onClick={onToggle} />}
    </>
  );
}
