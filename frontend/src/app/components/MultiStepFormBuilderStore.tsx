import React from 'react';
import { MultiStepFormBuilder } from './MultiStepFormBuilder';
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';
import { FormStep, FieldConfig } from '../types/form';

interface MultiStepFormBuilderStoreProps extends Omit<
  React.ComponentProps<typeof MultiStepFormBuilder>,
  | 'steps'
  | 'currentStep'
  | 'onStepChange'
  | 'onCreateStep'
  | 'onCreateStepAtPosition'
  | 'onAddField'
  | 'onUpdateStep'
> {
  onCreateStep?: (step: Omit<FormStep, 'id'>) => void;
  onCreateStepAtPosition?: (step: Omit<FormStep, 'id'>, position: number) => void;
  onAddField?: (type: FieldConfig['type']) => void;
}

export function MultiStepFormBuilderStore(props: MultiStepFormBuilderStoreProps) {
  const { steps, currentStep, setCurrentStep, addStep, reorderStep, updateStep, addField } =
    useFormBuilderStore((state) => ({
      steps: state.steps,
      currentStep: state.currentStep,
      setCurrentStep: state.setCurrentStep,
      addStep: state.addStep,
      reorderStep: state.reorderStep,
      updateStep: state.updateStep,
      addField: state.addField,
    }));

  // helper to create step with id
  const createStep = (data: Omit<FormStep, 'id'>) => {
    const newStep: FormStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
    };
    addStep(newStep);
    props.onCreateStep?.(data);
  };

  const createStepAtPosition = (data: Omit<FormStep, 'id'>, position: number) => {
    const newStep: FormStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
    };
    // reorder: insert by creating then moving if needed
    addStep(newStep);
    if (position < steps.length) {
      reorderStep(steps.length, position);
    }
    props.onCreateStepAtPosition?.(data, position);
  };

  const handleAddField = (type: FieldConfig['type']) => {
    if (addField) {
      const fieldConfig: FieldConfig = {
        id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        name: `${type}_${Date.now()}`,
        label: type,
        required: false,
      } as FieldConfig;
      addField(type, steps[currentStep]?.id);
    }
    props.onAddField?.(type);
  };

  return <MultiStepFormBuilder {...props} steps={steps} />;
}
