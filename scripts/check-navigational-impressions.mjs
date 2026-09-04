#!/usr/bin/env node
/**
 * check-navigational-impressions.mjs — **못 이기는 노출과 이길 수 있는 노출을 «가른다».**
 *
 * ── 왜 이 자를 세웠나 (2026-08-29) ────────────────────────────
 * 🔴 우리 최대 노출 지면 `/market/nicaragua` 가 **190회 노출에 클릭 0**, 자리 7.7위였다.
 *   나는 이것을 「고칠 것」으로 보고 2번께 올렸다. 제목·설명이 구체적인데 왜 0인가 하고.
 *
 * ⭐ 그런데 «질의 × 지면»을 실제로 떠 보니 이랬다 —
 * ```
 *   62회  https://www.netflix.com/tudum/top10?week=2024-11-03
 *   37회  "https://www.netflix.com/tudum/top10?week=2024-11-03"
 *   15회  netflix.com/tudum/top10?week=2024-11-03
 *   …     나머지도 전부 넷플릭스 «주소 그대로»
 * ```
 * **주소를 통째로 넣고 찾는 사람은 netflix.com 을 누른다.** 우리를 안 누르는 것이 맞다.
 *
 * ⛔ 그리고 나는 「Tudum 이 옛 주를 더는 안 보여 준다」고 짐작했다. **틀렸다.**
 *   실제로 열어 보니 `?week=2024-11-03` 이 200 으로 뜨고 그 날짜도 들어 있다.
 *   ⭐ 짐작을 지면에 쓰기 전에 «열어 봤다». 그래서 틀린 지면을 안 냈다.
 *
 * ── 그래서 이 자가 하는 일 ────────────────────────────────────
 * **길찾기 질의(navigational)**와 **알고 싶어 하는 질의(informational)**를 갈라서 센다.
 * ```
 *   전체        445 노출 · 2 클릭 · CTR 0.45%
 *   길찾기      225 노출 · 0 클릭 · CTR 0.00%   ← 이길 수 없다. 고치려 들면 헛수고다
 *   우리 질의   220 노출 · 2 클릭 · CTR 0.91%   ← 여기가 우리가 이길 자리다
 * ```
 * ⭐ **합친 CTR 을 그대로 보면 우리 실력을 절반으로 잘못 읽는다.**
 * ⛔ 그렇다고 길찾기 노출을 «지우지» 않는다. 세되 갈라서 센다 — 「못 잰다」와 다르다.
 *
 * ── ⚠ 이 자가 못 하는 것 ──────────────────────────────────────
 * ⚠ 「길찾기」 판정은 «글자 모양»으로 한다. 사람의 «속»은 못 본다.
 *   주소 꼴이 아닌데 길찾기인 질의(브랜드명만 친 것 따위)는 못 가른다.
 * ⛔ 그러니 이 수를 「우리가 이길 수 있는 전부」라고 읽지 않는다. **위쪽 어림**이다.
 *
 * 쓰는 법
 *   node scripts/check-navigational-impressions.mjs --자가시험
 *   node scripts/check-navigational-impressions.mjs --자료=src/data/gsc-kcw-2026-09-01.json
 *   ⚠ 「--자료 <길>」(빈칸) 도 받는다. 2026-09-04 에 그 꼴이 조용히 무시돼 옛 자료를 읽었다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* ⚠ 새 자료를 받으면 여기도 옮긴다 — node scripts/fetch-gsc.mjs --사이트 kcw
   ⛔ 안 옮기면 «인자를 안 준 사람»이 낡은 창을 새 것으로 읽는다. 2026-09-04 에 내가 그랬다. */
const 기본자료 = 'src/data/gsc-kcw-2026-09-01.json';

/**
 * 이 질의가 «어딘가로 가려고» 친 것인가.
 * ⚠ 글자 모양으로만 본다. 사람 속은 못 본다 — 그래서 «위쪽 어림»이다.
 */
