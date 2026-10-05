// Docs: research.md — loopback transport contract, not a production MX.
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';

export async function openSink({ persist = async () => {}, maxBytes = 65536 } = {}) {
  const records = [];
  const server = new SMTPServer({
    disabledCommands: ['AUTH', 'STARTTLS'],
    disableReverseLookup: true,
    logger: false,
    size: maxBytes,
    onRcptTo(address, session, next) {
      if (address.address !== 'ticket+42@example.com') {
        return next(Object.assign(new Error('Unknown ticket'), { responseCode: 550 }));
      }
      next();
    },
    onData(stream, session, next) {
      const chunks = [];
      let bytes = 0;
      stream.on('data', chunk => {
        bytes += chunk.length;
        if (bytes <= maxBytes) chunks.push(chunk);
      });
      stream.once('error', next);
      stream.once('end', async () => {
        if (bytes > maxBytes || stream.sizeExceeded) {
          return next(Object.assign(new Error('Message too large'), { responseCode: 552 }));
        }
        try {
          const raw = Buffer.concat(chunks);
          const mail = await simpleParser(raw);
          const record = { raw, mail, recipients: session.envelope.rcptTo.map(r => r.address) };
          await persist(record);
          records.push(record);
          next(null, 'Parsed locally');
        } catch {
          next(Object.assign(new Error('Storage unavailable'), { responseCode: 451 }));
        }
      });
    },
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    port: server.server.address().port,
    records,
    close: () => new Promise(resolve => server.close(resolve)),
  };
}
