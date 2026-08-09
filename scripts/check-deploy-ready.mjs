#!/usr/bin/env node
// 배포 관문 — ⛔ 이 검사를 통과하지 못하면 배포하지 않는다.
//
// 사장님 지시(2026-08-09):
//   「자꾸 해놓은 걸 까먹지 않게 조치를 강하게 만들어라.
//    뭔가 고쳐 배포할 때 특히 **다른 부분의 과거 버전이 함께 배포 안 되게** 조치를 취해.
//    **배포하려면 최신의 것으로 다시 해놔야 함을 필수 절차로** 두던지 등 방법을 찾아,
//    **모든 유닛에 적용**해」
//
// 막는 것 셋
//   ① 내 것이 최신이 아니면 → 남이 고친 최신이 빠지거나 내 옛 파일이 덮어쓴다
//   ② 커밋 안 된 변경이 있으면 → 배포된 것과 저장소가 달라 다음 사람이 옛것을 민다
//   ③ 지킴 목록의 글자가 사라졌으면 → 고쳐 놓은 것이 되돌아간 것이다
//
// 쓰기:  node scripts/check-deploy-ready.mjs
//        node scripts/check-deploy-ready.mjs --자가시험

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const 지킴목록길 = 'docs/지킴목록.tsv';
export const 되돌아간것길 = 'docs/되돌아간것.tsv';

/** 열쇠가 맞나. ⛔ 없으면 배포 안 한다 — 히스토리를 안 읽었다는 뜻이다. */
export function 열쇠맞나(낸것, 참열쇠) {
  const 다듬기 = (s) => String(s ?? '').trim();
  if (!다듬기(낸것)) return { 맞다: false, 까닭: '열쇠가 없다 — node scripts/deploy-key.mjs 로 히스토리를 읽고 받으십시오' };
  if (다듬기(낸것) !== 다듬기(참열쇠)) return { 맞다: false, 까닭: '열쇠가 낡았다 — 커밋이나 히스토리가 바뀌었습니다. 다시 읽고 다시 받으십시오' };
  return { 맞다: true, 까닭: '' };
}

/** 지킴 목록 한 줄. 주석·빈 줄은 null. */
export function 지킴줄읽기(줄) {
  const 글 = String(줄 ?? '').replace(/\r$/, '');
  if (!글.trim() || 글.trimStart().startsWith('#')) return null;
  const 칸 = 글.split('\t').map((s) => s.trim());
  if (칸.length < 3) return null;
  const [자리, 파일, 있어야하는글자, 넣은날, 까닭] = 칸;
  if (!파일 || !있어야하는글자) return null;
  return { 자리, 파일, 있어야하는글자, 넣은날: 넣은날 || '', 까닭: 까닭 || '' };
}

/**
 * 손님에게 나가는 파일인가. ⛔ docs/ 와 메모는 배포되지 않는다.
 *
 * 왜 가르나 — 2026-08-09 20:40 에 관문이 `docs/세션간-메모.md` 하나로 막혔다.
 * 그 파일은 여덟 자리가 십 분마다 덧쓴다. **늘 막히는 관문은 아무도 안 본다.**
 * 사장님: 「문서는 안 읽힙니다」. 자물쇠도 늘 울면 안 읽힌다.
 */
export function 나가는파일인가(길) {
  const p = String(길 ?? '').replace(/^"|"$/g, '').replace(/\\/g, '/');
  if (!p) return false;
  if (p.startsWith('docs/')) return false;
  if (p.startsWith('archive/')) return false;
  if (/^[^/]+\.md$/.test(p)) return false;          // 뿌리의 메모 파일
  /* 🔴 scripts/ 는 **빌드에 안 들어간다.** 클라우드타입은 밀린 저장소로 빌드하므로
   *   커밋 안 된 자 하나가 라이브에 닿을 길이 없다.
   *
   * ⚠ 다만 **배포하는 자 자신**은 뺀다 — 고친 배포기로 밀면 관문 자체가 딴것이 된다.
   *   그건 커밋하고 밀어야 한다.
   *
   * 왜 가르나 — 2026-08-09 밤에 관문이 **세 번 내리** 남의 손이 올라간 파일 하나로
   *   막혔다(메모 · og.png · check-100y-nps-coverage.mjs). 여덟 자리가 한 저장소를 쓴다.
   *   ⛔ 남의 일하는 파일을 대신 커밋하지 않는다. 그러면 배포가 영영 못 나간다.
   *   ⭐ 막는 자리를 **라이브에 닿는 것**으로 좁힌다. 느슨하게 하는 것이 아니다 */
  if (/^scripts\/(deploy|check-deploy)/.test(p)) return true;
  if (p.startsWith('scripts/')) return false;
  if (p.startsWith('tools/')) return false;
  return true;
}

