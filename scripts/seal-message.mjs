/* =====================================================================
   SEAL A MESSAGE — encrypts a note so it can only be read with a password.
   This is the CLI twin of the in-browser sealing tool (open the site with
   ?seal). Both use the EXACT same scheme, so a blob made here decrypts in
   the browser and vice-versa:

     PBKDF2(password, salt, 210k iters, SHA-256)  ->  AES-256-GCM key
     blob = base64( salt(16) || iv(12) || ciphertext+tag )

   The plaintext is NEVER stored — only this blob — so committing the blob
   to the public repo reveals nothing without the password. (A weak password
   is still brute-forceable offline, so choose a real phrase.)

   Usage:
     node scripts/seal-message.mjs "your secret message" "your password"
     node scripts/seal-message.mjs   (no args -> prints this help)

   Paste the printed blob into BOTTLE.sealed in assets/js/bottle-message.js.
   ===================================================================== */
const ITER = 210000;

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function seal(message, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(message)));
  const blob = new Uint8Array(salt.length + iv.length + ct.length);
  blob.set(salt, 0); blob.set(iv, salt.length); blob.set(ct, salt.length + iv.length);
  return Buffer.from(blob).toString('base64');
}

export async function unseal(b64, password) {
  const blob = Buffer.from(b64, 'base64');
  const salt = blob.subarray(0, 16), iv = blob.subarray(16, 28), ct = blob.subarray(28);
  const key = await deriveKey(password, new Uint8Array(salt));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(ct));
  return new TextDecoder().decode(pt);
}

// run directly (not when imported)
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1]?.endsWith('seal-message.mjs')) {
  const [, , message, password] = process.argv;
  if (!message || !password) {
    console.log('Usage: node scripts/seal-message.mjs "<message>" "<password>"');
    process.exit(message || password ? 1 : 0);
  }
  const blob = await seal(message, password);
  // round-trip check so a bad blob never ships
  const back = await unseal(blob, password);
  if (back !== message) { console.error('Round-trip FAILED — not emitting.'); process.exit(1); }
  console.log(blob);
}
