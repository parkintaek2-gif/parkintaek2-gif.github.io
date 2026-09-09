#!/usr/bin/env node
/**
 * check-stock-prices-datago.mjs — **팔 수 있는 주가 출처 자**를 검사한다.
 *
 *   node scripts/check-stock-prices-datago.mjs --자가시험
 *   node scripts/check-stock-prices-datago.mjs            실제 아카이브로도 재 본다
 *
 * 🔴 왜 (2026-09-09 · 5번): KRX OPEN API 약관이 「비상업적 목적으로만」이고
 *   「제3자에게 제공할 수 없다」인데, 우리는 그 값을 팔 파일(People Panel)에 넣고 있었다.
 *   같은 칸이 공공데이터포털(이용허락범위 「제한 없음」)에 있어 출처를 바꾼다.
 *   전문: docs/데이터-출처-라이선스.md 맨 아래 절.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  시세방, 날뽑기, 최근날, 수, 코드다듬기, 한줄옮기기, 읽기, 시세, 코드지도,
} from '../src/lib/stock-prices-datago.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function 자가시험() {
  let 흠 = 0;
  const 검 = (말, 참) => { if (!참) { 흠 += 1; console.log('  🔴 ' + 말); } else console.log('  ✅ ' + 말); };

  검('시세방이 «팔 수 있는» 자리다 — raw/krx 가 아니다',
    시세방 === 'archive/raw/stocks' && !시세방.includes('krx'));

  검('파일 이름에서 날짜를 뽑는다', 날뽑기('20260907.ndjson') === '20260907');
  검('⛔ 다른 꼴은 안 센다', 날뽑기('20260907.json') === null && 날뽑기('x.ndjson') === null);
  검('가장 새 거래일을 고른다',
    최근날(['20260901.ndjson', '20260907.ndjson', 'readme.md']) === '20260907');
  검('⛔ 없으면 null (오늘 날짜로 만들지 않는다)', 최근날([]) === null && 최근날(null) === null);

  검('🔴 빈칸을 0 으로 읽지 않는다', 수('') === null && 수(null) === null && 수(undefined) === null);
  검('0 은 0 이다 (빈칸과 다르다)', 수(0) === 0 && 수('0') === 0);
  검('자릿점을 뗀다', 수('188,704,005,030') === 188704005030);
  검('⛔ 글자는 null', 수('n/a') === null);

  검('🔴 종목코드를 6자리로 맞춘다 — 0 이 앞에 붙는 것이 있다', 코드다듬기('5930') === '005930');
  검('이미 6자리면 그대로', 코드다듬기('900270') === '900270');
  검('⛔ 빈 것은 null', 코드다듬기('') === null && 코드다듬기(null) === null);

  /* 🔴 요점 — 공공데이터포털 줄이 «KRX 칸 이름»으로 나와야 한다. 그래야 부르는 쪽이 한 줄만 바꾼다 */
  const 실제줄 = {
    일자: '20260907', 코드: '900270', isin: 'HK0000214814', 이름: '헝셩그룹', 시장: 'KOSDAQ',
    종가: 3195, 전일비: -170, 등락률: -5.05, 시가: 3280, 고가: 3595, 저가: 3125,
    거래량: 446756, 거래대금: 1476928909, 상장주식수: 10712288, 시가총액: 34225760160, 거래없음: false,
  };
  const r = 한줄옮기기(실제줄);
  검('🔴 종가를 TDD_CLSPRC 로 낸다 (KRX 이름 그대로)', r.TDD_CLSPRC === 3195);
  검('🔴 시가총액을 MKTCAP 로 낸다', r.MKTCAP === 34225760160);
  검('🔴 상장주식수를 LIST_SHRS 로 낸다', r.LIST_SHRS === 10712288);
  검('종목코드·이름·시장도 KRX 이름으로 낸다',
    r.ISU_CD === '900270' && r.ISU_NM === '헝셩그룹' && r.MKT_NM === 'KOSDAQ');
  검('⭐ 출처를 줄에 박는다 — 나중에 「어디서 왔나」를 다시 묻지 않게', /제한 없음/.test(r.출처));
  검('⛔ 출처에 KRX 를 적지 않는다 (그쪽이 아니다)', !/한국거래소|KRX/.test(r.출처));
  검('KRX 판에 없던 칸도 낸다 (거래없음·isin)', r.거래없음 === false && r.isin === 'HK0000214814');
  검('⛔ 코드가 없는 줄은 버린다', 한줄옮기기({ 이름: 'x' }) === null);
  검('⛔ 빈 것도 견딘다', 한줄옮기기(null) === null && 한줄옮기기('글자') === null);

  const 글 = JSON.stringify(실제줄) + '\n{깨진 줄\n' + JSON.stringify({ ...실제줄, 코드: '5930' }) + '\n\n';
  const 줄들 = 읽기(글);
  검('🔴 깨진 줄 하나가 나머지를 버리게 하지 않는다', 줄들.length === 2);
  검('빈 줄은 안 센다', 읽기('\n\n').length === 0);
  검('⛔ 빈 것도 견딘다 (읽기)', 읽기(null).length === 0);

  const m = 코드지도(줄들);
  검('코드로 찾는다', m.get('005930')?.ISU_NM === '헝셩그룹');
  검('⛔ 이름으로 키를 만들지 않는다 (이름은 겹친다)', !m.has('헝셩그룹'));

  검('⬜ 폴더가 없으면 «못 쟀다»로 낸다 (0 이 아니다)', (() => {
    const g = 시세('/없는곳', null, () => { throw new Error('x'); }, () => { throw new Error('x'); });
    return g.줄들.length === 0 && g.날 === null && /폴더가 없다/.test(g.까닭);
  })());
  검('⬜ 폴더는 있고 파일이 없으면 그렇게 적는다', (() => {
    const g = 시세('/x', null, () => { throw new Error('x'); }, () => ['readme.md']);
    return g.날 === null && /ndjson 이 없다/.test(g.까닭);
  })());

  console.log(`\n팔 수 있는 주가 출처 — 자가시험 ${흠 ? '🔴 흠 ' + 흠 + '개' : '전부 통과'}`);
  return 흠;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
