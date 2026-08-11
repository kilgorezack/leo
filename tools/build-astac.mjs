#!/usr/bin/env node
/* ════════════════════════════════════════════════════════
   Builds /astac.html — the password-protected ASTAC demo.

     node tools/build-astac.mjs "<password>"

   Takes the plaintext sources in demo-src/astac/, packs the
   markup, brand CSS and script into one JSON blob, encrypts
   it with AES-256-GCM under a PBKDF2 key derived from the
   password, and drops the result into the lock-screen shell.

   Nothing about the demo is readable in the deployed HTML
   until somebody types the password in: a wrong password
   fails the GCM authentication tag, so there is no hash to
   crack offline any faster than guessing passwords.

   Re-run this any time you edit demo-src/astac/*, then commit
   the regenerated astac.html.
   ════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC  = join(ROOT, 'demo-src', 'astac');
const OUT  = join(ROOT, 'astac.html');

const ITERATIONS = 310000;

const password = process.argv[2];
if (!password) {
  console.error('usage: node tools/build-astac.mjs "<password>"');
  process.exit(1);
}

const read = (f) => readFileSync(join(SRC, f), 'utf8');

/* what the browser gets handed once it has the key */
const page = {
  title: '365 nights on the Slope. Let’s count them. — ASTAC',
  theme_color: '#001D38',
  css_links: ['/assets/styles.css?v=2', '/assets/v2.css?v=2'],
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

const html = read('shell.html')
  .replace('{{ITER}}', () => String(ITERATIONS))
  .replace('{{PAYLOAD}}', () => payload);

writeFileSync(OUT, html);

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`built astac.html — payload ${kb(cipher.length)}, page ${kb(Buffer.byteLength(html))}`);
