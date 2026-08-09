#!/usr/bin/env node
/**
 * K Culture Wire 채널 문안 — 기사 하나에서 **채널마다 다른 글**을 뽑는다.
 *
 * 사장님 지시(2026-08-09):
 *   「엑스·쓰레드에 맞는 텍스트, 페이스북에 맞는 텍스트 — 다 따로따로 가야 되겠지」
 *
 * ⛔ **같은 글을 세 군데 복사해 붙이면 통과가 아니다.** 이 자는 셋이 서로 다른지 스스로 잰다.
 * ⛔ 우리 손님은 해외다. **영어로 쓴다.** 한글은 작품 제목에만 허용된다.
 * ⛔ 문안을 **지어내지 않는다.** 기사의 앞말(제목·부제·못하는말)에서만 가져온다.
 *    ⚠ 그래서 문안이 밋밋할 수 있다. 밋밋한 것이 지어낸 것보다 낫다.
 * ⛔ 계정이 없어 **올리지는 못한다.** 「계정 열면 오늘 올라감」 상태로 쌓아 둔다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 앞말, 앞말값, 한글몫, 한국어문턱 } from './kcw-deploy-quiz.mjs';

export const 기사방 = 'content/kculturewire';
export const 낼방 = 'docs/소셜-문안-5번';
export const 밑주소 = 'https://www.kculturewire.com';

/** X 한 글월 한도. ⚠ 주소는 t.co 로 23자로 쳐진다 */
export const X한도 = 280;
export const 주소값 = 23;

/**
 * 부제를 글월로 가른다. ⛔ 「7.7%」의 점에서 잘리면 문안이 반토막 난다.
 * ⚠ 자릿점을 U+0001 로 잠깐 바꿔 두고 가른 뒤 되돌린다.
 *   ⛔ 그 글자를 **소스에 직접 넣지 않는다** — 편집기에서 안 보여 다음 사람이 지운다.
 */
const 자릿점표 = '\u0001';
export function 글월들(글) {
  return String(글)
    .replace(/([0-9])\.([0-9])/g, `$1${자릿점표}$2`)
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.split(자릿점표).join('.').trim())
    .filter(Boolean);
}

/** 수가 들어간 글월. ⭐ 트위터에는 이것 하나만 나간다 */
export function 수있는글월(글월) {
  return 글월.filter((s) => /[0-9]/.test(s));
}

export function 태그(원문) {
  const m = 앞말(원문).match(/^tags:\s*\[(.*)\]/m);
  if (!m) return [];
  return m[1].split(',').map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
}

/** 인스타 해시태그. ⛔ 한글 태그를 안 쓴다 — 영어권 알고리즘에 걸려야 한다 */
export function 해시(원문) {
  const 밑 = ['KCultureWire', 'Netflix', 'Kdrama', 'DataJournalism'];
  const t = 태그(원문).map((x) => x.replace(/[^a-z0-9]/gi, ''))
    .filter((x) => x.length > 2)
    .map((x) => x[0].toUpperCase() + x.slice(1));
  return [...new Set([...t, ...밑])].slice(0, 8).map((x) => `#${x}`).join(' ');
}

export function X문안(제목, 글월, 주소) {
  const 수 = 수있는글월(글월);
  const 쓸 = 수.length ? 수[0] : 제목;
  const 남 = X한도 - 주소값 - 2;
  const 몸 = 쓸.length <= 남 ? 쓸 : `${쓸.slice(0, 남 - 1).replace(/\s+\S*$/, '')}…`;
  return `${몸}\n\n${주소}`;
}

export function 스레드문안(제목, 글월, 주소) {
  /* ⭐ X 가 쓴 글월은 **빼고** 쓴다. 그래야 두 채널이 다른 글이 된다 */
  const 수 = 수있는글월(글월);
  const 첫 = 수.length ? 수[0] : null;
  const 나머지 = 글월.filter((s) => s !== 첫);
  const 몸 = 나머지.length ? 나머지.slice(0, 2).join(' ') : 제목;
  return `${제목}\n\n${몸}\n\nHow we counted it, and what it cannot say: ${주소}`;
}

