#!/usr/bin/env node
/**
 * **다음 걸음이 얼마나 아래에 있나** — 지면마다 «첫 안쪽 링크»의 자리를 잰다.
 *
 * ── 🔴 왜 만드나 (2026-08-27 21:3x · 5번) ──────────────────────────
 * 오늘 22:00 실측에서 K Culture Wire 의 **걸음이 1.24** 였다(읽은 흔적 있는 세션도 1.73).
 * 사람이 한 장 보고 나간다는 뜻이고, 체류시간은 곧 걸음이다.
 *
 * 8/26 에 「막다른 지면」을 의심해 재 봤을 때는 **갈래가 16~215개**로 넉넉했다.
 * 즉 «문이 없는 것»이 아니다. 그러면 남는 의심은 하나다 —
 *   **문이 너무 아래에 있어서 안 보이는 것 아닌가.**
 *
 * 평균 체류가 35초다. 35초에 사람은 지면 밑바닥까지 안 내려간다.
 * 「다음 걸음」 칸이 맨 아래에만 있으면, 있어도 없는 것과 같다.
 *
 * ── 무엇을 재나 ──────────────────────────────────────────────
 * 본문 글자 안에서 **첫 안쪽 링크가 몇 % 지점에 있나**를 잰다.
 *   0~15%   ⭐ 첫 화면에서 보인다
 *   15~40%  ⚠ 한 번 굴려야 보인다
 *   40%+    🔴 밑바닥이다 — 35초 손님은 못 본다
 *
 * ⛔ 「링크가 몇 개인가」는 이미 다른 자가 잰다. 이 자는 **자리**만 본다.
 * ⛔ 머리글·꼬리말의 붙박이 링크는 빼고 «본문»만 본다 — 그것들은 어느 지면에나 있어
 *   재는 뜻이 없고, 넣으면 모든 지면이 0% 로 나와 자가 죽는다.
 *
 * 쓰는 법:
 *   node scripts/check-first-onward-link.mjs
 *   node scripts/check-first-onward-link.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 지면방 = path.join(뿌리, 'dist/wikitip');

/* ── 재는 규칙 (순수 함수) ───────────────────────────────── */

/**
 * 본문만 남긴다 — 머리글·꼬리말·스크립트·스타일을 뺀다.
 * ⚠ 못 가르면 null 을 준다. **0% 로 채우지 않는다** — 그것이 거짓 안심이 된다.
 */
export function 본문만(html) {
  const s = String(html ?? '');
  if (!s) return null;
  let 몸 = s;
  const b = 몸.indexOf('<body');
  if (b >= 0) 몸 = 몸.slice(몸.indexOf('>', b) + 1);
  몸 = 몸.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');
  return 몸.length ? 몸 : null;
}

/**
 * 첫 «안쪽» 링크가 본문의 몇 % 지점에 있나.
 * @returns {number|null} 0~100, 안쪽 링크가 없으면 null
 * ⛔ 바깥 링크(http로 시작)는 다음 걸음이 아니다 — 우리 밖으로 나가는 문이다.
 * ⛔ 닻(#)만 있는 것도 다음 걸음이 아니다.
 */
export function 첫문자리(본문) {
  const s = String(본문 ?? '');
  if (!s.length) return null;
  const 자 = /href="(\/[^"#][^"]*)"/g;
  const m = 자.exec(s);
  if (!m) return null;
  return Math.round((m.index / s.length) * 1000) / 10;
}

/** 자리 → 사람 말 */
export function 갈래이름(몫) {
  if (몫 === null ||몫 === undefined) return '문없음';
  if (몫 <= 15) return '첫화면';
  if (몫 <= 40) return '한번굴려';
  return '밑바닥';
}

/* ── 실제로 재기 ─────────────────────────────────────────── */

function 지면들(d) {
  const 모음 = [];
  if (!fs.existsSync(d)) return 모음;
  (function 걷기(방) {
    for (const e of fs.readdirSync(방, { withFileTypes: true })) {
      const p = path.join(방, e.name);
      if (e.isDirectory()) 걷기(p);
      else if (e.name.endsWith('.html')) 모음.push(p);
    }
  })(d);
  return 모음;
}

