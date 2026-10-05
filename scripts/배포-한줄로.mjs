#!/usr/bin/env node
/**
 * 배포-한줄로.mjs — **열쇠 받기 → 관문 → 배포**를 한 번에.
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 · 5번) ─────────────────────────────────
 * 오늘 배포를 다섯 번 돌렸는데 그중 **두 번이 「열쇠가 없다」로 헛돌았다.**
 * 까닭은 늘 같다 — 셸 한 줄에 `deploy-key` 와 `deploy` 를 이어 붙였는데,
 * 그 사이에 옆 자리가 커밋하거나 날이 바뀌면 **열쇠가 죽는다.** 그러면
 * `deploy` 가 빈 열쇠를 받고, 배경에서 조용히 멈춘 채 몇 분을 버린다.
 *
 * ⛔ 뒷문을 만드는 자가 아니다. `deploy-key` 의 물음에 **실제로 답해야** 열쇠가 나온다 —
 *   그 답은 `docs/되돌아간것.tsv` 를 «읽어야» 나오고, 이 자는 그 파일을 읽어 답한다.
 *   히스토리를 안 읽고 넘어가는 길은 여전히 없다. 사람 손이 하던 «옮겨 적기»만 없앤다.
 * ⭐ 그리고 열쇠를 받은 **그 자리에서 바로** 관문과 배포를 돌린다. 틈이 없으면 안 죽는다.
 *
 * ⚠ 이 자는 관문이 🔴 이면 **배포하지 않는다.** 관문을 건너뛰는 길은 없다.
 *
 * 🔴🔴 [2026-10-04 · 5번] **이 자를 `| tail` 로 파이프에 걸지 않는다.**
 *   셸은 파이프 마지막 명령의 종료코드를 돌려준다 — 이 자가 1로 끝나도
 *   `tail` 이 0 이라 **「배포됐다」로 읽힌다.** 오늘 그래서 두 번 헛걸음했다
 *   (KLifeMap 은 번역 걸이, KCW 는 커밋 안 된 자동 생성물이 막고 있었다).
 *   ✅ 파이프를 걸려면 `set -o pipefail` 을 «먼저» 켠다.
 *   ✅ 아니면 종료코드를 믿지 말고 마지막 줄에 「관문이 막았다」가 있는지 본다.
 *
 * 쓰는 법
 *   node scripts/배포-한줄로.mjs
 *   node scripts/배포-한줄로.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 대장길 = path.join(뿌리, 'docs', '되돌아간것.tsv');

/** 「N번째 줄」을 집는다. ⛔ 못 집으면 null — 아무 줄이나 고르지 않는다 */
export function 몇째줄인가(글) {
  const m = /(\d+)\s*번째\s*줄/.exec(String(글 ?? ''));
  return m ? Number(m[1]) : null;
}

/**
 * 대장에서 N번째 줄(주석·빈 줄 뺀 것)의 «세 번째 칸»을 읽는다.
 * ⛔ 범위를 벗어나면 null. 빈 칸도 null — 빈 답을 보내면 열쇠가 안 나온다.
 */
export function 답찾기(대장글, 몇째) {
  if (!Number.isFinite(몇째) || 몇째 < 1) return null;
  const 줄 = String(대장글 ?? '').split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#'));
  const 그줄 = 줄[몇째 - 1];
  if (!그줄) return null;
  const 칸 = 그줄.split('\t');
  const 답 = (칸[2] ?? '').trim();
  return 답 || null;
}

/** 열쇠를 집는다. ⛔ 못 집으면 null */
export function 열쇠집기(글) {
  const m = /열쇠\s*—\s*([0-9a-f]{6,})/i.exec(String(글 ?? ''));
  return m ? m[1] : null;
}

