#!/usr/bin/env node
/**
 * measure-klifemap-korean-keywords.mjs
 *   케이라이프맵 «한국어» 검색어를 재서 50위까지 줄 세우고,
 *   그 가운데 **우리가 아직 안 잡히는 말**을 골라낸다.
 *
 * 🔴 사장님 (2026-09-26, 원문)
 *   「한국어 뿐만 아니라 다국어의 검색량 많은 키워드를 찾아라. 키워드 한 개만 찾지말고
 *     롱테일 검색어까지 50위 정도까지 검색량 순위를 반영해라. 예컨대 한국어에서
 *     무료 사주가 검색량이 많은 지 확인 후 seo, geo, 검색 색인 등을 해서
 *     기존 콘텐트를 수정하거나 새 콘텐트를 만들어라」
 *   「명리와 점성학 모두 해」
 *   ※ 다국어(영·일·중)는 2번 몫, 한국어와 구조는 5번(나) 몫으로 갈랐다.
 *
 * ── ⛔ 무엇을 「검색량」이라 부르지 않는가 ──────────────────────
 *   우리에게 유료 검색량 자료가 없다. 네이버 검색광고 열쇠도 없다.
 *   그래서 **대리 지표**를 재고, 그 이름 그대로 부른다 —
 *     ① 네이버 자동완성 — 한국 손님이 실제로 치는 말. 「순서」가 인기 차례다
 *     ② 구글 자동완성  — 같은 것을 구글 쪽에서
 *     ③ 서치콘솔 노출  — 우리가 «이미» 뜨고 있는 말과 그 횟수 (이건 실제 수다)
 *   ⛔ ①②를 「월간 검색량 몇 회」로 옮겨 적지 않는다. 순위만 말한다.
 *   ⛔ 못 물은 것을 0 으로 적지 않는다 — 「못 물었다」로 따로 센다.
 *
 * ── 무엇을 내놓나 ──────────────────────────────────────────
 *   src/data/klifemap-korean-keywords.json
 *     · 명리 50위 · 점성학 50위 (대리 지표 합산 순위)
 *     · 각 말마다 「우리가 이미 뜨나」(GSC 노출) — 0 이면 비어 있는 자리다
 *     · ⭐ 빈자리 목록 — 사람은 찾는데 우리는 없는 말. 여기가 다음에 지을 곳이다
 *
 * 쓰는 법
 *   node scripts/measure-klifemap-korean-keywords.mjs --자가시험
 *   node scripts/measure-klifemap-korean-keywords.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼곳 = path.join(뿌리, 'src/data/klifemap-korean-keywords.json');
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

/** 씨앗 — 우리가 파는 것에서 출발한다. 여기서 자동완성이 롱테일을 캐 준다 */
export const 씨앗 = {
  명리: [
    '사주', '무료사주', '사주풀이', '사주팔자', '신년운세', '토정비결',
    '궁합', '궁합보기', '무료궁합', '사주궁합',
    '작명', '개명', '이름풀이', '아기이름',
    '택일', '결혼택일', '이사택일',
    '오늘의운세', '띠별운세', '일진', '명리학', '관상', '육효',
  ],
  점성학: [
    '별자리', '별자리운세', '오늘의별자리', '별자리궁합', '별자리성격',
    '점성술', '점성학', '출생차트', '네이탈차트', '천궁도',
    '태양별자리', '달별자리', '상승궁', '라이징',
    '타로', '타로카드', '무료타로', '타로점',
    '이번주운세', '연애운', '금전운', '이직운',
  ],
};

/** 우리 것과 무관한 말은 뺀다 — 자동완성은 엉뚱한 곳으로도 뻗는다 */
export const 거르는말 = [
  '뜻', '영어로', '한자', '디시', '인벤', '나무위키', '토렌트', '다시보기',
  '채용', '알바', '주가', '주식', '부동산', '맛집', '노래', '가사',
];

/** 값이 겹치면 한 번만 센다 */
const 다듬기 = (s) => String(s).replace(/\s+/g, ' ').trim();

/** 네이버 자동완성. 못 물으면 undefined (빈 배열과 «다르다») */
export async function 네이버자동완성(말, 부르기 = fetch) {
  const u = 'https://ac.search.naver.com/nx/ac?q=' + encodeURIComponent(말)
    + '&con=0&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8&st=100';
  for (let i = 0; i < 3; i++) {
    try {
      const r = await 부르기(u, { headers: { 'User-Agent': 'klifemap.ai research', Referer: 'https://search.naver.com/' } });
      if (r.ok) {
        const j = await r.json();
        /* items 는 [[ [말, ...], [말, ...] ]] 꼴로 온다 */
        const 줄 = (j && j.items && j.items[0]) || [];
        return 줄.map((x) => 다듬기(Array.isArray(x) ? x[0] : x)).filter(Boolean);
      }
    } catch (e) { /* 다시 문다 */ }
    await 쉼(700 * (i + 1));
  }
  return undefined;
}

