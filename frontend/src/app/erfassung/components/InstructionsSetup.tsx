'use client';

import { useState } from 'react';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface InstructionsSetupProps {
  onInstructionsComplete: (instructions: InstructionsConfig) => void;
  existingInstructions?: InstructionsConfig;
}

export interface InstructionsConfig {
  id: string;
  name: string;
  description: string;
  fieldDefinitions: FieldDefinition[];
  knowledgeBase: KnowledgeBaseFile[];
  extractionPrompt: string;
  validationRules: ValidationRule[];
  confidenceThresholds: ConfidenceThresholds;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'dimensions' | 'category' | 'boolean';
  required: boolean;
  description?: string;
  validationPattern?: string;
  defaultValue?: any;
  options?: string[]; // For category/select fields
}

export interface KnowledgeBaseFile {
  id: string;
  filename: string;
  type: 'specification' | 'catalog' | 'manual' | 'reference';
  size: number;
  uploadedAt: Date;
  processed: boolean;
  extractedText?: string;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface ConfidenceThresholds {
  high: number; // >= this is high confidence (green)
  medium: number; // >= this is medium confidence (yellow)
  // < medium is low confidence (red)
}

const defaultInstructions: Partial<InstructionsConfig> = {
  name: 'Standard Produkterfassung',
  description: 'Standardkonfiguration für die AI-basierte Produkterfassung',
  fieldDefinitions: [
    {
      id: 'title',
      name: 'title',
      label: 'Produkttitel',
      type: 'text',
      required: true,
      description: 'Der vollständige Name des Produkts wie er auf der Verpackung steht',
    },
    {
      id: 'manufacturer',
      name: 'manufacturer',
      label: 'Hersteller',
      type: 'text',
      required: true,
      description: 'Der Markenname oder Herstellername',
    },
    {
      id: 'articleNumber',
      name: 'articleNumber',
      label: 'Artikelnummer',
      type: 'text',
      required: true,
      description: 'Die eindeutige Produktnummer des Herstellers',
    },
    {
      id: 'price',
      name: 'price',
      label: 'Preis',
      type: 'currency',
      required: false,
      description: 'Verkaufspreis in Euro',
    },
    {
      id: 'dimensions',
      name: 'dimensions',
      label: 'Abmessungen',
      type: 'dimensions',
      required: false,
      description: 'Länge × Breite × Höhe in mm',
    },
    {
      id: 'weight',
      name: 'weight',
      label: 'Gewicht',
      type: 'number',
      required: false,
      description: 'Gewicht in kg',
    },
  ],
  extractionPrompt: `Analysiere das Produktbild und extrahiere folgende Informationen:

1. **Produkttitel**: Den vollständigen Produktnamen wie er auf der Verpackung steht
2. **Hersteller**: Markenname oder Herstellername
3. **Artikelnummer**: Eindeutige Produktnummer (oft als Barcode oder Typenschild)
4. **Preis**: Falls sichtbar, den Verkaufspreis
5. **Abmessungen**: Größenangaben falls ersichtlich
6. **Gewicht**: Gewichtsangaben falls ersichtlich

Achte besonders auf:
- Text auf Etiketten und Typenschildern
- Barcodes und QR-Codes
- Produktverpackungen
- Technische Spezifikationen

Gib für jedes Feld eine Konfidenz von 0-1 an, basierend auf der Klarheit der Information.`,
  confidenceThresholds: {
    high: 0.8,
    medium: 0.6,
  },
  knowledgeBase: [],
  validationRules: [],
};

export function InstructionsSetup({
  onInstructionsComplete,
  existingInstructions,
}: InstructionsSetupProps) {
  const [instructions, setInstructions] = useState<Partial<InstructionsConfig>>(
    existingInstructions || defaultInstructions,
  );
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const newFiles: KnowledgeBaseFile[] = Array.from(files).map((file) => ({
      id: Date.now().toString() + Math.random().toString(),
      filename: file.name,
      type: getFileType(file.name),
      size: file.size,
      uploadedAt: new Date(),
      processed: false,
    }));

    setInstructions((prev) => ({
      ...prev,
      knowledgeBase: [...(prev.knowledgeBase || []), ...newFiles],
    }));
  };

  const getFileType = (filename: string): KnowledgeBaseFile['type'] => {
    const ext = filename.toLowerCase().split('.').pop();
    if (['pdf', 'doc', 'docx'].includes(ext || '')) return 'specification';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'catalog';
    if (['txt', 'md'].includes(ext || '')) return 'reference';
    return 'manual';
  };

  const addFieldDefinition = () => {
    const newField: FieldDefinition = {
      id: Date.now().toString(),
      name: `field_${Date.now()}`,
      label: 'Neues Feld',
      type: 'text',
      required: false,
      description: '',
    };

    setInstructions((prev) => ({
      ...prev,
      fieldDefinitions: [...(prev.fieldDefinitions || []), newField],
    }));
  };

