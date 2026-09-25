#!/usr/bin/env node
/**
 * set-asiangames-weekend.mjs — **[아시안게임 종합] 09시 회차가 이번 주말에도 쓰게 한다.**
 *
 * 🔴 사장님 지시 (2026-09-25 10:5x, 원문)
 *   「**그리고 오늘 휴일이지만 이번주는 일요일까지 [아시안게임 종합] 기사를 오전 9시에
 *     전날 경기결과를 갖고 써줘. 오늘은 시간이 늦었으니 오전 경기결과가 있었으면
 *     그것까지 포함해서 11시 정도에 기사를 작성하라고 지시해**」
 *
 * ── 무엇이 막고 있었나 (화면을 떠서 실측) ─────────────────────────────
 *   지침 0번   「토·일이면 멈추고 "주말이라 쉰다"만 답한다」
 *              「한국 공휴일이면 멈추고 "공휴일이라 쉰다"만 답한다」
 *   반복        「평일 오전 9:00」 → **다음 실행이 9월 28일(월)** 이었다
 *   ⇒ 오늘(추석)도 26(토)·27(일)도 한 편도 안 나온다. 사장님이 「일요일까지」라 하셨는데.
 *
 * ── 왜 화면에서 손으로 안 고치나 ─────────────────────────────────────
 *   제목 옆 연필(✏)은 **보기 전용 창**이다 — 지침이 뜨지만 고칠 수가 없다(오늘 열어 봤다).
 *   고치는 길은 이 지면이 부르는 API 하나뿐이다. set-jbnews-sports-prompt.mjs 가
 *   그 길을 이미 실측해 두었다 — 여기서도 같은 길을 쓴다.
 *     PATCH /api/organizations/<조직>/cowork/scheduled_tasks/<trig>   { prompt }
 *   ⭐ `prompt` 한 칸만 보내면 서버가 세 자리를 다 맞춘다.
 *
 * ⛔ 사장님 크롬 창을 닫지 않는다 — disconnect() 만. 언제나 새 탭.
 * ✅ 두 번 돌려도 안전하다 — 이미 들어 있으면 안 건드린다.
 * ⚠ 이 자는 **지침만** 고친다. 반복 주기(평일→매일)는 화면에서 따로 본다.
 *
 * 쓰는 법
 *   node scripts/set-asiangames-weekend.mjs --시험      무엇이 바뀌는지만 본다
 *   node scripts/set-asiangames-weekend.mjs --적는다    실제로 써넣는다
 *   node scripts/set-asiangames-weekend.mjs --자가시험
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const 조직 = '953d4e54-f96e-4d6d-b33e-33311fbd09ad';
export const 아홉시 = 'trig_01GeyrdjqmGjtu3cCt6ynZHm';

/** 이 손질이 들어갔는지 알아보는 자국 — 두 번 돌려도 안전하게 하는 열쇠다 */
export const 자국 = '2026-09-27(일)까지는 토·일·공휴일에도';

export const 옛0번 = `### 0. 오늘 낼 날인가
- 토·일이면 여기서 멈추고 "주말이라 쉰다"만 답한다.
- 한국 공휴일이면 멈추고 "공휴일이라 쉰다"만 답한다. 공휴일인지 모르면 검색해서 확인한다.`;

export const 새0번 = `### 0. 오늘 낼 날인가

🔴 사장님 지시 (2026-09-25): 「오늘 휴일이지만 이번주는 일요일까지 [아시안게임 종합] 기사를 오전 9시에 전날 경기결과를 갖고 써줘」

- 🔴 ${자국} «반드시» 쓴다. 그 사이에는 아래 두 줄이 걸리지 않는다.
  - ⛔ "주말이라 쉰다"·"공휴일이라 쉰다"로 회차를 마치지 않는다. 아시안게임은 주말에 더 많이 열린다.
- 2026-09-28(월)부터는 아래대로 돌아간다.
  - 토·일이면 여기서 멈추고 "주말이라 쉰다"만 답한다.
  - 한국 공휴일이면 멈추고 "공휴일이라 쉰다"만 답한다. 공휴일인지 모르면 검색해서 확인한다.

### 0-1. 🔴 제목 머리는 「[아시안게임 종합]」이다
- 제목 맨 앞에 [아시안게임 종합] 을 붙인다. 사장님이 그 이름으로 찾으신다.
- 그 뒤에 그날 가장 관심을 끄는 소재를 둔다 — 선수 이름을 앞쪽에.

### 0-2. 🔴 무엇까지 담나 — 전날 밤부터 이 회차가 도는 시각까지
- 기본은 전날 경기 결과다.
- 이 회차가 도는 시각까지 오늘 오전에 이미 끝난 경기가 있으면 그것도 함께 담는다.
  (사장님: 「오전 경기결과가 있었으면 그것까지 포함해서」)
- 아직 안 끝난 경기는 결과로 쓰지 않는다. 이 회차는 «결과» 기사다.`;

