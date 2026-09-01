#!/usr/bin/env node
/**
 * add-kcw-name-tags.mjs — **제목·본문에 나온 스타 이름을 태그에 넣는다.**
 *
 * ── 🔴 왜 (2026-09-01) ──────────────────────────────────────
 * 사장님: 「**인기 검색어는 스타 이름·작품명·노래제목이다.** 그 말이 제목과 본문의
 * 위·가운데·끝에 나와야 한다」
 *
 * 제목을 줄이면서 재 봤더니 — **제목에 스타 이름이 있는 기사 110편 중 103편이
 * 그 이름을 태그에 안 적어 두고 있었다.** 태그는 「wikipedia · southeast asia ·
 * method」 같은 갈래말뿐이었다.
 * ⛔ 손님은 「song kang」을 치는데 우리 표에는 「method」라고 적혀 있었다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ 이름을 «짐작하지» 않는다. `wikitip-people.json` 의 **진짜 이름 634개**로만 맞춘다.
 *   (대문자로 짐작했다가 「Yesterday Song Kang」의 첫 낱말을 이름으로 세는 잘못을 했다)
 * ⛔ 있던 태그를 **지우지 않는다.** 갈래말을 지우면 그 갈래로 묶는 표가 끊긴다.
 * ⛔ **제목에 있는 이름만** 넣는다. 본문에 한 번 스친 이름까지 넣으면 태그가 쓰레기가 된다.
 * ⚠ 두 글자 이름(IU·RM·V)을 길이로 거르지 않는다 — 한국 연예인에게 흔하다.
 * ⚠ 안쪽 하이픈을 살린다 — `cha-eun-woo` 는 제목에 `Cha Eun-woo` 로 적혀 있다.
 *
 * 쓰는 법
 *   node scripts/add-kcw-name-tags.mjs --자가시험
 *   node scripts/add-kcw-name-tags.mjs            (센다 — 안 고친다)
 *   node scripts/add-kcw-name-tags.mjs --넣는다    (넣는다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 사람 이름 → 태그 슬러그. "Cha Eun-woo" → "cha-eun-woo" */
export function 슬러그로(이름) {
  const s = String(이름 ?? '').trim();
  if (!s) return '';
  return s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * 제목 안에 이 이름이 «낱말째로» 있나.
 * ⛔ 낱말 한가운데를 잡으면 안 된다 — 「IU」가 「serIoUs」에 걸리면 태그가 거짓이 된다.
 */
export function 제목에있나(제목, 이름) {
  const s = String(제목 ?? '');
  const n = String(이름 ?? '').trim();
  if (!s || n.length < 2) return false;
  const 쪽 = n.split(/[-\s]+/).filter(Boolean).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!쪽.length) return false;
  return new RegExp(`\\b${쪽.join('[- ]')}\\b`, 'i').test(s);
}

