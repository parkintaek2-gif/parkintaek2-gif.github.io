#!/usr/bin/env node
/**
 * K Culture Wire — **기사마다 다른 공유 카드**(1200×630 PNG).
 *
 *   node scripts/make-og-articles.mjs          카드를 만든다
 *   node scripts/make-og-articles.mjs --list   무엇을 고를지만 보여준다 (안 만든다)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-08 08:4x. 2번 지시. 기사 36편의 og:image 가 **전부 /og.svg 한 장**이었다.
 * 두 가지가 동시에 틀렸다.
 *   ① **SVG 는 카카오톡·X·페이스북이 안 그린다.** 공유하면 그림이 아예 안 뜬다
 *   ② 36편이 같은 그림이면 떠도 다 똑같다. 공유되는 순간이 유입의 첫 칸인데 비어 있었다
 *
 * ── ⛔ 자동으로 고르지 않는다 ─────────────────────────────────
 * 「글머리의 첫 수를 뽑는다」로 짜면 대개 맞지만 **몇 편이 조용히 틀린다.**
 *   · korea-music-outsells-television → 「In 2012 …」 의 **2012**(연도)를 집는다
 *   · netflix-korean-catalogue-…      → 「Top 10」 의 **10**(제목의 일부)을 집는다
 *   · two-hops-from-squid-game        → 「Sixty-nine」 은 글자라 못 집고 **432** 를 집는다
 * 그래서 자동은 **제안**만 하고, 고른 값은 `src/data/wikitip-og-cards.json` 에 적는다.
 * 그리고 **고른 수가 그 기사 본문에 실제로 있는지 확인**하고 없으면 선다.
 * 없는 수를 카드에 박으면 공유된 그림이 기사와 다른 말을 한다 — 그게 제일 나쁘다.
 *
 * ── ⚠ 어디에 두나 ─────────────────────────────────────────────
 * `server.mjs` 가 `kculturewire.com` 을 `dist/wikitip/` 로 보낸다.
 * Astro 는 `public/*` 를 `dist/*` 로 복사하므로
 *   `public/wikitip/og/<slug>.png` → `https://www.kculturewire.com/og/<slug>.png` 다.
 * ⛔ `public/og/` 에 두면 **서울마켓 자리**로 가서 여기서는 404 다.
 *
 * ⚠ 이 카드에는 한글이 없다(영문 매체다). 그래도 글꼴 대체는 확인하고 커밋한다.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 기사방 = path.join(ROOT, 'content', 'kculturewire');
const 고른것 = path.join(ROOT, 'src', 'data', 'wikitip-og-cards.json');
const 낼방 = path.join(ROOT, 'public', 'wikitip', 'og');

/** 지면과 같은 값이다. `WikiTip.astro` 의 어두운 쪽 토큰을 옮겨 적었다 */
const 색 = { 바탕: '#14111c', 결: '#1c1826', 보라: '#b491e8', 글: '#ece9f3', 흐림: '#a49cb8', 선: '#2b2635' };
const 고딕 = "'Helvetica Neue',Helvetica,Arial,'Segoe UI',sans-serif";
const 명조 = "Georgia,'Times New Roman',serif";

/* ── 자료 읽기 ────────────────────────────────────────────────── */

/** 앞머리(frontmatter)와 본문을 가른다. */
export function 가른다(원문) {
  const m = 원문.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { 머리: '', 몸: 원문 };
  return { 머리: m[1], 몸: m[2] };
}

