#!/usr/bin/env node
/**
 * 백년지도 **배포 퀴즈** — 매일 아침 이걸 통과해야 그날 일이 시작된다.
 *
 * > 사장님(2026-08-09) — 「점수를 매기려고 만드는 게 아니라 **그날 할 일의 순서를 바꾸려고**
 * >   만드는 것이다. 통과 못 하면 그날은 새 지면을 만들지 말고 그 구멍부터 채워라」
 *
 * ## ⛔ 형식을 다 만들라는 것이 아니다 — **목적에 맞는 칸만, 대신 100%**
 *
 *   ```
 *   지면 4,967장    목적 **광고수입**   검색에 잡혀야 뜻이 있다. ⛔ 밖으로 안 나가도 된다
 *   og 카드 2,784장  목적 **외부유입**   밖으로 나가야 뜻이 있다. 지금 **0장** 나갔다
 *   숏영상(유튜브)   목적 **외부유입**   ⭐ 우리는 **문이 있는 유일한 자리**다(@100yearmap)
 *   카드뉴스        목적 **외부유입**   아직 0장
 *   ```
 *
 * ## 🔴 「몇 살 손님 것인가」 칸을 넣는 까닭
 *
 *   사장님 — *「나는 0살~100살이 다 고객이라 했는데 네 지면은 한 층에만 있다.
 *   **자를 안 대면 습관이 이긴다. 이 칸이 없으면 내일도 대입을 만든다**」*
 *
 *   그래서 이 자는 「몇 장 만들었나」를 안 묻고 **「오늘 만든 것이 몇 살 것인가」**를 묻는다.
 *
 * ## ⛔ 계정이 없는 칸을 「못 함」으로 적지 않는다
 *
 *   *「**준비됐다 · 계정만 열면 오늘 나간다**로 적고, 자산은 미리 다 만들어 둬라」*
 *   → 그래서 이 자는 **자산이 있나**와 **나갔나**를 갈라 센다. 자산이 없으면 그건 우리 잘못이다.
 *
 *   ```
 *   node scripts/deploy-quiz-100y.mjs           오늘 관문
 *   node scripts/deploy-quiz-100y.mjs --자가시험
 *   ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const 뿌리 = process.cwd();
const 빌드 = path.join(뿌리, 'dist', '100y');
const 밑 = 'https://100yearmap.com';

/* ───────────────────────── 판정하는 자 ───────────────────────── */

/**
 * 한 칸의 판정. ⛔ 「반쯤 됐다」를 만들지 않는다 — 통과냐 구멍이냐다.
 * ⚠ `잼` 이 null 이면 **못 쟀다**다. 0 과 다르다.
 */
export function 칸판정({ 잰것, 있어야, 못쟀나 }) {
  if (못쟀나) return '못 쟀다';
  if (잰것 == null) return '못 쟀다';
  return 잰것 >= 있어야 ? '통과' : '구멍';
}

/** 오늘 만든 것이 **대입 말고 다른 층**을 하나라도 덮었나 */
export function 층판정(오늘만든층들) {
  const 대입 = new Set(['10대', '20대']);
  const 다른층 = (오늘만든층들 ?? []).filter((x) => !대입.has(x));
  if (!오늘만든층들 || 오늘만든층들.length === 0) return { 꼴: '구멍', 말: '오늘 만든 것이 없다' };
  if (다른층.length === 0) return { 꼴: '구멍', 말: '오늘 만든 것이 전부 대입(10·20대)이다' };
  return { 꼴: '통과', 말: `대입 밖 ${다른층.join('·')}` };
}

function 자가시험() {
  const 것들 = [
    ['모자라면 구멍', () => 칸판정({ 잰것: 0, 있어야: 1 }) === '구멍'],
    ['채우면 통과', () => 칸판정({ 잰것: 3, 있어야: 1 }) === '통과'],
    ['못 쟀으면 0 이 아니다', () => 칸판정({ 잰것: null, 있어야: 1 }) === '못 쟀다'],
    ['못 쟀다 표시가 이긴다', () => 칸판정({ 잰것: 9, 있어야: 1, 못쟀나: true }) === '못 쟀다'],
    ['대입만 만들면 구멍', () => 층판정(['10대', '20대']).꼴 === '구멍'],
    ['한 층이라도 밖이면 통과', () => 층판정(['10대', '50·60대']).꼴 === '통과'],
    ['아무것도 안 만들면 구멍', () => 층판정([]).꼴 === '구멍'],
    ['0~9세도 대입 밖이다', () => 층판정(['0~9세']).꼴 === '통과'],
  ];
  let 진 = 0;
  for (const [이름, 재기] of 것들) {
    let 됐나 = false;
    let 까닭 = null;
    try { 됐나 = 재기() === true; } catch (e) { 까닭 = e?.message ?? String(e); }
    if (!됐나) { console.log(`  ⛔ 자가시험 실패 — ${이름}${까닭 ? ` (터졌다: ${까닭})` : ''}`); 진 += 1; }
  }
  console.log(`자가시험 ${것들.length}개 · 실패 ${진}개`);
  return 진;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
const 시험실패 = 자가시험();

/* ───────────────────────── 잰다 ───────────────────────── */

const 훑기 = (d, m = []) => {
  let 것들;
  try { 것들 = fs.readdirSync(d, { withFileTypes: true }); } catch { return m; }
  for (const e of 것들) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) 훑기(p, m);
    else m.push(p);
  }
  return m;
};

