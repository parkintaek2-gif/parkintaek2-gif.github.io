#!/usr/bin/env node
/**
 * 🔴🔴🔴 **공공데이터포털의 「이용허락범위」가 «바뀌었나»를 날마다 다시 읽는다.**
 *
 * [2026-10-06 12:5x · 5번] 오늘 이것을 찾았다 —
 *
 *   2026-08-05  주식·지수·파생·채권·증권상품·일반상품 시세 = **「제한 없음」** (그때 사람이 바르게 읽었다)
 *   2026-09-07  포털 «수정일»
 *   2026-10-06  같은 여섯이 **공공누리 제4유형(출처표시 + 상업적 이용금지 + 변경금지)**
 *               「본 데이터는 상업적 목적 여부와 상관 없이 제3자 무단 제공 및 재배포가 엄격히 금지됩니다」
 *
 * **한 달 동안 아무도 몰랐다.** SeoulMarkets 의 한국 시세는 이 여섯에서 나온다.
 *
 * ⛔ 우리 대장은 「한 번 읽고 적어 두는」 꼴이었다. 그래서 바뀌어도 안 울었다.
 *   check-licence-register.mjs 는 «대장에 적힌 판정»을 볼 뿐 «원천»을 다시 안 본다.
 * ⇒ **약관은 바뀐다.** 적어 둔 판정과 지금 원천이 같은지 날마다 맞대어 본다.
 *
 * ⭐ 세는 칸은 셋이다 — 그대로 / 바뀌었다 / **못 읽었다**.
 *   포털이 안 열린 것을 「안 바뀌었다」로 읽으면 다음에 또 한 달을 놓친다.
 *
 * 쓰기 —
 *   node scripts/check-공공데이터-이용허락이-바뀌었나.mjs
 *   node scripts/check-공공데이터-이용허락이-바뀌었나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
export const 뿌리 = path.resolve(여기, '..');
export const 기록길 = path.join(뿌리, 'docs', '공공데이터-이용허락-잰기록.tsv');

/**
 * 우리가 «실제로 쓰는» 공공데이터포털 자료와 **오늘 읽은** 이용허락.
 * ⛔ 새 자료를 모으기 시작하면 여기에도 한 줄 넣는다. 안 넣으면 이 자가 못 본다.
 */
export const 볼것 = [
  { 이름: '주식시세', id: '15094808', 쓰는곳: 'archive/raw/stocks' },
  { 이름: '지수시세', id: '15094807', 쓰는곳: 'archive/raw/indices' },
  { 이름: '파생상품시세', id: '15094802', 쓰는곳: 'archive/raw/derivatives' },
  { 이름: '채권시세', id: '15094784', 쓰는곳: 'archive/raw/bonds' },
  { 이름: '증권상품(ETF·ETN·ELW)', id: '15094806', 쓰는곳: 'archive/raw/etp' },
  { 이름: '일반상품(금·석유)', id: '15094805', 쓰는곳: 'archive/raw/commodities' },
  { 이름: '펀드 표준코드', id: '15094792', 쓰는곳: 'archive/raw/funds' },
  { 이름: 'DART 증자(감자)현황', id: '15060605', 쓰는곳: 'archive/raw/dart-*' },
  { 이름: 'DART 직원현황', id: '15060615', 쓰는곳: 'archive/raw/dart-emp' },
  { 이름: 'DART 임원현황', id: '15060612', 쓰는곳: 'archive/raw/dart-exctv' },
  { 이름: 'DART 기업개황', id: '15034604', 쓰는곳: 'archive/raw/dart-company' },
  /*
   * 🔴 [2026-10-06 16:58 · 5번] **오늘까지 이 자가 안 보던 것이다.**
   * 같은 번호대(15094784~15094808) 일곱은 2026-09-07 에 제4유형(상업적 이용금지)으로 바뀌었는데,
   * 이 하나(15094809)만 「제한 없음」으로 남아 있다. ⛔ 그것이 «계속» 그러리라고 보지 않는다 —
   * 옆 번호가 한꺼번에 바뀐 전례가 바로 그 번호대에 있다. 그러니 날마다 다시 읽는다.
   */
  { 이름: '신용융자 잔고', id: '15094809', 쓰는곳: 'archive/raw/credit-balance' },
];

/**
 * 지면 글에서 「이용허락범위」를 집는다.
 * ⛔ 못 집으면 null — 「제한 없음」으로 읽지 않는다. 그것이 거짓 초록이다.
 */
