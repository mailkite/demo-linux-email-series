# Linux email-provider adapter

Read one selected UID from your existing Dovecot IMAPS mailbox, persist a tenant-scoped
SQLite claim, and send an operator notification through the MailKite Node SDK. The
offline mode uses a simulated IMAP client and loopback HTTP fixture; it never sends
email. Companion article: [Build a Linux email provider with MailKite integrations](https://mailkite.dev/blog/build-email-provider-linux-mailkite/).

Public repository and shared CI are parent-owned publication gates. Future source:
https://github.com/mailkite/demo-linux-email-series/tree/main/provider.
This operator CLI needs persistent storage and access to an existing IMAP service;
a generic web-host deploy button would not provision either. Parent owns shared
Codespaces/launch assets; don't advertise a one-click public mail-provider deployment.

## Local run

Requirements: Node >=22.13.0 (built-in `node:sqlite`), npm. Exact dependencies:
`mailkite@0.20.0`, `imapflow@2.2.5`, with transitive versions in `package-lock.json`.
After cloning the shared repository, enter `provider/` and run:

```sh
sh quickstart.sh
```

`npm run check` checks source syntax; `npm test` runs meaningful offline boundary tests.
`npm run demo` prints one fixture acceptance and one duplicate observation with one
HTTP request. The fake provider ID is labelled `msg_offline`; it is not a real send ID.

## Live operation (sends one actual notification)

Use an existing Linux deployment: Postfix accepts the domain's mail, Rspamd filters it,
Dovecot stores it and serves IMAPS on 993 with a valid certificate. Provision the IMAP
account through your existing management system. This directory doesn't install them.
Use a least-privilege IMAP credential for the selected account; don't disable TLS
certificate validation. The adapter selects INBOX read-only and doesn't change flags.

Supply these environment variables from your runtime's secret manager or shell session:

| Variable | Meaning |
|---|---|
| `TENANT_ID` | Stable internal tenant identifier |
| `IMAP_HOST` | TLS hostname of the Dovecot service |
| `IMAP_USER` | Concrete account email; also the notification Reply-To |
| `IMAP_PASSWORD` | Credential for that account, not a shared administrator |
| `IMAP_UID` | Explicit positive INBOX UID; not a sequence number |
| `MAILKITE_API_KEY` | Sending credential for the configured domain (prefer domain scope) |
| `MAIL_FROM` | Bare sender address on your outbound-authenticated domain |
| `NOTIFY_TO` | Bare address of an operator who should receive this notice |

Run `npm run live`. It connects only to IMAPS and the hosted SDK endpoint. It writes
`provider.sqlite` in the current directory. Keep that file on persistent local storage,
including across process restarts. This is an operator CLI, not a multi-tenant HTTP API.
Configuration is trusted and fixed per process; untrusted callers must not set these
variables or select the MailKite credential.

## DNS ownership

Keep the receive domain's MX at Postfix. Register the sending domain in MailKite, publish
the exact returned SPF/DKIM records, and verify outbound authentication. Management
API calls require management authentication; the worker needs only sending credentials.
A sending subdomain is a clear configuration boundary. Set DMARC deliberately and check
alignment in a received message; DNS correctness is not an inbox-placement guarantee.
Do not point equal-priority MX at two independent stores expecting replication.

## Recovery and limits

- Composite identity: tenant + account + INBOX + UIDVALIDITY + UID. Moving/copying a
  message, changing account identity, or rebuilding a mailbox can create a new occurrence.
- `accepted` records a recognized `{id,status}` acknowledgement (`sent`/`queued`), not
  recipient delivery. The ledger stores provider ID and provider status.
- `unknown` holds all send errors, including explicit rejection. `sending` can indicate
  an in-flight call or crash. Neither is automatically retried. Review provider records
  and the sending process before any manual intervention. No exactly-once promise.
- No incoming body/subject/sender is fetched or sent. This is a fixed notification, not
  an auto-reply, MIME parser, inbound webhook importer, or mailbox synchronization tool.
- No Sent append in Dovecot, polling daemon, tenant enrollment API, bounce processor,
  quota enforcement or billing layer. Add these as separate provider responsibilities.
- SQLite protects claims among processes sharing a local database. Distributed workers
  need an appropriate transactional store, not independent copies of this file.

See [design](docs/design.md), [primary-source research](research.md),
[verification](verification.md), and [editorial review](review.md).

License: MIT (this demo). MailKite Server has its own AGPL license.
