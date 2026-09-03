#!/usr/bin/env node
/**
 * check-kcw-rich-results.mjs — **KCW 기사가 검색 결과에서 «어떻게 보일지»를 잰다.**
 * ────────────────────────────────────────────────────────────────────────────
 * [왜 만드나 — 2026-09-03 실측]
 *   네 사이트를 같은 자로 재 보니 KCW 의 병이 «노출»이 아니었다.
 *   ```
 *   100yearmap   노출 4,712 · 클릭 96 · 클릭률 2.04%
 *   KCW          노출 5,010 · 클릭 34 · 클릭률 0.68%   ← 노출은 «더 많은데» 클릭이 3분의 1
 *   ```
 *   사람은 우리를 찾고 있고 **보고도 안 누른다.** 고칠 자리는 제목·설명인데
 *   /market·/group·/esports 와 기사 여덟 편 묶음이 9/24~30 까지 실험 중이라 손댈 수 없다.
 *
 *   ✅ 그래서 «제목 글자를 안 건드리고 검색 결과의 모양을 바꾸는» 길로 갔다 — 구조화 데이터다.
 *      그날 실측: BreadcrumbList 가 세 사이트 통틀어 **0장**, KCW 기사 139편에 표가 있는데
 *      Dataset 은 **0편**이었다(6번은 61/61 붙인다 — 우리만 빠져 있었다).
 *
 * [이 자가 지키는 것]
 *   1. 기사마다 JSON-LD 가 «파싱된다» — 깨진 스키마는 없는 것보다 나쁘다
 *   2. NewsArticle · BreadcrumbList 가 다 있다
 *   3. 표가 있는 편에는 Dataset 이 있고, **없는 편에는 없다**(없는 것을 있다고 하지 않는다)
 *   4. 🔴 빵가루가 «살아 있는 주소»를 가리킨다 — dist 에 그 절 지면이 실제로 있나
 *      ⛔ 없는 주소를 가리키는 빵가루는 없는 것보다 나쁘다
 *   5. 🔴 갈래 이름이 소문자로 새지 않는다
 *      까닭: CATEGORY 지도에 실제로 없는 갈래(screen·music·people)가 적혀 있고
 *      실제 갈래(stars·titles·tradition)가 빠져 있어, 화면에 「titles」가 소문자로 나갔다.
 *      **영문 매체가 제 갈래 이름을 소문자로 낸 것이다.**
 *
 * [쓰는 법]
 *   node scripts/check-kcw-rich-results.mjs
 *   node scripts/check-kcw-rich-results.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기사방 = path.join(뿌리, 'dist', 'wikitip', 'article');
const 절방 = path.join(뿌리, 'dist', 'wikitip', 'section');

/** 지면에서 JSON-LD 를 꺼낸다. 못 꺼내면 null (빈 배열이 아니다 — 「없다」와 「못 읽었다」는 다르다) */
export function 스키마꺼내기(html) {
  const m = String(html ?? '').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[1]);
    return Array.isArray(j) ? j : [j];
  } catch { return null; }
}

/** 표가 있나 — dist HTML 을 본다 */
export const 표있나 = (html) => /<table/i.test(String(html ?? ''));

/** 갈래 이름이 소문자로 샜나 — 「Titles」는 옳고 「titles」는 샌 것이다 */
export function 소문자로샜나(스키마들) {
  const bc = (스키마들 || []).find((x) => x && x['@type'] === 'BreadcrumbList');
  if (!bc) return null;
  const 절칸 = (bc.itemListElement || []).find((x) => String(x.item || '').includes('/section/'));
  if (!절칸) return null;
  const 이름 = String(절칸.name ?? '');
  if (!이름) return null;
  /* 첫 글자가 소문자 영문이면 샌 것이다 */
  return /^[a-z]/.test(이름);
}

/** 빵가루가 가리키는 절 지면이 dist 에 있나 */
export function 절이있나(스키마들, 있는절) {
  const bc = (스키마들 || []).find((x) => x && x['@type'] === 'BreadcrumbList');
  if (!bc) return null;
  const 절칸 = (bc.itemListElement || []).find((x) => String(x.item || '').includes('/section/'));
  if (!절칸) return null;
  const 갈래 = String(절칸.item).split('/section/')[1].replace(/\/$/, '');
  return { 갈래, 있나: 있는절.has(갈래) };
}

function 자가시험() {
  let 흠 = 0; let 잰수 = 0;
  const 본다 = (이름, 참) => { 잰수 += 1; if (참) console.log(`  ✅ ${이름}`); else { console.log(`  🔴 ${이름}`); 흠 += 1; } };

  본다('스키마를 꺼낸다',
    스키마꺼내기('<script type="application/ld+json">{"@type":"NewsArticle"}</script>')[0]['@type'] === 'NewsArticle');
  본다('배열도 그대로 읽는다',
    스키마꺼내기('<script type="application/ld+json">[{"@type":"A"},{"@type":"B"}]</script>').length === 2);
  /* ⛔ 깨진 것을 「없다」로 세면 안 된다 — 둘 다 null 이지만 뜻이 다르니 본체에서 갈라 센다 */
  본다('깨진 JSON 은 null 이다', 스키마꺼내기('<script type="application/ld+json">{깨짐</script>') === null);
  본다('스키마가 없으면 null 이다', 스키마꺼내기('<p>없다</p>') === null);

  본다('표를 알아본다', 표있나('<table><tr><td>가</td></tr></table>') === true);
  본다('표 없으면 false', 표있나('<p>글만</p>') === false);

  const 좋은빵 = [{ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 3, name: 'Titles', item: 'https://x/section/titles' }] }];
  const 샌빵 = [{ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 3, name: 'titles', item: 'https://x/section/titles' }] }];
  /* 🔴 실제로 걸린 결함 — 이 두 줄이 그것을 막는다 */
  본다('갈래 이름이 소문자면 잡는다', 소문자로샜나(샌빵) === true);
  본다('대문자로 시작하면 안 잡는다', 소문자로샜나(좋은빵) === false);
  본다('빵가루가 없으면 null 이다 (0 으로 안 채운다)', 소문자로샜나([{ '@type': 'NewsArticle' }]) === null);

  본다('빵가루가 가리키는 절을 읽는다',
    절이있나(좋은빵, new Set(['titles'])).갈래 === 'titles');
  본다('그 절이 있으면 있다고 한다', 절이있나(좋은빵, new Set(['titles'])).있나 === true);
  /* ⛔ 없는 주소를 가리키는 빵가루는 없는 것보다 나쁘다 */
  본다('그 절이 없으면 없다고 한다', 절이있나(좋은빵, new Set(['stars'])).있나 === false);

  console.log(흠 ? `\n🔴 자가시험 ${잰수}가지 중 ${흠}가지 틀렸다` : `\n✅ 자가시험 ${잰수}가지 다 맞다`);
  return 흠;
}

