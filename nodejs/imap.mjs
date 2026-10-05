// Docs: README.md. Read-only adapter; a configured IMAPS mailbox is required for CLI use.
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { pathToFileURL } from 'node:url';

export async function readInbox(client, handle) {
  const lock = await client.getMailboxLock('INBOX', { readOnly: true });
  try {
    const validity = String(client.mailbox.uidValidity);
    if (!client.mailbox.exists) return;
    for await (const message of client.fetch('1:10', { uid: true, source: true })) {
      await handle({ key: `${validity}:${message.uid}`, mail: await simpleParser(message.source) });
    }
  } finally { lock.release(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const name of ['IMAP_HOST', 'IMAP_USER', 'IMAP_PASSWORD']) {
    if (!process.env[name]) throw new Error(`Set ${name}`);
  }
  const client = new ImapFlow({ host: process.env.IMAP_HOST, port: 993, secure: true,
    auth: { user: process.env.IMAP_USER, pass: process.env.IMAP_PASSWORD }, logger: false });
  client.on('error', error => console.error(error.message));
  try {
    await client.connect();
    await readInbox(client, async ({ key, mail }) => console.log(key, mail.subject));
  } finally { if (client.usable) await client.logout(); else client.close(); }
}
