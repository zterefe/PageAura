# Contributing to PageAura

Thanks for contributing to the public PageAura repository.

## Prerequisites

- Node.js 20+
- npm 10+

## Local setup

```bash
npm install
npm run build
npm run typecheck
npm run lint
```

## Development workflow

1. Create a feature branch from `main`.
2. Make focused changes in one track/phase at a time.
3. Run checks before opening a pull request:
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   npm run release:zip
   ```
4. Update docs when behavior, commands, or package boundaries change.

## Pull request checklist

- Scope is limited to a single planned phase.
- Public APIs/contracts are documented in `docs/public-package-boundaries.md`.
- Any user-facing setup changes are reflected in `README.md`.
- Community demo steps still run with the mock planner.
