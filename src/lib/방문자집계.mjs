/**
 * 방문자집계.mjs — **우리 서버가 IP로 직접 방문자를 집계한다.**
 *
 * ── 🔴 왜 만드나 (2026-11-01 · 사장님) ──────────────────────────────────
 * 사장님: 「**ip가 같은 곳은 방문자 한명(즉 순방문자)로 계산해**」
 *
 * 구글 애널리틱스로는 할 수 없다. 구글이 개인정보 보호를 이유로 IP를 제공하지 않는다.
 * 그리고 구글 수치에는 오차가 두 방향으로 동시에 있다 —
 *   ① 자동 접속을 사람으로 집계해 부풀린다 (10-30 하루 333명 중 135명이 그랬다)
 *   ② 측정 코드가 차단된 방문자를 누락한다 (같은 날 네이버 71명 vs 구글 전체 53명)
 * ⇒ 우리 서버가 직접 세는 수치만이 다툼이 없다.
 *
 * ── ⛔ 개인정보 ────────────────────────────────────────────────────
 * IP는 개인정보다. **원본을 저장하지 않는다.**
 * 되돌릴 수 없는 값(sha256)으로 바꾸고, 날짜를 섞어 **날이 바뀌면 같은 IP라도 값이 달라지게** 한다.
 * 그래서 날짜를 가로질러 한 사람을 추적할 수 없다. 우리가 아는 것은 「그 날 몇 명인가」뿐이다.
 *
 * ── 세는 규칙 ──────────────────────────────────────────────────────
 *   · 화면(HTML)을 받아 간 요청만 센다. 그림·스타일·자료 요청은 세지 않는다
 *   · 같은 IP는 그 날 몇 번을 와도 1명이다 (사장님 지시)
 *   · 조회수는 화면을 받아 간 횟수를 그대로 더한다
 *   · 사이트마다 따로 센다
 *
 * ⚠ 서버가 다시 뜨면 메모리가 비므로, 뜰 때 그 날 저장분을 읽어 들인다.
 * ⚠ 저장은 60초마다 한 번만 한다 — 요청마다 쓰면 저장소가 버티지 못한다.
 */
import crypto from 'node:crypto';
import * as store from './store.mjs';

const 소금 = process.env.VISIT_SALT || 'klifedesign-visit-2026';
const 저장주기ms = 60_000;

/** 오늘 날짜(한국시간). **이 기계가 어느 시간대에 있든 같은 답을 낸다.**
 *  🔴 [2026-11-02 · 사장님] 「관리자페이지에서 방문자수 집계 시간을 한국시간으로 바꿔」
 *  앞 식은 `9*60 - getTimezoneOffset()` 이었다. 부호가 뒤집혀 있어 **KST 기계에서는
 *  열여덟 시간을 더했다** — 11월 2일 오전 10시를 11월 3일 새벽 4시로 읽었다.
 *  UTC 서버에서만 우연히 맞았다. 이제 더하고 빼지 않고 한국시간을 직접 묻는다.
 *  ⛔ toISOString 금지 · ⛔ getTimezoneOffset 으로 날짜를 만들지 않는다 */
export function 오늘(d = new Date()) {
  const 칸 = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d).forEach((x) => { 칸[x.type] = x.value; });
  return `${칸.year}-${칸.month}-${칸.day}`;
}

/** IP를 되돌릴 수 없는 값으로 바꾼다. 날짜를 섞어 날마다 달라지게 한다 */
export function 지문(ip, 날짜) {
  return crypto.createHash('sha256').update(`${소금}|${날짜}|${String(ip ?? '')}`, 'utf8')
    .digest('hex').slice(0, 16);
}

/** 요청에서 방문자 IP를 꺼낸다. 프록시 뒤라 x-forwarded-for 맨 앞이 실제 주소다 */
export function 주소뽑기(req) {
  const h = (req?.headers?.['x-forwarded-for'] ?? '').split(',')[0].trim();
  return h || req?.socket?.remoteAddress || '';
}

/** 사이트 이름 — 포트와 www 를 떼고 소문자로 맞춘다 */
export function 사이트이름(host) {
  return String(host ?? '').toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '') || '(모름)';
}

