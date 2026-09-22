#!/usr/bin/env node
/**
 * set-jbnews-sports-prompt.mjs — **중부매일 스포츠 예약작업 아홉의 «프롬프트»를 고친다.**
 *
 *   node scripts/set-jbnews-sports-prompt.mjs --시험      무엇이 바뀌는지만 본다 (안 보낸다)
 *   node scripts/set-jbnews-sports-prompt.mjs --적는다    아홉 회차에 실제로 써넣는다
 *   node scripts/set-jbnews-sports-prompt.mjs --자가시험
 *
 * ── 왜 (2026-09-22 · 5번) ──────────────────────────────────────────────
 * 사장님 지시 — 「**스포츠기사는 seo 맞춤형으로 작성+대중적 관심 키워드**」.
 *
 * 기사를 «쓰는 규칙»은 저장소가 아니라 claude.ai 예약작업의 프롬프트에 있다.
 * 그래서 지시를 반영하려면 그 아홉 개를 고쳐야 하는데, 화면에는 고치는 칸이 없다.
 *
 * 🔴 길을 실측으로 찾았다 (2026-09-22 07:4x)
 *   ⛔ https://claude.ai/settings/tasks/<trig>  — 프롬프트가 안 뜬다. 여기가 아니다
 *   ✅ https://claude.ai/scheduled-task/<trig>  — 이 화면이 부르는 API 가 정본이다
 *      GET   /api/organizations/<조직>/cowork/scheduled_tasks/<trig>
 *      PATCH 같은 주소. 보낸 칸만 바뀌고 나머지는 그대로 남는다 (17시로 재서 확인했다)
 *   프롬프트가 사는 자리 — trigger.job_config.ccr.events[1].data.message.content
 *
 * ⛔ 사장님 크롬 창을 닫지 않는다 — disconnect() 만. 언제나 새 탭.
 * ⛔ 손으로 고치지 않는다. 아홉 개를 손으로 고치면 여덟 개만 고친 날이 반드시 온다.
 * ✅ **두 번 돌려도 안전하다** — 이미 들어 있으면 건드리지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 조직 = '953d4e54-f96e-4d6d-b33e-33311fbd09ad';

/**
 * 회차 표 — **수집기가 정본이다.** 두 곳에 적으면 한 곳이 낡는다.
 *
 * ⛔ `import` 로 가져오지 않는다 — 수집기에는 진입점 가드가 없어서, 불러오는 순간
 *   «오늘 회차를 거둬 메일로 보내는» 본문이 그대로 돌아 버린다. 그래서 **글로 읽는다.**
 */
export function 회차읽기(글) {
  const 덩이 = String(글 ?? '').match(/const 회차 = \[([\s\S]*?)\];/);
  if (!덩이) return [];
  return [...덩이[1].matchAll(/\['(\d{2})',\s*'(trig_[0-9A-Za-z]+)'\]/g)].map((m) => [m[1], m[2]]);
}
export const 수집기길 = path.join(뿌리, 'scripts', 'collect-jbnews-sports-articles.mjs');
export const 회차 = 회차읽기(fs.readFileSync(수집기길, 'utf8'));

/** 이 글이 들어 있으면 이미 고친 것이다 */
export const 자국 = '### 5. 🔴 SEO — 사람이 «검색해서» 찾아오게 쓴다';

