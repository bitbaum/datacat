'use client';

import React from 'react';
import { FieldConfig, FieldTemplate } from '../types/form';
import { fieldTemplates } from '../data/fieldTemplates';
import { formTemplates } from '../data/formTemplates';
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';
import { ConfirmDialog } from './ConfirmDialog';

interface EmptyStepProps {
  onAddField: (type: FieldConfig['type']) => void;
  onAddTemplate: (template: FieldTemplate) => void;
}

const quickFieldTypes: Array<{ type: FieldConfig['type']; label: string; icon: string }> = [
  { type: 'text', label: 'Text', icon: '📝' },
  { type: 'email', label: 'E-Mail', icon: '📧' },
  { type: 'tel', label: 'Telefon', icon: '📞' },
  { type: 'date', label: 'Datum', icon: '📅' },
  { type: 'select', label: 'Auswahl', icon: '📋' },
  { type: 'textarea', label: 'Textbereich', icon: '📄' },
];

export function EmptyStep({ onAddField, onAddTemplate }: EmptyStepProps) {
  const { loadTemplate } = useFormBuilderStore();
  const [pendingTemplateId, setPendingTemplateId] = React.useState<string | null>(null);

  return (
    <div className="text-center py-16 px-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 shadow-sm">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-20 h-20 mx-auto opacity-10 blur-xl"></div>
        <div className="relative text-5xl">✨</div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Fügen Sie Ihr erstes Feld hinzu
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
        Beginnen Sie mit einem einzelnen Feld oder fügen Sie eine vordefinierte Sektion hinzu, um
        Ihr perfektes Formular zu erstellen.
      </p>

      <div className="max-w-4xl mx-auto">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-6 text-left">
          ⚡ Einzelne Felder
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-12">
          {quickFieldTypes.map((fieldType) => (
            <button
              key={fieldType.type}
              onClick={() => onAddField(fieldType.type)}
              className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 text-center group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                {fieldType.icon}
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {fieldType.label}
              </div>
            </button>
          ))}
        </div>

        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-6 text-left">
          🎯 Sektionen
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {fieldTemplates.map((template) => (
            <div
              key={template.id}
              className="p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md transition-all duration-200 cursor-pointer group text-left"
              onClick={() => onAddTemplate(template)}
            >
              <div className="flex items-start">
                <div className="text-3xl mr-4 mt-1 group-hover:scale-110 transition-transform duration-200">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors mb-1">
                    {template.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {template.fields.length} Felder
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-6 text-left">
          📋 Komplette Formulare
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {formTemplates.map((template) => (
            <div
              key={template.id}
              className="p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-200 cursor-pointer group text-left"
              onClick={() => setPendingTemplateId(template.id)}
            >
              <div className="flex items-start">
                <div className="text-3xl mr-4 mt-1 group-hover:scale-110 transition-transform duration-200">
                  📄
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
                    {template.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* confirmation dialog */}
      <ConfirmDialog
        isOpen={!!pendingTemplateId}
        title="Formular-Vorlage laden"
        message="Das aktuelle Formular wird überschrieben. Möchten Sie fortfahren?"
        confirmLabel="Übernehmen"
        onConfirm={() => {
          const tmpl = formTemplates.find((t) => t.id === pendingTemplateId);
          if (tmpl) loadTemplate(tmpl);
          setPendingTemplateId(null);
        }}
        onCancel={() => setPendingTemplateId(null)}
      />
    </div>
  );
}
