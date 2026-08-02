'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

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

type UploadState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

const DOCUMENT_TYPES = [
  { id: 'auto', name: 'Auto-detect', icon: '🔍' },
  { id: 'receipt', name: 'Receipt', icon: '🧾' },
  { id: 'invoice', name: 'Invoice', icon: '📄' },
  { id: 'form', name: 'Form', icon: '📋' },
  { id: 'id_card', name: 'ID Card', icon: '🪪' },
  { id: 'business_card', name: 'Business Card', icon: '💼' },
  { id: 'document', name: 'Document', icon: '📝' },
  { id: 'photo', name: 'Photo', icon: '📷' }
];

export default function ImageIngestion({
  onUploadComplete,
  onError,
  formId,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  token
}: ImageIngestionProps) {
  // State
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('auto');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [previewUrl]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setResult(null);
    setUploadState('idle');

    // Create preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleFileSelect(file);
    } else {
      setError('Please drop an image or PDF file');
    }
  }, [handleFileSelect]);

  // Upload and process image
  const uploadImage = useCallback(async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setUploadProgress(0);
    setError(null);

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
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });

      setUploadState('processing');
      setUploadProgress(60);

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
  }, [selectedFile, documentType, customPrompt, apiUrl, formId, token, onUploadComplete, onError]);

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      setError('Could not access camera');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFileSelect(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  }, [handleFileSelect, stopCamera]);

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

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Image / Document Ingestion
      </h2>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <div className="mb-6 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={capturePhoto}
              className="px-6 py-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
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
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload File
            </button>
            <button
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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

          {/* Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold text-indigo-600">Drop image here</span> or click to browse
            </p>
            <p className="text-sm text-gray-500">
              JPG, PNG, GIF, WebP, PDF up to 20MB
            </p>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {previewUrl && !showCamera && (
        <div className="mb-6">
          <div className="relative">
            {selectedFile?.type === 'application/pdf' ? (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-red-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                    <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
                  </svg>
                  <p className="text-gray-600 font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-96 object-contain rounded-lg bg-gray-100"
              />
            )}
            <button
              onClick={clearSelection}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p className="font-medium">{selectedFile?.name}</p>
              <p>{formatFileSize(selectedFile?.size || 0)}</p>
            </div>

            <button
              onClick={uploadImage}
              disabled={uploadState === 'uploading' || uploadState === 'processing'}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
            >
              {uploadState === 'uploading' || uploadState === 'processing' ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {uploadState === 'uploading' ? 'Uploading...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Analyze Image
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
            <span>{uploadState === 'uploading' ? 'Uploading...' : 'Analyzing with Vision AI...'}</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Analysis Complete
          </h3>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-500">Document Type</p>
              <p className="font-semibold text-gray-800 capitalize">{result.documentType}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-500">Processing Time</p>
              <p className="font-semibold text-gray-800">{result.processingTime}ms</p>
            </div>
            {result.confidence && (
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-500">Confidence</p>
                <p className="font-semibold text-gray-800">{Math.round(result.confidence * 100)}%</p>
              </div>
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
                      <p className="text-xs text-gray-500 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
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
        </div>
      )}
    </div>
  );
}
