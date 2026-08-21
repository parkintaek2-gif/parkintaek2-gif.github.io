#!/usr/bin/env node
/**
 * token-watch.mjs — **토큰을 얼마나 썼나 잰다. 주간 한도를 넘지 않게 지킨다.**
 *
 * 🔴 사장님(2026-08-13)
 *   *「이번처럼 주간 한도를 다 써서 며칠 동안 일을 못 했잖아. 그런 일이 이제 발생하지 않도록
 *     **토큰 사용량에 대해서 네가 체크를 하고** 그거를 주간 한도 넘지 않도록 잘 조절을 해줘」*
 *
 * ⛔ 말로 「아껴 쓰자」는 지켜지지 않는다. **재는 자를 만들고 숫자로 본다.**
 *
 * 어디서 재나
 *   C:/Users/USER/.claude/projects/**\/*.jsonl  — 각 창의 대화록에 usage 가 그대로 적혀 있다
 *
 * 쓰는 법
 *   node scripts/token-watch.mjs --오늘 2026-08-13              날마다 · 요즘 14일
 *   node scripts/token-watch.mjs --오늘 2026-08-13 --일수 7
 *   node scripts/token-watch.mjs --오늘 2026-08-13 --자리        자리(폴더)마다 갈라 본다
 *   node scripts/token-watch.mjs --selftest
 *
 * ⚠ 날짜는 **밖에서 넘긴다.** 자가 시계를 보면 자정 근처에서 혼자 날이 바뀐다.
 * ⚠ 시각은 KST 로 센다. 대화록에 적힌 것은 UTC 다.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const 뿌리 = 'C:/Users/USER/.claude/projects';
const KST = 9 * 3600 * 1000;

/** UTC ISO 문자열 → KST 날짜(YYYY-MM-DD). ⛔ toISOString 을 쓰지 않는다 */
export function 케이에스티날(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const d = new Date(t + KST);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** 한 줄에서 쓴 토큰을 뽑는다. 없으면 0 */
export function 줄에서뽑기(줄) {
  if (!줄 || 줄[0] !== '{') return null;
  if (줄.indexOf('"usage"') === -1) return null;
  let o;
  try { o = JSON.parse(줄); } catch { return null; }
  const u = o?.message?.usage;
  if (!u) return null;
  const 날 = 케이에스티날(o.timestamp);
  if (!날) return null;
  return {
    날,
    들어간것: (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0),
    나온것: u.output_tokens || 0,
    새로읽힌것: u.input_tokens || 0,          // 캐시를 뺀 진짜 새 입력
    캐시만든것: u.cache_creation_input_tokens || 0,
    캐시읽은것: u.cache_read_input_tokens || 0,
  };
}

/** 며칠 전인가 (둘 다 YYYY-MM-DD) */
export function 며칠전(오늘, 그날) {
  const a = Date.parse(오늘 + 'T00:00:00Z'), b = Date.parse(그날 + 'T00:00:00Z');
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a - b) / 86400000);
}

function 사람이보는수(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + '십억';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + '백만';
  if (n >= 1e3) return Math.round(n / 1e3) + '천';
  return String(n);
}

if (process.argv.includes('--selftest')) {
  const 시험 = [
    [케이에스티날('2026-08-12T15:30:00.000Z'), '2026-08-13', 'UTC 15:30 은 KST 로 다음 날이다'],
    [케이에스티날('2026-08-13T00:10:00.000Z'), '2026-08-13', 'UTC 자정 직후는 같은 날 오전 9시다'],
    [케이에스티날('2026-08-12T14:59:00.000Z'), '2026-08-12', 'UTC 14:59 는 아직 그날이다'],
    [줄에서뽑기('그냥 글자'), null, 'JSON 이 아니면 못 뽑는다'],
    [줄에서뽑기('{"a":1}'), null, 'usage 가 없으면 못 뽑는다'],
    [줄에서뽑기('{"timestamp":"2026-08-13T01:00:00Z","message":{"usage":{"output_tokens":7,"input_tokens":3,"cache_read_input_tokens":10}}}')?.나온것, 7, '나온 토큰을 뽑는다'],
    [줄에서뽑기('{"timestamp":"2026-08-13T01:00:00Z","message":{"usage":{"output_tokens":7,"input_tokens":3,"cache_read_input_tokens":10}}}')?.들어간것, 13, '캐시까지 더해 들어간 것을 센다'],
    [며칠전('2026-08-13', '2026-08-06'), 7, '이레 전을 센다'],
    [며칠전('2026-08-13', '2026-08-13'), 0, '오늘은 0일 전이다'],
  ];
  let 틀림 = 0;
  for (const [잰것, 맞는것, 이름] of 시험) {
    if (JSON.stringify(잰것) !== JSON.stringify(맞는것)) { console.error(`❌ ${이름} — 잰 것 ${JSON.stringify(잰것)} · 맞는 것 ${JSON.stringify(맞는것)}`); 틀림++; }
  }
  if (틀림) { console.error(`❌ ${틀림}건 틀렸다`); process.exit(1); }
  console.log(`✅ 토큰 자 자가시험 ${시험.length}건 통과`);
  process.exit(0);
}

