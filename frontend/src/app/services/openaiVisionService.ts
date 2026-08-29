import { FieldConfig } from '../types/form';
import { VisionAnalysisResult, VisionAnalysisProgress } from './visionService';

// Cost tracking interface
interface UsageStats {
  today: {
    requests: number;
    estimatedCost: number;
    date: string;
  };
  monthly: {
    requests: number;
    estimatedCost: number;
    month: string;
  };
}

class OpenAIVisionService {
  private isEnabled: boolean = false;
  private maxMonthlyCost: number = 5.0;
  private dailyRequestLimit: number = 20;

  constructor() {
    // Enablement is controlled via public env flag; the actual key stays server-side
    this.isEnabled = process.env.NEXT_PUBLIC_ENABLE_VISION_API === 'true';
    this.maxMonthlyCost = parseFloat(process.env.NEXT_PUBLIC_MAX_MONTHLY_COST || '5.00');
    this.dailyRequestLimit = parseInt(process.env.NEXT_PUBLIC_DAILY_REQUEST_LIMIT || '20');
  }

  private getUsageStats(): UsageStats {
    const today = new Date().toISOString().split('T')[0];
    const month = new Date().toISOString().substring(0, 7);

    const stored = localStorage.getItem('openai_usage_stats');
    const defaultStats: UsageStats = {
      today: { requests: 0, estimatedCost: 0, date: today },
      monthly: { requests: 0, estimatedCost: 0, month: month },
    };

    if (!stored) return defaultStats;

    try {
      const stats = JSON.parse(stored);

      // Reset daily stats if it's a new day
      if (stats.today.date !== today) {
        stats.today = { requests: 0, estimatedCost: 0, date: today };
      }

      // Reset monthly stats if it's a new month
      if (stats.monthly.month !== month) {
        stats.monthly = { requests: 0, estimatedCost: 0, month: month };
      }

      return stats;
    } catch {
      return defaultStats;
    }
  }

  private saveUsageStats(stats: UsageStats): void {
    localStorage.setItem('openai_usage_stats', JSON.stringify(stats));
  }

  private canMakeRequest(): { allowed: boolean; reason?: string } {
    const stats = this.getUsageStats();

    // Check daily limit
    if (stats.today.requests >= this.dailyRequestLimit) {
      return {
        allowed: false,
        reason: `Daily limit reached (${this.dailyRequestLimit} requests). Try again tomorrow.`,
      };
    }

    // Check monthly cost limit
    if (stats.monthly.estimatedCost >= this.maxMonthlyCost) {
      return {
        allowed: false,
        reason: `Monthly cost limit reached ($${this.maxMonthlyCost}). Wait for next month or increase limit.`,
      };
    }

    return { allowed: true };
  }

  private trackUsage(estimatedCost: number): void {
    const stats = this.getUsageStats();

    stats.today.requests += 1;
    stats.today.estimatedCost += estimatedCost;
    stats.monthly.requests += 1;
    stats.monthly.estimatedCost += estimatedCost;

    this.saveUsageStats(stats);
  }

  private estimateImageCost(file: File): number {
    // GPT-4o Mini Vision pricing: ~$0.003 per image analysis
    // We use a conservative estimate based on file size and type
    const baseCost = 0.003; // $0.003 for GPT-4o mini

    // PDF files might need more processing
    if (file.type === 'application/pdf') {
      return baseCost * 1.5; // ~$0.0045 for PDFs
    }

    // Large images might cost more
    const sizeMultiplier = file.size > 1024 * 1024 ? 1.2 : 1.0; // 20% more for files > 1MB

    return baseCost * sizeMultiplier;
  }

  async analyzeImage(
    file: File,
    onProgress?: (progress: VisionAnalysisProgress) => void,
  ): Promise<VisionAnalysisResult> {
    return this.analyzeFile(file, onProgress, false);
  }

  async analyzePDF(
    file: File,
    onProgress?: (progress: VisionAnalysisProgress) => void,
  ): Promise<VisionAnalysisResult> {
    return this.analyzeFile(file, onProgress, true);
  }

