'use client';

import React, { useState } from 'react';
import { FieldTemplate } from '../types/form';
import { microTemplates } from '../data/templates';

interface SectionLibraryProps {
  onUseSection: (section: FieldTemplate) => void;
  onPreviewSection?: (section: FieldTemplate) => void;
  onBack?: () => void;
}

export function SectionLibrary({ onUseSection, onPreviewSection, onBack }: SectionLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories from templates
  const categories = [
    'all',
    ...Array.from(
      new Set(
        microTemplates.map((t) => {
          if (t.id.includes('contact') || t.id.includes('personal')) return 'personal';
          if (t.id.includes('address') || t.id.includes('location')) return 'address';
          if (t.id.includes('work') || t.id.includes('employment') || t.id.includes('job'))
            return 'work';
          if (t.id.includes('education') || t.id.includes('school')) return 'education';
          if (t.id.includes('emergency') || t.id.includes('medical')) return 'emergency';
          if (t.id.includes('financial') || t.id.includes('bank')) return 'financial';
          return 'other';
        }),
      ),
    ),
  ];

  const filteredSections = microTemplates.filter((section) => {
    const matchesSearch =
      section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedCategory === 'all') return matchesSearch;

    const sectionCategory =
      section.id.includes('contact') || section.id.includes('personal')
        ? 'personal'
        : section.id.includes('address') || section.id.includes('location')
          ? 'address'
          : section.id.includes('work') ||
              section.id.includes('employment') ||
              section.id.includes('job')
            ? 'work'
            : section.id.includes('education') || section.id.includes('school')
              ? 'education'
              : section.id.includes('emergency') || section.id.includes('medical')
                ? 'emergency'
                : section.id.includes('financial') || section.id.includes('bank')
                  ? 'financial'
                  : 'other';

    return matchesSearch && sectionCategory === selectedCategory;
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      all: 'Alle',
      personal: 'Persönlich',
      address: 'Adresse',
      work: 'Beruf',
      education: 'Bildung',
      emergency: 'Notfall',
      financial: 'Finanzen',
      other: 'Andere',
    };
    return labels[category] || category;
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 animate-in slide-in-from-top duration-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Sektionen-Bibliothek
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Verwenden Sie vorgefertigte Feldgruppen für häufige Formular-Abschnitte
              </p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 group"
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

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 animate-in slide-in-from-top duration-700 delay-200">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Sektion suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:shadow-md"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:shadow-md"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-700 delay-300">
          {filteredSections.map((section, index) => (
            <div
              key={section.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-105 hover:border-green-300 dark:hover:border-green-500 group animate-in slide-in-from-bottom delay-[var(--delay)]"
              style={{ '--delay': `${(index + 1) * 100}ms` } as React.CSSProperties}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl transition-transform duration-300 group-hover:scale-110">
                      {section.icon}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                        {section.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Field Preview */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {section.fields.length} Felder:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {section.fields.slice(0, 4).map((field, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200 hover:bg-green-100 dark:hover:bg-green-900/30"
                      >
                        {field.label}
                      </span>
                    ))}
                    {section.fields.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        +{section.fields.length - 4} weitere
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => onUseSection(section)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md"
                  >
                    Verwenden
                  </button>
                  {onPreviewSection && (
                    <button
                      onClick={() => onPreviewSection(section)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      Vorschau
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSections.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine Sektionen gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Versuchen Sie einen anderen Suchbegriff oder wählen Sie eine andere Kategorie.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
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

        .slide-in-from-bottom {
          animation: slideInFromBottom 0.7s ease-out;
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

        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(20px);
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
