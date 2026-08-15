/**
 * collect-sea-genre.mjs — **동남아 네 판이 한국의 「무엇을」 알아보는가**, 장르별 25달.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 91편이 한국 문화 문서는 여행 문서만큼 안 떨어졌다고 냈다. 그 안을 열어 보니
 * 한 칸이 튀었다 — **K팝 +15% · K드라마 −24%.** 같은 판, 같은 달, 39 포인트 차이다.
 *
 * ⛔ 그런데 그건 **문서 하나씩**이었다(`K-pop` 과 `Korean drama`). 문서 하나로는 못 쓴다.
 *   ⭐ 그래서 넓힌다 — 장르마다 여러 문서를 세워 **묶음끼리** 견준다.
 *
 * ── ⛔ 91편 정정에서 배운 것을 그대로 지킨다 ──────────────────
 * 🔴 91편은 「답이 정해진 물음이 백과사전 밖으로 나갔다」를 **재지 않고** 썼다가 두 시간 만에
 *   물렀다. 재 보니 격차가 4.3p 뿐이었다. ⛔ **갈래를 정했으면 벌어지는지 먼저 잰다.**
 *   벌어지지 않으면 그 갈래로는 안 쓴다.
 * ⚠ 갈래는 **우리가 정한 것**이다. 자료에서 나온 것이 아니다. 목록을 그대로 낸다 —
 *   다르게 가르고 싶은 사람이 다시 가를 수 있어야 한다.
 *
 * ── ⛔ 앞선 자들에서 배운 것 ──────────────────────────────────
 * ⛔ 못 받은 칸을 0 으로 세지 않는다. null 로 두고 셈에서 뺀다.
 * ⛔ `redirects=1` 을 반드시 넣는다 — 빼면 넘겨주기 제목이 「그 판에 문서가 없다」로 나온다.
 * ⛔ 429 에 죽지 않는다. 물러섰다 다시 묻는다.
 * ⛔ **25 달을 받는다.** 겹달 24 가 있어야 열두 달 대 열두 달이 선다.
 * ⛔ 이 파일을 import 해도 아무 일도 일어나지 않는다 — 8/15 에 그 함정에 걸렸다.
 *
 * 쓰는 법
 *   node scripts/collect-sea-genre.mjs
 *   node scripts/collect-sea-genre.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const 판들 = ['id', 'vi', 'th', 'ms'];
export const 판이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };
export const 달수 = 25;

/**
 * ⭐ 갈래 셋. 한국 쪽과 일본 쪽을 **같은 갈래에** 넣는다.
 *
 * ⚠ 「누가 만드나」(회사)는 음악에 넣었다 — 하이브·SM 을 찾는 사람은 노래를 찾는 사람과
 *   같은 쪽에 가깝다. ⛔ 이것도 우리가 정한 것이다. 자료에 목록을 그대로 남긴다.
 * ⚠ 일본 쪽은 「대조」지 「경쟁」이 아니다. 두 나라를 줄 세우려는 것이 아니라,
 *   갈래끼리 벌어지는 것이 **한국만의 일인지**를 보려는 것이다.
 */
export const 갈래들 = [
  {
    key: 'music',
    이름: 'Music',
    한: ['K-pop', 'Music of South Korea', 'Korean hip hop', 'HYBE Corporation',
      'SM Entertainment', 'JYP Entertainment', 'YG Entertainment'],
    일: ['J-pop', 'Music of Japan', 'Japanese hip hop', 'Johnny & Associates'],
  },
  {
    key: 'screen',
    이름: 'Screen',
    한: ['Korean drama', 'Cinema of South Korea', 'Television in South Korea',
      'Squid Game', 'Parasite (2019 film)'],
    일: ['Japanese television drama', 'Cinema of Japan', 'Anime', 'Tokyo Story'],
  },
  {
    key: 'craft',
    이름: 'Language and craft',
    한: ['Korean language', 'Hangul', 'Webtoon', 'Hanbok', 'Taekwondo'],
    일: ['Japanese language', 'Kana', 'Manga', 'Kimono', 'Karate'],
  },
];

export function 받을것(갈래 = 갈래들) {
  return [...new Set(갈래.flatMap((g) => [...g.한, ...g.일]))];
}

