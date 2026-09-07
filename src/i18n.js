/** Kamus dwibahasa token-rupiah. Kelengkapannya dijaga test/ui.test.js. */

export const BAHASA = Object.freeze(['id', 'en']);

export const KAMUS = Object.freeze({
  id: Object.freeze({
    'html.lang': 'id',
    'meta.judul': 'Token Rupiah',
    'meta.deskripsi': 'Kalkulator biaya token LLM dalam Rupiah plus simulasi kelayakan produk AI: margin, titik impas, dan kejutan tagihan bulan buruk.',
    'nav.lain': 'English',
    'nav.lainHref': 'en/',

    'kepala.eyebrow': 'Biaya token · margin · titik impas · Monte Carlo',
    'kepala.judul1': 'Token',
    'kepala.judul2': 'Rupiah',
    'kepala.lede': 'Delapan puluh delapan produk AI di showcase komunitas membakar token setiap hari, dan tidak satu pun tahu biaya per penggunanya. Isi angkamu di sebelah kiri; setiap perubahan langsung menghitung ulang seluruh papan. Semuanya jalan di perangkatmu — tidak ada yang dikirim ke mana pun.',

    'bag.masukan': 'Angkamu',
    'bag.hasil': 'Papan',
    'bag.harga': 'Tabel harga',
    'bag.catatan': 'Yang perlu kamu tahu sebelum memakai angka ini',

    'grup.model': 'Model & harga',
    'grup.permintaan': 'Satu permintaan',
    'grup.skala': 'Skala bulanan',
    'grup.bisnis': 'Sisi bisnis',
    'grup.simulasi': 'Simulasi pemakaian',

    'in.model': 'Model',
    'in.modelSendiri': 'Isi harga sendiri',
    'in.hargaMasuk': 'Harga masukan (USD / 1 juta token)',
    'in.hargaKeluar': 'Harga keluaran (USD / 1 juta token)',
    'in.hargaCache': 'Harga baca cache (USD / 1 juta token)',
    'in.kurs': 'Kurs (Rupiah per dolar)',
    'in.tokenMasuk': 'Token masukan per permintaan',
    'in.tokenKeluar': 'Token keluaran per permintaan',
    'in.tokenCache': 'Token dari cache per permintaan',
    'in.pengguna': 'Jumlah pengguna berbayar',
    'in.permintaanPerPengguna': 'Permintaan per pengguna per bulan',
    'in.biayaTetap': 'Biaya tetap bulanan (server, domain, dll.)',
    'in.hargaLangganan': 'Harga langganan per pengguna per bulan',
    'in.kas': 'Uang di tangan',
    'in.sebaran': 'Ketimpangan pemakaian (0 rata, 1,5 sangat timpang)',
    'in.tempelTeks': 'Perkirakan token dari contoh teks',
    'in.tempelTeksPetunjuk': 'Tempel satu contoh prompt di sini untuk mengisi kolom token masukan.',
    'in.pakaiPerkiraan': 'Pakai perkiraannya',
    'in.setelUlang': 'Kembalikan ke bawaan',

    'out.perPermintaan': 'Biaya satu permintaan',
    'out.per1000': 'Per 1.000 permintaan',
    'out.perPengguna': 'Biaya token per pengguna per bulan',
    'out.tagihanBulanan': 'Tagihan bulan biasa',
    'out.margin': 'Margin per pengguna',
    'out.impas': 'Pengguna untuk balik modal',
    'out.laba': 'Laba bulanan',
    'out.runway': 'Uang bertahan',
    'out.bulan': 'bulan',
    'out.pengguna': 'pengguna',
    'out.hargaMinimum': 'Harga minimum agar tidak rugi per pengguna',
    'out.margin70': 'Harga untuk margin 70%',
    'out.margin80': 'Harga untuk margin 80%',
    'out.p50': 'Bulan biasa (p50)',
    'out.p90': 'Bulan sibuk (p90)',
    'out.p99': 'Bulan terburuk (p99)',
    'out.kejutan': 'Bulan sibuk semahal',
    'out.kaliLipat': '× bulan biasa',
    'out.takAdaImpas': 'tidak pernah',
    'out.takAdaRunway': 'sudah untung',

    'vonis.sehat': 'Tiap pengguna baru menambah untung.',
    'vonis.rugi': 'Tiap pengguna baru menambah rugi. Naikkan harga, tekan pemakaian, atau turunkan kelas model — menambah pengguna hanya memperbesar lubangnya.',
    'vonis.tipis': 'Marginnya tipis. Satu bulan sibuk bisa membalik untung jadi rugi.',

    'harga.kolomModel': 'Model',
    'harga.kolomMasuk': 'Masuk',
    'harga.kolomKeluar': 'Keluar',
    'harga.kolomCache': 'Cache',
    'harga.kolomKonteks': 'Konteks',
    'harga.kolomDiperiksa': 'Dicek',
    'harga.satuan': 'USD per 1 juta token',
    'harga.basi': 'perlu dicek ulang',
    'harga.lain': 'Penyedia lain sengaja tidak diberi angka di sini — harga mereka berubah beberapa kali setahun dan angka hafalan lebih berbahaya daripada kolom kosong. Buka halaman harganya, lalu isi lewat “Isi harga sendiri”.',

    'catatan.token': 'Perkiraan token dari panjang teks hanya kira-kira. Tiap penyedia memakai tokenizer berbeda, dan Bahasa Indonesia lebih boros token daripada Inggris karena imbuhannya sering dipecah. Untuk angka pasti, pakai penghitung token resmi penyedianya — Anthropic menyediakan POST /v1/messages/count_tokens.',
    'catatan.harga': 'Tabel harga di halaman ini bertanggal. Kalau tanggalnya sudah lama, cek langsung ke halaman harga resminya sebelum mengambil keputusan bisnis.',
    'catatan.rerata': 'Jangan pakai rata-rata sebagai dasar anggaran. Pemakaian pengguna nyata timpang: sebagian besar memakai sedikit, segelintir memakai sangat banyak. Angka yang perlu kamu siapkan adalah p90, bukan rata-rata.',
    'catatan.selfhost': 'Perbandingan self-host hanya menghitung sewa GPU-nya. Waktu orang yang mengurusnya, jam menganggur, percobaan yang gagal, dan biaya pindah tidak masuk hitungan — dan biasanya justru itu yang paling mahal.',

    'privasi.judul': 'Privasi',
    'privasi.kontak': 'Kirim surel',
    'privasi.isi': 'Halaman ini tidak mengumpulkan apa pun. Tidak ada server yang menerima datamu, tidak ada analitik, tidak ada cookie, dan tidak ada satu pun permintaan jaringan keluar — font pun di-host di repo ini sendiri, bukan diambil dari server pihak ketiga. Semua yang kamu ketik tetap di perambanmu dan hilang saat tabnya ditutup. Karena tidak ada yang disimpan, tidak ada masa retensi dan tidak ada yang bisa diminta hapus. Kalau ada yang perlu ditanyakan atau diperbaiki, hubungi lewat tautan di bawah atau buka issue di repo.',
    'kaki.sumber': 'Kode sumber, tabel harga bertanggal, dan seluruh ujinya ada di repo. Nol dependensi, nol permintaan jaringan keluar, nol analitik.',
  }),

  en: Object.freeze({
    'html.lang': 'en',
    'meta.judul': 'Token Rupiah',
    'meta.deskripsi': 'An LLM token cost calculator in Indonesian Rupiah, plus a viability model for AI products: margin, break-even, and how bad a heavy month gets.',
    'nav.lain': 'Bahasa Indonesia',
    'nav.lainHref': '../',

    'kepala.eyebrow': 'Token cost · margin · break-even · Monte Carlo',
    'kepala.judul1': 'Token',
    'kepala.judul2': 'Rupiah',
    'kepala.lede': 'Eighty-eight AI products in the community showcase burn tokens every day, and not one knows its cost per user. Put your own numbers on the left; every change recomputes the whole board. It all runs on your device — nothing is sent anywhere.',

    'bag.masukan': 'Your numbers',
    'bag.hasil': 'The board',
    'bag.harga': 'Price table',
    'bag.catatan': 'What to know before trusting these numbers',

    'grup.model': 'Model & pricing',
    'grup.permintaan': 'One request',
    'grup.skala': 'Monthly scale',
    'grup.bisnis': 'The business side',
    'grup.simulasi': 'Usage simulation',

    'in.model': 'Model',
    'in.modelSendiri': 'Enter my own prices',
    'in.hargaMasuk': 'Input price (USD / 1M tokens)',
    'in.hargaKeluar': 'Output price (USD / 1M tokens)',
    'in.hargaCache': 'Cache read price (USD / 1M tokens)',
    'in.kurs': 'Exchange rate (Rupiah per dollar)',
    'in.tokenMasuk': 'Input tokens per request',
    'in.tokenKeluar': 'Output tokens per request',
    'in.tokenCache': 'Cached tokens per request',
    'in.pengguna': 'Paying users',
    'in.permintaanPerPengguna': 'Requests per user per month',
    'in.biayaTetap': 'Fixed monthly cost (servers, domain, etc.)',
    'in.hargaLangganan': 'Subscription price per user per month',
    'in.kas': 'Cash on hand',
    'in.sebaran': 'Usage skew (0 even, 1.5 very skewed)',
    'in.tempelTeks': 'Estimate tokens from a sample',
    'in.tempelTeksPetunjuk': 'Paste one real prompt here to fill in the input-token field.',
    'in.pakaiPerkiraan': 'Use this estimate',
    'in.setelUlang': 'Reset to defaults',

    'out.perPermintaan': 'Cost of one request',
    'out.per1000': 'Per 1,000 requests',
    'out.perPengguna': 'Token cost per user per month',
    'out.tagihanBulanan': 'Bill in a normal month',
    'out.margin': 'Margin per user',
    'out.impas': 'Users to break even',
    'out.laba': 'Monthly profit',
    'out.runway': 'Runway',
    'out.bulan': 'months',
    'out.pengguna': 'users',
    'out.hargaMinimum': 'Minimum price to stop losing money per user',
    'out.margin70': 'Price for a 70% margin',
    'out.margin80': 'Price for an 80% margin',
    'out.p50': 'Normal month (p50)',
    'out.p90': 'Heavy month (p90)',
    'out.p99': 'Worst month (p99)',
    'out.kejutan': 'A heavy month costs',
    'out.kaliLipat': '× a normal month',
    'out.takAdaImpas': 'never',
    'out.takAdaRunway': 'already profitable',

    'vonis.sehat': 'Every new user adds profit.',
    'vonis.rugi': 'Every new user adds loss. Raise the price, cut usage, or drop to a cheaper model — adding users only digs the hole deeper.',
    'vonis.tipis': 'The margin is thin. One heavy month can flip profit into loss.',

    'harga.kolomModel': 'Model',
    'harga.kolomMasuk': 'Input',
    'harga.kolomKeluar': 'Output',
    'harga.kolomCache': 'Cache',
    'harga.kolomKonteks': 'Context',
    'harga.kolomDiperiksa': 'Checked',
    'harga.satuan': 'USD per 1M tokens',
    'harga.basi': 'needs re-checking',
    'harga.lain': 'Other providers are deliberately left blank here — their prices change several times a year, and a remembered number is more dangerous than an empty column. Open their pricing page, then fill it in under “Enter my own prices”.',

    'catatan.token': 'Estimating tokens from text length is only approximate. Each provider uses a different tokenizer, and Indonesian is more token-hungry than English because its affixes are often split apart. For exact numbers, use the provider’s own token counter — Anthropic offers POST /v1/messages/count_tokens.',
    'catatan.harga': 'The price table on this page is dated. If the date looks old, check the official pricing page before making a business decision on it.',
    'catatan.rerata': 'Do not budget on the average. Real usage is skewed: most people use a little, a handful use a great deal. The number to prepare for is p90, not the mean.',
    'catatan.selfhost': 'The self-host comparison only counts GPU rental. The people-hours to run it, idle time, failed experiments, and migration cost are all excluded — and they are usually the expensive part.',

    'privasi.judul': 'Privacy',
    'privasi.kontak': 'Send an email',
    'privasi.isi': 'This page collects nothing. No server receives your data, no analytics, no cookies, and not a single outbound network request — even the fonts are hosted in this repository rather than fetched from a third party. Everything you type stays in your browser and is gone when the tab closes. Because nothing is stored, there is no retention period and nothing to request deletion of. If something needs asking or fixing, use the link below or open an issue on the repo.',
    'kaki.sumber': 'The source, the dated price table, and every test live in the repo. No dependencies, no outbound requests, no analytics.',
  }),
});

export function t(bahasa, kunci, isi = {}) {
  const kamus = KAMUS[bahasa];
  if (!kamus) throw new RangeError(`bahasa tak dikenal: ${bahasa}`);
  const nilai = kamus[kunci];
  if (nilai === undefined) throw new RangeError(`kunci hilang di "${bahasa}": ${kunci}`);
  return nilai.replace(/\{(\w+)\}/g, (cocok, nama) => {
    if (!(nama in isi)) throw new RangeError(`placeholder {${nama}} tidak diisi untuk kunci ${kunci}`);
    return String(isi[nama]);
  });
}

export function placeholder(teks) {
  return [...String(teks).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}
