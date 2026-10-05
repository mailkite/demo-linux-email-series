// Docs: README.md#mailkite-sdk-examples
import { MailKite } from 'mailkite';

export async function createSupportAgent(sessionToken, address, baseUrl = 'https://api.mailkite.dev') {
  const mk = new MailKite({ accessToken: sessionToken, baseUrl });
  return mk.createRoute({
    match: address,
    action: 'agent',
    agentPrompt: 'Triage support mail. Do not approve refunds or change accounts. Escalate uncertain requests to the account owner.',
    agentContext: 'message',
  });
}

export async function sendThreadedReply(apiKey, baseUrl, reply) {
  const mk = new MailKite({ apiKey, baseUrl });
  return mk.send(reply);
}

export function decodeHostedWebhook(signature, rawBody, secret) {
  if (!MailKite.verifyWebhook(signature, rawBody, secret)) throw new Error('Invalid or expired signature');
  return JSON.parse(rawBody);
}
