'use client';

import React, { useState } from 'react';

interface WebsiteIngestionProps {
  onScrapeComplete?: (result: WebsiteResult) => void;
  onError?: (error: string) => void;
  apiUrl?: string;
  token?: string | null;
}

interface WebsiteResult {
  id: string;
  status: string;
  url: string;
  title: string;
  contentLength: number;
  analysis: {
    summary: string;
    contentType: string;
    mainTopic: string;
    keyPoints: string[];
    entities: Record<string, string[]>;
    sentiment: string;
    language: string;
  };
  processingTime: number;
  confidence: number;
}

const extractTypes = [
  { value: 'auto', label: 'Auto Detect', description: 'Automatically detect content type' },
  { value: 'article', label: 'Article', description: 'Extract article content, author, date' },
  { value: 'product', label: 'Product', description: 'Extract product info, price, specs' },
  { value: 'contact', label: 'Contact', description: 'Extract contact information' },
  { value: 'listing', label: 'Listing', description: 'Extract items from catalogs/lists' },
  { value: 'form', label: 'Form Fields', description: 'Identify form structure' },
];

export default function WebsiteIngestion({
  onScrapeComplete,
  onError,
  apiUrl = 'http://localhost:5001',
  token,
}: WebsiteIngestionProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [extractType, setExtractType] = useState('auto');
  const [screenshot, setScreenshot] = useState(false);
  const [waitForSelector, setWaitForSelector] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [result, setResult] = useState<WebsiteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (urlString: string): boolean => {
    try {
      const parsed = new URL(urlString);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid HTTP/HTTPS URL');
      return;
    }

    setIsScraping(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${apiUrl}/api/v1/websites/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          url: url.trim(),
          name: name.trim() || undefined,
          extractType,
          screenshot,
          waitForSelector: waitForSelector.trim() || undefined,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to scrape URL');
      }

      setResult(data.data);
      onScrapeComplete?.(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scraping failed';
      setError(message);
      onError?.(message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setName('');
    setExtractType('auto');
    setScreenshot(false);
    setWaitForSelector('');
    setCustomPrompt('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Website Scraper</h2>
          <p className="text-sm text-gray-500">Extract data from any web page</p>
        </div>
      </div>

      {/* URL Input */}
      {!result && (
        <div className="space-y-4">
          {/* Main URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL to Scrape</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isScraping}
                />
              </div>
            </div>
          </div>

          {/* Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Give this source a name"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isScraping}
            />
          </div>

          {/* Extract Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {extractTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setExtractType(type.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    extractType === type.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isScraping}
                >
                  <p
                    className={`text-sm font-medium ${
                      extractType === type.value ? 'text-indigo-700' : 'text-gray-700'
                    }`}
                  >
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Screenshot Option */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={screenshot}
                onChange={(e) => setScreenshot(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                disabled={isScraping}
              />
              <span className="text-sm text-gray-700">Capture screenshot</span>
            </label>
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Advanced Options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wait for Selector (Optional)
                </label>
                <input
                  type="text"
                  value={waitForSelector}
                  onChange={(e) => setWaitForSelector(e.target.value)}
                  placeholder=".content, #main, [data-loaded]"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  disabled={isScraping}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wait for this CSS selector to appear before scraping
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Extraction Prompt (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Extract all product prices and compare them..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  rows={3}
                  disabled={isScraping}
                />
                <p className="text-xs text-gray-500 mt-1">Custom instructions for AI analysis</p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">Error</span>
              </div>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Scrape Button */}
          <button
            onClick={handleScrape}
            disabled={isScraping || !url.trim()}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isScraping || !url.trim()
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
            }`}
          >
            {isScraping ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                Scraping...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Scrape URL
              </>
            )}
          </button>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-4">
          {/* Success Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">Scraping Complete!</span>
            </div>
            <button onClick={handleReset} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* URL Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800">{result.title}</p>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline break-all"
            >
              {result.url}
            </a>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{Math.round(result.contentLength / 1024)}KB extracted</span>
              <span>{result.processingTime}ms</span>
              <span>{Math.round(result.confidence * 100)}% confidence</span>
            </div>
          </div>

          {/* Analysis Summary */}
          {result.analysis && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Summary</h3>
                <p className="text-gray-600">{result.analysis.summary}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                    {result.analysis.contentType}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    {result.analysis.sentiment}
                  </span>
                  {result.analysis.language && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {result.analysis.language}
                    </span>
                  )}
                </div>
              </div>

              {/* Main Topic */}
              {result.analysis.mainTopic && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Main Topic</h3>
                  <p className="text-gray-600">{result.analysis.mainTopic}</p>
                </div>
              )}

              {/* Key Points */}
              {result.analysis.keyPoints && result.analysis.keyPoints.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Key Points</h3>
                  <ul className="space-y-1">
                    {result.analysis.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-600">
                        <svg
                          className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Entities */}
              {result.analysis.entities &&
                Object.keys(result.analysis.entities).some(
                  (k) => result.analysis.entities[k]?.length > 0,
                ) && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">Extracted Entities</h3>
                    <div className="space-y-2">
                      {Object.entries(result.analysis.entities).map(([type, values]) => {
                        if (!values || values.length === 0) return null;
                        return (
                          <div key={type}>
                            <p className="text-xs text-gray-500 uppercase">{type}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {values.map((value, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 text-sm bg-white border border-gray-200 rounded"
                                >
                                  {value}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Scrape Another Button */}
          <button
            onClick={handleReset}
            className="w-full py-3 border-2 border-indigo-500 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Scrape Another URL
          </button>
        </div>
      )}
    </div>
  );
}
