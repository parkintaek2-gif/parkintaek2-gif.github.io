#!/usr/bin/env node
/**
 * 국민연금 **상한에 눌린 사람 비율**을 업종·지역·규모별로 센다 — 백년지도(100yearmap) 몫.
 *
 *   node scripts/count-100y-nps-cap-share.mjs           센다
 *   node scripts/count-100y-nps-cap-share.mjs --selftest 자를 시험한다
 *
 * ## 🔴 왜 세나 (2026-08-08 02:0x · 사업 축 d80abf75 가 업종에서 먼저 쟀다)
 *
 *   *「1위 업종은 열에 아홉 반이 이미 눈금 끝에 있다. 581,799원은 그만큼 받는다가
 *     아니라 **우리 자로는 여기까지밖에 못 잰다**는 뜻이다. 2.34배는 하한이다」*
 *
 *   같은 눌림이 규모 축에도 있었고 `size-axis.json` 에 이미 들어 있었다(0.3%~21%).
 *   그런데 **업종 축·지역 축에는 그 칸이 없다.** 격차가 제일 큰 업종 축이 비어 있으니
 *   지면이 「2.34배」를 눌림 설명 없이 싣고 있다. 그래서 여기서 센다.
 *
 * ## 상한이 무엇인가
 *
 *   ```
 *   기준소득월액 상한 637만원  ×  9%(근로자 4.5 + 회사 4.5)  =  월 573,300원 고지
 *   ```
 *   이 위로는 아무리 벌어도 고지액이 안 오른다. 그래서 **고지액으로 임금을 재면
 *   높은 쪽이 눌린다.** 얼마나 눌렸는지를 세는 것이 이 파일이다.
 *
 * ## ⛔ 이 셈의 한계 — **먼저 적는다**
 *
 *   원자료는 **사업장 한 줄에 사람 여럿**이다(가입자수 · 당월고지금액).
 *   그래서 「이 사람이 상한에 걸렸나」는 못 본다. 볼 수 있는 것은
 *   **「이 사업장의 1인당 평균 고지액이 상한에 닿았나」**뿐이다.
 *
 *   ```
 *   ⚠ 평균이 상한에 닿은 사업장 = 사실상 **거의 전원이 상한**인 곳이다
 *     (한 명이라도 낮으면 평균이 내려간다)
 *   → 그래서 이 값은 **덜 세는 쪽으로 틀린다.** 실제 눌린 사람은 이보다 많다
 *   ```
 *   ⛔ 이 문장을 지면에도 적는다. 안 적으면 「21%만 눌렸구나」로 읽힌다.
 *
 * ## ✅ 세는 법이 맞는지 확인하는 법
 *
 *   규모 축(`size-axis.json`)에 **d80abf75 가 낸 값이 이미 있다.** 그것을 다시 세서
 *   맞으면 업종·지역 값도 같은 자로 잰 것이다. **안 맞으면 내 자가 틀린 것이다.**
 *   그 확인을 이 파일이 스스로 한다 — 안 맞으면 결과를 안 쓴다.
 *
 * ## ⚠ 조심할 것
 *
 *   · 파일이 115MB 다. **통째로 메모리에 올리지 않는다** — 줄 단위로 흘린다
 *   · 인코딩이 **CP949(EUC-KR)** 다. UTF-8 로 읽으면 업종명이 깨진다
 *   · 지역은 **숫자 시도코드를 쓰지 않는다.** [12] 가 「전남광주통합특별시」처럼
 *     비표준이 섞여 있다(d80abf75 실측). 주소 문자열 첫 낱말로 가른다
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { Readable } from 'node:stream';

const 뿌리 = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const 원자료 = path.join(뿌리, 'archive', 'raw', 'nps', 'workplaces-latest.csv');
const 낼곳 = path.join(뿌리, 'src', 'data', '100yearmap', 'nps-cap-share.json');

/** 기준소득월액 상한 637만원 × 9% */
export const 상한고지액 = 6370000 * 0.09;

/** 규모 칸 — `size-axis.json` 과 **같은 경계**를 쓴다. 다르면 재현이 안 된다 */
export function 규모칸(가입자수) {
  const n = 가입자수;
  if (n <= 4) return '1~4명';
  if (n <= 9) return '5~9명';
  if (n <= 29) return '10~29명';
  if (n <= 99) return '30~99명';
  if (n <= 299) return '100~299명';
  if (n <= 999) return '300~999명';
  return '1000명 이상';
}