export function 길찾기인가(질의) {
  const s = String(질의 ?? '').trim().replace(/^["']|["']$/g, '');
  if (!s) return false;
  if (/^(https?:\/\/|www\.)/i.test(s)) return true;      /* 주소를 통째로 쳤다 */
  if (/\.(tsv|csv|json|xml|pdf)\b/i.test(s)) return true; /* 파일을 찾는다 */
  if (/\b[a-z0-9-]+\.(com|net|org|co\.[a-z]{2})\//i.test(s)) return true; /* 도메인+길 */
  if (/\btudum\b/i.test(s)) return true;                  /* 넷플릭스 자기 이름 */
  return false;
}

/** ⛔ 못 재면 null — 0 이 아니다. 0 은 「아무도 안 눌렀다」는 뜻이다 */
export function 비율(위, 아래) {
  if (!Number.isFinite(위) || !Number.isFinite(아래) || 아래 === 0) return null;
  return Math.round((위 / 아래) * 10000) / 100;
}

/** 한 무리를 센다 */
export function 셈하기(줄들) {
  const v = (줄들 ?? []).filter((r) => r && Number.isFinite(r.impressions));
  const 노출 = v.reduce((n, r) => n + r.impressions, 0);
  const 클릭 = v.reduce((n, r) => n + (Number.isFinite(r.clicks) ? r.clicks : 0), 0);
  return { 질의수: v.length, 노출, 클릭, ctr: 비율(클릭, 노출) };
}

/** 갈라서 센다 */
export function 가르기(줄들) {
  const v = 줄들 ?? [];
  const 길 = v.filter((r) => 길찾기인가(r?.key));
  const 우리 = v.filter((r) => !길찾기인가(r?.key));
  return { 전체: 셈하기(v), 길찾기: 셈하기(길), 우리것: 셈하기(우리), 길줄: 길 };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
/*
 * 🔴 [2026-09-04 · 5번] **이 자는 들여오기만 해도 본체가 돌았다.**
 *   `길찾기인가` 하나를 빌려 쓰려고 import 했더니 화면에 보고서가 통째로 찍혔다.
 *   ⛔ 그러면 남이 이 함수를 «부품으로» 못 쓴다 — 자기 출력에 남의 보고서가 섞인다.
 *   ⭐ 2026-08-30 에 make-kcw-sound.mjs 에서 고친 것과 «같은 결함»이다. 여기 남아 있었다.
 */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('주소를 통째로 친 것은 길찾기다',
    길찾기인가('https://www.netflix.com/tudum/top10?week=2024-11-03') === true);
  검('따옴표가 붙어 있어도 안다',
    길찾기인가('"https://www.netflix.com/tudum/top10/data/all-weeks-countries.tsv"') === true);
  검('www 로 시작해도 안다', 길찾기인가('www.netflix.com/tudum/top10?week=2024-11-03') === true);
  검('도메인+길 꼴도 안다', 길찾기인가('netflix.com/tudum/top10?week=2024-11-03') === true);
  검('파일을 찾는 것도 길찾기다', 길찾기인가('"all-weeks-countries.tsv" netflix') === true);
  검('tudum 은 넷플릭스 자기 이름이다', 길찾기인가('netflix tudum top 10') === true);

  검('⛔ 우리에게 물어본 것은 길찾기가 아니다',
    길찾기인가('which bts member is from busan') === false);
  검('⛔ 작품 이름도 아니다', 길찾기인가('decision to leave netflix country') === false);
  검('⛔ 회사 이름만으로 길찾기라 하지 않는다', 길찾기인가('netflix korea') === false);
  검('⛔ 빈 것도 안 터진다', 길찾기인가(undefined) === false && 길찾기인가('') === false);

  검('비율을 센다', 비율(2, 445) === 0.45);
  검('⛔ 0 으로 안 나눈다 — null 이지 0 이 아니다', 비율(0, 0) === null);
  검('⛔ 못 재면 null', 비율(null, 10) === null);

  const 표본 = [
    { key: 'https://a.com/b', impressions: 100, clicks: 0 },
    { key: 'korean drama', impressions: 50, clicks: 2 },
    { key: '없는칸' },
  ];
  const g = 가르기(표본);
  검('⛔ 노출을 못 잰 줄은 세지 않는다', g.전체.질의수 === 2);
  검('길찾기를 따로 센다', g.길찾기.노출 === 100 && g.길찾기.클릭 === 0);
  검('우리 것을 따로 센다', g.우리것.노출 === 50 && g.우리것.클릭 === 2);
  검('⛔ 길찾기 CTR 0% 와 「못 쟀다」를 안 섞는다', g.길찾기.ctr === 0);
  검('우리 CTR 을 낸다', g.우리것.ctr === 4);
  검('⛔ 빈 것도 안 터진다', 가르기(undefined).전체.노출 === 0);
  검('⛔ 갈라 센 노출을 더하면 전체다', g.길찾기.노출 + g.우리것.노출 === g.전체.노출);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ check-navigational-impressions 자가시험 통과 (20)');
  process.exit(0);
}

/* ── 실제로 잰다 ── */
if (내가실행됐다) {
/**
 * 🔴🔴 [2026-09-04 · 5번이 걸림] **빈칸 꼴로 준 인자가 조용히 무시됐다.**
 *   `--자료 src/data/gsc-kcw-2026-09-01.json` 이라 치고 새 자료를 읽었다고 믿었다.
 *   실제로는 `=` 꼴만 받으므로 **옛 파일이 읽혔고**, 화면에 나온 수는 12일 낡은 것이었다.
 *   ⚠ 그 수로 「길찾기가 51%」라고 읽었는데 새 자료로는 **27%** 였다. 노출도 445 대 966.
 *     하마터면 «우리 실력을 절반으로 잘못 읽은 것»을 그대로 보고할 뻔했다.
 *   ⛔ 게다가 이 파일 머리글의 «쓰는 법 예시부터» 빈칸 꼴이었다 — 자가 스스로 틀리게 가르쳤다.
 *
 *   ⭐ 이것은 `docs/발견/2026-09-03_조용히-무시되는-인자.md` 와 **같은 갈래**다. 또 나왔다.
 *   ✅ 그래서 둘 다 받고, **모르는 인자를 만나면 멈춘다.** 조용히 지나가지 않는다.
 */
function 자료인자() {
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].startsWith('--자료=')) return a[i].slice('--자료='.length);
    if (a[i] === '--자료') {
      if (!a[i + 1] || a[i + 1].startsWith('--')) {
        console.error('⛔ `--자료` 뒤에 길이 없다. **안 잰다.**');
        process.exit(1);
      }
      return a[i + 1];
    }
  }
  /* ⛔ 모르는 인자를 조용히 흘리지 않는다 — 흘리면 옛 자료를 새 자료로 착각한다 */
  const 아는것 = new Set(['--자가시험']);
  const 모르는것 = a.filter((x, i) => x.startsWith('--') && !아는것.has(x)
    && !x.startsWith('--자료') && a[i - 1] !== '--자료');
  if (모르는것.length) {
    console.error(`⛔ 모르는 인자 ${모르는것.join(' · ')} — **안 잰다.**`);
    console.error('   쓰는 법: node scripts/check-navigational-impressions.mjs --자료=src/data/gsc-kcw-2026-09-01.json');
    process.exit(1);
  }
  return null;
}
const 인자 = 자료인자();
const 자료길 = path.join(뿌리, 인자 ?? 기본자료);
if (!인자) {
  console.log('⚠ --자료 를 안 줘서 «기본 자료»를 읽는다 — ' + 기본자료);
  console.log('   ⛔ 이것이 오늘 것인지 «창»을 아래에서 확인하십시오. 낡은 창으로 콘텐트를 정하면 지나간 수요를 좇습니다.');
}
if (!fs.existsSync(자료길)) {
  console.log(`⬜ 못 쟀다 — ${path.relative(뿌리, 자료길)} 이 없다`);
  console.log('   ⛔ 「0」이라고 적지 않는다. 자료가 없는 것과 손님이 없는 것은 다르다.');
  process.exit(0);
}

const 원 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
const g = 가르기(원.rows ?? []);

const 줄 = (이름, x) => `   ${이름.padEnd(12)} ${String(x.질의수).padStart(4)}질의 ·`
  + ` ${String(x.노출).padStart(5)}노출 · ${String(x.클릭).padStart(3)}클릭 ·`
  + ` CTR ${x.ctr == null ? '못 쟀다' : `${x.ctr.toFixed(2)}%`}`;

/* ⚠ 창은 파일에 따라 «글자»일 수도 «객체»({from,to,days})일 수도 있다.
   객체를 그대로 이으면 [object Object] 가 찍힌다 — 2026-09-04 에 실제로 그렇게 나왔다.
   ⛔ 창을 못 읽으면 사람이 «어느 창을 보고 있는지» 모른 채 콘텐트를 정하게 된다. */
const 창글 = (w) => (w == null ? '(창을 모른다)'
  : typeof w === 'string' ? w
  : (w.from && w.to) ? `${w.from}~${w.to}${w.days ? ` (${w.days}일)` : ''}`
  : JSON.stringify(w));
console.log(`■ 못 이기는 노출과 이길 수 있는 노출 — ${원.site ?? ''}  창 ${창글(원.window)}
`);
console.log(줄('전체', g.전체));
console.log(줄('🔴 길찾기', g.길찾기));
console.log(줄('✅ 우리 질의', g.우리것));

const 몫 = 비율(g.길찾기.노출, g.전체.노출);
console.log(`\n   길찾기가 전체 노출의 ${몫 == null ? '?' : `${몫.toFixed(0)}%`} 다.`);
if (몫 != null && 몫 >= 30) {
  console.log('   ⛔ **합친 CTR 을 그대로 읽으면 우리 실력을 잘못 읽는다.**');
  console.log('      주소를 통째로 친 사람은 그 주소를 누른다 — 우리를 안 누르는 것이 «맞다».');
  console.log('      그 노출로 제목을 고치려 들면 헛수고다.');
}

if (g.길줄.length) {
  console.log('\n■ 🔴 이길 수 없는 질의 — 큰 것부터');
  for (const r of [...g.길줄].sort((a, b) => b.impressions - a.impressions).slice(0, 8)) {
    console.log(`   ${String(r.impressions).padStart(4)}회 · ${(r.position ?? 0).toFixed(1)}위  ${r.key}`);
  }
}

console.log('\n⚠ 이 자는 «글자 모양»으로만 가른다. 사람 속은 못 본다 —');
console.log('   주소 꼴이 아닌 길찾기(브랜드명만 친 것 따위)는 못 가른다. 위쪽 어림으로 읽는다.');
process.exit(0);

}
