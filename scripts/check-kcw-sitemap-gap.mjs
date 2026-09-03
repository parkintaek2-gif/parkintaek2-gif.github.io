#!/usr/bin/env node
/**
 * check-kcw-sitemap-gap.mjs — **지면은 라이브인데 사이트맵에 없나. 그 반대는 없나.**
 * ────────────────────────────────────────────────────────────────────────────
 * [왜 만드나 — 사장님 지시 2026-09-03]
 *   사장님: 「**3번이 겪은 시행착오를 반면교사 삼아 업무에 반영해**」 · 「GEO, SEO 꼭 하도록」
 *
 *   3번이 남긴 것(원문):
 *     > 사장님이 「콘텐트 목표 달성했는데 방문자 1명이면 이유를 찾아 고쳐라」고 지적한
 *     > 뒤 check:100y:launch 를 처음 돌려서 잡았다 — 이 세 줄이 통째로 빠져 있었다.
 *     > **지면은 라이브인데 사이트맵엔 없어 구글이 몰랐다.**
 *     > /after·/region·/pets 등에서 반복된 것과 같은 실수를 오늘 또 세 번 했다 —
 *     > 앞으로 새 고정 지면을 만들 때마다 반드시 이 자리에 같은 커밋으로 넣는다.
 *
 *   ⛔ **「앞으로 반드시 넣는다」는 기억에 맡기는 규칙이고, 기억은 잊는다.**
 *      3번도 그렇게 적어 두고 «같은 날 세 번» 또 어겼다. 우리 강령이
 *      「규칙은 문장이 아니라 검사로 둔다」인 까닭이 이것이다. 그래서 자로 만든다.
 *
 * [이 병이 왜 제일 나쁜가]
 *   지면이 404 면 눈에 보인다. 그런데 이 병은 **지면이 멀쩡하다.**
 *   손님이 주소를 알면 잘 열린다. 다만 **구글이 그 주소를 모른다.**
 *   그래서 「콘텐트는 냈는데 방문자가 없다」가 되고, 원인이 콘텐트에 있는 줄 알고
 *   엉뚱한 데를 고치게 된다. 사장님이 「이유를 찾아 고쳐라」 하신 것이 그 자리다.
 *
 * [두 방향을 다 본다 — 한쪽만 보면 절반만 막는다]
 *   1. 지면은 있는데 사이트맵에 없다   →  구글이 모른다 (3번이 겪은 것)
 *   2. 사이트맵에 있는데 지면이 없다   →  구글이 404 를 받는다. 사이트맵 신뢰가 깎인다
 *
 * [⛔ 헛경보를 막으려고 둔 것 — 잘못 잡는 자는 꺼진다]
 *   · `draft: true` 기사는 사이트맵에 «없는 것이 맞다». 흠으로 세지 않는다
 *     ⭐ 2026-09-03 에 실제로 이것 때문에 헛경보를 낼 뻔했다 —
 *        서울마켓 기사 4편이 사이트맵에 없었는데 넷 다 draft 이고 라이브 404 였다
 *   · 동적 지면(`[slug].astro`)은 이 자가 세지 않는다. 그건 자료가 정하는 것이다
 *   · 사이트맵·robots·llms 같은 «지면이 아닌 것»은 뺀다
 *   · 법정 고지(privacy·terms·refund)와 404 는 사이트맵에 없어도 된다
 *
 * [쓰는 법]
 *   node scripts/check-kcw-sitemap-gap.mjs              dist 사이트맵으로 잰다
 *   node scripts/check-kcw-sitemap-gap.mjs --라이브       라이브 사이트맵으로 잰다(구글이 보는 것)
 *   node scripts/check-kcw-sitemap-gap.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 지면방 = path.join(뿌리, 'src', 'pages', 'wikitip');
const dist사이트맵 = path.join(뿌리, 'dist', 'wikitip', 'sitemap.xml');
const 라이브사이트맵 = 'https://www.kculturewire.com/wikitip/sitemap.xml';

/** 사이트맵 글자에서 «우리 쪽 길»만 뽑는다 */
export function 사이트맵길(xml) {
  const 나온다 = new Set();
  for (const m of String(xml ?? '').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const p = m[1].replace(/https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/';
    나온다.add(p);
  }
  return 나온다;
}

/** 사이트맵에 없어도 되는 길인가 — 까닭을 함께 둔다 */
export function 봐준다(길) {
  const p = String(길 ?? '');
  if (p === '/404') return '없는 지면 안내라 색인하지 않는다';
  if (/^\/(privacy|terms|refund|subscribe|contact)$/.test(p)) return '법정 고지·신청 지면은 색인 대상이 아니다';
  if (/\.(xml|txt|json)$/.test(p)) return '지면이 아니다';
  if (/sitemap|llms|robots/.test(p)) return '기계가 읽는 파일이다';
  return null;
}

/**
 * 「고정 지면」을 센다 — `[slug].astro` 같은 동적 지면은 뺀다.
 * ⭐ 3번이 빠뜨린 것이 바로 이 갈래다. 동적 지면은 자료가 늘면 사이트맵도 같이 늘지만,
 *    고정 지면은 **사람이 손으로 사이트맵에 적어야** 해서 잊힌다.
 */
export function 고정지면(방, 밑 = '') {
  const 나온다 = [];
  for (const e of fs.readdirSync(방, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name.startsWith('[')) continue;
      나온다.push(...고정지면(path.join(방, e.name), `${밑}/${e.name}`));
      continue;
    }
    if (!/\.(astro|ts)$/.test(e.name)) continue;
    if (e.name.startsWith('[')) continue;
    const 이름 = e.name.replace(/\.(astro|ts)$/, '');
    나온다.push(이름 === 'index' ? (밑 || '/') : `${밑}/${이름}`);
  }
  return 나온다;
}

