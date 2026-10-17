#!/usr/bin/env node
/**
 * 준PO-기사-한번에.mjs — **경기 결과만 넣으면 기사까지 한 번에 간다.**
 *
 * ── 🔴 왜 (2026-10-17 · 5번) ─────────────────────────────────────────
 * 사장님 — 「**오늘 낮 2시 준플레이오프 1차전 경기 시작. 경기 끝나면 알려줄테니
 *   기사 쓸 준비 해놔**」 그리고 앞서 — 「**앞으로 기사 쓰라고 하면 10분 내에 완료해**」
 *
 * ⭐ 10분을 지키는 길은 «미리 해 둘 수 있는 것을 다 해 두는 것»이다.
 *   배경 사실(선발·상대전적·징크스·확률)은 경기 전에 이미 모아 뼈대에 넣어 뒀다.
 *   경기가 끝나면 «결과 한 덩이»만 끼우면 된다. 회차는 웹 검색을 하지 않는다.
 *   ⚠ 2026-10-16 에 회차가 웹 검색 25번을 돌려 21분을 썼다. 사실을 미리 주면 4분이다.
 *
 * ⛔ 보내지 않는다. 데스킹까지만 하고 선다 — 내가 눈으로 보고 보낸다.
 *   (사장님 「보내기 전에 전부 눈으로 보라」)
 *
 * ── 🔴 차수 (2026-10-17 저녁 · 5번) ─────────────────────────────────
 * 1차전만 되게 지었더니 2차전에 그대로 못 썼다. 시리즈는 최대 다섯 경기다.
 * ⇒ `--차수` 로 받는다. 안 주면 1차전이다(옛 부름이 그대로 돈다).
 * ⚠ 차수마다 «뼈대를 미리 지어 두는 것»이 10분을 지키는 길이다 — 자가 뼈대를 짓지 않는다.
 *
 * 쓰는 법
 *   1) docs/준PO{N}차전-결과.txt 에 경기 결과를 적는다 (스코어·결정적 장면·투수·타자)
 *   2) node scripts/준PO-기사-한번에.mjs --차수 2 --회차 16
 *   3) 나온 데스킹 결과를 눈으로 보고 메일을 짓는다
 *
 *   node scripts/준PO-기사-한번에.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 차수에 맞는 세 길. ⛔ 1~5차전 밖은 받지 않는다 — 5전 3선승제다 */
export function 길들(차수 = 1) {
  const n = Number(차수);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return {
    뼈대: `docs/지시-중부매일-준PO${n}차전-뼈대.txt`,
    결과: `docs/준PO${n}차전-결과.txt`,
    지시: `docs/지시-중부매일-준PO${n}차전.txt`,
  };
}

/* 옛 부름이 그대로 돌게 1차전 값을 남긴다 */
export const 뼈대길 = 길들(1).뼈대;
export const 결과길 = 길들(1).결과;
export const 지시길 = 길들(1).지시;
export const 자리표 = '<<<여기에 경기 결과를 넣는다>>>';

/** 뼈대에 결과를 끼운다 — 자리표가 없으면 선다 */
export function 끼운다(뼈대, 결과) {
  const b = String(뼈대 ?? '');
  const r = String(결과 ?? '').trim();
  if (!b.includes(자리표)) return { 된다: false, 까닭: '뼈대에 자리표가 없다', 글: null };
  if (r.length < 40) return { 된다: false, 까닭: `결과가 너무 짧다(${r.length}자) — 안 시킨다`, 글: null };
  if (r.includes(자리표)) return { 된다: false, 까닭: '결과 자리에 자리표가 그대로 있다', 글: null };
  return { 된다: true, 까닭: null, 글: b.replace(자리표, r) };
}

/**
 * ⛔ 「경기가 끝났다」를 내가 짐작하지 않는다 — 결과 글에 스코어가 있어야 한다.
 *   2026-10-05 에 «안 치른 경기»로 기사가 나갈 뻔했다.
 */
