# Security and privacy

Tap Counter is designed as a local-only browser utility.

- Counter names, values, preferences, and local undo state are stored only in the browser when localStorage is available.
- The app does not make runtime network requests, create accounts, or send analytics/telemetry.
- The generated HTML uses a restrictive Content Security Policy with `connect-src 'none'`.
- Clipboard and Web Share are used only after an explicit user action.
- Vibration and Screen Wake Lock are optional browser capabilities. They do not transmit counter data.

If you find a security problem, please report it privately to the repository owner rather than publishing sensitive details immediately.
