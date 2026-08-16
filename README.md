# Tap Counter

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-tap-counter/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-tap-counter/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-tap-counter/)

[日本語版 README](README.ja.md)

A smartphone-first tally counter that runs entirely in one HTML file. Create multiple counters, tap quickly in Focus mode, undo mistakes, and keep your data on the device.

## Features

- Up to 12 named counters
- Tap a large card to increment
- Full-screen Focus mode for one-handed counting
- Decrement and global Undo
- Lock mode to prevent accidental changes
- Reset and delete confirmation
- Copy summary and Web Share when supported
- Optional vibration feedback when supported
- Optional Screen Wake Lock in Focus mode when supported
- Local persistence with no account or runtime network request
- Japanese / English UI

## Quick start

Open `dist/index.html`, or publish the repository with GitHub Pages. The default counter is ready immediately.

1. Tap a counter card to add one.
2. Use **Add counter** for categories such as Adults / Children / Cars.
3. Open **Focus** for a full-screen tally surface.
4. Use **Undo** if a tap was accidental.
5. Copy or share the summary when finished.

## Privacy

Counter data stays in the browser. The app has no analytics, account, or server-side storage. Sharing occurs only when you explicitly choose Copy or Share.

## Browser notes

Core counting works without special permissions. Vibration support varies by browser/device. Screen Wake Lock is optional and may require HTTPS.

## Build

On Windows, run:

```bat
build-standalone.bat
```

Then verify with:

```powershell
.\scripts\check-repository.ps1
```

Generated files:

- `dist/index.html`
- `dist/index.self-extract.html`

## License

Copyright © 2026 ttomohisa

Licensed under the [MIT License](LICENSE).
