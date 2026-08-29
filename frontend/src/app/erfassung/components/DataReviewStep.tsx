'use client';

import { useState } from 'react';
import { PencilIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { WorkflowProduct } from './ErfassungWorkflow';

interface DataReviewStepProps {
  analysisResult: NonNullable<WorkflowProduct['analysisResult']>;
  onReviewComplete: (reviewedData: any) => void;
  product: WorkflowProduct;
}

export function DataReviewStep({ analysisResult, onReviewComplete, product }: DataReviewStepProps) {
  const [formData, setFormData] = useState({
    title: analysisResult.title,
    manufacturer: analysisResult.manufacturer,
    articleNumber: analysisResult.articleNumber,
    shortDescription: analysisResult.shortDescription,
    longDescription: analysisResult.longDescription,
    price: analysisResult.price,
    weight: analysisResult.weight,
    length: analysisResult.length,
    width: analysisResult.width,
    height: analysisResult.height,
    mainCategoryA: analysisResult.mainCategoryA,
    mainCategoryB: analysisResult.mainCategoryB,
    subCategoryA: analysisResult.subCategoryA,
    subCategoryB: analysisResult.subCategoryB,
    stockQuantity: analysisResult.stockQuantity,
    articleType: analysisResult.articleType,
    unit: analysisResult.unit,
  });

  const [editingField, setEditingField] = useState<string | null>(null);

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContinue = () => {
    onReviewComplete(formData);
  };

  const getConfidenceColor = (field: string) => {
    const confidence = analysisResult.confidence[field] || 0;
    if (confidence >= 0.9) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.7) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceIcon = (field: string) => {
    const confidence = analysisResult.confidence[field] || 0;
    if (confidence >= 0.8) return '✅';
    if (confidence >= 0.6) return '⚠️';
    return '❌';
  };

  const FormField = ({
    label,
    field,
    type = 'text',
    placeholder = '',
    rows = undefined,
  }: {
    label: string;
    field: string;
    type?: string;
    placeholder?: string;
    rows?: number;
  }) => {
    const confidence = analysisResult.confidence[field] || analysisResult.confidence.title || 0;
    const source = 'KI-Analyse';
    const isEditing = editingField === field;
    const isModified =
      formData[field as keyof typeof formData] !==
      analysisResult[field as keyof typeof analysisResult];

    const confidenceColor =
      confidence >= 0.9
        ? 'text-green-600 dark:text-green-400'
        : confidence >= 0.7
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-red-600 dark:text-red-400';

    const borderColor =
      confidence >= 0.9
        ? 'border-green-200 dark:border-green-600'
        : confidence >= 0.7
          ? 'border-yellow-200 dark:border-yellow-600'
          : 'border-red-200 dark:border-red-600';

    return (
      <div
        className={`space-y-2 p-3 rounded-lg border ${borderColor} ${
          confidence < 0.8 ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-gray-50 dark:bg-gray-800/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {isModified && (
              <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">✏️ Bearbeitet</span>
            )}
          </label>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-bold ${confidenceColor}`}>
              {getConfidenceIcon(field)} {Math.round(confidence * 100)}%
            </span>
            <button
              onClick={() => setEditingField(isEditing ? null : field)}
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded"
              title="Bearbeiten"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Source Information */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="font-medium">Quelle:</span> {source}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            {rows ? (
              <textarea
                value={formData[field as keyof typeof formData]}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                rows={rows}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={placeholder}
              />
            ) : (
              <input
                type={type}
                value={formData[field as keyof typeof formData]}
                onChange={(e) =>
                  handleFieldChange(
                    field,
                    type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={placeholder}
              />
            )}
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingField(null)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Speichern
              </button>
              <button
                onClick={() => {
                  setEditingField(null);
                  // Reset to original value
                  setFormData((prev) => ({
                    ...prev,
                    [field]: analysisResult[field as keyof typeof analysisResult],
                  }));
                }}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
            <span className="text-gray-900 dark:text-white font-medium">
              {formData[field as keyof typeof formData] || (
                <span className="text-gray-400 italic">Kein Wert</span>
              )}
            </span>
          </div>
        )}

        {confidence < 0.8 && !isEditing && (
          <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded px-2 py-1">
            ⚠️ Niedrige Vertrauenswert - Bitte überprüfen und ggf. korrigieren
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
      <div className="text-center mb-8">
        <PencilIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Produktdaten überprüfen und bearbeiten
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Überprüfen Sie die von der KI extrahierten Daten und korrigieren Sie sie bei Bedarf.
        </p>
      </div>

      {/* Confidence Summary */}
      <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          📊 Analyse-Übersicht
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Object.values(analysisResult.confidence).filter((c) => c >= 0.8).length}
            </div>
            <div className="text-blue-800 dark:text-blue-200">Hohe Konfidenz (≥80%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {Object.values(analysisResult.confidence).filter((c) => c >= 0.6 && c < 0.8).length}
            </div>
            <div className="text-blue-800 dark:text-blue-200">Mittlere Konfidenz (60-79%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {Object.values(analysisResult.confidence).filter((c) => c < 0.6).length}
            </div>
            <div className="text-blue-800 dark:text-blue-200">Niedrige Konfidenz (&lt;60%)</div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Grundinformationen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Produkttitel" field="title" />
            <FormField label="Hersteller" field="manufacturer" />
            <FormField label="Artikelnummer" field="articleNumber" />
            <div className="md:col-span-2">
              <FormField label="Kurzbeschreibung" field="shortDescription" rows={3} />
            </div>
            <div className="md:col-span-2">
              <FormField label="Detailbeschreibung" field="longDescription" rows={5} />
            </div>
          </div>
        </div>

        {/* Physical Properties */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Physische Eigenschaften
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FormField label="Länge (mm)" field="length" type="number" />
            <FormField label="Breite (mm)" field="width" type="number" />
            <FormField label="Höhe (mm)" field="height" type="number" />
            <FormField label="Gewicht (kg)" field="weight" type="number" />
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Kategorisierung
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Hauptkategorie A" field="mainCategoryA" />
            <FormField label="Hauptkategorie B" field="mainCategoryB" />
            <FormField label="Unterkategorie A" field="subCategoryA" />
            <FormField label="Unterkategorie B" field="subCategoryB" />
          </div>
        </div>

        {/* Sales Data */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Verkaufsdaten
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FormField label="Preis (€)" field="price" type="number" />
            <FormField label="Lagerbestand" field="stockQuantity" type="number" />
            <FormField label="Artikeltyp" field="articleType" />
            <FormField label="Einheit" field="unit" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 border-t pt-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {Object.values(analysisResult.confidence).filter((c) => c < 0.8).length > 0 ? (
              <>
                ⚠️ {Object.values(analysisResult.confidence).filter((c) => c < 0.8).length} Felder
                mit niedriger Konfidenz - Überprüfung empfohlen
              </>
            ) : (
              <>✅ Alle Felder haben hohe Konfidenz - Kann direkt übernommen werden</>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                // Quick approve - keep original AI values
                onReviewComplete({
                  ...analysisResult,
                  approved: true,
                  reviewedAt: new Date(),
                });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors flex items-center"
              disabled={Object.values(analysisResult.confidence).some((c) => c < 0.6)}
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Schnell übernehmen
            </button>

            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              Daten bestätigen und zur Tabelle
            </button>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>
            Nach der Bestätigung werden die Daten zur Produkttabelle hinzugefügt, wo sie weiter
            bearbeitet und exportiert werden können.
          </p>
        </div>
      </div>
    </div>
  );
}
