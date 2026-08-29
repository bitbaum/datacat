'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DatabaseIngestion from '../../components/data-ingestion/DatabaseIngestion';
import { useAuth } from '../../context/AuthContext';

interface DatabaseSource {
  id: string;
  name: string;
  status: string;
  extractedText: string;
  extractedData: {
    source?: {
      type: string;
      host: string;
      database: string;
      table?: string;
    };
    rowCount?: number;
    totalRows?: number;
    columns?: string[];
    query?: {
      limit: number;
      offset: number;
      where: string | null;
    };
    sampleData?: Record<string, unknown>[];
  };
  createdAt: string;
  processedAt: string;
  processingTime: number;
  error?: string;
}

export default function DatabaseIngestionPage() {
  const [recentImports, setRecentImports] = useState<DatabaseSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImport, setSelectedImport] = useState<DatabaseSource | null>(null);
  const { token } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  useEffect(() => {
    if (token) fetchRecentImports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchRecentImports = async () => {
    try {
      setError(null);
      const response = await fetch(`${apiUrl}/api/v1/db-ingestion?limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error('Failed to fetch imports');
      const data = await response.json();
      setRecentImports(data.dataSources || []);
    } catch (err) {
      console.error('Failed to fetch imports:', err);
      setError('Failed to load database imports.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportComplete = () => {
    fetchRecentImports();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/ingest"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <svg
                    className="w-8 h-8 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                  Database Ingestion
                </h1>
                <p className="mt-1 text-gray-500">
                  Connect to external databases and import data for AI analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Database Ingestion Component */}
          <div>
            <DatabaseIngestion
              onImportComplete={handleImportComplete}
              onError={(error) => console.error('Import error:', error)}
              apiUrl={apiUrl}
              token={token}
            />
          </div>

          {/* Recent Imports */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Recent Imports
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg
                  className="w-8 h-8 animate-spin text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm mb-3">{error}</p>
                  <button
                    onClick={fetchRecentImports}
                    className="text-sm font-medium text-red-700 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : recentImports.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
                <p className="text-gray-500">No database imports yet</p>
                <p className="text-sm text-gray-400 mt-1">Connect to a database to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {recentImports.map((importItem) => (
                  <button
                    key={importItem.id}
                    onClick={() => setSelectedImport(importItem)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedImport?.id === importItem.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{importItem.name}</p>
                        <p className="text-sm text-indigo-600">
                          {importItem.extractedData?.source?.database}
                          {importItem.extractedData?.source?.table && (
                            <span className="text-gray-500">
                              .{importItem.extractedData.source.table}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {importItem.extractedData?.rowCount?.toLocaleString()} rows imported
                        </p>
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                          importItem.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : importItem.status === 'PROCESSING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : importItem.status === 'FAILED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {importItem.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{formatDate(importItem.createdAt)}</span>
                      <span>{importItem.processingTime}ms</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Import Detail */}
        {selectedImport && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedImport.name}</h2>
                <p className="text-sm text-indigo-600">
                  {selectedImport.extractedData?.source?.type}://
                  {selectedImport.extractedData?.source?.host}/
                  {selectedImport.extractedData?.source?.database}
                </p>
              </div>
              <button
                onClick={() => setSelectedImport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-indigo-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {selectedImport.extractedData?.rowCount?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Rows Imported</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {selectedImport.extractedData?.columns?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Columns</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {selectedImport.processingTime}ms
                </p>
                <p className="text-sm text-gray-500">Processing Time</p>
              </div>
            </div>

            {/* Columns */}
            {selectedImport.extractedData?.columns && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Columns</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedImport.extractedData.columns.map((col) => (
                    <span
                      key={col}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-mono"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Data */}
            {selectedImport.extractedData?.sampleData &&
              selectedImport.extractedData.sampleData.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Sample Data</h3>
                  <div className="overflow-x-auto bg-gray-50 rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          {selectedImport.extractedData.columns?.slice(0, 6).map((col) => (
                            <th key={col} className="px-3 py-2 text-left font-medium text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedImport.extractedData.sampleData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-200">
                            {selectedImport.extractedData?.columns?.slice(0, 6).map((col) => (
                              <td key={col} className="px-3 py-2 text-gray-600 truncate max-w-xs">
                                {String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Query Info */}
            {selectedImport.extractedData?.query && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-2">Query Parameters</h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>Limit: {selectedImport.extractedData.query.limit}</span>
                  <span>Offset: {selectedImport.extractedData.query.offset}</span>
                  {selectedImport.extractedData.query.where && (
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      WHERE {selectedImport.extractedData.query.where}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-500">
              <span>Imported: {formatDate(selectedImport.processedAt)}</span>
              {selectedImport.extractedData?.totalRows && (
                <span>
                  Total in table: {selectedImport.extractedData.totalRows.toLocaleString()} rows
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
