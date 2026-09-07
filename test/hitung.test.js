import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KARAKTER_PER_TOKEN, perkiraanToken, biayaPermintaan, biayaBulanan,
  kelayakan, hargaUntukMargin, acakTerbenih, lognormal, monteCarlo, persentil,
  bandingSelfHost, rupiah, rupiahHalus, dolar, skenario, BAWAAN,
} from '../src/hitung.js';

const HARGA = { masuk: 5, keluar: 25, cacheBaca: 0.5 };
const KURS = 16500;

// ---------------------------------------------------------------- token

test('perkiraanToken memakai rasio karakter per token yang diumumkan', () => {
  const teks = 'x'.repeat(340);
  assert.equal(perkiraanToken(teks, { ragam: 'id' }), Math.round(340 / KARAKTER_PER_TOKEN.id));
  assert.equal(perkiraanToken(teks, { ragam: 'en' }), Math.round(340 / KARAKTER_PER_TOKEN.en));
});

test('perkiraanToken menganggap Bahasa Indonesia lebih boros token daripada Inggris', () => {
  const teks = 'x'.repeat(1000);
  assert.ok(perkiraanToken(teks, { ragam: 'id' }) > perkiraanToken(teks, { ragam: 'en' }));
});

test('perkiraanToken teks kosong bernilai nol, bukan satu', () => {
  assert.equal(perkiraanToken(''), 0);
  assert.equal(perkiraanToken(null), 0);
  assert.equal(perkiraanToken(undefined), 0);
});

test('perkiraanToken teks sependek satu huruf tetap dihitung satu token', () => {
  assert.equal(perkiraanToken('a'), 1);
});

test('perkiraanToken mengalikan dengan faktor kalibrasi sebelum dibulatkan', () => {
  const teks = 'x'.repeat(400);
  // Pembulatan dilakukan sekali di akhir, bukan dua kali — kalau tidak, hasilnya
  // melenceng satu token untuk teks yang panjangnya tidak habis dibagi rasio.
  assert.equal(perkiraanToken(teks, { kalibrasi: 2 }), Math.round((400 / KARAKTER_PER_TOKEN.id) * 2));
  assert.equal(perkiraanToken(teks, { kalibrasi: 1 }), Math.round(400 / KARAKTER_PER_TOKEN.id));
});

test('perkiraanToken menolak ragam dan kalibrasi yang tidak masuk akal', () => {
  assert.throws(() => perkiraanToken('a', { ragam: 'jv' }), RangeError);
  assert.throws(() => perkiraanToken('a', { kalibrasi: 0 }), RangeError);
  assert.throws(() => perkiraanToken('a', { kalibrasi: -1 }), RangeError);
});

// ---------------------------------------------------------------- biaya permintaan

test('biayaPermintaan sesuai hitungan tangan', () => {
  // 10.000 masuk @ $5/juta = $0,05 ; 2.000 keluar @ $25/juta = $0,05 ; total $0,10
  const h = biayaPermintaan({ tokenMasuk: 10000, tokenKeluar: 2000, harga: HARGA, kurs: KURS });
  assert.ok(Math.abs(h.usd - 0.10) < 1e-12, `usd=${h.usd}`);
  assert.ok(Math.abs(h.idr - 0.10 * KURS) < 1e-9);
});

test('biayaPermintaan menagih token cache dengan harga cache, bukan harga masuk', () => {
  const tanpa = biayaPermintaan({ tokenMasuk: 100000, tokenKeluar: 0, harga: HARGA, kurs: KURS });
  const dengan = biayaPermintaan({ tokenMasuk: 0, tokenKeluar: 0, tokenCache: 100000, harga: HARGA, kurs: KURS });
  assert.ok(dengan.usd < tanpa.usd, 'cache seharusnya lebih murah');
  assert.ok(Math.abs(dengan.usd - (100000 / 1e6) * HARGA.cacheBaca) < 1e-12);
});

test('biayaPermintaan jatuh ke harga masuk kalau model tidak punya harga cache', () => {
  const h = biayaPermintaan({
    tokenMasuk: 0, tokenKeluar: 0, tokenCache: 1e6,
    harga: { masuk: 5, keluar: 25, cacheBaca: null }, kurs: KURS,
  });
  assert.equal(h.usd, 5);
});

test('biayaPermintaan menjumlahkan token total dengan benar', () => {
  const h = biayaPermintaan({ tokenMasuk: 10, tokenKeluar: 20, tokenCache: 30, harga: HARGA, kurs: KURS });
  assert.equal(h.token.total, 60);
});

