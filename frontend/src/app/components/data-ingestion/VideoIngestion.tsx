'use client';

import React, { useCallback, useRef, useState } from 'react';
import { formatDuration } from '@/lib/format';
import { ICON, OutlineIcon } from './icons';
import {
  DropZone,
  ErrorBanner,
  INGEST_API_URL,
  IngestionCard,
  MetaTile,
  ProgressBar,
  RemoveButton,
  ResultCard,
  SelectedFileRow,
  SubmitButton,
  authHeaders,
  readIngestionResponse,
  useFilePreview,
  useIngestionUpload,
} from './shared';

interface VideoIngestionProps {
  onUploadComplete?: (result: VideoResult) => void;
  onError?: (error: string) => void;
  formId?: string;
  apiUrl?: string;
  token?: string | null;
}

interface VideoResult {
  id: string;
  status: string;
  videoInfo: {
    duration: number;
    width: number;
    height: number;
    fps: number;
    hasAudio: boolean;
  };
  frameCount: number;
  transcription: string | null;
  summary: {
    summary: string;
    topics: string[];
    keywords: string[];
    contentType: string;
    keyMoments?: { timestamp: number; description: string }[];
  };
  processingTime: number;
  confidence?: number;
}

const isVideo = (file: File) => file.type.startsWith('video/');

