#!/usr/bin/env node
/**
 * collect-datago-catalogue.mjs — **공공데이터포털 오픈API 목록을 «로그인 없이» 긁는다.**
 * (5번 · 총괄 · 2026-09-04)
 *
 * ── 왜 이 자가 생겼나 ────────────────────────────────────────
 * 사장님 지시: **「데이터수집을 대폭 늘려라」** · 그리고 개발계정 목록 주소를 주셨다.
 *
 * ⭐ 그런데 **목록 화면(내 신청 내역)은 로그인이 필요하고, 지금 크롬을 못 쓴다.**
 *   (프로필 복사가 권한 분류기에 막혔다 — 우회하지 않았다)
 *
 * ⭐ 그래서 «남의 자료가 아니라 우리 자료»로 같은 물음에 답한다 —
 *   **카탈로그는 로그인이 필요 없다.** 그리고 계정 인증키는 하나이므로,
 *   카탈로그에서 후보를 모아 놓으면 그 뒤 «찔러 보기»만으로 승인 여부를 안다.
 *   (`scripts/watch-approvals.mjs` 가 그 찔러 보기다 — 지금 15건만 알고 있다)
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **총건수를 화면에서 읽어 와 «받은 수»와 나란히 적는다.** 「52건 중 52건」처럼.
 *   그러지 않으면 절반만 받아 놓고 전부라고 믿게 된다 (문화포털에서 실제로 그랬다).
 * ⛔ **빈 화면에서 항목을 지어내지 않는다.** 0건이면 0건으로 적는다.
 * ⛔ 같은 자료가 여러 낱말에 걸린다 — **자료번호로 겹침을 없앤다.** 합계를 부풀리지 않는다.
 * ⛔ 낱말 하나가 0건이면 그 낱말을 «지우지 않고» 0으로 남긴다. 못 찾은 것도 결과다.
 * ⚠ 사이트를 헷갈리지 않는다 — 낱말마다 «어느 유닛 몫»인지 붙여 둔다.
 *
 * 쓰는 법
 *   node scripts/collect-datago-catalogue.mjs --selftest
 *   node scripts/collect-datago-catalogue.mjs --받는다
 *   node scripts/collect-datago-catalogue.mjs --받는다 --낱말=영화
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 오늘 = (() => {
  /* ⛔ toISOString 은 UTC 다 — 새벽에 하루가 어긋난다. 이 PC 는 이미 KST 다 */
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();
const 낼방 = path.join(ROOT, 'archive', 'raw', 'datago-catalogue', 오늘);

export const 한쪽에 = 100;   /* 실측 — 100 을 주면 100 까지 온다 (50 을 주면 50 에서 잘린다) */

/**
 * 찾을 낱말과 «어느 유닛 몫인가».
 * ⚠ 낱말은 사장님이 정해 주신 네 사이트의 범위에서 왔다. 지어낸 것이 아니다 —
 *   SeoulMarkets(금융) · K Culture Wire(K컬처) · 백년지도(교육) · KLifeMap(사람).
 * ⬜ 낱말이 겹치는 것은 일부러 그대로 둔다 — 겹침은 자료번호로 없앤다.
 */
