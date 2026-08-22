#!/usr/bin/env node
/**
 * append-krx-daily-history.mjs — KRX 하루치 «집계 한 줄»을 커밋되는 시계열에 쌓는다.
 *   왜: archive/raw/krx 는 git 미추적 → 서버 이동 때 사라진다. 매일수집만으로는
 *       시계열이 안 쌓인다. 여기서 그날의 «비율·집계»만(수십 개 숫자) 뽑아
 *       src/data/krx-daily-history.json(커밋)에 날짜로 idempotent 하게 넣는다.
 *   비율만 저장 — 시세 스케일 무관, 검증가능. 나중 8/19 시계열 코멘트(전일/전주)의 재료.
 * 쓰기: node scripts/append-krx-daily-history.mjs   (수집 직후 실행)
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const KRX = path.join(ROOT, 'archive/raw/krx');
const HIST = path.join(ROOT, 'src/data/krx-daily-history.json');

// ⚠ archive 없음 = 「못 쟀다」(서버 이동 때 정상). 「깨졌다」와 가른다 — 기존 시계열은 건드리지 않는다.
if (!fs.existsSync(KRX)) { console.log('⚠ 못 쟀다 — archive/raw/krx 없음(서버 이동 때 정상). 시계열 그대로 둔다.'); process.exit(0); }
const files = fs.readdirSync(KRX).filter((f) => f.endsWith('.json'));
if (!files.length) { console.log('⚠ 못 쟀다 — KRX json 없음. 시계열 그대로 둔다.'); process.exit(0); }
const dd = files.map((f) => f.match(/-(\d{8})\.json$/)?.[1]).filter(Boolean).sort().pop();
if (!dd) { console.log('⚠ 못 쟀다 — 날짜 붙은 KRX json 없음.'); process.exit(0); }

let all = [];
for (const f of files.filter((f) => f.includes(dd))) { const { rows } = JSON.parse(fs.readFileSync(path.join(KRX, f), 'utf8')); for (const r of rows) all.push({ cap: +r.MKTCAP, val: +r.ACC_TRDVAL, mkt: r.MKT_NM }); }
if (all.length < 100) { console.log(`⚠ 깨졌다? — ${dd} 행이 ${all.length}개뿐(정상은 수천). 시계열에 안 넣는다.`); process.exit(1); }

const totCap = all.reduce((s, x) => s + x.cap, 0), totVal = all.reduce((s, x) => s + x.val, 0);
const p = (v, t) => +(v / t * 100).toFixed(2);
const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
const kospi = all.filter((x) => x.mkt === 'KOSPI'), kosdaq = all.filter((x) => x.mkt === 'KOSDAQ');
const byCap = [...all].sort((a, b) => b.cap - a.cap), byVal = [...all].sort((a, b) => b.val - a.val);
const capTop = (n) => p(byCap.slice(0, n).reduce((s, x) => s + x.cap, 0), totCap);
const valTop = (n) => p(byVal.slice(0, n).reduce((s, x) => s + x.val, 0), totVal);
// Gini(집중도 지수 본체) — 비율/스케일 불변. 0=고름, 1=한 곳에 몰림.
const gini = (a2) => { const x = a2.filter((v) => v > 0).sort((m, n) => m - n); const n = x.length; if (!n) return null; let cum = 0, s = 0; for (let i = 0; i < n; i++) { cum += x[i]; s += cum; } return +((n + 1 - 2 * (s / cum)) / n).toFixed(4); };

const row = {
  date: `${dd.slice(0, 4)}-${dd.slice(4, 6)}-${dd.slice(6, 8)}`,
  issues: all.length, zeroTrade: all.filter((x) => x.val === 0).length,
  giniCap: gini(all.map((x) => x.cap)), giniTurnover: gini(all.map((x) => x.val)),
  kospiCapPct: p(sum(kospi, 'cap'), totCap), kosdaqCapPct: p(sum(kosdaq, 'cap'), totCap),
  kospiValPct: p(sum(kospi, 'val'), totVal), kosdaqValPct: p(sum(kosdaq, 'val'), totVal),
  kospiVel: +(sum(kospi, 'val') / sum(kospi, 'cap') * 1000).toFixed(2),
  kosdaqVel: +(sum(kosdaq, 'val') / sum(kosdaq, 'cap') * 1000).toFixed(2),
  capTop1: capTop(1), capTop5: capTop(5), capTop10: capTop(10),
  valTop1: valTop(1), valTop5: valTop(5), valTop10: valTop(10),
};

let hist = { _왜: 'KRX 하루치 집계(비율만). archive 는 미추적이라 여기 커밋본으로 시계열을 쌓는다.', days: [] };
if (fs.existsSync(HIST)) { try { hist = JSON.parse(fs.readFileSync(HIST, 'utf8')); } catch { /* 깨진 파일이면 새로 시작하지 않고 멈춘다 */ console.log('⚠ 깨졌다 — 기존 시계열 파일이 JSON 아님. 손대지 않는다.'); process.exit(1); } }
hist.days = (hist.days || []).filter((d) => d.date !== row.date); // idempotent — 같은 날 덮어씀
hist.days.push(row);
hist.days.sort((a, b) => a.date.localeCompare(b.date));
hist.asOf = row.date; hist.count = hist.days.length;
fs.writeFileSync(HIST, JSON.stringify(hist, null, 1));
console.log(`✅ 시계열에 ${row.date} 넣음 — 총 ${hist.days.length}일 · KOSDAQ 거래${row.kosdaqValPct}%(시총${row.kosdaqCapPct}%) 회전율 K${row.kospiVel}/Q${row.kosdaqVel}`);
