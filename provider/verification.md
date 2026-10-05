# Verification, 2026-10-05

## Commands executed and actual results

Working directory: `demos/demo-linux-email-series/provider/`.
Runtime used: Node `v25.0.0`. Minimum declared Node >=22.13.0 was not separately tested.

1. `npm install --ignore-scripts`: installed exact dependencies and generated local
   lockfile; 26 packages added, 0 vulnerabilities reported.
2. `npm run check`: source syntax passed.
3. `sh quickstart.sh`: clean `npm ci`, all 7 tests passed, offline demo completed.
4. `node verify-post.mjs /Users/gabe/code/mailkite/web-monorepo/website/src/content/blog/build-email-provider-linux-mailkite.md /Users/gabe/code/mailkite/web-monorepo/website/node_modules/@astrojs/markdown-remark/dist/index.js`:
   both article code blocks exactly match runnable demo files; 1,795 prose tokens
   (alphabetic word counter, code/SVG excluded), 2 built visuals, top visual confirmed.
   Rendered with the website's installed Astro Markdown processor into `preview/index.html`.
5. From the monorepo, `scripts/agent/code-health.sh website/src/content/blog/build-email-provider-linux-mailkite.md`:
   passed. Markdown isn't linted/typechecked by this gate; it ran the advisory Keel check.
6. `git diff --check -- website/src/content/blog/build-email-provider-linux-mailkite.md`:
   exit 0. File is new/untracked, so snippet/render checks supply its substantive validation.

Actual offline demo output (fixture; no real email):

    {"first":"accepted","duplicate":"accepted","providerId":"msg_offline","httpRequests":1}

## Meaningful offline coverage

Seven tests cover SDK URL/method/Bearer/body serialization; duplicate concurrent calls
and persisted identity after DB reopen; tenant/account mismatch before send; account and
UIDVALIDITY identity partitions; disconnect after request receipt; explicit rejection;
malformed acknowledgement; missing UID lock release; and durable crash-held `sending`.
Some tests cover multiple invariants. No mocking of the SDK's send method in the HTTP
boundary cases. IMAP is simulated; the crash test deliberately supplies a fail-on-use
sender to establish that an existing claim never retries.

## Browser inspection

Created and closed only an owned Chrome DevTools tab for the local rendered preview.
Inspected 375, 768, and 1440 CSS-pixel widths in light and dark mode. Screenshots read
visually: labels legible, no clipped SVG text, both diagrams visible, no page overflow.
At 375px, content/diagram width 327px; SVG heights 506px and 475px; smallest rendered
diagram label about 15.57px. At 768px, diagrams cap at 520px wide (805px/755px tall).
DOM check confirms first figure immediately followed by a `pre` code block. No text
bounding box extended beyond the SVG viewBox. Saved examples in `preview/mobile-light.png`
and `preview/desktop-dark.png` (ignored generated artifacts).

This is a component-scoped preview with minimal theme CSS, not a full website build,
production page, or measured Core Web Vitals audit. The actual Astro layout, inherited
schema, canonical, OG image, and internal links remain parent integration gates.

## Snippet map

| Article block | Runnable file | Verification |
|---|---|---|
| Opening shell | `quickstart.sh` (entire file) | Executed; literal parity check |
| Live IMAP/SDK entry | `live.mjs` (entire file) | Syntax; literal parity; called adapter tested offline |

## Publication handoff

- Parent generates `/blog/og/build-email-provider-linux-mailkite.png`; not generated here.
- Parent publishes shared repo and CI; all GitHub demo paths are future URLs.
- Parent validates pillar/sibling links after the coordinated batch is available.
- Parent runs full website build, real-layout 2-theme/3-width gate, canonical/OG checks.
- Live Dovecot TLS/credentials, actual DNS verification and real outbound delivery weren't
  exercised. README documents the live path; no interoperability/delivery claim is made.
- No commit, push, deployment, account mutation, actual email send, or spawned agents.

All authored files are inside the assigned provider directory or the one assigned post.
