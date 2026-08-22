#!/usr/bin/env node
/**
 * measure-kcw-next-step.mjs — **손님이 지면 하나를 보고 다음 걸음을 걷나**를 잰다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-22 에 내가 사장님께 이렇게 적었다 —
 *   「지금은 **지면별 다음 걸음을 못 재고 있어서**, 무엇이 먹히는지 짐작으로 말할 수밖에
 *    없습니다. 그것부터 끊겠습니다.」
 * 그 뒤로 나는 지면을 열다섯 장 더 냈다. 재지 않고 낸 것이다.
 *
 * ⭐ GA4 로 재려 했는데 프로젝트에서 Data/Admin API 가 **꺼져 있다** — 사람 손이 한 번 필요하다.
 *   ⛔ 그것을 기다리며 손 놓지 않는다. **우리 서버가 이미 재고 있었다**(`src/lib/traffic.mjs`).
 *   하루치 집계가 R2 에 쌓인다: 「호스트 · 경로 · 유입도메인 · 봇여부」.
 *   유입도메인이 **우리 집**이면 그 요청은 손님이 우리 안에서 옮긴 한 걸음이다.
 *
 * ── 이 자가 말할 수 있는 것 · 없는 것 ────────────────────────
 * ✅ 지면 하나가 열린 수, 그중 **우리 안에서 온 것**의 몫(= 걸어 들어온 걸음)
 * ✅ 밖에서 곧장 떨어진 수(검색·직접) — 그 지면이 **현관**인지 **방**인지가 갈린다
 * ⛔ **어느 지면에서 왔는지는 모른다.** 유입 도메인만 남기고 경로는 안 남긴다
 *   (개인 식별을 안 만들기로 한 결정이다 — 그 결정을 이 셈 편하자고 뒤집지 않는다)
 * ⛔ 한 사람이 몇 장을 봤는지도 모른다. 쿠키·세션·IP 를 안 남긴다.
 *   그러니 이 자는 「이탈률」을 말하지 않는다. **말할 수 있는 말만 한다.**
 * ⚠ 봇은 뺀다. 봇을 넣으면 크롤러가 많이 온 지면이 「인기 지면」이 된다.
 *
 * 쓰는 법  node scripts/measure-kcw-next-step.mjs --자가시험
 *          node scripts/measure-kcw-next-step.mjs --잰다 [--날수=7] [--쓴다]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/wikitip-next-step.json');
/** 우리 집 이름들. ⚠ www 붙은 것과 안 붙은 것이 따로 온다 */
export const 우리집 = ['kculturewire.com', 'www.kculturewire.com'];

