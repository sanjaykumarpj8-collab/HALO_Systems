import { describe, it, expect, vi } from 'vitest';
import { runCrisisBridgePipeline } from '../packages/ai-pipeline/pipeline';
import type { Worker } from '@halo/shared';

// We mock the inner AI calls to simulate an end-to-end flow without hitting real APIs
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
        generateContent: vi.fn().mockImplementation(async (opts: any) => {
          const prompt = opts.contents[0].parts[0].text;
          
          if (prompt.includes('Agent A')) {
            return { text: JSON.stringify({
              original_text: "Spill in 105",
              detected_language: "en",
              english_translation: "Spill in 105",
              incident_type: "spill",
              location: "Section 105",
              section_id: 105,
              urgency_hint: "medium",
              confidence: 0.9
            })};

          } else if (prompt.includes('duplicate-trigger')) {
            return { text: JSON.stringify({
              incident_id: "temp-id",
              severity: 4,
              is_duplicate: true,
              duplicate_of: "old-id",
              escalated: false,
              required_worker_type: "security",
              reasoning: "Duplicate."
            })};
          } else if (prompt.includes('Agent B')) {
            return { text: JSON.stringify({
              incident_id: "temp-id",
              severity: 3,
              is_duplicate: false,
              escalated: false,
              required_worker_type: "janitor",
              reasoning: "Routine spill requiring cleanup."
            })};
          } else if (prompt.includes('Agent C')) {
            return { text: JSON.stringify({
              incident_id: "temp-id",
              assigned_worker_id: "w-1",
              worker_name: "John",
              worker_type: "janitor",
              eta_minutes: 3,
              route_instructions: "Walk to 105",
              translated_message: "🚨 SPILL at Section 105",
              target_language: "en"
            })};
          }
          return { text: "{}" };
        })
      };
    }
  };
});

describe('Pipeline Integration', () => {
  it('runs an incident through the full triage and dispatch pipeline', async () => {
    const mockWorkers = [
      { id: 'w-1', name: 'John', type: 'janitor', section: 101, status: 'on-duty', language: 'en' }
    ] as any;

    const result = await runCrisisBridgePipeline({
      rawText: 'There is a spill in 105',
      reporterId: 'fan-1',
      reporterName: 'Alice',
      geminiApiKey: 'fake-key',
      recentIncidents: [],
      availableWorkers: mockWorkers
    });

    expect(result.error).toBeUndefined();
    
    // Intake Assertions
    expect(result.intake.incident_type).toBe('spill');
    
    // Priority Assertions
    expect(result.priority.severity).toBe(3);
    expect(result.priority.required_worker_type).toBe('janitor');
    expect(result.priority.reasoning).toBe('Routine spill requiring cleanup.');
    
    // Dispatch Assertions
    expect(result.dispatch).toBeDefined();
    expect(result.dispatch?.assigned_worker_id).toBe('w-1');
  });

  it('returns early if input is empty after sanitization', async () => {
    const result = await runCrisisBridgePipeline({
      rawText: '   ',
      reporterId: 'fan-1',
      reporterName: 'Alice',
      geminiApiKey: 'fake-key',
      recentIncidents: [],
      availableWorkers: []
    });
    expect(result.error).toBe("Input text is empty or invalid after sanitization.");
    expect(result.dispatch).toBeNull();
  });

  it('skips dispatch if incident is a duplicate', async () => {
    const result = await runCrisisBridgePipeline({
      rawText: 'Spill',
      reporterId: 'fan-1',
      reporterName: 'Alice',
      geminiApiKey: 'fake-key',
      recentIncidents: [
        { id: 'duplicate-trigger', parsed_type: 'spill', section_id: 105, status: 'new', created_at: '', reported_by: '', reporter_name: '', raw_text: '', detected_language: '', english_translation: '', severity: 3, location_description: '', confidence: 1 }
      ],
      availableWorkers: []
    });
    expect(result.priority.is_duplicate).toBe(true);
    expect(result.dispatch).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it('returns an error if no worker is available', async () => {
    const result = await runCrisisBridgePipeline({
      rawText: 'There is a spill in 105',
      reporterId: 'fan-1',
      reporterName: 'Alice',
      geminiApiKey: 'fake-key',
      recentIncidents: [],
      availableWorkers: [] // No workers!
    });
    expect(result.dispatch).toBeNull();
    expect(result.error).toContain("No available janitor workers found");
  });
});
