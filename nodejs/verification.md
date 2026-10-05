# Verification · 2026-10-05

## Commands actually run

Working directory: `/Users/gabe/code/mailkite/demos/demo-linux-email-series/nodejs`.

| Command | Result |
|---|---|
| `npm view nodemailer version` etc. for all five packages | Registry returned nodemailer 10.0.14, smtp-server 3.19.17, mailparser 3.9.35, imapflow 2.2.5, mailkite 0.20.0; exact-pinned |
| `npm install --ignore-scripts --no-fund --no-audit` | Exit 0, 49 packages, generated package-lock.json |
| `npm ci --ignore-scripts --no-audit --no-fund` | Exit 0, clean lockfile install, 49 packages |
| `npm test` after clean install | Exit 0; 10 passed, 0 failed/skipped, ~744 ms total runner duration; not a performance claim |
| `npm start` after clean install | Exit 0; real loopback output in README; Unicode subject, separate envelope/header, decoded attachment |
| `for file in *.mjs *.cjs test/*.mjs; do node --check "$file" || exit 1; done` | Exit 0 |
| `node verify-content.mjs /Users/gabe/code/mailkite/web-monorepo/website/src/content/blog/linux-email-servers-nodejs.md` | Exit 0; four exact file/snippet matches; two SVGs; top visual; metadata 157 characters |
| `node --version` | v25.0.0 on macOS; Linux/Node 22 or 24 CI remains parent work |

From `/Users/gabe/code/mailkite/web-monorepo`:
`scripts/agent/code-health.sh website/src/content/blog/linux-email-servers-nodejs.md` exited 0. Markdown has no ESLint/typecheck coverage in this script; this is only a scoped gate/tool execution check, not a full website build.

## What tests establish

1. Actual SMTP socket exchange preserves envelope recipient independently from visible To, Unicode subject, plain body, multipart structure, attachment name and bytes.
2. Unknown recipient returns SMTP 550 without an accepted record.
3. Failed persistence callback returns 451 without an accepted record.
4. Oversized DATA returns 552 without an accepted record.
5. Injected IMAP client contract parses real generated MIME and releases its read-only lock after consumer failure.
6. Empty mailbox avoids fetching and releases the lock.
7. Published MailKite SDK emits the expected Cloud endpoint/auth/attachment request; global fetch is intercepted in that test.
8. Published SDK verifies fresh Cloud signature, rejects modified raw bytes, stale timestamp, and Server-style seconds timestamp.
9. Haraka-shaped VM confirms rcpt registration, DENY and continuation callbacks.
10. Postal injected-fetch contract checks endpoint/auth/body and rejects an application error even on HTTP 200.

No live external mail was sent. No live mailbox was read. Provider responses are explicitly fixtures. No Postfix, Exim, Dovecot, mailcow, Postal, WildDuck, ZoneMTA, Stalwart or Server installation was launched. Server compatibility findings are source inspection, not deployment certification.

## Content rendering and visual checks

Used the existing website's `@astrojs/markdown-remark@6.3.11` from a read-only import in `preview.mjs`; served rendered content only on 127.0.0.1:4319. No build outputs were written in the monorepo. Fresh owned Chrome DevTools tab (id 11), closed at completion; preview process stopped.

Inspected website `content.config.ts`, blog route and global figure/table rules. The original site figure padding would shrink diagram labels; fixed both figures with `class="tall" style="padding:8px"`. Preview mirrors figure sizing while remaining explicitly a content-only shell.

- 390px dark and light: both SVGs ~340.8px wide, smallest diagram labels ~15.15 CSS px, no document overflow. Screenshot-inspected both dark mobile diagrams and light acknowledgement diagram; text and arrows fit and retain contrast.
- 768px light: SVGs 480px wide; no document overflow.
- 1440px dark: SVGs 480px wide; no document overflow.
- Wide code/table scroll inside their own boxes in the preview; the website already has markdown-table containment rules.

This is NOT the full site 2 themes × 3 viewports gate. Parent still needs it against the actual Astro shell and cover. No published-route, OG metadata or production screenshot claim.

## Editorial diagnostics

`verify-content.mjs` strips figures, code, comments, and link destinations before counting; table text remains. It reports 1,549 English prose/table tokens, TTR 0.412, burstiness 1.243, zero matches in its small documented phrase list. Numbers and inline technical tokens are tokenized imperfectly; these metrics are diagnostics, not evidence of authorship. Manual full-list/structural review is in review.md.

## Outstanding parent gates

- Generate intentional 1200×630 `/blog/og/linux-email-servers-nodejs.png`; no asset created in this scope.
- Publish future repository URL and root Linux CI; verify README clone/install path and real public links.
- Run full website build and actual page visual checks (drafts are excluded by getStaticPaths).
- Confirm sibling publication, canonical, JSON-LD and OG image resolution before clearing draft.
- Re-review after these steps; current draft remains blocked.
