// Docs: docs/design.md; verification.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MailKite } from 'mailkite';
import { openLedger, readEvent, notify } from '../adapter.mjs';
import { tenant, fixtureImap, mockApi } from './support.mjs';

test('SDK HTTP boundary and concurrent duplicate claims survive DB reopen', async () => {
  const api = await mockApi();
  const dir = mkdtempSync(join(tmpdir(), 'provider-'));
  let db = openLedger(join(dir, 'jobs.sqlite'));
  try {
    const mk = new MailKite('offline-test-key', api.baseUrl);
    const imap = fixtureImap();
    const event = await readEvent(imap, tenant, 42);
    assert.equal(imap.released, true);
    await Promise.all([notify(db, tenant, event, mk), notify(db, tenant, event, mk)]);
    db.close();
    db = openLedger(join(dir, 'jobs.sqlite'));
    assert.equal((await notify(db, tenant, event, mk)).status, 'accepted');
    assert.equal(api.requests.length, 1);
    const req = api.requests[0];
    assert.equal(req.path, '/v1/send');
    assert.equal(req.method, 'POST');
    assert.equal(req.auth, 'Bearer offline-test-key');
    assert.deepEqual(req.body, { from: tenant.from, to: tenant.to,
      replyTo: tenant.account, subject: 'New message in your Linux mailbox',
      text: `Open ${tenant.account}: INBOX UID 42.`, trackOpens: false, trackClicks: false });
  } finally { db.close(); await api.close(); rmSync(dir, { recursive: true }); }
});

test('tenant spoof blocked; UIDVALIDITY and tenant account partition keys', async () => {
  const api = await mockApi();
  const db = openLedger();
  try {
    const mk = new MailKite('offline-test-key', api.baseUrl);
    const first = await readEvent(fixtureImap(), tenant, 42);
    await assert.rejects(notify(db, tenant, { ...first, tenantId: 'evil' }, mk), /mismatch/);
    await assert.rejects(notify(db, tenant, { ...first, account: 'other@example.com' }, mk), /mismatch/);
    assert.equal(api.requests.length, 0);
    await notify(db, tenant, first, mk);
    await notify(db, tenant, await readEvent(fixtureImap(71n), tenant, 42), mk);
    const other = { ...tenant, id: 'other', account: 'other@example.com' };
    await notify(db, other, await readEvent(fixtureImap(), other, 42), mk);
    assert.equal(api.requests.length, 3);
  } finally { db.close(); await api.close(); }
});

for (const mode of ['disconnect', 'reject', 'malformed']) {
  test(`${mode}: held as unknown, never resent automatically`, async () => {
    const api = await mockApi(mode);
    const db = openLedger();
    try {
      const mk = new MailKite('offline-test-key', api.baseUrl);
      const event = await readEvent(fixtureImap(), tenant, 42);
      assert.equal((await notify(db, tenant, event, mk)).status, 'unknown');
      assert.equal((await notify(db, tenant, event, mk)).status, 'unknown');
      assert.equal(api.requests.length, 1);
    } finally { db.close(); await api.close(); }
  });
}

test('missing UID releases mailbox lock and never creates a job', async () => {
  const imap = fixtureImap(70n, false);
  await assert.rejects(readEvent(imap, tenant, 42), /not found/);
  assert.equal(imap.released, true);
  await assert.rejects(readEvent(imap, tenant, 0), /positive UID/);
});

test('crash after durable claim holds sending state without outbound retry', async () => {
  const db = openLedger();
  const event = await readEvent(fixtureImap(), tenant, 42);
  const key = JSON.stringify([tenant.id, tenant.account, 'INBOX', '70', 42]);
  db.prepare("INSERT INTO jobs(source_key,status) VALUES (?, 'sending')").run(key);
  try {
    const job = await notify(db, tenant, event, { send() { assert.fail('must not retry'); } });
    assert.equal(job.status, 'sending');
  } finally { db.close(); }
});
