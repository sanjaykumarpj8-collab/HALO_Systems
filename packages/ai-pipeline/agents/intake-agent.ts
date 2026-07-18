/**
 * Agent A — Intake Parser
 * Parses chaotic, multilingual fan reports into structured incident data.
 * Uses Gemini Flash for fast inference on classification + translation.
 */

import type { IntakeResult } from '@halo/shared';
import { GoogleGenAI, Type } from '@google/genai';

const INTAKE_PROMPT = `You are Agent A — the Intake Parser.
Parse fan incident reports into structured data.
Classify: medical/hurt→medical, fight/weapon→security, spill/wet→spill, fire/smoke→fire, blocked→structural, loud→noise, wheelchair→accessibility.
Urgency: life-threatening→critical, safety risk→high, operational→medium, comfort→low.`;

let aiInstance: GoogleGenAI | null = null;
const intakeCache = new Map<string, IntakeResult>();

export async function runIntakeAgent(
  rawText: string,
  geminiApiKey: string
): Promise<IntakeResult> {
  const cacheKey = rawText.toLowerCase().trim();
  if (intakeCache.has(cacheKey)) {
    return intakeCache.get(cacheKey)!;
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: geminiApiKey });
  }

  const response = await aiInstance.models.generateContent({
    model: 'gemini-1.5-flash-8b',
    contents: [
      {
        role: 'user',
        parts: [{ text: `${INTAKE_PROMPT}\n\nFan report:\n"${rawText}"` }],
      },
    ],
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          original_text: { type: Type.STRING },
          detected_language: { type: Type.STRING, description: "ISO 639-1 code" },
          english_translation: { type: Type.STRING },
          incident_type: { 
            type: Type.STRING,
            enum: ['spill', 'medical', 'security', 'fire', 'structural', 'noise', 'accessibility', 'other']
          },
          location: { type: Type.STRING },
          section_id: { type: Type.INTEGER, nullable: true },
          urgency_hint: { 
            type: Type.STRING,
            enum: ['critical', 'high', 'medium', 'low']
          },
          confidence: { type: Type.NUMBER }
        },
        required: ["original_text", "detected_language", "english_translation", "incident_type", "location", "urgency_hint", "confidence"]
      }
    },
  });

  const text = response.text ?? '';
  try {
    const result: IntakeResult = JSON.parse(text);
    
    intakeCache.set(cacheKey, result);
    if (intakeCache.size > 100) {
      const firstKey = intakeCache.keys().next().value;
      if (firstKey) intakeCache.delete(firstKey);
    }
    
    return result;
  } catch (e) {
    // Fallback for parse failures
    return {
      original_text: rawText,
      detected_language: 'en',
      english_translation: rawText,
      incident_type: 'other',
      location: 'Unknown',
      section_id: null,
      urgency_hint: 'medium',
      confidence: 0.3,
    };
  }
}