/**
 * 주소 첫 낱말로 시도를 가른다. ⛔ 숫자 코드를 쓰지 않는다(비표준이 섞여 있다).
 * 못 가르면 `null` — **「기타」로 뭉뚱그리지 않는다.** 뭉치면 못 잰 것이 안 보인다.
 */
const 시도표 = [
  ['서울', '서울특별시'], ['부산', '부산광역시'], ['대구', '대구광역시'], ['인천', '인천광역시'],
  ['광주', '광주광역시'], ['대전', '대전광역시'], ['울산', '울산광역시'], ['세종', '세종특별자치시'],
  ['경기', '경기도'], ['강원', '강원특별자치도'], ['충청북', '충청북도'], ['충북', '충청북도'],
  ['충청남', '충청남도'], ['충남', '충청남도'], ['전북', '전북특별자치도'], ['전라북', '전북특별자치도'],
  ['전라남', '전라남도'], ['전남', '전라남도'], ['경상북', '경상북도'], ['경북', '경상북도'],
  ['경상남', '경상남도'], ['경남', '경상남도'], ['제주', '제주특별자치도'],
];
export function 시도고르기(주소) {
  const s = String(주소 ?? '').trim();
  if (!s) return null;
  for (const [앞, 이름] of 시도표) if (s.startsWith(앞)) return 이름;
  return null;
}

/** 한 줄이 셀 수 있는 줄인가. **못 세는 줄은 세지 않고 따로 센다** */
export function 셀수있나(가입자수, 고지액) {
  if (!Number.isFinite(가입자수) || 가입자수 <= 0) return false;
  if (!Number.isFinite(고지액) || 고지액 <= 0) return false;
  return true;
}

/** CSV 한 줄 가르기 — 사업장명에 따옴표·쉼표가 들어 있다 */
export function 줄가르기(줄) {
  const 칸 = [];
  let 지금 = '';
  let 따옴표 = false;
  for (let i = 0; i < 줄.length; i++) {
    const c = 줄[i];
    if (c === '"') { 따옴표 = !따옴표; continue; }
    if (c === ',' && !따옴표) { 칸.push(지금); 지금 = ''; continue; }
    지금 += c;
  }
  칸.push(지금);
  return 칸;
}

function 셀프테스트() {
  const 검사 = [];
  const 확인 = (이름, 실제, 기대) => 검사.push({ 이름, 통과: JSON.stringify(실제) === JSON.stringify(기대) });

  확인('상한은 573,300원', 상한고지액, 573300);
  확인('4명은 1~4명', 규모칸(4), '1~4명');
  확인('5명은 5~9명', 규모칸(5), '5~9명');
  확인('999명은 300~999명', 규모칸(999), '300~999명');
  확인('1000명은 1000명 이상', 규모칸(1000), '1000명 이상');
  확인('⭐ 경계가 size-axis 와 같은 일곱 칸', [...new Set([1, 5, 10, 30, 100, 300, 1000].map(규모칸))].length, 7);

  확인('서울', 시도고르기('서울특별시 강남구'), '서울특별시');
  확인('전북특별자치도', 시도고르기('전북특별자치도 전주시'), '전북특별자치도');
  확인('전라북도 옛 이름도 붙는다', 시도고르기('전라북도 전주시'), '전북특별자치도');
  확인('⭐ 못 가르면 null — 기타로 뭉치지 않는다', 시도고르기('알수없음'), null);
  확인('빈 주소도 null', 시도고르기(''), null);

  확인('사람이 0이면 못 센다', 셀수있나(0, 100), false);
  확인('고지액이 0이면 못 센다', 셀수있나(5, 0), false);
  확인('둘 다 있으면 센다', 셀수있나(5, 100), true);

  확인('쉼표로 가른다', 줄가르기('가,나,다'), ['가', '나', '다']);
  확인('⭐ 따옴표 안 쉼표는 안 가른다', 줄가르기('가,"나,다",라'), ['가', '나,다', '라']);

  for (const c of 검사) console.log(`${c.통과 ? '✅' : '⛔'} ${c.이름}`);
  const 실패 = 검사.filter((c) => !c.통과).length;
  console.log(`\n검사 ${검사.length}개 · 실패 ${실패}개`);
  process.exit(실패 ? 1 : 0);
}

