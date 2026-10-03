#!/usr/bin/env node
/**
 * set-asiangames-night.mjs — **결승이 끝난 뒤 기사 «둘»을 중부매일 계정에 시킨다.**
 *
 * 🔴 사장님 지시 (2026-10-03, 원문)
 *   「**오늘 아시안게임 축구 결승전이 사실상 마지막 게임이다.**」
 *   「**2. 축구 결승전이 끝나면 두 개 기사를 써**
 *    **(1) 축구 결승전 결과**
 *    **(2) 이번 아시안게임 우리나라 경기 종합을 〈전체 순위. 첫 금메달. 주요 금메달 순간.〉을 중심으로 써라.**」
 *   「**축구는 19시 30분 킥오프**」
 *
 * 🔴🔴 사장님 지적 (2026-10-03 18시대)
 *   「**[중부매일 스포츠부 기자] , ** 대체 이런 내용이 왜 들어가나?
 *    중부매일 데스킹 v7을 거치면 있을 수 없는 일이아.
 *    너희 맘대로 일하지 말고 지시대로 중부매일계정에 시켜. 아니면 데스킹 v7을 거치던지.**」
 *
 *   까닭을 재 보니 — 사장님이 **2026-09-28 에 이미** 「`*` 등 심볼 쓰지마」·「기자이름은
 *   박인택으로 통일」을 못 박으셨고, 그 규칙은 `set-jbnews-sports-prompt.mjs` 의
 *   **형식칸**에 들어 있다. 그런데 그것이 «낮 회차 지침»에만 붙어 있었고
 *   이틀만 빌려 쓰는 저녁 회차에는 안 붙었다.
 *   ⇒ 이 자는 **형식칸을 그 파일에서 그대로 가져다 붙인다.** 여기에 다시 적지 않는다 —
 *     두 곳에 적으면 한 곳만 고쳐져 또 어긋난다.
 *
 * ⭐ 새 예약을 만들지 않는다. 2026-09-22 에 그만둔 17시 예약을 빌려 쓴다.
 *   한 번에 한 편씩 시킨다 — 거두는 자가 회차마다 «마지막 답» 하나를 읽기 때문이다.
 *
 * 쓰는 법
 *   node scripts/set-asiangames-night.mjs 결승            # 재보기만
 *   node scripts/set-asiangames-night.mjs 결승 --적는다
 *   node scripts/set-asiangames-night.mjs 종합 --적는다
 *   node scripts/set-asiangames-night.mjs --자가시험
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { 형식칸 } from './set-jbnews-sports-prompt.mjs';

export const 조직 = '953d4e54-f96e-4d6d-b33e-33311fbd09ad';
export const 밤회차예약 = 'trig_01J9heFLe6AvUJtgd6LXSxsN';   /* 그만둔 17시 예약 — 오늘만 빌린다 */

/* 거두는 자가 「이 회차가 바뀌었나」를 알아보는 표지 */
export const 자국 = {
  결승: '[아시안게임] 축구 결승전 결과',
  종합: '[아시안게임] 대회 종합 — 전체 순위·첫 금메달·주요 금메달 순간',
};

