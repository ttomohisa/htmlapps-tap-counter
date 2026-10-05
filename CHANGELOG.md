# Changelog

## Unreleased

- Added Japanese/English Move up and Move down menu actions with saved summary order, one Undo per move, edge disabling, focus restoration, and position announcements.
- Kept the unnamed initial counter’s localized identity stable after reordering without changing stored names or the data schema.
- Fixed already-zero resets consuming Undo history and changing timestamps; real resets still require confirmation.
- Added behavioral regressions for ordering, boundaries, reload, interleaved edits/counts/deletion, default names, storage failure, and reset cancellation.

- Added direct editing of a counter’s name and current value, with integer validation and one Undo for the complete edit.
- Kept canceled and unchanged edits out of Undo history.
- Added dependency-free behavior tests and synchronized the root HTML distribution during builds.

## 1.0.1 - 2026-08-27

- Changed vibration feedback to default off, including migration from the v1.0.0 default.
- Improved supported-device vibration reliability by triggering feedback earlier in the tap handler and using a clearer short pulse.
- Fixed the missing dot in the header Help icon.
- Renamed the local-processing badge to "完全ローカル処理" / "Fully local processing".
- Improved summary sharing fallback so unsupported or failed native sharing quietly falls back to copying the summary.

## 1.0.0 - 2026-08-17

- Initial release of Tap Counter.
- Added up to 12 locally stored named counters.
- Added full-screen Focus mode with large tap target, decrement, undo, and lock.
- Added global undo, reset/delete confirmation, copy/share summary, optional haptics, and optional Screen Wake Lock.
- Added Japanese/English UI and self-contained standalone builds.
- Refined the desktop grid to use horizontal space better while preserving the compact mobile layout.