export function 관문통과했나(글) {
  const s = String(글 ?? '');
  return s.includes('배포해도 된다') && !s.includes('배포하지 않는다');
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  본다('「9번째 줄」을 집는다', 몇째줄인가('되돌아간것.tsv 의 **9번째 줄**에서') === 9);
  본다('⛔ 숫자가 없으면 null', 몇째줄인가('줄을 고르십시오') === null);
  본다('⛔ null 에도 안 터진다', 몇째줄인가(null) === null);

  const 대장 = ['# 머리말', '', '날\t누가\t첫째 답\t덧', '날\t누가\t둘째 답\t덧',
    '# 가운데 주석', '날\t누가\t셋째 답\t덧', '날\t누가\t\t빈 칸'].join('\n');
  본다('주석과 빈 줄을 세지 않는다', 답찾기(대장, 1) === '첫째 답');
  본다('가운데 주석도 건너뛴다', 답찾기(대장, 3) === '셋째 답');
  본다('⛔ 칸이 비면 null — 빈 답을 보내지 않는다', 답찾기(대장, 4) === null);
  본다('⛔ 범위를 넘으면 null', 답찾기(대장, 99) === null);
  본다('⛔ 0 이나 음수도 null', 답찾기(대장, 0) === null && 답찾기(대장, -1) === null);

  본다('열쇠를 집는다', 열쇠집기('✅ 열쇠 — 7bbcd52d5b') === '7bbcd52d5b');
  본다('⛔ 열쇠가 없으면 null', 열쇠집기('🔴 열쇠가 없다') === null);

  본다('관문이 열리면 참', 관문통과했나('✅ 배포해도 된다'));
  본다('🔴 막히면 거짓', !관문통과했나('🔴 최신이 아니다\n⛔ **배포하지 않는다.**'));
  본다('⛔ 둘 다 있으면 거짓 — 막힌 쪽을 믿는다',
    !관문통과했나('✅ 배포해도 된다\n⛔ 배포하지 않는다'));

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 배포 한 줄로 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const 돌려 = (자, ...인자) =>
    execFileSync('node', [path.join(뿌리, 'scripts', 자), ...인자], { encoding: 'utf8', cwd: 뿌리 });

  console.log('■ ① 히스토리를 읽고 물음을 받는다');
  let 물음 = '';
  try { 물음 = 돌려('deploy-key.mjs'); } catch (e) { 물음 = String(e.stdout ?? ''); }
  const 몇째 = 몇째줄인가(물음);
  if (몇째 === null) { console.log('🔴 물음에서 줄 번호를 못 집었다 — 손으로 한다'); process.exit(1); }
  console.log(`   되돌아간것.tsv 의 ${몇째}번째 줄`);

  const 답 = 답찾기(fs.readFileSync(대장길, 'utf8'), 몇째);
  if (!답) { console.log(`🔴 ${몇째}번째 줄의 「무엇이」 칸이 비었다 — 손으로 한다`); process.exit(1); }
  console.log(`   답 — ${답}`);

  console.log('\n■ ② 열쇠를 받는다');
  let 열쇠글 = '';
  try { 열쇠글 = 돌려('deploy-key.mjs', '--답', 답); } catch (e) { 열쇠글 = String(e.stdout ?? ''); }
  const 열쇠 = 열쇠집기(열쇠글);
  if (!열쇠) { console.log('🔴 열쇠를 못 받았다 — 답이 틀렸을 수 있다'); console.log(열쇠글.slice(0, 400)); process.exit(1); }
  console.log(`   열쇠 ${열쇠}`);

  console.log('\n■ ③ 관문');
  let 관문 = '';
  try { 관문 = 돌려('check-deploy-ready.mjs', '--열쇠', 열쇠); } catch (e) { 관문 = String(e.stdout ?? ''); }
  /* 🔴 [2026-10-04] 걸러 내는 꼴에 🔒 과 「푸는 법」이 빠져 있었다 —
     소통 자물쇠로 막혔는데 화면에 «까닭이 안 보여» 세 번을 헤맸다.
     ⛔ 막은 자가 푸는 법을 적어 주는데 내가 그 줄을 지우고 있었다. */
  for (const l of 관문.split(String.fromCharCode(10)))
    if (/배포해도|🔴|⛔|⚠|🔒|푸는 법/.test(l)) console.log('   ' + l.trim());
  if (!관문통과했나(관문)) { console.log('\n⛔ 관문이 막았다 — 배포하지 않는다'); process.exit(1); }

  /* 🔴🔴 [2026-10-04 · 5번] **검색 자물쇠 — 모든 유닛**
     사장님: 「seo, geo, 색인 대체 내가 그렇게 강조했는데」
             「모든일에 다국어, 검색 관련 업무 무조건 자물쇠를 걸어」·「모든 유닛에」
     ⛔ 「보이게 하는 검사」로는 안 됐다 — check-2h 에 걸어도 그냥 지나갈 수 있다.
       2026-08-22 에 만든 키워드 자가 9월 7일 뒤로 한 번도 안 돌았다.
     ⚠ 다국어 자물쇠는 여기 걸지 않는다 — 「다국어는 케이라이프맵만」이라 하셨고
       그쪽은 klifemap 저장소의 tools/다국어-자물쇠.mjs 가 맡는다. */
  /* 🔴🔴 [2026-10-04 · 5번] **날마다 셋 — 사장님이 이름을 붙여 주신 것**
     「방문자 증대, 결제 관련 세 개의 징검다리, 보안 셋은
       매일 잊지 말고 반드시 빠짐없이 일을 하라」
     ⛔ 「오늘은 바빠서」가 까닭이 되지 않는다. 기억에 맡기면 거른다. */
  console.log('\n■ ③-ㄱ 날마다 셋 (방문자·결제·보안)');
  let 셋글 = ''; let 셋막힘 = false;
  try { 셋글 = 돌려('날마다-셋-자물쇠.mjs'); }
  catch (e) { 셋글 = String(e.stdout ?? '') + String(e.stderr ?? ''); 셋막힘 = true; }
  for (const l of 셋글.split(String.fromCharCode(10)))
    if (/✅|🔴/.test(l)) console.log('   ' + l.trim());
  if (셋막힘) { console.log('\n⛔ 날마다 셋을 안 했다 — 배포하지 않는다'); process.exit(1); }

  console.log('\n■ ③-ㄴ 검색 자물쇠 (SEO·GEO·색인)');
  let 검색글 = ''; let 검색막힘 = false;
  try { 검색글 = 돌려('검색-자물쇠.mjs'); }
  catch (e) { 검색글 = String(e.stdout ?? '') + String(e.stderr ?? ''); 검색막힘 = true; }
  for (const l of 검색글.split(String.fromCharCode(10)))
    if (/🔴|⛔ 안 되어|✅ 검색 자물쇠|⚠ 못 잰|⭐/.test(l)) console.log('   ' + l.trim());
  if (검색막힘) { console.log('\n⛔ 검색 자물쇠가 막았다 — 배포하지 않는다'); process.exit(1); }

  /* 🔴🔴 [2026-10-06 03:0x · 5번] **폴더 주소에 입구가 있나 — 라이브에서 잰다.**
     KLifeMap 에 지면을 내고 사이트맵에도 넣고 홈에서 봇이 닿는 것까지 확인했는데
     `/unse/` 와 `/data/` 를 눌러 보니 둘 다 404 였다. 낱장은 파일이 있어서 되는
     것이고 목록은 따로 만들어야 되는 것인데, 그 둘을 같은 것으로 읽었다.
     네 사이트를 다 재니 입구 없는 폴더가 **18곳**, 그 밑에 약 1만 장이었다.
     ⚠ 이 자는 «라이브»를 잰다 — 지금 배포하려는 것이 아니라 지금 떠 있는 것을 본다.
       그래서 「늘면 막는다」로 둔다. 고치면 못 박은 수를 내려 적는다.
     ⛔ 사이트맵을 못 받은 것으로는 막지 않는다 — 걸림돌이 되면 자물쇠가 꺼진다. */
  console.log('\n■ ③-ㄴ4 폴더 주소에 입구가 있나');
  let 입구글 = ''; let 입구막힘 = false;
  try { 입구글 = 돌려('check-폴더입구가-사나.mjs'); }
  catch (e) { 입구글 = String(e.stdout ?? '') + String(e.stderr ?? ''); 입구막힘 = true; }
  for (const l of 입구글.split(String.fromCharCode(10)))
    if (/🔴|✅|⬜|⚠ 못 잰|⭐/.test(l)) console.log('   ' + l.trim());
  if (입구막힘) {
    console.log('\n⛔ 입구 없는 폴더가 늘었다 — 배포하지 않는다');
    console.log('   목록 지면을 내거나, 이미 그 일을 하는 지면으로 보낸다');
    process.exit(1);
  }

  console.log('\n■ ④ 배포 — 7~13분 걸린다');
  try {
    const 낸것 = 돌려('deploy.mjs', '--열쇠', 열쇠);
    console.log(낸것.split('\n').slice(-12).join('\n'));
  } catch (e) {
    console.log(String(e.stdout ?? '').split('\n').slice(-12).join('\n'));
    process.exit(1);
  }
}
