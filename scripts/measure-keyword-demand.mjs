#!/usr/bin/env node
/**
 * measure-keyword-demand.mjs — **지면 이름을 짐작으로 정하지 않는다. 재고 정한다.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-22, 나는 일간(日干) 열 칸으로 지면 열 장을 냈다. 사장님이 물으셨다 —
 * 「**누가 일간을 알까?** 이런것에 대한 고민은 하나도 안했지?」 그리고 곧 못박으셨다 —
 * 「**키워드 검색량을 재서 해.**」
 * 나는 자료가 가진 말(day stem·byeong)로 문 이름을 달았다. 그 말을 치는 손님은 없다.
 *
 * ── 무엇으로 재나 (⛔ 「검색량」이라고 부르지 않는다) ──────────
 * 우리에게 유료 검색량 자료가 없다. 그래서 **두 가지 대리 지표**를 재고, 각각을 그 이름으로 부른다.
 *
 *   ① 자동완성에 그 말이 **떠 있나** (Google Suggest · 공개 끝점)
 *      → 「사람이 그 말을 실제로 치고 있나」의 흔적이다. **몇 명인지는 아니다.**
 *      → 그 말로 시작하는 제안이 몇 줄 나오는지, 그리고 몇 번째 줄인지까지 적는다.
 *   ② 위키백과 그 사람 문서를 **몇 명이 열었나** (Wikimedia Pageviews · 사람 트래픽만)
 *      → 실제 수다. 다만 «그 이름에 대한 관심»이고 «그 문구를 검색한 수»는 아니다.
 *
 * ⛔ 두 수를 더하지 않는다. ⛔ 「월간 검색량」으로 옮겨 적지 않는다.
 * ⛔ 막혀서 못 물은 것을 0 으로 적지 않는다 — `물음실패` 로 따로 센다.
 *
 * 쓰는 법  node scripts/measure-keyword-demand.mjs --자가시험
 *          node scripts/measure-keyword-demand.mjs            (기본 후보를 잰다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼곳 = path.join(뿌리, 'src/data/wikitip-keyword-demand.json');

const 머리말 = { 'User-Agent': 'kculturewire.com research (contact: parkintaek2@gmail.com)' };
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 자동완성을 묻는다. 돌려주는 것은 제안 줄들.
 * ⛔ 못 물으면 `undefined` 다 — 빈 배열(=제안 없음)과 다르다.
 */
export async function 자동완성(말, 부르기 = fetch) {
  const u = 'https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=' + encodeURIComponent(말);
  for (let i = 0; i < 3; i++) {
    try {
      const r = await 부르기(u, { headers: 머리말 });
      if (r.ok) {
        const j = JSON.parse(await r.text());
        return Array.isArray(j?.[1]) ? j[1] : [];
      }
      if (r.status !== 429 && r.status < 500) return undefined;
    } catch { /* 되묻는다 */ }
    await 쉼(700 * (i + 1));
  }
  return undefined;
}

/** 제안 줄들에서 그 말이 어떻게 서 있나 — 있나 · 몇 번째 · 그 말로 시작하는 줄 수 */
export function 자리재기(말, 제안들) {
  if (제안들 === undefined) return { 물음실패: true };
  const 낮 = 말.toLowerCase();
  const 줄 = 제안들.map((s) => String(s).toLowerCase());
  const 딱 = 줄.indexOf(낮);
  return {
    물음실패: false,
    제안수: 줄.length,
    그대로있나: 딱 >= 0,
    몇번째: 딱 >= 0 ? 딱 + 1 : null,
    그말로시작: 줄.filter((s) => s.startsWith(낮)).length,
    보기: 제안들.slice(0, 5),
  };
}

