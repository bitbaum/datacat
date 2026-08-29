'use client';

import React from 'react';
import Link from 'next/link';

const dataSourceTypes = [
  {
    id: 'audio',
    name: 'Voice / Audio',
    description: 'Transcribe voice recordings and audio files using Whisper AI',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    ),
    status: 'available',
    href: '/ingest/audio',
  },
  {
    id: 'image',
    name: 'Images / Documents',
    description: 'Extract text and data from images, scans, and documents using OCR',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    status: 'available',
    href: '/ingest/image',
  },
  {
    id: 'video',
    name: 'Video',
    description: 'Analyze video content, extract frames, and transcribe audio tracks',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
    status: 'available',
    href: '/ingest/video',
  },
  {
    id: 'website',
    name: 'Website / URL',
    description: 'Scrape and extract structured data from web pages and APIs',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      </svg>
    ),
    status: 'available',
    href: '/ingest/website',
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Connect to external databases and import structured data',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
        />
      </svg>
    ),
    status: 'available',
    href: '/ingest/database',
  },
  {
    id: 'cloud',
    name: 'Cloud Storage',
    description: 'Import files from Google Drive, Dropbox, S3, and other cloud services',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
        />
      </svg>
    ),
    status: 'coming_soon',
    href: '/ingest/cloud',
  },
  {
    id: 'message',
    name: 'Messages',
    description: 'Integrate with Slack, Discord, email, and messaging platforms',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    status: 'coming_soon',
    href: '/ingest/message',
  },
  {
    id: 'iot',
    name: 'IoT / Sensors',
    description: 'Connect to IoT devices and sensor data streams',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
        />
      </svg>
    ),
    status: 'coming_soon',
    href: '/ingest/iot',
  },
];

export default function DataIngestionHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Ingestion</h1>
              <p className="mt-1 text-gray-500">
                Capture data from any source - voice, images, video, websites, databases, and more
              </p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Data Source Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dataSourceTypes.map((source) => (
            <Link
              key={source.id}
              href={source.status === 'available' ? source.href : '#'}
              className={`relative group block p-6 bg-white rounded-xl shadow-sm border-2 transition-all ${
                source.status === 'available'
                  ? 'border-transparent hover:border-indigo-500 hover:shadow-lg cursor-pointer'
                  : 'border-transparent opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Status Badge */}
              {source.status === 'coming_soon' && (
                <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  Coming Soon
                </span>
              )}
              {source.status === 'available' && (
                <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  Available
                </span>
              )}

              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                  source.status === 'available'
                    ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {source.icon}
              </div>

              {/* Content */}
              <h3
                className={`text-lg font-semibold mb-2 ${
                  source.status === 'available' ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {source.name}
              </h3>
              <p
                className={`text-sm ${
                  source.status === 'available' ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {source.description}
              </p>

              {/* Arrow Indicator for available sources */}
              {source.status === 'available' && (
                <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium group-hover:text-indigo-700">
                  Get Started
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 p-6 bg-white rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Universal Data Pipeline</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-2 px-6 py-3 bg-indigo-50 rounded-lg">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span className="font-medium text-indigo-900">Ingest</span>
            </div>
            <svg
              className="w-6 h-6 text-gray-300 hidden md:block"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            <div className="flex items-center gap-2 px-6 py-3 bg-purple-50 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
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
              <span className="font-medium text-purple-900">AI Analyze</span>
            </div>
            <svg
              className="w-6 h-6 text-gray-300 hidden md:block"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            <div className="flex items-center gap-2 px-6 py-3 bg-green-50 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="font-medium text-green-900">Action</span>
            </div>
          </div>
          <p className="mt-6 text-center text-gray-600 max-w-2xl mx-auto">
            DataCat transforms any data source into structured, actionable intelligence. Upload
            voice recordings, images, documents, or connect to external systems - our AI analyzes
            and extracts meaningful insights automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
