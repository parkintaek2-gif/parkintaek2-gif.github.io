#!/usr/bin/env node
/**
 * collect-imf-pip-mirror.mjs — **누가 한국 증권을 들고 있나** (5번의 원래 물음, 2026-09-16 11:5x)
 * ─────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-17] collect-imf-pip.mjs 는 반대 방향이었다 — **한국이 해외에 들고 있는 것**
 *   (ACCOUNTING_ENTRY=A, 리포터=KOR)이지, 「누가 한국 증권을 들고 있나」가 아니었다.
 *   CPIS/PIP 는 «자산»만 걷는다 — 리포터가 KOR 이고 ACCOUNTING_ENTRY=L(부채) 을 물으면
 *   실측(2026-09-17) 관측값 0건이다. **부채(우리가 찾던 것)는 이 조사에 직접 없다.**
 *
 * ✅ 대신 **거울(mirror)**로 얻는다 — 다른 나라들이 «자기 자산»으로 신고한 값 가운데
 *   COUNTERPART_COUNTRY=KOR 인 것을 다 더한다. A국이 「내가 한국 증권을 30억 들고 있다」고
 *   신고한 값의 합이 곧 「한국 증권을 든 사람들」이다 — «부채 조사가 따로 없어도» 이렇게 구해진다.
 *   (옛 이름 CPIS 의 Coordinated 가 이 방식을 가리킨다.)
 *
 * ⚠ 리포터로 안 낸 나라(중국 등)는 이 합계에 안 잡힌다 — **하한선**이다. 화면에 그렇게 적는다.
 *
 *   node scripts/collect-imf-pip-mirror.mjs           2013~최신, COUNTERPART_COUNTRY=KOR 다 받는다
 *   node scripts/collect-imf-pip-mirror.mjs --자가시험  자가시험만
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSV가른다, 진짜나라인가 } from './collect-imf-pip.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 쌓는곳 = path.join(뿌리, 'archive', 'raw', 'imf-pip');
export const 헤드라인지표 = 'P_TOTINV_P_USD';
export const 시작해 = '2013';

/** ⚠ COUNTRY 자리를 비워 «모든 리포터»를 한 번에 받는다 — 리포터 목록을 우리가 짐작하지 않는다. */
export function 주소(상대국 = 'KOR', startPeriod = 시작해) {
  return 'https://api.imf.org/external/sdmx/2.1/data/PIP/.A.' + 헤드라인지표
    + '.S1.S1.' + 상대국 + '.A?startPeriod=' + startPeriod;
}

export function 관측만골라낸다(글) {
  const 행들 = CSV가른다(String(글 ?? ''));
  if (!행들.length) return { 것: [], 못읽음: '빈 응답이다' };
  const 머리 = 행들[0];
  const 자리 = (이름) => 머리.indexOf(이름);
  const 칸들 = ['COUNTRY', 'TIME_PERIOD', 'OBS_VALUE'];
  const 자리들 = Object.fromEntries(칸들.map((k) => [k, 자리(k)]));
  if (Object.values(자리들).some((i) => i < 0)) return { 것: [], 못읽음: '머리 칸을 못 찾았다' };
  const 것 = [];
  for (const 줄 of 행들.slice(1)) {
    const v = 줄[자리들.OBS_VALUE];
    if (v === undefined || v === '') continue;
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    const reporter = 줄[자리들.COUNTRY];
    if (!진짜나라인가(reporter)) continue;   /* 집계 코드(리포터 자리)는 뺀다 */
    것.push({ reporter, timePeriod: 줄[자리들.TIME_PERIOD], value: n });
  }
  return { 것 };
}

/** 그 해, 리포터별 값을 큰 순으로. 같은 리포터가 여러 줄이면(있으면 안 되지만) 더한다 */
export function 그해표(것들, 연도) {
  const 맵 = new Map();
  for (const r of 것들) {
    if (r.timePeriod !== 연도) continue;
    맵.set(r.reporter, (맵.get(r.reporter) ?? 0) + r.value);
  }
  return [...맵.entries()].map(([reporter, value]) => ({ reporter, value }))
    .sort((a, b) => b.value - a.value);
}

/* ───────────────────────── 자가시험 ───────────────────────── */
function 자가시험() {
  const 것 = []; const 본다 = (이름, 참) => 것.push({ 이름, 참: !!참 });
  const 보기 = [
    'DATAFLOW,COUNTRY,TIME_PERIOD,OBS_VALUE',
    'IMF.STA:PIP(5.0.0),USA,2024,195424000000',
    'IMF.STA:PIP(5.0.0),GX031,2024,80000000000',
    'IMF.STA:PIP(5.0.0),SGP,2024,73881153422',
    'IMF.STA:PIP(5.0.0),SGP,2023,60000000000',
  ].join('\n');
  const r = 관측만골라낸다(보기);
  본다('못읽음 없음', r.못읽음 === undefined);
  본다('집계코드(GX031)는 뺀다', r.것.length === 3);
  const 표 = 그해표(r.것, '2024');
  본다('2024 두 리포터, 큰 순', 표.length === 2 && 표[0].reporter === 'USA');
  본다('빈 글은 못읽음', 관측만골라낸다('').못읽음 !== undefined);
  const 진 = 것.filter((x) => !x.참);
  console.log('■ 자가시험 ' + (것.length - 진.length) + '/' + 것.length);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  return 진.length === 0;
}

/* ───────────────────────── 실행 ───────────────────────── */
async function 받는다() {
  const r = await fetch(주소(), {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/vnd.sdmx.data+csv;version=1.0.0' },
    signal: AbortSignal.timeout(90000),
  });
  if (!r.ok) throw new Error('IMF 가 ' + r.status + ' 를 냈다');
  return await r.text();
}

const 직접 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (직접) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  if (!자가시험()) process.exit(1);
  console.log('');
  try {
    const 글 = await 받는다();
    const r = 관측만골라낸다(글);
    if (r.못읽음) { console.log('🔴 못 읽었다 — ' + r.못읽음); process.exit(1); }
    mkdirSync(쌓는곳, { recursive: true });
    const 연도들 = [...new Set(r.것.map((x) => x.timePeriod))].sort();
    const 최근 = 연도들[연도들.length - 1];
    const 표 = 그해표(r.것, 최근);
    writeFileSync(path.join(쌓는곳, 'KOR-mirror.json'), JSON.stringify({
      _메모: {
        상품: '누가 한국 증권을 들고 있나 — 거울(mirror) 방식, 리포터국 자산 신고를 COUNTERPART_COUNTRY=KOR 로 합산',
        출처: 'IMF — ' + 주소(),
        받은때: new Date().toLocaleString('ko-KR'),
        하한선인이유: '리포터로 안 낸 나라(중국 등)는 이 합계에 없다 — 실제보다 적게 잡힌다',
        소급: '된다',
      },
      관측: r.것,
    }, null, 1), 'utf8');
    console.log('■ 거울 데이터 — 관측 ' + r.것.length + '건 · 연도 ' + 연도들.join(',') + ' · 최근 ' + 최근);
    console.log('   리포터 ' + 표.length + '개 · 합계 $' + (표.reduce((s, x) => s + x.value, 0) / 1e9).toFixed(1) + 'B');
    console.log('   1위 ' + 표[0].reporter + ' = $' + (표[0].value / 1e9).toFixed(1) + 'B');
  } catch (e) {
    console.log('🔴 못 받았다 — ' + String(e.message).slice(0, 120));
  }
}
