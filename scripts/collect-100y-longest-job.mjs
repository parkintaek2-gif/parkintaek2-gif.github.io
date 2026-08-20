/**
 * collect-100y-longest-job.mjs — **가장 오래 다닌 직장을 몇 살에, 왜 그만두었나**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 🔴 2번이 8/15 에 옮겨 준 사장님 말씀 — 「우리는 대입이 전혀 중요하지 않다.
 *   **그 다음, 그 전이 중요한 거다**」. 「그 전」은 /nursery·/kindergarten 으로 열었다.
 *   이것은 **「그 다음」**이다 — 학과 뒤 40년의 끝자락.
 *
 * ⛔ 우리 지면이 지금까지 답한 것은 「어느 학과가 취업이 잘 되나」까지였다.
 *   그 뒤에 무슨 일이 벌어지는지는 한 줄도 없었다. 이 표가 그 자리를 채운다.
 *
 * ── ⚠ 이 자료가 못 가르는 것 — 이것이 제일 중요하다 ─────────────
 * · 「가장 오래 근무한 일자리」는 **마지막 직장이 아니다.** 살면서 제일 오래 다닌 곳이다
 * · 그래서 이 나이는 **은퇴 나이가 아니다.** 그만둔 뒤에도 대부분 다시 일한다
 * · 조사 대상이 **55~79세**다. 지금 서른인 사람의 앞날이 아니라, 이미 겪은 사람들의 기록이다
 * · 「정년퇴직」은 그만둔 이유의 한 칸일 뿐이다. ⛔ 「정년까지 다닌 비율」로 옮겨 적지 않는다 —
 *   이 표의 분모는 «그만둔 사람»이지 «일한 사람 전체»가 아니다
 *
 * 쓰는 법  node scripts/collect-100y-longest-job.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '101';
export const 표들 = { 나이: 'DT_1DE8036S', 까닭: 'DT_1DE8037S' };
/** ⛔ 두 칸이 있다. 넓은 쪽(55~79)과 좁은 쪽(55~64)은 **다른 수**다. 섞지 않는다 */
export const 넓은칸 = '* 55~79세';
export const 좁은칸 = '55~64세';

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** 사람이 읽는 말로 — 표의 칸 이름에 별표가 붙어 있다 */
export const 칸말 = (s) => String(s).replace(/^\*\s*/, '');

