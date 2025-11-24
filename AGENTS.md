# Codex Guidance for Vanguard League Platform

## General
- Read `claude.md` (Session Runbook + Change Log) before making changes; honor redactions and keep secrets in Bitwarden/ENV vars (e.g., `WEBDAV_APP_PASSWORD`).
- Do not add plaintext credentials; reference env vars/secrets instead. If you encounter secrets in files, prompt to rotate and redact.
- Prefer minimal, low-risk commands first; avoid destructive scripts (delete/wipe) unless explicitly approved and double-confirmed.

## Frontend (Next.js)
- The homepage uses server-side data loading; keep fetches server-side/SSR/ISR where possible. If you add remote images, update `next.config.js` domains.
- When editing frontend code, you may run the dev server: `cd ~/vanguard-league-platform/frontend && npm run dev`. It can stay running unless it causes resource drag.
- Linting isn’t configured yet (Next.js prompts); ask before configuring new lint setups or adding dependencies.

## Documentation
- Update `claude.md` after significant changes; keep the canonical paths and change log current.
- If adding project norms, consolidate here and cross-reference from `claude.md`.
