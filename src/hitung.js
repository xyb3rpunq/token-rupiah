/**
 * Mesin hitung ekonomi produk AI. Semuanya murni: masuk angka, keluar angka.
 * Tidak ada I/O, tidak ada jam sistem, tidak ada Math.random yang tak terkendali.
 */

// ------------------------------------------------------------------ token

/**
 * Rata-rata karakter per token. Angka ini perkiraan, bukan kepastian:
 * setiap penyedia memakai tokenizer berbeda, dan Bahasa Indonesia lebih boros
 * token daripada Inggris karena imbuhannya sering dipecah jadi beberapa token.
 *
 * Untuk angka pasti, pakai endpoint penghitung token milik penyedianya
 * (Anthropic: POST /v1/messages/count_tokens). Kalkulator ini memberi perkiraan
 * cepat, dan sengaja menyediakan faktor kalibrasi supaya kamu bisa mencocokkannya.
 */
export const KARAKTER_PER_TOKEN = Object.freeze({ id: 3.4, en: 4.0, kode: 3.2 });

/**
 * Perkirakan jumlah token sebuah teks.
 * @param {string} teks
 * @param {{ragam?: 'id'|'en'|'kode', kalibrasi?: number}} opsi
 *   `kalibrasi` mengalikan hasilnya — isi dengan (token sebenarnya / token perkiraan)
 *   setelah kamu sekali membandingkan dengan penghitung resmi.
 */
export function perkiraanToken(teks, { ragam = 'id', kalibrasi = 1 } = {}) {
  const isi = typeof teks === 'string' ? teks : '';
  const rasio = KARAKTER_PER_TOKEN[ragam];
  if (!rasio) throw new RangeError(`ragam tak dikenal: ${ragam}`);
  if (!Number.isFinite(kalibrasi) || kalibrasi <= 0) throw new RangeError('kalibrasi harus > 0');
  if (isi.length === 0) return 0;
  return Math.max(1, Math.round((isi.length / rasio) * kalibrasi));
}

// ------------------------------------------------------------------ biaya

const JUTA = 1_000_000;
const angka = (v, nama) => {
  if (!Number.isFinite(v) || v < 0) throw new RangeError(`${nama} harus angka >= 0, dapat: ${v}`);
  return v;
};

/**
 * Biaya satu permintaan, dalam USD dan IDR.
 *
 * @param {Object} o
 * @param {number} o.tokenMasuk     token masukan yang tidak dari cache
 * @param {number} o.tokenKeluar    token keluaran
 * @param {number} [o.tokenCache]   token masukan yang dilayani dari cache
 * @param {{masuk:number, keluar:number, cacheBaca?:number|null}} o.harga  USD per 1 juta token
 * @param {number} o.kurs           rupiah per dolar
 */
export function biayaPermintaan({ tokenMasuk, tokenKeluar, tokenCache = 0, harga, kurs }) {
  angka(tokenMasuk, 'tokenMasuk');
  angka(tokenKeluar, 'tokenKeluar');
  angka(tokenCache, 'tokenCache');
  angka(kurs, 'kurs');
  if (!harga) throw new TypeError('harga wajib diisi');

  const hargaCache = Number.isFinite(harga.cacheBaca) ? harga.cacheBaca : harga.masuk;
  const usdMasuk = (tokenMasuk / JUTA) * angka(harga.masuk, 'harga.masuk');
  const usdKeluar = (tokenKeluar / JUTA) * angka(harga.keluar, 'harga.keluar');
  const usdCache = (tokenCache / JUTA) * angka(hargaCache, 'harga.cacheBaca');
  const usd = usdMasuk + usdKeluar + usdCache;

  return {
    usd, idr: usd * kurs,
    rincian: { usdMasuk, usdKeluar, usdCache },
    token: { masuk: tokenMasuk, keluar: tokenKeluar, cache: tokenCache,
      total: tokenMasuk + tokenKeluar + tokenCache },
  };
}

/**
 * Biaya sebulan untuk sejumlah pengguna.
 * @param {{perPermintaanIdr:number, permintaanPerPenggunaPerBulan:number,
 *          pengguna:number, biayaTetapIdr?:number}} o
 */
