# Self-review: Linux email servers with Node.js

2026-10-05 · local dev-blog-review workflow · search/LLM reference tutorial.
Reviewed the Markdown, Astro-rendered content preview, actual demo files and test results. This is a self-review, not an independent agent review.

## Score: 89/100 — useful draft, publication blocked

| Category | Score | Max | Reason |
|---|---:|---:|---|
| Content quality | 28 | 30 | Correct protocol/job comparison; real SMTP/MIME round trip; specific failure behavior. Production IMAP synchronization and vendor deployments are outside the tested scope and identified as such. |
| SEO | 24 | 25 | Keyword-oriented title/slug/intro, 157-character meta, five descriptive pillar/sibling links, official citations, dated refresh plan. Published canonical/link integrity unverified. |
| E-E-A-T | 14 | 15 | Gabe attribution, same-breath affiliation, sources fetched, actual runnable evidence. No live production experience or server installation claims invented. Shared author/site trust presentation still a parent page check. |
| Technical | 10 | 15 | Exact-pinned dependencies and lockfile, ten passing tests, exact code blocks, accessible vertical SVGs. Required cover missing; published repo/CI and full Astro/mobile/meta gates pending. |
| AI citation readiness | 13 | 15 | Static Markdown, consistent entities, extractable boundary comparison, direct section answers. No fabricated FAQ for scoring; live crawl/page availability not verified. |

89 is the current deliverable score, not a conditional pass. Asset/publication work must earn a new review score rather than an assumed increase.

## Contract gate

- Marketing smell: pass. No superlatives, urgency, signup funnel, or unearned performance claims.
- Buried lede / duplicated intro: pass. Description supplies scope and outcome; first body element is the boundary figure followed by actual loopback code.
- Top visual / ≥2 visuals: pass at content level. Both built, substantial, vertical, titled/described SVGs. Mobile screenshot inspection and geometry in verification.md. Full-site gate pending.
- Late code: pass. First code immediately follows the top figure; no body-prose runway.
- Disclosure and alternatives: pass. Table labels both MailKite entries “ours”; single recommendation arc explicitly says “which we build” after DIY substance, with Postfix/Dovecot and Postal alternatives.
- Fictional evidence: pass. All four blocks exactly equal demo files. Actual output is recorded in README. SDK/Postal responses explicitly fixtures; no external-send claims.
- SDK-first: pass. Hosted example uses the current published SDK; signature verification uses its helper. No hand-rolled verification in application samples; test-only fixture signing is appropriate test setup.
- Stock photo / TL;DR box: absent, as required.
- Companion artifact: URL supplied early and at end. **P0 publication hold:** future public repository and root CI not verified.
- Track purity / Ptacek test: pass. Answer-first reference, technical comparison and limitations; useful to someone choosing other software. No manufactured war story.

## HN gate applied to the chosen track

Track blend, fluffy hook, missing alternatives, wrong voice: clear. Search-track title/coverage is deliberately a protocol reference, not a contrarian HN essay. Depth comes from envelope/MIME receiving and acknowledgement failures. No claim of HN virality performance. Future public companion artifact remains blocked.

## Ordinal editorial review

| Heuristic | /4 | Finding |
|---|---:|---|
| Intent visibility | 4 | Specific description; immediate demo |
| Heading/content match | 4 | Section openers answer their headings |
| Reader control | 3 | Skimmable table and headings; actual site TOC not checked |
| Voice consistency | 3 | Direct technical prose; no invented first-person experience |
| Fabrication prevention | 4 | Official docs plus source inspection, all test boundaries explicit |
| Recognition over recall | 3 | Comparison table and named APIs; prerequisite server setup remains reader work |
| Skim/deep flexibility | 3 | Decision table plus executable seam examples |
| Density | 3 | Approximately 1,550 prose/table words; no invented FAQ |
| Failure recovery | 4 | 550/451/552 checks, cleanup, JSON status handling, timestamp mismatch |
| Sources/help | 3 | Official URLs and source ledger; parent verifies public assets |

## Two-tier prose diagnostic

First-order: automated limited-list matches zero; manual full reviewer list found no marketing/AI trigger phrases or stylistic em dashes. TTR 0.412, burstiness 1.243 under the disclosed tokenization; neither hits the blocking threshold. Not an authorship detector claim.

Second-order manual pass: headings are statements, not question-cadence scaffolding; no “Here” runway or capsule-transition sequence; no repeated wrap-up questions, “key insight” openers or hedge stacks. Table cells are terse by design, not padded symmetric bullets. Technical paragraphs have some short, parallel sentences; retained for clarity instead of forcing artificial variation. No systemic structural blocker identified.

## Issues fixed during self-review

1. Refused broad Cloud/Server parity: inspected actual current routes and hosted-only field rejection.
2. Flagged Server seconds signature versus Cloud milliseconds; wrote an actual rejection test and named receiveCloud accordingly.
3. Reduced figure padding to avoid the site's figure card shrinking mobile labels; verified ~15.15px minimum at 390px.
4. Recorded mock versus live scope and avoided presenting callback-contract tests as daemon deployments.
5. Corrected guessed 404 documentation URLs through official documentation navigation; rejected URLs recorded, successful sources cited.

## Publication fix list

P0 / parent: create post-specific cover, publish companion repository, run root Linux CI, verify actual site build/2-theme × 3-width rendering/canonical/OG and sibling routes. Do not clear draft before these gates pass. Full-site build was not run because generated site/cache outputs would exceed owned paths; Astro Markdown content rendering passed independently.

P2 / future refresh: if this becomes an IMAP worker recipe rather than a boundary tutorial, add durable incremental UID checkpoints, reconnection and live Dovecot CI. Current scope explicitly makes no such promise.

BLOCKING: true (score 89/100; parent-owned cover, public repository/CI, full-site asset/link/render verification pending).
