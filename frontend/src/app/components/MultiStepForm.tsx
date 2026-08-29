'use client';

import React, { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { FieldGroup } from './FieldGroup';
import { Button } from './Button';
import { ProgressIndicator } from './ProgressIndicator';
import { SaveTemplateModal } from './SaveTemplateModal';
import { FormStep, FieldConfig, FormData } from '../types/form';
import { useFormValidation } from '../hooks/useFormValidation';
import { useAutoSave } from '../hooks/useAutoSave';
import { useTemplateManager } from '../hooks/useTemplateManager';

interface MultiStepFormProps {
  steps: FormStep[];
  onSubmit: (data: FormData) => void;
  onStepsChange?: (steps: FormStep[]) => void;
}

export function MultiStepForm({ steps, onSubmit, onStepsChange }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormData>(() => {
    const data: FormData = {};
    steps.forEach((step) => {
      step.fields.forEach((field) => {
        data[field.name] = '';
      });
    });
    return data;
  });

  // Flatten all fields for validation and auto-save
  const allFields = steps.flatMap((step) => step.fields);
  const currentStepFields = steps[currentStep]?.fields || [];

  const { validateForm, validateSingleField, getFieldError, hasErrors } =
    useFormValidation(allFields);
  const { savedData, saveNow, clearSavedData, getLastSaveTime, hasSavedData } = useAutoSave(
    formData,
    allFields,
  );
  const { saveTemplate } = useTemplateManager();
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    if (savedData && Object.keys(formData).every((key) => !formData[key])) {
      setFormData(savedData.formData);
    }
  }, [savedData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFieldBlur = (fieldName: string) => {
    const value = formData[fieldName] || '';
    validateSingleField(fieldName, value);
  };

  const validateCurrentStep = (): boolean => {
    const stepErrors = currentStepFields
      .map((field) => validateSingleField(field.name, formData[field.name] || ''))
      .filter((error) => error !== null);

    return stepErrors.length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow navigation to completed steps or the next step
    if (completedSteps.includes(stepIndex) || stepIndex === currentStep + 1) {
      setCurrentStep(stepIndex);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps
    const allErrors = validateForm(formData);

    if (allErrors.length === 0) {
      clearSavedData();
      onSubmit(formData);
    } else {
      // Find the first step with errors and navigate to it
      const errorFields = allErrors;
      const firstErrorStep = steps.findIndex((step) =>
        step.fields.some((field) => errorFields.includes(field.name)),
      );

      if (firstErrorStep !== -1) {
        setCurrentStep(firstErrorStep);
      }
    }
  };

  const handleSaveAsTemplate = async (name: string, description: string) => {
    await saveTemplate(name, description, allFields);
  };

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const canProceed = validateCurrentStep();

  // Group fields by group within current step
  const groupedFields = currentStepFields.reduce(
    (groups, field) => {
      const groupName = field.group || 'default';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(field);
      return groups;
    },
    {} as Record<string, FieldConfig[]>,
  );

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <ProgressIndicator
        steps={steps.map((step) => ({
          id: step.id,
          title: step.title,
          isOptional: step.isOptional,
        }))}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {/* Auto-save indicator */}
      {hasSavedData && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 animate-fade-in backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Automatisch gespeichert {getLastSaveTime()}
              </span>
            </div>
            <button
              type="button"
              onClick={clearSavedData}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium hover:underline transition-all duration-200"
            >
              Entwurf löschen
            </button>
          </div>
        </div>
      )}

      {/* Current Step Content */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-8 animate-fade-in">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {steps[currentStep]?.title}
            </h2>
            {steps[currentStep]?.description && (
              <p className="text-gray-600 dark:text-gray-300">{steps[currentStep].description}</p>
            )}
          </div>

          {/* Render grouped fields */}
          <div className="space-y-6">
            {Object.entries(groupedFields).map(([groupName, groupFields]) => {
              if (groupName === 'default') {
                // Render ungrouped fields directly
                return (
                  <div key={groupName} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupFields.map((field) => (
                      <FormField
                        key={field.id}
                        type={field.type}
                        id={field.id}
                        name={field.name}
                        label={field.label}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        onBlur={() => handleFieldBlur(field.name)}
                        required={field.required}
                        placeholder={field.placeholder}
                        options={field.options}
                        rows={field.rows}
                        error={getFieldError(field.name)}
                      />
                    ))}
                  </div>
                );
              }

              // Render grouped fields in FieldGroup component
              return (
                <FieldGroup
                  key={groupName}
                  title={groupName}
                  fields={groupFields}
                  formData={formData}
                  onFieldChange={handleInputChange}
                  onFieldBlur={handleFieldBlur}
                  getFieldError={getFieldError}
                  isCollapsible={groupFields.length > 2}
                  defaultExpanded={true}
                />
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            {!isFirstStep && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                ← Zurück
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSaveTemplateModal(true)}
              size="sm"
            >
              Als Vorlage speichern
            </Button>

            <Button type="button" variant="outline" onClick={saveNow}>
              Entwurf speichern
            </Button>

            {isLastStep ? (
              <Button type="submit" disabled={hasErrors}>
                Formular absenden
              </Button>
            ) : (
              <Button type="button" onClick={handleNext} disabled={!canProceed}>
                Weiter →
              </Button>
            )}
          </div>
        </div>
      </form>

      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        onSave={handleSaveAsTemplate}
        fields={allFields}
      />
    </div>
  );
}
