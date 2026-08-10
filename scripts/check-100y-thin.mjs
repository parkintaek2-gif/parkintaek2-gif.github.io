#!/usr/bin/env node
/**
 * 📏 **얇은 지면 자** — 손님이 실제로 읽는 것이 얼마나 되나.
 *
 * ## 🔴 왜 (2026-08-10 13:2x · 2번 지시)
 *
 *   *「사장님이 **심사 들어갔다** 하셨습니다 — 애드센스 심사가 돌고 있습니다.
 *     얇은 지면은 심사에서 가장 흔한 탈락 사유입니다. 백년지도가 4,966장으로 제일 크니
 *     **여기서 걸리면 회사 넷이 다 걸립니다**」*
 *
 *   ⛔ 눈으로 세지 않는다. 4,966장은 눈으로 못 본다. **자를 코드로 만든다**(2번 지시).
 *
 * ## 🔴 자를 무엇으로 정했나 — **본문 글자 수와 숫자 개수, 둘 다**
 *
 *   ```
 *   ⛔ 지면 전체 글자      메뉴·꼬리말·출처 안내가 다 들어간다.
 *                          그러면 **빈 장도 1,500자**로 나온다 — 실제로 그렇게 나왔다
 *   ✅ 본문 글자           `</nav>` 다음부터 `<footer` 앞까지.
 *                          이 사이가 지면이 스스로 쓴 것이다(레이아웃이 `<slot/>` 을 거기 둔다)
 *   ✅ 숫자 개수           우리가 파는 것은 글이 아니라 **숫자**다.
 *                          글자만 재면 「말은 많은데 잰 것이 없는 장」을 못 잡는다
 *   ```
 *   ⚠ 숫자를 셀 때 **주소 안의 숫자와 style 값을 뺀다** — `left:81%` 나 `/school/7010057` 은
 *     손님이 읽는 수가 아니다. 안 빼면 얇은 장이 두꺼워 보인다.
 *
 * ## ⚠ 이 자가 못 하는 것
 *
 *   ```
 *   ⛔ **좋은 지면인지는 못 잰다.** 글자가 많아도 알맹이가 없을 수 있다
 *   ⛔ 심사가 무엇을 볼지는 모른다. 이 자는 **우리 기준**이지 그쪽 기준이 아니다
 *   ⚠ 첫 화면은 `dist/100y.html` 로 **폴더 밖에 있다.** 오늘만 두 번 이걸로 틀렸다
 *   ```
 *
 * ```bash
 * node scripts/check-100y-thin.mjs --자가시험
 * node scripts/check-100y-thin.mjs              # 전수
 * node scripts/check-100y-thin.mjs --글자 700   # 문턱을 바꿔서
 * ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 빌드 = path.join(뿌리, 'dist', '100y');

/** 문턱 — ⚠ 값을 지면마다 적지 않는다. 여기 한 곳이다 */
export const 기본문턱 = { 글자: 700, 숫자: 8 };

/**
 * 본문만 남긴다 — `</nav>` 다음부터 `<footer` 앞까지.
 * ⚠ 그 표가 없으면 **통째로 돌려준다.** 조용히 0 을 내지 않는다.
 */
export function 본문만(html) {
  const s = String(html);
  const a = s.indexOf('</nav>');
  const b = s.lastIndexOf('<footer');
  if (a < 0 || b < 0 || b <= a) return { 글: s, 잘랐나: false };
  return { 글: s.slice(a + 6, b), 잘랐나: true };
}

/** 글자만 남긴다 — 태그·주석·스크립트를 걷어낸다 */
export function 글자만(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 손님이 읽는 숫자를 센다.
 * ⛔ 주소 안의 숫자와 style 값은 **손님이 읽는 수가 아니다.** 먼저 지운다.
 */
export function 숫자세기(글) {
  const 지운것 = String(글)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\/[\w%-]*\d[\w%-]*/g, ' ');
  return (지운것.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).length;
}

/** 한 지면을 잰다 */
export function 한장재기(html) {
  const { 글: 속, 잘랐나 } = 본문만(html);
  const 글 = 글자만(속);
  return { 글자: 글.length, 숫자: 숫자세기(글), 껍데기뺐나: 잘랐나 };
}