/** 구글 자동완성. 못 물으면 undefined */
export async function 구글자동완성(말, 부르기 = fetch) {
  const u = 'https://suggestqueries.google.com/complete/search?client=firefox&hl=ko&gl=kr&q=' + encodeURIComponent(말);
  for (let i = 0; i < 3; i++) {
    try {
      const r = await 부르기(u, { headers: { 'User-Agent': 'klifemap.ai research' } });
      if (r.ok) {
        const j = await r.json();
        return (j[1] || []).map(다듬기).filter(Boolean);
      }
    } catch (e) { /* 다시 문다 */ }
    await 쉼(700 * (i + 1));
  }
  return undefined;
}

/**
 * 자동완성 «순서»를 점수로 바꾼다.
 * ⭐ 위에 뜰수록 사람이 많이 친 말이다. 1등 10점, 그다음 9점… 10등 밖은 1점.
 * ⛔ 이 점수를 「검색량」이라 부르지 않는다. 순위를 만들기 위한 눈금일 뿐이다.
 */
export function 자리점수(자리) {
  if (!Number.isInteger(자리) || 자리 < 0) return 0;
  return Math.max(1, 10 - 자리);
}

/** 여러 우물에서 캔 말들을 한 표로 모은다 */
export function 모은다(캔것) {
  const 표 = new Map();
  for (const { 우물, 줄 } of 캔것) {
    if (!Array.isArray(줄)) continue;
    줄.forEach((말, 자리) => {
      const k = 다듬기(말);
      if (!k || 거르는말.some((x) => k.includes(x))) return;
      const 이전 = 표.get(k) || { 말: k, 점수: 0, 우물들: [] };
      이전.점수 += 자리점수(자리);
      if (!이전.우물들.includes(우물)) 이전.우물들.push(우물);
      표.set(k, 이전);
    });
  }
  /* 두 우물에 다 뜬 말은 더 믿을 만하다 — 같은 점수면 그것을 앞세운다 */
  return [...표.values()].sort((a, b) => (b.점수 - a.점수) || (b.우물들.length - a.우물들.length) || a.말.localeCompare(b.말, 'ko'));
}

/** 서치콘솔에서 «우리가 이미 뜨는 말»을 읽는다. 없으면 빈 표 */
export function 우리가뜨는말(자료폴더 = path.join(뿌리, 'src/data')) {
  const 표 = new Map();
  let 읽은파일 = 0;
  for (const f of fs.existsSync(자료폴더) ? fs.readdirSync(자료폴더) : []) {
    if (!/^gsc-klifemap-.*\.json$/.test(f)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(자료폴더, f), 'utf8'));
      const 줄들 = Array.isArray(j) ? j : (j.rows || j.검색어 || []);
      for (const r of 줄들) {
        const 말 = 다듬기((r.keys && r.keys[0]) || r.query || r.검색어 || '');
        if (!말) continue;
        const 노출 = Number(r.impressions ?? r.노출 ?? 0) || 0;
        표.set(말, Math.max(표.get(말) || 0, 노출));
      }
      읽은파일++;
    } catch (e) { /* 그 파일은 건너뛴다 */ }
  }
  return { 표, 읽은파일 };
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 됐나, 덧말 = '') => 결과.push({ 이름, 됐나: !!됐나, 덧말 });

  본다('씨앗이 두 갈래다', Object.keys(씨앗).length === 2);
  본다('명리 씨앗이 스무 개 넘는다', 씨앗.명리.length >= 20, `${씨앗.명리.length}개`);
  본다('점성학 씨앗이 스무 개 넘는다', 씨앗.점성학.length >= 20, `${씨앗.점성학.length}개`);
  본다('씨앗에 겹치는 말이 없다',
    new Set([...씨앗.명리, ...씨앗.점성학]).size === 씨앗.명리.length + 씨앗.점성학.length);
  본다('성명학 씨앗이 한국어에만 있다 (다국어에 영구히 안 낸다)',
    씨앗.명리.includes('작명') && 씨앗.명리.includes('개명'));

  본다('자리점수 — 1등이 제일 높다', 자리점수(0) === 10);
  본다('자리점수 — 뒤로 갈수록 낮다', 자리점수(0) > 자리점수(3) && 자리점수(3) > 자리점수(8));
  본다('자리점수 — 열 등 밖도 0 이 아니다', 자리점수(30) === 1);
  본다('자리점수 — 자리가 아니면 0', 자리점수(-1) === 0 && 자리점수(null) === 0);

  const 모음 = 모은다([
    { 우물: '네이버', 줄: ['무료 사주', '사주 보는 곳', '사주 뜻'] },
    { 우물: '구글', 줄: ['무료 사주', '사주 궁합'] },
  ]);
  본다('두 우물에 다 뜬 말이 맨 앞이다', 모음[0] && 모음[0].말 === '무료 사주');
  본다('두 우물이 적힌다', 모음[0] && 모음[0].우물들.length === 2);
  본다('거르는 말은 빠진다', !모음.some((x) => x.말.includes('뜻')), `${모음.length}개 남음`);
  본다('못 물은 우물(undefined)은 세지 않는다',
    모은다([{ 우물: '네이버', 줄: undefined }, { 우물: '구글', 줄: ['사주'] }]).length === 1);

  const { 표 } = 우리가뜨는말();
  본다('서치콘솔 자료를 읽는다(없으면 빈 표여도 된다)', 표 instanceof Map, `${표.size}개`);

  /* ⛔ 「검색량」이라는 말을 산출물에 쓰지 않는다 — 우리는 그것을 못 쟀다 */
  const 이글 = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const 산출물에검색량 = /검색량[^」』]*:/.test(이글.split('const 낼것 =')[1] || '');
  본다('산출물 칸 이름에 「검색량」을 쓰지 않는다', !산출물에검색량);

  return 결과;
}

