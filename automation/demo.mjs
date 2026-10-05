// Docs: README.md#local-run
import { Queue } from './queue.mjs';
import { fixtureModel } from './model.mjs';
import { fixture } from './fixture.mjs';
import { intake } from './server.mjs';

const path = process.env.DB_PATH || './automation.sqlite';
let queue = new Queue(path);
const server = intake(queue);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/events`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fixture()),
  });
  if (response.status !== 200) throw new Error('Intake failed');
  const { key } = await response.json();
  await queue.accept(fixture());
  await queue.accept(fixture('robot', 'Auto-Submitted: auto-replied\r\n'));
  await queue.accept({ ...fixture('approval'), raw: fixture('approval').raw + 'Refund approval requested.' });
  queue.close();
  queue = new Queue(path); // The pending work survives an actual database reopen.
  await queue.work(fixtureModel);
  await queue.work(fixtureModel);
  console.log(JSON.stringify({ accepted: key, jobs: queue.rows(), replies: queue.replies() }, null, 2));
} finally {
  await new Promise((resolve) => server.close(resolve));
  queue.close();
}
