/**
 * Tabel harga model, dolar AS per satu juta token.
 *
 * ATURAN BERKAS INI: setiap baris wajib menyebut `sumber` (URL halaman harga resmi)
 * dan `diperiksa` (tanggal terakhir angkanya dicocokkan ke sumber itu). Uji di
 * test/harga.test.js menolak baris yang tidak punya keduanya, dan menandai baris
 * yang sudah lewat masa segarnya.
 *
 * Nilai kalkulator ini ada di matematikanya, bukan di tabel ini — harga model
 * berubah beberapa kali setahun. Perlakukan angka di bawah sebagai bawaan yang
 * bisa ditimpa pengguna, bukan sebagai kebenaran.
 */

/** Berapa hari sebuah baris harga dianggap masih segar. */
export const MASA_SEGAR_HARI = 120;

/** Kurs bawaan. Bukan kurs pasar — pengguna wajib mengganti dengan kurs hari itu. */
export const KURS_BAWAAN = Object.freeze({
  idrPerUsd: 16500,
  diperiksa: '2026-09-07',
  catatan: 'angka bulat untuk perkiraan kasar; ganti dengan kurs tengah BI hari itu',
});

/**
 * @typedef {Object} Model
 * @property {string} id        pengenal internal
 * @property {string} nama      nama tampilan
 * @property {string} penyedia  Anthropic / OpenAI / Google / dst.
 * @property {number} masuk     USD per 1 juta token masukan
 * @property {number} keluar    USD per 1 juta token keluaran
 * @property {number|null} cacheBaca  USD per 1 juta token yang dibaca dari cache
 * @property {number} konteks   jendela konteks dalam token
 * @property {string} sumber    URL halaman harga resmi
 * @property {string} diperiksa tanggal ISO saat angka ini dicocokkan
 */

export const MODEL = Object.freeze([
  {
    id: 'claude-opus-5', nama: 'Claude Opus 5', penyedia: 'Anthropic',
    masuk: 5.00, keluar: 25.00, cacheBaca: 0.50, konteks: 1_000_000,
    sumber: 'https://www.anthropic.com/pricing', diperiksa: '2026-06-24',
  },
  {
    id: 'claude-sonnet-5', nama: 'Claude Sonnet 5', penyedia: 'Anthropic',
    masuk: 2.00, keluar: 10.00, cacheBaca: 0.20, konteks: 1_000_000,
    sumber: 'https://www.anthropic.com/pricing', diperiksa: '2026-06-24',
  },
  {
    id: 'claude-haiku-4-5', nama: 'Claude Haiku 4.5', penyedia: 'Anthropic',
    masuk: 1.00, keluar: 5.00, cacheBaca: 0.10, konteks: 200_000,
    sumber: 'https://www.anthropic.com/pricing', diperiksa: '2026-06-24',
  },
  {
    id: 'claude-fable-5-1', nama: 'Claude Fable 5.1', penyedia: 'Anthropic',
    masuk: 10.00, keluar: 50.00, cacheBaca: 0.25, konteks: 1_000_000,
    sumber: 'https://www.anthropic.com/pricing', diperiksa: '2026-06-24',
  },
  {
    id: 'claude-opus-4-8', nama: 'Claude Opus 4.8', penyedia: 'Anthropic',
    masuk: 5.00, keluar: 25.00, cacheBaca: 0.50, konteks: 1_000_000,
    sumber: 'https://www.anthropic.com/pricing', diperiksa: '2026-06-24',
  },
]);

/**
 * Baris kosong untuk model penyedia lain.
 *
 * Sengaja TIDAK diisi angka: harga OpenAI, Google, dan penyedia lain berubah
 * sering, dan menaruh angka hafalan di sini justru berbahaya — orang akan
 * mengambil keputusan bisnis dari angka yang salah. Isi lewat kotak "model
 * sendiri" di halaman, atau kirim pull request beserta tautan halaman harganya.
 */
export const PENYEDIA_LAIN = Object.freeze([
  { penyedia: 'OpenAI', sumber: 'https://openai.com/api/pricing/' },
  { penyedia: 'Google Gemini', sumber: 'https://ai.google.dev/pricing' },
  { penyedia: 'DeepSeek', sumber: 'https://api-docs.deepseek.com/quick_start/pricing' },
  { penyedia: 'Groq', sumber: 'https://groq.com/pricing/' },
  { penyedia: 'OpenRouter', sumber: 'https://openrouter.ai/models' },
]);

/**
 * Sewa GPU per jam, dolar AS. Dipakai membandingkan sewa API vs self-host.
 * Sama seperti harga model: wajib bersumber dan bertanggal.
 */
export const GPU = Object.freeze([
  {
    id: 'a100-80', nama: 'NVIDIA A100 80GB', perJam: 1.29,
    sumber: 'https://lambda.ai/service/gpu-cloud', diperiksa: '2026-09-07',
  },
  {
    id: 'h100', nama: 'NVIDIA H100 80GB', perJam: 2.49,
    sumber: 'https://lambda.ai/service/gpu-cloud', diperiksa: '2026-09-07',
  },
  {
    id: 'l4', nama: 'NVIDIA L4 24GB', perJam: 0.43,
    sumber: 'https://lambda.ai/service/gpu-cloud', diperiksa: '2026-09-07',
  },
]);

/** Cari model berdasarkan id. Balikkan null kalau tidak ada. */
export function cariModel(id) {
  return MODEL.find((m) => m.id === id) ?? null;
}

/** Umur sebuah baris harga dalam hari, relatif terhadap tanggal acuan. */
export function umurHari(baris, sekarangISO) {
  const a = Date.parse(baris.diperiksa);
  const b = Date.parse(sekarangISO);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.floor((b - a) / 86400000);
}

/** Baris harga yang sudah lewat masa segarnya dan perlu dicek ulang. */
export function harusDicekUlang(sekarangISO, masaHari = MASA_SEGAR_HARI) {
  const semua = [...MODEL, ...GPU, { id: 'kurs', ...KURS_BAWAAN }];
  return semua.filter((b) => {
    const u = umurHari(b, sekarangISO);
    return u === null || u > masaHari;
  }).map((b) => ({ id: b.id, diperiksa: b.diperiksa, umur: umurHari(b, sekarangISO) }));
}