/** 두 기사에 공통으로 들어가는 것 — 사실 확보·충청권·제목·SEO·형식 */
function 바탕(제목표지, 맡은것, 표이름) {
  return `## 중부매일 스포츠 자동기사 — 결승 뒤 배송 · ${제목표지}

🔴 사장님 지시 (2026-10-03): 「**축구 결승전이 끝나면 두 개 기사를 써 (1) 축구 결승전 결과
(2) 이번 아시안게임 우리나라 경기 종합을 〈전체 순위. 첫 금메달. 주요 금메달 순간.〉을 중심으로 써라**」

당신은 중부매일 스포츠부 기자입니다. 이 회차에 **기사 1건**을 씁니다.

### 0. 오늘 낼 날인가
- 🔴 이 회차는 **2026-10-03(토) 밤 한 번만** 돕니다. 공휴일·주말이어도 씁니다.
- ⛔ "주말이라 쉰다"·"공휴일이라 쉰다"로 회차를 마치지 않습니다.
- ⛔ 축구 결승은 **19시 30분 킥오프**입니다. 아직 안 끝났으면 결과를 지어내지 않습니다.
  끝나지 않았으면 기사를 쓰지 말고 "아직 안 끝났다"고만 적습니다.

### 1. 이 회차가 맡은 것
${맡은것}

### 2. 🔴 사실부터 확보한다 — 기억으로 쓰지 않는다
- 반드시 **웹 검색**으로 실제 결과를 찾습니다.
- 🔴 **공식 결과 사이트가 1차 자료입니다** — 사장님이 직접 주신 곳입니다:
  **https://results.asiangames2026.org/#/medals/standings**
  - 메달 집계와 순위는 여기 값이 정본입니다. 언론 기사보다 앞섭니다.
  - 자바스크립트로 그리는 지면이라 검색 결과만 보고 베끼지 말고 **직접 열어서** 봅니다.
- 확인할 것: 날짜·종목·선수·기록·점수·순위. **추정해서 쓰지 않습니다.** 하나만 틀려도 정정보도입니다.
- 본문에 «경기가 열린 날»을 반드시 적습니다 — 「3일(한국시간)」처럼.
- 메달 수·순위를 적을 때는 **몇 시 기준인지** 함께 적습니다.
- ⛔ 못 찾은 것은 기사에 쓰지 않습니다. 「매체마다 다르다」·「확인하지 못했다」 같은
  취재 뒷이야기는 기사 본문에 넣지 말고 **아래 표의 「못 쓴 까닭」 칸에만** 적습니다.

### 3. ⭐ 충청권 선수는 그 자리에서 밝힌다 — 사장님 지시 (2026-09-22)
「아시안게임은 선수 출신지, 소속팀이 충청권이면 명기를 해줘」
- 활약한 선수의 **출신지**(고향·출신 학교)나 소속팀이 충청권이면 본문에 그대로 적습니다 —
  「대전 출신」·「충북 청주시청 소속」처럼.
- 충청권 선수가 메달을 땄으면 **제목이나 부제에 올립니다.**
- ⛔ 출신지·소속팀을 짐작해서 쓰지 않습니다. 웹 검색으로 «확인한 것»만 적습니다.

### 4. 제목 — 🔴 제목 줄을 «반드시» 쓴다
- **글의 맨 처음 두 줄**을 이렇게 씁니다.
  첫 줄 「제목: ...」
  둘째 줄 「부제: ...」
- ⛔ 「부제」만 쓰고 제목을 빠뜨리지 않습니다. 제목이 없으면 그 회차는 보내지지 않습니다.
- 핵심 키워드(대개 **선수 이름**)를 **앞쪽에** 둡니다. 32자 안쪽.

### 5. 🔴 SEO — 사람이 «검색해서» 찾아오게 쓴다
- 사람들이 실제로 검색창에 치는 말을 씁니다: **선수 이름 · 종목 이름 · 대회 이름 · 나라**.
- **첫 문단 두 문장 안**에 제목의 핵심 키워드를 다시 씁니다.
- ⛔ 같은 말을 억지로 되풀이하지 않습니다. 읽는 사람이 먼저입니다.

### 6. 기사 형식 — 중부매일 v7 데스킹

${형식칸}

### 7. 🔴 기사 본문은 «이 대화창»에 그대로 적는다
- ⛔ **기사를 파일로 만들지 않습니다.** 문서·MD·아티팩트로 내면 거두는 자가 본문을 못 읽어
  그 회차는 발송되지 않습니다.
- ⛔ 원드라이브에 저장하지 않습니다. 그 길은 폐지됐습니다.
- ✅ 제목 줄부터 기자명 줄까지 **글 전체를 이 대화창에 그대로** 적습니다.

### 8. 끝에 이 표를 붙인다

\`\`\`
■ ${표이름}
  낸 기사    1 / 1   (또는 0 / 1)
  제목       ...
  고른 키워드  ..., ..., ...   (3~5개)
  근거 링크   n 개
  못 쓴 까닭  (0건일 때만)
\`\`\`
`;
}

