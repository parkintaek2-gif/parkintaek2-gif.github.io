#!/usr/bin/env node
/**
 * send-asiad-feature-brief.mjs — **아시안게임 «이색종목» 기획 3건을 중부매일 계정에 시킨다.**
 *
 * ── 사장님 지시 (2026-09-28, 원문) ───────────────────────────────────
 * 「1. 아시안게임 이색종목을 주제로 기획기사를 세 건을 쓸 예정임. 세 건 중 하나는
 *  e스포츠만 갖고 쓰면 됨. 올림픽정식종목이 아닌 종목이 주로 이색종목일 것으로 보임.
 *  그러나 스케이트보드 같이 다 그런 것은 아님
 *  2. 오늘부터 사흘간 오후 4시에 출고 3. 중부매일계정을 이용할 것.
 *  4. 기획은 네가 초안을 잡아봐」
 *
 * ⭐ 사장님이 그어 주신 선 — **「올림픽에 없다」를 이색의 «기준»으로 쓰지 않는다.**
 *   기준은 「한국 독자가 그 종목을 평소에 볼 일이 없는가」다.
 *   스케이트보드는 올림픽 종목이 아니었어도 낯설지 않으니 이색이 아니다.
 *
 * ⛔ 내가(5번이) 기사를 쓰지 않는다. **중부매일 계정(jbnews0001)이 쓴다** —
 *   사장님: 「네가 직접 쓰면 문제가 많잖아, 여러가지로」
 * ⛔ b.close() 금지 — disconnect() 만. 언제나 새 탭.
 *
 * 기획 전문: docs/아시안게임-이색종목-기획-3건.md
 *
 * 쓰는 법
 *   node scripts/send-asiad-feature-brief.mjs            오늘 날짜의 몫을 넣는다
 *   node scripts/send-asiad-feature-brief.mjs --날 2      둘째 건을 넣는다(시험·되돌리기용)
 *   node scripts/send-asiad-feature-brief.mjs --시늉      무엇을 넣을지 찍어만 본다
 *   node scripts/send-asiad-feature-brief.mjs --자가시험
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 열여섯시 = 'trig_01ErSZQm2VhuNYMRBi3MCufF';

/** 사흘 일정 — 날짜로 몫을 고른다. ⛔ 자리 번호로 집지 않는다(전에 그래서 터졌다) */
export const 일정 = [
  { 날짜: '2026-09-28', 몇째: 1, 이름: 'e스포츠' },
  { 날짜: '2026-09-29', 몇째: 2, 이름: '아시아에만 있는 종목' },
  { 날짜: '2026-09-30', 몇째: 3, 이름: '한국이 조용히 메달을 쓸어 담는 종목' },
];

/** 오늘 날짜(KST) — ⛔ toISOString() 은 UTC 라 새벽에 하루가 어긋난다 */
export function 오늘() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 그날 몫을 고른다. ⛔ 일정에 없는 날이면 «아무것도 안 넣는다» — 엉뚱한 날 기사를 시키지 않는다 */
export function 오늘몫(날짜 = 오늘(), 표 = 일정) {
  return 표.find((x) => x.날짜 === 날짜) ?? null;
}

