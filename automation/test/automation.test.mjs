// Docs: ../verification.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Queue } from '../queue.mjs';
import { fixture } from '../fixture.mjs';
import { fixtureModel, realModel, validateDecision } from '../model.mjs';
import { intake } from '../server.mjs';
import { createServer } from 'node:http';
import { createHmac } from 'node:crypto';
import { createSupportAgent, sendThreadedReply, decodeHostedWebhook } from '../mailkite.mjs';

function database(t) {
  const dir = mkdtempSync(join(process.cwd(), '.test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'queue.sqlite');
  const queue = new Queue(path);
  t.after(() => { try { queue.close(); } catch { /* Already reopened by persistence test. */ } });
  return { path, queue };
}
async function listen(t, server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('HTTP acknowledgement follows persistence; reopening and replay produce one threaded reply', async (t) => {
  const { path, queue } = database(t);
  const url = await listen(t, intake(queue));
  const response = await fetch(`${url}/events`, { method: 'POST', body: JSON.stringify(fixture()) });
  assert.equal(response.status, 200);
  const { key } = await response.json();
  assert.equal(queue.get(key).state, 'pending');
  queue.close();
  const reopened = new Queue(path);
  t.after(() => reopened.close());
  await reopened.accept(fixture());
  await reopened.work(fixtureModel);
  await reopened.accept(fixture());
  assert.equal(await reopened.work(fixtureModel), false);
  assert.equal(reopened.replies().length, 1);
  const reply = reopened.replies()[0];
  assert.equal(reply.to, 'customer@example.com');
  assert.equal(reply.inReplyTo, '<ticket-42@example.com>');
  assert.equal(reply.headers.References, '<ticket-root@example.com> <ticket-42@example.com>');
  assert.equal(reply.headers['Auto-Submitted'], 'auto-replied');
});

test('storage failure never returns success and never runs a model', async (t) => {
  const url = await listen(t, intake({ accept: async () => { throw new Error('disk unavailable'); } }));
  assert.equal((await fetch(`${url}/events`, { method: 'POST', body: JSON.stringify(fixture()) })).status, 503);
});

test('automated mail, null reverse-path, self sender, lists and duplicate headers suppress before model', async (t) => {
  const { queue } = database(t);
  for (const [i, event] of [
    fixture('a', 'Auto-Submitted: AUTO-REPLIED; x-test=1\r\n'),
    fixture('b', 'Auto-Submitted: no\r\nAuto-Submitted: no\r\n'),
    fixture('c', 'List-ID: <list.example.com>\r\n'),
    fixture('d', 'Precedence: bulk\r\n'),
    { ...fixture('e'), envelopeFrom: '' },
    { ...fixture('f'), envelopeFrom: 'support@example.com' },
  ].entries()) {
    const { key } = await queue.accept({ ...event, deliveryId: `suppress-${i}` });
    assert.equal(queue.get(key).state, 'suppressed');
  }
  assert.equal(await queue.work(() => { throw new Error('must not run'); }), false);
  await queue.accept(fixture('human', 'Auto-Submitted: no; x-test=1\r\n'));
  await queue.work(fixtureModel);
  assert.equal(queue.replies().length, 1);
});

test('retry persists decision; restart does not regenerate body and backoff is honored', async (t) => {
  const { queue, path } = database(t);
  const { key } = await queue.accept(fixture());
  let calls = 0;
  await queue.work(async () => { calls++; return { action: 'reply', body: 'Stable draft' }; }, {
    now: 100, beforeSink: async () => { throw new Error('sink temporarily down'); },
  });
  assert.equal(queue.get(key).due, 1100);
  assert.equal(await queue.work(fixtureModel, { now: 1099 }), false);
  queue.close();
  const reopened = new Queue(path); t.after(() => reopened.close());
  await reopened.work(() => { calls++; throw new Error('must not regenerate'); }, { now: 1100 });
  assert.equal(calls, 1);
  assert.equal(reopened.replies()[0].text, 'Stable draft');
});

test('failed model retries stop at five attempts', async (t) => {
  const { queue } = database(t);
  const { key } = await queue.accept(fixture());
  for (const now of [0, 1000, 3000, 7000, 15000]) await queue.work(async () => { throw new Error('bad model'); }, { now });
  assert.equal(queue.get(key).state, 'dead');
  assert.equal(queue.get(key).attempts, 5);
  assert.equal(await queue.work(fixtureModel, { now: 100000 }), false);
});

test('concurrent workers and expired-lease fencing create one reply', async (t) => {
  const { queue } = database(t);
  await queue.accept(fixture());
  let release;
  const paused = new Promise((resolve) => { release = resolve; });
  const stale = queue.work(async () => { await paused; return { action: 'reply', body: 'stale' }; }, { now: 0 });
  assert.equal(await queue.work(fixtureModel, { now: 1 }), false);
  await queue.work(fixtureModel, { now: 60001 });
  release(); await stale;
  assert.equal(queue.replies().length, 1);
  assert.notEqual(queue.replies()[0].text, 'stale');
});

test('repeated worker crashes exhaust leases instead of retrying indefinitely', async (t) => {
  const { queue } = database(t);
  const { key } = await queue.accept(fixture());
  for (let attempt = 0; attempt < 5; attempt++) assert.ok(queue.claim(attempt * 60001));
  assert.equal(queue.claim(5 * 60001), undefined);
  assert.equal(queue.get(key).state, 'dead');
  assert.equal(queue.get(key).error, 'LeaseExhausted');
});

test('review requires explicit approval, model cannot select destinations', async (t) => {
  const { queue } = database(t);
  const { key } = await queue.accept(fixture());
  await queue.work(async () => ({ action: 'review', body: 'Draft awaiting approval' }));
  assert.equal(queue.get(key).state, 'review');
  assert.equal(queue.replies().length, 0);
  queue.approve(key);
  await queue.work(() => { throw new Error('must use approved draft'); });
  assert.equal(queue.replies().length, 1);
  assert.throws(() => validateDecision({ action: 'reply', body: 'Hi', to: 'intruder@example.com' }));
});

test('sender-controlled Message-ID is not the dedupe key; missing parent does not invent threading', async (t) => {
  const { queue } = database(t);
  await queue.accept(fixture('one'));
  await queue.accept(fixture('two'));
  const missing = fixture('three');
  missing.raw = missing.raw.replace('Message-ID: <ticket-42@example.com>\r\n', '');
  await queue.accept(missing);
  while (await queue.work(fixtureModel)) {}
  assert.equal(queue.replies().length, 3);
  assert.equal(queue.replies()[2].inReplyTo, undefined);
  assert.equal(queue.replies()[2].headers.References, undefined);
});

test('References falls back to inherited In-Reply-To and invalid model output stays retryable', async (t) => {
  const { queue } = database(t);
  const event = fixture();
  event.raw = event.raw.replace('References: <ticket-root@example.com>', 'In-Reply-To: <ticket-root@example.com>');
  const { key } = await queue.accept(event);
  await queue.work(async () => ({ action: 'reply', body: '' }), { now: 0 });
  assert.equal(queue.get(key).state, 'pending');
  assert.equal(queue.get(key).decision, null);
  await queue.work(fixtureModel, { now: 1000 });
  assert.equal(queue.replies()[0].headers.References, '<ticket-root@example.com> <ticket-42@example.com>');
});

test('OpenAI-compatible real adapter uses the expected wire format against a local fixture', async (t) => {
  const url = await listen(t, createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks));
    assert.equal(req.url, '/v1/chat/completions');
    assert.equal(body.model, 'fixture-model');
    assert.equal(body.messages[0].role, 'system');
    assert.equal(body.tools, undefined);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ choices: [{ message: { content: '{"action":"review","body":"Draft"}' } }] }));
  }));
  const adapter = realModel({ baseUrl: `${url}/v1`, model: 'fixture-model' });
  assert.deepEqual(await adapter({ subject: 'support', text: 'please help' }), { action: 'review', body: 'Draft' });
});