export const 못받음 = Symbol('못받음');

/** ⛔ redirects=1 — 빼면 넘겨주기 제목이 「그 판에 문서가 없다」로 나온다 */
export function 주소만들기(제목) {
  return 'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1'
    + `&prop=langlinks&lllimit=500&titles=${encodeURIComponent(제목)}`;
}

export const 달앞 = (m) => `${m.replace('-', '')}0100`;

/**
 * 🔴 **마지막 달은 덜 찼을 수 있다.**
 *
 * 8/15 에 받아 보니 `2026-07` 이 Parasite 4 · Squid Game 2 · Korean drama 1 이었다.
 * 평소의 백분의 일이다. 위키미디어 월 집계가 **그달을 아직 다 안 담은 것**이지,
 * 사람들이 안 본 것이 아니다.
 *
 * ⛔ 그대로 두면 「7월에 관심이 사라졌다」는 기사가 나온다. **그것이 조용한 거짓말이다.**
 * ⭐ 그래서 마지막 달이 앞선 달들에 견줘 터무니없이 작으면 **덜 찬 달로 표시한다.**
 *   ⚠ 지우지는 않는다 — 자료는 남기고 「쓰지 마라」를 붙인다. 지우면 왜 없는지 모르게 된다.
 */
export const 덜찬문턱 = 0.2;

export function 덜찬달인가(달값들, 문턱 = 덜찬문턱) {
  const 값 = Object.entries(달값들).filter(([, v]) => v != null).sort((a, b) => a[0].localeCompare(b[0]));
  if (값.length < 4) return null;
  const 끝 = 값.at(-1);
  const 앞선것 = 값.slice(0, -1).map(([, v]) => v);
  const 앞평 = 앞선것.reduce((a, b) => a + b, 0) / 앞선것.length;
  if (앞평 <= 0) return null;
  return 끝[1] < 앞평 * 문턱 ? { month: 끝[0], value: 끝[1], previousMean: +앞평.toFixed(1) } : null;
}

function 받기(url) {
  return new Promise((풀림, 깨짐) => {
    https.get(url, { headers: { 'User-Agent': 'kculturewire/1.0 (parkintaek2@gmail.com)' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); 깨짐(new Error(`HTTP ${res.statusCode}`)); return; }
      let 몸 = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { 몸 += d; });
      res.on('end', () => { try { 풀림(JSON.parse(몸)); } catch (e) { 깨짐(e); } });
    }).on('error', 깨짐);
  });
}

