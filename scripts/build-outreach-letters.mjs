#!/usr/bin/env node
/**
 * 증권사별 배포 요청서를 뽑는다.
 *
 *   npm run outreach                       등록번호 없이 (자리를 비워 둔다)
 *   npm run outreach -- --reg="서울,아01234"  등록번호를 넣어 완성본으로
 *
 * ── 왜 스크립트인가 ─────────────────────────────────────────────
 * 28곳에 손으로 건수를 바꿔 넣으면 **반드시 하나는 틀린다.**
 * 「귀사 리포트 5,624건」이라고 써 놓고 다른 회사에 보내면 그 자리에서 끝난다.
 * 건수는 아카이브에서 직접 읽어 넣는다. 사람이 옮겨 적지 않는다.
 *
 * ⚠ 이 스크립트는 **파일만 만든다. 보내지 않는다.**
 *   대외 발송은 사장님 확인 뒤에 한다.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { describeInstitution, INSTITUTIONS, ENTITY_CURRENT_NAME } from '../src/lib/institutions.mjs';

const argv = process.argv.slice(2);
const 등록번호 = argv.find((a) => a.startsWith('--reg='))?.slice(6) ?? null;
const OUT = path.resolve('archive/outreach');

/* 사명은 **지금 이름**으로 부른다. 옛 이름으로 부르면 성의가 없어 보인다. */
const 한글이름 = new Map();
for (const [ko, v] of Object.entries(INSTITUTIONS)) if (!한글이름.has(v.entity)) 한글이름.set(v.entity, ko);
const 이름 = (e) => ENTITY_CURRENT_NAME[e]?.ko ?? 한글이름.get(e) ?? e;

/* 건수를 아카이브에서 직접 읽는다 */
const rows = gunzipSync(readFileSync('archive/index/research.ndjson.gz'))
  .toString('utf8')
  .split('\n')
  .filter(Boolean)
  .map(JSON.parse);

const 건수 = new Map();
const 최신 = new Map();
const 애널 = new Map();
for (const r of rows) {
  const i = describeInstitution(r.h);
  if (!i || i.type !== 'brokerage') continue;
  건수.set(i.entity, (건수.get(i.entity) ?? 0) + 1);
  if (!최신.has(i.entity) || r.d > 최신.get(i.entity)) 최신.set(i.entity, r.d);
  if (r.a) (애널.get(i.entity) ?? 애널.set(i.entity, new Set()).get(i.entity)).add(r.a);
}
const 총계 = rows.length;

/**
 * ⚠⚠ **등록번호가 없으면 「등록했습니다」라고 쓰지 않는다.** (2026-08-05 정정)
 *
 * 원래 두 갈래가 **둘 다** 「인터넷신문으로 등록했습니다」였다. 등록번호가 없을 때도
 * 등록했다고 나갔다 — **아직 등록 전인데 대외 문서에 등록했다고 쓰고 있었다.**
 * 사장님 지시 「아직은 언론사가 아니다 — 그 자격에 기대지 않는다」를 정면으로 어긴 것이고,
 * 자료를 받으려고 상대에게 사실과 다른 말을 한 셈이라 더 나쁘다.
 *
 * 등록번호는 `.env` 의 REG_NO 로 들어온다. **번호가 생긴 뒤에만** 등록을 말한다.
 */
/* 🔴 상호는 **등기부 글자 그대로** 쓴다 — 「주식회사 케이라이프디자인」(한글 「케이」).
   2026-08-06 교합 완료 뒤 잡았다. 그 전까지 문서 곳곳에 「K라이프디자인」으로 적혀 있었고
   이 편지도 그렇게 나갈 뻔했다. 이건 외부로 나가는 글이라 틀리면 되돌릴 수가 없다.
   `scripts/check-legal-name.mjs` 가 지킨다. */
const 등록줄 = 등록번호
  ? `발행 주체는 주식회사 케이라이프디자인이며, 인터넷신문으로 등록했습니다(등록번호 ${등록번호}).`
  : '발행 주체는 주식회사 케이라이프디자인(사업자등록번호 456-87-03384)입니다.';

