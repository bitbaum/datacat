'use client';

import { useState, useEffect } from 'react';
import { CpuChipIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { WorkflowProduct } from './ErfassungWorkflow';

interface AnalysisStepProps {
  photos: File[];
  onAnalysisComplete: (result: WorkflowProduct['analysisResult']) => void;
  product: WorkflowProduct;
}

// Mock analysis results - in real implementation this would come from AI API
const mockAnalysisResults = [
  {
    title: 'Apple MacBook Pro 14" M3',
    manufacturer: 'Apple Inc.',
    articleNumber: 'MKGR3D/A',
    shortDescription: 'MacBook Pro mit M3 Chip, 14-Zoll Liquid Retina XDR Display',
    longDescription:
      'Das MacBook Pro 14" mit dem revolutionären M3 Chip bietet professionelle Performance in einem kompakten Design. Mit 14-Zoll Liquid Retina XDR Display, bis zu 22 Stunden Akkulaufzeit und fortschrittlicher Kamera für kristallklare Videokonferenzen.',
    price: 2249.0,
    weight: 1.6,
    length: 312.6,
    width: 221.2,
    height: 15.5,
    mainCategoryA: 'Elektronik',
    mainCategoryB: 'Computer',
    subCategoryA: 'Laptops',
    subCategoryB: 'MacBooks',
    stockQuantity: 5,
    articleType: 'Fertigprodukt',
    unit: 'Stück',
    confidence: {
      title: 0.95,
      manufacturer: 0.98,
      articleNumber: 0.92,
      shortDescription: 0.88,
      longDescription: 0.85,
      price: 0.75,
      weight: 0.8,
      dimensions: 0.9,
      categories: 0.93,
    },
    sources: {
      title: 'Product label (main text)',
      manufacturer: 'Product label (brand logo)',
      articleNumber: 'Barcode scan + product label',
      shortDescription: 'AI generation based on visual analysis',
      longDescription: 'AI generation + technical specifications lookup',
      price: 'Web search (Amazon, manufacturer website)',
      weight: 'Technical specifications lookup',
      dimensions: 'Visual measurement + technical specs',
      categories: 'Product classification AI model',
    },
  },
  {
    title: 'Samsung Galaxy Tab S8 Ultra',
    manufacturer: 'Samsung Electronics',
    articleNumber: 'SM-X900NZAA',
    shortDescription: 'Galaxy Tab S8 Ultra mit 14.6" Super AMOLED Display',
    longDescription:
      'Das Samsung Galaxy Tab S8 Ultra mit 14.6" Super AMOLED Display, Snapdragon 8 Gen 1 Prozessor und S Pen. Perfekt für kreative Arbeit und Produktivität.',
    price: 1199.0,
    weight: 0.726,
    length: 326.4,
    width: 208.6,
    height: 5.5,
    mainCategoryA: 'Elektronik',
    mainCategoryB: 'Tablets',
    subCategoryA: 'Android Tablets',
    subCategoryB: 'Premium Tablets',
    stockQuantity: 12,
    articleType: 'Fertigprodukt',
    unit: 'Stück',
    confidence: {
      title: 0.91,
      manufacturer: 0.96,
      articleNumber: 0.89,
      shortDescription: 0.87,
      longDescription: 0.82,
      price: 0.78,
      weight: 0.85,
      dimensions: 0.88,
      categories: 0.9,
    },
    sources: {
      title: 'Device back panel + product packaging',
      manufacturer: 'Samsung logo on device',
      articleNumber: 'Settings menu + product label',
      shortDescription: 'AI generation based on product recognition',
      longDescription: 'AI generation + Samsung specifications database',
      price: 'Web search (Saturn, MediaMarkt, Amazon)',
      weight: 'Samsung specifications database',
      dimensions: 'Visual measurement + Samsung specs',
      categories: 'Product classification AI model',
    },
  },
];

export function AnalysisStep({ photos, onAnalysisComplete, product }: AnalysisStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<WorkflowProduct['analysisResult']>();

  const analysisSteps = [
    { name: 'Bildverarbeitung', description: 'Optimierung und Vorbereitung der Fotos' },
    { name: 'OCR-Erkennung', description: 'Texterkennung von Labels und Typenschildern' },
    { name: 'Objekterkennung', description: 'Produktidentifikation und Klassifizierung' },
    { name: 'Datenextraktion', description: 'Extrahierung von Produktinformationen' },
    { name: 'Datenbankabgleich', description: 'Vergleich mit bekannten Produktdaten' },
    { name: 'Finalisierung', description: 'Aufbereitung der Ergebnisse' },
  ];

  useEffect(() => {
    if (!isAnalyzing) return;

    const analyzePhotos = async () => {
      // Simulate analysis progress
      for (let i = 0; i < analysisSteps.length; i++) {
        setCurrentStep(i);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Select random mock result
      const result = mockAnalysisResults[Math.floor(Math.random() * mockAnalysisResults.length)];
      setAnalysisResult(result);
      setIsAnalyzing(false);
    };

    analyzePhotos();
  }, []);

  const handleContinue = () => {
    if (analysisResult) {
      onAnalysisComplete(analysisResult);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
      <div className="text-center mb-8">
        <CpuChipIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">KI-Analyse läuft</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isAnalyzing
            ? `Analysiere ${photos.length} Foto${photos.length !== 1 ? 's' : ''} mit modernsten AI-Modellen...`
            : 'Analyse abgeschlossen! Überprüfen Sie die Ergebnisse unten.'}
        </p>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="mb-8">
          <div className="space-y-4">
            {analysisSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    index < currentStep
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : index === currentStep
                        ? 'bg-indigo-100 dark:bg-indigo-900/30'
                        : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : index === currentStep ? (
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      index <= currentStep
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {!isAnalyzing && analysisResult && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Analyse erfolgreich abgeschlossen
              </h3>
            </div>
            <p className="text-green-800 dark:text-green-200">
              Die KI hat Ihr Produkt erfolgreich analysiert und strukturierte Daten extrahiert.
            </p>
          </div>

          {/* Detailed Analysis Results */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analyseergebnisse mit Vertrauenswerten und Quellen
            </h3>

            <div className="grid gap-4">
              {[
                { key: 'title', label: 'Produkttitel', value: analysisResult.title },
                { key: 'manufacturer', label: 'Hersteller', value: analysisResult.manufacturer },
                {
                  key: 'articleNumber',
                  label: 'Artikelnummer',
                  value: analysisResult.articleNumber,
                },
                {
                  key: 'shortDescription',
                  label: 'Kurzbeschreibung',
                  value: analysisResult.shortDescription,
                },
                {
                  key: 'price',
                  label: 'Geschätzter Preis',
                  value: `€${analysisResult.price.toFixed(2)}`,
                },
                { key: 'weight', label: 'Gewicht', value: `${analysisResult.weight} kg` },
                {
                  key: 'dimensions',
                  label: 'Abmessungen (L×B×H)',
                  value: `${analysisResult.length}×${analysisResult.width}×${analysisResult.height} mm`,
                },
                {
                  key: 'categories',
                  label: 'Kategorien',
                  value: `${analysisResult.mainCategoryA} > ${analysisResult.subCategoryA}`,
                },
              ].map(({ key, label, value }) => {
                const confidence = analysisResult.confidence[key];
                const confidenceColor =
                  confidence >= 0.9
                    ? 'text-green-600 dark:text-green-400'
                    : confidence >= 0.7
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400';
                const bgColor =
                  confidence >= 0.9
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : confidence >= 0.7
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';

                return (
                  <div key={key} className={`rounded-lg border p-4 ${bgColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              confidence >= 0.9
                                ? 'bg-green-500'
                                : confidence >= 0.7
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${confidence * 100}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${confidenceColor}`}>
                          {Math.round(confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-900 dark:text-white font-medium mb-2">{value}</p>

                    {confidence < 0.8 && (
                      <div className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded px-2 py-1">
                        ⚠️ Niedrige Vertrauenswert - Bitte überprüfen und ggf. korrigieren
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              Daten überprüfen und bearbeiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
