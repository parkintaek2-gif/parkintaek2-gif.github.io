#!/usr/bin/env node
/**
 * 잰다-네이버검수-결과나왔나.mjs — **네이버 로그인 검수 상태가 바뀌면 알린다.**
 *
 * ── 🔴 왜 (2026-10-26 · 5번) ────────────────────────────────────────
 * 2026-10-26 00:05 에 검수를 넣었고, 네이버가 보낸 것은 «접수 확인»이었다 —
 *   「검수 요청이 등록되었습니다. 검수에 3~4일(영업일 기준)이 소요될 수 있습니다.」
 * 결과는 개발자센터와 메일로 따로 온다.
 *
 * ⛔ 그 메일을 **사장님이 보시고 나에게 알려 주시는 꼴**이 되면 안 된다.
 *   사장님 지시 — 「매일·반복되는 일은 사장님 손으로 올리지 않는다」.
 * ⇒ 이 자가 날마다 개발자센터 화면을 읽어 **상태가 바뀐 날만** 메일로 알린다.
 *
 * ⛔ 「검수요청」 그대로면 **아무것도 보내지 않는다.** 날마다 「아직입니다」를 보내면
 *   그 메일은 곧 안 읽히고, 정작 결과가 난 날 묻힌다.
 * ⛔ 못 읽은 것을 「상태가 바뀌었다」로 읽지 않는다 — 못 읽으면 그대로 둔다.
 * ⛔ 크롬 9222 — b.close() 금지(사장님 창이 닫힌다). 내가 연 탭만 닫는다.
 *
 * 쓰는 법
 *   node scripts/잰다-네이버검수-결과나왔나.mjs            재고, 바뀌었으면 메일
 *   node scripts/잰다-네이버검수-결과나왔나.mjs --보지만않는다   재기만 한다(메일 안 보냄)
 *   node scripts/잰다-네이버검수-결과나왔나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
export const 뿌리 = path.resolve(여기, '..');
const 적는곳 = path.join(뿌리, 'docs', '고정업무-마커', '네이버검수-상태.json');
const 앱 = '3prrLDlKpKgnBorTxN3L';

/** 화면 글에서 검수 상태 한 줄을 뽑는다 */
export function 상태뽑기(글) {
  if (typeof 글 !== 'string' || !글) return null;
  const i = 글.indexOf('검수 상태');
  if (i < 0) return null;
  const 토막 = 글.slice(i, i + 160).replace(/\s+/g, ' ').trim();
  const m = 토막.match(/검수 상태\s*(검수요청|검수중|검수완료|검수거부|승인|거부)/);
  return { 토막, 말: m ? m[1] : null };
}

/** 결과가 난 상태인가 — 「검수요청」은 아직이다 */
export function 결과났나(말) {
  return 말 != null && 말 !== '검수요청' && 말 !== '검수중';
}

/* ── 자가시험 ────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  let 통과 = 0; let 막힘 = 0;
  const 본다 = (이름, 참) => { if (참) { 통과++; console.log('✅ ' + 이름); } else { 막힘++; console.log('🔴 ' + 이름); } };

  본다('접수 상태를 읽는다',
    상태뽑기('앞말 검수 상태 검수요청최종 검수 요청일: 2026.10.26 뒷말').말 === '검수요청');
  본다('승인도 읽는다', 상태뽑기('검수 상태 검수완료 …').말 === '검수완료');
  본다('거부도 읽는다', 상태뽑기('검수 상태 검수거부 …').말 === '검수거부');
  본다('⬜ 글이 없으면 null', 상태뽑기('') === null);
  본다('⬜ 그 말이 없으면 null', 상태뽑기('아무 글이나') === null);
  본다('⛔ 「검수요청」은 결과가 아니다', 결과났나('검수요청') === false);
  본다('⛔ 「검수중」도 결과가 아니다', 결과났나('검수중') === false);
  본다('🔴 「검수거부」는 결과다', 결과났나('검수거부') === true);
  본다('✅ 「검수완료」는 결과다', 결과났나('검수완료') === true);
  본다('⬜ 못 읽은 것(null)을 결과로 세지 않는다', 결과났나(null) === false);

  console.log(`\n${막힘 ? '🔴' : '✅'} 자가시험 ${통과} 통과 · ${막힘} 막힘`);
  process.exit(막힘 ? 1 : 0);
}

/* ── 잰다 ────────────────────────────────────────────────────────── */
/* ⛔ 임시 폴더의 자를 집지 않는다 — 창이 바뀌면 사라져 예약이 조용히 죽는다 */
const { 붙는다 } = await import('./씨디피.mjs').catch(() => ({ 붙는다: null }));