/** 넣을 태그를 고른다. ⛔ 이미 있는 것은 안 넣는다 */
export function 넣을태그(제목, 있던태그, 사람이름) {
  if (!Array.isArray(사람이름)) return null;              /* ⛔ 못 쟀다 */
  const 있 = new Set((있던태그 ?? []).map((x) => 슬러그로(x)));
  const 낼것 = [];
  for (const 이름 of 사람이름) {
    if (!제목에있나(제목, 이름)) continue;
    const 슬 = 슬러그로(이름);
    if (!슬 || 있.has(슬)) continue;
    있.add(슬);
    낼것.push(슬);
  }
  return 낼것;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  let 센것 = 0;
  const 검 = (이름, 참) => { 센것 += 1; if (!참) 실패.push(이름); };
  const 사람 = ['Song Kang', 'IU', 'Cha Eun-woo', 'Ma Dong-seok'];

  검('슬러그로 바꾼다', 슬러그로('Cha Eun-woo') === 'cha-eun-woo');
  검('아포스트로피를 버린다', 슬러그로("Girl's Day") === 'girls-day');
  검('⛔ 빈 값은 빈 글자', 슬러그로('') === '' && 슬러그로(null) === '');

  검('제목에서 이름을 찾는다', 제목에있나('Song Kang is looked up 3.3x more', 'Song Kang') === true);
  검('두 글자 이름도 찾는다', 제목에있나('IU is a Rooster', 'IU') === true);
  검('안쪽 하이픈을 살린다', 제목에있나('Cha Eun-woo an Ox', 'Cha Eun-woo') === true);
  검('⛔ 낱말 한가운데는 안 잡는다', 제목에있나('a serious matter', 'IU') === false);
  검('⛔ 없는 이름은 false', 제목에있나('Korea has the lowest rate', 'Song Kang') === false);

  검('없던 이름을 낸다',
    JSON.stringify(넣을태그('Song Kang and IU', ['method'], 사람)) === JSON.stringify(['song-kang', 'iu']));
  검('⛔ 이미 있는 것은 안 낸다',
    JSON.stringify(넣을태그('Song Kang and IU', ['song-kang'], 사람)) === JSON.stringify(['iu']));
  검('⛔ 제목에 없으면 안 낸다',
    JSON.stringify(넣을태그('Korea has the lowest rate', [], 사람)) === JSON.stringify([]));
  검('⛔ 사람 목록을 못 읽으면 null — 빈 배열이 아니다',
    넣을태그('Song Kang', [], null) === null);
  검('있던 태그를 안 지운다 — 이 자는 «낼 것»만 돌려준다',
    넣을태그('Song Kang', ['method', 'wikipedia'], 사람).includes('method') === false);

  return { 실패, 센것 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const { 실패, 센것 } = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ add-kcw-name-tags 자가시험 통과 (${센것})`);
  process.exit(0);
}

if (내가실행됐다) {
  const 넣나 = process.argv.includes('--넣는다');

  let 사람이름 = null;
  try {
    const p = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-people.json'), 'utf8'));
    사람이름 = (p.people ?? []).map((x) => x.name).filter(Boolean);
    if (!사람이름.length) 사람이름 = null;
  } catch { 사람이름 = null; }

  if (사람이름 === null) {
    console.error('⛔ **사람 이름을 못 읽었다** — wikitip-people.json. 「이름이 없다」가 아니라 「못 쟀다」다.');
    process.exit(1);
  }
  console.log(`■ 제목의 스타 이름을 태그에 — 볼 이름 ${사람이름.length}개${넣나 ? '' : '  (세기만 한다. 넣으려면 --넣는다)'}\n`);

  const 방 = path.join(뿌리, 'content/kculturewire');
  let 고침 = 0; let 더한수 = 0;
  const 탈 = [];

  for (const f of fs.readdirSync(방).filter((x) => x.endsWith('.md'))) {
    const p = path.join(방, f);
    let s = fs.readFileSync(p, 'utf8');
    const tm = s.match(/^title:\s*"([\s\S]*?)"\s*$/m);
    if (!tm) { 탈.push(`${f} — title 칸이 없다`); continue; }
    const gm = s.match(/^tags:\s*\[([^\]]*)\]/m);
    if (!gm) { 탈.push(`${f} — tags 칸이 없다. 이름을 못 넣는다`); continue; }
    const 있던 = gm[1].split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);

    const 낼것 = 넣을태그(tm[1], 있던, 사람이름);
    if (!낼것 || !낼것.length) continue;

    console.log(`   ${f.replace(/\.md$/, '')}`);
    console.log(`      + ${낼것.join(' · ')}`);
    고침 += 1; 더한수 += 낼것.length;

    if (넣나) {
      /* ⛔ 이름을 «앞»에 둔다 — 사람이 먼저 보는 자리다. 있던 갈래말은 그대로 뒤에 */
      const 합 = [...낼것, ...있던];
      s = s.replace(/^tags:\s*\[[^\]]*\]/m, `tags: [${합.map((x) => `"${x}"`).join(', ')}]`);
      fs.writeFileSync(p, s);
    }
  }

  console.log(`\n${넣나 ? '✅ 넣었다' : '■ 넣을 것'} — 기사 ${고침}편 · 태그 ${더한수}개`);
  if (탈.length) {
    console.log(`\n⚠ 못 본 것 ${탈.length}건 — 숨기지 않고 적는다`);
    탈.slice(0, 10).forEach((x) => console.log(`   · ${x}`));
  }
  if (!넣나) console.log('\n   넣으려면  node scripts/add-kcw-name-tags.mjs --넣는다');
}
