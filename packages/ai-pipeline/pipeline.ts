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
 * Run the full Crisis-Bridge pipeline.
 * Returns structured results from all three agents.
 */
export async function runCrisisBridgePipeline(
  input: PipelineInput
): Promise<PipelineResult> {
  // ── Stage 1: Agent A — Intake ───────────────────────────
  console.log('[Pipeline] Stage 1: Running Intake Agent...');
  const intake = await runIntakeAgent(input.rawText, input.geminiApiKey);
  console.log(`[Pipeline] Intake complete: ${intake.incident_type} at ${intake.location} (${intake.detected_language})`);

  // Generate a temporary ID for this incident
  const tempId = crypto.randomUUID();

  // ── Stage 2: Agent B — Prioritizer ──────────────────────
  console.log('[Pipeline] Stage 2: Running Prioritizer Agent...');
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
  console.log(`[Pipeline] Priority: severity=${priority.severity}, worker_needed=${priority.required_worker_type}, escalated=${priority.escalated}`);

  // Skip dispatch if duplicate
  if (priority.is_duplicate) {
    console.log(`[Pipeline] Duplicate detected, skipping dispatch. Duplicate of: ${priority.duplicate_of}`);
    return { intake, priority, dispatch: null };
  }

  // ── Stage 3: Agent C — Dispatcher ──────────────────────
  console.log('[Pipeline] Stage 3: Running Dispatcher Agent...');
  const nearestWorker = findNearestWorker(
    input.availableWorkers,
    priority.required_worker_type,
    intake.section_id
  );

  if (!nearestWorker) {
    console.log(`[Pipeline] No available ${priority.required_worker_type} found!`);
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

  console.log(`[Pipeline] Dispatched ${dispatch.worker_name} (${dispatch.worker_type}) — ETA: ${dispatch.eta_minutes}min`);

  return { intake, priority, dispatch };
}

// Re-export agents for individual use
export { runIntakeAgent } from './agents/intake-agent';
export { runPrioritizerAgent } from './agents/prioritizer-agent';
export { runDispatcherAgent, findNearestWorker } from './agents/dispatcher-agent';
