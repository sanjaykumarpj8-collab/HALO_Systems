import { describe, it, expect, vi } from 'vitest';
import { runPrioritizerAgent } from '../packages/ai-pipeline/agents/prioritizer-agent';
import { sanitizeInput } from '../packages/ai-pipeline/pipeline';
import type { Incident } from '@halo/shared';

// Mock the Gemini API
vi.mock('@google/genai', () => {
  return {
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
