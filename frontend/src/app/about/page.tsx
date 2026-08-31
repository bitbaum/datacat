'use client';

import React, { useState } from 'react';
import {
  EyeIcon,
  SpeakerWaveIcon,
  CpuChipIcon,
  DocumentTextIcon,
  CameraIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

const AboutPage = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isExpanded = (sectionId: string) => expandedSections.has(sectionId);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/20 py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
            Bringen Sie <span className="text-blue-600">alles</span> ins System
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Jeden Tag verbringen Menschen bei der Arbeit unzählige Stunden damit, Informationen in
            Systeme einzugeben. Wir automatisieren diesen gesamten Prozess –{' '}
            <em>intelligent und mühelos</em>.
          </p>

          <div className="flex justify-center space-x-8 mb-16">
            <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <span className="text-lg font-medium">Formulare</span>
            </div>
            <div className="text-4xl text-gray-400">+</div>
            <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
              <CameraIcon className="h-8 w-8 text-green-600" />
              <span className="text-lg font-medium">Sensoren</span>
            </div>
            <div className="text-4xl text-gray-400">=</div>
            <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
              <SparklesIcon className="h-8 w-8 text-purple-600" />
              <span className="text-lg font-medium">KI-Intelligenz</span>
            </div>
          </div>
        </div>
      </div>

      {/* The Problem Section */}
      <div className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Das Problem, das wir lösen
          </h2>

          <div className="grid md:grid-cols-3 gap-12 mb-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="h-10 w-10 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Zeitverschwendung
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Millionen von Arbeitsstunden werden täglich mit manueller Dateneingabe verschwendet
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="h-10 w-10 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Fehleranfällig
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Manuelle Eingaben führen zu Inkonsistenzen und kostspieligen Fehlern
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="h-10 w-10 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Verpasste Chancen
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Wertvolle Insights bleiben in den Daten verborgen, ohne intelligente Analyse
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Vision Section */}
      <div className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-8">
              Unsere Vision: Das intelligente System
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Stellen Sie sich ein System vor, das wie ein menschliches Gehirn funktioniert – mit
              Augen und Ohren, die alles erfassen, und einem Gehirn, das alles versteht und
              intelligent handelt.
            </p>
            <div className="mt-8 max-w-3xl mx-auto text-left text-gray-700 dark:text-gray-300 space-y-2">
              <p className="font-semibold">AI‑getriebene FormSchemas</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>AI erzeugt typisierte FormSchemas (Zod) statt Freitext</li>
                <li>Jedes Schema wird validiert, normalisiert und versioniert</li>
                <li>Submissions referenzieren immer die verwendete Schema‑Version</li>
              </ul>
            </div>
          </div>

          {/* Progressive Disclosure Sections */}
          <div className="space-y-6">
            {/* Forms as Ears Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => toggleSection('forms')}
                className="w-full p-8 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                      <SpeakerWaveIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Formulare sind die Ohren des Systems
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400">
                        Menschen geben Informationen ein – wir hören zu und verstehen
                      </p>
                    </div>
                  </div>
                  {isExpanded('forms') ? (
                    <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded('forms') && (
                <div className="px-8 pb-8">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Intelligente Formulare
                        </h4>
                        <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                          <li className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Dynamische Felder, die sich an Antworten anpassen</span>
                          </li>
                          <li className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Automatische Validierung und Fehlerkorrektur</span>
                          </li>
                          <li className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Nahtlose Integration in bestehende Systeme</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Anwendungsbereiche
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <span className="text-blue-800 dark:text-blue-300 font-medium">
                              HR & Onboarding
                            </span>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <span className="text-green-800 dark:text-green-300 font-medium">
                              Kundenfeedback
                            </span>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <span className="text-purple-800 dark:text-purple-300 font-medium">
                              Datenerfassung
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sensors as Eyes Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => toggleSection('sensors')}
                className="w-full p-8 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center">
                      <EyeIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Sensoren sind die Augen des Systems
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400">
                        Automatische Erfassung durch Kameras, IoT und digitale Eingänge
                      </p>
                    </div>
                  </div>
                  {isExpanded('sensors') ? (
                    <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded('sensors') && (
                <div className="px-8 pb-8">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Sensor-Technologien
                        </h4>
                        <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                          <li className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Computer Vision für Objekterkennung</span>
                          </li>
                          <li className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>IoT-Sensoren für Umgebungsdaten</span>
                          </li>
                          <li className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Audio-Verarbeitung für Spracheingabe</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Erfassung von
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <span className="text-green-800 dark:text-green-300 font-medium">
                              Produktdaten per Foto
                            </span>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <span className="text-blue-800 dark:text-blue-300 font-medium">
                              Umgebungssensoren
                            </span>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                            <span className="text-orange-800 dark:text-orange-300 font-medium">
                              Bewegung & Verhalten
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI as Brain Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => toggleSection('ai')}
                className="w-full p-8 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
                      <CpuChipIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        KI ist das Gehirn des Systems
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400">
                        Intelligente Analyse verwandelt Rohdaten in wertvolle Erkenntnisse
                      </p>
                    </div>
                  </div>
                  {isExpanded('ai') ? (
                    <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded('ai') && (
                <div className="px-8 pb-8">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          KI-Fähigkeiten
                        </h4>
                        <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                          <li className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>Automatische Kategorisierung und Tagging</span>
                          </li>
                          <li className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>Trend-Erkennung und Vorhersagen</span>
                          </li>
                          <li className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>Automatisierte Entscheidungsvorschläge</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Intelligente Ausgaben
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <span className="text-purple-800 dark:text-purple-300 font-medium">
                              Dashboards & Reports
                            </span>
                          </div>
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                            <span className="text-indigo-800 dark:text-indigo-300 font-medium">
                              API-Integration
                            </span>
                          </div>
                          <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                            <span className="text-pink-800 dark:text-pink-300 font-medium">
                              Automatisierte Aktionen
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Together */}
      <div className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-8">
              So funktioniert es zusammen
            </h2>
          </div>

          <div className="relative">
            {/* Connection Lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-blue-300 via-green-300 to-purple-300"></div>
            </div>

            <div className="relative grid md:grid-cols-3 gap-12">
              <div className="text-center bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Erfassen</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Formulare und Sensoren sammeln Daten aus der realen Welt – automatisch und
                  kontinuierlich
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Verstehen</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  KI analysiert, strukturiert und extrahiert wertvollen Kontext aus allen
                  eingehenden Informationen
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Handeln</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Intelligente Insights werden zu konkreten Aktionen und Entscheidungen für Ihr
                  Business
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-5xl font-bold text-white mb-8">Die Zukunft beginnt heute</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Werden Sie Teil der Revolution, die manuelle Dateneingabe für immer verändert. Schaffen
            Sie ein System, das sieht, hört und intelligent handelt.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href={ROUTES.builder}
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg hover:bg-gray-50 transition-all hover:scale-105"
            >
              <RocketLaunchIcon className="mr-3 h-6 w-6" />
              Formular-Builder testen
            </Link>
            <Link
              href={ROUTES.erfassung}
              className="inline-flex items-center justify-center rounded-xl bg-transparent border-2 border-white px-8 py-4 text-lg font-semibold text-white hover:bg-white hover:text-blue-600 transition-all hover:scale-105"
            >
              <CameraIcon className="mr-3 h-6 w-6" />
              Sensor-Erfassung entdecken
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
