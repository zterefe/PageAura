export interface PageAuraPackageInfo {
  readonly packageName: string;
  readonly version: string;
}

export const SHARED_TYPES_PACKAGE: PageAuraPackageInfo = {
  packageName: '@pageaura/shared-types',
  version: '0.1.0',
};

export * from './snapshot';
export * from './enhancement-plan';
export * from './runtime-ops';
export * from './settings';
export * from './messaging';
export * from './schemas';

export * from './planner';
