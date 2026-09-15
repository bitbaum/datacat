'use client';

import React, { useState } from 'react';
import { formatDate, formatFileSize } from '@/lib/format';
import AudioIngestion from '../../components/data-ingestion/AudioIngestion';
import { ICON } from '../../components/data-ingestion/icons';
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

interface AudioSource {
  id: string;
  name: string;
  status: string;
  extractedText: string;
  extractedData: Record<string, unknown>;
  confidence: number;
  createdAt: string;
  processedAt: string;
  processingTime: number;
  fileSize: number;
}

export default function AudioIngestionPage() {
  const { token } = useAuth();
  const {
    items: recentAudio,
    loading,
    error,
    refresh,
  } = useRecentSources<AudioSource>({
    url: `${INGEST_API_URL}/api/v1/audio?limit=10`,
    token,
    what: 'audio sources',
    loadError: 'Failed to load transcriptions.',
    unwrap: fromDataEnvelope,
  });
  const [selectedAudio, setSelectedAudio] = useState<AudioSource | null>(null);

  return (
    <IngestPage
      icon={ICON.microphone}
      title="Voice / Audio Ingestion"
      subtitle="Record voice or upload audio files for AI transcription and analysis"
      ingestion={
        <AudioIngestion
          onUploadComplete={refresh}
          onError={(error) => console.error('Upload error:', error)}
          apiUrl={INGEST_API_URL}
          token={token}
        />
      }
      recent={
        <RecentPanel
          title="Recent Transcriptions"
          loading={loading}
          error={error}
          onRetry={refresh}
          isEmpty={recentAudio.length === 0}
          emptyIcon={ICON.microphone}
          emptyTitle="No audio transcriptions yet"
          emptyHint="Record or upload audio to get started"
        >
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {recentAudio.map((audio) => (
              <button
                key={audio.id}
                onClick={() => setSelectedAudio(audio)}
                className={`w-full text-left p-4 ${selectableItemClass(selectedAudio?.id === audio.id)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{audio.name}</p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {audio.extractedText?.slice(0, 100)}
                      {audio.extractedText?.length > 100 ? '...' : ''}
                    </p>
                  </div>
                  <StatusBadge status={audio.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{formatFileSize(audio.fileSize)}</span>
                  <span>{formatDate(audio.createdAt)}</span>
                  {audio.confidence && (
                    <span>{Math.round(audio.confidence * 100)}% confidence</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </RecentPanel>
      }
    >
      {selectedAudio && (
        <DetailPanel
          onClose={() => setSelectedAudio(null)}
          header={<h2 className="text-xl font-bold text-gray-800">{selectedAudio.name}</h2>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Transcription */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Full Transcription</h3>
              <p className="text-gray-600 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {selectedAudio.extractedText}
              </p>
            </div>

            {/* Extracted Data */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">AI Analysis</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {selectedAudio.extractedData &&
                  Object.entries(selectedAudio.extractedData).map(([key, value]) => {
                    if (key === 'segments' || key === 'words') return null;
                    return (
                      <div key={key}>
                        <p className="text-xs text-gray-500 uppercase">{key}</p>
                        <p className="text-gray-700">
                          {Array.isArray(value)
                            ? value.join(', ')
                            : typeof value === 'object'
                              ? JSON.stringify(value, null, 2)
                              : String(value)}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-500">
            <span>Processed: {formatDate(selectedAudio.processedAt)}</span>
            <span>Processing Time: {selectedAudio.processingTime}ms</span>
            <span>File Size: {formatFileSize(selectedAudio.fileSize)}</span>
            {selectedAudio.confidence && (
              <span>Confidence: {Math.round(selectedAudio.confidence * 100)}%</span>
            )}
          </div>
        </DetailPanel>
      )}
    </IngestPage>
  );
}