test('biayaPermintaan nol token berbiaya nol, bukan NaN', () => {
  const h = biayaPermintaan({ tokenMasuk: 0, tokenKeluar: 0, harga: HARGA, kurs: KURS });
  assert.equal(h.usd, 0);
  assert.equal(h.idr, 0);
});

test('biayaPermintaan menolak angka negatif dan bukan angka', () => {
  for (const rusak of [{ tokenMasuk: -1 }, { tokenKeluar: NaN }, { tokenCache: -5 }, { kurs: -1 }]) {
    assert.throws(() => biayaPermintaan({
      tokenMasuk: 1, tokenKeluar: 1, harga: HARGA, kurs: KURS, ...rusak,
    }), RangeError, JSON.stringify(rusak));
  }
});

test('biayaPermintaan menolak harga yang tidak diberikan', () => {
  assert.throws(() => biayaPermintaan({ tokenMasuk: 1, tokenKeluar: 1, kurs: KURS }), TypeError);
});

test('biaya naik sebanding dengan jumlah token', () => {
  const satu = biayaPermintaan({ tokenMasuk: 1000, tokenKeluar: 500, harga: HARGA, kurs: KURS });
  const sepuluh = biayaPermintaan({ tokenMasuk: 10000, tokenKeluar: 5000, harga: HARGA, kurs: KURS });
  assert.ok(Math.abs(sepuluh.usd - satu.usd * 10) < 1e-12);
});

// ---------------------------------------------------------------- bulanan

test('biayaBulanan mengalikan pengguna dengan pemakaiannya', () => {
  const b = biayaBulanan({ perPermintaanIdr: 100, permintaanPerPenggunaPerBulan: 50, pengguna: 200 });
  assert.equal(b.permintaan, 10000);
  assert.equal(b.tokenIdr, 1_000_000);
  assert.equal(b.totalIdr, 1_000_000);
});

test('biayaBulanan menambahkan biaya tetap dan membaginya ke tiap pengguna', () => {
  const b = biayaBulanan({
    perPermintaanIdr: 100, permintaanPerPenggunaPerBulan: 10,
    pengguna: 100, biayaTetapIdr: 500000,
  });
  assert.equal(b.totalIdr, 100 * 10 * 100 + 500000);
  assert.equal(b.perPenggunaIdr, b.totalIdr / 100);
});

test('biayaBulanan tanpa pengguna tidak membagi dengan nol', () => {
  const b = biayaBulanan({ perPermintaanIdr: 100, permintaanPerPenggunaPerBulan: 10, pengguna: 0, biayaTetapIdr: 5000 });
  assert.equal(b.perPenggunaIdr, 0);
  assert.ok(Number.isFinite(b.totalIdr));
});

// ---------------------------------------------------------------- kelayakan

test('kelayakan menghitung margin, laba, dan titik impas', () => {
  const k = kelayakan({
    hargaLanggananIdr: 100000, biayaVariabelIdr: 30000,
    biayaTetapIdr: 7_000_000, pengguna: 200,
  });
  assert.equal(k.marginSatuanIdr, 70000);
  assert.equal(k.marginPersen, 70);
  assert.equal(k.pendapatanIdr, 20_000_000);
  assert.equal(k.biayaIdr, 30000 * 200 + 7_000_000);
  assert.equal(k.labaIdr, 20_000_000 - 13_000_000);
  assert.equal(k.impasPengguna, 100);
  assert.equal(k.sehat, true);
});

test('kelayakan menandai produk yang setiap penggunanya merugi', () => {
  const k = kelayakan({
    hargaLanggananIdr: 20000, biayaVariabelIdr: 50000,
    biayaTetapIdr: 1_000_000, pengguna: 100,
  });
  assert.ok(k.marginSatuanIdr < 0);
  assert.equal(k.sehat, false);
  assert.equal(k.impasPengguna, null, 'tidak boleh mengaku ada titik impas');
});

test('kelayakan pada titik impas menghasilkan laba tepat nol', () => {
  const k = kelayakan({
    hargaLanggananIdr: 100000, biayaVariabelIdr: 30000,
    biayaTetapIdr: 7_000_000, pengguna: 100,
  });
  assert.equal(k.labaIdr, 0);
});

