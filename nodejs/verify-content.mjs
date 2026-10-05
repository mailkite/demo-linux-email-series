// Docs: verification.md. Usage: node verify-content.mjs /absolute/path/to/post.md
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const source = await readFile(process.argv[2], 'utf8');
const body = source.replace(/^---\n[\s\S]*?\n---\n/, '');
const snippets = [...body.matchAll(/```js\n([\s\S]*?)\n```/g)].map(match => match[1]);
const files = ['loopback.mjs', 'haraka-ticket.cjs', 'postal.mjs', 'mailkite.mjs'];
assert.equal(snippets.length, files.length);
for (const [index, file] of files.entries()) {
  assert.equal(snippets[index], (await readFile(new URL(file, import.meta.url), 'utf8')).trim());
}
assert.ok(body.trimStart().startsWith('<figure '));
assert.equal((body.match(/<svg /g) || []).length, 2);
const prose = body.replace(/<figure[^>]*>[\s\S]*?<\/figure>/g, '')
  .replace(/```[\s\S]*?```/g, '').replace(/<!--[^]*?-->/g, '')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const words = prose.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
const sentenceLengths = prose.split(/[.!?](?:\s|$)/).map(s => (s.match(/\b[\w']+\b/g) || []).length).filter(n => n > 2);
const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
const sd = Math.sqrt(sentenceLengths.reduce((sum, n) => sum + (n - mean) ** 2, 0) / sentenceLengths.length);
const phrases = ['in today’s digital landscape', 'game-changer', 'seamlessly', 'cutting-edge',
  'harness the power', 'in conclusion', 'the key insight is', 'furthermore', 'moreover'];
const flagged = phrases.filter(phrase => prose.toLowerCase().includes(phrase));
const meta = source.match(/^metaDescription: "(.*)"$/m)[1];
assert.ok(meta.length <= 160);
console.log(JSON.stringify({ exactSnippets: files, proseWordsIncludingTable: words.length,
  ttr: Number((new Set(words).size / words.length).toFixed(3)),
  burstiness: Number((sd / mean).toFixed(3)), flaggedPhrases: flagged,
  metaCharacters: meta.length, visuals: 2 }, null, 2));
