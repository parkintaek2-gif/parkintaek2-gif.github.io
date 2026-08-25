#!/usr/bin/env node
/**
 * **영어 손님 화면에 한국어가 보이나** — 손님으로 걸어서 찾은 것을 자로 만든다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   2번 지시로 K Culture Wire 를 손님으로 걸었다(2026-08-10 03:0x). 두 곳이 한국어였다.
 *     ① 꼬리의 이웃 사이트 문 — 「백년지도 — 대학 다음까지 보는 진로 지도」
 *     ② 날짜 — 「Updated 2026. 8. 9. **오전** 8:40:57 KST」
 *   ⛔ 사장님이 정하신 5번의 손님은 **영어권**이다. 그 화면에 한국어가 있으면 거기서 끝난다.
 *   ⚠ 눈으로 한 번 찾은 것은 **다음에 또 생긴다.** 그래서 자로 만든다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ **보이는 글자만** 본다. 주석·script·style 은 뺀다 — 소스 주석은 한국어라야 맞다.
 * ⛔ 작품 제목은 한국어일 수 있다(예: 넷플릭스가 한글 제목을 싣는 경우).
 *    그래서 **면제표**를 두고 무엇이 왜 면제인지 적는다. 까닭 없이 못 들어온다.
 * ⚠ 라틴이 아닌 글자를 다 막지 않는다. **한글만** 본다 — 우리가 실수하는 자리가 거기다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 지음방 = 'dist/wikitip';

/**
 * 면제 — **무엇이 왜 한국어라도 되는가**를 같이 적는다.
 * `지면` 은 파일 이름 조각, `글월` 은 그 지면에 그대로 있어야 하는 한국어 조각이다.
 * ⚠ 글월이 바뀌면 면제가 저절로 풀린다. 그게 이 표의 요점이다.
 */
export const 면제 = [
  /* 넷플릭스 원자료가 한글 제목을 싣는 작품들. ⛔ 우리가 지은 것이 아니라 **원자료의 이름**이다 */
  { 지면: 'title/', 글월: null, 잰다: '작품 지면의 제목은 넷플릭스가 실은 그대로다. 우리가 번역하면 그건 우리 말이 된다' },
  { 지면: 'titles.html', 글월: null, 잰다: '작품 목록도 같은 까닭 — 원자료의 제목을 그대로 싣는다' },
];

