# Research record — 2026-10-05

Track: search/LLM reference; MailKite dev blog style. Audience: backend/multi-product builders choosing an integration boundary. Primary phrase: programmatic Linux email servers. Supporting phrases: Haraka hooks, Postfix policy service, Exim pipe transport, Postal API, WildDuck REST, ZoneMTA zones, Stalwart JMAP.

Keyword matrix read: `.claude/skills/mailkite-seo/reference/keyword-matrix.md`, last updated 2026-10-03. This exact Linux query has no measured volume/KD entry; no invented demand or SERP claim. Cluster A programmable email is supporting positioning, Cluster C inbound/webhook is adjacent. This page targets server programming boundaries, not the pillar's broad inventory or siblings' language/provider/AI implementation intent.

## Official live sources actually fetched

| URL | Verified fact / application |
|---|---|
| https://haraka.github.io/core/Plugins/ | rcpt and queue plugins required; hooks, next return codes and ordering; outbound hooks exist |
| https://www.postfix.org/SMTPD_POLICY_README.html | policy request attributes, action replies, sockets and ordering |
| https://www.postfix.org/MILTER_README.html | before-queue protocol, OpenDKIM, SMTP/non-SMTP filters, timeouts and chroot sockets |
| https://www.exim.org/exim-html-current/doc/html/spec_html/ch-access_control_lists.html | acceptance/defer/deny per SMTP stage, RCPT guidance |
| https://www.exim.org/exim-html-current/doc/html/spec_html/ch-the_pipe_transport.html | message on stdin, command privileges, concurrency and temporary-error exits |
| https://docs.postalserver.io/developer/api/ | send API, structured/raw messages, explicit incomplete management scope |
| https://docs.postalserver.io/developer/http-payloads/ | processed/raw formats; 5-second response; 18 attempts except immediate 5xx failure |
| https://docs.postalserver.io/getting-started/prerequisites/ | Docker, MariaDB >=10.6; RabbitMQ not listed (corrects inherited pillar assertion) |
| https://raw.githubusercontent.com/zone-eu/wildduck/master/README.md | mailbox server, MongoDB, EUPL license |
| https://docs.wildduck.email | REST mailbox controls, separate SMTP components |
| https://docs.wildduck.email/docs/architecture/overview | suite component roles, REST submission through ZoneMTA, MongoDB/Redis |
| https://github.com/zone-eu/zone-mta | outbound-only, source-IP zones, plugins, MongoDB/Redis, at-least-once delivery |
| https://stalw.art/docs/install/ | integrated protocols and storage/directory setup; current documentation paths |
| https://raw.githubusercontent.com/stalwartlabs/stalwart/main/README.md | JMAP, Sieve, Milter/MTA hooks and modular storage; edition distinction |
| https://raw.githubusercontent.com/stalwartlabs/website/main/src/content/docs/docs/http/jmap/index.md | /.well-known/jmap discovery, /jmap endpoint, permissions |
| https://raw.githubusercontent.com/stalwartlabs/website/main/src/content/docs/docs/http/jmap/protocol.md | request/get/set/query/changes limits, synchronization protocol surface |
| https://raw.githubusercontent.com/stalwartlabs/website/main/src/content/docs/docs/mta/filter/mtahooks.md | SMTP stages, HTTP JSON decisions, tempFailOnError |
| https://raw.githubusercontent.com/mailkite/server/main/README.md | pre-1.0, stateless edges, SQLite backend, routes and limited developer API |
| https://raw.githubusercontent.com/mailkite/server/main/docs/contract.md | durable ingest acceptance, non-2xx tempfail, edge/user trust, seconds signature for raw ingest |
| https://raw.githubusercontent.com/mailkite/server/main/docs/v1.md | verified SDK-compatible /v1/send subset, message reads, batch; hosted-only fields refused, tracking no-op, smarthost semantics |

Fetched missing/stale routes (not used as citations): WildDuck `/docs/` = 404; `/docs/general/install/` empty; Stalwart `/docs/api/`, `/docs/api/jmap/overview/`, `/docs/category/jmap/` = 404; replaced with fetched official repository documentation. Nodemailer `/smtp-server` and MailKite `/docs/webhooks` = 404; no claims sourced to these. Exim ACL body was very large; reviewed returned first sections for the bounded claims used.

Local references read: AGENTS.md, pillar, docs/CODE-SAMPLES.md, local mailkite-seo skill and keyword matrix, MailKite dev-blog contract, docs/blog/README.md, local dev-blog-review skill, HN layout, reviewer, editorial heuristics and AI-slop detection. SDK source confirms webhook milliseconds; edge contract uses seconds. This distinction is explicit in post and README.

## Synthesis and scope

Original contribution: one taxonomy connects timing of customization to retry ownership rather than ranking unlike projects by popularity. Qualitative difficulty rubric declared explicitly; not installed-project measurements. No fabricated usage, benchmarks, star counts, anecdotes, quotations or security comparison.

Plan completed: live source retrieval → minimal loopback boundary artifact → runtime tests → draft with 2 SVGs and mapped snippets → review. User chose topic, demo scope and pending parent cover/publication; source/decision notes live here because user permits no root-doc edits.

Refresh by 2026-11-04: refetch current prerequisites, SDK-compatible self-host scope, Stalwart JMAP/hooks and provider error semantics; review on every server upgrade.
