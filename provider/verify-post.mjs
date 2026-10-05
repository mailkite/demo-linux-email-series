// Docs: verification.md. Editorial helper; dependencies come from the website checkout.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const post = process.argv[2];
if (!post) throw new Error('usage: node verify-post.mjs <post.md> [markdown-renderer.js]');
const source = await readFile(post, 'utf8');
const body = source.replace(/^---\n[\s\S]*?\n---\n/, '');
const blocks = [...body.matchAll(/```\w*\n([\s\S]*?)\n```/g)];
const expected = ['quickstart.sh', 'live.mjs'];
if (blocks.length !== expected.length) throw new Error('unexpected snippet count');
for (let i = 0; i < expected.length; i++) {
  if (blocks[i][1].trim() !== (await readFile(expected[i], 'utf8')).trim()) {
    throw new Error(`snippet drift: ${expected[i]}`);
  }
}
const prose = body.replace(/<svg[\s\S]*?<\/svg>/g, '')
  .replace(/```[\s\S]*?```/g, '').replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<[^>]+>/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/[`*#|]/g, '');
const words = prose.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
const sentences = prose.split(/[.!?]+(?:\s|$)/).map(s => s.match(/[a-z]+(?:'[a-z]+)?/gi)?.length ?? 0).filter(n => n > 0);
const mean = sentences.reduce((a, b) => a + b, 0) / sentences.length;
const sd = Math.sqrt(sentences.reduce((a, b) => a + (b - mean) ** 2, 0) / sentences.length);
const report = { proseWords: words.length, snippets: expected,
  builtVisuals: (body.match(/<svg /g) ?? []).length,
  topVisual: body.trimStart().startsWith('<figure>'),
  burstiness: Number((sd / mean).toFixed(3)),
  ttr: Number((new Set(words).size / words.length).toFixed(3)),
  phraseFlags: ['seamlessly', 'game-changer', 'cutting-edge', 'deep dive',
    "it's important to note", 'in conclusion', 'leverage', 'robust', '—']
    .filter(phrase => prose.toLowerCase().includes(phrase)) };
console.log(JSON.stringify(report, null, 2));
await writeFile('editorial-metrics.json', JSON.stringify(report, null, 2) + '\n');
if (words.length < 1400 || words.length > 2200 || report.builtVisuals !== 2 || !report.topVisual) {
  throw new Error('article structural gate failed');
}
if (process.argv[3]) {
  const { createMarkdownProcessor } = await import(pathToFileURL(resolve(process.argv[3])));
  const processor = await createMarkdownProcessor();
  const rendered = await processor.render(body);
  const title = source.match(/^title: "(.*)"/m)[1];
  const description = source.match(/^description: "(.*)"/m)[1];
  await mkdir('preview', { recursive: true });
  await writeFile('preview/index.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
    :root{color-scheme:light dark}body{margin:0;font:17px/1.65 system-ui;background:light-dark(#fff,#0b0d12);color:light-dark(#18202c,#e2e8f0)}main{max-width:760px;margin:auto;padding:24px}h1{font-size:36px;line-height:1.2}h2{line-height:1.3;margin-top:44px}a{color:light-dark(#245c9e,#8cbcff)}pre{overflow:auto;padding:18px;background:light-dark(#edf1f5,#18202c);border-radius:8px;font-size:14px}figure{margin:28px 0}figcaption{font-size:14px;margin-top:12px}table{display:block;overflow:auto;border-collapse:collapse;font-size:15px}td,th{border:1px solid #667085;padding:8px;min-width:130px}.lead{font-size:21px}svg{overflow:visible}
    </style><main><h1>${title}</h1><p class="lead">${description}</p>${rendered.code}</main></html>`);
}