/**
 * 포슬린 한 줄에서 길만 뽑는다. `R  옛 -> 새` 는 새 쪽을 본다.
 *
 * ⛔ **세 글자를 잘라내면 안 된다.** 2026-08-09 밤에 이걸로 한 시간을 잃었다 —
 *   부르는 쪽이 `execFileSync(...).trim()` 을 하는 바람에 **첫 줄의 앞 빈칸이 날아갔다.**
 *   ` M scripts/x.mjs` 가 `M scripts/x.mjs` 가 되고, 세 글자를 자르니 `cripts/x.mjs` 가 됐다.
 *   그래서 `scripts/` 로 시작하는지 보는 자가 **전부 헛돌았다.** 자가시험은 통과했다 —
 *   시험이 언제나 앞 빈칸이 있는 줄만 줬기 때문이다.
 * ⭐ 그래서 **상태 글자를 세지 말고 이름으로 알아본다.**
 */
export function 길뽑기(줄) {
  const 글 = String(줄 ?? '').replace(/\r$/, '');
  /* 상태는 글자 한둘(M·A·D·R·??·MM…) 뒤에 빈칸. 앞 빈칸은 있어도 없어도 된다 */
  const m = /^\s*[MADRCU?!]{1,2}\s+(.*)$/.exec(글);
  const 뒤 = (m ? m[1] : 글).trim();
  const i = 뒤.indexOf(' -> ');
  return i >= 0 ? 뒤.slice(i + 4).trim() : 뒤;
}

/**
 * git status --porcelain 을 읽어 깨끗한지.
 * ⛔ ?? (안 담긴 새 파일)는 깨끗한 것으로 본다.
 * 🔴 막는 것은 **나가는 파일**만. docs/ 는 ⚠ 로만 알린다.
 */
export function 깨끗한가(포슬린) {
  const 줄들 = String(포슬린 ?? '').split('\n').map((l) => l.trimEnd()).filter(Boolean);
  const 담긴것 = 줄들.filter((l) => !l.startsWith('??'));
  const 더러운줄 = 담긴것.filter((l) => 나가는파일인가(길뽑기(l)));
  const 안나가는줄 = 담긴것.filter((l) => !나가는파일인가(길뽑기(l)));
  return { 깨끗하다: 더러운줄.length === 0, 더러운줄, 안나가는줄 };
}

/** 로컬이 원격과 같은가. 앞섰으면(밀 것이 있으면) 그것도 막는다 */
export function 최신인가({ 로컬, 원격, 앞선수, 뒤진수 }) {
  if (!로컬 || !원격) return { 최신이다: false, 까닭: '원격을 못 읽었다 — 못 잰 것이다' };
  if (뒤진수 > 0) return { 최신이다: false, 까닭: `원격보다 ${뒤진수}개 뒤졌다 — 남의 최신이 빠진 채로 나간다` };
  if (앞선수 > 0) return { 최신이다: false, 까닭: `밀지 않은 커밋이 ${앞선수}개 있다 — 저장소와 배포가 갈린다` };
  return { 최신이다: true, 까닭: '' };
}

/** 지킴 목록을 소스에 대 본다. */
export function 지킴검사(줄들, 읽기) {
  const 사라진것 = [];
  for (const r of 줄들) {
    let 글;
    try { 글 = 읽기(r.파일); } catch { 글 = null; }
    if (글 === null) { 사라진것.push({ ...r, 왜: '파일이 없다' }); continue; }
    if (!글.includes(r.있어야하는글자)) 사라진것.push({ ...r, 왜: '글자가 사라졌다' });
  }
  return 사라진것;
}

