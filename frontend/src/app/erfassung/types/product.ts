// Erfassung Product Types
// Core types for the AI-powered product cataloging system

export interface Product {
  id: string;

  // Basic Information (Kivitendo compatible)
  articleNumber?: string; // Artikelnummer
  title: string; // Product title
  shortDescription?: string; // Kurzbeschreibung
  longDescription?: string; // Langtext
  manufacturer?: string; // Hersteller

  // Physical Dimensions (in mm and kg)
  length?: number; // Länge in mm
  width?: number; // Breite in mm
  height?: number; // Höhe in mm
  weight?: number; // Gewicht in kg

  // Categories (Kivitendo compatible)
  mainCategoryA?: string; // Hauptkategorie A
  mainCategoryB?: string; // Hauptkategorie B
  subCategoryA?: string; // Unterkategorie A
  subCategoryB?: string; // Unterkategorie B

  // Sales Data
  stockQuantity?: number; // Lagerbestand
  price?: number; // Preis
  articleType?: string; // Artikeltyp
  unit?: string; // Einheit

  // Status and Processing
  status: ProductStatus;
  confidenceScore?: number; // AI confidence (0-1)

  // Metadata
  userId: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  photos: ProductPhoto[];
  analyses: ProductAnalysis[];
  exports: ProductExport[];
  storePublications: StorePublication[];
}

export interface ProductPhoto {
  id: string;
  productId: string;

  // File Information
  filename: string; // Original filename
  storagePath: string; // Cloud storage path/URL
  mimeType: string; // image/jpeg, image/png, etc.
  fileSize: number; // File size in bytes

  // Image Metadata
  width?: number; // Image width in pixels
  height?: number; // Image height in pixels
  photoType: PhotoType;

  // Processing
  uploadedAt: Date;
  processedAt?: Date; // When AI analysis completed
  ocrText?: string; // Extracted text from OCR
  ocrConfidence?: number; // OCR confidence score
}

export interface ProductAnalysis {
  id: string;
  productId: string;

  // Analysis Details
  analysisType: ProductAnalysisType;
  model: string; // AI model used (gpt-4-vision, claude-3, etc.)
  prompt: string; // Analysis prompt used
  result: Record<string, any>; // Structured analysis results
  confidence?: number; // Overall confidence score
  processingTime?: number; // Processing time in milliseconds

  // Status and Error Handling
  status: AnalysisStatus;
  error?: string; // Error message if failed

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductExport {
  id: string;

  // Export Configuration
  name: string; // Export name/description
  format: ExportFormat; // CSV, XLSX, JSON, XML, TSV
  template?: string; // Export template used
  productIds: string[]; // Array of product IDs included
  customMapping?: Record<string, any>; // Custom field mapping configuration

  // Export Data
  filePath?: string; // Generated file path
  fileSize?: number; // File size in bytes
  recordCount: number; // Number of products exported
  downloadUrl?: string; // Secure download URL
  expiresAt?: Date; // Download link expiration

  // E-commerce Integration
  targetPlatform?: string; // medusa-js, shopware, generic
  syncStatus?: SyncStatus; // Integration sync status
  platformData?: Record<string, any>; // Platform-specific data

  // Metadata
  userId: string;
  organizationId?: string;
  status: ExportStatus;
  createdAt: Date;
  completedAt?: Date;
}

export interface StorePublication {
  id: string;
  productId: string;

  // Store Information
  storeName: string; // Store/platform name (medusa-js, shopware, etc.)
  storeProductId?: string; // ID in the target store
  publicationUrl?: string; // URL to published product
  storeApiUrl?: string; // API endpoint used for integration

  // Publication Status
  status: PublicationStatus;
  publishedAt?: Date;
  lastSyncAt?: Date;

  // Sync Data
  syncData: Record<string, any>;
  integrationData?: Record<string, any>; // Platform-specific integration data
  workflowId?: string; // Medusa JS workflow ID
  catalogId?: string; // Shopware catalog ID
  error?: string;

