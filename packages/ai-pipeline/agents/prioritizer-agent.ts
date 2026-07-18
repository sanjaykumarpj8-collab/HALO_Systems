/**
 * Agent B — Prioritizer
 * Scores incident severity, detects duplicates, determines required worker type.
 */

import type { PrioritizedIncident, Incident, IncidentSeverity, WorkerType } from '@halo/shared';
import { GoogleGenAI, Type } from '@google/genai';

const PRIORITIZER_PROMPT = `You are Agent B — the Prioritizer.
Assign severity (1=critical to 5=trivial), detect duplicates, determine worker type needed.
Severity: 1=life-threatening, 2=safety risk, 3=operational, 4=minor, 5=info.
Worker mapping: spill→janitor, medical→medic, security/fire/structural→security.
Escalate if: 3+ incidents same section in 10min, severity 1, or panic.
Duplicate if: same type + same section within 10min.`;

let aiInstance: GoogleGenAI | null = null;

export async function runPrioritizerAgent(
  incident: {
    incident_id: string;
    incident_type: string;
    english_translation: string;
    location: string;
    section_id: number | null;
    urgency_hint: string;
  },
  recentIncidents: Incident[],
  geminiApiKey: string
): Promise<PrioritizedIncident> {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: geminiApiKey });
  }

  // Pre-filter recent incidents to same section and within 30 minutes to save tokens
  const now = Date.now();
  const relevantIncidents = recentIncidents.filter(i => {
    if (incident.section_id !== null && i.section_id !== incident.section_id) return false;
    const timeDiff = now - new Date(i.created_at).getTime();
    return Number.isNaN(timeDiff) || timeDiff <= 30 * 60000;
  });

  const context = {
    ...incident,
    recent_incidents: relevantIncidents.map((i) => ({
      id: i.id,
      type: i.parsed_type,
      created_at: i.created_at,
    })),
  };

  const response = await aiInstance.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${PRIORITIZER_PROMPT}\n\nIncident to prioritize:\n${JSON.stringify(context, null, 2)}`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          incident_id: { type: Type.STRING },
          severity: { type: Type.INTEGER },
          is_duplicate: { type: Type.BOOLEAN },
          duplicate_of: { type: Type.STRING, nullable: true },
          escalated: { type: Type.BOOLEAN },
          required_worker_type: { 
            type: Type.STRING,
            enum: ['janitor', 'medic', 'security']
          },
          reasoning: { type: Type.STRING }
        },
        required: ["incident_id", "severity", "is_duplicate", "escalated", "required_worker_type", "reasoning"]
      }
    },
  });

  const text = response.text ?? '';

  try {
    return JSON.parse(text) as PrioritizedIncident;
  } catch {
    // Deterministic fallback based on incident type
    const typeToSeverity: Record<string, IncidentSeverity> = {
      medical: 1,
      fire: 1,
      security: 2,
      structural: 2,
      spill: 3,
      noise: 4,
      accessibility: 3,
      other: 3,
    };
    const typeToWorker: Record<string, WorkerType> = {
      medical: 'medic',
      fire: 'security',
      security: 'security',
      structural: 'security',
      spill: 'janitor',
      noise: 'janitor',
      accessibility: 'janitor',
      other: 'security',
    };

    const workerType = typeToWorker[incident.incident_type] ?? 'security';
    const severity = typeToSeverity[incident.incident_type] ?? 3;

    return {
      incident_id: incident.incident_id,
      severity: severity,
      is_duplicate: false,
      escalated: severity === 1,
      required_worker_type: workerType,
      reasoning: 'Fallback: AI parse failed, using rule-based classification',
    };
  }
}
