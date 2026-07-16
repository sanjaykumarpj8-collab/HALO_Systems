/**
 * Agent B — Prioritizer
 * Scores incident severity, detects duplicates, determines required worker type.
 */

import type { PrioritizedIncident, Incident, IncidentSeverity } from '@halo/shared';

const PRIORITIZER_PROMPT = `You are Agent B — the Prioritizer for HALO Stadium Operations.
Assign severity (1=critical to 5=trivial), detect duplicates, determine worker type needed.

Return ONLY valid JSON:
{
  "incident_id": "same as input",
  "severity": 1-5,
  "is_duplicate": true/false,
  "duplicate_of": "id or null",
  "escalated": true/false,
  "required_worker_type": "janitor | medic | security",
  "reasoning": "brief explanation"
}

Severity: 1=life-threatening, 2=safety risk, 3=operational, 4=minor, 5=informational.
Worker mapping: spill→janitor, medical→medic, security/fire/structural→security.
Escalate if: 3+ incidents same section in 10min, any severity 1, or crowd panic.
Duplicate if: same type + same section within 10min.`;

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
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const context = {
    ...incident,
    recent_incidents: recentIncidents.map((i) => ({
      id: i.id,
      type: i.parsed_type,
      section_id: i.section_id,
      status: i.status,
      created_at: i.created_at,
    })),
  };

  const response = await ai.models.generateContent({
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
    },
  });

  const text = response.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned) as PrioritizedIncident;
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
    const typeToWorker: Record<string, string> = {
      medical: 'medic',
      fire: 'security',
      security: 'security',
      structural: 'security',
      spill: 'janitor',
      noise: 'janitor',
      accessibility: 'janitor',
      other: 'security',
    };

    return {
      incident_id: incident.incident_id,
      severity: typeToSeverity[incident.incident_type] ?? 3,
      is_duplicate: false,
      escalated: (typeToSeverity[incident.incident_type] ?? 3) === 1,
      required_worker_type: (typeToWorker[incident.incident_type] ?? 'security') as any,
      reasoning: 'Fallback: AI parse failed, using rule-based classification',
    };
  }
}
