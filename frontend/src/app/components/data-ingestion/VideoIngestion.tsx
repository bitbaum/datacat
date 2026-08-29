'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

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

type UploadState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export default function VideoIngestion({
  onUploadComplete,
  onError,
  formId,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  token,
}: VideoIngestionProps) {
  // State
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<VideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Settings
  const [frameInterval, setFrameInterval] = useState(5);
  const [maxFrames, setMaxFrames] = useState(10);
  const [transcribeAudio, setTranscribeAudio] = useState(true);
  const [analyzeFrames, setAnalyzeFrames] = useState(true);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setUploadState('idle');

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl],
  );

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        handleFileSelect(file);
      } else {
        setError('Please drop a video file');
      }
    },
    [handleFileSelect],
  );

  // Upload and process video
  const uploadVideo = useCallback(async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setUploadProgress(0);
    setError(null);

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
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadState('processing');
      setUploadProgress(40);

      // Simulate processing progress
      const processingInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 2000);

      if (!response.ok) {
        clearInterval(processingInterval);
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      clearInterval(processingInterval);

      setUploadProgress(100);
      setUploadState('complete');
      setResult(data.data);
      onUploadComplete?.(data.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      setUploadState('error');
      onError?.(errorMsg);
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
    onUploadComplete,
    onError,
  ]);

  // Clear selection
  const clearSelection = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setUploadState('idle');
  }, [previewUrl]);

  // Format time
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <svg
          className="w-6 h-6 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        Video Ingestion
      </h2>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </p>
        </div>
      )}

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

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
          >
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold text-indigo-600">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-sm text-gray-500">MP4, MOV, AVI, MKV, WebM up to 500MB</p>
            <p className="text-xs text-gray-400 mt-2">
              Requires FFmpeg installed on the server for processing
            </p>
          </div>
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
            <button
              onClick={clearSelection}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
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

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p className="font-medium">{selectedFile?.name}</p>
              <p>{formatFileSize(selectedFile?.size || 0)}</p>
            </div>

            <button
              onClick={uploadVideo}
              disabled={uploadState === 'uploading' || uploadState === 'processing'}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
            >
              {uploadState === 'uploading' || uploadState === 'processing' ? (
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
                  {uploadState === 'uploading' ? 'Uploading...' : 'Processing...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  Analyze Video
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {(uploadState === 'uploading' || uploadState === 'processing') && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              {uploadState === 'uploading'
                ? 'Uploading video...'
                : 'Extracting frames & transcribing audio...'}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {uploadState === 'processing' &&
              'This may take a few minutes depending on video length...'}
          </p>
        </div>
      )}

      {/* Results Section */}
      {result && uploadState === 'complete' && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Video Analysis Complete
          </h3>

          {/* Video Info */}
          <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-gray-500">Duration</p>
              <p className="font-semibold text-gray-800">
                {formatDuration(result.videoInfo.duration)}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-gray-500">Resolution</p>
              <p className="font-semibold text-gray-800">
                {result.videoInfo.width}x{result.videoInfo.height}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-gray-500">FPS</p>
              <p className="font-semibold text-gray-800">{result.videoInfo.fps}</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-gray-500">Frames Analyzed</p>
              <p className="font-semibold text-gray-800">{result.frameCount}</p>
            </div>
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
        </div>
      )}
    </div>
  );
}