/** 초안인가 — 초안은 사이트맵에 없는 것이 «맞다» */
export function 초안인가(원문) {
  return /^draft:\s*true\s*$/m.test(String(원문 ?? ''));
}

function 자가시험() {
  let 흠 = 0; let 잰수 = 0;
  const 본다 = (이름, 참) => { 잰수 += 1; if (참) console.log(`  ✅ ${이름}`); else { console.log(`  🔴 ${이름}`); 흠 += 1; } };

  const s = 사이트맵길('<url><loc>https://x.com/a/b</loc></url><url><loc>https://x.com/</loc></url>');
  본다('사이트맵에서 길을 뽑는다', s.has('/a/b'));
  본다('홈은 「/」로 둔다', s.has('/'));
  본다('꼬리 빗금을 뗀다', 사이트맵길('<loc>https://x.com/a/</loc>').has('/a'));
  본다('빈 글자는 빈 집합', 사이트맵길('').size === 0);

  본다('404 는 봐준다', 봐준다('/404') !== null);
  본다('개인정보 지면은 봐준다', 봐준다('/privacy') !== null);
  본다('사이트맵 자신은 봐준다', 봐준다('/sitemap.xml') !== null);
  본다('llms.txt 는 봐준다', 봐준다('/llms.txt') !== null);
  /* ⚠ 봐주는 것이 너무 넓으면 자가 아무것도 안 잡는다 */
  본다('보통 지면은 안 봐준다', 봐준다('/exports') === null);
  본다('기사도 안 봐준다', 봐준다('/article/abc') === null);

  본다('초안을 알아본다', 초안인가('title: 가\ndraft: true\n') === true);
  본다('draft: false 는 초안이 아니다', 초안인가('draft: false') === false);
  본다('draft 가 없으면 초안이 아니다', 초안인가('title: 가') === false);
  /* 🔴 2026-09-03 에 실제로 이것 때문에 헛경보를 낼 뻔했다 */
  본다('주석 안의 draft: true 는 초안이 아니다', 초안인가('# draft: true 라고 적힌 설명') === false);

  console.log(흠 ? `\n🔴 자가시험 ${잰수}가지 중 ${흠}가지 틀렸다` : `\n✅ 자가시험 ${잰수}가지 다 맞다`);
  return 흠;
}

