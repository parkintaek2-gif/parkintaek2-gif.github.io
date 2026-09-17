#!/usr/bin/env node
/**
 * collect-imf-pip.mjs — **IMF PIP(Portfolio Investment Positions by Counterpart Economy)**
 * ─────────────────────────────────────────────────────────────────────────
 * 5번 → 6번 (2026-09-16 11:5x 메모) 새 상품 씨앗 — 「어느 나라의 어느 부문이
 * 한국 증권을 얼마나 들고 있나」를 상대국까지 쪼갠 표. 한국시장을 영문으로 이렇게
 * 파는 곳이 없다. 주력(영어판 FnGuide) 한가운데다 — **사람 축이 아니다.**
 *
 * ⚠ 5번 메모의 주소(`PIP/A.KR`)는 **키 순서가 틀렸다** — 그대로 부르면 관측값이
 *   0건이고 지표 설명(주석)만 온다. 2026-09-17 에 DSD 를 직접 받아 확인했다 —
 *   진짜 칸 순서는 **COUNTRY.ACCOUNTING_ENTRY.INDICATOR.SECTOR.COUNTERPART_SECTOR
 *   .COUNTERPART_COUNTRY.FREQUENCY** 다(7칸). 그래서 이 자는 `KOR......A` 꼴을 쓴다.
 *   (5번 메모의 「305행·상대국 63개」는 이 잘못된 키로 나온 «주석 나열» 수였을 것으로
 *   보인다 — 실제로 바로잡은 키로는 한 해에도 4,392행, 상대국(진짜 나라만) 246개가 온다.)
 *
 * ⭐ 헤드라인 지표는 `P_TOTINV_P_USD`(총 포트폴리오 투자, 달러) · SECTOR=S1(전체 경제)
 *   · COUNTERPART_SECTOR=S1(전체 경제) — 상대국별 «총 보유액»이다.
 *   ACCOUNTING_ENTRY=A(Assets) — 한국 거주자가 해외에 들고 있는 것(우리가 파는 각도).
 *
 * ⚠ 다른 시장(JPN·IND·CHN·ARE·SAU)도 시도했다 — **UAE(ARE) 만 리포터로 자료가 없다.**
 *   JPN·IND·CHN·SAU 는 다 낸다(2,400~2,930건씩, 2013~2024). CPIS/PIP 는 자발적 조사라
 *   참여국만 낸다 — UAE 는 참여국이 아니고 「상대국」으로만 남의 표에 등장한다.
 *   ⛔ 「없다」로 억지로 채우지 않는다 — 나라마다 관측값 유무를 실측대로 적는다.
 *   (첫 실측에서 다섯 다 0건으로 나온 적이 있었는데, 그건 Accept 헤더를 빠뜨려 CSV 대신
 *   SDMX-XML 이 와서 CSV 파서가 하나도 못 읽은 것이었다 — API 가 아니라 우리 호출이 틀렸다.)
 *
 * ⚠ **전체 와일드카드(모든 통화·상품 조합)로 받으면 안 된다** — KOR 하나를 2013~ 로
 *   그렇게 받아 보니 **269MB** 가 왔다(문서마다 통째로 반복되는 설명 칸 때문에 부풀었다).
 *   그래서 이 자는 헤드라인 지표(P_TOTINV_P_USD·S1·S1) «하나만» 서버에 지정해서 받는다 —
 *   그래도 12년치가 8~9MB 다. 그 밖의 통화·상품별 세분화가 필요해지면 그때 따로 연다.
 *
 * ⚠ 응답 CSV 는 설명 칸에 «쉼표·줄바꿈이 든 따옴표 문자열»이 섞인다 — 단순 split(',') 로
 *   깨진다. 따옴표를 인식하는 파서를 쓴다.
 *
 *   node scripts/collect-imf-pip.mjs                 KOR + 우리 다섯 시장 받는다
 *   node scripts/collect-imf-pip.mjs --자가시험       자가시험만
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 쌓는곳 = path.join(뿌리, 'archive', 'raw', 'imf-pip');
export const 헤드라인지표 = 'P_TOTINV_P_USD';
export const 시작해 = '2013';

/** 실제로 세는 것: KOR(주력) + 5번이 짚은 다섯 시장 */
export const 시장들 = ['KOR', 'JPN', 'IND', 'CHN', 'ARE', 'SAU'];

/** ⚠ 와일드카드로 다 받지 않는다 — 헤드라인 지표 하나만 서버에 지정해서 받는다(위 주석 참고). */
export function 주소(나라, startPeriod = 시작해) {
  return 'https://api.imf.org/external/sdmx/2.1/data/PIP/' + 나라
    + '.A.' + 헤드라인지표 + '.S1.S1..A'
    + '?startPeriod=' + startPeriod;
}

