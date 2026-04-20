export type JsonSchema = {
  readonly type: 'object';
  readonly properties: Readonly<Record<string, unknown>>;
  readonly required: readonly string[];
  readonly additionalProperties: boolean;
};

export const pageSnapshotSchema: JsonSchema = {
  type: 'object',
  properties: {
    metadata: { type: 'object' },
    actions: { type: 'array' },
    sections: { type: 'array' },
    metrics: { type: 'object' },
  },
  required: ['metadata', 'actions', 'sections', 'metrics'],
  additionalProperties: false,
} as const;

export const enhancementPlanSchema: JsonSchema = {
  type: 'object',
  properties: {
    planId: { type: 'string' },
    snapshotId: { type: 'string' },
    generatedAt: { type: 'string', format: 'date-time' },
    summary: { type: 'string' },
    enhancements: { type: 'array' },
  },
  required: ['planId', 'snapshotId', 'generatedAt', 'summary', 'enhancements'],
  additionalProperties: false,
} as const;

export const runtimeExecutionPlanSchema: JsonSchema = {
  type: 'object',
  properties: {
    executionId: { type: 'string' },
    sourcePlanId: { type: 'string' },
    generatedAt: { type: 'string', format: 'date-time' },
    ops: { type: 'array' },
  },
  required: ['executionId', 'sourcePlanId', 'generatedAt', 'ops'],
  additionalProperties: false,
} as const;

export const settingsStateSchema: JsonSchema = {
  type: 'object',
  properties: {
    global: { type: 'object' },
    sites: { type: 'object' },
    lastSummaryByHost: { type: 'object' },
  },
  required: ['global', 'sites', 'lastSummaryByHost'],
  additionalProperties: false,
} as const;

export const pageAuraMessageSchema: JsonSchema = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    requestId: { type: 'string' },
  },
  required: ['type', 'requestId'],
  additionalProperties: true,
} as const;