export const SEO칸 = `${자국}

사장님 지시 (2026-09-22): 「**스포츠기사는 seo 맞춤형으로 작성 + 대중적 관심 키워드**」

**① 대중적 관심 키워드를 먼저 고른다 — 쓰기 전에 3~5개**
- 사람들이 실제로 검색창에 치는 말이다: **선수 이름 · 팀 이름 · 대회 이름 · 맞붙은 두 팀**.
- ⛔ 기관 용어·우리끼리 쓰는 말·비유로 제목을 짓지 않는다. 「명불허전」을 검색하는 사람은 없다.
- ⛔ 검색량을 지어내 적지 않는다. 「이 말을 실제로 치겠나」로 고른다.

**② 제목**
- 핵심 키워드(대개 **선수 이름**)를 **앞쪽에** 둔다. 32자 안쪽.
- 부제목에는 제목에 안 쓴 **다른** 검색어를 넣는다 — 스코어 · 상대팀 · 대회 이름.

**③ 본문**
- **첫 문단 두 문장 안**에 제목의 핵심 키워드를 다시 쓴다.
- 소제목을 **둘 이상** 둔다 — 검색엔진은 문단 구조를 읽는다.
- 키워드를 「선수이름 + 골」·「A팀 B팀 경기결과」·「리그 순위」처럼 **사람이 치는 꼴**로 녹인다.
- ⛔ 같은 말을 억지로 되풀이하지 않는다(키워드 채워넣기). 읽는 사람이 먼저다.
`;

/** 마지막 표에 «무엇을 골랐나»를 적게 한다 — 적어야 잴 수 있다 */
export const 표앵커 = '  근거 링크   n 개';
export const 표새줄 = '  고른 키워드  ..., ..., ...   (3~5개)';

/* ────────────────────────────────────────────────────────────────────────
 * 회차마다 다른 손질 — 「이 회차가 맡은 것」을 바꾼다
 *
 * 🔴 사장님 지시 (2026-09-22 09:0x, 원문)
 *   「**해외축구가 없는 날이 더 많은데, 해외축구가 열린 날과 다음날에만 기사 써라
 *    ...9시엔 아시안게임 종합기사 써**」
 *
 * ⇒ 09시의 맡은 것을 «아시안게임 종합»으로 바꾸고, 해외축구는 «경기가 열린 날과
 *   그 다음날에만» 쓰도록 좁힌다. 예약 이름도 따라 고친다 — 이름이 옛것이면
 *   다음 사람이 그 회차가 무엇을 쓰는지 화면에서 잘못 읽는다.
 * ⛔ 다른 여덟 회차는 손대지 않는다. 사장님이 9시만 말씀하셨다.
 * ──────────────────────────────────────────────────────────────────────── */
export const 아시안게임칸 = `### 1. 이 회차가 맡은 것

🔴 **아시안게임 종합** — 대회가 열리는 기간에는 이 회차의 기사가 «아시안게임 종합기사»다.
- 전날 밤~오늘 오전에 나온 **한국 선수단의 메달·경기 결과**를 한 편으로 묶는다.
- 종목을 가리지 않는다. 메달이 나온 종목 · 한국이 강한 종목 · 그날 최대 화제 차례로 담는다.
- 「누가 무엇을 땄나」가 먼저다. 기록과 장면은 그다음이다.
- 대회 일정·시상 결과를 반드시 **웹 검색으로 확인**한다. 종목 이름과 선수 이름을 짐작하지 않는다.

⚠ **해외축구는 «경기가 열린 날과 그 다음날에만» 쓴다.**
- 잉글랜드·스페인·이탈리아·프랑스·독일 빅5리그, 그리고 손흥민이 뛰는 미국 메이저리그사커.
- 🔴 **경기가 없던 날에는 해외축구를 쓰지 않는다.** 없는 날이 더 많다. 억지로 만들지 않는다.
- 한국 선수가 뛴 경기를 먼저 본다. 없으면 그날 가장 화제가 된 빅5리그 경기.

⬜ 아시안게임 기간이 아니고 해외축구 경기도 없었으면, 그날 가장 화제가 된 스포츠 하나를 고른다.
  그것도 없으면 이 회차는 기사를 쓰지 않는다 — 「무엇을 찾았고 무엇이 없었는지」만 적는다.`;

export const 회차고침 = {
  '09': {
    이름: '스포츠 09시 — 아시안게임 종합',
    자국: '🔴 **아시안게임 종합**',
    바꿀것: [[
      /### 1\. 이 회차가 맡은 것\n[\s\S]*?(?=\n### 2\.)/,
      아시안게임칸,
    ]],
  },
};

