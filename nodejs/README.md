# Linux email servers with Node.js

A local SMTP-to-MIME round trip plus small client adapters for receiving IMAP mail, extending Haraka, calling Postal, and using the MailKite hosted SDK. The default command only connects to 127.0.0.1. Companion to [Linux email servers with Node.js](https://mailkite.dev/blog/linux-email-servers-nodejs/) (draft; parent owns publication).

Repository destination: https://github.com/mailkite/demo-linux-email-series/tree/main/nodejs . Publication and root CI are pending parent work; no deployment button claims are made for an ephemeral local test sink.

## Local run

After the parent publishes the repository, clone `https://github.com/mailkite/demo-linux-email-series`, enter `nodejs/`, then:

```sh
npm ci --ignore-scripts
npm start
npm test
```

Node.js >=22. Tested locally on Node 25.0.0. npm dependencies are exact-pinned and package-lock.json is included. No credentials required. `example.com` addresses are fixtures: they never leave the loopback sink.

`npm start` uses `loopback.mjs` to submit a multipart message with a Unicode subject and a text attachment. It routes the envelope to `ticket+42@example.com` while the visible header names `support@example.com`, parses the result with MailParser, then closes both sides.

Actual output:

```json
{
  "recipients": [
    "ticket+42@example.com"
  ],
  "headerTo": "support@example.com",
  "subject": "Ticket 42 ✓",
  "attachment": "status=ok\n"
}
```

## Files and usage

- `sink.mjs`: ephemeral, memory-only SMTP listener. Loopback bind, recipient allowlist, bounded DATA buffering. The optional `persist(record)` must resolve before success; rejection returns 451. Production requires a durable spool and a different lifecycle. It isn't an MX replacement.
- `imap.mjs`: read-only ImapFlow/MailParser adapter. Set `IMAP_HOST`, `IMAP_USER`, `IMAP_PASSWORD` in the environment, then `npm run imap`. Connects to IMAPS 993 with certificate validation enabled. Reads the first ten sequence positions, outputs UIDVALIDITY/UID keys and subjects, logs out. Requires an existing configured mailbox; never run it with someone else's credentials. Tests inject a client contract, not a live server.
- `haraka-ticket.cjs`: copy into an existing Haraka install's `plugins/` directory as `ticket_guard.js`, add `ticket_guard` before recipient acceptance plugins in `config/plugins`. The guard doesn't accept/queue mail on its own. Configure your recipient and queue plugins separately. Tests execute callback semantics in a Haraka-shaped VM; Haraka itself wasn't launched.
- `postal.mjs`: export `postalReceipt(baseUrl, key, fetchImpl)` with Postal's documented JSON status handling. Defaults to actual fetch when explicitly called; tests inject fetch and never reach Postal. Do not use fixture addresses for actual delivery.
- `mailkite.mjs`: exports `sendReceipt(mk)` and `receiveCloud(signature, raw, secret)`. To connect Cloud, construct `new MailKite(process.env.MAILKITE_API_KEY)` using the SDK and supply your verified-domain sender/real recipient by editing the fixture. There is deliberately no auto-send CLI. Tests intercept fetch and validate wire shape, then test the SDK signature helper locally.
- `verify-content.mjs`: checks that the article's four JavaScript blocks exactly match demo files, top visual and two-SVG requirement, metadata length; computes transparent lexical diagnostics. Run with the absolute article path.
- `test/integration.test.mjs`: ten checks across real loopback SMTP, MIME, receiving cleanup, provider request contracts and rejection paths.

## Limits and Server compatibility

Hosted receipt includes an attachment. The inspected MailKite Server send endpoint rejects attachment/template/scheduling fields; don't point this exact hosted receipt at Server. Basic `send` can use the SDK's second constructor argument for a Server base URL, with its own API key, and only supported fields. That is source-inspected compatibility, not an end-to-end Server run here.

Cloud signatures use milliseconds; inspected Server webhooks use seconds and a metadata/raw_url payload. `receiveCloud` is Cloud-only and the tests prove it rejects a Server-style seconds signature. Do not disable freshness as a workaround. Build an adapter to the Server contract or use its IMAP read path.

The default sink retains all accepted records in memory for a single test process. It bounds each message, not lifetime storage. IMAP reads also buffer MIME through simpleParser; use stream APIs and message-size checks for production traffic. Parsing does not sanitize HTML or authenticate an email sender. Persistence/deduplication, reconnects, and incremental mailbox checkpoints are application work.

## Parent CI handoff

Root workflow should run on Linux with a supported Node version (22 and/or 24), `working-directory: nodejs`, `npm ci --ignore-scripts`, `npm test`, and `npm start`. Add `verify-content.mjs` where the Markdown source is available. No root workflow created inside this owned subdirectory: GitHub would not discover it there.

Cover generation, full-site build, canonical metadata/link checks and real site screenshots are parent gates. `research.md`, `verification.md`, and `review.md` record evidence and blockers.

## License

MIT; see LICENSE. Third-party dependencies retain their own licenses.
