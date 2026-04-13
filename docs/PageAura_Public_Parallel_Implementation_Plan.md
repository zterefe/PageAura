# PageAura — Public Repo Parallel Implementation Plan

## Scope
- Build the open-core PageAura MVP in parallel across extension runtime, UI, contracts, validation, compiler/runtime, and release tracks.
- Keep each workstream phase-based so multiple AI agents can work independently with clear stopping points.
- After each completed phase, pause for commit/push before starting the next phase.
- Use shared contracts for snapshot DTOs, enhancement plans, runtime ops, settings, and message payloads to avoid drift across agents.

---

# Track 1 — Project Foundation / Repo Setup

## Scope
- Initialize the public repo, shared tooling, environments, and base extension project structure.
- Establish conventions so all other tracks can build in parallel safely.

---

## Phase 1 — Monorepo/workspace + base extension scaffold + tooling

### Checklist
- [ ] Create monorepo/workspace structure
- [ ] Add `apps/extension/` Chrome Extension MV3 + TypeScript scaffold
- [ ] Add `packages/shared-types/`
- [ ] Add `packages/dom-snapshot/`
- [ ] Add `packages/validator/`
- [ ] Add shared linting, formatting, and TypeScript config
- [ ] Add `.env.example` and local setup docs

### Implemented files
- `apps/extension/` (new)
- `packages/shared-types/` (new)
- `packages/dom-snapshot/` (new)
- `packages/validator/` (new)
- root `package.json` / workspace config (new)
- `.env.example` (new)
- lint / prettier / tsconfig files (new)

### Notes
- This phase should only establish structure and tooling.
- No feature logic should be mixed in here.
- Folder/package naming conventions should be locked in now.

### Verification (manual)
- [ ] Workspace installs successfully
- [ ] Extension dev build runs locally
- [ ] Typecheck and lint pass
- [ ] Package imports resolve correctly

### Status
⏸️ Pending

---

## Phase 2 — Shared contracts package

### Planned checklist
- [ ] Add shared DTOs for page snapshots, actions, sections, metrics
- [ ] Add enhancement plan contracts
- [ ] Add runtime op contracts
- [ ] Add settings and message payload contracts
- [ ] Add validation schemas for all top-level serialized objects
- [ ] Export contracts for all public packages

### Status
⏸️ Pending

---

# Track 2 — Extension Shell + Manifest + Messaging

## Scope
- Build the extension shell, MV3 manifest, service worker, popup shell, and message bus.
- Make the rest of the system pluggable without blocking on feature logic.

---

## Phase 1 — MV3 manifest + service worker + content script wiring

### Checklist
- [ ] Add MV3 manifest
- [ ] Register content script
- [ ] Register service worker
- [ ] Add message routing between content script and service worker
- [ ] Add site hostname detection and page eligibility checks
- [ ] Add local development startup instructions

### Implemented files
- `apps/extension/src/manifest.ts`
- `apps/extension/src/background/serviceWorker.ts`
- `apps/extension/src/content/index.ts`
- `apps/extension/src/shared/messaging.ts`

### Notes
- Keep this phase focused on extension bootstrapping only.
- Do not mix snapshot or enhancement logic here.

### Verification (manual)
- [ ] Extension loads in Chrome
- [ ] Content script runs on target pages
- [ ] Service worker receives messages
- [ ] Message roundtrip succeeds

### Status
⏸️ Pending

---

## Phase 2 — Popup shell + options shell + settings plumbing

### Planned checklist
- [ ] Add popup app scaffold
- [ ] Add options page scaffold
- [ ] Add current-site enabled/disabled toggle
- [ ] Add mode selector (`safe`, `enhanced`, `experimental`)
- [ ] Add shared settings read/write flow through service worker
- [ ] Show current page enhancement summary placeholder

### Status
⏸️ Pending

---

# Track 3 — DOM Snapshot Engine

## Scope
- Build the DOM snapshot engine that converts live pages into normalized planner-friendly input.

---

## Phase 1 — Snapshot core extraction

### Checklist
- [ ] Extract page metadata (URL, hostname, title)
- [ ] Extract interactive elements into `ActionNode[]`
- [ ] Extract sections/headings into `SectionNode[]`
- [ ] Extract page metrics
- [ ] Ignore hidden elements and user-entered values
- [ ] Cap large element sets for planner safety