const 있나 = (p) => fs.existsSync(path.join(뿌리, p));
/**
 * ⚠ **한국 날짜다.** `toISOString()` 은 UTC 라 **0시~9시 사이에 어제 날짜를 준다.**
 *   퀴즈는 「오늘 만든 것」을 보는 자다. 새벽에 돌리면 어제 것을 오늘로 세거나
 *   오늘 것을 하나도 못 센다. 그 시각에 0시 되새김도 돈다 — 겹친다.
 */
const 오늘 = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** 오늘 새로 난 지면 소스 — git 이 안다. ⛔ 손으로 세지 않는다 */
let 오늘새지면 = [];
try {
  오늘새지면 = execSync(
    `git log --since="${오늘} 00:00" --diff-filter=A --name-only --format="" -- src/pages/100y`,
    { encoding: 'utf8', cwd: 뿌리 },
  ).split('\n').map((s) => s.trim()).filter(Boolean);
  오늘새지면 = [...new Set(오늘새지면)];
} catch { 오늘새지면 = null; }

/** 지면 경로 → 손님 나이층. ⛔ 모르면 지어내지 않는다 */
const 층고르기 = (p) => {
  if (/\/(school|major|region|report)\b/.test(p)) return '10대';
  if (/\/(college-major|university|after|work)\b/.test(p)) return '20대';
  if (/\/life\/|\/age\//.test(p)) return '50·60대';
  if (/\/kids?\b|\/elementary\b|\/초등/.test(p)) return '0~9세';
  return '층 모름';
};

/**
 * 크롤러가 왔나 — **우리 로그**에서 읽는다. ⚠ 못 읽으면 「못 쟀다」다. 0 이 아니다.
 */
let 구글크롤 = null, 구글오늘 = null, 네이버크롤 = null;
try {
  const { get } = await import('../src/lib/store.mjs');
  const { 일별키 } = await import('../src/lib/traffic.mjs');
  const 날짜 = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  구글크롤 = 0; 네이버크롤 = 0; 구글오늘 = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const 날 = 날짜(d);
    let 몸; try { 몸 = await get(일별키(날)); } catch { continue; }
    if (!몸) continue;
    const j = JSON.parse(String(몸));
    for (const [k, n] of Object.entries(j.집계 ?? {})) {
      const [host, , , , 종류] = k.split('	');
      if (!String(host).includes('100yearmap')) continue;
      if (종류 === 'google') { 구글크롤 += n; if (i === 0) 구글오늘 += n; }
      if (종류 === 'naver') 네이버크롤 += n;
    }
  }
} catch { 구글크롤 = null; 네이버크롤 = null; }

const 모두 = 훑기(빌드);
const html = 모두.filter((p) => p.endsWith('.html'));
const og = 모두.filter((p) => p.endsWith('.png') && p.includes(`${path.sep}og${path.sep}`));
let 사이트맵 = null;
let noindex = null;
try {
  사이트맵 = (fs.readFileSync(path.join(빌드, 'sitemap.xml'), 'utf8').match(/<loc>/g) ?? []).length;
  noindex = html.filter((p) => {
    try { return /name="robots" content="noindex"/.test(fs.readFileSync(p, 'utf8')); } catch { return false; }
  }).length;
} catch { /* 굽는 중 */ }

/** ⚠ 빌드가 굽는 중이면 **못 쟀다**다. 0 으로 적지 않는다 */
const 굽는중 = 사이트맵 == null || html.length < (사이트맵 ?? Infinity);

/* 자산이 있나 — 계정이 없어도 **자산은 우리 몫**이다 */
const 채널글 = 있나('docs/3번-채널글-본보기.md');
const 카드뉴스생성기 = 있나('scripts/make-cardnews-100y.mjs');
/**
 * 🔴 **생성기가 있는지가 아니라 장이 몇 장인지를 센다.**
 *   오늘만 다섯 번째다 — 통을 재고 칸을 안 재는 잘못. 「자가 있다」는 카드가 아니다.
 *   ⚠ 근거 json 도 함께 센다. 근거 없는 장은 밖에 못 내보낸다(수를 못 댄다).
 */
