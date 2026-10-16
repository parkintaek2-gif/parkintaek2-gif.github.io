#!/usr/bin/env node
/**
 * 잰다-손님말이-지면에-있나.mjs — **우리 말로 쓰고 손님 말로 안 쓴 지면**을 찾는다.
 *
 * ── 🔴 왜 만드나 (2026-10-16) ──────────────────────────────────────────
 * 사장님 — 「대체 언제 방문자를 각 사이트마다 하루 1,000명 만들건데?」
 *
 * 재 보니 SeoulMarkets 진짜 바깥 손님이 하루 2명이었다. 까닭을 파니
 * **사람이 실제로 치는 큰 말 15개에 우리 노출이 0회**였다.
 *
 *   korean stock market 0 · kospi 0 · samsung electronics stock 0 · korea gdp 0
 *   korea interest rate 0 · korea market cap 0 · korea pe ratio 0 … 열다섯 모두 0
 *
 * 그 가운데 하나를 파 보니 까닭이 또렷했다 — /data/valuation 은 AI 검색이 28일에
 * 7번 내린 우리 최다 지면인데, **지면 전체에 「PE ratio」 가 한 글자도 없었다.**
 * 우리는 PER 이라고만 썼다. PER 은 한국·일본식이고 영어권은 PE ratio 라고 친다.
 *
 * ⭐ **같은 병이 다른 지면에도 있다.** 그것을 사람 기억이 아니라 이 스크립트가 잡는다.
 *
 * 무엇을 재나
 *   ① 내부어가 제목 «앞»에 있나 — tape·registry·shelf·panel 은 손님이 치는 말이 아니다
 *   ② 손님 말과 우리 말이 짝인데 손님 말이 지면에 없나 — PER↔PE ratio 꼴
 *
 * ⛔ 「없다」를 「틀렸다」로 읽지 않는다. 그 지면에 안 맞는 말일 수 있다. 사람이 고른다.
 *
 * 쓰는 법
 *   node scripts/잰다-손님말이-지면에-있나.mjs
 *   node scripts/잰다-손님말이-지면에-있나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

/** 손님이 안 치는 우리 내부어 — 제목 «앞쪽»에 오면 그 말로는 아무도 못 찾아온다 */
export const 내부어 = ['tape', 'registry', 'shelf', 'panel', 'denominator', 'divergence', 'base effect'];

/**
 * 손님 말 ↔ 우리 말 짝.
 * 왼쪽(손님 말)이 지면에 없고 오른쪽(우리 말)만 있으면 그 말로는 안 걸린다.
 */
export const 말짝 = [
  { 손님: 'PE ratio', 우리: ['PER'], 대소문자그대로: true, 왜: '영어권은 PE ratio 라고 친다. PER 은 한국·일본식' },
  { 손님: 'P/B ratio', 우리: ['PBR'], 대소문자그대로: true, 왜: '영어권은 P/B 를 함께 쓴다' },
  { 손님: 'market cap', 우리: ['market capitalisation', 'market capitalization'], 왜: '치는 말은 줄임말 쪽이다' },
  { 손님: 'stock', 우리: ['listed company', 'listed companies'], 왜: '손님은 stock 으로 찾는다' },
  { 손님: 'share price', 우리: ['price level', 'closing price'], 왜: '치는 말은 share price' },
];

/** 제목에서 «첫 네 낱말» 안에 내부어가 있나 */
export function 내부어가앞에있나(제목, 낱말수 = 4) {
  const 앞 = String(제목 ?? '').toLowerCase().split(/[\s—–-]+/).filter(Boolean).slice(0, 낱말수).join(' ');
  return 내부어.filter((w) => 앞.includes(w));
}

/** 글에서 손님 말이 빠졌나 — 우리 말은 있는데 손님 말이 없는 것만 센다 */
/**
 * 글에서 손님 말이 빠졌나 — 우리 말은 있는데 손님 말이 없는 것만 센다.
 *
 * 🔴 [2026-10-16] 처음에는 낮춘 글자에 대고 includes() 로 쟀다. 그랬더니 「PER」 이
 *   upper · Percentages · person 안에서 걸려 46장 가운데 40장이 울었다.
 *   ⭐ 날마다 우는 거짓 빨강은 진짜 빨강을 못 믿게 만든다.
 *   ⇒ «낱말 경계»로 재고, PER·PBR 처럼 줄임말인 것은 «대문자 그대로»만 센다.
 */
export function 빠진손님말(글) {
  const t = String(글 ?? "");
  const 떼어낸다 = (w) => w.replace(/[^A-Za-z0-9 ]/g, (c) => "\\" + c);
  const 있나 = (말, 그대로) => new RegExp(
    "(^|[^A-Za-z0-9/])" + 떼어낸다(말) + "([^A-Za-z0-9]|$)", 그대로 ? "" : "i",
  ).test(t);
  const 모자람 = [];
  for (const 짝 of 말짝) {
    const 그대로 = Boolean(짝.대소문자그대로);
    const 우리있나 = 짝.우리.some((w) => 있나(w, 그대로));
    const 손님있나 = 있나(짝.손님, false);
    if (우리있나 && !손님있나) 모자람.push(짝);
  }
  return 모자람;
}

