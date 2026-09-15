'use client';

import React, { useState } from 'react';
import { formatDate, formatFileSize } from '@/lib/format';
import ImageIngestion from '../../components/data-ingestion/ImageIngestion';
import { ICON } from '../../components/data-ingestion/icons';
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

const DOCUMENT_TYPE_ICONS: Record<string, string> = {
  receipt: '🧾',
  invoice: '📄',
  form: '📋',
  id_card: '🪪',
  business_card: '💼',
  document: '📝',
  photo: '📷',
  auto: '🔍',
};

const getDocumentTypeIcon = (type: string) => DOCUMENT_TYPE_ICONS[type] || '📄';

const documentTypeOf = (image: ImageSource) =>
  (image.extractedData?.documentType || image.metadata?.documentType || 'document') as string;

export default function ImageIngestionPage() {
  const { token } = useAuth();
  const {
    items: recentImages,
    loading,
    error,
    refresh,
  } = useRecentSources<ImageSource>({
    url: `${INGEST_API_URL}/api/v1/images?limit=20`,
    token,
    what: 'images',
    loadError: 'Failed to load documents.',
    unwrap: fromDataEnvelope,
  });
  const [selectedImage, setSelectedImage] = useState<ImageSource | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredImages =
    filterType === 'all'
      ? recentImages
      : recentImages.filter(
          (img) =>
            img.extractedData?.documentType === filterType ||
            img.metadata?.documentType === filterType,
        );

  return (
    <IngestPage
      icon={ICON.image}
      title="Image / Document Ingestion"
      subtitle="Upload images, scan documents, or take photos for AI analysis and OCR"
      ingestion={
        <ImageIngestion
          onUploadComplete={refresh}
          onError={(error) => console.error('Upload error:', error)}
          apiUrl={INGEST_API_URL}
          token={token}
        />
      }
      recent={
        <RecentPanel
          title="Recent Documents"
          icon={ICON.archive}
          headerExtra={
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
          }
          loading={loading}
          error={error}
          onRetry={refresh}
          isEmpty={filteredImages.length === 0}
          emptyIcon={ICON.image}
          emptyTitle="No documents analyzed yet"
          emptyHint="Upload or capture a document to get started"
        >
          <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
            {filteredImages.map((image) => {
              const docType = documentTypeOf(image);
              return (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className={`text-left p-3 ${selectableItemClass(selectedImage?.id === image.id)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{getDocumentTypeIcon(docType)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{image.name}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {docType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>{formatFileSize(image.fileSize)}</span>
                    <StatusBadge status={image.status} className="px-1.5 py-0.5 rounded-full" />
                  </div>
                </button>
              );
            })}
          </div>
        </RecentPanel>
      }
    >
      {selectedImage && (
        <DetailPanel
          onClose={() => setSelectedImage(null)}
          header={
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getDocumentTypeIcon(documentTypeOf(selectedImage))}</span>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedImage.name}</h2>
                <p className="text-sm text-gray-500 capitalize">
                  {documentTypeOf(selectedImage).replace('_', ' ')}
                </p>
              </div>
            </div>
          }
        >
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
                {selectedImage.extractedData &&
                  Object.entries(selectedImage.extractedData).map(([key, value]) => {
                    if (['rawAnalysis', 'rawText', 'confidence', 'documentType'].includes(key))
                      return null;
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
                                {value.length > 10 && (
                                  <li className="text-gray-400">...and {value.length - 10} more</li>
                                )}
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
        </DetailPanel>
      )}
    </IngestPage>
  );
}