/**
 * 그 회차만의 손질을 한다. ⛔ 바꿀 자리를 못 찾으면 «아무것도» 안 고친다.
 * @returns {{글: string, 바뀌었나: boolean, 까닭?: string}}
 */
export function 회차손질(시, 원글) {
  const 글0 = String(원글 ?? '');
  const 규칙 = 회차고침[String(시)];
  if (!규칙) return { 글: 글0, 바뀌었나: false, 까닭: '이 회차는 손질이 없다' };
  if (!글0) return { 글: 글0, 바뀌었나: false, 까닭: '빈 글이다' };
  if (글0.includes(규칙.자국)) return { 글: 글0, 바뀌었나: false, 까닭: '이미 들어 있다' };
  let 글 = 글0;
  for (const [옛, 새] of 규칙.바꿀것) {
    if (!옛.test(글)) return { 글: 글0, 바뀌었나: false, 까닭: '바꿀 자리를 못 찾았다' };
    글 = 글.replace(옛, 새);
  }
  return { 글, 바뀌었나: true };
}

/** 5·6·7 을 6·7·8 로 밀고 그 자리에 SEO 칸을 넣는다 */
export const 번호밀기 = [
  ['### 7. 마지막에 이 표를 낸다', '### 8. 마지막에 이 표를 낸다'],
  ['### 6. 🔴 이 대화에 기사', '### 7. 🔴 이 대화에 기사'],
  ['### 5. 기사 형식', '### 6. 기사 형식'],
];

/**
 * 프롬프트 한 벌을 고친다.
 * @returns {{글: string, 바뀌었나: boolean, 까닭?: string}}
 */
