'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  CircleStackIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

interface Database {
  id: string;
  name: string;
  description?: string;
  recordCount: number;
  tableSchema: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface SearchResult {
  query: string;
  totalDatabases: number;
  totalMatches: number;
  results: Array<{
    databaseId: string;
    databaseName: string;
    matches: Array<{
      id: string;
      data: Record<string, any>;
      submittedAt: string;
      relevanceScore: number;
    }>;
  }>;
}

export default function DatabasesPage() {
  const { token } = useAuth();
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]);

  useEffect(() => {
    if (token) fetchDatabases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchDatabases = async () => {
    try {
      setError(null);
      const response = await fetch('/api/v1/databases', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch databases');
      const data = await response.json();
      setDatabases(data.databases);
    } catch (error) {
      console.error('Failed to fetch databases:', error);
      setError('Failed to load databases.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    try {
      const response = await fetch('/api/v1/databases/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          databases: selectedDatabases,
          limit: 50,
        }),
      });

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
            <p className="mt-2 text-gray-600">
              Manage and analyze your form databases with AI-powered insights
            </p>
          </div>
          <Link
            href="/forms"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Database
          </Link>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Search Across Databases</h2>
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask anything about your data... (e.g., 'Show me all employees from marketing', 'Find customers with high satisfaction')"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading || !searchQuery.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {searchLoading ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              )}
              Search
            </button>
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="mt-4 max-w-md p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm mb-2">{searchError}</p>
              <button
                onClick={handleSearch}
                className="text-sm font-medium text-red-700 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Search Results */}
          {searchResults && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">
                Found {searchResults.totalMatches} results across {searchResults.totalDatabases}{' '}
                databases
              </h3>
              <div className="space-y-4">
                {searchResults.results.map((result) => (
                  <div key={result.databaseId} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      <Link
                        href={`/databases/${result.databaseId}`}
                        className="hover:text-blue-600"
                      >
                        {result.databaseName}
                      </Link>
                    </h4>
                    <div className="space-y-2">
                      {result.matches.slice(0, 3).map((match) => (
                        <div key={match.id} className="bg-gray-50 p-3 rounded text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-gray-500">
                              Score: {match.relevanceScore} |{' '}
                              {new Date(match.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(match.data)
                              .slice(0, 4)
                              .map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium text-gray-700">{key}:</span>{' '}
                                  <span className="text-gray-600">
                                    {String(value).substring(0, 50)}...
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                      {result.matches.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{result.matches.length - 3} more results
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Databases Grid */}
        {error ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm mb-3">{error}</p>
              <button
                onClick={fetchDatabases}
                className="text-sm font-medium text-red-700 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {databases.map((database) => (
              <div
                key={database.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <CircleStackIcon className="h-8 w-8 text-blue-600" />
                    <span className="text-sm text-gray-500">{database.recordCount} records</span>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    <Link href={`/databases/${database.id}`} className="hover:text-blue-600">
                      {database.name}
                    </Link>
                  </h3>

                  {database.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {database.description}
                    </p>
                  )}

                  {/* Schema Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Fields:</h4>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(database.tableSchema)
                        .slice(0, 4)
                        .map((field) => (
                          <span
                            key={field}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {field}
                          </span>
                        ))}
                      {Object.keys(database.tableSchema).length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{Object.keys(database.tableSchema).length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/databases/${database.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View Records
                    </Link>
                    <Link
                      href={`/databases/${database.id}/analytics`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <ChartBarIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() =>
                        window.open(`/api/v1/databases/${database.id}/export?format=json`, '_blank')
                      }
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Created: {new Date(database.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && databases.length === 0 && (
          <div className="text-center py-12">
            <CircleStackIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No databases yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first form to start collecting data and building databases.
            </p>
            <div className="mt-6">
              <Link
                href="/forms"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Form
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
