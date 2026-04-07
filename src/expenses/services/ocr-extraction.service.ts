import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractedReceipt {
  merchantName: string | null;
  date: string | null; // ISO date string
  totalAmount: number | null;
  currency: string | null; // e.g. "HKD", "USD"
  taxAmount: number | null;
  subtotal: number | null;
  paymentMethod: string | null;
  lineItems: Array<{
    name: string;
    quantity: number | null;
    unitPrice: number | null;
    totalPrice: number | null;
  }>;
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
}

@Injectable()
export class OcrExtractionService {
  private readonly logger = new Logger(OcrExtractionService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractFromImage(
    imageBuffer: Buffer,
    mimeType = 'image/jpeg',
  ): Promise<ExtractedReceipt> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const base64Image = imageBuffer.toString('base64');

    const prompt = `
      You are a receipt data extraction assistant.
      Extract the following fields from this receipt image and return ONLY valid JSON.
      Use null for any field you cannot find or are not confident about.
      Do NOT guess or hallucinate values.

      Return this exact JSON structure:
      {
        "merchantName": string | null,
        "date": "YYYY-MM-DD" | null,
        "totalAmount": number | null,
        "currency": "HKD" | "USD" | "EUR" | "GBP" | "JPY" | "CNY" | null,
        "taxAmount": number | null,
        "subtotal": number | null,
        "paymentMethod": "cash" | "credit_card" | "debit_card" | "contactless" | null,
        "lineItems": [
          { "name": string, "quantity": number | null, "unitPrice": number | null, "totalPrice": number | null }
        ],
        "confidence": "high" | "medium" | "low",
        "rawText": string
      }

      Confidence rules:
      - "high": merchantName + date + totalAmount all found
      - "medium": at least 2 of the above found
      - "low": only 1 or 0 found
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } },
    ]);

    const text = result.response.text().trim();
    // Strip markdown code fences if present
    const json = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(json) as ExtractedReceipt;
  }
}
