# Dev-blog review: build-email-provider-linux-mailkite

Reviewed 2026-10-05 against local `.agents/skills/dev-blog-review/SKILL.md`,
MailKite contract, chosen MailKite dev-blog/search-LLM style, reviewer 100-point rubric,
editorial heuristics, and two-tier language/structure lint. Self-review performed inline
because the user explicitly prohibited spawned agents. This is not an independent review.

## Score breakdown

| Category | Score | Rationale |
|---|---:|---|
| Content quality | 28/30 | Specific architectural comparison and tenant/retry invariants; runnable adapter; doesn't install an entire mail hosting service |
| SEO optimization | 23/25 | Intent-specific title/slug, descriptive meta, answer-first sections, comparison, pillar and four siblings; no measured demand for this exact long tail; future links need resolution |
| E-E-A-T | 14/15 | Named author, disclosed affiliation, official sources plus pinned local source inspection; limits of offline evidence stated |
| Technical elements | 8/15 | SDK parity and local render verified; two accessible responsive SVGs pass component inspection; hero, real-layout schema/OG/canonical and public CI unverified |
| AI citation readiness | 14/15 | Explicit responsibilities, self-contained answers, comparison table and definitions; current-source date and next refresh; no invented FAQ |
| **Current total** | **87/100** | Below publication floor because external delivery gates remain open |

Conditional technical score after parent verifies hero/repo/real-site metadata and rendering:
14/15, yielding 93/100. That is a target, not a passed score or publication approval.

## Contract and virality gates

- **Pass:** specific lead supplies audience/job/end state; body begins on architecture
  visual rather than repeating description; working shell immediately follows figure.
- **Pass:** two substantial vertical SVGs, 20–24 viewBox text units, responsive width,
  accessible titles/descriptions; no stock illustration or decorative chart.
- **Pass:** both blocks literally match runnable demo files; real fixture run labelled
  offline, no invented SMTP test, latency, deliverability number, or operator anecdote.
- **Pass:** SDK-first cloud sample; no raw MailKite HTTP client or fabricated self-host
  SDK interchangeability. Internal edge ingest isn't advertised as public cloud import.
- **Pass:** one bounded, disclosed recommendation after provider architecture; alternatives
  Postfix, ZoneMTA and Postal are substantive; DIY boundaries remain visible.
- **Pass:** search/LLM track is consistent; no contrarian narrative padding, corporate
  register, TL;DR box, invented FAQ, or HN title quota forced onto this track.
- **Pass:** Ptacek test: useful tenant, DNS, store and failure guidance independent of vendor.
- **Pending P0 delivery gate:** future public companion links and parent CI aren't yet
  verified. Shared repo/CI and launch assets are parent-owned per explicit user scope.
- **Pending P0 image gate:** required generated editorial hero not owned by this task.

## Findings fixed before this review

1. Removed inaccessible/private monorepo GitHub source citation (actual fetch 404), replacing
   it with explicit local-source inspection notes linked through the future demo.
2. Made the retry SVG self-contained with its own marker ID rather than referencing
   another SVG's definitions.
3. Clarified that SVG failure boxes are alternate outcomes, not a linear retry sequence.
4. Explicitly separated local ledger `accepted` from provider status and recipient delivery,
   and called out the self-host pipeline's missing-smarthost external nondelivery behavior.
5. Preserved tenant/account/UIDVALIDITY isolation in executable tests; incoming message
   headers never select outbound authority or destinations.

## Language and second-order structure diagnostic

`editorial-metrics.json`: 1,795 words, TTR 0.416, sentence burstiness 0.905, zero phrases
from the implemented banned-register scan. The counter excludes code/SVG and keeps
table/caption text; these are editorial diagnostics, not authorship detection claims.

Manual structural pass: statement H2s, no repeated Here-openers, no hedge stacking,
no repeated false-balance/wrap-up questions, no transition-led capsule pattern, no
three-clause metronome, no symmetric numbered-list padding. The comparison table is
necessarily parallel and is not treated as prose repetition. Short declarative paragraphs
and recurring mail-domain vocabulary remain appropriate for a technical reference;
word substitution to manipulate the metrics would reduce precision.

## Editorial heuristics (0–4)

Intent 4; heading/content match 4; reader control 3 (jump links and self-contained sections);
voice consistency 3; fabricated-evidence prevention 4; recognition over recall 4;
skimmer/deep-reader flexibility 3; density 3; failure recovery 3 (conservative held-state
demo, production reconciliation left explicit); sources/docs 3 (future repository gate).

## Remaining blockers / prioritized handoff

1. Parent generates the topic-specific 1200×630 PNG and verifies live canonical `og:image`.
2. Parent creates/publishes shared repository, runs green CI, verifies source links and
   appropriate shared launch assets. No generic deploy button promises a mail server.
3. Parent builds the website, verifies actual Astro layout at 2 themes × 3 widths, schema,
   title/canonical/social metadata and the coordinated sibling URLs.
4. Live Dovecot/hosted-send smoke remains unperformed; use documented operator configuration
   if a production interoperability claim is desired. No such claim appears in the draft.

No locally fixable factual, SDK, code-parity, prose-structure or visual-clipping blocker remains.
Keep `draft: true`; re-score after the parent gates, refresh by 2026-11-04.

BLOCKING: true (current score 87/100; parent-owned hero, public repository/CI and final site gates pending)