/** 프롬프트를 고친다 → {글, 바뀌었나, 까닭} */
export function 고치기(옛글) {
  const s = String(옛글 ?? '');
  if (!s) return { 글: s, 바뀌었나: false, 까닭: '빈 글이다' };
  if (s.includes(자국)) return { 글: s, 바뀌었나: false, 까닭: '이미 들어 있다' };
  if (!s.includes(옛0번)) return { 글: s, 바뀌었나: false, 까닭: '옛 0번 절을 못 찾았다 — 지침이 바뀌었나 보다' };
  return { 글: s.replace(옛0번, 새0번), 바뀌었나: true, 까닭: '주말·공휴일 멈춤을 이번 주말만 푼다' };
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; const 실패 = [];
  const 본다 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패.push(이름); console.log('❌ ' + 이름); } };

  const 보기 = `## 머리\n\n${옛0번}\n\n### 1. 이 회차가 맡은 것\n아시안게임 종합`;
  const r = 고치기(보기);
  본다('옛 0번 절을 찾아 바꾼다', r.바뀌었나 === true);
  본다('자국이 들어간다', r.글.includes(자국));
  본다('🔴 월요일부터는 옛 규칙이 살아 있다', r.글.includes('2026-09-28(월)부터는'));
  본다('⛔ 뒤의 다른 절을 안 건드린다', r.글.includes('### 1. 이 회차가 맡은 것'));
  본다('제목 머리 규칙이 들어간다', r.글.includes('[아시안게임 종합]'));
  본다('오늘 오전 경기까지 담으라고 적는다', r.글.includes('오늘 오전에 이미 끝난 경기'));

  const 두번 = 고치기(r.글);
  본다('⭐ 두 번 돌려도 안전하다', 두번.바뀌었나 === false && 두번.글 === r.글);
  본다('두 번째는 까닭을 말한다', 두번.까닭 === '이미 들어 있다');

  본다('⛔ 빈 글에 안 터진다', 고치기('').바뀌었나 === false && 고치기(null).바뀌었나 === false);
  본다('⛔ 옛 절이 없으면 손대지 않는다', 고치기('아무 지침').바뀌었나 === false);
  본다('옛 절이 없으면 글을 그대로 돌려준다', 고치기('아무 지침').글 === '아무 지침');
  본다('조직 열쇠가 서른여섯 자다', 조직.length === 36);
  본다('09시 회차 열쇠가 trig_ 로 시작한다', /^trig_[A-Za-z0-9]+$/.test(아홉시));

  console.log(`\n${실패.length ? '❌' : '✅'} 자가시험 ${통과}${실패.length ? ' · 실패 ' + 실패.length : ' 통과'}`);
  return !실패.length;
}

const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && process.argv.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
} else if (내가진입점) {
  const 적는다 = process.argv.includes('--적는다');
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await b.newPage();
  try {
    await page.goto(`https://claude.ai/scheduled-task/${아홉시}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await new Promise((r) => setTimeout(r, 3000));

    const 받은 = await page.evaluate(async (조직2, trig) => {
      const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${trig}`, { headers: { accept: 'application/json' } });
      return { 상태: res.status, 글: await res.text() };
    }, 조직, 아홉시);
    if (받은.상태 !== 200) { console.log(`🔴 못 읽었다 (${받은.상태})`); process.exit(1); }

    const 트리거 = JSON.parse(받은.글).trigger;
    console.log(`■ 회차 이름 — 「${트리거.name}」`);
    const 옛글 = 트리거.derived_state?.prompt;
    if (typeof 옛글 !== 'string' || !옛글) { console.log('🔴 프롬프트 자리를 못 찾았다'); process.exit(1); }

    const r = 고치기(옛글);
    if (!r.바뀌었나) { console.log(`⬜ 그대로 — ${r.까닭}`); process.exit(0); }
    if (!적는다) {
      console.log(`🟡 고칠 것이 있다 (${옛글.length} → ${r.글.length}자) — ${r.까닭}`);
      console.log('   --적는다 로 써넣는다');
      process.exit(0);
    }

    const 답 = await page.evaluate(async (조직2, trig, prompt) => {
      const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${trig}`, {
        method: 'PATCH',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      return { 상태: res.status, 글: (await res.text()).slice(0, 300) };
    }, 조직, 아홉시, r.글);
    if (답.상태 !== 200) { console.log(`🔴 못 썼다 (${답.상태}) ${답.글.replace(/\s+/g, ' ')}`); process.exit(1); }

    /* ⭐ 「썼다」를 「들어갔다」로 읽지 않는다 — 세 자리를 다시 읽어 본다 */
    const 다시 = await page.evaluate(async (조직2, trig) => {
      const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${trig}`, { headers: { accept: 'application/json' } });
      return await res.text();
    }, 조직, 아홉시);
    const t2 = JSON.parse(다시).trigger;
    const 세자리 = [
      t2.derived_state?.prompt,
      t2.session_request?.events?.[1]?.payload?.internal_anthropic_catchall?.message?.content,
      t2.job_config?.ccr?.events?.[1]?.data?.message?.content,
    ];
    const 든가 = 세자리.every((s) => String(s || '').includes(자국));
    console.log(`${든가 ? '✅ 들어갔다' : '🔴 썼다는데 안 들어 있다'} — 세 자리 가운데 `
      + 세자리.filter((s) => String(s || '').includes(자국)).length + '곳');
    process.exitCode = 든가 ? 0 : 1;
  } finally { await page.close(); b.disconnect(); }
}
