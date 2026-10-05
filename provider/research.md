# Source and research notes

Retrieved/inspected 2026-10-05. No invented benchmark, stars, delivery percentage,
or operator war story. Official documentation and executable source take precedence
over the existing pillar's older statements.

## Primary-source claim ledger

| Source | URL | Supported use |
|---|---|---|
| Postfix, Architecture Overview | https://www.postfix.org/OVERVIEW.html | Incoming/active/deferred queue and delivery agents |
| Dovecot, LMTP Server | https://doc.dovecot.org/main/core/config/delivery/lmtp.html | Local delivery and LMTP versus LDA; main is pre-release docs, no config copied |
| Rspamd, MTA integration | https://docs.rspamd.com/tutorials/integration/ | Postfix Milter and Haraka integration |
| Haraka, project home | https://haraka.github.io/ | Programmable Node SMTP server, not a mailbox store |
| WildDuck, project documentation | https://docs.wildduck.email/ | MongoDB mailboxes, REST management, Haraka/ZoneMTA assembly |
| ZoneMTA, upstream README | https://github.com/zone-eu/zone-mta | MongoDB queue, Redis, sending zones, at-least-once delivery and acknowledgement ambiguity |
| Stalwart, Welcome | https://stalw.art/docs/install/ | SMTP/IMAP/JMAP and collaboration; edition-specific checks left explicit |
| Postal, official docs home | https://docs.postalserver.io/ | Application mail-delivery platform and webhook/IP pool features |
| Postal, Feature List | https://docs.postalserver.io/welcome/feature-list | Multiple organizations, per-server credentials, send API, inbound routing, suppression and IP pools |
| MailKite, Domains & DNS | https://mailkite.dev/docs/domains | Returned DNS records and management API authentication; prose verification description is less precise than directional source gate |
| MailKite, Send API | https://mailkite.dev/docs/sending | SDK send, acknowledgement not recipient delivery, tracking switches |
| ImapFlow, Client API | https://imapflow.com/docs/api/imapflow-client/ | IMAPS options, read-only lock, UID fetch, UIDVALIDITY |
| MailKite Server, backend contract | https://github.com/mailkite/server/blob/main/docs/contract.md | Trusted edges; scope tokens; raw ingest; not public arbitrary cloud ingest |
| MailKite Server, server source | https://github.com/mailkite/server/blob/main/api-local/server.mjs | `/v1/send`; Sent/local delivery/smarthost; missing-smarthost warning |
| MailKite Node SDK source | https://github.com/mailkite/mailkite-node/blob/main/index.js | Constructor base URL and `send` makes one request; no automatic retry in inspected implementation |
| MailKite directional domain gate (local source) | `web-monorepo/api/src/index.ts` lines 265–285 | Account ownership; inbound MX versus outbound SPF+DKIM |

The attempted monorepo GitHub source URL returned 404 (private/unavailable). Removed it
from the article and linked these inspection notes instead. Local source inspection is
direct evidence, not a claimed public fetch. Publishable behavior is also consistent
with `docs/architecture/domain-verification-gating.md` lines 14–20.

## Exact local source inspection

MailKite Server checkout HEAD: `3a781f333288d7ca6f2c728f3b01da967ea17540`.
`docs/contract.md`, `api-local/server.mjs` lines 198–231 and 1240–1263 inspected.
Contract prose alone doesn't establish full cloud SDK compatibility: source currently
has v1 routes, and missing smarthost still permits local pipeline acknowledgement.
Article avoids claiming tested self-host SDK compatibility.

`web-monorepo/sdks/node/index.js` constructor/request/send inspected; npm reports
`mailkite@0.20.0`, installed and exercised in loopback tests.
`web-monorepo/api/src/index.ts` lines 265–285 inspected: `domainGate` requires account
ownership, MX for inbound, SPF+DKIM for outbound. This is why the hybrid preserves the
Linux MX rather than requiring cloud inbound verification.

Official URLs returning 404 during research were replaced: Dovecot's obsolete virtual
flat-file path, Haraka `/manual/Plugins/`, MailKite `/docs/send-email` (use `/docs/sending`).

## Editorial targeting and freshness

Read repo AGENTS.md, CODE-SAMPLES.md, existing `open-source-email-servers-linux.md`,
local mailkite-seo skill v1.0.0 and keyword matrix (last updated 2026-10-03), global
MailKite dev-blog reference and local dev-blog-review contracts.

Search/LLM track, architecture guide. Primary intent: build Linux email provider;
secondary: Dovecot IMAP + MailKite integration. This exact long tail has no verified
volume/KD row in the matrix: don't assign synthetic numbers. Distinguish it from
the server roundup and language walkthrough siblings. Surfaces: owned search,
AI Overviews, assistant citation. Next refresh: 2026-11-04 (within 30 days).

Original value: trusted tenant-context handoff, explicit source identity, and held
unknown sends illustrated by executable offline boundary tests. Not original empirical
mail-server performance research.
