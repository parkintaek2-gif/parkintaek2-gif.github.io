/**
 * build-100y-qual-age.mjs — 나이띠별 국가기술자격 응시·합격 (⇒ src/data/100yearmap/qual-age.json)
 *
 * 🔴 왜 — 사장님 「왜 자꾸 대입에 머물러있니」. 8/15 에 자로 재 보니 지면 4,970장 중
 *   **4,927장(99.1%)이 대입 쪽**이었다. 그때 내가 「8/16 첫 일 = /age 넓히기」로 못 박았다.
 *   ⭐ 이 자료는 **위쪽 나이를 연다** — 쉰에도 예순에도 자격을 따는 사람이 몇 명인지 세어 준다.
 *
 * 문 — 공공데이터포털 15037521 국가자격 취득자 관련 통계
 *   InquiryAcquStatisSVC/getAgeList · baseYY=2023 · **이용허락범위 제한 없음**
 *   ⚠ 오퍼 이름을 짐작해 다섯 번 404 를 맞았다. 답은 **내가 8/15 에 만든 문 대장**에 이미 있었다
 *     (docs/3번-데이터-문-대장.tsv 7번 줄). 밖에 묻기 전에 우리 문서를 먼저 본다.
 *
 * ⛔ 이 자료로 하지 않을 것 —
 *   · 「몇 살에 따야 한다」를 쓰지 않는다. 나이를 줄세우지 않는다
 *   · 종목별 합격률로 «쉬운 종목/어려운 종목»을 만들지 않는다 — 응시자가 다르다
 *   · 나이띠별 합격률을 곧바로 견주지 않는다. 나이마다 **어떤 등급에 몰려 있는지**가 다르다
 *
 * 쓰는 법  node scripts/build-100y-qual-age.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼곳 = path.join(뿌리, 'src/data/100yearmap/qual-age.json');
const 기준해 = '2023';

/** ⛔ 우리 최소분모. 이보다 적으면 비율을 안 낸다 */
export const 최소분모 = 30;

export function 열쇠읽기() {
  const m = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/^DATAGO_KEY=(.+)$/m);
  if (!m) throw new Error('DATAGO_KEY 가 .env 에 없다');
  return m[1].trim();   // ⛔ 값을 찍지 않는다
}

export function 줄캐기(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const 칸 = (이름) => (m[1].match(new RegExp(`<${이름}>([^<]*)</${이름}>`)) || [])[1];
    return {
      나이: 칸('age'),
      등급: 칸('grdNm'),
      종목: 칸('jmFldNm'),
      응시: Number(칸('lastRsltExamCnt') ?? 0),
      합격: Number(칸('lastRsltPassCnt') ?? 0),
    };
  });
}

/** 나이띠를 자료에 나온 차례대로 세운다. ⛔ 우리가 순서를 지어내지 않는다 */
export function 나이차례(줄들) {
  const 본것 = [...new Set(줄들.map((r) => r.나이).filter(Boolean))];
  const 수 = (s) => { const m = String(s).match(/\d+/); return m ? Number(m[0]) : 999; };
  return 본것.sort((a, b) => 수(a) - 수(b));
}

export function 묶기(줄들) {
  const 통 = new Map();
  for (const r of 줄들) {
    if (!r.나이) continue;
    const t = 통.get(r.나이) || { 나이: r.나이, 응시: 0, 합격: 0, 종목수: new Set(), 등급: new Map() };
    t.응시 += r.응시; t.합격 += r.합격;
    if (r.종목) t.종목수.add(r.종목);
    if (r.등급) t.등급.set(r.등급, (t.등급.get(r.등급) || 0) + r.응시);
    통.set(r.나이, t);
  }
  return 나이차례(줄들).map((나이) => {
    const t = 통.get(나이);
    const 셀수있나 = t.응시 >= 최소분모;
    const 제일많은등급 = [...t.등급].sort((a, b) => b[1] - a[1])[0];
    return {
      나이,
      응시: t.응시,
      합격: t.합격,
      // ⛔ 분모가 최소분모 미만이면 비율을 안 낸다 — 자료가 스스로 말하게 둔다
      합격률: 셀수있나 ? Number(((t.합격 / t.응시) * 100).toFixed(1)) : null,
      비율을_낼_수_있나: 셀수있나,
      종목수: t.종목수.size,
      가장많이본등급: 제일많은등급 ? 제일많은등급[0] : null,
      가장많이본등급_응시: 제일많은등급 ? 제일많은등급[1] : null,
    };
  });
}

