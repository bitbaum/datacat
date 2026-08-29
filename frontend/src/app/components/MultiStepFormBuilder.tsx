'use client';

import React from 'react';
import { FieldTemplate, FieldConfig, FormStep } from '../types/form';
import { TrashIcon } from '@heroicons/react/24/outline';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from './Button';
import { EmptyStep } from './EmptyStep';
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';
import { ModernFieldBuilder } from './ModernFormBuilder';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { fieldTemplates } from '../data/fieldTemplates';

interface MultiStepFormBuilderProps {
  steps: FormStep[];
  stepsWithErrors: Set<string>;
  errors: Record<string, string | null>;
  formData: Record<string, string>;
  onFieldChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onUpdateField: (id: string, updates: Partial<FieldConfig>) => void;
  onRemoveField: (id: string) => void;
  onDuplicateField: (id: string) => void;
  onSelectField: (id: string) => void;
  selectedFieldId?: string;
}

export function MultiStepFormBuilder({
  steps,
  stepsWithErrors,
  errors,
  formData,
  onFieldChange,
  onUpdateField,
  onRemoveField,
  onDuplicateField,
  onSelectField,
  selectedFieldId,
}: MultiStepFormBuilderProps) {
  const { currentStep, setCurrentStep, addStep, addField, addTemplateFields, removeStep } =
    useFormBuilderStore();

  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  const isCurrentStepComplete = React.useCallback(() => {
    if (!currentStepData) return false;
    const requiredFields = currentStepData.fields.filter((field) => field.required);
    return requiredFields.every((field) => formData[field.name]?.trim());
  }, [currentStepData, formData]);

  if (!steps || steps.length === 0 || !currentStepData) {
    return (
      <div className="flex items-center justify-center py-24">
        <button
          onClick={() =>
            addStep({ title: 'Schritt 1', description: '', fields: [], isOptional: false })
          }
          className="flex flex-col items-center justify-center w-full max-w-md px-6 py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors focus:outline-none"
        >
          <div className="text-4xl text-blue-600 mb-3">＋</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            Ersten Schritt hinzufügen
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Beginnen Sie Ihr Formular, indem Sie den ersten Schritt erstellen.
          </p>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-start flex-wrap gap-2 group">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all cursor-pointer ${
                    getStepStatus(index) === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : getStepStatus(index) === 'current'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                  } ${stepsWithErrors.has(step.id) ? '!border-red-500' : ''}`}
                  onClick={() => setCurrentStep(index)}
                  title={stepsWithErrors.has(step.id) ? 'Dieser Schritt hat Fehler' : ''}
                >
                  {stepsWithErrors.has(step.id) && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  )}
                  {getStepStatus(index) === 'completed' ? '✓' : index + 1}
                </div>
                <div className="ml-2 mr-3">
                  <p
                    className={`text-sm font-medium ${
                      getStepStatus(index) === 'current'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
          {/* Hover-add button */}
          <button
            onClick={() =>
              addStep({
                title: `Schritt ${steps.length + 1}`,
                description: '',
                fields: [],
                isOptional: false,
              })
            }
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600"
            title="Neuen Schritt hinzufügen"
          >
            +
          </button>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentStepData.title}
            </h2>
            {currentStepData.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">{currentStepData.description}</p>
            )}
          </div>
          <button
            onClick={() => setPendingDeleteId(currentStepData.id)}
            title="Schritt löschen"
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {currentStepData.fields.length === 0 ? (
            <EmptyStep
              onAddField={(type: FieldConfig['type']) => addField(type, currentStepData.id)}
              onAddTemplate={(template: FieldTemplate) =>
                addTemplateFields(template, currentStepData.id)
              }
            />
          ) : (
            <SortableContext
              items={currentStepData.fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {currentStepData.fields.map((field) => (
                  <ModernFieldBuilder
                    key={field.id}
                    field={field}
                    value={formData[field.name] || ''}
                    onChange={onFieldChange}
                    onUpdateField={(updates) => onUpdateField(field.id, updates)}
                    onRemoveField={() => onRemoveField(field.id)}
                    onDuplicateField={() => onDuplicateField(field.id)}
                    onSelect={() => onSelectField(field.id)}
                    isSelected={selectedFieldId === field.id}
                    error={errors[field.name]}
                  />
                ))}
                {/* inline add placeholder */}
                <div className="flex items-center justify-center py-6">
                  <div className="flex gap-4">
                    <button
                      onClick={() => addField('text', currentStepData.id)}
                      className="flex items-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="Feld hinzufügen"
                    >
                      ＋ Feld
                    </button>
                    <button
                      onClick={() => addTemplateFields(fieldTemplates[0], currentStepData.id)}
                      className="flex items-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="Sektion hinzufügen"
                    >
                      ＋ Sektion
                    </button>
                  </div>
                </div>
              </div>
            </SortableContext>
          )}
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Zurück
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={() =>
                addStep({
                  title: `Schritt ${steps.length + 1}`,
                  description: '',
                  fields: [],
                  isOptional: false,
                })
              }
            >
              Neuen Schritt hinzufügen
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!isCurrentStepComplete() && !currentStepData.isOptional}
            >
              Weiter
            </Button>
          )}
        </div>
      </div>
      {/* confirm dialog */}
      <ConfirmDialog
        isOpen={!!pendingDeleteId}
        title="Schritt löschen"
        message={`Sind Sie sicher, dass Sie diesen Schritt löschen möchten?
Alle Felder in diesem Schritt gehen verloren.`}
        confirmLabel="Löschen"
        onConfirm={() => {
          if (pendingDeleteId) removeStep(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
