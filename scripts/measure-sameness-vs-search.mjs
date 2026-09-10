#!/usr/bin/env node
/**
 * measure-sameness-vs-search.mjs — **판박이가 정말 색인을 막나.** (5번, 2026-09-11)
 *
 *   node scripts/measure-sameness-vs-search.mjs --자가시험
 *   node scripts/measure-sameness-vs-search.mjs
 *
 * ── 🔴 왜 이 자를 만들었나 ───────────────────────────────────────────
 *
 * 오늘 `measure-page-sameness.mjs` 에 «구절 겹침»(3낱말) 칸을 붙였다. 그러자 갈래 순서가
 * 바뀌었다 — 어휘로는 사람 지면이 둘째로 나빴는데 구절로는 오히려 나은 쪽이었다.
 * 그리고 그룹 지면에 자료가 고르는 문단을 넣어 구절 81% → 78% 로 내렸다.
 *
 * ⛔ 그런데 여기서 멈추면 **가정 위에서 2,916장을 다시 쓰는 일**이 된다. 우리가 아는 것은
 *   2026-08-24 에 «어휘» 겹침과 색인 여부가 같이 움직였다는 표본 관찰 하나뿐이다.
 * ⇒ 그래서 재기 전에 잰다: 갈래마다 **「검색에 한 번이라도 보인 지면의 몫」**과
 *   그 갈래의 겹침을 나란히 놓는다. 관계가 없으면 다시 쓰는 일을 안 한다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────────────
 * ```
 * ⛔ 「노출 0」을 「색인 안 됨」이라고 부르지 않는다 — 색인돼도 아무도 그 말을 안 치면 0 이다.
 *   그래서 칸 이름을 «검색에 보인 몫»으로 둔다. 우리가 잰 것이 그것이다
 * ⛔ 함께 움직인다고 «때문»이라고 하지 않는다. 갈래마다 지면 나이·안쪽 링크·글 길이가
 *   다 다르다. 이 자는 관계를 «보여줄» 뿐 원인을 말하지 않는다
 * ⛔ 갈래가 적으면(6개 미만) 상관계수를 내지 않는다 — 점 네 개로 그은 선은 선이 아니다
 * ⛔ GSC 파일이 없으면 0 이 아니라 «못 쟀다»다
 * ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 본문, 낱말, 이음말, 서로겹침 } from './measure-page-sameness.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 볼방 = path.join(뿌리, 'dist', 'wikitip');
export const 자료방 = path.join(뿌리, 'src', 'data');

/** 가장 최근 GSC 지면별 파일을 찾는다. ⛔ 없으면 null — 0 이 아니다 */
export function 최근GSC(들 = null) {
  const 것 = (들 ?? (fs.existsSync(자료방) ? fs.readdirSync(자료방) : []))
    .filter((f) => /^gsc-kcw-page-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  return 것.length ? 것[것.length - 1] : null;
}

/** 주소에서 지면 경로만 — 「https://www.kculturewire.com/group/nct」 → 「group/nct」 */
export function 길만(주소) {
  const s = String(주소 ?? '');
  const m = s.match(/^https?:\/\/[^/]+\/(.*)$/);
  const p = (m ? m[1] : s).replace(/^\/+/, '').replace(/\/+$/, '').split('?')[0];
  return p;
}

/** 그 주소가 어느 갈래인가 — 첫 칸이 갈래다. 뿌리 낱장은 «(뿌리)» */
export function 갈래이름(길) {
  const p = 길만(길);
  if (!p) return '(뿌리)';
  const 칸 = p.split('/');
  return 칸.length >= 2 ? 칸[0] : '(뿌리)';
}

/** dist 의 html 길에서 갈래와 지면 길을 뽑는다 */
export function 지면길(파일, 밑 = 볼방) {
  const rel = path.relative(밑, 파일).split(path.sep).join('/');
  return rel.replace(/\.html$/, '').replace(/\/index$/, '');
}

/** 노출이 하나 이상인 지면 길 모음 */
export function 보인길들(rows) {
  const 것 = new Set();
  for (const r of rows ?? []) {
    if (!r || !(Number(r.impressions) > 0)) continue;
    것.add(길만(r.key));
  }
  return 것;
}

/** 피어슨 상관 — ⛔ 점이 적으면 null */
export function 상관(xs, ys, 적어도 = 6) {
  const a = []; const b = [];
  for (let i = 0; i < Math.min(xs?.length ?? 0, ys?.length ?? 0); i += 1) {
    if (Number.isFinite(xs[i]) && Number.isFinite(ys[i])) { a.push(xs[i]); b.push(ys[i]); }
  }
  if (a.length < 적어도) return null;
  const 평 = (v) => v.reduce((s, x) => s + x, 0) / v.length;
  const ma = 평(a); const mb = 평(b);
  let 위 = 0; let 아1 = 0; let 아2 = 0;
  for (let i = 0; i < a.length; i += 1) {
    위 += (a[i] - ma) * (b[i] - mb);
    아1 += (a[i] - ma) ** 2;
    아2 += (b[i] - mb) ** 2;
  }
  return (아1 === 0 || 아2 === 0) ? null : 위 / Math.sqrt(아1 * 아2);
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('길만: 도메인을 벗긴다', 길만('https://www.kculturewire.com/group/nct') === 'group/nct');
  재다('길만: 뒤 슬래시를 벗긴다', 길만('https://www.kculturewire.com/group/nct/') === 'group/nct');
  재다('길만: 뿌리는 빈 글', 길만('https://www.kculturewire.com/') === '');
  재다('⛔ 길만: 물음표 뒤는 버린다', 길만('https://x.com/a/b?utm=1') === 'a/b');

  재다('갈래이름: 첫 칸이 갈래다', 갈래이름('https://x.com/group/nct') === 'group');
  재다('갈래이름: 낱장은 «(뿌리)»', 갈래이름('https://x.com/kpop-attention') === '(뿌리)');
  재다('갈래이름: 뿌리도 «(뿌리)»', 갈래이름('https://x.com/') === '(뿌리)');

  재다('🔴 보인길들: 노출 0 은 «보인 것»이 아니다', (() => {
    const s = 보인길들([{ key: 'https://x.com/a/b', impressions: 0 },
      { key: 'https://x.com/a/c', impressions: 3 }]);
    return s.size === 1 && s.has('a/c');
  })());
  재다('⛔ 보인길들: 없는 것·깨진 것에 안 터진다',
    보인길들(null).size === 0 && 보인길들([null, {}]).size === 0);

  재다('상관: 완전히 같이 움직이면 1', Math.abs(상관([1, 2, 3, 4, 5, 6], [2, 4, 6, 8, 10, 12]) - 1) < 1e-9);
  재다('상관: 거꾸로면 −1', Math.abs(상관([1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1]) + 1) < 1e-9);
  재다('🔴 상관: 점이 적으면 null — 점 넷으로 그은 선은 선이 아니다',
    상관([1, 2, 3, 4], [1, 2, 3, 4]) === null);
  재다('⛔ 상관: 한쪽이 늘 같으면 null', 상관([1, 1, 1, 1, 1, 1], [1, 2, 3, 4, 5, 6]) === null);

  재다('지면길: 확장자와 index 를 벗긴다',
    지면길(path.join(볼방, 'group', 'nct.html')) === 'group/nct'
    && 지면길(path.join(볼방, 'group', 'index.html')) === 'group');
  재다('최근GSC: 가장 늦은 날짜를 고른다',
    최근GSC(['gsc-kcw-page-2026-09-01.json', 'gsc-kcw-page-2026-09-07.json', 'other.json'])
      === 'gsc-kcw-page-2026-09-07.json');
  재다('⛔ 최근GSC: 없으면 null — 0 이 아니다', 최근GSC(['other.json']) === null);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 재지 않는다.'); process.exit(1); }
console.log('');

if (!fs.existsSync(볼방)) {
  console.log(`⬜ 못 쟀다 — ${path.relative(뿌리, 볼방)} 가 없다. 먼저 npm run build`);
  process.exit(0);
}
const gsc이름 = 최근GSC();
if (!gsc이름) {
  console.log('⬜ 못 쟀다 — src/data 에 gsc-kcw-page-*.json 이 없다.');
  process.exit(0);
}
const gsc = JSON.parse(fs.readFileSync(path.join(자료방, gsc이름), 'utf8'));
const 보인 = 보인길들(gsc.rows);

/* 갈래마다 지면을 모은다 */
const 갈래 = new Map();
const 걷기 = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { 걷기(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    const 길 = 지면길(p);
    const 이름 = 길.includes('/') ? 길.split('/')[0] : '(뿌리)';
    if (!갈래.has(이름)) 갈래.set(이름, []);
    갈래.get(이름).push({ 파일: p, 길 });
  }
};
걷기(볼방);

const 줄들 = [];
for (const [이름, 것들] of [...갈래].sort((a, b) => b[1].length - a[1].length)) {
  const 뽑기 = 것들.length <= 30 ? 것들
    : Array.from({ length: 30 }, (_, i) => 것들[Math.floor((i * 것들.length) / 30)]);
  const 어휘주머니 = []; const 구절주머니 = [];
  for (const x of 뽑기) {
    let 본;
    try { 본 = 본문(fs.readFileSync(x.파일, 'utf8')); } catch { continue; }
    어휘주머니.push(낱말(본)); 구절주머니.push(이음말(본));
  }
  const 보인수 = 것들.filter((x) => 보인.has(x.길)).length;
  줄들.push({
    이름,
    장수: 것들.length,
    어휘: 서로겹침(어휘주머니),
    구절: 서로겹침(구절주머니),
    보인수,
    보인몫: 것들.length ? 보인수 / 것들.length : null,
  });
}

console.log(`■ 판박이와 「검색에 보인 몫」 — ${gsc이름} · 노출 있는 주소 ${보인.size}개`);
console.log('');
console.log('갈래              지면수   어휘   구절   검색에 보인 몫');
for (const x of 줄들) {
  console.log(`${x.이름.slice(0, 16).padEnd(17)} ${String(x.장수).padStart(6)}`
    + `  ${(x.어휘 == null ? '못 잼' : `${x.어휘.toFixed(0)}%`).padStart(5)}`
    + `  ${(x.구절 == null ? '못 잼' : `${x.구절.toFixed(0)}%`).padStart(5)}`
    + `   ${String(x.보인수).padStart(5)} / ${String(x.장수).padEnd(5)}`
    + ` = ${(x.보인몫 == null ? '못 잼' : `${(x.보인몫 * 100).toFixed(0)}%`).padStart(5)}`);
}

const 쓸것 = 줄들.filter((x) => x.구절 != null && x.보인몫 != null && x.장수 >= 5);
const r구절 = 상관(쓸것.map((x) => x.구절), 쓸것.map((x) => x.보인몫));
const r어휘 = 상관(쓸것.map((x) => x.어휘), 쓸것.map((x) => x.보인몫));
console.log('');
console.log(`■ 겹침과 「검색에 보인 몫」의 상관 — 갈래 ${쓸것.length}개 (5장 미만은 뺐다)`);
console.log(`   구절 겹침 ↔ 보인 몫   ${r구절 == null ? '⬜ 못 쟀다(점이 적다)' : r구절.toFixed(2)}`);
console.log(`   어휘 겹침 ↔ 보인 몫   ${r어휘 == null ? '⬜ 못 쟀다(점이 적다)' : r어휘.toFixed(2)}`);
console.log('');
console.log('⛔ 「노출 0」을 「색인 안 됨」으로 읽지 않는다 — 색인돼도 아무도 그 말을 안 치면 0 이다.');
console.log('⛔ 같이 움직인다고 «때문»이라고 하지 않는다. 갈래마다 지면 나이·안쪽 링크·글 길이가 다르다.');
console.log('⭐ 이 수로 정하는 것은 하나다 — 겹침을 내리는 일에 시간을 더 쓸 값이 있나.');
console.log('');
console.log('🔴 2026-09-11 첫 실측 — 상관이 구절 +0.19 · 어휘 +0.26 이었다. «거꾸로» 붙었다.');
console.log('   room 은 구절 98% 인데 보인 몫 83% 고, week 는 구절 47% 인데 0/269 다.');
console.log('   ⇒ 우리 지면이 검색에 안 보이는 까닭은 «판박이가 아니다». 2,916장을 다시 쓰는');
console.log('      일에 시간을 넣지 않는다. 그 시간은 «보인 몫이 0 인 갈래»가 왜 0 인지에 쓴다.');
console.log('   ⚠ 그리고 이 자가 못 가르는 것이 하나 있다 — 「색인이 안 됐다」와');
console.log('      「색인은 됐는데 아무도 그 말을 안 친다」다. week·year 같은 갈래는 뒤쪽일 수 있다.');
