/**
 * Crisis-Bridge Pipeline Orchestrator
 * 
 * Chains Agent A → Agent B → Agent C to process a raw fan report
 * into a fully dispatched, translated incident with ETA.
 * 
 * Flow:
 * 1. Fan submits raw text (any language)
 * 2. Agent A: Parse → classify → translate
 * 3. Agent B: Score severity → detect duplicates → determine worker type
 * 4. Agent C: Find nearest worker → generate route → translate dispatch
 * 5. Result: Worker receives push notification in their language
 */

import { runIntakeAgent } from './agents/intake-agent';
import { runPrioritizerAgent } from './agents/prioritizer-agent';
import { runDispatcherAgent, findNearestWorker } from './agents/dispatcher-agent';
import type {
  IntakeResult,
  PrioritizedIncident,
  DispatchResult,
  Incident,
  Worker,
} from '@halo/shared';

export interface PipelineInput {
  rawText: string;
  reporterId: string;
  reporterName: string;
  geminiApiKey: string;
  recentIncidents: Incident[];
  availableWorkers: Worker[];
}

export interface PipelineResult {
  intake: IntakeResult;
  priority: PrioritizedIncident;
  dispatch: DispatchResult | null;
  error?: string;
}

/**
 * Sanitize and validate user-submitted text to prevent prompt injection 
 * and buffer overflows. 
 */
export function sanitizeInput(text: string): string {
  if (!text) return "";
  // Strip control characters and basic HTML tags to prevent injection/XSS
  let sanitized = text.replace(/[\x00-\x1F\x7F]/g, '');
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  // Limit length to prevent DoS via massive context
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  return sanitized.trim();
}

/**
 * Run the full Crisis-Bridge pipeline.
 * Returns structured results from all three agents.
 */
export async function runCrisisBridgePipeline(
  input: PipelineInput
): Promise<PipelineResult> {
  // ── Input Validation & Sanitization ─────────────────────
  const sanitizedText = sanitizeInput(input.rawText);
  if (!sanitizedText) {
    return {
      intake: {} as IntakeResult,
      priority: {} as PrioritizedIncident,
      dispatch: null,
      error: "Input text is empty or invalid after sanitization."
    };
  }

  // ── Stage 1: Agent A — Intake ───────────────────────────
  const intake = await runIntakeAgent(sanitizedText, input.geminiApiKey);

  // ── Deterministic Duplicate Detection ───────────────────
  const tempId = crypto.randomUUID();
  const now = Date.now();
  const duplicate = input.recentIncidents.find(i => {
    if (i.parsed_type !== intake.incident_type || i.section_id !== intake.section_id) return false;
    const timeDiff = now - new Date(i.created_at).getTime();
    return Number.isNaN(timeDiff) || timeDiff <= 10 * 60000;
  });

  if (duplicate) {
    const typeToWorker: Record<string, "janitor" | "medic" | "security"> = {
      medical: 'medic', fire: 'security', security: 'security', structural: 'security',
      spill: 'janitor', noise: 'janitor', accessibility: 'janitor', other: 'security'
    };
    const priority: PrioritizedIncident = {
      incident_id: tempId,
      severity: duplicate.severity ?? 3,
      is_duplicate: true,
      duplicate_of: duplicate.id,
      escalated: false,
      required_worker_type: typeToWorker[intake.incident_type] ?? 'security',
      reasoning: 'Deterministic duplicate detection (same type + section within 10m)'
    };
    return { intake, priority, dispatch: null };
  }

  // ── Stage 2: Agent B — Prioritizer ──────────────────────
  const priority = await runPrioritizerAgent(
    {
      incident_id: tempId,
      incident_type: intake.incident_type,
      english_translation: intake.english_translation,
      location: intake.location,
      section_id: intake.section_id,
      urgency_hint: intake.urgency_hint,
    },
    input.recentIncidents,
    input.geminiApiKey
  );

  // Skip dispatch if duplicate
  if (priority.is_duplicate) {
    return { intake, priority, dispatch: null };
  }

  // ── Stage 3: Agent C — Dispatcher ──────────────────────
  const nearestWorker = findNearestWorker(
    input.availableWorkers,
    priority.required_worker_type,
    intake.section_id
  );

  if (!nearestWorker) {
    return {
      intake,
      priority,
      dispatch: null,
      error: `No available ${priority.required_worker_type} workers found`,
    };
  }

  const dispatch = await runDispatcherAgent(
    {
      incident_id: tempId,
      incident_type: intake.incident_type,
      severity: priority.severity,
      location: intake.location,
      section_id: intake.section_id,
      english_translation: intake.english_translation,
    },
    nearestWorker,
    input.geminiApiKey
  );

  return { intake, priority, dispatch };
}

// Re-export agents for individual use
export { runIntakeAgent } from './agents/intake-agent';
export { runPrioritizerAgent } from './agents/prioritizer-agent';
export { runDispatcherAgent, findNearestWorker } from './agents/dispatcher-agent';