### Implemented files
- `packages/dom-snapshot/src/extractPageMetadata.ts`
- `packages/dom-snapshot/src/extractActions.ts`
- `packages/dom-snapshot/src/extractSections.ts`
- `packages/dom-snapshot/src/extractMetrics.ts`
- `packages/dom-snapshot/src/index.ts`

### Notes
- Focus only on normalized extraction.
- Do not add AI logic or enhancement logic here.

### Verification (manual)
- [ ] Snapshot returns expected metadata on sample pages
- [ ] Action extraction excludes hidden elements
- [ ] Section extraction returns stable selectors
- [ ] Snapshot payload stays within expected size

### Status
⏸️ Pending

---

## Phase 2 — Heuristics + selector hardening

### Planned checklist
- [ ] Add page-type hints
- [ ] Add search/layout/navigation heuristics
- [ ] Improve selector stability rules
- [ ] Deduplicate similar actions
- [ ] Add fixture-based snapshot tests
- [ ] Add debug logging for snapshot output

### Status
⏸️ Pending

---

# Track 4 — Planner Adapter + Public Planner Interface

## Scope
- Build the public planner interface and adapter layer used by the runtime.
- The public repo should support a mock/community planner for local development and testing.

---

## Phase 1 — Planner interface + adapter contract

### Checklist
- [ ] Add `Planner` interface
- [ ] Add planner input builder
- [ ] Add planner response parser
- [ ] Add planner capability config
- [ ] Add mock planner returning deterministic plans
- [ ] Add planner error contract

### Implemented files
- `packages/shared-types/src/planner.ts`
- `apps/extension/src/content/plannerAdapter.ts`
- `apps/extension/src/content/mockPlanner.ts`

### Notes
- This phase should not include private prompting logic.
- Keep the public planner usable for demo/testing even without private modules.

### Verification (manual)
- [ ] Mock planner returns valid plan
- [ ] Planner adapter handles success and failure
- [ ] Planner capabilities are passed correctly
- [ ] Invalid planner output is surfaced cleanly

### Status
⏸️ Pending

---

## Phase 2 — Planner execution flow inside content script

### Planned checklist
- [ ] Build planner input from snapshot
- [ ] Call planner adapter from content pipeline
- [ ] Add timeout and retry policy
- [ ] Add plan summary logging for popup
- [ ] Guard against duplicate concurrent planner runs

### Status
⏸️ Pending

---

# Track 5 — Validation Engine

## Scope
- Build the validator that turns raw planner output into a safe plan.

---

## Phase 1 — Schema + token validation

### Checklist
- [ ] Validate top-level enhancement plan schema
- [ ] Validate supported enhancement types
- [ ] Validate required fields per enhancement type
- [ ] Validate bounded numeric tokens
- [ ] Validate max counts (toolbar actions, jump links)
- [ ] Return structured validation errors

### Implemented files
- `packages/validator/src/validatePlanSchema.ts`
- `packages/validator/src/validateTokens.ts`
- `packages/validator/src/errors.ts`
- `packages/validator/src/index.ts`

### Notes
- Keep first phase focused on contract correctness.
- Selector existence checks belong in phase 2.

### Verification (manual)
- [ ] Invalid schema is rejected
- [ ] Out-of-range tokens are rejected or clamped
- [ ] Unknown enhancement types are rejected
- [ ] Validation errors include useful paths/messages

### Status
⏸️ Pending

---

## Phase 2 — Selector + safety validation

### Planned checklist
- [ ] Validate selectors against current DOM
- [ ] Reject destructive-looking promoted actions
- [ ] Validate behavior types (`focus`, `scroll`, `click`)
- [ ] Skip missing optional targets safely
- [ ] Produce `SafeEnhancementPlan`

### Status
⏸️ Pending

---

# Track 6 — Compiler + Runtime Ops

## Scope
- Build the compiler that turns safe plans into runtime ops and the op model shared with executors.

---

## Phase 1 — Runtime op contracts + compiler core

### Checklist
- [ ] Add runtime op types
- [ ] Add compiler for `insert_toolbar`
- [ ] Add compiler for `jump_links`
- [ ] Add compiler for `theme_patch`
- [ ] Add compiler for `style_patch`
- [ ] Add defaults normalization in compiler

