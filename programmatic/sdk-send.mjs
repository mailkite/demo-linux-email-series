// Docs: docs/contract.md
import { MailKite } from 'mailkite';

export async function sendTicket(baseUrl, apiKey) {
  const mk = new MailKite({ apiKey, baseUrl });
  return mk.send({
    from: 'sender@example.com',
    to: 'ticket+42@example.com',
    subject: 'Invoice question',
    text: 'Please check invoice 42.',
  });
}
