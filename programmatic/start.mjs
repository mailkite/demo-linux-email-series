// Docs: docs/contract.md
import { createInbox } from './inbox.mjs';
const inbox = createInbox(new URL('./inbox.sqlite', import.meta.url).pathname);
await inbox.listen(2525);
console.log('Local-only inbox listening on 127.0.0.1:2525; SQLite: inbox.sqlite');
process.once('SIGINT', async () => { await inbox.close(); });
process.once('SIGTERM', async () => { await inbox.close(); });
