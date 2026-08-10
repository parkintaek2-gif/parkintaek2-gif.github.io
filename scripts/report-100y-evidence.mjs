#!/usr/bin/env node
/**
 * 📋 **검증 대장을 뽑는다** — 우리가 파는 것이 무엇이고, 어디까지 맞춰 봤나.
 *
 *   node scripts/report-100y-evidence.mjs            사람이 읽는 꼴
 *   node scripts/report-100y-evidence.mjs --json     기계가 읽는 꼴(납품용)
 *   node scripts/report-100y-evidence.mjs --자가시험
 *
 * ## 🔴 왜 문서가 아니라 **뽑아내는** 것인가 (2026-08-09 8번)
 *
 *   2번이 물으셨다 — *「지자체·기관에 팔 때 **우리 수가 공표치와 맞는다는 증거**를 어떻게 낼지」*.
 *   ⛔ 문서로 적어 두면 **문서가 낡는다.** 자료는 바뀌는데 문서는 안 바뀐다.
 *   ✅ 그래서 **자료에서 그때그때 뽑는다.** 이 자를 돌리면 지금 상태가 나온다.
 *
 * ## 무엇을 뽑나 — 자료 한 벌마다 네 칸
 *
 *   출처(기관·데이터셋·이용허락범위) · 덮는범위(못 보는 것) · 대조(공표치와 얼마나) · ⛔경고문
 *
 * ⛔ 이 자는 **판정하지 않는다.** 자료에 적힌 것을 모아 보여줄 뿐이다.
 *   비어 있으면 「없음」이라고 적는다 — 그게 사는 쪽이 알아야 할 것이다.
 */
import fs from 'node:fs';
import path from 'node:path';

/* ⚠ const 는 끌어올려지지 않는다. 자가시험보다 위에 둔다 */

/** 값이 여러 겹이어도 첫 글월 하나를 꺼낸다 */
export function 첫글월(값) {
  if (typeof 값 === 'string') return 값;
  if (Array.isArray(값)) return 값.map(첫글월).filter(Boolean)[0] ?? '';
  if (값 && typeof 값 === 'object') {
    for (const v of Object.values(값)) { const s = 첫글월(v); if (s) return s; }
  }
  return '';
}

/** 출처에서 기관·데이터셋·이용허락범위를 뽑는다
 *
 *  🔴 2026-08-10 13:1x 넓혔다 — 처음엔 `이름`·`데이터셋` 칸만 봤다.
 *     그런데 `기관`·`서비스`·`표` 로 적은 자료가 셋 있었고, 이 자가 그것들을
 *     **말없이 건너뛰었다.** 그 셋은 전부 대조가 없는 자료였는데,
 *     그래서 내가 「아무 말 없는 것 0」이라고 잘못 알리게 됐다(04:05 · 08:30 보고).
 *  ⛔ **못 읽는 것을 조용히 빼면 대장이 아니라 거짓말이 된다.**
 *     그래서 ① 알아보는 칸을 넓히고 ② 그래도 못 읽은 것은 **세어서 찍는다**(아래 본문).
 */
export const 출처칸꼴 = /^(이름|데이터셋|기관|서비스|표|포털|공시항목)$/;

export function 출처뽑기(출처) {
  if (!출처) return null;
  const 하나 = (o) => ({
    기관: o?.이름 ?? o?.기관 ?? o?.서비스 ?? '',
    데이터셋: o?.데이터셋 ?? o?.표 ?? o?.id ?? '',
    이용허락범위: o?.이용허락범위 ?? o?.이용허락 ?? o?.공공누리 ?? '',
  });
  const 알아보나 = (o) => o && typeof o === 'object' && Object.keys(o).some((k) => 출처칸꼴.test(k));
  if (알아보나(출처)) return [하나(출처)];
  if (typeof 출처 === 'object') {
    const 목 = Object.values(출처).filter(알아보나);
    if (목.length) return 목.map(하나);
  }
  return null;
}

