// Docs: ../verification.md. All actual network traffic is loopback SMTP.
import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { MailKite } from 'mailkite';
import { openSink } from '../sink.mjs';
import { readInbox } from '../imap.mjs';
import { receiveCloud, sendReceipt } from '../mailkite.mjs';
import { postalReceipt } from '../postal.mjs';

const message = {
  from: 'app@example.com', to: 'support@example.com', subject: 'Ticket 42 ✓',
  envelope: { from: 'bounce@example.com', to: ['ticket+42@example.com'] },
  text: 'Please inspect the attached log.',
  attachments: [{ filename: 'log.txt', content: 'status=ok\n' }],
};
async function withSink(options, run) {
  const sink = await openSink(options);
  const smtp = nodemailer.createTransport({ host: '127.0.0.1', port: sink.port, ignoreTLS: true });
  try { await run(sink, smtp); } finally { smtp.close(); await sink.close(); }
}

test('SMTP preserves envelope, Unicode subject, MIME body and attachment bytes', async () => {
  await withSink({}, async (sink, smtp) => {
    await smtp.sendMail(message);
    const record = sink.records[0];
    assert.deepEqual(record.recipients, ['ticket+42@example.com']);
    assert.equal(record.mail.to.value[0].address, 'support@example.com');
    assert.equal(record.mail.subject, message.subject);
    assert.equal(record.mail.text.trim(), message.text);
    assert.equal(record.mail.attachments[0].filename, 'log.txt');
    assert.equal(record.mail.attachments[0].content.toString(), 'status=ok\n');
    assert.ok(record.raw.includes(Buffer.from('multipart/mixed')));
  });
});
test('SMTP rejects unknown envelope recipient with 550', async () => {
  await withSink({}, async (sink, smtp) => {
    await assert.rejects(smtp.sendMail({ ...message, envelope: { to: ['other@example.com'] } }),
      error => error.responseCode === 550);
    assert.equal(sink.records.length, 0);
  });
});
test('storage failure tempfails with 451 and does not acknowledge a record', async () => {
  await withSink({ persist: async () => { throw new Error('disk full'); } }, async (sink, smtp) => {
    await assert.rejects(smtp.sendMail(message), error => error.responseCode === 451);
    assert.equal(sink.records.length, 0);
  });
});
test('oversized DATA rejected with 552', async () => {
  await withSink({ maxBytes: 1024 }, async (sink, smtp) => {
    await assert.rejects(smtp.sendMail({ ...message, text: 'x'.repeat(3000) }),
      error => error.responseCode === 552);
    assert.equal(sink.records.length, 0);
  });
});
test('IMAP adapter parses real MIME and releases read-only lock on handler failure', async () => {
  const mime = await nodemailer.createTransport({ streamTransport: true, buffer: true }).sendMail(message);
  let released = false;
  const client = {
    mailbox: { uidValidity: 19n, exists: 1 },
    async getMailboxLock(path, options) {
      assert.equal(path, 'INBOX'); assert.equal(options.readOnly, true);
      return { release() { released = true; } };
    },
    async *fetch(range, query) {
      assert.equal(range, '1:10'); assert.equal(query.source, true);
      yield { uid: 7, source: mime.message };
    },
  };
  await assert.rejects(readInbox(client, async ({ key, mail }) => {
    assert.equal(key, '19:7'); assert.equal(mail.subject, message.subject);
    assert.equal(mail.attachments[0].content.toString(), 'status=ok\n');
    throw new Error('consumer failed');
  }), /consumer failed/);
  assert.equal(released, true);
});
test('empty IMAP mailbox is not fetched', async () => {
  let released = false;
  await readInbox({ mailbox: { uidValidity: 1n, exists: 0 },
    async getMailboxLock() { return { release() { released = true; } }; },
    fetch() { throw new Error('must not fetch'); },
  }, async () => { throw new Error('must not handle'); });
  assert.equal(released, true);
});
test('MailKite SDK request is intercepted: cloud endpoint, auth, attachment encoding', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.mailkite.dev/v1/send');
    assert.equal(options.headers.Authorization, 'Bearer offline-test-key');
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.equal(Buffer.from(body.attachments[0].content, 'base64').toString(), 'ticket=42\n');
    return Response.json({ id: 'msg_offline', status: 'sent' });
  });
  assert.equal((await sendReceipt(new MailKite('offline-test-key'))).id, 'msg_offline');
});
test('cloud SDK verifier rejects tampering, stale timestamps and Server seconds signatures', () => {
  const raw = Buffer.from(JSON.stringify({ type: 'email.received', id: 'msg_fixture', subject: 'Ticket 42', text: 'Hello' }));
  const secret = 'fixture-only-secret';
  const sign = t => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.`).update(raw).digest('hex')}`;
  assert.equal(receiveCloud(sign(Date.now()), raw, secret).id, 'msg_fixture');
  assert.throws(() => receiveCloud(sign(Date.now()), Buffer.concat([raw, Buffer.from(' ')]), secret), /Invalid/);
  assert.throws(() => receiveCloud(sign(Date.now() - 600000), raw, secret), /Invalid/);
  assert.throws(() => receiveCloud(sign(Math.floor(Date.now() / 1000)), raw, secret), /Invalid/);
});
test('Haraka hook continues accepted recipient, rejects unknown, registers rcpt hook', async () => {
  const context = { exports: {}, DENY: 901 };
  runInNewContext(await readFile(new URL('../haraka-ticket.cjs', import.meta.url), 'utf8'), context);
  context.exports.register.call({ register_hook: (hook, handler) => {
    assert.equal(hook, 'rcpt'); assert.equal(handler, 'check_ticket');
  } });
  let code;
  context.exports.check_ticket(value => { code = value; }, {}, [{ address: () => 'other@example.com' }]);
  assert.equal(code, 901);
  context.exports.check_ticket(value => { code = value; }, {}, [{ address: () => 'ticket+42@example.com' }]);
  assert.equal(code, undefined);
});
test('Postal checks JSON status even on HTTP 200', async () => {
  const success = await postalReceipt('https://postal.example.com', 'offline-key', async (url, options) => {
    assert.equal(url, 'https://postal.example.com/api/v1/send/message');
    assert.equal(options.headers['X-Server-API-Key'], 'offline-key');
    assert.equal(JSON.parse(options.body).plain_body, 'Log received.');
    return Response.json({ status: 'success', data: { message_id: 'fixture' } });
  });
  assert.equal(success.message_id, 'fixture');
  await assert.rejects(postalReceipt('https://postal.example.com', 'offline-key', async () =>
    Response.json({ status: 'error', data: { code: 'NoContent' } })), /Postal rejected/);
});
