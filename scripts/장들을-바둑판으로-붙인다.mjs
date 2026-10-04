#!/usr/bin/env node
/**
 * 장들을-바둑판으로-붙인다.mjs — **낱장 그림 수백 개를 몇 장으로 붙여 «전부» 본다.**
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 · 5번) ─────────────────────────────────
 * 사장님 지침(2026-10-01) — 「**보낼 파일 그 자체를 열어 전부 본다. 몇 장이 아니라 전부**」.
 * 그런데 강의 PPT 는 218장이다. 한 장씩 열면 끝이 안 난다. 그래서 그동안
 * **몇 장만 보고 보냈고**, 그것이 바로 사장님이 막으신 짓이다.
 *
 * ⭐ 「전부 본다」와 「한 장씩 본다」는 같은 말이 아니다. **한 눈에 여러 장을 놓으면**
 *   218장도 열 장 안에 다 들어온다. 글자가 작아 못 읽는 것은 못 읽는 대로 —
 *   이 걸음이 잡는 것은 «빈 장·깨진 칸·넘친 글자·뒤집힌 짜임»이고 그것들은
 *   작아도 보인다. 읽어야 하는 것은 그다음에 그 장만 크게 다시 본다.
 *
 * ⛔ 이 자는 흠을 «판정하지 않는다». 사람이 보라고 붙여 줄 뿐이다.
 * ⛔ 낱장이 없으면 만들지 않는다 — 먼저 `슬라이드를-그림으로-본다.mjs` 로 뽑는다.
 *
 * 쓰는 법
 *   node scripts/장들을-바둑판으로-붙인다.mjs tmp/보낼것-ppt tmp/바둑판
 *   node scripts/장들을-바둑판으로-붙인다.mjs <낱장폴더> <낼폴더> [가로] [세로]
 *   node scripts/장들을-바둑판으로-붙인다.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 기본가로 = 5;
export const 기본세로 = 5;
export const 한칸폭 = 420;              /* 16:9 한 칸 — 작아도 짜임은 보인다 */

/** 낱장 이름에서 번호를 집는다. ⛔ 못 집으면 null — 차례가 어긋나면 보는 뜻이 없다 */
export function 번호(이름) {
  const m = /(\d+)\s*\.png$/i.exec(String(이름 ?? ''));
  return m ? Number(m[1]) : null;
}

/** 폴더의 낱장을 번호 차례로. ⛔ 번호 없는 것은 뺀다 */
export function 낱장들(목록) {
  return (목록 ?? [])
    .map((f) => ({ f, n: 번호(f) }))
    .filter((x) => x.n !== null)
    .sort((a, b) => a.n - b.n);
}

/** 몇 장으로 붙나. ⛔ 0 으로 나누지 않는다 */
export function 판수(낱장수, 가로 = 기본가로, 세로 = 기본세로) {
  const 한판 = Math.max(1, 가로) * Math.max(1, 세로);
  return Math.ceil(Math.max(0, 낱장수) / 한판);
}