/** 대조를 한 마디라도 했나 — 「못 맞췄다」도 말한 것이다 */
export function 대조요약(자료) {
  const 칸 = Object.keys(자료 ?? {}).filter((k) => /^대조$|공표.*대조|대조.*공표/.test(k));
  if (!칸.length) {
    if (/공표에 같은 칸이 없/.test(JSON.stringify(자료 ?? {}))) return '⛔ 공표에 같은 칸이 없다(그렇게 적어 둠)';
    return '';
  }
  return 칸.map((k) => 첫글월(자료[k])).filter(Boolean).join(' / ').slice(0, 160);
}

/** ⛔ 로 시작하는 경고문을 모은다 */
export function 경고모으기(자료) {
  const 모음 = [];
  const 훑기 = (o) => {
    if (Array.isArray(o)) return o.forEach(훑기);
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && /^⛔/.test(v.trim())) 모음.push(v.trim());
      else if (typeof v === 'string' && /^⛔/.test(k)) 모음.push(`${k}: ${v}`);
      else 훑기(v);
    }
  };
  훑기(자료);
  return [...new Set(모음)];
}

function 자가시험() {
  const 본보기 = [
    ['글월을 그대로 낸다', () => 첫글월('가나다') === '가나다'],
    ['묶음 안에서도 꺼낸다', () => 첫글월({ a: { b: '속' } }) === '속'],
    ['빈 것은 빈 글', () => 첫글월(null) === ''],
    ['출처 하나를 뽑는다', () => 출처뽑기({ 이름: '국민연금', 데이터셋: '15083277' })[0].데이터셋 === '15083277'],
    ['출처 둘도 뽑는다', () => 출처뽑기({ a: { 이름: 'ㄱ' }, b: { 이름: 'ㄴ' } }).length === 2],
    ['출처 없으면 null', () => 출처뽑기(null) === null],
    ['🔴 「기관」으로 적은 것도 읽는다', () => 출처뽑기({ 기관: '국가데이터처 KOSIS', 서비스: '통계설명' })[0].기관 === '국가데이터처 KOSIS'],
    ['🔴 겹으로 든 「기관」도 읽는다', () => 출처뽑기({ 임금: { 기관: '고용노동부', 표: '118/x' } })[0].데이터셋 === '118/x'],
    ['「이용허락」만 적어도 읽는다', () => 출처뽑기({ 기관: 'ㄱ', 이용허락: '약관 제8조' })[0].이용허락범위 === '약관 제8조'],
    ['⛔ 알 수 없는 꼴이면 null', () => 출처뽑기({ 아무거나: 1 }) === null],
    ['대조 칸을 찾는다', () => 대조요약({ 대조: '공표와 0.03%' }).includes('0.03%')],
    ['⭐ 「못 맞췄다」도 말한 것', () => 대조요약({ x: '공표에 같은 칸이 없다' }).startsWith('⛔')],
    ['아무 말 없으면 빈 글', () => 대조요약({ 자료: [1, 2] }) === ''],
    ['경고문을 모은다', () => 경고모으기({ a: '⛔ 이렇게 쓰지 마라' }).length === 1],
    ['같은 경고는 한 번만', () => 경고모으기({ a: '⛔ 같다', b: '⛔ 같다' }).length === 1],
    ['경고가 없으면 0', () => 경고모으기({ a: '보통 글' }).length === 0],
  ];
  let 진 = 0;
  for (const [이름, 재기] of 본보기) {
    let 됐나 = false; let 까닭 = null;
    try { 됐나 = 재기() === true; } catch (e) { 됐나 = false; 까닭 = e?.message ?? String(e); }
    if (!됐나) { console.log(`  ⛔ 자가시험 실패 — ${이름}${까닭 ? ` (터졌다: ${까닭})` : ''}`); 진++; }
  }
  console.log(`자가시험 ${본보기.length}개 · 실패 ${진}개`);
  return 진;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);

