#!/usr/bin/env node
/**
 * collect-news-desk.mjs — **오늘 신문을 받아 유닛별로 갈라 낸다.**
 * ────────────────────────────────────────────────────────────────────────────
 * [사장님이 정하신 출처 — 2026-09-02]
 *   > 「뉴스 체크해서 넘겨줘. 중앙일보와 매일경제」
 *   > 「**경제는 매일경제, 나머지는 중앙일보** 보란 거였어」
 *   > 「**동아일보 보라**」 · 「**중앙일보 대신**」        ⇒ 나머지는 동아일보
 *   > 「**너는 스타뉴스, 텐아시아도 보고**」               ⇒ 5번 몫은 여기서 찾는다
 *
 *   > 「**매경=서울마켓츠, 매경+동아=백년지도, 텐아시아+스타뉴스=케이컬쳐와이어 정보원**」
 *
 *   ```
 *   매일경제              → 6번 서울마켓츠  ·  3번 백년지도   ← **두 유닛이 함께 본다**
 *   동아일보              → 3번 백년지도
 *   스타뉴스 · 텐아시아    → 5번 K Culture Wire
 *   ```
 *   ⛔ 중앙일보는 **뺀다**(사장님이 동아로 갈라 주셨다). RSS 도 이미 서비스 종료됐다.
 *
 * [왜 자로 만드나]
 *   원래 2번 몫이었고(8/29 지시), 2번이 빠진 뒤 총괄대행(5번)이 이어받는 것을
 *   **2026-09-02 에 내가 빠뜨렸다.** 사장님이 「오늘 안 했지?」로 물으셔서 알았다.
 *   ⛔ 기억에 맡기면 또 빠뜨린다. 그래서 자로 만든다 — 자는 잊지 않는다.
 *
 * [우리 방식대로 고른다]
 *   ⭐ **제목에 «수»가 있는 것을 먼저 올린다.** 우리는 raw data 를 가공하는 회사다.
 *      인터뷰·화보·동정은 수가 없어 우리 지면이 안 된다.
 *   ⛔ 기사의 수를 그대로 옮겨 쓰지 않는다 — **원자료를 받아 다시 센다.**
 *      이 자가 내는 것은 «소재»이고, 「기사가 말한 수」라고 못박아 낸다.
 *
 * [쓰는 법]
 *   node scripts/collect-news-desk.mjs                 오늘 것을 받아 갈라 낸다
 *   node scripts/collect-news-desk.mjs --적는다          archive 에 그날치를 남긴다
 *   node scripts/collect-news-desk.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

/* ⚠ 매경은 «사람 UA» 가 아니면 403 을 준다. 실측으로 확인했다(2026-09-02). */
export const 신문들 = [
  /* 🔴 [2026-09-02 · 사장님] 「매경=서울마켓츠, 매경+동아=백년지도,
     텐아시아+스타뉴스=케이컬쳐와이어 정보원」 — **매경은 두 유닛이 함께 본다.** */
  { 매체: '매일경제', 갈래: '경제·사회·증권', 몫: ['6번', '3번'], 꼴: 'rss',
    주소: ['https://www.mk.co.kr/rss/40300001/', 'https://www.mk.co.kr/rss/30100041/',
      'https://www.mk.co.kr/rss/50400012/', 'https://www.mk.co.kr/rss/50200011/'] },
  { 매체: '동아일보', 갈래: '나머지', 몫: ['3번'], 꼴: 'rss',
    주소: ['https://rss.donga.com/national.xml', 'https://rss.donga.com/culture.xml',
      'https://rss.donga.com/politics.xml'] },
  /* ⚠ 사장님 말씀에 「스타뉴스(매경의 스타투데이)」라고 붙어 있었지만 **둘은 다른 회사다** —
     스타뉴스는 star.mt.co.kr(머니투데이) 계열이고 스타투데이는 매경 계열이다.
     사장님 「둘 중 하나해」 → **스타뉴스로 정했다. 근거는 수다.**
       스타뉴스   2026-09-02 실측 제목 76개 · 수가 든 것 23개
       스타투데이 RSS 경로를 후보 6개에서 «전부 못 찾았다»(게임·사회·증권만 나온다)
     ⛔ 못 찾은 것을 쓴다고 적지 않는다. 경로가 생기면 그때 더한다. */
  { 매체: '스타뉴스', 갈래: 'K컬처', 몫: ['5번'], 꼴: '지면',
    주소: ['https://www.starnewskorea.com/'] },
  { 매체: '텐아시아', 갈래: 'K컬처', 몫: ['5번'], 꼴: '지면',
    주소: ['https://tenasia.hankyung.com/'] },
];