export function 허락읽기(글) {
  const t = String(글 ?? '').replace(/\s+/g, ' ');
  if (!t) return null;
  const m = t.match(/이용허락범위\s*(공공저작물\s*:\s*[^(]*\(제\s*\d\s*유형\)|제\s*\d\s*유형[^※<]{0,60}|제한\s*없음)/);
  if (!m) return null;
  return m[1].replace(/\s+/g, ' ').trim();
}

/** 상업적으로 써도 되나. ⛔ 모르면 null — 「된다」가 «아니다» */
export function 상업가능한가(허락말) {
  const s = String(허락말 ?? '');
  if (!s) return null;
  if (/제한\s*없음/.test(s)) return true;
  if (/상업적\s*이용금지/.test(s)) return false;
  /* 제1유형 = 출처표시만 — 상업 이용이 열려 있다 */
  if (/제\s*1\s*유형/.test(s) && !/금지/.test(s)) return true;
  if (/제\s*[234]\s*유형/.test(s)) return false;   /* 2·3·4 유형에는 금지가 하나씩 붙는다 */
  return null;
}

export function 기록읽기(글) {
  const 표 = new Map();
  for (const l of String(글 ?? '').split(/\r?\n/)) {
    if (!l.trim() || l.startsWith('#') || l.startsWith('날\t')) continue;
    const [날, id, 이름, 허락] = l.split('\t');
    if (!id) continue;
    const 것 = 표.get(id) ?? [];
    것.push({ 날, id, 이름, 허락 });
    표.set(id, 것);
  }
  return 표;
}

/** 지난번과 달라졌나. ⛔ 지난 것이 없으면 「바뀌었다」가 아니라 「처음」이다 */
export function 달라졌나(지난것들, 이번허락) {
  if (!지난것들?.length) return { 결: '처음', 지난것: null };
  const 마지막 = 지난것들[지난것들.length - 1];
  if (!마지막.허락 || 마지막.허락.startsWith('⬜')) return { 결: '처음', 지난것: null };
  if (이번허락 == null) return { 결: '못읽음', 지난것: 마지막.허락 };
  return { 결: 마지막.허락 === 이번허락 ? '그대로' : '바뀌었다', 지난것: 마지막.허락 };
}

async function 주다() {
  const 오늘 = new Date().toLocaleDateString('sv-SE');
  let 지난 = new Map();
  try { 지난 = 기록읽기(fs.readFileSync(기록길, 'utf8')); } catch { 지난 = new Map(); }

  const puppeteer = await import('puppeteer-core');
  const b = await puppeteer.default.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null, protocolTimeout: 10 * 60_000 });
  const page = await b.newPage();
  const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
  const 새줄 = [];
  let 바뀜 = 0; let 못읽음 = 0; let 막힌것 = 0;

  console.log(`\n■ 공공데이터포털 이용허락이 바뀌었나 — ${오늘}`);
  try {
    for (const x of 볼것) {
      let 허락 = null;
      try {
        await page.goto(`https://www.data.go.kr/data/${x.id}/openapi.do`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await 잠깐(4000);
        허락 = 허락읽기(await page.evaluate(() => document.body.innerText));
      } catch { 허락 = null; }

      const { 결, 지난것 } = 달라졌나(지난.get(x.id), 허락);
      const 쓸수있나 = 상업가능한가(허락);
      새줄.push([오늘, x.id, x.이름, 허락 ?? '⬜못읽음'].join('\t'));

      if (결 === '바뀌었다') {
        console.log(`   🔴🔴 ${x.이름} (${x.id}) — **바뀌었다**`);
        console.log(`        지난번 ${지난것}`);
        console.log(`        오늘   ${허락}`);
        바뀜 += 1;
      } else if (결 === '못읽음') {
        console.log(`   ⬜ ${x.이름} (${x.id}) — 못 읽었다. ⛔ 「안 바뀌었다」가 아니다`);
        못읽음 += 1;
      } else {
        const 표 = 쓸수있나 === false ? '🔴' : 쓸수있나 === true ? '✅' : '⬜';
        console.log(`   ${표} ${x.이름} (${x.id}) — ${허락 ?? '못 집었다'}${결 === '처음' ? '  (처음 잰다)' : ''}`);
        if (허락 == null) 못읽음 += 1;
      }
      if (쓸수있나 === false) 막힌것 += 1;
    }
  } finally {
    try { await page.close(); } catch { /* 내가 연 탭만 */ }
    b.disconnect();
  }

  if (새줄.length) {
    const 머리 = '# 공공데이터포털 이용허락을 날마다 다시 읽은 기록 — 날\t데이터셋\t이름\t이용허락범위\n'
      + '# ⛔ 이 파일을 지우면 「바뀌었나」를 못 센다. 한 번 읽은 판정은 썩는다\n';
    const 옛 = fs.existsSync(기록길)
      ? fs.readFileSync(기록길, 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#') && !l.startsWith(오늘 + '\t'))
      : [];
    fs.mkdirSync(path.dirname(기록길), { recursive: true });
    fs.writeFileSync(기록길, 머리 + [...옛, ...새줄].join('\n') + '\n', 'utf8');
    console.log(`   ✔ 기록에 쌓았다 — ${path.relative(뿌리, 기록길)}`);
  }

  console.log(`\n   바뀐 것 ${바뀜}  ·  ⬜ 못 읽은 것 ${못읽음}  ·  🔴 상업적으로 못 쓰는 것 ${막힌것}`);
  if (막힌것) {
    console.log('   🔴 상업적으로 못 쓰는 자료를 싣고 있는지 «지면»을 본다 — 모으는 것과 싣는 것은 다르다');
    console.log('   ⛔ 돈이 드는 길(원천 유료 구매)은 사장님 승인 사항이다. 혼자 정하지 않는다');
  }
  if (못읽음) console.log('   ⬜ 못 읽은 것이 있다 — 「초록」으로 읽지 않는다');
  return (바뀜 || 막힌것) ? 1 : 0;
}

/* ── 자가시험 ───────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0; let 탈 = 0;
  const 본다 = (말, 참) => { if (참) { 통 += 1; console.log('✅ ' + 말); } else { 탈 += 1; console.log('🔴 ' + 말); } };

  본다('「제한 없음」을 집는다', 허락읽기('앞말 이용허락범위 제한 없음 뒷말') === '제한 없음');
  본다('제4유형을 집는다',
    허락읽기('이용허락범위 제4유형 : 출처표시 + 상업적 이용금지 + 변경금지').startsWith('제4유형'));
  본다('공공저작물 꼴도 집는다',
    허락읽기('이용허락범위 공공저작물 : 출처표시 (제 1유형)').includes('제 1유형'));
  본다('⛔ 못 집으면 null 이다 — 「제한 없음」이 아니다',
    허락읽기('아무 말도 없다') === null && 허락읽기(null) === null && 허락읽기('') === null);

  본다('⭐ 제한 없음이면 써도 된다', 상업가능한가('제한 없음') === true);
  본다('🔴 상업적 이용금지면 못 쓴다',
    상업가능한가('제4유형 : 출처표시 + 상업적 이용금지 + 변경금지') === false);
  본다('🔴 제2유형도 못 쓴다', 상업가능한가('제2유형 : 출처표시 + 상업적 이용금지') === false);
  본다('✅ 제1유형(출처표시만)은 써도 된다', 상업가능한가('공공저작물 : 출처표시 (제 1유형)') === true);
  본다('⛔ 모르면 null 이다 — 「된다」가 아니다',
    상업가능한가(null) === null && 상업가능한가('') === null && 상업가능한가('알 수 없는 말') === null);

  const 기록 = 기록읽기([
    '# 머리',
    '2026-08-05\t15094808\t주식시세\t제한 없음',
    '2026-10-05\t15094808\t주식시세\t제한 없음',
    '2026-10-05\t15094792\t펀드\t제한 없음',
  ].join('\n'));
  본다('기록을 데이터셋별로 모은다', 기록.get('15094808').length === 2);
  본다('⛔ 머리줄을 안 읽는다', !기록.has('#'));

  본다('🔴🔴 바뀌면 잡는다',
    달라졌나(기록.get('15094808'), '제4유형 : 출처표시 + 상업적 이용금지 + 변경금지').결 === '바뀌었다');
  본다('⭐ 같으면 그대로다', 달라졌나(기록.get('15094808'), '제한 없음').결 === '그대로');
  본다('⬜ 오늘 못 읽었으면 «못읽음»이다 — 「그대로」가 아니다',
    달라졌나(기록.get('15094808'), null).결 === '못읽음');
  본다('⚠ 지난 것이 없으면 「처음」이다 — 「바뀌었다」가 아니다',
    달라졌나([], '제한 없음').결 === '처음' && 달라졌나(null, '제한 없음').결 === '처음');
  본다('⚠ 지난 것이 못읽음이면 견주지 않는다',
    달라졌나([{ 허락: '⬜못읽음' }], '제한 없음').결 === '처음');

  본다('볼 것에 우리가 쓰는 자료가 들어 있다',
    볼것.some((x) => x.id === '15094808') && 볼것.every((x) => /^\d{8}$/.test(x.id)));

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통} 통과`);
  return 탈 ? 1 : 0;
}

/* ⛔ 걸림돌 없는 꼭대기 부름을 두지 않는다 */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험());
  process.exit(await 주다());
}