export const 낱말들 = [
  { 낱말: '영화', 몫: '5번', 왜: '박스오피스·영화인 — 이미 받은 것과 겹치는지 본다' },
  { 낱말: '공연', 몫: '5번', 왜: 'KOPIS 밖의 공연 자료' },
  { 낱말: '방송', 몫: '5번', 왜: '편성·시청률 — 우리가 못 쥔 축' },
  { 낱말: '한류', 몫: '5번', 왜: '해외 반응 — 우리 손님이 영어권이다' },
  { 낱말: '관광', 몫: '5번', 왜: '입국·방문 — K컬처 유입의 대리 지표' },
  { 낱말: '도서관', 몫: '5번', 왜: '대출 자료 = 사람이 실제로 읽은 것' },
  { 낱말: '주식', 몫: '6번', 왜: '시세·발행 — 이미 받은 것 확인' },
  { 낱말: '채권', 몫: '6번', 왜: '금리 축 — KRX 채권시세 밖에 무엇이 있나' },
  { 낱말: '외환', 몫: '6번', 왜: 'FX 축 — 우리가 쥔 것은 파생상품시세뿐이다' },
  { 낱말: '금융', 몫: '6번', 왜: '금융공공기관 포털과 겹치는지' },
  { 낱말: '기업', 몫: '6번', 왜: '재무 밖의 «사람» 자료를 찾는다' },
  { 낱말: '대학', 몫: '3번', 왜: '학과·취업률 — 백년지도 본체' },
  { 낱말: '취업', 몫: '3번', 왜: '취업률·이직' },
  { 낱말: '학교', 몫: '3번', 왜: '초중고 — 나이 축의 앞쪽' },
  { 낱말: '장학', 몫: '3번', 왜: '비용 축 — 아무도 안 센 자리' },
  { 낱말: '자격증', 몫: '3번', 왜: '진로의 갈림길' },
  { 낱말: '인구', 몫: '1번', 왜: '나이·지역 — 사람 축의 바탕' },
  { 낱말: '혼인', 몫: '1번', 왜: '결혼 — KLifeMap 궁합의 바탕 수' },
  { 낱말: '출생', 몫: '1번', 왜: '생일·계절성 — 내가 오늘 쓴 기사의 검산 자료' },
  { 낱말: '의료', 몫: '4번', 왜: '3번이 /medical-cost 로 이미 열었다 — 넓힌다' },
];

/* ── 판단하는 함수들. 여기만 자가시험한다 ────────────────────── */

export function 목록주소(낱말, 쪽) {
  const q = new URLSearchParams({
    dType: 'API', keyword: 낱말, currentPage: String(쪽), perPage: String(한쪽에), sort: 'updtDt',
  });
  return `https://www.data.go.kr/tcs/dss/selectDataSetList.do?${q}`;
}

/**
 * 화면이 말하는 **오픈API 총건수**를 읽는다.
 * ⚠ 화면에는 「(52건)」이 여러 군데 있다 — 파일데이터·표준데이터에도 있다.
 *   그래서 **「오픈API」 라는 말 바로 뒤의 것**만 읽는다. 아무 「건」이나 잡으면 다른 갈래 수를 쓴다.
 */