export const 지침 = {
  결승: 바탕(자국.결승, `- 제목 맨 앞에 **[아시안게임]** 을 붙입니다.
- **오늘 밤 끝난 축구 남자 결승전 «결과»** 한 편입니다.
- 반드시 담을 것:
  - **점수** (연장·승부차기면 그것까지)
  - **득점자와 득점 시각**
  - **승부를 가른 장면** — 무엇이 경기를 뒤집었나
  - **상대팀과 경기 흐름**
  - 우승이면 **몇 년 만인지**, 아니면 결과 그대로
  - 병역 혜택 등 이 경기로 달라지는 것이 있으면 적습니다
- ⛔ 메달 집계·대회 전체 이야기는 이 기사에 넣지 않습니다. 그것은 «다음 기사»가 맡습니다.`,
    '결승 결과 회차'),

  종합: 바탕(자국.종합, `- 제목 맨 앞에 **[아시안게임]** 을 붙입니다.
- **이번 대회 한국 선수단 전체를 되짚는 종합 기사** 한 편입니다.
- 🔴 사장님이 **축 셋을 직접 못 박으셨습니다. 셋이 다 들어가야 끝난 것입니다.**
  - **① 전체 순위** — 최종 금·은·동과 국가별 순위에서 한국의 자리.
    지난 대회(2022 항저우) 성적과 견주어 늘었는지 줄었는지 적습니다.
  - **② 첫 금메달** — 이번 대회 한국의 «첫» 금메달이 누구·언제·무슨 종목이었나.
  - **③ 주요 금메달 순간** — 기억에 남는 장면 몇 개.
    2관왕·사상 최초·기록 경신·오래 끊겼던 종목의 금메달 같은 것.
- ⛔ 오늘 낮에 나간 18시 종합 기사와 «문장»이 겹치지 않게 합니다.
  (그 기사는 양궁 이우석 2관왕·골프 김주형·요트 최지운·태권도 송다빈을 다뤘습니다.)
  같은 선수를 써도 됩니다 — 다만 **대회 전체에서 그 사람이 어떤 자리였나**로 씁니다.
- ⛔ 축구 결승 «경기 내용»은 앞 기사가 맡습니다. 여기서는 결과 한 줄만 씁니다.`,
    '대회 종합 회차'),
};

export const 회차이름 = {
  결승: '스포츠 밤 — 아시안게임 축구 결승 결과 (10/3 하루만)',
  종합: '스포츠 밤 — 아시안게임 대회 종합 (10/3 하루만)',
};

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; const 실패 = [];
  const 본다 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패.push(이름); console.log('❌ ' + 이름); } };

  for (const 갈래 of ['결승', '종합']) {
    const g = 지침[갈래];
    본다(`${갈래} — 제목 줄을 반드시 쓰라고 적는다`, g.includes('제목 줄을 «반드시» 쓴다'));
    본다(`${갈래} — 공식 결과 사이트가 들어 있다`, g.includes('results.asiangames2026.org'));
    본다(`${갈래} — 충청권 규칙이 들어 있다`, g.includes('충청권'));
    본다(`${갈래} — 자국이 지침 안에 있다`, g.includes(자국[갈래]));
    본다(`${갈래} — ⛔ 추정을 막는다`, g.includes('추정해서 쓰지 않습니다'));
    본다(`${갈래} — ⛔ 취재 뒷이야기를 본문에 안 쓴다`, g.includes('취재 뒷이야기는 기사 본문에 넣지 말고'));
    /* 🔴🔴 사장님이 오늘 직접 짚으신 둘 — 이것이 빠져서 기사가 틀어졌다 */
    본다(`${갈래} — 🔴 형식칸(v7 ⑨ 규칙)이 들어 있다`, g.includes(형식칸.trim().split('\n')[0]));
    본다(`${갈래} — 🔴 「기자이름은 박인택으로 통일」이 들어 있다`, g.includes('박인택 기자'));
    본다(`${갈래} — 🔴 마크다운 기호 금지가 들어 있다`, g.includes('마크다운 기호를 그대로 쓰지 않는다'));
    본다(`${갈래} — 🔴 소제목 한 개 규칙이 들어 있다`, g.includes('소제목은 «한 개만» 둔다'));
    본다(`${갈래} — 데스킹 v7을 가리킨다`, g.includes('중부매일 v7 데스킹'));
    본다(`${갈래} — 끝 표가 있다`, g.includes('낸 기사    1 / 1'));
    본다(`${갈래} — 파일로 내지 말라고 적는다`, g.includes('기사를 파일로 만들지 않습니다'));
  }

  /* 두 기사가 서로 맡은 것이 다른가 — 겹치면 같은 기사가 두 번 나간다 */
  본다('🔴 결승은 점수·득점자를 맡는다', 지침.결승.includes('득점자와 득점 시각'));
  본다('⛔ 결승은 메달 집계를 안 맡는다', 지침.결승.includes('메달 집계·대회 전체 이야기는 이 기사에 넣지 않습니다'));
  본다('🔴 종합은 축 셋을 다 적는다',
    지침.종합.includes('전체 순위') && 지침.종합.includes('첫 금메달') && 지침.종합.includes('주요 금메달 순간'));
  본다('⛔ 종합은 결승 경기 내용을 안 맡는다', 지침.종합.includes('축구 결승 «경기 내용»은 앞 기사가 맡습니다'));
  본다('⛔ 종합은 18시 기사와 겹치지 말라고 적는다', 지침.종합.includes('18시 종합 기사와 «문장»이 겹치지 않게'));
  본다('🔴 킥오프 시각을 적어 결과를 지어내지 못하게 한다', 지침.결승.includes('19시 30분 킥오프'));
  본다('두 지침의 자국이 서로 다르다', 자국.결승 !== 자국.종합);
  본다('빌려 쓰는 예약이 그만둔 17시 것이다', /^trig_/.test(밤회차예약));
  본다('조직 열쇠가 서른여섯 자다', 조직.length === 36);
  본다('회차 이름이 둘 다 있다', !!회차이름.결승 && !!회차이름.종합 && 회차이름.결승 !== 회차이름.종합);

  console.log(`\n${실패.length ? '❌' : '✅'} 자가시험 ${통과}${실패.length ? ' · 실패 ' + 실패.length : ' 통과'}`);
  return !실패.length;
}

