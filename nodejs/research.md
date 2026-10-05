# Research and interface decision · 2026-10-05

Audience: Node.js developers connecting an application to Linux mail infrastructure.
Job: select the correct protocol boundary and prove SMTP envelope/MIME handling without external delivery.
Track: search/LLM reference tutorial. Target `Linux email servers Node.js`; supporting Cluster C inbound parsing and Cluster A programmable email. Local keyword matrix contains no measured volume for this exact query. No volume claims made. Broad project selection belongs to the existing `open-source-email-servers-linux` pillar; this spoke owns JavaScript integrations.

## Prior art and chosen contract

Read monorepo AGENTS.md, CODE-SAMPLES.md, local mailkite-seo skill and keyword matrix, local dev-blog-review skill, blog style index/layout, reviewer, editorial heuristics, AI-slop reference, and installed mailkite-dev-blog contract.
Search found sibling `programmatic/inbox.mjs`: SMTP Server + MailParser + SQLite. This demo deliberately uses an in-memory sink to isolate the Node transport boundary; it does not duplicate or import the sibling's storage implementation.

- `openSink`: binds only 127.0.0.1, accepts one address, caps buffered DATA, acknowledges after parsing and the supplied persistence callback resolves; returns parsed records and a close method.
- `loopback`: sends a MIME attachment with distinct envelope/header recipients to that sink, then closes sockets.
- `readInbox`: consumes an injected ImapFlow-compatible client read-only, keys records by UIDVALIDITY + UID, parses MIME; no mutation and always releases its mailbox lock.
- MailKite samples use pinned published SDK; tests intercept transport locally. Cloud webhook verifier accepts raw Buffer and milliseconds signatures only. No claim of Server webhook interchangeability.

Options scored for this demo (editorial judgment, not benchmark): reproducibility 50%, integration fidelity 30%, minimal setup 20%; each criterion 1–5.

| Option | Weighted /5 | Pros | Cons |
|---|---:|---|---|
| Loopback SMTP + MIME + optional IMAP adapter | 4.7 | Real socket and MIME; no credentials; quick to run | Does not install Postfix/Dovecot |
| Full mailcow deployment | 3.4 | Real stack and TLS | Host/DNS/container setup obscures client code |
| Hosted-only mock | 3.1 | Minimal setup | Misses envelope and RFC822 receive path |

User specified runnable loopback and MIME coverage; first option chosen within owned paths. Parent owns cover, root CI and publication.

## Official sources fetched

All successful URLs retrieved 2026-10-05; capabilities below are exact scope, not performance claims.

| Source | URL | Verified capability |
|---|---|---|
| Nodemailer SMTP transport | https://nodemailer.com/smtp | SMTP, STARTTLS, implicit TLS, requireTLS; verify does not test sender acceptance |
| MailParser | https://nodemailer.com/extras/mailparser | simpleParser buffers attachments; streaming MailParser; HTML is not sanitized |
| ImapFlow client API | https://imapflow.com/docs/api/imapflow-client/ | Read-only mailbox lock, UIDVALIDITY, fetch source, no commands inside fetch iterator |
| Dovecot CE and IMAP | https://doc.dovecot.org/ and https://doc.dovecot.org/2.4.5/core/config/imap.html | IMAP and LMTP support; versioned IMAP configuration documentation |
| Postfix SASL Howto | https://www.postfix.org/SASL_README.html | Dovecot/Cyrus SASL, relay authorization separate from authentication |
| Exim smtp transport | https://www.exim.org/exim-html-current/doc/html/spec_html/ch-the_smtp_transport.html | SMTP/LMTP delivery, routing hosts, retry and TLS controls |
| mailcow manual configuration | https://docs.mailcow.email/client/client-manual/ | IMAPS 993; submission 587 STARTTLS / 465 TLS; TLS required for authentication |
| Haraka Plugins | https://haraka.github.io/core/Plugins/ | rcpt and queue hooks, next(OK) short circuits, DENYSOFT temporary failures |
| Postal Using the API | https://docs.postalserver.io/developer/api/ | JSON requests; X-Server-API-Key; response status success/error; incomplete management API |
| Postal Send a message | https://postalserver.github.io/postal-api/controllers/send/message | /api/v1/send/message, plain_body, tag, array recipients |
| WildDuck | https://docs.wildduck.email/ | MongoDB IMAP/POP3, REST accounts/mailboxes/messages; Haraka + ZoneMTA suite |
| ZoneMTA README | https://github.com/zone-eu/zone-mta | Outbound-only SMTP/HTTP, MongoDB/Redis, sending zones, at-least-once caveat |
| Stalwart JMAP | https://stalw.art/docs/http/jmap/overview/ | /.well-known/jmap discovery, /jmap endpoint, HTTP listener and permissions |
| MailKite libraries | https://mailkite.dev/docs/libraries | Published mailkite npm SDK and send/verify helpers |
| MailKite webhook security | https://mailkite.dev/docs/webhook-security | Milliseconds timestamp, raw-body verification, freshness window |
| MailKite receiving | https://mailkite.dev/docs/receiving | email.received id/type/subject/text shape, signed delivery, stable retry id |
| Server edge contract | https://raw.githubusercontent.com/mailkite/server/main/docs/contract.md | Edge trust, ingest/relay/IMAP contracts; fetched remote copy |
| Server developer API | https://raw.githubusercontent.com/mailkite/server/main/docs/v1.md | Basic SDK send subset, refused hosted-only fields, incomplete parity; fetched remote copy |

Attempted but rejected as citations: /docs/sdks/node on MailKite, /docs/ on WildDuck, /docs/api/jmap/overview on Stalwart returned 404. Several guessed Dovecot documentation paths rendered a 404 shell; mailcow's verified manual configuration supplies the IMAP client settings instead. No Dovecot-specific configuration syntax claimed.

## MailKite Server compatibility inspection

Local `/Users/gabe/code/mailkite/mailkite-server` HEAD: `3a781f333288d7ca6f2c728f3b01da967ea17540`.
Read `docs/contract.md`, `api-local/server.mjs` (developer API / sendV1Message), `api-local/lib/webhooks.mjs`.
Public source links: https://github.com/mailkite/server/blob/3a781f333288d7ca6f2c728f3b01da967ea17540/api-local/server.mjs and https://github.com/mailkite/server/blob/3a781f333288d7ca6f2c728f3b01da967ea17540/api-local/lib/webhooks.mjs . These are inspected local source snapshots; remote publication of this commit is a parent check, not assumed.
Server supports basic /v1/send and batch, /v1/me, /api/messages. It refuses templateId, templateData, attachments, scheduledAt; external recipients require SMARTHOST. Edge contract is not the entire hosted SDK API. Server webhook uses event: inbound, uid, raw_url, no parsed text/attachments, seconds timestamp. Cloud SDK verifier expects milliseconds. Do not disable freshness to paper over that difference.

Freshness: recheck sources, pinned packages and Server compatibility by 2026-11-04 before promoting or refreshing this search-track page.