const 머리값 = (머리, 열쇠) => {
  const m = 머리.match(new RegExp(`^${열쇠}:\\s*(.*)$`, 'm'));
  if (!m) return '';
  return m[1].trim().replace(/^['"]|['"]$/g, '').trim();
};

/**
 * 카드에 박을 수를 **제안**한다. 판정이 아니다 — 사람이 읽고 고친다.
 * ⛔ 연도(1900~2099)와 「Top 10」 같은 제목 속 수는 거른다. 그래도 다 못 거른다.
 */
export function 제안(dek) {
  const 걸러진 = dek.replace(/Top\s+\d+/gi, ' ');
  const 수들 = [...걸러진.matchAll(/[$₩]?\d[\d,]*(?:\.\d+)?\s*(?:%|bn|m\b|billion|million)?/g)];
  for (const m of 수들) {
    const 값 = m[0].trim();
    /* 맨 수 네 자리가 1900~2099 면 연도로 본다. 「2,623 LP」 처럼 쉼표가 있으면 연도가 아니다 */
    if (/^\d{4}$/.test(값) && +값 >= 1900 && +값 <= 2099) continue;
    /* ⛔ 쉼표로 자르면 **수 한가운데가 잘린다** — 「of the 1,545」 가 「of the 1」 이 됐다.
       숫자 사이의 쉼표는 자르는 자리가 아니다. 잠시 다른 글자로 바꿔 두고 나중에 되돌린다. */
    const 뒤 = 걸러진.slice(m.index + m[0].length).trim().replace(/(\d),(\d)/g, '$1$2');
    const 토막 = 뒤.split(/[.,;:—–]|\sand\s|\sbut\s|\sagainst\s/)[0].replace(//g, ',').trim();
    /* 「with a recorded」 처럼 **말이 끊긴 채** 끝나면 그 꼬리를 뗀다 */
    const 꼬리 = /^(a|an|the|in|of|on|to|as|at|for|with|that|than|from|and|but|is|are|was|were|by)$/i;
    const 낱말 = 토막.split(/\s+/).slice(0, 6);
    while (낱말.length && 꼬리.test(낱말[낱말.length - 1])) 낱말.pop();
    return { figure: 값, label: 낱말.join(' ') };
  }
  return null;
}

/** 긴 글을 폭에 맞춰 줄로 나눈다. sharp 는 SVG 자동 줄바꿈을 안 한다 — 우리가 센다. */
export function 접는다(글, 칸당, 최대줄) {
  const 줄 = [];
  let 현재 = '';
  for (const 낱말 of 글.split(/\s+/)) {
    const 후보 = 현재 ? `${현재} ${낱말}` : 낱말;
    if (후보.length > 칸당 && 현재) { 줄.push(현재); 현재 = 낱말; } else 현재 = 후보;
  }
  if (현재) 줄.push(현재);
  if (줄.length > 최대줄) { 줄.length = 최대줄; 줄[최대줄 - 1] = `${줄[최대줄 - 1].replace(/[\s,;:]+$/, '')}…`; }
  return 줄;
}

const 막는다 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 수 길이에 맞춰 글자 크기를 줄인다. 「23.7 billion」 이 「54%」 와 같은 크기면 넘친다. */
export const 수크기 = (n) => (n.length <= 5 ? 120 : n.length <= 8 ? 100 : n.length <= 12 ? 82 : 68);

/**
 * 세로 자리를 **하나씩 쌓아서** 잡는다.
 * ⛔ 처음엔 자리를 따로따로 적었다가 **딱지가 가로줄과 제목을 뚫고 지나갔다**(첫 장을 열어 보고 알았다).
 *    수 크기가 달라지면 아래가 다 밀린다 — 그래서 앞의 것 위에 더한다.
 */
export function 자리(figure, 줄수) {
  const 크기 = 수크기(figure);
  const 수 = 130 + 크기;          // 수의 밑줄
  const 딱지 = 수 + 42;
  const 가로줄 = 딱지 + 36;
  const 제목 = 가로줄 + 52 + (3 - 줄수) * 26;   // 줄이 적으면 조금 내려 가운데로 온다
  return { 크기, 수, 딱지, 가로줄, 제목, 마지막: 제목 + (줄수 - 1) * 52 };
}

export function 카드SVG({ figure, label, title }) {
  const 제목줄 = 접는다(title, 42, 3);
  const y = 자리(figure, 제목줄.length);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${색.바탕}"/>
  <rect x="0" y="0" width="1200" height="8" fill="${색.보라}"/>

  <text x="80" y="96" font-family="${고딕}" font-size="26" font-weight="bold"
        fill="${색.보라}" letter-spacing="6">K CULTURE WIRE</text>

  <text x="80" y="${y.수}" font-family="${명조}" font-size="${y.크기}" font-weight="bold"
        fill="${색.글}" letter-spacing="-2">${막는다(figure)}</text>
  ${label ? `<text x="80" y="${y.딱지}" font-family="${고딕}" font-size="28"
        fill="${색.흐림}">${막는다(label)}</text>` : ''}

  <line x1="80" y1="${y.가로줄}" x2="1120" y2="${y.가로줄}" stroke="${색.선}" stroke-width="1"/>

  ${제목줄.map((줄, i) => `<text x="80" y="${y.제목 + i * 52}" font-family="${고딕}" font-size="40"
        font-weight="bold" fill="${색.글}">${막는다(줄)}</text>`).join('\n  ')}

  <text x="80" y="576" font-family="${고딕}" font-size="24" fill="${색.흐림}">
    Measured, not repeated &#183; every figure has a table behind it</text>
  <text x="1120" y="576" text-anchor="end" font-family="${고딕}" font-size="24"
        fill="${색.보라}" letter-spacing="1">kculturewire.com</text>
</svg>`;
}

/* ── 여기부터 실행 ────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('make-og-articles.mjs')) {
  /* 자가시험 — 자를 먼저 잰다 */
  let 시험 = 0; let 통과 = 0;
  const 본다 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  본다('연도를 안 집는다', 제안('In 2012 the two were the same size, and music took 54.1%.').figure === '54.1%');
  본다('Top 10 의 10 을 안 집는다', 제안('Five years of Top 10 hold 23.7 billion hours.').figure === '23.7 billion');
  본다('쉼표 있는 네 자리는 연도가 아니다', 제안('Being top 300 means 2,623 LP in Europe West.').figure === '2,623');
  본다('달러를 붙여 집는다', 제안('Exports went from $22m in 2005 to $1.80bn.').figure === '$22m');
  본다('수가 없으면 못 고른다', 제안('No figures live in this sentence at all.') === null);
  본다('수 속의 쉼표로 자르지 않는다', 제안('154 of the 1,545 individuals also chart.').label === 'of the 1,545 individuals also chart');
  본다('끊긴 꼬리를 뗀다', 제안('660 Korean titles have some kind of a recorded cast.').label === 'Korean titles have some kind');
  본다('긴 제목을 접는다', 접는다('longword '.repeat(40), 42, 3).length === 3);
  본다('넘치면 말줄임을 단다', 접는다('longword '.repeat(40), 42, 3)[2].endsWith('…'));
  본다('꼭 맞으면 말줄임을 안 단다', !접는다('longword '.repeat(12), 42, 3)[2].endsWith('…'));
  본다('짧은 제목은 안 접는다', 접는다('Short title', 42, 3).length === 1);
  본다('앞머리를 가른다', 가른다('---\ntitle: X\n---\nbody here').몸.trim() === 'body here');
  본다('& 를 막는다', 카드SVG({ figure: '1', label: 'a & b', title: 'T' }).includes('a &amp; b'));
  /* ⛔ 첫 장을 열어 보니 딱지가 가로줄과 제목을 뚫고 지나갔다. 그 뒤로 자리를 자로 잰다. */
  본다('딱지가 가로줄 위에 있다', 자리('54%', 3).딱지 < 자리('54%', 3).가로줄);
  본다('가로줄이 제목 위에 있다', 자리('54%', 3).가로줄 < 자리('54%', 3).제목 - 30);
  본다('가장 큰 수여도 꼬리말을 안 넘는다', 자리('23.7 billion', 3).마지막 < 540);
  본다('가장 작은 수여도 꼬리말을 안 넘는다', 자리('54%', 3).마지막 < 540);
  console.log(`공유 카드 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const 보기만 = process.argv.includes('--list');
  const 손으로 = fs.existsSync(고른것) ? JSON.parse(fs.readFileSync(고른것, 'utf8')) : { chosen: {} };
  const 고른 = 손으로.chosen ?? {};

  const 파일들 = fs.readdirSync(기사방).filter((f) => f.endsWith('.md')).sort();
  const 결과 = [];
  const 막힌것 = [];

  for (const f of 파일들) {
    const slug = f.replace(/\.md$/, '');
    const 원문 = fs.readFileSync(path.join(기사방, f), 'utf8');
    const { 머리, 몸 } = 가른다(원문);
    const title = 머리값(머리, 'title');
    const dek = 머리값(머리, 'dek');

    const 손 = 고른[slug];
    const 자동 = 제안(dek);
    const 쓸것 = 손 ? { figure: 손.figure, label: 손.label ?? '', 출처: '손' }
      : 자동 ? { ...자동, 출처: '자동' } : null;

    if (!쓸것) { 막힌것.push(`${slug} — 글머리에 수가 없다. wikitip-og-cards.json 에 손으로 적어라`); continue; }

    /* ⛔ 고른 수가 **그 기사 안에 실제로 있는지** 본다. 없으면 카드가 기사와 다른 말을 한다. */
    const 온글 = `${title}\n${dek}\n${몸}`;
    const 느슨 = (s) => s.replace(/[,\s]/g, '').toLowerCase();
    if (!느슨(온글).includes(느슨(쓸것.figure))) {
      막힌것.push(`${slug} — 「${쓸것.figure}」(${쓸것.출처})가 기사 본문에 없다`);
      continue;
    }
    결과.push({ slug, title, ...쓸것 });
  }

  const 폭 = Math.max(...결과.map((r) => r.slug.length), 10);
  for (const r of 결과) {
    console.log(`  ${r.slug.padEnd(폭)}  ${r.출처}  ${r.figure}${r.label ? ` — ${r.label}` : ''}`);
  }
  if (막힌것.length) {
    console.log(`\n⛔ 못 만든 것 ${막힌것.length}편`);
    for (const m of 막힌것) console.log(`  · ${m}`);
  }

  if (보기만) {
    console.log(`\n제안만 봤다 — 기사 ${파일들.length}편 중 ${결과.length}편 고름 (손 ${결과.filter((r) => r.출처 === '손').length}편)`);
    process.exit(막힌것.length ? 1 : 0);
  }

  if (막힌것.length) {
    console.log('\n⛔ 한 편이라도 못 고르면 안 만든다. 빈 카드가 나가는 것보다 낫다.');
    process.exit(1);
  }

  fs.mkdirSync(낼방, { recursive: true });
  let 잰것 = 0;
  for (const r of 결과) {
    const png = await sharp(Buffer.from(카드SVG(r))).png().toBuffer();
    fs.writeFileSync(path.join(낼방, `${r.slug}.png`), png);
    잰것 += png.length;
  }

  /* 기사가 아닌 지면이 쓸 기본 카드. 여기도 SVG 를 PNG 로 바꾼다 — 같은 까닭이다. */
  const 기본 = 카드SVG({
    figure: `${결과.length}`,
    label: 'measured stories, and the tables behind them',
    title: 'Korean film, music, esports and the companies behind them',
  });
  fs.writeFileSync(path.join(ROOT, 'public', 'wikitip', 'og.png'), await sharp(Buffer.from(기본)).png().toBuffer());

  console.log(`\n카드 ${결과.length}장 + 기본 1장 — 평균 ${(잰것 / 결과.length / 1024).toFixed(0)}KB`);
  console.log(`→ public/wikitip/og/<slug>.png · https://www.kculturewire.com/og/<slug>.png`);
  console.log('⚠ 한 장을 실제로 열어 **수가 읽히는지** 보고 커밋한다.');
}
