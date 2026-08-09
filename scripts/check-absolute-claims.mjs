/**
 * 자 ④ — **재지 않고 쓴 절대 문장이 있는가.** (원인 `unmeasured-sentence`)
 *
 * ── 무엇을 막나 ────────────────────────────────────────────────
 * 2026-08-08. `/exports` 에 「그 지역은 **어느 해에도** 값이 없다」고 적혀 있었다.
 * 재 보니 **2005년에 89.1%** 였다. 손으로 쓴 문장이었고 아무도 자료에 안 대 봤다.
 * 8/6 에도 같은 꼴로 하나 나갔다. 두 번 났으면 꼴이다.
 *
 * ── 어떻게 재나 ────────────────────────────────────────────────
 * 「모든·언제나·한 번도·어느 것도」 같은 **절대 낱말**은 하나만 틀려도 문장이 무너진다.
 * 그래서 자료 지면 본문에서 그것들을 찾아, **면제표에 없는 것이 있으면 선다.**
 * 면제표에는 그 문장을 **무엇이 재는지**를 같이 적는다 — 까닭 없이 못 들어온다.
 *
 * ⛔ 이 자는 문장이 참인지 스스로 못 판단한다. 판단하는 척하지 않는다.
 *    하는 일은 **「이 문장은 재고 썼다」고 사람이 서명하게 만드는 것**이다.
 *    서명 없는 절대 문장이 지면에 못 올라간다 — 그게 8/8 에 없던 칸이다.
 * ⚠ 기사는 안 본다. 기사는 편마다 자기 검사가 붙는다. 여기는 **자료 지면**만이다.
 */
import fs from 'node:fs';
import path from 'node:path';

const D = 'dist/wikitip';
/**
 * ⛔ 목록 지면은 **기사 글머리를 옮겨 담은 것**이라 여기서 재지 않는다.
 *    기사는 편마다 자기 검사가 붙는다 — 여기서 또 재면 같은 문장을 두 자로 재는 것이고,
 *    목록에 안 걸리려고 **기사 글을 무디게 고치게** 된다. 그건 자가 글을 이기는 것이다.
 * ⚠ 첫 화면도 최신 기사 글머리를 싣는다. 같은 까닭으로 뺀다.
 */
const 목록지면 = new Set(['articles.html', 'corrections.html', 'index.html']);

/** 첫 화면은 한 층 위다(빌드 꼴이 file) */
const 첫화면 = 'dist/wikitip.html';

/**
 * ⛔ 처음엔 never·always·nothing 을 통째로 잡았다. **77건이 나왔고 대부분이 좋은 문장이었다** —
 *    「nothing here says why」·「nothing here is a ranking」 은 우리가 일부러 쓰는 **안 하는 말**이다.
 *    그걸 잡으면 자가 사람더러 **면책 문장을 지우라**고 시키는 꼴이 된다. 정반대다.
 *
 * ⭐ 8/8 에 실제로 틀린 문장은 이런 모양이었다 —
 *      「그 지역은 **어느 해에도 값이 없다**」   ← 비어 있다는 **주장**이다. 질의 한 번이면 무너진다
 *    그래서 「없다·전부다」를 **자료에 대고 주장하는 꼴**만 잡는다.
 */
export const 절대말 = [
  /\bno (?:value|entry|entries|rows?|data)\b[^.]{0,40}\bin any year\b/i,
  /\bin any year\b[^.]{0,40}\bno (?:value|entry|entries|rows?|data)\b/i,
  /\bcarries no (?:value|data)\b/i,
  /\bdoes not appear in any\b/i,
  /\bappears in (?:no|none of the) (?:year|years|rows)\b/i,
  /\bin every (?:single )?year\b/i,
  /\bevery year without exception\b/i,
];

/**
 * 면제표 — **이 문장은 무엇이 재는가**를 같이 적는다.
 * `문장` 은 지면에 그대로 있어야 하는 조각이고, `잰다` 는 그것을 받치는 자료·검사다.
 * 문장이 바뀌면 면제가 저절로 풀린다. 그게 이 표의 요점이다.
 */
