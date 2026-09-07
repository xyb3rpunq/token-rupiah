# token-rupiah

**Kalkulator biaya token LLM dalam Rupiah, plus simulasi kelayakan produk AI.**
Berapa biaya satu permintaan, berapa per pengguna per bulan, berapa margin sebenarnya,
berapa pengguna sampai balik modal, dan seberapa mahal bulan sibuk dibanding bulan biasa.
Statis, dwibahasa ID/EN, nol dependensi, tidak ada satu pun permintaan jaringan keluar.

[![AIClub.id Builder](https://aiclub.id/badge/s00_01M1S5MN7EQ6R3FFYPN965MKRW.svg?style=verified&theme=dark)](https://aiclub.id/builder/s00_01M1S5MN7EQ6R3FFYPN965MKRW)

🔗 **Live:** https://xyb3rpunq.github.io/token-rupiah/ · [English](https://xyb3rpunq.github.io/token-rupiah/en/)

---

## Kenapa ini ada

Di showcase [aiclub.id](https://aiclub.id) ada **88 karya berkategori SaaS dan Tools**
yang semuanya membakar token, dan tidak satu pun tahu biaya per penggunanya. Kopdar
Makassar #4 judulnya harfiah "Strategi Go-To-Market Produk AI" dan dijual Rp99.000 —
audiensnya sudah berkumpul, pertanyaannya sudah jelas, alatnya belum ada.

## Tiga hal yang paling sering salah dihitung

1. **Menganggarkan dari rata-rata.** Pemakaian pengguna nyata timpang: sebagian besar
   memakai sedikit, segelintir memakai sangat banyak. Alat ini menjalankan Monte Carlo
   lognormal dan menampilkan **p50, p90, p99** berdampingan — angka yang perlu kamu
   siapkan adalah p90, bukan reratanya.
2. **Lupa margin per pengguna bisa negatif.** Kalau biaya token per pengguna melebihi
   harga langganan, setiap pengguna baru memperbesar rugi. Papan ini menolak menampilkan
   titik impas kalau titik impasnya memang tidak ada, dan mengatakannya terang-terangan.
3. **Menghitung self-host cuma dari sewa GPU.** Perbandingannya disediakan, tapi
   catatannya jelas: waktu orang, jam menganggur, dan percobaan gagal tidak masuk hitungan —
   dan biasanya justru itu yang paling mahal.

## Yang dihitung

| Bagian | Isi |
|---|---|
| Satu permintaan | biaya masukan + keluaran + baca cache, dalam USD dan Rupiah |
| Skala bulanan | total tagihan, biaya per pengguna, permintaan per bulan |
| Sisi bisnis | margin per pengguna, margin %, titik impas, laba, runway |
| Penetapan harga | harga minimum agar tidak rugi, harga untuk margin 70% dan 80% |
| Simulasi | p50 / p90 / p99 tagihan, dan berapa kali lipat bulan sibuk dari bulan biasa |
| Self-host | jam sewa GPU yang setara, dan mana yang lebih murah |

## Tabel harga yang bertanggal, bukan angka hafalan

Setiap baris di `src/harga.js` **wajib** menyebut `sumber` (URL halaman harga resmi)
dan `diperiksa` (tanggal angka itu dicocokkan). Uji menolak baris yang tidak punya
keduanya, dan halaman menandai merah baris yang sudah lewat 120 hari.

Penyedia selain Anthropic sengaja **dibiarkan kosong**, hanya diberi tautan ke halaman
harganya. Alasannya sederhana: harga model berubah beberapa kali setahun, dan angka
hafalan yang salah lebih berbahaya daripada kolom kosong — orang mengambil keputusan
bisnis dari angka itu. Isi lewat "Isi harga sendiri", atau kirim pull request beserta
tautannya.

## Perkiraan token itu perkiraan

Alat ini menaksir token dari panjang teks (Indonesia ≈ 3,4 karakter/token, Inggris ≈ 4,0)
karena tiap penyedia memakai tokenizer berbeda dan Bahasa Indonesia lebih boros token
karena imbuhannya sering dipecah. Untuk angka pasti, pakai penghitung resmi penyedianya —
Anthropic menyediakan `POST /v1/messages/count_tokens`. Ada kolom kalibrasi supaya kamu
bisa mencocokkannya sekali lalu memakai faktor itu seterusnya.

## Struktur

```
token-rupiah/
├── src/
│   ├── hitung.js    seluruh matematika — murni, tanpa I/O, tanpa jam sistem
│   ├── harga.js     tabel harga bertanggal + pemeriksa kesegaran
│   ├── papan.js     perakit papan hasil, murni dan tanpa DOM
│   ├── i18n.js      kamus ID/EN
│   ├── render.js    perakit halaman
│   ├── app.js       perekat UI — satu-satunya berkas yang menyentuh DOM
│   └── build.js     rakit docs/
└── test/            111 uji, nol dependensi
```

Monte Carlo-nya memakai pembangkit acak berbenih (mulberry32), jadi hasil yang sama
selalu bisa diulang — simulasi yang berubah tiap kali dijalankan tidak bisa diuji.

Mesin yang jalan di peramban **bukan hasil bundling**: `hitung.js`, `harga.js`, dan
`papan.js` disalin apa adanya ke `docs/mesin/` lalu dimuat sebagai modul ES.

## Menjalankan

```bash
npm test          # 111 uji
npm run build     # rakit docs/
npm run periksa   # uji lalu build
```

## Font di-host sendiri

Halaman ini tidak melakukan **satu pun** permintaan jaringan keluar — termasuk untuk font.
Berkas woff2 subset latin disimpan di repo ini dan dilayani dari domain yang sama.

Itu bukan detail sepele: versi pertama memuat font dari Google Fonts sambil README-nya
mengklaim "nol permintaan jaringan keluar". Klaim itu tidak benar — setiap kunjungan
mengirimkan alamat IP pengunjung ke server pihak ketiga. `pdp-guard` menandainya sendiri
saat dipindai ke situs ini (`transfer-luar-negeri`), dan ada uji yang sekarang menolak
setiap sumber daya dari host luar supaya klaimnya tetap benar.

## Header keamanan di host statis

GitHub Pages tidak bisa menyetel header respons. Content-Security-Policy dan
Referrer-Policy tetap berlaku lewat `<meta>` dan sudah dipasang; Strict-Transport-Security
dan X-Content-Type-Options memang tidak bisa dari sana, dan itu dikatakan apa adanya
alih-alih dipura-purakan.

## Lisensi

[MIT](LICENSE). Harga model milik penyedianya masing-masing; tabel di sini hanya salinan
bertanggal untuk keperluan perhitungan, dan wajib dicek ulang ke sumber resminya.