export function 판정글(결과) {
  const 줄 = ['# 배포 관문', ''];
  줄.push(결과.열쇠.맞다 ? '✅ 열쇠 맞다 — 히스토리를 읽었다' : `🔴 ${결과.열쇠.까닭}`);
  줄.push(결과.최신.최신이다 ? '✅ 최신이다' : `🔴 최신이 아니다 — ${결과.최신.까닭}`);
  줄.push(결과.깨끗.깨끗하다 ? '✅ 손님에게 나가는 것 중 커밋 안 된 것 없다'
    : `🔴 커밋 안 된 변경 ${결과.깨끗.더러운줄.length}개 — ${결과.깨끗.더러운줄.slice(0, 5).join(' / ')}`);
  const 안나감 = 결과.깨끗.안나가는줄 ?? [];
  if (안나감.length) {
    줄.push(`⚠ 커밋 안 된 문서 ${안나감.length}개 (배포엔 안 나간다 — 막지 않는다)`);
    for (const l of 안나감.slice(0, 3)) 줄.push(`   · ${l}`);
  }
  if (!결과.지킴수) 줄.push('⚠ 지킴 목록이 비어 있다 — 고친 것을 아무도 안 적었다');
  else if (!결과.사라진것.length) 줄.push(`✅ 지킴 목록 ${결과.지킴수}줄 다 살아 있다`);
  else {
    줄.push(`🔴 되돌아간 것 ${결과.사라진것.length}개`);
    for (const s of 결과.사라진것) {
      줄.push(`   · ${s.자리} ${s.파일} — 「${s.있어야하는글자}」 ${s.왜}`);
      if (s.까닭) 줄.push(`     (${s.넣은날} ${s.까닭})`);
    }
  }
  줄.push('');
  줄.push(결과.통과 ? '✅ 배포해도 된다' : '⛔ **배포하지 않는다.** 위를 고치고 다시 돌린다');
  return 줄.join('\n');
}

