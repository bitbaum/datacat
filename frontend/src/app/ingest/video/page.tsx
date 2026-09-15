'use client';

import React, { useState } from 'react';
import { formatDate, formatDuration, formatFileSize } from '@/lib/format';
import VideoIngestion from '../../components/data-ingestion/VideoIngestion';
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
  const { token } = useAuth();
  const {
    items: recentVideos,
    loading,
    error,
    refresh,
  } = useRecentSources<VideoSource>({
    url: `${INGEST_API_URL}/api/v1/videos?limit=10`,
    token,
    what: 'video sources',
    loadError: 'Failed to load video analyses.',
    unwrap: fromDataEnvelope,
  });
  const [selectedVideo, setSelectedVideo] = useState<VideoSource | null>(null);

  return (
    <IngestPage
      icon={ICON.video}
      title="Video Ingestion"
      subtitle="Upload videos for AI analysis - frame extraction, audio transcription, and content summary"
      ingestion={
        <VideoIngestion
          onUploadComplete={refresh}
          onError={(error) => console.error('Upload error:', error)}
          apiUrl={INGEST_API_URL}
          token={token}
        />
      }
      recent={
        <RecentPanel
          title="Recent Video Analyses"
          loading={loading}
          error={error}
          onRetry={refresh}
          isEmpty={recentVideos.length === 0}
          emptyIcon={ICON.video}
          emptyTitle="No video analyses yet"
          emptyHint="Upload a video to get started"
        >
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {recentVideos.map((video) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className={`w-full text-left p-4 ${selectableItemClass(selectedVideo?.id === video.id)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{video.name}</p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {video.extractedData?.summary?.summary?.slice(0, 100) ||
                        video.extractedText?.slice(0, 100)}
                      {(video.extractedData?.summary?.summary?.length ||
                        video.extractedText?.length ||
                        0) > 100
                        ? '...'
                        : ''}
                    </p>
                  </div>
                  <StatusBadge status={video.status} />
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
        </RecentPanel>
      }
    >
      {selectedVideo && (
        <DetailPanel
          onClose={() => setSelectedVideo(null)}
          header={<h2 className="text-xl font-bold text-gray-800">{selectedVideo.name}</h2>}
        >
          {/* Video Info Bar */}
          {selectedVideo.extractedData?.videoInfo && (
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <OutlineIcon d={ICON.clock} className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {formatDuration(selectedVideo.extractedData.videoInfo.duration)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <OutlineIcon
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                  className="w-4 h-4 text-gray-400"
                />
                <span className="text-sm text-gray-600">
                  {selectedVideo.extractedData.videoInfo.width}x
                  {selectedVideo.extractedData.videoInfo.height}
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
                  <OutlineIcon
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    className="w-4 h-4 text-green-500"
                  />
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
                    <OutlineIcon d={ICON.document} className="w-4 h-4 text-indigo-600" />
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

                {selectedVideo.extractedData?.summary?.topics &&
                  selectedVideo.extractedData.summary.topics.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Topics</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedVideo.extractedData.summary.topics.map((topic, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {selectedVideo.extractedData?.summary?.keywords &&
                  selectedVideo.extractedData.summary.keywords.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedVideo.extractedData.summary.keywords.map((keyword, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                          >
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
                <OutlineIcon d={ICON.document} className="w-4 h-4 text-gray-600" />
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
                    {selectedVideo.extractedText ||
                      selectedVideo.extractedData?.transcription?.text}
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
                <OutlineIcon d={ICON.image} className="w-4 h-4 text-gray-600" />
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
                      <p className="text-xs text-gray-500 mt-1 italic">Text: {frame.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Moments */}
          {selectedVideo.extractedData?.summary?.keyMoments &&
            selectedVideo.extractedData.summary.keyMoments.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <OutlineIcon
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    className="w-4 h-4 text-yellow-500"
                  />
                  Key Moments
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVideo.extractedData.summary.keyMoments.map((moment, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
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
        </DetailPanel>
      )}
    </IngestPage>
  );
}
