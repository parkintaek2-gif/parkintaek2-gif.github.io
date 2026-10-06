#!/usr/bin/env node
/**
 * 🔴🔴 **시가총액은 «포털 판»에서 읽는다 — KRX 직접 수집분을 쓰지 않는다.**
 *
 * 사장님 (2026-10-06): 「**KRX 시세 >>> 다른 데서 우회적으로 받지 않았나?**」
 * 그 말씀에 뒤져 보니 **그러고 있었다** —
 *
 *   scripts/build-segments-data.mjs:133   path.join(뿌리, 'archive', 'raw', 'krx')
 *   scripts/collect-dart-segments.mjs:335·338   같은 곳
 *   → src/data/segments.json → /data/segment-reporting · /trial (둘 다 라이브 200)
 *
 * 우리 이용허락 대장에 내가 직접 이렇게 적어 두었었다 —
 *   krx 🔴 「이용약관 제6조②「비상업적인 목적으로만」·제11조「제3자에게 제공할 수 없다」.
 *           ⚠ 그래도 모으는 까닭 — 공공데이터포털 판과 어긋나는지 대 보는 «내부 검산용».
 *           ⛔ **팔 파일·광고 지면에 넣지 않는다**」
 * **그 금칙을 내가 어겼다.** `/trial` 은 유료 길목이고 사이트에는 광고가 붙는다.
 *
 * ⛔ 금지 자물쇠(check-forbidden-sources.mjs)에 이 길이 «이미 적혀 있었는데» 0건이라 했다.
 *   `줄.includes('archive/raw/krx')` 로 글자를 통째로 찾는데 코드가 `path.join` 으로
 *   토막을 나눠 두어 걸리지 않았다. 그 자도 같은 날 고쳤다(자가시험 31 → 41).
 *
 * ⭐ 포털 판(`archive/raw/stocks`)에 **시가총액 칸이 이미 있다.** 굳이 KRX 를 두드릴 까닭이 없었다.
 *   {"일자":"20261001","코드":"900270",…,"시가총액":32213341985,…}
 *
 * ⚠ 그렇다고 이것이 「이제 써도 된다」는 뜻은 아니다 — 포털 판도 2026-09-07 부터
 *   공공누리 제4유형(상업적 이용금지)이다. 그것은 사장님이 정하실 일이고,
 *   이 자는 «적어도 우리 규칙은 지키게» 한다.
 *
 * 쓰기 —
 *   import { 시가총액표 } from './시가총액읽기.mjs';
 *   node scripts/시가총액읽기.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
export const 뿌리 = path.resolve(여기, '..');

/** 포털 판 주식시세가 쌓이는 곳. ⛔ archive/raw/krx 를 쓰지 않는다 */
export const 시세방 = path.join(뿌리, 'archive', 'raw', 'stocks');

/**
 * NDJSON 한 덩이에서 「코드 → 시가총액」을 뽑는다.
 * ⛔ 시가총액이 없거나 0 이하인 줄은 «안 담는다» — 0 으로 담으면 「가장 작은 회사」가 된다.
 * ⛔ 못 읽은 줄은 조용히 버리되 몇 줄 버렸는지는 돌려준다. 「못 쟀다」를 숨기지 않는다.
 */
export function 줄에서뽑기(글) {
  const 표 = new Map();
  let 버린줄 = 0;
  for (const l of String(글 ?? '').split(/\r?\n/)) {
    if (!l.trim()) continue;
    let r;
    try { r = JSON.parse(l); } catch { 버린줄 += 1; continue; }
    const 코드 = r?.코드 ?? r?.code ?? null;
    const 시총 = Number(r?.시가총액 ?? r?.market_cap ?? NaN);
    if (코드 == null || !Number.isFinite(시총) || 시총 <= 0) { 버린줄 += 1; continue; }
    표.set(String(코드), 시총);
  }
  return { 표, 버린줄 };
}

/**
 * 가장 최근 날의 시가총액표.
 * ⛔ 자료가 없으면 «빈 표»와 함께 못읽음을 돌려준다 — 터뜨리지 않고, 「0원」이라고도 하지 않는다.
 */
