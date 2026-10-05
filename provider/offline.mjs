// Docs: README.md; verification.md
import { MailKite } from 'mailkite';
import { openLedger, readEvent, notify } from './adapter.mjs';
import { tenant, fixtureImap, mockApi } from './test/support.mjs';

const api = await mockApi();
const db = openLedger();
try {
  const mk = new MailKite('offline-test-key', api.baseUrl);
  const event = await readEvent(fixtureImap(), tenant, 42);
  const first = await notify(db, tenant, event, mk);
  const duplicate = await notify(db, tenant, event, mk);
  console.log(JSON.stringify({ first: first.status, duplicate: duplicate.status,
    providerId: first.provider_id, httpRequests: api.requests.length }));
} finally {
  db.close();
  await api.close();
}
