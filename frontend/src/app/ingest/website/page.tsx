'use client';

import React, { useState } from 'react';
import { formatDate } from '@/lib/format';
import WebsiteIngestion from '../../components/data-ingestion/WebsiteIngestion';
import { ICON, OutlineIcon } from '../../components/data-ingestion/icons';
import { INGEST_API_URL } from '../../components/data-ingestion/shared';
import { useAuth } from '../../context/AuthContext';
import {
  DetailPanel,
  IngestPage,
  RecentPanel,
  StatusBadge,
  fromDataEnvelope,
  selectableItemClass,
  useRecentSources,
} from '../shared';

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

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export default function WebsiteIngestionPage() {
  const { token } = useAuth();
  const {
    items: recentWebsites,
    loading,
    error,
    refresh,
  } = useRecentSources<WebsiteSource>({
    url: `${INGEST_API_URL}/api/v1/websites?limit=10`,
    token,
    what: 'website sources',
    loadError: 'Failed to load scraped pages.',
    unwrap: fromDataEnvelope,
  });
  const [selectedWebsite, setSelectedWebsite] = useState<WebsiteSource | null>(null);

  return (
    <IngestPage
      icon={ICON.globe}
      title="Website Scraping"
      subtitle="Extract and analyze content from any web page"
      ingestion={
        <WebsiteIngestion
          onScrapeComplete={refresh}
          onError={(error) => console.error('Scrape error:', error)}
          apiUrl={INGEST_API_URL}
          token={token}
        />
      }
      recent={
        <RecentPanel
          title="Recent Scraped Pages"
          loading={loading}
          error={error}
          onRetry={refresh}
          isEmpty={recentWebsites.length === 0}
          emptyIcon={ICON.globe}
          emptyTitle="No scraped pages yet"
          emptyHint="Enter a URL to get started"
        >
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {recentWebsites.map((website) => (
              <button
                key={website.id}
                onClick={() => setSelectedWebsite(website)}
                className={`w-full text-left p-4 ${selectableItemClass(selectedWebsite?.id === website.id)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {website.extractedData?.title || website.name}
                    </p>
                    <p className="text-sm text-indigo-600 truncate">{getDomain(website.fileUrl)}</p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {website.extractedData?.analysis?.summary?.slice(0, 100) ||
                        website.extractedText?.slice(0, 100)}
                      {(website.extractedData?.analysis?.summary?.length || 0) > 100 ||
                      (website.extractedText?.length || 0) > 100
                        ? '...'
                        : ''}
                    </p>
                  </div>
                  <StatusBadge status={website.status} />
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
        </RecentPanel>
      }
    >
      {selectedWebsite && (
        <DetailPanel
          onClose={() => setSelectedWebsite(null)}
          header={
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
          }
        >
          {/* Screenshot Preview */}
          {selectedWebsite.extractedData?.screenshot && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Screenshot</h3>
              {/* eslint-disable-next-line @next/next/no-img-element -- base64 data: URL from the scraper; next/image cannot optimise it */}
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
                    <p className="text-gray-600">
                      {selectedWebsite.extractedData.analysis.mainTopic}
                    </p>
                  </div>
                )}

                {/* Key Points */}
                {selectedWebsite.extractedData.analysis.keyPoints &&
                  selectedWebsite.extractedData.analysis.keyPoints.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-700 mb-2">Key Points</h3>
                      <ul className="space-y-1">
                        {selectedWebsite.extractedData.analysis.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-600 text-sm">
                            <OutlineIcon
                              d={ICON.checkSmall}
                              className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                            />
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
            Object.keys(selectedWebsite.extractedData.analysis.entities).some((k) => {
              const entities = selectedWebsite.extractedData?.analysis?.entities;
              return entities && entities[k]?.length > 0;
            }) && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Extracted Entities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(selectedWebsite.extractedData.analysis.entities).map(
                    ([type, values]) => {
                      if (!values || values.length === 0) return null;
                      return (
                        <div key={type}>
                          <p className="text-xs text-gray-500 uppercase mb-1">{type}</p>
                          <div className="flex flex-wrap gap-1">
                            {values.slice(0, 10).map((value, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-white border border-gray-200 rounded"
                              >
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
                    },
                  )}
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
        </DetailPanel>
      )}
    </IngestPage>
  );
}
