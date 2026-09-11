#!/usr/bin/env node
/**
 * collect-seoulmarkets-hankyung-analysts.mjs — 한경컨센서스의 **애널리스트** 축을 받는다.
 * ─────────────────────────────────────────────────────────────────────────────
 * 매체: **SeoulMarkets**(금융). 아카이브: `archive/raw/hankyung-consensus/`
 *
 * ── 왜 만드나 (2026-09-09 · 사장님 지시 → 5번 → 2번, docs/FnGuide-벤치마킹-서울마켓츠.md Ⅺ절) ──
 * FnGuide 의 FnConsensus(월 165,000원)를 우리가 얼마나 덮는지 재는 자리에서,
 * 한경컨센서스가 **애널리스트별 지면을 따로 두고 있는데 우리가 안 받고 있었다.**
 * 종목 커버(16.5%)는 얇지만 **애널리스트 커버는 두껍다**(181명 · FnGuide 도 이 축으로
 * 랭킹을 판다) — 그래서 얇은 축이 아니라 두꺼운 축으로 간다.
 *
 * ── 어디서 오나 ────────────────────────────────────────────────
 *   지면 https://markets.hankyung.com/analyst 을 열면 스스로 이것을 부른다 —
 *   `/api/v2/analyst/ranking?page=N&periodType=1M&sort={"key":"writerName","orderBy":"asc"}&paginate=true`
 *   ⛔ 밖에서 curl 로 부르면 `{"message":"인가되지 않은 접근입니다."}` 다 — 컨센서스 목록과 같은 병이다.
 *   ⭐ 그래서 **토큰을 만지지 않는다.** 지면이 스스로 낸 요청의 응답 몸만 줍는다(`응답몸받기`).
 *
 * ── ⚠ 이 자료의 성격 — «오늘의 순위표»이지 이력이 아니다 ──────────────
 *   `periodType=1M` 은 **지금 시점 기준 최근 1개월**을 다시 센 값이다(한경컨센서스 목록과
 *   같은 병 — Ⅵ-4 실측: 창을 넓혀도 30일에서 잘린다). 어제 순위와 오늘 순위가 같은 사람이라도
 *   숫자(score·profitPercent)가 창이 하루씩 밀리며 조용히 바뀐다.
 *   ⇒ **매일 스냅숏을 쌓는다.** 하루라도 거르면 그날의 순위·정확도는 «영영» 못 되살린다
 *     (오늘 것만 있고 지난 것은 지면이 안 준다).
 *
 * ── ⛔ 지키는 것 ─────────────────────────────────────────────
 *   · 사장님 브라우저를 닫지 않는다. 새 탭을 만들어 쓰고 그 탭만 닫는다
 *   · 토큰·비밀번호를 읽거나 옮기지 않는다
 *   · 못 받은 쪽은 「못 받았다」고 적는다. 빈 배열로 채우지 않는다
 *
 * 쓰는 법
 *   node scripts/collect-seoulmarkets-hankyung-analysts.mjs
 *   node scripts/collect-seoulmarkets-hankyung-analysts.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { 새탭에서, 자리잡기, 재기, 응답몸받기, 줄들로, 포트살았나 } from './lib/cdp.mjs';

const 뿌리 = path.resolve(import.meta.dirname, '..');
const 지면주소 = 'https://markets.hankyung.com/analyst';
const 요청무늬 = /\/api\/v2\/analyst\/ranking\?page=(\d+)/;

/** ⚠ 시각은 KST. 이 PC 가 이미 KST 다 — toISOString() 은 UTC 라 안 쓴다 */
export function 날꼴(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const 날 = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${날}`;
}

/**
 * 값이 실제 숫자인가 — «없음»과 「0」을 가른다.
 * ⚠ 이 API 는 컨센서스 목록과 달리 «문자열 "0"」이 아니라 진짜 숫자를 준다.
 *   그래도 `undefined`·`null`·`NaN`은 못 잰 것으로 둔다.
 */
export function 잰수인가(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

/** API 한 줄을 우리 꼴로. 칸 이름을 짐작하지 않고 실제 응답에서 확인한 것만 쓴다 */
export function 한줄(r) {
  return {
    순위: 잰수인가(r.rank) ? r.rank : null,
    애널리스트번호: String(r.analystIndex ?? '').trim() || null,
    이름: String(r.name ?? '').trim() || null,
    증권사: String(r.companyName ?? '').trim() || null,
    별점: 잰수인가(r.profitStar) ? r.profitStar : null,
    점수: 잰수인가(r.score) ? r.score : null,
    변동률: 잰수인가(r.profitPercent) ? r.profitPercent : null,
    정확도: 잰수인가(r.accuracyRate) ? r.accuracyRate : null,
  };
}

async function 받아오기() {
  const 상태 = await 포트살았나();
  if (!상태.살았나) {
    console.log(`🔴 9222 가 응답하지 않습니다 — ${상태.왜}`);
    process.exit(1);
  }
  console.log(`✅ 크롬에 붙었다 — ${상태.크롬}`);

  return 새탭에서(지면주소, async (붙음) => {
    await 붙음.보내기('Network.enable');
    const { 모은것 } = 응답몸받기(붙음, 요청무늬, (u) => Number(요청무늬.exec(u)[1]));

    await 자리잡기(붙음, { 최대: 25000, 조용히: 1500 });
    await new Promise((r) => setTimeout(r, 1200));

    const 첫쪽 = 모은것.get(1);
    if (!첫쪽 || 첫쪽.못받음) throw new Error(`1쪽을 못 받았다 — ${첫쪽?.못받음 ?? '응답이 아예 없다'}`);
    const 마지막쪽 = Number(첫쪽.last_page);
    const 총명수 = Number(첫쪽.total);
    console.log(`   애널리스트 총 ${총명수}명 · ${마지막쪽}쪽 · 쪽당 ${첫쪽.per_page}`);

    /* 🔴 [2026-09-12 · 2번] 로그인벽 진단 — 이 지면은 «비로그인»이면 2쪽부터 막는다.
       2026-09-12 06:50 실측: 재부팅 뒤 「작업용 크롬」(9222, 사장님 프로필과 다른 프로필)이
       뜨면서 이 지면의 한경 로그인 세션이 사라졌다. 본문에 「로그인 후 이용해주세요」가
       뜨고, 2쪽 이상으로 가는 단추 자체가 DOM에서 없어진다 — 단추를 못 찾은 것이지
       클릭이 실패한 것이 아니다. 「네 바퀴 안 늘었다」는 증상이지 원인이 아니라서,
       원인까지 갈라 남긴다(직접 fetch(page=2)도 403 「인가되지 않은 접근입니다」 —
       쿠키만으로는 안 되고 로그인 자체가 필요하다는 뜻이다). */
    const 로그인벽 = await 재기(붙음, `(() => document.body.innerText.includes('로그인 후 이용'))()`);
    if (로그인벽) {
      console.log('   🔴 로그인벽 감지 — 「더 많은 애널리스트를 보시려면 로그인 후 이용해주세요」');
      console.log('      2쪽부터는 이 브라우저(9222 작업용 크롬)가 한경닷컴에 로그인돼 있어야 받는다.');
    }

    /* ⭐ 이 지면은 쪽 단추가 숫자로 «다» 보인다(컨센서스 목록의 「다음/이전」 미로가 없다).
       그래도 판정은 «자료가 들어왔나»로만 한다 — 단추를 눌렀다고 성공으로 안 친다. */
    const 최대바퀴 = 마지막쪽 * 3 + 10;
    let 헛바퀴 = 0;
    for (let 바퀴 = 0; 바퀴 < 최대바퀴 && !로그인벽; 바퀴 += 1) {
      const 빠진 = [];
      for (let 쪽 = 1; 쪽 <= 마지막쪽; 쪽 += 1) {
        const v = 모은것.get(쪽);
        if (!v || v.못받음) 빠진.push(쪽);
      }
      if (!빠진.length) break;
      const 겨눔 = 빠진[0];
      const 있던수 = 모은것.size;

      await 재기(붙음, `(() => {
        const els = [...document.querySelectorAll('a,button')];
        const el = els.find(x => x.innerText.trim() === '${겨눔}');
        if (el) { el.click(); return true; }
        const 다음 = els.find(x => x.innerText.trim() === '다음');
        if (다음) { 다음.click(); return true; }
        return false;
      })()`);

      await new Promise((r) => setTimeout(r, 2000));
      if (모은것.size === 있던수) await new Promise((r) => setTimeout(r, 1500));

      if (모은것.size > 있던수) 헛바퀴 = 0;
      else {
        헛바퀴 += 1;
        if (헛바퀴 >= 4) { console.log('   🔴 네 바퀴 동안 한 쪽도 안 늘었다 — 여기서 멈춘다'); break; }
      }
    }

    const 못받은쪽 = [];
    const 줄 = [];
    for (let 쪽 = 1; 쪽 <= 마지막쪽; 쪽 += 1) {
      const v = 모은것.get(쪽);
      if (!v || v.못받음) { 못받은쪽.push(쪽); continue; }
      줄.push(...줄들로(v.data).map(한줄).filter((x) => x.애널리스트번호 != null));
    }

    /* 같은 사람이 두 번 들어오면 하나로 */
    const 본것 = new Map();
    for (const x of 줄) if (!본것.has(x.애널리스트번호)) 본것.set(x.애널리스트번호, x);
    const 모음 = [...본것.values()].sort((a, b) => (a.순위 ?? 999) - (b.순위 ?? 999));

    return {
      지은때: new Date().toLocaleString('ko-KR'),
      출처: `${지면주소} (api/v2/analyst/ranking · 지면이 낸 요청의 응답)`,
      받은법: 'CDP 직결 — puppeteer 를 안 쓴다. 까닭은 docs/브라우저가-안-붙을-때.md',
      기간: '1M (지면 기본값 — 지면이 정한 창, 매일 스냅숏으로 쌓는다)',
      목록총명수: 총명수,
      쪽수: 마지막쪽,
      받은명수: 모음.length,
      겹쳐서지운명수: 줄.length - 모음.length,
      못받은쪽,
      로그인벽: 로그인벽 || null,
      줄들: 모음,
    };
  });
}

/* ── 자가시험 ────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 시험 = [];
  const 재다 = (이름, 참) => 시험.push([이름, !!참]);

  재다('잰수인가 — 숫자는 잰 값', 잰수인가(0) === true);
  재다('잰수인가 — null 은 못 잼', 잰수인가(null) === false);
  재다('잰수인가 — undefined 는 못 잼', 잰수인가(undefined) === false);
  재다('잰수인가 — 문자열은 못 잼 (이 API 는 숫자를 준다)', 잰수인가('8') === false);
  재다('잰수인가 — NaN 은 못 잼', 잰수인가(NaN) === false);

  const 보기 = 한줄({
    rank: 1, analystIndex: '00210006', name: '강민구', companyName: 'IBK투자증권',
    profitStar: 8, score: 8.04, profitPercent: 2.657158, accuracyRate: 0,
  });
  재다('한줄 — 순위를 그대로 읽는다', 보기.순위 === 1);
  재다('한줄 — 애널리스트번호를 문자열로 남긴다', 보기.애널리스트번호 === '00210006');
  재다('한줄 — 이름·증권사', 보기.이름 === '강민구' && 보기.증권사 === 'IBK투자증권');
  재다('한줄 — 정확도 0 은 «0%」다 (숫자라 못 잰 것이 아니다)', 보기.정확도 === 0);
  재다('한줄 — 변동률을 그대로 읽는다', 보기.변동률 === 2.657158);

  const 빈줄 = 한줄({});
  재다('한줄 — 빈 응답은 애널리스트번호가 null', 빈줄.애널리스트번호 === null);
  재다('한줄 — 빈 응답은 순위도 null (0 으로 안 채운다)', 빈줄.순위 === null);

  재다('날꼴 — 열 글자', 날꼴(new Date(2026, 8, 9)) === '2026-09-09');
  /* ⚠ toISOString 은 UTC 다. 새벽에 날이 하루 어긋난다 */
  재다('날꼴 — 새벽 0시 30분에도 그날이다', 날꼴(new Date(2026, 8, 9, 0, 30)) === '2026-09-09');

  /* 🔴 이 자를 만든 까닭과 같은 함정 — data 가 배열이 아닌 꼴로 올 수도 있다는 것을 대비한다 */
  재다('줄들로(cdp.mjs 공용) — 배열 꼴', 줄들로([{ analystIndex: '1' }]).length === 1);
  재다('줄들로(cdp.mjs 공용) — 번호키 객체 꼴도 받는다', 줄들로({ 20: { analystIndex: '2' } }).length === 1);

  const 틀린것 = 시험.filter(([, ok]) => !ok);
  for (const [이름, ok] of 시험) console.log(`  ${ok ? '✅' : '⛔'} ${이름}`);
  console.log(`\n자가시험 ${시험.length}건 · 어긋난 것 ${틀린것.length}건`);
  process.exit(틀린것.length ? 1 : 0);
}

/**
 * ⚠ 이 자를 «불러 쓰기만» 했는데 몸통이 도는 것을 막는다.
 *   윈도에서 `import.meta.url` 과 `process.argv[1]` 의 꼴이 어긋나는 판이 있어
 *   파일 이름으로 견준다.
 */
const 나를직접돌렸나 = !!process.argv[1]
  && path.basename(process.argv[1]) === path.basename(new URL(import.meta.url).pathname);
if (나를직접돌렸나 && !process.argv.includes('--자가시험')) {
  const 답 = await 받아오기();

  const 낼곳 = path.join(뿌리, 'archive/raw/hankyung-consensus');
  fs.mkdirSync(낼곳, { recursive: true });
  const 이름 = path.join(낼곳, `analysts-${날꼴()}.json`);
  fs.writeFileSync(이름, JSON.stringify(답, null, 2), 'utf8');

  console.log('');
  console.log(`✅ ${답.받은명수}명 받았다 — 목록이 말한 총명수 ${답.목록총명수}명`);
  if (답.겹쳐서지운명수) console.log(`   겹쳐서 지운 것 ${답.겹쳐서지운명수}명`);
  if (답.못받은쪽.length) {
    console.log(`   🔴 못 받은 쪽 ${답.못받은쪽.length}개 — ${답.못받은쪽.join(', ')}`);
    if (답.로그인벽) {
      console.log('   🔴 까닭: 로그인벽 — 이 브라우저(9222)가 한경닷컴에 로그인돼 있지 않다.');
      console.log('      한 번 로그인해 두면(사람이 그 탭에서 로그인) 다음 실행부터 다시 받힌다.');
    }
  } else {
    console.log('   ✅ 못 받은 쪽 없음');
  }
  const 증권사 = new Set(답.줄들.map((x) => x.증권사).filter(Boolean));
  console.log(`   증권사 ${증권사.size}곳`);
  console.log(`   → ${path.relative(뿌리, 이름)}`);
}