/**
 * 「⛔ YYYY-MM-DD 전에는 다시 고치지 않는다」 를 읽어 «언제 효과를 재야 하나» 를 돌려준다.
 *
 * 🔴 [2026-10-16] 제목을 고친 뒤 14일은 다시 건드리지 않기로 했다. 그런데 «언제 재러
 *   돌아올지»를 사람 기억에 맡기면 영영 안 돌아온다. 그래서 지면 자신이 날짜를 들고 있고,
 *   이 스크립트가 날마다 그 날짜를 본다.
 */
export function 식은기간(소스, 오늘 = new Date()) {
  /* ⛔ 한 줄짜리 정규식에 역슬래시를 쓰지 않는다 — 이 저장소에서 heredoc 이 먹는다.
     그래서 «줄 단위»로 먼저 거르고, 날짜만 간단한 꼴로 뽑는다. */
  const 줄들 = String(소스 ?? "").split(String.fromCharCode(10));
  for (const 줄 of 줄들) {
    if (!/고치지 않는다|다시 안 고친다/.test(줄)) continue;
    if (!/전에는|까지/.test(줄)) continue;
    const d = /(20[0-9][0-9])-([0-9][0-9])-([0-9][0-9])/.exec(줄);
    if (!d) continue;
    const 풀리는날 = new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]));
    const 하루 = 24 * 60 * 60 * 1000;
    const 오늘0시 = new Date(오늘.getFullYear(), 오늘.getMonth(), 오늘.getDate());
    const 남은날 = Math.round((풀리는날 - 오늘0시) / 하루);
    return { 날짜: d[1] + "-" + d[2] + "-" + d[3], 남은날, 잴때인가: 남은날 <= 0 };
  }
  return null;
}

