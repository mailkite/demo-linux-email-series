// Docs: docs/contract.md
import { MailKite } from 'mailkite';

export function decodeWebhook(signature, rawBody, secret) {
  if (!MailKite.verifyWebhook(signature, rawBody, secret)) {
    throw new Error('Invalid or expired webhook signature');
  }
  return JSON.parse(rawBody);
}
