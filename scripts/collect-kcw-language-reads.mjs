/**
 * collect-kcw-language-reads.mjs — **한 사람을 «어느 언어판»에서 읽나.** (per-article × 15판)
 *
 * ── 🔴 왜 만들었나 (2026-09-09 10:2x · 5번) ─────────────────────────────────
 * 사장님: 「케이컬쳐스도 지금보다 훨씬 좋은 데이터가 어딘가에 있을 것 같다 …
 *          **빌보드 같은 서비스**를 해보고 싶다」 · 「**케이컬쳐스 판의 니케이**」
 *
 * ⛔ 그런데 나는 사장님께 「우리는 영문판만 본다」고 «틀린» 말씀을 드렸다. 히스토리를 덜 봤다.
 *   실은 이미 두 자가 다국어를 쓴다 —
 * ```
 *   find-kcw-top-movers.mjs        vi·id·th·ms·en 다섯 판의 «그날 상위 1000»
 *   collect-kcw-country-reading.mjs top-per-country 로 18개 나라
 * ```
 *
 * ── 🔴 그런데 그 자료를 열어 보니 «구멍»이 딴 데 있었다 (실측) ────────────────
 * `src/data/kcw-country-reading.json` 을 열어 세어 보니 —
 * ```
 *   서로 다른 문서 21,975 중 «한국으로 확정된 것»이 87개뿐
 *   Philippines 6/159 (2.7%) · Japan 63/4,617 (0.96%) · United States 4/3,712 (0.05%)
 *   🔴 Indonesia 0 · Thailand 0 · Brazil 0 · Mexico 0 … 열여덟 나라 가운데 아홉이 «0»
 * ```
 * ⛔ **그 0 은 사실이 아니다.** top-per-country 는 그 나라 «상위 1000»만 주고,
 *   한국 문서는 그 안에 잘 못 든다. 그래서 안 보이는 것이지 안 읽는 것이 아니다.
 *   ⇒ 실제로 재 보니 인도네시아어판에서 Jennie 가 2개월에 **2,964** 읽혔다.
 *   ⚠ 만약 우리가 「인도네시아는 한국 문서를 안 읽는다」고 지면에 냈다면 «거짓»이 됐다.
 *
 * ── ✅ 그래서 이 자는 다른 엔드포인트를 쓴다 ────────────────────────────────
 * `per-article/{판}.wikipedia/…` — **사람마다 판마다** 직접 묻는다.
 * 상위 1000 안에 들든 말든 수가 나온다. 실측(2026-09-09 · 2개월 합) —
 * ```
 *   Jennie      en 218,834 · zh 33,280 · ja 23,595 · es 16,627 · ko 14,102 · fr 12,057
 *   Lee Min-ho  en  90,998 · es 21,533 · zh 21,065 · ja 20,275 · ru  8,410
 *               ⭐ **일본어보다 스페인어에서 더 읽힌다**
 *   Psy         en  61,207 · zh 14,450 · ja 11,788 · ko  6,235 · fr  6,451
 * ```
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────────────────────
 * ```
 * ⛔ 판마다 문서 «제목»을 유추하지 않는다 — 위키데이터 sitelinks 로 받는다.
 *    2026-09-09 에 Q번호를 짐작해 «수원종합운동장»을 IU 로 잡았다. 유추하면 이렇게 된다
 * ⛔ 그 판에 문서가 «없는» 것과 «0회 읽힌» 것을 섞지 않는다 — 앞은 null, 뒤는 0
 * ⛔ 열람수를 「인기」라 부르지 않는다. 좋은 일로도 나쁜 일로도 는다
 * ⛔ 열람수를 «그 나라 사람»의 수로 읽지 않는다 — 스페인어판을 중남미가 읽는다.
 *    그래서 칸 이름을 «나라»가 아니라 **«언어판»**으로 둔다
 * ⚠ per-article 은 묶음이 크면 막는다(저장소 실측: 200건 중 156 막힘) — 걸음마다 쉰다
 * ```
 *
 * 쓰는 법
 *   node scripts/collect-kcw-language-reads.mjs --잰다              (기본 문턱 20 · 478명)
 *   node scripts/collect-kcw-language-reads.mjs --잰다 --문턱 30    (134명 · 빠르게)
 *   node scripts/collect-kcw-language-reads.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 명부길 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 낼방 = path.join(뿌리, 'archive/raw/star-pageviews');
const UA = { 'user-agent': 'KCultureWire/1.0 (parkintaek2@gmail.com)' };

/**
 * 잴 언어판 열다섯. **왜 이 판인가를 칸에 적어 둔다** — 아무 판이나 고른 것이 아니다.
 * ⚠ 「언어판 = 나라」가 아니다. es 는 스페인과 중남미가 함께 읽는다.
 */