/* ─────────────────────────────── 본 일 ─────────────────────────────── */
async function 잰다() {
  const { 표: 노출표, 읽은파일 } = 우리가뜨는말();
  console.log(`■ 서치콘솔 자료 ${읽은파일}개에서 우리가 뜨는 말 ${노출표.size}개를 읽었다`);

  const 낼것 = { 잰때: new Date().toLocaleString('ko-KR'), 갈래: {}, 못물은것: [] };

  for (const [갈래, 말들] of Object.entries(씨앗)) {
    const 캔것 = [];
    let 못물음 = 0;
    for (const 씨 of 말들) {
      const n = await 네이버자동완성(씨);
      if (n === undefined) { 못물음++; 낼것.못물은것.push(`네이버:${씨}`); } else 캔것.push({ 우물: '네이버', 줄: n });
      await 쉼(350);
      const g = await 구글자동완성(씨);
      if (g === undefined) { 못물음++; 낼것.못물은것.push(`구글:${씨}`); } else 캔것.push({ 우물: '구글', 줄: g });
      await 쉼(350);
      process.stdout.write('.');
    }
    const 줄세운것 = 모은다(캔것).slice(0, 50).map((x, i) => ({
      순위: i + 1,
      말: x.말,
      대리점수: x.점수,
      우물: x.우물들,
      우리노출: 노출표.get(x.말) ?? 0,
    }));
    낼것.갈래[갈래] = {
      씨앗수: 말들.length,
      못물음,
      쉰개: 줄세운것,
      빈자리: 줄세운것.filter((x) => x.우리노출 === 0).map((x) => x.말),
    };
    console.log(`\n■ ${갈래} — 50위까지 세웠다 · 우리가 «아직 안 뜨는» 말 ${낼것.갈래[갈래].빈자리.length}개 · 못 물은 우물 ${못물음}`);
    for (const r of 줄세운것.slice(0, 12)) {
      console.log(`   ${String(r.순위).padStart(2)}. ${r.말.padEnd(22)} 대리점수 ${String(r.대리점수).padStart(3)} · 우리노출 ${r.우리노출}`);
    }
  }

  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2), 'utf8');
  console.log(`\n✅ 냈다 — ${path.relative(뿌리, 낼곳)}`);
}

const 이파일이진입점 =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (이파일이진입점) {
  if (process.argv.includes('--자가시험')) {
    const 결과 = 자가시험();
    let 빨강 = 0;
    console.log('■ 한국어 검색어 자 — 자가시험');
    for (const r of 결과) {
      if (!r.됐나) 빨강++;
      console.log(`  ${r.됐나 ? '✅' : '🔴'} ${r.이름}${r.덧말 ? `  (${r.덧말})` : ''}`);
    }
    console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
    process.exit(빨강 ? 1 : 0);
  }
  await 잰다();
}