// ── 자가시험 ────────────────────────────────────────────────────────────────
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 자가 = (이름, 참인가) => { if (참인가) 통과++; else { 실패++; console.error(`  ✗ ${이름}`); } };

  자가('주석은 버린다', 지킴줄읽기('# 머리') === null);
  자가('칸이 모자라면 버린다', 지킴줄읽기('1번\tpublic/index.html') === null);
  const r = 지킴줄읽기('1번\tpublic/index.html\tlogin.html\t2026-08-09\t첫 화면 로그인 링크가 사라진 적 있음');
  자가('자리를 읽는다', r.자리 === '1번');
  자가('파일을 읽는다', r.파일 === 'public/index.html');
  자가('있어야 하는 글자를 읽는다', r.있어야하는글자 === 'login.html');
  자가('까닭을 읽는다', r.까닭.includes('사라진 적'));
  자가('날·까닭이 없어도 읽는다', 지킴줄읽기('3번\ta.html\tfoo').있어야하는글자 === 'foo');

  자가('빈 포슬린은 깨끗', 깨끗한가('').깨끗하다 === true);
  자가('?? 만 있으면 깨끗', 깨끗한가('?? new.txt\n?? b/').깨끗하다 === true);
  자가('M 이 있으면 안 깨끗', 깨끗한가(' M a.html').깨끗하다 === false);
  자가('안 깨끗한 줄을 돌려준다', 깨끗한가(' M a.html\n?? n').더러운줄.length === 1);

  // 🔴 docs/ 는 배포에 안 나간다 — 막지 않는다 (2026-08-09 20:40 관문이 메모 하나로 막힌 일)
  자가('src 는 나가는 파일', 나가는파일인가('src/pages/a.astro') === true);
  자가('public 도 나가는 파일', 나가는파일인가('public/og.png') === true);
  자가('⛔ docs/ 는 안 나간다', 나가는파일인가('docs/세션간-메모.md') === false);
  자가('⛔ 뿌리 메모(.md)도 안 나간다', 나가는파일인가('README.md') === false);
  자가('⛔ archive/ 도 안 나간다', 나가는파일인가('archive/log/x.log') === false);
  자가('src 밑 .md 는 나간다', 나가는파일인가('src/content/글.md') === true);
  // 🔴 scripts/ 는 빌드에 안 들어간다 — 단, 배포하는 자 자신은 뺀다
  자가('⛔ 남의 자(scripts/)는 안 막는다', 나가는파일인가('scripts/check-100y-nps-coverage.mjs') === false);
  자가('⛔ tools/ 도 안 막는다', 나가는파일인가('tools/pdf-look.js') === false);
  자가('🔴 배포하는 자는 막는다', 나가는파일인가('scripts/deploy.mjs') === true);
  자가('🔴 관문 자신도 막는다', 나가는파일인가('scripts/check-deploy-ready.mjs') === true);
  자가('🔴 server.mjs 는 나간다', 나가는파일인가('server.mjs') === true);
  자가('🔴 package.json 은 나간다', 나가는파일인가('package.json') === true);
  자가('빈 길은 안 나가는 것', 나가는파일인가('') === false);
  자가('따옴표 붙은 길도 읽는다', 나가는파일인가('"docs/한글.md"') === false);

  자가('길만 뽑는다', 길뽑기(' M src/a.astro') === 'src/a.astro');
  자가('이름 바뀐 것은 새 쪽을 본다', 길뽑기('R  옛.md -> src/새.astro') === 'src/새.astro');
  // 🔴 앞 빈칸이 날아간 줄 — 부르는 쪽이 .trim() 을 하면 첫 줄이 이렇게 온다
  자가('🔴 앞 빈칸이 날아가도 길을 옳게 뽑는다',
       길뽑기('M scripts/check-100y-nps-coverage.mjs') === 'scripts/check-100y-nps-coverage.mjs');
  자가('🔴 그래서 안 막는다',
       깨끗한가('M scripts/check-100y-nps-coverage.mjs').깨끗하다 === true);
  자가('🔴 앞 빈칸 없는 src 는 그대로 막는다',
       깨끗한가('M src/pages/a.astro').깨끗하다 === false);
  자가('두 글자 상태(MM)도 읽는다', 길뽑기('MM src/a.astro') === 'src/a.astro');
  자가('새 파일(??)도 길을 뽑는다', 길뽑기('?? scripts/새.mjs') === 'scripts/새.mjs');
  자가('지운 것(D)도 읽는다', 길뽑기(' D public/og.png') === 'public/og.png');

  자가('🔴 문서만 더러우면 통과시킨다', 깨끗한가(' M docs/세션간-메모.md').깨끗하다 === true);
  자가('그래도 따로 세어 알려 준다', 깨끗한가(' M docs/세션간-메모.md').안나가는줄.length === 1);
  자가('🔴 나가는 것이 섞이면 막는다',
       깨끗한가(' M docs/메모.md\n M src/a.astro').깨끗하다 === false);
  자가('막을 때 문서는 안 세운다',
       깨끗한가(' M docs/메모.md\n M src/a.astro').더러운줄.length === 1);

  자가('뒤졌으면 막는다', 최신인가({ 로컬: 'a', 원격: 'b', 앞선수: 0, 뒤진수: 2 }).최신이다 === false);
  자가('뒤진 것을 까닭에 적는다', 최신인가({ 로컬: 'a', 원격: 'b', 앞선수: 0, 뒤진수: 2 }).까닭.includes('뒤졌다'));
  자가('앞섰어도 막는다', 최신인가({ 로컬: 'a', 원격: 'b', 앞선수: 1, 뒤진수: 0 }).최신이다 === false);
  자가('둘 다 0 이면 통과', 최신인가({ 로컬: 'a', 원격: 'a', 앞선수: 0, 뒤진수: 0 }).최신이다 === true);
  자가('원격을 못 읽으면 막는다', 최신인가({ 로컬: 'a', 원격: null, 앞선수: 0, 뒤진수: 0 }).최신이다 === false);

  const 목록 = [지킴줄읽기('1번\ta.html\tlogin.html\t2026-08-09\t까닭')];
  자가('글자가 있으면 통과', 지킴검사(목록, () => '<a href="login.html">로그인</a>').length === 0);
  자가('글자가 없으면 잡는다', 지킴검사(목록, () => '<p>없다</p>')[0].왜 === '글자가 사라졌다');
  자가('파일이 없으면 잡는다', 지킴검사(목록, () => { throw new Error('없다'); })[0].왜 === '파일이 없다');
  자가('⛔ 파일 없음을 통과로 안 센다', 지킴검사(목록, () => { throw new Error('x'); }).length === 1);

  자가('열쇠가 없으면 막는다', 열쇠맞나('', 'abc').맞다 === false);
  자가('열쇠가 없다고 말해 준다', 열쇠맞나('', 'abc').까닭.includes('deploy-key'));
  자가('열쇠가 다르면 막는다', 열쇠맞나('zzz', 'abc').맞다 === false);
  자가('낡은 열쇠라고 말해 준다', 열쇠맞나('zzz', 'abc').까닭.includes('낡았다'));
  자가('열쇠가 같으면 통과', 열쇠맞나('abc', 'abc').맞다 === true);
  자가('앞뒤 빈칸은 봐준다', 열쇠맞나(' abc ', 'abc').맞다 === true);

  const 성한판 = { 열쇠: { 맞다: true, 까닭: '' },
                  최신: { 최신이다: true, 까닭: '' }, 깨끗: { 깨끗하다: true, 더러운줄: [] },
                  지킴수: 3, 사라진것: [], 통과: true };
  자가('열쇠가 맞으면 그렇게 찍는다', 판정글(성한판).includes('히스토리를 읽었다'));
  자가('열쇠가 없으면 그 까닭이 찍힌다',
       판정글({ ...성한판, 열쇠: { 맞다: false, 까닭: '열쇠가 없다 — deploy-key' }, 통과: false }).includes('열쇠가 없다'));
  자가('다 되면 배포해도 된다고 말한다', 판정글(성한판).includes('배포해도 된다'));
  const 되돌아간판 = { ...성한판, 사라진것: [{ 자리: '1번', 파일: 'a.html', 있어야하는글자: 'login.html', 왜: '글자가 사라졌다', 넣은날: '', 까닭: '' }], 통과: false };
  자가('되돌아간 것을 보여 준다', 판정글(되돌아간판).includes('login.html'));
  자가('막을 때는 배포하지 말라고 한다', 판정글(되돌아간판).includes('배포하지 않는다'));
  자가('지킴 목록이 비면 그렇게 말한다', 판정글({ ...성한판, 지킴수: 0 }).includes('비어 있다'));

  console.log(실패 === 0 ? `✅ 자가시험 ${통과}개 통과` : `❌ ${실패}개 실패 (통과 ${통과})`);
  process.exit(실패 === 0 ? 0 : 1);
}

