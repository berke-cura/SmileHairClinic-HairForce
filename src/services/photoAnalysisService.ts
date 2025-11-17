import Constants from 'expo-constants';
import { Pose } from '../types/pose';
import { POSE_PROMPTS } from '../constants/posePrompts';

// Get API key from environment variables
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Validate API key is present
if (!OPENAI_API_KEY) {
  console.warn('⚠️ OpenAI API key is not set. Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file.');
}

interface AnalysisResult {
  confirmed: boolean;
  feedback?: string;
}

export const analyzePhoto = async (
  photoBase64: string,
  pose: Pose
): Promise<AnalysisResult> => {
  try {
    // Base64 string'i temizle (data:image/jpeg;base64, prefix'i varsa kaldır)
    const base64 = photoBase64.includes(',') 
      ? photoBase64.split(',')[1] 
      : photoBase64;

    const prompt = `${POSE_PROMPTS[pose]}

Evaluate this photo according to the above criteria. 

IMPORTANT: Unless the photo quality is very low (very blurry, completely dark, face not visible, etc.) or the angle is completely wrong (e.g., back photo for front pose), accept the photo as VALID.

Only mark as INVALID in these cases:
- Photo is very blurry or out of focus (face/hair not visible at all)
- Photo is very dark (nothing visible)
- Completely wrong angle (e.g., back photo for front pose)
- Face or hair is not visible at all

Accept as VALID for minor issues (slight shadow, slightly blurry, angle slightly off, etc.).

If invalid, give the user a very brief (maximum 15 words) and clear feedback.`;

    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Düşük maliyetli model
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: 'low', // Düşük kalite, düşük maliyet
                },
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'photo_analysis',
            schema: {
              type: 'object',
              properties: {
                confirmed: {
                  type: 'boolean',
                  description: 'Is the photo suitable for analysis?',
                },
                feedback: {
                  type: 'string',
                  description: 'If confirmed is false, give the user very brief and clear feedback (maximum 15 words). Only return false for critical issues.',
                },
              },
              required: ['confirmed'],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.2, // Low temperature for more consistent results
        max_tokens: 100, // Shorter responses
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text();
      console.error('OpenAI API error:', error);
      return {
        confirmed: false,
        feedback: 'An error occurred during analysis. Please try again.',
      };
    }

    const data = await openAIResponse.json();
    const content = data.choices[0].message.content;
    
    // JSON response'u parse et
    let result;
    try {
      result = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        confirmed: false,
        feedback: 'Analysis result could not be processed.',
      };
    }

    return {
      confirmed: result.confirmed === true,
      feedback: result.feedback || undefined,
    };
  } catch (error) {
    console.error('Photo analysis error:', error);
    return {
      confirmed: false,
      feedback: 'Photo could not be analyzed. Please try again.',
    };
  }
};

