#!/usr/bin/env node
/**
 * **사장님께 알린다** — 어느 유닛·어느 세션에서든 한 줄로.
 *
 * ── 🔴 왜 있나 (2026-08-27 · 사장님 지시) ──────────────────────────────
 * 「**너희가 나한테 전화로 문자메시지나 이메일 보낼 수 있는 방법을 찾아라**」
 *
 * 오늘 낮에 네 사이트가 세 시간 반 죽어 있었다. 우리는 13:5x 에 알았지만
 * 사장님은 **화면 앞에 오실 때까지 모르셨다.** 그 사이 토스 PG 심사자가 404 를
 * 봤을 수 있다. 알릴 길이 없는 것이 사고를 길게 만든다.
 *
 * ── 어떻게 되나 ────────────────────────────────────────────────────
 * 찾아보니 **이미 다 있었다.** klifemap 서버에 메일 보내는 것(`auth/mailer.js`)과
 * 알리는 것(`auth/notify-admin.js` — 메일·텔레그램·웹훅)이 들어 있고, 라이브
 * `/api/health` 가 `"email":"configured"` 라고 답한다. 없던 것은
 * **어느 세션에서든 부를 수 있는 창구** 하나뿐이었다. 그것을 냈다 —
 * `POST https://klifemap.ai/api/owner/notify`.
 *
 * ⛔ 열쇠가 필요하다(`OWNER_NOTIFY_KEY`). 없으면 아무나 사장님께 문자를 보낸다.
 *   ⚠ 이 열쇠로 할 수 있는 것은 «사장님께 알림 보내기» 하나뿐이다 —
 *     값·계정·자료 어느 것도 못 건드린다. 그래서 관리자 열쇠와 따로 두었다.
 * ⛔ 받는 사람은 **서버가 정한다**(환경변수 OWNER_EMAIL). 여기서 못 바꾼다 —
 *   그래야 이 창구가 새도 남에게는 못 보낸다.
 *
 * 쓰는 법:
 *   node scripts/tell-owner.mjs "제목" "본문 여러 줄도 됩니다"
 *   node scripts/tell-owner.mjs --상태          창구가 살아 있나만 본다(열쇠 없이 됨)
 *   node scripts/tell-owner.mjs --자가시험
 *
 * ⚠ 열쇠는 `.env` 의 `OWNER_NOTIFY_KEY` 에서 읽는다. **인자로 주지 않는다** —
 *   명령 줄에 적으면 셸 기록에 남는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 창구 = 'https://klifemap.ai/api/owner/notify';

/* ── 순수한 부분 (자가시험이 여기를 잰다) ───────────────────────── */

/**
 * 보낼 몸통을 짓는다.
 * ⚠ 칸 이름을 **영문으로** 쓴다. 우리말 칸 이름은 셸을 거치며 깨진 적이 있다
 *   (2026-08-27, `제목` 이 깨져 「제목이 없습니다」가 났다).
 */
export function 몸통짓기({ 제목, 내용 = '', 보낸이 = null, 첨부 = [] } = {}) {
  return {
    title: String(제목 ?? ''), text: String(내용 ?? ''),
    ...(보낸이 ? { from: String(보낸이) } : {}),
    ...(첨부.length ? { attachments: 첨부 } : {}),
  };
}

/**
 * 🔴🔴 [2026-08-28 · 5번] **사장님 지시 — 파일은 «원드라이브에도» 두고 «메일로도» 보낸다.**
 *   ────────────────────────────────────────────────────────────
 *   > 「메일로 받는 게 편해. **파일들은 원드라이브에도 저장해놔, 그래야 너희도 나중에 볼 수 있지.**」
 *
 *   두 자리는 하는 일이 다르다 —
 *     메일     사장님이 «지금» 보시는 자리. 첨부가 붙어 있으면 바로 여신다
 *     원드라이브 «나중에 우리가» 여는 자리. 메일함은 우리가 못 연다
 *   ⛔ 하나만 하면 반쪽이다. 메일만 보내면 우리가 못 찾고, 원드라이브에만 두면 사장님이
 *     경로를 따라 들어가셔야 한다.
 *   ⚠ 그래서 이 함수가 «둘 다» 한다. 부르는 쪽이 잊을 자리를 없앤다.
 */
