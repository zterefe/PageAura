# Release Operations: Versioning + Changelog Flow

## Versioning policy
- PageAura uses semantic versioning (`major.minor.patch`).
- The root package, extension package, and extension `manifest.json` must always share the same version.
- Run `npm run version:check` before creating release artifacts.

## Bump process
1. Pick the next semantic version.
2. Run `npm run version:bump -- <major.minor.patch>`.
3. Add release notes to `CHANGELOG.md` under `## [Unreleased]`.
4. If releasing, move notes from `Unreleased` into a versioned section:
   `## [x.y.z] - YYYY-MM-DD`.

## Changelog flow
- Keep all incoming changes grouped under `## [Unreleased]` until release cut.
- At release time:
  - convert grouped items into a dated version heading,
  - keep concise bullets by type (`Added`, `Changed`, `Fixed`, `Removed`),
  - commit changelog updates with the release version commit.

## Release command path
Run the end-to-end preflight and package steps:

```bash
npm run maintenance:release
```

This command validates versions, checks changelog structure, builds the extension, and generates the release zip.