/** `.env` 를 손으로 읽는다 — 이 저장소가 쓰는 방식과 같게 둔다 */
function 환경읽기() {
  try {
    const 본문 = fs.readFileSync(path.join(뿌리, '.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 그만 */ }
}

/**
 * 집계 열쇠 한 줄을 뜯는다. 꼴: 호스트\t경로\t유입도메인\t봇(1/0)\t봇종류\t딱지
 *
 * ⭐ 여섯째 칸(`딱지`)이 `?from=` 이다. 서버가 흰 목록으로 이 하나만 남긴다.
 *   **어느 자리의 문이 눌렸나**를 이것으로 가른다 — 꼬리말인가 본문인가 머리띠인가.
 *   ⛔ 물음표 뒤 나머지는 안 남는다(손님이 친 검색어가 들어올 수 있는 자리다).
 */
export function 열쇠뜯기(열쇠) {
  const 칸 = String(열쇠).split('\t');
  return {
    host: 칸[0] ?? '',
    pathname: 칸[1] ?? '',
    referer: 칸[2] ?? '',
    bot: 칸[3] === '1',
    딱지: 칸[5] ?? '',
  };
}

/**
 * 우리 집에서 온 요청인가 = 손님이 우리 안에서 옮긴 걸음인가.
 *
 * 🔴🔴 2026-08-22 — 첫 판이 **0.0%** 를 냈다. 「사람이 이레 동안 한 번도 안 눌렀다」는
 *   말이 되는데, 그 말을 그대로 올리기 전에 자를 의심한 것이 맞았다.
 *   서버(`src/lib/traffic.mjs:140`)는 우리 집에서 온 것을 **도메인 이름으로 적지 않는다** —
 *   `(내부)` 라는 딱지로 적는다. 내 자는 도메인 이름만 찾고 있었으니 영원히 0 이 나온다.
 *   ⭐ 「0」을 발견으로 올리기 전에 **0 을 만들 수 있는 자의 흠**을 먼저 찾는다.
 *     이 흠은 지면 하나가 아니라 **판단 전부**를 뒤집을 수 있었다.
 * ⚠ 도메인 꼴도 계속 받아 준다 — 서버 규칙이 바뀌어도 이 자가 조용히 0 이 되지 않게.
 */
export const 안에서왔나 = (유입) => {
  const raw = String(유입 ?? '').trim();
  if (raw === '(내부)') return true;
  const s = raw.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  return 우리집.includes(s);
};

/** 밖에서 곧장 떨어진 것인가(검색·직접·남의 집) */
export const 밖에서왔나 = (유입) => !안에서왔나(유입);

/**
 * 하루치 집계 여러 장을 지면별로 접는다.
 * ⛔ 봇은 세지 않는다. ⛔ 우리 호스트가 아닌 줄은 세지 않는다(한 서버가 네 집을 낸다).
 */
export function 지면별로접기(집계들) {
  const 표 = new Map();
  /** 딱지별 안쪽 걸음 — 어느 자리의 문이 실제로 눌리나 */
  const 딱지별 = new Map();
  let 봇줄 = 0, 남의집줄 = 0;
  for (const 집계 of 집계들) {
    for (const [열쇠, 수] of Object.entries(집계 ?? {})) {
      const r = 열쇠뜯기(열쇠);
      if (r.bot) { 봇줄 += 수; continue; }
      if (!우리집.includes(r.host)) { 남의집줄 += 수; continue; }
      const 칸 = 표.get(r.pathname) ?? { pathname: r.pathname, views: 0, inside: 0, outside: 0 };
      칸.views += 수;
      if (안에서왔나(r.referer)) {
        칸.inside += 수;
        /* ⚠ 딱지가 없는 안쪽 걸음은 「딱지 안 붙인 문」이다. 0 으로 지우지 않고 그대로 센다 —
           그 수가 크다는 것은 「어디를 눌렀는지 모른다」는 뜻이고, 그것도 결과다 */
        const 이름 = r.딱지 || '(딱지없음)';
        딱지별.set(이름, (딱지별.get(이름) ?? 0) + 수);
      } else 칸.outside += 수;
      표.set(r.pathname, 칸);
    }
  }
  return { 표, 딱지별, 봇줄, 남의집줄 };
}

/**
 * 지면 하나의 얼굴. ⛔ 열린 수가 0 이면 몫을 만들지 않는다 — 0/0 은 0% 가 아니다.
 */
export const 걸음몫 = (칸) => (칸.views > 0 ? 칸.inside / 칸.views : null);

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('열쇠를 칸으로 뜯는다', 열쇠뜯기('www.kculturewire.com\t/a\t(직접)\t0\t').pathname === '/a');
  검('봇 칸을 읽는다', 열쇠뜯기('h\t/a\tx\t1\t기타').bot === true);
  /* 🔴 이 칸이 없어서 첫 판이 0.0% 를 냈다. 서버는 우리 집을 `(내부)` 로 적는다 */
  검('⭐⭐ 서버가 적는 (내부) 를 안쪽 걸음으로 센다', 안에서왔나('(내부)'));
  /* ⚠ 서버가 실제로 적는 딱지는 넷이다 — (직접) · (알수없음) · (내부) · 우리:<집> · 그 밖은 도메인.
     형제 사이트에서 온 것은 우리 안의 걸음이 아니다. 그건 «사이트 간 유입»으로 따로 볼 값이다 */
  검('⛔ 형제 사이트에서 온 것은 안쪽 걸음이 아니다', 밖에서왔나('우리:seoulmarkets.com'));
  검('⛔ (알수없음) 도 안쪽 걸음이 아니다', 밖에서왔나('(알수없음)'));
  검('우리 집에서 온 것을 안다', 안에서왔나('www.kculturewire.com') && 안에서왔나('kculturewire.com'));
  검('주소 꼴로 와도 안다', 안에서왔나('https://www.kculturewire.com/most-read'));
  검('대소문자를 가리지 않는다', 안에서왔나('WWW.KCultureWire.com'));
  검('⛔ 검색엔진은 안에서 온 것이 아니다', 밖에서왔나('google.com'));
  검('⛔ 직접 방문도 안에서 온 것이 아니다', 밖에서왔나('(직접)'));
  검('⛔ 이름이 비슷한 남의 집은 우리 집이 아니다', 밖에서왔나('kculturewire.com.evil.example'));

  const 집계 = {
    'www.kculturewire.com\t/most-read\t(직접)\t0\t': 10,
    'www.kculturewire.com\t/most-read\twww.kculturewire.com\t0\t': 30,
    'www.kculturewire.com\t/most-read\tgooglebot\t1\t검색봇': 900,
    'seoulmarkets.com\t/equities\t(직접)\t0\t': 55,
    'www.kculturewire.com\t/born-on\tgoogle.com\t0\t': 8,
  };
  const { 표, 봇줄, 남의집줄 } = 지면별로접기([집계]);
  검('봇을 뺀다', 봇줄 === 900 && 표.get('/most-read').views === 40);
  검('남의 집을 뺀다', 남의집줄 === 55 && !표.has('/equities'));
  검('안에서 온 것과 밖에서 온 것을 가른다',
    표.get('/most-read').inside === 30 && 표.get('/most-read').outside === 10);
  검('검색으로 온 지면은 안쪽 걸음이 0 이다', 표.get('/born-on').inside === 0);
  검('몫을 낸다', Math.abs(걸음몫(표.get('/most-read')) - 0.75) < 1e-9);
  검('⛔ 0 으로 나누지 않는다', 걸음몫({ views: 0, inside: 0 }) === null);
  검('하루치 여러 장을 합친다', 지면별로접기([집계, 집계]).표.get('/most-read').views === 80);
  /* ⭐ 딱지 — 어느 자리의 문이 눌렸나. 딱지 없는 걸음도 지우지 않고 센다 */
  const 딱지집계 = {
    'www.kculturewire.com	/a	(내부)	0		body': 5,
    'www.kculturewire.com	/a	(내부)	0		related': 2,
    'www.kculturewire.com	/a	(내부)	0		': 3,
    'www.kculturewire.com	/a	google.com	0		': 40,
  };
  const 딱 = 지면별로접기([딱지집계]).딱지별;
  검('본문 문과 관련기사 문을 갈라 센다', 딱.get('body') === 5 && 딱.get('related') === 2);
  검('⛔ 딱지 없는 안쪽 걸음을 지우지 않는다', 딱.get('(딱지없음)') === 3);
  검('⛔ 밖에서 온 것은 딱지에 안 센다', [...딱.values()].reduce((a,b)=>a+b,0) === 10);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ measure-kcw-next-step 자가시험 통과 (19)');
  process.exit(0);
}

if (!process.argv.includes('--잰다')) {
  console.error('⛔ --잰다 나 --자가시험 을 준다');
  process.exit(1);
}

환경읽기();
const { get, remoteEnabled } = await import(new URL('../src/lib/store.mjs', import.meta.url).href);
if (!remoteEnabled) {
  console.log('⚠ 못 쟀다 — R2 자격이 이 창에 없다. 「0」이라고 적지 않는다.');
  process.exit(0);
}

const 날수 = Number((process.argv.find((a) => a.startsWith('--날수='))?.split('=')[1]) ?? 7);
const 날짜문자 = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

const 집계들 = [];
const 읽은날 = [];
const 못읽은날 = [];
for (let i = 1; i <= 날수; i++) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const 날 = 날짜문자(d);
  try {
    const raw = await get(`raw/traffic/${날}.json`);
    if (!raw) { 못읽은날.push(날); continue; }
    const s = Buffer.isBuffer(raw) ? raw.toString('utf8')
      : (typeof raw === 'string' ? raw : Buffer.from(Object.values(raw)).toString('utf8'));
    const j = JSON.parse(s);
    집계들.push(j.집계 ?? {});
    읽은날.push(날);
  } catch { 못읽은날.push(날); }
}

if (!집계들.length) {
  console.log('⚠ 못 쟀다 — 읽을 하루치가 없다. 「손님이 0 명」이 아니다.');
  process.exit(0);
}

const { 표, 봇줄, 남의집줄 } = 지면별로접기(집계들);
const 줄 = [...표.values()].sort((a, b) => b.views - a.views);
const 총열림 = 줄.reduce((a, x) => a + x.views, 0);
const 총안쪽 = 줄.reduce((a, x) => a + x.inside, 0);

/* ⭐ 읽힌 지면만 본다. 열린 수가 0 인 지면은 이 표에 아예 안 나온다 —
   「몫 0%」로 적으면 재 본 것처럼 읽힌다. 안 열린 것은 따로 센다 */
const 열린지면 = 줄.length;

console.log(`\n# 손님이 다음 걸음을 걷나 — 최근 ${읽은날.length}일 (${읽은날[읽은날.length - 1]} ~ ${읽은날[0]})`);
console.log(`\n  지면 열림 ${총열림.toLocaleString('en-US')} · 그중 우리 안에서 온 것 ${총안쪽.toLocaleString('en-US')}`
  + ` (${총열림 ? (총안쪽 / 총열림 * 100).toFixed(1) : '—'}%)`);
console.log(`  열린 지면 ${열린지면}장 · 뺀 봇 ${봇줄.toLocaleString('en-US')} · 뺀 남의 집 ${남의집줄.toLocaleString('en-US')}`);
if (못읽은날.length) console.log(`  ⚠ 못 읽은 날 ${못읽은날.length}일 — ${못읽은날.join(', ')}`);

console.log('\n## 많이 열린 지면 스물 — 그중 걸어 들어온 몫');
for (const x of 줄.slice(0, 20)) {
  const m = 걸음몫(x);
  console.log(`  ${String(x.views).padStart(7)}  안쪽 ${String(Math.round((m ?? 0) * 100)).padStart(3)}%  ${x.pathname}`);
}

/* 🔴 이 두 줄이 이 자를 만든 까닭이다 — 「현관인가 방인가」 */
const 현관 = 줄.filter((x) => x.views >= 20 && (걸음몫(x) ?? 0) < 0.1);
const 방 = 줄.filter((x) => x.views >= 20 && (걸음몫(x) ?? 0) >= 0.5);
console.log(`\n## 밖에서만 오는 지면(현관) ${현관.length}장 — 열림 20 이상 · 안쪽 10% 미만`);
현관.slice(0, 10).forEach((x) => console.log(`  ${String(x.views).padStart(7)}  ${x.pathname}`));
console.log(`\n## 우리 안에서 걸어와 열리는 지면(방) ${방.length}장 — 열림 20 이상 · 안쪽 50% 이상`);
방.slice(0, 10).forEach((x) => console.log(`  ${String(x.views).padStart(7)}  안쪽 ${Math.round((걸음몫(x) ?? 0) * 100)}%  ${x.pathname}`));

if (process.argv.includes('--쓴다')) {
  fs.writeFileSync(낼길, JSON.stringify({
    measuredAt: 읽은날[0] ?? null,
    daysRead: 읽은날,
    daysMissing: 못읽은날,
    whatThisIs: 'Pages opened on kculturewire.com over the days listed, split by whether the visitor arrived from somewhere else on this site or from outside it. Counted on our own server, bots removed.',
    whatThisIsNot: 'Not a session count and not a bounce rate. We keep no cookie, no IP and no session, so we cannot tell how many pages one person saw, or which page they came from — only whether the previous page was ours.',
    views: 총열림,
    fromInside: 총안쪽,
    pagesOpened: 열린지면,
    botsRemoved: 봇줄,
    rows: 줄.slice(0, 200),
  }, null, 1));
  console.log(`\n적었다 → ${path.relative(뿌리, 낼길)}`);
} else {
  console.log('\n⚠ 아직 안 적었다. 적으려면 --쓴다');
}
