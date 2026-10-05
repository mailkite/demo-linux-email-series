// Docs: docs/design.md
import { DatabaseSync } from 'node:sqlite';

export function openLedger(path = ':memory:') {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS jobs (
      source_key TEXT PRIMARY KEY, status TEXT NOT NULL,
      provider_id TEXT, provider_status TEXT
    )`);
  return db;
}

export async function readEvent(imap, tenant, uid) {
  if (!Number.isSafeInteger(uid) || uid < 1) throw new Error('positive UID required');
  const lock = await imap.getMailboxLock('INBOX', { readOnly: true });
  try {
    const validity = imap.mailbox?.uidValidity;
    if (validity == null) throw new Error('UIDVALIDITY unavailable');
    const message = await imap.fetchOne(uid, { uid: true }, { uid: true });
    if (!message || message.uid !== uid) throw new Error('UID not found');
    return { tenantId: tenant.id, account: tenant.account,
      mailbox: 'INBOX', uidValidity: String(validity), uid };
  } finally {
    lock.release();
  }
}

export async function notify(db, tenant, event, mk) {
  if (event.tenantId !== tenant.id || event.account !== tenant.account ||
      event.mailbox !== 'INBOX') throw new Error('tenant/mailbox mismatch');
  if (!tenant.id || !tenant.account || !tenant.from || !tenant.to ||
      !event.uidValidity || !Number.isSafeInteger(event.uid) || event.uid < 1) {
    throw new Error('incomplete trusted configuration');
  }
  const key = JSON.stringify([tenant.id, tenant.account, event.mailbox,
    event.uidValidity, event.uid]);
  const claimed = db.prepare(
    "INSERT OR IGNORE INTO jobs(source_key,status) VALUES (?, 'sending')"
  ).run(key).changes;
  if (claimed) {
    try {
      const result = await mk.send({
        from: tenant.from, to: tenant.to, replyTo: tenant.account,
        subject: 'New message in your Linux mailbox',
        text: `Open ${tenant.account}: INBOX UID ${event.uid}.`,
        trackOpens: false, trackClicks: false,
      });
      if (!result?.id || !['queued', 'sent'].includes(result.status)) {
        throw new Error('unrecognized send acknowledgement');
      }
      db.prepare(`UPDATE jobs SET status='accepted', provider_id=?,
        provider_status=? WHERE source_key=?`).run(result.id, result.status, key);
    } catch {
      // This includes explicit rejection: operator review, never blind resend.
      db.prepare("UPDATE jobs SET status='unknown' WHERE source_key=?").run(key);
    }
  }
  return db.prepare('SELECT * FROM jobs WHERE source_key=?').get(key);
}