test('kelayakan menghitung runway hanya saat sedang rugi', () => {
  const rugi = kelayakan({
    hargaLanggananIdr: 10000, biayaVariabelIdr: 5000,
    biayaTetapIdr: 10_000_000, pengguna: 100, kasIdr: 30_000_000,
  });
  assert.ok(rugi.labaIdr < 0);
  assert.equal(rugi.runwayBulan, 30_000_000 / -rugi.labaIdr);

  const untung = kelayakan({
    hargaLanggananIdr: 100000, biayaVariabelIdr: 10000,
    biayaTetapIdr: 1_000_000, pengguna: 100, kasIdr: 30_000_000,
  });
  assert.equal(untung.runwayBulan, null, 'runway tidak bermakna saat untung');
});

test('kelayakan menyebut harga minimum sebesar biaya variabelnya', () => {
  const k = kelayakan({ hargaLanggananIdr: 1, biayaVariabelIdr: 12345, biayaTetapIdr: 0, pengguna: 1 });
  assert.equal(k.hargaMinimumIdr, 12345);
});

test('kelayakan dengan harga langganan nol tidak menghasilkan margin tak hingga', () => {
  const k = kelayakan({ hargaLanggananIdr: 0, biayaVariabelIdr: 100, biayaTetapIdr: 0, pengguna: 10 });
  assert.equal(k.marginPersen, null);
});

test('hargaUntukMargin membalik rumus margin dengan benar', () => {
  const harga = hargaUntukMargin(30000, 0.7);
  assert.ok(Math.abs(harga - 100000) < 1e-9);
  const k = kelayakan({ hargaLanggananIdr: harga, biayaVariabelIdr: 30000, biayaTetapIdr: 0, pengguna: 1 });
  assert.ok(Math.abs(k.marginPersen - 70) < 1e-9);
});

test('hargaUntukMargin menolak target margin yang mustahil', () => {
  assert.throws(() => hargaUntukMargin(1000, 1), RangeError);
  assert.throws(() => hargaUntukMargin(1000, 1.5), RangeError);
  assert.throws(() => hargaUntukMargin(1000, -0.1), RangeError);
});

// ---------------------------------------------------------------- acak

test('acakTerbenih menghasilkan deret yang sama untuk benih yang sama', () => {
  const a = acakTerbenih(7), b = acakTerbenih(7);
  for (let i = 0; i < 50; i++) assert.equal(a(), b());
});

test('acakTerbenih menghasilkan deret berbeda untuk benih berbeda', () => {
  const a = acakTerbenih(1), b = acakTerbenih(2);
  assert.notEqual(a(), b());
});

test('acakTerbenih selalu di dalam rentang 0 sampai 1', () => {
  const r = acakTerbenih(99);
  for (let i = 0; i < 5000; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1, `keluar rentang: ${v}`);
  }
});

test('lognormal selalu positif dan median contohnya mendekati median yang diminta', () => {
  const r = acakTerbenih(3);
  const contoh = [];
  for (let i = 0; i < 20000; i++) {
    const v = lognormal(r, 100, 0.8);
    assert.ok(v > 0, 'lognormal tidak boleh nol atau negatif');
    contoh.push(v);
  }
  contoh.sort((a, b) => a - b);
  const median = contoh[Math.floor(contoh.length / 2)];
  assert.ok(Math.abs(median - 100) < 5, `median contoh ${median} jauh dari 100`);
});

// ---------------------------------------------------------------- monte carlo

test('monteCarlo memberi hasil identik untuk benih yang sama', () => {
  const o = { pengguna: 50, medianPermintaan: 40, sebaran: 0.8, perPermintaanIdr: 500, benih: 11, iterasi: 300 };
  assert.deepEqual(monteCarlo(o), monteCarlo(o));
});

test('monteCarlo mengurutkan persentilnya secara menaik', () => {
  const m = monteCarlo({ pengguna: 100, medianPermintaan: 40, sebaran: 0.9, perPermintaanIdr: 500, iterasi: 800 });
  assert.ok(m.minimum <= m.p50);
  assert.ok(m.p50 <= m.p90, `p50 ${m.p50} > p90 ${m.p90}`);
  assert.ok(m.p90 <= m.p99, `p90 ${m.p90} > p99 ${m.p99}`);
  assert.ok(m.p99 <= m.maksimum);
});

test('monteCarlo dengan sebaran timpang membuat p90 jauh di atas rerata', () => {
  const rata = monteCarlo({ pengguna: 30, medianPermintaan: 40, sebaran: 0.05, perPermintaanIdr: 500, iterasi: 800 });
  const timpang = monteCarlo({ pengguna: 30, medianPermintaan: 40, sebaran: 1.4, perPermintaanIdr: 500, iterasi: 800 });
  const jarakRata = rata.p90 / rata.p50;
  const jarakTimpang = timpang.p90 / timpang.p50;
  assert.ok(jarakTimpang > jarakRata, 'sebaran timpang seharusnya melebarkan ekor tagihan');
});

