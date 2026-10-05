// Docs: README.md#durability-and-retries
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { normalize, composeReply } from './mail.mjs';
import { validateDecision } from './model.mjs';

export class Queue {
  constructor(path) {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS jobs (
        key TEXT PRIMARY KEY, raw TEXT NOT NULL, message TEXT NOT NULL,
        state TEXT NOT NULL, decision TEXT, attempts INTEGER NOT NULL DEFAULT 0,
        due INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0,
        token TEXT, error TEXT
      );
      CREATE TABLE IF NOT EXISTS replies (key TEXT PRIMARY KEY, payload TEXT NOT NULL);`);
  }
  async accept(event) {
    const message = await normalize(event);
    this.db.prepare('INSERT OR IGNORE INTO jobs(key,raw,message,state) VALUES(?,?,?,?)')
      .run(message.key, event.raw, JSON.stringify(message), message.suppressed ? 'suppressed' : 'pending');
    return { key: message.key, state: this.get(message.key).state };
  }
  get(key) { return this.db.prepare('SELECT * FROM jobs WHERE key=?').get(key); }
  rows() { return this.db.prepare('SELECT key,state,attempts,error FROM jobs ORDER BY rowid').all(); }
  replies() { return this.db.prepare('SELECT payload FROM replies ORDER BY rowid').all().map((row) => JSON.parse(row.payload)); }
  claim(now) {
    this.db.prepare("UPDATE jobs SET state='dead',token=NULL,error='LeaseExhausted' WHERE state='working' AND lease_until<=? AND attempts>=5").run(now);
    const token = randomUUID();
    return this.db.prepare(`UPDATE jobs SET state='working',token=?,lease_until=?,attempts=attempts+1
      WHERE key=(SELECT key FROM jobs WHERE (state='pending' AND due<=?) OR
      (state='working' AND lease_until<=?) ORDER BY rowid LIMIT 1) RETURNING *`)
      .get(token, now + 60_000, now, now);
  }
  approve(key) {
    const row = this.get(key);
    if (!row || row.state !== 'review') throw new Error('Job is not awaiting review');
    const decision = JSON.parse(row.decision);
    return this.db.prepare("UPDATE jobs SET state='pending',decision=?,attempts=0,due=0 WHERE key=? AND state='review'")
      .run(JSON.stringify({ action: 'reply', body: decision.body }), key);
  }
  async work(model, { now = Date.now(), beforeSink = async () => {} } = {}) {
    const row = this.claim(now);
    if (!row) return false;
    try {
      const message = JSON.parse(row.message);
      const decision = row.decision ? JSON.parse(row.decision) : validateDecision(await model(message));
      const saved = this.db.prepare('UPDATE jobs SET decision=? WHERE key=? AND token=? AND state=\'working\'')
        .run(JSON.stringify(decision), row.key, row.token);
      if (!saved.changes) return true; // Another worker reclaimed an expired lease.
      if (decision.action === 'reply') await beforeSink();
      this.db.exec('BEGIN IMMEDIATE');
      try {
        const current = this.get(row.key);
        if (current.token === row.token && current.state === 'working') {
          if (decision.action === 'reply') this.db.prepare('INSERT OR IGNORE INTO replies VALUES(?,?)')
            .run(row.key, JSON.stringify(composeReply(message, decision.body)));
          this.db.prepare('UPDATE jobs SET state=?,token=NULL,lease_until=0,error=NULL WHERE key=?')
            .run(decision.action === 'review' ? 'review' : 'done', row.key);
        }
        this.db.exec('COMMIT');
      } catch (error) { this.db.exec('ROLLBACK'); throw error; }
    } catch (error) {
      this.db.prepare(`UPDATE jobs SET state=?,due=?,token=NULL,lease_until=0,error=? WHERE key=? AND token=?`)
        .run(row.attempts >= 5 ? 'dead' : 'pending', now + Math.min(60_000, 1000 * 2 ** (row.attempts - 1)),
          error instanceof Error ? error.name : 'Error', row.key, row.token);
    }
    return true;
  }
  close() { this.db.close(); }
}