export default function VideoIngestion({
  onUploadComplete,
  onError,
  formId,
  apiUrl = INGEST_API_URL,
  token,
}: VideoIngestionProps) {
  const upload = useIngestionUpload<VideoResult>({ onUploadComplete, onError });
  const {
    uploadState,
    setUploadState,
    uploadProgress,
    setUploadProgress,
    result,
    error,
    setError,
    busy,
    start,
    succeed,
    fail,
    reset,
  } = upload;
  const { selectedFile, previewUrl, clear, handleFileChange, handleDrop } = useFilePreview({
    accept: isVideo,
    rejectMessage: 'Please drop a video file',
    onChange: reset,
    onReject: setError,
  });

  // Settings
  const [frameInterval, setFrameInterval] = useState(5);
  const [maxFrames, setMaxFrames] = useState(10);
  const [transcribeAudio, setTranscribeAudio] = useState(true);
  const [analyzeFrames, setAnalyzeFrames] = useState(true);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Upload and process video
  const uploadVideo = useCallback(async () => {
    if (!selectedFile) return;

    start();

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('name', selectedFile.name);
      formData.append('frameInterval', frameInterval.toString());
      formData.append('maxFrames', maxFrames.toString());
      formData.append('transcribeAudio', transcribeAudio.toString());
      formData.append('analyzeFrames', analyzeFrames.toString());
      if (formId) {
        formData.append('formId', formId);
      }

      // Simulate progress for large uploads
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 30));
      }, 500);

      const response = await fetch(`${apiUrl}/api/v1/videos/upload`, {
        method: 'POST',
        headers: authHeaders(token),
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadState('processing');
      setUploadProgress(40);

      // Simulate processing progress
      const processingInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 2000);

      try {
        succeed(await readIngestionResponse<VideoResult>(response));
      } finally {
        clearInterval(processingInterval);
      }
    } catch (err) {
      fail(err);
    }
  }, [
    selectedFile,
    frameInterval,
    maxFrames,
    transcribeAudio,
    analyzeFrames,
    apiUrl,
    formId,
    token,
    start,
    setUploadProgress,
    setUploadState,
    succeed,
    fail,
  ]);

  return (
    <IngestionCard title="Video Ingestion" icon={ICON.video}>
      {error && <ErrorBanner message={error} />}

      {/* Settings Section */}
      {!previewUrl && uploadState === 'idle' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Processing Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Frame Interval (seconds)</label>
              <input
                type="number"
                value={frameInterval}
                onChange={(e) => setFrameInterval(Math.max(1, parseInt(e.target.value) || 5))}
                className="w-full p-2 border border-gray-200 rounded-lg"
                min={1}
                max={60}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Max Frames to Analyze</label>
              <input
                type="number"
                value={maxFrames}
                onChange={(e) => setMaxFrames(Math.max(1, parseInt(e.target.value) || 10))}
                className="w-full p-2 border border-gray-200 rounded-lg"
                min={1}
                max={30}
              />
            </div>
          </div>
          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={transcribeAudio}
                onChange={(e) => setTranscribeAudio(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="text-sm text-gray-600">Transcribe Audio</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={analyzeFrames}
                onChange={(e) => setAnalyzeFrames(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="text-sm text-gray-600">Analyze Frames</span>
            </label>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!previewUrl && (
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <DropZone onDrop={handleDrop} onOpen={() => fileInputRef.current?.click()}>
            <OutlineIcon d={ICON.video} className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              <span className="font-semibold text-indigo-600">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-sm text-gray-500">MP4, MOV, AVI, MKV, WebM up to 500MB</p>
            <p className="text-xs text-gray-400 mt-2">
              Requires FFmpeg installed on the server for processing
            </p>
          </DropZone>
        </div>
      )}

      {/* Video Preview */}
      {previewUrl && uploadState !== 'complete' && (
        <div className="mb-6">
          <div className="relative">
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="w-full rounded-lg bg-black"
            />
            <RemoveButton onClick={clear} />
          </div>

          <SelectedFileRow file={selectedFile}>
            <SubmitButton
              busy={busy}
              busyLabel={uploadState === 'uploading' ? 'Uploading...' : 'Processing...'}
              label="Analyze Video"
              icon={ICON.lightbulb}
              onClick={uploadVideo}
            />
          </SelectedFileRow>
        </div>
      )}

      {busy && (
        <ProgressBar
          label={
            uploadState === 'uploading'
              ? 'Uploading video...'
              : 'Extracting frames & transcribing audio...'
          }
          progress={uploadProgress}
          transition="duration-500"
        >
          <p className="text-xs text-gray-400 mt-2 text-center">
            {uploadState === 'processing' &&
              'This may take a few minutes depending on video length...'}
          </p>
        </ProgressBar>
      )}

      {/* Results Section */}
      {result && uploadState === 'complete' && (
        <ResultCard title="Video Analysis Complete">
          {/* Video Info */}
          <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
            <MetaTile label="Duration" center>
              {formatDuration(result.videoInfo.duration)}
            </MetaTile>
            <MetaTile label="Resolution" center>
              {result.videoInfo.width}x{result.videoInfo.height}
            </MetaTile>
            <MetaTile label="FPS" center>
              {result.videoInfo.fps}
            </MetaTile>
            <MetaTile label="Frames Analyzed" center>
              {result.frameCount}
            </MetaTile>
          </div>

          {/* Summary */}
          {result.summary && (
            <div className="bg-white p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500 mb-2">Summary</p>
              <p className="text-gray-800">{result.summary.summary}</p>

              {result.summary.topics && result.summary.topics.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {result.summary.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.summary.keywords && result.summary.keywords.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {result.summary.keywords.map((keyword, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs capitalize">
                  {result.summary.contentType}
                </span>
              </div>
            </div>
          )}

          {/* Transcription */}
          {result.transcription && (
            <div className="bg-white p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500 mb-2">Audio Transcription</p>
              <p className="text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto text-sm">
                {result.transcription}
              </p>
            </div>
          )}

          {/* Key Moments */}
          {result.summary.keyMoments && result.summary.keyMoments.length > 0 && (
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Key Moments</p>
              <div className="space-y-2">
                {result.summary.keyMoments.map((moment, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-mono">
                      {formatDuration(moment.timestamp)}
                    </span>
                    <span className="text-sm text-gray-700">{moment.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Info */}
          <div className="mt-4 pt-4 border-t border-green-200 text-sm text-gray-500 flex justify-between">
            <span>Processed in {(result.processingTime / 1000).toFixed(1)}s</span>
            {result.confidence && <span>Confidence: {Math.round(result.confidence * 100)}%</span>}
          </div>
        </ResultCard>
      )}
    </IngestionCard>
  );
}