/** ⛔ 429 에 프로세스가 죽지 않는다 — 8/13 사고의 뿌리가 그것이었다 */
async function 세번해본다(url, 번수 = 4) {
  for (let n = 1; n <= 번수; n += 1) {
    try { return await 받기(url); } catch (e) {
      const 제한 = /HTTP 429|HTTP 5\d\d/.test(String(e.message));
      if (n === 번수) return 못받음;
      await new Promise((s) => setTimeout(s, 제한 ? 5000 * 2 ** (n - 1) : 2000 * n));
    }
  }
  return 못받음;
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  /* ⭐ 「몇 개인가」가 아니라 「제대로 된 목록인가」 — 갈래가 늘어도 검사가 서지 않는다 */
  참('갈래가 하나 이상이다', 갈래들.length > 0);
  참('⛔ 갈래 이름이 겹치지 않는다', new Set(갈래들.map((g) => g.key)).size === 갈래들.length);
  참('갈래마다 양쪽이 다 있다', 갈래들.every((g) => g.한.length > 0 && g.일.length > 0));
  참('⛔ 빈 제목이 없다', 받을것().every((t) => t.trim().length > 0));
  참('⛔ 같은 문서가 두 갈래에 들어가지 않는다', (() => {
    const 본것 = new Set();
    for (const g of 갈래들) for (const t of [...g.한, ...g.일]) { if (본것.has(t)) return false; 본것.add(t); }
    return true;
  })());
  /* ⛔ 한국 문서를 일본 쪽에 넣으면 대조가 아니다 */
  참('⛔ 일본 쪽에 한국 문서가 없다',
    !갈래들.flatMap((g) => g.일).some((t) => /Korea|K-pop|Hangul|Hanbok|Webtoon|Taekwondo|Squid Game/i.test(t)));
  참('⛔ 한국 쪽에 일본 문서가 없다',
    !갈래들.flatMap((g) => g.한).some((t) => /Japan|J-pop|Anime|Manga|Kimono|Karate|Kana/i.test(t)));
  참('받을 목록에 중복이 없다', new Set(받을것()).size === 받을것().length);
  /* 🔴 redirects=1 을 빼면 넘겨주기가 「없음」으로 나온다 */
  참('넘겨주기를 따라간다', 주소만들기('Squid Game').includes('redirects=1'));
  /**
   * 🔴 처음엔 `Parasite (2019 film)` 의 괄호가 `%28` 로 바뀌는지 봤는데 **안 바뀐다** —
   *   `encodeURIComponent` 는 괄호를 건드리지 않는다. 그래도 위키미디어는 받는다.
   * ⭐ 진짜 위험한 글자는 **`&`** 다. 안 바뀌면 거기서 주소가 잘려 딴 문서를 묻게 된다.
   *   목록에 `Johnny & Associates` 가 있다. 그것으로 잰다.
   */
  참('⛔ & 가 주소를 자르지 못한다', 주소만들기('Johnny & Associates').includes('%26'));
  참('⛔ 띄어쓰기가 그대로 안 들어간다', !/titles=[^&]*\s/.test(주소만들기('Music of Japan')));
  참('못받음은 0 이 아니다', 못받음 !== 0 && typeof 못받음 === 'symbol');
  /* ⛔ 겹달 24 가 나오려면 25 를 받아야 한다 */
  참('⭐ 25 달을 받는다 — 열두 달 대 열두 달이 서야 한다', 달수 === 25);
  참('달 주소가 위키미디어 꼴이다', 달앞('2025-01') === '2025010100');

  /**
   * 🔴 8/15 — 마지막 달(2026-07)이 평소의 백분의 일로 왔다. 집계가 덜 찬 것이다.
   *   ⛔ 그대로 쓰면 「7월에 관심이 사라졌다」가 된다.
   */
  참('덜 찬 마지막 달을 잡는다',
    덜찬달인가({ '2025-01': 100, '2025-02': 110, '2025-03': 90, '2025-04': 2 })?.month === '2025-04');
  참('⛔ 멀쩡한 달은 안 잡는다',
    덜찬달인가({ '2025-01': 100, '2025-02': 110, '2025-03': 90, '2025-04': 95 }) === null);
  참('⛔ 자연스러운 하락은 안 잡는다 — 반 토막까지는 둔다',
    덜찬달인가({ '2025-01': 100, '2025-02': 110, '2025-03': 90, '2025-04': 45 }) === null);
  참('⛔ 달이 너무 적으면 판정하지 않는다', 덜찬달인가({ '2025-01': 100, '2025-02': 2 }) === null);
  참('⛔ 앞이 전부 0 이면 나눌 수 없다', 덜찬달인가({ a: 0, b: 0, c: 0, d: 0 }) === null);
  참('잡을 때 견준 값을 같이 낸다',
    덜찬달인가({ '2025-01': 100, '2025-02': 110, '2025-03': 90, '2025-04': 2 }).previousMean === 100);
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 끝달 = new Date();
  끝달.setMonth(끝달.getMonth() - 1);
  const 달목록 = Array.from({ length: 달수 }, (_, i) => {
    const d = new Date(끝달);
    d.setMonth(d.getMonth() - (달수 - 1 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  /* ① 판 밑값 — 백만분율의 분모 */
  const 밑값 = {};
  for (const p of 판들) {
    밑값[p] = {};
    const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/aggregate/${p}.wikipedia/all-access/user`
      + `/monthly/${달앞(달목록[0])}/${달앞(달목록.at(-1))}`;
    const 몸 = await 세번해본다(u);
    if (몸 !== 못받음) {
      for (const it of 몸.items ?? []) {
        밑값[p][`${it.timestamp.slice(0, 4)}-${it.timestamp.slice(4, 6)}`] = it.views;
      }
    }
    await new Promise((s) => setTimeout(s, 400));
  }
  console.log(`판 밑값 — ${판들.map((p) => `${p}:${Object.keys(밑값[p]).length}달`).join(' · ')}`);

  /* ② 판별 제목 */
  const 제목표 = {};
  for (const 제목 of 받을것()) {
    제목표[제목] = {};
    const 몸 = await 세번해본다(주소만들기(제목));
    if (몸 !== 못받음) {
      for (const 쪽 of Object.values(몸.query?.pages ?? {})) {
        for (const l of 쪽.langlinks ?? []) if (판들.includes(l.lang)) 제목표[제목][l.lang] = l['*'];
      }
    }
    await new Promise((s) => setTimeout(s, 300));
  }

  /* ③ 달별 조회 */
  let 못잰것 = 0;
  const 자료 = [];
  for (const 제목 of 받을것()) {
    const 줄 = { titleEn: 제목, titles: 제목표[제목], views: {} };
    for (const p of 판들) {
      const 판제목 = 제목표[제목][p];
      if (!판제목) continue;
      줄.views[p] = {};
      const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${p}.wikipedia/all-access/user`
        + `/${encodeURIComponent(판제목.replace(/ /g, '_'))}/monthly/${달앞(달목록[0])}/${달앞(달목록.at(-1))}`;
      const 몸 = await 세번해본다(u);
      if (몸 === 못받음) { 못잰것 += 1; continue; }
      for (const it of 몸.items ?? []) {
        줄.views[p][`${it.timestamp.slice(0, 4)}-${it.timestamp.slice(4, 6)}`] = it.views;
      }
      await new Promise((s) => setTimeout(s, 250));
    }
    자료.push(줄);
    console.log(`   ${제목.slice(0, 32).padEnd(32)} ${판들.map((p) => (줄.views[p] ? Object.keys(줄.views[p]).length : '—')).join('/')}`);
  }

  const 나감 = {
    generated: 오늘(),
    question: 'Southeast Asia reads less about Korea than it did a year ago on almost every '
      + 'measure we have. Is that true of everything Korea makes, or does it depend on what?',
    window: `${달목록[0]} through ${달목록.at(-1)}, ${달수} months`,
    months: 달목록,
    editionsSea: 판들,
    editionNames: 판이름,
    editionTotals: 밑값,
    unit: 'reads per million reads of that edition',
    genres: 갈래들.map((g) => ({ key: g.key, name: g.이름, korea: g.한, japan: g.일 })),
    articles: 자료,
    unfetched: 못잰것,
    /**
     * 🔴 **덜 찬 달을 자료에 적어 둔다.** 쓰는 쪽이 모르고 넣으면 「관심이 사라졌다」가 된다.
     * ⚠ 지우지 않는다 — 자료는 남기고 「쓰지 마라」를 붙인다.
     */
    incompleteLastMonth: 덜찬달인가(Object.fromEntries(달목록.map((m) => [m,
      자료.reduce((a, x) => a + 판들.reduce((b, p) => b + (x.views[p]?.[m] ?? 0), 0), 0)]))),
    incompleteNote: 'Wikimedia\'s monthly totals for the most recent month can still be filling '
      + 'when we fetch. Where that month arrives at a small fraction of the months before it, we '
      + 'mark it here rather than deleting it, and nothing downstream should use it.',
    /** ⚠ 갈래는 우리가 정한 것이다. 그 말을 자료에 박는다 */
    genresAreOurs: 'The three genres are our own grouping, not the encyclopaedia\'s. The article '
      + 'lists are published here so the same reads can be grouped a different way. Company '
      + 'articles sit with music because someone looking up HYBE is closer to someone looking up '
      + 'a song than to someone looking up a film.',
    japanIsControl: 'The Japanese articles are a control, not a competitor. They are here to show '
      + 'whether a gap between genres is something happening to Korea or something happening to '
      + 'that kind of article.',
  };
  const 낼곳 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-genre.json');
  fs.mkdirSync(path.dirname(낼곳), { recursive: true });
  fs.writeFileSync(낼곳, `${JSON.stringify(나감, null, 2)}\n`);
  console.log(`\n✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   문서 ${자료.length} · 달 ${달수} (${달목록[0]} ~ ${달목록.at(-1)}) · 못 잰 칸 ${못잰것}`);
}