/** .astro 에서 TITLE 상수를 끄집어 낸다 */
export function 제목뽑기(소스) {
  const m = /const\s+TITLE\s*=\s*(['"`])([\s\S]*?)\1/.exec(String(소스 ?? ''));
  return m ? m[2] : null;
}

/* ── 자가시험 ────────────────────────────────────────────────────── */
const 곧바로부른것 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (곧바로부른것 && process.argv.includes('--자가시험')) {
  let 통과 = 0; let 깨짐 = 0;
  const 참 = (이름, 맞나) => { if (맞나) { 통과 += 1; } else { 깨짐 += 1; console.log('  ⛔ ' + 이름); } };

  참('앞에 있는 내부어를 잡는다', 내부어가앞에있나('Korea Index Tape — 168 KRX indices').includes('tape'));
  참('뒤에 있는 내부어는 안 잡는다', 내부어가앞에있나('Korea PE ratio by company — the valuation tape').length === 0);
  참('내부어가 없으면 빈 손', 내부어가앞에있나('Korea PE ratio by company').length === 0);
  참('빈 제목에도 안 터진다', 내부어가앞에있나(null).length === 0);

  /* ⭐ 오늘 고친 그 자리 — 이 시험이 그때의 지면을 다시 잡아야 한다 */
  const 고치기전 = 'PER, PBR and ROE for every company listed in Korea';
  참('PER 만 있으면 PE ratio 가 빠졌다고 한다',
    빠진손님말(고치기전).some((x) => x.손님 === 'PE ratio'));
  const 고친뒤 = 'The PE ratio — written PER in Korea — with PBR and ROE';
  참('둘 다 있으면 안 잡는다',
    !빠진손님말(고친뒤).some((x) => x.손님 === 'PE ratio'));

  /* ⛔ 대조군 — 우리 말 자체가 없으면 잡으면 안 된다. 안 그러면 날마다 거짓으로 운다 */
  참('우리 말이 아예 없으면 안 잡는다',
    !빠진손님말('Korean trade balance by product').some((x) => x.손님 === 'PE ratio'));
  참('빈 글에도 안 터진다', 빠진손님말(null).length === 0 && 빠진손님말('').length === 0);

  /* 🔴 2026-10-16 에 실제로 난 거짓 빨강 — 46장 가운데 40장이 이것으로 울었다 */
  참('upper 안의 per 를 PER 로 읽지 않는다', 빠진손님말('the upper one').length === 0);
  참('Percentages 안의 per 도 아니다', 빠진손님말('Percentages are of the row').length === 0);
  참('person 안의 per 도 아니다', 빠진손님말('a person or two').length === 0);
  참('진짜 PER 는 그대로 잡는다', 빠진손님말('PER, PBR and ROE').some((x) => x.손님 === 'PE ratio'));
  참('PER 다음에 쉼표가 와도 잡는다', 빠진손님말('we publish the PER, nothing else').some((x) => x.손님 === 'PE ratio'));

  참('제목을 홑따옴표에서 뽑는다', 제목뽑기("const TITLE = 'Korea PE ratio';") === 'Korea PE ratio');
  참('제목을 겹따옴표에서 뽑는다', 제목뽑기('const TITLE = "Korea PE ratio";') === 'Korea PE ratio');
  참('TITLE 이 없으면 null', 제목뽑기('const X = 1;') === null);

  /* 식은기간 — 사람 기억이 아니라 지면이 날짜를 들고 있게 한다 */
  const 글 = '⛔ 2026-10-30 전에는 이 제목을 다시 고치지 않는다 (식은기간 14일).';
  참('식은기간 날짜를 읽는다', 식은기간(글, new Date(2026, 9, 16))?.날짜 === '2026-10-30');
  참('남은 날을 센다', 식은기간(글, new Date(2026, 9, 16))?.남은날 === 14);
  참('아직이면 잴 때가 아니다', 식은기간(글, new Date(2026, 9, 16))?.잴때인가 === false);
  참('그 날이 되면 잴 때다', 식은기간(글, new Date(2026, 9, 30))?.잴때인가 === true);
  참('지났어도 잴 때다', 식은기간(글, new Date(2026, 10, 5))?.잴때인가 === true);
  참('그런 줄이 없으면 null', 식은기간('그냥 주석') === null);
  참('빈 것에도 안 터진다', 식은기간(null) === null);

  console.log((깨짐 ? '⛔ ' + 깨짐 + '개 깨짐 · ' : '✅ ') + 통과 + '개 통과');
  process.exit(깨짐 ? 1 : 0);
}

/* ── 실제로 잰다 ──────────────────────────────────────────────────── */
if (곧바로부른것 && !process.argv.includes('--자가시험')) {
  const 폴더 = path.join(뿌리, 'src', 'pages', 'data');
  const 파일들 = fs.readdirSync(폴더).filter((n) => n.endsWith('.astro') && n !== 'index.astro');

  /* ⭐ 먼저 «이제 효과를 재야 할 지면»부터 알린다 — 고치기보다 이것이 급하다 */
  const 재야할것 = [];
  const 식는중 = [];
  for (const 이름 of 파일들) {
    const 식 = 식은기간(fs.readFileSync(path.join(폴더, 이름), 'utf8'));
    if (!식) continue;
    (식.잴때인가 ? 재야할것 : 식는중).push({ 이름: 이름.replace('.astro', ''), ...식 });
  }
  if (재야할것.length) {
    console.log('🔴 식은기간이 지났다 — «효과를 재러» 돌아갈 지면 ' + 재야할것.length + '장');
    for (const x of 재야할것) console.log('   ' + x.이름.padEnd(30) + x.날짜 + ' 에 풀렸다 (' + (-x.남은날) + '일 지남)');
    console.log('     ⇒ GSC 를 다시 받아 그 지면의 자리가 올랐나 본다. 안 올랐으면 되돌린다.');
    console.log('');
  } else if (식는중.length) {
    console.log('⬜ 식는 중 — 아직 건드리지 않는다');
    for (const x of 식는중) console.log('   ' + x.이름.padEnd(30) + x.날짜 + ' 까지 (' + x.남은날 + '일 남음)');
    console.log('');
  }

  console.log('■ 우리 말로 쓰고 «손님 말»로 안 쓴 지면 — src/pages/data/*.astro ' + 파일들.length + '장');
  console.log('  ⛔ 손님이 치는 말이 지면에 없으면 그 말로는 영영 안 걸린다.');
  console.log('');

  const 걸린것 = [];
  for (const 이름 of 파일들) {
    const 소스 = fs.readFileSync(path.join(폴더, 이름), 'utf8');
    const 제목 = 제목뽑기(소스);
    const 앞내부어 = 제목 ? 내부어가앞에있나(제목) : [];
    const 모자람 = 빠진손님말(소스);
    if (앞내부어.length || 모자람.length) 걸린것.push({ 이름, 제목, 앞내부어, 모자람 });
  }

  if (!걸린것.length) { console.log('✅ 걸린 지면이 없다'); process.exit(0); }

  console.log('🔴 내부어가 제목 앞에 있는 지면');
  const ㄱ = 걸린것.filter((x) => x.앞내부어.length);
  if (!ㄱ.length) console.log('   ✅ 없다');
  for (const x of ㄱ) {
    console.log('   ' + x.이름.replace('.astro', '').padEnd(30) + '「' + x.앞내부어.join('·') + '」');
    console.log('        ' + String(x.제목).slice(0, 86));
  }

  console.log('');
  console.log('🔴 손님 말이 빠진 지면 (우리 말만 있다)');
  const ㄴ = 걸린것.filter((x) => x.모자람.length);
  if (!ㄴ.length) console.log('   ✅ 없다');
  for (const x of ㄴ.slice(0, 20)) {
    console.log('   ' + x.이름.replace('.astro', '').padEnd(30)
      + x.모자람.map((m) => m.손님 + '(' + m.우리[0] + '만 있다)').join(' · ').slice(0, 76));
  }

  console.log('');
  console.log('  ⬜ 「없다」가 곧 「틀렸다」는 아니다 — 그 지면에 안 맞는 말일 수 있다.');
  console.log('     고칠 때는 TITLE·H1·리드·DESC 넷을 «같이» 고치고, 14일은 다시 안 고친다.');
}
