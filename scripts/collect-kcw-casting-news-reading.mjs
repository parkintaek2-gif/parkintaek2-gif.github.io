#!/usr/bin/env node
/**
 * collect-kcw-casting-news-reading.mjs — **캐스팅 기사가 «영어권 독자»에게 닿는가.**
 *
 * ── 왜 만드나 (2026-09-05) ──────────────────────────────────
 * 오늘 오후 구글뉴스에 「Latest K-drama casting news about Kim Mu-yeol, Jung Hae-in and more」가
 * 올라왔다(SCMP). 캐스팅 기사는 K드라마 영문 매체가 «가장 자주» 내는 갈래다.
 *
 * ⭐ 그런데 아무도 안 재는 것이 하나 있다 — **그 기사가 읽는 사람을 실제로 움직이나.**
 *   우리 축(영문 위키백과 열람수)은 그것을 잴 수 있다. 발표 «전 14일»과 «후 7일»을 견준다.
 *
 * ── ⛔ 이 자가 안 하는 것 ─────────────────────────────
 * ⛔ 기사가 «원인»이라고 말하지 않는다. 같은 날 다른 일이 얼마든지 있을 수 있다.
 *   우리가 낼 수 있는 말은 「그 무렵 읽는 수가 움직였나 아닌가」 하나다.
 * ⛔ 표본이 열 건이다. 그것을 「업계가 이렇다」로 부풀리지 않는다 — 수를 그대로 적는다.
 * ⛔ 오늘·어제 발표는 못 잰다. 위키미디어가 하루쯤 늦게 채운다.
 *
 * 쓰는 법
 *   node scripts/collect-kcw-casting-news-reading.mjs --자가시험
 *   node scripts/collect-kcw-casting-news-reading.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(__dirname, '..');
const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-casting-news-reading.json');

/**
 * 잴 것 — **구글뉴스에 실제로 실린 캐스팅 기사**와 거기 이름이 오른 배우.
 * ⚠ 날짜는 «기사가 실린 날»이고 우리가 정한 것이 아니다. 우물 칸에 매체를 적는다.
 * ⛔ 이 목록을 「대표 표본」이라 부르지 않는다. 우리가 그날 받은 것 전부일 뿐이다.
 */
export const 사건들 = [
  { date: '2026-09-05', outlet: 'South China Morning Post', people: ['Kim Mu-yeol', 'Jung Hae-in'] },
  { date: '2026-08-31', outlet: 'Kagit', people: ['Kim Ji-won'] },
  { date: '2026-08-22', outlet: 'South China Morning Post', people: ['Doh Kyung-soo', 'Cha Eun-woo'] },
  { date: '2026-08-08', outlet: 'South China Morning Post', people: ['Lee Chae-min', 'Roh Yoon-seo'] },
  { date: '2026-07-04', outlet: 'South China Morning Post', people: ['Kim Tae-ri', 'Lee Min-ho'] },
];

const 하루 = 86400e3;