/** 한 판의 HTML. ⭐ 번호를 같이 찍는다 — 흠을 본 뒤 그 장을 크게 다시 보려면 번호가 있어야 한다 */
export function 판HTML(조각들, { 가로 = 기본가로, 칸폭 = 한칸폭, 제목 = '' } = {}) {
  const 칸 = 조각들.map((x) =>
    `<figure><img src="${x.주소}" width="${칸폭}"/><figcaption>${x.n}</figcaption></figure>`).join('');
  return '<!doctype html><meta charset="utf-8">'
    + `<title>${제목}</title>`
    + '<style>body{margin:0;background:#2b2b2b;font:12px system-ui;color:#ddd}'
    + `main{display:grid;grid-template-columns:repeat(${가로},${칸폭}px);gap:6px;padding:6px}`
    + 'figure{margin:0}img{display:block;border:1px solid #555}'
    + 'figcaption{text-align:center;padding:2px 0}</style>'
    + `<main>${칸}</main>`;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  본다('번호를 집는다', 번호('slide-007.png') === 7);
  본다('세 자리도 집는다', 번호('slide-218.png') === 218);
  본다('⛔ 번호가 없으면 null', 번호('표지.png') === null);
  본다('⛔ null 에도 안 터진다', 번호(null) === null);

  const 것 = 낱장들(['slide-010.png', 'slide-2.png', '엉뚱.png', 'slide-001.png']);
  본다('번호 차례로 세운다', 것.map((x) => x.n).join(',') === '1,2,10');
  본다('⛔ 번호 없는 것은 뺀다', 것.length === 3);
  본다('⛔ 빈 목록을 견딘다', 낱장들([]).length === 0 && 낱장들(null).length === 0);

  본다('25칸이면 218장이 9판', 판수(218, 5, 5) === 9);
  본다('딱 떨어지면 그대로', 판수(50, 5, 5) === 2);
  본다('⛔ 0장이면 0판', 판수(0) === 0);
  본다('⛔ 가로가 0 이어도 안 터진다', Number.isFinite(판수(10, 0, 0)));

  const h = 판HTML([{ 주소: 'a.png', n: 3 }], { 제목: 'ㄱ' });
  본다('번호를 같이 찍는다 — 크게 다시 보려면 번호가 있어야 한다', h.includes('>3</figcaption>'));
  본다('그림을 건다', h.includes('src="a.png"'));
  본다('빈 조각도 견딘다', 판HTML([]).includes('<main></main>'));

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 장들을 바둑판으로 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const [낱장방, 낼방, 가로0, 세로0] = process.argv.slice(2);
  if (!낱장방 || !낼방) {
    console.log('⛔ 쓰는 법: node scripts/장들을-바둑판으로-붙인다.mjs <낱장폴더> <낼폴더> [가로] [세로]');
    process.exit(1);
  }
  if (!fs.existsSync(낱장방)) { console.log(`⛔ 낱장 폴더가 없다 — ${낱장방}`); process.exit(1); }
  const 가로 = Number(가로0) || 기본가로;
  const 세로 = Number(세로0) || 기본세로;
  const 것 = 낱장들(fs.readdirSync(낱장방).filter((f) => f.toLowerCase().endsWith('.png')));
  if (!것.length) { console.log('⛔ 낱장이 없다 — 먼저 슬라이드를-그림으로-본다.mjs 로 뽑는다'); process.exit(1); }

  fs.mkdirSync(낼방, { recursive: true });
  const 한판 = 가로 * 세로;
  const 판 = 판수(것.length, 가로, 세로);
  const 낸것 = [];
  for (let i = 0; i < 판; i += 1) {
    const 조각 = 것.slice(i * 한판, (i + 1) * 한판)
      .map((x) => ({ n: x.n, 주소: path.relative(낼방, path.join(낱장방, x.f)).replace(/\\/g, '/') }));
    const 길 = path.join(낼방, `판-${String(i + 1).padStart(2, '0')}.html`);
    fs.writeFileSync(길, 판HTML(조각, { 가로, 제목: `${i + 1}/${판}` }), 'utf8');
    낸것.push({ 길, 처음: 조각[0].n, 끝: 조각[조각.length - 1].n });
  }
  console.log(`■ 낱장 ${것.length}장 → 판 ${판}장 (${가로}×${세로})`);
  for (const x of 낸것) console.log(`   ${path.relative(process.cwd(), x.길)}   ${x.처음}~${x.끝}장`);
  console.log('\n⚠ 붙인 것으로 끝이 아니다 — **열어서 본다.**');
  console.log('   이 걸음이 잡는 것은 빈 장·깨진 칸·넘친 글자·뒤집힌 짜임이다.');
  console.log('   읽어야 하는 장은 번호를 보고 그 장만 크게 다시 본다.');
}
