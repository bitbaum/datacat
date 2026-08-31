'use client';

import React from 'react';
import {
  DocumentTextIcon,
  UsersIcon,
  CpuChipIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

interface FormCaptureLandingProps {
  onStartBuilding: () => void;
  onSubmit?: () => void;
  onFieldsChange?: () => void;
}

export function FormCaptureLanding({ onStartBuilding }: FormCaptureLandingProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-indigo-900/20 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <DocumentTextIcon className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Formular-Erfassung
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Erstellen Sie intelligente Formulare, die mehr als nur Daten sammeln.
              <span className="font-semibold text-indigo-600">
                {' '}
                Jede Antwort wird automatisch strukturiert, kategorisiert und für KI-Analyse
                vorbereitet.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onStartBuilding}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors"
              >
                <DocumentTextIcon className="mr-2 h-5 w-5" />
                Formular erstellen
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 px-8 py-4 text-lg font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ← Zurück zur Übersicht
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* What is Form Capture */}
      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Was ist Formular-Erfassung?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Mehr als nur ein Formular-Baukasten. Ein intelligentes System, das Ihre Daten für die
              moderne Welt strukturiert.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
                <UsersIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Menschen erfassen
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Sammeln Sie strukturierte Daten von Ihren Zielgruppen - Kunden, Patienten,
                  Bewerber, oder Forschungsobjekte.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Automatische Sentiment-Analyse der Antworten
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Intelligente Kategorisierung und Trend-Erkennung
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Bereit für LLM-Analyse und Business Intelligence
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                <CpuChipIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  KI-gestützte Analyse
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Jede Antwort wird automatisch verarbeitet und für fortschrittliche Analysen
                  vorbereitet.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Automatische Datentyp-Erkennung
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Sentiment und Stimmungsanalyse
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Pattern-Erkennung und Trend-Analyse
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-8">
              <ServerIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Strukturierte Daten für die Zukunft
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Ihre Daten werden in einem standardisierten Format gespeichert, das für alle
                modernen Analysetools bereit ist.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Business Intelligence
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-medium text-gray-900 dark:text-white">LLM Integration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-medium text-gray-900 dark:text-white">Trend Analysis</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="font-medium text-gray-900 dark:text-white">API Export</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Workflow */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Der komplette Workflow
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Von der Formular-Erstellung bis zur intelligenten Datenanalyse - alles in einem
              System.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            {[
              {
                step: 1,
                title: 'Formular erstellen',
                description: 'Designen Sie Ihr Formular mit unserem Drag-and-Drop Builder',
                icon: '✏️',
                color: 'indigo',
              },
              {
                step: 2,
                title: 'Teilen & Sammeln',
                description: 'Verteilen Sie Ihr Formular über Link, E-Mail oder Einbettung',
                icon: '📤',
                color: 'blue',
              },
              {
                step: 3,
                title: 'Antworten erhalten',
                description:
                  'Menschen füllen Ihr Formular aus - Daten werden automatisch strukturiert',
                icon: '📝',
                color: 'green',
              },
              {
                step: 4,
                title: 'KI-Analyse & Export',
                description: 'Automatische Analyse und Export für BI, LLM oder bestehende Systeme',
                icon: '🤖',
                color: 'purple',
              },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                      item.color === 'indigo'
                        ? 'bg-indigo-100 dark:bg-indigo-900/20'
                        : item.color === 'blue'
                          ? 'bg-blue-100 dark:bg-blue-900/20'
                          : item.color === 'green'
                            ? 'bg-green-100 dark:bg-green-900/20'
                            : 'bg-purple-100 dark:bg-purple-900/20'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-semibold">
                      {item.step}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        item.color === 'indigo'
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : item.color === 'blue'
                            ? 'text-blue-600 dark:text-blue-400'
                            : item.color === 'green'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      Schritt {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRightIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* What happens to the data */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-8">
              <ChartBarIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Was passiert mit Ihren Daten?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Jede Antwort wird automatisch in strukturierte Daten umgewandelt und für moderne
                Analysen vorbereitet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ServerIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Strukturierte Speicherung
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Alle Antworten werden in einer standardisierten Datenbank gespeichert, bereit für
                  Export und Integration.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CpuChipIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  KI-Analyse
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Automatische Sentiment-Analyse, Kategorisierung und Pattern-Erkennung für tiefere
                  Insights.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Multi-Format Export
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Exportieren Sie Daten in CSV, JSON, Excel oder direkt in Ihre bestehenden Systeme.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Für wen ist Formular-Erfassung?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Von der Kundenbefragung bis zur medizinischen Datenerfassung - für jeden
              Anwendungsfall das richtige Tool.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Kundenfeedback',
                description:
                  'Sammeln Sie strukturierte Kundenmeinungen für Produktentwicklung und Service-Verbesserung.',
                icon: '💬',
                examples: ['NPS-Befragungen', 'Produkt-Feedback', 'Service-Bewertung'],
              },
              {
                title: 'Bewerbungsprozesse',
                description:
                  'Digitalisieren Sie Bewerbungsformulare mit automatischer Qualifikations-Analyse.',
                icon: '👥',
                examples: ['Stellenbewerbungen', 'Talent-Pools', 'Mitarbeiter-Feedback'],
              },
              {
                title: 'Marktforschung',
                description:
                  'Führen Sie strukturierte Umfragen durch mit automatischer Trend-Erkennung.',
                icon: '📊',
                examples: ['Marktanalysen', 'Konsumenten-Studien', 'Trend-Monitoring'],
              },
              {
                title: 'Medizin & Gesundheit',
                description:
                  'Patientenaufnahme und Symptom-Erfassung mit KI-gestützter Vor-Diagnose.',
                icon: '🏥',
                examples: ['Patienten-Intake', 'Symptom-Tracking', 'Behandlungs-Evaluation'],
              },
              {
                title: 'Bildung & Training',
                description:
                  'Kurs-Evaluationen und Lernfortschritt-Tracking mit automatischer Analyse.',
                icon: '🎓',
                examples: ['Kurs-Bewertung', 'Lernfortschritt', 'Zertifizierungs-Tests'],
              },
              {
                title: 'Event-Management',
                description:
                  'Teilnehmer-Registrierung und Event-Feedback mit automatischer Auswertung.',
                icon: '🎉',
                examples: ['Event-Anmeldung', 'Teilnehmer-Feedback', 'Follow-up-Umfragen'],
              },
            ].map((useCase, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-4">{useCase.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{useCase.description}</p>
                <div className="space-y-1">
                  {useCase.examples.map((example, exampleIndex) => (
                    <div key={exampleIndex} className="text-sm text-gray-500 dark:text-gray-400">
                      • {example}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Bereit für intelligente Datenerfassung?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Beginnen Sie mit der Erstellung Ihres ersten intelligenten Formulars. Die KI-Analyse ist
            bereits integriert.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onStartBuilding}
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-600 shadow-lg hover:bg-gray-50 transition-colors"
            >
              <DocumentTextIcon className="mr-2 h-5 w-5" />
              Formular erstellen
            </button>
            <Link
              href={ROUTES.erfassung}
              className="inline-flex items-center justify-center rounded-xl bg-white/10 border border-white/20 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-white/20 transition-colors"
            >
              Produkt-Erfassung erkunden →
            </Link>
          </div>

          <div className="mt-8 text-indigo-100 text-sm">
            <ClockIcon className="h-4 w-4 inline mr-1" />
            Setup dauert nur 2 Minuten • KI-Analyse ist kostenlos • Export in alle Formate
          </div>
        </div>
      </div>
    </div>
  );
}
