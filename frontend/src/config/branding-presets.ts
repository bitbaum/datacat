import { BrandingConfig } from './branding';

export const brandingPresets: Record<string, Partial<BrandingConfig>> = {
  // HR/Talent Management
  hr: {
    name: 'TalentFlow HR',
    shortName: 'TalentFlow',
    description: 'AI-Powered HR Intake & Talent Management System',
    primaryColor: '#2563EB', // Blue
    secondaryColor: '#1F2937', // Gray
    accentColor: '#059669', // Green
    useCase: 'HR Intake',
    domain: 'talentflow.com',
  },

  // Medical/Healthcare
  medical: {
    name: 'HealthIntake Pro',
    shortName: 'HealthIntake',
    description: 'Patient Intake & Medical Data Collection System',
    primaryColor: '#DC2626', // Red
    secondaryColor: '#1F2937', // Gray
    accentColor: '#059669', // Green
    useCase: 'Medical Intake',
    domain: 'healthintake.com',
  },

  // Legal
  legal: {
    name: 'LegalIntake Suite',
    shortName: 'LegalIntake',
    description: 'Client Intake & Legal Case Management System',
    primaryColor: '#7C3AED', // Purple
    secondaryColor: '#1F2937', // Gray
    accentColor: '#D97706', // Orange
    useCase: 'Legal Intake',
    domain: 'legalintake.com',
  },

  // Government/Public Sector
  government: {
    name: 'CitizenConnect',
    shortName: 'CitizenConnect',
    description: 'Public Sector Onboarding & Citizen Services',
    primaryColor: '#059669', // Green
    secondaryColor: '#1F2937', // Gray
    accentColor: '#2563EB', // Blue
    useCase: 'Government Services',
    domain: 'citizenconnect.gov',
  },

  // Generic/White Label
  generic: {
    name: 'Universal Form Builder',
    shortName: 'FormBuilder',
    description: 'AI-Ready Intake System - Modular Form Builder',
    primaryColor: '#3B82F6', // Blue
    secondaryColor: '#1F2937', // Gray
    accentColor: '#10B981', // Green
    useCase: 'Universal Intake',
    domain: 'formbuilder.com',
  },

  // DataCat - Main Brand
  datacat: {
    name: 'DataCat',
    shortName: 'DataCat',
    description: 'AI-powered Data Capture System – Forms and Photo-based Inventory',
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    accentColor: '#10B981',
    useCase: 'Erfassung & Inventar',
    domain: 'datacat.ch',
  },
};

// Get branding preset by name
export const getBrandingPreset = (presetName: string): Partial<BrandingConfig> => {
  return brandingPresets[presetName] || brandingPresets.generic;
};

// List all available presets
export const getAvailablePresets = (): string[] => {
  return Object.keys(brandingPresets);
};
