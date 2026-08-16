# Offline verification

Tap Counter is built as a single self-contained HTML file with no runtime network dependency.

## Verify

1. Run `build-standalone.bat` or `build-standalone.ps1`.
2. Run `scripts/check-repository.ps1`.
3. Open `dist/index.html` directly.
4. Add counters, change values, reload, and confirm local persistence.
5. Open Focus mode and verify that counting still works without a network connection.
6. Optionally inspect DevTools Network and confirm that the app makes no runtime request.

Vibration and Screen Wake Lock are progressive enhancements and can vary by browser/device. Core counting does not depend on them.
