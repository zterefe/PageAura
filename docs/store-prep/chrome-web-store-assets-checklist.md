# Chrome Web Store Listing Asset Checklist

Use this checklist before every store submission.

## Core listing metadata
- [ ] Extension name and short summary reflect current release behavior.
- [ ] Full description is updated with any new capabilities or permissions.
- [ ] Category and language are accurate.
- [ ] Support URL points to the latest issue tracker or support page.
- [ ] Privacy policy URL is valid and public.

## Visual assets
- [ ] 128x128 extension icon (PNG).
- [ ] Small promotional tile (440x280).
- [ ] At least 1 screenshot at 1280x800 or 640x400.
- [ ] Optional large promo tile (920x680) if featuring is targeted.

## Compliance checks
- [ ] Permissions list in listing matches `manifest.json`.
- [ ] No private/internal data is present in screenshots.
- [ ] Store listing text matches behavior in current release ZIP.
- [ ] Version in listing matches packaged extension version.

## Packaging checks
- [ ] Run `npm run version:check`.
- [ ] Run `npm run build:extension`.
- [ ] Run `npm run release:zip`.
- [ ] Confirm release archive opens and includes `manifest.json` + compiled assets.
