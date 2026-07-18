import { describe, it, expect, vi } from 'vitest';
import { runPrioritizerAgent } from '../packages/ai-pipeline/agents/prioritizer-agent';
import { findNearestWorker } from '../packages/ai-pipeline/agents/dispatcher-agent';
import { sanitizeInput } from '../packages/ai-pipeline/pipeline';
import type { Incident } from '@halo/shared';

// Mock the Gemini API
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
          text: JSON.stringify({
            incident_id: 'test-1',
            severity: 1,
            is_duplicate: false,
            escalated: true,
            required_worker_type: 'medic',
            reasoning: 'Critical medical emergency requiring immediate attention.'
          })
        })
      };
    }
  };
});

describe('Core Logic - Sanitization', () => {
  it('strips HTML tags and control characters', () => {
    const malicious = '<script>alert("xss")</script> Help \x00 me!';
    const clean = sanitizeInput(malicious);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('\x00');
    expect(clean).toContain('alert("xss") Help  me!');
  });

  it('limits input length to 1000 characters', () => {
    const longString = 'a'.repeat(2000);
    const clean = sanitizeInput(longString);
    expect(clean.length).toBe(1000);
  });
});

describe('Core Logic - Prioritizer Agent', () => {
  it('assigns correct priority and explains reasoning based on AI output', async () => {
    const incident = {
      incident_id: 'test-1',
      incident_type: 'medical',
      english_translation: 'Someone is having a heart attack',
      location: 'Section 102',
      section_id: 102,
      urgency_hint: 'critical'
    };
    
    const recentIncidents: Incident[] = [];

    const result = await runPrioritizerAgent(incident, recentIncidents, 'fake-key');

    expect(result.severity).toBe(1);
    expect(result.escalated).toBe(true);
    expect(result.required_worker_type).toBe('medic');
    expect(result.reasoning).toBe('Critical medical emergency requiring immediate attention.');
  });
});

describe('Core Logic - Dispatcher Agent', () => {
  it('findNearestWorker ignores off-duty workers', () => {
    const workers = [
      { id: 'w1', worker_id: '1', user_id: 'u1', name: 'John', type: 'medic', section: 101, status: 'off-duty', efficiency: 100, language: 'en', created_at: '' },
      { id: 'w2', worker_id: '2', user_id: 'u2', name: 'Jane', type: 'medic', section: 105, status: 'on-duty', efficiency: 100, language: 'en', created_at: '' }
    ] as any;
    
    const nearest = findNearestWorker(workers, 'medic', 101);
    expect(nearest?.id).toBe('w2'); // Should ignore w1 even though it's closer
  });

  it('findNearestWorker correctly sorts by distance', () => {
    const workers = [
      { id: 'w1', worker_id: '1', user_id: 'u1', name: 'A', type: 'security', section: 110, status: 'on-duty', efficiency: 100, language: 'en', created_at: '' },
      { id: 'w2', worker_id: '2', user_id: 'u2', name: 'B', type: 'security', section: 106, status: 'on-duty', efficiency: 100, language: 'en', created_at: '' },
      { id: 'w3', worker_id: '3', user_id: 'u3', name: 'C', type: 'security', section: 101, status: 'on-duty', efficiency: 100, language: 'en', created_at: '' }
    ] as any;
    
    const nearest = findNearestWorker(workers, 'security', 105);
    expect(nearest?.id).toBe('w2'); // 106 is closest to 105
  });

  it('findNearestWorker returns null if no worker matches', () => {
    const workers = [
      { id: 'w1', worker_id: '1', user_id: 'u1', name: 'A', type: 'medic', section: 110, status: 'on-duty', efficiency: 100, language: 'en', created_at: '' }
    ] as any;
    
    const nearest = findNearestWorker(workers, 'janitor', 105);
    expect(nearest).toBeNull();
  });
});
