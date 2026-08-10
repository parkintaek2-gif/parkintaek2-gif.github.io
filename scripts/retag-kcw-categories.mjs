#!/usr/bin/env node
/**
 * **갈래를 새 짜임으로 옮긴다.** 앞머리 `category` 만 손댄다.
 *
 * 🔴 2026-08-10 사장님 — 「기존 카테고리는 촌스럽다. **스타·작품·전통문화·산업**으로 하라.
 *   2nd depth 에 대중문화 장르를 넣는 것 괜찮다. **전통문화는 one depth 로** 가라」
 *
 * ── 옮김표 ────────────────────────────────────────────────────
 *   people   → stars
 *   music    → titles + genre music
 *   esports  → titles + genre esports
 *   screen   → titles                ⚠ **2층을 안 붙인다** — 아래를 보라
 *   industry → industry              (이름 그대로)
 *
 * ── ⚠ screen 37편에 2층을 안 붙이는 까닭 ─────────────────────
 *   재 봤다. 37편 중 **30편이 영화와 드라마를 같이 잰다.**
 *   넷플릭스는 Films 와 TV 를 **따로** 내고 우리 기사 대부분이 그 둘을 견주는 글이다.
 *   ⛔ 한쪽에 넣으면 **거짓이 된다.** 2층은 말할 수 있는 것에만 붙인다.
 *   ⭐ 그래서 지금 2층이 붙는 것은 music 8 · esports 5 뿐이다. 그 사실을 그대로 낸다.
 *
 * ⛔ 기사 **글은 한 글자도 안 건드린다.** 앞머리 한 줄만 바꾼다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 방 = 'content/kculturewire';

/** 옛 갈래 → { 새 갈래, 2층 } */
export const 옮김 = new Map([
  ['people', { category: 'stars', genre: null }],
  ['music', { category: 'titles', genre: 'music' }],
  ['esports', { category: 'titles', genre: 'esports' }],
  ['screen', { category: 'titles', genre: null }],
  ['industry', { category: 'industry', genre: null }],
]);

/**
 * 앞머리의 `category:` 줄을 바꾸고, 2층이 있으면 바로 아래에 `genre:` 를 넣는다.
 * ⛔ 이미 새 갈래면 **안 건드린다.** 두 번 돌려도 같아야 한다.
 */
export function 고치기(글) {
  const 줄 = String(글).split('\n');
  const i = 줄.findIndex((l) => /^category:\s*\S+/.test(l));
  if (i < 0) return { 글: String(글), 바뀜: false, 옛: null };
  const 옛 = 줄[i].replace(/^category:\s*/, '').trim();
  const 새 = 옮김.get(옛);
  if (!새) return { 글: String(글), 바뀜: false, 옛 };
  줄[i] = `category: ${새.category}`;
  /* 이미 genre 가 있으면 지우고 다시 넣는다 — 두 번 돌려도 하나여야 한다 */
  const j = 줄.findIndex((l) => /^genre:\s*\S+/.test(l));
  if (j >= 0) 줄.splice(j, 1);
  if (새.genre) 줄.splice(i + 1, 0, `genre: ${새.genre}`);
  return { 글: 줄.join('\n'), 바뀜: true, 옛, 새: 새.category, 둘째층: 새.genre };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('screen → titles, 2층 없음',
    고치기('title: x\ncategory: screen\npubDate: 1').글, 'title: x\ncategory: titles\npubDate: 1');
  재본다('music → titles + genre',
    고치기('category: music\nx: 1').글, 'category: titles\ngenre: music\nx: 1');
  재본다('people → stars', 고치기('category: people').글, 'category: stars');
  재본다('industry 는 이름 그대로', 고치기('category: industry').글, 'category: industry');
  /* ⛔ 두 번 돌려도 같아야 한다 */
  재본다('두 번 돌려도 같다', 고치기(고치기('category: music\nx: 1').글).글, 'category: titles\ngenre: music\nx: 1');
  재본다('이미 새 갈래면 안 건드린다', 고치기('category: tradition').바뀜, false);
  재본다('category 가 없으면 안 건드린다', 고치기('title: x').바뀜, false);
  /* 🔴 genre 가 이미 있으면 겹쳐 쓰지 않는다 */
  재본다('genre 가 둘이 안 된다',
    (고치기('category: music\ngenre: music\nx: 1').글.match(/^genre:/gm) || []).length, 1);
  console.log(`갈래 옮기는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 셈 = new Map();
  let 바꾼편 = 0;
  for (const f of fs.readdirSync(방).filter((x) => x.endsWith('.md'))) {
    const p = path.join(방, f);
    const 원 = fs.readFileSync(p, 'utf8');
    const 옛글 = 원.replace(/\r\n/g, '\n');
    const r = 고치기(옛글);
    /* 🔴 `industry → industry` 는 바꿀 것이 없는데 `바뀜: true` 라 두 번째 실행이
       「14편 옮겼다」로 나왔다. **글이 실제로 달라졌을 때만** 센다 — 셈이 거짓말하면 안 된다. */
    if (!r.바뀜 || r.글 === 옛글) continue;
    fs.writeFileSync(p, r.글);
    바꾼편 += 1;
    const k = r.둘째층 ? `${r.새} > ${r.둘째층}` : r.새;
    셈.set(k, (셈.get(k) ?? 0) + 1);
  }
  console.log(`${바꾼편}편 옮겼다`);
  for (const [k, v] of [...셈.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(22)} ${v}편`);
}
