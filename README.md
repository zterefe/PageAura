# PageAura

Public monorepo for the PageAura MVP.

## Workspace layout

- `apps/extension`: Chrome Extension (MV3) TypeScript scaffold
- `packages/shared-types`: shared contract package scaffold
- `packages/dom-snapshot`: DOM snapshot package scaffold
- `packages/validator`: validation package scaffold

## Quick start

```bash
npm install
npm run build
npm run lint
npm run typecheck
```

## Local Development Setup for Extension

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Common commands

```bash
npm run build
npm run build:extension
npm run dev:extension
npm run typecheck
npm run lint
```

### Load extension in Chrome

1. Build extension assets:
   ```bash
   npm run build:extension
   ```
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select `apps/extension/dist`.

### Startup verification workflow (Phase p1)

1. Load the unpacked extension from `apps/extension/dist`.
2. Open any HTTP/HTTPS page (for example `https://example.com`).
3. In the page DevTools console, verify the content bootstrap log appears.
4. In `chrome://extensions`, open **Service Worker** (Inspect views) for PageAura and verify the bootstrap message log appears.
5. Confirm the content script log includes a response payload from the service worker (`ok: true`).

### Environment variables

1. Copy `.env.example` to `.env`.
2. Update values for your local environment.
