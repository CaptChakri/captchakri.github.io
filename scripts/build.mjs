/* =====================================================================
   SITE BUILD — assembles a clean _site/ for GitHub Pages and minifies
   every JS/CSS asset IN PLACE (same filenames), so the HTML keeps
   referencing assets/js/descent-engine.js etc. unchanged. The readable
   source files stay the source of truth; nothing minified is committed.

   Run locally with `npm run build`; CI runs the same via deploy.yml.
   ===================================================================== */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { transform } from 'esbuild';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '_site');

// Top-level entries that must never ship to production (dev/test/meta).
// Only applied at the repo root — nested dirs of the same name are kept.
const DENY = new Set([
  '.git', '.github', '.claude', 'node_modules', '_ui_review', '_site',
  'scripts', 'tests', '.gitignore', 'README.md', 'TODO.md',
  'package.json', 'package-lock.json',
]);

async function copyTree(src, dest, isTop = false) {
  await fs.mkdir(dest, { recursive: true });
  for (const e of await fs.readdir(src, { withFileTypes: true })) {
    if (isTop && DENY.has(e.name)) continue;
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyTree(s, d);
    else if (e.isFile()) await fs.copyFile(s, d);
  }
}

async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

async function minifyAssets() {
  let before = 0, after = 0, count = 0;
  for await (const file of walk(path.join(OUT, 'assets'))) {
    const ext = path.extname(file);
    const loader = ext === '.js' ? 'js' : ext === '.css' ? 'css' : null;
    if (!loader) continue;
    const code = await fs.readFile(file, 'utf8');
    const res = await transform(code, { loader, minify: true, legalComments: 'none' });
    before += Buffer.byteLength(code);
    after += Buffer.byteLength(res.code);
    count++;
    await fs.writeFile(file, res.code);
  }
  return { before, after, count };
}

await fs.rm(OUT, { recursive: true, force: true });
await copyTree(ROOT, OUT, true);
const { before, after, count } = await minifyAssets();
const kb = (n) => (n / 1024).toFixed(1) + 'KB';
console.log(`Minified ${count} asset(s): ${kb(before)} -> ${kb(after)} raw (pre-gzip)`);
console.log('Build complete -> _site/');