/** 위키백과 사람 트래픽 — 지난 30일 합계. ⛔ 못 물으면 null 이지 0 이 아니다 */
export async function 위키읽힘(제목, 부르기 = fetch) {
  const 끝 = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10).replace(/-/g, '');
  const 시작 = new Date(Date.now() - 32 * 86400000).toISOString().slice(0, 10).replace(/-/g, '');
  const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(제목.replace(/ /g, '_'))}/daily/${시작}/${끝}`;
  try {
    const r = await 부르기(u, { headers: 머리말 });
    if (!r.ok) return null;
    const j = await r.json();
    return (j.items ?? []).reduce((a, x) => a + (x.views ?? 0), 0);
  } catch { return null; }
}

/** 재 볼 말 — 우리가 낸 지면 이름과, 손님이 칠 만한 말을 **같이** 넣어 견준다 */
export const 후보 = [
  /* 우리가 쓴 전문 용어 — 정말 아무도 안 치나 */
  'day stem', 'day pillar', 'saju day stem', 'byeong day stem',
  /* 손님이 칠 만한 말 */
  'iu birthday', 'jungkook birthday', 'korean zodiac', 'saju reading',
  'iu saju', 'jungkook zodiac sign', 'bts birthdays', 'kpop birthdays',
  'born on may 16', 'who shares my birthday kpop', 'iu birth chart',
  'korean age calculator', 'blackpink birthdays',
];

/** 위키 읽힘으로 견줄 사람 — 이름이 널리 알려진 쪽 */
export const 사람후보 = ['IU (singer)', 'Jungkook', 'Jisoo', 'Song Joong-ki', 'Psy'];

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 가짜 = (본문, ok = true) => async () => ({ ok, text: async () => 본문, json: async () => JSON.parse(본문) });
  const 제안 = await 자동완성('iu birthday', 가짜('["iu birthday",["iu birthday","iu birthday 2026","iu birthdate"]]'));
  검('제안 줄을 뽑는다', Array.isArray(제안) && 제안.length === 3);

  const r = 자리재기('iu birthday', 제안);
  검('그대로 있는 것을 안다', r.그대로있나 === true && r.몇번째 === 1);
  검('그 말로 시작하는 줄을 센다', r.그말로시작 === 2);
  검('없는 말은 없다고 한다', 자리재기('day stem', 제안).그대로있나 === false);
  검('⛔ 못 물은 것을 0 으로 안 적는다', 자리재기('x', undefined).물음실패 === true);

  const 없음 = await 자동완성('x', 가짜('', false));
  검('막히면 undefined 다', 없음 === undefined);

  const v = await 위키읽힘('IU', 가짜(JSON.stringify({ items: [{ views: 10 }, { views: 5 }] })));
  검('읽힘을 더한다', v === 15);
  검('못 물으면 null 이다', (await 위키읽힘('IU', 가짜('', false))) === null);
  검('후보에 우리 용어와 손님 말이 같이 있다', 후보.includes('day stem') && 후보.includes('iu birthday'));

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ measure-keyword-demand 자가시험 통과 (9)');
  process.exit(0);
}

/**
 * 2026-08-22 5번 — **잴 말을 밖에서 줄 수 있게** 했다.
 * 사장님: 「왜 너의 커뮤니티인데 케이라이프맵의 커뮤니티 같지? 수정하자...검색량」
 * 기본 후보가 온통 사주·생일 말이었다 — 그건 4번(KLifeMap)의 주제다.
 * 내 유닛 말로 재려면 목록을 갈아야 하는데, 기본값을 갈아 버리면 이 자로 잰 옛 기록과
 * 견줄 수 없다. ⛔ 그래서 기본값은 그대로 두고 **파일로 주는 길**만 낸다.
 *
 *   node scripts/measure-keyword-demand.mjs --말파일=<한 줄에 한 말>
 *   node scripts/measure-keyword-demand.mjs --말파일=... --사람은건너뛴다
 *
 * ⚠ 빈 줄과 # 로 시작하는 줄은 건너뛴다. 파일이 없으면 **선다** — 0건으로 안 넘어간다.
 */
const 말파일 = process.argv.find((a) => a.startsWith('--말파일='))?.split('=').slice(1).join('=');
let 잴말 = 후보;
if (말파일) {
  if (!fs.existsSync(말파일)) {
    console.error(`⛔ --말파일 이 없다 — ${말파일}. 못 잰 것을 0으로 안 적는다`);
    process.exit(1);
  }
  잴말 = fs.readFileSync(말파일, 'utf8').split(String.fromCharCode(10))
    .map((x) => x.trim()).filter((x) => x && !x.startsWith('#'));
  if (!잴말.length) { console.error('⛔ --말파일 에 잴 말이 없다'); process.exit(1); }
  console.log(`■ 밖에서 준 말 ${잴말.length}개를 잰다 — ${말파일}
`);
}

const 잰것 = [];
for (const 말 of 잴말) {
  const r = 자리재기(말, await 자동완성(말));
  잰것.push({ 말, ...r });
  const 표 = r.물음실패 ? '못 물었다'
    : `${r.그대로있나 ? `있다(${r.몇번째}번째)` : '없다'} · 그 말로 시작 ${r.그말로시작}줄`;
  console.log(`  ${말.padEnd(30)} ${표}`);
  await 쉼(400);
}

const 사람은건너뛴다 = process.argv.includes('--사람은건너뛴다');
if (!사람은건너뛴다) console.log('\n■ 위키백과 사람 트래픽 (지난 30일 합)');
const 사람잰것 = [];
for (const 이름 of (사람은건너뛴다 ? [] : 사람후보)) {
  const v = await 위키읽힘(이름);
  사람잰것.push({ 이름, 지난30일읽힘: v });
  console.log(`  ${이름.padEnd(20)} ${v === null ? '못 물었다' : v.toLocaleString('en-US')}`);
  await 쉼(300);
}

/**
 * 🔴 2026-08-22 — 밖에서 말을 주고 돌리자 **기본 후보로 잰 옛 기록을 덮어썼다.**
 *   물음이 다른 두 측정이 한 파일을 쓰면 나중 것이 앞 것을 조용히 지운다.
 *   ⭐ 밖에서 준 말로 잰 것은 **딴 파일**에 적는다. 이름에 물음이 남게 한다.
 */
const 물음이름 = 말파일 ? (path.basename(말파일, path.extname(말파일)) || "given") : null;
const 낼파일 = 물음이름
  ? path.join(뿌리, "archive", "keyword-demand", 물음이름 + ".json")
  : 낼곳;
if (물음이름) fs.mkdirSync(path.dirname(낼파일), { recursive: true });
fs.writeFileSync(낼파일, JSON.stringify({
  generated: new Date().toISOString(),
  whatThisIs: 'Autocomplete presence (Google Suggest) and English Wikipedia article reads. Neither is a search-volume figure and we do not call them one.',
  whatThisIsNot: 'Monthly search volume. We have no paid keyword data. A phrase that autocompletes is a phrase people type; how many people type it is not measured here.',
  phrases: 잰것,
  people: 사람잰것,
}, null, 1));
console.log(`\n냈다 — ${path.relative(뿌리, 낼파일)}`);
