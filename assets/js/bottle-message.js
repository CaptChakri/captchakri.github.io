/* =====================================================================
   MESSAGE IN A BOTTLE — a sealed, password-locked personal note.
   This is NOT an easter egg. The bottle washes up on the shore after the
   visitor lingers there (handled in descent-engine.js, which fires a
   `bottle-open` event on a triple-tap); this module raises the lock dialog,
   takes a password, and DECRYPTS the note in the browser.

   The note is stored only as ciphertext (BOTTLE.sealed) — the plaintext is
   never in the source — so this file can live in a public repo and still
   keep the message private to whoever knows the word. Scheme:

     PBKDF2(password, salt, 210k iters, SHA-256)  ->  AES-256-GCM key
     blob = base64( salt(16) || iv(12) || ciphertext+tag )

   A wrong password fails the AES-GCM auth tag, so decryption simply throws —
   there is no separate "password check" to read or bypass.

   TO SET YOUR OWN MESSAGE (your secret never leaves your browser):
     1. Open the site with ?seal  ->  e.g. http://localhost/?seal
     2. Type your message + a password, hit "Seal it", copy the snippet.
     3. Paste it over the BOTTLE object below.
   (Or from the CLI: node scripts/seal-message.mjs "<message>" "<password>")
   ===================================================================== */
