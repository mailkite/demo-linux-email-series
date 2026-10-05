// Docs: verification.md — optional editorial verifier; uses the website's installed renderer.
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
const [postPath, rendererPath] = process.argv.slice(2);
if (!postPath || !rendererPath) throw new Error('Usage: node inspect-post.mjs <post.md> <markdown-remark/dist/index.js>');
const source = await readFile(postPath, 'utf8');
const body = source.replace(/^---[\s\S]*?---\s*/, '');
const prose = body.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/```[\s\S]*?```/g, '').replace(/<[^>]*>/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
const words = prose.toLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
const sentences = prose.split(/(?<=[.!?])\s+/).map(s => (s.match(/\b[\w'-]+\b/g) ?? []).length).filter(n => n > 0);
const mean = sentences.reduce((a, b) => a + b, 0) / sentences.length;
const sd = Math.sqrt(sentences.reduce((sum, n) => sum + (n - mean) ** 2, 0) / sentences.length);
const paragraphs = prose.split(/\n\s*\n/).filter(p => !p.startsWith('#') && !p.startsWith('|')).map(p => (p.match(/\b[\w'-]+\b/g) ?? []).length).filter(n => n > 0);
const pMean = paragraphs.reduce((a, b) => a + b, 0) / paragraphs.length;
console.log(JSON.stringify({ proseWords: words.length, ttr: new Set(words).size / words.length, burstiness: sd / mean, paragraphSD: Math.sqrt(paragraphs.reduce((sum, n) => sum + (n - pMean) ** 2, 0) / paragraphs.length), visuals: (body.match(/<svg/g) ?? []).length, codeBlocks: (body.match(/```(?:sh|js)/g) ?? []).length, metaDescriptionLength: source.match(/metaDescription: "([^"]+)"/)[1].length }, null, 2));
for (const [file, language] of [['sdk-send.mjs', 'js'], ['webhook.mjs', 'js']]) {
  const snippet = (await readFile(new URL(file, import.meta.url), 'utf8')).split('\n').slice(1).join('\n').trim();
  if (!body.includes(`\`\`\`${language}\n${snippet}\n\`\`\``)) throw new Error(`Article snippet diverges from ${file}`);
}
const { createMarkdownProcessor } = await import(pathToFileURL(rendererPath).href);
const processor = await createMarkdownProcessor();
const rendered = await processor.render(body);
const title = source.match(/title: "([^"]+)"/)[1];
const description = source.match(/description: "([^"]+)"/)[1];
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>:root{color-scheme:light dark}body{font:17px/1.65 system-ui;margin:0;background:light-dark(#fff,#0b0d12);color:light-dark(#192333,#e8edf5)}main{max-width:752px;margin:auto;padding:24px}h1{line-height:1.2}figure{margin:32px 0}figcaption{font-size:14px}pre{overflow:auto;padding:16px}a{color:light-dark(#2846a8,#a9caff)}table{display:block;overflow:auto;border-collapse:collapse}td,th{padding:10px;border:1px solid #888}svg text{fill:currentColor}</style><main><h1>${title}</h1><p>${description}</p><article>${rendered.code}</article></main></html>`;
const server = createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html); });
server.listen(4397, '127.0.0.1', () => console.log('Isolated draft preview: http://127.0.0.1:4397 (not the production layout)'));