/** 따옴표·쉼표·줄바꿈이 섞인 SDMX CSV 를 제대로 가른다(단순 split(',') 는 깨진다). */
export function CSV가른다(글) {
  const t = String(글 ?? '');
  const 행들 = [];
  let 칸 = [], 값 = '', 따옴표안 = false;
  for (let i = 0; i < t.length; i += 1) {
    const c = t[i];
    if (따옴표안) {
      if (c === '"') { if (t[i + 1] === '"') { 값 += '"'; i += 1; } else 따옴표안 = false; }
      else 값 += c;
    } else if (c === '"') 따옴표안 = true;
    else if (c === ',') { 칸.push(값); 값 = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i += 1;
      칸.push(값); 값 = ''; 행들.push(칸); 칸 = [];
    } else 값 += c;
  }
  if (값.length || 칸.length) { 칸.push(값); 행들.push(칸); }
  return 행들;
}

/** 관측값(OBS_VALUE)이 있는 줄만 골라, 우리가 쓸 8칸만 남긴 얇은 레코드로 바꾼다. */
export function 관측만골라낸다(글) {
  const 행들 = CSV가른다(글);
  if (!행들.length) return { 것: [], 못읽음: '빈 응답이다' };
  const 머리 = 행들[0];
  const 자리 = (이름) => 머리.indexOf(이름);
  const 칸들 = ['COUNTRY', 'ACCOUNTING_ENTRY', 'INDICATOR', 'SECTOR', 'COUNTERPART_SECTOR',
    'COUNTERPART_COUNTRY', 'FREQUENCY', 'TIME_PERIOD', 'OBS_VALUE'];
  const 자리들 = Object.fromEntries(칸들.map((k) => [k, 자리(k)]));
  if (Object.values(자리들).some((i) => i < 0)) {
    return { 것: [], 못읽음: '머리 칸 가운데 하나를 못 찾았다' };
  }
  const 것 = [];
  for (const 줄 of 행들.slice(1)) {
    const v = 줄[자리들.OBS_VALUE];
    if (v === undefined || v === '') continue;
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    것.push({
      country: 줄[자리들.COUNTRY],
      accountingEntry: 줄[자리들.ACCOUNTING_ENTRY],
      indicator: 줄[자리들.INDICATOR],
      sector: 줄[자리들.SECTOR],
      counterpartSector: 줄[자리들.COUNTERPART_SECTOR],
      counterpartCountry: 줄[자리들.COUNTERPART_COUNTRY],
      timePeriod: 줄[자리들.TIME_PERIOD],
      value: n,
    });
  }
  return { 것 };
}

/** 「진짜 나라」만 남긴다 — IMF 지역·소그룹 코드(숫자 섞임·G0.. ·W0.. 등)는 뺀다. */
export function 진짜나라인가(코드) {
  return /^[A-Z]{3}$/.test(String(코드 ?? ''));
}

/** 헤드라인(총 보유액, 전체경제 대 전체경제) 한 해만 상대국별로 뽑는다. */
export function 헤드라인표(것들, 연도) {
  return 것들
    .filter((r) => r.indicator === 헤드라인지표 && r.sector === 'S1' && r.counterpartSector === 'S1'
      && r.timePeriod === 연도 && 진짜나라인가(r.counterpartCountry))
    .sort((a, b) => b.value - a.value);
}

