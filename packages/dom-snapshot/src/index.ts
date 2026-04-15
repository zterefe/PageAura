import { SHARED_TYPES_PACKAGE, type PageAuraPackageInfo } from '@pageaura/shared-types';

export interface DomSnapshotPackageInfo extends PageAuraPackageInfo {
  readonly dependencies: readonly string[];
}

export const DOM_SNAPSHOT_PACKAGE: DomSnapshotPackageInfo = {
  packageName: '@pageaura/dom-snapshot',
  version: '0.1.0',
  dependencies: [SHARED_TYPES_PACKAGE.packageName],
};
