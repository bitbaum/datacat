'use client';

import { useState } from 'react';
import { DocumentArrowDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { WorkflowProduct } from './ErfassungWorkflow';

interface ExportStepProps {
  productData: any;
  onExportComplete: (exportData: WorkflowProduct['exportData']) => void;
  product: WorkflowProduct;
}

const exportFormats = [
  {
    id: 'csv_kivitendo',
    name: 'CSV (Kivitendo)',
    description: 'Kivitendo-kompatibles CSV Format',
    icon: '📄',
    recommended: true,
  },
  {
    id: 'xlsx',
    name: 'Excel (XLSX)',
    description: 'Microsoft Excel Arbeitsmappe',
    icon: '📊',
    recommended: false,
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'JavaScript Object Notation',
    icon: '🔧',
    recommended: false,
  },
  {
    id: 'xml',
    name: 'XML',
    description: 'Extensible Markup Language',
    icon: '📋',
    recommended: false,
  },
  {
    id: 'medusa_json',
    name: 'Medusa JS',
    description: 'Medusa E-Commerce Format',
    icon: '🛒',
    recommended: false,
  },
  {
    id: 'shopify_product_json',
    name: 'Shopify Produkt (JSON)',
    description: 'Importierbares Shopify JSON',
    icon: '🛍️',
    recommended: false,
  },
  {
    id: 'shopware_product_json',
    name: 'Shopware Produkt (JSON)',
    description: 'Shopware 6 kompatibles JSON',
    icon: '🧱',
    recommended: false,
  },
];

export function ExportStep({ productData, onExportComplete, product }: ExportStepProps) {
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['csv_kivitendo']);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportResult, setExportResult] = useState<WorkflowProduct['exportData']>();

  const handleExport = async () => {
    setIsExporting(true);

    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const selectedFormatData = exportFormats.filter((f) => selectedFormats.includes(f.id));
    const result = {
      format: selectedFormatData.map((f) => f.name).join(', ') || 'Unknown',
      downloadUrl: `#download-${Date.now()}`,
      recordCount: 1,
    };

    setExportResult(result);
    setExportComplete(true);
    setIsExporting(false);
  };

  const handleContinue = () => {
    if (exportResult) {
      onExportComplete(exportResult);
    }
  };

  const generatePreviewData = (primary: string) => {
    const format = exportFormats.find((f) => f.id === primary);

    if (primary === 'csv_kivitendo') {
      return `title,manufacturer,articleNumber,shortDescription,price,weight
"${productData.title}","${productData.manufacturer}","${productData.articleNumber}","${productData.shortDescription}",${productData.price},${productData.weight}`;
    }

    if (primary === 'json') {
      return JSON.stringify(
        {
          title: productData.title,
          manufacturer: productData.manufacturer,
          articleNumber: productData.articleNumber,
          shortDescription: productData.shortDescription,
          price: productData.price,
          weight: productData.weight,
          dimensions: {
            length: productData.length,
            width: productData.width,
            height: productData.height,
          },
        },
        null,
        2,
      );
    }

    if (primary === 'xml') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<product>
  <title>${productData.title}</title>
  <manufacturer>${productData.manufacturer}</manufacturer>
  <articleNumber>${productData.articleNumber}</articleNumber>
  <shortDescription>${productData.shortDescription}</shortDescription>
  <price>${productData.price}</price>
  <weight>${productData.weight}</weight>
</product>`;
    }

    return `${format?.name} Export Preview`;
  };

  const exportFileExtensions: Record<string, string> = {
    csv_kivitendo: 'csv',
    xlsx: 'xlsx',
    json: 'json',
    xml: 'xml',
    shopify_product_json: 'json',
    shopware_product_json: 'json',
  };

  const exportMimeTypes: Record<string, string> = {
    csv_kivitendo: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    shopify_product_json: 'application/json',
    shopware_product_json: 'application/json',
  };

  const handleDownload = () => {
    const primary = selectedFormats[0];
    if (!primary) return;

    const content = generatePreviewData(primary);
    const mimeType = exportMimeTypes[primary] ?? 'text/plain';
    const extension = exportFileExtensions[primary] ?? 'txt';
    const baseName = (productData.articleNumber || productData.title || 'export')
      .toString()
      .replace(/[^a-z0-9_-]+/gi, '_');

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
      <div className="text-center mb-8">
        <DocumentArrowDownIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Daten exportieren</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Wählen Sie das gewünschte Exportformat für Ihre Produktdaten.
        </p>
      </div>

      {!exportComplete ? (
        <>
          {/* Format Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Exportformat wählen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exportFormats.map((format) => (
                <div
                  key={format.id}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedFormats.includes(format.id)
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() =>
                    setSelectedFormats((prev) =>
                      prev.includes(format.id)
                        ? prev.filter((id) => id !== format.id)
                        : [...prev, format.id],
                    )
                  }
                >
                  {format.recommended && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Empfohlen
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{format.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{format.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format.description}
                      </p>
                    </div>
                    <div
                      className={`ml-auto w-5 h-5 rounded-sm border-2 ${
                        selectedFormats.includes(format.id)
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export-Vorschau
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                {generatePreviewData(selectedFormats[0])}
              </pre>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                isExporting
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isExporting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Exportiere...</span>
                </div>
              ) : (
                `Export starten`
              )}
            </button>
          </div>
        </>
      ) : (
        /* Export Complete */
        <div className="text-center">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 mb-8">
            <CheckCircleIcon className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
              Export erfolgreich abgeschlossen!
            </h3>
            <p className="text-green-800 dark:text-green-200">
              Ihre Produktdaten wurden erfolgreich im {exportResult?.format} Format exportiert.
            </p>
          </div>

          {/* Export Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {exportResult?.recordCount}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Datensätze exportiert
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {exportResult?.format}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Exportformat</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">✅</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
            >
              📥 Datei herunterladen
            </button>
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              Zur Tabellen-Übersicht
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
