# Local Development Setup

## Prerequisites

- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

## Common commands

```bash
npm run build
npm run build:extension
npm run dev:extension
npm run typecheck
npm run lint
```

## Load extension in Chrome

1. Build extension assets:
   ```bash
   npm run build:extension
   ```
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select `apps/extension/dist`.

## Environment variables

1. Copy `.env.example` to `.env`.
2. Update values for your local environment.
