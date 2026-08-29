import React from 'react';
import { ModernSidebar } from './ModernSidebar';
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';

// Wrapper component that injects store-based state & actions into ModernSidebar
export function ModernSidebarStore(props: React.ComponentProps<typeof ModernSidebar>) {
  const { fields, steps, isMultiStep, currentStep, duplicateField, removeField } =
    useFormBuilderStore((state) => ({
      fields: state.fields,
      steps: state.steps,
      isMultiStep: state.isMultiStep,
      currentStep: state.currentStep,
      duplicateField: state.duplicateField,
      removeField: state.removeField,
    }));

  return <ModernSidebar {...props} />;
}
