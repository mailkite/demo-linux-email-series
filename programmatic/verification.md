# Verification — 2026-10-05

Runtime used: Node **v25.0.0**, macOS. Declared minimum Node >=22.13; not independently tested on Node 22 or Linux. This uses cross-platform Node libraries, but no Linux daemon installation or deliverability benchmark is claimed.

## Executed commands and observed results

In `programmatic/`:

1. `npm install --ignore-scripts` — installed 31 packages; audit 0 vulnerabilities. Generated lockfile.
2. `npm run demo` — passed. Real output:
   - `SMTP accepted: ticket+42@example.com`
   - `SQLite stored: Invoice question`
3. `npm test` — **3 passed / 0 failed**.
4. Clean repeat: `npm ci --ignore-scripts && npm run demo && npm test` — passed again; 0 vulnerabilities, same output, 3 tests green.
5. `node --check` on `inbox.mjs`, `demo.mjs`, `start.mjs`, `sdk-send.mjs`, `webhook.mjs`, `test/boundaries.test.mjs` and `inspect-post.mjs` — all passed.

Node emitted its SQLite experimental warning. Runtime duration is not a performance claim. Tests never send outside loopback and use no live credentials.

Coverage:
- Unknown RCPT produces 550 at RCPT TO; no row is created.
- Accepted envelope recipient differs from To header, verifying envelope routing.
- MIME fixture has Unicode subject, text/HTML parts and an attachment; parsed subject/text and raw bytes asserted.
- Persisted row survives closing and reopening SQLite.
- Actual `mailkite@0.20.0` SDK serializes POST `/v1/send` with bearer auth; fixture hands it to actual local SMTP; SQLite content and SDK response asserted.
- SDK verification passes valid signature and rejects body-byte alteration, wrong secret and stale timestamp.

Limits: no real MailKite Server or Cloud instance exercised; the loopback HTTP server is explicitly a contract fixture. No production worker, webhook retry scheduler, outbound MX delivery, or internet ports are tested. Storage-error 451 branch is documented but not fault-injected in this suite.

In `/Users/gabe/code/mailkite/web-monorepo`:

- `scripts/agent/code-health.sh website/src/content/blog/programmatic-linux-email-servers.md` — passed; scoped Markdown gate (does not lint this external demo's JavaScript).
- In `website/`, `npm run build` — passed. Draft synced and excluded from published routes as intended. Existing unrelated duplicate-ID warnings for inbound-email-api/send-email-api/transactional-email-services, Cloudflare sharp/node built-in notices, and a large client chunk warning appeared.
- Code health repeated after typography changes — passed. Website build occurred before those prose/SVG-only changes; isolated renderer subsequently rendered final Markdown successfully.

## Snippet and editorial checks

`inspect-post.mjs` imports the website's installed Astro Markdown processor, compares both JavaScript article blocks exactly against the demo files (excluding doc-link comments), prints bounded diagnostic metrics and serves an isolated preview. This optional script requires the website renderer path; it is not a runtime dependency of the public demo.

Command:

```sh
node inspect-post.mjs /Users/gabe/code/mailkite/web-monorepo/website/src/content/blog/programmatic-linux-email-servers.md /Users/gabe/code/mailkite/web-monorepo/website/node_modules/@astrojs/markdown-remark/dist/index.js
```

Results: 1,693 prose words excluding SVG text/code/frontmatter (including table/captions), TTR 0.4395, approximate sentence burstiness 0.9268, paragraph SD 19.7132, 2 SVGs, 3 code blocks, 157-character meta description. JavaScript block equality passed. Metrics tokenize technical punctuation heuristically; these are editorial diagnostics, not authorship detection.

## Visual checks

Used a new owned Chrome tab with the isolated Astro-rendered draft (not the production layout), then closed it. Inspected at **375×900, 768×1024, 1440×1000**, light and dark. Saved screenshots in `preview/`; manually read mobile dark top, mobile light retries and desktop light images. Enlarged SVG labels and shortened crowded sentences after the first mobile pass.

DOM assertions: first article element FIGURE; 2 SVGs; no SVG text extends beyond the right content boundary; document scrollWidth equals viewport width at all three measured widths. SVG dimensions at 375: 327×371 and 327×390; at tablet/desktop: width 520. Code/table overflow remains contained within their scrolling elements. No interactive content is introduced, so no keyboard interaction or motion behavior is claimed.

Parent must verify actual production-layout styling, the custom cover and canonical og:image, sibling routes and public repository/CI. This isolated preview does not substitute for those gates. No git commit, push, account mutation or deployment was performed.
