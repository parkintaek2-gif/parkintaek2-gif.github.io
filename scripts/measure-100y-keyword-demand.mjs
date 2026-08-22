#!/usr/bin/env node
/**
 * measure-100y-keyword-demand.mjs — **백년지도 지면 이름을 짐작으로 정하지 않는다. 재고 정한다.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님(2026-08-22) — 「검색량이 많은지를 재서 키워드를 반영해서 콘텐트를 만들어야
 * 사람들이 더 찾겠지… 온 사람들한테는 잊지 못할 콘텐트와 커뮤니티를 주면 계속 재방문하겠지?」
 *
 * 5번이 같은 지시를 받아 `scripts/measure-keyword-demand.mjs` 를 먼저 만들었다(영문 K-pop
 * 후보). 그 자의 방식(Google 자동완성 = «흔적», 위키 읽힘 = «관심», 「검색량」이라 안 부름)을
 * 그대로 따르되, **한국어 질의**를 잰다는 것 때문에 새로 짓는다 —
 *
 * 🔴 **한국어 질의에서 5번 자의 인코딩이 깨진다.** Google Suggest 는 `hl=ko` 로 물으면
 *   **EUC-KR** 로 응답한다(firefox 클라이언트의 옛 습성). 5번 자는 `r.json()`(UTF-8 가정)을
 *   써서 한글이 들어오면 자모가 깨진 채로 비교된다 — 영어만 잰 5번 자는 이 버그를 안 만난다.
 *   그래서 그 자를 고치지 않고(작업 중일 수 있어 손 안 댄다 — docs/세션간-메모.md 에 짚어 알림),
 *   **charset 을 읽어 맞게 푸는** 이 자를 새로 짓는다.
 *
 * ⛔ 「검색량」이라고 부르지 않는다 — 유료 검색량 자료가 없다. 자동완성에 뜨는 것은
 *   «사람이 그 말을 치고 있다는 흔적»이지 몇 명인지가 아니다.
 * ⛔ 막혀서 못 물은 것을 0 으로 적지 않는다 — `물음실패` 로 따로 센다.
 *
 * 쓰는 법
 *   node scripts/measure-100y-keyword-demand.mjs --자가시험
 *   node scripts/measure-100y-keyword-demand.mjs            (기본 후보를 잰다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼곳 = path.join(뿌리, 'src/data/100yearmap-keyword-demand.json');
const 머리말 = { 'User-Agent': '100yearmap.com research (contact: parkintaek2@gmail.com)' };
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

/** ⛔ charset 을 응답 헤더에서 읽어 그대로 푼다 — EUC-KR 이면 EUC-KR 로, 아니면 UTF-8 로 */
export function 인코딩뽑기(콘텐트타입) {
  const m = /charset=([\w-]+)/i.exec(콘텐트타입 ?? '');
  return m ? m[1].toLowerCase() : 'utf-8';
}

/**
 * 한국어 자동완성을 묻는다. 돌려주는 것은 제안 줄들(제대로 푼 한글).
 * ⛔ 못 물으면 `undefined` 다 — 빈 배열(=제안 없음)과 다르다.
 */
export async function 자동완성(말, 부르기 = fetch) {
  const u = 'https://suggestqueries.google.com/complete/search?client=firefox&hl=ko&q=' + encodeURIComponent(말);
  for (let i = 0; i < 3; i++) {
    try {
      const r = await 부르기(u, { headers: 머리말 });
      if (r.ok) {
        const 인코딩 = 인코딩뽑기(r.headers?.get?.('content-type'));
        const buf = await r.arrayBuffer();
        const 글 = new TextDecoder(인코딩).decode(buf);
        const j = JSON.parse(글);
        return Array.isArray(j?.[1]) ? j[1] : [];
      }
      if (r.status !== 429 && r.status < 500) return undefined;
    } catch { /* 되묻는다 */ }
    await 쉼(700 * (i + 1));
  }
  return undefined;
}

/** 제안 줄들에서 그 말이 어떻게 서 있나 — 있나 · 몇 번째 · 그 말로 시작하는 줄 수 */
export function 자리재기(말, 제안들) {
  if (제안들 === undefined) return { 물음실패: true };
  const 줄 = 제안들.map((s) => String(s));
  const 딱 = 줄.indexOf(말);
  return {
    물음실패: false,
    제안수: 줄.length,
    그대로있나: 딱 >= 0,
    몇번째: 딱 >= 0 ? 딱 + 1 : null,
    그말로시작: 줄.filter((s) => s.startsWith(말)).length,
    보기: 제안들.slice(0, 5),
  };
}