/** 몫을 낸다. ⛔ 분모가 0이거나 없으면 낸다고 하지 않는다 */
export function 몫(부분, 전체) {
  if (부분 == null || !전체) return null;
  return Math.round((부분 / 전체) * 1000) / 10;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 별표를 걷어 사람 말로 만든다', 칸말('* 55~79세') === '55~79세');
  본다('③ 두 칸이 다른 것임을 안다', 넓은칸 !== 좁은칸);
  본다('④ 분모가 없으면 몫을 안 낸다', 몫(5, 0) === null && 몫(null, 10) === null);
  본다('⑤ 몫은 한 자리까지', 몫(1, 3) === 33.3);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-longest-job.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const 받기 = async (tbl) => {
    const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=' + KEY
      + `&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&orgId=${ORG}&tblId=${tbl}&prdSe=Y&newEstPrdCnt=1`;
    const j = await (await fetch(u)).json();
    if (!Array.isArray(j)) throw new Error(JSON.stringify(j).slice(0, 150));
    return j;
  };
  const 나이날 = await 받기(표들.나이);
  const 까닭날 = await 받기(표들.까닭);
  const 해 = 나이날[0].PRD_DE;

  /** C1=성별, C2=연령칸 */
  const 골라 = (날, 성, 칸) => 날.filter((x) => x.C1_NM === 성 && x.C2_NM === 칸);
  const 값 = (줄들, 항목) => 수로(줄들.find((x) => x.ITM_NM === 항목)?.DT);

  const 나이칸 = ['30세미만', '30~39세', '40~49세', '50~59세', '60~69세', '70~79세'];
  const 그만둔나이 = (칸) => {
    const 줄 = 골라(나이날, '계', 칸);
    const 전체 = 값(줄, '전체');
    return {
      칸: 칸말(칸),
      평균: 값(줄, '평균이직연령'),
      남자평균: 값(골라(나이날, '남자', 칸), '평균이직연령'),
      여자평균: 값(골라(나이날, '여자', 칸), '평균이직연령'),
      전체천명: 전체,
      나이별: 나이칸.map((n) => {
        const v = 값(줄, n);
        return { 나이: n, 천명: v, 몫: 몫(v, 전체) };
      }).filter((r) => r.천명 != null),
    };
  };

  const 까닭칸 = ['정년퇴직', '권고사직명예퇴직정리해고', '사업부진조업중단휴업폐업',
    '가족을돌보기위해', '건강이좋지않아서', '일을그만둘나이가되었다고생각해서', '기타'];
  const 그만둔까닭 = (칸) => {
    const 줄 = 골라(까닭날, '계', 칸);
    const 전체 = 값(줄, '전체');
    return {
      칸: 칸말(칸), 전체천명: 전체,
      까닭별: 까닭칸.map((c) => {
        const v = 값(줄, c);
        return { 까닭: c, 천명: v, 몫: 몫(v, 전체) };
      }).filter((r) => r.천명 != null).sort((a, b) => b.천명 - a.천명),
    };
  };

  const 낸다 = {
    무엇: '가장 오래 다닌 직장을 몇 살에, 왜 그만두었나',
    만든날: new Date().toISOString().slice(0, 10),
    해,
    출처: { 기관: '국가데이터처', 표: '경제활동인구조사 고령층 부가조사 — 가장 오래 근무한 일자리', 창구: 'KOSIS', orgId: ORG, tblId: `${표들.나이} · ${표들.까닭}` },
    '⚠ 이 자료가 못 가르는 것': [
      '「가장 오래 근무한 일자리」는 마지막 직장이 아닙니다. 살면서 제일 오래 다닌 곳입니다.',
      '그래서 이 나이는 은퇴 나이가 아닙니다. 그만둔 뒤에도 다시 일하는 사람이 많습니다.',
      '조사 대상이 55~79세입니다. 앞날의 예측이 아니라 이미 겪은 사람들의 기록입니다.',
      '「정년퇴직」은 그만둔 이유의 한 칸입니다. 분모가 «그만둔 사람»이라 「정년까지 다닌 비율」로 읽으면 틀립니다.',
      '55~79세와 55~64세는 다른 칸입니다. 두 수를 섞지 마십시오.',
    ],
    넓게: { 나이: 그만둔나이(넓은칸), 까닭: 그만둔까닭(넓은칸) },
    좁게: { 나이: 그만둔나이(좁은칸), 까닭: 그만둔까닭(좁은칸) },
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/longest-job.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  const n = 낸다.넓게.나이, c = 낸다.넓게.까닭;
  console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${해}`);
  console.log(`   ${n.칸} 평균 ${n.평균}세 (남 ${n.남자평균} · 여 ${n.여자평균}) · ${낸다.좁게.나이.칸} 평균 ${낸다.좁게.나이.평균}세`);
  console.log(`   그만둔 까닭 맨 위: ${c.까닭별[0].까닭} ${c.까닭별[0].몫}% · 정년퇴직 ${c.까닭별.find((r) => r.까닭 === '정년퇴직')?.몫}%`);
  const 합 = n.나이별.reduce((s, r) => s + r.천명, 0);
  console.log(`   대조: 나이칸 합 ${합.toFixed(1)} vs 전체 ${n.전체천명} — ${Math.abs(합 - n.전체천명) < 1 ? '맞다' : '⚠ 차이 ' + (합 - n.전체천명).toFixed(1)}`);
}