/* ── 🔴🔴🔴 [2026-11-01 08:52 · 사장님] 「오늘 방문자가 이렇게 많다고?」 ──────────
   사장님이 보신 수치 — 케이컬처와이어 2,061명 · 서울마켓츠 1,683명 · 백년지도 1,393명.
   **사람이 아니다.** 아홉 시간 만에 그 수가 될 리 없다(어제 구글 집계는 네 곳 합쳐 198명).

   내가 만든 집계가 **자동 접속을 걸러내지 않았다.** 검색엔진 수집기·AI 수집기·보안
   스캐너가 전부 「방문자 한 명」으로 세어졌다. IP로 센다고 사람이 되는 것이 아니다.

   ⚠ 이 규칙으로도 **자기를 브라우저라고 속이는 것은 못 거른다.** 못 거른다고 적는다 —
     0으로 채우지 않는다. 그래서 화면에 「사람」과 「자동」을 **갈라서** 보여 준다.
     거른 수만 보여 주면 거르개가 틀렸을 때 아무도 모른다. */
const 자동표식 = new RegExp([
  'bot', 'crawl', 'spider', 'slurp', 'archiver', 'scrap', 'fetch', 'monitor', 'uptime',
  'pingdom', 'curl', 'wget', 'python-requests', 'python-urllib', 'go-http-client',
  'java/', 'libwww', 'okhttp', 'axios', 'node-fetch', 'headless', 'phantomjs',
  'puppeteer', 'playwright', 'lighthouse', 'preview', 'facebookexternalhit', 'embedly',
  'whatsapp', 'telegram', 'slackbot', 'discord', 'applebot', 'bytespider', 'gptbot',
  'claudebot', 'anthropic', 'ccbot', 'perplexity', 'amazonbot', 'yandex', 'baidu',
  'sogou', 'petal', 'ahrefs', 'semrush', 'mj12', 'dotbot', 'dataforseo', 'blexbot',
  'serpstat', 'zoominfo', 'censys', 'masscan', 'zgrab', 'nmap', 'expanse', 'netcraft',
  'internetmeasurement', 'feedfetcher', 'google-read-aloud', 'chrome-lighthouse',
  /* 🔴 [2026-11-02] 이름에 bot 이 없어 「사람」으로 세어지던 것들 */
  'yeti', 'daum', 'naver.me', 'mediapartners', 'adsbot', 'googleother',
  'google-inspectiontool', 'bingpreview', 'seznam', 'exabot', 'exasearch',
  'reflection.ai', 'timpi', 'webz', 'diffbot', 'cohere', 'meta-externalagent',
  'imagesift', 'awario', 'scrapy', 'postman', 'insomnia', 'guzzle', 'aiohttp',
  'httpx', 'restsharp', 'dart:io', 'symfony', 'laravel', 'http_request',
].join('|'), 'i');

/* 🔴🔴 [2026-11-02 · 사장님] 「klifemap.ai 방문자가 292인데, 어제 보고에는 10%도
   안되던데..뭔가 이상하다」 — 재어 보니 맞는 말씀이었다.

   이름을 하나씩 적어 막는 방식이 샜다. **네이버 수집기 Yeti 가 「사람」으로 세어지고
   있었다** — 이름 어디에도 bot·crawl·spider 가 없기 때문이다. 하루 166번 들어왔다.

   ⇒ 이름을 더 적는 대신 **수집기가 스스로 밝히는 표식**을 규칙으로 세운다.
     수집기는 관례로 UA 안에 제 집 주소나 메일을 「+http…」·「+mailto:」 로 적는다.
     사람이 쓰는 브라우저는 그런 것을 절대 적지 않는다. 이 한 줄이 Yeti 도,
     앞으로 나올 이름 모르는 수집기도 함께 잡는다. */
const 제집주소를밝히나 = /\+(https?:\/\/|mailto:)/i;

