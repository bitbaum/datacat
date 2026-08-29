'use client';

import { useState, useCallback } from 'react';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { WorkflowProduct } from './ErfassungWorkflow';

interface PhotoUploadStepProps {
  onPhotosUploaded: (photos: File[]) => void;
  product: WorkflowProduct;
}

export function PhotoUploadStep({ onPhotosUploaded, product }: PhotoUploadStepProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'));

    if (files.length > 0) {
      setPhotos((prev) => [...prev, ...files].slice(0, 10)); // Max 10 photos
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((file) => file.type.startsWith('image/'));
      setPhotos((prev) => [...prev, ...files].slice(0, 10));
    }
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleContinue = useCallback(() => {
    if (photos.length > 0) {
      onPhotosUploaded(photos);
    }
  }, [photos, onPhotosUploaded]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
      <div className="text-center mb-8">
        <PhotoIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Produktfotos hochladen
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Laden Sie 1-10 Fotos Ihres Produkts hoch. Verschiedene Winkel und Details helfen der KI
          bei der Analyse.
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
      >
        <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Fotos hier ablegen oder
          </p>
          <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
            Dateien auswählen
          </label>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          PNG, JPG, GIF bis zu 10MB pro Datei • Maximal 10 Fotos
        </p>
      </div>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hochgeladene Fotos ({photos.length}/10)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Product photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {photo.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Type Hints */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 Tipps für bessere KI-Analyse
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <p className="font-medium mb-1">📷 Allgemeine Ansichten</p>
            <p>Gesamtansicht des Produkts von verschiedenen Seiten</p>
          </div>
          <div>
            <p className="font-medium mb-1">🏷️ Typenschild/Label</p>
            <p>Klare Aufnahme von Etiketten und Typenschildern</p>
          </div>
          <div>
            <p className="font-medium mb-1">📏 Maße & Größe</p>
            <p>Fotos mit Maßstab oder Größenvergleich</p>
          </div>
          <div>
            <p className="font-medium mb-1">🔍 Details</p>
            <p>Nahaufnahmen wichtiger Features und Merkmale</p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={photos.length === 0}
          className={`px-6 py-3 rounded-md font-medium transition-colors ${
            photos.length > 0
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          KI-Analyse starten ({photos.length} Foto{photos.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}
