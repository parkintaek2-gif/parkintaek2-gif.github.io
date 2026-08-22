#!/usr/bin/env node
/**
 * check-kcw-stale-stamp.mjs — **낡은 수를 지금 수인 척 내놓고 있나**를 본다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님 지시(2026-08-22): 「**매일 하는 것은 내 손이 가서 하지 말라**」.
 * 나는 Riot 키(하루짜리)가 죽어 사다리 자료가 8월 6일에 멈춘 것을 사장님께 올렸고,
 * 그건 내가 설계로 끊어야 할 일이라고 바로잡아 주셨다.
 *
 * ⭐ 그래서 끊는 방법은 이렇다 — **사람이 기억해서 갱신하는 구조를 없앤다.**
 *   자료가 낡으면 지면이 **스스로 낡았다고 말하게** 하고, 그것을 자가 지킨다.
 *   ⛔ 「매일 갱신한다」고 적어 두고 안 하는 것이 가장 나쁘다. 손님이 오늘 수로 읽는다.
 *   ⛔ 자료를 지우지도 않는다 — 그날의 수는 그날의 사실이고, 사다리는 소급이 안 된다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * 날짜가 박힌 자료를 쓰는 지면이, 그 자료가 오래됐을 때
 *   ① **잰 날을 화면에 적고 있나**
 *   ② 「지금·오늘·매일」처럼 **싱싱한 척하는 말**을 쓰고 있지 않나
 * ⚠ 며칠까지를 「낡음」으로 볼지는 자료마다 다르다 — 아래 표에 적는다.
 *
 * 쓰는 법  node scripts/check-kcw-stale-stamp.mjs --자가시험
 *          node scripts/check-kcw-stale-stamp.mjs [--오늘=2026-08-22]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 볼 것 — 자료 · 그 자료를 쓰는 나간 지면 · 며칠이면 낡은 것으로 보나 · 날짜가 어디 있나.
 * ⛔ 지면을 손으로 적는 것이 맞다. 이 표는 「날마다 움직이는 수」만 담는다 —
 *   다 훑으면 안 움직이는 자료까지 낡았다고 부른다.
 */
export const 볼것 = [
  {
    자료: 'src/data/riot-ladder.json',
    날짜칸: 'day',
    /**
     * 🔴 2026-08-22 — 처음엔 `esports-games`·`esports-nations` 도 여기 적었다. **짐작이었다.**
     *   열어 보니 그 둘은 사다리 자료를 안 쓴다 — 자기 자료(위키백과 읽힘, 8/13)를 쓴다.
     *   ⛔ 「이름이 비슷하니 같은 자료를 쓸 것」이라 여기고 자를 만들면, 자가 엉뚱한 지면을
     *     빨갛게 만든다. **쓰는 지면을 확인하고 적는다.**
     * ⚠ 그 둘은 몇 시간마다 움직이는 수가 아니라 3일 규칙을 걸 자리가 아니다.
     */
    지면: ['dist/wikitip/esports.html'],
    낡음일: 3,
    왜: 'LP 컷오프는 몇 시간마다 움직인다. 날짜 없이 인용하면 아무것도 인용하지 않은 것이다',
  },
];

/**
 * 싱싱한 척하는 **주장**.
 *
 * 🔴🔴 2026-08-22 — 처음 판은 `right now`·`today's`·`daily` 같은 **낱말**을 잡았다.
 *   그러자 내가 그날 쓴 **가장 정직한 문장**이 걸렸다 —
 *   「This is that day's number, **not today's**.」 그리고 API 를 설명하는 문장도 걸렸다 —
 *   「the API answers only for **right now**」.
 *   ⭐ 잡아야 하는 것은 낱말이 아니라 **「우리가 날마다 갱신한다」는 주장**이다.
 *     낱말을 잡으면 자가 정직한 글을 벌하고, 다음 사람이 그 글을 지운다.
 * ⚠ 그래서 무늬를 좁히고, 대신 **낡았다고 말했나**를 따로 요구한다(아래 낡음고백).
 */
