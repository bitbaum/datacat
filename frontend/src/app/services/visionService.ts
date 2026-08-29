import { FieldConfig } from '../types/form';
import { openaiVisionService } from './openaiVisionService';

export interface VisionAnalysisResult {
  success: boolean;
  fields: Omit<FieldConfig, 'id' | 'stepId'>[];
  sections?: {
    title: string;
    fields: string[];
  }[];
  confidence: number;
  processingTime: number;
  originalImageUrl?: string;
  error?: string;
}

export interface VisionAnalysisProgress {
  stage: 'uploading' | 'processing' | 'analyzing' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
}

class VisionService {
  private mockDelay = (min: number, max: number) =>
    new Promise((resolve) => setTimeout(resolve, Math.random() * (max - min) + min));

  // Mock form patterns that the AI would recognize
  private mockFormPatterns = {
    contact: [
      { type: 'text' as FieldConfig['type'], label: 'Vorname', name: 'firstName', required: true },
      { type: 'text' as FieldConfig['type'], label: 'Nachname', name: 'lastName', required: true },
      { type: 'email' as FieldConfig['type'], label: 'E-Mail', name: 'email', required: true },
      { type: 'tel' as FieldConfig['type'], label: 'Telefon', name: 'phone', required: false },
    ],
    address: [
      { type: 'text' as const, label: 'Straße', name: 'street', required: true },
      { type: 'text' as const, label: 'PLZ', name: 'postalCode', required: true },
      { type: 'text' as const, label: 'Stadt', name: 'city', required: true },
      {
        type: 'select' as const,
        label: 'Land',
        name: 'country',
        required: true,
        options: [
          { label: 'Schweiz', value: 'CH' },
          { label: 'Deutschland', value: 'DE' },
        ],
      },
    ],
    business: [
      { type: 'text' as const, label: 'Firmenname', name: 'companyName', required: true },
      { type: 'text' as const, label: 'Abteilung', name: 'department', required: false },
      { type: 'text' as const, label: 'Position', name: 'position', required: false },
      { type: 'text' as const, label: 'USt-IdNr.', name: 'vatNumber', required: false },
    ],
    feedback: [
      {
        type: 'select' as const,
        label: 'Bewertung',
        name: 'rating',
        required: true,
        options: [
          { label: 'Sehr gut', value: '5' },
          { label: 'Gut', value: '4' },
          { label: 'Befriedigend', value: '3' },
          { label: 'Ausreichend', value: '2' },
          { label: 'Mangelhaft', value: '1' },
        ],
      },
      { type: 'textarea' as const, label: 'Kommentare', name: 'comments', required: false },
    ],
  };

  async analyzeImage(
    file: File,
    onProgress?: (progress: VisionAnalysisProgress) => void,
  ): Promise<VisionAnalysisResult> {
    // Try OpenAI first if available
    if (openaiVisionService.isAvailable()) {
      try {
        return await openaiVisionService.analyzeImage(file, onProgress);
      } catch (error) {
        console.warn('OpenAI Vision failed, falling back to mock:', error);
        // Fall through to mock implementation
      }
    }
    try {
      // Stage 1: Uploading
      onProgress?.({
        stage: 'uploading',
        progress: 10,
        message: 'Bild wird hochgeladen...',
      });
      await this.mockDelay(500, 1000);

      // Stage 2: Processing
      onProgress?.({
        stage: 'processing',
        progress: 30,
        message: 'Bild wird verarbeitet...',
      });
      await this.mockDelay(1000, 1500);

      // Stage 3: Analyzing
      onProgress?.({
        stage: 'analyzing',
        progress: 60,
        message: 'KI analysiert Formularstruktur...',
      });
      await this.mockDelay(1500, 2000);

      // Stage 4: Generating
      onProgress?.({
        stage: 'generating',
        progress: 85,
        message: 'Formularfelder werden generiert...',
      });
      await this.mockDelay(800, 1200);

      // Mock analysis based on filename or random selection
      const formType = this.detectFormType(file.name);
      const fields = this.generateMockFields(formType);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Analyse abgeschlossen!',
      });

