#!/usr/bin/env node
/**
 * **낸 지면이 실제로 검색에 잡혔나 — 주소 하나씩 물어본다.** (2번 지시 10:2x)
 *
 * ── 왜 개요가 아니라 주소인가 ─────────────────────────────────
 * ⛔ 「사이트맵에 있다」는 **낸 것**이지 잡힌 것이 아니다. 2번이 그것부터 못박았다.
 * ⚠ 개요 보고서는 며칠 늦는다 — 3번이 오늘 백년지도에서 겪었다.
 *   「0장」이라 적혀 있는데 주소로 물으니 열한 장 중 여섯 장이 이미 들어 있었다.
 *
 * ── ⛔ 이 자가 먼저 하는 일: **대조군** ──────────────────────
 * 아무 주소에나 「있다」고 답하는 자는 쓸모가 없다. 그래서 **없는 주소 둘**을 같이 묻고,
 * 그 둘이 「없다」로 나올 때만 나머지 답을 믿는다. 안 그러면 **못 쟀다**로 적고 끝낸다.
 * ⛔ 「못 쟀다」를 「0장 잡혔다」로 적지 않는다. 다른 말이다.
 *
 * ── 무엇으로 「잡혔다」를 판정하나 ────────────────────────────
 * 빙에 `url:<주소>` 를 묻는다. 빙은 그 주소를 가지고 있으면 결과 한 줄(`b_algo`)을 주고,
 * 없으면 결과가 0줄이다. **검색 결과 줄 수**로만 판정한다 — 화면에 주소 글자가 몇 번
 * 나오는지로 세지 않는다(질의문이 그대로 찍히므로 늘 나온다).
 *
 * 쓰는 법
 *   node scripts/check-indexed-urls.mjs            (기본 표본)
 *   node scripts/check-indexed-urls.mjs --n 40     (표본 수)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const 호스트 = 'https://www.kculturewire.com';

/** 빙 답에서 **결과 줄 수**만 센다. 주소 글자 수로 안 센다 — 질의문이 그대로 찍힌다 */
export function 결과줄수(html) {
  return (String(html).match(/class="b_algo"/g) || []).length;
}

/** 빙이 「없다」고 말했나 */
export function 없다고했나(html) {
  return /There are no results for|No results found|did not match any documents/i.test(String(html));
}

/** 주소 하나를 판정한다. 결과 줄이 하나라도 있으면 잡힌 것 */
export function 판정(html) {
  if (결과줄수(html) > 0) return 'indexed';
  if (없다고했나(html)) return 'absent';
  return 'unclear';
}

const 자자 = (ms) => new Promise((r) => { setTimeout(r, ms); });

