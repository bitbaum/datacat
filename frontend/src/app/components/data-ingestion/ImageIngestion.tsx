'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { formatFileSize } from '@/lib/format';
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

interface ImageIngestionProps {
  onUploadComplete?: (result: ImageResult) => void;
  onError?: (error: string) => void;
  formId?: string;
  apiUrl?: string;
  token?: string | null;
}

interface ImageResult {
  id: string;
  status: string;
  extractedText: string;
  documentType: string;
  extractedData: Record<string, unknown>;
  processingTime: number;
  confidence?: number;
}

const DOCUMENT_TYPES = [
  { id: 'auto', name: 'Auto-detect', icon: '🔍' },
  { id: 'receipt', name: 'Receipt', icon: '🧾' },
  { id: 'invoice', name: 'Invoice', icon: '📄' },
  { id: 'form', name: 'Form', icon: '📋' },
  { id: 'id_card', name: 'ID Card', icon: '🪪' },
  { id: 'business_card', name: 'Business Card', icon: '💼' },
  { id: 'document', name: 'Document', icon: '📝' },
  { id: 'photo', name: 'Photo', icon: '📷' },
];

const isImageOrPdf = (file: File) =>
  file.type.startsWith('image/') || file.type === 'application/pdf';

export default function ImageIngestion({
  onUploadComplete,
  onError,
  formId,
  apiUrl = INGEST_API_URL,
  token,
}: ImageIngestionProps) {
  const upload = useIngestionUpload<ImageResult>({ onUploadComplete, onError });
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
  const { selectedFile, previewUrl, select, clear, handleFileChange, handleDrop } = useFilePreview({
    accept: isImageOrPdf,
    rejectMessage: 'Please drop an image or PDF file',
    onChange: reset,
    onReject: setError,
  });
  const [documentType, setDocumentType] = useState('auto');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Release the camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Upload and process image
  const uploadImage = useCallback(async () => {
    if (!selectedFile) return;

    start();

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('name', selectedFile.name);
      formData.append('documentType', documentType);
      if (customPrompt) {
        formData.append('extractionPrompt', customPrompt);
      }
      if (formId) {
        formData.append('formId', formId);
      }

      setUploadProgress(30);

      const response = await fetch(`${apiUrl}/api/v1/images/upload`, {
        method: 'POST',
        headers: authHeaders(token),
        body: formData,
      });

      setUploadState('processing');
      setUploadProgress(60);

      succeed(await readIngestionResponse<ImageResult>(response));
    } catch (err) {
      fail(err);
    }
  }, [
    selectedFile,
    documentType,
    customPrompt,
    apiUrl,
    formId,
    token,
    start,
    setUploadProgress,
    setUploadState,
    succeed,
    fail,
  ]);

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch {
      setError('Could not access camera');
    }
  }, [setError]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
              select(file);
              stopCamera();
            }
          },
          'image/jpeg',
          0.9,
        );
      }
    }
  }, [select, stopCamera]);

  return (
    <IngestionCard title="Image / Document Ingestion" icon={ICON.image}>
      {error && <ErrorBanner message={error} />}

      {/* Camera View */}
      {showCamera && (
        <div className="mb-6 relative">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={capturePhoto}
              className="px-6 py-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                <circle cx="12" cy="12" r="7" fill="currentColor" />
              </svg>
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
            >
              Cancel
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Upload Section */}
      {!showCamera && !previewUrl && (
        <div className="mb-6">
          {/* Document Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
            <div className="grid grid-cols-4 gap-2">
              {DOCUMENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setDocumentType(type.id)}
                  className={`p-2 rounded-lg border-2 text-center transition-all ${
                    documentType === type.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <p className="text-xs mt-1 text-gray-600">{type.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Extraction Prompt */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Extraction Instructions (optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="E.g., Extract all product names and prices, or Find all dates mentioned..."
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={2}
            />
          </div>

          {/* Upload/Capture Buttons */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <OutlineIcon d={ICON.upload} className="w-5 h-5" />
              Upload File
            </button>
            <button
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={ICON.camera}
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Take Photo
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <DropZone onDrop={handleDrop} onOpen={() => fileInputRef.current?.click()}>
            <OutlineIcon d={ICON.image} className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              <span className="font-semibold text-indigo-600">Drop image here</span> or click to
              browse
            </p>
            <p className="text-sm text-gray-500">JPG, PNG, GIF, WebP, PDF up to 20MB</p>
          </DropZone>
        </div>
      )}

      {/* Preview Section */}
      {previewUrl && !showCamera && (
        <div className="mb-6">
          <div className="relative">
            {selectedFile?.type === 'application/pdf' ? (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto text-red-500 mb-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                    <path d="M8 12h8v2H8zm0 4h8v2H8z" />
                  </svg>
                  <p className="text-gray-600 font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- blob: URL of the file just picked; next/image cannot optimise it
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-96 object-contain rounded-lg bg-gray-100"
              />
            )}
            <RemoveButton onClick={clear} />
          </div>

          <SelectedFileRow file={selectedFile}>
            <SubmitButton
              busy={busy}
              busyLabel={uploadState === 'uploading' ? 'Uploading...' : 'Analyzing...'}
              label="Analyze Image"
              icon={ICON.lightbulb}
              onClick={uploadImage}
            />
          </SelectedFileRow>
        </div>
      )}

      {busy && (
        <ProgressBar
          label={uploadState === 'uploading' ? 'Uploading...' : 'Analyzing with Vision AI...'}
          progress={uploadProgress}
        />
      )}

      {/* Results Section */}
      {result && uploadState === 'complete' && (
        <ResultCard title="Analysis Complete">
          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <MetaTile label="Document Type" valueClassName="capitalize">
              {result.documentType}
            </MetaTile>
            <MetaTile label="Processing Time">{result.processingTime}ms</MetaTile>
            {result.confidence && (
              <MetaTile label="Confidence">{Math.round(result.confidence * 100)}%</MetaTile>
            )}
          </div>

          {/* Extracted Text */}
          {result.extractedText && (
            <div className="bg-white p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500 mb-2">Extracted Text</p>
              <p className="text-gray-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {result.extractedText}
              </p>
            </div>
          )}

          {/* Structured Data */}
          {result.extractedData && Object.keys(result.extractedData).length > 0 && (
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Extracted Data</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(result.extractedData).map(([key, value]) => {
                  // Skip certain keys
                  if (['rawAnalysis', 'rawText', 'confidence'].includes(key)) return null;

                  return (
                    <div key={key} className="border-b border-gray-100 pb-2 last:border-0">
                      <p className="text-xs text-gray-500 uppercase">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <div className="text-gray-700">
                        {Array.isArray(value) ? (
                          <ul className="list-disc list-inside">
                            {value.map((item, i) => (
                              <li key={i}>
                                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                              </li>
                            ))}
                          </ul>
                        ) : typeof value === 'object' ? (
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          String(value)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ResultCard>
      )}
    </IngestionCard>
  );
}