export function 스코어있나(결과) {
  const g = String(결과 ?? '');
  return /\d+\s*(?:대|:|-)\s*\d+/.test(g);
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 검 = (이름, 참) => 것.push({ 이름, 참: !!참 });
  const 뼈 = `앞머리\n${자리표}\n뒷머리`;
  const 긴결과 = 'KIA가 LG를 5대 3으로 이겼다. 김도영이 8회 결승 2점 홈런을 쳤고 네일은 6이닝 2실점으로 던졌다.';

  검('자리표에 결과가 들어간다', 끼운다(뼈, 긴결과).글.includes(긴결과));
  검('🔴 자리표가 사라진다', !끼운다(뼈, 긴결과).글.includes(자리표));
  검('🔴 자리표가 없는 뼈대는 선다', !끼운다('자리표 없는 글', 긴결과).된다);
  검('🔴 짧은 결과는 선다', !끼운다(뼈, '이겼다').된다);
  검('🔴 결과에 자리표가 그대로면 선다', !끼운다(뼈, 자리표 + '아직 안 넣었다 아직 안 넣었다 아직').된다);
  검('⛔ 빈 결과는 선다', !끼운다(뼈, '').된다);
  검('막을 때 까닭을 적는다', /짧다/.test(끼운다(뼈, '이겼다').까닭 || ''));

  검('스코어를 알아본다 — 5대 3', 스코어있나('KIA가 5대 3으로 이겼다'));
  검('스코어를 알아본다 — 5:3', 스코어있나('5:3'));
  검('스코어를 알아본다 — 5-3', 스코어있나('5-3 승리'));
  검('⛔ 대조군 — 스코어가 없으면 거짓', !스코어있나('KIA가 이겼다'));
  검('⛔ 대조군 — 날짜는 스코어가 아니다', !스코어있나('10월 17일 오후 2시 경기'));
  검('⛔ 빈 글은 거짓', !스코어있나(''));

  검('🔴 차수 밖은 받지 않는다 — 0·6·소수', !길들(0) && !길들(6) && !길들(1.5));
  검('차수마다 다른 길을 낸다', 길들(2).뼈대.includes('준PO2차전') && 길들(2).결과.includes('준PO2차전'));
  검('안 주면 1차전이다', 길들().뼈대 === 뼈대길);

  /* ⭐ 「있는 뼈대 하나」가 아니라 «지어 둔 뼈대 전부»를 본다 —
     2차전 뼈대를 새로 지으면서 1차전 뼈대만 검사하면, 새것이 규칙을 깨도 통과한다. */
  const 지어둔뼈대 = [1, 2, 3, 4, 5].map((n) => 길들(n).뼈대).filter((p) => fs.existsSync(path.join(뿌리, p)));
  검('뼈대를 적어도 하나는 지어 뒀다', 지어둔뼈대.length >= 1);
  for (const p of 지어둔뼈대) {
    const 글 = fs.readFileSync(path.join(뿌리, p), 'utf8');
    const 이름 = p.replace('docs/지시-중부매일-', '');
    검(`🔴 ${이름} — 자리표가 있다`, 글.includes(자리표));
    검(`🔴 ${이름} — 웹 검색을 막는다`, 글.includes('웹 검색은 하지 마십시오'));
    검(`🔴 ${이름} — 바이라인을 머리에 넣으라고 한다`, 글.includes('[중부매일 박인택 기자]'));
    검(`🔴 ${이름} — 충청권을 끌어오지 말라고 한다`, 글.includes('충청권 고리를 만들어 붙이지'));
    검(`🔴 ${이름} — 제목 서술형을 막는다`, 글.includes('제목을 서술형으로 맺지 마십시오'));
  }

  for (const x of 것) console.log(`${x.참 ? '✅' : '🔴'} ${x.이름}`);
  const 탈 = 것.filter((x) => !x.참).length;
  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${것.length} 통과`);
  return 탈 === 0;
}

/* ── 손으로 돌릴 때 ───────────────────────────────────────────────── */
const 나인가 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (나인가) {
  if (process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }

  const 회차 = process.argv.includes('--회차') ? process.argv[process.argv.indexOf('--회차') + 1] : null;
  if (!회차) { console.log('⛔ --회차 16 처럼 회차를 준다'); process.exit(1); }

  const 차수 = process.argv.includes('--차수') ? process.argv[process.argv.indexOf('--차수') + 1] : 1;
  const 길 = 길들(차수);
  if (!길) { console.log(`🔴 차수가 1~5 가 아니다 — ${차수}`); process.exit(1); }
  const { 뼈대: 뼈대길, 결과: 결과길, 지시: 지시길 } = 길;
  console.log(`준PO ${Number(차수)}차전`);

  /* ⛔ 뼈대가 없으면 선다 — 「미리 지어 둔다」가 이 자의 전제다 */
  if (!fs.existsSync(path.join(뿌리, 뼈대길))) {
    console.log(`🔴 뼈대가 없다 — ${뼈대길}`);
    console.log('   ⛔ 경기가 끝난 뒤에 뼈대를 짓지 않는다. 그러면 10분을 못 지킨다.');
    process.exit(1);
  }

  const 결과온길 = path.join(뿌리, 결과길);
  if (!fs.existsSync(결과온길)) {
    console.log(`🔴 결과 파일이 없다 — ${결과길}`);
    console.log('   ⛔ 경기 결과를 먼저 적는다. 짐작으로 시키지 않는다.');
    process.exit(1);
  }
  const 결과 = fs.readFileSync(결과온길, 'utf8');
  if (!스코어있나(결과)) {
    console.log('🔴 결과 글에 스코어가 없다 — **안 시킨다.**');
    console.log('   ⛔ 「끝났다」를 내가 짐작하지 않는다. 2026-10-05 에 안 치른 경기가 나갈 뻔했다.');
    process.exit(1);
  }
  const 짠것 = 끼운다(fs.readFileSync(path.join(뿌리, 뼈대길), 'utf8'), 결과);
  if (!짠것.된다) { console.log(`🔴 ${짠것.까닭} — **안 시킨다.**`); process.exit(1); }
  fs.writeFileSync(path.join(뿌리, 지시길), 짠것.글, 'utf8');
  console.log(`✔ 지시문을 지었다 — ${지시길} (${짠것.글.length}자)`);

  console.log(`\n→ ${회차}시 회차에 시킨다`);
  const r = spawnSync(process.execPath, [path.join(뿌리, 'scripts', '시킨다-중부매일-기사.mjs'), '--회차', 회차, '--글', 지시길],
    { cwd: 뿌리, encoding: 'utf8', timeout: 6 * 60 * 1000, stdio: 'inherit' });
  if (r.status !== 0) { console.log('\n🔴 시키지 못했다 — 위 까닭을 본다'); process.exit(1); }

  console.log('\n⭐ 회차가 쓰는 동안 할 것');
  console.log('   1) node scripts/연합뉴스-사진-찾는다.mjs "KIA LG 준플레이오프"');
  console.log('   2) 다 쓰면 기사를 떼어 docs/ 에 적고');
  console.log('   3) node scripts/desk-jbnews-article.mjs --file=<그 파일> --적는다');
  console.log('   4) 데스킹 결과를 «눈으로 보고» 메일을 짓는다');
  console.log('   ⛔ 이 자는 보내지 않는다 — 보내기 전에 전부 눈으로 본다(사장님 지시)');
}
