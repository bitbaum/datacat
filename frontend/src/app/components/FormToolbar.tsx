'use client';

import React from 'react';
import { Button } from './Button';

interface FormToolbarProps {
  onAddField: () => void;
  onManageGroups: () => void;
  onSaveTemplate: () => void;
  onSaveDraft: () => void;
  canSubmit: boolean;
  isMultiStep?: boolean;
  currentStep?: number;
  totalSteps?: number;
  className?: string;
}

export function FormToolbar({
  onAddField,
  onManageGroups,
  onSaveTemplate,
  onSaveDraft,
  canSubmit,
  isMultiStep = false,
  currentStep,
  totalSteps,
  className = '',
}: FormToolbarProps) {
  return (
    <div
      className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-lg ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left side - Form building tools */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={onAddField}
            size="sm"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Feld hinzufügen
          </Button>

          <Button type="button" variant="outline" onClick={onManageGroups} size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Gruppen
          </Button>

          {/* Step indicator for multi-step forms */}
          {isMultiStep && currentStep !== undefined && totalSteps !== undefined && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Schritt {currentStep + 1} von {totalSteps}
              </span>
            </div>
          )}
        </div>

        {/* Right side - Save/Submit actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={onSaveTemplate} size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Als Vorlage
          </Button>

          <Button type="button" variant="outline" onClick={onSaveDraft} size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Entwurf
          </Button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          <Button
            type="submit"
            disabled={!canSubmit}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            {isMultiStep &&
            currentStep !== undefined &&
            totalSteps !== undefined &&
            currentStep < totalSteps - 1
              ? 'Weiter'
              : 'Absenden'}
          </Button>
        </div>
      </div>
    </div>
  );
}