export function biayaBulanan({ perPermintaanIdr, permintaanPerPenggunaPerBulan, pengguna, biayaTetapIdr = 0 }) {
  angka(perPermintaanIdr, 'perPermintaanIdr');
  angka(permintaanPerPenggunaPerBulan, 'permintaanPerPenggunaPerBulan');
  angka(pengguna, 'pengguna');
  angka(biayaTetapIdr, 'biayaTetapIdr');

  const permintaan = pengguna * permintaanPerPenggunaPerBulan;
  const token = permintaan * perPermintaanIdr;
  return {
    permintaan,
    tokenIdr: token,
    tetapIdr: biayaTetapIdr,
    totalIdr: token + biayaTetapIdr,
    perPenggunaIdr: pengguna === 0 ? 0 : (token + biayaTetapIdr) / pengguna,
  };
}

// ------------------------------------------------------------------ kelayakan

/**
 * Kelayakan langganan: margin, titik impas, dan berapa lama uang bertahan.
 *
 * @param {Object} o
 * @param {number} o.hargaLanggananIdr    harga per pengguna per bulan
 * @param {number} o.biayaVariabelIdr     biaya token per pengguna per bulan
 * @param {number} o.biayaTetapIdr        biaya bulanan yang tidak ikut jumlah pengguna
 * @param {number} o.pengguna             jumlah pengguna berbayar saat ini
 * @param {number} [o.kasIdr]             uang di tangan, untuk menghitung runway
 */
export function kelayakan({ hargaLanggananIdr, biayaVariabelIdr, biayaTetapIdr, pengguna, kasIdr = 0 }) {
  angka(hargaLanggananIdr, 'hargaLanggananIdr');
  angka(biayaVariabelIdr, 'biayaVariabelIdr');
  angka(biayaTetapIdr, 'biayaTetapIdr');
  angka(pengguna, 'pengguna');
  angka(kasIdr, 'kasIdr');

  const marginSatuan = hargaLanggananIdr - biayaVariabelIdr;
  const pendapatan = hargaLanggananIdr * pengguna;
  const biaya = biayaVariabelIdr * pengguna + biayaTetapIdr;
  const laba = pendapatan - biaya;

  // Titik impas hanya ada kalau tiap pengguna menyumbang margin positif.
  const impasPengguna = marginSatuan > 0 ? Math.ceil(biayaTetapIdr / marginSatuan) : null;

  // Runway hanya bermakna kalau sedang rugi.
  const bakarPerBulan = laba < 0 ? -laba : 0;
  const runwayBulan = bakarPerBulan > 0 ? kasIdr / bakarPerBulan : null;

  return {
    marginSatuanIdr: marginSatuan,
    marginPersen: hargaLanggananIdr === 0 ? null : (marginSatuan / hargaLanggananIdr) * 100,
    pendapatanIdr: pendapatan,
    biayaIdr: biaya,
    labaIdr: laba,
    impasPengguna,
    sehat: marginSatuan > 0,
    runwayBulan,
    hargaMinimumIdr: biayaVariabelIdr, // di bawah ini tiap pengguna baru menambah rugi
  };
}

/**
 * Harga langganan minimum untuk mencapai margin kotor tertentu.
 * @param {number} biayaVariabelIdr biaya token per pengguna per bulan
 * @param {number} marginTarget     0..1, misal 0.7 untuk margin kotor 70%
 */
export function hargaUntukMargin(biayaVariabelIdr, marginTarget) {
  angka(biayaVariabelIdr, 'biayaVariabelIdr');
  if (!(marginTarget >= 0 && marginTarget < 1)) {
    throw new RangeError('marginTarget harus di antara 0 dan 1 (tidak termasuk 1)');
  }
  return biayaVariabelIdr / (1 - marginTarget);
}

// ------------------------------------------------------------------ acak

/**
 * Pembangkit acak mulberry32 — kecil, cepat, dan yang terpenting: bisa diulang.
 * Simulasi yang hasilnya berbeda tiap kali dijalankan tidak bisa diuji.
 */