/* ───────────────────────── 자가시험 ───────────────────────── */
function 자가시험() {
  const 것 = []; const 본다 = (이름, 참) => 것.push({ 이름, 참: !!참 });

  const 칸이름 = ['DATAFLOW', 'COUNTRY', 'ACCOUNTING_ENTRY', 'INDICATOR', 'SECTOR', 'COUNTERPART_SECTOR',
    'COUNTERPART_COUNTRY', 'FREQUENCY', 'TIME_PERIOD', 'OBS_VALUE', 'FULL_DESCRIPTION'];
  const 줄만들기 = (부분) => {
    const 채운것 = { DATAFLOW: 'IMF.STA:PIP(5.0.0)', ...부분 };
    return 칸이름.map((k) => {
      const v = 채운것[k] ?? '';
      return /[,\n"]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(',');
  };
  const 보기 = [
    칸이름.join(','),
    줄만들기({ FULL_DESCRIPTION: '두 줄에 걸친다,\n쉼표도 있다' }),
    줄만들기({ COUNTRY: 'KOR', ACCOUNTING_ENTRY: 'A', INDICATOR: 'P_TOTINV_P_USD', SECTOR: 'S1', COUNTERPART_SECTOR: 'S1', COUNTERPART_COUNTRY: 'USA', FREQUENCY: 'A', TIME_PERIOD: '2024', OBS_VALUE: '630433600000', FULL_DESCRIPTION: '짧은 설명' }),
    줄만들기({ COUNTRY: 'KOR', ACCOUNTING_ENTRY: 'A', INDICATOR: 'P_TOTINV_P_USD', SECTOR: 'S1', COUNTERPART_SECTOR: 'S1', COUNTERPART_COUNTRY: 'GX031', FREQUENCY: 'A', TIME_PERIOD: '2024', OBS_VALUE: '80823800000' }),
    줄만들기({ COUNTRY: 'KOR', ACCOUNTING_ENTRY: 'A', INDICATOR: 'P_TOTINV_P_USD', SECTOR: 'S1', COUNTERPART_SECTOR: 'S1', COUNTERPART_COUNTRY: 'JPN', FREQUENCY: 'A', TIME_PERIOD: '2024', OBS_VALUE: '29246900000' }),
    줄만들기({ COUNTRY: 'KOR', ACCOUNTING_ENTRY: 'A', INDICATOR: 'P_TOTINV_P_USD', SECTOR: 'S1', COUNTERPART_SECTOR: 'S1', COUNTERPART_COUNTRY: 'JPN', FREQUENCY: 'A', TIME_PERIOD: '2023', OBS_VALUE: '25000000000' }),
  ].join('\n');

  const 가른것 = CSV가른다(보기);
  본다('따옴표 속 쉼표·줄바꿈을 하나의 칸으로 본다', 가른것[1][10] === '두 줄에 걸친다,\n쉼표도 있다');
  본다('머리 + 데이터 다섯 줄, 합쳐 여섯 줄로 갈린다', 가른것.length === 6);

  const r = 관측만골라낸다(보기);
  본다('못읽음이 없다', r.못읽음 === undefined);
  본다('관측값 없는 첫 줄은 버린다(설명만 있던 줄)', r.것.length === 4);
  본다('USA 630,433,600,000 을 수로 읽는다', r.것.find((x) => x.counterpartCountry === 'USA')?.value === 630433600000);

  본다('빈 글은 못읽음', 관측만골라낸다('').못읽음 !== undefined);
  본다('머리 칸이 없으면 못읽음', 관측만골라낸다('a,b,c\n1,2,3').못읽음 !== undefined);

  본다('GX031(지역 집계) 은 나라가 아니다', 진짜나라인가('GX031') === false);
  본다('W00(세계 집계) 은 나라가 아니다', 진짜나라인가('W00') === false);
  본다('USA·JPN 은 나라다', 진짜나라인가('USA') && 진짜나라인가('JPN'));

  const 헤드 = 헤드라인표(r.것, '2024');
  본다('헤드라인표는 그 해 것만, 집계코드는 뺀다', 헤드.length === 2
    && 헤드.every((x) => x.counterpartCountry !== 'GX031'));
  본다('헤드라인표는 큰 값이 앞이다', 헤드[0].counterpartCountry === 'USA');

  const 진 = 것.filter((x) => !x.참);
  console.log('■ 자가시험 ' + (것.length - 진.length) + '/' + 것.length);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  return 진.length === 0;
}

/* ───────────────────────── 실행 ───────────────────────── */
async function 받는다(나라) {
  /* 🔴 이 Accept 헤더가 없으면 CSV 대신 SDMX-XML 이 온다 — 그러면 우리 CSV 파서가
     관측값을 하나도 못 읽고 «관측값 0건»으로 잘못 읽는다(2026-09-17 에 겪었다). */
  const r = await fetch(주소(나라), {
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
  mkdirSync(쌓는곳, { recursive: true });
  const 오늘 = new Date();
  for (const 나라 of 시장들) {
    try {
      const 글 = await 받는다(나라);
      const r = 관측만골라낸다(글);
      if (r.못읽음) { console.log('🔴 ' + 나라 + ' 못 읽었다 — ' + r.못읽음); continue; }
      if (!r.것.length) {
        console.log('⬜ ' + 나라 + '  관측값 0건 — CPIS/PIP 에 리포터로 자료를 안 낸다(상대국으로만 등장)');
        continue;
      }
      const 최근연도 = [...new Set(r.것.map((x) => x.timePeriod))].sort().pop();
      const 헤드 = 헤드라인표(r.것, 최근연도);
      writeFileSync(path.join(쌓는곳, 나라 + '.json'), JSON.stringify({
        _메모: {
          상품: 'IMF PIP(Portfolio Investment Positions by Counterpart Economy) — 상대국별 보유',
          출처: 'IMF — ' + 주소(나라),
          받은때: 오늘.toLocaleString('ko-KR'),
          방향: 'ACCOUNTING_ENTRY=A(Assets) — 이 나라 거주자가 해외에 들고 있는 포트폴리오 투자',
          헤드라인지표: 헤드라인지표 + ' · SECTOR=S1(전체경제) · COUNTERPART_SECTOR=S1(전체경제)',
          소급: '된다 — IMF 가 전체 이력을 그대로 준다',
          아닌것: ['투자 자문이 아니다'],
        },
        관측: r.것,
      }, null, 1), 'utf8');
      console.log('✅ ' + 나라 + '  관측 ' + r.것.length + '건 · 최근연도 ' + 최근연도
        + ' · 상대국(진짜 나라) ' + 헤드.length + '개');
      if (헤드[0]) console.log('   1위 ' + 헤드[0].counterpartCountry + ' = $' + (헤드[0].value / 1e9).toFixed(1) + 'B');
    } catch (e) {
      console.log('🔴 ' + 나라 + ' 못 받았다 — ' + String(e.message).slice(0, 120));
    }
  }
  console.log('');
  console.log('⛔ 「없다」가 아니라 「리포터로 안 낸다」로 적는다 — 상대국으로는 여전히 남의 표에 나온다');
}
