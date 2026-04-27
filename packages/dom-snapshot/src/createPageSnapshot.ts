import type { PageSnapshot } from '@pageaura/shared-types';

import { extractActions } from './extractActions.js';
import { extractMetrics } from './extractMetrics.js';
import { extractPageMetadata } from './extractPageMetadata.js';
import { extractSections } from './extractSections.js';

interface SnapshotDebugOptions {
  readonly debug?: boolean;
}

const shouldDebugSnapshot = (override?: boolean): boolean => {
  if (typeof override === 'boolean') {
    return override;
  }

  const globalDebug = (globalThis as { PAGEAURA_SNAPSHOT_DEBUG?: boolean }).PAGEAURA_SNAPSHOT_DEBUG;
  if (typeof globalDebug === 'boolean') {
    return globalDebug;
  }

  return false;
};

export const createPageSnapshot = (options?: SnapshotDebugOptions): PageSnapshot => {
  const metadata = extractPageMetadata();
  const actions = extractActions();
  const sections = extractSections();
  const metrics = extractMetrics(actions, sections);

  const snapshot: PageSnapshot = {
    metadata,
    actions,
    sections,
    metrics,
  };

  if (shouldDebugSnapshot(options?.debug)) {
    console.debug('[PageAura][dom-snapshot] Snapshot output', snapshot);
  }

  return snapshot;
};
