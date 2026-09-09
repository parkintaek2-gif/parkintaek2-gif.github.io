#!/usr/bin/env node
/**
 * seat-resume-check.mjs — **이 자리에 «이어 열 대화»가 있나**를 먼저 재고, 그 ID 를 준다.
 *
 *   node tools/seat-resume-check.mjs 3            사람이 읽는 판정
 *   node tools/seat-resume-check.mjs 3 --아이디     이어 열 대화 ID 만 (없으면 아무것도 안 찍는다)
 *   node tools/seat-resume-check.mjs --자가시험
 *
 *   종료코드 0  이어 열 수 있다  → 입구가 `claude --resume <ID>` 를 부른다
 *   종료코드 1  이어 열 것이 없다 → 입구가 `claude` 로 «새 대화»를 연다
 *
 * ── 🔴 왜 만드나 (2026-09-10 · 사장님) ───────────────────────────────────
 *
 * 사장님: 「**3, 4, 6번이 no conversation**」 · 「**그리고 바로 닫힘**」
 * 사장님: 「정확하게 세션마다 설정 폴더를 하나만 두면 이런 일이 또 없는 것 아닌가?
 *        **이런 일 있을 때마다 가슴이 철렁 내려앉는다, 놀래서**....세션입구를 정확히 해서,
 *        **다시 열면 바로 이어서 업무를 할 수 있게** 해줘, 제발」
 *
 * ⚠ 설정 폴더는 «이미» 자리마다 하나씩이다(.claude-u1~u6). 그것이 어긋난 것이 아니었다.
 *   2026-09-10 에 재서 어긋난 곳을 셋 찾았다 —
 * ```
 * 1. 🔴 «ID 대장이 낡는다»
 *      입구가 _현재/3.id 에 적힌 ID 로 --resume 을 부른다. 그 ID 의 대화기록이 없으면
 *      --resume 이 「no conversation」만 찍는다. 그런데 **종료코드가 0** 이다.
 *      그래서 .cmd 가 성공으로 읽고 `goto done` 으로 «창을 닫았다».
 *      ⇒ 이 자가 대장을 안 쓴다. **디스크를 훑어 살아 있는 ID 를 그때그때 찾는다.**
 * 2. 🔴 «대화기록 폴더»와 «작업폴더»가 다르다 — 이것을 짐작으로 틀리게 읽었다
 *      폴더 이름은 «그 세션이 처음 열린 폴더»로 굳는다. 그 뒤 --resume 을 어느 폴더에서
 *      부르든 기록은 «처음 그 폴더»에 이어 쌓인다. 실측 —
 *        입구 .cmd 는 여섯 자리 모두 dataeconomics 로 cd 한다
 *        그런데 살아 있는 5번 기록은 C--Users-User-OneDrive-Desktop 에 있다(218MB)
 *      ⇒ ⛔ 그래서 `--continue`(지금 폴더의 최근 대화)로 바꾸면 **살아 있는 자리가 죽는다.**
 *        dataeconomics 폴더에는 5번 대화가 «하나도» 없다. 반드시 «ID 로» 이어야 한다.
 * 3. 실패한 이어열기를 성공으로 읽었다 (위 1번의 종료코드 0)
 * ```
 *
 * ⛔ 아주 오래된 것은 이어 열지 않는다 — 3·4·6번의 후보가 5~9일 전 것이었다.
 *   그것을 이어 열면 유닛이 일주일 전 상태로 말하기 시작한다. 새로 여는 것이 낫다.
 *   새 창은 CLAUDE.md · docs/인계-현재상태.md · 메모 꼬리를 읽어 «지금»에서 시작한다.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * 🔴 자리마다 «작업폴더를 못박는다». 창이 열릴 때 cd 할 곳이다.
 * ⚠ 이것은 «일하는 폴더»이고, 대화기록이 쌓이는 폴더와 다를 수 있다(위 2번).
 *   그래서 여기 값을 고쳐도 살아 있는 자리가 죽지 않는다 — 이을 때는 ID 로 이으니까.
 */
export const 자리작업방 = {
  1: 'C:/Users/USER/Documents/GitHub/klifemap',
  2: 'C:/Users/User/Documents/GitHub/dataeconomics',
  3: 'C:/Users/User/Documents/GitHub/dataeconomics',
  4: 'C:/Users/USER/Documents/GitHub/klifemap',
  5: 'C:/Users/User/Documents/GitHub/dataeconomics',
  6: 'C:/Users/User/Documents/GitHub/dataeconomics',
};

