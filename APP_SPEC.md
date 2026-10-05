# APP_SPEC.md

## 1. Product identity

- **Name:** Tap Counter
- **Version:** 1.0.1
- **Purpose:** Replace simple tally-counter apps with an installation-free, smartphone-first multi-counter that works entirely in the browser.
- **Primary users:** People counting visitors, inventory, repetitions, laps, events, observations, or any repeated item on a phone.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`

## 2. Core outcome

A user can create one or more named counters, increment them quickly with large touch targets, open one counter in a distraction-free full-screen tap mode, recover accidental taps with Undo, and keep all state on the device.

## 3. Core flow

1. Open the page and use the default counter immediately.
2. Tap a counter card to increment it.
3. Add and name additional counters when separate categories are needed.
4. Open a counter in Focus mode for full-screen counting.
5. Undo the most recent change if a tap was accidental.
6. Reset or delete counters only after in-app confirmation.
7. Copy or share a text summary when needed.

## 4. Functional requirements

- Default counter is available immediately on first load.
- Multiple named counters, up to 12.
- Large card tap target increments by one.
- Dedicated decrement and focus controls do not trigger an increment.
- Focus mode uses most of the screen as a +1 tap target.
- Focus mode includes decrement, undo, lock/unlock, and exit controls.
- Lock mode prevents count changes until explicitly unlocked.
- Global Undo restores the most recent increment, decrement, reset, add, edit, reorder, or delete action where practical.
- Card-menu Move up / Move down swaps one counter with its immediate neighbor. Native disabled controls prevent moving past an edge; both are disabled with one counter.
- The counter array is the single ordering source for cards, summaries, persistence, and Undo. Moves preserve counter fields and create exactly one Undo snapshot; invalid moves create none.
- A move closes the menu, restores focus to that same counter’s menu control, and announces its current position.
- The initial unnamed default counter retains its localized “Counter 1” identity after moves, reloads, and language changes without changing stored names or schema.
- Per-counter nonzero reset and delete use the reusable in-app confirmation pattern. Resetting an already-zero counter is a no-op without confirmation, timestamp changes, saves, or Undo history.
- Add / edit UI uses native `<dialog>` with mobile bottom-sheet behavior.
- Optional haptic feedback uses `navigator.vibrate()` only when supported and enabled; lack of support must not block counting.
- Optional Screen Wake Lock is requested in Focus mode when supported and enabled; failure must be silent except for a non-blocking status message.
- Copy summary always available; Web Share is progressive enhancement when supported.
- Counts and preferences persist in localStorage.
- Japanese and English UI in the same HTML.
- Light-only editor/dashboard; Focus mode may use a high-contrast dark presentation surface for functional visibility.
- No runtime network request.

## 5. Data and privacy

- Counter names, values, settings, and the local undo history remain in localStorage and memory only.
- No analytics, telemetry, accounts, remote APIs, or server-side storage.
- Sharing occurs only after an explicit user action through the browser share sheet or clipboard.

## 6. UX decisions

- Mobile-first from 320px upward.
- One-handed use is prioritized: primary tap target is large and increment feedback is immediate.
- Multi-counter cards remain compact enough to scan at a glance.
- Focus mode hides configuration and treats the screen as a physical tally counter.
- Undo is always visible because accidental taps are common in tally use.
- Lock is explicit rather than gesture-based so users understand why counting stopped.
- Haptics are optional because browser support is limited.

## 7. Browser target

Current stable Chromium, Firefox, and Safari on desktop and mobile.

Core counting, persistence, and Focus mode work via `file://`. Vibration and Screen Wake Lock are progressive enhancements and depend on browser/device support; Wake Lock may require HTTPS.

## 8. Accessibility

- Visible focus indicators.
- Every icon button has an accessible name.
- Keyboard operation: Enter/Space increment focused cards; Focus mode supports Space/Enter increment, Minus decrement, U undo, L lock, Esc exit.
- Count changes are announced through an `aria-live` region without flooding announcements during rapid tapping.
- Reduced-motion preference disables nonessential transitions.
- Destructive actions use in-app confirmation dialogs.

## 9. Acceptance criteria

- Both release HTML variants build successfully.
- No unresolved placeholders or external runtime assets.
- CSP contains `connect-src 'none'`.
- Default counter works with one tap after first load.
- Add, edit name/current value, reorder, increment, decrement, reset, delete, undo, lock, Focus mode, copy summary, and language switch work.
- An edit accepts only whole numbers from -999999 to 999999, changes name and value atomically, and creates one Undo entry. Invalid edits, cancellation, and unchanged saves do not change counters or Undo history.
- State survives reload when localStorage is available.
- A card's decrement/focus/menu controls never increment the counter accidentally.
- Rapid tapping does not select text or zoom the page unexpectedly.
- Japanese and English fit at 320px width without horizontal page overflow.
