/**
 * build-100y-qual-duration.mjs — **「그 자격은 따는 데 얼마나 걸리나」** 자료를 만든다
 *
 * 🔴 왜 — 백년지도가 못 대답하던 물음이다. 「몇 년 걸리나」·「한 번에 붙나」.
 *   ⛔ 등수가 아니다. 등급은 **층**이다. 화면에 「몇 위」를 쓰지 않는다.
 *
 * 받은 곳 — 공공데이터포털 15039800 한국산업인력공단_국가기술자격 취득 관련 현황
 *   InquiryQualRelaPtcondSVC/getQualTimeList · baseYY=2023 · **이용허락범위 제한 없음**
 *   원자료 TSV: 작업공유\자료\qnet-취득\취득_소요기간.tsv  (471줄 · totalCount 와 일치 · 2026-08-15 수집)
 *
 * ⚠ 원자료는 저장소 밖에 있다(외장 아님, 작업공유). 없으면 **만들지 않고 멈춘다** — 지어내지 않는다.
 *
 * 쓰는 법  node scripts/build-100y-qual-duration.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
const 원자료 = 'C:/Users/USER/Desktop/작업공유/자료/qnet-취득/취득_소요기간.tsv';
const 낼곳 = path.join(뿌리, 'src', 'data', '100yearmap', 'qual-duration.json');

/** ⛔ 우리 규칙 — 분모 30 미만은 화면에 내지 않는다 */
export const 최소분모 = 30;

export function 가운데값(들) {
  const s = [...들].sort((a, b) => a - b);
  return s.length ? Math.round(s[Math.floor(s.length / 2)]) : null;
}

if (path.basename(process.argv[1] ?? '') === 'build-100y-qual-duration.mjs') {
  if (!fs.existsSync(원자료)) {
    console.log('⛔ 원자료가 없다 —', 원자료);
    console.log('   먼저 받아야 한다. **없는 것을 지어내지 않는다.**');
    process.exit(1);
  }
  const 줄 = fs.readFileSync(원자료, 'utf8').split('\n');
  const H = 줄[0].split('\t');
  const i = Object.fromEntries(H.map((k, n) => [k, n]));
  const 몸 = 줄.slice(1).filter(Boolean).map((l) => l.split('\t'));

  const 모음 = {};
  for (const r of 몸) {
    const g = r[i.grdNm];
    if (!g) continue;
    (모음[g] ??= { 날: [], p1: 0, p2: 0, p3: 0 });
    const d = Number(r[i.accumAcquAvgTermDays] || 0);
    if (d > 0) 모음[g].날.push(d);
    모음[g].p1 += Number(r[i.accumPil_1TimeExamCnt] || 0);
    모음[g].p2 += Number(r[i.accumPil_2TimeExamCnt] || 0);
    모음[g].p3 += Number(r[i.accumPil_3TimeExamCnt] || 0);
  }

  const 등급 = Object.entries(모음).map(([등급, v]) => {
    const 분모 = v.p1 + v.p2 + v.p3;
    const 몫 = (n) => (분모 ? Number(((n / 분모) * 100).toFixed(1)) : null);
    return {
      등급,
      종목수: v.날.length,
      가운데값일: 가운데값(v.날),
      한번에: 몫(v.p1),
      두번: 몫(v.p2),
      세번넘게: 몫(v.p3),
      응시분모: 분모,
      // ⛔ 화면에 낼 수 있나 — 종목이 30 미만이면 «걸린 날»을 못 낸다
      날을_낼_수_있나: v.날.length >= 최소분모,
    };
  }).sort((a, b) => (a.가운데값일 ?? 0) - (b.가운데값일 ?? 0));

  const 낼 = {
    무엇인가: '국가기술자격을 따는 데 걸린 날과, 필기를 몇 번 만에 붙었나 — 등급별',
    출처: {
      이름: '한국산업인력공단_국가기술자격 취득 관련 현황',
      포털: 'https://www.data.go.kr/data/15039800/openapi.do',
      오퍼: 'InquiryQualRelaPtcondSVC/getQualTimeList',
      기준연도: '2023',
      이용허락범위: '이용허락범위 제한 없음',
      받은때: '2026-08-15',
      받은법: '공식 오픈API 를 인증키로 조회. 사이트를 긁지 않았다',
      줄수검산: '471줄 — API 의 totalCount 와 같다',
    },
    셈과한계: {
      '② 어떻게 셌나': {
        걸린날: '종목마다 있는 «누계취득평균소요일수»를 등급별로 모아 **가운데값**',
        '왜 가운데값인가': '17일부터 3,224일까지 퍼져 있어 평균이 끝값에 끌린다',
        몇번만에: '누계 필기 1·2·3회 응시자수를 등급별로 더해 비율. 사람 수 기준이다',
      },
      '③ 무엇을 못 보여 주나': [
        '**종목이 한 표**다 — 응시자 20명 종목과 2만 명 종목이 같은 무게다',
        '원자료가 이미 «평균»이라 한 종목 안의 퍼짐은 사라졌다',
        '🔴 「몇 번 만에」는 **딴 사람들 중의 비율**이다. 끝내 못 딴 사람은 이 표에 없다 — 「절반은 한 번에 붙는다」로 읽으면 거짓이다',
        '「3회 이상」이 한 칸에 뭉쳐 있다 — 화면에는 **«세 번 넘게»**로만 쓴다',
        `종목이 ${최소분모}개 미만인 등급은 «걸린 날»을 내지 않는다(기능장 28종목)`,
      ],
      '⛔ 쓰지 않는 말': ['몇 위', '순위', '등수', '제일 어렵다'],
    },
    등급,
  };

  fs.writeFileSync(낼곳, JSON.stringify(낼, null, 1), 'utf8');
  console.log('✅ 두었다', path.relative(뿌리, 낼곳));
  for (const g of 등급)
    console.log(`   ${g.등급.padEnd(6)} 종목 ${String(g.종목수).padStart(3)} · 가운데값 ${String(g.가운데값일).padStart(5)}일` +
      ` · 한번에 ${g.한번에}% ${g.날을_낼_수_있나 ? '' : '🔴 종목 30 미만 — 날은 안 낸다'}`);
}