if (자가시험()) { console.log('🔴 자가시험이 깨졌다 — 멈춘다'); process.exit(1); }

/* ── 실제 아카이브로도 재 본다 ─────────────────────────────────────────── */
const g = 시세(뿌리);
console.log(`\n■ 팔 수 있는 주가 — ${시세방}`);
if (!g.날) {
  console.log(`  ⬜ 못 쟀다 — ${g.까닭}`);
  console.log('  ✅ 채우는 법: node scripts/collect-stock-prices.mjs --date YYYYMMDD');
  process.exit(0);
}
const 시장별 = {};
for (const r of g.줄들) 시장별[r.MKT_NM || '(안 적힘)'] = (시장별[r.MKT_NM || '(안 적힘)'] ?? 0) + 1;
const 종가있음 = g.줄들.filter((r) => r.TDD_CLSPRC !== null).length;
const 시총있음 = g.줄들.filter((r) => r.MKTCAP !== null).length;
console.log(`  기준일 ${g.날} · 줄 ${g.줄들.length.toLocaleString()} · 코드 ${코드지도(g.줄들).size.toLocaleString()}개`);
console.log(`  시장별 ${Object.entries(시장별).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log(`  종가 있음 ${종가있음.toLocaleString()} · 시가총액 있음 ${시총있음.toLocaleString()} (⛔ 빈칸을 0 으로 세지 않았다)`);
console.log('  ⭐ 이 출처는 이용허락범위 「제한 없음」이다 — 팔 파일에 넣어도 된다');
console.log('  ⛔ archive/raw/krx (KRX OPEN API) 는 「비상업적 목적으로만」이다. 팔 파일에 넣지 않는다');
