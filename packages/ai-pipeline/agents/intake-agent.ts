/**
 * Agent A — Intake Parser
 * Parses chaotic, multilingual fan reports into structured incident data.
 * Uses Gemini Flash for fast inference on classification + translation.
 */

import type { IntakeResult } from '@halo/shared';
import { GoogleGenAI, Type } from '@google/genai';

const INTAKE_PROMPT = `You are Agent A — the Intake Parser for the HALO Stadium Operations system.

Your job is to parse chaotic, multilingual incident reports from stadium fans and extract structured information.

Classification: medical/hurt/injured→medical, fight/violence/weapon/stuck→security, spill/wet/dirty→spill, fire/smoke→fire, blocked/broken→structural, loud/overwhelming→noise, wheelchair/ramp→accessibility.
Urgency: life-threatening→critical, safety risk→high, operational→medium, comfort→low.`;

let aiInstance: GoogleGenAI | null = null;

export async function runIntakeAgent(
  rawText: string,
  geminiApiKey: string
): Promise<IntakeResult> {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: geminiApiKey });
  }

  const response = await aiInstance.models.generateContent({
    model: 'gemini-2.5-flash',
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