  private async analyzeFile(
    file: File,
    onProgress?: (progress: VisionAnalysisProgress) => void,
    isPDF: boolean = false,
  ): Promise<VisionAnalysisResult> {
    try {
      // Check if Vision API feature is enabled
      if (!this.isEnabled) {
        throw new Error(
          'OpenAI Vision API ist nicht aktiviert. Bitte NEXT_PUBLIC_ENABLE_VISION_API=true setzen.',
        );
      }

      // Check usage limits
      const canUse = this.canMakeRequest();
      if (!canUse.allowed) {
        throw new Error(canUse.reason);
      }

      const estimatedCost = this.estimateImageCost(file);

      // Progress stages
      onProgress?.({
        stage: 'uploading',
        progress: 10,
        message: isPDF ? 'PDF wird hochgeladen...' : 'Bild wird hochgeladen...',
      });

      // Convert file to base64
      const base64 = await this.fileToBase64(file);

      onProgress?.({
        stage: 'processing',
        progress: 30,
        message: 'Datei wird für KI-Analyse vorbereitet...',
      });

      // Prepare the prompt
      const prompt = this.createAnalysisPrompt(isPDF);

      onProgress?.({
        stage: 'analyzing',
        progress: 60,
        message: 'OpenAI analysiert die Formularstruktur...',
      });

      // Call server-side API to keep credentials safe
      const response = await fetch('/api/v1/vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: { mimeType: file.type, base64 },
          prompt,
          isPDF,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Vision API request failed');
      }

      const data = await response.json();

      onProgress?.({
        stage: 'generating',
        progress: 85,
        message: 'Formularfelder werden generiert...',
      });

      // Parse the response
      const fields = this.parseOpenAIResponse(data.content || '');

      // Track usage
      this.trackUsage(estimatedCost);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Analyse erfolgreich abgeschlossen!',
      });

      return {
        success: true,
        fields,
        confidence: 0.85, // High confidence for real AI
        processingTime: Date.now(),
        originalImageUrl: isPDF ? undefined : URL.createObjectURL(file),
      };
    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      });

      return {
        success: false,
        fields: [],
        confidence: 0,
        processingTime: Date.now(),
        error: error instanceof Error ? error.message : 'Analyse fehlgeschlagen',
      };
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private createAnalysisPrompt(isPDF: boolean): string {
    return `Analysiere dieses ${isPDF ? 'PDF-Dokument' : 'Bild'} eines Formulars und extrahiere die Formularfelder. 

Erstelle eine JSON-Antwort mit folgender Struktur:
{
  "fields": [
    {
      "type": "text|email|tel|date|select|textarea|checkbox",
      "label": "Feldname",
      "name": "fieldName",
      "required": true/false,
      "placeholder": "Optional: Platzhaltertext",
      "options": ["Option 1", "Option 2"] // Nur für select-Felder
    }
  ]
}

Unterstützte Feldtypen:
- "text": Einfache Textfelder
- "email": E-Mail-Adressen
- "tel": Telefonnummern  
- "date": Datumseingaben
- "select": Dropdown-Menüs
- "textarea": Mehrzeilige Textbereiche
- "checkbox": Checkboxen

Regeln:
1. Verwende deutsche Labels
2. Erstelle sinnvolle field names (camelCase, englisch)
3. Erkenne Pflichtfelder (required: true)
4. Bei Auswahllisten: liste die Optionen auf
5. Ignoriere Buttons und Navigation
6. Nur echte Eingabefelder extrahieren

Antworte NUR mit dem JSON-Format, keine zusätzlichen Erklärungen.`;
  }

  private parseOpenAIResponse(content: string): Omit<FieldConfig, 'id' | 'stepId'>[] {
    try {
      // Extract JSON from response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Keine gültige JSON-Antwort gefunden');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.fields || [];
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      // Return fallback fields
      return [
        {
          type: 'text',
          label: 'Erkanntes Textfeld',
          name: 'detectedField',
          required: false,
        },
      ];
    }
  }

  // Get current usage stats for display
  getUsageInfo(): { daily: number; monthly: number; monthlyBudget: number; dailyLimit: number } {
    const stats = this.getUsageStats();
    return {
      daily: stats.today.requests,
      monthly: Math.round(stats.monthly.estimatedCost * 100) / 100,
      monthlyBudget: this.maxMonthlyCost,
      dailyLimit: this.dailyRequestLimit,
    };
  }

  // Check if service is available
  isAvailable(): boolean {
    return this.isEnabled;
  }
}

// Singleton instance
export const openaiVisionService = new OpenAIVisionService();