(function () {
  'use strict';

  /* ---- THE SEALED NOTE — replace via ?seal (see header) -------------------
     `to`   : a name shown on the wax seal / greeting ('' to hide it)
     `hint` : the line under the password prompt — a private nudge, not the answer
     `sign` : an optional signature shown under the revealed note ('' to hide)
     `sealed`: AES-GCM ciphertext (base64). The placeholder opens with: demo  */
  const BOTTLE = {
    to: '',
    hint: 'Enter the word only the two of you would know.',
    sign: '',
    sealed: 'PgpfVznS1MZULGV+6KT/3XLCL1FI/yQiw8YFKw8oSlx68gkSEbYrJrKrSG9sDQEz3+jVUOuhqfektIT9POXXdl/u5D8Wa9k2BHxMaSclpmT1Dko6pkEGUl/2RsCbKKRFoyv7HLbGfsUgH7xS/NaclWfobLWfsPuLQKQyKONMcZOilb2ng1O4zpY6lMVPcVGsOFnL7cwU51utZ3zd1Z7M8y2efB88F19C6hP3HE3wGQ+n3ubViM4vqPQs//QQ+96eBPQeilcH4HuFzGpH8uve6JzJ1jJjR4OuSOB8EoxiysriQC1jM6YU0h0K3cPj1LmZIPJEf4NA+gEVhDYVHA==',
  };

  const ITER = 210000;
  const subtle = (window.crypto && window.crypto.subtle) || null;
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- crypto (matches scripts/seal-message.mjs exactly) ---------- */
  function b64ToBytes(b64) {
    const bin = atob(b64.trim());
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function bytesToB64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function deriveKey(password, salt) {
    return subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
      .then(base => subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
        base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']));
  }
  async function unseal(b64, password) {
    const blob = b64ToBytes(b64);
    const salt = blob.slice(0, 16), iv = blob.slice(16, 28), ct = blob.slice(28);
    const key = await deriveKey(password, salt);
    const pt = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);   // throws on a wrong password
    return new TextDecoder().decode(pt);
  }
  async function seal(message, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(message)));
    const blob = new Uint8Array(salt.length + iv.length + ct.length);
    blob.set(salt, 0); blob.set(iv, salt.length); blob.set(ct, salt.length + iv.length);
    return bytesToB64(blob);
  }

  /* ---------- the lock / reveal dialog ---------- */
  let overlay = null, lastFocus = null, state = 'locked';

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'bottle-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'A message in a bottle');
    overlay.innerHTML =
      '<div class="bm-card" role="document">' +
        '<button class="bm-close" type="button" aria-label="Close">×</button>' +
        '<div class="bm-stage"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('.bm-close').addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (overlay.classList.contains('show') && e.key === 'Escape') close();
    });
    return overlay;
  }

  function open(html, onShown) {
    const ov = ensureOverlay();
    ov.querySelector('.bm-stage').innerHTML = html;
    lastFocus = document.activeElement;
    document.body.classList.add('bm-open');
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('show')));
    if (onShown) onShown(ov.querySelector('.bm-stage'));
  }
  function close() {
    if (!overlay) return;
    overlay.classList.remove('show');
    document.body.classList.remove('bm-open');
    state = 'locked';
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  /* the lock screen — a corked bottle + a word to uncork it */
  function openLock() {
    if (!subtle) { alert('This browser can’t open the bottle (no Web Crypto).'); return; }
    state = 'locked';
    const greet = BOTTLE.to ? '<div class="bm-to">For ' + esc(BOTTLE.to) + '</div>' : '';
    open(
      '<div class="bm-seal" aria-hidden="true"><div class="bm-wax">✉</div></div>' +
      greet +
      '<div class="bm-eyebrow">A message in a bottle</div>' +
      '<h2 class="bm-title">It’s sealed shut.</h2>' +
      '<p class="bm-hint">' + esc(BOTTLE.hint) + '</p>' +
      '<form class="bm-form" novalidate>' +
        '<div class="bm-field">' +
          '<input class="bm-pass" type="password" inputmode="text" autocomplete="off" ' +
            'autocapitalize="off" spellcheck="false" placeholder="the word…" aria-label="Password">' +
          '<button class="bm-show" type="button" aria-label="Show password" tabindex="-1">👁</button>' +
        '</div>' +
        '<button class="bm-go" type="submit">Unseal it</button>' +
        '<div class="bm-msg" role="status" aria-live="polite"></div>' +
      '</form>',
      stage => {
        const form = stage.querySelector('.bm-form');
        const pass = stage.querySelector('.bm-pass');
        const show = stage.querySelector('.bm-show');
        const msg = stage.querySelector('.bm-msg');
        const go = stage.querySelector('.bm-go');
        setTimeout(() => pass.focus(), 60);
        show.addEventListener('click', () => {
          pass.type = pass.type === 'password' ? 'text' : 'password';
          show.classList.toggle('on', pass.type === 'text');
          pass.focus();
        });
        form.addEventListener('submit', async e => {
          e.preventDefault();
          const word = pass.value;
          if (!word) { pass.focus(); return; }
          go.disabled = true; go.textContent = 'Unsealing…';
          msg.textContent = ''; msg.className = 'bm-msg';
          try {
            const text = await unseal(BOTTLE.sealed, word);
            reveal(text);
          } catch (err) {
            go.disabled = false; go.textContent = 'Unseal it';
            msg.textContent = 'That isn’t the word. Try again.';
            msg.className = 'bm-msg bm-err';
            const card = overlay.querySelector('.bm-card');
            card.classList.remove('bm-shake'); void card.offsetWidth; card.classList.add('bm-shake');
            pass.select();
          }
        });
      }
    );
  }

  /* the reveal — the note "decrypts" into view, then settles */
  function reveal(text) {
    state = 'open';
    const sign = BOTTLE.sign ? '<div class="bm-sign">' + esc(BOTTLE.sign) + '</div>' : '';
    open(
      '<div class="bm-eyebrow bm-eyebrow-open">Decrypted · just for you</div>' +
      '<div class="bm-letter"><p class="bm-note"></p>' + sign + '</div>' +
      '<button class="bm-done" type="button">Seal it back up</button>',
      stage => {
        const note = stage.querySelector('.bm-note');
        const done = stage.querySelector('.bm-done');
        done.addEventListener('click', close);
        setTimeout(() => done.focus(), 40);
        scrambleInto(note, text);
      }
    );
  }

  // a decrypt-style reveal: glyph static that resolves left-to-right into the note
  function scrambleInto(el, text) {
    if (reduceMotion) { el.textContent = text; return; }
    const glyphs = '█▓▒░/\\<>[]{}=+*?#01';
    const chars = Array.from(text);
    const start = performance.now();
    const dur = Math.min(1500, 420 + chars.length * 11);
    (function tick(now) {
      const prog = Math.min(1, (now - start) / dur);
      const revealed = Math.floor(prog * chars.length);
      let out = '';
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (c === '\n' || c === ' ') out += c;
        else if (i < revealed) out += c;
        else out += glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = out;
      if (prog < 1) requestAnimationFrame(tick);
      else el.textContent = text;
    })(start);
  }

  /* ---------- the private SEALING tool (?seal) ----------
     Owner-only: never linked, only reachable by adding ?seal to the URL. It
     encrypts entirely in this browser and just prints a snippet to paste —
     nothing is sent anywhere. */
  function openSeal() {
    if (!subtle) { alert('This browser can’t seal (no Web Crypto).'); return; }
    open(
      '<div class="bm-eyebrow">Sealing tool · private</div>' +
      '<h2 class="bm-title">Seal a new message</h2>' +
      '<p class="bm-hint">Encrypts here in your browser. Nothing is uploaded — copy the snippet into <code>bottle-message.js</code>.</p>' +
      '<form class="bm-seal-form" novalidate>' +
        '<label class="bm-l">Message<textarea class="bm-s-msg" rows="5" placeholder="Write your note…"></textarea></label>' +
        '<div class="bm-row">' +
          '<label class="bm-l">Password<input class="bm-s-pass" type="text" placeholder="a word only you two know"></label>' +
          '<label class="bm-l">For (optional)<input class="bm-s-to" type="text" placeholder="her name"></label>' +
        '</div>' +
        '<label class="bm-l">Hint shown on the lock (optional)<input class="bm-s-hint" type="text" placeholder="Enter the word only the two of you would know."></label>' +
        '<label class="bm-l">Signature under the note (optional)<input class="bm-s-sign" type="text" placeholder="— yours, always"></label>' +
        '<button class="bm-go" type="submit">Seal it</button>' +
      '</form>' +
      '<div class="bm-out" hidden>' +
        '<div class="bm-eyebrow">Paste this over the BOTTLE object</div>' +
        '<pre class="bm-snip" tabindex="0"></pre>' +
        '<button class="bm-copy" type="button">Copy snippet</button>' +
        '<button class="bm-try" type="button">Preview the unlock →</button>' +
      '</div>',
      stage => {
        const form = stage.querySelector('.bm-seal-form');
        const out = stage.querySelector('.bm-out');
        const snip = stage.querySelector('.bm-snip');
        const lit = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
        form.addEventListener('submit', async e => {
          e.preventDefault();
          const message = stage.querySelector('.bm-s-msg').value;
          const password = stage.querySelector('.bm-s-pass').value;
          if (!message || !password) { alert('A message and a password are both needed.'); return; }
          const to = stage.querySelector('.bm-s-to').value.trim();
          const hint = stage.querySelector('.bm-s-hint').value.trim() || 'Enter the word only the two of you would know.';
          const sign = stage.querySelector('.bm-s-sign').value.trim();
          const blob = await seal(message, password);
          snip.textContent =
            '  const BOTTLE = {\n' +
            '    to: ' + lit(to) + ',\n' +
            '    hint: ' + lit(hint) + ',\n' +
            '    sign: ' + lit(sign) + ',\n' +
            '    sealed: ' + lit(blob) + ',\n' +
            '  };';
          out.hidden = false;
          // wire the live preview to THIS message without editing the file
          BOTTLE.to = to; BOTTLE.hint = hint; BOTTLE.sign = sign; BOTTLE.sealed = blob;
          out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        stage.querySelector('.bm-copy').addEventListener('click', async () => {
          const btn = stage.querySelector('.bm-copy');
          try { await navigator.clipboard.writeText(snip.textContent); btn.textContent = 'Copied ✓'; }
          catch (err) {
            const r = document.createRange(); r.selectNodeContents(snip);
            const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Select + ⌘C';
          }
          setTimeout(() => btn.textContent = 'Copy snippet', 1800);
        });
        stage.querySelector('.bm-try').addEventListener('click', openLock);
      }
    );
  }

  /* ---------- wiring ---------- */
  window.addEventListener('bottle-open', openLock);
  // expose for any other trigger / console testing
  window.BottleMessage = { open: openLock, seal: openSeal };
  // owner entry point: ?seal opens the sealing tool on load
  function maybeSeal() {
    if (new URLSearchParams(location.search).has('seal')) openSeal();
  }
  if (document.readyState !== 'loading') maybeSeal();
  else document.addEventListener('DOMContentLoaded', maybeSeal);
})();
