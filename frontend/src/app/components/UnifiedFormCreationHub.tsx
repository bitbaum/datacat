'use client';

import React, { useState } from 'react';
import {
  PlusIcon,
  SquaresPlusIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { useModal } from '../hooks/useModal';
import { visionService, VisionAnalysisProgress } from '../services/visionService';
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';
import { useAuth } from '../context/AuthContext';
import { FieldTemplate } from '../types/form';
import { microTemplates } from '../data/templates';

interface UnifiedFormCreationHubProps {
  onMethodSelect: (method: 'fields' | 'sections' | 'templates' | 'saved-forms' | 'upload') => void;
  onShowSectionLibrary: () => void;
  onShowTemplateLibrary: () => void;
  onShowSavedForms: () => void;
}

export function UnifiedFormCreationHub({
  onMethodSelect,
  onShowSectionLibrary,
  onShowTemplateLibrary,
  onShowSavedForms,
}: UnifiedFormCreationHubProps) {
  const { addField, addTemplateFields, steps, isMultiStep, currentStep } = useFormBuilderStore();
  const { token } = useAuth();
  const processingModal = useModal();
  const [analysisProgress, setAnalysisProgress] = useState<VisionAnalysisProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isLoggedIn = !!token;

  // Individual field types for quick adding - reuse same logic as sidebar
  const fieldTypes = [
    { type: 'text', label: 'Text', icon: '📝', description: 'Einfaches Textfeld' },
    { type: 'email', label: 'E-Mail', icon: '📧', description: 'E-Mail-Adresse' },
    { type: 'tel', label: 'Telefon', icon: '📞', description: 'Telefonnummer' },
    { type: 'date', label: 'Datum', icon: '📅', description: 'Datumsauswahl' },
    { type: 'select', label: 'Auswahl', icon: '📋', description: 'Dropdown-Menü' },
    { type: 'textarea', label: 'Textbereich', icon: '📄', description: 'Mehrzeiliger Text' },
  ];

  // Popular sections for quick preview
  const popularSections = microTemplates.slice(0, 6);

  // Use exactly the same logic as sidebar - just call addField directly
  const handleQuickAddField = (type: string) => {
    const stepId = isMultiStep ? steps[currentStep]?.id : undefined;
    if (isMultiStep && !stepId) {
      console.error('Cannot add field, no step selected.');
      return;
    }

    // Call store function directly - same as sidebar
    addField(type as any, stepId);

    // Navigate to builder immediately to see the result
    onMethodSelect('fields');
  };

  // Use exactly the same logic as sidebar - just call addTemplateFields directly
  const handleQuickAddSection = (section: FieldTemplate) => {
    const stepId = isMultiStep ? steps[currentStep]?.id : undefined;
    if (isMultiStep && !stepId) {
      console.error('Cannot add template, no step selected.');
      return;
    }

    // Call store function directly - same as sidebar
    addTemplateFields(section, stepId);

    // Navigate to builder immediately to see the result
    onMethodSelect('fields');
  };

  const handleVisionUpload = async (file: File) => {
    const validation = visionService.isValidFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsProcessing(true);
    setAnalysisProgress(null);
    onMethodSelect('upload');

    try {
      const result =
        file.type === 'application/pdf'
          ? await visionService.analyzePDF(file, (progress) => setAnalysisProgress(progress))
          : await visionService.analyzeImage(file, (progress) => setAnalysisProgress(progress));

      if (result.success && result.fields) {
        const stepId = isMultiStep ? steps[currentStep]?.id : undefined;
        addTemplateFields(
          {
            fields: result.fields,
            name: 'Vision Analysis',
            description: 'AI-generated fields from image analysis',
          } as any,
          stepId,
        );
      } else {
        alert(result.error || 'Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('Vision analysis failed:', error);
      alert('Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsProcessing(false);
      setAnalysisProgress(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleVisionUpload(file);
    }
  };

  if (isProcessing && analysisProgress) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {analysisProgress.progress}%
              </span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {analysisProgress.stage === 'uploading' && 'Datei wird hochgeladen...'}
            {analysisProgress.stage === 'processing' && 'Dokument wird analysiert...'}
            {analysisProgress.stage === 'generating' && 'Felder werden generiert...'}
          </h3>
          <div className="w-64 bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${analysisProgress.progress}%` }}
            ></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Bitte warten Sie einen Moment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center animate-in slide-in-from-top duration-700">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Formular erstellen
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Wählen Sie einzelne Felder, vorgefertigte Sektionen oder vollständige Vorlagen
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom duration-700 delay-200">
        {/* Left Column: Einzelne Felder */}
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 transform transition-transform duration-300 hover:scale-110">
              <PlusIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Einzelne Felder
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Fügen Sie individuelle Felder hinzu
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {fieldTypes.map((fieldType, index) => (
              <button
                key={fieldType.type}
                onClick={() => handleQuickAddField(fieldType.type)}
                className="relative flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-300 group animate-in slide-in-from-left delay-[var(--delay)] hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-500 hover:scale-105 hover:shadow-md"
                title={fieldType.description}
                style={{ '--delay': `${(index + 1) * 100}ms` } as React.CSSProperties}
              >
                <span className="text-3xl mb-2 transition-all duration-300 group-hover:scale-110">
                  {fieldType.icon}
                </span>
                <span className="text-sm font-medium transition-colors duration-300 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {fieldType.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {fieldType.description}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onShowSectionLibrary}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            Alle Feldtypen anzeigen
          </button>
        </div>

        {/* Right Column: Sektionen */}
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4 transform transition-transform duration-300 hover:scale-110">
              <SquaresPlusIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sektionen</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Verwenden Sie vorgefertigte Feldgruppen
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {popularSections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => handleQuickAddSection(section)}
                className="relative flex items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-300 group text-left animate-in slide-in-from-right delay-[var(--delay)] hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-500 hover:scale-102 hover:shadow-md"
                style={{ '--delay': `${(index + 1) * 100}ms` } as React.CSSProperties}
              >
                <span className="text-2xl mr-4 transition-transform duration-300 group-hover:scale-110">
                  {section.icon}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium transition-colors duration-300 text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                    {section.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {section.description} • {section.fields.length} Felder
                  </div>
                </div>
                <PlusIcon className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors duration-300" />
              </button>
            ))}
          </div>

          <button
            onClick={onShowSectionLibrary}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            Alle Sektionen anzeigen
          </button>
        </div>
      </div>

      {/* Secondary Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom duration-700 delay-500">
        {/* Complete Templates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg group">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110">
            <DocumentDuplicateIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
            Vollständige Vorlagen
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Professionelle, fertige Formulare
          </p>
          <button
            onClick={onShowTemplateLibrary}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Vorlagen durchsuchen
          </button>
        </div>

        {/* Saved Forms */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg group">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110">
            <FolderIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
            Gespeicherte Formulare
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            {isLoggedIn ? 'Ihre persönlichen Formulare' : 'Anmeldung erforderlich'}
          </p>
          <button
            onClick={onShowSavedForms}
            className={`w-full px-4 py-2 font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
              isLoggedIn
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {isLoggedIn ? 'Öffnen' : 'Anmelden'}
          </button>
        </div>

        {/* File Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg group">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110">
            <DocumentArrowUpIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
            Datei hochladen
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">Bild oder PDF analysieren</p>
          <div className="space-y-2">
            <label className="block">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="sr-only"
              />
              <div className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-300 cursor-pointer text-sm hover:scale-105 active:scale-95">
                Datei auswählen
              </div>
            </label>

            <button
              disabled
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-medium rounded-lg cursor-not-allowed text-sm transition-all duration-300 relative overflow-hidden"
              title="Bald verfügbar für mobile Geräte"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] animate-[shimmer_2s_infinite]"></div>
              📷 Foto aufnehmen
              <span className="block text-xs mt-1">Bald verfügbar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 animate-in slide-in-from-bottom duration-700 delay-700">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          💡 So einfach geht's
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-start space-x-2 animate-in slide-in-from-left duration-500 delay-800">
            <span className="text-blue-500">🖱️</span>
            <span>
              <strong>Ein Klick:</strong> Feld wird sofort hinzugefügt und in der linken Struktur
              angezeigt
            </span>
          </div>
          <div className="flex items-start space-x-2 animate-in slide-in-from-right duration-500 delay-900">
            <span className="text-green-500">⚡</span>
            <span>
              <strong>Sofort sichtbar:</strong> Klicken Sie auf "Struktur" links, um Ihre Felder zu
              sehen
            </span>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-200%);
          }
          100% {
            transform: translateX(200%);
          }
        }

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

        .slide-in-from-left {
          animation: slideInFromLeft 0.5s ease-out;
        }

        .slide-in-from-right {
          animation: slideInFromRight 0.5s ease-out;
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

        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
