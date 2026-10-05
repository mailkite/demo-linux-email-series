# Provider adapter contract

Audience: small SaaS teams building tenant-aware Linux email products. Job: read one
explicit IMAP UID, persist a notification job, send through the MailKite SDK.

- `readEvent(imap, tenant, uid)` requires an authenticated, tenant-specific IMAP client;
  selects INBOX read-only, returns trusted account context plus UIDVALIDITY and UID.
- `notify(db, tenant, event, mk)` requires trusted operator configuration and an SDK
  client using that tenant's credential. It returns the durable job status/provider ID.
- A unique composite source key claims at most one send attempt across workers sharing
  SQLite. Invalid tenant/mailbox context is rejected before the claim or network call.
- A failed/ambiguous send is held as `unknown`; a crashed `sending` job is also held.
  No automatic resubmission, exactly-once claim, or cloud inbound ingestion is promised.

## Prior art inspected before implementation (2026-10-05)

`web-monorepo/sdks/node/index.js`: existing MailKite send client; use it, not a second
API client. `mailkite-server/api-local/server.mjs`: local outbound pipeline stores
Sent, loop-delivers local recipients, then calls a smarthost; not reused because this
demo reads a separately operated Dovecot mailbox. `docs/contract.md`: private trusted
edge API, not an arbitrary cloud-import interface. ImapFlow supplies mailbox locking,
UID fetch, and TLS rather than a new IMAP implementation.

## Options, weighted for a small working architecture demo

Weights: observable boundary 50%, setup simplicity 30%, operator control 20%.
Scores are editorial judgments (1–5), not benchmarks.

| Choice | Boundary | Setup | Control | Weighted | Trade-off |
|---|---:|---:|---:|---:|---|
| Existing IMAP + SDK outbound | 5 | 5 | 4 | 4.8 | Chosen per user request; SMTP/DNS setup remains external |
| New Haraka ingest plugin | 4 | 2 | 5 | 3.6 | Demonstrates SMTP, requires trusted backend implementation |
| Entire provider deployment | 5 | 1 | 5 | 3.8 | Better infrastructure coverage, obscures adapter semantics |

SQLite is the durable local ledger (Node built-in); it is not the mailbox store.
One tenant configuration per process avoids exposing an unauthenticated send endpoint.
Production needs enrollment, quotas, credentials, mailbox provisioning, suppression and
bounce handling, and deliberate reconciliation of `sending`/`unknown` jobs.

## Checklist

- [x] Official source research and current contract inspection
- [x] SDK-first adapter with durable claim and offline HTTP boundary tests
- [x] Article with two vertical built visuals, mapped snippets, honest limits
- [x] Local editorial review and verification notes
- [ ] Parent: generated hero, public repo/CI, site render and production gates