/** 사람이 연 것인가. ⛔ 브라우저 이름이 아예 없으면 사람으로 보지 않는다 — 진짜 브라우저는 보낸다 */
export function 사람인가(ua) {
  const s = String(ua ?? '').trim();
  if (!s) return false;
  if (자동표식.test(s)) return false;
  if (제집주소를밝히나.test(s)) return false;   /* 수집기가 스스로 밝힌 제 집 주소 */
  if (/^node\b/i.test(s)) return false;         /* 우리 스크립트가 두드린 것 */
  return /mozilla|opera|safari|chrome|firefox|edge/i.test(s);
}

/* 날짜 → 사이트 → { 사람: Set, 자동: Set, 조회수, 자동조회수, 이름표: Map } */
const 담는곳 = new Map();
let 바뀜 = false;
let 불러온날 = null;

function 그날칸(날짜) {
  if (!담는곳.has(날짜)) 담는곳.set(날짜, new Map());
  return 담는곳.get(날짜);
}

function 빈칸() { return { 사람: new Set(), 자동: new Set(), 조회수: 0, 자동조회수: 0, 이름표: new Map() }; }

/** 한 번 받아 간 것을 센다. **사람과 자동을 갈라서 센다** (2026-11-01) */
export function 기록(host, ip, ua, 날짜 = 오늘()) {
  const 칸 = 그날칸(날짜);
  const 이름 = 사이트이름(host);
  if (!칸.has(이름)) 칸.set(이름, 빈칸());
  const 것 = 칸.get(이름);
  바뀜 = true;
  const 값 = 지문(ip, 날짜);
  /* 누가 긁어 가는지 사장님도 보셔야 한다 — 브라우저 이름을 그대로 센다.
     ⛔ 개인을 가리키는 것이 아니라 프로그램 이름이다. 주소는 여기 적지 않는다. */
  const 표 = String(ua ?? '').slice(0, 120) || '(이름 없음)';
  것.이름표.set(표, (것.이름표.get(표) ?? 0) + 1);
  if (!사람인가(ua)) {
    것.자동조회수 += 1;
    것.자동.add(값);
    return false;
  }
  것.조회수 += 1;
  if (!것.사람.has(값)) { 것.사람.add(값); return true; }
  return false;
}

/** 그 날 집계 — { 사이트: { 방문자, 조회수 } } */
export function 집계(날짜 = 오늘()) {
  const 칸 = 담는곳.get(날짜);
  const 답 = {};
  if (!칸) return 답;
  for (const [이름, 것] of 칸) {
    답[이름] = {
      방문자: 것.사람.size, 조회수: 것.조회수,
      자동: 것.자동.size, 자동조회수: 것.자동조회수,
      이름표: [...것.이름표].sort((a, b) => b[1] - a[1]).slice(0, 25),
    };
  }
  return 답;
}

const 저장이름 = (날짜) => `visits/${날짜}.json`;

/** 저장소에 적는다 — 지문 목록과 조회수를 함께 둔다(서버가 다시 떠도 이어 세려면 목록이 필요하다) */
export async function 저장하기(날짜 = 오늘()) {
  const 칸 = 담는곳.get(날짜);
  if (!칸) return false;
  const 몸 = { 날짜, 사이트: {} };
  for (const [이름, 것] of 칸) {
    몸.사이트[이름] = {
      지문들: [...것.사람], 조회수: 것.조회수,
      자동지문들: [...것.자동], 자동조회수: 것.자동조회수,
      이름표: Object.fromEntries([...것.이름표].sort((a, b) => b[1] - a[1]).slice(0, 40)),
    };
  }
  await store.put(저장이름(날짜), JSON.stringify(몸), 'application/json');
  바뀜 = false;
  return true;
}

/** 저장해 둔 것을 읽어 메모리에 올린다 — 서버가 다시 뜰 때 한 번 */
export async function 불러오기(날짜 = 오늘()) {
  if (불러온날 === 날짜) return false;
  불러온날 = 날짜;
  let 글 = null;
  try { 글 = await store.get(저장이름(날짜)); } catch (e) { 글 = null; }
  if (!글) return false;
  let 몸 = null;
  try { 몸 = JSON.parse(typeof 글 === 'string' ? 글 : Buffer.from(글).toString('utf8')); } catch (e) { return false; }
  if (!몸 || !몸.사이트) return false;
  const 칸 = 그날칸(날짜);
  for (const [이름, 것] of Object.entries(몸.사이트)) {
    칸.set(이름, {
      사람: new Set(것.지문들 ?? []), 조회수: Number(것.조회수 ?? 0),
      자동: new Set(것.자동지문들 ?? []), 자동조회수: Number(것.자동조회수 ?? 0),
      이름표: new Map(Object.entries(것.이름표 ?? {})),
    });
  }
  return true;
}

