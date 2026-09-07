/**
 * Perekat UI. Semua matematika ada di mesin/hitung.js dan semua perakitan HTML
 * ada di mesin/papan.js — berkas ini hanya membaca kotak isian, memanggil
 * skenario(), dan menaruh hasilnya. Tidak ada permintaan jaringan keluar.
 */
import { skenario, perkiraanToken, BAWAAN } from './mesin/hitung.js';
import { papan } from './mesin/papan.js';

const K = JSON.parse(document.getElementById('kamus').textContent);
const $ = (id) => document.getElementById(id);

const ISIAN = ['hargaMasuk', 'hargaKeluar', 'hargaCache', 'kurs', 'tokenMasuk', 'tokenKeluar',
  'tokenCache', 'pengguna', 'permintaanPerPengguna', 'biayaTetap', 'hargaLangganan', 'kas', 'sebaran'];

/** Baca satu kotak angka. Kotak kosong atau rusak dianggap nol, bukan NaN. */
function baca(id) {
  const v = Number($(id).value);
  return Number.isFinite(v) && v >= 0 ? v : 0;
}

function kumpulkan() {
  const m = {};
  for (const id of ISIAN) m[id] = baca(id);
  m.iterasi = BAWAAN.iterasi;
  m.benih = BAWAAN.benih;
  return m;
}

function gambar() {
  let hasil;
  try {
    hasil = skenario(kumpulkan());
  } catch (galat) {
    $('papan').innerHTML = `<p class="vonis v-rugi">${String(galat.message)}</p>`;
    return;
  }
  $('papan').innerHTML = papan(hasil, K);
}

function pasangModel() {
  const pilih = $('model');
  pilih.addEventListener('change', () => {
    const opsi = pilih.selectedOptions[0];
    if (!opsi || !opsi.value) return; // "isi harga sendiri" — biarkan angkanya
    $('hargaMasuk').value = opsi.dataset.masuk;
    $('hargaKeluar').value = opsi.dataset.keluar;
    $('hargaCache').value = opsi.dataset.cache || '0';
    gambar();
  });
}

function pasangPerkiraan() {
  const kotak = $('contohTeks');
  const tampil = $('perkiraanToken');
  const hitung = () => perkiraanToken(kotak.value, { ragam: 'id' });
  kotak.addEventListener('input', () => {
    const n = hitung();
    tampil.textContent = n > 0 ? `≈ ${n.toLocaleString('id-ID')} token` : '';
  });
  $('pakaiPerkiraan').addEventListener('click', () => {
    const n = hitung();
    if (n > 0) {
      $('tokenMasuk').value = String(n);
      gambar();
    }
  });
}

function pasang() {
  if (!$('form')) return;
  for (const id of ISIAN) $(id).addEventListener('input', gambar);
  pasangModel();
  pasangPerkiraan();
  $('setelUlang').addEventListener('click', () => {
    for (const id of ISIAN) if (BAWAAN[id] !== undefined) $(id).value = String(BAWAAN[id]);
    $('contohTeks').value = '';
    $('perkiraanToken').textContent = '';
    gambar();
  });
  gambar(); // papan sudah terisi saat halaman pertama kali dibuka
}

pasang();