export function 총건수(html) {
  const m = String(html ?? '').replace(/\s+/g, ' ')
    .match(/오픈API\s*<span>\s*\(([0-9][0-9,]*)건\)/);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

/** `<em>` 로 감싼 낱말 강조를 벗기고 글자만 남긴다 */
export function 글자만(조각) {
  return String(조각 ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/**
 * 목록 화면에서 항목을 뽑는다.
 *
 * ⚠ **자료번호를 «경계»로 쓴다.** `<div class="apply-result-item">` 로 가르려 했더니
 *   안쪽에 같은 이름의 div 가 겹쳐 나와 조각이 어긋났다 — 문화포털·bigdata 에서도 같은 덫을 밟았다.
 *   그래서 `/data/<번호>/openapi.do` 를 만나는 자리에서 자르고, «그 앞»에서 딱지를 찾는다.
 */
export function 쪽에서뽑기(html) {
  const 글 = String(html ?? '');
  const 자리 = [...글.matchAll(/href="\/data\/([0-9]+)\/openapi\.do"\s*>([\s\S]*?)<\/a>/g)];
  const 것들 = [];
  for (let i = 0; i < 자리.length; i += 1) {
    const 번호 = 자리[i][1];
    const 이름 = 글자만(자리[i][2]);
    if (!이름) continue;
    /* 딱지(분류·기관유형·파일꼴)는 링크 «앞»에 있다. 앞 항목까지 넘어가지 않게 창을 좁힌다 */
    const 앞끝 = 자리[i].index;
    const 앞시작 = i > 0 ? 자리[i - 1].index + 자리[i - 1][0].length : Math.max(0, 앞끝 - 1200);
    const 앞 = 글.slice(앞시작, 앞끝);
    const 딱지 = [...앞.matchAll(/class="krds-badge[^"]*"[^>]*>([\s\S]*?)<\/span>/g)]
      .map((m) => 글자만(m[1])).filter(Boolean);
    /* 요약은 링크 «뒤»에 있다 */
    const 뒤 = 글.slice(앞끝, i + 1 < 자리.length ? 자리[i + 1].index : Math.min(글.length, 앞끝 + 1500));
    const 요약m = 뒤.match(/class="apply-result-summary"[^>]*>([\s\S]*?)<\/span>/);
    것들.push({
      자료번호: 번호,
      이름,
      딱지,
      꼴: 딱지.filter((d) => /^(XML|JSON|CSV|XLSX|LINK|ZIP)$/i.test(d)),
      요약: 요약m ? 글자만(요약m[1]).slice(0, 300) : null,
      주소: `https://www.data.go.kr/data/${번호}/openapi.do`,
    });
  }
  return 것들;
}

/** 자료번호로 겹침을 없앤다. ⛔ 낱말마다 센 것을 더하면 합계가 부푼다 */
export function 겹침없애기(것들) {
  const 본것 = new Map();
  for (const x of 것들) if (!본것.has(x.자료번호)) 본것.set(x.자료번호, x);
  return [...본것.values()];
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  참('주소에 낱말이 인코딩돼 들어간다', 목록주소('영화', 1).includes('keyword=%EC%98%81%ED%99%94'));
  참('한쪽에 100 을 쓴다', 목록주소('영화', 1).includes('perPage=100'));
  참('쪽 번호가 들어간다', 목록주소('영화', 3).includes('currentPage=3'));

  const 머리 = '<p class="tit">오픈API <span> (52건) </span></p>';
  참('오픈API 총건수를 읽는다', 총건수(머리) === 52);
  참('쉼표가 든 수도 읽는다',
    총건수('<p class="tit">오픈API <span> (1,234건) </span></p>') === 1234);
  참('⭐ 다른 갈래의 「건」을 안 집는다',
    총건수('<p class="tit">파일데이터 <span> (999건) </span></p>') === null);
  참('없으면 못 쟀다고 한다', 총건수('<p>아무것도 없다</p>') === null);

  const 한쪽 = '<div class="apply-result-item">'
    + '<span class="krds-badge small bg-light-secondary">문화관광</span>'
    + '<span class="krds-badge small bg-light-primary">공공기관</span>'
    + '<span class="krds-badge file-ext-css" data-ext="XML"> XML </span>'
    + '<a href="/data/15095136/openapi.do"><em>영화</em>진흥위원회_<em>영화</em>인 상세정보</a>'
    + '<span class="apply-result-summary">영화인의 상세정보를 제공한다</span></div>';
  const 뽑 = 쪽에서뽑기(한쪽);
  참('한 건을 뽑는다', 뽑.length === 1);
  참('⭐ em 강조를 벗겨 이름을 온전히 만든다', 뽑[0].이름 === '영화진흥위원회_영화인 상세정보');
  참('자료번호를 잡는다', 뽑[0].자료번호 === '15095136');
  참('분류 딱지를 잡는다', 뽑[0].딱지.includes('문화관광'));
  참('파일 꼴을 가려낸다', 뽑[0].꼴.includes('XML'));
  참('요약을 잡는다', 뽑[0].요약 === '영화인의 상세정보를 제공한다');
  참('주소를 만든다', 뽑[0].주소 === 'https://www.data.go.kr/data/15095136/openapi.do');

  참('⛔ 빈 화면에서 지어내지 않는다', 쪽에서뽑기('<div></div>').length === 0);
  참('⛔ 빈 값에도 안 죽는다', 쪽에서뽑기(null).length === 0);

  /* 🔴 앞 항목의 딱지를 끌어오면 분류가 통째로 틀린다 — 두 건으로 확인한다 */
  const 두쪽 = '<span class="krds-badge">가</span><a href="/data/1/openapi.do">첫째 자료</a>'
    + '<span class="krds-badge">나</span><a href="/data/2/openapi.do">둘째 자료</a>';
  const 둘 = 쪽에서뽑기(두쪽);
  참('두 건을 가른다', 둘.length === 2);
  참('⭐ 둘째가 첫째 딱지를 안 끌어온다', 둘[1].딱지.includes('나') && !둘[1].딱지.includes('가'));

  const 겹 = 겹침없애기([{ 자료번호: '1', 이름: 'a' }, { 자료번호: '1', 이름: 'a' }, { 자료번호: '2', 이름: 'b' }]);
  참('겹침을 없앤다', 겹.length === 2);
  참('앞의 것을 남긴다', 겹[0].이름 === 'a');

  참('낱말마다 몫이 붙어 있다', 낱말들.every((x) => /^[1-6]번$/.test(x.몫)));
  참('낱말마다 왜 찾는지가 있다', 낱말들.every((x) => (x.왜 ?? '').length > 5));

  console.log(`\n공공데이터포털 카탈로그를 긁는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

/* ── 실제로 받는다 ────────────────────────────────────────── */
if (process.argv.includes('--받는다')) {
  const 고른낱말 = process.argv.find((a) => a.startsWith('--낱말='))?.split('=')[1];
  const 할것 = 고른낱말 ? 낱말들.filter((x) => x.낱말 === 고른낱말) : 낱말들;
  if (!할것.length) { console.log(`🔴 「${고른낱말}」 은 낱말 목록에 없다`); process.exit(1); }

  fs.mkdirSync(낼방, { recursive: true });
  const 전부 = [];
  const 잰것 = [];

  for (const w of 할것) {
    let 총 = null; const 모은것 = []; let 멈춘까닭 = null;
    for (let p = 1; p <= 60; p += 1) {
      /* eslint-disable no-await-in-loop */
      let r;
      try {
        r = await fetch(목록주소(w.낱말, p), {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0 Safari/537.36' },
        });
      } catch (e) { 멈춘까닭 = `${p}쪽에서 그물이 끊겼다 (${e.code ?? e.message})`; break; }
      if (!r.ok) { 멈춘까닭 = `${p}쪽에서 HTTP ${r.status}`; break; }
      const html = await r.text();
      if (총 === null) 총 = 총건수(html);
      const 것들 = 쪽에서뽑기(html);
      if (!것들.length) { 멈춘까닭 = 멈춘까닭 ?? `${p}쪽이 비었다`; break; }
      모은것.push(...것들);
      if (총 !== null && 모은것.length >= 총) break;
      if (것들.length < 한쪽에) { 멈춘까닭 = 멈춘까닭 ?? `${p}쪽이 마지막이다 (${것들.length}건)`; break; }
      await new Promise((f) => setTimeout(f, 700));   /* 남의 서버다 — 천천히 */
    }
    const 없앤것 = 겹침없애기(모은것);
    잰것.push({ ...w, 총건수: 총, 받은것: 없앤것.length, 멈춘까닭 });
    전부.push(...없앤것.map((x) => ({ ...x, 낱말: w.낱말, 몫: w.몫 })));
    const 몫글 = 총 === null ? '⬜ 총건수를 못 읽었다' : `${없앤것.length}/${총}`;
    console.log(`  ${w.몫}  ${w.낱말.padEnd(4)}  ${몫글}`);
    fs.writeFileSync(path.join(낼방, `${w.낱말}.json`),
      JSON.stringify({ 낱말: w.낱말, 몫: w.몫, 왜: w.왜, 총건수: 총, 받은것: 없앤것.length, 멈춘까닭, 항목: 없앤것 }, null, 2));
  }

  const 모두 = 겹침없애기(전부);
  fs.writeFileSync(path.join(낼방, '_전부.json'), JSON.stringify({
    잰때: new Date().toLocaleString('ko-KR'),
    낱말수: 할것.length,
    낱말마다: 잰것,
    겹침없앤자료수: 모두.length,
    항목: 모두,
  }, null, 2));

  const 합 = 잰것.reduce((a, b) => a + b.받은것, 0);
  console.log(`\n낱말 ${할것.length}개 · 받은 것 ${합}건 · 겹침 없앤 자료 **${모두.length}건**`);
  const 못읽은 = 잰것.filter((x) => x.총건수 === null);
  if (못읽은.length) console.log(`⬜ 총건수를 못 읽은 낱말 ${못읽은.length}개 — 「전부 받았다」고 말할 수 없다`);
  const 빈것 = 잰것.filter((x) => x.받은것 === 0);
  if (빈것.length) console.log(`⬜ 0건인 낱말 — ${빈것.map((x) => x.낱말).join(', ')} (없는 것도 결과다)`);
  console.log(`→ ${path.relative(ROOT, 낼방)}`);
  console.log('\n⭐ 다음 걸음 — 이 목록에서 후보를 골라 «찔러 본다». 승인 여부는 응답이 말한다:');
  console.log('   npm run watch:approvals');
}
