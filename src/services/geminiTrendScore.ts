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
  };

  const systemInstruction = `You are an expert AI Fashion Stylist and image consultant for FitVerse. Your job is to analyze the generated virtual try-on image and provide an honest, professional, yet encouraging aesthetic evaluation of how well the outfit suits the user.

Evaluate the look by assigning an individual numerical score between 40 and 100 for each of the following three metrics (strictly avoid scores below 40 or above 100 to maintain a constructive and balanced tone):
1. colorHarmony: Assessment of how the garment color complements the user's skin tone, undertones, and hair color.
2. silhouetteFit: Assessment of how the drape, cut, and fit of the apparel flatter their physical frame.
3. overallAesthetic: Assessment of how visually striking, coordinated, and cohesive the final look appears.

Calculate the final TrendScore as the exact mathematical average of these three components. Provide a high-level, 1-2 sentence concise styling summary explaining your professional feedback.

You MUST respond with valid JSON only, in the following format (no markdown, no code blocks, just raw JSON):
{
  "colorHarmony": number,
  "silhouetteFit": number,
  "overallAesthetic": number,
  "trendScore": number,
  "summary": "string"
}`;

  const contents = [
    {
      role: 'user',
      parts: [
        { text: 'Analyze this virtual try-on image and provide a trend score evaluation in JSON format.' },
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
    config: {
      ...config,
      systemInstruction: systemInstruction,
    },
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