/* ── 자가시험 ────────────────────────────────────────────────── */
function 자가시험() {
  const 결과 = [];
  const 잰다 = (이름, 참) => {
    결과.push(!!참);
    console.log(`  ${참 ? '✅' : '🔴'} ${이름}`);
  };

  const 본 = '<html><nav class="nav"><a>메뉴</a></nav><h1>제목</h1><p>본문 열두 글자다</p><footer>꼬리말이 아주 길다</footer></html>';
  const r = 한장재기(본);
  잰다('① 껍데기를 뗀다', r.껍데기뺐나 === true);
  잰다('② 꼬리말을 안 센다', !글자만(본문만(본).글).includes('꼬리말'));
  잰다('③ 메뉴를 안 센다', !글자만(본문만(본).글).includes('메뉴'));
  잰다('④ 본문은 센다', 글자만(본문만(본).글).includes('본문 열두 글자다'));

  잰다('⑤ 표가 없으면 통째로 돌려준다', 본문만('<p>가</p>').잘랐나 === false);
  잰다('⑥ 그때도 0 을 내지 않는다', 한장재기('<p>가나다</p>').글자 === 3);

  잰다('⑦ 숫자를 센다', 숫자세기('진학률 63.6% 졸업자 247명') === 2);
  잰다('⑧ 주소 안의 숫자는 안 센다', 숫자세기('/school/7010057 을 보라') === 0);
  잰다('⑨ 남의 집 주소도 안 센다', 숫자세기('https://a.b/1234 를 보라') === 0);
  잰다('⑩ 쉼표 든 수를 하나로 센다', 숫자세기('1,571,356명') === 1);
  잰다('⑪ 소수를 하나로 센다', 숫자세기('22.4명') === 1);
  잰다('⑫ 없으면 0', 숫자세기('숫자가 없다') === 0);

  잰다('⑬ 스크립트를 안 센다', !글자만('<script>var 가나다=1</script><p>나</p>').includes('가나다'));
  잰다('⑭ 주석을 안 센다', !글자만('<!-- 숨은 글 --><p>나</p>').includes('숨은'));
  잰다('⑮ 문턱이 한 곳에 있다', 기본문턱.글자 > 0 && 기본문턱.숫자 > 0);

  const 진 = 결과.filter((x) => !x).length;
  console.log(`\n자가시험 ${결과.length - 진}/${결과.length}`);
  return 진 === 0;
}

/* ── 전수 ────────────────────────────────────────────────────── */
function 지면모으기() {
  const 것들 = [];
  const 걷기 = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) 걷기(p);
      else if (f.name.endsWith('.html')) 것들.push(p);
    }
  };
  걷기(빌드);
  /* 🔴 첫 화면은 `dist/100y.html` — **폴더 밖이다.** 오늘만 두 번 이걸로 틀렸다 */
  const 첫화면 = path.join(뿌리, 'dist', '100y.html');
  if (fs.existsSync(첫화면)) 것들.push(첫화면);
  return 것들;
}

function 전수(문턱) {
  const 것들 = 지면모으기();
  if (!것들.length) {
    console.log('⬜ 못 쟀다 — 빌드본이 없다. `node scripts/build-once.mjs` 먼저');
    return false;
  }
  const 잰것 = [];
  let 껍데기못뗀장 = 0;
  for (const p of 것들) {
    const r = 한장재기(fs.readFileSync(p, 'utf8'));
    if (!r.껍데기뺐나) 껍데기못뗀장 += 1;
    잰것.push({ 길: path.relative(path.join(뿌리, 'dist'), p), ...r });
  }
  잰것.sort((a, b) => a.글자 - b.글자);

  const 얇은 = 잰것.filter((x) => x.글자 < 문턱.글자 || x.숫자 < 문턱.숫자);
  const 갈래 = (길) => {
    const 조각 = 길.split(path.sep);
    return 조각.length > 2 ? 조각[1] : (조각[1] ?? '').replace(/\.html$/, '') || '(첫 화면)';
  };
  const 갈래별 = new Map();
  for (const x of 얇은) 갈래별.set(갈래(x.길), (갈래별.get(갈래(x.길)) ?? 0) + 1);

  console.log(`\n📏 얇은 지면 자 — 지면 ${것들.length.toLocaleString()}장`);
  console.log(`   자: 본문 글자 < ${문턱.글자} **또는** 손님이 읽는 숫자 < ${문턱.숫자}\n`);
  console.log(`   🔴 얇은 장 ${얇은.length.toLocaleString()}장 (${((100 * 얇은.length) / 것들.length).toFixed(1)}%)`);
  if (껍데기못뗀장) console.log(`   ⚠ 껍데기를 못 뗀 장 ${껍데기못뗀장}장 — 그 장은 값이 부풀어 있다`);

  console.log('\n   갈래별 —');
  for (const [g, n] of [...갈래별.entries()].sort((a, b) => b[1] - a[1])) {
    const 전체 = 잰것.filter((x) => 갈래(x.길) === g).length;
    console.log(`     ${g.padEnd(16)} ${String(n).padStart(5)} / ${String(전체).padStart(5)}`);
  }

  console.log('\n   제일 얇은 열 장 —');
  for (const x of 잰것.slice(0, 10)) {
    console.log(`     글자 ${String(x.글자).padStart(5)} · 숫자 ${String(x.숫자).padStart(3)}   ${decodeURIComponent(x.길)}`);
  }

  const 가운데 = 잰것[Math.floor(잰것.length / 2)];
  console.log(`\n   가운데 장 — 글자 ${가운데.글자} · 숫자 ${가운데.숫자}`);
  return 얇은.length === 0;
}

/* ── 들머리 ──────────────────────────────────────────────────── */
const 인자 = process.argv.slice(2);
const 문턱 = {
  글자: 인자.includes('--글자') ? Number(인자[인자.indexOf('--글자') + 1]) : 기본문턱.글자,
  숫자: 인자.includes('--숫자') ? Number(인자[인자.indexOf('--숫자') + 1]) : 기본문턱.숫자,
};
const 좋나 = 인자.includes('--자가시험') ? 자가시험() : (자가시험() && 전수(문턱));
process.exitCode = 좋나 ? 0 : 1;
