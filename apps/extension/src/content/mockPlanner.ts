import type {
  EnhancementPlan,
  EnhancementPlanItem,
  Planner,
  PlannerInput,
  SectionNode,
} from '@pageaura/shared-types';

const buildToolbarEnhancement = (input: PlannerInput): EnhancementPlanItem | null => {
  if (!input.capabilities.allowedEnhancementTypes.includes('insert_toolbar')) {
    return null;
  }

  const topActions = input.snapshot.actions.slice(0, 3);
  if (!topActions.length) {
    return null;
  }

  return {
    id: 'mock-insert-toolbar',
    type: 'insert_toolbar',
    title: 'Quick actions',
    rationale: input.capabilities.includeRationale
      ? 'Expose high-value actions in a persistent assistive toolbar.'
      : undefined,
    items: topActions.map((action) => ({
      id: `toolbar-${action.id}`,
      label: action.label,
      selector: action.selector,
      behavior: 'click',
    })),
  };
};

const buildJumpLinksEnhancement = (input: PlannerInput): EnhancementPlanItem | null => {
  if (!input.capabilities.allowedEnhancementTypes.includes('jump_links')) {
    return null;
  }

  const sections: readonly SectionNode[] = input.snapshot.sections.slice(0, 5);
  if (!sections.length) {
    return null;
  }

  return {
    id: 'mock-jump-links',
    type: 'jump_links',
    title: 'Jump links',
    rationale: input.capabilities.includeRationale
      ? 'Surface section navigation for dense layouts.'
      : undefined,
    links: sections.map((section) => ({
      id: `jump-${section.id}`,
      label: section.heading,
      selector: section.selector,
    })),
  };
};

const buildPlan = (input: PlannerInput): EnhancementPlan => {
  const planItems = [buildToolbarEnhancement(input), buildJumpLinksEnhancement(input)].filter(
    (item): item is EnhancementPlanItem => item !== null,
  );

  const enhancements = planItems.slice(0, Math.max(0, input.capabilities.maxEnhancements));

  return {
    planId: `mock-plan-${input.snapshot.metadata.hostname}`,
    snapshotId: `${input.snapshot.metadata.hostname}-${input.snapshot.metrics.actionCount}-${input.snapshot.metrics.sectionCount}`,
    generatedAt: '2026-01-01T00:00:00.000Z',
    summary: `Mock planner suggested ${enhancements.length} enhancement(s) in ${input.capabilities.mode} mode.`,
    enhancements,
  };
};

export const mockPlanner: Planner = {
  id: 'mock-planner',
  async plan(input: PlannerInput): Promise<unknown> {
    return buildPlan(input);
  },
};