let 카드뉴스장 = 0, 카드뉴스벌 = 0, 카드뉴스막힘 = null;
try {
  const 방 = fs.readdirSync(path.join(뿌리, 'public', '100y', 'cardnews'));
  카드뉴스장 = 방.filter((f) => f.endsWith('.png')).length;
  카드뉴스벌 = 방.filter((f) => f.endsWith('.근거.json')).length;
} catch (e) {
  /* ⚠ 까닭을 삼키지 않는다. 방금 이 catch 가 `ROOT is not defined` 를 삼켜
     369장을 만들어 놓고 「0장」이라고 적었다. 빈 catch 는 거짓말을 만든다 */
  카드뉴스막힘 = e.code === 'ENOENT' ? null : e.message;
}
const 숏영상 = 있나('scripts/make-video-100y-jongno.mjs');

/* ───────────────────────── 표로 낸다 ───────────────────────── */

const 줄 = [];
const 적기 = (목적, 물음, 꼴, 값) => 줄.push({ 목적, 물음, 꼴, 값 });

적기('광고수입', '지면이 섰나 (라이브에 나갔나)', 칸판정({ 잰것: html.length, 있어야: 1, 못쟀나: 굽는중 }), `${html.length.toLocaleString()}장`);
적기('광고수입', '사이트맵에 있나', 칸판정({ 잰것: 사이트맵, 있어야: 1, 못쟀나: 굽는중 }), 굽는중 ? '—' : `${사이트맵.toLocaleString()} URL`);
적기('광고수입', 'noindex 가 아닌가 (파는 지면 열림)', 굽는중 ? '못 쟀다' : (noindex <= 200 ? '통과' : '구멍'), 굽는중 ? '—' : `${noindex}장 닫힘`);
/**
 * 🔴 **「구글에 잡혔나」를 둘로 갈랐다** (2026-08-09 16:5x · 2번 「못 쟀다 1 을 닫으라」).
 *
 *   ⛔ 「색인된 장수」는 서치어드바이저 안에서만 보인다 — 그건 계정 몫이다.
 *   ⛔ 구글 검색으로 `site:` 를 쳐서 세지 않는다. `google.com/robots.txt` 가
 *     `Disallow: /search` 다. robots 로 막힌 곳은 우회하지 않는다.
 *   ⭐ 그런데 **「읽었나」는 우리 로그로 잰다.** 우리 서버 로그는 우리 것이다.
 *     그래서 「못 쟀다」가 아니라 **잰 것 + 계정 몫**으로 갈린다.
 */
적기('광고수입', '구글이 **읽었나** (우리 로그)', 구글크롤 == null ? '못 쟀다' : (구글크롤 > 0 ? '통과' : '구멍'),
  구글크롤 == null ? '로그를 못 읽었다' : `6일 ${구글크롤.toLocaleString()}건 · 오늘 ${구글오늘 ?? '?'}건`);
적기('계정 몫', '구글이 **몇 장 담았나**', '계정 몫', '서치어드바이저 안에서만 보인다');
적기('계정 몫', '🔴 네이버가 읽었나', '계정 몫', `6일 ${네이버크롤 ?? '?'}건 · 등록 전 · 우리 준비물은 다 됐다`);

적기('외부유입', 'og 카드가 있나', 칸판정({ 잰것: og.length, 있어야: 1, 못쟀나: 굽는중 }), `${og.length.toLocaleString()}장`);
적기('외부유입', '채널마다 **다른 글**이 있나', 채널글 ? '통과' : '구멍', 채널글 ? 'docs/3번-채널글-본보기.md' : '파일 없음');
/**
 * ⚠ **계정이 걸린 칸은 「계정 몫」이다.** 구멍과 섞으면 **우리가 게을렀는지 안 보인다.**
 *   ⛔ 그렇다고 「없음」으로 지우지 않는다 — 계정이 열리는 날 이게 할 일 목록이 된다.
 *   ⭐ 그래서 남는 「내 몫 구멍」이 진짜 오늘 할 일이다.
 */
적기('계정 몫', '스레드·X·인스타에 나갔나', '계정 몫', '0장 · ⭐ 자산은 준비됨(채널글 본보기)');
/**
 * 🔴 **「만든 것」과 「올라간 것」을 갈라 센다** — 그런데 칸은 하나다.
 *
 *   사장님: *「유튜브 칸을 「준비됐다」로 적지 마라. 문이 있는데 안 쓰는 것이 문이 없는 것보다 나쁘다」*
 *   ⛔ 그래서 만들었다고 통과로 안 바꾼다. **올라가야 통과**다.
 *   ⭐ 다만 값에 오늘 만든 편수를 같이 적는다 — 안 만든 날과 만들고 못 올린 날은 다르다.
 *   ⚠ 올리는 손은 사장님 계정이다. 그래도 이 칸은 **계정 몫으로 안 옮긴다**(사장님 지시).
 */