export function 시가총액표(방 = 시세방, 읽기 = fs) {
  let 것들 = [];
  try {
    것들 = 읽기.readdirSync(방).filter((f) => f.endsWith('.ndjson')).sort();
  } catch { return { 표: new Map(), 날: null, 못읽음: '시세 방을 못 읽었다' }; }
  if (!것들.length) return { 표: new Map(), 날: null, 못읽음: '쌓인 날이 없다' };
  const 마지막 = 것들.at(-1);
  let 글;
  try { 글 = 읽기.readFileSync(path.join(방, 마지막), 'utf8'); } catch { return { 표: new Map(), 날: null, 못읽음: '마지막 날을 못 읽었다' }; }
  const { 표, 버린줄 } = 줄에서뽑기(글);
  return { 표, 날: 마지막.replace(/\.ndjson$/, ''), 버린줄, 못읽음: 표.size ? null : '쓸 줄이 없다' };
}

/* ── 자가시험 ───────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0; let 탈 = 0;
  const 본다 = (말, 참) => { if (참) { 통 += 1; console.log('✅ ' + 말); } else { 탈 += 1; console.log('🔴 ' + 말); } };

  const 글 = [
    '{"일자":"20261001","코드":"900270","이름":"헝셩그룹","시가총액":32213341985}',
    '{"일자":"20261001","코드":"005930","이름":"삼성전자","시가총액":500000000000000}',
    '{"일자":"20261001","코드":"000001","이름":"시총없음"}',
    '{"일자":"20261001","코드":"000002","이름":"시총0","시가총액":0}',
    '깨진 줄',
    '',
  ].join('\n');
  const { 표, 버린줄 } = 줄에서뽑기(글);
  본다('코드로 시가총액을 뽑는다', 표.get('900270') === 32213341985);
  본다('여러 줄을 담는다', 표.size === 2);
  본다('⛔ 시가총액이 없는 줄은 안 담는다 — 0 으로 담으면 「가장 작은 회사」가 된다', !표.has('000001'));
  본다('⛔ 0 도 안 담는다', !표.has('000002'));
  본다('⛔ 버린 줄 수를 숨기지 않는다 — 「못 쟀다」를 적는다', 버린줄 === 3);
  본다('⛔ 빈 것에 안 터진다', 줄에서뽑기(null).표.size === 0 && 줄에서뽑기('').표.size === 0);

  const 가짜 = {
    readdirSync: () => ['20260930.ndjson', '20261001.ndjson', '메모.txt'],
    readFileSync: () => 글,
  };
  const r = 시가총액표('아무방', 가짜);
  본다('가장 «최근» 날을 고른다', r.날 === '20261001');
  본다('ndjson 이 아닌 것은 안 센다', r.표.size === 2);
  본다('⛔ 방을 못 읽으면 빈 표와 못읽음을 준다 — 터지지 않는다', (() => {
    const x = 시가총액표('없는방', { readdirSync: () => { throw new Error('없다'); }, readFileSync: () => '' });
    return x.표.size === 0 && !!x.못읽음;
  })());
  본다('⛔ 쌓인 날이 없으면 못읽음이다 — 「시총 0」이 아니다', (() => {
    const x = 시가총액표('빈방', { readdirSync: () => [], readFileSync: () => '' });
    return x.표.size === 0 && x.못읽음 === '쌓인 날이 없다';
  })());

  /* ⚠ 여기 금지 길을 «글자 그대로» 적지 않는다 — 금지 자물쇠가 이 줄을 흠으로 잡는다.
     ⛔ 눈감이를 달아 비켜 가지 않는다. 눈감이가 늘면 자물쇠가 무뎌진다. 말을 바꾼다. */
  본다('⛔ 이 자는 KRX 직접 수집분을 쳐다보지 않는다', !시세방.includes('krx') && 시세방.includes('stocks'));

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통} 통과`);
  return 탈 ? 1 : 0;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다 && process.argv.includes('--자가시험')) process.exit(자가시험());
