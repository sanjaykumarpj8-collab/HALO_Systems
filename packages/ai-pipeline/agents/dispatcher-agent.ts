/**
 * Agent C — Dispatcher
 * Finds nearest available worker, generates route, translates dispatch message.
 */

import type { DispatchResult, Worker } from '@halo/shared';
import { GoogleGenAI, Type } from '@google/genai';

const DISPATCHER_PROMPT = `You are Agent C — the Dispatcher.
Generate dispatch instructions translated to worker's language.
ETA: adjacent ~1m, diff floors ~3m, diff gates ~5m.
Format: 🚨 [EMOJI] [TYPE] — [LOCATION] [DESC] Route: [ROUTE] ETA: [X]min
Emojis: 1=🔴, 2=🟠, 3=🟡, 4=🟢, 5=⚪`;

let aiInstance: GoogleGenAI | null = null;
const dispatchCache = new Map<string, DispatchResult>();

export async function runDispatcherAgent(
  incident: {
    incident_id: string;
    incident_type: string;
    severity: number;
    location: string;
    section_id: number | null;
    english_translation: string;
  },
  worker: Worker,
  geminiApiKey: string
): Promise<DispatchResult> {
  const cacheKey = `${worker.language}-${incident.incident_type}-${incident.severity}-${worker.section}-${incident.section_id}-${incident.location}`;
  if (dispatchCache.has(cacheKey)) {
    const cached = dispatchCache.get(cacheKey)!;
    return {
      ...cached,
      incident_id: incident.incident_id,
      assigned_worker_id: worker.id,
      worker_name: worker.name
    };
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: geminiApiKey });
  }

  const context = {
    ...incident,
    worker: {
      id: worker.id,
      name: worker.name,
      type: worker.type,
      language: worker.language,
      current_section: worker.section,
    },
  };

  const response = await aiInstance.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${DISPATCHER_PROMPT}\n\nDispatch context:\n${JSON.stringify(context, null, 2)}`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          incident_id: { type: Type.STRING },
          assigned_worker_id: { type: Type.STRING },
          worker_name: { type: Type.STRING },
          worker_type: { 
            type: Type.STRING,
            enum: ['janitor', 'medic', 'security']
          },
          eta_minutes: { type: Type.INTEGER },
          route_instructions: { type: Type.STRING },
          translated_message: { type: Type.STRING },
          target_language: { type: Type.STRING }
        },
        required: ["incident_id", "assigned_worker_id", "worker_name", "worker_type", "eta_minutes", "route_instructions", "translated_message", "target_language"]
      }
    },
  });

  const text = response.text ?? '';

  try {
    const result = JSON.parse(text) as DispatchResult;
    dispatchCache.set(cacheKey, result);
    if (dispatchCache.size > 200) {
      const first = dispatchCache.keys().next().value;
      if (first) dispatchCache.delete(first);
    }
    return result;
  } catch {
    // Fallback with basic distance estimation
    const sectionDiff = Math.abs(
      (incident.section_id ?? 100) - worker.section
    );
    const etaMinutes = Math.max(2, Math.min(15, sectionDiff));

    return {
      incident_id: incident.incident_id,
      assigned_worker_id: worker.id,
      worker_name: worker.name,
      worker_type: worker.type,
      distance_meters: sectionDiff * 50,
      eta_minutes: etaMinutes,
      route_instructions: `Proceed to Section ${incident.section_id ?? 'Unknown'} from your current location at Section ${worker.section}.`,
      translated_message: `🚨 ${incident.incident_type.toUpperCase()} at ${incident.location}. Please respond immediately. ETA: ${etaMinutes} minutes.`,
      target_language: worker.language,
    };
  }
}

/**
 * Find the nearest available worker of the required type.
 * Uses simple section-distance heuristic (production would use GPS).
 */
export function findNearestWorker(
  workers: Worker[],
  requiredType: string,
  incidentSection: number | null
): Worker | null {
  const available = workers.filter(
    (w) => w.type === requiredType && w.status === 'on-duty'
  );

  if (available.length === 0) return null;
  if (incidentSection === null) return available[0];

  // Sort by distance to incident section
  available.sort((a, b) => {
    const distA = Math.abs(a.section - incidentSection);
    const distB = Math.abs(b.section - incidentSection);
    return distA - distB;
  });

  return available[0];
}
