'use client';

import React, { useState } from 'react';
import { FieldConfig, FormTemplate } from '../types/form';
import { FilterControls, Filter, FilterOption } from './FilterControls';

// Local type that omits `id` for fields (template fields get fresh ids when used)
export type TemplateData = Omit<FormTemplate, 'fields'> & {
  fields: Omit<FieldConfig, 'id'>[];
  category: string;
  icon: string;
  usageCount: number;
  tags: string[];
  createdAt: string;
  isPopular?: boolean;
};

interface TemplateLibraryProps {
  onUseTemplate: (template: TemplateData) => void;
  onPreviewTemplate: (template: TemplateData) => void;
  onBack?: () => void; // Optional back navigation for builder context
}

export function TemplateLibrary({
  onUseTemplate,
  onPreviewTemplate,
  onBack,
}: TemplateLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string | string[]>>({
    category: 'all',
    tags: [],
  });
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const defaultFilters = { category: 'all', tags: [] };
  const defaultSortBy = 'popular';

  const isFiltered =
    searchTerm !== '' ||
    sortBy !== defaultSortBy ||
    JSON.stringify(selectedFilters) !== JSON.stringify(defaultFilters);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFilters(defaultFilters);
    setSortBy(defaultSortBy);
  };

  const templates: TemplateData[] = [
    {
      id: 'employee-onboarding',
      name: 'Mitarbeiter-Onboarding',
      description:
        'Vollständiges Onboarding-Formular für neue Mitarbeiter mit allen notwendigen Informationen',
      category: 'hr',
      icon: '👥',
      tags: ['hr', 'onboarding', 'personal', 'kontakt'],
      isPopular: true,
      createdAt: '2024-01-15',
      usageCount: 145,
      fields: [
        { type: 'text', name: 'vorname', label: 'Vorname', required: true },
        { type: 'text', name: 'nachname', label: 'Nachname', required: true },
        { type: 'email', name: 'email', label: 'E-Mail-Adresse', required: true },
        { type: 'tel', name: 'telefon', label: 'Telefonnummer', required: true },
        { type: 'date', name: 'geburtsdatum', label: 'Geburtsdatum', required: true },
        { type: 'text', name: 'position', label: 'Position', required: true },
        { type: 'date', name: 'startdatum', label: 'Startdatum', required: true },
        {
          type: 'select',
          name: 'abteilung',
          label: 'Abteilung',
          required: true,
          options: [
            { value: '', label: 'Abteilung wählen' },
            { value: 'it', label: 'IT' },
            { value: 'hr', label: 'Human Resources' },
            { value: 'sales', label: 'Vertrieb' },
            { value: 'marketing', label: 'Marketing' },
          ],
        },
      ],
    },
    {
      id: 'customer-feedback',
      name: 'Kundenfeedback',
      description:
        'Sammeln Sie wertvolles Feedback von Ihren Kunden mit diesem umfassenden Formular',
      category: 'feedback',
      icon: '⭐',
      tags: ['feedback', 'kunde', 'bewertung', 'zufriedenheit'],
      isPopular: true,
      createdAt: '2024-01-10',
      usageCount: 89,
      fields: [
        { type: 'text', name: 'name', label: 'Name', required: false },
        { type: 'email', name: 'email', label: 'E-Mail (optional)', required: false },
        {
          type: 'select',
          name: 'bewertung',
          label: 'Gesamtbewertung',
          required: true,
          options: [
            { value: '', label: 'Bewertung wählen' },
            { value: '5', label: '⭐⭐⭐⭐⭐ Ausgezeichnet' },
            { value: '4', label: '⭐⭐⭐⭐ Gut' },
            { value: '3', label: '⭐⭐⭐ Durchschnittlich' },
            { value: '2', label: '⭐⭐ Schlecht' },
            { value: '1', label: '⭐ Sehr schlecht' },
          ],
        },
        { type: 'textarea', name: 'kommentar', label: 'Ihr Feedback', required: true, rows: 4 },
        {
          type: 'select',
          name: 'weiterempfehlung',
          label: 'Würden Sie uns weiterempfehlen?',
          required: true,
          options: [
            { value: '', label: 'Auswahl treffen' },
            { value: 'ja', label: 'Ja, definitiv' },
            { value: 'vielleicht', label: 'Vielleicht' },
            { value: 'nein', label: 'Nein' },
          ],
        },
      ],
    },
    {
      id: 'event-registration',
      name: 'Event-Anmeldung',
      description: 'Professionelles Anmeldeformular für Events, Workshops und Veranstaltungen',
      category: 'events',
      icon: '🎉',
      tags: ['event', 'anmeldung', 'workshop', 'veranstaltung'],
      createdAt: '2024-01-08',
      usageCount: 67,
      fields: [
        { type: 'text', name: 'vorname', label: 'Vorname', required: true },
        { type: 'text', name: 'nachname', label: 'Nachname', required: true },
        { type: 'email', name: 'email', label: 'E-Mail-Adresse', required: true },
        { type: 'tel', name: 'telefon', label: 'Telefonnummer', required: false },
        { type: 'text', name: 'firma', label: 'Firma/Organisation', required: false },
        {
          type: 'select',
          name: 'ticket_typ',
          label: 'Ticket-Typ',
          required: true,
          options: [
            { value: '', label: 'Ticket-Typ wählen' },
            { value: 'standard', label: 'Standard (CHF 50)' },
            { value: 'premium', label: 'Premium (CHF 100)' },
            { value: 'student', label: 'Student (CHF 25)' },
          ],
        },
        {
          type: 'textarea',
          name: 'besondere_anforderungen',
          label: 'Besondere Anforderungen',
          required: false,
          rows: 3,
        },
      ],
    },
    {
      id: 'contact-form',
      name: 'Kontaktformular',
      description: 'Einfaches und effektives Kontaktformular für Ihre Website',
      category: 'contact',
      icon: '📞',
      tags: ['kontakt', 'website', 'anfrage', 'support'],
      isPopular: true,
      createdAt: '2024-01-12',
      usageCount: 234,
      fields: [
        { type: 'text', name: 'name', label: 'Name', required: true },
        { type: 'email', name: 'email', label: 'E-Mail-Adresse', required: true },
        { type: 'text', name: 'betreff', label: 'Betreff', required: true },
        { type: 'textarea', name: 'nachricht', label: 'Nachricht', required: true, rows: 5 },
      ],
    },
    {
      id: 'job-application',
      name: 'Bewerbungsformular',
      description: 'Umfassendes Formular für Stellenbewerbungen mit allen wichtigen Informationen',
      category: 'hr',
      icon: '💼',
      tags: ['bewerbung', 'job', 'hr', 'karriere'],
      createdAt: '2024-01-05',
      usageCount: 156,
      fields: [
        { type: 'text', name: 'vorname', label: 'Vorname', required: true },
        { type: 'text', name: 'nachname', label: 'Nachname', required: true },
        { type: 'email', name: 'email', label: 'E-Mail-Adresse', required: true },
        { type: 'tel', name: 'telefon', label: 'Telefonnummer', required: true },
        { type: 'text', name: 'position', label: 'Gewünschte Position', required: true },
        {
          type: 'select',
          name: 'verfuegbarkeit',
          label: 'Verfügbarkeit',
          required: true,
          options: [
            { value: '', label: 'Verfügbarkeit wählen' },
            { value: 'sofort', label: 'Sofort verfügbar' },
            { value: '1monat', label: 'In 1 Monat' },
            { value: '3monate', label: 'In 3 Monaten' },
            { value: 'nach_vereinbarung', label: 'Nach Vereinbarung' },
          ],
        },
        { type: 'textarea', name: 'motivation', label: 'Motivation', required: true, rows: 4 },
      ],
    },
    {
      id: 'survey-basic',
      name: 'Basis-Umfrage',
      description: 'Einfache Umfrage-Vorlage für Marktforschung und Meinungsumfragen',
      category: 'survey',
      icon: '📊',
      tags: ['umfrage', 'marktforschung', 'meinung', 'daten'],
      createdAt: '2024-01-03',
      usageCount: 78,
      fields: [
        {
          type: 'select',
          name: 'alter',
          label: 'Altersgruppe',
          required: true,
          options: [
            { value: '', label: 'Altersgruppe wählen' },
            { value: '18-25', label: '18-25 Jahre' },
            { value: '26-35', label: '26-35 Jahre' },
            { value: '36-45', label: '36-45 Jahre' },
            { value: '46-55', label: '46-55 Jahre' },
            { value: '56+', label: '56+ Jahre' },
          ],
        },
        {
          type: 'select',
          name: 'geschlecht',
          label: 'Geschlecht',
          required: false,
          options: [
            { value: '', label: 'Auswahl treffen' },
            { value: 'männlich', label: 'Männlich' },
            { value: 'weiblich', label: 'Weiblich' },
            { value: 'divers', label: 'Divers' },
            { value: 'keine_angabe', label: 'Keine Angabe' },
          ],
        },
        { type: 'textarea', name: 'feedback', label: 'Ihr Feedback', required: true, rows: 4 },
      ],
    },
  ];

  const allTags = [...new Set(templates.flatMap((t) => t.tags))];
  const tagOptions: FilterOption[] = allTags.map((tag) => ({ value: tag, label: tag }));

  const categories = [
    { value: 'all', label: 'Alle Kategorien' },
    { value: 'hr', label: 'Personal & HR' },
    { value: 'contact', label: 'Kontakt' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'events', label: 'Events' },
    { value: 'survey', label: 'Umfragen' },
  ];

  const sortOptions: FilterOption[] = [
    { value: 'popular', label: 'Beliebtheit' },
    { value: 'recent', label: 'Neueste' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
  ];

  const filters: Filter[] = [
    {
      id: 'category',
      label: 'Kategorie',
      options: categories,
    },
    {
      id: 'tags',
      label: 'Tags',
      type: 'pills',
      options: tagOptions,
    },
  ];

  const handleFilterChange = (filterId: string, value: string | string[]) => {
    setSelectedFilters((prev) => ({ ...prev, [filterId]: value }));
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedFilters.category === 'all' || template.category === selectedFilters.category;

    const selectedTags = selectedFilters.tags as string[];
    const matchesTags =
      selectedTags.length === 0 || selectedTags.every((tag) => template.tags.includes(tag));

    return matchesSearch && matchesCategory && matchesTags;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'popular':
      default:
        return (b.usageCount ?? 0) - (a.usageCount ?? 0);
    }
  });

  const popularTemplates = templates.filter((t) => t.isPopular).slice(0, 3);

  const renderTemplateCard = (template: TemplateData) => (
    <div
      key={template.id}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onUseTemplate(template)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{template.icon}</div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {template.usageCount} mal verwendet
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {template.name}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{template.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreviewTemplate(template);
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Vorschau"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  const renderTemplateListItem = (template: TemplateData) => (
    <div
      key={template.id}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onUseTemplate(template)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-2xl">{template.icon}</div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {template.name}
              </h3>
              {template.isPopular && (
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-md font-medium">
                  Beliebt
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{template.fields.length} Felder</span>
              <span>{template.usageCount} mal verwendet</span>
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreviewTemplate(template);
            }}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Vorschau"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <button
            onClick={() => onUseTemplate(template)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Verwenden
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 animate-in slide-in-from-top duration-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Vorlagen-Bibliothek
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Starten Sie schnell mit professionellen Formular-Vorlagen
              </p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg
                  className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Zurück zum Builder
              </button>
            )}
          </div>
        </div>

        <FilterControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          sortByOptions={sortOptions}
          currentSortBy={sortBy}
          onSortByChange={setSortBy}
          isFiltered={isFiltered}
          onClearAll={clearFilters}
        >
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              aria-label="Grid View"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              aria-label="List View"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </FilterControls>

        {/* Popular Templates */}
        {searchTerm === '' && selectedFilters.category === 'all' && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">🔥</span>
              Beliebte Vorlagen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularTemplates.map((template) => renderTemplateCard(template))}
            </div>
          </div>
        )}

        {/* All Templates Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alle Vorlagen</h2>
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Templates Grid / List */}
        {sortedTemplates.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTemplates.map((template) => renderTemplateCard(template))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTemplates.map((template) => renderTemplateListItem(template))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Keine Vorlagen gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Keine Vorlagen gefunden. Versuchen Sie es mit anderen Suchbegriffen.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        .animate-in {
          animation-fill-mode: both;
        }

        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }

        .slide-in-from-top {
          animation: slideInFromTop 0.7s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
