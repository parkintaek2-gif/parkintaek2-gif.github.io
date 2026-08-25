/**
 * measure-referrals.mjs — **밖에서 «누가» 사람을 보내고 있나.**
 *
 * ── 🔴 왜 이 자가 생겼나 ───────────────────────────────────────
 * 2026-08-24 밤에 유튜브 10편을 올렸고 **설명 첫 줄이 전부 우리 지면 주소**다.
 * 그것이 우리 유일한 «밖의 문»인데, 다음 날 오후까지 **그 문으로 사람이 오는지 한 번도
 * 안 쟀다.** 자 669개를 훑어 보니 유입 «경로»를 재는 자가 0개였다 —
 * 있는 것은 R2 집계를 읽는 traffic-report 뿐이고 그건 어디서 왔는지를 안 가른다.
 *
 * ⭐ 이 자가 답하는 것은 하나다 — **「밖의 어느 문이 사람을 보내나」**
 *   그리고 그 답이 「아무 데도 안 보낸다」면 그것도 답이다. 0 을 0 이라고 적는다.
 *
 * ── ⛔ 이 자가 «말하지 않는» 것 ────────────────────────────────
 * ⛔ Direct 를 「직접 온 사람」이라고 읽지 않는다. **거기 우리 여섯 유닛이 섞여 있다.**
 *   여섯이 하루에도 몇 번씩 자기 사이트를 연다 — 그 수를 성과로 읽으면 스스로를 센다.
 * ⛔ 노출·클릭이 아니다. GA4 가 «도착한 세션»을 센 것이고, 광고차단·쿠키거부로 덜 센다.
 * ⛔ 세션이 적은 줄은 흔들린다. 세션 수를 같이 적는다.
 *
 * 쓰는 법  node scripts/measure-referrals.mjs --자가시험
 *          node scripts/measure-referrals.mjs --잰다
 *          node scripts/measure-referrals.mjs --잰다 --날수=3
 */
import { readFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';

const 속성 = '549135289';
const 사이트표 = [
  ['100yearmap.com', '3번 100yearmap'],
  ['kculturewire.com', '5번 K Culture Wire'],
  ['klifemap.ai', '1·4번 KLifeMap'],
  ['seoulmarkets.com', '6번 SeoulMarkets'],
];

const 인자 = (이름, 기본) => {
  const 머리 = `--${이름}=`;
  const a = process.argv.find((x) => x.startsWith(머리));
  return a ? a.slice(머리.length) : 기본;
};

/** `.env` 에서 열쇠 자리를 읽는다. ⛔ 값을 찍지 않는다 — 있는지 없는지만 말한다 */
export function 열쇠자리() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  try {
    const 본문 = readFileSync(path.resolve('.env'), 'utf8');
    const m = 본문.match(/^GOOGLE_APPLICATION_CREDENTIALS\s*=\s*(.+)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
  } catch { return null; }
}

/**
 * 그 문이 «우리 자신»인가. Direct 와 우리 네 사이트끼리 오가는 것은 밖에서 온 것이 아니다.
 * ⛔ 이것을 안 가르면 우리가 우리를 세면서 「유입이 늘었다」고 적게 된다.
 */
export function 우리것인가(출처) {
  const s = String(출처 ?? '').toLowerCase();
  if (!s || s === '(direct)' || s === 'direct' || s === '(none)') return true;
  return 사이트표.some(([집]) => s.includes(집));
}

/** 사람이 읽는 이름으로 — 흔한 문은 어디서 온 것인지 밝혀 적는다 */
export function 문이름(출처, 매체) {
  const s = String(출처 ?? '').toLowerCase();
  if (/youtube/.test(s)) return 'YouTube';
  if (/google/.test(s) && /organic/.test(String(매체 ?? ''))) return 'Google 검색';
  if (/bing|duckduckgo|yandex|naver|daum/.test(s)) return `${출처} 검색`;
  if (/reddit/.test(s)) return 'Reddit';
  if (/t\.co|twitter|x\.com/.test(s)) return 'X(트위터)';
  if (/facebook|instagram/.test(s)) return String(출처);
  return String(출처 ?? '(모름)');
}

/** 줄들을 문별로 접는다 — 우리 것과 밖의 것을 «갈라» 담는다 */
export function 접는다(줄들) {
  const 밖 = new Map();
  const 우리 = new Map();
  for (const r of 줄들 ?? []) {
    const 출처 = r?.dimensionValues?.[0]?.value ?? '';
    const 매체 = r?.dimensionValues?.[1]?.value ?? '';
    const 세션 = Number(r?.metricValues?.[0]?.value ?? 0);
    const 사람 = Number(r?.metricValues?.[1]?.value ?? 0);
    const 담을곳 = 우리것인가(출처) ? 우리 : 밖;
    const 이름 = 우리것인가(출처) ? (출처 || '(direct)') : 문이름(출처, 매체);
    const 앞 = 담을곳.get(이름) ?? { 세션: 0, 사람: 0 };
    담을곳.set(이름, { 세션: 앞.세션 + 세션, 사람: 앞.사람 + 사람 });
  }
  return { 밖, 우리 };
}

/* ────────────────────────── 자가시험 ────────────────────────── */
function 자가시험() {
  const 시험 = [];
  const T = (이름, 참) => 시험.push([이름, !!참]);

  /* 🔴 Direct 를 「밖에서 온 사람」으로 세면 우리가 우리를 센다.
     8/25 아침에 KLifeMap 체류시간 6분 38초를 좋은 신호로 읽었다가
     4번이 「대부분 우리 자신의 테스트/direct」라고 재서 답해 줘 정정했다. 그 자리다 */
  T('우리것 — (direct) 는 밖이 아니다', 우리것인가('(direct)'));
  T('우리것 — 빈 값도 밖이 아니다', 우리것인가(''));
  T('우리것 — (none) 도 밖이 아니다', 우리것인가('(none)'));
  T('우리것 — 우리 네 사이트끼리는 밖이 아니다', 우리것인가('www.kculturewire.com'));
  T('우리것 — 100yearmap 도 우리 것', 우리것인가('100yearmap.com'));
  T('우리것 — 유튜브는 «밖»이다', !우리것인가('youtube.com'));
  T('우리것 — 구글은 «밖»이다', !우리것인가('google'));

  T('문이름 — 유튜브를 알아본다', 문이름('m.youtube.com', 'referral') === 'YouTube');
  T('문이름 — 구글 자연검색', 문이름('google', 'organic') === 'Google 검색');
  T('문이름 — 레딧', 문이름('out.reddit.com', 'referral') === 'Reddit');
  T('문이름 — 모르는 것은 그대로 적는다(억지로 안 묶는다)',
    문이름('example.com', 'referral') === 'example.com');
  T('문이름 — 빈 값에 안 터진다', 문이름(undefined, undefined) === '(모름)');

  const 줄 = [
    { dimensionValues: [{ value: 'm.youtube.com' }, { value: 'referral' }], metricValues: [{ value: '3' }, { value: '3' }] },
    { dimensionValues: [{ value: 'youtube.com' }, { value: 'referral' }], metricValues: [{ value: '2' }, { value: '2' }] },
    { dimensionValues: [{ value: '(direct)' }, { value: '(none)' }], metricValues: [{ value: '50' }, { value: '40' }] },
    { dimensionValues: [{ value: 'google' }, { value: 'organic' }], metricValues: [{ value: '7' }, { value: '7' }] },
  ];
  const r = 접는다(줄);
  T('접기 — 유튜브 두 줄을 한 문으로 모은다', r.밖.get('YouTube').세션 === 5);
  T('접기 — Direct 를 «밖»에 안 담는다', !r.밖.has('(direct)'));
  T('접기 — Direct 를 «버리지도» 않는다(따로 담는다)', r.우리.get('(direct)').세션 === 50);
  T('접기 — 구글 검색은 밖에 담는다', r.밖.get('Google 검색').세션 === 7);
  T('접기 — 빈 입력에 안 터진다', 접는다(undefined).밖.size === 0);

  T('열쇠자리 — 없으면 null 이다(빈 글자가 아니다)',
    열쇠자리() === null || typeof 열쇠자리() === 'string');

  const 진 = 시험.filter(([, ok]) => !ok);
  for (const [이름] of 진) console.error(`❌ ${이름}`);
  if (진.length) { console.error(`⛔ measure-referrals 자가시험 ${진.length}개 실패`); process.exit(1); }
  console.log(`✅ measure-referrals 자가시험 통과 (${시험.length})`);
}

/* ────────────────────────── 실행 ────────────────────────── */
if (process.argv.includes('--자가시험')) {
  자가시험();
} else if (!process.argv.includes('--잰다')) {
  console.error('⛔ --잰다 나 --자가시험 을 준다');
  process.exit(1);
} else {
  const 키길 = 열쇠자리();
  if (!키길 || !existsSync(키길)) {
    console.error('⛔ 서비스 계정 열쇠가 없다 — **못 쟀다**. 0 으로 적지 않는다');
    process.exit(1);
  }
  const 키 = JSON.parse(readFileSync(키길, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const b = Buffer.from(JSON.stringify({
    iss: 키.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  })).toString('base64url');
  const sg = createSign('RSA-SHA256').update(`${h}.${b}`).sign(키.private_key, 'base64url');
  const tr = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${b}.${sg}` }),
  });
  if (!tr.ok) { console.error(`⛔ 토큰 못 받았다 — HTTP ${tr.status}. 못 쟀다`); process.exit(1); }
  const { access_token } = await tr.json();

  const 날수 = Number(인자('날수', '7'));
  console.log(`■ 밖의 어느 문이 사람을 보내나 — 최근 ${날수}일 · 속성 ${속성}`);
  console.log('⛔ Direct 는 «밖»이 아니다. 우리 여섯 유닛이 거기 섞여 있다 — 따로 적는다.\n');

  for (const [집, 이름] of 사이트표) {
    const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`, {
      method: 'POST', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${날수}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        dimensionFilter: { filter: { fieldName: 'hostName', stringFilter: { matchType: 'CONTAINS', value: 집 } } },
        limit: 200,
      }),
    });
    if (!r.ok) { console.log(`${이름.padEnd(20)} ⬜ 못 쟀다 — HTTP ${r.status}`); continue; }
    const { 밖, 우리 } = 접는다((await r.json()).rows);
    const 밖세션 = [...밖.values()].reduce((s, x) => s + x.세션, 0);
    const 우리세션 = [...우리.values()].reduce((s, x) => s + x.세션, 0);
    console.log(`## ${이름}  —  밖에서 온 세션 ${밖세션} · 우리/Direct ${우리세션}`);
    if (!밖.size) console.log('   ⬜ 밖에서 보낸 문이 «하나도 없다». 0 이다 — 못 잰 것이 아니다.');
    for (const [문, v] of [...밖].sort((a, b) => b[1].세션 - a[1].세션).slice(0, 8)) {
      console.log(`   ${문.padEnd(22)} 세션 ${String(v.세션).padStart(4)} · 사람 ${v.사람}`);
    }
    console.log('');
  }
  console.log('⚠ GA4 는 광고차단·쿠키거부로 «덜 센다» — 바닥값으로 읽는다.');
  console.log('⚠ 세션이 적은 줄은 흔들린다. 세션 수를 같이 보고 읽는다.');
}