export const 엔티티풀기 = (s) => String(s ?? '')
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '…')
  .replace(/&middot;/g, '·').replace(/&amp;/g, '&')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export function rss읽기(xml) {
  const 나온다 = [];
  for (const m of String(xml ?? '').matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const 제목 = 엔티티풀기((m[1].match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
    const 날 = 엔티티풀기((m[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '');
    const 길 = 엔티티풀기((m[1].match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '');
    if (제목) 나온다.push({ 제목, 날, 길 });
  }
  return 나온다;
}

/** RSS 가 없는 곳은 지면의 h2·h3 에서 제목을 뽑는다 */
export function 지면읽기(html) {
  const 본 = new Set();
  for (const m of String(html ?? '').matchAll(/<h[23][^>]*>([\s\S]{4,300}?)<\/h[23]>/g)) {
    const t = 엔티티풀기(m[1]);
    if (t.length >= 8) 본.add(t);
  }
  return [...본].map((제목) => ({ 제목, 날: '', 길: '' }));
}

/**
 * 제목에 «수»가 있나 — 우리 지면이 될 수 있는지 가리는 첫 체다.
 * ⚠ 이것은 «좋은 기사»를 가리는 자가 아니다. **수가 있는지**만 본다.
 */
export function 수뽑기(제목) {
  const t = String(제목 ?? '');
  const 수 = [];
  /* 12.3% · 1,234명 · 5499만원 · 4.4조 · 100조 · 2만6282명 · 0.53명 */
  for (const m of t.matchAll(/(\d[\d,.]*)\s*(%|％|명|원|만원|억원|억|조원|조|배|건|가구|개|위|세|시간|일|년|개월|kg|MW|p)/g)) {
    수.push(m[0].replace(/\s+/g, ''));
  }
  /* 한글로 쓴 크기말도 본다 — 「역대 최대」·「사상 최대」는 검산 대상이다 */
  const 말 = ['역대 최대', '역대 최고', '사상 최대', '사상 최고', '역대 최저', '사상 최저', '최다', '급증', '급감'];
  const 걸린말 = 말.filter((w) => t.includes(w));
  return { 수, 걸린말, 쓸만한가: 수.length > 0 || 걸린말.length > 0 };
}

async function 받는다(url) {
  try {
    const r = await fetch(url, {
      redirect: 'follow', signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': UA, Accept: 'application/rss+xml,text/xml,text/html,*/*' },
    });
    if (!r.ok) return { 코드: r.status };
    return { 코드: r.status, 글: await r.text() };
  } catch (e) { return { 못쟀다: String(e.message).slice(0, 50) }; }
}

function 자가시험() {
  let 흠 = 0;
  let 잰수 = 0;
  const 본다 = (이름, 참) => { 잰수 += 1; if (참) console.log(`  ✅ ${이름}`); else { console.log(`  🔴 ${이름}`); 흠 += 1; } };

  본다('RSS 에서 제목·날짜를 뽑는다', (() => {
    const r = rss읽기('<item><title>가</title><pubDate>Wed, 02 Sep 2026</pubDate><link>u</link></item>');
    return r.length === 1 && r[0].제목 === '가' && r[0].길 === 'u';
  })());
  본다('CDATA 를 벗긴다',
    rss읽기('<item><title><![CDATA[나다라]]></title></item>')[0].제목 === '나다라');
  /* 🔴 실제로 걸렸던 함정 — 숫자 실체참조를 안 풀면 제목이 &#…; 로 보인다 */
  본다('숫자 실체참조를 푼다', 엔티티풀기('&#49345;&#54408;') === '상품');
  본다('&hellip;·&middot; 를 푼다', 엔티티풀기('가&hellip;나&middot;다') === '가…나·다');
  본다('지면 h2·h3 에서 제목을 뽑는다', (() => {
    const r = 지면읽기('<h3 class="x">아이돌 신곡 1위 올랐다</h3><h2>짧다</h2>');
    return r.length === 1;
  })());
  본다('같은 제목을 두 번 세지 않는다',
    지면읽기('<h3>같은 제목입니다요</h3><h3>같은 제목입니다요</h3>').length === 1);

  본다('% 를 수로 본다', 수뽑기('출산율 28% 낮췄다').수[0] === '28%');
  본다('만원·억·조를 수로 본다', (() => {
    const r = 수뽑기('평균 급여 5499만원, 계약 4.4조');
    return r.수.includes('5499만원') && r.수.includes('4.4조');
  })());
  본다('쉼표 든 수를 본다', 수뽑기('개미 2만6282명 몰렸다').수.length > 0);
  본다('소수점 든 수를 본다', 수뽑기('자녀 0.53명 더 낳았다').수[0] === '0.53명');
  본다('「역대 최대」를 검산 대상으로 잡는다', 수뽑기('지방은행 연체율 역대 최대').걸린말.includes('역대 최대'));
  본다('수도 큰말도 없으면 «쓸만하지 않다»로 본다', 수뽑기('배우 인터뷰 화보 공개').쓸만한가 === false);
  /* ⛔ 사장님이 정하신 출처 구성을 못박는다 */
  본다('출처가 매경(경제)·동아(나머지)·스타뉴스·텐아시아 넷이다', 신문들.length === 4);
  본다('중앙일보를 안 본다', !신문들.some((s) => s.매체.includes('중앙')));
  본다('매경은 6번·3번이 함께 본다', (() => { const m = 신문들.find((s) => s.매체 === '매일경제').몫; return m.includes('6번') && m.includes('3번'); })());
  본다('동아일보는 3번만', (() => { const m = 신문들.find((s) => s.매체 === '동아일보').몫; return m.length === 1 && m[0] === '3번'; })());
  본다('K컬처는 5번 몫이 둘', 신문들.filter((s) => s.갈래 === 'K컬처').length === 2 && 신문들.filter((s) => s.갈래 === 'K컬처').every((s) => s.몫[0] === '5번'));
  본다('몫이 전부 배열이다(한 매체를 여러 유닛이 본다)', 신문들.every((s) => Array.isArray(s.몫)));

  /* ⚠ 세는 수를 손으로 적지 않는다 — 검사를 늘리고 수를 안 고치면 «한 일보다 적게» 적힌다 */
  console.log(흠 ? `\n🔴 자가시험 ${흠}개 흠` : `\n✅ 자가시험 ${잰수}가지 다 지났다`);
  return 흠;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);

  const 오늘 = new Date();            /* ⚠ 이 PC 는 이미 KST 다 */
  const 날문자 = `${오늘.getFullYear()}${String(오늘.getMonth() + 1).padStart(2, '0')}${String(오늘.getDate()).padStart(2, '0')}`;
  console.log(`# 오늘 신문 — ${오늘.toLocaleString('ko-KR')}`);
  console.log('  경제=매일경제(6번) · 나머지=동아일보(3번) · K컬처=스타뉴스·텐아시아(5번)');
  console.log('  ⛔ 아래 수는 «기사가 말한 수»다. 우리 실측이 아니다 — 원자료를 받아 다시 센다.\n');

  const 담은것 = { 잰때: 오늘.toISOString(), 매체별: {} };
  for (const s of 신문들) {
    const 모음 = new Map();
    const 못받은 = [];
    for (const u of s.주소) {
      const r = await 받는다(u);
      if (r.못쟀다 || !r.글) { 못받은.push(`${u} — ${r.못쟀다 ?? 'HTTP ' + r.코드}`); continue; }
      for (const it of (s.꼴 === 'rss' ? rss읽기(r.글) : 지면읽기(r.글))) 모음.set(it.제목, it);
    }
    const 전부 = [...모음.values()].map((it) => ({ ...it, ...수뽑기(it.제목) }));
    const 쓸만한 = 전부.filter((it) => it.쓸만한가);
    담은것.매체별[s.매체] = { 갈래: s.갈래, 몫: s.몫, 받은수: 전부.length, 쓸만한수: 쓸만한.length,
      못받은, 쓸만한: 쓸만한.map(({ 제목, 수, 걸린말, 길 }) => ({ 제목, 수, 걸린말, 길 })) };

    console.log(`## ${s.매체} (${s.갈래}) → ${s.몫.join('·')}   받은 제목 ${전부.length} · 수가 있는 것 ${쓸만한.length}\n`);
    if (!전부.length) console.log('  ⬜ 하나도 못 받았다 — 「없다」가 아니라 «못 쟀다»다');
    for (const it of 쓸만한.slice(0, 12)) {
      const 표 = [...it.수.slice(0, 4), ...it.걸린말].join(' · ');
      console.log(`  · ${it.제목.slice(0, 78)}`);
      if (표) console.log(`      ⭐ ${표}`);
    }
    if (쓸만한.length === 0 && 전부.length > 0) {
      console.log('  ⬜ 수가 든 제목이 없다. ⛔ 억지로 갖다 붙이지 않는다 — 오늘은 없다고 적는다.');
    }
    for (const m of 못받은) console.log(`  ⬜ 못 받았다 — ${m}`);
    console.log('');
  }

  if (process.argv.includes('--적는다')) {
    const 방 = path.join('archive', 'raw', 'newsdesk-korean-press');
    fs.mkdirSync(방, { recursive: true });
    const 길 = path.join(방, `${날문자}.json`);
    fs.writeFileSync(길, JSON.stringify(담은것, null, 2), 'utf8');
    console.log(`✅ 적었다 — ${길}`);
    console.log('  ⚠ 신문 제목은 소급이 안 된다. 그날 안 받으면 그날치는 영영 없다.');
  } else {
    console.log('⚠ 아직 안 적었다. 남기려면 --적는다 를 붙인다.');
  }
}
