/**
 * Rakit docs/ untuk GitHub Pages.
 *
 * Mesin tidak di-bundle: src/{hitung,harga,papan}.js disalin apa adanya ke
 * docs/mesin/ dan dimuat sebagai modul ES, jadi kode yang jalan di peramban
 * benar-benar berkas yang sama dengan yang diuji.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { halaman } from './render.js';
import { BAHASA } from './i18n.js';

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(AKAR, 'src');
const DOCS = join(AKAR, 'docs');

export const BASIS = 'https://xyb3rpunq.github.io/token-rupiah';

/**
 * Tanggal terbit, dibaca dari package.json — bukan dari jam mesin.
 *
 * Build wajib deterministik: menjalankannya dua kali harus menghasilkan berkas
 * yang identik bit demi bit, supaya pemeriksaan "docs/ sama dengan hasil build"
 * di CI berarti sesuatu. Memakai new Date() membuatnya berubah tiap hari walau
 * tidak ada yang disunting. Selain itu lastmod sitemap memang seharusnya
 * menyatakan kapan ISINYA berubah, bukan kapan perintah build dijalankan.
 */
export function tanggalTerbit() {
  const pkg = JSON.parse(readFileSync(join(AKAR, 'package.json'), 'utf8'));
  const t = pkg.tanggalTerbit;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(t))) {
    throw new Error('package.json: tanggalTerbit hilang atau tidak berformat YYYY-MM-DD');
  }
  return t;
}

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
  const tanggal = tanggalTerbit();
  const keluar = [];

  mkdirSync(join(DOCS, 'mesin'), { recursive: true });
  for (const m of MESIN) copyFileSync(join(SRC, m), join(DOCS, 'mesin', m));

  keluar.push(tulis('font.css', readFileSync(join(SRC, 'font.css'), 'utf8')));
  // Berkas font disalin apa adanya — di-host sendiri supaya halaman ini benar-benar
  // tidak melakukan permintaan jaringan keluar seperti yang diklaimnya.
  mkdirSync(join(DOCS, 'font'), { recursive: true });
  for (const f of readdirSync(join(SRC, 'font'))) {
    copyFileSync(join(SRC, 'font', f), join(DOCS, 'font', f));
  }
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
