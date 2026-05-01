# Manual QA Fixture Checklist (Track 11 / Phase 2)

This checklist defines repeatable manual verification steps for representative fixture archetypes.

## 1) Legacy/Classified fixture (`legacy-classified.json`)

- Fixture path: `packages/dom-snapshot/tests/fixtures/legacy-classified.json`
- Primary archetype: legacy/classified (Craigslist-like)

### Manual checks

- Confirm snapshot metadata title resolves to a classifieds-oriented page title.
- Confirm page type hints include `search`, `listing`, and `navigation`.
- Confirm actions include search control and at least one listing link.
- Confirm fixture can be re-run repeatedly with stable hint output.

## 2) Docs/Article fixture (`docs-article.json`)

- Fixture path: `packages/dom-snapshot/tests/fixtures/docs-article.json`
- Primary archetype: docs/article

### Manual checks

- Confirm page type hints include `article` and `content`.
- Confirm section extraction includes article heading text.
- Confirm docs links are represented as navigate actions.
- Confirm repeated runs keep identical metadata/actions/section shape.

## 3) Admin/Table-heavy fixture (`admin-table-heavy.json`)

- Fixture path: `packages/dom-snapshot/tests/fixtures/admin-table-heavy.json`
- Primary archetype: admin/table-heavy dashboard

### Manual checks

- Confirm page type hints include `form` and `listing`.
- Confirm action extraction contains bulk-action button and detail link.
- Confirm selectors remain deterministic across repeated runs.
- Confirm fixture supports runtime validation flow without browser automation.
