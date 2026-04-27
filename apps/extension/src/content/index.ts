import type { EnhancementMode, PlanSummary } from '@pageaura/shared-types';
import {
  PAGE_AURA_MESSAGE_SOURCE,
  PAGE_AURA_MESSAGE_TYPE,
  type ContentBootstrapMessage,
  type ContentBootstrapResponse,
  type PlanSummaryWriteMessage,
} from '../shared/messaging';
import { createPageSnapshot } from '@pageaura/dom-snapshot';
import { getPageEligibility } from '../shared/pageEligibility';
import {
  buildPlannerInput,
  DEFAULT_PLANNER_CAPABILITIES,
  runPlannerWithInput,
} from './plannerAdapter';
import { mockPlanner } from './mockPlanner';

const currentUrl = new URL(window.location.href);
const eligibility = getPageEligibility(currentUrl);
let plannerRunInFlight: Promise<void> | null = null;

const PLANNER_TIMEOUT_MS = 5_000;
const MAX_PLANNER_ATTEMPTS = 2;

const withTimeout = async <T>(task: Promise<T>, timeoutMs: number): Promise<T> => {
  return await new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`Planner run timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    task.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
};

const runPlannerWithRetry = async (mode: EnhancementMode) => {
  const snapshot = createPageSnapshot();
  const capabilities = {
    ...DEFAULT_PLANNER_CAPABILITIES,
    mode,
  };
  const plannerInput = buildPlannerInput(snapshot, capabilities);

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_PLANNER_ATTEMPTS; attempt += 1) {
    try {
      return await withTimeout(runPlannerWithInput(mockPlanner, plannerInput), PLANNER_TIMEOUT_MS);
    } catch (error) {
      lastError = error;

      console.warn('[PageAura] planner attempt failed', {
        attempt,
        maxAttempts: MAX_PLANNER_ATTEMPTS,
        hostname: eligibility.hostname,
        error,
      });
    }
  }

  throw lastError ?? new Error('Planner failed without an explicit error.');
};

const persistPlanSummary = async (summary: PlanSummary): Promise<void> => {
  const summaryMessage: PlanSummaryWriteMessage = {
    source: PAGE_AURA_MESSAGE_SOURCE,
    type: PAGE_AURA_MESSAGE_TYPE.PLAN_SUMMARY_WRITE,
    payload: {
      hostname: eligibility.hostname,
      summary,
    },
  };

  await chrome.runtime.sendMessage(summaryMessage);
};

const runPlannerPipeline = async (mode: EnhancementMode): Promise<void> => {
  if (plannerRunInFlight) {
    console.info('[PageAura] planner run skipped: already running', {
      hostname: eligibility.hostname,
    });
    return plannerRunInFlight;
  }

  plannerRunInFlight = (async () => {
    const plannerResult = await runPlannerWithRetry(mode);
    if (!plannerResult.ok) {
      console.warn('[PageAura] planner failed', {
        hostname: eligibility.hostname,
        error: plannerResult.error,
      });
      return;
    }

    const summary: PlanSummary = {
      planId: plannerResult.plan.planId,
      generatedAt: plannerResult.plan.generatedAt,
      enhancementCount: plannerResult.plan.enhancements.length,
      summary: plannerResult.plan.summary,
    };

    await persistPlanSummary(summary);
    console.info('[PageAura] planner completed', {
      hostname: eligibility.hostname,
      summary,
    });
  })().finally(() => {
    plannerRunInFlight = null;
  });

  return plannerRunInFlight;
};

const bootstrapMessage: ContentBootstrapMessage = {
  source: PAGE_AURA_MESSAGE_SOURCE,
  type: PAGE_AURA_MESSAGE_TYPE.CONTENT_BOOTSTRAP,
  payload: eligibility,
};

chrome.runtime.sendMessage(bootstrapMessage, (response?: unknown) => {
  const typedResponse = response as ContentBootstrapResponse | undefined;
  console.info('[PageAura] content bootstrap sent', {
    hostname: eligibility.hostname,
    eligible: eligibility.eligible,
    reason: eligibility.reason,
    response: typedResponse,
  });

  if (!typedResponse?.ok || !typedResponse.eligible) {
    return;
  }

  void runPlannerPipeline(typedResponse.mode);
});
