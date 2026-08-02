'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import VideoIngestion from '../../components/data-ingestion/VideoIngestion';
import { useAuth } from '../../context/AuthContext';

interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  hasAudio: boolean;
}

interface VideoSummary {
  summary: string;
  topics: string[];
  keywords: string[];
  contentType: string;
  keyMoments?: { timestamp: number; description: string }[];
  sentiment?: string;
}

interface VideoSource {
  id: string;
  name: string;
  status: string;
  extractedText: string;
  extractedData: {
    videoInfo?: VideoInfo;
    summary?: VideoSummary;
    transcription?: {
      text: string;
      language: string;
      duration: number;
    };
    frames?: {
      timestamp: number;
      description: string;
      objects?: string[];
      text?: string;
    }[];
  };
  confidence: number;
  createdAt: string;
  processedAt: string;
  processingTime: number;
  fileSize: number;
}

export default function VideoIngestionPage() {
  const [recentVideos, setRecentVideos] = useState<VideoSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoSource | null>(null);
  const { token } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Fetch recent video sources
  useEffect(() => {
    if (token) fetchRecentVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchRecentVideos = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/videos?limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (response.ok) {
        const data = await response.json();
        setRecentVideos(data.data?.dataSources || []);
      }
    } catch (error) {
      console.error('Failed to fetch video sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (result: unknown) => {
    console.log('Upload complete:', result);
    fetchRecentVideos();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Video Ingestion
                </h1>
                <p className="mt-1 text-gray-500">
                  Upload videos for AI analysis - frame extraction, audio transcription, and content summary
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Ingestion Component */}
          <div>
            <VideoIngestion
              onUploadComplete={handleUploadComplete}
              onError={(error) => console.error('Upload error:', error)}
              apiUrl={apiUrl}
              token={token}
            />
          </div>

          {/* Recent Video Sources */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Video Analyses
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="w-8 h-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : recentVideos.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No video analyses yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Upload a video to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {recentVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedVideo?.id === video.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {video.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {video.extractedData?.summary?.summary?.slice(0, 100) ||
                            video.extractedText?.slice(0, 100)}
                          {(video.extractedData?.summary?.summary?.length || video.extractedText?.length || 0) > 100 ? '...' : ''}
                        </p>
                      </div>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        video.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : video.status === 'PROCESSING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : video.status === 'FAILED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {video.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {video.extractedData?.videoInfo?.duration && (
                        <span>{formatDuration(video.extractedData.videoInfo.duration)}</span>
                      )}
                      <span>{formatFileSize(video.fileSize)}</span>
                      <span>{formatDate(video.createdAt)}</span>
                      {video.confidence && (
                        <span>{Math.round(video.confidence * 100)}% confidence</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Video Detail */}
        {selectedVideo && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedVideo.name}
              </h2>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video Info Bar */}
            {selectedVideo.extractedData?.videoInfo && (
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {formatDuration(selectedVideo.extractedData.videoInfo.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {selectedVideo.extractedData.videoInfo.width}x{selectedVideo.extractedData.videoInfo.height}
                  </span>
                </div>
                {selectedVideo.extractedData.videoInfo.fps > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {selectedVideo.extractedData.videoInfo.fps} FPS
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-200 rounded text-gray-600">
                    {selectedVideo.extractedData.videoInfo.codec.toUpperCase()}
                  </span>
                </div>
                {selectedVideo.extractedData.videoInfo.hasAudio && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <span className="text-sm text-gray-600">Audio</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Summary & Topics */}
              <div className="space-y-4">
                {selectedVideo.extractedData?.summary?.summary && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Summary
                    </h3>
                    <p className="text-gray-600">{selectedVideo.extractedData.summary.summary}</p>

                    {selectedVideo.extractedData.summary.contentType && (
                      <div className="mt-3">
                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                          {selectedVideo.extractedData.summary.contentType}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Topics & Keywords */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Topics & Keywords</h3>

                  {selectedVideo.extractedData?.summary?.topics && selectedVideo.extractedData.summary.topics.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Topics</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedVideo.extractedData.summary.topics.map((topic, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVideo.extractedData?.summary?.keywords && selectedVideo.extractedData.summary.keywords.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedVideo.extractedData.summary.keywords.map((keyword, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transcription */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Audio Transcription
                </h3>
                {selectedVideo.extractedText || selectedVideo.extractedData?.transcription?.text ? (
                  <>
                    {selectedVideo.extractedData?.transcription?.language && (
                      <p className="text-xs text-gray-500 mb-2">
                        Language: {selectedVideo.extractedData.transcription.language}
                      </p>
                    )}
                    <p className="text-gray-600 whitespace-pre-wrap max-h-[200px] overflow-y-auto text-sm">
                      {selectedVideo.extractedText || selectedVideo.extractedData?.transcription?.text}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400 italic">No audio transcription available</p>
                )}
              </div>
            </div>

            {/* Frame Analysis */}
            {selectedVideo.extractedData?.frames && selectedVideo.extractedData.frames.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Frame Analysis ({selectedVideo.extractedData.frames.length} frames)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedVideo.extractedData.frames.map((frame, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-indigo-600">
                          {formatDuration(frame.timestamp)}
                        </span>
                        {frame.objects && frame.objects.length > 0 && (
                          <span className="text-xs text-gray-400">
                            {frame.objects.length} objects
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{frame.description}</p>
                      {frame.text && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Text: {frame.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Moments */}
            {selectedVideo.extractedData?.summary?.keyMoments && selectedVideo.extractedData.summary.keyMoments.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Key Moments
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVideo.extractedData.summary.keyMoments.map((moment, idx) => (
                    <div key={idx} className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span className="text-xs font-medium text-yellow-700">
                        {formatDuration(moment.timestamp)}
                      </span>
                      <span className="text-sm text-gray-700">{moment.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <span>Processed: {formatDate(selectedVideo.processedAt)}</span>
              <span>Processing Time: {(selectedVideo.processingTime / 1000).toFixed(1)}s</span>
              <span>File Size: {formatFileSize(selectedVideo.fileSize)}</span>
              {selectedVideo.confidence && (
                <span>Confidence: {Math.round(selectedVideo.confidence * 100)}%</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