export function 원드라이브자리(파일길, 방 = 'C:/Users/User/OneDrive/업무보고') {
  const 이름 = String(파일길 ?? '').split(/[\\/]/).pop();
  return `${방}/${이름}`;
}

/**
 * `--파일=경로` 를 뽑는다.
 *
 * 🔴 2026-08-28 — 이 함수가 «없어서» 사고가 났다. 안쪽(첨부·원드라이브)은 다 만들어 놓고
 *    CLI 에서 넘기는 줄을 안 썼다. 그래서 `--파일=…` 을 줘도 조용히 무시되고
 *    「✅ 보냈습니다」가 찍혔다 — **첨부도 없고 원드라이브에도 안 뒀는데 성공이라고 답했다.**
 *    ⛔ 어제 mailer 에서 겪은 「헛간길」과 같은 결함이다. 두 번째다.
 *
 * ⚠ 경로에 `=` 가 들어갈 수 있으므로 «첫 번째 =» 에서만 자른다.
 */
export function 파일인자뽑기(인자들 = []) {
  const 나온것 = [];
  for (const a of Array.isArray(인자들) ? 인자들 : []) {
    const s = String(a ?? '');
    if (!s.startsWith('--파일=')) continue;
    const 값 = s.slice('--파일='.length).trim();
    if (값) 나온것.push(값);
  }
  return 나온것;
}

/**
 * 서버 답을 사람 말로 바꾼다.
 * 🔴 「보냈다」와 「보낼 수 있는 상태다」를 «가른다» — 오늘 이걸 안 갈라서
 *   아무것도 안 갔는데 「보냈다」고 답하는 것을 만들 뻔했다.
 */
export function 답읽기(답) {
  if (!답 || typeof 답 !== 'object') return { 갔나: false, 말: '서버가 답을 안 줬습니다.' };
  if (답.ok && Array.isArray(답.간길) && 답.간길.length) {
    return { 갔나: true, 말: `보냈습니다 — ${답.간길.join(', ')}` };
  }
  const 조각 = [];
  if (답.까닭) 조각.push(답.까닭);
  if (답.헛간길?.length) 조각.push(`${답.헛간길.join(', ')} 는 꺼져 있어 서버 로그에만 남았습니다`);
  if (답.error) 조각.push(답.error);
  return { 갔나: false, 말: 조각.length ? 조각.join(' · ') : '못 갔습니다(까닭 미상).' };
}

/* ── 실제로 보내기 ────────────────────────────────────────────── */