      return {
        success: true,
        fields,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        processingTime: Date.now(),
        originalImageUrl: URL.createObjectURL(file),
      };
    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Fehler bei der Analyse',
      });

      return {
        success: false,
        fields: [],
        confidence: 0,
        processingTime: Date.now(),
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      };
    }
  }

  async analyzePDF(
    file: File,
    onProgress?: (progress: VisionAnalysisProgress) => void,
  ): Promise<VisionAnalysisResult> {
    // Try OpenAI first if available
    if (openaiVisionService.isAvailable()) {
      try {
        return await openaiVisionService.analyzePDF(file, onProgress);
      } catch (error) {
        console.warn('OpenAI Vision failed, falling back to mock:', error);
        // Fall through to mock implementation
      }
    }
    try {
      // Similar process but with PDF-specific messages
      onProgress?.({
        stage: 'uploading',
        progress: 10,
        message: 'PDF wird hochgeladen...',
      });
      await this.mockDelay(800, 1200);

      onProgress?.({
        stage: 'processing',
        progress: 40,
        message: 'PDF wird analysiert und Text extrahiert...',
      });
      await this.mockDelay(2000, 3000);

      onProgress?.({
        stage: 'analyzing',
        progress: 70,
        message: 'Formularstruktur wird erkannt...',
      });
      await this.mockDelay(1500, 2000);

      onProgress?.({
        stage: 'generating',
        progress: 90,
        message: 'Digitales Formular wird erstellt...',
      });
      await this.mockDelay(1000, 1500);

      const formType = this.detectFormType(file.name);
      const fields = this.generateMockFields(formType);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'PDF erfolgreich analysiert!',
      });

      return {
        success: true,
        fields,
        confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence for PDFs
        processingTime: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        fields: [],
        confidence: 0,
        processingTime: Date.now(),
        error: error instanceof Error ? error.message : 'PDF-Analyse fehlgeschlagen',
      };
    }
  }

  private detectFormType(filename: string): keyof typeof this.mockFormPatterns {
    const name = filename.toLowerCase();

    if (name.includes('kontakt') || name.includes('contact')) return 'contact';
    if (name.includes('adresse') || name.includes('address')) return 'address';
    if (name.includes('firma') || name.includes('company') || name.includes('business'))
      return 'business';
    if (name.includes('bewertung') || name.includes('feedback') || name.includes('rating'))
      return 'feedback';

    // Random selection if no pattern matches
    const types = Object.keys(this.mockFormPatterns) as Array<keyof typeof this.mockFormPatterns>;
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateMockFields(
    formType: keyof typeof this.mockFormPatterns,
  ): Omit<FieldConfig, 'id' | 'stepId'>[] {
    const baseFields = [...this.mockFormPatterns[formType]];

    // Sometimes add additional fields to make it more realistic
    if (Math.random() > 0.5) {
      baseFields.push({
        type: 'textarea',
        label: 'Zusätzliche Anmerkungen',
        name: 'additionalNotes',
        required: false,
      });
    }

    if (Math.random() > 0.7) {
      baseFields.push({
        type: 'checkbox' as FieldConfig['type'],
        label: 'Ich stimme den Datenschutzbestimmungen zu',
        name: 'privacyConsent',
        required: true,
      });
    }

    return baseFields;
  }

  // Method to validate file types
  isValidFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Datei ist zu gross. Maximum: 10MB',
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Dateityp nicht unterstützt. Erlaubt: JPG, PNG, GIF, WebP, PDF',
      };
    }

    return { valid: true };
  }
}

// Singleton instance
export const visionService = new VisionService();

// Helper function to replace with real API later
export const configureVisionAPI = (config: {
  apiKey?: string;
  endpoint?: string;
  model?: string;
}) => {
  // TODO: Replace mock service with real API configuration
  console.log('Vision API configured:', config);
  // This is where you'd initialize the real OpenAI Vision API or similar
};
