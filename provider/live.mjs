// Docs: README.md; docs/design.md
import { MailKite } from 'mailkite';
import { ImapFlow } from 'imapflow';
import { openLedger, readEvent, notify } from './adapter.mjs';

const required = ['TENANT_ID', 'IMAP_HOST', 'IMAP_USER', 'IMAP_PASSWORD',
  'MAILKITE_API_KEY', 'MAIL_FROM', 'NOTIFY_TO', 'IMAP_UID'];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} required`);
}
const tenant = { id: process.env.TENANT_ID, account: process.env.IMAP_USER,
  from: process.env.MAIL_FROM, to: process.env.NOTIFY_TO };
const imap = new ImapFlow({ host: process.env.IMAP_HOST, port: 993, secure: true,
  auth: { user: tenant.account, pass: process.env.IMAP_PASSWORD }, logger: false });
imap.on('error', () => imap.close());
const mk = new MailKite(process.env.MAILKITE_API_KEY);
const db = openLedger('provider.sqlite');
try {
  await imap.connect();
  const event = await readEvent(imap, tenant, Number(process.env.IMAP_UID));
  const job = await notify(db, tenant, event, mk);
  console.log(JSON.stringify({ status: job.status, providerId: job.provider_id }));
  if (job.status !== 'accepted') process.exitCode = 1;
} finally {
  imap.close();
  db.close();
}
