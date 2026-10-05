# Linux email series: interactive-pass handoff

Date: 2026-10-05. Scope: interaction audit and edits to the five finished draft posts only, plus this handoff. Audience: backend developers connecting application email to Linux infrastructure. Job: predict a failure-boundary outcome, reveal the explanation, and verify it through the existing local CLI tests.

## Decision and artifact contract

- Added one native HTML `<details>` disclosure per post: five disclosures total. Each has a visible prediction prompt, an explicit `<summary>`, a source-backed answer, runnable targeted test commands, and a link to the exact test file.
- Reused the website's `mk-card` prose component styling from `website/src/styles/global.css`, its inline-code wrapping and prose links, and the native details/summary pattern already used in website pages. The components directory has no dedicated Accordion/Disclosure/Details component. Markdown posts cannot import Astro components directly; no MDX migration is warranted for a disclosure.
- Native markers and keyboard behavior remain browser-owned. No script, event handler, island, iframe, signup gate, credential input, new CSS, animation, or network execution was added. The artifact works with JavaScript disabled. Essential explanations and normal demo links remain outside the collapsed answer.
- All outcome claims are tied to existing fixture assertions, not invented terminal transcripts. The automation timestamps are explicitly a test clock. Local SMTP acceptance, API acknowledgement, and recipient delivery are distinguished.
- Existing ten SVGs remain the built visuals; disclosures do not count as replacements. All five posts remain `draft: true`.

References read: `/Users/gabe/.agents/skills/blog-interactive/SKILL.md`, `blog/references/interactive-content.md`, and `blog/references/deploy-buttons.md`. Native disclosure behavior was checked against [MDN details documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details). User-selected low-risk scope takes precedence over the skill's delegation/live-playground defaults.

## Ranked interaction audit and actual edits

Post paths below are relative to `web-monorepo/website/src/content/blog/`.

| Post | First-ranked candidate added | Placement and evidence | Lower-ranked candidate rejected |
|---|---|---|---|
| `programmatic-linux-email-servers.md` | Predict envelope authority and SQLite reopen outcome | After the acceptance SVG, before webhook code; `programmatic/test/boundaries.test.mjs` checks unknown RCPT 550/no row, known envelope with a different To header, and persisted MIME after reopen | Server-choice wizard: the existing comparison already explains qualitative boundaries; a selector would imply more certainty than the evidence supports |
| `build-email-provider-linux-mailkite.md` | Predict lost-response and crash-held recovery | After the durable-claim discussion/tests; `provider/test/adapter.test.mjs` checks unknown states, one request, and no send for a crash-held claim | Live mailbox/send pane: introduces credentials and real infrastructure; not needed to understand the acknowledgement ambiguity |
| `automate-email-replies-linux-ai.md` | Predict saved-draft retry, with optional held-approval exercise | After the remote-send caveat; `automation/test/automation.test.mjs` checks controlled backoff, reopen, one model call, and explicit approval releasing one local reply | In-browser AI chat/approval UI: broad feature, duplicates the runnable worker, and cannot prove durable ownership or model correctness |
| `linux-email-servers-nodejs.md` | Predict envelope rejection and failed-persistence response | After SMTP configuration, before IMAP; `nodejs/test/integration.test.mjs` checks 550/451 and zero records, alongside the already documented loopback output | Browser MIME editor: a separate parser toy would test a different pipeline from the real SMTP/MIME round trip |
| `linux-email-servers-python.md` | Predict partial-batch cursor recovery, with optional epoch-rebuild exercise | After the cursor explanation, before HTTP alternatives; `python/tests/test_mailflow.py` checks last UID 1 after failed fetch 2, recovery, empty repeat poll, and new-epoch occurrence identity | Animated cursor simulator: would reimplement the tested state transitions and risk hiding real IMAP semantics |

Native disclosure scored highest on teaching relevance, fidelity to the runnable demo, and low implementation/maintenance cost. Its trade-off is that code execution stays in the reader's local environment. A browser mini-app offers more immediate inputs but requires a second implementation. A sandbox offers execution only if the actual runtime is supported. Live API execution has little relevance to these offline failure boundaries and is excluded by the requested scope.

## Why WebContainers and deploy buttons were rejected