async function main() {
  const 인자 = process.argv.slice(2);
  console.log('# 지면은 라이브인데 사이트맵에 없나\n');
  const 흠 = 자가시험();
  if (인자.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('\n⛔ 자가시험이 틀렸다. 재지 않는다.'); process.exit(1); }

  /* ── 사이트맵을 구한다 ── */
  let xml = null; let 어디 = null;
  if (인자.includes('--라이브')) {
    try {
      const r = await fetch(라이브사이트맵, { signal: AbortSignal.timeout(30000) });
      if (r.ok) { xml = await r.text(); 어디 = '라이브'; }
    } catch { /* 아래에서 「못 쟀다」로 선다 */ }
  } else if (fs.existsSync(dist사이트맵)) {
    xml = fs.readFileSync(dist사이트맵, 'utf8');
    어디 = 'dist';
  }
  if (!xml) {
    console.log('\n⬜ **못 쟀다 — 사이트맵을 못 읽었다.**');
    console.log(`   dist: ${dist사이트맵}`);
    console.log('   ⛔ 이것은 「통과」가 아니다. 먼저 빌드하거나 --라이브 로 돌린다.');
    console.log('   ⚠ 여러 유닛이 같은 나무에서 동시에 빌드하면 dist 가 반쯤 지워진 채로 보인다.');
    process.exit(1);
  }

  const 든것 = 사이트맵길(xml);
  console.log(`\n사이트맵(${어디}) — 주소 ${든것.size}개`);

  /* ── 1. 고정 지면이 사이트맵에 있나 ── */
  const 고정 = 고정지면(지면방);
  const 빠진고정 = [];
  for (const p of 고정) {
    if (든것.has(p)) continue;
    if (봐준다(p)) continue;
    빠진고정.push(p);
  }

  /* ── 2. 기사가 사이트맵에 있나 (초안은 뺀다) ── */
  const 기사방 = path.join(뿌리, 'content', 'kculturewire');
  const 빠진기사 = []; const 초안수 = { n: 0 };
  if (fs.existsSync(기사방)) {
    for (const f of fs.readdirSync(기사방).filter((x) => x.endsWith('.md'))) {
      const slug = f.replace(/\.md$/, '');
      const 원문 = fs.readFileSync(path.join(기사방, f), 'utf8');
      if (초안인가(원문)) { 초안수.n += 1; continue; }
      if (!든것.has(`/article/${slug}`)) 빠진기사.push(slug);
    }
  }

  /* ── 3. 반대 방향 — 사이트맵에 있는데 기사 원고가 없나 ── */
  const 있는기사 = new Set(fs.existsSync(기사방)
    ? fs.readdirSync(기사방).filter((x) => x.endsWith('.md')).map((x) => x.replace(/\.md$/, '')) : []);
  const 죽은주소 = [...든것].filter((p) => p.startsWith('/article/') && !있는기사.has(p.replace('/article/', '')));

  console.log(`고정 지면 ${고정.length}장 · 기사 ${있는기사.size}편(초안 ${초안수.n}편은 뺐다)`);

  let 총 = 0;
  if (빠진고정.length) {
    총 += 빠진고정.length;
    console.log(`\n🔴 **고정 지면 ${빠진고정.length}장이 사이트맵에 없다 — 구글이 그 주소를 모른다**`);
    for (const p of 빠진고정) console.log(`   ${p}`);
    console.log('   ⛔ 지면은 멀쩡히 열린다. 그래서 눈에 안 보이고, 「콘텐트는 냈는데 방문자가 없다」가 된다.');
  }
  if (빠진기사.length) {
    총 += 빠진기사.length;
    console.log(`\n🔴 **기사 ${빠진기사.length}편이 사이트맵에 없다** (초안이 아닌데도)`);
    for (const s of 빠진기사.slice(0, 10)) console.log(`   /article/${s}`);
  }
  if (죽은주소.length) {
    총 += 죽은주소.length;
    console.log(`\n🔴 **사이트맵에 있는데 원고가 없는 주소 ${죽은주소.length}개 — 구글이 404 를 받는다**`);
    for (const p of 죽은주소.slice(0, 10)) console.log(`   ${p}`);
  }

  if (!총) {
    console.log('\n✅ 구멍 없다 — 고정 지면과 기사가 다 사이트맵에 있고, 죽은 주소도 없다');
    console.log(`   ⚠ 초안 ${초안수.n}편은 «없는 것이 맞다». 흠으로 세지 않았다.`);
    process.exit(0);
  }
  console.log(`\n🔴 흠 ${총}건 — 새 고정 지면을 만들었으면 «같은 커밋»으로 사이트맵에 넣는다`);
  process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-kcw-sitemap-gap.mjs')) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
