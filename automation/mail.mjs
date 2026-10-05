// Docs: README.md#intake-contract
import { simpleParser } from 'mailparser';
import { createHash } from 'node:crypto';

const address = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+$/;
const ids = (value) => String(value || '').match(/<[^<>\s]+@[^<>\s]+>/g) || [];

export async function normalize(event) {
  for (const field of ['source', 'deliveryId']) {
    if (typeof event[field] !== 'string' || !/^[\w.:-]{1,200}$/.test(event[field])) throw new Error(`Invalid ${field}`);
  }
  if (typeof event.raw !== 'string' || Buffer.byteLength(event.raw) > 256_000) throw new Error('Invalid MIME size');
  if (!address.test(event.recipient || '') || typeof event.envelopeFrom !== 'string') throw new Error('Invalid envelope');
  if (event.envelopeFrom && !address.test(event.envelopeFrom)) throw new Error('Invalid envelope sender');
  const parsed = await simpleParser(event.raw, { skipHtmlToText: true, skipTextToHtml: true });
  const headers = (name) => parsed.headerLines.filter((line) => line.key === name).map((line) => line.line.split(':').slice(1).join(':').trim());
  const autos = headers('auto-submitted');
  const auto = autos[0]?.split(';')[0].trim().toLowerCase();
  const from = event.envelopeFrom.toLowerCase();
  let suppressed = null;
  if (!from || from === event.recipient.toLowerCase()) suppressed = 'null-or-self-sender';
  else if (autos.length > 1 || (auto !== undefined && auto !== 'no')) suppressed = 'auto-submitted';
  else if (headers('list-id').length || /^(bulk|list|junk)$/i.test(headers('precedence')[0] || '')) suppressed = 'list';
  const messageIds = ids(headers('message-id')[0]);
  const parent = headers('message-id').length === 1 && messageIds.length === 1 ? messageIds[0] : null;
  const references = ids(headers('references').join(' '));
  const ancestors = references.length ? references : ids(headers('in-reply-to')[0]);
  const key = createHash('sha256').update(JSON.stringify([event.source, event.deliveryId, event.recipient.toLowerCase()])).digest('hex');
  return {
    key, suppressed, from, recipient: event.recipient.toLowerCase(),
    subject: String(parsed.subject || '').replace(/[\r\n]/g, ' ').slice(0, 200),
    text: String(parsed.text || '').slice(0, 8000), parent,
    references: parent ? [...new Set([...ancestors, parent])].join(' ') : '',
  };
}

export function composeReply(message, body) {
  return {
    from: message.recipient, to: message.from,
    subject: /^Re:/i.test(message.subject) ? message.subject : `Re: ${message.subject}`,
    text: body,
    ...(message.parent ? { inReplyTo: message.parent } : {}),
    headers: {
      'Auto-Submitted': 'auto-replied',
      'Message-ID': `<reply-${message.key}@${message.recipient.split('@')[1]}>`,
      ...(message.references ? { References: message.references } : {}),
    },
  };
}
