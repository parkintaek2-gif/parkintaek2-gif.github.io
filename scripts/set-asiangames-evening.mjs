#!/usr/bin/env node
/**
 * set-asiangames-evening.mjs — **18시 [아시안게임 종합] «오늘 경기» 회차를 연다.**
 *
 * 🔴 사장님 지시 (2026-09-25, 원문)
 *   「**오늘, 내일 18시에도 아시안게임종합-오늘경기 기사도 작성하게 해라.**」
 *   이어서: 「**오늘과 내일만**」
 *
 * ⚠ 이것은 사장님이 2026-09-22 에 정하신 「5시가 마지막」과 부딪힌다.
 *   **새 말씀이 이긴다 — 다만 이틀만.** 사장님이 스스로 「오늘과 내일만」이라 하셨다.
 *   ⇒ 거두는 쪽(collect-jbnews-sports-articles.mjs)의 `열여덟시여는날` 이 그 선을 쥔다.
 *     9/27 부터는 자가 저절로 옛 규칙으로 돌아간다. **사람이 기억해서 되돌리지 않는다.**
 *
 * ⭐ 새 예약을 만들지 않는다 — 2026-09-22 에 그만둔 17시 예약이 살아 있다.
 *   그 지침만 「오늘 경기 종합」으로 바꿔 이틀 빌려 쓴다.
 *   ⛔ 예약 시각(17시)은 그대로 둔다. 18시에 도는 것은 5번이 「지금 실행」으로 누른다 —
 *     예약 시각을 고치면 이틀 뒤 되돌릴 일이 하나 더 생긴다.
 *
 * 쓰는 법
 *   node scripts/set-asiangames-evening.mjs --시험
 *   node scripts/set-asiangames-evening.mjs --적는다
 *   node scripts/set-asiangames-evening.mjs --자가시험
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const 조직 = '953d4e54-f96e-4d6d-b33e-33311fbd09ad';
export const 저녁회차 = 'trig_01J9heFLe6AvUJtgd6LXSxsN';   /* 그만둔 17시 예약 — 이틀만 빌린다 */

export const 자국 = '[아시안게임 종합] 오늘 경기';