export const 이어열참는시간 = 36 * 3600 * 1000;   /* 36시간 — 하룻밤을 넘겨도 이어진다 */
export const 최소크기 = 20 * 1024;                 /* 이보다 작으면 빈 껍데기다 */

/** 경로를 Claude Code 의 프로젝트 폴더 이름으로 — `C:\A\B` → `C--A-B` */
export function 폴더이름(길) {
  const s = String(길 ?? '').trim().replace(/\//g, '\\').replace(/\\+$/, '');
  if (!s) return null;
  return s.replace(/:/g, '-').replace(/\\/g, '-');
}

export const 대화꼴 = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/i;

/** 파일이름에서 세션 ID 를 뽑는다. 꼴이 아니면 null */
export function 아이디뽑기(파일이름) {
  const m = String(파일이름 ?? '').match(대화꼴);
  return m ? m[1] : null;
}

/**
 * 한 자리의 대화를 «폴더를 가리지 않고» 모두 모은다.
 *
 * ⭐ 이것이 이 자의 핵심이다 — 어느 폴더에 쌓였는지 짐작하지 않는다.
 *   .claude-uN/projects 아래를 통째로 훑어서 «살아 있는 것»을 찾는다.
 */
export function 대화모으기(자리, 뿌리 = 'C:/Users/User', 폴더읽기 = null, 재기 = null) {
  const 읽기 = 폴더읽기 ?? ((d) => { try { return fs.readdirSync(d); } catch { return null; } });
  const 잼 = 재기 ?? ((p) => { try { return fs.statSync(p); } catch { return null; } });

  const 프로젝트방 = path.join(뿌리, `.claude-u${자리}`, 'projects');
  const 방들 = 읽기(프로젝트방);
  if (방들 === null) return { 것들: [], 저장소있나: false };

  const 것들 = [];
  for (const 방 of 방들) {
    const 목록 = 읽기(path.join(프로젝트방, 방));
    if (목록 === null) continue;
    for (const f of 목록) {
      const id = 아이디뽑기(f);
      if (!id) continue;
      const st = 잼(path.join(프로젝트방, 방, f));
      if (!st || !Number.isFinite(st.size) || !Number.isFinite(st.mtimeMs)) continue;
      것들.push({ id, 방, 크기: st.size, 때: st.mtimeMs });
    }
  }
  것들.sort((a, b) => b.때 - a.때);
  return { 것들, 저장소있나: true };
}

/**
 * 이어 열 만한 대화가 있나.
 * @returns {{된다:boolean, 까닭:string|null, 고른것:object|null, 본것:number}}
 */
export function 이어열수있나(자리, 지금 = Date.now(), 뿌리 = 'C:/Users/User', 폴더읽기 = null, 재기 = null) {
  if (!자리작업방[자리]) {
    return { 된다: false, 까닭: `${자리}번 자리가 목록에 없다`, 고른것: null, 본것: 0 };
  }
  const { 것들, 저장소있나 } = 대화모으기(자리, 뿌리, 폴더읽기, 재기);
  if (!저장소있나) {
    return { 된다: false, 까닭: `.claude-u${자리}/projects 가 없다`, 고른것: null, 본것: 0 };
  }
  if (!것들.length) {
    return { 된다: false, 까닭: '이 자리에 대화기록이 하나도 없다', 고른것: null, 본것: 0 };
  }

  /* ⛔ 「가장 최근 것」 하나만 보고 판정하지 않는다 — 빈 껍데기가 맨 앞에 오면
   *   바로 뒤에 있는 «쓸 만한 것»을 놓친다. 조건을 다 만족하는 첫째를 고른다. */
  const 참는선 = 지금 - 이어열참는시간;
  const 고른것 = 것들.find((x) => x.크기 >= 최소크기 && x.때 >= 참는선) ?? null;
  if (고른것) return { 된다: true, 까닭: null, 고른것, 본것: 것들.length };

  const 최근 = 것들[0];
  const 시간 = Math.round((지금 - 최근.때) / 3600000);
  const 까닭 = 최근.크기 < 최소크기
    ? `쓸 만한 대화가 없다 — 가장 최근 것이 ${(최근.크기 / 1024).toFixed(0)}KB 뿐이다(빈 껍데기)`
    : `가장 최근 대화가 ${시간}시간 전 것이다 — 이어 열면 그때로 되돌아간다`;
  return { 된다: false, 까닭, 고른것: 최근, 본것: 것들.length };
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  const U1 = '11111111-1111-4111-8111-111111111111.jsonl';
  const U2 = '22222222-2222-4222-8222-222222222222.jsonl';
  const 이제 = Date.parse('2026-09-10T07:40:00+09:00');
  const 어제밤 = Date.parse('2026-09-09T23:00:00+09:00');
  const 아흐레전 = Date.parse('2026-09-01T19:00:00+09:00');

  재다('자리가 여섯이다', Object.keys(자리작업방).length === 6);
  재다('🔴 3·5·6번은 dataeconomics 에서 일한다', /dataeconomics$/.test(자리작업방[3])
    && 자리작업방[3] === 자리작업방[5] && 자리작업방[5] === 자리작업방[6]);
  재다('🔴 1·4번은 klifemap 에서 일한다', /klifemap$/.test(자리작업방[1]) && 자리작업방[1] === 자리작업방[4]);

  재다('폴더이름: 콜론과 빗금을 바꾼다',
    폴더이름('C:/Users/User/Documents/GitHub/dataeconomics') === 'C--Users-User-Documents-GitHub-dataeconomics');
  재다('폴더이름: 역빗금도 같다',
    폴더이름('C:\\Users\\User\\OneDrive\\Desktop') === 'C--Users-User-OneDrive-Desktop');
  재다('폴더이름: 끝 빗금을 뗀다', 폴더이름('C:/A/B/') === 'C--A-B');
  재다('⛔ 폴더이름: 빈 것은 null', 폴더이름('') === null && 폴더이름(null) === null);

  재다('아이디뽑기: uuid.jsonl 에서 뽑는다',
    아이디뽑기(U1) === '11111111-1111-4111-8111-111111111111');
  재다('⛔ 아이디뽑기: uuid 꼴이 아니면 null',
    아이디뽑기('그냥.jsonl') === null && 아이디뽑기('history.jsonl') === null && 아이디뽑기(null) === null);

  /* 가짜 디스크 — 두 폴더에 하나씩 두고 «폴더를 안 가리는지» 본다 */
  const 디스크 = (짜임) => {
    const 읽기 = (d) => {
      const 키 = String(d).replace(/\\/g, '/');
      for (const [k, v] of Object.entries(짜임)) {
        if (키.endsWith(k)) return v;
      }
      return null;
    };
    return 읽기;
  };
  const 잼표 = (표) => (p) => {
    const 키 = String(p).replace(/\\/g, '/');
    for (const [k, v] of Object.entries(표)) if (키.endsWith(k)) return v;
    return null;
  };

  재다('🔴 이어열: 대화가 «다른 폴더»에 있어도 찾는다 — 살아 있는 5번이 그 꼴이다', (() => {
    const 읽기 = 디스크({
      'projects': ['C--Users-User-Documents-GitHub-dataeconomics', 'C--Users-User-OneDrive-Desktop'],
      'C--Users-User-Documents-GitHub-dataeconomics': [],
      'C--Users-User-OneDrive-Desktop': [U1],
    });
    const r = 이어열수있나(5, 이제, 'X', 읽기, 잼표({ [U1]: { size: 218 * 1024 * 1024, mtimeMs: 이제 - 60000 } }));
    return r.된다 === true && r.고른것.방 === 'C--Users-User-OneDrive-Desktop';
  })());

  재다('🔴 이어열: 빈 껍데기가 «더 최근»이면 그 뒤의 쓸 만한 것을 고른다', (() => {
    const 읽기 = 디스크({ 'projects': ['A'], '/A': [U1, U2] });
    const r = 이어열수있나(3, 이제, 'X', 읽기, 잼표({
      [U1]: { size: 1024, mtimeMs: 이제 - 60000 },              /* 빈 껍데기 · 더 최근 */
      [U2]: { size: 500 * 1024, mtimeMs: 어제밤 },              /* 쓸 만한 것 */
    }));
    return r.된다 === true && r.고른것.id.startsWith('22222222');
  })());

  재다('🔴 이어열: 아흐레 전 것은 «안 된다» — 유닛이 그때로 되돌아간다', (() => {
    const 읽기 = 디스크({ 'projects': ['A'], '/A': [U1] });
    const r = 이어열수있나(3, 이제, 'X', 읽기, 잼표({ [U1]: { size: 500 * 1024, mtimeMs: 아흐레전 } }));
    return r.된다 === false && /되돌아간다/.test(r.까닭);
  })());

  재다('⛔ 이어열: 빈 껍데기만 있으면 안 된다', (() => {
    const 읽기 = 디스크({ 'projects': ['A'], '/A': [U1] });
    const r = 이어열수있나(3, 이제, 'X', 읽기, 잼표({ [U1]: { size: 1024, mtimeMs: 어제밤 } }));
    return r.된다 === false && /껍데기/.test(r.까닭);
  })());

  재다('⛔ 이어열: projects 자체가 없으면 안 된다', (() => {
    const r = 이어열수있나(3, 이제, 'X', () => null, () => null);
    return r.된다 === false && /projects 가 없다/.test(r.까닭);
  })());

  재다('⛔ 이어열: 폴더는 있는데 대화가 없으면 안 된다 — 이것이 3·4·6번이었다', (() => {
    const 읽기 = 디스크({ 'projects': ['A'], '/A': ['history.jsonl', '읽을것없음.txt'] });
    const r = 이어열수있나(3, 이제, 'X', 읽기, 잼표({}));
    return r.된다 === false && /하나도 없다/.test(r.까닭);
  })());

  재다('⛔ 이어열: 목록에 없는 자리는 안 된다', 이어열수있나(9, 이제, 'X', () => ['A'], () => null).된다 === false);

  재다('이어열: 못 재는 파일을 건너뛴다', (() => {
    const 읽기 = 디스크({ 'projects': ['A'], '/A': [U1] });
    const r = 이어열수있나(3, 이제, 'X', 읽기, () => null);
    return r.된다 === false && /하나도 없다/.test(r.까닭);
  })());

  재다('대화모으기: 저장소가 없으면 저장소있나=false', (() => {
    const r = 대화모으기(3, 'X', () => null, () => null);
    return r.저장소있나 === false && r.것들.length === 0;
  })());

  재다('대화모으기: 최근 것이 맨 앞에 온다', (() => {
    const 읽기 = 디스크({ 'projects': ['A'], '/A': [U1, U2] });
    const r = 대화모으기(3, 'X', 읽기, 잼표({
      [U1]: { size: 100, mtimeMs: 아흐레전 },
      [U2]: { size: 100, mtimeMs: 이제 },
    }));
    return r.것들.length === 2 && r.것들[0].id.startsWith('22222222');
  })());

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
}

const 자리 = Number(process.argv[2]);
/* ⚠ `--id` 는 «한글 아닌 이름»이 하나 있어야 해서 둔다 —
 *   입구 .cmd 는 ASCII 만 담을 수 있다(cmd.exe 가 시스템 코드페이지로 읽어 한글이 깨진다). */
const 아이디만 = process.argv.includes('--아이디') || process.argv.includes('--id');
if (!Number.isInteger(자리)) {
  console.log('쓰는 법: node tools/seat-resume-check.mjs <자리번호> [--아이디|--id]');
  process.exit(1);
}

const r = 이어열수있나(자리);

if (아이디만) {
  /* ⛔ 여기서는 «ID 한 줄»만 찍는다. .cmd 가 for /f 로 받아 쓴다.
   *   없으면 아무것도 찍지 않는다 — 그러면 .cmd 의 변수가 안 정의되고 새 대화로 간다. */
  if (r.된다) console.log(r.고른것.id);
  process.exit(r.된다 ? 0 : 1);
}

if (r.된다) {
  console.log(`  [.] 이어 열 대화가 있다 — ${(r.고른것.크기 / 1024 / 1024).toFixed(1)}MB, `
    + `${Math.round((Date.now() - r.고른것.때) / 60000)}분 전  (${r.고른것.방})`);
  console.log(`      ID ${r.고른것.id}`);
  process.exit(0);
}
console.log(`  [+] 새 대화를 연다 — ${r.까닭}`);
console.log('      (새 창은 CLAUDE.md · docs/인계-현재상태.md · 메모 꼬리를 읽고 이어서 일한다)');
process.exit(1);
