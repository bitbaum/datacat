'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface DatabaseRecord {
  id: string;
  [key: string]: any;
  _metadata: {
    submittedAt: string;
    updatedAt: string;
    status: string;
    submittedBy?: {
      name?: string;
      email?: string;
    };
  };
}

interface DatabaseInfo {
  databaseName: string;
  schema: Record<
    string,
    {
      type: string;
      label: string;
      required: boolean;
      options?: Array<{ label: string; value: string }>;
    }
  >;
  records: DatabaseRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AIAnalysis {
  analysisId: string;
  query: string;
  result: {
    content: string;
    usage: any;
    model: string;
  };
  processingTime: number;
  databaseInfo: {
    name: string;
    recordCount: number;
    fields: string[];
  };
}

export default function DatabaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const databaseId = params.id as string;
  const { token } = useAuth();

  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('_metadata.submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // AI Analysis state
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    if (token) fetchDatabaseRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, databaseId, currentPage, sortField, sortOrder, filters]);

  const fetchDatabaseRecords = async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        sort: sortField,
        sortOrder,
        filters: JSON.stringify(filters),
      });

      const response = await fetch(`/api/v1/databases/${databaseId}/records?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDatabaseInfo(data);
      } else if (response.status === 404) {
        router.push('/databases');
      } else {
        throw new Error('Failed to fetch database records');
      }
    } catch (error) {
      console.error('Failed to fetch database records:', error);
      setError('Failed to load this database.');
    } finally {
      setLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch(`/api/v1/databases/${databaseId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: aiQuery,
          analysisType: 'CUSTOM',
          model: 'gpt-4',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAiAnalysis(data.analysis);
      } else {
        setAiError(data.message || 'AI analysis failed');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiError(error instanceof Error ? error.message : 'AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExport = (format: string) => {
    const url = `/api/v1/databases/${databaseId}/export?format=${format}`;
    window.open(url, '_blank');
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-700 text-sm mb-3">{error}</p>
          <button
            onClick={fetchDatabaseRecords}
            className="text-sm font-medium text-red-700 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!databaseInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Database not found</h2>
          <Link href="/databases" className="text-blue-600 hover:text-blue-500 mt-2 block">
            ← Back to Databases
          </Link>
        </div>
      </div>
    );
  }

  const schemaFields = Object.keys(databaseInfo.schema);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/databases"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Databases
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{databaseInfo.databaseName}</h1>
                <p className="text-sm text-gray-500">
                  {databaseInfo.pagination.total} total records • {schemaFields.length} fields
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                AI Analysis
              </button>
              <Link
                href={`/databases/${databaseId}/analytics`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Analytics
              </Link>
              <div className="relative">
                <button
                  onClick={() => document.getElementById('export-menu')?.classList.toggle('hidden')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export
                </button>
                <div
                  id="export-menu"
                  className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
                >
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('json')}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Export as CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Main Content */}
          <div className={`${showAiPanel ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
            {/* Controls */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
                      showFilters
                        ? 'border-blue-500 text-blue-700 bg-blue-50'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                    Filters
                  </button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    {schemaFields.slice(0, 6).map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {databaseInfo.schema[field].label}
                        </label>
                        <input
                          type="text"
                          value={filters[field] || ''}
                          onChange={(e) => handleFilterChange(field, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Filter by ${field}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Records Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {schemaFields.map((field) => (
                        <th
                          key={field}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort(field)}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{databaseInfo.schema[field].label}</span>
                            {sortField === field && (
                              <span className="text-blue-500">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {databaseInfo.records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        {schemaFields.map((field) => (
                          <td
                            key={field}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            <div className="max-w-xs truncate">{record[field] || '-'}</div>
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{new Date(record._metadata.submittedAt).toLocaleDateString()}</div>
                          {record._metadata.submittedBy?.name && (
                            <div className="text-xs">by {record._metadata.submittedBy.name}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {databaseInfo.pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(databaseInfo.pagination.pages, currentPage + 1))
                      }
                      disabled={currentPage === databaseInfo.pagination.pages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(currentPage - 1) * databaseInfo.pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(
                            currentPage * databaseInfo.pagination.limit,
                            databaseInfo.pagination.total,
                          )}
                        </span>{' '}
                        of <span className="font-medium">{databaseInfo.pagination.total}</span>{' '}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        {Array.from(
                          { length: Math.min(5, databaseInfo.pagination.pages) },
                          (_, i) => {
                            const page = i + Math.max(1, currentPage - 2);
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === currentPage
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          },
                        )}
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis Panel */}
          {showAiPanel && (
            <div className="w-1/3">
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
                  <button
                    onClick={() => setShowAiPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <textarea
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="Ask anything about this data... e.g., 'What are the main trends?', 'Show me insights about completion rates', 'Summarize the key patterns'"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={handleAIAnalysis}
                    disabled={aiLoading || !aiQuery.trim()}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </button>

                  {aiError && (
                    <div className="border-t pt-4">
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                        {aiError}
                      </div>
                    </div>
                  )}

                  {aiAnalysis && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Analysis Results</h4>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm">
                        <div className="whitespace-pre-wrap">{aiAnalysis.result.content}</div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Processed in {aiAnalysis.processingTime}ms using {aiAnalysis.result.model}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
