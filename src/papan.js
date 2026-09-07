/**
 * Perakit papan hasil. Murni dan tanpa DOM: masuk hasil skenario + kamus,
 * keluar string HTML. Seluruh isinya bisa diuji di Node.
 */
import { rupiah, rupiahHalus, dolar } from './hitung.js';

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Ambang margin di bawah ini dianggap tipis dan diberi peringatan. */
export const MARGIN_TIPIS_PERSEN = 40;

export function vonis(bisnis) {
  if (!bisnis.sehat) return 'rugi';
  if (bisnis.marginPersen !== null && bisnis.marginPersen < MARGIN_TIPIS_PERSEN) return 'tipis';
  return 'sehat';
}

function ubin(label, nilai, { nada = '', ket = '' } = {}) {
  return `<div class="ubin ${esc(nada)}">`
    + `<span class="ubin-l">${esc(label)}</span>`
    + `<b class="ubin-n">${esc(nilai)}</b>`
    + (ket ? `<small class="ubin-k">${esc(ket)}</small>` : '')
    + '</div>';
}

/**
 * Batang perbandingan tagihan p50 / p90 / p99.
 * Skalanya dipatok ke p99 supaya ketiga batang bisa dibandingkan langsung.
 */
export function batangTagihan(sim, K) {
  const maks = Math.max(sim.p99, 1);
  const baris = [
    ['p50', K['out.p50'], sim.p50, 'b-biasa'],
    ['p90', K['out.p90'], sim.p90, 'b-sibuk'],
    ['p99', K['out.p99'], sim.p99, 'b-buruk'],
  ];
  const lebar = 560, tinggiBaris = 38, atas = 8;
  const kiri = 150, kanan = 118;
  const tinggi = atas + baris.length * tinggiBaris;

  const p = [`<svg viewBox="0 0 ${lebar} ${tinggi}" class="grafik" role="img" `
    + `aria-label="${esc(K['out.tagihanBulanan'])}">`];
  baris.forEach(([, label, nilai, kelas], i) => {
    const y = atas + i * tinggiBaris;
    const w = Math.max(2, ((lebar - kiri - kanan) * nilai) / maks);
    p.push(`<text x="${kiri - 10}" y="${y + 19}" class="g-lbl" text-anchor="end">${esc(label)}</text>`);
    p.push(`<rect x="${kiri}" y="${y + 4}" width="${w.toFixed(1)}" height="22" rx="2" class="g-bar ${esc(kelas)}"/>`);
    p.push(`<text x="${(kiri + w + 8).toFixed(1)}" y="${y + 19}" class="g-num">${esc(rupiah(nilai))}</text>`);
  });
  p.push('</svg>');
  return p.join('');
}

export function papan(s, K) {
  const v = vonis(s.bisnis);
  const nadaLaba = s.bisnis.labaIdr >= 0 ? 'baik' : 'buruk';

  const barisSatu = [
    ubin(K['out.perPermintaan'], rupiahHalus(s.permintaan.idr), { ket: dolar(s.permintaan.usd) }),
    ubin(K['out.per1000'], rupiah(s.per1000Idr)),
    ubin(K['out.perPengguna'], rupiah(s.variabelPerPenggunaIdr)),
    ubin(K['out.tagihanBulanan'], rupiah(s.bulanan.totalIdr)),
  ].join('');

  const barisDua = [
    ubin(K['out.margin'], rupiah(s.bisnis.marginSatuanIdr), {
      nada: s.bisnis.sehat ? 'baik' : 'buruk',
      ket: s.bisnis.marginPersen === null ? '' : `${s.bisnis.marginPersen.toFixed(0)}%`,
    }),
    ubin(K['out.impas'],
      s.bisnis.impasPengguna === null ? K['out.takAdaImpas'] : `${s.bisnis.impasPengguna}`,
      { nada: s.bisnis.impasPengguna === null ? 'buruk' : '',
        ket: s.bisnis.impasPengguna === null ? '' : K['out.pengguna'] }),
    ubin(K['out.laba'], rupiah(s.bisnis.labaIdr), { nada: nadaLaba }),
    ubin(K['out.runway'],
      s.bisnis.runwayBulan === null ? K['out.takAdaRunway'] : s.bisnis.runwayBulan.toFixed(1),
      { ket: s.bisnis.runwayBulan === null ? '' : K['out.bulan'] }),
  ].join('');

  const saran = [
    ubin(K['out.hargaMinimum'], rupiah(s.bisnis.hargaMinimumIdr)),
    ubin(K['out.margin70'], rupiah(s.hargaMargin70Idr)),
    ubin(K['out.margin80'], rupiah(s.hargaMargin80Idr)),
    ubin(K['out.kejutan'],
      s.kejutanP90 === null ? '—' : s.kejutanP90.toFixed(2),
      { ket: K['out.kaliLipat'], nada: (s.kejutanP90 ?? 0) >= 2 ? 'buruk' : '' }),
  ].join('');

  return `<p class="vonis v-${esc(v)}">${esc(K['vonis.' + v])}</p>
    <div class="ubin-baris">${barisSatu}</div>
    <div class="ubin-baris">${barisDua}</div>
    ${batangTagihan(s.simulasi, K)}
    <div class="ubin-baris">${saran}</div>`;
}