/* ⚠ 2026-08-10 13:0x — **직접 부를 때만 아래를 돈다.**
 *   그 전에는 `import` 만 해도 대장이 통째로 찍혔다. 그래서 다른 자가 이 자의 함수를
 *   빌려 쓸 수가 없었다(자를 자로 재려다 알았다). 자는 빌려 쓸 수 있어야 한다. */
const { pathToFileURL } = await import('node:url');
const 곧바로부름 = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (곧바로부름) {

const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 자료방 = path.join(여기, 'src', 'data', '100yearmap');

const 대장 = [];
/* 🔴 못 읽은 것을 **세어 둔다.** 조용히 건너뛰면 대장이 거짓말이 된다(8/10 13:1x 에 그랬다) */
const 못읽음 = [];
const 깨진파일 = [];
for (const f of fs.readdirSync(자료방).filter((x) => x.endsWith('.json')).sort()) {
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(자료방, f), 'utf8')); } catch { 깨진파일.push(f); continue; }
  const 출처 = 출처뽑기(j.출처);
  if (!출처) { if (j.출처) 못읽음.push(f); continue; }
  대장.push({
    파일: f,
    이름: j.이름 ?? '',
    출처,
    덮는범위: 첫글월(j.덮는범위).slice(0, 200),
    대조: 대조요약(j),
    경고수: 경고모으기(j).length,
    줄수: Array.isArray(j.자료) ? j.자료.length : null,
  });
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ 뽑은때: '실행 시각은 부르는 쪽이 찍는다', 자료: 대장 }, null, 2));
  process.exit(0);
}

const 맞춘것 = 대장.filter((r) => r.대조 && !r.대조.startsWith('⛔')).length;
const 못맞춘것 = 대장.filter((r) => r.대조.startsWith('⛔')).length;
const 말없음 = 대장.filter((r) => !r.대조).length;

console.log('📋 검증 대장 — 자료에서 그때그때 뽑은 것\n');
for (const r of 대장) {
  const 허 = [...new Set(r.출처.map((o) => o.이용허락범위).filter(Boolean))].join(' · ') || '(안 적힘)';
  const 기 = r.출처.map((o) => `${o.기관}${o.데이터셋 ? `(${o.데이터셋})` : ''}`).join(' + ');
  console.log(`■ ${r.파일}${r.줄수 != null ? ` · ${r.줄수}줄` : ''}`);
  console.log(`   출처   ${기.slice(0, 90)}`);
  console.log(`   허락   ${허}`);
  console.log(`   덮는범위 ${r.덮는범위 ? r.덮는범위.slice(0, 90) : '⬜ 없음'}`);
  console.log(`   대조   ${r.대조 || '⬜ 맞춰 봤다는 말이 없다'}`);
  console.log(`   경고문 ${r.경고수}줄`);
}
console.log(`\n자료 ${대장.length}개 — 공표치와 맞춘 것 ${맞춘것} · 「못 맞췄다」고 적은 것 ${못맞춘것} · 아무 말 없는 것 ${말없음}`);
if (못읽음.length || 깨진파일.length) {
  console.log(`🔴 이 자가 **못 읽어서 위 셈에 안 들어간 것** ${못읽음.length + 깨진파일.length}개 — ${[...못읽음, ...깨진파일].join(' · ')}`);
  console.log('   ⛔ 못 읽은 것을 조용히 빼면 대장이 아니라 거짓말이 된다. 출처 칸 이름을 맞추거나 이 자를 넓혀야 한다');
} else {
  console.log('✅ 출처가 있는데 못 읽은 자료 0 — 위 셈이 전부다');
}
console.log('⛔ 이 자는 판정하지 않는다. **자료에 적힌 것을 모아 보여줄 뿐이다**');
console.log('⚠ 「아무 말 없는 것」이 0 이 될 때까지가 파는 물건의 완성이다');

} /* ── 곧바로부름 끝 ── */
