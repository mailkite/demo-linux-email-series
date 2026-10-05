# Self-review: Linux email servers with Python

Reviewed 2026-10-05 using the local `dev-blog-review` skill, project playbook, reviewer rubric, MailKite contract, editorial heuristics, and two-tier prose diagnostics. This is a manual self-review, not an independent agent/nonce-bound gate. User requested draft-only work and parent-owned hero/repo CI.

## Overall: 88/100 — strong draft, publication blocked

| Category | Score | Max | Evidence / deduction |
|---|---|---|---|
| Content quality | 27 | 30 | Concrete protocol demo and failure cases; compact but broad comparison, rather than deployed vendor walkthroughs |
| SEO | 24 | 25 | Specific title/slug/meta, five requested pillar/sibling links, sources and refresh date; no fabricated keyword volume; future links pending |
| E-E-A-T | 13 | 15 | Gabe attribution, same-paragraph affiliation disclosure, official citations, observed tests; no production experiment claimed |
| Technical | 10 | 15 | Three AST-matched snippets, ten tests, accessible vertical SVGs checked in isolation; hero, full-site build/schema/OG and CI not cleared |
| AI citation readiness | 14 | 15 | Answer-first sections, explicit entities, comparison table, clear compatibility distinctions; static Markdown; full rendered metadata pending |

No score is granted for an unperformed full Astro, live OG, remote CI, or production deliverability check. The 88 score is below the project threshold, and missing publication assets are separately blocking.

## Contract gate

- Marketing smell / buried lede / duplicated description: clear. Description gives full picture; first body element is a diagram and first code follows immediately.
- Built visuals: two substantial vertical SVGs, currentColor, accessible title/desc. Isolated preview inspected, not claimed as whole-site visual validation.
- Code: three blocks match runnable counterparts; SDK-first for MailKite. Handler is a callable excerpt exercised by hosted_demo.py and tests, rather than a fabricated web framework app.
- Recommendation: one MailKite arc after protocol substance, explicit "which we build", DIY path and honest alternatives. Hosted dependency/groupware limits included.
- Evidence: no invented stats/customer stories/benchmarks. Test results and scope recorded. HTTP capture's sent-shaped response explicitly synthetic.
- Repo: linked early and at end, but future public URL not yet verified; parent gate outstanding.
- Stock photos / TL;DR box / track blend / Ptacek test: no failures found. Search/LLM reference track; HN narrative/title formula requirements aren't applied to turn it into an essay.
- Deploy-button exception: loopback plaintext fixtures are not publicly deployable. README explains this; parent owns repo CI. Do not add a public deploy button that exposes these fixtures.

## Fixes performed during review

1. Corrected case-sensitive HTTP header assertions after a real failing local test.
2. Called out published package name versus import name, using installed 0.20.0 source rather than only working-tree SDK.
3. Corrected the self-host parity implication inherited from the roundup: metadata payload and seconds freshness behavior differ from hosted webhook contract.
4. Fixed SVG arrowheads and caption-line overlap after screenshot inspection.
5. Replaced fetched 404 `/docs/webhooks` with verified `/docs/webhook-security`.
6. Shortened the metadata description from 162 characters to the final checked value; kept the rendered lead informative instead of duplicating it in body prose.

## Prose diagnostics (not authorship detection)

`check_article.py` excludes code/SVGs/HTML comments and removes Markdown URLs. Final numeric values are in verification command output; reference before the final meta edit: body 1,533 words, prose without table/headings 1,294, TTR 0.470, sentence burstiness 0.492 (borderline advisory, not <0.3 blocking). No banned marketing/AI phrases or stylistic em dashes found in prose.

Second-order manual pass: zero question-form H2s, zero "Here" openers, no false-balance filler, hedge stacks, capsule-transition cadence, wrap-up questions, or "key insight" openers. Caveats: paragraph-length SD 10.84 and top-three sentence-opening share 30.8% trip the heuristic's rhythm warnings; technical reference prose has similarly-sized paragraphs and repeated protocol/article openings. These are reported, not relabeled as a clean AI-detection pass or evidence of authorship. Do not pad or randomize prose to manufacture diversity.

## Editorial heuristics (0–4)

| Heuristic | Score | Note |
|---|---|---|
| Intent visibility | 4 | Specific lead and immediate executable result |
| Heading/content match | 4 | Conclusions first, then implementation/evidence |
| Reader control | 3 | Distinct headings and links; site TOC rendering pending |
| Voice consistency | 3 | Direct reference voice, some repeated sentence openings |
| Fabrication prevention | 4 | Source ledger, actual local results, no market stats |
| Recognition over recall | 4 | Boundary comparison and cursor diagram |
| Skimmer/deep-reader flexibility | 3 | Table and bold leads; no padded FAQ |
| Information density | 4 | 1,533 earned body words excluding code/SVG |
| Failure recovery | 4 | Epoch rebuild, cursor failure, retries, async limits |
| Sources/documentation | 3 | Official sources and five internal cluster links; future URLs pending |

## Parent's blocking queue

1. Generate/inspect the required 1200×630 hero; verify canonical og:image after publication.
2. Publish `mailkite/demo-linux-email-series` with this `python/` component; root CI must install pinned deps and run demo + unittest.
3. Run full website build and six rendered-page viewport/theme checks, source/link/metadata validation, and independent final review. Check sibling availability and clear score threshold.
4. Keep draft true until those gates are actually cleared. Schedule contract refresh by 2026-11-04.

BLOCKING: true (88/100 self-review; hero, public repo/CI, full Astro/OG/link/visual and independent parent gates pending)