test('monteCarlo memasukkan biaya tetap ke setiap iterasi', () => {
  const tanpa = monteCarlo({ pengguna: 10, medianPermintaan: 10, sebaran: 0.5, perPermintaanIdr: 100, iterasi: 200, benih: 5 });
  const dengan = monteCarlo({ pengguna: 10, medianPermintaan: 10, sebaran: 0.5, perPermintaanIdr: 100, iterasi: 200, benih: 5, biayaTetapIdr: 1000 });
  assert.ok(Math.abs((dengan.p50 - tanpa.p50) - 1000) < 1e-6);
});

test('monteCarlo tanpa pengguna hanya menyisakan biaya tetap', () => {
  const m = monteCarlo({ pengguna: 0, medianPermintaan: 10, sebaran: 0.8, perPermintaanIdr: 100, biayaTetapIdr: 777, iterasi: 50 });
  assert.equal(m.p50, 777);
  assert.equal(m.rerata, 777);
});

test('monteCarlo menolak jumlah iterasi yang tidak masuk akal', () => {
  const dasar = { pengguna: 1, medianPermintaan: 1, sebaran: 0.5, perPermintaanIdr: 1 };
  assert.throws(() => monteCarlo({ ...dasar, iterasi: 0 }), RangeError);
  assert.throws(() => monteCarlo({ ...dasar, iterasi: 1.5 }), RangeError);
});

test('persentil mengambil nilai dari deret terurut', () => {
  const d = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(persentil(d, 0), 1);
  assert.equal(persentil(d, 50), 5);
  assert.equal(persentil(d, 100), 10);
});

test('persentil atas deret kosong bernilai nol, bukan undefined', () => {
  assert.equal(persentil([], 50), 0);
});

test('persentil menolak nilai di luar 0..100', () => {
  assert.throws(() => persentil([1], 101), RangeError);
  assert.throws(() => persentil([1], -1), RangeError);
});

// ---------------------------------------------------------------- self-host

test('bandingSelfHost menghitung jam sewa dari throughput dan utilisasi', () => {
  const h = bandingSelfHost({
    permintaanPerBulan: 100000, tokenPerPermintaan: 1000, tokenPerDetik: 1000,
    gpuPerJamUsd: 2, utilisasi: 0.5, kurs: KURS, biayaApiIdr: 10_000_000,
  });
  // 100 juta token / 1000 tps = 100.000 detik = 27,78 jam komputasi; /0,5 = 55,56 jam sewa
  assert.ok(Math.abs(h.jamSewa - (100000 * 1000) / 1000 / 3600 / 0.5) < 1e-9);
  assert.ok(Math.abs(h.selfHostIdr - h.jamSewa * 2 * KURS) < 1e-6);
});

test('bandingSelfHost menyebut mana yang lebih murah', () => {
  const murahSendiri = bandingSelfHost({
    permintaanPerBulan: 1e6, tokenPerPermintaan: 1000, tokenPerDetik: 5000,
    gpuPerJamUsd: 2, kurs: KURS, biayaApiIdr: 1e9,
  });
  assert.equal(murahSendiri.lebihMurah, 'self-host');

  const murahApi = bandingSelfHost({
    permintaanPerBulan: 100, tokenPerPermintaan: 100, tokenPerDetik: 50,
    gpuPerJamUsd: 3, kurs: KURS, biayaApiIdr: 1000,
  });
  assert.equal(murahApi.lebihMurah, 'api');
});

test('bandingSelfHost menolak throughput dan utilisasi yang mustahil', () => {
  const dasar = {
    permintaanPerBulan: 1, tokenPerPermintaan: 1, tokenPerDetik: 1,
    gpuPerJamUsd: 1, kurs: KURS, biayaApiIdr: 1,
  };
  assert.throws(() => bandingSelfHost({ ...dasar, tokenPerDetik: 0 }), RangeError);
  assert.throws(() => bandingSelfHost({ ...dasar, utilisasi: 0 }), RangeError);
  assert.throws(() => bandingSelfHost({ ...dasar, utilisasi: 1.2 }), RangeError);
});

// ---------------------------------------------------------------- format

test('rupiah memakai pemisah ribuan gaya Indonesia', () => {
  assert.equal(rupiah(1234567), 'Rp1.234.567');
  assert.equal(rupiah(0), 'Rp0');
});

