/**
 * build-kcw-cardnews-index.mjs — **기사 카드뉴스 474장을 «찾을 수 있게» 만든다.**
 *
 * ── 🔴 왜 (2026-08-24 밤) ─────────────────────────────────────
 * 사장님 「방문자 늘리는 데 올인하라」로 세다가 세 번째 같은 흠을 잡았다 —
 * ```
 *   ① 숏영상 21편   → VideoObject 스키마 0장          (고쳤다)
 *   ② 숏영상 21편   → 비디오 사이트맵 9편              (고쳤다)
 *   ③ 카드뉴스 96벌 474장 → 지면에 0벌 · 사이트맵에 0벌   ← 이것이다
 * ```
 * 사장님 지시(2026-08-13): 「이건 **외부유입용** 콘텐트 역할도 하고, 우리를 알리는 거니까」.
 * ⛔ 서버에 있는 것과 «걸린 것»은 다르다. 만든 값을 다 치르고 노출은 0이었다.
 *
 * ⭐ 구글 이미지는 웹 검색과 **다른 자리**다. 474장이 그 자리에 하나도 없다.
 *   그리고 이것은 **계정이 필요 없다** — 유튜브는 로그인이 막고 있지만 이건 우리 글자다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **없는 것을 적지 않는다.** 파일이 실제로 있는 장만 센다.
 * ⛔ **벌이 빈 기사는 아예 안 넣는다.** 빈 상자는 없는 것만 못하다(카드뉴스 없는 기사가 21편 있다).
 * ⛔ 장수를 손으로 적지 않는다 — 세어서 적는다. 손으로 적으면 장이 늘어도 화면이 안 따라온다.
 * ⚠ 이것이 오늘 밤 방문자를 늘리지는 않는다. 구글 이미지 색인이 붙어야 뜬다.
 */
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/**
 * ⭐ 2026-08-24 밤 — **다른 유닛도 그대로 쓰게 인자로 연다.** 3번은 카드뉴스 1,196장을
 *   갖고 있는데 사이트맵에 0장이다(제 474장의 2.5배다). 자를 나만 쓰면 그 값이 안 난다.
 * ```
 * node scripts/build-kcw-cardnews-index.mjs \
 *      --방=public/100y/cardnews --기사방=content/100y --낼길=src/data/100y-cardnews.json
 * ```
 * ⛔ 기본값은 내 것이다. 인자를 안 주면 예전과 똑같이 돈다 — 남의 출력이 안 바뀐다.
 * 🔴 이 함수를 셸을 거쳐 쓰다 백틱이 먹혀 `startsWith()` 로 깨진 적이 있다(같은 날 밤).
 *   그러면 «항상 기본값»이 되어 남이 인자를 줘도 조용히 내 것을 읽는다 — 그래서 자가시험을 박았다.
 */
const 인자 = (이름, 기본) => {
  const 머리 = `--${이름}=`;
  const a = process.argv.find((x) => x.startsWith(머리));
  return a ? a.slice(머리.length) : 기본;
};
const 카드방 = path.join(뿌리, 인자('방', 'public/wikitip/cardnews'));
const 기사방 = path.join(뿌리, 인자('기사방', 'content/kculturewire'));
const 낼길 = path.join(뿌리, 인자('낼길', 'src/data/wikitip-cardnews.json'));

/**
 * 파일 이름을 뜯는다. `<벌>-sq-3.png` · `<벌>-v-1.png`.
 * ⛔ 확장자를 그냥 자르지 않는다 — 벌 이름에 `-sq-` 가 들어갈 수도 있으니 «끝에서» 맞춘다.
 */
export function 이름뜯기(파일) {
  const m = String(파일 ?? '').match(/^(.+)-(sq|v)-(\d+)\.png$/);
  if (!m) return null;
  const 장 = Number(m[3]);
  if (!Number.isFinite(장) || 장 <= 0) return null;
  return { 벌: m[1], 규격: m[2], 장 };
}

/**
 * 벌마다 모은다. ⛔ 장 번호를 «정렬»한다 — 파일 순서가 1,10,2 로 오는 자리가 있다.
 * ⚠ 빠진 번호가 있으면(1,2,4) 그대로 둔다 — 없는 3을 만들어 내지 않는다.
 */
export function 벌로모으기(파일들) {
  const 통 = new Map();
  for (const f of 파일들 ?? []) {
    const r = 이름뜯기(f);
    if (!r) continue;
    if (!통.has(r.벌)) 통.set(r.벌, { set: r.벌, sq: [], v: [] });
    통.get(r.벌)[r.규격].push(r.장);
  }
  for (const v of 통.values()) {
    v.sq.sort((a, b) => a - b);
    v.v.sort((a, b) => a - b);
  }
  return [...통.values()].sort((a, b) => a.set.localeCompare(b.set));
}

