import React, { useState } from 'react';
import { FormField } from './FormField';
import { FieldConfig, FormData } from '../types/form';

interface FieldGroupProps {
  title: string;
  description?: string;
  fields: FieldConfig[];
  formData: FormData;
  onFieldChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onFieldBlur: (fieldName: string) => void;
  getFieldError: (fieldName: string) => string | null;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export function FieldGroup({
  title,
  description,
  fields,
  formData,
  onFieldChange,
  onFieldBlur,
  getFieldError,
  isCollapsible = false,
  defaultExpanded = true,
  className = '',
}: FieldGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasErrors = fields.some((field) => getFieldError(field.name));
  const hasValues = fields.some((field) => formData[field.name]?.trim());
  const requiredFields = fields.filter((field) => field.required);
  const completedRequiredFields = requiredFields.filter((field) => formData[field.name]?.trim());

  const getGroupStatus = () => {
    if (hasErrors) return 'error';
    if (requiredFields.length > 0) {
      if (completedRequiredFields.length === requiredFields.length) return 'complete';
      if (completedRequiredFields.length > 0) return 'partial';
    }
    if (hasValues) return 'partial';
    return 'empty';
  };

  const getGroupIcon = () => {
    const status = getGroupStatus();
    switch (status) {
      case 'complete':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'partial':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-gray-400"
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
        );
    }
  };

  const getGroupBorderClass = () => {
    const status = getGroupStatus();
    switch (status) {
      case 'complete':
        return 'border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10';
      case 'error':
        return 'border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10';
      case 'partial':
        return 'border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10';
      default:
        return 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50';
    }
  };

  return (
    <div
      className={`rounded-xl border backdrop-blur-sm transition-all duration-200 ${getGroupBorderClass()} ${className}`}
    >
      <div
        className={`px-6 py-4 ${isCollapsible ? 'cursor-pointer' : ''}`}
        onClick={isCollapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getGroupIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Progress indicator */}
            {requiredFields.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {completedRequiredFields.length}/{requiredFields.length}
                </div>
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getGroupStatus() === 'complete'
                        ? 'bg-green-500'
                        : getGroupStatus() === 'partial'
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                    }`}
                    style={{
                      width: `${requiredFields.length > 0 ? (completedRequiredFields.length / requiredFields.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Collapse/Expand button */}
            {isCollapsible && (
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fields */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field) => (
              <FormField
                key={field.id}
                type={field.type}
                id={field.id}
                name={field.name}
                label={field.label}
                value={formData[field.name] || ''}
                onChange={onFieldChange}
                onBlur={() => onFieldBlur(field.name)}
                required={field.required}
                placeholder={field.placeholder}
                options={field.options}
                rows={field.rows}
                error={getFieldError(field.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