test('rupiah menandai angka negatif dengan minus yang benar', () => {
  assert.equal(rupiah(-5000), '−Rp5.000');
});

test('rupiah menolak angka yang bukan angka', () => {
  assert.equal(rupiah(NaN), '—');
  assert.equal(rupiah(Infinity), '—');
  assert.equal(rupiah(null), '—');
});

test('rupiahHalus menaikkan ketelitian untuk angka kecil', () => {
  assert.equal(rupiahHalus(0.0123), 'Rp0,0123');
  assert.equal(rupiahHalus(12.5), 'Rp12,50');
  assert.equal(rupiahHalus(123456), 'Rp123.456');
});

test('dolar memakai enam angka di belakang koma untuk nilai sangat kecil', () => {
  assert.equal(dolar(0.000123), '$0.000123');
  assert.equal(dolar(1.5), '$1.50');
  assert.equal(dolar(NaN), '—');
});

// ---------------------------------------------------------------- skenario

test('skenario mengisi setiap bagian papan', () => {
  const s = skenario(BAWAAN);
  for (const kunci of ['permintaan', 'per1000Idr', 'bulanan', 'variabelPerPenggunaIdr',
    'bisnis', 'simulasi', 'kejutanP90', 'hargaMargin70Idr', 'hargaMargin80Idr']) {
    assert.ok(s[kunci] !== undefined, `bagian ${kunci} hilang`);
  }
});

test('skenario tidak menghasilkan satu pun NaN untuk nilai bawaan', () => {
  const s = skenario(BAWAAN);
  const jelajah = (o, jalur = '') => {
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object') jelajah(v, `${jalur}.${k}`);
      else if (typeof v === 'number') assert.ok(Number.isFinite(v), `${jalur}.${k} = ${v}`);
    }
  };
  jelajah(s);
});

test('skenario konsisten: biaya per pengguna sama dengan biaya permintaan kali pemakaiannya', () => {
  const s = skenario(BAWAAN);
  assert.ok(Math.abs(s.variabelPerPenggunaIdr
    - s.permintaan.idr * BAWAAN.permintaanPerPengguna) < 1e-9);
});

test('skenario konsisten: total bulanan sama dengan biaya variabel semua pengguna plus biaya tetap', () => {
  const s = skenario(BAWAAN);
  const harusnya = s.variabelPerPenggunaIdr * BAWAAN.pengguna + BAWAAN.biayaTetap;
  assert.ok(Math.abs(s.bulanan.totalIdr - harusnya) < 1e-6);
});

test('skenario: harga untuk margin 80% selalu lebih tinggi daripada untuk 70%', () => {
  const s = skenario(BAWAAN);
  assert.ok(s.hargaMargin80Idr > s.hargaMargin70Idr);
});

test('skenario: kejutan p90 selalu minimal satu kali lipat', () => {
  const s = skenario(BAWAAN);
  assert.ok(s.kejutanP90 >= 1, `kejutan ${s.kejutanP90} mustahil di bawah 1`);
});

test('skenario menaikkan biaya saat model diganti ke yang lebih mahal', () => {
  const murah = skenario({ ...BAWAAN, hargaMasuk: 1, hargaKeluar: 5 });
  const mahal = skenario({ ...BAWAAN, hargaMasuk: 5, hargaKeluar: 25 });
  assert.ok(mahal.permintaan.idr > murah.permintaan.idr);
  assert.ok(mahal.bisnis.marginSatuanIdr < murah.bisnis.marginSatuanIdr);
});

test('skenario deterministik untuk masukan yang sama', () => {
  assert.deepEqual(skenario(BAWAAN), skenario(BAWAAN));
});

test('nilai bawaan menghasilkan produk yang layak — kalau tidak, contohnya menyesatkan', () => {
  const s = skenario(BAWAAN);
  assert.equal(s.bisnis.sehat, true, 'contoh bawaan seharusnya punya margin positif');
  assert.ok(s.bisnis.impasPengguna !== null);
});

test('BAWAAN memuat semua kunci yang dipakai skenario', () => {
  for (const k of ['hargaMasuk', 'hargaKeluar', 'hargaCache', 'tokenMasuk', 'tokenKeluar',
    'kurs', 'pengguna', 'permintaanPerPengguna', 'biayaTetap', 'hargaLangganan']) {
    assert.ok(Number.isFinite(BAWAAN[k]), `BAWAAN.${k} hilang atau bukan angka`);
  }
  assert.ok(Object.isFrozen(BAWAAN));
});
