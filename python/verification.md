# Verification · 2026-10-05

## Environment and executed commands

Working directory: `/Users/gabe/code/mailkite/demos/demo-linux-email-series/python/`.
macOS; CPython 3.13.12. All listeners and sends in the demo are loopback-only.

1. `python3 -m venv .venv` — FAILED: default CPython 3.14.6 ensurepip exited nonzero.
2. `uv venv --python python3.13 .venv` — refused to overwrite that incomplete environment.
3. `uv venv --clear --python python3.13 .venv && uv pip install --python .venv/bin/python -r requirements.txt` — PASS. Replaced only this session's incomplete owned venv; seven pinned packages installed.
4. `.venv/bin/python demo.py` — PASS, actual SMTP DATA and IMAP exchanges. Output below.
5. `.venv/bin/python -m unittest discover -s tests -v` — first run: 9 passed, one test failed on case-sensitive HTTP-header dictionary lookup. urllib normalized header casing; fixed assertions to be case-insensitive.
6. Same unittest command after fix — PASS: 10 tests, 4.710s on recorded run.
7. `.venv/bin/python quickstart.py` — PASS; decoded message and repeat poll `[]`.
8. `.venv/bin/python mime_example.py` — PASS; accented subject, dot-prefixed body line, attachment name.
9. `.venv/bin/python hosted_demo.py` — PASS; SDK verification/acknowledgement + real HTTP request to local capture `/v1/send`.
10. `uv pip check --python .venv/bin/python` — PASS; all seven installed packages compatible.
11. `.venv/bin/python check_article.py /Users/gabe/code/mailkite/web-monorepo/website/src/content/blog/linux-email-servers-python.md` — PASS for three AST-matched snippets, two SVGs, top visual. Editorial diagnostics are not an independent publication approval.
12. `PATH="$PWD/.venv/bin:$PATH" sh run.sh` — final PASS: demo plus 10 tests, 4.658s. Final metadata description is 154 characters; body words excluding code/SVG remain 1,533. Owned preview process stopped and working tab closed.

## Observed demo output

```text
SMTP refused: {}
Received: Résumé for ticket 42 ['ticket.csv']
Repeat poll: 0
After database reopen: 0
IMAP commands: CAPABILITY; LOGIN; EXAMINE; UID SEARCH UID 1:*; UID FETCH 1 (UID BODY.PEEK[]); EXAMINE; UID SEARCH UID 2:*; LOGOUT; CAPABILITY; LOGIN; EXAMINE; UID SEARCH UID 2:*; LOGOUT
```

Hosted fixture output (synthetic response, explicitly a local capture, not a delivery claim):

```text
{"status":"ok"}
{'id': 'local-capture', 'status': 'sent'}
POST /v1/send
```

## Meaningful failure coverage

Real loopback tests cover MIME subject/body/attachment-name preservation, SMTP dot-stuffing, persistent database reopen, independent scopes, non-contiguous UIDs, UIDVALIDITY rebuild/rescan, partial-batch missing literal (cursor stays at last success), IMAP NO search failure, bad credentials, refused SMTP recipient, explicit cleartext-host guard. SDK tests cover valid/tampered/stale/seconds-based signatures, duplicate id, self-host shape rejection, and actual HTTP request serialization. Official Postal/WildDuck/JMAP request builders use local HTTP captures, not live servers.

## SDK and contract inspection

Read both working-tree SDK and installed PyPI 0.20.0 source. Confirmed constructor, send dict, static verifier, canonical reply_ok helper, synchronous urllib transport, and lack of request timeout/retry parameters. Hosted event fixture mirrors inspected schema keys. Self-host local webhook seconds + metadata shape checked in real implementation and documented as incompatible. No claim to have run the entire self-host stack.

## Diagram verification

Started `preview.py` on owned port 4327; opened a fresh Chrome tab and closed only that tab afterward. Preview is deliberately isolated from Astro, so it does NOT clear the full-page gate.

- Actual viewport 390 × 844, dark and light: screenshots inspected; both diagrams readable, no horizontal overflow; diagram widths 358px, heights 537px and 612.37px.
- 768 × 1024 and 1440 × 1000, both themes: DOM checks found no horizontal overflow; each diagram capped at 540px width. Desktop light screenshot inspected.
- Found an arrow line crossing the crash-retry caption and marker heads only on the final segment. Fixed SVG path geometry; reloaded preview and inspected final mobile screenshots in both themes.
- Both SVGs have unique title/desc IDs and accessible labels, vertical flow, currentColor styling, no animation or external assets.

Browser `resize_page` has a minimum width of 500; the real 390 check used `emulate(viewport=390x844x1)` instead. Do not count the preliminary 500 screenshot as mobile verification.

## Outstanding gates

- Parent: create hero `/blog/og/linux-email-servers-python.png` (1200×630), publish the future repository, add/run root CI for `python/`.
- Parent: full Astro website build/schema/link/OG checks and rendered article at both themes × three viewports. Running that build writes outside this agent's owned files, so it was not performed here.
- Future repository and unpublished sibling links cannot be called live-verified; the original pillar is present in local content. Guessed `/docs/webhooks` was actually fetched and 404; fixed to verified `/docs/webhook-security`.
- Full production TLS/DNS/deliverability and vendor-deployment tests aren't demonstrated by local fixtures. No external email was sent.
- Self-review is manual in this session; no independent reviewer nonce or spawned agent provenance is claimed.
