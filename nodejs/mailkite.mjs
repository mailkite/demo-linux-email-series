// Docs: README.md. Hosted SDK examples, exercised with intercepted transport in tests.
import { MailKite } from 'mailkite';

export async function sendReceipt(mk) {
  return mk.send({
    from: 'app@example.com', to: 'customer@example.com',
    subject: 'Ticket 42 receipt', text: 'Log received.',
    attachments: [{ filename: 'receipt.txt', content: Buffer.from('ticket=42\n').toString('base64') }],
  });
}

export function receiveCloud(signature, raw, secret) {
  if (!MailKite.verifyWebhook(signature, raw, secret)) throw new Error('Invalid signature');
  const event = JSON.parse(raw.toString('utf8'));
  if (event.type !== 'email.received') return null;
  return { id: event.id, subject: event.subject, text: event.text };
}