export const 판들 = [
  { 판: 'en', 왜: '우리 지면의 언어. 견줌의 기준' },
  { 판: 'ja', 왜: '일본 — 한류 최대 시장 가운데 하나' },
  { 판: 'zh', 왜: '중국어권 — 본토·대만·홍콩·화교' },
  { 판: 'es', 왜: '스페인어권 — 스페인 + 중남미. 실측에서 일본어를 넘긴 사례가 있다' },
  { 판: 'pt', 왜: '포르투갈어권 — 브라질' },
  { 판: 'id', 왜: '인도네시아 — 나라별 자료가 «0»으로 잘못 보이던 곳' },
  { 판: 'th', 왜: '태국 — 같은 이유' },
  { 판: 'vi', 왜: '베트남 — 우리 상위이동 자료가 이미 쓰는 판이다' },
  { 판: 'ms', 왜: '말레이시아 — 나라별 자료에서 몫 1.52% (둘째로 높았다)' },
  { 판: 'tl', 왜: '필리핀 — 나라별 자료에서 몫이 가장 높았다(2.7%)' },
  { 판: 'ar', 왜: '아랍어권 — 실측에서 제니 2,732 · 이민호 2,770 이 나왔다' },
  { 판: 'hi', 왜: '인도 — 힌디' },
  { 판: 'fr', 왜: '프랑스어권 — 실측에서 싸이가 한국어판보다 높았다(6,451 > 6,235)' },
  { 판: 'de', 왜: '독일어권 — 유럽 안에서 프랑스와 견주는 축' },
  { 판: 'ru', 왜: '러시아어권 — 실측에서 이민호 8,410. 아무도 안 세는 시장이다' },
];