/** 저장해 둔 날의 집계를 읽는다 — 지난 날짜를 볼 때 쓴다 */
export async function 지난날집계(날짜) {
  let 글 = null;
  try { 글 = await store.get(저장이름(날짜)); } catch (e) { 글 = null; }
  if (!글) return null;
  try {
    const 몸 = JSON.parse(typeof 글 === 'string' ? 글 : Buffer.from(글).toString('utf8'));
    const 답 = {};
    for (const [이름, 것] of Object.entries(몸.사이트 ?? {})) {
      답[이름] = {
        방문자: (것.지문들 ?? []).length, 조회수: Number(것.조회수 ?? 0),
        자동: (것.자동지문들 ?? []).length, 자동조회수: Number(것.자동조회수 ?? 0),
        이름표: Object.entries(것.이름표 ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 25),
      };
    }
    return 답;
  } catch (e) { return null; }
}

let 시계 = null;
/** 서버가 뜰 때 한 번 부른다 — 그 날 저장분을 읽고, 60초마다 저장한다 */
export async function 시작한다() {
  await 불러오기().catch(() => {});
  if (시계) return;
  시계 = setInterval(() => {
    if (!바뀜) return;
    저장하기().catch(() => { /* 저장에 실패해도 집계는 계속한다 */ });
  }, 저장주기ms);
  if (시계.unref) 시계.unref();
}

