#!/usr/bin/env node
/**
 * collect-kcw-tudum-dictionary.mjs — **넷플릭스 Tudum 파일에 «무엇이» 들어 있나.**
 *
 * ── 🔴 왜 만드나 (2026-09-05, 실측에서 나왔다) ──────────────
 * 서치콘솔 28일치를 세어 보니 —
 * ```
 *   Tudum 파일을 찾는 물음 21개 · 노출 262 · 클릭 **0**
 *   → 우리 전체 노출 977 가운데 **27%**. 가장 큰 덩어리다
 * ```
 * 그 사람들이 치는 말은 파일 «주소» 그대로다 —
 *   `https://www.netflix.com/tudum/top10/data/all-weeks-countries.tsv`
 *
 * ⛔ 그런데 우리 지면 제목은 「그 파일의 71.1%는 조회수가 없다」다.
 *   **파일을 찾아온 사람에게 파일의 «흠»을 내밀고 있다.** 그래서 1쪽에 뜨고도 클릭이 0이다.
 *
 * ⭐ 그들이 원하는 것은 「이 파일에 무엇이 들어 있나」다. 그것을 «우리가 재서» 준다 —
 *   칸 이름, 줄 수, 언제부터 언제까지, 나라 몇 곳, 빈 칸이 어디에.
 *
 * ── ⛔ 라이선스 ─────────────────────────────────────────
 * ⛔ **파일을 다시 배포하지 않는다.** 우리가 내는 것은 «그 파일을 재서 얻은 수»이고,
 *   그것은 우리 측정이다. 받으러 가는 곳은 넷플릭스 주소로 보낸다.
 * ⛔ 표본 몇 줄을 「예시」랍시고 싣지 않는다. 그것이 재배포로 읽힐 수 있다.
 *
 * 쓰는 법
 *   node scripts/collect-kcw-tudum-dictionary.mjs --자가시험
 *   node scripts/collect-kcw-tudum-dictionary.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(__dirname, '..');
const 자료방 = path.join(뿌리, 'archive', 'raw', 'netflix-top10');
const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-tudum-dictionary.json');

/** 가장 새 파일을 고른다 — 이름 끝의 날짜로 */
export function 가장새것(이름들, 앞) {
  const 것 = 이름들.filter((f) => f.startsWith(`${앞}-`) && f.endsWith('.tsv')).sort();
  return 것.length ? 것[것.length - 1] : null;
}

/** 파일 이름에서 받은 날을 읽는다 */
export function 받은날(이름) {
  const m = String(이름 ?? '').match(/(\d{4}-\d{2}-\d{2})\.tsv$/);
  return m ? m[1] : null;
}

/** 빈 칸인가 — ⛔ 「0」은 빈 칸이 아니다. 0 과 «없음»을 섞으면 수가 통째로 틀린다 */
export function 빈칸인가(v) {
  const s = String(v ?? '').trim();
  return s === '' || s === 'N/A' || s === 'NA' || s === '\\N';
}

/* ── 자가시험 ───────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실 = []; let 통 = 0;
  const 같나 = (이름, 본, 기대) => {
    const a = JSON.stringify(본); const b = JSON.stringify(기대);
    if (a === b) 통 += 1; else 실.push(`${이름}: ${a} ≠ ${b}`);
  };

  같나('가장 새 파일을 고른다',
    가장새것(['countries-2026-08-23.tsv', 'countries-2026-09-03.tsv', 'global-2026-09-03.tsv'], 'countries'),
    'countries-2026-09-03.tsv');
  같나('그 앞이름이 없으면 null', 가장새것(['global-2026-09-03.tsv'], 'countries'), null);
  같나('빈 목록이면 null', 가장새것([], 'countries'), null);
  같나('tsv 가 아니면 안 센다', 가장새것(['countries-2026-09-03.csv'], 'countries'), null);

  같나('받은 날을 읽는다', 받은날('countries-2026-09-03.tsv'), '2026-09-03');
  같나('날이 없으면 null', 받은날('countries.tsv'), null);

  /* 🔴 0 과 «없음»을 섞으면 「조회수가 없다」는 수가 통째로 틀린다 */
  같나('빈 글자는 빈 칸이다', 빈칸인가(''), true);
  같나('공백만도 빈 칸이다', 빈칸인가('   '), true);
  같나('N/A 도 빈 칸이다', 빈칸인가('N/A'), true);
  같나('⛔ 「0」은 빈 칸이 아니다', 빈칸인가('0'), false);
  같나('⛔ 숫자는 빈 칸이 아니다', 빈칸인가('1234'), false);
  같나('null 은 빈 칸이다', 빈칸인가(null), true);

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ Tudum 자료 사전 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

