import { SHARED_TYPES_PACKAGE, type PageAuraPackageInfo } from '@pageaura/shared-types';

import { createPageSnapshot } from './createPageSnapshot.js';
import { MAX_ACTION_NODES, MAX_SECTION_NODES } from './constants.js';
import { extractActions } from './extractActions.js';
import { extractMetrics } from './extractMetrics.js';
import { extractPageMetadata } from './extractPageMetadata.js';
import { extractSections } from './extractSections.js';

export interface DomSnapshotPackageInfo extends PageAuraPackageInfo {
  readonly dependencies: readonly string[];
}

export const DOM_SNAPSHOT_PACKAGE: DomSnapshotPackageInfo = {
  packageName: '@pageaura/dom-snapshot',
  version: '0.1.0',
  dependencies: [SHARED_TYPES_PACKAGE.packageName],
};

export {
  createPageSnapshot,
  extractActions,
  extractMetrics,
  extractPageMetadata,
  extractSections,
  MAX_ACTION_NODES,
  MAX_SECTION_NODES,
};

export type {
  ActionNode,
  PageActionKind,
  PageMetadata,
  PageMetrics,
  PageSnapshot,
  SectionNode,
} from '@pageaura/shared-types';
export { pageSnapshotSchema } from '@pageaura/shared-types';