/** ⛔ toISOString() 을 쓰지 않는다. 이 기계는 이미 KST 다 */
export function 여덟자리(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export function 날더하기(여덟, n) {
  const d = new Date(`${여덟.slice(0, 4)}-${여덟.slice(4, 6)}-${여덟.slice(6, 8)}T00:00:00`);
  return 여덟자리(new Date(d.getTime() + n * 하루));
}

/** ⛔ 평균이 아니라 중간값 — 하루가 튀면 평균은 그 하루가 된다 */
export function 중간값(수들) {
  const s = [...수들].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/**
 * 발표 «전 14일»과 «후 7일»의 중간값을 낸다.
 * ⚠ 발표 «당일»은 어느 쪽에도 안 넣는다 — 하루 안에 전과 후가 섞여 있어 어느 쪽 것도 아니다.
 */
export function 전후(줄들, 발표날) {
  const 표 = new Map(줄들.map((r) => [r.date, r.views]));
  const 앞 = []; const 뒤 = [];
  for (let i = 1; i <= 14; i += 1) { const v = 표.get(날더하기(발표날, -i)); if (Number.isFinite(v)) 앞.push(v); }
  for (let i = 1; i <= 7; i += 1) { const v = 표.get(날더하기(발표날, i)); if (Number.isFinite(v)) 뒤.push(v); }
  return {
    before: 중간값(앞), after: 중간값(뒤),
    beforeDays: 앞.length, afterDays: 뒤.length,
    onTheDay: 표.get(발표날) ?? null,
  };
}

/** 「움직였다」의 선. ±20% 안은 «그대로»로 둔다 — 하루하루가 그만큼은 그냥 흔들린다 */
export const 움직임선 = 0.2;
export function 움직였나(전, 후) {
  if (!Number.isFinite(전) || !Number.isFinite(후) || 전 === 0) return null;
  const 비 = 후 / 전;
  if (비 > 1 + 움직임선) return 'up';
  if (비 < 1 - 움직임선) return 'down';
  return 'flat';
}

async function 요약받기(title) {
  const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_')),
    { headers: { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' } });
  return r.ok ? r.json() : null;
}

async function 열람받기(title, 처음, 끝) {
  const u = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/'
    + encodeURIComponent(title.replace(/ /g, '_')) + `/daily/${처음}/${끝}`;
  const r = await fetch(u, { headers: { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.items ?? []).map((x) => ({ date: String(x.timestamp).slice(0, 8), views: x.views }));
}

/* ── 자가시험 ───────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실 = []; let 통 = 0;
  const 같나 = (이름, 본, 기대) => {
    const a = JSON.stringify(본); const b = JSON.stringify(기대);
    if (a === b) 통 += 1; else 실.push(`${이름}: ${a} ≠ ${b}`);
  };

  같나('여덟자리', 여덟자리(new Date('2026-09-05T13:00:00')), '20260905');
  같나('날더하기 — 앞으로', 날더하기('20260905', 3), '20260908');
  같나('날더하기 — 뒤로', 날더하기('20260901', -1), '20260831');
  같나('날더하기 — 달을 넘는다', 날더하기('20260831', 1), '20260901');
  같나('날더하기 — 해를 넘는다', 날더하기('20261231', 1), '20270101');

  같나('중간값 홀수', 중간값([3, 1, 2]), 2);
  같나('중간값 짝수', 중간값([1, 2, 3, 4]), 3);
  같나('중간값 빈 것은 null', 중간값([]), null);

  const 줄 = [];
  for (let i = -14; i <= 7; i += 1) 줄.push({ date: 날더하기('20260810', i), views: i > 0 ? 200 : 100 });
  const r = 전후(줄, '20260810');
  같나('전 14일 중간값', r.before, 100);
  같나('후 7일 중간값', r.after, 200);
  같나('전 14일을 다 세었다', r.beforeDays, 14);
  같나('후 7일을 다 세었다', r.afterDays, 7);
  같나('당일은 따로 남긴다', r.onTheDay, 100);
  /* 🔴 당일이 어느 쪽에도 안 들어간 것을 못박는다 — 섞으면 두 값이 서로를 오염시킨다 */
  같나('당일은 전에도 후에도 안 들어간다', r.beforeDays + r.afterDays, 21);

  같나('20% 넘게 오르면 up', 움직였나(100, 130), 'up');
  같나('20% 넘게 내리면 down', 움직였나(100, 70), 'down');
  같나('그 안이면 flat', 움직였나(100, 110), 'flat');
  같나('딱 20% 는 flat', 움직였나(100, 120), 'flat');
  같나('없는 값은 null 이지 flat 이 아니다', 움직였나(null, 100), null);
  같나('0 으로 나누지 않는다', 움직였나(0, 100), null);

  같나('사건 날짜가 다 제 꼴이다', 사건들.every((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date)), true);
  같나('사건마다 매체를 적었다', 사건들.every((e) => e.outlet && e.outlet.length > 2), true);
  같나('사건마다 사람이 있다', 사건들.every((e) => e.people.length > 0), true);

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 캐스팅 기사 열람수 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

/* ── 실제로 받는다 ───────────────────────────────────────────── */
if (내가실행됐다) {
  const 오늘 = 여덟자리(new Date());
  const 줄들 = [];
  const 못잰것 = [];

  for (const 사건 of 사건들) {
    const 발표 = 사건.date.replace(/-/g, '');
    for (const 사람 of 사건.people) {
      const 요약 = await 요약받기(사람);
      if (!요약) { 못잰것.push(`${사람} — no English Wikipedia article`); continue; }
      const 설명 = String(요약.description ?? '').toLowerCase();
      if (!/(actor|actress|singer|rapper|model|entertainer)/.test(설명)) {
        못잰것.push(`${사람} — title resolves to "${요약.description}", not a performer`);
        continue;
      }
      const 열람 = await 열람받기(요약.title, 날더하기(발표, -30), 날더하기(발표, 14) > 오늘 ? 오늘 : 날더하기(발표, 14));
      if (!열람.length) { 못잰것.push(`${사람} — no pageview rows returned`); continue; }
      const r = 전후(열람, 발표);
      줄들.push({
        person: 요약.title, description: 요약.description,
        date: 사건.date, outlet: 사건.outlet,
        ...r,
        windowComplete: r.afterDays === 7,
        moved: 움직였나(r.before, r.after),
        ratio: (Number.isFinite(r.before) && Number.isFinite(r.after) && r.before)
          ? Math.round((r.after / r.before) * 100) / 100 : null,
      });
      console.log(`✅ ${요약.title.padEnd(16)} ${사건.date} · 전 ${r.before} → 후 ${r.after} (${r.afterDays}일치)`);
    }
  }

  /**
   * 🔴 **창이 덜 찬 것을 다 찬 것과 같이 세지 않는다.**
   *   Kim Ji-won 은 8/31 발표라 「뒤 7일」 가운데 나흘치밖에 없다. 나머지 사흘은 아직 오지 않았다.
   *   ⛔ 그 나흘을 이레와 같이 세면 「올랐다」 한 건이 «덜 잰 것»으로 만들어진 수가 된다.
   *   ✅ 창이 다 찬 것만 센다. 덜 찬 것은 「아직」으로 남기고 며칠 뒤 다시 잰다.
   */
  const 창이다찼나 = (x) => x.afterDays === 7 && x.beforeDays >= 10;
  const 잰것 = 줄들.filter((x) => x.moved && 창이다찼나(x));
  const 못잰날 = 줄들.filter((x) => !x.moved || !창이다찼나(x));
  const 셈 = { up: 0, down: 0, flat: 0 };
  for (const r of 잰것) 셈[r.moved] += 1;

  const 낼것 = {
    measuredAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    source: 'Wikimedia Pageviews API — en.wikipedia, all-access, user agents only (bots excluded)',
    measures: 'Daily English Wikipedia reads for each named performer, median of the 14 days before '
      + 'the casting story against the 7 days after. The day itself is in neither window.',
    newsSource: 'Google News RSS, K-drama casting stories, dates and outlets as the feed carried them',
    counts: 셈,
    measurable: 잰것.length,
    notYetMeasurable: 못잰날.length,
    notMeasured: [
      'Whether the story caused anything. Other things happen on the same days and we cannot separate them',
      'Stories from today or yesterday. Wikimedia fills those counts in about a day late',
      'Anything about reading in Korean, or about audience size for the shows themselves',
      'A representative sample. This is every casting story our collector held, ten names in all',
    ],
    unmeasured: 못잰것,
    rows: 줄들,
  };
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2) + '\n', 'utf8');
  console.log(`\n📁 적었다 — ${path.relative(뿌리, 낼곳)}`);
  console.log(`   잰 것 ${잰것.length}건 — 올랐다 ${셈.up} · 그대로 ${셈.flat} · 내렸다 ${셈.down}`);
  if (못잰날.length) console.log(`   ⬜ 아직 못 잰 것 ${못잰날.length}건 (뒤 7일이 아직 안 왔다)`);
  for (const s of 못잰것) console.log(`   ⬜ ${s}`);
}
