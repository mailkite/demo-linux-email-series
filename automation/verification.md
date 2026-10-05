# Verification record

Executed 2026-10-05 on macOS, Node v25.0.0. Target runtime is Linux with Node >=22.13.0; no Linux host or internet mail-server deployment was exercised. Node printed its SQLite experimental-feature warning; it did not fail the run.

## Commands and actual results

From `automation/`:

1. `npm install --ignore-scripts --no-audit --no-fund`: installed 29 packages, generated package-lock.json with exact direct versions.
2. Initial `npm test`: 10/11 passed. List-ID suppression failed because Mailparser's parsed map reorganizes list headers. Fixed the guard to inspect original header lines.
3. `npm test && npm run demo && npm run demo`: 11/11 passed at that revision; both demo runs printed identical persisted totals. Three jobs: done (1 attempt), suppressed (0 attempts), review (1 attempt). Exactly one local reply. Actual output included `inReplyTo: <ticket-42@example.com>`, References root + parent, Auto-Submitted auto-replied, deterministic reply Message-ID.
4. Added meaningful crash-exhaustion and inherited-thread/invalid-model-output checks.
5. `npm ci --ignore-scripts --no-audit --no-fund && npm test`: clean lockfile install, **13/13 passed**, no skipped/cancelled tests. Requests were loopback only.
6. `python3 audit.py`: **1,610 earned words** excluding code, SVG and comments; two code blocks mapped verbatim to source; two SVGs; first body element a figure. TTR 0.452; burstiness 0.497; zero scanned trigger phrases or em dashes. See review for structural warnings. Accepts a post path as an argument in other checkouts.
7. `node render-check.mjs /Users/gabe/code/mailkite/web-monorepo/website /Users/gabe/code/mailkite/web-monorepo/website/src/content/blog/automate-email-replies-linux-ai.md`: **passed** with the parent's installed Astro Markdown renderer: two SVGs, two code blocks, seven H2s, both accessibility labels preserved. In-memory render only, no site output files.
8. `git diff --check -- website/src/content/blog/automate-email-replies-linux-ai.md` in web-monorepo: exit 0; article is untracked, so this is not a substitute for renderer/snippet checks.
9. Final `python3 audit.py` and `render-check.mjs` rerun after the citation edit: same passing counts and diagnostics. `node --check cli.mjs`: exit 0. `npm run work`: exit 0, preserved the existing done/suppressed/review jobs and one reply without producing another local reply.

## Test coverage

- HTTP 200 only after successful persistence; a storage exception yields 503.
- Close/reopen queue, replay same ID, no second local reply.
- Header-driven loop prevention before inference, including duplicate Auto-Submitted, parameters, lists, null/self envelope senders.
- Validated draft survives sink failure/reopen; backoff honored without a second model invocation.
- Five failed attempts produce a visible dead job; repeated abandoned leases also exhaust.
- Concurrent worker claim and expired-lease fencing prevent stale output.
- Review remains held until explicit approval; recipient-selection output is rejected.
- MIME Message-ID isn't a dedupe key; missing parent does not invent threading; References falls back to inherited In-Reply-To.
- Real-model adapter chat-completions wire format against an HTTP fixture, no actual inference.
- Published MailKite SDK route/send serialization against a contract fixture; this did not create a real route or send email.
- Hosted SDK signature accepts correct bytes and rejects tampered/stale/seconds-timestamp fixtures.

## Boundaries and remaining gates

The proof is local raw-MIME HTTP intake → real parser → SQLite queue → fixture decision → transactional local reply payload. It is **not** SMTP-to-internet-to-inbox validation, server deployment conformance, a deliverability benchmark, or proof of real-model answer quality. Fixtures reproduce contracts, not remote product execution.

Full website build/code-health, post-specific generated hero, repository publication/CI, link/canonical/OG checks, and two-theme × three-viewport screenshot inspection remain with the parent. A full site build was not run here because it generates files outside the two owned paths. The in-memory Markdown check verifies parse/render structure, not the site's final CSS or layout.

All writes belong to the owned article or automation directory. npm's node_modules and the demo SQLite file are ignored artifacts inside automation. No commits, pushes, deployments or live email sends were performed.
