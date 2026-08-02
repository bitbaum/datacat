'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageIngestion from '../../components/data-ingestion/ImageIngestion';
import { useAuth } from '../../context/AuthContext';

interface ImageSource {
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
  mimeType: string;
  metadata: {
    documentType?: string;
  };
}

export default function ImageIngestionPage() {
  const [recentImages, setRecentImages] = useState<ImageSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageSource | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const { token } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Fetch recent images
  useEffect(() => {
    if (token) fetchRecentImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchRecentImages = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/images?limit=20`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (response.ok) {
        const data = await response.json();
        setRecentImages(data.data?.dataSources || []);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    fetchRecentImages();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDocumentTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      receipt: '🧾',
      invoice: '📄',
      form: '📋',
      id_card: '🪪',
      business_card: '💼',
      document: '📝',
      photo: '📷',
      auto: '🔍'
    };
    return icons[type] || '📄';
  };

  const filteredImages = filterType === 'all'
    ? recentImages
    : recentImages.filter(img =>
        img.extractedData?.documentType === filterType ||
        img.metadata?.documentType === filterType
      );

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Image / Document Ingestion
                </h1>
                <p className="mt-1 text-gray-500">
                  Upload images, scan documents, or take photos for AI analysis and OCR
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Ingestion Component */}
          <div>
            <ImageIngestion
              onUploadComplete={handleUploadComplete}
              onError={(error) => console.error('Upload error:', error)}
              apiUrl={apiUrl}
              token={token}
            />
          </div>

          {/* Recent Images */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Recent Documents
              </h2>

              {/* Filter Dropdown */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="receipt">Receipts</option>
                <option value="invoice">Invoices</option>
                <option value="form">Forms</option>
                <option value="id_card">ID Cards</option>
                <option value="business_card">Business Cards</option>
                <option value="document">Documents</option>
                <option value="photo">Photos</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="w-8 h-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No documents analyzed yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Upload or capture a document to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                {filteredImages.map((image) => {
                  const docType = (image.extractedData?.documentType || image.metadata?.documentType || 'document') as string;
                  return (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(image)}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        selectedImage?.id === image.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">{getDocumentTypeIcon(docType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {image.name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {docType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>{formatFileSize(image.fileSize)}</span>
                        <span className={`px-1.5 py-0.5 rounded-full ${
                          image.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : image.status === 'PROCESSING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {image.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Image Detail */}
        {selectedImage && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {getDocumentTypeIcon(
                    (selectedImage.extractedData?.documentType ||
                    selectedImage.metadata?.documentType ||
                    'document') as string
                  )}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedImage.name}
                  </h2>
                  <p className="text-sm text-gray-500 capitalize">
                    {((selectedImage.extractedData?.documentType ||
                      selectedImage.metadata?.documentType ||
                      'document') as string).replace('_', ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Extracted Text */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Extracted Text (OCR)</h3>
                <p className="text-gray-600 whitespace-pre-wrap max-h-[300px] overflow-y-auto text-sm">
                  {selectedImage.extractedText || 'No text extracted'}
                </p>
              </div>

              {/* Structured Data */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Structured Data</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {selectedImage.extractedData && Object.entries(selectedImage.extractedData).map(([key, value]) => {
                    if (['rawAnalysis', 'rawText', 'confidence', 'documentType'].includes(key)) return null;
                    return (
                      <div key={key} className="border-b border-gray-200 pb-2 last:border-0">
                        <p className="text-xs text-gray-500 uppercase">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <div className="text-gray-700 text-sm">
                          {Array.isArray(value) ? (
                            value.length > 0 ? (
                              <ul className="list-disc list-inside">
                                {value.slice(0, 10).map((item, i) => (
                                  <li key={i}>
                                    {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                  </li>
                                ))}
                                {value.length > 10 && <li className="text-gray-400">...and {value.length - 10} more</li>}
                              </ul>
                            ) : (
                              <span className="text-gray-400 italic">Empty</span>
                            )
                          ) : typeof value === 'object' && value !== null ? (
                            <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            String(value) || <span className="text-gray-400 italic">None</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <span>Processed: {formatDate(selectedImage.processedAt)}</span>
              <span>Processing Time: {selectedImage.processingTime}ms</span>
              <span>File Size: {formatFileSize(selectedImage.fileSize)}</span>
              {selectedImage.confidence && (
                <span>Confidence: {Math.round(selectedImage.confidence * 100)}%</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