/**
 * 재 볼 말 — **우리가 쓴 지면 제목**과 **손님이 칠 만한 말**을 같이 넣어 견준다.
 * ⛔ 지어내지 않는다 — 실제 지면(marriage-age·home·spending·pets·travel·promotion)의
 *   H1·title 문구와, 그 옆에 놓을 만한 더 짧고 흔한 말을 짝지었다.
 */
export const 후보 = [
  /* 우리 지면 제목 그대로 */
  '반려동물 기르는 비율', '국내여행 평균 며칠', '승진 만족도',
  '서른 살에 결혼했을까', '평균 초혼 연령',
  /* 손님이 더 짧게 칠 만한 말 */
  '반려동물 키우는 비율', '결혼 적령기', '몇살에 결혼하나', '평균 결혼 나이',
  '국내여행 몇번', '연차 평균 며칠', '반려동물 유기 이유', '승진 못하는 이유',
  '30대 미혼 비율', '집 가진 나이', '첫 취업 나이',
];

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('① EUC-KR 을 뽑는다', 인코딩뽑기('text/javascript; charset=EUC-KR') === 'euc-kr');
  검('② charset 이 없으면 utf-8 로 본다', 인코딩뽑기('text/javascript') === 'utf-8');
  검('③ 대소문자를 안 가린다', 인코딩뽑기('text/javascript; CHARSET=UTF-8') === 'utf-8');

  const 가짜배열 = (arr, ok = true, ct = 'text/javascript; charset=UTF-8') => async () => ({
    ok, headers: { get: () => ct }, arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(['말', arr])).buffer,
  });
  const 제안 = await 자동완성('반려동물 키우는 비율', 가짜배열(['반려동물 키우는 비율', '반려동물 키우는 비율 2025', '반려동물 유기 이유']));
  검('④ 제안 줄을 뽑는다(한글 그대로)', Array.isArray(제안) && 제안[0] === '반려동물 키우는 비율');

  const r = 자리재기('반려동물 키우는 비율', 제안);
  검('⑤ 그대로 있는 것을 안다', r.그대로있나 === true && r.몇번째 === 1);
  검('⑥ 그 말로 시작하는 줄을 센다', r.그말로시작 === 2);
  검('⑦ 없는 말은 없다고 한다', 자리재기('아무말', 제안).그대로있나 === false);
  검('⑧ ⛔ 못 물은 것을 0 으로 안 적는다', 자리재기('x', undefined).물음실패 === true);

  const 없음 = await 자동완성('x', 가짜배열([], false));
  검('⑨ 막히면 undefined 다', 없음 === undefined);

  const 실제 = await 자동완성('반려동물 키우는 비율');
  검('⑩ 🔴 실제 한글 응답도 안 깨진다(EUC-KR 실측)', Array.isArray(실제) && 실제.every((s) => !/[�-ÿ]{2,}/.test(s)));

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log(`✅ measure-100y-keyword-demand 자가시험 통과 (10)`);
  process.exit(0);
}

/* ── 실제로 잰다 ─────────────────────────────────────────── */
/* 🔴 다른 자(measure-100y-culture-retry.mjs 등)가 이 파일의 자동완성()·자리재기() 만
   빌려 쓰려고 import 했는데, 이 가드가 없어서 매번 15개 후보를 다시 다 재는 부작용이
   있었다(2026-08-22 발견) — 「내가 직접 불렸나」로 감싸 막는다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'measure-100y-keyword-demand.mjs';
if (내가직접불렸나) {
  const 잰것 = [];
  for (const 말 of 후보) {
    const r = 자리재기(말, await 자동완성(말));
    잰것.push({ 말, ...r });
    const 표 = r.물음실패 ? '못 물었다'
      : `${r.그대로있나 ? `있다(${r.몇번째}번째)` : '없다'} · 그 말로 시작 ${r.그말로시작}줄 · 보기: ${(r.보기 ?? []).slice(0, 3).join(' / ')}`;
    console.log(`  ${말.padEnd(20)} ${표}`);
    await 쉼(400);
  }

  fs.writeFileSync(낼곳, JSON.stringify({
    generated: new Date().toISOString(),
    whatThisIs: 'Korean Google Suggest autocomplete presence (client=firefox&hl=ko, EUC-KR decoded). A trace that someone types this phrase — not a volume figure.',
    whatThisIsNot: '월간 검색량이 아니다. 유료 키워드 자료가 없다. 자동완성에 뜨는 것은 흔적이지 몇 명인지가 아니다.',
    phrases: 잰것,
  }, null, 1));
  console.log(`\n냈다 — ${path.relative(뿌리, 낼곳)}`);
}
