import type { ActionNode, PageMetrics, SectionNode } from '@pageaura/shared-types';

import { textContentWordCount } from './domUtils.js';

export const extractMetrics = (
  actions: readonly ActionNode[],
  sections: readonly SectionNode[],
): PageMetrics => {
  const pageTextWordCount = textContentWordCount(document.body?.innerText ?? '');
  const safeWordCount = Math.max(pageTextWordCount, 1);

  return {
    actionCount: actions.length,
    sectionCount: sections.length,
    wordCount: pageTextWordCount,
    interactiveDensity: Number((actions.length / safeWordCount).toFixed(4)),
  };
};
