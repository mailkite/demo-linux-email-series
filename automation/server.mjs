// Docs: README.md#intake-contract
import { createServer } from 'node:http';

export function intake(queue) {
  return createServer(async (req, res) => {
    const respond = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (req.method !== 'POST' || req.url !== '/events') return respond(404, { error: 'Not found' });
    let bytes = 0;
    const chunks = [];
    try {
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 300_000) { respond(413, { error: 'Too large' }); req.destroy(); return; }
        chunks.push(chunk);
      }
      let event;
      try { event = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { return respond(400, { error: 'Invalid JSON' }); }
      // The DB write completes before HTTP success. No model runs in this handler.
      const accepted = await queue.accept(event);
      respond(200, accepted);
    } catch { respond(503, { error: 'Intake failed; retry with the same delivery ID' }); }
  });
}