function main() {
  const 인자 = process.argv.slice(2);
  console.log('# KCW 기사가 검색 결과에서 어떻게 보일지\n');
  const 흠 = 자가시험();
  if (인자.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('\n⛔ 자가시험이 틀렸다. 재지 않는다.'); process.exit(1); }

  if (!fs.existsSync(기사방)) {
    console.log('\n⬜ **못 쟀다** — dist/wikitip/article 이 없다. 먼저 빌드한다.');
    console.log('   ⛔ 이것은 「통과」가 아니다.');
    process.exit(1);
  }

  const 있는절 = new Set(
    fs.existsSync(절방) ? fs.readdirSync(절방).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')) : [],
  );
  const 파일들 = fs.readdirSync(기사방).filter((f) => f.endsWith('.html'));

  const 흠들 = { 못읽음: [], 스키마없음: [], 빵가루없음: [], 기사없음: [], 데이터셋빠짐: [], 데이터셋군더더기: [], 소문자: [], 죽은절: [] };
  let 좋음 = 0; let 표편수 = 0;

  for (const f of 파일들) {
    const html = fs.readFileSync(path.join(기사방, f), 'utf8');
    const 이름 = f.replace(/\.html$/, '');
    const 원글 = html;
    const 스 = 스키마꺼내기(원글);
    if (스 === null) {
      /* 스키마가 아예 없는 것과 깨진 것을 갈라 센다 */
      (/<script type="application\/ld\+json">/.test(원글) ? 흠들.못읽음 : 흠들.스키마없음).push(이름);
      continue;
    }
    const 종류 = 스.map((x) => x && x['@type']);
    if (!종류.includes('NewsArticle')) 흠들.기사없음.push(이름);
    if (!종류.includes('BreadcrumbList')) { 흠들.빵가루없음.push(이름); continue; }

    const 표 = 표있나(원글);
    if (표) 표편수 += 1;
    const 셋 = 종류.includes('Dataset');
    if (표 && !셋) 흠들.데이터셋빠짐.push(이름);
    if (!표 && 셋) 흠들.데이터셋군더더기.push(이름);

    if (소문자로샜나(스) === true) 흠들.소문자.push(이름);
    const 절 = 절이있나(스, 있는절);
    if (절 && !절.있나) 흠들.죽은절.push(`${이름} → /section/${절.갈래}`);

    if (!흠들.데이터셋빠짐.includes(이름) && !흠들.소문자.includes(이름)) 좋음 += 1;
  }

  console.log(`\n기사 ${파일들.length}편 · 표가 있는 편 ${표편수}편 · 절 지면 ${있는절.size}장 (${[...있는절].join(' · ')})`);

  const 말 = [
    ['못읽음', '🔴 JSON-LD 가 깨져 파싱이 안 된다 — 깨진 스키마는 없는 것보다 나쁘다'],
    ['스키마없음', '🔴 JSON-LD 가 아예 없다'],
    ['기사없음', '🔴 NewsArticle 이 없다'],
    ['빵가루없음', '🔴 BreadcrumbList 가 없다 — 검색 결과에 날 주소가 나간다'],
    ['데이터셋빠짐', '🔴 표가 있는데 Dataset 이 없다 — AI 가 인용할 자리가 빈다'],
    ['데이터셋군더더기', '🔴 표가 없는데 Dataset 이 있다 — 없는 것을 있다고 했다'],
    ['소문자', '🔴 갈래 이름이 소문자로 샜다 — 영문 매체가 제 갈래 이름을 소문자로 낸 것이다'],
    ['죽은절', '🔴 빵가루가 «없는 주소»를 가리킨다 — 없는 것보다 나쁘다'],
  ];

  let 총흠 = 0;
  for (const [칸, 글] of 말) {
    const 것들 = 흠들[칸];
    if (!것들.length) continue;
    총흠 += 것들.length;
    console.log(`\n■ ${글} — ${것들.length}편`);
    for (const x of 것들.slice(0, 8)) console.log(`   ${x}`);
    if (것들.length > 8) console.log(`   … 그리고 ${것들.length - 8}편 더`);
  }

  if (!총흠) {
    console.log(`\n✅ ${파일들.length}편 다 갖췄다 — NewsArticle · BreadcrumbList · (표 있는 편에) Dataset`);
    console.log('   빵가루가 가리키는 절 지면이 다 살아 있고, 갈래 이름이 소문자로 새지 않는다');
    process.exit(0);
  }
  console.log(`\n🔴 흠 ${총흠}건`);
  process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-kcw-rich-results.mjs')) main();
