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
import { compileRuntimeExecutionPlan } from './compiler';
import { cleanupRuntimePlan, executeRuntimePlan } from './runtimeExecutor';

const currentUrl = new URL(window.location.href);
const eligibility = getPageEligibility(currentUrl);
let plannerRunInFlight: Promise<void> | null = null;
let plannerMode: EnhancementMode | null = null;
let rerunDebounceTimer: number | null = null;
let pendingRerunReason: string | null = null;
let lastPlannerStartAt = 0;
let lastObservedHref = window.location.href;
let suppressMutationUntil = Date.now();

const PLANNER_TIMEOUT_MS = 5_000;
const MAX_PLANNER_ATTEMPTS = 2;
const RERUN_DEBOUNCE_MS = 450;
const RERUN_COOLDOWN_MS = 900;
const MUTATION_SUPPRESSION_MS = 600;
const NAVIGATION_EVENT = 'pageaura:navigation';
const OVERLAY_SELECTOR = '#pageaura-overlay-root, [data-pageaura-overlay="true"]';

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

const isRerunReason = (reason: string): boolean => {
  return reason !== 'initial-bootstrap';
};

const runPlannerPipeline = async (
  mode: EnhancementMode,
  reason: string,
  cleanupBeforeRun: boolean,
): Promise<void> => {
  if (plannerRunInFlight) {
    console.info('[PageAura] planner run skipped: already running', {
      hostname: eligibility.hostname,
      reason,
    });
    return plannerRunInFlight;
  }

  plannerRunInFlight = (async () => {
    lastPlannerStartAt = Date.now();

    if (cleanupBeforeRun) {
      cleanupRuntimePlan();
    }

    const plannerResult = await runPlannerWithRetry(mode);
    if (!plannerResult.ok) {
      console.warn('[PageAura] planner failed', {
        hostname: eligibility.hostname,
        reason,
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

    const executionPlan = compileRuntimeExecutionPlan(plannerResult.plan);
    executeRuntimePlan(executionPlan);
    suppressMutationUntil = Date.now() + MUTATION_SUPPRESSION_MS;

    console.info('[PageAura] planner completed', {
      hostname: eligibility.hostname,
      reason,
      summary,
    });
  })().finally(() => {
    plannerRunInFlight = null;

    if (pendingRerunReason && plannerMode) {
      const nextReason = pendingRerunReason;
      pendingRerunReason = null;
      queuePlannerRun(nextReason);
    }
  });

  return plannerRunInFlight;
};

const queuePlannerRun = (reason: string): void => {
  if (!plannerMode) {
    return;
  }

  pendingRerunReason = reason;

  if (rerunDebounceTimer !== null) {
    window.clearTimeout(rerunDebounceTimer);
  }

  rerunDebounceTimer = window.setTimeout(() => {
    rerunDebounceTimer = null;

    if (!plannerMode || !pendingRerunReason) {
      return;
    }

    const scheduledReason = pendingRerunReason;
    pendingRerunReason = null;

    const elapsed = Date.now() - lastPlannerStartAt;
    if (elapsed < RERUN_COOLDOWN_MS) {
      queuePlannerRun(scheduledReason);
      return;
    }

    void runPlannerPipeline(plannerMode, scheduledReason, isRerunReason(scheduledReason));
  }, RERUN_DEBOUNCE_MS);
};

const isOverlayNode = (node: Node | null): boolean => {
  if (!node) {
    return false;
  }

  if (node instanceof Element) {
    return node.matches(OVERLAY_SELECTOR) || node.closest(OVERLAY_SELECTOR) !== null;
  }

  return node.parentElement?.closest(OVERLAY_SELECTOR) !== null;
};

const shouldTriggerFromMutation = (mutation: MutationRecord): boolean => {
  if (mutation.type !== 'childList') {
    return false;
  }

  if (isOverlayNode(mutation.target)) {
    return false;
  }

  for (let index = 0; index < mutation.addedNodes.length; index += 1) {
    const node = mutation.addedNodes.item(index);
    if (!isOverlayNode(node)) {
      return true;
    }
  }

  for (let index = 0; index < mutation.removedNodes.length; index += 1) {
    const node = mutation.removedNodes.item(index);
    if (!isOverlayNode(node)) {
      return true;
    }
  }

  return false;
};

const installNavigationInstrumentation = (): void => {
  const dispatchNavigationEvent = (): void => {
    window.dispatchEvent(new Event(NAVIGATION_EVENT));
  };

  for (const methodName of ['pushState', 'replaceState'] as const) {
    const originalMethod = history[methodName].bind(history);
    history[methodName] = (...args: unknown[]) => {
      const value = (originalMethod as (...callArgs: unknown[]) => unknown)(...args);
      dispatchNavigationEvent();
      return value;
    };
  }

  const onPotentialRouteChange = (): void => {
    const nextHref = window.location.href;
    if (nextHref === lastObservedHref) {
      return;
    }

    lastObservedHref = nextHref;
    queuePlannerRun('spa-route-change');
  };

  window.addEventListener('popstate', onPotentialRouteChange);
  window.addEventListener('hashchange', onPotentialRouteChange);
  window.addEventListener(NAVIGATION_EVENT, onPotentialRouteChange);

  const observer = new MutationObserver((mutations) => {
    if (Date.now() < suppressMutationUntil) {
      return;
    }

    const hasMeaningfulMutation = mutations.some((mutation) => shouldTriggerFromMutation(mutation));
    if (!hasMeaningfulMutation) {
      return;
    }

    queuePlannerRun('dom-mutation');
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  suppressMutationUntil = Date.now() + MUTATION_SUPPRESSION_MS;
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

  plannerMode = typedResponse.mode;
  installNavigationInstrumentation();
  queuePlannerRun('initial-bootstrap');
});
