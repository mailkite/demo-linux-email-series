# Research and interface decision · 2026-10-05

Audience: Python backend developers adding support-by-email or mailbox ingestion to several products.
Job: choose the boundary, then prove local SMTP submission → IMAP retrieval → durable ingestion without external sends.
Track: search/LLM tutorial/reference. Target `Linux email servers Python`; related Cluster C inbound parsing in the local keyword matrix. No measured volume for this phrase; do not invent it. Keep the Linux roundup as the selection pillar, this page as the Python implementation spoke. Recheck contracts by 2026-11-04.

## Prior art and scope

Read `web-monorepo/AGENTS.md`, `docs/CODE-SAMPLES.md`, local mailkite-seo skill + matrix, local dev-blog-review skill, blog style index/playbook, editorial heuristics, two-tier detection, and `/Users/gabe/.agents/skills/blog/references/mailkite-dev-blog.md`.
Read `website/src/content/blog/open-source-email-servers-linux.md` as context, not evidence for fresh version/star/security claims.
Grep `demos/**/*.py` for smtplib/imaplib/UIDVALIDITY: no existing Python helper. SDK examples exist under `sdks/python/examples/`; use the real published SDK rather than copying its HTTP/signature code.
User selects loopback fixtures and owns only this directory + the one post; research/contract records live here instead of expanding `docs/`. Hero/repository CI are parent-owned.

## Options (ordinal judgments, not benchmarks)

Weights: local reproducibility 50%, boundary clarity 30%, production resemblance 20%; scores out of 5.

| Option | Scores (weighted) | Strength | Cost |
|---|---|---|---|
| stdlib clients, aiosmtpd SMTP, narrow IMAP fixture | 5/5/2 (4.4) | Actual exchanges; no Docker or DNS | Not a server conformance test |
| Docker Postfix+Dovecot | 3/4/5 (3.7) | Real daemon behavior | Docker availability, image/config maintenance |
| Mock all clients | 5/2/1 (3.3) | Quick units | Cannot prove SMTP/IMAP boundary |

Chosen per user brief: first option. MailKite SDK points only at a local HTTP capture fixture; webhook verification uses the SDK. Production adapters are callable functions tested locally, not live sends.

## Interface contract (before implementation)

- `submit(message, host, port, ...)` returns refused-recipient mapping; TLS by default, cleartext only exact 127.0.0.1 fixture.
- `poll(connection, db, scope)` requires authenticated IMAP, read-only INBOX, SQLite tables; returns newly ingested records.
- Persist `(scope, UIDVALIDITY, UID)` plus cursor atomically; scope identifies server/account/folder. Stop on missing fetched literals, never skip a failed UID.
- A mailbox rebuild causes a new UIDVALIDITY epoch and rescan; high-water ingestion is NOT flag/deletion synchronization or exactly-once downstream processing.
- Fixture supports only tested IMAP4rev1 commands, not a production server; no overlap with SDK helpers, which remain imported.

## Official sources fetched on 2026-10-05