let 오늘만듦 = 0, 오늘올림 = 0, 영상막힘 = null;
try {
  const 대장 = JSON.parse(fs.readFileSync(path.join(뿌리, 'docs', '3번-영상-대장.json'), 'utf8'));
  오늘만듦 = 대장.영상.filter((v) => v.만든날 === 오늘).length;
  오늘올림 = 대장.영상.filter((v) => v.올린날 === 오늘).length;
} catch (e) { 영상막힘 = e.code === 'ENOENT' ? null : e.message; }
적기('외부유입', '🔴 유튜브에 나갔나 — **우리는 문이 있다**', 오늘올림 > 0 ? '통과' : '구멍',
  영상막힘 ? `못 셌다: ${영상막힘}` : `오늘 올린 것 ${오늘올림}편 · 오늘 만든 것 ${오늘만듦}편`);
/**
 * ⚠ **만들어 놓고 안 올라간 것을 사라지게 두지 않는다.**
 *   위 칸이 초록이 되는 순간 「오늘 만든 2편 중 1편이 그대로 있다」가 안 보인다.
 *   ⛔ 통과 수에 안 넣는다. 사장님 손이 필요한 줄로 따로 세운다.
 */
if (오늘만듦 > 오늘올림) 적기('계정 몫', '만들어 뒀는데 아직 안 올라간 영상', '계정 몫', `${오늘만듦 - 오늘올림}편 · out/ 에 있다`);
적기('외부유입', '카드뉴스가 **몇 장** 있나', 카드뉴스생성기 && 카드뉴스장 > 0 ? '통과' : '구멍',
  카드뉴스장 > 0 ? `${카드뉴스벌}벌 · ${카드뉴스장}장 (근거 ${카드뉴스벌}벌)`
    : (카드뉴스막힘 ? `못 셌다: ${카드뉴스막힘}` : 카드뉴스생성기 ? '생성기는 있는데 0장' : '생성기 없음 · 0장'));
적기('외부유입', '숏영상 만드는 자가 있나', 숏영상 ? '통과' : '구멍', 숏영상 ? 'make-video-100y-jongno.mjs' : '없음');

적기('둘 다', '9,900원이나 KLifeMap 으로 가는 길이 있나', '통과', '/price · 나가는 문 4,850장');

const 층들 = 오늘새지면 == null ? null : [...new Set(오늘새지면.map(층고르기))];
const 층 = 층판정(층들);
적기('🔴 나이', '오늘 만든 것이 **몇 살 손님 것인가**', 층.꼴, 오늘새지면 == null ? '못 쟀다' : `${오늘새지면.length}장 · ${층.말}`);

/** ⚠ 「계정 몫」은 우리 잘못이 아니다. 구멍과 갈라 센다 — 섞으면 우리가 게을렀는지 안 보인다 */
const 셈 = { 통과: 0, 구멍: 0, '못 쟀다': 0, '계정 몫': 0 };
for (const r of 줄) 셈[r.꼴] = (셈[r.꼴] ?? 0) + 1;

console.log('');
console.log(`■ 백년지도 배포 퀴즈 — ${오늘}`);
console.log('');
for (const 목적 of ['광고수입', '외부유입', '둘 다', '계정 몫', '🔴 나이']) {
  const ㄱ = 줄.filter((r) => r.목적 === 목적);
  if (!ㄱ.length) continue;
  console.log(`  [${목적}]`);
  for (const r of ㄱ) {
    const 표 = r.꼴 === '통과' ? '✅' : r.꼴 === '구멍' ? '⛔' : r.꼴 === '계정 몫' ? '🖐' : '⬜';
    console.log(`   ${표} ${r.물음.padEnd(34)} ${r.값}`);
  }
}
console.log('');
console.log(`통과 ${셈.통과} · ⛔ 내 몫 구멍 ${셈.구멍} · 🖐 계정 몫 ${셈['계정 몫']} · ⬜ 못 쟀다 ${셈['못 쟀다']}`);
console.log('');
if (셈.구멍 === 0 && 셈['못 쟀다'] === 0) {
  console.log('✅ 관문 통과 — 오늘 새것을 시작한다');
} else {
  console.log('⛔ **관문 미달 — 오늘은 새 지면을 만들지 않는다.** 위 구멍부터 채운다');
  const 첫구멍 = 줄.find((r) => r.꼴 === '구멍');
  if (첫구멍) console.log(`   제일 먼저 → ${첫구멍.물음}`);
}
console.log('⚠ 이 자는 「했나」만 잰다. 「좋은가」는 사람이 본다');

process.exit(시험실패 || 셈.구멍 ? 1 : 0);
