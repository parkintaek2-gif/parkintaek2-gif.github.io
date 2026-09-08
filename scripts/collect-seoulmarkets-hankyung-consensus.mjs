#!/usr/bin/env node
/**
 * collect-seoulmarkets-hankyung-consensus.mjs — 한경컨센서스 **전체목록**을 받는다.
 * ─────────────────────────────────────────────────────────────────────────────
 * 매체: **SeoulMarkets**(금융). 아카이브: `archive/raw/hankyung-consensus/`
 * ⚠ 이름에 매체를 드러낸다 — 나중에 어느 사이트 것인지 아무도 모르면 안 된다.
 *
 * ── 🔴 왜 이렇게 짰나 (2026-09-08 · 5번이 6번 대신 뚫음) ────────────
 * 6번: 「한경컨센서스 크롬 접속이 안 된다. 9222 는 응답하는데 `puppeteer.connect` 가
 *       40초 넘게 멈춘다」. 사장님: 「네가 해봐」 · 「내가 해당 페이지 열어서 로그인해놓음」
 *
 *   1. 포트·탭은 멀쩡했다 — 그러니 「사장님이 크롬을 다시 띄워 주셔야 한다」는 틀렸다.
 *      ⛔ 다만 내가 그때 적은 까닭(「puppeteer-core 23.11.1 ↔ Chrome 152 어긋남」)은
 *        **재 보지 않고 단정한 것이었고, 틀렸다.** 같은 날 17:41 에 재니 connect 는 0.1초였다.
 *        6번이 겪은 40초의 원인은 **못 쟀다** — 재현되지 않는다. 전문은
 *        docs/브라우저가-안-붙을-때.md 에 정정과 함께 있다.
 *      ⇒ 이 자가 `scripts/lib/cdp.mjs` 를 쓰는 까닭은 «판 어긋남» 때문이 아니라,
 *        걸음마다 제한 시각이 있어 «멈추지 않고 죽기» 때문이다.
 *   2. 목록은 `/api/v2/consensus/search/report?page=N&…` 이 준다.
 *      ⛔ 밖에서 curl 로 부르면 `{"message":"인가되지 않은 접근입니다."}` 다.
 *      ⛔ 탭 «안»에서 fetch 해도 같다 — 성공한 요청에는 `Authorization` 머리글이 붙어 있었다.
 *      ⭐ 그래서 **토큰을 만지지 않는다.** 지면이 스스로 낸 요청의 «응답 몸»만 받는다.
 *        쪽 단추를 눌러 지면이 부르게 하고, 그 답을 주워 온다.
 *   3. 🔴 1쪽은 `data` 가 **배열**인데 2쪽부터는 `{"50":{…},"51":{…}}` **번호키 객체**다.
 *      `Array.isArray` 로만 재면 2쪽부터 0줄로 읽힌다 — `줄들로()` 가 둘 다 받는다.
 *
 * ── ⛔ 지키는 것 ─────────────────────────────────────────────
 *   · 사장님 브라우저를 닫지 않는다. 새 탭을 만들어 쓰고 그 탭만 닫는다
 *   · 토큰·비밀번호를 읽거나 옮기지 않는다
 *   · 못 받은 쪽은 **「못 받았다」고 적는다.** 빈 배열로 채우지 않는다 —
 *     빈 값은 「그날 리포트가 없었다」로 잘못 읽힌다
 *
 * 쓰는 법
 *   node scripts/collect-seoulmarkets-hankyung-consensus.mjs
 *   node scripts/collect-seoulmarkets-hankyung-consensus.mjs --일수 90
 *   node scripts/collect-seoulmarkets-hankyung-consensus.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { 새탭에서, 자리잡기, 재기, 응답몸받기, 줄들로, 포트살았나 } from './lib/cdp.mjs';

const 뿌리 = path.resolve(import.meta.dirname, '..');
const 목록주소 = 'https://markets.hankyung.com/consensus';
const 요청무늬 = /\/api\/v2\/consensus\/search\/report\?page=(\d+)/;

/** ⚠ 시각은 KST. 이 PC 가 이미 KST 다 — 9시간을 더하지 않고 toISOString() 도 안 쓴다 */
export function 날꼴(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const 날 = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${날}`;
}

/** 며칠 전 날짜 */
export function 며칠전(일수, 오늘 = new Date()) {
  const d = new Date(오늘.getTime() - Number(일수) * 86400000);
  return 날꼴(d);
}

/**
 * 잰 수인가 — `Number(null) === 0` 이 「못 잼」을 「0」으로 바꾸는 것을 막는다.
 * ⛔ 목표주가 `"0"` 은 «목표를 안 냈다»는 뜻이다. 0원이 아니다.
 */
export function 잰수인가(v) {
  if (v == null) return false;
  if (typeof v === 'string' && v.trim() === '') return false;
  return Number.isFinite(Number(v));
}

/** 목표주가를 읽는다. `"0"`·빈칸은 **null**(안 냈다)로 둔다 — 0원으로 읽지 않는다 */
export function 목표주가(v) {
  if (!잰수인가(v)) return null;
  const n = Number(v);
  return n > 0 ? n : null;
}

/** API 한 줄을 우리 꼴로. ⚠ 칸 이름을 짐작하지 않고 실제 응답에서 확인한 것만 쓴다 */
export function 한줄(r) {
  return {
    보고서번호: 잰수인가(r.REPORT_IDX) ? Number(r.REPORT_IDX) : null,
    제목: String(r.REPORT_TITLE ?? '').replace(/\s+/g, ' ').trim() || null,
    작성자: String(r.REPORT_WRITER ?? '').trim() || null,
    증권사: String(r.OFFICE_NAME ?? '').trim() || null,
    발표일: String(r.REPORT_DATE ?? '').trim() || null,
    갈래: String(r.REPORT_TYPE ?? '').trim() || null,
    종목코드: String(r.BUSINESS_CODE ?? '').trim() || null,
    종목명: String(r.BUSINESS_NAME ?? '').trim() || null,
    업종: String(r.INDUSTRY_NAME ?? '').trim() || null,
    의견: String(r.GRADE_VALUE ?? '').trim() || null,
    목표주가: 목표주가(r.TARGET_STOCK_PRICES),
    이전목표주가: 목표주가(r.OLD_TARGET_STOCK_PRICES),
    PDF: String(r.REPORT_FILEPATH ?? '').trim() || null,
  };
}

/** 목표주가가 오른 건가 — 둘 다 잰 값일 때만 판정한다. ⛔ 못 재면 null */
export function 목표움직임(줄) {
  if (줄.목표주가 == null || 줄.이전목표주가 == null) return null;
  if (줄.목표주가 > 줄.이전목표주가) return '올림';
  if (줄.목표주가 < 줄.이전목표주가) return '내림';
  return '그대로';
}

async function 받아오기({ 일수 }) {
  const 상태 = await 포트살았나();
  if (!상태.살았나) {
    console.log(`🔴 9222 가 응답하지 않습니다 — ${상태.왜}`);
    console.log('   ⭐ 사장님 크롬이 «원격디버깅 포트 없이» 떠 있는 것입니다.');
    console.log('   ✅ 크롬을 완전히 닫고 --remote-debugging-port=9222 로 다시 띄웁니다.');
    console.log('   ⛔ 이 경우가 아니라 «포트는 되는데 멈추는» 것이면 puppeteer 를 쓰지 마십시오 —');
    console.log('      까닭과 대안이 docs/브라우저가-안-붙을-때.md 에 있습니다.');
    process.exit(1);
  }
  console.log(`✅ 크롬에 붙었다 — ${상태.크롬}`);

  const 끝날 = 날꼴();
  const 첫날 = 며칠전(일수);

  return 새탭에서(목록주소, async (붙음) => {
    await 붙음.보내기('Network.enable');
    const { 모은것 } = 응답몸받기(붙음, 요청무늬, (u) => Number(요청무늬.exec(u)[1]));

    await 자리잡기(붙음, { 최대: 25000, 조용히: 1500 });
    await new Promise((r) => setTimeout(r, 1200));

    const 첫쪽 = 모은것.get(1);
    if (!첫쪽 || 첫쪽.못받음) throw new Error(`1쪽을 못 받았다 — ${첫쪽?.못받음 ?? '응답이 아예 없다'}`);
    const 마지막쪽 = Number(첫쪽.last_page);
    const 총건수 = Number(첫쪽.total);
    console.log(`   목록 총 ${총건수}건 · ${마지막쪽}쪽 · 쪽당 ${첫쪽.per_page}`);
    console.log(`   ⚠ 이 창은 지면이 정한 것이다 — 화면에 뜬 값은 ${첫쪽.path ? '주소의 fromDate/toDate' : '기본값'} 이다`);

    /**
     * 쪽 넘김 — **「빠진 쪽을 채울 때까지」** 돈다. 쪽마다 한 번씩 세지 않는다.
     *
     * 🔴 [2026-09-08] 여기서 두 번 틀렸다. 둘 다 «화면을 안 보고 짐작해서» 틀렸다.
     *
     *   ① 첫 판 — **무한 되돌이.** 「다음」을 누른 뒤 `쪽 -= 1; continue` 를 해서
     *      for 의 `쪽 += 1` 과 맞물려 같은 쪽을 영원히 다시 걸었다. 7분을 돌고 답이 없었다.
     *   ② 둘째 판 — 시도를 3번으로 막아 안 죽게 했는데, **11·12·13쪽을 잃었다.**
     *      까닭을 재 보니 이랬다 —
     *
     *      ```
     *      누르기 전 : 처음,2,3,…,10,다음,끝            부른 쪽 1
     *      「다음」 누른 뒤 : 처음,이전,4,…,10,12,13,끝     부른 쪽 1,11
     *      「11」 찾기 : 11 없음
     *      ```
     *
     *      ⭐ 「다음」은 창만 넘기는 것이 «아니라 11쪽을 실제로 불러온다».
     *        그리고 «지금 보고 있는 쪽»은 링크가 아니어서 「11」 단추가 아예 없다.
     *        (1쪽에 「1」이 없는 것과 같은 규칙이다 — 그것을 봤는데도 안 이었다.)
     *      ⛔ 그래서 「단추를 눌렀나」로 성공을 판정하면 **이미 받은 쪽을 못 받았다고 적는다.**
     *
     * ✅ 그러니 판정은 «자료가 들어왔나»로만 한다. 누르는 것은 수단일 뿐이다.
     *   빠진 쪽 가운데 가장 작은 것을 겨누고, 그 단추가 없으면 「다음」·「끝」으로 옮긴다.
     *   한 바퀴에 한 쪽이라도 늘면 계속하고, 아무것도 안 늘면 그만둔다.
     */
    const 최대바퀴 = 마지막쪽 * 3 + 10;
    let 헛바퀴 = 0;
    for (let 바퀴 = 0; 바퀴 < 최대바퀴; 바퀴 += 1) {
      const 빠진 = [];
      for (let 쪽 = 1; 쪽 <= 마지막쪽; 쪽 += 1) {
        const v = 모은것.get(쪽);
        if (!v || v.못받음) 빠진.push(쪽);
      }
      if (!빠진.length) break;
      const 겨눔 = 빠진[0];
      const 있던수 = 모은것.size;

      const 무엇을눌렀나 = await 재기(붙음, `(() => {
        const 통 = document.querySelector('.paging');
        if (!통) return '쪽넘김이 없다';
        const 것들 = [...통.querySelectorAll('a, button')];
        const 숫자 = 것들.filter((x) => x.innerText.trim() === '${겨눔}');
        if (숫자.length) { 숫자[숫자.length - 1].click(); return '${겨눔}'; }
        /* 겨눈 쪽이 앞이면 「이전」, 뒤면 「다음」으로 옮긴다 */
        const 보이는수 = 것들.map((x) => Number(x.innerText.trim())).filter((n) => Number.isInteger(n));
        const 최대보이는 = 보이는수.length ? Math.max(...보이는수) : 0;
        const 이름 = ${겨눔} > 최대보이는 ? 'next' : 'prev';
        const 옮김 = 통.querySelector('.btn-page-' + (이름 === 'next' ? 'next' : 'prev'))
          || 것들.find((x) => x.innerText.trim() === (이름 === 'next' ? '다음' : '이전'));
        if (옮김) { 옮김.click(); return 이름 === 'next' ? '다음' : '이전'; }
        const 끝 = 통.querySelector('.btn-page-end') || 것들.find((x) => x.innerText.trim() === '끝');
        if (끝) { 끝.click(); return '끝'; }
        return '누를 것이 없다';
      })()`);

      await new Promise((r) => setTimeout(r, 2000));
      if (모은것.size === 있던수) await new Promise((r) => setTimeout(r, 1500));

      if (모은것.size > 있던수) {
        헛바퀴 = 0;
        const 새로 = [];
        for (let 쪽 = 1; 쪽 <= 마지막쪽; 쪽 += 1) if (모은것.has(쪽) && 빠진.includes(쪽)) 새로.push(쪽);
        process.stdout.write(`   받음 ${새로.join(',')} — 남은 쪽 ${빠진.length - 새로.length} (「${무엇을눌렀나}」 눌러서)\n`);
      } else {
        헛바퀴 += 1;
        if (헛바퀴 >= 4) {
          process.stdout.write(`   🔴 네 바퀴 동안 한 쪽도 안 늘었다 — 여기서 멈춘다 (마지막에 「${무엇을눌렀나}」)\n`);
          break;
        }
      }
    }

    const 못받은쪽 = [];
    for (let 쪽 = 1; 쪽 <= 마지막쪽; 쪽 += 1) {
      const v = 모은것.get(쪽);
      if (!v || v.못받음) 못받은쪽.push(쪽);
    }

    const 줄 = [];
    const 본쪽 = [];
    for (let 쪽 = 1; 쪽 <= 마지막쪽; 쪽 += 1) {
      const v = 모은것.get(쪽);
      if (!v || v.못받음) continue;   /* 못 받은 쪽은 위에서 이미 셌다 */
      const 것들 = 줄들로(v.data).map(한줄).filter((x) => x.보고서번호 != null);
      if (!것들.length) { if (!못받은쪽.includes(쪽)) 못받은쪽.push(쪽); continue; }
      본쪽.push(쪽);
      줄.push(...것들);
    }

    /* 같은 보고서가 두 번 들어오면 하나로. ⚠ 「몇 건 지웠다」를 적는다 */
    const 본것 = new Map();
    for (const x of 줄) if (!본것.has(x.보고서번호)) 본것.set(x.보고서번호, x);
    const 모음 = [...본것.values()].sort((a, b) => b.보고서번호 - a.보고서번호);

    return {
      지은때: new Date().toLocaleString('ko-KR'),
      출처: `${목록주소} (api/v2/consensus/search/report · 지면이 낸 요청의 응답)`,
      받은법: 'CDP 직결 — puppeteer 를 안 쓴다. 까닭은 docs/브라우저가-안-붙을-때.md',
      화면창: { 첫날, 끝날, 일수: Number(일수) },
      목록총건수: 총건수,
      쪽수: 마지막쪽,
      본쪽수: 본쪽.length,
      못받은쪽,
      받은건수: 모음.length,
      겹쳐서지운건수: 줄.length - 모음.length,
      줄들: 모음,
    };
  });
}

/* ── 자가시험 ────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 시험 = [];
  const 재다 = (이름, 참) => 시험.push([이름, !!참]);

  재다('잰수인가 — null 은 못 잼', 잰수인가(null) === false);
  재다('잰수인가 — 빈 문자열은 못 잼', 잰수인가('') === false);
  재다('잰수인가 — "0" 은 잰 값이다', 잰수인가('0') === true);
  재다('목표주가 — "0" 은 안 냈다(null). 0원이 아니다', 목표주가('0') === null);
  재다('목표주가 — 빈칸도 null', 목표주가('') === null);
  재다('목표주가 — "125000" 은 125000', 목표주가('125000') === 125000);

  const 보기 = 한줄({
    REPORT_IDX: 652204, OFFICE_NAME: '유안타증권', REPORT_TITLE: 'YUANTA   |   Daily',
    REPORT_WRITER: '이환욱', REPORT_DATE: '2026-09-08', REPORT_TYPE: 'MA',
    TARGET_STOCK_PRICES: '0', OLD_TARGET_STOCK_PRICES: '0', BUSINESS_CODE: '', BUSINESS_NAME: '',
  });
  재다('한줄 — 제목의 겹빈칸을 하나로 줄인다', 보기.제목 === 'YUANTA | Daily');
  재다('한줄 — 빈 종목코드는 null', 보기.종목코드 === null);
  재다('한줄 — 목표주가 "0" 은 null', 보기.목표주가 === null);
  재다('목표움직임 — 못 재면 null', 목표움직임(보기) === null);
  재다('목표움직임 — 오르면 올림', 목표움직임({ 목표주가: 100, 이전목표주가: 90 }) === '올림');
  재다('목표움직임 — 내리면 내림', 목표움직임({ 목표주가: 80, 이전목표주가: 90 }) === '내림');
  재다('목표움직임 — 같으면 그대로', 목표움직임({ 목표주가: 90, 이전목표주가: 90 }) === '그대로');

  /* 🔴 이 자를 만든 까닭 — 2쪽부터 data 가 번호키 객체다 */
  재다('줄들로 — 1쪽 꼴(배열)', 줄들로([{ REPORT_IDX: 1 }]).length === 1);
  재다('줄들로 — 2쪽 꼴(번호키 객체)', 줄들로({ 50: { REPORT_IDX: 2 }, 51: { REPORT_IDX: 3 } }).length === 2);

  재다('날꼴 — 열 글자', 날꼴(new Date(2026, 8, 8)) === '2026-09-08');
  재다('며칠전 — 31일 전', 며칠전(31, new Date(2026, 8, 8)) === '2026-08-08');
  /* ⚠ toISOString 은 UTC 다. 새벽에 날이 하루 어긋난다 — 그것을 안 쓴다는 것을 시험으로 굳힌다 */
  재다('날꼴 — 새벽 0시 30분에도 그날이다', 날꼴(new Date(2026, 8, 8, 0, 30)) === '2026-09-08');

  const 틀린것 = 시험.filter(([, ok]) => !ok);
  for (const [이름, ok] of 시험) console.log(`  ${ok ? '✅' : '⛔'} ${이름}`);
  console.log(`\n자가시험 ${시험.length}건 · 어긋난 것 ${틀린것.length}건`);
  process.exit(틀린것.length ? 1 : 0);
}

/**
 * ⚠ 이 자를 **불러 쓰기만** 했는데 몸통이 도는 것을 막는다.
 *   윈도에서 `import.meta.url` 과 `process.argv[1]` 의 꼴이 어긋나는 판이 있어
 *   파일 이름으로 견준다.
 */
const 나를직접돌렸나 = !!process.argv[1]
  && path.basename(process.argv[1]) === path.basename(new URL(import.meta.url).pathname);
if (나를직접돌렸나 && !process.argv.includes('--자가시험')) {
  const i = process.argv.indexOf('--일수');
  const 일수 = i > 0 ? Number(process.argv[i + 1]) : 31;
  const 답 = await 받아오기({ 일수 });

  const 낼곳 = path.join(뿌리, 'archive/raw/hankyung-consensus');
  fs.mkdirSync(낼곳, { recursive: true });
  const 이름 = path.join(낼곳, `consensus-${날꼴()}.json`);
  fs.writeFileSync(이름, JSON.stringify(답, null, 2), 'utf8');

  console.log('');
  console.log(`✅ ${답.받은건수}건 받았다 — 목록이 말한 총건수 ${답.목록총건수}건`);
  if (답.겹쳐서지운건수) console.log(`   겹쳐서 지운 것 ${답.겹쳐서지운건수}건`);
  if (답.못받은쪽.length) {
    console.log(`   🔴 못 받은 쪽 ${답.못받은쪽.length}개 — ${답.못받은쪽.join(', ')}`);
    console.log('   ⛔ 이것을 「그만큼 리포트가 없다」로 읽지 마십시오. 못 받은 것입니다.');
  } else {
    console.log('   ✅ 못 받은 쪽 없음');
  }
  const 증권사 = new Set(답.줄들.map((x) => x.증권사).filter(Boolean));
  const 목표낸것 = 답.줄들.filter((x) => x.목표주가 != null).length;
  console.log(`   증권사 ${증권사.size}곳 · 목표주가를 낸 것 ${목표낸것}건 (${(목표낸것 / 답.받은건수 * 100).toFixed(1)}%)`);
  console.log(`   → ${path.relative(뿌리, 이름)}`);
}
