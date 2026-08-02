'use client';

import React, { useState, useCallback } from 'react';

interface ConnectionConfig {
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

interface TableInfo {
  schema: string;
  name: string;
  fullName: string;
  columnCount: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  maxLength: number | null;
}

interface DatabaseIngestionProps {
  onImportComplete?: (result: unknown) => void;
  onError?: (error: string) => void;
  apiUrl?: string;
  token?: string | null;
}

type Step = 'connect' | 'tables' | 'import' | 'results';

export default function DatabaseIngestion({
  onImportComplete,
  onError,
  apiUrl = 'http://localhost:5001',
  token
}: DatabaseIngestionProps) {
  const [step, setStep] = useState<Step>('connect');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');

  // Connection form state
  const [connection, setConnection] = useState<ConnectionConfig>({
    type: 'postgresql',
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false
  });

  // Tables and schema
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableSchema, setTableSchema] = useState<ColumnInfo[]>([]);
  const [estimatedRows, setEstimatedRows] = useState(0);

  // Import options
  const [importOptions, setImportOptions] = useState({
    limit: 1000,
    offset: 0,
    selectedColumns: [] as string[],
    whereClause: ''
  });

  // Results
  const [importResult, setImportResult] = useState<{
    rowCount: number;
    totalRows: number;
    processingTime: number;
    dataSourceId: string;
    columns: string[];
    sampleData: Record<string, unknown>[];
  } | null>(null);

  const testConnection = useCallback(async () => {
    setConnectionStatus('testing');
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/v1/db-ingestion/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(connection)
      });

      const result = await response.json();