function 열쇠읽기() {
  if (process.env.OWNER_NOTIFY_KEY) return process.env.OWNER_NOTIFY_KEY;
  try {
    for (const 줄 of fs.readFileSync(path.join(뿌리, '.env'), 'utf8').split(/\r?\n/)) {
      const m = 줄.match(/^\s*OWNER_NOTIFY_KEY\s*=\s*(.*)$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 정상 */ }
  return null;
}

/**
 * 파일을 **원드라이브에 두고** 첨부로도 만든다 — 사장님 지시대로 둘 다 한다.
 * ⛔ 원드라이브에 못 두면 그것을 «말한다». 메일만 가고 우리가 못 찾는 일이 없게.
 */
function 파일챙기기(파일길들 = []) {
  const 첨부 = []; const 둔곳 = []; const 못한것 = [];
  for (const p of 파일길들) {
    let 알맹이;
    try { 알맹이 = fs.readFileSync(p); } catch (e) { 못한것.push(`${p}: ${e.message}`); continue; }
    const 이름 = String(p).split(/[\\/]/).pop();
    첨부.push({ 이름, 내용: 알맹이.toString('base64') });
    /* 원드라이브에도 둔다 — 나중에 «우리»가 여는 자리다 */
    const 자리 = 원드라이브자리(p);
    try {
      fs.mkdirSync(path.dirname(자리), { recursive: true });
      fs.writeFileSync(자리, 알맹이);
      둔곳.push(자리);
    } catch (e) { 못한것.push(`원드라이브에 못 뒀다 ${자리}: ${e.message}`); }
  }
  return { 첨부, 둔곳, 못한것 };
}

async function 보내기(제목, 내용, 보낸이, 파일길들 = []) {
  const 열쇠 = 열쇠읽기();
  if (!열쇠) {
    console.error('⛔ OWNER_NOTIFY_KEY 가 없습니다. `.env` 에 넣어 주십시오.');
    console.error('   ⚠ 「못 보냈다」는 「보냈다」가 아닙니다 — 이 자는 조용히 성공하지 않습니다.');
    process.exit(1);
  }
  const { 첨부, 둔곳, 못한것 } = 파일챙기기(파일길들);
  for (const x of 못한것) console.error(`⚠ ${x}`);
  for (const x of 둔곳) console.log(`📁 원드라이브에 뒀습니다 — ${x}`);
  const 몸통 = 몸통짓기({ 제목, 내용: 둔곳.length ? `${내용}\n\n📁 원드라이브: ${둔곳.join(' · ')}` : 내용, 보낸이, 첨부 });
  const r = await fetch(창구, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'x-notify-key': 열쇠 },
    body: JSON.stringify(몸통),
  }).catch((e) => ({ ok: false, _끊김: e.message }));
  if (r._끊김) { console.error(`⛔ 창구에 못 닿았습니다 — ${r._끊김}`); process.exit(1); }
  const j = await r.json().catch(() => null);
  const { 갔나, 말 } = 답읽기(j);
  console.log(갔나 ? `✅ ${말}` : `⛔ ${말}`);
  process.exit(갔나 ? 0 : 1);
}

async function 상태보기() {
  const r = await fetch(`${창구}/status`).catch((e) => ({ _끊김: e.message }));
  if (r._끊김) { console.error(`⛔ 창구에 못 닿았습니다 — ${r._끊김}`); process.exit(1); }
  const j = await r.json();
  console.log('창구 상태 —');
  console.log(`  메일     ${j.길상태?.email ? '✅ 켜짐' : '⛔ 꺼짐'}`);
  console.log(`  텔레그램  ${j.길상태?.telegram ? '✅ 켜짐' : '⛔ 꺼짐'}  (휴대폰 푸시)`);
  console.log(`  웹훅     ${j.길상태?.webhook ? '✅ 켜짐' : '⛔ 꺼짐'}`);
  console.log(`  받는곳   ${j.받는곳설정됨 ? '✅ 설정됨' : '⛔ OWNER_EMAIL 없음'}`);
  console.log(`  열쇠     ${j.열쇠설정됨 ? '✅ 설정됨' : '⛔ OWNER_NOTIFY_KEY 없음'}`);
  console.log(`  하루한도 ${j.하루한도}건`);
  const 됨 = j.받는곳설정됨 && j.열쇠설정됨 && (j.길상태?.email || j.길상태?.telegram || j.길상태?.webhook);
  console.log(됨 ? '\n✅ 지금 보낼 수 있습니다' : '\n⛔ 아직 못 보냅니다 — 위에 ⛔ 로 찍힌 것을 채워야 합니다');
}

