#!/usr/bin/env node
/**
 * check-kcw-title-promise.mjs — **제목이 지면보다 좁게 말하고 있나**를 본다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-22 실측으로 같은 병을 **세 번** 만났다.
 * ```
 * /market/<93장>  「Korean titles on Netflix in X」   아흔세 장이 똑같은 꼴 · 29장이 1페이지·클릭0
 * /about          「About & methodology」            우리를 가리키는 말 · 노출 102 · 클릭 0
 * /titles         「… in **Southeast Asia**'s …」    실제로는 93개국 528장으로 링크 · 노출 67 · 클릭 0
 * ```
 * 셋 다 **제목이 그 지면이 실제로 주는 것과 어긋난 것**이었다. 눈으로 하나씩 찾았다 —
 * 그러면 다음 장에서 또 샌다. 그래서 자로 만든다.
 *
 * ── 무엇을 보나 (⛔ 「좋은 제목인가」는 안 본다. 그건 사람 몫이다) ──
 * ① **좁게 말하나** — 제목이 한 지역·한 나라를 못박았는데 지면이 그보다 넓은 범위로 링크하나
 * ② **우리 말로 말하나** — 제목이 About·Methodology·Index 처럼 **우리 쪽 낱말**로만 되어 있나
 * ③ **똑같은 꼴이 여럿인가** — 서로 다른 지면 스물 이상이 같은 제목 틀을 쓰나
 *    (검색 결과에서 구별이 안 되면 아무것도 안 눌린다)
 *
 * ⚠ 걸린 것이 곧 잘못은 아니다. **사람이 열어 보고 정한다** — 그래서 이 자는 목록만 낸다.
 * ⚠ 빌드가 없으면 「못 쟀다」로 넘어간다.
 *
 * 쓰는 법  node scripts/check-kcw-title-promise.mjs --자가시험
 *          node scripts/check-kcw-title-promise.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 볼방 = path.join(뿌리, 'dist/wikitip');
const 첫화면 = path.join(뿌리, 'dist/wikitip.html');

/** 제목에서 우리 집 이름 꼬리를 뗀다 */
export const 제목뽑기 = (html) => {
  const m = String(html).match(/<title>([^<]*)<\/title>/);
  if (!m) return null;
  return m[1].replace(/\s*\|\s*K Culture Wire\s*$/, '').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
};

/**
 * ② 우리 쪽 낱말로만 된 제목인가.
 * ⛔ 「About」·「Methodology」·「Index」는 우리가 우리를 부르는 말이다. 손님은 그 말로 안 찾는다.
 * ⚠ 그 낱말이 **들어 있는** 것이 아니라, 제목이 **그것뿐**일 때만 잡는다 —
 *   「Where every number comes from」처럼 뜻이 있는 제목은 안 잡는다.
 */
