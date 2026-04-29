# Public package boundaries

This monorepo is organized into one app and three shared packages.

## Apps

### `apps/extension`

- Contains the Chrome Extension (MV3) runtime, background worker, popup, and options page.
- May import from `@pageaura/shared-types`, `@pageaura/dom-snapshot`, and `@pageaura/validator`.
- Must not contain private planner integrations; use `mockPlanner` for public demos.

## Packages

### `@pageaura/shared-types`

- Source of truth for DTOs, schema contracts, planner input/output contracts, and cross-context message types.
- Other packages and apps should import contracts from here instead of redefining shapes.

### `@pageaura/dom-snapshot`

- Extracts safe page snapshots and heuristics from DOM content.
- Should remain deterministic and avoid extension UI/runtime side effects.

### `@pageaura/validator`

- Validates enhancement plans, schema payloads, and token budgets before runtime execution.
- Should not depend on `apps/extension` implementation details.

## Dependency direction

Allowed direction is:

1. `apps/extension` -> shared packages
2. shared packages -> `@pageaura/shared-types` (when needed)

Disallowed direction is:

- shared packages importing from `apps/extension`
- cross-package cycles between `dom-snapshot` and `validator`