if (process.argv[1] && path.basename(process.argv[1]) === 'build-100y-qual-age.mjs') {
  const key = 열쇠읽기();
  const 기본 = 'http://openapi.q-net.or.kr/api/service/rest/InquiryAcquStatisSVC/getAgeList';
  const 모두 = [];
  let 쪽 = 1, 전체 = null;

  while (true) {
    const u = `${기본}?ServiceKey=${encodeURIComponent(key)}&numOfRows=1000&pageNo=${쪽}&baseYY=${기준해}`;
    const r = await fetch(u);
    const t = await r.text();
    const code = (t.match(/<resultCode>([^<]*)/) || [])[1];
    if (code !== '00') { console.log(`🔴 ${쪽}쪽에서 멈췄다 — resultCode ${code}`); break; }
    if (전체 == null) 전체 = Number((t.match(/<totalCount>([^<]*)/) || [])[1] ?? 0);
    const 줄 = 줄캐기(t);
    if (!줄.length) break;
    모두.push(...줄);
    console.log(`   … ${모두.length}/${전체}`);
    if (모두.length >= 전체) break;
    쪽++;
    if (쪽 > 20) { console.log('🔴 스무 쪽에서 끊었다 — 더 있으면 여기를 늘린다'); break; }
  }

  // ⛔ 「모자란가」만 보지 말고 「넘치는가」도 본다(8/13 에 34,662줄로 부푼 적이 있다)
  if (모두.length !== 전체) console.log(`⚠ 받은 줄 ${모두.length} · API 가 말한 전체 ${전체} — 어긋난다`);

  const 나이 = 묶기(모두);
  const 낼 = {
    무엇인가: '나이띠별 국가기술자격 응시와 합격 — 몇 살에도 따고 있나',
    출처: {
      이름: '한국산업인력공단_국가자격 취득자 관련 통계',
      포털: 'https://www.data.go.kr/data/15037521/openapi.do',
      오퍼: 'InquiryAcquStatisSVC/getAgeList',
      기준연도: 기준해,
      이용허락범위: '이용허락범위 제한 없음',
      받은때: new Date().toISOString().slice(0, 10),
      받은법: '공식 오픈API 를 인증키로 조회. 사이트를 긁지 않았다',
      줄수검산: `${모두.length}줄 — API 의 totalCount ${전체}`,
    },
    '② 어떻게 셌나': {
      무엇을_셈했나: '나이띠마다 그 해의 응시 건수와 합격 건수를 모두 더해 합격률을 냈다',
      분모: '그 나이띠의 **응시 건수**다. 사람 수가 아니다 — 한 사람이 여러 번 볼 수 있다',
      왜_최소분모_30인가: `응시가 ${최소분모}건 미만인 나이띠는 비율을 내지 않는다. 한두 건이 비율을 통째로 흔든다`,
      '가장많이본등급을 함께 내는 까닭': '나이띠마다 어떤 등급에 몰려 있는지가 다르다. 그것을 모르면 합격률만 보고 「이 나이가 잘한다」로 잘못 읽는다',
    },
    '③ 무엇을 못 보여 주나': [
      '⛔ **사람이 아니라 응시 건수**다. 한 사람이 세 번 봤으면 세 건이다',
      '⛔ **나이띠끼리 곧바로 견주면 안 된다.** 나이마다 보는 등급이 다르다 — 기술사가 많은 띠와 기능사가 많은 띠의 합격률은 같은 뜻이 아니다',
      '⛔ **딴 사람만 보이는 자료가 아니다** — 응시와 합격을 다 담는다. 다만 «그 해에 시험을 본 사람»만 있다',
      `⚠ 응시 ${최소분모}건 미만인 띠는 비율을 비워 두었다. 없는 것이 아니라 **못 낸 것**이다`,
      '⚠ 한 해(2023)다. 해마다 달라지는 흐름은 이 자료로 못 본다',
    ],
    '⛔ 쓰지 않는 말': ['몇 살에 따야 한다', '늦었다', '이 나이가 유리하다', '순위', '등수'],
    나이,
  };

  fs.writeFileSync(낼곳, JSON.stringify(낼, null, 1), 'utf8');
  console.log('\n✅ 두었다', path.relative(뿌리, 낼곳));
  for (const r of 나이)
    console.log(`   ${String(r.나이).padEnd(10)} 응시 ${String(r.응시).padStart(7)} · 합격 ${String(r.합격).padStart(6)}` +
      ` · ${r.비율을_낼_수_있나 ? `${r.합격률}%` : '🔴 분모 30 미만 — 비율 안 냄'} · 많이 본 등급 ${r.가장많이본등급 ?? '—'}`);
}