export const 본문 = {
  1: [
    '① e스포츠 — 사장님이 따로 지정하신 한 건입니다.',
    '',
    '중심 물음 — 「게임이 왜 국가대표 경기가 됐고, 메달은 실제로 어떻게 걸렸나」',
    '',
    '넣을 것',
    '  · 이번 대회 e스포츠 세부 종목이 무엇무엇인지 (공식 결과 사이트에서 확인)',
    '  · 한국 대표가 나간 종목과 그 성적',
    '  · 메달이 몇 개 종목에 몇 개 걸렸나',
    '  · 선수 이름·팀·소속 — 서로 다른 두 곳에서 확인한 것만',
    '',
    '안 넣을 것',
    '  · 「e스포츠가 스포츠냐」는 논쟁 — 낡았고 대회가 이미 답했습니다',
    '  · 게임 회사 홍보로 읽힐 표현',
  ].join('\n'),
  2: [
    '② 아시아에만 있는 종목',
    '',
    '중심 물음 — 「올림픽에서는 평생 못 보는 경기가 왜 여기엔 있나」',
    '',
    '후보 (이번 대회 종목표에서 «확인한 뒤» 고르십시오)',
    '  · 카바디 — 인도·방글라데시권. 숨을 참고 상대 진영에 들어갑니다',
    '  · 세팍타크로 — 동남아. 발로 하는 배구',
    '  · 쿠라시 — 중앙아시아 씨름',
    '  · 우슈 · 무에타이 · 주짓수',
    '',
    '글감',
    '  · 그 종목이 어느 나라에서 왔고 지금 어느 나라가 강한가',
    '  · 한국 대표가 나갔나 — 나갔으면 성적, 안 나갔으면 「안 나갔다」고 적습니다',
    '',
    '⛔ 어제 쓴 e스포츠를 다시 다루지 마십시오.',
  ].join('\n'),
  3: [
    '③ 한국이 조용히 메달을 쓸어 담는 종목',
    '',
    '중심 물음 — 「중계가 없어서 아무도 몰랐던 메달」',
    '',
    '후보 (메달 집계에서 «확인한 뒤» 고르십시오)',
    '  · 소프트테니스 · 롤러스포츠 · 볼링 · 바둑/체스 · 우슈 · 주짓수 · 스쿼시',
    '',
    '글감',
    '  · 그 종목에서 한국이 이번에 딴 메달 수',
    '  · 왜 강한가 — 저변·역사·대표 선발 방식 가운데 «확인되는 것»만',
    '',
    '⛔ 「비인기 종목의 설움」류 감상으로 끌고 가지 마십시오. 수로 말합니다.',
    '⛔ 앞 이틀에 쓴 종목을 다시 다루지 마십시오.',
  ].join('\n'),
};

