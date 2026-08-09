#!/usr/bin/env node
/**
 * **작품 지면이 검색엔진이 가져갈 수 있는 상태인가 — 라이브에서 표본으로 잰다.**
 *
 * ── 왜 이 자인가 ──────────────────────────────────────────────
 * 2번이 「530장이 검색에 잡히는지 재라」고 했다. ⛔ **잡혔는지는 로그인 없이 못 잰다** —
 *   빙은 Cloudflare 캡차를 준다(양성 대조군인 위키백과·넷플릭스도 0 으로 나온다)
 *   구글은 JS 없이 결과를 안 그린다
 *   네이버는 잴 수 있고 **진짜 0** 이다(사이트맵 제출 전이라 그렇다)
 * ⛔ 그래서 「잡혔다」를 못 적는다. 대신 **잡히기 위한 조건**을 라이브에서 잰다.
 *   이건 대신하는 수가 아니라 **우리가 책임질 수 있는 부분**이다. 둘을 갈라 적는다.
 *
 * ── 무엇을 재나 ───────────────────────────────────────────────
 * ① 200 으로 열리나  ② canonical 이 자기 주소인가  ③ noindex 가 없나
 * ④ 사이트맵에 있나  ⑤ 제목·설명이 지면마다 다른가(같으면 색인이 접는다)
 * ⑥ 본문에 자료 줄이 실제로 실렸나
 *
 * 쓰는 법: node scripts/check-title-pages-live.mjs --n 20
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 호스트 = 'https://www.kculturewire.com';
const UA = 'Mozilla/5.0 (compatible; KCultureWireCheck/1.0)';

export function 머리값(html, 이름) {
  const m = String(html).match(new RegExp(`<meta[^>]+name="${이름}"[^>]+content="([^"]*)"`, 'i'))
    || String(html).match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+name="${이름}"`, 'i'));
  return m ? m[1] : null;
}

export function 캐노니컬(html) {
  const m = String(html).match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i);
  return m ? m[1] : null;
}

export function 제목(html) {
  const m = String(html).match(/<title>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('canonical 을 읽는다', 캐노니컬('<link rel="canonical" href="https://x/y">') === 'https://x/y');
  자가('canonical 이 없으면 null', 캐노니컬('<html></html>') === null);
  자가('robots 머리값을 읽는다', 머리값('<meta name="robots" content="noindex">', 'robots') === 'noindex');
  자가('순서가 바뀌어도 읽는다', 머리값('<meta content="noindex" name="robots">', 'robots') === 'noindex');
  자가('제목을 읽는다', 제목('<title> A </title>') === 'A');
  console.log(`작품 지면 라이브 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const 표본수 = Number((process.argv.find((a) => a.startsWith('--n=')) || '').slice(4))
    || (process.argv.includes('--n') ? Number(process.argv[process.argv.indexOf('--n') + 1]) : 0)
    || 20;

  const d = JSON.parse(fs.readFileSync('src/data/wikitip-title-pages.json', 'utf8'));
  const 낼것 = d.titles.filter((t) => t.hasPage);
  const 간격 = Math.max(1, Math.floor(낼것.length / 표본수));
  const 표본 = [];
  for (let i = 0; i < 낼것.length && 표본.length < 표본수; i += 간격) 표본.push(낼것[i]);

  /*
   * ⛔ 라이브에 못 닿으면 **넘어간다.** 인터넷 사정으로 남의 빌드를 죽이지 않는다.
   *   못 잰 것을 흠으로 세면 다음 사람이 이 자를 npm test 에서 빼 버린다 —
   *   그러면 「안 불리는 검사는 그냥 문장」으로 돌아간다.
   */
  let sm = '';
  try {
    sm = await (await fetch(`${호스트}/sitemap.xml`, { headers: { 'User-Agent': UA } })).text();
  } catch (e) {
    console.log(`⬜ 라이브에 못 닿아 **못 쟀다** — ${e.message}`);
    process.exit(0);
  }

  const 결과 = [];
  for (const t of 표본) {
    const u = `${호스트}/title/${t.slug}`;
    let r; let html = '';
    try {
      r = await fetch(u, { headers: { 'User-Agent': UA } });
      html = await r.text();
    } catch (e) {
      결과.push({ slug: t.slug, 상태: 0, 메모: e.message });
      continue;
    }
    결과.push({
      slug: t.slug,
      rows: t.rows,
      상태: r.status,
      캐노맞나: 캐노니컬(html) === u,
      noindex: /noindex/i.test(머리값(html, 'robots') || ''),
      사이트맵: sm.includes(`<loc>${u}</loc>`),
      제목: 제목(html),
      설명: 머리값(html, 'description'),
      수실림: t.byMarket.slice(0, 3).every((m) => html.includes(m.name)),
    });
  }

  const 열림수 = 결과.filter((x) => x.상태 === 200).length;
  const 캐노 = 결과.filter((x) => x.캐노맞나).length;
  const 노인덱스 = 결과.filter((x) => x.noindex).length;
  const 사맵 = 결과.filter((x) => x.사이트맵).length;
  const 수 = 결과.filter((x) => x.수실림).length;
  const 제목집합 = new Set(결과.map((x) => x.제목));
  const 설명집합 = new Set(결과.map((x) => x.설명));

  console.log(`\n낸 작품 지면 ${d.pageCount}장 · 라이브에서 잰 것 ${결과.length}장(고르게 뽑음)`);
  console.log(`  200 으로 열림          ${열림수}/${결과.length}`);
  console.log(`  canonical 이 자기 주소   ${캐노}/${결과.length}`);
  console.log(`  noindex 걸린 것        ${노인덱스}/${결과.length}  ← 0 이어야 한다`);
  console.log(`  사이트맵에 있음         ${사맵}/${결과.length}`);
  console.log(`  자료가 화면에 실림       ${수}/${결과.length}`);
  console.log(`  제목이 서로 다름        ${제목집합.size}/${결과.length}  ← 같으면 색인이 접는다`);
  console.log(`  설명이 서로 다름        ${설명집합.size}/${결과.length}`);

  const 흠 = 결과.filter((x) => x.상태 !== 200 || !x.캐노맞나 || x.noindex || !x.사이트맵 || !x.수실림);
  if (흠.length) {
    console.log(`\n⛔ 흠 있는 지면 ${흠.length}장`);
    for (const x of 흠) console.log(`   · /title/${x.slug} — 상태 ${x.상태} · canonical ${x.캐노맞나} · noindex ${x.noindex} · 사이트맵 ${x.사이트맵} · 수 ${x.수실림}`);
    process.exit(1);
  }
  console.log('\n✅ 표본 전부가 **가져갈 수 있는 상태**다.');
  console.log('⛔ 다만 이것은 「잡혔다」가 아니다. 잡혔는지는 로그인 없이 못 잰다 — 그 까닭은 이 파일 위쪽에 적혀 있다.');
  process.exit(0);
}
