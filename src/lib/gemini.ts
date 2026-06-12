import { GoogleGenerativeAI } from '@google/generative-ai';

let _client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!_client) {
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return _client;
}

// Primary model is gemini-2.5-flash (working and fast).
// Fallback order: gemini-2.5-flash -> gemini-3.5-flash -> gemini-1.5-flash
export const MODEL = 'gemini-2.5-flash';

export interface GenerateOptions {
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

export async function generateContentSafe(
  prompt: string | any[],
  options: GenerateOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('your_gemini_api_key')) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local. Please configure a valid API key.');
  }

  const ai = getGeminiClient();
  const timeout = options.timeoutMs ?? 30000; // 30s default timeout
  
  // Try models in order of reliability
  const modelsToTry = [MODEL, 'gemini-3.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  
  const errors: string[] = [];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Attempting content generation with model: ${modelName}`);
      const model = ai.getGenerativeModel({
        model: modelName,
        systemInstruction: options.systemInstruction,
        generationConfig: {
          responseMimeType: options.responseMimeType as any,
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
        }
      });
      
      const contents = typeof prompt === 'string' 
        ? [{ role: 'user', parts: [{ text: prompt }] }]
        : prompt;

      const result = await model.generateContent(
        { contents },
        { timeout }
      );
      
      const text = result.response.text();
      if (text) {
        console.log(`[Gemini] Generation successful with model: ${modelName}`);
        return text;
      }
    } catch (err: any) {
      const errMsg = err.message || String(err);
      console.warn(`[Gemini] Model ${modelName} failed: ${errMsg}`);
      errors.push(`${modelName}: ${errMsg}`);
    }
  }
  
  throw new Error(`All Gemini models failed:\n- ${errors.join('\n- ')}`);
}
