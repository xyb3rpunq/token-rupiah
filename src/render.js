/** Perakit halaman. Murni: masuk bahasa, keluar HTML. */
import { t } from './i18n.js';
import { MODEL, PENYEDIA_LAIN, KURS_BAWAAN, harusDicekUlang } from './harga.js';
import { BAWAAN } from './hitung.js';
import { esc } from './papan.js';

const KUNCI_KAMUS = Object.freeze([
  'out.perPermintaan', 'out.per1000', 'out.perPengguna', 'out.tagihanBulanan',
  'out.margin', 'out.impas', 'out.laba', 'out.runway', 'out.bulan', 'out.pengguna',
  'out.hargaMinimum', 'out.margin70', 'out.margin80',
  'out.p50', 'out.p90', 'out.p99', 'out.kejutan', 'out.kaliLipat',
  'out.takAdaImpas', 'out.takAdaRunway',
  'vonis.sehat', 'vonis.rugi', 'vonis.tipis',
]);

function isian(b, id, kunci, nilai, { langkah = 'any', min = 0 } = {}) {
  return `<label for="${esc(id)}">${esc(t(b, kunci))}</label>`
    + `<input id="${esc(id)}" type="number" inputmode="decimal" `
    + `step="${esc(langkah)}" min="${esc(min)}" value="${esc(nilai)}">`;
}

function tabelHarga(b, tanggal) {
  const basi = new Set(harusDicekUlang(tanggal).map((x) => x.id));
  const baris = MODEL.map((m) => `<tr${basi.has(m.id) ? ' class="basi"' : ''}>
    <td><b>${esc(m.nama)}</b><br><small>${esc(m.penyedia)}</small></td>
    <td class="num">$${m.masuk.toFixed(2)}</td>
    <td class="num">$${m.keluar.toFixed(2)}</td>
    <td class="num">${m.cacheBaca === null ? '—' : '$' + m.cacheBaca.toFixed(2)}</td>
    <td class="num">${(m.konteks / 1000).toLocaleString('id-ID')}K</td>
    <td class="num tgl">${esc(m.diperiksa)}${basi.has(m.id) ? ` <span class="tanda">${esc(t(b, 'harga.basi'))}</span>` : ''}</td>
  </tr>`).join('');

  const lain = PENYEDIA_LAIN.map((p) =>
    `<li><a href="${esc(p.sumber)}" target="_blank" rel="noopener noreferrer">${esc(p.penyedia)}</a></li>`).join('');

  return `<div class="gulir"><table class="harga">
    <caption>${esc(t(b, 'harga.satuan'))}</caption>
    <thead><tr>
      <th>${esc(t(b, 'harga.kolomModel'))}</th>
      <th class="num">${esc(t(b, 'harga.kolomMasuk'))}</th>
      <th class="num">${esc(t(b, 'harga.kolomKeluar'))}</th>
      <th class="num">${esc(t(b, 'harga.kolomCache'))}</th>
      <th class="num">${esc(t(b, 'harga.kolomKonteks'))}</th>
      <th class="num">${esc(t(b, 'harga.kolomDiperiksa'))}</th>
    </tr></thead>
    <tbody>${baris}</tbody>
  </table></div>
  <p class="lain">${esc(t(b, 'harga.lain'))}</p>
  <ul class="tautan-lain">${lain}</ul>`;
}