function 편지(entity) {
  const 회사 = 이름(entity);
  const n = 건수.get(entity) ?? 0;
  const 사람 = 애널.get(entity)?.size ?? 0;

  /* 건수가 적은 곳에는 「많이 갖고 있다」고 하지 않는다. 그쪽이 자기 숫자를 안다. */
  const 실적문단 =
    n >= 500
      ? `2007년부터의 공표 자료를 색인하고 있으며 현재 ${총계.toLocaleString()}건입니다. ` +
        `그중 **귀사 리포트가 ${n.toLocaleString()}건**이고, 애널리스트 ${사람}분의 성함이 함께 기록돼 있습니다.`
      : `2007년부터의 공표 자료를 색인하고 있으며 현재 ${총계.toLocaleString()}건입니다. ` +
        `다만 **귀사 리포트는 ${n.toLocaleString()}건뿐**입니다. 저희가 쓰는 집계 경로에 귀사 자료가 ` +
        `거의 실리지 않기 때문이고, 귀사의 실제 발간량과는 무관합니다. ` +
        `**이 공백을 메우려고 연락드립니다.**`;

  return `제목: [SeoulMarkets] 리서치 자료 영문 매체 배포 요청 — 언론 배포 리스트 등재

${회사} 리서치센터 담당자님께

안녕하십니까.
한국 금융시장을 영문으로 보도하는 데이터 매체 SeoulMarkets(seoulmarkets.com)입니다.
${등록줄}

귀사 리서치센터의 리포트를 언론 배포 대상에 포함해 주시기를 요청드립니다.

■ 저희가 하는 일
국내 증권사가 제시한 목표주가와 투자의견을 영문으로 정규화해 해외 독자에게 전달합니다.
${실적문단}

증권사명은 사명 변경 이력까지 하나의 법인으로 묶었고(예: 이트레이드증권 → 이베스트투자증권
→ LS증권을 한 곳으로 집계), 국문·영문으로 갈려 있던 투자의견 22종 표기를 8단계로 통일했습니다.
국내에도 영문으로도 같은 것을 제공하는 곳이 없습니다.

■ 저희가 쓰는 것과 쓰지 않는 것
  쓰는 것    발행일 · 증권사명 · 종목 · 목표주가 · 투자의견 · 애널리스트명
  쓰지 않는 것  리포트 본문 · 표 · 차트 · PDF — 수집도 하지 않습니다

즉 귀사의 분석을 옮기는 것이 아니라, 귀사가 공표한 사실을 영문으로 전달합니다.
인용할 때는 증권사명과 애널리스트명을 반드시 함께 표기합니다.

■ 귀사에 무엇이 되는지
국내 매체 노출과 달리 미국·싱가포르·홍콩의 영문 독자에게 도달합니다.
애널리스트 성함이 영문 표기로 검색에 남습니다. 저희가 유료 구독을 받지 않으므로
귀사 자료가 특정 독자층에 갇히지 않습니다.

■ 요청드리는 것
  1. 리서치 자료 배포 메일링 리스트에 편집국 주소를 등재
     — 편집국: sibcheongan@gmail.com
  2. 등재에 필요한 서류나 절차가 있으면 안내
     — 요구하시는 조건은 그대로 따르겠습니다

인용 범위나 표기 방식에 조건이 있으시면 말씀해 주십시오. 맞추겠습니다.
회신 주시면 감사하겠습니다.

SeoulMarkets 편집국
sibcheongan@gmail.com
https://seoulmarkets.com
`;
}

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const 정렬 = [...건수.entries()].sort((a, b) => b[1] - a[1]);
let 만든수 = 0;
for (const [entity, n] of 정렬) {
  const f = path.join(OUT, `${String(만든수 + 1).padStart(2, '0')}-${entity}.txt`);
  writeFileSync(f, 편지(entity), 'utf8');
  만든수++;
  console.log(`${String(n).padStart(6)}건  ${이름(entity).padEnd(18)} → ${path.basename(f)}`);
}

console.log('');
console.log(`요청서 ${만든수}통을 ${OUT} 에 만들었다.`);
console.log(등록번호 ? `등록번호 ${등록번호} 를 넣었다.` : '⚠ 등록번호 없이 만들었다. --reg= 로 넣을 수 있다.');
console.log('');
console.log('⚠ 이 스크립트는 파일만 만든다. 보내지 않는다. 발송은 사장님 확인 뒤에 한다.');
