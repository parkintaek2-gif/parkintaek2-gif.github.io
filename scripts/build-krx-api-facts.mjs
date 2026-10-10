#!/usr/bin/env node
/**
 * build-krx-api-facts.mjs — `/data/krx-open-api` 지면이 쓸 **실측 수**를 굳힌다.
 *
 * ── 왜 이 자가 있나 (2026-10-10 · 5번) ────────────────────────────────────
 * 09-30 에 검색 성적을 갈라 보니 이런 말이 나왔다.
 * ```
 *   "ksq_bydd_trd" krx open api   8위
 *   "stk_bydd_trd" krx            9위
 * ```
 * ⭐ **그 낱말이 우리 지면에 한 번도 안 나오는데도 8~9위다.** 그 말로 오는 사람은
 *   구경꾼이 아니라 그 API 를 쓰려는 개발자 — 우리 B2B 손님이다.
 *   09-30 에 「오늘 하는 것 1번」으로 적어 놓고 **열흘을 넘겼다.** 오늘 낸다.
 *
 * ⛔ 숫자를 손으로 적지 않는다. 이 저장소가 한 번 데인 자리다 —
 *   `api.astro` 주석: 「이 페이지에 「66,071건」이 일곱 군데 박혀 있었다 …
 *   하루 만에 문서와 실물이 또 갈라졌다」.
 * ⚠ 그런데 `archive/` 는 .gitignore 라 **빌드 컨테이너에 없다.** 그래서
 *   `research-stats.json` 과 같은 수법을 쓴다 — 수만 담은 작은 파일을 커밋해 둔다.
 *
 * 돌리기:  node scripts/build-krx-api-facts.mjs
 *          node scripts/build-krx-api-facts.mjs --시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 시세방 = path.join(뿌리, 'archive', 'raw', 'stocks');
const 낼곳 = path.join(뿌리, 'src', 'data', 'krx-api-facts.json');

/** ndjson 한 덩이를 세어 본다. ⛔ 깨진 줄 하나가 나머지를 버리게 하지 않는다 */
export function 세기(글) {
  const 시장별 = {};
  let 줄수 = 0;
  let 거래없음 = 0;
  let 깨진줄 = 0;
  let 종가빈칸 = 0;
  const 코드본것 = new Set();
  let 앞에0붙은코드 = 0;

  for (const 줄 of String(글 ?? '').split(/\r?\n/)) {
    const t = 줄.trim();
    if (!t) continue;
    let o = null;
    try { o = JSON.parse(t); } catch { 깨진줄++; continue; }
    줄수++;
    const 시장 = String(o['시장'] ?? '(모름)');
    시장별[시장] = (시장별[시장] ?? 0) + 1;
    if (o['거래없음'] === true) 거래없음++;
    /* ⛔ 「빈칸을 0 으로 읽지 않는다」 — 이 저장소의 대표 함정이다. 실제로 몇 칸인지 센다 */
    const 종가 = o['종가'];
    if (종가 === null || 종가 === undefined || String(종가).trim() === '') 종가빈칸++;
    const 코드 = String(o['코드'] ?? '').trim();
    if (코드) {
      코드본것.add(코드.padStart(6, '0'));
      if (코드.length < 6 || /^0/.test(코드.padStart(6, '0')) === false) { /* 아래에서 따로 센다 */ }
    }
  }
  /* 「900270 처럼 0 이 앞에 붙는 것」 — 숫자로 읽으면 자리가 깎이는 코드를 센다 */
  for (const c of 코드본것) if (c.startsWith('0')) 앞에0붙은코드++;

  return { 줄수, 시장별, 거래없음, 깨진줄, 종가빈칸, 고유종목: 코드본것.size, 앞에0붙은코드 };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--시험')) {
  const 틀렸다 = [];
  const 본다 = (이름, 참인가) => { if (!참인가) 틀렸다.push(이름); };

  const r = 세기([
    JSON.stringify({ 코드: '005930', 이름: '삼성전자', 시장: 'KOSPI', 종가: 71000 }),
    JSON.stringify({ 코드: '900270', 이름: '어떤것', 시장: 'KOSDAQ', 종가: null, 거래없음: true }),
    '{깨진 줄',
    '',
    JSON.stringify({ 코드: '5930', 이름: '0이깎인것', 시장: 'KOSPI', 종가: 100 }),
  ].join('\n'));

  본다('깨진 줄 하나가 나머지를 안 버린다', r.줄수 === 3 && r.깨진줄 === 1);
  본다('시장별로 갈라 센다', r.시장별.KOSPI === 2 && r.시장별.KOSDAQ === 1);
  본다('거래없음을 센다', r.거래없음 === 1);
  본다('⛔ 빈 종가를 0 으로 세지 않고 «빈칸»으로 센다', r.종가빈칸 === 1);
  본다('코드를 6자리로 맞춘 뒤 고유 수를 센다 — 5930 과 005930 은 같다', r.고유종목 === 2);
  본다('0 이 앞에 붙는 코드를 센다', r.앞에0붙은코드 === 1);
  /* ⛔ 잡을 것이 없는 검사는 거짓 빨강만 낸다 — 정말 서는지 본다 */
  본다('빈 글을 넣으면 전부 0 이다(없는 것을 지어내지 않는다)', 세기('').줄수 === 0);

  console.log(틀렸다.length ? `🔴 자가시험 ${틀렸다.length}칸 틀림\n  - ${틀렸다.join('\n  - ')}`
    : '✅ 자가시험 7칸 다 지나감');
  process.exit(틀렸다.length ? 1 : 0);
}

/* ── 실제로 재기 ──────────────────────────────────────────────────────── */
let 파일들 = [];
try { 파일들 = fs.readdirSync(시세방).filter((f) => /^\d{8}\.ndjson$/.test(f)).sort(); }
catch { 파일들 = []; }

if (!파일들.length) {
  /* ⛔ 못 쟀을 때 0 을 쓰지 않는다 — 있던 파일을 덮어 「손님이 없다」로 만들지 않는다 */
  console.log(`⚠ ${시세방} 에 ndjson 이 없다 — **못 쟀다**. 있던 파일을 그대로 둔다.`);
  process.exit(0);
}

const 마지막 = 파일들.at(-1);
const 잰것 = 세기(fs.readFileSync(path.join(시세방, 마지막), 'utf8'));

const 낼것 = {
  잰날: `${마지막.slice(0, 4)}-${마지막.slice(4, 6)}-${마지막.slice(6, 8)}`,
  쌓인날수: 파일들.length,
  첫날: `${파일들[0].slice(0, 4)}-${파일들[0].slice(4, 6)}-${파일들[0].slice(6, 8)}`,
  ...잰것,
  /* 🔴 이 수는 KRX 쪽 판이다. 우리가 그 API 를 «지금» 부르지 않으므로 다시 재지 못한다.
     2026-09-09 에 실제로 재서 적어 둔 값이고, 그 사실을 함께 적는다.
     ⛔ 다시 잰 척하지 않는다 — 「못 잰 것은 못 쟀다고 적는다」. */
  krx판_유가증권_2026_09_07: 943,
  krx판_잰날: '2026-09-07',
};

fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2) + '\n', 'utf8');
console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${마지막} 기준 ${잰것.줄수.toLocaleString()}줄`);
console.log(`   ${Object.entries(잰것.시장별).map(([k, v]) => `${k} ${v}`).join(' · ')}`
  + ` · 거래없음 ${잰것.거래없음} · 종가 빈칸 ${잰것.종가빈칸}`);
