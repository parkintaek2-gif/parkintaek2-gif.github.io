#!/usr/bin/env node
/**
 * 경쟁사-다시오는까닭.mjs — 「왜 인기가 있나」를 잰다
 * ─────────────────────────────────────────────────────────────────────────────
 * 사장님 (2026-09-24):
 *   「케이라이프맵이 사람들에게 인기있는 사이트가 돼 비즈니스가 활성화하긴 방안을…」
 *   「**큰 문제를 제기했는데 이렇게 쉽게 답을 하느냐**」
 *
 * ⛔ 내가 낸 답이 얕았다 — 값 표시·링크 수·색인 같은 «손질»이었다.
 *   그건 「새는 것을 막는 일」이지 「사람이 오고 다시 오는 까닭」이 아니다.
 *
 * ⭐ 그래서 물음을 바꾼다 —
 *   「그들은 지면이 몇 장인가」가 아니라 **「사람이 왜 다시 오는가」**.
 *
 * [무엇을 재나]
 *   ① 다시 올 까닭     날마다 바뀌는 것이 있나 · 알림 · 저장 · 친구와 견주기
 *   ② 값 없이 얼마나   로그인 없이 결과를 어디까지 주나
 *   ③ 남기는 장치      계정·앱·구독·메일
 *   ④ 사람을 «데려오는» 장치  공유·친구 초대·결과 이미지
 *   ⑤ 우리만 가진 것   견줘서 «없는 것»을 찾는다
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const 볼곳 = [
  { 이름: 'Astro.com', 주소: 'https://www.astro.com/' },
  { 이름: 'Cafe Astrology', 주소: 'https://cafeastrology.com/' },
  { 이름: 'Co-Star', 주소: 'https://www.costarastrology.com/' },
  { 이름: '占いTV', 주소: 'https://uranai.nosv.org/' },
  { 이름: '★ KLifeMap(우리)', 주소: 'https://klifemap.ai/' },
];

/* 「다시 올 까닭」을 만드는 장치들 — 글자로 찾는다.
   ⚠ 이것은 «있나 없나»만 재는 거친 자다. 있다고 잘 되는 것도 아니다.
     다만 «우리에게 없는 것»을 찾는 데는 쓸 만하다. */
export const 장치 = [
  ['날마다 바뀜', /daily|today|오늘의|每日|今日|きょう|todays?\s*horoscope/i],
  ['알림·구독', /notification|subscribe|newsletter|알림|구독|メール|訂閱/i],
  ['저장·내 차트', /save|my\s*(chart|profile|page)|저장|내\s*(차트|사주|정보)|マイ/i],
  ['친구와 견주기', /synastry|compatib|friends?|궁합|상성|相性|match/i],
  ['공유', /share|공유|シェア|twitter|facebook|instagram|kakao/i],
  ['앱', /app\s*store|google\s*play|앱\s*다운|ダウンロード|download\s*the\s*app/i],
  ['커뮤니티·글', /forum|community|articles?|blog|읽을거리|コラム/i],
  ['무료 계산기', /free\s*(chart|calculator|reading)|무료\s*(계산|분석)|無料/i],
];

async function 받다(주소) {
  const r = await fetch(주소, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
  return { 상태: r.status, 글: await r.text() };
}

export function 장치찾기(html) {
  const 몸 = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  const 있는것 = [];
  for (const [이름, 무늬] of 장치) if (무늬.test(몸)) 있는것.push(이름);
  return 있는것;
}

/* ── 실행 ──────────────────────────────────────────────────────────────── */
const 이파일로실행 = process.argv[1] && process.argv[1].includes('다시오는까닭');
if (이파일로실행) {
  console.log('■ 「왜 인기가 있나」 — 다시 올 까닭을 만드는 장치를 센다');
  console.log('  사장님: 「큰 문제를 제기했는데 이렇게 쉽게 답을 하느냐」');
  console.log('  ⛔ 지면 수·링크 수가 아니라 «사람이 왜 다시 오는가»를 본다\n');

  const 결과 = [];
  for (const s of 볼곳) {
    try {
      const { 상태, 글 } = await 받다(s.주소);
      const 있는것 = 장치찾기(글);
      결과.push({ ...s, 상태, 있는것 });
      console.log(`  ${s.이름.padEnd(20)} ${상태}  ${있는것.join(' · ') || '(못 찾음)'}`);
    } catch (e) {
      결과.push({ ...s, 오류: String(e.message || e).slice(0, 40) });
      console.log(`  ${s.이름.padEnd(20)} 🔴 ${String(e.message || e).slice(0, 40)}`);
    }
    await new Promise((r) => setTimeout(r, 900));
  }

  /* 우리에게 «없는» 것 */
  const 우리 = 결과.find((r) => r.이름.includes('KLifeMap'));
  const 남들 = 결과.filter((r) => !r.이름.includes('KLifeMap') && r.있는것);
  console.log('\n── 🔴 남들은 있고 «우리는 없는» 것 ──');
  const 없는것 = [];
  for (const [이름] of 장치) {
    const 남이가짐 = 남들.filter((r) => r.있는것.includes(이름)).length;
    const 우리가짐 = 우리 && 우리.있는것 && 우리.있는것.includes(이름);
    if (남이가짐 >= 2 && !우리가짐) { 없는것.push(이름); console.log(`  ⛔ ${이름.padEnd(14)} 남 ${남이가짐}곳이 갖고 있다`); }
  }
  if (!없는것.length) console.log('  (없다 — 장치로는 밀리지 않는다. 그러면 까닭은 다른 데 있다)');

  console.log('\n── ⭐ 우리만 가진 것 (견주기용 · 손으로 적은 것) ──');
  console.log('  · 고전 원전 173대목을 «실제로 읽는» 상담 — 경쟁사 어디에도 없다');
  console.log('  · 명리 + 점성 둘 다 한 곳에서 — 대부분 하나만 한다');
  console.log('  · 네 나라말 — Astro.com 은 여럿, 한국 사이트는 한국어뿐');
  console.log('  ⚠ 이 줄은 «잰 것»이 아니라 내가 아는 것이다. 수로 바꿀 자리를 찾아야 한다');
}
