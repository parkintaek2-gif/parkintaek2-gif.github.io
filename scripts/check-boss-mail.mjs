#!/usr/bin/env node
/**
 * check-boss-mail.mjs — **사장님께 보내는 자들이 «새 주소»를 쓰나.**
 *
 * 🔴 사장님 지시 (2026-09-27): 「메일을 앞으론 parkintaek2@gmail.com 으로 보내줘.
 *   네이버는 첨부파일을 다운로드 후 찾기가 어려워」
 *
 * ── 왜 검사로 두나 ─────────────────────────────────────────────
 * 주소가 아홉 파일에 박혀 있었다. 한 곳만 고치면 나머지가 조용히 옛 주소로 간다 —
 * 그러면 사장님은 「보냈다는데 안 왔다」를 겪으시고, 우리는 보낸 기록만 보고
 * 「보냈습니다」라고 적는다. ⛔ 그 어긋남은 사람이 기억해서 못 막는다.
 *
 * ⚠ 대외 연락처는 «다른 값»이다 — 제안서·인증서 등록에 적힌 주소는 여기서 안 센다.
 *   보고·결과물을 보내는 자만 본다. 그 목록이 아래 `볼것` 이다.
 *
 * 쓰는 법
 *   node scripts/check-boss-mail.mjs
 *   node scripts/check-boss-mail.mjs --자가시험   (영문 별칭 --selftest)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 사장님메일, 옛주소, 없는주소, 옛주소들었나 } from './lib/boss-mail.mjs';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 사장님께 «보내는» 자들. 대외 문서는 여기 넣지 않는다 */
export const 볼것 = [
  'docs/중부매일-스포츠-받는곳.txt',
  'scripts/auto-1600-report.mjs',
  'scripts/send-1600-report.mjs',
  'scripts/check-16시보고.mjs',
  'scripts/check-kcw-wakers.mjs',
  'scripts/collect-jbnews-sports-articles.mjs',
  'scripts/check-승인요청-새는곳.mjs',
  'docs/5번-업무매뉴얼.md',
];

/** 그 파일이 새 주소를 쓰나 — {있다, 옛것} */
export function 재기(상대길, 뿌리2 = 뿌리) {
  const 길 = path.join(뿌리2, 상대길);
  if (!fs.existsSync(길)) return { 없다: true };
  const 글 = fs.readFileSync(길, 'utf8');
  return { 새것: 글.includes(사장님메일), 옛것: 옛주소들었나(글) };
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; const 실패 = [];
  const 본다 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패.push(이름); console.log('❌ ' + 이름); } };

  본다('🔴 정본 주소가 지메일이다', 사장님메일 === 'parkintaek2@gmail.com');
  본다('옛 주소를 지우지 않고 남겼다', 옛주소.includes('parkintaek@naver.com'));
  본다('🔴 있지도 않은 주소를 따로 적어 뒀다', 없는주소.includes('parkintaek2@naver.com'));
  본다('옛 주소가 든 글을 잡는다', 옛주소들었나('보낼 곳 parkintaek@naver.com').length === 1);
  본다('⛔ 새 주소는 안 잡는다', 옛주소들었나(`보낼 곳 ${사장님메일}`).length === 0);
  본다('⛔ 빈 것·null 에도 안 터진다', 옛주소들었나(null).length === 0 && 옛주소들었나('').length === 0);
  본다('⛔ 없는 파일에도 안 터진다', 재기('없는파일.txt').없다 === true);
  /* ⚠ 새 주소와 옛 주소는 앞이 같다(parkintaek…) — 부분 일치로 잘못 잡으면 안 된다 */
  본다('⛔ 앞이 같아도 헷갈리지 않는다', !사장님메일.includes('naver'));

  console.log(`\n${실패.length ? '❌' : '✅'} 자가시험 ${통과}${실패.length ? ' · 실패 ' + 실패.length : ' 통과'}`);
  return !실패.length;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1);
} else if (내가진입점) {
  const 흠 = [];
  console.log(`■ 사장님께 보내는 주소 — ${사장님메일}`);
  for (const f of 볼것) {
    const r = 재기(f);
    if (r.없다) { console.log(`  ⬜ ${f} — 파일이 없다`); continue; }
    if (r.옛것.length) { 흠.push(`${f} — 옛 주소가 남아 있다 (${r.옛것.join(', ')})`); console.log(`  🔴 ${f}`); continue; }
    console.log(`  ${r.새것 ? '✅' : '⬜'} ${f}${r.새것 ? '' : ' — 주소가 안 보인다(다른 데서 읽는 자일 수 있다)'}`);
  }
  if (!흠.length) { console.log('\n✅ 보고를 보내는 자들이 다 새 주소를 쓴다'); process.exit(0); }
  console.log(`\n🔴 흠 ${흠.length}개`);
  for (const s of 흠) console.log(`   · ${s}`);
  process.exit(1);
}
