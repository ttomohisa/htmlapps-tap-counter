# Components

`components/` contains source snippets, not runtime dependencies. The final release remains one HTML file.

## Confirmation dialog

Tap Counter uses an in-app confirmation dialog for reset and delete actions instead of `window.confirm()`.

The embedded implementation supports keyboard focus, `Esc` cancellation, backdrop cancellation, focus restoration, visible focus, and mobile-safe bottom-sheet layout.