if (!붙는다) {
  console.log('⬜ CDP 자를 못 찾았다 — 못 쟀다. 「결과가 없다」로 읽지 않는다');
  process.exit(0);
}

let 글 = null;
const 문 = await 붙는다();
try {
  const { targetId } = await 문.보낸다('Target.createTarget', { url: 'https://developers.naver.com/apps/#/myapps/' + 앱 + '/verify' });
  const { sessionId } = await 문.보낸다('Target.attachToTarget', { targetId, flatten: true });
  await 문.보낸다('Runtime.enable', {}, sessionId);
  await new Promise((f) => setTimeout(f, 13000));
  const r = await 문.보낸다('Runtime.evaluate', { expression: 'document.body.innerText || ""', returnByValue: true }, sessionId);
  글 = r?.result?.value ?? null;
  await 문.보낸다('Target.closeTarget', { targetId });
} catch (e) {
  console.log('⬜ 못 읽었다 — ' + (e?.message ?? e));
} finally {
  문.끊는다();
}

const 지금 = 상태뽑기(글);
if (!지금) {
  console.log('⬜ 검수 상태 줄을 못 읽었다 — 그대로 둔다. 「바뀌었다」로 읽지 않는다');
  process.exit(0);
}
console.log('■ 지금 — ' + 지금.토막);

let 옛 = null;
try { 옛 = JSON.parse(fs.readFileSync(적는곳, 'utf8')); } catch { /* 처음이면 없다 */ }

const 바뀌었나 = !옛 || 옛.말 !== 지금.말;
fs.mkdirSync(path.dirname(적는곳), { recursive: true });
fs.writeFileSync(적는곳, JSON.stringify({ 잰때: new Date().toLocaleString('ko-KR'), ...지금 }, null, 1) + '\n');

if (!바뀌었나) {
  console.log('   그대로다 (' + 지금.말 + ') — 아무것도 보내지 않는다');
  process.exit(0);
}
console.log('   🔔 바뀌었다 — ' + (옛?.말 ?? '(처음)') + ' → ' + 지금.말);

if (!결과났나(지금.말)) {
  console.log('   아직 결과는 아니다 — 메일은 결과가 났을 때만 보낸다');
  process.exit(0);
}
if (process.argv.includes('--보지만않는다')) {
  console.log('   (--보지만않는다 라 메일은 안 보낸다)');
  process.exit(0);
}

const 글파일 = path.join(뿌리, 'docs', '고정업무-마커', '.네이버검수-알림.txt');
const 승인 = 지금.말 === '검수완료' || 지금.말 === '승인';
fs.writeFileSync(글파일, [
  '사장님',
  '',
  '네이버 로그인 검수 결과가 나왔습니다.',
  '',
  '  검수 상태 — ' + 지금.토막,
  '',
  승인
    ? '통과했습니다. 케이라이프맵 로그인 화면의 「네이버로 시작하기」를 손님에게 열어도 됩니다.'
    : '통과하지 못했습니다. 네이버가 보낸 사유를 읽고 고쳐서 다시 넣겠습니다. 사장님 손은 필요 없습니다.',
  '',
  '5번',
  '',
].join('\n'));

try {
  execFileSync(process.execPath, [
    path.join(뿌리, 'scripts', 'send-mail.mjs'),
    '--받는곳=parkintaek2@gmail.com',
    '--제목=[네이버 로그인] 검수 결과 — ' + 지금.말,
    '--글=' + 글파일,
    '--흐르게',
    '--보낸다',
  ], { stdio: 'inherit' });
  console.log('   ✔ 메일을 보냈다');
} catch (e) {
  console.log('   🔴 메일을 못 보냈다 — ' + (e?.message ?? e));
  process.exit(1);
}
