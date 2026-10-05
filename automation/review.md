# Dev-blog self-review: automate-email-replies-linux-ai

Reviewed 2026-10-05 using the project's `.agents/skills/dev-blog-review/SKILL.md`, its blog index/style playbook, the supplied MailKite contract, local SEO skill/matrix, `blog-reviewer.md`, editorial heuristics and two-tier prose diagnostics. This is a self-review, not an independent agent review. No subagents were spawned.

## Track and scope

Search/LLM tutorial/comparison. Primary intent: backend email reply automation on Linux; secondary inbound/agent surfaces from clusters C/D. No measured volume exists for this exact phrase in the inspected matrix; no new SERP metrics are claimed. The pillar retains broad server-selection intent, this page owns worker reliability and reply policy, and language-specific siblings own their implementation paths.

## Provisional score: 89/100

| Category | Score | Evidence and deductions |
|---|---:|---|
| Content quality | 28/30 | 1,610 earned words; specific adapters and failure behavior; original fault-injection findings; some instructional paragraphs still have similar cadence. Server adapters are paths, not implemented live integrations. |
| SEO optimization | 24/25 | Query-shaped title/slug/meta, clear description-as-intro, comparison table, pillar plus all four requested siblings, freshness date. Canonical/live sibling validation is pending. |
| E-E-A-T | 14/15 | Gabe attribution, same-breath build disclosure, primary citations, actual local test observations and disclosed limits. Final byline/bio rendering unverified. |
| Technical elements | 9/15 | Astro Markdown renders; responsive vertical SVG source and accessible descriptions; runnable exact dependency lockfile. Hero absent at review; full site build, theme/viewport readability, public CI and rendered metadata gates unverified. |
| AI citation readiness | 14/15 | Front-loaded conclusions; consistent server entities and mailbox-vs-event distinction; documented source freshness; static extractable table. Final crawler/canonical output unverified. |

Score is below the publication threshold. Do not round it up or infer that parent-owned assets/gates have passed.

## Contract gate

- PASS: description supplies who/what/result; body begins with a substantial visual and then code immediately, not a duplicated introduction.
- PASS: exactly two substantial inline vertical SVGs, currentColor styling, unique title/description IDs, responsive viewBox sizing. Astro render preserves both. This is source/render verification, not screenshot readability approval.
- PASS: both article code blocks map to executable demo source (`quickstart.sh`, `mailkite.mjs`). Installed SDK serialization tests pass. No invented terminal output or throughput numbers.
- PASS: SDK-first MailKite sample, full import/function; hosted management credentials distinguished from send keys and self-hosted admin routes.
- PASS: one platform-first disclosed recommendation arc; Dovecot/Postfix, Haraka, WildDuck, Stalwart and Postal include weaknesses and suitable use cases. DIY queue is implemented. No stock photography, TL;DR box, funnel copy or raw-first MailKite HTTP.
- PASS: intended companion URL appears at first snippet and closing. **Publication gate pending:** parent has not provided public repo/CI verification; links are future artifacts, not confirmed live.
- PASS: Ptacek test, useful to someone keeping Postfix/Dovecot or choosing another stack.
- BLOCK: missing generated hero at `/blog/og/automate-email-replies-linux-ai.png`; final image dimensions and canonical OG response have not been verified.

## Virality gate interpreted for the chosen track

The title is a direct search-intent promise, not an HN war-story title; that is deliberate track purity. Opening has concrete protocol/worker behavior. Alternatives and runnable artifacts are present. No contrarian narrative padding or invented experience. Deploy buttons are not supplied for a localhost-only, unauthenticated teaching receiver; parent can add a runnable sandbox after publishing the series repo. Do not imply a one-click production mail deployment.

## Prose diagnostics

`python3 audit.py` on final prose: TTR **0.452** (above 0.40); burstiness **0.497** (borderline warning under the >0.5 naturalness heuristic, above the <0.3 blocking range); scanned banned phrases **0**; em dashes **0**. One of seven H2s is a question. No “Here” opener repetition, capsule transitions, hedge stacking, wrap-up questions, or false-balance framing found in manual review.

Second-order warnings remain visible: paragraph word-count SD **18.55** (<25 heuristic), and **9** multi-sentence paragraphs have sentence-length SD below 4 under the simple splitter. These diagnostics are not proof of authorship. Editorial pass split two important caveats into short standalone paragraphs and combined the connected IMAP setup/IDLE procedure; source-backed technical explanations were retained rather than padded with rhetorical questions. Remaining cadence warnings are P3 polish, not described as a clean AI-detection pass. No attempt was made to claim human-only authorship.

## Editorial heuristic scores (0–4)

Intent 4; heading match 4; reader control 3; voice/standards 3; evidence integrity 4; recognition 3; skim/deep-reading 3; density 4; failure recovery 4; sources/related docs 3. Fork overrides apply: no mandatory summary box, question quota, fictional FAQ or stock assets. Search structure and original crash-window analysis carry the depth rather than pretending that six server stacks were deployed.

## Issues fixed during self-review

1. Corrected List-ID suppression after an actual failing test.
2. Added bounded crash-lease exhaustion and an explicit inherited-thread test.
3. Distinguished seconds Server signing from SDK hosted milliseconds without disabling freshness.
4. Documented Postal's immediate 5xx failure and labelled the generic intake as non-drop-in.
5. Disclosed that built-in self-hosted agents exist but are not a durable inference queue; their header-loop guard is prompt advice, unlike this demo's code.
6. Clarified one SQLite reply versus uncertain remote send acceptance; no exactly-once SMTP claim.
7. Recorded real-adapter review gating, conservative reverse-path reply destination, operator-owned headers, and model output validation.

## Parent handoff / blockers

P0: generate and verify the requested 1200×630 hero; publish the future series repo and prove its CI runs this directory's `npm ci` + `npm test`.

P1: run full website build and applicable code-health gate; inspect light/dark at mobile/tablet/desktop; verify internal/canonical/demo links and rendered Article/OG/Twitter metadata. Rerun the score after those gates. Keep `draft: true` until they clear. Refresh official interfaces by 2026-11-04 or upon upgrades.

BLOCKING: true (89/100 provisional; hero missing; parent public repo/CI, full build, visual and live metadata/link gates pending).