export const 싱싱한주장 = [
  /\bdaily snapshot\b/i,
  /\bupdated daily\b/i,
  /\bwe update (?:it |them )?daily\b/i,
  /counted (?:the same way )?every day/i,
  /\bwe (?:count|collect|measure) (?:it |them )?every day\b/i,
  /\bas of today\b/i,
];

/**
 * 낡았다고 고백하는 말. 낡은 자료를 쓰는 지면은 **이 중 하나**가 화면에 있어야 한다.
 * ⭐ 「날짜만 적어 두면 된다」가 아니다 — 날짜는 손님이 못 알아채고 지나간다.
 *   한 문장으로 「이건 그날 수다」라고 말해야 그 수가 오늘 수로 안 읽힌다.
 */
export const 낡음고백 = [
  /\bnot today'?s?\b/i,
  /\bthat day'?s? number\b/i,
  /\bas of\b/i,
  /\bstamped\b/i,
  /\bnot collecting\b/i,
];

export const 며칠전 = (오늘, 날) => Math.round((Date.parse(오늘) - Date.parse(날)) / 86400000);

/** 화면 글자만 남긴다 — 주석·코드 안의 말은 손님이 안 읽는다 */
export const 보이는글자 = (html) => String(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');

/**
 * 한 지면을 본다. 낡았으면 ① 날짜가 있나 ② 싱싱한 척하는 말이 있나.
 * ⛔ 낡지 않았으면 아무 말도 안 한다 — 안 낡은 것에 규칙을 걸면 자가 시끄러워진다.
 */
export function 한장검사({ 글, 날, 지났나 }) {
  if (!지났나) return [];
  const 본 = 보이는글자(글);
  const 흠 = [];
  if (!본.includes(날)) 흠.push(`잰 날(${날})이 화면에 없다`);
  if (!낡음고백.some((자) => 자.test(본))) {
    흠.push('낡았다고 말한 문장이 없다 — 날짜만 적으면 손님은 오늘 수로 읽는다');
  }
  for (const 자 of 싱싱한주장) {
    const m = 본.match(자);
    if (m) 흠.push(`날마다 갱신한다는 주장 «${m[0]}» 이 있다`);
  }
  return 흠;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('며칠 전인지 센다', 며칠전('2026-08-22', '2026-08-06') === 16);
  검('같은 날은 0일', 며칠전('2026-08-06', '2026-08-06') === 0);
  const 정직 = '<p>On 2026-08-06 the cutoff was 1717 LP. This is that day number, not today. We are not collecting at the moment.</p>';
  검('⛔ 안 낡았으면 아무 말 안 한다', 한장검사({ 글: '<p>x</p>', 날: '2026-08-06', 지났나: false }).length === 0);
  검('정직하게 적은 지면은 통과한다', 한장검사({ 글: 정직, 날: '2026-08-06', 지났나: true }).length === 0);
  검('낡았는데 날짜가 없으면 잡는다', 한장검사({ 글: '<p>the cutoff was 1717 LP. not today.</p>', 날: '2026-08-06', 지났나: true }).some((x) => x.includes('화면에 없다')));
  검('⭐ 날짜만 있고 고백이 없으면 잡는다', 한장검사({ 글: '<p>2026-08-06 — the cutoff was 1717 LP</p>', 날: '2026-08-06', 지났나: true }).some((x) => x.includes('낡았다고 말한 문장이 없다')));
  /* ⚠ 흠 글에는 **걸린 그대로**가 들어간다(「Daily snapshot」). 큰 글자를 가리지 않고 본다 */
  검('⭐ 「daily snapshot」 주장을 잡는다', 한장검사({ 글: 정직 + '<p>Daily snapshot of the ladder</p>', 날: '2026-08-06', 지났나: true }).some((x) => x.toLowerCase().includes('daily snapshot')));
  검('⭐ 「counted the same way every day」 를 잡는다', 한장검사({ 글: 정직 + '<p>counted the same way every day</p>', 날: '2026-08-06', 지났나: true }).some((x) => x.includes('every day')));
  검('⭐ 「as of today」 를 잡는다', 한장검사({ 글: 정직 + '<p>as of today it is 1717</p>', 날: '2026-08-06', 지났나: true }).some((x) => x.includes('as of today')));
  /* 🔴 이 둘이 첫 판에서 걸렸다 — 내가 그날 쓴 가장 정직한 문장과 API 설명이었다 */
  검('⛔⛔ 「not today」 라는 정직한 말을 안 잡는다', 한장검사({ 글: 정직, 날: '2026-08-06', 지났나: true }).every((x) => !x.includes('not today')));
  검('⛔⛔ API 를 설명하는 「right now」 를 안 잡는다', 한장검사({ 글: 정직 + '<p>the API answers only for right now</p>', 날: '2026-08-06', 지났나: true }).length === 0);
  검('⛔ 주석 안의 것은 안 잡는다', 한장검사({ 글: 정직 + '<!-- daily snapshot -->', 날: '2026-08-06', 지났나: true }).length === 0);
  검('⛔ script 안의 것도 안 잡는다', 한장검사({ 글: 정직 + '<script>var s="daily snapshot"</script>', 날: '2026-08-06', 지났나: true }).length === 0);
  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-kcw-stale-stamp 자가시험 통과 (13)');
  process.exit(0);
}

const 오늘 = (process.argv.find((a) => a.startsWith('--오늘='))?.split('=')[1])
  ?? new Date().toISOString().slice(0, 10);

const 문제 = [];
let 본지면 = 0;
const 못잼 = [];

for (const x of 볼것) {
  const 자료길 = path.join(뿌리, x.자료);
  if (!fs.existsSync(자료길)) { 못잼.push(`${x.자료} — 자료가 없다`); continue; }
  let j;
  try { j = JSON.parse(fs.readFileSync(자료길, 'utf8')); } catch { 못잼.push(`${x.자료} — JSON 이 깨졌다`); continue; }
  const 날 = String(j[x.날짜칸] ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(날)) { 못잼.push(`${x.자료} — ${x.날짜칸} 이 날짜가 아니다`); continue; }
  const 지난일 = 며칠전(오늘, 날);
  const 지났나 = 지난일 > x.낡음일;

  for (const 지면 of x.지면) {
    const 길 = path.join(뿌리, 지면);
    if (!fs.existsSync(길)) { 못잼.push(`${지면} — 나간 지면이 없다(빌드 먼저)`); continue; }
    본지면++;
    const 흠 = 한장검사({ 글: fs.readFileSync(길, 'utf8'), 날, 지났나 });
    for (const h of 흠) 문제.push(`${지면} (자료 ${날} · ${지난일}일 지났다) — ${h}`);
  }
}

if (못잼.length && !본지면) {
  console.log('⚠ 못 쟀다 — 볼 지면이 없다(빌드 먼저). 「깨끗하다」고 말하지 않는다');
  못잼.forEach((m) => console.log(`   · ${m}`));
  process.exit(0);
}

console.log(`낡은 도장 검사 — 본 지면 ${본지면}장 · 오늘 ${오늘}`);
if (못잼.length) 못잼.forEach((m) => console.log(`   ⚠ 못 쟀다 — ${m}`));
if (문제.length) {
  console.log(`❌ ${문제.length}건 — 낡은 수를 지금 수인 척 내놓고 있다`);
  문제.forEach((m) => console.log(`   · ${m}`));
  console.log('   ⭐ 고치는 길은 둘뿐이다 — 자료를 새로 재거나, 지면이 잰 날을 말하게 하거나.');
  console.log('   ⛔ 「매일 갱신한다」고 적어 두고 안 하는 것이 가장 나쁘다.');
  process.exit(1);
}
console.log('✅ 낡은 자료를 쓰는 지면이 잰 날을 말하고, 싱싱한 척하지 않는다');
