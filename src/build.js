/**
 * Rakit docs/ untuk GitHub Pages.
 *
 * Mesin tidak di-bundle: src/{hitung,harga,papan}.js disalin apa adanya ke
 * docs/mesin/ dan dimuat sebagai modul ES, jadi kode yang jalan di peramban
 * benar-benar berkas yang sama dengan yang diuji.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { halaman } from './render.js';
import { BAHASA } from './i18n.js';

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(AKAR, 'src');
const DOCS = join(AKAR, 'docs');

export const BASIS = 'https://xyb3rpunq.github.io/token-rupiah';
export const MESIN = Object.freeze(['hitung.js', 'harga.js', 'papan.js']);

export function robots() {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${BASIS}/sitemap.xml`, ''].join('\n');
}

export function sitemap(tanggal) {
  const u = (loc) => `<url><loc>${loc}</loc><lastmod>${tanggal}</lastmod></url>`;
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + u(`${BASIS}/`) + '\n' + u(`${BASIS}/en/`) + '\n</urlset>\n';
}

function tulis(jalur, isi) {
  const penuh = join(DOCS, jalur);
  mkdirSync(dirname(penuh), { recursive: true });
  writeFileSync(penuh, isi, 'utf8');
  return { jalur, kb: Buffer.byteLength(isi, 'utf8') / 1024 };
}

function main() {
  const tanggal = new Date().toISOString().slice(0, 10);
  const keluar = [];

  mkdirSync(join(DOCS, 'mesin'), { recursive: true });
  for (const m of MESIN) copyFileSync(join(SRC, m), join(DOCS, 'mesin', m));

  keluar.push(tulis('gaya.css', readFileSync(join(SRC, 'gaya.css'), 'utf8')));
  keluar.push(tulis('app.js', readFileSync(join(SRC, 'app.js'), 'utf8')));
  for (const b of BAHASA) {
    keluar.push(tulis(b === 'id' ? 'index.html' : `${b}/index.html`,
      halaman(b, { basis: BASIS, jalur: b === 'id' ? './' : '../', tanggal })));
  }
  keluar.push(tulis('.nojekyll', ''));
  keluar.push(tulis('robots.txt', robots()));
  keluar.push(tulis('sitemap.xml', sitemap(tanggal)));

  for (const k of keluar) console.log(`  ${k.jalur.padEnd(18)} ${k.kb.toFixed(1)} KB`);
  console.log(`  mesin/             ${MESIN.join(', ')}`);
  console.log('selesai');
}

if (process.argv[1]?.endsWith('build.js')) main();