export function 인스타문안(제목, 글월, 원문, 주소) {
  const 줄 = 글월.slice(0, 3).map((s) => `· ${s}`).join('\n');
  return `${제목}\n\n${줄}\n\nWe publish the working, the thresholds we chose, and the questions this\ndata cannot answer. Link in bio → ${주소}\n\n${해시(원문)}`;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('글월을 가른다', 글월들('One. Two three.').length, 2);
  /* ⛔ 이 줄이 요점이다 — 7.7 의 점에서 자르면 문안이 반토막 난다 */
  재본다('7.7% 의 점에서 안 자른다', 글월들('They hold 7.7% of places. Next.'),
    ['They hold 7.7% of places.', 'Next.']);
  재본다('수 있는 글월만 고른다', 수있는글월(['No numbers here.', 'It is 12.']).length, 1);
  재본다('해시태그가 영어다', /^#[A-Za-z0-9 #]+$/.test(해시('---\ntags: ["korea", "netflix"]\n---')), true);

  const 글월 = 글월들('Korean titles hold 7.7% of chart places. It is not the same business everywhere.');
  const x = X문안('제목', 글월, `${밑주소}/article/a`);
  const th = 스레드문안('Title here', 글월, `${밑주소}/article/a`);
  const ig = 인스타문안('Title here', 글월, '---\ntags: ["korea"]\n---', `${밑주소}/article/a`);
  재본다('X 가 한도 안이다', x.length - 주소값 + 밑주소.length + 10 < 400, true);
  재본다('X 는 수 있는 글월을 쓴다', x.includes('7.7%'), true);
  /* ⛔ 셋이 같으면 「따로따로」가 아니다 */
  재본다('X 와 스레드가 다르다', x !== th, true);
  재본다('스레드가 X 의 글월을 되풀이하지 않는다', !스레드문안('T', 글월, 'u').includes('7.7%'), true);
  재본다('인스타가 스레드와 다르다', ig !== th, true);
  재본다('셋 다 영어다', [x, th, ig].every((s) => 한글몫(s) < 한국어문턱), true);
  console.log(`채널 문안 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  fs.mkdirSync(낼방, { recursive: true });
  const 글들 = fs.readdirSync(기사방).filter((f) => f.endsWith('.md')).sort();
  let 냄 = 0; let 건너뜀 = 0;
  const 탈 = [];
  for (const f of 글들) {
    const 원 = fs.readFileSync(`${기사방}/${f}`, 'utf8');
    const s = f.replace(/\.md$/, '');
    const 제목 = 앞말값(원, 'title');
    const 부제 = 앞말값(원, 'dek');
    if (!제목 || !부제) { 건너뜀 += 1; 탈.push(`${s} — 제목이나 부제가 없다`); continue; }
    const 주소 = `${밑주소}/article/${s}`;
    const 글월 = 글월들(부제);
    const x = X문안(제목, 글월, 주소);
    const th = 스레드문안(제목, 글월, 주소);
    const ig = 인스타문안(제목, 글월, 원, 주소);
    /* ── 내고 나서 스스로 본다 ── */
    if (x === th || th === ig || x === ig) { 탈.push(`${s} — 채널 글이 겹친다`); 건너뜀 += 1; continue; }
    for (const [이름, 글] of [['X', x], ['Threads', th], ['Instagram', ig]]) {
      if (한글몫(글) >= 한국어문턱) 탈.push(`${s} — ${이름} 문안이 한국어다(${한글몫(글)}%)`);
    }
    const 몸 = [
      `# 채널 문안 — ${제목}`, '',
      `> ⛔ 계정이 없어 **아직 안 올렸다.** 「계정 열면 오늘 올라감」 상태다.`,
      `> ⛔ 셋은 서로 다른 글이다. 복사해 붙인 것이 아니다.`,
      `> 기사: ${주소}`, '',
      '## X', '```', x, '```', `⚠ ${x.length - 주소.length + 주소값}자 (한도 ${X한도})`, '',
      '## Threads', '```', th, '```', '',
      '## Instagram', '```', ig, '```', '',
    ].join('\n');
    fs.writeFileSync(`${낼방}/${s}.md`, `${몸}\n`, 'utf8');
    냄 += 1;
  }
  console.log(`채널 문안 ${냄}편 냈다 · 건너뛴 것 ${건너뜀}편 → ${낼방}`);
  if (탈.length) {
    console.log('⚠ 걸린 것 —');
    for (const t of 탈) console.log(`   · ${t}`);
  }
  process.exit(0);
}
