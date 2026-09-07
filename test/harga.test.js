import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODEL, GPU, PENYEDIA_LAIN, KURS_BAWAAN, MASA_SEGAR_HARI,
  cariModel, umurHari, harusDicekUlang,
} from '../src/harga.js';

const SEMUA_BARIS = [...MODEL, ...GPU];

test('setiap baris harga menyebut sumber resminya', () => {
  for (const b of [...SEMUA_BARIS, KURS_BAWAAN]) {
    assert.ok(b.sumber || b.catatan, `baris ${b.id ?? 'kurs'} tanpa sumber`);
  }
  for (const b of SEMUA_BARIS) {
    assert.match(b.sumber, /^https:\/\//, `${b.id}: sumber bukan URL https`);
  }
});

test('setiap baris harga menyebut kapan terakhir dicocokkan', () => {
  for (const b of [...SEMUA_BARIS, KURS_BAWAAN]) {
    assert.match(b.diperiksa, /^\d{4}-\d{2}-\d{2}$/, `${b.id ?? 'kurs'}: tanggal tidak sah`);
    assert.ok(!Number.isNaN(Date.parse(b.diperiksa)), `${b.id ?? 'kurs'}: tanggal tidak bisa diurai`);
  }
});

test('tidak ada id model yang kembar', () => {
  const id = MODEL.map((m) => m.id);
  assert.equal(new Set(id).size, id.length);
});

test('harga keluaran selalu lebih mahal daripada harga masukan', () => {
  for (const m of MODEL) {
    assert.ok(m.keluar > m.masuk, `${m.id}: keluar (${m.keluar}) tidak lebih mahal dari masuk (${m.masuk})`);
  }
});

test('harga baca cache selalu lebih murah daripada harga masukan biasa', () => {
  for (const m of MODEL) {
    if (m.cacheBaca === null) continue;
    assert.ok(m.cacheBaca < m.masuk, `${m.id}: cache tidak lebih murah`);
  }
});

test('setiap model punya angka harga yang masuk akal', () => {
  for (const m of MODEL) {
    for (const [k, v] of Object.entries({ masuk: m.masuk, keluar: m.keluar })) {
      assert.ok(Number.isFinite(v) && v > 0, `${m.id}.${k} bukan angka positif`);
      assert.ok(v < 1000, `${m.id}.${k} = ${v} tidak masuk akal per juta token`);
    }
    assert.ok(Number.isInteger(m.konteks) && m.konteks >= 1000, `${m.id}: konteks tidak masuk akal`);
    assert.ok(m.nama.length > 0 && m.penyedia.length > 0);
  }
});

test('penyedia lain sengaja dibiarkan tanpa angka, hanya tautan sumber', () => {
  for (const p of PENYEDIA_LAIN) {
    assert.match(p.sumber, /^https:\/\//);
    assert.equal(p.masuk, undefined, `${p.penyedia}: angka hafalan tidak boleh masuk tabel`);
    assert.equal(p.keluar, undefined);
  }
});

test('setiap sewa GPU punya tarif per jam yang masuk akal', () => {
  for (const g of GPU) {
    assert.ok(g.perJam > 0 && g.perJam < 100, `${g.id}: tarif ${g.perJam}/jam tidak masuk akal`);
  }
});

test('kurs bawaan berada di kisaran yang wajar untuk rupiah', () => {
  assert.ok(KURS_BAWAAN.idrPerUsd > 5000 && KURS_BAWAAN.idrPerUsd < 50000);
});

test('kurs bawaan mengaku dirinya perkiraan, bukan kurs pasar', () => {
  assert.match(KURS_BAWAAN.catatan, /ganti|perkiraan/i);
});

test('cariModel menemukan yang ada dan mengembalikan null untuk yang tidak ada', () => {
  assert.equal(cariModel(MODEL[0].id)?.id, MODEL[0].id);
  assert.equal(cariModel('model-yang-tidak-ada'), null);
  assert.equal(cariModel(''), null);
  assert.equal(cariModel(undefined), null);
});

test('umurHari menghitung selisih hari dan menolak tanggal rusak', () => {
  assert.equal(umurHari({ diperiksa: '2026-01-01' }, '2026-01-31'), 30);
  assert.equal(umurHari({ diperiksa: 'ngawur' }, '2026-01-31'), null);
  assert.equal(umurHari({ diperiksa: '2026-01-01' }, ''), null);
});

test('harusDicekUlang mendaftar baris yang sudah lewat masa segarnya', () => {
  const jauh = harusDicekUlang('2030-01-01');
  assert.equal(jauh.length, MODEL.length + GPU.length + 1, 'semua baris seharusnya kedaluwarsa di 2030');

  const tepatSetelahDiperiksa = harusDicekUlang(MODEL[0].diperiksa, MASA_SEGAR_HARI);
  assert.ok(!tepatSetelahDiperiksa.some((b) => b.id === MODEL[0].id),
    'baris yang baru diperiksa tidak boleh dianggap basi');
});

test('masa segar cukup pendek untuk menangkap perubahan harga yang lazim', () => {
  assert.ok(MASA_SEGAR_HARI <= 180, 'harga model berubah beberapa kali setahun');
  assert.ok(MASA_SEGAR_HARI >= 30, 'terlalu pendek akan menandai semuanya terus-menerus');
});

test('tabel harga dibekukan supaya tidak bisa diubah diam-diam saat runtime', () => {
  assert.ok(Object.isFrozen(MODEL));
  assert.ok(Object.isFrozen(GPU));
  assert.ok(Object.isFrozen(PENYEDIA_LAIN));
  assert.ok(Object.isFrozen(KURS_BAWAAN));
});
