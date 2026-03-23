# PageAura MVP Design Plan

## Tech Stack
- Chrome Extension MV3
- TypeScript
- React (popup/options)
- Vite + CRXJS
- Shadow DOM UI injection
- chrome.storage.local

## System Layers

### 1. Snapshot Layer
Extract:
- actions
- sections
- layout
- visual metrics

### 2. AI Planning Layer
Input: snapshot
Output: enhancement plan

### 3. Validation Layer
Ensure:
- safe selectors
- bounded actions
- reversible operations

### 4. Compiler Layer
Convert plan → runtime ops

### 5. Runtime Layer
Apply:
- toolbar
- jump links
- style patches

## Enhancement Types (MVP)
- insert_toolbar
- jump_links
- theme_patch
- style_patch

## Execution Flow
```
DOM → Snapshot → AI Plan → Validate → Compile → Execute
```