export function 글짓기(몫) {
  if (!몫) return null;
  return [
    '사장님 지시입니다. 이 회차는 «기획기사»를 씁니다. 오늘 경기 종합이 아닙니다.',
    '',
    '사장님 말씀 원문 —',
    '「아시안게임 이색종목을 주제로 기획기사를 세 건을 쓸 예정임. 세 건 중 하나는',
    ' e스포츠만 갖고 쓰면 됨. 올림픽정식종목이 아닌 종목이 주로 이색종목일 것으로 보임.',
    ' 그러나 스케이트보드 같이 다 그런 것은 아님. 오늘부터 사흘간 오후 4시에 출고」',
    '',
    '⭐ 사장님이 선을 그어 주셨습니다 — 「올림픽에 없다」를 이색의 기준으로 쓰지 마십시오.',
    '  기준은 「한국 독자가 그 종목을 평소에 볼 일이 없는가」입니다.',
    '  스케이트보드는 올림픽 종목이 아니었어도 한국 독자에게 낯설지 않으니 이색이 아닙니다.',
    '',
    '사흘 동안 셋을 씁니다. 오늘은 그 가운데 ' + ['첫째', '둘째', '셋째'][몫.몇째 - 1] + '입니다.',
    ...일정.map((x) => `  ${x.날짜}  ${x.몇째 === 몫.몇째 ? '◀ 오늘' : '     '} ${x.이름}`),
    '⛔ 오늘 건에서 다른 날 몫을 미리 쓰지 마십시오. 셋이 겹치면 안 됩니다.',
    '',
    본문[몫.몇째],
    '',
    '🔴 지킬 것',
    '  · 종목 목록과 메달 수의 정본은 공식 결과 사이트입니다 —',
    '    https://results.asiangames2026.org/#/medals/standings',
    '    언론 기사보다 앞섭니다. 메달 수를 적을 때 「몇 시 기준」인지 함께 적으십시오.',
    '  · 선수 이름·소속·전적은 서로 다른 두 곳에서 확인한 것만 씁니다.',
    '    못 찾은 것은 그럴듯하게 채우지 말고 «뺍니다».',
    '  · 제목과 본문에 사람들이 실제로 검색하는 말을 넣으십시오 (종목 이름·선수 이름·아시안게임).',
    '  · 오늘 이미 나간 기사와 겹치지 않게 하십시오.',
    '',
    '완성되면 기사 전문을 이 대화창에 그대로 적어 주십시오.',
  ].join('\n');
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 본다 = (이름, 참, 덧 = '') => 것.push({ 이름, 참: !!참, 덧 });

  본다('사흘치가 다 있다', 일정.length === 3);
  본다('🔴 날짜로 몫을 고른다 — 자리 번호로 집지 않는다',
    오늘몫('2026-09-29').몇째 === 2 && 오늘몫('2026-09-30').이름.includes('메달'));
  본다('🔴 일정에 없는 날이면 아무것도 안 넣는다',
    오늘몫('2026-10-05') === null && 글짓기(오늘몫('2026-10-05')) === null);
  본다('⛔ 오늘 날짜를 UTC 로 만들지 않는다', /^\d{4}-\d{2}-\d{2}$/.test(오늘()));

  const g1 = 글짓기(오늘몫('2026-09-28'));
  본다('첫날 글에 e스포츠가 들어간다', g1.includes('e스포츠') && g1.includes('첫째'));
  본다('🔴 사장님이 그어 주신 선이 글에 들어간다 — 스케이트보드',
    g1.includes('스케이트보드') && g1.includes('평소에 볼 일이 없는가'));
  본다('🔴 공식 결과 사이트가 정본이라고 적는다',
    g1.includes('results.asiangames2026.org'));
  본다('🔴 두 곳에서 확인한 것만 쓰라고 적는다',
    g1.includes('두 곳에서 확인한 것만'));

  const g2 = 글짓기(오늘몫('2026-09-29'));
  본다('⛔ 둘째 날 글은 어제 것을 다시 쓰지 말라고 적는다', g2.includes('다시 다루지 마십시오'));
  본다('셋이 서로 다른 글이다',
    new Set([g1, g2, 글짓기(오늘몫('2026-09-30'))]).size === 3);

  const 빨강 = 것.filter((x) => !x.참);
  console.log(`■ send-asiad-feature-brief 자가시험 ${것.length - 빨강.length}/${것.length}`);
  for (const x of 것) console.log(`  ${x.참 ? '✅' : '🔴'} ${x.이름}${x.덧 ? `  (${x.덧})` : ''}`);
  return 빨강.length === 0;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

  const 날자리 = 인자.indexOf('--날');
  const 고른날 = 날자리 >= 0 ? Number(인자[날자리 + 1]) : null;
  const 몫 = Number.isFinite(고른날) && 고른날 ? 일정.find((x) => x.몇째 === 고른날) : 오늘몫();

  if (!몫) {
    console.log(`⬜ ${오늘()} 은 이 기획의 사흘(${일정.map((x) => x.날짜).join(' · ')})에 없다 — 아무것도 안 넣는다`);
    process.exit(0);
  }
  const 글 = 글짓기(몫);
  console.log(`■ ${몫.날짜} ${몫.몇째}번째 — ${몫.이름}  (${글.length}자)`);
  if (인자.includes('--시늉')) { console.log('\n' + 글); process.exit(0); }

  const { createRequire } = await import('node:module');
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null, protocolTimeout: 15 * 60_000 });
  const page = await b.newPage();
  try {
    await page.setViewport({ width: 1500, height: 1000 });
    await page.goto(`https://claude.ai/scheduled-task/${열여섯시}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await 쉼(6000);
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button')].find((x) => /모든 쿠키 허용/.test(x.innerText || ''));
      if (el) el.click();
    });
    await 쉼(1200);
    console.log(`   ${(await page.evaluate(() => (document.querySelector('h1') || {}).innerText || '(제목 없음)'))}`);

    const 눌렀나 = await page.evaluate(() => {
      const el = [...document.querySelectorAll('button')].find((x) => /지금 실행|Run now/i.test(x.innerText || ''));
      if (el) { el.click(); return true; }
      return false;
    });
    console.log(`   「지금 실행」 ${눌렀나 ? '눌렀다' : '🔴 단추를 못 찾았다'}`);
    await 쉼(9000);

    await page.evaluate(() => {
      const 것 = [...document.querySelectorAll('a, [role="button"], div[tabindex]')]
        .filter((el) => /오늘|방금|분 전|시간 전/.test(el.innerText || '') && el.getBoundingClientRect().width > 0)[0];
      if (것) 것.click();
    });
    await 쉼(7000);
    for (let i = 0; i < 4; i++) { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await 쉼(800); }

    const 칸 = await page.$('div[contenteditable="true"]') || await page.$('textarea');
    if (!칸) { console.log('🔴 답글칸을 못 찾았다'); }
    else {
      await 칸.click(); await 쉼(500);
      for (const [i, 줄] of 글.split('\n').entries()) {
        if (i) { await page.keyboard.down('Shift'); await page.keyboard.press('Enter'); await page.keyboard.up('Shift'); }
        if (줄) await page.keyboard.type(줄, { delay: 2 });
      }
      await 쉼(800);
      await page.keyboard.press('Enter');
      console.log(`   ✔ 넣었다 — ${몫.이름}`);
    }
  } finally {
    await page.close();
    b.disconnect();
  }
}