function 화면() {
  const 파일 = 지면들(지면방);
  console.log('# 다음 걸음이 얼마나 아래에 있나');
  if (!파일.length) {
    console.log(`  ⚠ 잰 지면이 «0장» 이다 — ${path.relative(뿌리, 지면방)} 이 없다.`);
    console.log('     ⛔ 「못 쟀다」는 「통과」가 아니다. 먼저 빌드하십시오.');
    return { 못잼: true };
  }
  const 갈래 = (u) => { const m = u.match(/^\/([^/]+)\//); return m ? `/${m[1]}` : '(홑장)'; };
  const 셈 = {};
  let 못읽음 = 0;
  for (const f of 파일) {
    const u = `/${path.relative(지면방, f).split(path.sep).join('/')}`
      .replace(/\.html$/, '').replace(/\/index$/, '') || '/';
    const 본 = 본문만(fs.readFileSync(f, 'utf8'));
    if (본 === null) { 못읽음 += 1; continue; }
    const 몫 = 첫문자리(본);
    const k = 갈래(u);
    (셈[k] ??= { 장: 0, 첫화면: 0, 한번굴려: 0, 밑바닥: 0, 문없음: 0, 합: 0, 잰장: 0 });
    셈[k].장 += 1;
    셈[k][갈래이름(몫)] += 1;
    if (몫 !== null) { 셈[k].합 += 몫; 셈[k].잰장 += 1; }
  }
  console.log(`  지면 ${파일.length.toLocaleString('en-US')}장${못읽음 ? ` · ⚠ 본문을 «못 읽은» 것 ${못읽음}장` : ''}\n`);
  console.log('갈래'.padEnd(16) + '장'.padStart(6) + '첫화면'.padStart(8) + '한번굴려'.padStart(9) + '밑바닥'.padStart(8) + '문없음'.padStart(8) + '평균자리'.padStart(9));
  const 줄 = Object.entries(셈).filter(([, v]) => v.장 >= 5)
    .sort((a, b) => (b[1].밑바닥 + b[1].문없음) - (a[1].밑바닥 + a[1].문없음));
  for (const [k, v] of 줄) {
    const 평균 = v.잰장 ? `${(v.합 / v.잰장).toFixed(1)}%` : '못잼';
    const 표 = v.문없음 ? ' 🔴 문이 아예 없는 지면' : (v.밑바닥 > v.장 * 0.5 ? ' ⚠ 절반 넘게 밑바닥' : '');
    console.log(k.padEnd(16) + String(v.장).padStart(6) + String(v.첫화면).padStart(8)
      + String(v.한번굴려).padStart(9) + String(v.밑바닥).padStart(8) + String(v.문없음).padStart(8)
      + 평균.padStart(9) + 표);
  }
  console.log('\n⭐ 첫화면 0~15% · 한번굴려 15~40% · 밑바닥 40% 넘음');
  console.log('⚠ 이 자는 «자리»만 잰다. 실제로 눌리는지는 못 잰다 — 「닿는 것」과 「걷는 것」은 다른 말이다.');
  console.log('⛔ 자리를 올렸다고 걸음이 늘었다고 적지 않는다. 늘었는지는 GA4 의 걸음 수로 다시 잰다.');
  return { 못잼: false };
}

/* ── 자가시험 ─────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 조건) => { if (조건) { 통과++; console.log(`  ✅ ${이름}`); } else { 실패++; console.log(`  ⛔ ${이름}`); } };

  검('머리글을 뺀다', !본문만('<body><header><a href="/x">h</a></header><p>본문</p></body>').includes('/x'));
  검('꼬리말을 뺀다', !본문만('<body><p>본문</p><footer><a href="/y">f</a></footer></body>').includes('/y'));
  검('nav 를 뺀다', !본문만('<body><nav><a href="/n">n</a></nav><p>본문</p></body>').includes('/n'));
  검('스크립트를 뺀다', !본문만('<body><script>var a="/s"</script><p>본문</p></body>').includes('/s'));
  검('빈 입력이면 null — 0 으로 안 채운다', 본문만('') === null && 본문만(null) === null);

  검('🔴 첫 링크 자리를 % 로 준다', 첫문자리(`${'a'.repeat(50)}<a href="/x">x</a>${'a'.repeat(50)}`) > 40);
  검('앞쪽 링크는 작은 %', 첫문자리(`<a href="/x">x</a>${'a'.repeat(200)}`) < 5);
  검('⛔ 바깥 링크는 다음 걸음이 아니다', 첫문자리('<a href="https://x.com">x</a>') === null);
  검('⛔ 닻(#)은 다음 걸음이 아니다', 첫문자리('<a href="#top">t</a>') === null);
  검('안쪽 링크가 없으면 null', 첫문자리('<p>글만 있다</p>') === null);
  검('빈 입력이어도 안 죽는다', 첫문자리('') === null && 첫문자리() === null);

  검('0~15%는 첫화면', 갈래이름(10) === '첫화면');
  검('15~40%는 한번굴려', 갈래이름(30) === '한번굴려');
  검('40% 넘으면 밑바닥', 갈래이름(70) === '밑바닥');
  검('null 은 문없음', 갈래이름(null) === '문없음');

  console.log(`\n자가시험 ${통과 + 실패}개 · 실패 ${실패}개`);
  return 실패;
}

const 이파일직접 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (이파일직접) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
  else { const r = 화면(); process.exit(r.못잼 ? 1 : 0); }
}
