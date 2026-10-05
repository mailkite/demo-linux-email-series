# Research and implementation contract

Retrieved 2026-10-05. Audience: backend developers attaching support, triage, or approval workflows to Linux mail infrastructure. Search/LLM tutorial/comparison; Cluster C inbound + Cluster D agents. The local keyword matrix has no measured volume for this exact query; no demand numbers are asserted.

## Decision before implementation

Implement a provider-neutral raw-MIME intake with SQLite jobs and a transactional local reply sink. Keep model calls outside intake. All verification is offline/loopback; neither model fixtures nor SDK contract fixtures establish internet delivery.

Qualitative options, weighted for this educational demo (durability 40%, offline reproducibility 40%, adapter simplicity 20%; ordinal 1–5, not a product benchmark): SQLite jobs + local sink = 5/5/4 (4.8); in-memory webhook + immediate model = 1/5/5 (3.4); a full Postfix/Dovecot deployment = 4/2/2 (2.8). SQLite earns persistence and fault injection without installing a production mail stack. Its weakness is one-host operation and an intentionally local delivery guarantee.

Interface contract: intake requires a trusted adapter's source/delivery ID, envelope sender, receiving address, and MIME; it returns success only after storing a job. Workers persist validated model decisions before creating replies. Keys include source, stable delivery ID and receiving address, never just a sender-controlled Message-ID. Leases fence concurrent workers; retries retain decisions and deterministic reply IDs. Local reply insertion and completion commit together; remote sends cannot inherit that atomic guarantee.

Prior-art search: `mailkite-server/api-local/lib/webhooks.mjs` already has SQLite-backed webhook retries; `lib/routing.mjs` has pinned reply destinations and a single-completion agent. `web-monorepo/sdks/node/index.js` exposes `send`, `createRoute`, `agent`, and millisecond-timestamp `verifyWebhook`. This standalone public demo does not import private checkout paths. It uses the published SDK and its own minimal teaching queue.

## Primary-source ledger

| Official source | Verified claim / caveat |
|---|---|
| https://raw.githubusercontent.com/dovecot/documentation/main/docs/core/config/sieve/overview.md | Pigeonhole runs at LDA/LMTP; vacation and fileinto; standard Sieve cannot execute external programs; extprograms disabled by default. Docs site returned 403; official repository used. |
| https://www.postfix.org/pipe.8.html | Pipe delivery is after queue acceptance; exit status controls delivery/defer; fixed user and argv, no shell. |
| https://www.rfc-editor.org/rfc/rfc2177.txt | IDLE is notification, capability-gated; DONE before fetching; periodically reissue. |
| https://haraka.github.io/core/Plugins/ | rcpt and queue required; OK stops later hooks; DENYSOFT is temporary failure. |
| https://docs.wildduck.email/docs/architecture/overview | Suite combines Haraka, WildDuck, ZoneMTA, Rspamd, MongoDB, Redis. |
| https://docs.wildduck.email/docs/api/message-submission | POST /users/:user/submit; reference mailbox/id/action for replies; queues via ZoneMTA. |
| https://docs.wildduck.email/docs/wildduck-api/messages | List, get and full RFC822 source retrieval exposed; exact mailbox endpoints linked from this index. |
| https://raw.githubusercontent.com/stalwartlabs/website/main/src/content/docs/docs/http/jmap/index.md | Session discovery and /jmap; permissions apply. |
| https://www.rfc-editor.org/rfc/rfc8621.html | Email/query/get/changes and EmailSubmission/set; push prompts resynchronization; object ID differs from MIME Message-ID. |
| https://docs.postalserver.io/developer/http-payloads/ | Raw or processed HTTP payloads, five-second response, 200 success; 5xx fails immediately, other failures can retry. |
| https://www.rfc-editor.org/rfc/rfc3834.txt | Suppress non-no Auto-Submitted; auto-replied outbound; null reverse-path; reply destination and threading rules. |
| https://raw.githubusercontent.com/mailkite/server/main/docs/routes.md | Self-hosted BYO-provider agent exists; local-part patterns; message-only; forwarding/agent failures logged, unlike durable webhook retries; outbound caps missing. |
| https://github.com/mailkite/server/blob/main/api-local/lib/webhooks.mjs | Seconds timestamp, metadata + authenticated raw_url; five webhook attempts. |
| https://github.com/mailkite/server/blob/main/api-local/lib/routing.mjs | Pinned destinations; automatic-mail advice is prompt text, not an Auto-Submitted enforcement guard. |
| https://github.com/mailkite/server/blob/main/docs/v1.md | Basic SDK send compatible with local baseUrl; hosted management and agent endpoints not established; templates/attachments/scheduling refused. |
| https://github.com/mailkite/mailkite-node/blob/main/index.js | Inspected local equivalent (0.20.0), then installed npm 0.20.0: createRoute, agent, send, signature helper. |

## Scope and planned gates

- Build and run offline intake → MIME parsing → durable jobs → fixture decision → threaded local reply.
- Test reopening, duplicate delivery, loops, concurrent claims, lease recovery, bounded retries, and acknowledgement failure.
- Test real adapter wire format against loopback, never a paid/live model.
- Test hosted SDK functions against an explicitly labelled HTTP contract fixture.
- Self-review content with local dev-blog-review; parent owns hero, public repository/CI, rendering and publication.

Refresh by 2026-11-04 or after upgrades. Official default-branch docs are moving targets; production adapters must pin deployed server versions.
