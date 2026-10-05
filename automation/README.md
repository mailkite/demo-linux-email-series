# Linux email reply automation

A local raw-MIME intake, durable SQLite job queue, configurable model adapter, and threaded reply sink for backend developers. Companion to [Automate email replies on Linux with AI agents](https://mailkite.dev/blog/automate-email-replies-linux-ai/). The public location is planned as [mailkite/demo-linux-email-series/automation](https://github.com/mailkite/demo-linux-email-series/tree/main/automation); publication and repository-wide CI are parent-owned.

## Local run

Requires Node **22.13.0 or later** (tested with 25.0.0), npm, and a writable current directory. Exact direct dependencies: `mailkite@0.20.0`, `mailparser@3.9.35`; lockfile pins transitive dependencies. No Docker, mail credentials, paid model or DNS required.

From this directory run the commands in `quickstart.sh`:

```sh
npm ci --ignore-scripts
npm run demo
npm test
```

The demo binds ephemeral loopback HTTP, posts a MIME fixture, persists it, replays its delivery ID, adds an automated message and an approval request, reopens the database, and processes due work. It prints three jobs (`done`, `suppressed`, `review`) and one threaded reply on a fresh database. Repeating the demo keeps those totals. `DB_PATH` selects a different SQLite file; default `automation.sqlite`. Example addresses never leave this process.

## Intake contract

`npm start` listens at **127.0.0.1:8787** (`PORT` overrides). POST `/events` with JSON containing `source`, `deliveryId`, `envelopeFrom`, `recipient`, `raw`. `fixture.mjs` is an executable event example. No authentication is supplied: this is a loopback teaching receiver, **not an internet webhook endpoint**. A production adapter must authenticate its upstream, authorize receiving addresses, reject spam, and apply limits before calling `accept`.

Use the upstream's stable ID, scoped to server/account/mailbox and recipient. For IMAP include UIDVALIDITY and UID in `deliveryId`; do not use sequence numbers or just MIME Message-ID. Preserve envelope sender (or delivery-added Return-Path when consuming a mailbox). This conservative automatic responder sends only to that reverse-path, not arbitrary Reply-To. Null reverse-paths, self mail, List-ID/bulk traffic and non-`no` Auto-Submitted are suppressed before model execution. Duplicate Auto-Submitted is suppressed; unusual/commented values fail closed. MIME size is limited to 256 KB; attachments are not passed to the model.

HTTP 200 follows SQLite insertion, including duplicates/suppressed records. Storage failure returns 503. This endpoint is a demo-owned contract, not Postal's wire format or a hosted/Server MailKite webhook. **Do not wire Postal here without an adapter:** its documented 5xx behavior is immediate failure. Map upstream-specific failures deliberately. SMTP intake adapters similarly commit before DATA 250; IMAP adapters commit before advancing cursors or flags.

## Durability and retries

`Queue` uses WAL plus synchronous FULL, one durable job per source/delivery ID/recipient, a 60-second lease and token fencing. Workers persist decisions before writing the reply. Run `npm run work` periodically to drain due jobs; retry delay is 1, 2, 4, 8 seconds before the fifth/final attempt. Exhaustion becomes `dead`, not silently dropped. Reclaimed crashed leases count toward the same bound. Inspect the printed states; dead jobs need operator investigation. `review` is held. `node cli.mjs approve <job-key>` explicitly approves a stored draft into the **local** reply sink; run work afterward.

Reply payloads have a deterministic Message-ID, `Auto-Submitted: auto-replied`, In-Reply-To copied from a valid parent Message-ID, and References extended with that parent (or inherited In-Reply-To if References is absent). No parent means no invented conversation link. Recipients and headers are application-owned, never model-selected.

Local reply insertion and job completion share a SQLite transaction. That gives one local reply even after reopening or lease reclamation. It is **not exactly-once SMTP**. Replacing the sink with `mk.send` leaves a crash window between remote acceptance and local completion. A stable Message-ID is not a transport dedupe guarantee. Use a verified provider idempotency contract or reconcile ambiguous outcomes before retrying. The supplied CLI cannot send live mail.

## Model adapter

Default `fixtureModel` is deterministic and makes no network requests. For a running OpenAI-compatible local server, set `MODEL_BASE_URL` (including `/v1`) and `MODEL_NAME` when running work; optional `MODEL_API_KEY` is read from environment only. `realModel` uses chat completions, a 15-second deadline and strict JSON validation. A typical Ollama-compatible base URL is `http://127.0.0.1:11434/v1`; supply a model you have installed. No model server or weights are included.

All real-adapter reply drafts are forced to `review` by the CLI. The adapter has no tools, mailbox-history access or recipient fields. Tests exercise its HTTP wire format against a loopback fixture, not actual inference. Implement a different model by providing an async `(message) => { action, body }` function; validate its output. For production support answers, supply approved knowledge and make authorization checks in code. The fixture's refund keywords are a teaching example, not a production classifier.

## MailKite SDK examples

`mailkite.mjs` exports `createSupportAgent(sessionToken, address, baseUrl?)` for the **hosted** management API and `sendThreadedReply(apiKey, baseUrl, reply)` for hosted or the self-hosted basic send API. Complete imports and function bodies are reproduced in the article. Route creation requires a management/session credential; sending uses an API key and an owned, verified sender domain on hosted. These helpers are tested only against loopback contract fixtures and are not called by the demo CLI.

`decodeHostedWebhook` uses `MailKite.verifyWebhook` on exact bytes, with its default five-minute **millisecond** timestamp check. **MailKite Server signs its webhook timestamps in seconds:** do not use this helper on Server deliveries or disable freshness to bypass the mismatch. Server payloads contain metadata and an admin-authenticated raw_url. Fetch only from an operator-configured origin; never follow an untrusted payload URL with an admin credential. Self-hosted routes are configured through their local admin interface, not the hosted `createRoute` function.

Server already supports BYO-key agent routes, but at inspected revision those aren't a durable application-job queue. Agent failures are logged; webhook delivery has its own retries. The demo's worker policy is independent of either product.

## Integration checklist

- Dovecot: IMAP poll/IDLE → UID-scoped raw MIME → intake; submit replies through Postfix. Sieve files mail or sends fixed vacation responses; standard Sieve isn't an LLM runtime.
- Haraka: recipient validation → queue hook persists MIME/job → OK; model after SMTP acceptance.
- WildDuck: REST mailbox/message reads → stable object ID → intake; submit using registered sender and message reference through ZoneMTA.
- Stalwart: discover JMAP session → Email/query/get and Email/changes → intake; create Email and EmailSubmission with permitted identity. Save sync state only after durable intake.
- Postal: inbound route → raw/processed adapter → durable intake; handle its timeout/status retry rules explicitly.
- MailKite Server: verify seconds-signature using a compatible verifier → metadata/raw retrieval → durable intake; basic SDK send uses local baseUrl and key. Hosted: verify SDK webhook + hosted event adapter, or use hosted agent route.

These are documented integration paths, **not implemented server-specific live adapters**. Only the demo-owned HTTP/MIME contract and model/SDK loopback fixtures run here.

## Verification and publication

See [research.md](research.md), [verification.md](verification.md), and [review.md](review.md). No live email was sent. DNS, TLS, spam/authentication checks, smarthost operation, provider dedupe and inbox placement require separate deployment validation. Public repository CI, hero creation, deployed links and six-viewport/theme rendering are pending parent gates. Local-only code has no deploy button because it isn't a publicly safe mail service. Parent can provide a clone/run sandbox after publishing the series repository.

MIT licensed; see LICENSE.
