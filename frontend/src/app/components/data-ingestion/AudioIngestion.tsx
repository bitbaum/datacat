'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface AudioIngestionProps {
  onUploadComplete?: (result: AudioResult) => void;
  onError?: (error: string) => void;
  formId?: string;
  apiUrl?: string;
  token?: string | null;
}

interface AudioResult {
  id: string;
  status: string;
  transcription: string;
  language?: string;
  duration?: number;
  extractedData?: {
    summary?: string;
    topics?: string[];
    entities?: Record<string, string[]>;
    sentiment?: string;
    keyPoints?: string[];
    actionItems?: string[];
    type?: string;
  };
  processingTime: number;
  confidence?: number;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
type UploadState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export default function AudioIngestion({
  onUploadComplete,
  onError,
  formId,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  token,
}: AudioIngestionProps) {
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<AudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setRecordingState('recording');
      setRecordingTime(0);
      setError(null);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [recordingState]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [recordingState]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  }, [recordingState]);

  // Clear recording
  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingState('idle');
    setRecordingTime(0);
    setResult(null);
    setError(null);
    setUploadState('idle');
  }, [audioUrl]);

  // Upload recorded audio
  const uploadRecording = useCallback(async () => {
    if (!audioBlob) return;

    setUploadState('uploading');
    setUploadProgress(0);
    setError(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const base64Data = await base64Promise;

      setUploadState('processing');
      setUploadProgress(50);

      // Send to API
      const response = await fetch(`${apiUrl}/api/v1/audio/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          audioData: base64Data,
          name: `Recording ${new Date().toLocaleString()}`,
          formId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

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
  }, [audioBlob, apiUrl, formId, token, onUploadComplete, onError]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploadState('uploading');
      setUploadProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('audio', file);
        formData.append('name', file.name);
        if (formId) {
          formData.append('formId', formId);
        }

        const response = await fetch(`${apiUrl}/api/v1/audio/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });

        setUploadState('processing');
        setUploadProgress(50);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();

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
    },
    [apiUrl, formId, token, onUploadComplete, onError],
  );

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload],
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('audio/')) {
        handleFileUpload(file);
      } else {
        setError('Please drop an audio file');
      }
    },
    [handleFileUpload],
  );

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
        Voice / Audio Ingestion
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

      {/* Recording Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Record Audio</h3>

        <div className="flex items-center gap-4">
          {/* Recording Controls */}
          <div className="flex items-center gap-2">
            {recordingState === 'idle' && (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="6" />
                </svg>
                Start Recording
              </button>
            )}

            {recordingState === 'recording' && (
              <>
                <button
                  onClick={pauseRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  Pause
                </button>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  Stop
                </button>
              </>
            )}

            {recordingState === 'paused' && (
              <>
                <button
                  onClick={resumeRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  Resume
                </button>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  Stop
                </button>
              </>
            )}

            {recordingState === 'stopped' && audioBlob && (
              <button
                onClick={clearRecording}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear
              </button>
            )}
          </div>

          {/* Recording Timer */}
          {(recordingState === 'recording' || recordingState === 'paused') && (
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                recordingState === 'recording'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  recordingState === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'
                }`}
              />
              <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        {/* Audio Preview */}
        {audioUrl && recordingState === 'stopped' && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Recording Preview ({formatTime(recordingTime)})
            </p>
            <audio src={audioUrl} controls className="w-full" />

            <button
              onClick={uploadRecording}
              disabled={uploadState === 'uploading' || uploadState === 'processing'}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
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
                  {uploadState === 'uploading' ? 'Uploading...' : 'Transcribing...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Transcribe Recording
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-500 text-sm">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* File Upload Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Upload Audio File</h3>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="text-gray-600 mb-2">
            <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-gray-500">MP3, WAV, M4A, WEBM, OGG, FLAC up to 25MB</p>
        </div>
      </div>

      {/* Progress Bar */}
      {(uploadState === 'uploading' || uploadState === 'processing') && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              {uploadState === 'uploading' ? 'Uploading...' : 'Transcribing with Whisper AI...'}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
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
            Transcription Complete
          </h3>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            {result.language && (
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-500">Language</p>
                <p className="font-semibold text-gray-800">{result.language.toUpperCase()}</p>
              </div>
            )}
            {result.duration && (
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-500">Duration</p>
                <p className="font-semibold text-gray-800">{Math.round(result.duration)}s</p>
              </div>
            )}
            {result.confidence && (
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-500">Confidence</p>
                <p className="font-semibold text-gray-800">
                  {Math.round(result.confidence * 100)}%
                </p>
              </div>
            )}
          </div>

          {/* Transcription */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-500 mb-2">Transcription</p>
            <p className="text-gray-800 whitespace-pre-wrap">{result.transcription}</p>
          </div>

          {/* Extracted Data */}
          {result.extractedData && (
            <div className="space-y-4">
              {result.extractedData.summary && (
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Summary</p>
                  <p className="text-gray-800">{result.extractedData.summary}</p>
                </div>
              )}

              {result.extractedData.topics && result.extractedData.topics.length > 0 && (
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {result.extractedData.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.extractedData.keyPoints && result.extractedData.keyPoints.length > 0 && (
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Key Points</p>
                  <ul className="list-disc list-inside text-gray-800 space-y-1">
                    {result.extractedData.keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.extractedData.actionItems && result.extractedData.actionItems.length > 0 && (
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Action Items</p>
                  <ul className="space-y-2">
                    {result.extractedData.actionItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-800">
                        <input type="checkbox" className="w-4 h-4 rounded" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.extractedData.sentiment && (
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Sentiment</p>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.extractedData.sentiment === 'positive'
                        ? 'bg-green-100 text-green-700'
                        : result.extractedData.sentiment === 'negative'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {result.extractedData.sentiment}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Processing Info */}
          <div className="mt-4 pt-4 border-t border-green-200 text-sm text-gray-500">
            Processed in {result.processingTime}ms
          </div>
        </div>
      )}
    </div>
  );
}