async function 물어보기(주소) {
  const u = `https://www.bing.com/search?q=${encodeURIComponent(`url:${주소}`)}`;
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  const t = await r.text();
  return { status: r.status, 판정: r.status === 200 ? 판정(t) : 'unclear', 줄: 결과줄수(t) };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('결과 줄을 센다', 결과줄수('<li class="b_algo">a</li><li class="b_algo">b</li>') === 2);
  자가('줄이 없으면 0', 결과줄수('<html>url:https://x/y</html>') === 0);
  /* ⛔ 이 줄이 이 자의 요점이다 — 질의문이 찍혔다고 잡힌 것이 아니다 */
  자가('주소 글자만 있으면 잡힌 게 아니다', 판정('url:https://www.kculturewire.com/title/x 를 찾는 중') !== 'indexed');
  자가('결과 줄이 있으면 잡힌 것', 판정('<li class="b_algo">x</li>') === 'indexed');
  자가('없다고 하면 absent', 판정('There are no results for this query') === 'absent');
  자가('둘 다 아니면 unclear', 판정('<html></html>') === 'unclear');
  console.log(`색인 주소 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const 표본수 = Number((process.argv.find((a) => a.startsWith('--n=')) || '').slice(4))
    || (process.argv.includes('--n') ? Number(process.argv[process.argv.indexOf('--n') + 1]) : 0)
    || 24;

  /* ── ① 대조군을 먼저 묻는다. 여기서 실패하면 아무것도 안 잰다 ── */
  const 대조군 = [
    `${호스트}/title/this-page-does-not-exist-zzz-5beon`,
    `${호스트}/market/nowhere-at-all-zzz-5beon`,
  ];
  console.log('\n① 대조군 — **없는 주소**가 「없다」로 나오나');
  const 대조답 = [];
  for (const u of 대조군) {
    const r = await 물어보기(u);
    대조답.push(r);
    console.log(`   ${r.판정 === 'indexed' ? '🔴' : '  '} ${r.판정.padEnd(8)} 줄 ${r.줄} · ${u.replace(호스트, '')}`);
    await 자자(1500);
  }
  if (대조답.some((r) => r.판정 === 'indexed')) {
    console.log('\n⛔ 대조군이 「잡혔다」로 나온다 — **이 자는 지금 못 잰다.**');
    console.log('   ⛔ 「0장 잡혔다」로 적지 않는다. 「못 쟀다」로 적는다.');
    process.exit(1);
  }

  /* ── ② 표본을 고른다 — 고르게 뽑는다(앞쪽만 보면 알파벳 앞 글자만 본다) ── */
  const d = JSON.parse(fs.readFileSync('src/data/wikitip-title-pages.json', 'utf8'));
  const 낼것 = d.titles.filter((t) => t.hasPage);
  const 간격 = Math.max(1, Math.floor(낼것.length / 표본수));
  const 표본 = [];
  for (let i = 0; i < 낼것.length && 표본.length < 표본수; i += 간격) 표본.push(낼것[i]);

  /* 견줌 — 오래된 지면 몇 장. 「새 지면만 안 잡힌 것」인지 「우리 전체가 안 잡힌 것」인지 가른다 */
  const 견줌 = ['/titles', '/about', '/catalogue-depth', '/world-share'];

  console.log(`\n② 견줌 — **오래전에 낸 지면** ${견줌.length}장`);
  const 견줌답 = [];
  for (const p of 견줌) {
    const r = await 물어보기(호스트 + p);
    견줌답.push({ p, ...r });
    console.log(`   ${r.판정 === 'indexed' ? '✅' : '⬜'} ${r.판정.padEnd(8)} ${p}`);
    await 자자(1500);
  }

  console.log(`\n③ 오늘 낸 **작품 지면** — ${낼것.length}장 중 ${표본.length}장을 고르게 뽑아 묻는다`);
  const 답 = [];
  for (const t of 표본) {
    const r = await 물어보기(`${호스트}/title/${t.slug}`);
    답.push({ slug: t.slug, title: t.title, rows: t.rows, ...r });
    console.log(`   ${r.판정 === 'indexed' ? '✅' : '⬜'} ${r.판정.padEnd(8)} 줄자료 ${String(t.rows).padStart(3)} · /title/${t.slug}`);
    await 자자(1500);
  }

  const 잡힘 = 답.filter((r) => r.판정 === 'indexed').length;
  const 못참 = 답.filter((r) => r.판정 === 'unclear').length;
  const 견줌잡힘 = 견줌답.filter((r) => r.판정 === 'indexed').length;

  console.log('\n────────────────────────────────────────────');
  console.log(`낸 것 ${d.pageCount}장(작품) · 잰 것 ${답.length}장 · **잡힌 것 ${잡힘}장** · 못 가린 것 ${못참}장`);
  console.log(`견줌 — 오래된 지면 ${견줌답.length}장 중 잡힌 것 ${견줌잡힘}장`);
  console.log('잰 방법 — 빙에 `url:<주소>` 를 묻고 **검색 결과 줄 수**로만 판정. 없는 주소 2개를 먼저 물어 대조군을 세웠다.');
  if (잡힘 === 0) {
    console.log('\n⚠ 작품 지면이 아직 하나도 안 잡혔다. **까닭 후보** —');
    console.log('   · 오늘 10시에 냈다. 빙은 IndexNow 를 받고도 넣는 데 시간이 걸린다');
    console.log(`   · 견줌 지면이 ${견줌잡힘}/${견줌답.length} 이면 사이트 자체는 잡히는 중이라는 뜻이다`);
    console.log('   ⛔ 「얇아서 안 잡혔다」로 단정하지 않는다 — 표본의 줄자료는 위에 찍혀 있다');
  }
  process.exit(0);
}