const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && process.argv.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
} else if (내가진입점) {
  const 갈래 = process.argv.slice(2).find((a) => a === '결승' || a === '종합');
  if (!갈래) {
    console.error('🔴 「결승」이나 「종합」 가운데 하나를 준다 — node scripts/set-asiangames-night.mjs 결승 --적는다');
    process.exit(1);
  }
  const 적는다 = process.argv.includes('--적는다');
  const 이번지침 = 지침[갈래];
  const 이번자국 = 자국[갈래];
  const 새이름 = 회차이름[갈래];
  console.log(`■ 갈래 — ${갈래} (${이번지침.length}자)`);

  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await b.newPage();
  try {
    await page.goto(`https://claude.ai/scheduled-task/${밤회차예약}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await new Promise((r) => setTimeout(r, 3000));

    const 받은 = await page.evaluate(async (조직2, trig) => {
      const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${trig}`, { headers: { accept: 'application/json' } });
      return { 상태: res.status, 글: await res.text() };
    }, 조직, 밤회차예약);
    if (받은.상태 !== 200) { console.log(`🔴 못 읽었다 (${받은.상태})`); process.exit(1); }
    const 트리거 = JSON.parse(받은.글).trigger;
    console.log(`■ 빌려 쓸 회차 — 「${트리거.name}」 (지금 ${String(트리거.derived_state?.prompt || '').length}자)`);

    if (String(트리거.derived_state?.prompt || '').includes(이번자국)) {
      console.log('⬜ 그대로 — 이미 이 갈래가 들어 있다'); process.exit(0);
    }
    if (!적는다) { console.log(`🟡 고칠 것이 있다 (→ ${이번지침.length}자). --적는다 로 써넣는다`); process.exit(0); }

    const 답 = await page.evaluate(async (조직2, trig, prompt, name) => {
      const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${trig}`, {
        method: 'PATCH',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, name }),
      });
      return { 상태: res.status, 글: (await res.text()).slice(0, 300) };
    }, 조직, 밤회차예약, 이번지침, 새이름);
    if (답.상태 !== 200) { console.log(`🔴 못 썼다 (${답.상태}) ${답.글.replace(/\s+/g, ' ')}`); process.exit(1); }

    const 다시 = await page.evaluate(async (조직2, trig) => {
      const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${trig}`, { headers: { accept: 'application/json' } });
      return await res.text();
    }, 조직, 밤회차예약);
    const t2 = JSON.parse(다시).trigger;
    /* ⚠ 지침은 세 자리에 함께 적힌다 — 하나만 보고 「들어갔다」 하지 않는다 */
    const 세자리 = [
      t2.derived_state?.prompt,
      t2.session_request?.events?.[1]?.payload?.internal_anthropic_catchall?.message?.content,
      t2.job_config?.ccr?.events?.[1]?.data?.message?.content,
    ];
    const 든가 = 세자리.every((s) => String(s || '').includes(이번자국)) && t2.name === 새이름;
    const 형식도 = 세자리.every((s) => String(s || '').includes('박인택 기자'));
    console.log(`${든가 ? '✅ 들어갔다' : '🔴 썼다는데 안 들어 있다'} — 이름 「${t2.name}」`);
    console.log(`${형식도 ? '✅ 형식칸(기자명·기호 금지)도 세 자리에 다 들어갔다' : '🔴 형식칸이 빠졌다'}`);
    process.exitCode = (든가 && 형식도) ? 0 : 1;
  } finally { await page.close(); b.disconnect(); }
}
