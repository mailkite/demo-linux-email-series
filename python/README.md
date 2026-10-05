# Python: Linux mail-server integration boundaries

Real loopback SMTP submission, IMAP retrieval, MIME parsing, and a persistent SQLite inbox cursor. The official MailKite Python SDK sends only to a local HTTP capture fixture; inbound webhook data is synthetic and signed locally. Companion to [Linux email servers with Python](https://mailkite.dev/blog/linux-email-servers-python/), staged as a draft on 2026-10-05.

Future repository: https://github.com/mailkite/demo-linux-email-series/tree/main/python.
This directory is the `python/` component of that series. Repository publication and CI are parent-owned and pending. No public deploy button: these unauthenticated plaintext fixtures must stay on loopback; this is a local-run demo, not a deployable mail service.

## Install and run

Use CPython 3.13 and [uv](https://docs.astral.sh/uv/) (verified on 3.13.12). From the repository root, enter `python/` first:

```sh
git clone https://github.com/mailkite/demo-linux-email-series.git
cd demo-linux-email-series/python
uv venv --python 3.13 .venv
uv pip install --python .venv/bin/python -r requirements.txt
source .venv/bin/activate
sh run.sh
python quickstart.py
python mime_example.py
python hosted_demo.py
```

Before repository publication, run the same install/run commands in this local directory. Standard `python3.13 -m venv .venv` + pip also works where ensurepip is available; the machine's default Python 3.14 had an ensurepip failure, so the verified setup uses uv explicitly.

All dependencies, including transitives, are pinned in `requirements.txt`. `aiosmtpd` avoids reimplementing SMTP (and the removed stdlib smtpd module). `mailkite-dev` is the official distribution; `from mailkite import MailKite` is the import. The SDK declares cryptography even though this demo doesn't use its encryption helpers. IMAP clients, email parsing, SQLite, HTTP captures, and unittest use stdlib.

## What runs

- `demo.py`: SMTP DATA → IMAP EXAMINE/UID SEARCH/UID FETCH literal → SQLite → reopen database and resume.
- `quickstart.py`: short complete loopback send/receive snippet, memory database.
- `mailflow.py`: TLS-default submission/IMAPS adapters, parser, durable single-worker cursor. Production hosts require explicit credentials; only exact `127.0.0.1` accepts `local=True`.
- `fixtures.py`: aiosmtpd sink plus intentionally narrow IMAP4rev1 TCP fixture. Supports CAPABILITY, LOGIN, EXAMINE, UID SEARCH/FETCH, LOGOUT for INBOX only. Login uses public fixture credentials. No TLS, IDLE, full search grammar, or server conformance claim.
- `mime_example.py`: transport-independent multipart parsing.
- `hosted.py`: SDK verification over raw bytes, durable duplicate suppression, SDK reply builder. No network at import.
- `hosted_demo.py`: signed synthetic hosted event + real SDK request over loopback HTTP.
- `http_adapters.py`: Postal send, WildDuck mailbox list, JMAP Session discovery + Email/query. HTTP captures test request shape; actual vendor deployments were not exercised. These examples use documented endpoint contracts, not a generic interchangeable API.
- `tests/test_mailflow.py`: 10 integration/failure tests, local servers with automatic teardown.
- `check_article.py`: AST parity of all three Python article snippets and structural/editorial diagnostics. Run `python check_article.py /absolute/path/to/linux-email-servers-python.md`.

All article snippets map to `quickstart.py`, `mime_example.py`, or `hosted.py`'s imports + `accept()` function. Execute the latter via `hosted_demo.py` or its tests; it requires the database initialized by `open_db()`. Source docstrings are not included in the article.

## Scope and correctness limits

The cursor key includes caller-defined server/account/folder scope, UIDVALIDITY, and UID. Each fetched raw message and cursor advance commit together. A failure stops at the failed UID; earlier successful messages remain durable. Rebuilding a mailbox changes its epoch and causes a rescan. IMAP4rev1's reverse `n:*` range behavior is deliberately reproduced and filtered by the client.

This is new-message ingestion, not mirroring flags/deletions, recovery of expunged mail, parallel-worker coordination, or exactly-once ticket/CSV side effects. Scope must identify one server, login identity, and INBOX. Run one poll worker per scope. Store processing state separately and use an outbox for durable scheduling. Production systems need message-size limits, selective fetch/reconciliation, credential handling, TLS, DNS, bounce processing, and monitoring.

Fixture SMTP accepts only `support@example.test`; rejected recipients and IMAP credentials are tested. Every listener binds `127.0.0.1` on an ephemeral port. No DNS mail routing, external sends, MailKite account, or production key is required. The SMTP Controller requires reserving a port before startup, so an unrelated process taking that port in the brief gap can fail startup; rerun if that happens.

The installed SDK 0.20.0 is synchronous and has no request timeout parameter in `request()`. Async applications should use bounded offloading or synchronous workers, not call it directly on the event loop. Supply real verified-domain sender/recipient values when deliberately adapting `send_reply()` to production; its `.test` addresses are local placeholders.

## Hosted versus self-hosted MailKite

Hosted inbound is `type: email.received` with stable `id`, structured envelope addresses, nullable content, and milliseconds signatures. Tests prove valid/tampered/stale signatures and duplicate suppression. SDK replies use `threadId` as `inReplyTo`, not the database `id`.

The inspected MailKite Server local backend instead emits `event: inbound`, scalar `from`, `rcpt`, `uid`, `raw_url`, and seconds signatures. It is not handled by `accept()`; a seconds timestamp fails hosted freshness checking. Don't disable freshness. Adapt the local backend contract explicitly or receive through its IMAP edge. Its `/v1/send` compatibility does not imply compatibility for management APIs or every send feature.

See [research.md](research.md), [verification.md](verification.md), and [review.md](review.md) for source provenance, observed results, and honest pending publication gates. License for the demo component: MIT, see [LICENSE](LICENSE).
