'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AudioIngestion from '../../components/data-ingestion/AudioIngestion';
import { useAuth } from '../../context/AuthContext';

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
  const [recentAudio, setRecentAudio] = useState<AudioSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioSource | null>(null);
  const { token } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Fetch recent audio sources
  useEffect(() => {
    if (token) fetchRecentAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchRecentAudio = async () => {
    try {
      setError(null);
      const response = await fetch(`${apiUrl}/api/v1/audio?limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error('Failed to fetch audio sources');
      const data = await response.json();
      setRecentAudio(data.data?.dataSources || []);
    } catch (err) {
      console.error('Failed to fetch audio sources:', err);
      setError('Failed to load transcriptions.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (result: unknown) => {
    console.log('Upload complete:', result);
    fetchRecentAudio(); // Refresh the list
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  Voice / Audio Ingestion
                </h1>
                <p className="mt-1 text-gray-500">
                  Record voice or upload audio files for AI transcription and analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audio Ingestion Component */}
          <div>
            <AudioIngestion
              onUploadComplete={handleUploadComplete}
              onError={(error) => console.error('Upload error:', error)}
              apiUrl={apiUrl}
              token={token}
            />
          </div>

          {/* Recent Audio Sources */}
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
              Recent Transcriptions
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
                    onClick={fetchRecentAudio}
                    className="text-sm font-medium text-red-700 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : recentAudio.length === 0 ? (
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
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <p className="text-gray-500">No audio transcriptions yet</p>
                <p className="text-sm text-gray-400 mt-1">Record or upload audio to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {recentAudio.map((audio) => (
                  <button
                    key={audio.id}
                    onClick={() => setSelectedAudio(audio)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedAudio?.id === audio.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{audio.name}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {audio.extractedText?.slice(0, 100)}
                          {audio.extractedText?.length > 100 ? '...' : ''}
                        </p>
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                          audio.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : audio.status === 'PROCESSING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : audio.status === 'FAILED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {audio.status}
                      </span>
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
            )}
          </div>
        </div>

        {/* Selected Audio Detail */}
        {selectedAudio && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{selectedAudio.name}</h2>
              <button
                onClick={() => setSelectedAudio(null)}
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
          </div>
        )}
      </div>
    </div>
  );
}