export const 지침 = `## 중부매일 스포츠 자동기사 — 18시 배송 · ${자국}

🔴 사장님 지시 (2026-09-25): 「오늘, 내일 18시에도 아시안게임종합-오늘경기 기사도 작성하게 해라」 · 「오늘과 내일만」

당신은 중부매일 스포츠부 기자입니다. 이 회차에 **기사 1건**을 씁니다.

### 0. 오늘 낼 날인가
- 🔴 이 회차는 **2026-09-25(금)·2026-09-26(토) 이틀만** 돕니다. 그 이틀에는 공휴일·주말이어도 씁니다.
- ⛔ "주말이라 쉰다"·"공휴일이라 쉰다"로 회차를 마치지 않습니다.

### 1. 이 회차가 맡은 것 — «오늘» 끝난 경기
- 제목 맨 앞에 **[아시안게임 종합]** 을 붙입니다.
- **오늘 낮부터 이 회차가 도는 시각까지 «끝난» 경기**를 한 편으로 묶습니다.
  - ⛔ 아침 09시 회차가 이미 낸 «어제 경기»를 다시 쓰지 않습니다. 같은 기사가 두 번 나갑니다.
  - ⛔ 아직 안 끝난 경기는 결과로 쓰지 않습니다. 예고도 쓰지 않습니다 — 이 회차는 «결과» 기사입니다.
- 한국 선수단의 메달·경기 결과가 먼저입니다. 「누가 무엇을 땄나」가 첫 문단에 옵니다.
- 오늘 끝난 경기가 하나도 없으면 **기사를 쓰지 않습니다.** "무엇을 찾았고 무엇이 없었는지"만 적습니다.

### 2. 🔴 사실부터 확보한다 — 기억으로 쓰지 않는다
- 반드시 **웹 검색**으로 오늘 실제 경기를 찾습니다.
- 🔴 **공식 결과 사이트가 1차 자료입니다** — 사장님이 직접 주신 곳입니다:
  **https://results.asiangames2026.org/#/medals/standings**
  - 메달 집계와 순위는 여기 값이 정본입니다. 언론 기사보다 앞섭니다.
  - 자바스크립트로 그리는 지면이라 검색 결과만 보고 베끼지 말고 **직접 열어서** 봅니다.
- 확인할 것: 경기 날짜·종목·선수·기록·순위. **추정해서 쓰지 않습니다.** 하나만 틀려도 정정보도입니다.
- 본문에 «경기가 열린 날»을 반드시 적습니다 — 「25일(한국시간)」처럼.
- 한국 순위·메달 수를 적을 때는 **몇 시 기준인지** 함께 적습니다. 집계는 경기가 끝날 때마다 바뀝니다.

### 3. ⭐ 충청권 선수는 그 자리에서 밝힌다 — 사장님 지시 (2026-09-22)
「아시안게임은 선수 출신지, 소속팀이 충청권이면 명기를 해줘」
- 메달을 땄거나 활약한 선수의 **출신지**(고향·출신 학교)나 소속팀이 충청권이면
  본문에 그대로 적습니다 — 「대전 출신」·「충북 청주 OO고 졸업」·「소속 한화 이글스(대전)」처럼.
- 충청권 선수가 메달을 땄으면 **제목이나 부제에 올립니다.**
- ⛔ 출신지·소속팀을 짐작해서 쓰지 않습니다. 웹 검색으로 «확인한 것»만 적습니다.

### 4. 제목 — 🔴 제목 줄을 «반드시» 쓴다
- **글의 맨 처음 두 줄**을 이렇게 씁니다.
  첫 줄 「제목: [아시안게임 종합] 여서정 도마 금메달…한국 금 12개」
  둘째 줄 「부제: 제천시청 소속, 8년 만에 정상 탈환」
- ⛔ 「부제」만 쓰고 제목을 빠뜨리지 않습니다. 제목이 없으면 그 회차는 보내지지 않습니다.
- 핵심 키워드(대개 **선수 이름**)를 **앞쪽에** 둡니다. 32자 안쪽.

### 5. 🔴 SEO — 사람이 «검색해서» 찾아오게 쓴다
- 사람들이 실제로 검색창에 치는 말을 씁니다: **선수 이름 · 종목 이름 · 대회 이름 · 나라**.
- **첫 문단 두 문장 안**에 제목의 핵심 키워드를 다시 씁니다.
- 소제목을 **둘 이상** 둡니다 — 검색엔진은 문단 구조를 읽습니다.
- ⛔ 같은 말을 억지로 되풀이하지 않습니다. 읽는 사람이 먼저입니다.

### 6. 끝에 이 표를 붙인다

\`\`\`
■ 18시 회차
  낸 기사    1 / 1   (또는 0 / 1)
  제목       ...
  고른 키워드  ..., ..., ...   (3~5개)
  근거 링크   n 개
  못 쓴 까닭  (0건일 때만)
\`\`\`
`;

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; const 실패 = [];
  const 본다 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패.push(이름); console.log('❌ ' + 이름); } };

  본다('제목 머리를 못박는다', 지침.includes('[아시안게임 종합]'));
  본다('🔴 «오늘» 끝난 경기를 맡는다', 지침.includes('오늘 낮부터 이 회차가 도는 시각까지 «끝난» 경기'));
  본다('⛔ 아침 회차와 겹치지 말라고 적는다', 지침.includes('어제 경기»를 다시 쓰지 않습니다'));
  본다('⛔ 예고를 쓰지 말라고 적는다', 지침.includes('예고도 쓰지 않습니다'));
  본다('🔴 이틀만이라고 못박는다', 지침.includes('2026-09-25(금)·2026-09-26(토) 이틀만'));
  본다('⛔ 공휴일이라 쉰다를 막는다', 지침.includes('"공휴일이라 쉰다"로 회차를 마치지 않습니다'));
  본다('공식 결과 사이트를 1차 자료로 쓴다', 지침.includes('results.asiangames2026.org'));
  본다('⭐ 충청권 규칙이 들어 있다', 지침.includes('충청권'));
  본다('제목 줄을 반드시 쓰라고 적는다', 지침.includes('제목 줄을 «반드시» 쓴다'));
  본다('SEO 칸이 있다', 지침.includes('사람이 «검색해서» 찾아오게 쓴다'));
  본다('끝 표가 있다', 지침.includes('■ 18시 회차'));
  본다('⛔ 추정을 막는다', 지침.includes('추정해서 쓰지 않습니다'));
  본다('경기 날짜를 적으라 한다', 지침.includes('경기가 열린 날»를 반드시 적습니다') || 지침.includes('«경기가 열린 날»을 반드시 적습니다'));
  본다('자국이 지침 안에 있다', 지침.includes(자국));
  본다('빌려 쓰는 예약이 그만둔 17시 것이다', /^trig_/.test(저녁회차));
  본다('조직 열쇠가 서른여섯 자다', 조직.length === 36);

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
    await page.goto(`https://claude.ai/scheduled-task/${저녁회차}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await new Promise((r) => setTimeout(r, 3000));

    const 받은 = await page.evaluate(async (조직2, trig) => {
      const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${trig}`, { headers: { accept: 'application/json' } });
      return { 상태: res.status, 글: await res.text() };
    }, 조직, 저녁회차);
    if (받은.상태 !== 200) { console.log(`🔴 못 읽었다 (${받은.상태})`); process.exit(1); }
    const 트리거 = JSON.parse(받은.글).trigger;
    console.log(`■ 빌려 쓸 회차 — 「${트리거.name}」 (지금 ${String(트리거.derived_state?.prompt || '').length}자)`);

    if (String(트리거.derived_state?.prompt || '').includes(자국)) {
      console.log('⬜ 그대로 — 이미 들어 있다'); process.exit(0);
    }
    if (!적는다) { console.log(`🟡 고칠 것이 있다 (→ ${지침.length}자). --적는다 로 써넣는다`); process.exit(0); }

    const 새이름 = '스포츠 18시 — 아시안게임 종합(오늘 경기) · 9/25~26만';
    const 답 = await page.evaluate(async (조직2, trig, prompt, name) => {
      const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${trig}`, {
        method: 'PATCH',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, name }),
      });
      return { 상태: res.status, 글: (await res.text()).slice(0, 300) };
    }, 조직, 저녁회차, 지침, 새이름);
    if (답.상태 !== 200) { console.log(`🔴 못 썼다 (${답.상태}) ${답.글.replace(/\s+/g, ' ')}`); process.exit(1); }

    const 다시 = await page.evaluate(async (조직2, trig) => {
      const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${trig}`, { headers: { accept: 'application/json' } });
      return await res.text();
    }, 조직, 저녁회차);
    const t2 = JSON.parse(다시).trigger;
    const 세자리 = [
      t2.derived_state?.prompt,
      t2.session_request?.events?.[1]?.payload?.internal_anthropic_catchall?.message?.content,
      t2.job_config?.ccr?.events?.[1]?.data?.message?.content,
    ];
    const 든가 = 세자리.every((s) => String(s || '').includes(자국)) && t2.name === 새이름;
    console.log(`${든가 ? '✅ 들어갔다' : '🔴 썼다는데 안 들어 있다'} — 이름 「${t2.name}」`);
    process.exitCode = 든가 ? 0 : 1;
  } finally { await page.close(); b.disconnect(); }
}
