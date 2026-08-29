import { FieldTemplate, FormTemplate } from '../types/form';

// Unified template system with categories
export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'micro' | 'form' | 'saved';
  type: 'field-group' | 'full-form';
  fields: any[]; // Will be properly typed based on usage
  isMultiStep?: boolean;
  steps?: any[];
}

// Micro-templates (field sections) - greatly expanded
export const microTemplates: FieldTemplate[] = [
  // Basic Contact & Personal
  {
    id: 'contact-basic',
    name: 'Kontaktdaten',
    description: 'Name, E-Mail, Telefon',
    icon: '👤',
    fields: [
      { type: 'text', name: 'firstName', label: 'Vorname', required: true, placeholder: 'Max' },
      {
        type: 'text',
        name: 'lastName',
        label: 'Nachname',
        required: true,
        placeholder: 'Mustermann',
      },
      {
        type: 'email',
        name: 'email',
        label: 'E-Mail-Adresse',
        required: true,
        placeholder: 'max@beispiel.de',
      },
      {
        type: 'tel',
        name: 'phone',
        label: 'Telefonnummer',
        required: false,
        placeholder: '+41 XX XXX XX XX',
      },
    ],
  },
  {
    id: 'address-full',
    name: 'Vollständige Adresse',
    description: 'Straße, PLZ, Stadt, Land',
    icon: '🏠',
    fields: [
      {
        type: 'text',
        name: 'street',
        label: 'Straße und Hausnummer',
        required: true,
        placeholder: 'Musterstraße 123',
      },
      {
        type: 'text',
        name: 'postalCode',
        label: 'Postleitzahl',
        required: true,
        placeholder: '8001',
      },
      { type: 'text', name: 'city', label: 'Stadt', required: true, placeholder: 'Zürich' },
      {
        type: 'select',
        name: 'country',
        label: 'Land',
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
  {
    id: 'personal-details',
    name: 'Persönliche Angaben',
    description: 'Geburtsdatum, Geschlecht, Familienstand',
    icon: '📋',
    fields: [
      { type: 'date', name: 'birthDate', label: 'Geburtsdatum', required: false },
      {
        type: 'select',
        name: 'gender',
        label: 'Geschlecht',
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
        name: 'maritalStatus',
        label: 'Familienstand',
        required: false,
        options: [
          { label: 'Ledig', value: 'single' },
          { label: 'Verheiratet', value: 'married' },
          { label: 'Geschieden', value: 'divorced' },
          { label: 'Verwitwet', value: 'widowed' },
        ],
      },
    ],
  },

  // Business & Professional
  {
    id: 'company-info',
    name: 'Firmendaten',
    description: 'Unternehmensinformationen',
    icon: '🏢',
    fields: [
      {
        type: 'text',
        name: 'companyName',
        label: 'Firmenname',
        required: true,
        placeholder: 'Musterfirma AG',
      },
      {
        type: 'text',
        name: 'department',
        label: 'Abteilung',
        required: false,
        placeholder: 'Marketing',
      },
      {
        type: 'text',
        name: 'position',
        label: 'Position/Titel',
        required: false,
        placeholder: 'Geschäftsführer',
      },
      {
        type: 'text',
        name: 'vatNumber',
        label: 'USt-IdNr.',
        required: false,
        placeholder: 'CHE-123.456.789',
      },
    ],
  },
  {
    id: 'employment-details',
    name: 'Berufsinformationen',
    description: 'Anstellung, Gehalt, Arbeitszeit',
    icon: '💼',
    fields: [
      {
        type: 'text',
        name: 'jobTitle',
        label: 'Berufsbezeichnung',
        required: true,
        placeholder: 'Software Entwickler',
      },
      {
        type: 'select',
        name: 'employmentType',
        label: 'Anstellungsart',
        required: true,
        options: [
          { label: 'Vollzeit', value: 'fulltime' },
          { label: 'Teilzeit', value: 'parttime' },
          { label: 'Freelancer', value: 'freelance' },
          { label: 'Praktikant', value: 'intern' },
        ],
      },
      { type: 'date', name: 'startDate', label: 'Eintrittsdatum', required: false },
      {
        type: 'number',
        name: 'salary',
        label: 'Jahresgehalt (CHF)',
        required: false,
        placeholder: '80000',
      },
    ],
  },
  {
    id: 'skills-qualifications',
    name: 'Qualifikationen',
    description: 'Ausbildung, Fähigkeiten, Sprachen',
    icon: '🎓',
    fields: [
      {
        type: 'text',
        name: 'education',
        label: 'Höchste Ausbildung',
        required: false,
        placeholder: 'Master Informatik',
      },
      {
        type: 'textarea',
        name: 'skills',
        label: 'Fähigkeiten & Kompetenzen',
        required: false,
        placeholder: 'JavaScript, React, Node.js...',
      },
      {
        type: 'textarea',
        name: 'languages',
        label: 'Sprachen',
        required: false,
        placeholder: 'Deutsch (Muttersprache), Englisch (fließend)...',
      },
      {
        type: 'textarea',
        name: 'certifications',
        label: 'Zertifikate',
        required: false,
        placeholder: 'AWS Certified, Scrum Master...',
      },
    ],
  },

  // Health & Medical
  {
    id: 'health-basic',
    name: 'Gesundheitsangaben',
    description: 'Allergien, Medikamente, Notfallkontakt',
    icon: '🏥',
    fields: [
      {
        type: 'textarea',
        name: 'allergies',
        label: 'Allergien',
        required: false,
        placeholder: 'Nüsse, Pollen, Medikamente...',
      },
      {
        type: 'textarea',
        name: 'medications',
        label: 'Aktuelle Medikamente',
        required: false,
        placeholder: 'Medikament, Dosierung...',
      },
      {
        type: 'text',
        name: 'emergencyContact',
        label: 'Notfallkontakt',
        required: true,
        placeholder: 'Anna Muster',
      },
      {
        type: 'tel',
        name: 'emergencyPhone',
        label: 'Notfall-Telefon',
        required: true,
        placeholder: '+41 XX XXX XX XX',
      },
    ],
  },
  {
    id: 'medical-history',
    name: 'Krankengeschichte',
    description: 'Vorerkrankungen, Operationen',
    icon: '📋',
    fields: [
      {
        type: 'textarea',
        name: 'previousIllnesses',
        label: 'Vorerkrankungen',
        required: false,
        placeholder: 'Diabetes, Bluthochdruck...',
      },
      {
        type: 'textarea',
        name: 'surgeries',
        label: 'Operationen',
        required: false,
        placeholder: 'Jahr, Art der Operation...',
      },
      {
        type: 'textarea',
        name: 'familyHistory',
        label: 'Familiengeschichte',
        required: false,
        placeholder: 'Erbkrankheiten in der Familie...',
      },
    ],
  },

  // Event & Registration
  {
    id: 'event-registration',
    name: 'Event-Anmeldung',
    description: 'Veranstaltung, Teilnahme, Präferenzen',
    icon: '🎪',
    fields: [
      {
        type: 'text',
        name: 'eventName',
        label: 'Veranstaltung',
        required: true,
        placeholder: 'Jahreskonferenz 2024',
      },
      {
        type: 'select',
        name: 'ticketType',
        label: 'Ticket-Art',
        required: true,
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'VIP', value: 'vip' },
          { label: 'Student', value: 'student' },
          { label: 'Sponsor', value: 'sponsor' },
        ],
      },
      {
        type: 'textarea',
        name: 'dietaryRequirements',
        label: 'Diätanforderungen',
        required: false,
        placeholder: 'Vegetarisch, Glutenfrei...',
      },
      {
        type: 'checkbox',
        name: 'networkingSession',
        label: 'Networking-Session teilnehmen',
        required: false,
      },
    ],
  },
  {
    id: 'workshop-preferences',
    name: 'Workshop-Präferenzen',
    description: 'Interesse, Erfahrung, Zeitslots',
    icon: '🛠️',
    fields: [
      {
        type: 'select',
        name: 'experienceLevel',
        label: 'Erfahrungslevel',
        required: true,
        options: [
          { label: 'Anfänger', value: 'beginner' },
          { label: 'Fortgeschritten', value: 'intermediate' },
          { label: 'Experte', value: 'expert' },
        ],
      },
      {
        type: 'textarea',
        name: 'interests',
        label: 'Interessensgebiete',
        required: false,
        placeholder: 'KI, Blockchain, UX Design...',
      },
      {
        type: 'textarea',
        name: 'expectations',
        label: 'Erwartungen',
        required: false,
        placeholder: 'Was möchten Sie lernen?',
      },
    ],
  },

  // Financial & Payment
  {
    id: 'payment-info',
    name: 'Zahlungsinformationen',
    description: 'Rechnungsadresse, Zahlungsart',
    icon: '💳',
    fields: [
      {
        type: 'select',
        name: 'paymentMethod',
        label: 'Zahlungsart',
        required: true,
        options: [
          { label: 'Kreditkarte', value: 'credit_card' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Rechnung', value: 'invoice' },
          { label: 'SEPA', value: 'sepa' },
        ],
      },
      {
        type: 'text',
        name: 'billingName',
        label: 'Rechnungsname',
        required: true,
        placeholder: 'Max Mustermann',
      },
      {
        type: 'text',
        name: 'billingAddress',
        label: 'Rechnungsadresse',
        required: true,
        placeholder: 'Musterstraße 123, 8001 Zürich',
      },
      {
        type: 'text',
        name: 'taxNumber',
        label: 'Steuernummer',
        required: false,
        placeholder: 'Optional für Unternehmen',
      },
    ],
  },
  {
    id: 'banking-details',
    name: 'Bankverbindung',
    description: 'IBAN, BIC, Bankname',
    icon: '🏦',
    fields: [
      {
        type: 'text',
        name: 'iban',
        label: 'IBAN',
        required: true,
        placeholder: 'CH93 0076 2011 6238 5295 7',
      },
      {
        type: 'text',
        name: 'bic',
        label: 'BIC/SWIFT',
        required: false,
        placeholder: 'UBSWCHZH80A',
      },
      {
        type: 'text',
        name: 'bankName',
        label: 'Bankname',
        required: false,
        placeholder: 'UBS Switzerland AG',
      },
      {
        type: 'text',
        name: 'accountHolder',
        label: 'Kontoinhaber',
        required: true,
        placeholder: 'Max Mustermann',
      },
    ],
  },

  // Customer & Support
  {
    id: 'customer-feedback',
    name: 'Kundenfeedback',
    description: 'Bewertung, Kommentare, Verbesserungen',
    icon: '⭐',
    fields: [
      {
        type: 'select',
        name: 'rating',
        label: 'Gesamtbewertung',
        required: true,
        options: [
          { label: '⭐⭐⭐⭐⭐ Ausgezeichnet', value: '5' },
          { label: '⭐⭐⭐⭐ Sehr gut', value: '4' },
          { label: '⭐⭐⭐ Gut', value: '3' },
          { label: '⭐⭐ Befriedigend', value: '2' },
          { label: '⭐ Mangelhaft', value: '1' },
        ],
      },
      {
        type: 'textarea',
        name: 'positiveAspects',
        label: 'Was hat Ihnen gefallen?',
        required: false,
        placeholder: 'Positive Aspekte...',
      },
      {
        type: 'textarea',
        name: 'improvements',
        label: 'Verbesserungsvorschläge',
        required: false,
        placeholder: 'Was können wir besser machen?',
      },
      {
        type: 'checkbox',
        name: 'recommendToOthers',
        label: 'Würden Sie uns weiterempfehlen?',
        required: false,
      },
    ],
  },
  {
    id: 'support-request',
    name: 'Support-Anfrage',
    description: 'Problem, Kategorie, Priorität',
    icon: '🆘',
    fields: [
      {
        type: 'select',
        name: 'category',
        label: 'Kategorie',
        required: true,
        options: [
          { label: 'Technisches Problem', value: 'technical' },
          { label: 'Rechnungsfrage', value: 'billing' },
          { label: 'Produktfrage', value: 'product' },
          { label: 'Sonstiges', value: 'other' },
        ],
      },
      {
        type: 'select',
        name: 'priority',
        label: 'Priorität',
        required: true,
        options: [
          { label: '🔴 Hoch - Dringend', value: 'high' },
          { label: '🟡 Mittel - Normal', value: 'medium' },
          { label: '🟢 Niedrig - Zeit lassen', value: 'low' },
        ],
      },
      {
        type: 'textarea',
        name: 'description',
        label: 'Problembeschreibung',
        required: true,
        placeholder: 'Beschreiben Sie Ihr Problem detailliert...',
      },
    ],
  },

  // Legal & Compliance
  {
    id: 'legal-consent',
    name: 'Einverständniserklärungen',
    description: 'DSGVO, Newsletter, AGB',
    icon: '⚖️',
    fields: [
      {
        type: 'checkbox',
        name: 'dataProcessingConsent',
        label: 'Ich stimme der Verarbeitung meiner Daten gemäss Datenschutzerklärung zu.',
        required: true,
      },
      {
        type: 'checkbox',
        name: 'newsletterConsent',
        label: 'Ich möchte den Newsletter erhalten.',
        required: false,
      },
      {
        type: 'checkbox',
        name: 'termsAccepted',
        label: 'Ich akzeptiere die Allgemeinen Geschäftsbedingungen.',
        required: true,
      },
      {
        type: 'checkbox',
        name: 'marketingConsent',
        label: 'Ich bin mit Marketingkommunikation einverstanden.',
        required: false,
      },
    ],
  },
  {
    id: 'data-privacy',
    name: 'Datenschutz-Präferenzen',
    description: 'Cookies, Tracking, Datennutzung',
    icon: '🔒',
    fields: [
      {
        type: 'checkbox',
        name: 'essentialCookies',
        label: 'Technisch notwendige Cookies (erforderlich)',
        required: true,
      },
      {
        type: 'checkbox',
        name: 'analyticsCookies',
        label: 'Analyse-Cookies für Website-Verbesserung',
        required: false,
      },
      {
        type: 'checkbox',
        name: 'marketingCookies',
        label: 'Marketing-Cookies für personalisierte Werbung',
        required: false,
      },
      {
        type: 'select',
        name: 'dataRetention',
        label: 'Datenaufbewahrung',
        required: false,
        options: [
          { label: 'Minimum erforderlich', value: 'minimum' },
          { label: 'Standard (2 Jahre)', value: 'standard' },
          { label: 'Erweitert (5 Jahre)', value: 'extended' },
        ],
      },
    ],
  },

  // Education & Training
  {
    id: 'course-enrollment',
    name: 'Kursanmeldung',
    description: 'Kurs, Level, Vorkenntnisse',
    icon: '📚',
    fields: [
      {
        type: 'text',
        name: 'courseName',
        label: 'Kursname',
        required: true,
        placeholder: 'Web Development Bootcamp',
      },
      {
        type: 'select',
        name: 'courseLevel',
        label: 'Kurslevel',
        required: true,
        options: [
          { label: 'Anfänger', value: 'beginner' },
          { label: 'Fortgeschritten', value: 'intermediate' },
          { label: 'Experte', value: 'advanced' },
        ],
      },
      {
        type: 'textarea',
        name: 'priorExperience',
        label: 'Vorkenntnisse',
        required: false,
        placeholder: 'Beschreiben Sie Ihre Erfahrung...',
      },
      {
        type: 'textarea',
        name: 'learningGoals',
        label: 'Lernziele',
        required: false,
        placeholder: 'Was möchten Sie erreichen?',
      },
    ],
  },

  // Travel & Accommodation
  {
    id: 'travel-booking',
    name: 'Reisebuchung',
    description: 'Destination, Daten, Präferenzen',
    icon: '✈️',
    fields: [
      {
        type: 'text',
        name: 'destination',
        label: 'Reiseziel',
        required: true,
        placeholder: 'Zürich, Schweiz',
      },
      { type: 'date', name: 'departureDate', label: 'Abreisedatum', required: true },
      { type: 'date', name: 'returnDate', label: 'Rückreisedatum', required: true },
      {
        type: 'select',
        name: 'accommodation',
        label: 'Unterkunft',
        required: false,
        options: [
          { label: 'Hotel', value: 'hotel' },
          { label: 'Airbnb', value: 'airbnb' },
          { label: 'Hostel', value: 'hostel' },
          { label: 'Nicht benötigt', value: 'none' },
        ],
      },
    ],
  },
];

// Full form templates (kept minimal since focus is on sections)
export const formTemplates = [
  {
    id: 'contact-form',
    name: 'Kontaktformular',
    description: 'Klassisches Kontaktformular für Websites',
    fields: [
      { type: 'text' as const, name: 'name', label: 'Name', required: true },
      { type: 'email' as const, name: 'email', label: 'E-Mail', required: true },
      { type: 'text' as const, name: 'subject', label: 'Betreff', required: true },
      { type: 'textarea' as const, name: 'message', label: 'Nachricht', required: true, rows: 5 },
    ],
  },
  {
    id: 'registration-form',
    name: 'Anmeldeformular',
    description: 'Benutzerregistrierung mit Profildaten',
    fields: [
      { type: 'text' as const, name: 'firstName', label: 'Vorname', required: true },
      { type: 'text' as const, name: 'lastName', label: 'Nachname', required: true },
      { type: 'email' as const, name: 'email', label: 'E-Mail', required: true },
      { type: 'password' as const, name: 'password', label: 'Passwort', required: true },
      { type: 'tel' as const, name: 'phone', label: 'Telefon', required: false },
      { type: 'checkbox' as const, name: 'terms', label: 'Ich akzeptiere die AGB', required: true },
    ],
  },
  {
    id: 'feedback-form',
    name: 'Feedback-Formular',
    description: 'Kundenfeedback und Bewertungen',
    fields: [
      { type: 'text' as const, name: 'customerName', label: 'Name', required: true },
      {
        type: 'select' as const,
        name: 'rating',
        label: 'Bewertung',
        required: true,
        options: [
          { label: 'Sehr zufrieden', value: '5' },
          { label: 'Zufrieden', value: '4' },
          { label: 'Neutral', value: '3' },
          { label: 'Unzufrieden', value: '2' },
          { label: 'Sehr unzufrieden', value: '1' },
        ],
      },
      {
        type: 'textarea' as const,
        name: 'comments',
        label: 'Kommentare',
        required: false,
        rows: 4,
      },
      {
        type: 'checkbox' as const,
        name: 'followUp',
        label: 'Ich möchte kontaktiert werden',
        required: false,
      },
    ],
  },
];

// Combined templates for unified access
export const allTemplates = {
  micro: microTemplates,
  forms: formTemplates,
  // This will be populated from user's saved templates
  saved: [] as (FieldTemplate | FormTemplate)[],
};

// Helper functions
export const getTemplatesByCategory = (category: 'micro' | 'forms' | 'saved') => {
  return allTemplates[category];
};

export const getAllTemplates = () => {
  return [
    ...microTemplates.map((t) => ({
      ...t,
      category: 'micro' as const,
      type: 'field-group' as const,
    })),
    ...formTemplates.map((t) => ({ ...t, category: 'forms' as const, type: 'full-form' as const })),
    ...allTemplates.saved.map((t) => ({ ...t, category: 'saved' as const })),
  ];
};

// For loading user's saved templates
export const loadSavedTemplates = (userTemplates: (FieldTemplate | FormTemplate)[]) => {
  allTemplates.saved = userTemplates;
};

// Helper to get templates by use case
export const getTemplatesByUseCase = (useCase: string) => {
  const useCaseMap: Record<string, string[]> = {
    hr: ['contact-basic', 'personal-details', 'employment-details', 'skills-qualifications'],
    medical: ['contact-basic', 'health-basic', 'medical-history', 'legal-consent'],
    event: ['contact-basic', 'event-registration', 'workshop-preferences', 'payment-info'],
    customer: ['contact-basic', 'customer-feedback', 'support-request', 'legal-consent'],
    education: ['contact-basic', 'personal-details', 'course-enrollment', 'payment-info'],
    business: ['contact-basic', 'company-info', 'employment-details', 'banking-details'],
  };

  const templateIds = useCaseMap[useCase] || [];
  return microTemplates.filter((t) => templateIds.includes(t.id));
};
