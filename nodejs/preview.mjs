// Docs: verification.md. Local content preview, not the full Astro page shell.
// node preview.mjs /absolute/post.md /absolute/@astrojs/markdown-remark/dist/index.js
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
const { createMarkdownProcessor } = await import(pathToFileURL(process.argv[3]).href);
const source = await readFile(process.argv[2], 'utf8');
const markdown = source.replace(/^---\n[\s\S]*?\n---\n/, '');
const processor = await createMarkdownProcessor();
const { code } = await processor.render(markdown);
const title = source.match(/^title: "(.*)"$/m)[1];
const description = source.match(/^description: "(.*)"$/m)[1];
const server = createServer((req, res) => {
  const light = new URL(req.url, 'http://localhost').searchParams.get('theme') === 'light';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>${title}</title>
    <style>body{margin:0;background:${light ? '#fff' : '#0b0d12'};color:${light ? '#172033' : '#e4e9f1'};font:17px/1.65 system-ui}main{max-width:760px;margin:auto;padding:24px}h1{font-size:34px;line-height:1.2}h2{line-height:1.3;margin-top:48px}figure{margin:24px 0}figcaption{font-size:14px;margin-top:12px}a{color:${light ? '#2459a9' : '#6ea8fe'}}pre{overflow:auto;padding:16px;border:1px solid #7e8a9c;border-radius:8px;font-size:13px}table{display:block;overflow:auto;font-size:14px}td,th{min-width:120px;padding:8px;border-bottom:1px solid #7e8a9c;text-align:left}code{font-family:ui-monospace,monospace}</style>
    <style>figure{box-sizing:border-box;width:min(60rem,92vw);margin:2rem 50%;transform:translateX(-50%);border:1px solid #7e8a9c;border-radius:14px;overflow-x:auto}figure figcaption{padding:12px;font-size:13px;text-align:center}</style>
    <main><p>Content-only preview · parent site build pending</p><h1>${title}</h1><p>${description}</p>${code}</main></html>`);
});
server.listen(4319, '127.0.0.1', () => console.log('Content preview http://127.0.0.1:4319'));