### Implemented files
- `packages/shared-types/src/runtime.ts`
- `apps/extension/src/content/compiler.ts`
- `apps/extension/src/content/compileToolbar.ts`
- `apps/extension/src/content/compileJumpLinks.ts`
- `apps/extension/src/content/compileThemePatch.ts`
- `apps/extension/src/content/compileStylePatch.ts`

### Notes
- This phase only produces runtime ops.
- No DOM mutation should happen here.

### Verification (manual)
- [ ] Safe plan compiles to deterministic op list
- [ ] Runtime ops are stable across repeated runs
- [ ] Compiler handles missing optional fields
- [ ] Each supported enhancement type is compiled

### Status
⏸️ Pending

---

## Phase 2 — Cleanup model + op execution planning

### Planned checklist
- [ ] Add cleanup registration contracts
- [ ] Add plan execution handle
- [ ] Add op batching rules
- [ ] Add re-run/replace semantics for SPA navigation
- [ ] Add compiler tests for cleanup-sensitive scenarios

### Status
⏸️ Pending

---

# Track 7 — UI Overlay Runtime

## Scope
- Build the packaged UI runtime that applies enhancements safely to the page.

---

## Phase 1 — Overlay root + toolbar + jump links

### Checklist
- [ ] Create overlay mount root
- [ ] Add toolbar executor
- [ ] Add jump links executor
- [ ] Add safe event binding for focus/scroll/click actions
- [ ] Add cleanup support for inserted nodes and listeners
- [ ] Ensure duplicate runs replace prior overlay cleanly

### Implemented files
- `apps/extension/src/content/executor.ts`
- `apps/extension/src/content/ui/overlayRoot.ts`
- `apps/extension/src/content/ui/toolbar.ts`
- `apps/extension/src/content/ui/jumpLinks.ts`

### Notes
- Keep first phase limited to assistive navigation UI.
- Avoid styling patches until phase 2.

### Verification (manual)
- [ ] Toolbar renders on eligible pages
- [ ] Jump links scroll to correct sections
- [ ] Duplicate overlays do not accumulate
- [ ] Cleanup removes UI correctly

### Status
⏸️ Pending

---

## Phase 2 — Theme patch + style patch runtime

### Planned checklist
- [ ] Add theme patch executor
- [ ] Add style patch executor
- [ ] Add token-to-CSS compiler
- [ ] Add semantic target resolvers
- [ ] Apply classes/style tags in reversible way
- [ ] Clamp and normalize runtime-applied tokens

### Status
⏸️ Pending

---

# Track 8 — Storage + Site Settings

## Scope
- Persist per-site and global state through `chrome.storage.local`.

---

## Phase 1 — Settings model + persistence

### Checklist
- [ ] Add global settings model
- [ ] Add per-site settings model
- [ ] Add storage read/write utilities
- [ ] Add enabled/disabled lookup by hostname
- [ ] Add mode resolution (global default + site override)
- [ ] Add last plan summary persistence

### Implemented files
- `apps/extension/src/shared/storage.ts`
- `apps/extension/src/shared/settings.ts`
- `apps/extension/src/shared/planSummary.ts`

### Notes
- Keep this phase storage-focused only.
- No popup UI logic should be mixed in here.

### Verification (manual)
- [ ] Global settings persist
- [ ] Per-site settings persist
- [ ] Plan summary is readable after page run
- [ ] Disabled sites skip enhancement pipeline

### Status
⏸️ Pending

---

## Phase 2 — Dismissals + execution memory

### Planned checklist
- [ ] Add dismissed enhancement tracking
- [ ] Add recent execution hash or plan signature
- [ ] Prevent unnecessary repeat application loops
- [ ] Add debug mode persistence
- [ ] Surface stored values to popup/options UI

### Status
⏸️ Pending

---

# Track 9 — Popup / Options Product UI

## Scope
- Build the user-facing extension controls for current site and global settings.

---

## Phase 1 — Popup product UI

### Checklist
- [ ] Build current-site status card
- [ ] Show enable/disable toggle
- [ ] Show mode selector
- [ ] Show last enhancement summary
- [ ] Add “remove enhancements” / rerun action
- [ ] Add planner status indicator

### Implemented files
- `apps/extension/src/popup/App.tsx`
- `apps/extension/src/popup/components/*`

### Notes
- Focus on MVP control surface only.
- Avoid adding advanced analytics or account UI.