// ── 여기부터 실제로 잰다 ──────────────────────────────────────────
const 인수 = process.argv;
function 값(이름, 기본) { const i = 인수.indexOf(이름); return i > -1 && 인수[i + 1] ? 인수[i + 1] : 기본; }
const 오늘 = 값('--오늘', null);
if (!오늘) { console.error('⛔ --오늘 2026-08-13 처럼 날짜를 넘겨야 한다 (자가 시계를 안 본다)'); process.exit(1); }
const 일수 = Number(값('--일수', 14));
const 자리별로 = 인수.includes('--자리');

const 날마다 = new Map();      // 날 → {들어간것, 나온것, ...}
const 자리마다 = new Map();    // 폴더 → {나온것, 들어간것}

function 더하기(칸, 몫) {
  칸.들어간것 += 몫.들어간것; 칸.나온것 += 몫.나온것;
  칸.새로읽힌것 += 몫.새로읽힌것; 칸.캐시만든것 += 몫.캐시만든것; 칸.캐시읽은것 += 몫.캐시읽은것;
}
const 빈칸 = () => ({ 들어간것: 0, 나온것: 0, 새로읽힌것: 0, 캐시만든것: 0, 캐시읽은것: 0 });

const 파일들 = [];
for (const 폴더 of fs.readdirSync(뿌리, { withFileTypes: true })) {
  if (!폴더.isDirectory()) continue;
  const p = path.join(뿌리, 폴더.name);
  for (const f of fs.readdirSync(p)) if (f.endsWith('.jsonl')) 파일들.push({ 폴더: 폴더.name, 길: path.join(p, f) });
}

let 읽은줄 = 0;
for (const { 폴더, 길 } of 파일들) {
  // 오래된 파일은 건너뛴다 — 손댄 날이 보는 창보다 앞서면 볼 것이 없다
  try {
    const 손댄날 = 케이에스티날(new Date(fs.statSync(길).mtimeMs).toJSON());
    if (며칠전(오늘, 손댄날) > 일수) continue;
  } catch { continue; }

  const rl = readline.createInterface({ input: fs.createReadStream(길, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const 줄 of rl) {
    읽은줄++;
    const 몫 = 줄에서뽑기(줄);
    if (!몫) continue;
    const 지난날 = 며칠전(오늘, 몫.날);
    if (지난날 === null || 지난날 < 0 || 지난날 >= 일수) continue;
    if (!날마다.has(몫.날)) 날마다.set(몫.날, 빈칸());
    더하기(날마다.get(몫.날), 몫);
    if (!자리마다.has(폴더)) 자리마다.set(폴더, 빈칸());
    더하기(자리마다.get(폴더), 몫);
  }
}

const 날들 = [...날마다.keys()].sort();
console.log(`\n📊 토큰 사용 — ${오늘} 기준 ${일수}일 (KST) · 대화록 ${파일들.length}개 · ${사람이보는수(읽은줄)}줄 읽음\n`);
console.log('날짜          나온 것(출력)    들어간 것(합)   그중 새 입력    캐시 읽음');
console.log('─'.repeat(76));
let 합나온 = 0, 합들어간 = 0;
for (const 날 of 날들) {
  const c = 날마다.get(날);
  합나온 += c.나온것; 합들어간 += c.들어간것;
  console.log(
    `${날}  ${사람이보는수(c.나온것).padStart(12)}  ${사람이보는수(c.들어간것).padStart(13)}  ${사람이보는수(c.새로읽힌것).padStart(12)}  ${사람이보는수(c.캐시읽은것).padStart(11)}`
  );
}
console.log('─'.repeat(76));
console.log(`합계        ${사람이보는수(합나온).padStart(12)}  ${사람이보는수(합들어간).padStart(13)}`);

// 요즘 이레
let 이레나온 = 0, 이레들어간 = 0;
for (const 날 of 날들) if (며칠전(오늘, 날) < 7) { 이레나온 += 날마다.get(날).나온것; 이레들어간 += 날마다.get(날).들어간것; }
console.log(`\n🔴 요즘 이레(7일)  나온 것 ${사람이보는수(이레나온)} · 들어간 것 ${사람이보는수(이레들어간)}`);
const 하루평균 = 날들.length ? 합나온 / Math.min(날들.length, 일수) : 0;
console.log(`   하루 평균 나온 것 ${사람이보는수(Math.round(하루평균))}`);

if (자리별로) {
  console.log('\n자리(폴더)마다 — 나온 것 많은 차례');
  console.log('─'.repeat(76));
  for (const [폴더, c] of [...자리마다.entries()].sort((a, b) => b[1].나온것 - a[1].나온것)) {
    const 몫 = 합나온 ? Math.round((c.나온것 / 합나온) * 100) : 0;
    console.log(`${String(몫).padStart(3)}%  ${사람이보는수(c.나온것).padStart(10)}  ${폴더}`);
  }
}
console.log('');