| Source | URL | Evidence used |
|---|---|---|
| Python smtplib | https://docs.python.org/3/library/smtplib.html | send_message envelope/refusals, STARTTLS + EHLO |
| Python imaplib | https://docs.python.org/3/library/imaplib.html | UID, tuple/literal responses, explicit verified SSL context, 3.14 IDLE |
| Python email.parser | https://docs.python.org/3/library/email.parser.html | BytesParser(policy=default), defects, MIME tree |
| Postfix SASL | https://www.postfix.org/SASL_README.html | Authentication and relay authorization are separate |
| Exim TLS | https://www.exim.org/exim-html-current/doc/html/spec_html/ch-encrypted_smtp_connections_using_tlsssl.html | 587 STARTTLS / 465 implicit TLS |
| Dovecot IMAP | https://doc.dovecot.org/latest/core/config/imap.html | IMAP extensions and IDLE |
| mailcow manual client setup | https://docs.mailcow.email/client/client-manual/ | IMAPS 993, submission 587/465 |
| Mailu concepts/setup | https://mailu.io/2024.06/general.html ; https://mailu.io/2024.06/compose/setup.html | Container boundaries, central front, TLS configuration |
| Postal API | https://docs.postalserver.io/developer/api/ ; https://postalserver.github.io/postal-api/controllers/send/message | X-Server-API-Key, /api/v1/send/message, plain_body, JSON status |
| Postal inbound HTTP | https://docs.postalserver.io/developer/http-payloads | processed rcpt_to/plain_body; 5xx fail immediately, timeout retries |
| WildDuck API | https://docs.wildduck.email/docs/category/wildduck-api ; https://docs.wildduck.email/docs/wildduck-api/messages ; https://docs.wildduck.email/docs/wildduck-api/submission | Message source/list/submission APIs distinct |
| WildDuck architecture | https://docs.wildduck.email/ | Node/Mongo mailbox server with Haraka/ZoneMTA edges |
| Stalwart | https://stalw.art/docs/install/ | Rust, SMTP/IMAP/JMAP; current documentation navigation |
| Modoboa | https://modoboa.readthedocs.io/en/latest/ | Postfix/Dovecot management UI and REST API |
| IETF IMAP | https://www.rfc-editor.org/rfc/rfc9051.html#section-2.3.1.1 | UIDVALIDITY/UID identity, non-contiguous UIDs |
| PyPI official SDK | https://pypi.org/pypi/mailkite-dev/json | Distribution mailkite-dev 0.20.0, import mailkite, cryptography dependency |

Additional precise sources fetched 2026-10-05:
- https://mailkite.dev/docs/webhook-security — confirmed raw-byte verification, milliseconds header and SDK path. Guessed `/docs/webhooks` returned 404 and was corrected during review.
- https://docs.wildduck.email/docs/wildduck-api/wildduck-api — configured X-Access-Token, OpenAPI export, docs version 1.48.2.
- https://docs.wildduck.email/docs/wildduck-api/get-messages — GET /users/:user/mailboxes/:mailbox/messages.
- https://docs.wildduck.email/docs/wildduck-api/submit-message — POST /users/:user/submit.
- https://raw.githubusercontent.com/stalwartlabs/website/main/src/content/docs/docs/http/jmap/protocol.md — current official JMAP request/upload/query limits; no performance claims copied.
- https://jmap.io/client/index.html — Email/query/get, state tokens, changes and fallback; Session apiUrl/downloadUrl discovery.

Source retrieval failures recovered: guessed WildDuck `/api/` and Stalwart `/docs/api/jmap/overview/`/`category/jmap/` paths 404; discovered current navigation and cited reachable URLs. Dovecot `protocols/imap.html` returned a 404 page, corrected to `latest/core/config/imap.html` (redirects to 2.4.5).

## MailKite source inspection: compatibility is narrower than the roundup suggests

`web-monorepo/sdks/python/mailkite/__init__.py`: constructor `(apiKey=None, baseUrl=..., accessToken=None, getToken=None)`; `send(self, message)` dict; `setWebhook(self, id, body)`; static `verifyWebhook(signature, payload, secret, toleranceMs=300000)` expects milliseconds. urllib transport is synchronous; no timeout parameter or automatic retry loop in request(). PyPI 0.20.0 must be tested, not assumed to match working-tree SDK additions.

Hosted schema: `sdks/spec/schemas/email-received-event.json` and `docs/api/models/email-received-event.md`: `type=email.received`, stable `id`, `from.address`, `to[].address`, nullable text/html/textFromHtml/threadId, auth, attachments. `id` is not the RFC Message-ID.

Self-host inspection: `mailkite-server/docs/contract.md`, `api-local/lib/webhooks.mjs`, `api-local/server.mjs`. Ingest is edge-trusted raw RFC822 with a seconds timestamp, not application webhook API. Local backend webhook is `event=inbound`, scalar `from`, `rcpt`, `uid`, `raw_url`, seconds signature. Hosted SDK's default freshness verifier rejects it; never disable freshness to pretend interchangeability. Local backend has `/v1/send`, but management and inbound shapes differ. The IMAP protocol is the portable boundary; SDK parity is not wholesale API parity.