if (내가실행됐다 && !process.argv.includes('--자가시험')) {
  const 깃 = (...인자) => {
    try { return execFileSync('git', 인자, { encoding: 'utf8' }).trim(); } catch { return null; }
  };
  깃('fetch', '--quiet');
  const 로컬 = 깃('rev-parse', 'HEAD');
  const 원격 = 깃('rev-parse', '@{u}');
  let 앞선수 = 0, 뒤진수 = 0;
  const 세기 = 깃('rev-list', '--left-right', '--count', 'HEAD...@{u}');
  if (세기) { const [a, b] = 세기.split(/\s+/).map(Number); 앞선수 = a || 0; 뒤진수 = b || 0; }

  const 최신 = 최신인가({ 로컬, 원격, 앞선수, 뒤진수 });
  const 깨끗 = 깨끗한가(깃('status', '--porcelain') ?? '');

  const 줄들 = fs.existsSync(지킴목록길)
    ? fs.readFileSync(지킴목록길, 'utf8').split('\n').map(지킴줄읽기).filter(Boolean)
    : [];
  const 사라진것 = 지킴검사(줄들, (p) => fs.readFileSync(p, 'utf8'));

  // 🔒 열쇠 — deploy-key.mjs 와 똑같이 다시 만들어 대 본다
  const { 열쇠만들기 } = await import('./deploy-key.mjs');
  const 읽기 = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
  const 참열쇠 = 열쇠만들기({
    되돌아간것: 읽기(되돌아간것길),
    지킴목록: 읽기(지킴목록길),
    head: 로컬,
    오늘: new Date().toLocaleDateString('sv-SE'),
  });
  const i = process.argv.indexOf('--열쇠');
  const 열쇠 = 열쇠맞나(i >= 0 ? process.argv[i + 1] : '', 참열쇠);

  const 통과 = 열쇠.맞다 && 최신.최신이다 && 깨끗.깨끗하다 && 사라진것.length === 0;
  console.log(판정글({ 열쇠, 최신, 깨끗, 지킴수: 줄들.length, 사라진것, 통과 }));
  process.exit(통과 ? 0 : 1);
}
