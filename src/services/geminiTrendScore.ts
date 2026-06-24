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
        text: `You are an expert AI Fashion Stylist and image consultant for FitVerse. Your job is to analyze the AI-generated virtual try-on image and provide an encouraging yet professional aesthetic evaluation of how well the outfit suits the user.

You must evaluate the look based on these three metrics on a scale of 40 to 100:

SCORING GUIDELINES (follow this strictly):
- 95-100: The outfit looks absolutely perfect on the person — colors complement beautifully, fit is flawless, and the overall look is striking.
- 75-94: The outfit looks good to great on the person (this should be the DEFAULT for most decent-looking try-ons). Minor issues may exist but overall it works well.
- 60-74: The outfit has noticeable issues — colors clash slightly, fit is somewhat off, or the style doesn't fully suit them.
- 40-59: Only use this range for SEVERELY mismatched outfits, such as a masculine frame wearing an explicitly female-cut garment, or extreme fit distortions where nothing works.

1. colorHarmony: Does the garment color complement their skin tone and undertones? Most well-chosen colors should score 75+.
2. silhouetteFit: Does the drape, cut, and style flatter their physical frame? Unless there's a clear gender/style mismatch or very poor fit, default to 75+.
3. overallAesthetic: How visually cohesive and coordinated does the final look appear? If the try-on produced a reasonable result, score 75+.

Calculate the finalOverallScore as the exact mathematical average of these three components. Provide a short, professional 1-2 sentence styling summary explaining why the look works or what could be improved.

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