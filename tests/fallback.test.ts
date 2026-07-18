import { describe, it, expect, vi } from 'vitest';
import { runIntakeAgent } from '../packages/ai-pipeline/agents/intake-agent';
import { runPrioritizerAgent } from '../packages/ai-pipeline/agents/prioritizer-agent';
import { runDispatcherAgent } from '../packages/ai-pipeline/agents/dispatcher-agent';

// Mock the Gemini API to return invalid JSON
vi.mock('@google/genai', () => {
  return {
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      INTEGER: 'INTEGER',
      BOOLEAN: 'BOOLEAN',
      NUMBER: 'NUMBER'
    },
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockResolvedValue({
          text: "This is definitely not valid JSON. { oof }"
        })
      };
    }
  };
});

describe('Agent Fallbacks (JSON Parse Errors)', () => {
  it('Intake Agent falls back safely on invalid JSON', async () => {
    const result = await runIntakeAgent('Emergency at gate 4', 'fake-key');
    expect(result.incident_type).toBe('other');
    expect(result.location).toBe('Unknown');
    expect(result.confidence).toBe(0.3);
  });

  it('Prioritizer Agent falls back safely on invalid JSON', async () => {
    const incident = {
      incident_id: 'test-id',
      incident_type: 'fire',
      english_translation: 'Fire!',
      location: 'Section 1',
      section_id: 1,
      urgency_hint: 'critical' as const
    };
    
    const result = await runPrioritizerAgent(incident, [
      { id: '1', parsed_type: 'fire', section_id: 1, status: 'new', created_at: '2026-07-18', reported_by: 'u1', reporter_name: 'Bob', raw_text: '', detected_language: 'en', english_translation: '', severity: 1 as const, location_description: '', confidence: 1 }
    ], 'fake-key');
    
    expect(result.severity).toBe(1);
    expect(result.required_worker_type).toBe('security');
    expect(result.escalated).toBe(true);
  });

  it('Dispatcher Agent falls back safely on invalid JSON', async () => {
    const incident = {
      incident_id: 'test-id',
      incident_type: 'medical',
      english_translation: 'Help',
      location: 'Section 10',
      section_id: 10,
      urgency_hint: 'high' as const
    };
    const worker = {
      id: 'w-1',
      worker_id: 'w1',
      user_id: 'u1',
      name: 'Alice',
      type: 'medic' as const,
      section: 15,
      status: 'on-duty' as const,
      efficiency: 100,
      language: 'es',
      created_at: ''
    };

    const result = await runDispatcherAgent(incident, worker, 'fake-key');
    expect(result.assigned_worker_id).toBe('w-1');
    expect(result.distance_meters).toBe(250);
    expect(result.eta_minutes).toBe(5);
  });
});
