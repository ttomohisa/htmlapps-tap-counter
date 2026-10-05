# Architecture

Tap Counter follows the `htmlapps-template` repository model.

```text
app.config.json
APP_SPEC.md
dependencies.json
src/index.template.html
build-standalone.ps1
scripts/build-self-extract.ps1
scripts/verify-standalone.ps1
scripts/check-repository.ps1
dist/index.html
dist/index.self-extract.html
```

## Runtime

The release is one HTML document. Counter cards, Focus mode, local persistence, undo history, translations, dialogs, vibration feedback, Web Share / Clipboard integration, and optional Screen Wake Lock are implemented inline. No third-party package is currently embedded.

The CSP blocks runtime network connections with `connect-src 'none'`.

## State model

Each counter has an ID, display name, integer count, creation timestamp, and update timestamp. Up to 12 counters are stored.

The Edit counter dialog preloads the current name and value. A validated name/value edit is one atomic mutation and creates one Undo snapshot. Unchanged saves and canceled or invalid edits do not mutate state, timestamps, or history.

Before a mutating action, the current counter array is copied into a bounded undo stack. Undo restores the previous snapshot. The stack is deliberately limited to keep localStorage small and predictable.

The array order is also the dashboard and summary order. Menu moves swap immediate neighbors after one existing Undo snapshot, without changing IDs, names, counts, or timestamps. Persistence and Undo need no new fields. The initial `default` ID with an empty stored name resolves to the localized “Counter 1” regardless of position. After rerendering a move, focus is restored by counter ID to its new menu button; the delayed announcement resolves the current position so an immediate Undo cannot announce a discarded position.

Per-counter reset checks for zero before requesting confirmation. A no-op reset preserves timestamps, storage, and the last meaningful Undo snapshot. Nonzero resets retain confirmation and one Undo.

Focus mode updates only its visible count and summary state during rapid tapping. The dashboard cards are rendered again when Focus mode closes, avoiding unnecessary DOM work on every tap.

## Progressive browser capabilities

- Vibration feedback uses `navigator.vibrate()` only when available and enabled.
- Screen Wake Lock is requested only while Focus mode is open and the setting is enabled.
- Web Share is used when available; otherwise the summary falls back to clipboard copy.
- Core counting does not depend on these capabilities.

## Persistence

Counters, preferences, and bounded undo history are serialized to localStorage when available. Storage failure is tolerated; the current session remains usable.

## Build placeholders

`src/index.template.html` contains exactly one of each:

- `__APP_CONFIG_JSON__`
- `__BUILD_MANIFEST_JSON__`
- `__EMBEDDED_ASSET_BUNDLE_BASE64__`
