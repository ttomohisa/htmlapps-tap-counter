# LLM Workflow

1. Read `AGENTS.md`, `APP_SPEC.md`, and `docs/ARCHITECTURE.md` before editing.
2. Edit source and configuration, not generated `dist/` files.
3. Preserve the one-file, no-runtime-network model.
4. Keep counter mutations explicit and add undo coverage for destructive changes.
5. Build and run `scripts/check-repository.ps1` on Windows PowerShell.
6. Test Japanese / English and narrow mobile widths.
7. For counting changes, test rapid tapping on a real smartphone and verify that adjacent controls never increment the count accidentally.
8. Treat vibration, Web Share, and Screen Wake Lock as progressive enhancements only.