/* ── 실제로 잰다 ─────────────────────────────────────────────── */
async function 파일재기(길) {
  const rl = readline.createInterface({ input: fs.createReadStream(길, 'utf8'), crlfDelay: Infinity });
  let 머리 = null; let 줄수 = 0;
  const 빈칸수 = new Map(); const 나라 = new Set(); const 주 = new Set();
  let 제목칸 = -1; const 제목 = new Set();
  for await (const 줄 of rl) {
    if (!줄.length) continue;
    const 칸 = 줄.split('\t');
    if (머리 === null) {
      머리 = 칸.map((s) => s.trim());
      for (const h of 머리) 빈칸수.set(h, 0);
      제목칸 = 머리.findIndex((h) => /show_title|title/i.test(h));
      continue;
    }
    줄수 += 1;
    for (let i = 0; i < 머리.length; i += 1) if (빈칸인가(칸[i])) 빈칸수.set(머리[i], 빈칸수.get(머리[i]) + 1);
    const ci = 머리.findIndex((h) => /country_name|country/i.test(h));
    if (ci >= 0 && !빈칸인가(칸[ci])) 나라.add(칸[ci]);
    const wi = 머리.findIndex((h) => /week/i.test(h));
    if (wi >= 0 && !빈칸인가(칸[wi])) 주.add(칸[wi]);
    if (제목칸 >= 0 && !빈칸인가(칸[제목칸])) 제목.add(칸[제목칸]);
  }
  const 주들 = [...주].sort();
  return {
    columns: 머리 ?? [],
    rows: 줄수,
    countries: 나라.size || null,
    weeks: 주들.length || null,
    firstWeek: 주들[0] ?? null,
    lastWeek: 주들[주들.length - 1] ?? null,
    distinctTitles: 제목.size || null,
    emptyByColumn: (머리 ?? []).map((h) => ({
      column: h, empty: 빈칸수.get(h), pc: 줄수 ? Math.round((1000 * 빈칸수.get(h)) / 줄수) / 10 : null,
    })),
  };
}

if (내가실행됐다) {
  if (!fs.existsSync(자료방)) { console.error(`⛔ 자료방이 없다: ${자료방} — 못 쟀다`); process.exit(1); }
  const 이름들 = fs.readdirSync(자료방);
  const 잴것 = [
    { key: 'all-weeks-countries.tsv', 앞: 'countries',
      url: 'https://www.netflix.com/tudum/top10/data/all-weeks-countries.tsv' },
    { key: 'all-weeks-global.tsv', 앞: 'global',
      url: 'https://www.netflix.com/tudum/top10/data/all-weeks-global.tsv' },
  ];

  const 파일들 = []; const 못잰것 = [];
  for (const t of 잴것) {
    const 이름 = 가장새것(이름들, t.앞);
    if (!이름) { 못잰것.push(`${t.key} — 아카이브에 받아 둔 것이 없다`); continue; }
    const 잰것 = await 파일재기(path.join(자료방, 이름));
    파일들.push({ ...t, archivedAs: 이름, downloadedOn: 받은날(이름), ...잰것 });
    console.log(`✅ ${t.key} — ${잰것.rows.toLocaleString('en-US')}줄 · 칸 ${잰것.columns.length}개`
      + ` · 나라 ${잰것.countries ?? '—'} · 주 ${잰것.weeks ?? '—'}`);
  }

  const 낼것 = {
    measuredAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    whatThisIs: 'A measured description of Netflix\'s public Top 10 data files: the columns they carry, '
      + 'how many rows, which weeks and countries, and which columns are empty and how often.',
    licence: 'We do not republish the files. Everything here is a count we made from them. The files '
      + 'themselves are Netflix\'s and are downloaded from netflix.com.',
    notMeasured: [
      'Whether Netflix\'s own numbers are correct. We count what the file says, not what happened',
      'Anything about titles the file does not list. A title absent from a country\'s top 10 produces no row, which is not the same as nobody watching it',
      'Current availability. These files are chart history, not a catalogue of what is streaming now',
    ],
    unmeasured: 못잰것,
    files: 파일들,
  };
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2) + '\n', 'utf8');
  console.log(`\n📁 적었다 — ${path.relative(뿌리, 낼곳)}`);
  for (const s of 못잰것) console.log(`   ⬜ ${s}`);
}