export function acakTerbenih(benih) {
  let a = benih >>> 0;
  return function berikutnya() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ambil satu nilai dari sebaran lognormal — bentuk yang biasa untuk pemakaian. */
export function lognormal(rng, median, sebaran) {
  // Box-Muller untuk normal baku, lalu dieksponensialkan.
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return median * Math.exp(sebaran * z);
}

/**
 * Simulasi Monte Carlo pemakaian bulanan.
 *
 * Pemakaian pengguna nyata tidak rata: sebagian besar memakai sedikit, segelintir
 * memakai sangat banyak. Memakai rata-rata sebagai dasar tagihan adalah cara
 * paling umum salah menghitung biaya produk AI, karena ekor kanannya panjang.
 *
 * @param {Object} o
 * @param {number} o.pengguna
 * @param {number} o.medianPermintaan  permintaan per pengguna per bulan (nilai tengah)
 * @param {number} o.sebaran           makin besar makin timpang; 0.8 lazim untuk SaaS
 * @param {number} o.perPermintaanIdr
 * @param {number} [o.biayaTetapIdr]
 * @param {number} [o.iterasi]
 * @param {number} [o.benih]
 */
export function monteCarlo({
  pengguna, medianPermintaan, sebaran, perPermintaanIdr,
  biayaTetapIdr = 0, iterasi = 2000, benih = 42,
}) {
  angka(pengguna, 'pengguna');
  angka(medianPermintaan, 'medianPermintaan');
  angka(sebaran, 'sebaran');
  angka(perPermintaanIdr, 'perPermintaanIdr');
  if (!Number.isInteger(iterasi) || iterasi < 1) throw new RangeError('iterasi harus bilangan bulat >= 1');

  const rng = acakTerbenih(benih);
  const total = new Array(iterasi);
  for (let i = 0; i < iterasi; i++) {
    let permintaan = 0;
    for (let u = 0; u < pengguna; u++) permintaan += lognormal(rng, medianPermintaan, sebaran);
    total[i] = permintaan * perPermintaanIdr + biayaTetapIdr;
  }
  total.sort((a, b) => a - b);
  return {
    iterasi,
    rerata: total.reduce((a, b) => a + b, 0) / iterasi,
    p50: persentil(total, 50),
    p90: persentil(total, 90),
    p99: persentil(total, 99),
    maksimum: total[iterasi - 1],
    minimum: total[0],
  };
}

/** Persentil dari array yang SUDAH terurut menaik. */
export function persentil(terurut, p) {
  if (!Array.isArray(terurut) || terurut.length === 0) return 0;
  if (!(p >= 0 && p <= 100)) throw new RangeError('persentil harus 0..100');
  const i = Math.min(terurut.length - 1, Math.max(0, Math.ceil((p / 100) * terurut.length) - 1));
  return terurut[i];
}

// ------------------------------------------------------------------ self-host

/**
 * Bandingkan sewa API dengan menjalankan model sendiri di GPU sewaan.
 *
 * Angka self-host sengaja konservatif dan wajib disikapi hati-hati: throughput
 * nyata bergantung pada model, panjang konteks, batching, dan kuantisasi. Yang
 * dihitung di sini hanya sewa GPU-nya — bukan waktu orang yang mengurusnya,
 * bukan waktu menganggur, bukan biaya gagal.
 */
export function bandingSelfHost({
  permintaanPerBulan, tokenPerPermintaan, tokenPerDetik, gpuPerJamUsd,
  utilisasi = 0.35, kurs, biayaApiIdr,
}) {
  angka(permintaanPerBulan, 'permintaanPerBulan');
  angka(tokenPerPermintaan, 'tokenPerPermintaan');
  angka(gpuPerJamUsd, 'gpuPerJamUsd');
  angka(kurs, 'kurs');
  angka(biayaApiIdr, 'biayaApiIdr');
  if (!(tokenPerDetik > 0)) throw new RangeError('tokenPerDetik harus > 0');
  if (!(utilisasi > 0 && utilisasi <= 1)) throw new RangeError('utilisasi harus di antara 0 dan 1');

  const tokenSebulan = permintaanPerBulan * tokenPerPermintaan;
  const detikKomputasi = tokenSebulan / tokenPerDetik;
  const jamSewa = detikKomputasi / 3600 / utilisasi;
  const selfHostIdr = jamSewa * gpuPerJamUsd * kurs;

  return {
    jamSewa,
    selfHostIdr,
    apiIdr: biayaApiIdr,
    selisihIdr: biayaApiIdr - selfHostIdr,
    lebihMurah: selfHostIdr < biayaApiIdr ? 'self-host' : 'api',
    // Titik di mana keduanya seimbang, dinyatakan sebagai permintaan per bulan.
    impasPermintaan: biayaApiIdr > 0 && permintaanPerBulan > 0
      ? (selfHostIdr / (biayaApiIdr / permintaanPerBulan))
      : null,
  };
}

// ------------------------------------------------------------------ format

/** Rupiah tanpa desimal, dengan pemisah ribuan gaya Indonesia. */
export function rupiah(n) {
  if (!Number.isFinite(n)) return '—';
  const bulat = Math.round(n);
  const tanda = bulat < 0 ? '−' : '';
  return tanda + 'Rp' + Math.abs(bulat).toLocaleString('id-ID');
}

/** Rupiah dengan ketelitian pecahan untuk angka yang sangat kecil. */
export function rupiahHalus(n) {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return rupiah(n);
  if (Math.abs(n) >= 1) return 'Rp' + n.toFixed(2).replace('.', ',');
  return 'Rp' + n.toFixed(4).replace('.', ',');
}

export function dolar(n) {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 0.01) return '$' + n.toFixed(2);
  return '$' + n.toFixed(6);
}

