#!/usr/bin/env node
/**
 * fix-seat-entry.mjs — **자리 입구가 「no conversation」 뒤 바로 닫히는 것을 고친다.**
 *
 *   node tools/fix-seat-entry.mjs            무엇이 깨졌나 잰다 (고치지 않는다)
 *   node tools/fix-seat-entry.mjs --고친다     ID 를 고쳐 쓴다
 *   node tools/fix-seat-entry.mjs --자가시험
 *
 * ── 🔴 무엇이 일어났나 (2026-09-10 07:2x · 사장님) ────────────────────────
 *
 * 사장님: 「**3, 4, 6번이 no conversation**」 · 「**그리고 바로 닫힘**」
 *
 * 재서 찾은 것 — 두 가지가 겹쳤다.
 * ```
 * 1. 등록된 세션 ID 가 죽어 있다 — 그 ID 의 .jsonl 이 아예 없다
 *      3.id 7e1ee7ec…  4.id 1eb27aad…  6.id 1bf27eb8…  ← 셋 다 파일이 없다
 * 2. 🔴 입구 .cmd 가 «실패한 이어열기를 성공으로 읽는다»
 *      claude --resume <죽은 ID>        글자만 찍고 «종료코드 0»
 *      if not errorlevel 1 goto done    → :done 으로 뛰어 창이 바로 닫힌다
 *    ⇒ 사장님이 보신 「no conversation 그리고 바로 닫힘」이 이 자리다
 * 3. 지킴이도 그 셋을 못 깨운다 — 「대화록을 못 찾았다」로 건너뛴다
 * ```
 *
 * ⚠ 그리고 «설명하지 못하는 것»이 하나 남아 있다 — 3·4·6번은 09-09 저녁까지
 *   커밋을 했는데(3번 19:47 · 6번 22:42 · 4번 23:57) 그 시각의 대화기록이
 *   어느 설정 폴더에도 없다. 09-05·09-01 에서 멈춰 있다.
 *   ⛔ 까닭을 «지어내지 않는다». 못 쟀다고 적고, 고칠 수 있는 것만 고친다.
 *
 * ── 이 자가 하는 일 ──────────────────────────────────────────────────────
 * ```
 * ✅ 자리마다 등록된 ID 의 대화기록이 «실제로 있나»를 잰다
 * ✅ 없으면 그 자리의 «가장 최근 살아 있는» 대화기록으로 갈아 준다
 * ⛔ 갈아 줄 것이 없으면 ID 를 «비운다» — 그러면 입구가 새 대화를 연다.
 *    죽은 ID 를 남겨 두는 것보다 새로 여는 것이 낫다(창이 닫히지 않는다)
 * ⛔ 작업폴더가 이상한 대화기록(C--WINDOWS-system32 등)은 고르지 않는다 —
 *    그 자리로 이어 열면 엉뚱한 폴더에서 일하게 된다
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 입구방 = 'C:/Users/User/OneDrive/Desktop/00_세션입구/_현재';
export const 설정뿌리 = 'C:/Users/User';

/** 자리마다 어느 폴더에서 일하는가 — 이어열기는 «그 폴더»에서만 찾는다 */
export const 자리들 = [
  { 번호: 1, 이름: 'KLifeMap', 프로젝트: ['C--Users-USER-Documents-GitHub-klifemap'] },
  { 번호: 2, 이름: '조율', 프로젝트: ['C--Users-User-OneDrive-Desktop'] },
  { 번호: 3, 이름: '백년지도', 프로젝트: ['C--Users-User-OneDrive-Desktop', 'C--Users-User-Documents-GitHub-dataeconomics'] },
  { 번호: 4, 이름: 'KLifeMap보조', 프로젝트: ['C--Users-User-OneDrive-Desktop', 'C--Users-USER-Documents-GitHub-klifemap'] },
  { 번호: 5, 이름: '케이컬처와이어', 프로젝트: ['C--Users-User-OneDrive-Desktop', 'C--Users-User-Documents-GitHub-dataeconomics'] },
  { 번호: 6, 이름: '서울마켓', 프로젝트: ['C--Users-User-OneDrive-Desktop', 'C--Users-User-Documents-GitHub-dataeconomics'] },
];

