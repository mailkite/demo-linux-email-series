// Docs: docs/contract.md
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import nodemailer from 'nodemailer';
import { createInbox } from './inbox.mjs';

const dir = await mkdtemp(join(tmpdir(), 'mail-boundary-'));
const inbox = createInbox(join(dir, 'inbox.sqlite'));
try {
  const port = await inbox.listen();
  const smtp = nodemailer.createTransport({ host: '127.0.0.1', port, ignoreTLS: true });
  const result = await smtp.sendMail({ from: 'sender@example.com', to: 'ticket+42@example.com', subject: 'Invoice question', text: 'Please check invoice 42.' });
  console.log('SMTP accepted:', result.accepted.join(', '));
  console.log('SQLite stored:', inbox.rows()[0].subject);
} finally {
  await inbox.close();
  await rm(dir, { recursive: true, force: true });
}