/** 칸 하나에 사람·눌린사람·고지액을 쌓는다 */
const 빈칸 = () => ({ 사업장: 0, 사람: 0, 눌린사람: 0, 고지합: 0 });
function 쌓기(맵, 열쇠, 사람, 고지액, 눌렸나) {
  if (열쇠 == null) return;
  let c = 맵.get(열쇠);
  if (!c) { c = 빈칸(); 맵.set(열쇠, c); }
  c.사업장 += 1;
  c.사람 += 사람;
  c.고지합 += 고지액;
  if (눌렸나) c.눌린사람 += 사람;
}

function 정리(맵, 이름칸) {
  return [...맵.entries()]
    .map(([k, v]) => ({
      [이름칸]: k,
      사업장: v.사업장,
      사람: v.사람,
      눌린사람: v.눌린사람,
      상한걸린비율: Math.round((v.눌린사람 / v.사람) * 1000) / 10,
      월고지액: Math.round(v.고지합 / v.사람),
    }))
    .sort((a, b) => b.사람 - a.사람);
}

async function 본일() {
  if (!fs.existsSync(원자료)) { console.log(`⛔ 원자료가 없다 — ${원자료}`); process.exit(1); }

  const 규모 = new Map();
  const 업종 = new Map();
  const 지역 = new Map();
  let 줄수 = 0;
  let 못센줄 = 0;
  let 지역못가른사람 = 0;
  let 총사람 = 0;
  let 총눌린 = 0;

  /* ⚠ 115MB 다. **줄 단위로 흘린다.** CP949 를 조각째 이어 붙여 푼다 */
  const 디코더 = new TextDecoder('euc-kr', { fatal: false });
  const 흐름 = fs.createReadStream(원자료);
  /* ⚠ readline 은 **스트림**을 받는다. 제너레이터를 그냥 주면 `input.on is not a function` 이 난다 */
  const 푼흐름 = Readable.from(
    (async function* () {
      for await (const 조각 of 흐름) yield 디코더.decode(조각, { stream: true });
    })(),
  );
  const 줄읽기 = readline.createInterface({ input: 푼흐름, crlfDelay: Infinity });

  let 머리 = null;
  let i가입 = -1, i고지 = -1, i업종 = -1, i주소 = -1;
  for await (const 줄 of 줄읽기) {
    if (!머리) {
      머리 = 줄가르기(줄).map((s) => s.trim());
      i가입 = 머리.findIndex((c) => c === '가입자수');
      i고지 = 머리.findIndex((c) => c === '당월고지금액');
      i업종 = 머리.findIndex((c) => c === '사업장업종코드명');
      i주소 = 머리.findIndex((c) => c === '사업장지번상세주소');
      if ([i가입, i고지, i업종, i주소].some((x) => x < 0)) {
        console.log('⛔ 열 이름을 못 찾았다 — 파일 모양이 바뀌었다. 세지 않는다');
        console.log('   찾은 자리', { i가입, i고지, i업종, i주소 });
        process.exit(1);
      }
      continue;
    }
    if (!줄.trim()) continue;
    줄수++;
    const 칸 = 줄가르기(줄);
    const 사람 = Number(칸[i가입]);
    const 고지 = Number(칸[i고지]);
    if (!셀수있나(사람, 고지)) { 못센줄++; continue; }

    /* ⚠ 이름을 숫자로 시작할 수 없다 — 「1인당」은 문법 오류다 */
    const 인당 = 고지 / 사람;
    const 눌렸나 = 인당 >= 상한고지액;
    총사람 += 사람;
    if (눌렸나) 총눌린 += 사람;

    쌓기(규모, 규모칸(사람), 사람, 고지, 눌렸나);
    쌓기(업종, String(칸[i업종] ?? '').trim() || null, 사람, 고지, 눌렸나);
    const 시도 = 시도고르기(칸[i주소]);
    if (시도) 쌓기(지역, 시도, 사람, 고지, 눌렸나);
    else 지역못가른사람 += 사람;
  }

  /* ── ✅ 자가 맞는지 — d80abf75 가 낸 규모 값을 다시 세서 견준다 ────────── */
  const 규모결과 = 정리(규모, '규모');
  let 재현 = { 됐나: null, 말: '견줄 값이 없다' };
  const 견줄파일 = path.join(뿌리, 'src', 'data', '100yearmap', 'size-axis.json');
  if (fs.existsSync(견줄파일)) {
    const 저쪽 = JSON.parse(fs.readFileSync(견줄파일, 'utf8')).자료 ?? [];
    const 어긋남 = [];
    for (const s of 저쪽) {
      const 내것 = 규모결과.find((x) => x.규모 === s.규모);
      if (!내것) { 어긋남.push(`${s.규모} 칸이 내 쪽에 없다`); continue; }
      if (typeof s.상한걸린비율 === 'number' && Math.abs(내것.상한걸린비율 - s.상한걸린비율) > 0.15)
        어긋남.push(`${s.규모} 상한 ${s.상한걸린비율}% vs 내것 ${내것.상한걸린비율}%`);
      if (Math.abs(내것.월고지액 - s.월임금) > 2000)
        어긋남.push(`${s.규모} 고지액 ${s.월임금}원 vs 내것 ${내것.월고지액}원`);
    }
    재현 = { 됐나: 어긋남.length === 0, 말: 어긋남.length ? 어긋남.join(' · ') : `규모 ${저쪽.length}칸 전부 맞았다` };
  }

  console.log(`\n줄 ${줄수.toLocaleString()} · 못 센 줄 ${못센줄.toLocaleString()} · 사람 ${총사람.toLocaleString()}`);
  console.log(`상한에 눌린 사람 ${총눌린.toLocaleString()} (${((총눌린 / 총사람) * 100).toFixed(1)}%)`);
  console.log(`지역을 못 가른 사람 ${지역못가른사람.toLocaleString()} (${((지역못가른사람 / 총사람) * 100).toFixed(1)}%)`);
  console.log(`\n${재현.됐나 === null ? '⬜' : 재현.됐나 ? '✅' : '⛔'} 규모 축 재현 — ${재현.말}`);

  if (재현.됐나 === false) {
    console.log('\n⛔ **내 자가 저쪽과 다르다. 파일을 안 쓴다.** 자를 먼저 맞춘다');
    process.exit(1);
  }

  const 업종결과 = 정리(업종, '업종');
  const 지역결과 = 정리(지역, '지역');

  console.log('\n■ 눌림이 심한 업종 (사람 5만 이상)');
  for (const x of 업종결과.filter((x) => x.사람 >= 50000).sort((a, b) => b.상한걸린비율 - a.상한걸린비율).slice(0, 10))
    console.log(`  ${String(x.상한걸린비율).padStart(5)}%  ${x.월고지액.toLocaleString().padStart(9)}원  ${x.업종}`);

  console.log('\n■ 지역');
  for (const x of [...지역결과].sort((a, b) => b.상한걸린비율 - a.상한걸린비율))
    console.log(`  ${String(x.상한걸린비율).padStart(5)}%  ${x.월고지액.toLocaleString().padStart(9)}원  ${x.지역}`);

  const 낼것 = {
    이름: '국민연금 상한에 눌린 사람 비율',
    출처: { 이름: '국민연금 가입 사업장 내역 2026-06', 이용허락범위: '제한 없음', 데이터셋: '15083277' },
    상한고지액,
    '⚠세는법':
      '사업장 한 줄에 사람이 여럿이라 사람별로는 못 본다. **1인당 평균 고지액이 상한에 닿은 사업장**의 사람을 센다. ' +
      '평균이 닿았다는 것은 거의 전원이 상한이라는 뜻이라, 이 값은 **덜 세는 쪽으로 틀린다.** 실제 눌린 사람은 이보다 많다.',
    '⚠지역가르는법': '숫자 시도코드에 비표준이 섞여 있어(전남광주통합특별시 등) 주소 문자열 첫 낱말로 갈랐다',
    전체: { 사람: 총사람, 눌린사람: 총눌린, 상한걸린비율: Math.round((총눌린 / 총사람) * 1000) / 10 },
    못센것: { 줄: 못센줄, 지역못가른사람 },
    규모축재현: 재현,
    규모: 규모결과,
    지역: 지역결과,
    업종: 업종결과,
  };
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2), 'utf8');
  console.log(`\n✅ ${path.relative(뿌리, 낼곳)} — 업종 ${업종결과.length} · 지역 ${지역결과.length} · 규모 ${규모결과.length}`);
}

if (process.argv.includes('--selftest')) 셀프테스트();
else await 본일();
