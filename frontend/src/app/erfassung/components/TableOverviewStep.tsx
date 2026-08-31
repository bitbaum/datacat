'use client';

import { DocumentChartBarIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { WorkflowProduct } from './ErfassungWorkflow';
import { ROUTES } from '@/lib/routes';

interface TableOverviewStepProps {
  product: WorkflowProduct;
  onBackToWorkflow: () => void;
}

export function TableOverviewStep({ product, onBackToWorkflow }: TableOverviewStepProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
      <div className="text-center mb-8">
        <DocumentChartBarIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Workflow abgeschlossen!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Ihr Produkt wurde erfolgreich erfasst und ist jetzt in der Tabellen-Übersicht verfügbar.
        </p>
      </div>

      {/* Success Summary */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {product.photos.length}
            </div>
            <div className="text-sm text-green-800 dark:text-green-200">Fotos analysiert</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">21</div>
            <div className="text-sm text-green-800 dark:text-green-200">Datenfelder erfasst</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {product.exportData?.format}
            </div>
            <div className="text-sm text-green-800 dark:text-green-200">Export erstellt</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">✅</div>
            <div className="text-sm text-green-800 dark:text-green-200">Bereit für E-Commerce</div>
          </div>
        </div>
      </div>

      {/* Product Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Erfasstes Produkt
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Titel:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {product.analysisResult?.title || 'Unbekannt'}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Hersteller:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {product.analysisResult?.manufacturer || 'Unbekannt'}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Artikelnummer:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-mono">
                {product.analysisResult?.articleNumber || 'Unbekannt'}
              </span>
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Preis:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                €{product.analysisResult?.price?.toFixed(2) || '0.00'}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Status:</span>
              <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                Exportiert
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Erfasst:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('de-DE')}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          🚀 Nächste Schritte
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <p className="font-medium mb-1">📊 Datenverwaltung</p>
            <p>Verwalten Sie alle erfassten Produkte in der Tabellen-Übersicht</p>
          </div>
          <div>
            <p className="font-medium mb-1">🛒 E-Commerce Integration</p>
            <p>Veröffentlichen Sie Produkte direkt in Ihrem Online-Shop</p>
          </div>
          <div>
            <p className="font-medium mb-1">📤 Weitere Exports</p>
            <p>Exportieren Sie Daten in verschiedenen Formaten für ERP-Systeme</p>
          </div>
          <div>
            <p className="font-medium mb-1">🔄 Bulk-Verarbeitung</p>
            <p>Bearbeiten Sie mehrere Produkte gleichzeitig</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href={ROUTES.erfassungTable}
          className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
        >
          <DocumentChartBarIcon className="h-5 w-5 mr-2" />
          Zur Tabellen-Übersicht
        </Link>

        <button
          onClick={onBackToWorkflow}
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Weiteres Produkt erfassen
        </button>

        <Link
          href={ROUTES.erfassung}
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Zurück zur Übersicht
        </Link>
      </div>
    </div>
  );
}
