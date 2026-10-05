// Docs: verification.md. Uses the parent's installed Astro renderer, no site build or file writes.
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const [website, post] = process.argv.slice(2);
if (!website || !post) throw new Error('Usage: node render-check.mjs <website-directory> <post-path>');
const { createMarkdownProcessor } = await import(pathToFileURL(resolve(website, 'node_modules/@astrojs/markdown-remark/dist/index.js')));
const markdown = (await readFile(post, 'utf8')).split('---').slice(2).join('---');
const processor = await createMarkdownProcessor();
const rendered = await processor.render(markdown);
assert.equal((rendered.code.match(/<svg\b/g) || []).length, 2);
assert.equal((rendered.code.match(/<pre\b/g) || []).length, 2);
assert.ok(rendered.code.startsWith('<figure>'));
assert.ok(rendered.code.includes('aria-labelledby="automation-flow-title automation-flow-desc"'));
assert.ok(rendered.code.includes('aria-labelledby="automation-state-title automation-state-desc"'));
assert.equal((rendered.code.match(/<h2\b/g) || []).length, 7);
console.log('Astro Markdown render passed: 2 SVGs, 2 code blocks, 7 H2s; no output files written.');
