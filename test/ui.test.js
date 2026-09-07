import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BAHASA, KAMUS, t, placeholder } from '../src/i18n.js';
import { halaman, KUNCI_KAMUS } from '../src/render.js';
import { papan, batangTagihan, vonis, esc, MARGIN_TIPIS_PERSEN } from '../src/papan.js';
import { skenario, BAWAAN } from '../src/hitung.js';
import { robots, sitemap, MESIN, BASIS } from '../src/build.js';
import { MODEL } from '../src/harga.js';

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..');
const K = {};
for (const k of KUNCI_KAMUS) K[k] = t('id', k);
const S = skenario(BAWAAN);

// ---------------------------------------------------------------- i18n

test('kunci ID dan EN persis sama', () => {
  const id = Object.keys(KAMUS.id).sort();
  const en = Object.keys(KAMUS.en).sort();
  assert.deepEqual(id.filter((k) => !en.includes(k)), []);
  assert.deepEqual(en.filter((k) => !id.includes(k)), []);
});

test('tidak ada terjemahan kosong', () => {
  for (const b of BAHASA) {
    for (const [k, v] of Object.entries(KAMUS[b])) {
      assert.ok(String(v).trim().length > 0, `${b}.${k} kosong`);
    }
  }
});

test('placeholder tiap kunci sama di kedua bahasa', () => {
  for (const k of Object.keys(KAMUS.id)) {
    assert.deepEqual(placeholder(KAMUS.id[k]), placeholder(KAMUS.en[k]), `beda di ${k}`);
  }
});

test('tidak ada terjemahan EN yang tertinggal identik dengan ID', () => {
  const bolehSama = new Set([
    'meta.judul', 'kepala.judul1', 'kepala.judul2', // nama produk
    'in.model', 'harga.kolomModel', 'harga.kolomCache', // kata serapan, sama di dua bahasa
  ]);
  const sisa = Object.keys(KAMUS.id).filter((k) =>
    !bolehSama.has(k) && KAMUS.id[k] === KAMUS.en[k] && /[a-z]{4,}/i.test(KAMUS.id[k]));
  assert.deepEqual(sisa, [], `belum diterjemahkan: ${sisa.join(', ')}`);
});

test('semua kunci yang dipakai papan tersedia di kedua bahasa', () => {
  for (const k of KUNCI_KAMUS) {
    for (const b of BAHASA) assert.ok(KAMUS[b][k] !== undefined, `${k} hilang di ${b}`);
  }
});

// ---------------------------------------------------------------- vonis

test('vonis membedakan sehat, tipis, dan rugi', () => {
  assert.equal(vonis({ sehat: true, marginPersen: 70 }), 'sehat');
  assert.equal(vonis({ sehat: true, marginPersen: MARGIN_TIPIS_PERSEN - 1 }), 'tipis');
  assert.equal(vonis({ sehat: true, marginPersen: MARGIN_TIPIS_PERSEN }), 'sehat');
  assert.equal(vonis({ sehat: false, marginPersen: -20 }), 'rugi');
});

test('vonis dengan margin persen null tetap dianggap sehat kalau marginnya positif', () => {
  assert.equal(vonis({ sehat: true, marginPersen: null }), 'sehat');
});

test('setiap vonis punya kalimatnya di kamus', () => {
  for (const v of ['sehat', 'tipis', 'rugi']) {
    for (const b of BAHASA) assert.ok(KAMUS[b][`vonis.${v}`], `vonis.${v} hilang di ${b}`);
  }
});

// ---------------------------------------------------------------- papan

