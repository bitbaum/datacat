'use client';

import { useState, useCallback } from 'react';
import { PhotoUploadStep } from './PhotoUploadStep';
import { AnalysisStep } from './AnalysisStep';
import { DataReviewStep } from './DataReviewStep';
import { ExportStep } from './ExportStep';
import { TableOverviewStep } from './TableOverviewStep';
import { ProductStatus } from '../types/product';

// Demo product data that will be populated through the workflow
export interface WorkflowProduct {
  id: string;
  photos: File[];
  analysisResult?: {
    title: string;
    manufacturer: string;
    articleNumber: string;
    shortDescription: string;
    longDescription: string;
    price: number;
    weight: number;
    length: number;
    width: number;
    height: number;
    mainCategoryA: string;
    mainCategoryB: string;
    subCategoryA: string;
    subCategoryB: string;
    stockQuantity: number;
    articleType: string;
    unit: string;
    confidence: Record<string, number>;
  };
  reviewedData?: any;
  exportData?: {
    format: string;
    downloadUrl: string;
    recordCount: number;
  };
  status: ProductStatus;
}

type WorkflowStep = 'upload' | 'analysis' | 'review' | 'export' | 'table';

interface ErfassungWorkflowProps {
  onComplete?: (product: WorkflowProduct) => void;
}

const steps = ['upload', 'analysis', 'review', 'export', 'table'];

export function ErfassungWorkflow({ onComplete }: ErfassungWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [product, setProduct] = useState<WorkflowProduct>({
    id: `product-${Date.now()}`,
    photos: [],
    status: ProductStatus.DRAFT,
  });

  // Step completion handlers
  const handlePhotosUploaded = useCallback((photos: File[]) => {
    setProduct((prev) => ({
      ...prev,
      photos,
      status: ProductStatus.ANALYZING,
    }));
    setCurrentStep('analysis');
  }, []);

  const handleAnalysisComplete = useCallback(
    (analysisResult: WorkflowProduct['analysisResult']) => {
      setProduct((prev) => ({
        ...prev,
        analysisResult,
        status: ProductStatus.ANALYZED,
      }));
      setCurrentStep('review');
    },
    [],
  );

  const handleReviewComplete = useCallback((reviewedData: any) => {
    setProduct((prev) => ({
      ...prev,
      reviewedData,
      status: ProductStatus.REVIEWED,
    }));
    setCurrentStep('export');
  }, []);

  const handleExportComplete = useCallback(
    (exportData: WorkflowProduct['exportData']) => {
      const completedProduct = {
        ...product,
        exportData,
        status: ProductStatus.EXPORTED,
      };
      setProduct(completedProduct);
      setCurrentStep('table');
      onComplete?.(completedProduct);
    },
    [product, onComplete],
  );

  const handleBackToTable = useCallback(() => {
    setCurrentStep('table');
  }, []);

  const canNavigateToStep = useCallback(
    (step: WorkflowStep): boolean => {
      const stepIndex = steps.indexOf(step);
      const currentIndex = steps.indexOf(currentStep);

      // Can navigate to completed steps or current step
      if (stepIndex <= currentIndex) return true;

      // Can navigate forward only if previous steps are completed
      switch (step) {
        case 'analysis':
          return product.photos.length > 0;
        case 'review':
          return !!product.analysisResult;
        case 'export':
          return !!product.reviewedData;
        case 'table':
          return !!product.exportData;
        default:
          return false;
      }
    },
    [currentStep, product, steps],
  );

  const navigateToStep = useCallback(
    (step: WorkflowStep) => {
      if (canNavigateToStep(step)) {
        setCurrentStep(step);
      }
    },
    [canNavigateToStep],
  );

  // Progress calculation
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Progress Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Produkterfassung Workflow
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Schritt {currentStepIndex + 1} von {steps.length}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="relative flex items-center justify-between">
            {[
              { key: 'upload', label: 'Fotos', icon: '📸', description: 'Produktfotos hochladen' },
              {
                key: 'analysis',
                label: 'Analyse',
                icon: '🤖',
                description: 'KI-Analyse der Bilder',
              },
              {
                key: 'review',
                label: 'Prüfung',
                icon: '✏️',
                description: 'Daten überprüfen und bearbeiten',
              },
              { key: 'export', label: 'Export', icon: '📄', description: 'Daten exportieren' },
              { key: 'table', label: 'Tabelle', icon: '📊', description: 'Zur Tabellen-Übersicht' },
            ].map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const canNavigate = canNavigateToStep(step.key as WorkflowStep);

              return (
                <div key={step.key} className="flex flex-col items-center group">
                  <button
                    onClick={() => navigateToStep(step.key as WorkflowStep)}
                    disabled={!canNavigate}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg scale-110'
                        : isCompleted
                          ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                          : canNavigate
                            ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 cursor-pointer'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    } ${canNavigate ? 'hover:scale-105' : ''}`}
                    title={step.description}
                  >
                    {isCompleted ? '✅' : step.icon}
                  </button>

                  <span
                    className={`mt-2 text-xs text-center transition-colors ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                        : isCompleted
                          ? 'text-green-600 dark:text-green-400 font-medium'
                          : canNavigate
                            ? 'text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100'
                            : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>

                  {/* Step connector line */}
                  {index < 4 && (
                    <div
                      className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 transition-colors ${
                        index < currentStepIndex ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                      style={{
                        transform: 'translateX(20px)',
                        width: 'calc(100% - 40px)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'upload' && (
          <PhotoUploadStep onPhotosUploaded={handlePhotosUploaded} product={product} />
        )}

        {currentStep === 'analysis' && (
          <AnalysisStep
            photos={product.photos}
            onAnalysisComplete={handleAnalysisComplete}
            product={product}
          />
        )}

        {currentStep === 'review' && product.analysisResult && (
          <DataReviewStep
            analysisResult={product.analysisResult}
            onReviewComplete={handleReviewComplete}
            product={product}
          />
        )}

        {currentStep === 'export' && product.reviewedData && (
          <ExportStep
            productData={product.reviewedData}
            onExportComplete={handleExportComplete}
            product={product}
          />
        )}

        {currentStep === 'table' && (
          <TableOverviewStep product={product} onBackToWorkflow={() => setCurrentStep('upload')} />
        )}
      </div>
    </div>
  );
}
