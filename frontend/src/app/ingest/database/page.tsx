'use client';

import React, { useState } from 'react';
import { formatDate } from '@/lib/format';
import DatabaseIngestion from '../../components/data-ingestion/DatabaseIngestion';
import { ICON } from '../../components/data-ingestion/icons';
import { INGEST_API_URL } from '../../components/data-ingestion/shared';
import { useAuth } from '../../context/AuthContext';
import {
  DetailPanel,
  IngestPage,
  RecentPanel,
  StatusBadge,
  fromRoot,
  selectableItemClass,
  useRecentSources,
} from '../shared';

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
  const { token } = useAuth();
  const {
    items: recentImports,
    loading,
    error,
    refresh,
  } = useRecentSources<DatabaseSource>({
    url: `${INGEST_API_URL}/api/v1/db-ingestion?limit=10`,
    token,
    what: 'imports',
    loadError: 'Failed to load database imports.',
    unwrap: fromRoot,
  });
  const [selectedImport, setSelectedImport] = useState<DatabaseSource | null>(null);

  return (
    <IngestPage
      icon={ICON.database}
      title="Database Ingestion"
      subtitle="Connect to external databases and import data for AI analysis"
      ingestion={
        <DatabaseIngestion
          onImportComplete={refresh}
          onError={(error) => console.error('Import error:', error)}
          apiUrl={INGEST_API_URL}
          token={token}
        />
      }
      recent={
        <RecentPanel
          title="Recent Imports"
          loading={loading}
          error={error}
          onRetry={refresh}
          isEmpty={recentImports.length === 0}
          emptyIcon={ICON.database}
          emptyTitle="No database imports yet"
          emptyHint="Connect to a database to get started"
        >
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {recentImports.map((importItem) => (
              <button
                key={importItem.id}
                onClick={() => setSelectedImport(importItem)}
                className={`w-full text-left p-4 ${selectableItemClass(selectedImport?.id === importItem.id)}`}
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
                  <StatusBadge status={importItem.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{formatDate(importItem.createdAt)}</span>
                  <span>{importItem.processingTime}ms</span>
                </div>
              </button>
            ))}
          </div>
        </RecentPanel>
      }
    >
      {selectedImport && (
        <DetailPanel
          onClose={() => setSelectedImport(null)}
          header={
            <div>
              <h2 className="text-xl font-bold text-gray-800">{selectedImport.name}</h2>
              <p className="text-sm text-indigo-600">
                {selectedImport.extractedData?.source?.type}://
                {selectedImport.extractedData?.source?.host}/
                {selectedImport.extractedData?.source?.database}
              </p>
            </div>
          }
        >
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
        </DetailPanel>
      )}
    </IngestPage>
  );
}