/** 보이는 글자만. ⛔ script·style·주석을 뺀다 */
export function 본문(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * **괄호와 낫표 안은 비운다** — 거기 든 한국어는 *출처의 제 이름*이다.
 *
 * ⭐ 우리는 출처를 이름으로 밝힌다. 확인하려는 독자에게는
 *   `Korea Creative Content Agency (한국콘텐츠진흥원)` 의 괄호 안이 **필요한 것**이다.
 *   영어 이름 옆에 원어를 적는 것은 흠이 아니라 우리가 파는 것(믿을 수 있음)의 일부다.
 * ⛔ 그래서 지면을 통째로 면제하지 않는다. **규칙을 좁게** 둔다 —
 *   괄호·낫표 **밖**의 한국어만 잡는다. 「출처:」 같은 라벨과 새어 나온 메모가 거기 걸린다.
 * ⚠ 대신 괄호 안에 숨겨 놓으면 이 자가 못 잡는다. 그 한계를 여기 적어 둔다.
 */
export function 괄호비우기(글) {
  return String(글)
    .replace(/\([^()]*\)/g, ' ')
    .replace(/「[^」]*」/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ');
}

/** 한글이 든 조각들. 앞뒤 글자를 조금 붙여 어디인지 보이게 한다 */
export function 한글조각(글, 둘레 = 24) {
  const 원 = String(글);
  const 판 = 괄호비우기(원);
  const 나온것 = [];
  const 자 = /[가-힣]+/g;
  let m;
  while ((m = 자.exec(판)) !== null) {
    const 앞 = Math.max(0, m.index - 둘레);
    /* ⛔ 둘레는 **원문**에서 뜬다 — 비운 판에서 뜨면 빈칸만 보인다 */
    나온것.push({ 낱말: m[0], 둘레: 원.slice(앞, m.index + m[0].length + 둘레) });
  }
  return 나온것;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('본문 — 표를 뗀다', 본문('<p>a <b>b</b></p>'), 'a b');
  /* ⛔ 소스 주석은 한국어라야 맞다. 자가 그걸 잡으면 못 쓴다 */
  재본다('본문 — 주석을 뺀다', 본문('<p>a</p><!-- 한국어 주석 -->'), 'a');
  재본다('본문 — script 를 뺀다', 본문('<script>var x="한국어"</script>b'), 'b');
  재본다('한글을 찾는다', 한글조각('Updated 오전 8:40').map((x) => x.낱말), ['오전']);
  재본다('한글이 없으면 빈 것', 한글조각('Updated 2026-08-09'), []);
  /* ⛔ 이어진 한글은 한 덩어리로 — 낱자마다 세면 셈이 부풀어 어디가 문제인지 안 보인다 */
  재본다('이어진 한글은 하나로', 한글조각('백년지도 지도').map((x) => x.낱말), ['백년지도', '지도']);
  /* ⭐ 출처의 제 이름은 잡지 않는다 — 영어 이름 옆 괄호 안이다 */
  재본다('괄호 안 출처 이름은 안 잡는다',
    한글조각('Korea Creative Content Agency (한국콘텐츠진흥원) survey'), []);
  재본다('낫표 안도 안 잡는다', 한글조각('the Content Industry Survey 「콘텐츠산업조사」'), []);
  /* ⛔ 괄호 밖의 한국어는 잡는다 — 라벨과 새어 나온 메모가 거기 있다 */
  재본다('괄호 밖은 잡는다', 한글조각('출처: KOSIS (국가데이터처)').map((x) => x.낱말), ['출처']);
  재본다('둘레는 원문에서 뜬다',
    한글조각('출처: KOSIS (국가데이터처)')[0].둘레.includes('KOSIS'), true);
  재본다('면제표에 까닭이 다 있다', 면제.every((x) => x.잰다 && x.잰다.length > 10), true);
  console.log(`영어 지면 검사 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(지음방)) {
    console.log('⬜ dist 가 없다 — `node scripts/build-once.mjs` 뒤에 다시 부른다.');
    process.exit(0);
  }
  const 파일들 = [];
  const 걷는다 = (방, 앞 = '') => {
    for (const e of fs.readdirSync(`${지음방}/${방}`, { withFileTypes: true })) {
      const 안 = 앞 ? `${앞}/${e.name}` : e.name;
      if (e.isDirectory()) 걷는다(`${방}/${e.name}`, 안);
      else if (e.name.endsWith('.html')) 파일들.push(안);
    }
  };
  걷는다('.');
  /* ⛔ 첫 화면은 `dist/wikitip.html`(한 칸 위)에 있다 — build format:file 이라 그렇다 */
  const 첫화면 = `${지음방}.html`;
  const 볼것 = 파일들.map((f) => ({ 이름: f, 길: `${지음방}/${f}` }));
  if (fs.existsSync(첫화면)) 볼것.push({ 이름: '(첫 화면)', 길: 첫화면 });

  if (!볼것.length) {
    console.log('⬜ dist 가 비었다 — 다른 창이 빌드 중일 수 있다. 다시 짓고 부른다.');
    process.exit(0);
  }

  const 면제된다 = (이름) => 면제.find((x) => 이름.includes(x.지면));
  const 걸린것 = [];
  let 면제된장 = 0;
  /*
   * 🔴 2026-08-25 — 이 자리에서 **검사가 통째로 죽었다.**
   *   `dist/wikitip/market/spain.html` 이 없다고 `ENOENT` 를 던지고 멈췄다. 까닭은 결함이
   *   아니라 **다른 창이 같은 `dist` 를 다시 짓는 중**이었던 것뿐이다(저장소를 여섯이 나눠 쓴다).
   * ⛔ 그런데 그 한 장 때문에 **나머지 2,035장을 한 장도 못 쟀다.** 첫 실패에서 멈추는 검사는
   *   앞쪽에 못 잰 것이 하나 생기면 뒤의 검사 전체를 침묵시킨다.
   * ⭐ 「못 쟀다」와 「깨졌다」를 **갈라 적는다.** 못 잰 것은 세고, 검사는 끝까지 돈다.
   */
  const 못잰것 = [];
  for (const v of 볼것) {
    if (면제된다(v.이름)) { 면제된장 += 1; continue; }
    let 글;
    try { 글 = fs.readFileSync(v.길, 'utf8'); }
    catch (e) { 못잰것.push({ 이름: v.이름, 까닭: e.code || String(e) }); continue; }
    const 조각 = 한글조각(본문(글));
    if (조각.length) 걸린것.push({ 이름: v.이름, 조각 });
  }
  if (못잰것.length) {
    console.log(`⬜ 못 잰 지면 ${못잰것.length}장 — 읽는 사이에 사라졌다. 다른 창이 다시 짓는 중일 수 있다`);
    for (const x of 못잰것.slice(0, 5)) console.log(`   ${x.이름} (${x.까닭})`);
    console.log("   ⛔ 이 수를 «0장 걸림»으로 읽지 않는다 — 재지 못한 것이다");
  }

  console.log(`영어 지면 검사 — 본 것 ${볼것.length - 면제된장}장 (면제 ${면제된장}장 · 면제표 ${면제.length}줄)`);
  if (걸린것.length) {
    console.error(`\n⛔ 영어 손님 화면에 한국어가 있다 — ${걸린것.length}장`);
    for (const x of 걸린것.slice(0, 12)) {
      console.error(`   ${x.이름}`);
      for (const c of x.조각.slice(0, 3)) console.error(`      「${c.낱말}」  …${c.둘레}…`);
    }
    if (걸린것.length > 12) console.error(`   … 그리고 ${걸린것.length - 12}장 더`);
    console.error('\n🔴 5번의 손님은 **영어권**이다. 화면에 한국어가 있으면 거기서 끝난다.');
    console.error('   지면에서 빼든지, 면제표에 **무엇이 왜 한국어라야 하는지**를 적는다.');
    process.exit(1);
  }
  console.log('✅ 영어 손님 화면에 한국어가 없다');
}