  // Automation Settings
  autoSync: boolean;
  syncFrequency?: string; // daily, weekly, on-change

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Enums

export enum ProductStatus {
  DRAFT = 'DRAFT', // Initial state, photos uploaded
  ANALYZING = 'ANALYZING', // AI analysis in progress
  ANALYZED = 'ANALYZED', // Analysis completed, ready for review
  REVIEWED = 'REVIEWED', // User has reviewed and approved
  EXPORTED = 'EXPORTED', // Exported to external system
  PUBLISHED = 'PUBLISHED', // Published to store/catalog
  ARCHIVED = 'ARCHIVED', // Archived/inactive
}

export enum PhotoType {
  GENERAL = 'GENERAL', // General product photo
  LABEL = 'LABEL', // Product label/Typenschild
  DIMENSIONS = 'DIMENSIONS', // Photo showing measurements
  WEIGHT = 'WEIGHT', // Photo showing weight on scale
  PACKAGING = 'PACKAGING', // Packaging/box photos
  DETAIL = 'DETAIL', // Detail/close-up photos
}

export enum ProductAnalysisType {
  OCR = 'OCR', // Text extraction from labels
  CLASSIFICATION = 'CLASSIFICATION', // Product category classification
  DIMENSION = 'DIMENSION', // Size/dimension detection
  WEIGHT = 'WEIGHT', // Weight detection
  DESCRIPTION = 'DESCRIPTION', // Description generation
  FULL_ANALYSIS = 'FULL_ANALYSIS', // Complete product analysis
}

export enum ExportFormat {
  CSV_KIVITENDO = 'CSV_KIVITENDO', // Kivitendo-compatible CSV
  CSV_GENERIC = 'CSV_GENERIC', // Generic CSV format
  XLSX = 'XLSX', // Excel format (.xlsx)
  JSON = 'JSON', // JSON format
  XML = 'XML', // XML format
  TSV = 'TSV', // Tab-separated values
  MEDUSA_JSON = 'MEDUSA_JSON', // Medusa JS workflow format
  SHOPWARE_CSV = 'SHOPWARE_CSV', // Shopware catalog import format
}

export enum SyncStatus {
  IDLE = 'IDLE', // No sync in progress
  SYNCING = 'SYNCING', // Sync in progress
  COMPLETED = 'COMPLETED', // Last sync completed successfully
  FAILED = 'FAILED', // Last sync failed
  CANCELLED = 'CANCELLED', // Sync was cancelled
}

export enum ExportStatus {
  PENDING = 'PENDING', // Export queued
  PROCESSING = 'PROCESSING', // Export in progress
  COMPLETED = 'COMPLETED', // Export completed successfully
  FAILED = 'FAILED', // Export failed
  CANCELLED = 'CANCELLED', // Export cancelled by user
}

export enum AnalysisStatus {
  PENDING = 'PENDING', // Analysis queued
  PROCESSING = 'PROCESSING', // Analysis in progress
  COMPLETED = 'COMPLETED', // Analysis completed successfully
  FAILED = 'FAILED', // Analysis failed
  CANCELLED = 'CANCELLED', // Analysis cancelled by user
}

export enum PublicationStatus {
  PENDING = 'PENDING', // Queued for publication
  PUBLISHING = 'PUBLISHING', // Publication in progress
  PUBLISHED = 'PUBLISHED', // Successfully published
  FAILED = 'FAILED', // Publication failed
  UNPUBLISHED = 'UNPUBLISHED', // Unpublished/removed
}

// Form-related types for table data management

export interface ProductTableRow {
  id: string;

  // Kivitendo-compatible fields (21 standardized fields)
  title: string;
  manufacturer: string;
  articleNumber: string;
  shortDescription: string;
  longDescription: string;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  mainCategoryA: string;
  mainCategoryB: string;
  subCategoryA: string;
  subCategoryB: string;
  stockQuantity?: number;
  price?: number;
  articleType: string;
  unit: string;

  // Additional fields for table management
  status: ProductStatus;
  confidence: ConfidenceScores;
  photos: ProductPhoto[];
  lastModified: Date;
  syncStatus: Record<EcommercePlatform, SyncStatus>;
}

export interface ConfidenceScores {
  [fieldId: string]: number; // Field ID -> confidence score (0-1)
}

export type EcommercePlatform = 'medusa-js' | 'shopware' | 'woocommerce' | 'shopify' | 'generic';

export interface AnalysisResult {
  // Extracted product data
  title?: string;
  manufacturer?: string;
  articleNumber?: string;
  shortDescription?: string;
  longDescription?: string;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  mainCategoryA?: string;
  mainCategoryB?: string;
  subCategoryA?: string;
  subCategoryB?: string;
  price?: number;

  // Analysis metadata
  confidence: ConfidenceScores;
  photos: ProductPhoto[];
  processingTime: number;
  model: string;
  analysisId: string;
}

export type IntegrationSettings = {
  [K in EcommercePlatform]?: {
    enabled: boolean;
    apiUrl?: string;
    apiKey?: string;
    storeId?: string;
    catalogId?: string;
    workflowId?: string;
    autoSync: boolean;
    syncFrequency: 'manual' | 'daily' | 'weekly' | 'on-change';
  };
};
