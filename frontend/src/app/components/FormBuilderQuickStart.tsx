'use client';

import React, { useState } from 'react';
import {
  CameraIcon,
  DocumentArrowUpIcon,
  SquaresPlusIcon,
  RocketLaunchIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { fieldBlocks } from '../data/fieldBlocks';
import { fieldTemplates } from '../data/fieldTemplates';
import { visionService, VisionAnalysisProgress } from '../services/visionService';
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';

interface FormBuilderQuickStartProps {
  onMethodSelect: (method: 'manual' | 'blocks' | 'templates') => void;
}

export function FormBuilderQuickStart({ onMethodSelect }: FormBuilderQuickStartProps) {
  const { addField, steps, isMultiStep, currentStep } = useFormBuilderStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<VisionAnalysisProgress | null>(null);

  const handleVisionUpload = async (file: File) => {
    const validation = visionService.isValidFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsProcessing(true);
    setAnalysisProgress(null);

    try {
      const result =
        file.type === 'application/pdf'
          ? await visionService.analyzePDF(file, setAnalysisProgress)
          : await visionService.analyzeImage(file, setAnalysisProgress);

      if (result.success) {
        const stepId = isMultiStep ? steps[currentStep]?.id : undefined;

        // Add analyzed fields to the form
        result.fields.forEach((fieldConfig) => {
          addField(fieldConfig.type, stepId);
          // Note: Field configuration would be updated here in a real implementation
        });

        onMethodSelect('manual');
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
          <SparklesIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Wie möchten Sie Ihr Formular erstellen?
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Wählen Sie die Methode, die am besten zu Ihrem Workflow passt
          </p>
        </div>

        {/* Creation Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Manual Creation + Upload */}
          <div
            onClick={() => onMethodSelect('manual')}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 p-6 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-4">
                <SquaresPlusIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Felder hinzufügen
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Manuell oder per Upload</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Einzelne Felder, Bausteine oder Upload von Screenshots/PDFs. KI erstellt automatisch
              Felder aus Ihren Bildern.
            </p>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                📝 Einzelfelder
              </span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-full">
                📸 KI-Upload
              </span>
            </div>
            <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
              <span>Jetzt starten</span>
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Field Blocks */}
          <div
            onClick={() => onMethodSelect('blocks')}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 p-6 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg mr-4">
                <div className="h-8 w-8 text-green-600 dark:text-green-400 text-2xl">🧱</div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Mit Bausteinen
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Fertige Feldgruppen</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Effizient: Kombinieren Sie vorgefertigte Bausteine wie Kontaktdaten, Adresse oder
              Firmendaten.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {fieldBlocks.slice(0, 3).map((block) => (
                <span
                  key={block.id}
                  className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full"
                >
                  {block.name}
                </span>
              ))}
            </div>
            <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
              <span>Bausteine ansehen</span>
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Templates */}
          <div
            onClick={() => onMethodSelect('templates')}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 p-6 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center mb-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg mr-4">
                <RocketLaunchIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Aus Vorlage</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Bewährte Formulare</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Schnellstart: Verwenden Sie professionelle Vorlagen und passen Sie diese an Ihre
              Bedürfnisse an.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {fieldTemplates.slice(0, 3).map((template) => (
                <span
                  key={template.id}
                  className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded-full"
                >
                  {template.name}
                </span>
              ))}
            </div>
            <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
              <span>Vorlagen durchsuchen</span>
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Hidden file input for central upload */}
        <input
          id="central-file-input"
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Bottom help text */}
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            💡 Sie können jederzeit zwischen den Methoden wechseln und verschiedene Ansätze
            kombinieren
          </p>
        </div>
      </div>
    </div>
  );
}
