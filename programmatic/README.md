# Programmatic Linux email servers: local boundary demo

A real loopback SMTP receiver checks the envelope recipient, parses MIME, and commits raw mail and parsed fields to SQLite before acknowledging DATA. Separate tests exercise the published MailKite SDK against a clearly labeled local contract fixture, and verify signed webhook fixtures. Companion to [Programmatic Linux email servers](https://mailkite.dev/blog/programmatic-linux-email-servers/).

Public location after parent publication: https://github.com/mailkite/demo-linux-email-series/tree/main/programmatic

## Run locally

Requires Node >=22.13 (Node SQLite may print an experimental warning). No accounts, secrets, DNS, Docker, or external sends.

```sh
git clone https://github.com/mailkite/demo-linux-email-series.git
cd demo-linux-email-series/programmatic
npm ci
npm run demo
npm test
```

The first two commands require the parent to publish the shared repository. In this local checkout, start with `npm ci` inside this directory.

Expected **observed** demo lines (SQLite warning omitted):

```text
SMTP accepted: ticket+42@example.com
SQLite stored: Invoice question
```

`npm start` keeps the listener on **127.0.0.1:2525**, persisting `inbox.sqlite` beside the script; Ctrl-C closes it. `npm run demo` and tests use temporary/in-memory databases, ephemeral ports, and clean up. The only accepted address is `ticket+42@example.com`; changing the envelope recipient produces SMTP 550. All SMTP clients explicitly use loopback. No relay or MX lookup exists.

## Code map

| Article block | File |
|---|---|
| Install and run | `package.json` scripts / this README |
| MailKite SDK send function | `sdk-send.mjs` |
| SDK signature verifier | `webhook.mjs` |
| SQLite before acceptance | `inbox.mjs`, exercised by `demo.mjs` |

Dependencies are exact in `package.json`, with transitive resolutions in `package-lock.json`: smtp-server (SMTP callbacks), mailparser (MIME parsing), nodemailer (local SMTP client), mailkite (SDK).

## Scope and failure behavior

This is an acceptance experiment, **not a deployment of Haraka, Postfix, Exim, Postal, WildDuck, Stalwart, or MailKite Server**. It has no TLS, authentication, spam checking, background worker, webhook queue or internet delivery. It limits messages to 1 MiB; parsing/storage failure responds 451. The SQLite commit is synchronous and precedes SMTP success. Envelope recipients and To headers are deliberately different in a test to show why headers are not routing authority.

The SDK test fixture implements only `/v1/send`. It asserts method/path/auth, serializes with the real SDK, sends to the real loopback SMTP listener, and asserts persisted content. It proves the sample's SDK call shape, not self-hosted API parity. For real MailKite Server use its documented local API key and `baseUrl`; use an owned From domain and configured smarthost. Never substitute this fixture token or these example addresses in a live integration.

Webhook signatures in these tests use the **hosted delivery** millisecond timestamp convention. The Server **edge-ingest** contract instead documents seconds and raw RFC822; do not use this consumer helper as an ingest verifier.

## Publication and operation notes

No internet SMTP deploy button is supplied for a loopback-only experiment. The parent repository can add CI that runs `npm ci && npm test` in `programmatic/`; no CI run or public URL availability is claimed here. See `research.md`, `verification.md`, and `review.md` for evidence and pending publication gates.

MIT licensed; see `LICENSE`.