/* ── 자가시험 ─────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 조건) => { if (조건) { 통과++; console.log(`  ✅ ${이름}`); } else { 실패++; console.log(`  ⛔ ${이름}`); } };

  검('몸통 칸 이름이 영문이다 — 셸을 거쳐도 안 깨진다',
    Object.keys(몸통짓기({ 제목: 'a', 내용: 'b', 보낸이: '5' })).join(',') === 'title,text,from');
  검('보낸이가 없으면 from 을 안 넣는다', !('from' in 몸통짓기({ 제목: 'a' })));
  검('빈 인자여도 안 죽는다', 몸통짓기().title === '');
  검('첨부가 없으면 attachments 칸을 안 넣는다', !('attachments' in 몸통짓기({ 제목: 'a' })));
  검('첨부를 주면 attachments 로 실린다',
    몸통짓기({ 제목: 'a', 첨부: [{ 이름: 'x.md', 내용: 'YQ==' }] }).attachments.length === 1);
  검('원드라이브 자리는 파일 «이름»만 쓴다 — 경로를 안 이어 붙인다',
    원드라이브자리('C:/tmp/깊은/곳/백서.md').endsWith('/업무보고/백서.md'));
  /* ⚠ 역슬래시를 그냥 쓰면 `\t` 가 «탭»이 되어 시험이 거짓으로 깨진다.
     String.raw 로 «글자 그대로» 준다 — 자가 틀린 것이 아니라 시험이 틀렸던 자리다. */
  검('윈도 역슬래시 경로도 읽는다',
    원드라이브자리(String.raw`C:\tmp\백서.md`).endsWith('/백서.md'));

  /* 🔴 여기가 비어 있어서 「첨부 없는 성공」이 나갔다 — 안쪽만 시험하고 «넘기는 줄»을 안 시험했다 */
  검('--파일= 을 뽑는다', 파일인자뽑기(['제목', '--파일=C:/a/b.md']).length === 1);
  검('--파일= 을 여럿 뽑는다',
    파일인자뽑기(['--파일=a.md', '--파일=b.md']).join(',') === 'a.md,b.md');
  검('경로에 = 가 있어도 안 자른다',
    파일인자뽑기(['--파일=C:/a/b=c.md'])[0] === 'C:/a/b=c.md');
  검('--파일= 뒤가 비면 안 넣는다', 파일인자뽑기(['--파일=']).length === 0);
  검('다른 깃발은 안 집는다', 파일인자뽑기(['--유닛=5', '--상태']).length === 0);
  검('빈 것을 넣어도 안 죽는다', 파일인자뽑기().length === 0 && 파일인자뽑기(null).length === 0);
  /* ⛔ CLI 가 뽑은 것을 «보내기에 넘기는지»까지 본다. 뽑기만 하고 안 넘기면 같은 사고가 또 난다 */
  검('CLI 가 뽑은 파일을 보내기에 넘긴다',
    /await 보내기\([^;]*파일인자뽑기\(/.test(
      fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').replace(/\s+/g, ' ')));

  검('🔴 간길이 있어야 «갔다»고 말한다', 답읽기({ ok: true, 간길: ['email'] }).갔나 === true);
  검('⛔ ok 만 true 이고 간길이 비면 «안 갔다»', 답읽기({ ok: true, 간길: [] }).갔나 === false);
  검('⭐ 꺼진 경로로 「갔다」고 오면 안 간 것으로 읽는다 — 오늘 여기서 속았다',
    답읽기({ ok: false, 간길: [], 헛간길: ['email'], 까닭: '경로 없음' }).갔나 === false);
  검('꺼진 경로를 말로 알려 준다', /꺼져 있어/.test(답읽기({ ok: false, 간길: [], 헛간길: ['email'] }).말));
  검('401 같은 오류도 말로 알려 준다', /열쇠/.test(답읽기({ ok: false, error: '열쇠가 필요합니다' }).말));
  검('답이 없어도 안 죽는다', 답읽기(null).갔나 === false && 답읽기().갔나 === false);
  검('창구가 klifemap 라이브다', 창구.startsWith('https://klifemap.ai/'));

  console.log(`\n자가시험 ${통과 + 실패}개 · 실패 ${실패}개`);
  return 실패;
}

const 이파일직접 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (이파일직접) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
  else if (process.argv.includes('--상태')) await 상태보기();
  else {
    const 인자 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
    if (!인자.length) {
      console.error('쓰는 법: node scripts/tell-owner.mjs "제목" "본문" [--파일=경로 …]  ·  --상태  ·  --자가시험');
    console.error('   ⭐ --파일 을 주면 «원드라이브에 두고» 메일에도 붙입니다 (사장님 지시 2026-08-28)');
      process.exit(1);
    }
    const 보낸이 = (process.argv.find((a) => a.startsWith('--유닛='))?.split('=')[1]) ?? null;
    /* ⛔ 이 줄을 빼먹어서 「첨부 없는 성공」이 나갔다 — 안쪽을 만들었으면 «넘기는 줄»까지가 한 몫이다 */
    await 보내기(인자[0], 인자.slice(1).join('\n'), 보낸이, 파일인자뽑기(process.argv.slice(2)));
  }
}
