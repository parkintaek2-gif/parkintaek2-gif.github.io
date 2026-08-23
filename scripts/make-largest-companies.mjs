#!/usr/bin/env node
/**
 * make-largest-companies.mjs — 「한국에서 제일 큰 상장회사」 — 회사단위(우선주 합산).
 *   왜: 흔한 순위는 «종목» 단위라 삼성전자 우선주가 별도로 잡혀 삼성이 두 번 세어진다.
 *   회사단위로 합치면 순위가 달라진다 — 그 «세는 함정»이 이 지면의 이야기다. 검색어 largest korean companies.
 *   재료: archive/raw/krx 시총(비율만 — sim 스케일 무관·검증가능). 절대 시세는 안 낸다.
 * 출력: public/charts/largest-companies.svg + src/data/largest-companies.json
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const KRX = path.join(ROOT, 'archive/raw/krx');
const CHARTS = path.join(ROOT, 'public/charts');
fs.mkdirSync(CHARTS, { recursive: true });
if (!fs.existsSync(KRX)) { console.log('⚠ 못 쟀다 — archive/raw/krx 없음(서버이동 때 정상). 기존 출력 유지.'); process.exit(0); }
const files = fs.readdirSync(KRX).filter((f) => f.endsWith('.json'));
if (!files.length) { console.log('⚠ 못 쟀다 — KRX json 없음.'); process.exit(0); }
const dd = files.map((f) => f.match(/-(\d{8})\.json$/)?.[1]).filter(Boolean).sort().pop();

const EN = { '삼성전자': 'Samsung Electronics', 'SK하이닉스': 'SK hynix', 'SK스퀘어': 'SK Square', '삼성전기': 'Samsung Electro-Mechanics', '현대차': 'Hyundai Motor', 'LG에너지솔루션': 'LG Energy Solution', '삼성바이오로직스': 'Samsung Biologics', '삼성생명': 'Samsung Life Insurance', '삼성물산': 'Samsung C&T', 'KB금융': 'KB Financial', '한화에어로스페이스': 'Hanwha Aerospace', '기아': 'Kia', 'NAVER': 'NAVER', '셀트리온': 'Celltrion', '현대모비스': 'Hyundai Mobis', 'POSCO홀딩스': 'POSCO Holdings', '신한지주': 'Shinhan Financial' };
const base = (nm) => nm.replace(/우[BC]?$/, '').replace(/\(전환\)$/, '').replace(/[0-9]+우[BC]?$/, '').trim();

let issues = [];
for (const f of files.filter((f) => f.includes(dd))) { const { rows } = JSON.parse(fs.readFileSync(path.join(KRX, f), 'utf8')); for (const r of rows) { const c = +r.MKTCAP; if (c > 0) issues.push({ nm: r.ISU_NM, cap: c, mkt: r.MKT_NM }); } }
const total = issues.reduce((s, x) => s + x.cap, 0);
const co = new Map();
for (const x of issues) { const b = base(x.nm); const e = co.get(b) || { ko: b, cap: 0, mkt: x.mkt }; e.cap += x.cap; co.set(b, e); }
const companies = [...co.values()].sort((a, b) => b.cap - a.cap)
  .map((x) => ({ ko: x.ko, en: EN[x.ko] || x.ko, share: +(x.cap / total * 100).toFixed(1), mkt: x.mkt }));
const top = companies.slice(0, 10);
const issueTop = [...issues].sort((a, b) => b.cap - a.cap).slice(0, 10).map((x) => ({ nm: x.nm, en: EN[base(x.nm)] || x.nm, share: +(x.cap / total * 100).toFixed(1) }));

const INK = '#0f172a', SUB = '#64748b', BG = '#ffffff', ACC = '#1d4ed8';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function bar() {
  const W = 768, H = 430, ML = 200, MR = 56, MT = 52, MB = 30;
  const iw = W - ML - MR, max = top[0].share, step = (H - MT - MB) / top.length, bh = Math.min(26, step * 0.62), scale = iw / max;
  let out = '';
  top.forEach((b2, i) => { const cy = MT + step * i + step / 2, w = b2.share * scale; out += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${bh}" fill="${ACC}" rx="2"/><text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="12.5" fill="${INK}">${i + 1}. ${esc(b2.en)}</text><text x="${(ML + w + 6).toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-size="12" font-weight="700" fill="${ACC}">${b2.share}%</text>`; });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Korea's 10 largest listed companies by share of total market value, preferred shares consolidated">
<rect width="${W}" height="${H}" fill="${BG}"/><text x="20" y="26" font-size="16" font-weight="700" fill="${INK}">Korea's 10 largest listed companies</text>
<text x="20" y="42" font-size="12" fill="${SUB}">Share of total KOSPI+KOSDAQ market value · company level (preferred shares merged) · ${dd}</text>${out}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: Korea Exchange OPEN API</text></svg>`;
}
fs.writeFileSync(path.join(CHARTS, 'largest-companies.svg'), bar());
fs.writeFileSync(path.join(ROOT, 'src/data/largest-companies.json'), JSON.stringify({
  _왜: '한국 최대 상장회사 — 회사단위(우선주 합산). 비율만(sim 스케일 무관). 종목단위와 대조.',
  asOf: dd, companies: companies.length, issues: issues.length,
  top10: top, top2Share: +(top[0].share + top[1].share).toFixed(1),
  issueTop10: issueTop,
}, null, 1));
console.log(`✅ largest-companies · ${dd} · #1 ${top[0].en} ${top[0].share}% · top2 ${(top[0].share + top[1].share).toFixed(1)}% · issue#3=${issueTop[2].nm}`);
