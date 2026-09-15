'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ICON, OutlineIcon } from './icons';
import {
  DropZone,
  ErrorBanner,
  INGEST_API_URL,
  IngestionCard,
  MetaTile,
  ProgressBar,
  ResultCard,
  SubmitButton,
  authHeaders,
  readIngestionResponse,
  useIngestionUpload,
} from './shared';

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

export default function AudioIngestion({
  onUploadComplete,
  onError,
  formId,
  apiUrl = INGEST_API_URL,
  token,
}: AudioIngestionProps) {
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Upload state
  const upload = useIngestionUpload<AudioResult>({ onUploadComplete, onError });
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
  }, [onError, setError]);

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
    reset();
  }, [audioUrl, reset]);

  // Upload recorded audio
  const uploadRecording = useCallback(async () => {
    if (!audioBlob) return;

    start();

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
          ...authHeaders(token),
        },
        body: JSON.stringify({
          audioData: base64Data,
          name: `Recording ${new Date().toLocaleString()}`,
          formId,
        }),
      });

      succeed(await readIngestionResponse<AudioResult>(response));
    } catch (err) {
      fail(err);
    }
  }, [audioBlob, apiUrl, formId, token, start, setUploadState, setUploadProgress, succeed, fail]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      start();

      try {
        const formData = new FormData();
        formData.append('audio', file);
        formData.append('name', file.name);
        if (formId) {
          formData.append('formId', formId);
        }

        const response = await fetch(`${apiUrl}/api/v1/audio/upload`, {
          method: 'POST',
          headers: authHeaders(token),
          body: formData,
        });

        setUploadState('processing');
        setUploadProgress(50);

        succeed(await readIngestionResponse<AudioResult>(response));
      } catch (err) {
        fail(err);
      }
    },
    [apiUrl, formId, token, start, setUploadState, setUploadProgress, succeed, fail],
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
    [handleFileUpload, setError],
  );

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Shown while recording and while paused.
  const stopButton = (
    <button
      onClick={stopRecording}
      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="6" width="12" height="12" />
      </svg>
      Stop
    </button>
  );

  return (
    <IngestionCard title="Voice / Audio Ingestion" icon={ICON.microphone}>
      {error && <ErrorBanner message={error} />}

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
                {stopButton}
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
                {stopButton}
              </>
            )}

            {recordingState === 'stopped' && audioBlob && (
              <button
                onClick={clearRecording}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <OutlineIcon d={ICON.close} className="w-5 h-5" />
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

            <SubmitButton
              busy={busy}
              busyLabel={uploadState === 'uploading' ? 'Uploading...' : 'Transcribing...'}
              label="Transcribe Recording"
              icon={ICON.cloudUpload}
              onClick={uploadRecording}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
            />
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

        <DropZone onDrop={handleDrop} onOpen={() => fileInputRef.current?.click()}>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <OutlineIcon d={ICON.cloudUpload} className="w-12 h-12 mx-auto text-gray-400 mb-4" />

          <p className="text-gray-600 mb-2">
            <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-gray-500">MP3, WAV, M4A, WEBM, OGG, FLAC up to 25MB</p>
        </DropZone>
      </div>

      {busy && (
        <ProgressBar
          label={uploadState === 'uploading' ? 'Uploading...' : 'Transcribing with Whisper AI...'}
          progress={uploadProgress}
        />
      )}

      {/* Results Section */}
      {result && uploadState === 'complete' && (
        <ResultCard title="Transcription Complete">
          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            {result.language && (
              <MetaTile label="Language">{result.language.toUpperCase()}</MetaTile>
            )}
            {result.duration && (
              <MetaTile label="Duration">{Math.round(result.duration)}s</MetaTile>
            )}
            {result.confidence && (
              <MetaTile label="Confidence">{Math.round(result.confidence * 100)}%</MetaTile>
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
        </ResultCard>
      )}
    </IngestionCard>
  );
}
