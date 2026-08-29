import { FormTemplate } from '../types/form';

export const hrIntakeTemplate: FormTemplate = {
  id: 'hr-intake',
  name: 'HR Mitarbeiter-Erfassung',
  description: 'Standard-Mitarbeiter-Onboarding-Formular',
  fields: [
    {
      id: 'firstName',
      type: 'text',
      name: 'firstName',
      label: 'Vorname',
      required: true,
    },
    {
      id: 'lastName',
      type: 'text',
      name: 'lastName',
      label: 'Nachname',
      required: true,
    },
    {
      id: 'email',
      type: 'email',
      name: 'email',
      label: 'E-Mail-Adresse',
      required: true,
    },
    {
      id: 'phone',
      type: 'tel',
      name: 'phone',
      label: 'Telefonnummer',
    },
    {
      id: 'department',
      type: 'select',
      name: 'department',
      label: 'Abteilung',
      required: true,
      options: [
        { value: '', label: 'Abteilung auswählen' },
        { value: 'engineering', label: 'Technik' },
        { value: 'design', label: 'Design' },
        { value: 'product', label: 'Produkt' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'sales', label: 'Vertrieb' },
        { value: 'hr', label: 'Personalwesen' },
        { value: 'finance', label: 'Finanzen' },
        { value: 'operations', label: 'Betrieb' },
      ],
    },
    {
      id: 'position',
      type: 'text',
      name: 'position',
      label: 'Position/Titel',
      required: true,
    },
    {
      id: 'startDate',
      type: 'date',
      name: 'startDate',
      label: 'Startdatum',
      required: true,
    },
    {
      id: 'employmentType',
      type: 'select',
      name: 'employmentType',
      label: 'Beschäftigungsart',
      required: true,
      options: [
        { value: 'full-time', label: 'Vollzeit' },
        { value: 'part-time', label: 'Teilzeit' },
        { value: 'contract', label: 'Vertrag' },
        { value: 'intern', label: 'Praktikant' },
      ],
    },
    {
      id: 'skills',
      type: 'textarea',
      name: 'skills',
      label: 'Fähigkeiten & Expertise',
      placeholder: 'Listen Sie relevante Fähigkeiten, Technologien oder Fachbereiche auf...',
      rows: 3,
    },
    {
      id: 'notes',
      type: 'textarea',
      name: 'notes',
      label: 'Zusätzliche Notizen',
      placeholder: 'Weitere Informationen oder besondere Anforderungen...',
      rows: 3,
    },
  ],
};

import { hrOnboardingTemplate } from './multiStepTemplates';

export const formTemplates = [hrIntakeTemplate, hrOnboardingTemplate];
