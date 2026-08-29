import React from 'react';
import { FormTemplate } from '../types/form';
import { Button } from './Button';

interface TemplateCardProps {
  template: FormTemplate;
  onSelect: (template: FormTemplate) => void;
  onEdit?: (template: FormTemplate) => void;
  onDuplicate?: (template: FormTemplate) => void;
  onDelete?: (template: FormTemplate) => void;
  className?: string;
}

export function TemplateCard({
  template,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  className = '',
}: TemplateCardProps) {
  const fieldTypeIcons: Record<string, string> = {
    text: '📝',
    email: '📧',
    tel: '📞',
    date: '📅',
    select: '📋',
    textarea: '📄',
  };

  const getFieldTypeCounts = () => {
    const counts = template.fields.reduce(
      (acc, field) => {
        acc[field.type] = (acc[field.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  const fieldTypeCounts = getFieldTypeCounts();
  const totalFields = template.fields.length;
  const requiredFields = template.fields.filter((f) => f.required).length;

  return (
    <div
      className={`group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {template.name}
            </h3>
            {template.isMultiStep && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                Mehrstufig
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {template.description}
          </p>
        </div>
        <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex space-x-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(template);
                }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Vorlage bearbeiten"
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
            )}
            {onDuplicate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(template);
                }}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Vorlage duplizieren"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(template);
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Vorlage löschen"
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
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Felder:</span>
          <span className="font-medium text-gray-900 dark:text-white">{totalFields}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Pflichtfelder:</span>
          <span className="font-medium text-gray-900 dark:text-white">{requiredFields}</span>
        </div>

        {template.isMultiStep && template.steps && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Schritte:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {template.steps.length}
            </span>
          </div>
        )}

        {fieldTypeCounts.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Feldtypen:</span>
            <div className="flex space-x-1">
              {fieldTypeCounts.map(([type, count]) => (
                <span
                  key={type}
                  className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs"
                  title={`${count} ${type} Feld${count !== 1 ? 'er' : ''}`}
                >
                  <span className="mr-1">{fieldTypeIcons[type] || '📄'}</span>
                  {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button onClick={() => onSelect(template)} className="w-full" size="sm">
        Vorlage verwenden
      </Button>
    </div>
  );
}