/**
 * ⛔ 이 폴더 이름들은 «고르지 않는다» — 작업폴더가 엉뚱한 자리다.
 *   실측: 3번의 가장 최근 대화기록이 `C--WINDOWS-system32` 에 있었다.
 *   거기로 이어 열면 시스템 폴더에서 일하게 된다.
 */
export const 안고르는폴더 = /^C--WINDOWS|^C--Users-USER-Desktop-+$|system32/i;

/**
 * 대화기록 하나가 이어열 만한가.
 *
 * 🔴 [2026-09-10] «오래된 것은 이어열지 않는다»를 넣었다.
 *   3·4·6번의 이어열 후보가 09-01·09-05 것이었다 — 9일·5일 전이다.
 *   그것을 이어 열면 유닛이 «일주일 전»으로 되돌아간다. 그동안 한 일을 모르는 채로
 *   말하기 시작하고, 그것이 사장님께 옛 상태로 보고된다.
 *   ⇒ 새로 여는 것이 낫다 — 새 창은 CLAUDE.md · 인계-현재상태 · 메모 꼬리를 읽어
 *     «지금»에서 시작한다. 이어열기의 값은 오늘 것에만 있다.
 */
export const 이어열참는시간 = 36 * 3600 * 1000;   /* 36시간 — 하룻밤을 넘겨도 이어진다 */

export function 이어열만한가(폴더이름, 크기바이트, 때 = null, 지금 = Date.now(), 참는 = 이어열참는시간) {
  if (!폴더이름 || 안고르는폴더.test(폴더이름)) return false;
  if (!Number.isFinite(크기바이트) || 크기바이트 < 20 * 1024) return false;  /* 빈 껍데기 */
  if (때 === null || 때 === undefined) return true;              /* 때를 못 쟀으면 크기로만 본다 */
  if (!Number.isFinite(때)) return false;
  return 지금 - 때 <= 참는;
}

/** ID 꼴이 맞나 — uuid 여야 한다. ⛔ 아무 글자나 ID 로 쓰지 않는다 */
export function id꼴맞나(글) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(글 ?? '').trim());
}

/**
 * 자리 하나의 대화기록을 모은다.
 * @returns {{id:string, 폴더:string, 크기:number, 때:number, 쓸만한가:boolean}[]}
 */
export function 대화기록모으기(자리, 뿌리 = 설정뿌리, 훑기 = null) {
  const 방 = path.join(뿌리, `.claude-u${자리.번호}`, 'projects');
  const 것 = [];
  const 폴더읽기 = 훑기 ?? ((d) => { try { return fs.readdirSync(d, { withFileTypes: true }); } catch { return []; } });
  for (const e of 폴더읽기(방)) {
    if (!e.isDirectory?.()) continue;
    const 안 = path.join(방, e.name);
    for (const f of 폴더읽기(안)) {
      if (!f.isFile?.() || !f.name.endsWith('.jsonl')) continue;
      const id = f.name.replace(/\.jsonl$/, '');
      if (!id꼴맞나(id)) continue;
      let st;
      try { st = fs.statSync(path.join(안, f.name)); } catch { continue; }
      것.push({
        id, 폴더: e.name, 크기: st.size, 때: st.mtimeMs,
        쓸만한가: 이어열만한가(e.name, st.size, st.mtimeMs),
      });
    }
  }
  return 것.sort((a, b) => b.때 - a.때);
}

/**
 * 그 자리에 쓸 ID 를 고른다.
 * ⛔ 없으면 «비운다»(null). 죽은 ID 를 남기면 창이 바로 닫힌다.
 */
export function 고를것(기록들) {
  const 쓸것 = (기록들 ?? []).filter((r) => r.쓸만한가);
  return 쓸것.length ? 쓸것[0] : null;
}