export const 면제 = [
  { 지면: 'exports.html', 문장: 'Unclassified', 잰다: 'wikitip-music-export.json — 2005년 89.1% 를 지면이 직접 적는다(2026-08-08 정정)' },
  /*
   * ⭐ 정정 알림 자체는 **옛 주장을 인용한 것**이다. 바로 뒤에 잰 값(2005년 89.1%)이 붙어 있다.
   *    이걸 못 쓰게 하면 「우리가 뭘 틀렸는지」를 지면에서 지우게 된다 — 그게 제일 나쁘다.
   * ⚠ 그래서 넓게 면제하지 않고 **「used to say … That was wrong」 꼴**에만 붙인다.
   *    새로 쓴 절대 문장은 이 꼴이 아니라서 그대로 걸린다.
   */
  { 지면: 'exports.html', 문장: 'used to say', 잰다: '정정 알림이다. 같은 문장 안에 잰 값(2005년 89.1%)이 붙어 있고 wikitip-music-export.json 이 그것을 들고 있다' },
  { 지면: 'titles.html', 문장: 'never appeared on it', 잰다: 'wikitip-korea-signal.json · sharedWithoutKorea — 세어서 나온 수다' },
  { 지면: 'data.html', 문장: 'never', 잰다: 'wikitip-korea-signal.json 과 wikitip-kpop-invisible.json 이 각각 세어 둔 값을 지면이 읽는다' },
  { 지면: 'reach.html', 문장: 'never', 잰다: 'wikitip-reach.json — 나라 수를 세어서 낸 값이다' },
  { 지면: 'corrections.html', 문장: 'never', 잰다: 'wikitip-page-corrections.json — 정정 기록 자체가 근거다' },
  { 지면: 'about.html', 문장: 'never', 잰다: '방법론 문장이다. 자료 주장이 아니라 우리가 하는 일에 대한 약속이다' },
  { 지면: 'privacy.html', 문장: 'nothing', 잰다: '우리가 안 하는 것에 대한 약속이다. 자료 주장이 아니다' },
  { 지면: 'terms.html', 문장: 'Nothing here removes', 잰다: '법 문장이다. 자료 주장이 아니다' },
  { 지면: 'refund.html', 문장: 'Nothing here removes', 잰다: '법 문장이다. 자료 주장이 아니다' },
  { 지면: 'staying-power.html', 문장: 'never', 잰다: 'wikitip-staying-power.json — 주수 분포를 세어서 낸다' },
  { 지면: 'esports.html', 문장: 'never', 잰다: '라이엇이 안 주는 것에 대한 문장이다. 우리 자료 주장이 아니다' },
  { 지면: 'ladder-churn.html', 문장: 'never', 잰다: 'wikitip-ladder-churn.json · privacy — 안 담는다는 약속이다' },
  /*
   * ⭐ 이건 **재고 쓴** 절대 문장이다. 「어느 해나 몇 배」를 말하려면 가장 낮은 해를 알아야 하고,
   *   수집기가 그것을 세어 둔다(topThreeMin · topThreeMinYear). 지면이 같은 문단에서 그 수를 적는다.
   * ⛔ 문장이 바뀌면 면제가 저절로 풀린다 — 그게 이 표의 요점이다.
   */
  { 지면: 'leverage.html', 문장: 'in every year on this table', 잰다: 'wikitip-leverage.json · topThreeMin/topThreeMinYear — 여섯 해 중 가장 낮은 값(6.31×·2021)을 세어 같은 문단에 적는다' },
];

/** 화면에 보이는 글만. 붙은 낱말이 생기지 않게 빈칸으로 바꾼다 */
export function 본문(html) {
  /* ⛔ 관련기사 칸은 **기사 글머리를 옮겨 담은 것**이다. 여기서 또 재면 같은 문장을 두 자로 재고,
     목록에 안 걸리려고 기사 글을 무디게 고치게 된다. 자가 글을 이기면 안 된다. */
  return html
    .replace(/<section class="kcw-rel"[\s\S]*?<\/section>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ');
}

/** 그 지면에서 면제된 조각인가 */
export function 면제됐나(지면, 문장) {
  return 면제.some((e) => e.지면 === 지면 && 문장.includes(e.문장));
}

if (process.argv[1] && process.argv[1].endsWith('check-absolute-claims.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('절대말을 찾는다', 절대말.some((r) => r.test('carries no value in any year')));
  자가('보통 문장은 안 걸린다', !절대말.some((r) => r.test('45.1% charted in all six countries')));
  자가('태그를 빈칸으로', 본문('<b>2</b><i>번</i>').includes(' '));
  자가('면제표가 지면을 가린다', 면제됐나('exports.html', 'the Unclassified region') && !면제됐나('titles.html', 'the Unclassified region'));
  자가('면제마다 재는 것이 적혀 있다', 면제.every((e) => e.잰다 && e.잰다.length > 10));
  console.log(`절대 문장 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(D)) { console.error(`⛔ ${D} 가 없다 — node scripts/build-once.mjs 를 먼저 돌린다`); process.exit(1); }
  const 볼것 = fs.readdirSync(D).filter((f) => f.endsWith('.html') && f !== '404.html' && !목록지면.has(f))
    .map((f) => [f, path.join(D, f)]);


  const 걸린것 = [];
  for (const [이름, p] of 볼것) {
    const t = 본문(fs.readFileSync(p, 'utf8'));
    for (const re of 절대말) {
      const g = new RegExp(re.source, `${re.flags.replace('g', '')}g`);
      for (const m of t.matchAll(g)) {
        const 둘레 = t.slice(Math.max(0, m.index - 70), m.index + 70).trim();
        if (면제됐나(이름, 둘레)) continue;
        걸린것.push({ 이름, 말: m[0], 둘레 });
      }
    }
  }

  console.log(`잰 것 — 자료 지면 ${볼것.length}장 · 면제표 ${면제.length}줄`);
  if (걸린것.length) {
    console.log(`\n⛔ 재고 썼다는 서명이 없는 절대 문장 ${걸린것.length}건`);
    for (const x of 걸린것.slice(0, 8)) console.log(`   · ${x.이름} «${x.말}» — …${x.둘레}…`);
    console.log('\n🔴 자료를 재서 그 수를 지면에 적든지, 면제표에 **무엇이 재는지**를 적는다.');
    console.log('   ⛔ 「아마 맞을 것이다」로 두지 않는다. 8/8 에 그렇게 두었다가 89.1% 를 못 봤다.');
    process.exit(1);
  }
  console.log('✅ 절대 문장이 전부 서명돼 있다 — 재지 않고 쓴 것 0건');
}