export function halaman(b, { basis = '', jalur = './', tanggal = '2026-09-07' } = {}) {
  const kamus = {};
  for (const k of KUNCI_KAMUS) kamus[k] = t(b, k);

  const opsiModel = MODEL.map((m) =>
    `<option value="${esc(m.id)}" data-masuk="${m.masuk}" data-keluar="${m.keluar}" `
    + `data-cache="${m.cacheBaca ?? ''}">${esc(m.nama)}</option>`).join('');

  return `<!doctype html>
<html lang="${esc(t(b, 'html.lang'))}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t(b, 'meta.judul'))}</title>
<meta name="description" content="${esc(t(b, 'meta.deskripsi'))}">
<meta property="og:title" content="${esc(t(b, 'meta.judul'))}">
<meta property="og:description" content="${esc(t(b, 'meta.deskripsi'))}">
<link rel="alternate" hreflang="id" href="${esc(basis)}/">
<link rel="alternate" hreflang="en" href="${esc(basis)}/en/">
<link rel="alternate" hreflang="x-default" href="${esc(basis)}/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chivo:wght@500;700;900&family=Spectral:wght@400;500&family=Roboto+Mono:wght@400;500;700&display=swap">
<link rel="stylesheet" href="${esc(jalur)}gaya.css">
</head>
<body>
<div class="wrap">

<header class="mast">
  <div class="eyebrow">
    <span>${esc(t(b, 'kepala.eyebrow'))}</span>
    <a class="ganti" href="${esc(t(b, 'nav.lainHref'))}" hreflang="${b === 'id' ? 'en' : 'id'}">${esc(t(b, 'nav.lain'))}</a>
  </div>
  <h1>${esc(t(b, 'kepala.judul1'))} <em>${esc(t(b, 'kepala.judul2'))}</em></h1>
  <p class="lede">${esc(t(b, 'kepala.lede'))}</p>
</header>

<div class="kolom">

  <form id="form" class="masukan" autocomplete="off">
    <h2>${esc(t(b, 'bag.masukan'))}</h2>

    <fieldset><legend>${esc(t(b, 'grup.model'))}</legend>
      <label for="model">${esc(t(b, 'in.model'))}</label>
      <select id="model">${opsiModel}<option value="">${esc(t(b, 'in.modelSendiri'))}</option></select>
      ${isian(b, 'hargaMasuk', 'in.hargaMasuk', BAWAAN.hargaMasuk, { langkah: '0.01' })}
      ${isian(b, 'hargaKeluar', 'in.hargaKeluar', BAWAAN.hargaKeluar, { langkah: '0.01' })}
      ${isian(b, 'hargaCache', 'in.hargaCache', BAWAAN.hargaCache, { langkah: '0.01' })}
      ${isian(b, 'kurs', 'in.kurs', KURS_BAWAAN.idrPerUsd, { langkah: '10' })}
    </fieldset>

    <fieldset><legend>${esc(t(b, 'grup.permintaan'))}</legend>
      ${isian(b, 'tokenMasuk', 'in.tokenMasuk', BAWAAN.tokenMasuk, { langkah: '100' })}
      ${isian(b, 'tokenKeluar', 'in.tokenKeluar', BAWAAN.tokenKeluar, { langkah: '50' })}
      ${isian(b, 'tokenCache', 'in.tokenCache', BAWAAN.tokenCache, { langkah: '100' })}
      <label for="contohTeks">${esc(t(b, 'in.tempelTeks'))}</label>
      <textarea id="contohTeks" rows="3" spellcheck="false"
        placeholder="${esc(t(b, 'in.tempelTeksPetunjuk'))}"></textarea>
      <p class="baris-aksi">
        <button type="button" id="pakaiPerkiraan">${esc(t(b, 'in.pakaiPerkiraan'))}</button>
        <span id="perkiraanToken" class="petunjuk"></span>
      </p>
    </fieldset>

    <fieldset><legend>${esc(t(b, 'grup.skala'))}</legend>
      ${isian(b, 'pengguna', 'in.pengguna', BAWAAN.pengguna, { langkah: '10' })}
      ${isian(b, 'permintaanPerPengguna', 'in.permintaanPerPengguna', BAWAAN.permintaanPerPengguna, { langkah: '5' })}
      ${isian(b, 'biayaTetap', 'in.biayaTetap', BAWAAN.biayaTetap, { langkah: '100000' })}
    </fieldset>

    <fieldset><legend>${esc(t(b, 'grup.bisnis'))}</legend>
      ${isian(b, 'hargaLangganan', 'in.hargaLangganan', BAWAAN.hargaLangganan, { langkah: '1000' })}
      ${isian(b, 'kas', 'in.kas', BAWAAN.kas, { langkah: '1000000' })}
    </fieldset>

    <fieldset><legend>${esc(t(b, 'grup.simulasi'))}</legend>
      ${isian(b, 'sebaran', 'in.sebaran', BAWAAN.sebaran, { langkah: '0.1' })}
    </fieldset>

    <p class="baris-aksi"><button type="button" id="setelUlang">${esc(t(b, 'in.setelUlang'))}</button></p>
  </form>

  <section class="hasil" aria-live="polite">
    <h2>${esc(t(b, 'bag.hasil'))}</h2>
    <div id="papan"></div>
  </section>

</div>

<section id="harga">
  <h2>${esc(t(b, 'bag.harga'))}</h2>
  ${tabelHarga(b, tanggal)}
</section>

<section id="catatan">
  <h2>${esc(t(b, 'bag.catatan'))}</h2>
  <ul class="catatan">
    <li>${esc(t(b, 'catatan.rerata'))}</li>
    <li>${esc(t(b, 'catatan.token'))}</li>
    <li>${esc(t(b, 'catatan.harga'))}</li>
    <li>${esc(t(b, 'catatan.selfhost'))}</li>
  </ul>
</section>

<footer><p>${esc(t(b, 'kaki.sumber'))}</p></footer>

</div>
<script type="application/json" id="kamus">${JSON.stringify(kamus).replace(/</g, '\\u003c')}</script>
<script type="module" src="${esc(jalur)}app.js"></script>
</body>
</html>
`;
}

export { KUNCI_KAMUS };
