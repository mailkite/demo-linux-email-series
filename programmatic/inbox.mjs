// Docs: docs/contract.md
import { DatabaseSync } from 'node:sqlite';
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';

export function createInbox(path) {
  const db = new DatabaseSync(path);
  db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY, raw BLOB NOT NULL, envelope TEXT NOT NULL,
    subject TEXT NOT NULL, text TEXT NOT NULL)`);
  const insert = db.prepare('INSERT INTO messages(raw,envelope,subject,text) VALUES(?,?,?,?)');
  const server = new SMTPServer({
    disabledCommands: ['AUTH', 'STARTTLS'],
    size: 1024 * 1024,
    logger: false,
    disableReverseLookup: true,
    onRcptTo(address, session, callback) {
      if (address.address !== 'ticket+42@example.com') {
        return callback(Object.assign(new Error('Unknown ticket recipient'), { responseCode: 550 }));
      }
      callback();
    },
    onData(stream, session, callback) {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', async () => {
        try {
          if (stream.sizeExceeded) throw new Error('Message exceeds demo limit');
          const raw = Buffer.concat(chunks);
          const parsed = await simpleParser(raw);
          insert.run(raw, JSON.stringify(session.envelope), parsed.subject ?? '', parsed.text ?? '');
          callback(null, 'Stored locally');
        } catch {
          callback(Object.assign(new Error('Local storage unavailable'), { responseCode: 451 }));
        }
      });
    },
  });
  return {
    server,
    async listen(port = 0) {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', resolve);
      });
      return server.server.address().port;
    },
    rows: () => db.prepare('SELECT * FROM messages ORDER BY id').all(),
    async close() {
      await new Promise(resolve => server.close(resolve));
      db.close();
    },
  };
}
