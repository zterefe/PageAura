import type { PageSnapshot } from '@pageaura/shared-types';

import { extractActions } from './extractActions.js';
import { extractMetrics } from './extractMetrics.js';
import { extractPageMetadata } from './extractPageMetadata.js';
import { extractSections } from './extractSections.js';

export const createPageSnapshot = (): PageSnapshot => {
  const metadata = extractPageMetadata();
  const actions = extractActions();
  const sections = extractSections();
  const metrics = extractMetrics(actions, sections);

  return {
    metadata,
    actions,
    sections,
    metrics,
  };
};