### Verification (manual)
- [ ] Popup reads active tab hostname
- [ ] Toggle updates current site setting
- [ ] Mode changes persist
- [ ] Summary updates after successful run

### Status
⏸️ Pending

---

## Phase 2 — Options page + developer controls

### Planned checklist
- [ ] Add global defaults UI
- [ ] Add debug mode toggle
- [ ] Add planner/mock planner selection for local dev
- [ ] Add list of stored site overrides
- [ ] Add reset-to-defaults action

### Status
⏸️ Pending

---

# Track 10 — Route Changes + Lifecycle Stability

## Scope
- Make the enhancement pipeline stable on modern SPA-style pages and repeated navigations.

---

## Phase 1 — Rerun lifecycle + debounce

### Checklist
- [ ] Detect SPA route changes
- [ ] Add MutationObserver-based rerun trigger
- [ ] Debounce expensive reruns
- [ ] Cleanup prior execution before reapply
- [ ] Avoid planner double-execution on initial page load

### Implemented files
- `apps/extension/src/content/lifecycle.ts`
- `apps/extension/src/content/routeObserver.ts`

### Notes
- Keep this track focused on lifecycle behavior.
- Do not add new enhancement types here.

### Verification (manual)
- [ ] Rerun occurs on route change
- [ ] Previous UI is cleaned up before reapply
- [ ] Debounce prevents duplicate rapid runs
- [ ] Static pages are not reprocessed excessively

### Status
⏸️ Pending

---

## Phase 2 — Stability hardening + fallback handling

### Planned checklist
- [ ] Handle planner timeouts cleanly
- [ ] Skip rerun when DOM signature has not materially changed
- [ ] Recover from partial execution failures
- [ ] Add safe no-op path when page becomes ineligible
- [ ] Add lifecycle debug logs

### Status
⏸️ Pending

---

# Track 11 — Testing + Fixtures

## Scope
- Add test coverage and sample page fixtures for parallel validation of runtime behavior.

---

## Phase 1 — Unit tests for contracts, validator, compiler

### Checklist
- [ ] Add contract tests for shared types/schemas
- [ ] Add validator unit tests
- [ ] Add compiler unit tests
- [ ] Add token clamping tests
- [ ] Add selector validation tests with synthetic DOM fixtures

### Implemented files
- `packages/shared-types/test/*`
- `packages/validator/test/*`
- `apps/extension/test/compiler/*`

### Notes
- Keep first phase deterministic and fixture-based.
- Do not require real browser automation yet.

### Verification (manual)
- [ ] Test suite runs locally
- [ ] Invalid plans fail as expected
- [ ] Compiler snapshots are stable
- [ ] Token bounds behave correctly

### Status
⏸️ Pending

---

## Phase 2 — Manual QA fixtures + demo pages

### Planned checklist
- [ ] Add saved HTML/DOM fixtures for ugly legacy pages
- [ ] Add Craigslist-like fixture test case
- [ ] Add docs/article fixture
- [ ] Add admin/table-heavy fixture
- [ ] Add manual QA checklist per fixture

### Status
⏸️ Pending

---

# Track 12 — Release Packaging + Open Source Readiness

## Scope
- Prepare the public repo for community builds, docs, and release packaging.

---

## Phase 1 — Community build + docs

### Checklist
- [ ] Add production build pipeline
- [ ] Add release zip generation
- [ ] Add README setup and architecture links
- [ ] Add contribution guide
- [ ] Add public package boundaries documentation
- [ ] Add example mock planner demo instructions

### Implemented files
- `.github/workflows/*`
- `README.md`
- `CONTRIBUTING.md`
- `docs/architecture.md`
- `docs/contracts.md`

### Notes
- This phase is public-repo focused.
- Keep private/planner-specific instructions out of this repo.

### Verification (manual)
- [ ] Build artifact is generated
- [ ] Fresh clone setup works from docs
- [ ] Community demo works without private access
- [ ] Public docs match current code layout

### Status
⏸️ Pending

---

## Phase 2 — Chrome Web Store prep + maintenance scripts

### Planned checklist
- [ ] Add extension packaging versioning
- [ ] Add changelog flow
- [ ] Add store listing asset checklist
- [ ] Add repo maintenance scripts
- [ ] Add issue templates for bug reports and enhancement requests

### Status
⏸️ Pending
