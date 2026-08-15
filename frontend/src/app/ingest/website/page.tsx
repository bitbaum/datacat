'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import WebsiteIngestion from '../../components/data-ingestion/WebsiteIngestion';
import { useAuth } from '../../context/AuthContext';

interface WebsiteAnalysis {
  summary: string;
  contentType: string;
  mainTopic: string;
  keyPoints: string[];
  entities: Record<string, string[]>;
  sentiment: string;
  language: string;
}

interface WebsiteSource {
  id: string;
  name: string;
  status: string;
  fileUrl: string;
  extractedText: string;
  extractedData: {
    url: string;
    title: string;
    analysis?: WebsiteAnalysis;
    metadata?: {
      description?: string;
      ogImage?: string;
    };
    screenshot?: string;
  };
  confidence: number;
  createdAt: string;
  processedAt: string;
  processingTime: number;
  error?: string;
}

export default function WebsiteIngestionPage() {
  const [recentWebsites, setRecentWebsites] = useState<WebsiteSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWebsite, setSelectedWebsite] = useState<WebsiteSource | null>(null);
  const { token } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Fetch recent website sources
  useEffect(() => {
    if (token) fetchRecentWebsites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchRecentWebsites = async () => {
    try {
      setError(null);
      const response = await fetch(`${apiUrl}/api/v1/websites?limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error('Failed to fetch website sources');
      const data = await response.json();
      setRecentWebsites(data.data?.dataSources || []);
    } catch (err) {
      console.error('Failed to fetch website sources:', err);
      setError('Failed to load scraped pages.');
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeComplete = (result: unknown) => {
    console.log('Scrape complete:', result);
    fetchRecentWebsites();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Website Scraping
                </h1>
                <p className="mt-1 text-gray-500">
                  Extract and analyze content from any web page
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Website Ingestion Component */}
          <div>
            <WebsiteIngestion
              onScrapeComplete={handleScrapeComplete}
              onError={(error) => console.error('Scrape error:', error)}
              apiUrl={apiUrl}
              token={token}
            />
          </div>

          {/* Recent Website Sources */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Scraped Pages
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="w-8 h-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm mb-3">{error}</p>
                  <button
                    onClick={fetchRecentWebsites}
                    className="text-sm font-medium text-red-700 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : recentWebsites.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <p className="text-gray-500">No scraped pages yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Enter a URL to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {recentWebsites.map((website) => (
                  <button
                    key={website.id}
                    onClick={() => setSelectedWebsite(website)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedWebsite?.id === website.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {website.extractedData?.title || website.name}
                        </p>
                        <p className="text-sm text-indigo-600 truncate">
                          {getDomain(website.fileUrl)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {website.extractedData?.analysis?.summary?.slice(0, 100) ||
                            website.extractedText?.slice(0, 100)}
                          {((website.extractedData?.analysis?.summary?.length || 0) > 100 ||
                            (website.extractedText?.length || 0) > 100) ? '...' : ''}
                        </p>
                      </div>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        website.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : website.status === 'PROCESSING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : website.status === 'FAILED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {website.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{formatDate(website.createdAt)}</span>
                      {website.confidence && (
                        <span>{Math.round(website.confidence * 100)}% confidence</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Website Detail */}
        {selectedWebsite && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedWebsite.extractedData?.title || selectedWebsite.name}
                </h2>
                <a
                  href={selectedWebsite.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  {selectedWebsite.fileUrl}
                </a>
              </div>
              <button
                onClick={() => setSelectedWebsite(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Screenshot Preview */}
            {selectedWebsite.extractedData?.screenshot && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Screenshot</h3>
                <img
                  src={selectedWebsite.extractedData.screenshot}
                  alt="Page screenshot"
                  className="w-full max-h-64 object-cover object-top rounded-lg border border-gray-200"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Analysis */}
              {selectedWebsite.extractedData?.analysis && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">Summary</h3>
                    <p className="text-gray-600">{selectedWebsite.extractedData.analysis.summary}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                        {selectedWebsite.extractedData.analysis.contentType}
                      </span>
                      {selectedWebsite.extractedData.analysis.sentiment && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {selectedWebsite.extractedData.analysis.sentiment}
                        </span>
                      )}
                      {selectedWebsite.extractedData.analysis.language && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {selectedWebsite.extractedData.analysis.language}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Topic */}
                  {selectedWebsite.extractedData.analysis.mainTopic && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-700 mb-2">Main Topic</h3>
                      <p className="text-gray-600">{selectedWebsite.extractedData.analysis.mainTopic}</p>
                    </div>
                  )}

                  {/* Key Points */}
                  {selectedWebsite.extractedData.analysis.keyPoints && selectedWebsite.extractedData.analysis.keyPoints.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-700 mb-2">Key Points</h3>
                      <ul className="space-y-1">
                        {selectedWebsite.extractedData.analysis.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-600 text-sm">
                            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Content */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Extracted Text</h3>
                <div className="max-h-[400px] overflow-y-auto">
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">
                    {selectedWebsite.extractedText?.slice(0, 5000)}
                    {(selectedWebsite.extractedText?.length || 0) > 5000 ? '...' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Entities */}
            {selectedWebsite.extractedData?.analysis?.entities &&
              Object.keys(selectedWebsite.extractedData.analysis.entities).some(k => {
                const entities = selectedWebsite.extractedData?.analysis?.entities;
                return entities && entities[k]?.length > 0;
              }) && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Extracted Entities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(selectedWebsite.extractedData.analysis.entities).map(([type, values]) => {
                    if (!values || values.length === 0) return null;
                    return (
                      <div key={type}>
                        <p className="text-xs text-gray-500 uppercase mb-1">{type}</p>
                        <div className="flex flex-wrap gap-1">
                          {values.slice(0, 10).map((value, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded">
                              {value}
                            </span>
                          ))}
                          {values.length > 10 && (
                            <span className="px-2 py-1 text-xs text-gray-500">
                              +{values.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <span>Scraped: {formatDate(selectedWebsite.processedAt)}</span>
              <span>Processing Time: {selectedWebsite.processingTime}ms</span>
              {selectedWebsite.confidence && (
                <span>Confidence: {Math.round(selectedWebsite.confidence * 100)}%</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
