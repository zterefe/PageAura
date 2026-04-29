# Mock planner demo (public)

Use this walkthrough to validate the public community demo without private services.

## 1) Install and build

```bash
npm install
npm run build
```

## 2) Load extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `apps/extension/dist`.

## 3) Trigger the demo flow

1. Open `https://example.com`.
2. Open DevTools for the page.
3. Confirm content bootstrap logs are present.
4. Open extension popup and verify settings controls load.
5. Verify the mock planner path is used from `apps/extension/src/content/mockPlanner.ts`.

## 4) Validate release packaging

```bash
npm run release:zip
```

The command produces `release/pageaura-extension.zip` for community distribution.
