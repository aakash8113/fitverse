import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface TrendScoreResult {
  colorHarmony: number;
  silhouetteFit: number;
  overallAesthetic: number;
  trendScore: number;
  summary: string;
}

export async function getTrendScore(imageBlob: Blob): Promise<TrendScoreResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment.');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Convert blob to base64
  const base64Image = await blobToBase64(imageBlob);

  const config = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MINIMAL,
    },
    systemInstruction: [
      {
        text: `You are an expert AI Fashion Stylist and image consultant for FitVerse. Your job is to provide an honest, highly accurate, and professional aesthetic evaluation of how well an outfit suits the user. Do not be overly polite; prioritize accuracy.

You must strictly evaluate the look based on these three metrics on a scale of 40 to 100:
1. colorHarmony: Does the garment color complement their skin tone and undertones?
2. silhouetteFit: Does the drape, cut, style category, and tailoring of the apparel flatter their physical frame and match their gender presentation/anatomy?
3. overallAesthetic: Is the outfit visually striking, cohesive, and culturally/stylistically appropriate for the person wearing it?

CRITICAL ANATOMY & CATEGORY CHECK:
If the garment style profile fundamentally mismatches the person's physical gender appearance (for example: a masculine frame wearing an explicitly female-cut kurti, or severe tailoring distortions where the shoulders/chest do not fit), you must penalize the score accordingly. For such severe mismatches, assign the absolute minimum floor score of 50 to silhouetteFit and overallAesthetic, regardless of how good the color harmony is.

Calculate the finalOverallScore as the exact mathematical average of these three components. Provide a direct, professional 1-2 sentence styling summary explaining why the fit succeeded or failed.

You MUST respond with valid JSON only, in the following format (no markdown, no code blocks, just raw JSON):
{
  "colorHarmony": number,
  "silhouetteFit": number,
  "overallAesthetic": number,
  "trendScore": number,
  "summary": "string"
}`,
      },
    ],
  };

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: 'Analyze this virtual try-on image and provide a trend score evaluation in JSON format.',
        },
        {
          inlineData: {
            mimeType: imageBlob.type || 'image/jpeg',
            data: base64Image,
          },
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    config,
    contents,
  });

  const text = response.text || '';

  // Parse the JSON response
  try {
    // Try to parse the entire response as JSON
    const parsed = JSON.parse(text.trim());
    return validateAndNormalizeScore(parsed);
  } catch {
    // If direct parse fails, try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return validateAndNormalizeScore(parsed);
    }
    throw new Error('Failed to parse Gemini response as JSON');
  }
}

function validateAndNormalizeScore(data: any): TrendScoreResult {
  const colorHarmony = clampScore(Number(data.colorHarmony) || 75);
  const silhouetteFit = clampScore(Number(data.silhouetteFit) || 75);
  const overallAesthetic = clampScore(Number(data.overallAesthetic) || 75);
  const trendScore = Math.round((colorHarmony + silhouetteFit + overallAesthetic) / 3);

  return {
    colorHarmony,
    silhouetteFit,
    overallAesthetic,
    trendScore,
    summary: data.summary || 'Stylish and well-coordinated look.',
  };
}

function clampScore(value: number): number {
  return Math.max(40, Math.min(100, Math.round(value)));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix to get raw base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}