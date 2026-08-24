/**
 * check-demand-covered.mjs — **잰 낱말이 지면 «제목»에 실제로 들어 있나.**
 *
 * ── 🔴 왜 이 자가 생겼나 ───────────────────────────────────────
 * 2026-08-24 에 재서 나온 진단은 이것이었다 —
 * 「우리는 **아무도 안 치는 말로 1위**를 하고 있다」(지면당 한 달 노출 4.5건).
 * 그 뒤로 나는 지면을 세 벌 냈다(나이 묶음 5장 · 별자리 12장 · 학교 56장). 그런데
 * **낼 때마다 「이 말로 된 지면이 없구나」를 손으로 찾았다.** 세 번 다 눈으로 찾았고,
 * 그중 두 번은 **이미 있는 지면을 못 보고 새로 만들려 했다** —
 * 오늘 새벽에 `netflix-top-10-korean-drama.astro` 와 `hometowns.astro` 가 이미 있는 것을
 * 지으려다 목록을 훑어서야 알았다.
 *
 * ⭐ 그래서 눈으로 하던 것을 자로 만든다. 이 자가 답하는 것은 하나다 —
 *   **「손님이 치는 이 말이, 우리 지면 제목 어딘가에 있나」**
 *
 * ── ⛔ 이 자가 «말하지 않는» 것 ────────────────────────────────
 * ⛔ 순위를 말하지 않는다. 제목에 말이 있는 것과 그 말로 검색에서 뜨는 것은 다른 일이다.
 *   이 자는 **「답할 자리가 있나」**까지만 말한다. 실제로 뜨는지는 GSC 로 따로 잰다.
 * ⛔ 「덮였다」를 「됐다」로 읽지 않는다. 제목에 말이 들어 있어도 그 지면이 그 물음에
 *   실제로 답하는지는 사람이 열어 봐야 안다.
 * ⛔ 못 잰 것을 「안 덮였다」로 적지 않는다. dist 가 없으면 «못 쟀다»고 적고 멈춘다 —
 *   0장을 훑고 「하나도 안 덮였다」고 내면 그 보고가 거짓이 된다.
 *
 * 쓰는 법  node scripts/check-demand-covered.mjs --자가시험
 *          node scripts/check-demand-covered.mjs
 *          node scripts/check-demand-covered.mjs --잰것=archive/keyword-demand/낱말3.json
 *          node scripts/check-demand-covered.mjs --지면=dist/100y   (다른 유닛도 쓴다)
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const 인자 = (이름, 기본) => {
  const 머리 = `--${이름}=`;
  const a = process.argv.find((x) => x.startsWith(머리));
  return a ? a.slice(머리.length) : 기본;
};

/** 제목 태그에서 글자만 — `<title>` 이 없으면 null 이다(0 이 아니다) */
export function 제목뽑기(html) {
  const m = String(html ?? '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  return m[1]
    /* 🔴 «숫자» 엔티티를 먼저 푼다. 이것을 안 풀어서 자가 한 번 틀렸다 —
       `Korean actors&#39; birthdays` 가 「korean actors 39 birthdays」로 읽혀
       「korean actors birthday」가 «안 덮였다»고 나왔다. 지면은 맞았고 자가 틀렸다.
       ⛔ 그때 지면 제목을 고치려 했다. 0/틀린 값이 나오면 «자»를 먼저 의심한다 */
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&mdash;|&ndash;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&(?:nbsp|quot|apos|lsquo|rsquo|ldquo|rdquo|hellip);/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ').trim();
}

/** 견주기 전에 양쪽을 같은 꼴로 — 대소문자·이음표·따옴표가 다른 것으로 어긋나지 않게 */
export function 고르기(s) {
  return String(s ?? '').toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * 낱말이 제목에 «들어 있나». 통째로 들어 있는 것과 낱낱이 흩어져 있는 것을 **갈라서** 센다.
 * ⭐ 이 둘을 합치면 안 된다 — 「korean drama list」의 세 낱말이 흩어져 있는 제목은
 *   그 물음에 답하는 제목이 아니다. 그래서 아래에서 `통째`만 「덮였다」로 센다.
 */
export function 견주기(말, 제목) {
  const m = 고르기(말);
  const t = 고르기(제목);
  if (!m || !t) return { 통째: false, 낱낱: false };
  if (t.includes(m)) return { 통째: true, 낱낱: true };
  const 조각 = m.split(' ').filter(Boolean);
  return { 통째: false, 낱낱: 조각.length > 0 && 조각.every((w) => t.includes(w)) };
}

/** dist 아래 html 을 다 모은다 — 폴더를 타고 내려간다 */
export function 지면모으기(뿌리길, 읽기 = { readdirSync, statSync }) {
  const 모음 = [];
  const 타고 = (곳) => {
    let 목록;
    try { 목록 = 읽기.readdirSync(곳); } catch { return; }
    for (const 이름 of 목록) {
      const 길 = path.join(곳, 이름);
      let st;
      try { st = 읽기.statSync(길); } catch { continue; }
      if (st.isDirectory()) 타고(길);
      else if (/\.html?$/i.test(이름)) 모음.push(길);
    }
  };
  타고(뿌리길);
  return 모음;
}

/** 잰 자료에서 «자동완성에 떠 있던» 말만 뽑는다. 안 뜬 말은 지면을 낼 까닭이 없다 */
export function 잴말뽑기(잰것) {
  /* ⚠ 칸 이름은 `measure-keyword-demand.mjs` 가 내는 그대로다 —
     `phrases[].말 · 그대로있나 · 몇번째 · 그말로시작 · 물음실패`.
     🔴 처음에 이 이름들을 «짐작»으로 적었다가 0개가 나왔다. 0 을 발견으로 읽지 않고
       잰 파일을 열어 본 것이 맞았다. 짝인 파일의 칸 이름은 열어서 확인한다 */
  const 줄 = 잰것?.phrases ?? 잰것?.말들 ?? [];
  const out = [];
  for (const r of 줄) {
    const 말 = r?.말 ?? r?.word;
    if (!말) continue;
    if (r?.물음실패) continue;
    const 있나 = r?.그대로있나 ?? r?.있다 ?? null;
    if (있나 === false) continue;
    out.push({ 말, 자리: r?.몇번째 ?? r?.자리 ?? null, 줄수: r?.그말로시작 ?? r?.줄수 ?? null });
  }
  return out;
}

/* ────────────────────────── 자가시험 ────────────────────────── */
function 자가시험() {
  const 시험 = [];
  const T = (이름, 참) => 시험.push([이름, !!참]);

  T('제목뽑기 — 태그 안 글자', 제목뽑기('<html><title>Hello There</title>') === 'Hello There');
  T('제목뽑기 — 없으면 null(0 이 아니다)', 제목뽑기('<html></html>') === null);
  T('제목뽑기 — 빈 값도 null', 제목뽑기(undefined) === null);
  T('제목뽑기 — 엔티티를 글자로 바꾼다', 제목뽑기('<title>A &mdash; B</title>') === 'A - B');
  T('제목뽑기 — 줄바꿈이 있어도 잡는다', 제목뽑기('<title>\n  Two\n  Lines\n</title>') === 'Two Lines');
  /* 🔴 이 셋이 «자가 한 번 틀렸던» 자리다. Astro 는 아포스트로피를 `&#39;` 로 낸다.
     숫자 엔티티를 안 풀면 「actors&#39; birthdays」가 「actors 39 birthdays」가 되어
     「korean actors birthday」가 안 덮였다고 나온다 — 지면이 아니라 자가 틀린 것이다 */
  T('제목뽑기 — 숫자 엔티티를 푼다(&#39; → 아포스트로피)',
    제목뽑기("<title>Korean actors&#39; birthdays</title>") === "Korean actors' birthdays");
  T('제목뽑기 — 숫자 엔티티가 «숫자로» 새지 않는다',
    !/39/.test(제목뽑기('<title>actors&#39; day</title>')));
  T('제목뽑기 — 16진 엔티티도 푼다',
    제목뽑기('<title>A&#x27;B</title>') === "A'B");
  T('제목뽑기 — 그 제목이 견주기에서 덮인다(끝까지 확인한다)',
    견주기('korean actors birthday', 제목뽑기("<title>Korean actors&#39; birthdays — 366 days</title>")).통째);

  T('고르기 — 대소문자를 지운다', 고르기('Korean Drama') === 고르기('korean drama'));
  T('고르기 — 이음표를 빈칸으로', 고르기('top-10') === 'top 10');
  T('고르기 — 아포스트로피를 지운다', 고르기("actors’ birthdays") === 'actors birthdays');

  T('견주기 — 통째로 있으면 통째', 견주기('korean drama list', 'The Korean Drama List for 2025').통째);
  T('견주기 — 흩어져 있으면 통째가 아니다',
    견주기('korean drama list', 'A list of every Korean drama').통째 === false);
  T('견주기 — 흩어져 있으면 낱낱은 참',
    견주기('korean drama list', 'A list of every Korean drama').낱낱 === true);
  T('견주기 — 한 낱말이 빠지면 낱낱도 거짓',
    견주기('korean drama list', 'A list of every Korean show').낱낱 === false);
  /* 🔴 이 시험을 고치면서 배운 것 — 「Korea」에는 「korean」이 «없다».
     처음에 제목을 「… from Korea」로 두고 낱낱이 참일 거라 적었는데 거짓이 나왔다.
     자가 아니라 «내 기대»가 틀렸다. 그래서 그 경계를 시험으로 박아 둔다 */
  T('견주기 — Korea 에는 korean 이 없다(부분글자로 안 속는다)',
    견주기('korean', 'Everything from Korea').낱낱 === false);
  T('견주기 — 이음표 차이로 안 어긋난다', 견주기('top 10', 'Netflix Top-10, counted').통째);
  T('견주기 — 빈 값에 안 터진다', 견주기('', 'anything').통째 === false);
  T('견주기 — 제목이 없어도 안 터진다', 견주기('a b', null).통째 === false);

  /* 지면모으기 — 폴더를 타고 내려가고, html 만 담는다 */
  const 가짜 = {
    readdirSync: (p) => ({
      '/x': ['a.html', 'sub', 'b.txt'],
      '/x/sub': ['c.html', 'd.png'],
    }[p.split(path.sep).join('/')] ?? []),
    statSync: (p) => ({ isDirectory: () => /sub$/.test(p) }),
  };
  const 모은 = 지면모으기('/x', 가짜).map((p) => path.basename(p)).sort();
  T('지면모으기 — html 만 담는다', JSON.stringify(모은) === JSON.stringify(['a.html', 'c.html']));
  T('지면모으기 — 없는 폴더에 안 터진다', 지면모으기('/없다', 가짜).length === 0);

  /* 잴말뽑기 — 안 뜬 말과 못 물은 말을 «둘 다» 뺀다 */
  /* 🔴 칸 이름은 measure-keyword-demand.mjs 가 «실제로 내는» 그대로여야 한다.
     짐작한 이름으로 두었더니 실측이 0개로 나왔다 — 0 은 발견이 아니라 자의 결함이었다.
     그래서 진짜 칸 이름으로 시험을 박는다 */
  const 뽑힌 = 잴말뽑기({ phrases: [
    { 말: 'a', 그대로있나: true, 몇번째: 1, 그말로시작: 10 },
    { 말: 'b', 그대로있나: false, 몇번째: null, 그말로시작: 0 },
    { 말: 'c', 물음실패: true },
    { 말: 'd', 그대로있나: true, 몇번째: 2, 그말로시작: 3 },
  ] });
  T('잴말뽑기 — 뜬 말만 남는다', 뽑힌.length === 2);
  T('잴말뽑기 — 안 뜬 말을 뺀다', !뽑힌.some((x) => x.말 === 'b'));
  T('잴말뽑기 — 못 물은 말을 «0 으로 안 적고» 뺀다', !뽑힌.some((x) => x.말 === 'c'));
  T('잴말뽑기 — 줄수를 같이 가져온다', 뽑힌[0].줄수 === 10);
  T('잴말뽑기 — 자리를 같이 가져온다', 뽑힌[1].자리 === 2);
  T('잴말뽑기 — 빈 자료에 안 터진다', 잴말뽑기(undefined).length === 0);
  T('잴말뽑기 — phrases 가 «실제» 칸 이름이다(짐작한 이름으로 0 이 났던 자리)',
    잴말뽑기({ phrases: [{ 말: 'x', 그대로있나: true, 그말로시작: 1 }] }).length === 1);

  const 진 = 시험.filter(([, ok]) => !ok);
  for (const [이름] of 진) console.error(`❌ ${이름}`);
  if (진.length) { console.error(`⛔ check-demand-covered 자가시험 ${진.length}개 실패`); process.exit(1); }
  console.log(`✅ check-demand-covered 자가시험 통과 (${시험.length})`);
}

/* ────────────────────────── 실행 ────────────────────────── */
if (process.argv.includes('--자가시험')) {
  자가시험();
} else {
  const 지면방 = path.resolve(뿌리, 인자('지면', 'dist/wikitip'));
  const 잰방 = path.resolve(뿌리, 인자('잰방', 'archive/keyword-demand'));
  const 한파일 = 인자('잰것', null);

  if (!existsSync(지면방)) {
    console.error(`⛔ 지면이 없다 — ${지면방}`);
    console.error('   «못 쟀다»다. 0장을 훑고 「하나도 안 덮였다」고 적지 않는다. 먼저 npm run build');
    process.exit(1);
  }

  const 잰파일들 = 한파일
    ? [path.resolve(뿌리, 한파일)]
    : (existsSync(잰방) ? readdirSync(잰방).filter((f) => f.endsWith('.json')).map((f) => path.join(잰방, f)) : []);
  if (!잰파일들.length) {
    console.error(`⛔ 잰 낱말 자료가 없다 — ${잰방}. 먼저 measure-keyword-demand.mjs 를 돌린다`);
    process.exit(1);
  }

  const 지면들 = 지면모으기(지면방);
  const 제목들 = [];
  let 제목없는지면 = 0;
  for (const f of 지면들) {
    const t = 제목뽑기(readFileSync(f, 'utf8'));
    if (t === null) { 제목없는지면++; continue; }
    제목들.push({ 길: path.relative(지면방, f), 제목: t });
  }

  console.log(`■ 지면 ${지면들.length}장 중 제목이 있는 것 ${제목들.length}장`
    + (제목없는지면 ? ` · 제목이 «없는» 것 ${제목없는지면}장 ⛔ 0 이 아니라 못 읽은 것이다` : ''));
  console.log('');

  const 덮인것 = [];
  const 안덮인것 = [];
  const 본말 = new Set();

  for (const f of 잰파일들) {
    let 잰것;
    try { 잰것 = JSON.parse(readFileSync(f, 'utf8')); } catch { console.error(`⚠ 못 읽었다 — ${f}`); continue; }
    for (const w of 잴말뽑기(잰것)) {
      if (본말.has(고르기(w.말))) continue;
      본말.add(고르기(w.말));
      const 통째맞음 = 제목들.filter((p) => 견주기(w.말, p.제목).통째);
      const 낱낱맞음 = 제목들.filter((p) => 견주기(w.말, p.제목).낱낱);
      if (통째맞음.length) 덮인것.push({ ...w, 지면: 통째맞음.slice(0, 2).map((p) => p.길) });
      else 안덮인것.push({ ...w, 낱낱: 낱낱맞음.length });
    }
  }

  안덮인것.sort((a, b) => (b.줄수 ?? 0) - (a.줄수 ?? 0) || (a.자리 ?? 99) - (b.자리 ?? 99));

  console.log(`■ 잰 낱말 ${본말.size}개 — 제목에 «통째로» 있는 것 ${덮인것.length}개`
    + ` · 없는 것 ${안덮인것.length}개`);
  console.log('');
  if (안덮인것.length) {
    console.log('■ 답할 자리가 «없는» 말 — 줄수 큰 것부터');
    for (const w of 안덮인것.slice(0, 25)) {
      const 자리글 = w.자리 === null ? '자리 모름' : `${w.자리}번째`;
      const 힌트 = w.낱낱 ? `  (낱말이 흩어져 있는 지면 ${w.낱낱}장 — 그 물음에 답하는 제목은 아니다)` : '';
      console.log(`  ${String(w.줄수 ?? '?').padStart(3)}줄 · ${자리글.padEnd(9)} ${w.말}${힌트}`);
    }
    console.log('');
  }
  if (덮인것.length) {
    console.log('■ 답할 자리가 «있는» 말');
    for (const w of 덮인것.slice(0, 25)) {
      console.log(`  ${String(w.줄수 ?? '?').padStart(3)}줄 · ${w.말}  →  ${w.지면.join(' · ')}`);
    }
    console.log('');
  }
  console.log('⛔ 「덮였다」는 «답할 자리가 있다»는 뜻이다 — 그 말로 검색에 «뜬다»는 뜻이 아니다.');
  console.log('   뜨는지는 Search Console 로 따로 잰다. 이 둘을 같은 것으로 적지 않는다.');
  console.log('⛔ 「안 덮였다」를 곧 「지면을 내라」로 읽지 않는다. 우리 자료가 그 물음에');
  console.log('   답할 수 있는지를 «먼저» 재야 한다 — 키(3.5%)는 수요가 컸는데도 안 만들었다.');
}
