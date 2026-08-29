'use client';

import { CameraIcon, DocumentChartBarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ErfassungPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              <CameraIcon className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Produkt-Scan</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Transformieren Sie Produktfotos in strukturierte Produktkataloge mit KI-gestützter
            Analyse. Automatisieren Sie den kompletten Workflow von der Fotografie bis zur
            E-Commerce-Integration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/erfassung/new"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <CameraIcon className="h-5 w-5 mr-2" />
              Produkt scannen
            </Link>
            <Link
              href="/erfassung/table"
              className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <DocumentChartBarIcon className="h-5 w-5 mr-2" />
              Datentabelle anzeigen
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4">
              <CameraIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Foto-Erfassung
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Laden Sie 1-10 Produktfotos hoch. Verschiedene Winkel und Details helfen der KI bei
              der präzisen Analyse.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg mb-4">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">KI-Analyse</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Automatische Texterkennung, Kategorisierung und Datenextraktion mit modernsten
              AI-Modellen und Konfidenzwerten.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-4">
              <svg
                className="h-6 w-6 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Strukturierte Tabellen
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              21 standardisierte Datenfelder für ERP-Kompatibilität mit erweiterten Export- und
              Bearbeitungsfunktionen.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mb-4">
              <svg
                className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Multi-Format Export
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              CSV, XLSX, JSON, XML und TSV Export für nahtlose Integration in ERP-Systeme und
              E-Commerce-Plattformen.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mb-4">
              <svg
                className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              E-Commerce Integration
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Direkte Integration mit Medusa JS, Shopware und anderen Plattformen für automatisierte
              Shop-Veröffentlichung.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg mb-4">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Inventar-Management
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Zentrale Verwaltung aller erfassten Produkte mit Suchfunktion, Status-Tracking und
              Bulk-Operationen.
            </p>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            5-Schritt Workflow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { step: 1, title: 'Fotos hochladen', description: 'Mehrere Produktfotos aufnehmen' },
              { step: 2, title: 'KI-Analyse', description: 'Automatische Datenextraktion' },
              { step: 3, title: 'Daten prüfen', description: 'Überprüfung und Korrektur' },
              { step: 4, title: 'Export', description: 'Multi-Format Datenexport' },
              { step: 5, title: 'Tabellen-Übersicht', description: 'Inventar-Management' },
            ].map((item, index) => (
              <div key={item.step} className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full mx-auto mb-3 text-sm font-semibold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                {index < 4 && (
                  <div className="hidden md:block">
                    <ArrowRightIcon className="h-5 w-5 text-gray-400 mx-auto mt-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Bereit zum Starten?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Beginnen Sie mit der Erfassung Ihres ersten Produkts und erleben Sie die Kraft der
            KI-gestützten Katalogisierung.
          </p>
          <Link
            href="/erfassung/new"
            className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <CameraIcon className="h-6 w-6 mr-3" />
            Erstes Produkt scannen
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </main>
    </div>
  );
}
