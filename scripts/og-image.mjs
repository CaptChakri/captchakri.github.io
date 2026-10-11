/* =====================================================================
   OG IMAGE — renders scripts/og-card.html to assets/og-image.png at
   1200×630 with headless Edge/Chrome. Run with `npm run og` after editing
   the card; the PNG is committed (the build just copies it).
   Set BROWSER=/path/to/chrome to override browser discovery.
   ===================================================================== */
import { copyFileSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const card = pathToFileURL(path.join(ROOT, 'scripts', 'og-card.html')).href;
const out = path.join(ROOT, 'assets', 'og-image.png');

const candidates = [
  process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = candidates.find(p => existsSync(p));
if (!browser) throw new Error('No Edge/Chrome found — set BROWSER=/path/to/browser');

// a throwaway profile, so an already-running browser can't swallow the call;
// the shot lands there first, then is copied into place
const tmp = mkdtempSync(path.join(os.tmpdir(), 'og-'));
const shot = path.join(tmp, 'shot.png');
try {
  execFileSync(browser, [
    '--headless', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    `--user-data-dir=${path.join(tmp, 'profile')}`,
    '--window-size=1200,630', '--virtual-time-budget=5000',
    `--screenshot=${shot}`, card,
  ], { stdio: 'ignore' });
  // msedge.exe can hand off to a child process and return before the shot is
  // written, so wait until the file exists and its size has settled
  let last = -1;
  for (let waited = 0; ; waited += 250) {
    const size = existsSync(shot) ? statSync(shot).size : -1;
    if (size > 0 && size === last) break;
    if (waited > 30000) throw new Error('browser never wrote the screenshot');
    last = size;
    await new Promise(r => setTimeout(r, 250));
  }
  copyFileSync(shot, out);
} finally {
  // the browser may still hold its profile open for a moment; a leftover temp dir is harmless
  try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch {}
}
console.log(`og: wrote ${path.relative(ROOT, out)}`);
