'use client';

import React from 'react';
import { RocketLaunchIcon, CheckCircleIcon, DocumentTextIcon, CameraIcon, CircleStackIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-indigo-900/20 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              <span className="text-indigo-600">Erfassung</span> leicht gemacht
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Erfassen Sie Daten auf zwei verschiedene Wege - strukturierte Formulare für Menschen, KI-Analyse für Produkte.
              <span className="font-semibold text-indigo-600"> Ein intelligentes System für alle Ihre Datenerfassungs-Bedürfnisse.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/builder"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors"
              >
                <DocumentTextIcon className="mr-2 h-5 w-5" />
                Formular-Erfassung
              </Link>
              <Link
                href="/erfassung"
                className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-purple-500 transition-colors"
              >
                <CameraIcon className="mr-2 h-5 w-5" />
                Produkt-Scan
              </Link>
              <Link
                href="/ingest"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-emerald-800 transition-colors"
              >
                <CloudArrowUpIcon className="mr-2 h-5 w-5" />
                Data Ingestion
              </Link>
            </div>

            {/* Quick Overview */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <DocumentTextIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Formular-Erfassung
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Erstellen Sie intelligente Formulare für Umfragen, Bewerbungen, Feedback. KI analysiert die Antworten automatisch.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <CameraIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Produkt-Scan
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Fotografieren Sie Produkte - KI extrahiert alle relevanten Daten und erstellt strukturierte Produktkataloge.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <CloudArrowUpIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Data Ingestion
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Erfassen Sie Daten aus jeder Quelle - Audio, Video, Bilder, Websites. KI analysiert und strukturiert automatisch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Erfassung Methods Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Zwei Wege der Datenerfassung, ein System
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Wählen Sie den passenden Weg für Ihre Bedürfnisse - strukturierte Formulare oder KI-gestützter Produktscan.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Form-based Erfassung */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6">
                <DocumentTextIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Formular-Erfassung
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Erstellen Sie benutzerdefinierte Formulare für Umfragen, Anmeldungen, Bewerbungen.
                KI analysiert die Antworten und strukturiert sie für Datenbanken und Berichte.
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  KI-gestützte Sentiment-Analyse
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Automatische Kategorisierung und Trend-Erkennung
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Export für LLM-Analyse und Datenbanken
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/builder"
                  className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 transition-colors"
                >
                  Formular erstellen →
                </Link>
              </div>
            </div>

            {/* Product-based Erfassung */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-6">
                <CameraIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Produkt-Scan
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Fotografieren Sie Produkte - KI erkennt automatisch Artikelnummern, Beschreibungen,
                Maße und Kategorien. Perfekt für E-Commerce und Inventar-Management.
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  OCR und Objekterkennung mit Computer Vision
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Automatische Webshop-Integration (Medusa JS, Shopware)
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Inventarverwaltung und Export-Automatisierung
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/erfassung"
                  className="inline-flex items-center text-purple-600 dark:text-purple-400 font-medium hover:text-purple-500 transition-colors"
                >
                  Produkt-Scan starten →
                </Link>
              </div>
            </div>
          </div>

          {/* Unified Data Flow */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8">
            <div className="text-center mb-8">
              <CircleStackIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Ein System, unendliche Möglichkeiten
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Alle erfassten Daten fließen in eine zentrale Datenbank. Exportieren Sie für LLM-Abfragen, 
                Business Intelligence oder Integration in bestehende Systeme.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Bereit für intelligente Erfassung?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Beginnen Sie heute mit der automatisierten Erfassung von Menschen und Produkten. 
            Ein System, das mit Ihrem Unternehmen wächst.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/builder"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-600 shadow-lg hover:bg-gray-50 transition-colors"
            >
              <DocumentTextIcon className="mr-2 h-5 w-5" />
              Formular-Erfassung starten
            </Link>
            <Link
              href="/erfassung"
              className="inline-flex items-center justify-center rounded-xl bg-white/10 border border-white/20 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-white/20 transition-colors"
            >
              <CameraIcon className="mr-2 h-5 w-5" />
              Produkt-Scan testen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
