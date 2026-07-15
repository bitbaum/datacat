'use client';

import React, { useState, useEffect } from 'react';
import { SquaresPlusIcon, DocumentArrowUpIcon, CameraIcon } from '@heroicons/react/24/outline';
import { visionService, VisionAnalysisProgress } from '../services/visionService';
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';
import { TemplateLibrary } from './TemplateLibrary';
import { microTemplates, formTemplates } from '../data/templates';
import { useAuth } from '../context/AuthContext';

interface SavedTemplateSummary {
  id: string;
  title: string;
}

interface FormCreationHubProps {
  onMethodSelect: (method: 'fields' | 'templates' | 'upload') => void;
  onShowTemplateLibrary: () => void;
}

export function FormCreationHub({ onMethodSelect, onShowTemplateLibrary }: FormCreationHubProps) {
  const { addField, steps, isMultiStep, currentStep, fields } = useFormBuilderStore();
  const { token } = useAuth(); // Use proper auth context
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<VisionAnalysisProgress | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  // Check if user is logged in using auth context
  const isLoggedIn = !!token;
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplateSummary[]>([]);

  useEffect(() => {
    if (!token) {
      setSavedTemplates([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v1/forms', { headers: { 'x-auth-token': token } });
        if (!res.ok) throw new Error('Failed to fetch saved templates');
        const data = await res.json();
        if (cancelled) return;
        setSavedTemplates(
          data
            .filter((form: { is_template?: boolean }) => form.is_template)
            .map((form: { id: string; title: string }) => ({ id: form.id, title: form.title }))
        );
      } catch (error) {
        console.error('Error fetching saved templates:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleVisionUpload = async (file: File) => {
    const validation = visionService.isValidFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsProcessing(true);
    setAnalysisProgress(null);

    try {
      const result = file.type === 'application/pdf' 
        ? await visionService.analyzePDF(file, setAnalysisProgress)
        : await visionService.analyzeImage(file, setAnalysisProgress);

      if (result.success) {
        const stepId = isMultiStep ? steps[currentStep]?.id : undefined;
        
        // Add analyzed fields to the form
        result.fields.forEach(fieldConfig => {
          addField(fieldConfig.type, stepId);
          // Update the newly added field with the analyzed configuration
          const currentFields = isMultiStep ? steps[currentStep]?.fields || [] : fields;
          const newField = currentFields[currentFields.length - 1];
          if (newField) {
            Object.assign(newField, {
              label: fieldConfig.label,
              name: fieldConfig.name,
              required: fieldConfig.required,
              placeholder: fieldConfig.placeholder,
              options: fieldConfig.options
            });
          }
        });

        onMethodSelect('upload');
      } else {
        alert(`Analyse fehlgeschlagen: ${result.error}`);
      }
    } catch (error) {
      alert('Fehler beim Analysieren der Datei');
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

  const handleSavedTemplatesClick = () => {
    if (!isLoggedIn) {
      alert('Bitte melden Sie sich an, um auf Ihre gespeicherten Vorlagen zuzugreifen.');
      return;
    }
    onMethodSelect('templates');
  };

  const handleTemplateLibraryClick = () => {
    setShowTemplateLibrary(true);
    onShowTemplateLibrary();
  };

  if (showTemplateLibrary) {
    return (
      <div className="h-full">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vorlagen-Bibliothek</h2>
          <button
            onClick={() => setShowTemplateLibrary(false)}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Zurück
          </button>
        </div>
        <TemplateLibrary 
          onUseTemplate={(template) => {
            // Handle template selection
            setShowTemplateLibrary(false);
            onMethodSelect('templates');
          }}
          onPreviewTemplate={(template) => {
            // Handle template preview
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  KI analysiert Ihr Formular
                </h3>
                {analysisProgress && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {analysisProgress.message}
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${analysisProgress.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {analysisProgress.progress}% abgeschlossen
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-4">
            <SquaresPlusIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Fügen Sie Ihr erstes Feld hinzu
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Beginnen Sie mit einem einzelnen Feld oder fügen Sie eine vordefinierte Sektion hinzu, um Ihr perfektes Formular zu erstellen.
          </p>
        </div>

        {/* Creation Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Individual Fields */}
          <div 
            onClick={() => onMethodSelect('fields')}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 p-6 transition-all duration-200 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <SquaresPlusIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Einzelne Felder
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Text, E-Mail, Telefon, Datum, Auswahl, Textbereich
              </p>
              <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                <span>Felder hinzufügen</span>
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Field Sections */}
          <div 
            onClick={() => onMethodSelect('templates')}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 p-6 transition-all duration-200 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="text-2xl">🧱</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Sektionen
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Persönliche Daten, Kontaktdaten, Adresse, Berufsinformationen
              </p>
              <div className="flex flex-wrap gap-1 mb-4 justify-center">
                {microTemplates.slice(0, 3).map(template => (
                  <span key={template.id} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                    {template.name}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                <span>Sektionen ansehen</span>
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Complete Templates */}
          <div 
            onClick={handleTemplateLibraryClick}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 p-6 transition-all duration-200 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <DocumentArrowUpIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Komplette Formulare
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                HR Mitarbeiter-Erfassung, HR Mitarbeiter-Onboarding (Mehrstufig)
              </p>
              <div className="flex flex-wrap gap-1 mb-4 justify-center">
                {formTemplates.slice(0, 2).map(template => (
                  <span key={template.id} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded-full">
                    {template.name}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                <span>Bibliothek durchsuchen</span>
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div 
            onClick={() => document.getElementById('hub-file-input')?.click()}
            className="group cursor-pointer bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-500 dark:hover:border-indigo-500 p-6 transition-all duration-200 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CameraIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Datei hochladen
                <span className="ml-2 px-2 py-1 bg-indigo-600 text-white text-xs rounded-full">KI</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Screenshot oder PDF hochladen und automatisch ein Formular generieren lassen
              </p>
              <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                <span>Datei auswählen</span>
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Templates Row - Only when logged in */}
        {isLoggedIn && savedTemplates.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ihre gespeicherten Vorlagen</h3>
            <div 
              onClick={handleSavedTemplatesClick}
              className="group cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-500 p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex items-center">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg mr-4">
                  <div className="text-2xl">⭐</div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Gespeicherte Vorlagen</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Ihre eigenen, gespeicherten Formular-Vorlagen</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          id="hub-file-input"
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Bottom help text */}
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            💡 Sie können jederzeit zwischen den Methoden wechseln und verschiedene Ansätze kombinieren
          </p>
        </div>
      </div>
    </div>
  );
} 