test('SDK route and send serialize against a loopback contract fixture; no real send occurs', async (t) => {
  const requests = [];
  const url = await listen(t, createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    requests.push({ path: req.url, auth: req.headers.authorization, body: JSON.parse(Buffer.concat(chunks)) });
    res.setHeader('Content-Type', 'application/json'); res.end('{"id":"fixture-only"}');
  }));
  await createSupportAgent('fixture-session', 'support@example.com', url);
  await sendThreadedReply('fixture-key', url, { from: 'support@example.com', to: 'customer@example.com', subject: 'Re: question', text: 'Hi', inReplyTo: '<parent@example.com>', headers: { 'Auto-Submitted': 'auto-replied' } });
  assert.equal(requests[0].path, '/api/routes');
  assert.equal(requests[0].body.agentContext, 'message');
  assert.equal(requests[1].path, '/v1/send');
  assert.equal(requests[1].body.inReplyTo, '<parent@example.com>');
});

test('hosted SDK signature verification rejects tampering, stale timestamps and seconds contract', () => {
  const raw = '{"type":"email.received"}', secret = 'offline-test-secret';
  const sign = (t) => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex')}`;
  assert.equal(decodeHostedWebhook(sign(Date.now()), raw, secret).type, 'email.received');
  assert.throws(() => decodeHostedWebhook(sign(Date.now()), raw + ' ', secret));
  assert.throws(() => decodeHostedWebhook(sign(Date.now() - 600000), raw, secret));
  assert.throws(() => decodeHostedWebhook(sign(Math.floor(Date.now() / 1000)), raw, secret));
});
