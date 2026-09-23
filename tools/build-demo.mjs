#!/usr/bin/env node
/* ════════════════════════════════════════════════════════
   Builds a password-protected client demo.

     node tools/build-demo.mjs <slug> "<password>"
     node tools/build-demo.mjs astac "NorthSlope2026"

   Takes the plaintext sources in demo-src/<slug>/ — meta.json,
   body.html, theme.css, app.js — packs them into one JSON blob
   with the shared lock screen in demo-src/shell.html, encrypts
   the blob with AES-256-GCM under a PBKDF2 key derived from the
   password, and writes <slug>.html at the repo root.

   Nothing about the demo is readable in the deployed HTML until
   somebody types the password in: a wrong password fails the GCM
   authentication tag, so there is no hash to crack offline any
   faster than guessing passwords.

   Re-run this any time you edit demo-src/<slug>/*, then commit
   the regenerated page.
   ════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEMOS = join(ROOT, 'demo-src');

const ITERATIONS = 310000;

const [slug, password] = process.argv.slice(2);
if (!slug || !password) {
  console.error('usage: node tools/build-demo.mjs <slug> "<password>"');
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(`bad slug "${slug}" — lowercase letters, digits and dashes only`);
  process.exit(1);
}

const SRC = join(DEMOS, slug);
if (!existsSync(SRC)) {
  console.error(`no sources at demo-src/${slug}/`);
  process.exit(1);
}

const read = (f) => readFileSync(join(SRC, f), 'utf8');
const meta = JSON.parse(read('meta.json'));

/* what the browser gets handed once it has the key */
const page = {
  title: meta.title,
  theme_color: meta.theme_color,
  css_links: meta.css_links,
  css: read('theme.css'),
  html: read('body.html'),
  js: read('app.js'),
};

const plaintext = new TextEncoder().encode(JSON.stringify(page));
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const base = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);

const cipher = new Uint8Array(
  await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));

/* salt | iv | ciphertext+tag, base64, wrapped so the file stays diffable */
const blob = new Uint8Array(salt.length + iv.length + cipher.length);
blob.set(salt, 0);
blob.set(iv, salt.length);
blob.set(cipher, salt.length + iv.length);
const payload = Buffer.from(blob).toString('base64').replace(/(.{120})/g, '$1\n');

const html = readFileSync(join(DEMOS, 'shell.html'), 'utf8')
  .replace('{{ITER}}', () => String(ITERATIONS))
  .replace('{{KEY}}', () => slug)
  .replace('{{PAYLOAD}}', () => payload);

const OUT = join(ROOT, `${slug}.html`);
writeFileSync(OUT, html);

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`built ${slug}.html — payload ${kb(cipher.length)}, page ${kb(Buffer.byteLength(html))}`);