/** 지금 적힌 ID 가 살아 있나 */
export function 지금것살았나(적힌id, 기록들) {
  if (!id꼴맞나(적힌id)) return { 살았나: false, 까닭: 'ID 꼴이 아니다' };
  const 있나 = (기록들 ?? []).some((r) => r.id.toLowerCase() === String(적힌id).trim().toLowerCase());
  return 있나 ? { 살았나: true, 까닭: null } : { 살았나: false, 까닭: '그 ID 의 대화기록이 없다' };
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('자리가 여섯이다', 자리들.length === 6);
  재다('id꼴: uuid 를 받는다', id꼴맞나('7e1ee7ec-cbc3-4ad0-b464-976e67495f40') === true);
  재다('⛔ id꼴: 아무 글자는 안 받는다', id꼴맞나('없음') === false && id꼴맞나('') === false);
  재다('id꼴: null 도 안 죽는다', id꼴맞나(null) === false);
  재다('id꼴: 앞뒤 빈칸을 떤다', id꼴맞나('  7e1ee7ec-cbc3-4ad0-b464-976e67495f40 \n') === true);

  const 이제 = Date.parse('2026-09-10T07:30:00+09:00');
  const 어제밤 = Date.parse('2026-09-09T23:00:00+09:00');
  const 아흐레전 = Date.parse('2026-09-01T19:00:00+09:00');
  재다('이어열만한가: 큰 것은 된다',
    이어열만한가('C--Users-User-OneDrive-Desktop', 500 * 1024, 어제밤, 이제) === true);
  재다('🔴 이어열만한가: 아흐레 전 것은 «안 이어 연다» — 유닛이 일주일 전으로 되돌아간다',
    이어열만한가('C--Users-User-OneDrive-Desktop', 500 * 1024, 아흐레전, 이제) === false);
  재다('이어열만한가: 때를 못 쟀으면 크기로만 본다',
    이어열만한가('C--Users-User-OneDrive-Desktop', 500 * 1024, null, 이제) === true);
  재다('⛔ 이어열만한가: 너무 작으면 안 된다 (빈 껍데기)',
    이어열만한가('C--Users-User-OneDrive-Desktop', 1024, 어제밤, 이제) === false);
  재다('🔴 이어열만한가: system32 폴더는 «고르지 않는다» — 엉뚱한 폴더에서 일하게 된다',
    이어열만한가('C--WINDOWS-system32', 500 * 1024, 어제밤, 이제) === false);
  재다('⛔ 이어열만한가: 폴더 이름이 없으면 안 된다', 이어열만한가('', 500 * 1024, 어제밤, 이제) === false);

  /* ⚠ 시험에도 «진짜 uuid 꼴»을 쓴다. 처음엔 'a'·'b' 로 써서 내 시험이 틀렸다 —
   *   id꼴맞나() 가 먼저 걸러 내는데 나는 그것을 잊고 「살았다」를 기대했다. */
  const A = '11111111-1111-4111-8111-111111111111';
  const B = '22222222-2222-4222-8222-222222222222';
  const C = '33333333-3333-4333-8333-333333333333';
  const 기록 = [
    { id: A, 폴더: 'C--WINDOWS-system32', 크기: 999999, 때: 300, 쓸만한가: false },
    { id: B, 폴더: 'C--Users-User-OneDrive-Desktop', 크기: 500 * 1024, 때: 200, 쓸만한가: true },
    { id: C, 폴더: 'C--Users-User-OneDrive-Desktop', 크기: 900 * 1024, 때: 100, 쓸만한가: true },
  ];
  재다('고를것: 쓸만한 것 중 «가장 최근»을 고른다', 고를것(기록).id === B);
  재다('🔴 고를것: 더 최근이어도 system32 는 안 고른다', 고를것(기록).id !== A);
  재다('⛔ 고를것: 쓸 것이 없으면 null — 죽은 ID 를 남기지 않는다',
    고를것([{ id: A, 쓸만한가: false }]) === null && 고를것([]) === null);
  재다('고를것: null 도 안 죽는다', 고를것(null) === null);

  재다('지금것: 있으면 살았다', 지금것살았나(B, [{ id: B }]).살았나 === true);
  재다('🔴 지금것: 없으면 죽었다 — 이것이 3·4·6번이었다',
    지금것살았나('7e1ee7ec-cbc3-4ad0-b464-976e67495f40', [{ id: B }]).살았나 === false);
  재다('지금것: 대소문자를 가리지 않는다',
    지금것살았나(B.toUpperCase(), [{ id: B }]).살았나 === true);
  재다('지금것: 꼴이 아니면 죽었다로 본다', 지금것살았나('없음', [{ id: '없음' }]).살았나 === false);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`\n■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
if (!자가시험()) process.exit(1);
if (process.argv.includes('--자가시험')) process.exit(0);

const 고친다 = process.argv.includes('--고친다');
console.log(`\n■ 자리 입구 — 등록된 세션 ID 가 «살아 있나»${고친다 ? ' (고친다)' : ' (재기만 한다)'}\n`);

let 깨진것 = 0; let 고친것 = 0; let 비운것 = 0;
for (const 자리 of 자리들) {
  const id길 = path.join(입구방, `${자리.번호}.id`);
  let 적힌 = '';
  try { 적힌 = fs.readFileSync(id길, 'utf8').trim(); } catch { /* 없으면 빈 것 */ }
  const 기록 = 대화기록모으기(자리);
  const 지금 = 지금것살았나(적힌, 기록);

  if (지금.살았나) {
    const r = 기록.find((x) => x.id.toLowerCase() === 적힌.toLowerCase());
    console.log(`  ✅ ${자리.번호}번 ${자리.이름.padEnd(16)} 살아 있다 — ${(r.크기 / 1024 / 1024).toFixed(0)}MB · ${r.폴더}`);
    continue;
  }

  깨진것 += 1;
  console.log(`  🔴 ${자리.번호}번 ${자리.이름.padEnd(16)} ${지금.까닭}  (적힌 것: ${적힌 || '(비어 있음)'})`);
  const 고를 = 고를것(기록);
  if (고를) {
    console.log(`     ✅ 갈아 줄 것 — ${고를.id}  ${(고를.크기 / 1024 / 1024).toFixed(1)}MB · ${고를.폴더}`
      + `  (${new Date(고를.때).toLocaleString('ko-KR', { hour12: false })})`);
    if (고친다) {
      fs.copyFileSync(id길, `${id길}.죽은것-${new Date().toISOString().slice(0, 10)}`);
      fs.writeFileSync(id길, 고를.id, 'utf8');
      고친것 += 1;
      console.log('     ✅ 고쳐 썼다 (옛 것은 .죽은것-<날> 으로 남겼다)');
    }
  } else {
    console.log('     ⬜ 이어열 만한 대화기록이 없다 — ID 를 «비운다». 그러면 입구가 새 대화를 연다');
    if (고친다) {
      try { fs.copyFileSync(id길, `${id길}.죽은것-${new Date().toISOString().slice(0, 10)}`); } catch { /* 없어도 된다 */ }
      fs.writeFileSync(id길, '', 'utf8');
      비운것 += 1;
      console.log('     ✅ 비웠다 — 창이 닫히지 않고 새 대화가 열린다');
    }
  }
  if (기록.length) {
    console.log(`     ⚠ 그 자리에 있는 대화기록 ${기록.length}개 중 최근 셋 —`);
    for (const r of 기록.slice(0, 3)) {
      console.log(`        ${r.쓸만한가 ? '✅' : '⛔'} ${(r.크기 / 1024 / 1024).toFixed(1).padStart(6)}MB  ${r.폴더}/${r.id.slice(0, 8)}…`
        + `  ${new Date(r.때).toLocaleString('ko-KR', { hour12: false })}`);
    }
  } else {
    console.log('     🔴 그 자리에 대화기록이 «하나도» 없다');
  }
}

console.log(`\n  깨진 자리 ${깨진것}개` + (고친다 ? ` · 고친 것 ${고친것} · 비운 것 ${비운것}` : ''));
if (!고친다 && 깨진것) console.log('  ⇒ 고치려면: node tools/fix-seat-entry.mjs --고친다');
console.log('\n🔴 그리고 입구 .cmd 자체도 고쳐야 한다 —');
console.log('   claude --resume <죽은 ID> 는 «종료코드 0» 으로 끝난다. 그래서 .cmd 가');
console.log('   그것을 성공으로 읽고 :done 으로 뛰어 «창이 바로 닫힌다».');
console.log('   ⇒ 이어열기 전에 그 ID 의 .jsonl 이 «있나»를 먼저 보고 부른다.');