export const 우리말뿐인가 = (제목) => {
  const s = String(제목 ?? '').toLowerCase().replace(/[^a-z& ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return false;
  const 우리낱말 = new Set(['about', 'methodology', 'index', 'overview', 'contact', 'data',
    'datasets', 'method', 'info', 'information', 'home', 'and', '&', 'the', 'our']);
  const 낱말 = s.split(' ').filter(Boolean);
  if (낱말.length > 4) return false;              // 긴 제목은 뜻이 있다고 본다
  return 낱말.every((w) => 우리낱말.has(w));
};

/**
 * ① 제목이 좁게 못박았는데 지면이 더 넓은 곳으로 링크하나.
 * @param {string} 제목
 * @param {number} 링크수 그 지면이 자기보다 아래 갈래로 거는 링크 수
 */
export const 좁게말하나 = (제목, 링크수, { 넓은기준 = 100 } = {}) => {
  const 좁은말 = /\bsoutheast asia\b|\bsouth[- ]?east asia\b|\bin (japan|korea|vietnam|thailand|indonesia|malaysia|singapore|the philippines)\b/i;
  return 좁은말.test(String(제목 ?? '')) && 링크수 >= 넓은기준;
};

/** ③ 같은 틀을 쓰는 제목 묶음. 숫자·고유명사를 지운 뒤 같은 것을 센다 */
export const 제목틀 = (제목) => String(제목 ?? '')
  .replace(/[0-9][0-9,.]*/g, '#')
  .replace(/\b[A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*)*/g, 'N')
  .replace(/\s+/g, ' ')
  .trim();

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('제목을 뽑는다', 제목뽑기('<title>Hello | K Culture Wire</title>') === 'Hello');
  검('엔티티를 되돌린다', 제목뽑기('<title>About &amp; methodology | K Culture Wire</title>') === 'About & methodology');
  검('⛔ title 이 없으면 null', 제목뽑기('<p>x</p>') === null);

  /* 🔴 오늘 겪은 셋이 이 세 칸이다 */
  검('⭐ 「About & methodology」를 잡는다', 우리말뿐인가('About & methodology') === true);
  검('⭐ 「Index」 하나도 잡는다', 우리말뿐인가('Index') === true);
  검('⛔ 뜻이 있는 제목은 안 잡는다',
    우리말뿐인가('Where every number here comes from, and what we could not count') === false);
  검('⛔ 「The data behind these pages」는 안 잡는다', 우리말뿐인가('The data behind these pages') === false);

  검('⭐ 좁게 말하는데 넓게 링크하면 잡는다',
    좁게말하나("Korean titles in Southeast Asia's Netflix Top 10", 528) === true);
  검('⛔ 좁게 말하고 좁게 링크하면 안 잡는다',
    좁게말하나("Korean titles in Southeast Asia's Netflix Top 10", 12) === false);
  검('⛔ 넓게 말하면 링크가 많아도 안 잡는다',
    좁게말하나('Every Korean title that reached a Netflix top 10', 528) === false);
  검('한 나라를 못박은 것도 본다', 좁게말하나('How much of it charted in Japan', 300) === true);

  검('틀을 같게 만든다', 제목틀('Korean titles on Netflix in Japan') === 제목틀('Korean titles on Netflix in Nicaragua'));
  검('수가 달라도 같은 틀', 제목틀('12 titles here') === 제목틀('340 titles here'));
  검('뜻이 다르면 다른 틀', 제목틀('How much of it is Korean?') !== 제목틀('Korean titles on Netflix'));

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-kcw-title-promise 자가시험 통과 (14)');
  process.exit(0);
}

if (!fs.existsSync(볼방)) { console.log('⚠ 못 쟀다 — dist/wikitip 이 없다(빌드 먼저)'); process.exit(0); }

function 훑기(방) {
  const 낱 = [];
  for (const e of fs.readdirSync(방, { withFileTypes: true })) {
    const 길 = path.join(방, e.name);
    if (e.isDirectory()) 낱.push(...훑기(길));
    else if (e.name.endsWith('.html')) 낱.push(길);
  }
  return 낱;
}

const 장들 = 훑기(볼방);
if (fs.existsSync(첫화면)) 장들.push(첫화면);

const 것들 = [];
let 못읽음 = 0;
for (const 길 of 장들) {
  let h;
  try { h = fs.readFileSync(길, 'utf8'); } catch { 못읽음++; continue; }
  const 제목 = 제목뽑기(h);
  if (!제목) continue;
  const 주소 = `/${path.relative(볼방, 길).replace(/\\/g, '/').replace(/\.html$/, '')}`.replace('/index', '') || '/';
  /* 자기 아래 갈래로 거는 링크 수 — 「좁게 말하나」의 잣대다 */
  const 링크수 = [...h.matchAll(/href="\/(title|market|firm|room|born-on|stem|article)\//g)].length;
  것들.push({ 주소, 제목, 링크수 });
}

if (못읽음 > 장들.length * 0.05) {
  console.log(`⚠ 못 쟀다 — 읽는 중에 ${못읽음}장이 사라졌다(다른 자리가 빌드 중이다)`);
  process.exit(0);
}

const 좁은것 = 것들.filter((x) => 좁게말하나(x.제목, x.링크수));
const 우리말 = 것들.filter((x) => 우리말뿐인가(x.제목));
const 틀묶음 = new Map();
for (const x of 것들) {
  const k = 제목틀(x.제목);
  if (!틀묶음.has(k)) 틀묶음.set(k, []);
  틀묶음.get(k).push(x.주소);
}
const 겹친틀 = [...틀묶음].filter(([, v]) => v.length >= 20).sort((a, b) => b[1].length - a[1].length);

console.log(`제목 약속 검사 — 제목이 있는 지면 ${것들.length}장`);
let 걸림 = 0;

if (좁은것.length) {
  걸림 += 좁은것.length;
  console.log(`\n❌ 제목이 좁게 말하는데 넓게 링크하는 지면 ${좁은것.length}장`);
  좁은것.slice(0, 10).forEach((x) => console.log(`   · ${x.주소} — 링크 ${x.링크수}개 · «${x.제목}»`));
}
if (우리말.length) {
  걸림 += 우리말.length;
  console.log(`\n❌ 제목이 우리 쪽 낱말뿐인 지면 ${우리말.length}장`);
  우리말.slice(0, 10).forEach((x) => console.log(`   · ${x.주소} — «${x.제목}»`));
}
if (겹친틀.length) {
  console.log(`\n⚠ 같은 제목 틀을 쓰는 묶음 ${겹친틀.length}개 — 검색 결과에서 서로 구별이 안 된다`);
  겹친틀.slice(0, 5).forEach(([k, v]) => console.log(`   · ${v.length}장 · «${k}» (예: ${v.slice(0, 2).join(' · ')})`));
  console.log('   ⚠ 이것은 흠으로 세지 않는다 — 갈래 지면은 틀이 같은 것이 옳을 때가 있다. 사람이 정한다');
}

if (걸림) {
  console.log('\n⛔ 위 지면은 **사람이 열어 보고** 정한다. 이 자는 「좋은 제목인가」를 판정하지 않는다.');
  console.log('   ⭐ 오늘 셋을 이렇게 고쳤다 — /market/* · /about · /titles. 4주 뒤 클릭률로 확인한다.');
  process.exit(1);
}
console.log('\n✅ 제목이 좁게 말하거나 우리 쪽 낱말뿐인 지면이 없다');