/** 이 벌이 화면에 걸 만한가. ⛔ 한 장도 없으면 안 건다 — 빈 상자는 없는 것만 못하다 */
export function 걸만한가(벌) {
  if (!벌) return false;
  return (벌.sq?.length ?? 0) > 0 || (벌.v?.length ?? 0) > 0;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('이름을 뜯는다', JSON.stringify(이름뜯기('a-battle-sq-3.png')) === '{"벌":"a-battle","규격":"sq","장":3}');
  검('세로 규격도 뜯는다', 이름뜯기('x-v-1.png').규격 === 'v');
  /* ⛔ 벌 이름 안에 `-sq-` 가 들어가도 «끝에서» 맞춰야 한다 */
  검('⭐ 벌 이름에 sq 가 들어가도 끝에서 자른다', 이름뜯기('a-sq-team-sq-2.png').벌 === 'a-sq-team');
  검('꼴이 다르면 null', 이름뜯기('foo.png') === null && 이름뜯기('') === null && 이름뜯기(null) === null);
  검('장 번호가 0이면 null', 이름뜯기('x-sq-0.png') === null);

  const g = 벌로모으기(['b-sq-2.png', 'b-sq-10.png', 'b-sq-1.png', 'a-v-1.png', '쓰레기.txt']);
  검('벌로 모은다', g.length === 2);
  검('가나다순으로 준다', g[0].set === 'a');
  /* 🔴 파일 순서가 1,10,2 로 오는 자리가 있다 — 문자열 정렬을 쓰면 10이 2 앞에 온다 */
  검('⭐ 장 번호를 «수»로 정렬한다', g[1].sq.join(',') === '1,2,10');
  검('규격을 갈라 담는다', g[0].v.length === 1 && g[0].sq.length === 0);
  검('빈 것을 넣어도 안 터진다', 벌로모으기(null).length === 0);

  검('한 장이라도 있으면 건다', 걸만한가({ sq: [1], v: [] }) === true);
  /* ⛔ 빈 상자는 없는 것만 못하다 */
  검('⭐ 한 장도 없으면 안 건다', 걸만한가({ sq: [], v: [] }) === false && 걸만한가(null) === false);

  /* 🔴 이 자를 셸을 거쳐 고치다 백틱이 먹혀 `startsWith()` 로 깨진 적이 있다.
     그러면 «항상 기본값»이 되어, 3번이 `--방=` 을 줘도 조용히 내 폴더를 읽는다.
     ⛔ 「인자를 받는다」를 말로만 두면 이런 것이 안 잡힌다 — 검사로 둔다 */
  const 옛인자 = process.argv.slice();
  process.argv.push('--방=남의폴더', '--기사방=남의기사');
  검('⭐ 인자를 실제로 읽는다 — 기본값으로 조용히 떨어지지 않는다',
    인자('방', '내폴더') === '남의폴더' && 인자('기사방', '내기사') === '남의기사');
  검('안 준 인자는 기본값이다', 인자('낼길', '내길') === '내길');
  /* 이름이 겹쳐 보이는 인자를 잘못 집지 않는다 — `--방` 과 `--방향` 은 다르다 */
  process.argv.push('--방향=엉뚱');
  검('⭐ 비슷한 이름을 잘못 집지 않는다', 인자('방', '내폴더') === '남의폴더');
  process.argv.length = 0;
  process.argv.push(...옛인자);

  if (실패.length) {
    console.error(`❌ 자가시험 ${실패.length}건 실패\n` + 실패.map((s) => `   · ${s}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ build-kcw-cardnews-index 자가시험 통과 (17)');
  process.exit(0);
}

if (!existsSync(카드방)) { console.error(`⛔ ${카드방} 이 없다`); process.exit(1); }

const 파일들 = readdirSync(카드방).filter((f) => f.endsWith('.png'));
const 벌들 = 벌로모으기(파일들).filter(걸만한가);

/* 기사와 짝이 맞는 것만 남긴다. ⛔ 기사가 없는 벌을 기사 지면에 걸 수는 없다 */
const 기사 = existsSync(기사방)
  ? new Set(readdirSync(기사방).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)))
  : new Set();
const 짝있는것 = 벌들.filter((v) => 기사.has(v.set));
const 짝없는것 = 벌들.filter((v) => !기사.has(v.set));
const 카드없는기사 = [...기사].filter((x) => !벌들.some((v) => v.set === x)).sort();

const 장수 = 짝있는것.reduce((s, v) => s + v.sq.length + v.v.length, 0);

writeFileSync(낼길, `${JSON.stringify({
  generated: new Date().toISOString(),
  whatThisIs: 'Card-news images that exist as files and belong to an article we publish. '
    + 'Counted from the files themselves, never written by hand.',
  whatThisIsNot: 'This does not mean Google has indexed them. It means they are now findable.',
  base: '/cardnews',
  sets: 짝있는것,
  setCount: 짝있는것.length,
  imageCount: 장수,
  /* ⛔ 못 붙인 것을 조용히 버리지 않는다 — 세어서 남긴다 */
  setsWithoutArticle: 짝없는것.map((v) => v.set),
  articlesWithoutCards: 카드없는기사,
}, null, 2)}\n`);

console.log('■ 기사 카드뉴스 — 파일에서 세어 적었다\n');
console.log(`카드뉴스 벌      ${벌들.length}개 · 그림 ${파일들.length}장`);
console.log(`기사와 짝이 맞는 것 ${짝있는것.length}벌 · 그림 ${장수}장   ← 지면과 사이트맵에 넣을 것`);
if (짝없는것.length) console.log(`⚠ 기사가 없는 벌 ${짝없는것.length}개 — ${짝없는것.map((v) => v.set).slice(0, 5).join(', ')}`);
console.log(`⚠ 카드뉴스가 «없는» 기사 ${카드없는기사.length}편 — 이 기사들은 아무것도 안 그린다`);
if (카드없는기사.length) console.log(`   ${카드없는기사.slice(0, 6).join(', ')}${카드없는기사.length > 6 ? ' …' : ''}`);
console.log(`\n냈다 — ${path.relative(뿌리, 낼길)}`);
console.log('⚠ 이것이 오늘 밤 방문자를 늘리지는 않는다. 구글 이미지 색인이 붙어야 뜬다.');