/** ⚠ 시각은 KST. 이 PC 가 이미 KST 다 — UTC 로 바꾸면 새벽에 하루 어긋난다 */
export function 날꼴(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const 날 = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${날}`;
}

/** 지난 달의 마지막 날까지를 창으로 쓴다 — 이번 달은 «아직 안 끝난 달»이라 섞지 않는다 */
export function 창잡기(오늘 = new Date()) {
  const 끝 = new Date(오늘.getFullYear(), 오늘.getMonth(), 0);       /* 지난달 말일 */
  const 시작 = new Date(끝.getFullYear(), 끝.getMonth() - 2, 1);      /* 그 앞 두 달 */
  const 꼴 = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return { 시작: 꼴(시작), 끝: 꼴(끝), 달수: 3 };
}

/** sitelinks 에서 그 판의 «실제 제목»을 꺼낸다. ⛔ 없으면 null — 지어내지 않는다 */
export function 판제목(sitelinks, 판) {
  const t = sitelinks?.[`${판}wiki`]?.title;
  return (typeof t === 'string' && t.trim()) ? t.trim() : null;
}

/** 제목 → per-article 주소. 공백은 밑줄이다 */
export function 열람주소(판, 제목, 시작, 끝) {
  const s = encodeURIComponent(String(제목).replace(/ /g, '_'));
  return `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${판}.wikipedia/all-access/user/${s}/monthly/${시작}/${끝}`;
}

/** 응답에서 합을 낸다. ⛔ 항목이 없으면 «0» 이 아니라 0 이 맞다 — 문서는 있는데 안 읽힌 것이다 */
export function 열람합(답) {
  const it = 답?.items;
  if (!Array.isArray(it)) return null;
  return it.reduce((a, x) => a + (Number(x?.views) || 0), 0);
}

/**
 * 한 사람의 판별 열람수 가운데 «가장 많이 읽은 판»과 그 다음.
 * ⛔ en 은 우리 지면의 언어라 «견줌 기준»이므로 1위 다툼에서 뺀다 —
 *   안 빼면 늘 en 이 1위여서 아무 말도 못 한다.
 */
export function 으뜸판(수들, { 뺄판 = 'en' } = {}) {
  const 것 = Object.entries(수들 ?? {})
    .filter(([p, v]) => p !== 뺄판 && Number.isFinite(v))
    .sort((a, b) => b[1] - a[1]);
  if (!것.length) return { 판: null, 수: null, 다음판: null, 다음수: null };
  return { 판: 것[0][0], 수: 것[0][1], 다음판: 것[1]?.[0] ?? null, 다음수: 것[1]?.[1] ?? null };
}

const 자다 = (ms) => new Promise((r) => setTimeout(r, ms));

async function 다받기({ 문턱 }) {
  const 명부 = JSON.parse(fs.readFileSync(명부길, 'utf8')).사람;
  const 고른것 = 명부.filter((x) => Number.isFinite(x.sitelinks) && x.sitelinks >= 문턱)
    .sort((a, b) => b.sitelinks - a.sitelinks);
  const 창 = 창잡기();
  console.log(`명부 ${명부.length.toLocaleString('en-US')}명 → sitelinks ≥ ${문턱} 인 ${고른것.length}명`);
  console.log(`창 ${창.시작} ~ ${창.끝} (${창.달수}달) · 판 ${판들.length}개`);

  const 사람 = []; let 막힌것 = 0; let 문서없음 = 0;
  for (const [i, p] of 고른것.entries()) {
    let sl = null;
    try {
      const j = await (await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${p.q}&props=sitelinks&format=json`, { headers: UA })).json();
      sl = j.entities?.[p.q]?.sitelinks ?? null;
    } catch { /* 아래에서 «못 받았다»로 남는다 */ }
    if (!sl) { 사람.push({ q: p.q, name: p.name, 못받음: 'sitelinks' }); 막힌것 += 1; continue; }

    const 수들 = {}; const 없는판 = [];
    for (const { 판 } of 판들) {
      const t = 판제목(sl, 판);
      if (!t) { 없는판.push(판); 문서없음 += 1; continue; }   /* ⛔ 문서 없음 ≠ 0회 */
      try {
        const r = await fetch(열람주소(판, t, 창.시작, 창.끝), { headers: UA });
        if (r.status === 404) { 수들[판] = 0; }               /* 문서는 있고 자료가 없다 */
        else if (!r.ok) { 막힌것 += 1; }                       /* ⛔ 0 으로 안 채운다 */
        else 수들[판] = 열람합(await r.json());
      } catch { 막힌것 += 1; }
      await 자다(180);
    }
    사람.push({ q: p.q, name: p.name, sitelinks: p.sitelinks, 판수: Object.keys(수들).length, 없는판, 수들, 으뜸: 으뜸판(수들) });
    if ((i + 1) % 20 === 0) process.stdout.write(`\r  ${i + 1}/${고른것.length}`);
  }
  console.log('');

  const 답 = {
    잰때: new Date().toLocaleString('ko-KR'),
    창: `${창.시작} ~ ${창.끝}`,
    우물: 'Wikimedia REST — pageviews/per-article, all-access, user (봇 제외) · 판별 제목은 Wikidata sitelinks',
    이것이무엇인가: '한 사람의 위키백과 문서를 어느 «언어판»에서 얼마나 열었나. 사람마다 판마다 직접 물었다.',
    이것이아닌것: [
      '「인기」가 아니다. 열람은 좋은 일로도 나쁜 일로도 는다.',
      '「그 나라 사람 수」가 아니다 — 스페인어판은 스페인과 중남미가 함께 읽는다. 칸은 «언어판»이다.',
      '그 판에 문서가 «없는» 것과 «0회 읽힌» 것은 다르다. 앞은 없는판에, 뒤는 0 으로 적었다.',
      '전수가 아니다 — sitelinks 문턱을 넘은 사람만 잰다. 문턱을 함께 적었다.',
    ],
    문턱: 문턱,
    사람수: 사람.length,
    판들: 판들,
    막힌응답: 막힌것,
    문서없는칸: 문서없음,
    사람,
  };
  fs.mkdirSync(낼방, { recursive: true });
  const 길 = path.join(낼방, `language-reads-${날꼴()}.json`);
  fs.writeFileSync(길, JSON.stringify(답, null, 1), 'utf8');

  /* 요약 — 「en 을 뺀 1위 판」이 무엇인지 세어 본다. 이것이 곧 기사다 */
  const 셈 = {};
  for (const p of 사람) { const k = p.으뜸?.판; if (k) 셈[k] = (셈[k] ?? 0) + 1; }
  console.log(`✅ ${길}`);
  console.log(`   사람 ${사람.length} · 막힌 응답 ${막힌것} · 문서 없는 칸 ${문서없음}`);
  console.log('   ⭐ en 을 뺀 «1위 언어판» 셈: ' + Object.entries(셈).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (나 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('판이 열다섯이다', 판들.length === 15);
  검('판마다 «왜 고른가»가 적혀 있다', 판들.every((x) => (x.왜 ?? '').length > 3));
  검('en 이 들어 있다 — 견줌 기준', 판들.some((x) => x.판 === 'en'));
  검('id·th 가 들어 있다 — 나라별 자료가 0으로 잘못 보이던 곳', 판들.some((x) => x.판 === 'id') && 판들.some((x) => x.판 === 'th'));

  검('판제목 — sitelinks 에서 꺼낸다', 판제목({ jawiki: { title: '少女時代' } }, 'ja') === '少女時代');
  검('⛔ 판제목 — 없으면 null (제목을 지어내지 않는다)', 판제목({ enwiki: { title: 'X' } }, 'ja') === null);
  검('⛔ 판제목 — sitelinks 자체가 없어도 견딘다', 판제목(null, 'ja') === null);
  검('⛔ 판제목 — 빈 제목은 null', 판제목({ jawiki: { title: '  ' } }, 'ja') === null);

  검('열람주소 — 공백을 밑줄로', 열람주소('ja', 'Lee Min ho', '20260601', '20260831').includes('Lee_Min_ho'));
  검('열람주소 — 판이 주소에 들어간다', 열람주소('es', 'X', '1', '2').includes('/es.wikipedia/'));
  검('열람주소 — 봇을 뺀다(user)', 열람주소('en', 'X', '1', '2').includes('/all-access/user/'));

  검('열람합 — 달을 더한다', 열람합({ items: [{ views: 10 }, { views: 5 }] }) === 15);
  검('⛔ 열람합 — 항목이 없으면 null (0 이 아니다)', 열람합({}) === null);
  검('⛔ 열람합 — null 도 null', 열람합(null) === null);
  검('열람합 — 빈 배열은 0 (문서는 있고 안 읽혔다)', 열람합({ items: [] }) === 0);

  const 으 = 으뜸판({ en: 999, ja: 10, es: 30, zh: 20 });
  검('🔴 으뜸판 — en 을 빼고 고른다 (안 빼면 늘 en 이 1위다)', 으.판 === 'es' && 으.수 === 30);
  검('으뜸판 — 다음 판도 낸다', 으.다음판 === 'zh' && 으.다음수 === 20);
  검('⛔ 으뜸판 — 잴 것이 없으면 null', 으뜸판({ en: 5 }).판 === null);
  검('⛔ 으뜸판 — null 도 견딘다', 으뜸판(null).판 === null);

  const c = 창잡기(new Date(2026, 8, 9));
  검('창 — 지난달 말일까지만 (안 끝난 달을 섞지 않는다)', c.끝 === '20260831');
  검('창 — 석 달', c.시작 === '20260601' && c.달수 === 3);
  검('날꼴 — KST 자정 직후에도 그날', 날꼴(new Date(2026, 8, 9, 0, 30)) === '2026-09-09');

  검('🔴 「그 0 은 사실이 아니다」가 코드에 살아 있다',
    fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').includes('그 0 은 사실이 아니다'));

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ 언어판 열람수 받는 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

if (나 && process.argv.includes('--잰다')) {
  const i = process.argv.indexOf('--문턱');
  await 다받기({ 문턱: i > 0 ? Number(process.argv[i + 1]) : 20 });
} else if (나) {
  console.log('쓰는 법: node scripts/collect-kcw-language-reads.mjs --잰다 [--문턱 20] | --자가시험');
}