- **Programmatic/provider/automation:** the actual implementations require Node >=22.13 with built-in `node:sqlite`, durable file behavior, and native Node/server functionality. No compatible WebContainers runtime has been verified. Replacing SQLite with a browser store would change the thing being taught. Provider live mode also needs an existing IMAPS service and persistent ledger, which an iframe cannot provision.
- **Node.js:** this demo does not need SQLite, but its real loopback SMTP listener and socket clients require a verified non-HTTP TCP path in the browser runtime. No such path is supplied or verified. A browser HTTP preview is not evidence that SMTP works. Rejected as unverified rather than claiming all Node code is incompatible.
- **Python:** the verified path is CPython 3.13 with aiosmtpd, real TCP SMTP/IMAP fixtures, SQLite and the installed SDK dependency tree. Experimental browser Python/WASI is not an equivalent verified execution environment.
- No StackBlitz iframe or badge claiming these demos run unchanged was added. No Render/Cloudflare deployment button: these are loopback teaching fixtures or an operator adapter, not provisioned public mail services. Shared Codespaces/launch assets and public repository availability remain parent-owned.
- Further SVGs/animations would duplicate the two substantive diagrams already in each post. A terminal cast requires a real recording; none was fabricated. Hosted send-to-self signup gates do not test local acceptance, cursor recovery, or remote-send ambiguity and were explicitly excluded.

## Verification performed

Read all five posts, demo READMEs, and relevant test sources before editing. Executed with installed dependencies; no dependency install, runtime-file edit, review-file edit, commit, push, deploy, or agent spawning.

| Directory | Executed check | Result |
|---|---|---|
| `programmatic/` | `node --test --test-name-pattern='SMTP accepts only known' test/boundaries.test.mjs` | 1 passed |
| `provider/` | `node --test --test-name-pattern='held as unknown\|crash after durable claim' test/adapter.test.mjs` (shell regex uses an unescaped pipe) | 4 passed |
| `automation/` | `node --test --test-name-pattern='retry persists decision\|review requires explicit approval' test/automation.test.mjs` (shell regex uses an unescaped pipe) | 2 passed; covers both commands supplied in the post |
| `nodejs/` | `node --test --test-name-pattern='SMTP rejects unknown\|storage failure tempfails' test/integration.test.mjs` (shell regex uses an unescaped pipe) | 2 passed |
| `python/` | `.venv/bin/python -B -m unittest discover -s tests -v -k partial_batch_failure` and the same command with `-k uid_gap_and_epoch_rebuild` | 1 passed each; post uses activated-environment `python` |
| `nodejs/` | `node verify-content.mjs <absolute-nodejs-post-path>` | Four exact snippet matches, top visual/two SVGs, metadata length passed |
| `python/` | `.venv/bin/python -B check_article.py <absolute-python-post-path>` | Three AST snippet matches, top visual/two SVGs passed |
| `web-monorepo/` | `scripts/agent/code-health.sh` with only the five explicit post paths | Exit 0; Markdown has no ESLint/TS/Keel source coverage, so this is not a render or content-proof check |

Total targeted behavioral checks: **11 passed, zero failed**. Node printed its existing SQLite experimental warning. No external email or live inference was invoked. Provider's `verify-post.mjs` was deliberately not run because it rewrites `editorial-metrics.json` and optionally preview files outside this pass's edit scope.

Source inspection confirms one balanced details/summary block per post, no blank lines inside the raw HTML disclosure blocks, two SVGs per post, retained draft state, and no new script/iframe. Commands in inline code inherit the existing `overflow-wrap: anywhere` styling. This is source-level verification, not browser execution.

## Parent-owned verification before publication

- Full-site build and rendered-page review were not run in this scoped pass. Keep the mandatory rendered-page gate pending: six theme/viewport combinations per post (light/dark × 390/768/1440), SVG screenshot inspection, no horizontal overflow, and console checks.
- Explicitly open and close each disclosure with pointer and keyboard (Enter/Space), check visible focus and native marker, and verify expanded commands wrap on mobile in both themes. Repeat with JavaScript disabled. The skill's island checks do not by themselves verify native disclosures; these artifacts intentionally have no island-mount attribute.
- Publish the shared repository, then verify every new test-source link under `mailkite/demo-linux-email-series/blob/main/…` and the existing run links. Public URLs are planned destinations, not verified live links in this pass.
- Covers, shared CI, full runtime suites, canonical metadata, deployment checks and final editorial reviews remain with the parent task. This handoff is an interaction audit, not a publication approval.
