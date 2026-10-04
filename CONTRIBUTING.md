# Contributing

Bug reports and focused feature proposals are welcome.

Before submitting a change:

1. Keep the application single-HTML and local-first.
2. Do not add runtime network dependencies.
3. Preserve Japanese and English UI.
4. Keep smartphone use as a first-class experience.
5. Run `node --test tests/*.test.cjs` with Node.js 24 or later. No npm install is needed.
6. Run `scripts/check-repository.ps1` on Windows PowerShell before submitting. This builds and verifies both release variants and refreshes the root `tap-counter.html` distribution copy.
7. Verify rapid tapping, Focus, Lock, and the Edit dialog on a real smartphone; the Node DOM adapter does not test native browser validation or layout.
