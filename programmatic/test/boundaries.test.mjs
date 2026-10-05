// Docs: ../docs/contract.md
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { createHmac } from 'node:crypto';
import nodemailer from 'nodemailer';
import { createInbox } from '../inbox.mjs';
import { sendTicket } from '../sdk-send.mjs';
import { decodeWebhook } from '../webhook.mjs';

test('SMTP accepts only known envelope recipients, parses MIME, and survives reopening', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'smtp-test-'));
  const path = join(dir, 'inbox.sqlite');
  let inbox = createInbox(path);
  try {
    const port = await inbox.listen();
    const smtp = nodemailer.createTransport({ host: '127.0.0.1', port, ignoreTLS: true });
    await assert.rejects(smtp.sendMail({ from: 'sender@example.com', to: 'unknown@example.com', text: 'No' }), error => error.responseCode === 550 && error.command === 'RCPT TO');
    assert.equal(inbox.rows().length, 0);
    const result = await smtp.sendMail({
      envelope: { from: 'sender@example.com', to: 'ticket+42@example.com' },
      from: 'sender@example.com', to: 'header-only@example.com',
      subject: 'Unicode ✓', text: 'Invoice 42', html: '<p>Invoice 42</p>',
      attachments: [{ filename: 'note.txt', content: 'local fixture' }],
    });
    assert.deepEqual(result.accepted, ['ticket+42@example.com']);
    assert.equal(inbox.rows()[0].subject, 'Unicode ✓');
    assert.match(inbox.rows()[0].text, /Invoice 42/);
    assert.equal(JSON.parse(inbox.rows()[0].envelope).rcptTo[0].address, 'ticket+42@example.com');
    await inbox.close();
    inbox = createInbox(path);
    assert.equal(inbox.rows().length, 1);
    assert.match(Buffer.from(inbox.rows()[0].raw).toString(), /note.txt/);
  } finally {
    await inbox.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test('published MailKite SDK sends through a loopback contract fixture to real local SMTP', async () => {
  const inbox = createInbox(':memory:');
  const port = await inbox.listen();
  const smtp = nodemailer.createTransport({ host: '127.0.0.1', port, ignoreTLS: true });
  const fixture = createServer(async (req, res) => {
    try {
      assert.equal(req.url, '/v1/send');
      assert.equal(req.method, 'POST');
      assert.equal(req.headers.authorization, 'Bearer fixture-only');
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks));
      assert.equal(body.subject, 'Invoice question');
      await smtp.sendMail(body);
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'msg_fixture', status: 'sent' }));
    } catch (error) {
      res.writeHead(500);
      res.end(error.message);
    }
  });
  await new Promise(resolve => fixture.listen(0, '127.0.0.1', resolve));
  try {
    const result = await sendTicket(`http://127.0.0.1:${fixture.address().port}`, 'fixture-only');
    assert.equal(result.id, 'msg_fixture');
    assert.equal(inbox.rows()[0].subject, 'Invoice question');
    console.log('SDK fixture: /v1/send → local SMTP → SQLite passed');
  } finally {
    await new Promise(resolve => fixture.close(resolve));
    await inbox.close();
  }
});

test('SDK webhook verification rejects changed bytes, wrong secrets and stale events', () => {
  const secret = 'offline-fixture-secret';
  const raw = '{"type":"email.received","subject":"Invoice question"}';
  const sign = t => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex')}`;
  const signature = sign(Date.now());
  assert.equal(decodeWebhook(signature, raw, secret).subject, 'Invoice question');
  assert.throws(() => decodeWebhook(signature, raw + ' ', secret));
  assert.throws(() => decodeWebhook(signature, raw, 'wrong'));
  assert.throws(() => decodeWebhook(sign(Date.now() - 600000), raw, secret));
});