// ------------------------------------------------------------------ skenario

/**
 * Satu panggilan yang menghitung seluruh papan.
 *
 * UI cuma mengisi objek masukan dan menampilkan objek keluaran — tidak ada
 * matematika di sisi tampilan. Itu sebabnya seluruh perilaku halaman bisa diuji
 * di sini tanpa peramban.
 *
 * @param {Object} m masukan mentah dari formulir (angka sudah diurai)
 */
export function skenario(m) {
  const harga = { masuk: m.hargaMasuk, keluar: m.hargaKeluar, cacheBaca: m.hargaCache };

  const permintaan = biayaPermintaan({
    tokenMasuk: m.tokenMasuk,
    tokenKeluar: m.tokenKeluar,
    tokenCache: m.tokenCache ?? 0,
    harga,
    kurs: m.kurs,
  });

  const bulanan = biayaBulanan({
    perPermintaanIdr: permintaan.idr,
    permintaanPerPenggunaPerBulan: m.permintaanPerPengguna,
    pengguna: m.pengguna,
    biayaTetapIdr: m.biayaTetap ?? 0,
  });

  const variabelPerPengguna = permintaan.idr * m.permintaanPerPengguna;

  const bisnis = kelayakan({
    hargaLanggananIdr: m.hargaLangganan,
    biayaVariabelIdr: variabelPerPengguna,
    biayaTetapIdr: m.biayaTetap ?? 0,
    pengguna: m.pengguna,
    kasIdr: m.kas ?? 0,
  });

  const simulasi = monteCarlo({
    pengguna: m.pengguna,
    medianPermintaan: m.permintaanPerPengguna,
    sebaran: m.sebaran ?? 0.8,
    perPermintaanIdr: permintaan.idr,
    biayaTetapIdr: m.biayaTetap ?? 0,
    iterasi: m.iterasi ?? 2000,
    benih: m.benih ?? 42,
  });

  return {
    permintaan,
    per1000Idr: permintaan.idr * 1000,
    bulanan,
    variabelPerPenggunaIdr: variabelPerPengguna,
    bisnis,
    simulasi,
    // Kejutan tagihan: berapa kali lipat bulan buruk dibanding bulan biasa.
    kejutanP90: simulasi.p50 > 0 ? simulasi.p90 / simulasi.p50 : null,
    hargaMargin70Idr: hargaUntukMargin(variabelPerPengguna, 0.7),
    hargaMargin80Idr: hargaUntukMargin(variabelPerPengguna, 0.8),
  };
}

/** Nilai bawaan yang masuk akal untuk sebuah SaaS AI kecil di Indonesia. */
export const BAWAAN = Object.freeze({
  hargaMasuk: 1.0, hargaKeluar: 5.0, hargaCache: 0.1,
  tokenMasuk: 2000, tokenKeluar: 500, tokenCache: 0,
  kurs: 16500,
  pengguna: 200, permintaanPerPengguna: 60,
  biayaTetap: 1_500_000, hargaLangganan: 49_000, kas: 30_000_000,
  sebaran: 0.8, iterasi: 2000, benih: 42,
});
