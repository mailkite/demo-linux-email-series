# Linux email integration demos

[![CI](https://github.com/mailkite/demo-linux-email-series/actions/workflows/ci.yml/badge.svg)](https://github.com/mailkite/demo-linux-email-series/actions/workflows/ci.yml)

Five runnable companions to the [MailKite Linux email series](https://mailkite.dev/blog/): local SMTP/IMAP protocol boundaries, MIME parsing, SQLite persistence, provider adapters, and reply automation. Default examples and tests use loopback fixtures and require no credentials, DNS configuration, or external email delivery.

## One-click Run: GitHub Codespaces

[![Run in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/mailkite/demo-linux-email-series?quickstart=1)

Open a Codespace, wait for the dependency setup to finish, then run an example in its terminal:

```sh
npm --prefix programmatic run demo
npm --prefix provider run demo
npm --prefix automation run demo
npm --prefix nodejs start
(cd python && .venv/bin/python demo.py)
```

The devcontainer provides **Node.js 24** and **Python 3.12**, installs the four npm lockfiles, and creates `python/.venv` with pinned requirements. Codespaces supplies a Linux environment with real sockets and SQLite. This button opens the development sandbox; examples run with the commands above. Persistent listeners stay on loopback. No public mail-service deployment is provisioned.

## Choose a demo

| Directory | What it exercises | Companion article |
| --- | --- | --- |
| [programmatic](programmatic/) | SMTP envelope validation, MIME parsing, SQLite commit before acknowledgement, SDK and signature fixtures | [Programmatic Linux email servers](https://mailkite.dev/blog/programmatic-linux-email-servers/) |
| [provider](provider/) | Tenant-scoped IMAP UID claims and notification acknowledgement, with an offline adapter | [Build a Linux email provider](https://mailkite.dev/blog/build-email-provider-linux-mailkite/) |
| [automation](automation/) | Durable reply queue, suppression rules, retries, approval, and threaded local replies | [Automate email replies with AI](https://mailkite.dev/blog/automate-email-replies-linux-ai/) |
| [nodejs](nodejs/) | SMTP/MIME round trip and IMAP, Haraka, Postal, and MailKite client boundaries | [Linux email servers with Node.js](https://mailkite.dev/blog/linux-email-servers-nodejs/) |
| [python](python/) | SMTP submission, IMAP UID retrieval, durable SQLite cursor, and hosted SDK fixtures | [Linux email servers with Python](https://mailkite.dev/blog/linux-email-servers-python/) |

Each directory's README documents its scope, command output, integration limits, and optional live configuration. Component research/review notes record the original handoff; shared publication and CI are maintained here.

## Clean install and test from the repository root

Requirements: Node.js 24 with npm, Python 3.12 with `venv` and pip, and a writable local filesystem.

```sh
git clone https://github.com/mailkite/demo-linux-email-series.git
cd demo-linux-email-series

for demo in programmatic provider automation nodejs; do
  npm --prefix "$demo" ci --ignore-scripts
  npm --prefix "$demo" test
done

python3.12 -m venv python/.venv
python/.venv/bin/python -m pip install -r python/requirements.txt
(cd python && . .venv/bin/activate && sh run.sh)
```

`python/run.sh` runs both the offline example and `unittest discover -s tests -v`. Node test suites exercise protocol, persistence, rejection, and adapter behavior; CI also executes each offline example. [GitHub Actions](https://github.com/mailkite/demo-linux-email-series/actions/workflows/ci.yml) runs all five suites on `ubuntu-latest` with these runtime versions.

Generated SQLite databases, installed dependencies, interpreter caches, screenshots, previews, and local secrets are ignored. Automation's example intentionally persists `automation.sqlite`; repeating it retains its queue state.

## Integration boundaries

These are teaching fixtures and client adapters, not full mail servers. Vendor-shaped HTTP fixtures demonstrate request contracts, not an end-to-end vendor deployment. Hosted and self-hosted MailKite webhook formats differ; consult the component notes before connecting a real service. The provider's explicitly selected `live` command needs your existing IMAPS service and sending credentials and sends an actual notification. The default Codespaces commands above stay offline.

## License

[MIT](LICENSE). Third-party dependencies and separately installed mail servers retain their own licenses.
