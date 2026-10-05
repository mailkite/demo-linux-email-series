# Demo contract and decision

Audience: backend developers choosing where application code belongs in a Linux mail stack.
Job: observe pre-acceptance recipient policy versus post-acceptance application work.

- `createInbox(path)` returns a loopback-only SMTP listener and SQLite read/close functions.
- It requires Node's SQLite module, smtp-server and mailparser; rejects every recipient except `ticket+42@example.com`.
- It commits raw MIME, envelope and parsed text before a successful DATA response. Failed persistence produces SMTP 451.
- The demo never looks up recipient MX records or relays externally; SQLite rows survive reopening.
- Existing-code search: `SMTPServer|onRcptTo` in sibling demo `.mjs` files found no reusable implementation. MailKite's existing SDK already provides send and webhook verification, so those are imported rather than recreated.

Options weighed qualitatively: educational boundary fidelity (50%), offline repeatability (30%), installation simplicity (20%).
Chosen: smtp-server + SQLite, highest fit for an isolated acceptance experiment. Pros: real SMTP, durable local acceptance, no infrastructure accounts. Cons: not Haraka, no production queue worker or spam/auth/TLS stack.
Haraka instance: stronger project-specific fidelity but more plugin/bootstrap machinery; deferred to the Node.js sibling.
Full Postal/WildDuck/Stalwart deployments: useful operational evaluation but several databases/protocol services, poor fit for this minimal comparison artifact.

SDK fixture: `/v1/send` on loopback accepts only a fixed fixture bearer token and forwards to this inbox. It exercises the published SDK serialization and real local SMTP, not the MailKite Server implementation or Cloud delivery.