export function 고치기(원글) {
  const 글0 = String(원글 ?? '');
  if (!글0) return { 글: 글0, 바뀌었나: false, 까닭: '빈 글이다' };
  if (글0.includes(자국)) return { 글: 글0, 바뀌었나: false, 까닭: '이미 들어 있다' };

  /* 🔴 밀 자리가 하나라도 없으면 «아무것도» 안 고친다 —
     반만 고친 프롬프트가 제일 나쁘다. 번호가 어긋난 채로 아홉 회차가 돈다. */
  for (const [옛] of 번호밀기) {
    if (!글0.includes(옛)) return { 글: 글0, 바뀌었나: false, 까닭: `못 찾았다 — ${옛}` };
  }
  if (!글0.includes(표앵커)) return { 글: 글0, 바뀌었나: false, 까닭: `못 찾았다 — ${표앵커}` };

  let 글 = 글0;
  for (const [옛, 새] of 번호밀기) 글 = 글.split(옛).join(새);
  글 = 글.replace('### 6. 기사 형식', `${SEO칸}\n### 6. 기사 형식`);
  글 = 글.replace(표앵커, `${표새줄}\n${표앵커}`);
  return { 글, 바뀌었나: true };
}

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);
  const 보기 = [
    '### 0. 오늘 낼 날인가', '### 1. 이 회차가 맡은 것',
    '### 2. 🔴 사실부터 확보한다 — 기억으로 쓰지 않는다',
    '### 3. 🔴 기사 끝에 «근거 표»를 반드시 붙인다',
    '### 4. 다 쓰면 스스로 검사한다',
    '### 5. 기사 형식 — 중부매일 v7 데스킹',
    '- 제목에 **선수 이름 필수**',
    '### 6. 🔴 이 대화에 기사 «전문»을 그대로 쓴다',
    '### 7. 마지막에 이 표를 낸다 — 이게 없으면 안 한 것으로 본다',
    '```', '■ 09시 회차', '  낸 기사    1 / 1', '  제목       ...',
    '  근거 링크   n 개', '  못 쓴 까닭  (0건일 때만)', '```',
  ].join('\n');

  const a = 고치기(보기);
  검('고쳤다고 답한다', a.바뀌었나 === true);
  검('SEO 칸이 들어갔다', a.글.includes(자국));
  검('대중적 관심 키워드라는 말이 들어갔다', a.글.includes('대중적 관심 키워드'));
  검('5번 자리에 들어간다 — 기사 형식보다 앞', a.글.indexOf(자국) < a.글.indexOf('### 6. 기사 형식'));
  검('기사 형식이 6번으로 밀렸다', a.글.includes('### 6. 기사 형식 — 중부매일 v7 데스킹'));
  검('전문 쓰기가 7번으로 밀렸다', a.글.includes('### 7. 🔴 이 대화에 기사'));
  검('마지막 표가 8번으로 밀렸다', a.글.includes('### 8. 마지막에 이 표를 낸다'));
  검('⛔ 옛 5번이 남아 있지 않다', !a.글.includes('### 5. 기사 형식'));
  검('⛔ 옛 7번이 남아 있지 않다', !a.글.includes('### 7. 마지막에 이 표를 낸다'));
  검('마지막 표에 키워드 줄이 생겼다', a.글.includes(표새줄));
  검('키워드 줄이 근거 링크 위에 있다', a.글.indexOf(표새줄) < a.글.indexOf(표앵커));
  검('원래 있던 것을 안 잃었다 — 선수 이름 필수',
    a.글.includes('- 제목에 **선수 이름 필수**') && a.글.includes('### 0. 오늘 낼 날인가'));
  검('줄이 늘기만 했다', a.글.split('\n').length > 보기.split('\n').length);

  /* 🔴 두 번 돌려도 같아야 한다 — 예약을 다시 손댈 일이 반드시 생긴다 */
  const b = 고치기(a.글);
  검('두 번째는 안 건드린다', b.바뀌었나 === false && b.글 === a.글);
  검('안 건드린 까닭을 말한다', b.까닭 === '이미 들어 있다');

  /* 🔴 반만 고치지 않는다 */
  const 모자란것 = 보기.replace('### 6. 🔴 이 대화에 기사 «전문»을 그대로 쓴다', '### 6. 딴것');
  const c = 고치기(모자란것);
  검('⛔ 밀 자리가 없으면 아무것도 안 고친다', c.바뀌었나 === false && c.글 === 모자란것);
  검('무엇을 못 찾았는지 말한다', /못 찾았다/.test(c.까닭));
  const 표없는것 = 보기.replace(표앵커, '  근거  n');
  검('⛔ 표 자리가 없어도 아무것도 안 고친다', 고치기(표없는것).바뀌었나 === false);
  검('⛔ 빈 글은 안 고친다', 고치기('').바뀌었나 === false);
  검('⛔ null 에도 안 터진다', 고치기(null).바뀌었나 === false);

  /* ── 09시 — 아시안게임 종합 (사장님 2026-09-22) ─────────────────────── */
  const 구시보기 = [
    '## 중부매일 스포츠 자동기사 — 09시 배송 (평일 · 1건)',
    '### 0. 오늘 낼 날인가',
    '- 토·일이면 여기서 멈춘다.',
    '### 1. 이 회차가 맡은 것',
    '해외축구 — 전날 밤~새벽에 끝난 빅5리그, 그리고 손흥민이 뛰는 미국 메이저리그사커.',
    '- 한국 선수가 뛴 경기를 먼저 본다. 없으면 그날 가장 화제가 된 빅5리그 경기.',
    '',
    '### 2. 🔴 사실부터 확보한다 — 기억으로 쓰지 않는다',
    '- 반드시 **웹 검색**으로 오늘/어제 실제 경기를 찾는다.',
  ].join('\n');

  const g = 회차손질('09', 구시보기);
  검('09시를 손질한다', g.바뀌었나 === true);
  검('아시안게임 종합이 1순위가 된다', g.글.includes('🔴 **아시안게임 종합**'));
  검('해외축구는 «열린 날과 다음날»로 좁힌다',
    g.글.includes('경기가 열린 날과 그 다음날에만') && g.글.includes('경기가 없던 날에는 해외축구를 쓰지 않는다'));
  검('⛔ 해외축구를 통째로 지우지 않는다 — 빅5리그가 남아 있다', g.글.includes('빅5리그'));
  검('2번 항목을 안 잃는다', g.글.includes('### 2. 🔴 사실부터 확보한다'));
  검('0번 항목을 안 잃는다', g.글.includes('### 0. 오늘 낼 날인가'));
  검('머리글을 안 잃는다', g.글.startsWith('## 중부매일 스포츠 자동기사 — 09시 배송'));
  검('⛔ 옛 1번 본문이 남지 않는다', !g.글.includes('해외축구 — 전날 밤~새벽에 끝난'));
  검('두 번 돌려도 안 건드린다', 회차손질('09', g.글).바뀌었나 === false);
  검('⛔ 다른 회차는 손대지 않는다', 회차손질('10', 구시보기).바뀌었나 === false);
  검('⛔ 바꿀 자리가 없으면 아무것도 안 고친다',
    회차손질('09', '### 9. 딴것\n아무것도 없다').바뀌었나 === false);
  검('⛔ 빈 글·null 에도 안 터진다', !회차손질('09', '').바뀌었나 && !회차손질('09', null).바뀌었나);
  검('09시 이름을 바꾼다', 회차고침['09'].이름 === '스포츠 09시 — 아시안게임 종합');
  검('손질은 09시 하나뿐이다', Object.keys(회차고침).join(',') === '09');
  /* ⭐ SEO 칸과 손질이 «함께» 산다 — 하나가 다른 하나를 지우면 안 된다 */
  const 둘다 = 회차손질('09', 고치기(보기.replace('### 1. 이 회차가 맡은 것\n', '### 1. 이 회차가 맡은 것\n해외축구 — 전날 밤~새벽에 끝난 빅5리그.\n')).글);
  검('SEO 칸과 09시 손질이 함께 산다',
    둘다.글.includes(자국) && 둘다.글.includes('🔴 **아시안게임 종합**'));

  검('회차가 아홉이다', 회차.length === 9);
  검('회차가 09시부터 17시까지다', 회차[0][0] === '09' && 회차[8][0] === '17');
  검('회차마다 예약 번호가 있다', 회차.every(([, t]) => /^trig_[0-9A-Za-z]{20,}$/.test(t)));
  검('⛔ 회차를 두 곳에 적지 않는다 — 수집기 글을 읽는다',
    /* ⚠ 찾을 말을 통짜로 적으면 «이 줄 자신»이 걸린다. 조각으로 붙여서 찾는다 */
    !fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').includes(["'tr", 'ig_01'].join('')));
  검('회차 표가 없으면 빈 것을 준다', 회차읽기('아무것도 없다').length === 0);
  검('⛔ null 에도 안 터진다 — 회차읽기', 회차읽기(null).length === 0);

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 실제로 고친다 ──────────────────────────────────────────── */
if (내가진입점) {
  const 적는다 = process.argv.includes('--적는다');
  if (회차.length !== 9) { console.error(`🔴 회차를 아홉 개 못 읽었다 (${회차.length}) — 수집기를 본다`); process.exit(1); }
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');

  /* 고치기 전 원본은 손에 쥐고 있는다 — 되돌릴 길이 없으면 손대지 않는다 */
  const 되돌릴방 = path.join(뿌리, 'archive', 'raw', 'jbnews-sports-prompt',
    new Date().toLocaleDateString('sv-SE'));
  fs.mkdirSync(되돌릴방, { recursive: true });

  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await b.newPage();
  let 고친수 = 0; let 그대로 = 0; let 탈 = 0;
  try {
    await page.goto(`https://claude.ai/scheduled-task/${회차[0][1]}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await new Promise((r) => setTimeout(r, 3000));

    for (const [시, trig] of 회차) {
      const 받은 = await page.evaluate(async (조직, trig) => {
        const res = await fetch(`/api/organizations/${조직}/cowork/scheduled_tasks/${trig}`, { headers: { accept: 'application/json' } });
        return { 상태: res.status, 글: await res.text() };
      }, 조직, trig);
      if (받은.상태 !== 200) { console.log(`🔴 ${시}시 — 못 읽었다 (${받은.상태})`); 탈++; continue; }

      fs.writeFileSync(path.join(되돌릴방, `${시}시.json`), 받은.글, 'utf8');
      const 트리거 = JSON.parse(받은.글).trigger;
      /* 🔴 프롬프트는 세 곳에 «같은 것»이 비쳐 보인다 — derived_state.prompt ·
         session_request.events[1] · job_config.ccr.events[1]. 정본은 derived_state.prompt 다.
         고칠 때도 `prompt` 한 칸만 보내면 서버가 셋을 다 맞춘다 (2026-09-22 실측). */
      const 옛글 = 트리거.derived_state?.prompt;
      if (typeof 옛글 !== 'string' || !옛글) { console.log(`🔴 ${시}시 — 프롬프트 자리를 못 찾았다`); 탈++; continue; }

      /* ① 모든 회차에 같은 SEO 칸  ② 그 회차만의 손질(09시 아시안게임 등) */
      const a = 고치기(옛글);
      const b = 회차손질(시, a.글);
      const 글 = b.글;
      const 바뀌었나 = a.바뀌었나 || b.바뀌었나;
      const 까닭 = [a.까닭, b.까닭].filter(Boolean).join(' · ');
      const 새이름 = 회차고침[시]?.이름;
      const 이름바꾸나 = Boolean(새이름) && 새이름 !== 트리거.name;
      if (!바뀌었나 && !이름바꾸나) { console.log(`⬜ ${시}시 — 그대로 (${까닭})`); 그대로++; continue; }
      if (!적는다) {
        console.log(`🟡 ${시}시 — 고칠 것이 있다 (${옛글.length} → ${글.length}자)`
          + (이름바꾸나 ? ` · 이름 「${트리거.name}」 → 「${새이름}」` : '') + '. --적는다 로 써넣는다');
        고친수++; continue;
      }

      const 답 = await page.evaluate(async (조직, trig, prompt, name) => {
        const 몸 = name ? { prompt, name } : { prompt };
        const res = await fetch(`/api/organizations/${조직}/cowork/scheduled_tasks/${trig}`, {
          method: 'PATCH',
          headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: JSON.stringify(몸),
        });
        return { 상태: res.status, 글: (await res.text()).slice(0, 300) };
      }, 조직, trig, 글, 이름바꾸나 ? 새이름 : null);
      if (답.상태 !== 200) { console.log(`🔴 ${시}시 — 못 썼다 (${답.상태}) ${답.글.replace(/\s+/g, ' ')}`); 탈++; continue; }

      /* ⭐ 「썼다」를 「들어갔다」로 읽지 않는다 — 다시 읽어서 «세 곳 다» 본다 */
      const 다시 = await page.evaluate(async (조직, trig) => {
        const res = await fetch(`/api/organizations/${조직}/cowork/scheduled_tasks/${trig}`, { headers: { accept: 'application/json' } });
        return await res.text();
      }, 조직, trig);
      const t2 = JSON.parse(다시).trigger;
      const 세자리 = [
        t2.derived_state?.prompt,
        t2.session_request?.events?.[1]?.payload?.internal_anthropic_catchall?.message?.content,
        t2.job_config?.ccr?.events?.[1]?.data?.message?.content,
      ];
      const 든가 = 세자리.every((s) => String(s || '').includes(자국))
        && (!회차고침[시] || 세자리.every((s) => String(s || '').includes(회차고침[시].자국)))
        && (!새이름 || t2.name === 새이름);
      console.log(`${든가 ? '✅' : '🔴'} ${시}시 — ${든가 ? '들어갔다' : '썼다는데 안 들어 있다'}`);
      if (든가) 고친수++; else 탈++;
    }
  } finally { await page.close(); b.disconnect(); }

  console.log(`\n■ ${적는다 ? '고쳤다' : '시험만 했다'} — 고침 ${고친수} · 그대로 ${그대로} · 탈 ${탈}`);
  console.log(`   원본을 적어 뒀다 → ${path.relative(뿌리, 되돌릴방)}`);
  process.exit(탈 ? 1 : 0);
}