      if (result.success) {
        setConnectionStatus('connected');
        // Automatically fetch tables
        await fetchTables();
      } else {
        setConnectionStatus('failed');
        setError(result.message || 'Connection failed');
      }
    } catch (err) {
      setConnectionStatus('failed');
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      onError?.(message);
    }
  }, [connection, apiUrl, token, onError]);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/db-ingestion/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(connection)
      });

      const result = await response.json();

      if (result.success) {
        setTables(result.tables);
        setStep('tables');
      } else {
        setError(result.message || 'Failed to fetch tables');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tables';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [connection, apiUrl, token]);

  const fetchTableSchema = useCallback(async (tableName: string) => {
    setLoading(true);
    setSelectedTable(tableName);

    try {
      const response = await fetch(`${apiUrl}/api/v1/db-ingestion/schema`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ connection, tableName })
      });

      const result = await response.json();

      if (result.success) {
        setTableSchema(result.columns);
        setEstimatedRows(result.estimatedRows);
        setImportOptions(prev => ({
          ...prev,
          selectedColumns: result.columns.map((c: ColumnInfo) => c.name)
        }));
        setStep('import');
      } else {
        setError(result.message || 'Failed to fetch schema');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch schema';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [connection, apiUrl, token]);

  const handleImport = useCallback(async () => {
    if (!selectedTable) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/v1/db-ingestion/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          connection,
          tableName: selectedTable,
          options: {
            limit: importOptions.limit,
            offset: importOptions.offset,
            columns: importOptions.selectedColumns,
            where: importOptions.whereClause
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setImportResult({
          rowCount: result.rowCount,
          totalRows: result.totalRows,
          processingTime: result.processingTime,
          dataSourceId: result.dataSourceId,
          columns: result.columns,
          sampleData: result.data.slice(0, 5)
        });
        setStep('results');
        onImportComplete?.(result);
      } else {
        setError(result.message || 'Import failed');
        onError?.(result.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [connection, selectedTable, importOptions, apiUrl, token, onImportComplete, onError]);

  const toggleColumn = (columnName: string) => {
    setImportOptions(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(columnName)
        ? prev.selectedColumns.filter(c => c !== columnName)
        : [...prev.selectedColumns, columnName]
    }));
  };

  const renderConnectStep = () => (
    <div className="space-y-6">
      {/* Database Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Database Type
        </label>
        <select
          value={connection.type}
          onChange={(e) => setConnection({ ...connection, type: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="postgresql">PostgreSQL</option>
          <option value="mysql" disabled>MySQL (Coming Soon)</option>
          <option value="mssql" disabled>SQL Server (Coming Soon)</option>
        </select>
      </div>

      {/* Host and Port */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Host
          </label>
          <input
            type="text"
            value={connection.host}
            onChange={(e) => setConnection({ ...connection, host: e.target.value })}
            placeholder="localhost or db.example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Port
          </label>
          <input
            type="number"
            value={connection.port}
            onChange={(e) => setConnection({ ...connection, port: parseInt(e.target.value) || 5432 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Database Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Database Name
        </label>
        <input
          type="text"
          value={connection.database}
          onChange={(e) => setConnection({ ...connection, database: e.target.value })}
          placeholder="my_database"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Username and Password */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={connection.username}
            onChange={(e) => setConnection({ ...connection, username: e.target.value })}
            placeholder="postgres"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={connection.password}
            onChange={(e) => setConnection({ ...connection, password: e.target.value })}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* SSL Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="ssl"
          checked={connection.ssl}
          onChange={(e) => setConnection({ ...connection, ssl: e.target.checked })}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="ssl" className="text-sm text-gray-700">
          Use SSL connection
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Connection Status */}
      {connectionStatus === 'connected' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-700 text-sm">Connected successfully!</p>
        </div>
      )}

      {/* Connect Button */}
      <button
        onClick={testConnection}
        disabled={!connection.host || !connection.database || !connection.username || connectionStatus === 'testing'}
        className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {connectionStatus === 'testing' ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Testing Connection...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect to Database
          </>
        )}
      </button>
    </div>
  );

  const renderTablesStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Select a Table ({tables.length} available)
        </h3>
        <button
          onClick={() => setStep('connect')}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          ← Change Connection
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="w-8 h-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-2">
          {tables.map((table) => (
            <button
              key={table.fullName}
              onClick={() => fetchTableSchema(table.fullName)}
              className="w-full text-left p-4 bg-gray-50 hover:bg-indigo-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{table.name}</p>
                  <p className="text-sm text-gray-500">{table.schema}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {table.columnCount} columns
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderImportStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{selectedTable}</h3>
          <p className="text-sm text-gray-500">~{estimatedRows.toLocaleString()} rows</p>
        </div>
        <button
          onClick={() => setStep('tables')}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          ← Select Different Table
        </button>
      </div>

      {/* Column Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Columns to Import
        </label>
        <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-2">
          {tableSchema.map((col) => (
            <label
              key={col.name}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={importOptions.selectedColumns.includes(col.name)}
                onChange={() => toggleColumn(col.name)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
              />
              <span className="font-mono text-sm text-gray-900">{col.name}</span>
              <span className="text-xs text-gray-500">{col.type}</span>
              {col.nullable && <span className="text-xs text-gray-400">(nullable)</span>}
            </label>
          ))}
        </div>
      </div>

      {/* Import Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Row Limit
          </label>
          <input
            type="number"
            value={importOptions.limit}
            onChange={(e) => setImportOptions({ ...importOptions, limit: parseInt(e.target.value) || 1000 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Offset
          </label>
          <input
            type="number"
            value={importOptions.offset}
            onChange={(e) => setImportOptions({ ...importOptions, offset: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* WHERE Clause */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter (WHERE clause) - Optional
        </label>
        <input
          type="text"
          value={importOptions.whereClause}
          onChange={(e) => setImportOptions({ ...importOptions, whereClause: e.target.value })}
          placeholder="e.g., status = 'active' AND created_at > '2024-01-01'"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={loading || importOptions.selectedColumns.length === 0}
        className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Importing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import {importOptions.selectedColumns.length} Columns
          </>
        )}
      </button>
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center py-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Import Successful!</h3>
        <p className="text-gray-600 mt-1">
          {importResult?.rowCount.toLocaleString()} rows imported from {selectedTable}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {importResult?.rowCount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Rows Imported</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {importResult?.columns.length}
          </p>
          <p className="text-sm text-gray-500">Columns</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {importResult?.processingTime}ms
          </p>
          <p className="text-sm text-gray-500">Processing Time</p>
        </div>
      </div>

      {/* Sample Data Preview */}
      {importResult?.sampleData && importResult.sampleData.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Sample Data (First 5 rows)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {importResult.columns.slice(0, 5).map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-medium text-gray-700">
                      {col}
                    </th>
                  ))}
                  {importResult.columns.length > 5 && (
                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                      +{importResult.columns.length - 5} more
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {importResult.sampleData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    {importResult.columns.slice(0, 5).map((col) => (
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

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            setStep('connect');
            setImportResult(null);
            setSelectedTable(null);
          }}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          New Import
        </button>
        <button
          onClick={() => setStep('import')}
          className="flex-1 py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
        >
          Import More Data
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Database Connection</h2>
          <p className="text-sm text-gray-500">Connect to an external database and import data</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(['connect', 'tables', 'import', 'results'] as Step[]).map((s, idx) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-indigo-600 text-white'
                  : (['connect', 'tables', 'import', 'results'].indexOf(step) > idx)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {(['connect', 'tables', 'import', 'results'].indexOf(step) > idx) ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            {idx < 3 && (
              <div className={`flex-1 h-1 ${
                (['connect', 'tables', 'import', 'results'].indexOf(step) > idx)
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      {step === 'connect' && renderConnectStep()}
      {step === 'tables' && renderTablesStep()}
      {step === 'import' && renderImportStep()}
      {step === 'results' && renderResultsStep()}
    </div>
  );
}
