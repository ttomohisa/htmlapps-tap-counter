# AGENTS.md — Tap Counter / Single HTML App Contract

Read `APP_SPEC.md`, `docs/ARCHITECTURE.md`, and the current `src/index.template.html` before editing.

## Non-negotiable constraints

- Produce `dist/index.html` and `dist/index.self-extract.html` as one-file release artifacts.
- Do not add runtime CDN, remote font, analytics, telemetry, remote API calls, or hidden network dependencies.
- Keep `connect-src 'none'` in the release CSP.
- Use browser-native APIs where practical. Third-party dependencies must be pinned and declared in `dependencies.json`.
- Smartphone and desktop layouts are first-class; smartphone UX is the priority for this product.
- Keep Japanese and English in the same HTML.
- Keep visible focus, labels / accessible names, sufficient contrast, and reduced-motion handling.
- Do not use generic emoji as primary UI icons; use inline SVG.
- Do not hand-edit generated `dist/` files. Edit source/config/build scripts and rebuild.
- Core counting and local persistence must work from `file://`. Vibration and Screen Wake Lock are progressive enhancements.

## Source organization

- Main editable source: `src/index.template.html`.
- Keep the three build placeholders exactly once: `__APP_CONFIG_JSON__`, `__BUILD_MANIFEST_JSON__`, `__EMBEDDED_ASSET_BUNDLE_BASE64__`.
- Keep `APP:BEGIN` / `APP:END` and `APP:HELP:BEGIN` / `APP:HELP:END` markers.
- Keep counter mutations and undo behavior explicit and auditable.

## Required verification

Run on Windows:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

Also verify rapid tapping and Focus mode on at least one real smartphone. Check that decrement/menu controls never trigger +1 accidentally, Undo works after rapid changes, and Lock prevents counting.