/* ── 자가시험 ───────────────────────────────────────────────────── */
export function 자가시험() {
  const 결 = [];
  const T = (이름, 참) => 결.push({ 이름, 참: !!참 });

  T('⛔ 날짜에 toISOString 을 쓰지 않는다 — 한국시간으로 센다',
    오늘(new Date('2026-10-31T16:30:00Z')) === '2026-11-01');
  /* 🔴 [2026-11-02 · 사장님 「방문자수 집계 시간을 한국시간으로 바꿔」]
     앞 식(`9*60 - getTimezoneOffset()`)은 부호가 뒤집혀 있어 UTC 서버에서만 맞았다.
     KST 기계에서는 열여덟 시간을 더해 날이 하루 앞섰다. 아래 세 줄이 그것을 잡는다 —
     이 검사는 재는 기계가 어느 시간대에 있든 같은 답을 요구한다. */
  T('🔴 재는 기계가 KST 든 UTC 든 같은 날을 낸다',
    오늘(new Date('2026-11-02T01:00:00Z')) === '2026-11-02');
  T('🔴 한국시간 자정 1분 전은 아직 그 날이다',
    오늘(new Date('2026-11-02T14:59:00Z')) === '2026-11-02');
  T('🔴 한국시간 자정을 넘기면 다음 날이다',
    오늘(new Date('2026-11-02T15:01:00Z')) === '2026-11-03');
  T('같은 IP·같은 날은 같은 값이다', 지문('1.2.3.4', '2026-11-01') === 지문('1.2.3.4', '2026-11-01'));
  T('🔴 날이 바뀌면 같은 IP라도 값이 달라진다 — 날을 가로질러 추적할 수 없다',
    지문('1.2.3.4', '2026-11-01') !== 지문('1.2.3.4', '2026-11-02'));
  T('⛔ 원본 주소가 값에 남지 않는다', !지문('1.2.3.4', '2026-11-01').includes('1.2.3'));
  T('www 와 포트를 떼고 같은 사이트로 본다',
    사이트이름('www.kculturewire.com:443') === 'kculturewire.com');

  /* 🔴 [2026-11-01 · 사장님 「오늘 방문자가 이렇게 많다고?」] 자동 접속 거르기 */
  const 사람 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
  T('검색엔진 수집기는 사람이 아니다', !사람인가('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'));
  T('AI 수집기는 사람이 아니다', !사람인가('Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)'));
  T('AI 수집기는 사람이 아니다 (둘째)', !사람인가('Mozilla/5.0 (compatible; ClaudeBot/1.0)'));
  T('보안 스캐너는 사람이 아니다', !사람인가('Mozilla/5.0 zgrab/0.x'));
  /* 🔴🔴 [2026-11-02 · 사장님 「292인데… 뭔가 이상하다」] 이름에 bot 이 없는 수집기.
     Yeti 가 하루 166번 들어와 전부 「사람」으로 세어졌다. 이 줄들이 그것을 잡는다 */
  T('🔴 네이버 수집기(Yeti)는 사람이 아니다',
    !사람인가('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko; compatible; Yeti/1.1; +https://naver.me/bf7vcQn) Chrome/125.0.0.0 Safari/537.36'));
  T('🔴 제 집 주소를 밝히면 이름을 몰라도 수집기다',
    !사람인가('Mozilla/5.0 (compatible; NeverSeenBefore/9.9; +https://example.ai/crawler) Chrome/140.0 Safari/537.36'));
  T('🔴 메일 주소를 밝혀도 수집기다',
    !사람인가('Mozilla/5.0 (compatible; SomeAgent/1.0; +mailto:hi@example.com)'));
  T('🔴 우리 스크립트(node)가 두드린 것은 방문자가 아니다',
    !사람인가('node') && !사람인가('node/26.3.1'));
  T('⛔ 대조군 — 진짜 브라우저에는 + 로 시작하는 주소가 없다',
    사람인가('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'));
  T('명령줄 도구는 사람이 아니다', !사람인가('curl/8.4.0') && !사람인가('python-requests/2.31.0'));
  T('⛔ 브라우저 이름이 없으면 사람으로 보지 않는다', !사람인가('') && !사람인가(null));
  T('진짜 브라우저는 사람이다', 사람인가(사람));
  T('휴대폰 브라우저도 사람이다',
    사람인가('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1'));

  담는곳.clear();
  기록('seoulmarkets.com', '1.1.1.1', 사람, '2026-11-01');
  기록('seoulmarkets.com', '1.1.1.1', 사람, '2026-11-01');
  기록('seoulmarkets.com', '2.2.2.2', 사람, '2026-11-01');
  기록('seoulmarkets.com', '9.9.9.9', 'Googlebot/2.1', '2026-11-01');
  기록('seoulmarkets.com', '9.9.9.8', 'Googlebot/2.1', '2026-11-01');
  const a = 집계('2026-11-01');
  T('🔴 같은 IP는 몇 번 와도 1명이다 (사장님 지시)', a['seoulmarkets.com'].방문자 === 2);
  T('조회수는 받아 간 횟수를 그대로 더한다', a['seoulmarkets.com'].조회수 === 3);
  T('🔴 자동 접속은 방문자에 안 들어간다', a['seoulmarkets.com'].방문자 === 2);
  T('🔴 자동 접속은 버리지 않고 따로 센다 — 거르개가 틀리면 보여야 한다',
    a['seoulmarkets.com'].자동 === 2 && a['seoulmarkets.com'].자동조회수 === 2);
  T('누가 긁어 가는지 이름이 남는다',
    a['seoulmarkets.com'].이름표.some((x) => x[0].includes('Googlebot') && x[1] === 2));

  기록('100yearmap.com', '3.3.3.3', 사람, '2026-11-01');
  T('사이트마다 따로 센다', 집계('2026-11-01')['100yearmap.com'].방문자 === 1);
  T('다른 날은 섞이지 않는다', Object.keys(집계('2026-10-31')).length === 0);
  담는곳.clear();

  const 깨짐 = 결.filter((x) => !x.참);
  결.forEach((x) => console.log((x.참 ? '  ✅ ' : '  ❌ ') + x.이름));
  console.log(깨짐.length ? `\n■ 자가시험 ${깨짐.length}건 실패` : '\n■ 자가시험 모두 통과');
  return 깨짐.length === 0;
}
