// Docs: README.md#model-adapter
import { Queue } from './queue.mjs';
import { intake } from './server.mjs';
import { fixtureModel, realModel } from './model.mjs';

const queue = new Queue(process.env.DB_PATH || './automation.sqlite');
if (process.argv[2] === 'serve') {
  const server = intake(queue);
  server.listen(Number(process.env.PORT || 8787), '127.0.0.1', () => console.log('Local intake listening'));
  process.once('SIGINT', () => server.close(() => { queue.close(); process.exit(0); }));
} else if (process.argv[2] === 'work') {
  try {
    const adapter = process.env.MODEL_BASE_URL ? realModel({
      baseUrl: process.env.MODEL_BASE_URL, model: process.env.MODEL_NAME, apiKey: process.env.MODEL_API_KEY,
    }) : fixtureModel;
    // Real model drafts always require review. There is no remote send path in this CLI.
    const model = async (message) => {
      const decision = await adapter(message);
      return process.env.MODEL_BASE_URL && decision.action === 'reply' ? { ...decision, action: 'review' } : decision;
    };
    while (await queue.work(model)) { /* Drain currently due work; rerun for backoff retries. */ }
    console.log(JSON.stringify({ jobs: queue.rows(), replies: queue.replies() }, null, 2));
  } finally { queue.close(); }
} else if (process.argv[2] === 'approve') {
  try { queue.approve(process.argv[3]); console.log('Approved draft for local reply sink'); }
  finally { queue.close(); }
} else { queue.close(); throw new Error('Use serve, work, or approve <job-key>'); }
