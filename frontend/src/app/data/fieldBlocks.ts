import { FieldConfig } from '../types/form';

export interface FieldBlock {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'contact' | 'business' | 'personal' | 'payment' | 'legal';
  fields: Omit<FieldConfig, 'id' | 'stepId'>[];
}

export const fieldBlocks: FieldBlock[] = [
  // Contact Information
  {
    id: 'contact-basic',
    name: 'Kontaktdaten',
    description: 'Name, E-Mail, Telefon',
    icon: '👤',
    category: 'contact',
    fields: [
      { type: 'text', label: 'Vorname', name: 'firstName', required: true, placeholder: 'Max' },
      {
        type: 'text',
        label: 'Nachname',
        name: 'lastName',
        required: true,
        placeholder: 'Mustermann',
      },
      {
        type: 'email',
        label: 'E-Mail-Adresse',
        name: 'email',
        required: true,
        placeholder: 'max@beispiel.de',
      },
      {
        type: 'tel',
        label: 'Telefonnummer',
        name: 'phone',
        required: false,
        placeholder: '+41 XX XXX XX XX',
      },
    ],
  },

  // Address Information
  {
    id: 'address-full',
    name: 'Vollständige Adresse',
    description: 'Straße, PLZ, Stadt, Land',
    icon: '🏠',
    category: 'contact',
    fields: [
      {
        type: 'text',
        label: 'Straße und Hausnummer',
        name: 'street',
        required: true,
        placeholder: 'Musterstraße 123',
      },
      {
        type: 'text',
        label: 'Postleitzahl',
        name: 'postalCode',
        required: true,
        placeholder: '8001',
      },
      { type: 'text', label: 'Stadt', name: 'city', required: true, placeholder: 'Zürich' },
      {
        type: 'select',
        label: 'Land',
        name: 'country',
        required: true,
        options: [
          { label: 'Schweiz', value: 'CH' },
          { label: 'Deutschland', value: 'DE' },
          { label: 'Österreich', value: 'AT' },
          { label: 'Frankreich', value: 'FR' },
          { label: 'Italien', value: 'IT' },
        ],
      },
    ],
  },

  // Company Information
  {
    id: 'company-info',
    name: 'Firmendaten',
    description: 'Unternehmensinformationen',
    icon: '🏢',
    category: 'business',
    fields: [
      {
        type: 'text',
        label: 'Firmenname',
        name: 'companyName',
        required: true,
        placeholder: 'Musterfirma AG',
      },
      {
        type: 'text',
        label: 'Abteilung',
        name: 'department',
        required: false,
        placeholder: 'Marketing',
      },
      {
        type: 'text',
        label: 'Position/Titel',
        name: 'position',
        required: false,
        placeholder: 'Geschäftsführer',
      },
      {
        type: 'text',
        label: 'USt-IdNr.',
        name: 'vatNumber',
        required: false,
        placeholder: 'CHE-123.456.789',
      },
    ],
  },

  // Personal Information
  {
    id: 'personal-details',
    name: 'Persönliche Angaben',
    description: 'Geburtsdatum, Geschlecht, etc.',
    icon: '📋',
    category: 'personal',
    fields: [
      { type: 'date', label: 'Geburtsdatum', name: 'birthDate', required: false },
      {
        type: 'select',
        label: 'Geschlecht',
        name: 'gender',
        required: false,
        options: [
          { label: 'Männlich', value: 'male' },
          { label: 'Weiblich', value: 'female' },
          { label: 'Divers', value: 'diverse' },
          { label: 'Keine Angabe', value: 'not_specified' },
        ],
      },
      {
        type: 'select',
        label: 'Anrede',
        name: 'salutation',
        required: false,
        options: [
          { label: 'Herr', value: 'mr' },
          { label: 'Frau', value: 'ms' },
          { label: 'Dr.', value: 'dr' },
          { label: 'Prof.', value: 'prof' },
          { label: 'Keine Angabe', value: 'none' },
        ],
      },
    ],
  },

  // Emergency Contact
  {
    id: 'emergency-contact',
    name: 'Notfallkontakt',
    description: 'Kontaktperson für Notfälle',
    icon: '🚨',
    category: 'contact',
    fields: [
      {
        type: 'text',
        label: 'Name der Kontaktperson',
        name: 'emergencyContactName',
        required: true,
        placeholder: 'Anna Muster',
      },
      {
        type: 'text',
        label: 'Beziehung',
        name: 'emergencyContactRelation',
        required: false,
        placeholder: 'Ehefrau',
      },
      {
        type: 'tel',
        label: 'Telefonnummer',
        name: 'emergencyContactPhone',
        required: true,
        placeholder: '+41 XX XXX XX XX',
      },
      {
        type: 'email',
        label: 'E-Mail (optional)',
        name: 'emergencyContactEmail',
        required: false,
        placeholder: 'anna@beispiel.de',
      },
    ],
  },

  // Legal/Consent
  {
    id: 'legal-consent',
    name: 'Einverständniserklärungen',
    description: 'DSGVO, Newsletter, AGB',
    icon: '⚖️',
    category: 'legal',
    fields: [
      {
        type: 'checkbox',
        label: 'Ich stimme der Verarbeitung meiner Daten gemäss Datenschutzerklärung zu.',
        name: 'dataProcessingConsent',
        required: true,
      },
      {
        type: 'checkbox',
        label: 'Ich möchte den Newsletter erhalten.',
        name: 'newsletterConsent',
        required: false,
      },
      {
        type: 'checkbox',
        label: 'Ich akzeptiere die Allgemeinen Geschäftsbedingungen.',
        name: 'termsAccepted',
        required: true,
      },
    ],
  },

  // Feedback/Rating
  {
    id: 'feedback-rating',
    name: 'Bewertung & Feedback',
    description: 'Zufriedenheit und Kommentare',
    icon: '⭐',
    category: 'personal',
    fields: [
      {
        type: 'select',
        label: 'Wie zufrieden sind Sie?',
        name: 'satisfaction',
        required: true,
        options: [
          { label: 'Sehr zufrieden', value: 'very_satisfied' },
          { label: 'Zufrieden', value: 'satisfied' },
          { label: 'Neutral', value: 'neutral' },
          { label: 'Unzufrieden', value: 'dissatisfied' },
          { label: 'Sehr unzufrieden', value: 'very_dissatisfied' },
        ],
      },
      {
        type: 'textarea',
        label: 'Kommentare und Verbesserungsvorschläge',
        name: 'feedback',
        required: false,
        placeholder: 'Teilen Sie uns Ihre Gedanken mit...',
      },
      {
        type: 'checkbox',
        label: 'Ich möchte kontaktiert werden bezüglich meines Feedbacks.',
        name: 'contactForFeedback',
        required: false,
      },
    ],
  },
];

// Helper function to get blocks by category
export const getBlocksByCategory = (category: FieldBlock['category']) => {
  return fieldBlocks.filter((block) => block.category === category);
};

// Helper function to get all categories
export const getBlockCategories = () => {
  return Array.from(new Set(fieldBlocks.map((block) => block.category)));
};