  const updateFieldDefinition = (id: string, updates: Partial<FieldDefinition>) => {
    setInstructions((prev) => ({
      ...prev,
      fieldDefinitions: prev.fieldDefinitions?.map((field) =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    }));
  };

  const removeFieldDefinition = (id: string) => {
    setInstructions((prev) => ({
      ...prev,
      fieldDefinitions: prev.fieldDefinitions?.filter((field) => field.id !== id),
    }));
  };

  const handleSave = () => {
    const completeInstructions: InstructionsConfig = {
      id: existingInstructions?.id || Date.now().toString(),
      name: instructions.name || 'Unbenannte Konfiguration',
      description: instructions.description || '',
      fieldDefinitions: instructions.fieldDefinitions || [],
      knowledgeBase: instructions.knowledgeBase || [],
      extractionPrompt: instructions.extractionPrompt || '',
      validationRules: instructions.validationRules || [],
      confidenceThresholds: instructions.confidenceThresholds || { high: 0.8, medium: 0.6 },
      createdAt: existingInstructions?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onInstructionsComplete(completeInstructions);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <DocumentTextIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          KI-Anweisungen konfigurieren
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Definieren Sie, welche Felder die KI aus Ihren Produktfotos extrahieren soll
        </p>
      </div>

      {/* Basic Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Grundkonfiguration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Konfigurationsname
            </label>
            <input
              type="text"
              value={instructions.name || ''}
              onChange={(e) => setInstructions((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="z.B. Elektronikprodukte, Werkzeuge, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Beschreibung
            </label>
            <input
              type="text"
              value={instructions.description || ''}
              onChange={(e) =>
                setInstructions((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Kurze Beschreibung des Anwendungsbereichs"
            />
          </div>
        </div>
      </div>

      {/* Field Definitions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Felder definieren ({instructions.fieldDefinitions?.length || 0})
          </h3>
          <button
            onClick={addFieldDefinition}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Feld hinzufügen
          </button>
        </div>

        <div className="space-y-4">
          {instructions.fieldDefinitions?.map((field) => (
            <div
              key={field.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Feldname
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateFieldDefinition(field.id, { name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Anzeigename
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateFieldDefinition(field.id, { label: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Feldtyp
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateFieldDefinition(field.id, {
                        type: e.target.value as FieldDefinition['type'],
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="text">Text</option>
                    <option value="number">Zahl</option>
                    <option value="currency">Währung</option>
                    <option value="dimensions">Abmessungen</option>
                    <option value="category">Kategorie</option>
                    <option value="boolean">Ja/Nein</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateFieldDefinition(field.id, { required: e.target.checked })
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="text-xs text-gray-500 dark:text-gray-400">Pflichtfeld</label>
                  </div>
                  <button
                    onClick={() => removeFieldDefinition(field.id)}
                    className="ml-2 p-1 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Beschreibung für KI
                </label>
                <textarea
                  value={field.description || ''}
                  onChange={(e) => updateFieldDefinition(field.id, { description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Erklären Sie der KI, worauf sie bei diesem Feld achten soll..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Knowledge Base Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Wissensdatenbank
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Laden Sie Dokumente hoch, die der KI als Referenz dienen (Kataloge, Spezifikationen, etc.)
        </p>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <label
              htmlFor="file-upload"
              className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
            >
              Dateien hochladen
            </label>{' '}
            oder per Drag & Drop
          </p>
          <p className="text-xs text-gray-500">PDF, DOC, XLS, TXT bis zu 10MB</p>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* Uploaded Files */}
        {instructions.knowledgeBase && instructions.knowledgeBase.length > 0 && (
          <div className="mt-4 space-y-2">
            {instructions.knowledgeBase.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {file.type} • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {file.processed ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Prompt */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">KI-Anweisungen</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Detaillierte Anweisungen für die KI zur Datenextraktion
        </p>

        <textarea
          value={instructions.extractionPrompt || ''}
          onChange={(e) =>
            setInstructions((prev) => ({ ...prev, extractionPrompt: e.target.value }))
          }
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
          placeholder="Beschreiben Sie der KI genau, wie sie die Daten aus den Bildern extrahieren soll..."
        />
      </div>

      {/* Confidence Thresholds */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Vertrauenswerte-Schwellenwerte
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hohe Konfidenz (Grün) ab
            </label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={instructions.confidenceThresholds?.high || 0.8}
                onChange={(e) =>
                  setInstructions((prev) => ({
                    ...prev,
                    confidenceThresholds: {
                      ...prev.confidenceThresholds,
                      high: parseFloat(e.target.value),
                      medium: prev.confidenceThresholds?.medium || 0.6,
                    },
                  }))
                }
                className="flex-1 mr-3"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                {Math.round((instructions.confidenceThresholds?.high || 0.8) * 100)}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mittlere Konfidenz (Gelb) ab
            </label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={instructions.confidenceThresholds?.medium || 0.6}
                onChange={(e) =>
                  setInstructions((prev) => ({
                    ...prev,
                    confidenceThresholds: {
                      high: prev.confidenceThresholds?.high || 0.8,
                      medium: parseFloat(e.target.value),
                    },
                  }))
                }
                className="flex-1 mr-3"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                {Math.round((instructions.confidenceThresholds?.medium || 0.6) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Werte unter {Math.round((instructions.confidenceThresholds?.medium || 0.6) * 100)}% werden
          als niedrige Konfidenz (Rot) markiert
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
        >
          Konfiguration speichern
        </button>
      </div>
    </div>
  );
}