test('papan menampilkan dua belas ubin angka', () => {
  const h = papan(S, K);
  assert.equal((h.match(/<div class="ubin /g) || []).length, 12);
});

test('papan menutup semua elemen yang dibukanya', () => {
  const h = papan(S, K);
  for (const tag of ['div', 'p', 'svg', 'span', 'b', 'small']) {
    assert.equal((h.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length,
      (h.match(new RegExp(`</${tag}>`, 'g')) || []).length, `tag ${tag} tidak seimbang`);
  }
});

test('papan tidak pernah mencetak undefined, NaN, atau Infinity', () => {
  const kasus = [
    S,
    skenario({ ...BAWAAN, pengguna: 0 }),
    skenario({ ...BAWAAN, hargaLangganan: 0 }),
    skenario({ ...BAWAAN, hargaLangganan: 1000, permintaanPerPengguna: 100000 }),
    skenario({ ...BAWAAN, biayaTetap: 0, kas: 0 }),
  ];
  for (const s of kasus) {
    const h = papan(s, K);
    for (const buruk of ['undefined', 'NaN', 'Infinity', '[object Object]']) {
      assert.ok(!h.includes(buruk), `"${buruk}" muncul di papan`);
    }
  }
});

test('papan menandai produk yang merugi dengan nada buruk', () => {
  const rugi = skenario({ ...BAWAAN, hargaLangganan: 1000, permintaanPerPengguna: 100000 });
  const h = papan(rugi, K);
  assert.ok(h.includes('v-rugi'), 'vonis rugi tidak muncul');
  assert.ok(h.includes('ubin buruk'), 'ubin tidak diberi nada buruk');
  assert.ok(h.includes(esc(K['out.takAdaImpas'])), 'titik impas mustahil tidak disebut');
});

test('papan menandai produk sehat dengan nada baik', () => {
  const h = papan(S, K);
  assert.ok(h.includes('v-sehat'));
  assert.ok(h.includes('ubin baik'));
});

test('papan menyebut runway hanya saat sedang rugi', () => {
  const untung = papan(S, K);
  assert.ok(untung.includes(esc(K['out.takAdaRunway'])));
  const rugi = papan(skenario({ ...BAWAAN, hargaLangganan: 1000 }), K);
  assert.ok(!rugi.includes(esc(K['out.takAdaRunway'])));
});

// ---------------------------------------------------------------- grafik

test('batangTagihan menggambar tiga batang', () => {
  const svg = batangTagihan(S.simulasi, K);
  assert.equal((svg.match(/<rect /g) || []).length, 3);
});

test('batangTagihan: tidak ada batang yang keluar dari viewBox', () => {
  const svg = batangTagihan(S.simulasi, K);
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const [w, h] = [Number(vb[1]), Number(vb[2])];
  for (const m of svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
    const [x, y, lw, lh] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
    assert.ok(x + lw <= w, `batang melewati lebar: ${x + lw} > ${w}`);
    assert.ok(y + lh <= h, `batang melewati tinggi: ${y + lh} > ${h}`);
  }
});

test('batangTagihan: batang p99 adalah yang terpanjang', () => {
  const svg = batangTagihan(S.simulasi, K);
  const lebar = [...svg.matchAll(/width="([\d.]+)" height="22"/g)].map((m) => Number(m[1]));
  assert.equal(lebar[2], Math.max(...lebar), 'p99 seharusnya batang terpanjang');
  assert.ok(lebar[0] <= lebar[1] && lebar[1] <= lebar[2], 'batang tidak menaik');
});

test('batangTagihan tetap sah saat semua nilainya nol', () => {
  const svg = batangTagihan({ p50: 0, p90: 0, p99: 0 }, K);
  assert.ok(svg.startsWith('<svg ') && svg.endsWith('</svg>'));
  assert.ok(!svg.includes('NaN'));
});

test('batangTagihan tidak memakai warna literal, hanya kelas tema', () => {
  const svg = batangTagihan(S.simulasi, K);
  assert.equal(/fill="#|stroke="#|fill="rgb/.test(svg), false);
});

// ---------------------------------------------------------------- halaman

test('halaman kedua bahasa punya doctype, lang, dan tag seimbang', () => {
  for (const b of BAHASA) {
    const h = halaman(b, { basis: BASIS });
    assert.ok(h.startsWith('<!doctype html>'));
    assert.ok(h.includes(`<html lang="${b}">`));
    for (const tag of ['head', 'body', 'form', 'table', 'section', 'footer', 'fieldset']) {
      assert.equal((h.match(new RegExp(`</${tag}>`, 'g')) || []).length,
        (h.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length, `${b}: tag ${tag} tidak seimbang`);
    }
  }
});

test('setiap kotak isian punya label yang menunjuk ke id-nya', () => {
  const h = halaman('id', { basis: BASIS });
  for (const id of ['hargaMasuk', 'hargaKeluar', 'hargaCache', 'kurs', 'tokenMasuk', 'tokenKeluar',
    'tokenCache', 'pengguna', 'permintaanPerPengguna', 'biayaTetap', 'hargaLangganan', 'kas',
    'sebaran', 'model', 'contohTeks']) {
    assert.ok(h.includes(`for="${id}"`), `label untuk ${id} hilang`);
    assert.ok(h.includes(`id="${id}"`), `kotak ${id} hilang`);
  }
});

test('semua id yang dibaca app.js benar-benar ada di halaman', () => {
  const app = readFileSync(join(AKAR, 'src', 'app.js'), 'utf8');
  const h = halaman('id', { basis: BASIS });
  for (const m of app.matchAll(/\$\('([A-Za-z]+)'\)/g)) {
    assert.ok(h.includes(`id="${m[1]}"`), `app.js membaca #${m[1]} yang tidak ada di halaman`);
  }
});

test('setiap model di tabel harga tampil sebagai pilihan beserta harganya', () => {
  const h = halaman('id', { basis: BASIS });
  for (const m of MODEL) {
    assert.ok(h.includes(`value="${m.id}"`), `${m.id} tidak jadi pilihan`);
    assert.ok(h.includes(`data-masuk="${m.masuk}"`), `${m.id} tidak membawa harga masukan`);
    assert.ok(h.includes(m.nama), `${m.nama} tidak muncul di tabel`);
  }
});

test('halaman menandai baris harga yang sudah lewat masa segarnya', () => {
  const segar = halaman('id', { basis: BASIS, tanggal: MODEL[0].diperiksa });
  const basi = halaman('id', { basis: BASIS, tanggal: '2030-01-01' });
  assert.ok(!segar.includes('class="basi"'), 'harga segar salah ditandai basi');
  assert.ok(basi.includes('class="basi"'), 'harga basi tidak ditandai');
});

test('kamus tertanam memuat semua kunci yang dipakai papan dan tidak memutus tag script', () => {
  const h = halaman('id', { basis: BASIS });
  const json = h.match(/id="kamus">(.*?)<\/script>/s)[1];
  assert.ok(!json.includes('</script'), 'JSON bisa memutus tag script');
  const tertanam = JSON.parse(json.replace(/\\u003c/g, '<'));
  for (const k of KUNCI_KAMUS) assert.ok(k in tertanam, `kunci ${k} tidak ikut tertanam`);
});

test('halaman memuat keempat catatan pembatas', () => {
  for (const b of BAHASA) {
    const h = halaman(b, { basis: BASIS });
    for (const k of ['catatan.rerata', 'catatan.token', 'catatan.harga', 'catatan.selfhost']) {
      assert.ok(h.includes(esc(t(b, k))), `${b}: ${k} hilang`);
    }
  }
});

test('halaman memasang hreflang untuk kedua bahasa dan x-default', () => {
  const h = halaman('id', { basis: BASIS });
  for (const a of ['hreflang="id"', 'hreflang="en"', 'hreflang="x-default"']) assert.ok(h.includes(a));
});

test('halaman EN memuat mesin dari satu tingkat di atasnya', () => {
  assert.ok(halaman('en', { basis: BASIS, jalur: '../' }).includes('src="../app.js"'));
  assert.ok(halaman('id', { basis: BASIS, jalur: './' }).includes('src="./app.js"'));
});

// ---------------------------------------------------------------- build

test('daftar mesin memuat semua modul yang di-impor app.js', () => {
  const app = readFileSync(join(AKAR, 'src', 'app.js'), 'utf8');
  for (const m of app.matchAll(/from '\.\/mesin\/([^']+)'/g)) {
    assert.ok(MESIN.includes(m[1]), `${m[1]} di-impor app.js tapi tidak ikut disalin build`);
  }
});

test('berkas mesin tidak mengimpor apa pun di luar daftar mesin', () => {
  for (const m of MESIN) {
    const isi = readFileSync(join(AKAR, 'src', m), 'utf8');
    for (const imp of isi.matchAll(/from '([^']+)'/g)) {
      const nama = imp[1].replace('./', '');
      assert.ok(MESIN.includes(nama), `${m} mengimpor ${nama} yang tidak ikut tersalin`);
    }
  }
});

test('robots mengizinkan pengindeksan dan menunjuk sitemap', () => {
  assert.ok(robots().includes('Allow: /'));
  assert.ok(robots().includes(`Sitemap: ${BASIS}/sitemap.xml`));
});

test('sitemap memuat kedua bahasa', () => {
  const s = sitemap('2026-09-07');
  assert.equal((s.match(/<url>/g) || []).length, 2);
});
