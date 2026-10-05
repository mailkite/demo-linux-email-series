// Docs: docs/design.md; verification.md
import { createServer } from 'node:http';
import { once } from 'node:events';

export const tenant = { id: 'acme', account: 'inbox@example.com',
  from: 'notice@send.example.com', to: 'operator@example.net' };

export function fixtureImap(validity = 70n, exists = true) {
  return {
    mailbox: { uidValidity: validity }, released: false,
    async getMailboxLock(path, options) {
      if (path !== 'INBOX' || !options.readOnly) throw new Error('must read INBOX');
      return { release: () => { this.released = true; } };
    },
    async fetchOne(uid, query, options) {
      if (!query.uid || !options.uid) throw new Error('must fetch UID, not sequence');
      return exists ? { uid } : false;
    },
  };
}

export async function mockApi(mode = 'accept') {
  const requests = [];
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    requests.push({ path: req.url, method: req.method,
      auth: req.headers.authorization, body: JSON.parse(Buffer.concat(chunks)) });
    if (mode === 'disconnect') return req.socket.destroy();
    res.writeHead(mode === 'reject' ? 403 : 202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mode === 'reject' ? { error: 'outbound_unverified' } :
      mode === 'malformed' ? { status: 'queued' } : { id: 'msg_offline', status: 'queued' }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { requests, baseUrl: `http://127.0.0.1:${server.address().port}`,
    async close() { server.closeAllConnections(); await new Promise(r => server.close(r)); } };
}
