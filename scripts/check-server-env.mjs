#!/usr/bin/env node
/**
 * check-server-env.mjs — **라이브 서버가 읽는 환경변수가 컨테이너에 실제로 들어가나.**
 * ─────────────────────────────────────────────────────────────────────────
 * 🔴 왜 생겼나 (2026-09-16 · 5번)
 *
 * 사장님: 「페이팔은 테스트해봣나? 아니면 테스트할 필요는 없고 잘 되고 있나?」
 * 그 물음에 답하려고 결제 갈래를 훑다가 잡았다 —
 *
 *   결제 뒤 손님에게 편지를 보내는 길(`src/lib/gmail-send.mjs`)이 라이브에서
 *   **한 통도 보낼 수 없는 상태**였다. 코드는 맞게 들어가 있었다.
 *   `GOOGLE_APPLICATION_CREDENTIALS` 가 `.cloudtype/app.yaml` 에 **아예 없어서**
 *   컨테이너에 주입이 안 됐을 뿐이다.
 *
 * ⛔ 그리고 이것이 **조용했다.** `메일보내기()` 는 던지지 않고 `{ok:false}` 만 돌려준다
 *   (결제는 성공시켜야 하니 그 설계는 맞다). 서버는 console.error 한 줄만 남긴다.
 *   ⇒ 손님이 값을 내고, 「메일로 보냈습니다」는 약속만 받고, 편지는 안 온다.
 *   ⇒ 서버 200 · 지면 멀쩡 · 오류 로그 없음. **빨간불이 안 켜지는 갈래**다.
 *
 * ⭐ 강령 ④ — 「규칙은 문장이 아니라 검사로 둔다」. 그래서 문서에 적지 않고 자로 만든다.
 *
 * ⚠ 이 자는 «이름»만 본다. 값이 맞는지는 모른다 — 값은 스테이지 시크릿에 있고
 *   우리는 그것을 읽지 않는다(⛔ 비밀번호·토큰을 읽거나 어디로 보내지 않는다).
 *   그래도 오늘 사고는 **이름이 없어서** 난 것이고, 이름은 기계로 잴 수 있다.
 *
 *   node scripts/check-server-env.mjs
 *   node scripts/check-server-env.mjs --시험      자가시험만
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 🔴 **이것이 없으면 손님이 손해를 본다** — 이름 · 없을 때 무엇이 죽나.
 *
 * ⛔ 「서버가 읽는 이름」을 전부 여기 넣지 않는다. PORT 처럼 플랫폼이 주는 것,
 *   ADMIN_USER 처럼 쓸 만한 기본값이 있는 것까지 빨간불로 만들면 자가 울보가 되고,
 *   울보가 된 자는 아무도 안 본다.
 * ✅ 기준은 하나다 — **없으면 손님이 낸 돈에 대해 못 받는 것이 생기나.**
 */
export const 손님이잃는것 = [
  { 이름: 'PAYPAL_CLIENT_ID', 잃는것: '결제 단추가 아예 안 그려진다 — 매출 0' },
  { 이름: 'PAYPAL_SECRET', 잃는것: '주문을 못 만든다 — 매출 0' },
  { 이름: 'PAYPAL_MODE', 잃는것: "'live' 가 아니면 샌드박스로 붙는다 — 진짜 돈이 안 들어온다" },
  { 이름: 'RAPIDAPI_PROXY_SECRET', 잃는것: '유료 구매자가 무료와 똑같이 1회 200건만 받는다 — 환불 자리' },
  { 이름: 'GOOGLE_SERVICE_ACCOUNT_JSON', 잃는것: '결제 뒤 주문번호 편지가 안 나간다 — 손님이 산 것을 다시 못 찾는다',
    또는: 'GOOGLE_APPLICATION_CREDENTIALS' },
  { 이름: 'ARCHIVE_S3_BUCKET', 잃는것: '컨테이너엔 디스크가 없다 — 파는 파일 자체를 못 읽는다' },
  { 이름: 'ARCHIVE_S3_KEY_ID', 잃는것: '위와 같다' },
  { 이름: 'ARCHIVE_S3_SECRET', 잃는것: '위와 같다' },
  { 이름: 'ARCHIVE_S3_ENDPOINT', 잃는것: '위와 같다' },
];

/** `- name: X` 줄에서 이름만 거둔다. ⛔ 주석(#)으로 죽여 둔 줄은 «없는 것»이다 */
export function 설정에적힌이름들(글) {
  const 낸다 = [];
  for (const 줄 of String(글 ?? '').split(/\r?\n/)) {
    if (/^\s*#/.test(줄)) continue;                 /* 주석은 안 뜬다 */
    const m = 줄.match(/^\s*-\s*name:\s*([A-Za-z_][A-Za-z0-9_]*)\s*$/);
    if (m) 낸다.push(m[1]);
  }
  return 낸다;
}

/** 소스에서 `process.env.NAME` 을 거둔다 */
export function 코드가읽는이름들(글) {
  const 낸다 = new Set();
  for (const m of String(글 ?? '').matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)) 낸다.add(m[1]);
  return [...낸다].sort();
}

/**
 * 빠진 것을 가른다.
 * ⚠ `또는` 이 있으면 **둘 중 하나만 있으면 된다** — 열쇠를 파일로 주든 문자열로 주든
 *   손님에게는 같은 일이 일어나기 때문이다.
 */
export function 빠진것(적힌것, 표 = 손님이잃는것) {
  const 있다 = new Set(적힌것 ?? []);
  return (표 ?? []).filter((칸) => !있다.has(칸.이름) && !(칸.또는 && 있다.has(칸.또는)));
}

/** 서버가 읽는데 설정에 없는 이름 — 빨간불은 아니고 «봐 둘 것» */
export function 적어둘것(읽는것, 적힌것, 표 = 손님이잃는것) {
  const 있다 = new Set(적힌것 ?? []);
  const 이미센것 = new Set((표 ?? []).flatMap((칸) => [칸.이름, 칸.또는].filter(Boolean)));
  return (읽는것 ?? []).filter((n) => !있다.has(n) && !이미센것.has(n));
}

/** server.mjs 와 그것이 쓰는 라이브러리를 훑는다 */
export function 서버소스들(밑 = 뿌리) {
  const 낸다 = [];
  const s = path.join(밑, 'server.mjs');
  if (existsSync(s)) 낸다.push(s);
  const 랩 = path.join(밑, 'src', 'lib');
  if (existsSync(랩)) {
    for (const f of readdirSync(랩)) if (f.endsWith('.mjs')) 낸다.push(path.join(랩, f));
  }
  return 낸다;
}

export function 잰다(밑 = 뿌리) {
  const 설정 = path.join(밑, '.cloudtype', 'app.yaml');
  const 적힌것 = existsSync(설정) ? 설정에적힌이름들(readFileSync(설정, 'utf8')) : [];
  const 읽는것 = [...new Set(서버소스들(밑).flatMap((f) => 코드가읽는이름들(readFileSync(f, 'utf8'))))].sort();
  return { 적힌것, 읽는것, 빠진것: 빠진것(적힌것), 적어둘것: 적어둘것(읽는것, 적힌것) };
}

/* ───────────────────────── 자가시험 ───────────────────────── */
function 자가시험() {
  const 것 = [];
  const 본다 = (제목, 참) => 것.push({ 제목, 참: !!참 });

  본다('name 줄을 읽는다', 설정에적힌이름들('  env:\n    - name: A\n    - name: B').join() === 'A,B');
  본다('주석으로 죽인 줄은 «없는 것»이다', 설정에적힌이름들('    #   - name: KDI_API_KEY').length === 0);
  본다('secret 줄은 이름이 아니다', 설정에적힌이름들('    - name: A\n      secret: B').join() === 'A');
  본다('들여쓰기가 달라도 읽는다', 설정에적힌이름들('- name: A').join() === 'A');

  본다('process.env 를 거둔다', 코드가읽는이름들('const x = process.env.FOO_BAR;').join() === 'FOO_BAR');
  본다('같은 이름을 두 번 세지 않는다', 코드가읽는이름들('process.env.A + process.env.A').length === 1);
  본다('소문자 속성은 안 센다', 코드가읽는이름들('process.env.lower').length === 0);

  const 표 = [{ 이름: 'X', 잃는것: 'x' }, { 이름: 'Y', 잃는것: 'y', 또는: 'Y2' }];
  본다('있으면 안 잡는다', 빠진것(['X', 'Y'], 표).length === 0);
  본다('없으면 잡는다', 빠진것([], 표).length === 2);
  본다('«또는» 쪽이 있으면 통과다', 빠진것(['X', 'Y2'], 표).map((c) => c.이름).join() === '');
  본다('«또는» 은 X 를 대신하지 못한다', 빠진것(['Y2'], 표).map((c) => c.이름).join() === 'X');

  본다('표에 있는 것은 적어둘것에 또 안 나온다', 적어둘것(['X', 'Z'], [], 표).join() === 'Z');
  본다('설정에 적힌 것은 적어둘것에 안 나온다', 적어둘것(['Z'], ['Z'], 표).length === 0);

  /* 🔴 오늘 난 사고 그대로를 시험으로 굳힌다 — 파일경로도 문자열열쇠도 없으면 편지가 죽는다 */
  본다('열쇠가 둘 다 없으면 편지 칸이 잡힌다',
    빠진것(['PAYPAL_CLIENT_ID']).some((c) => c.이름 === 'GOOGLE_SERVICE_ACCOUNT_JSON'));
  본다('파일경로만 있어도 편지 칸은 통과다',
    !빠진것(['GOOGLE_APPLICATION_CREDENTIALS']).some((c) => c.이름 === 'GOOGLE_SERVICE_ACCOUNT_JSON'));

  본다('진짜 저장소를 잴 수 있다', Array.isArray(잰다().읽는것) && 잰다().읽는것.length > 0);

  const 진 = 것.filter((t) => !t.참);
  console.log('■ 자가시험 ' + (것.length - 진.length) + '/' + 것.length);
  for (const t of 진) console.log('   🔴 ' + t.제목);
  return 진.length === 0;
}

/* ───────────────────────── 화면 ───────────────────────── */
function 낸다() {
  const r = 잰다();
  console.log('■ 라이브 서버 환경변수 점검 — ' + new Date().toLocaleString('ko-KR'));
  console.log('   ⭐ 재는 것은 «값이 맞나»가 아니라 «이름이 컨테이너에 들어가나»다');
  console.log('');
  console.log('   설정(app.yaml)에 적힌 것  ' + r.적힌것.length + '개');
  console.log('   서버 코드가 읽는 것        ' + r.읽는것.length + '개');
  console.log('');

  if (r.빠진것.length === 0) {
    console.log('   ✅ 손님이 잃을 것 없음 — 필수 ' + 손님이잃는것.length + '칸이 모두 들어간다');
  } else {
    console.log('   🔴 빠진 것 ' + r.빠진것.length + '개 — 손님이 값을 내고도 못 받는다');
    for (const c of r.빠진것) {
      console.log('      ⛔ ' + c.이름 + (c.또는 ? ' (또는 ' + c.또는 + ')' : ''));
      console.log('         → ' + c.잃는것);
    }
    console.log('');
    console.log('   ⚠ 고치는 순서 — 스테이지에 시크릿을 «먼저» 만들고, 그 다음에 app.yaml 에 적는다.');
    console.log('     거꾸로 하면 배포가 Starting 에서 멈춘다(app.yaml 주석의 KDI 사고).');
  }

  if (r.적어둘것.length > 0) {
    console.log('');
    console.log('   ⬜ 서버가 읽지만 설정에 없는 것 — ' + r.적어둘것.join(' '));
    console.log('      (기본값이 있거나 플랫폼이 주는 것들이다. 빨간불이 아니다)');
  }
  return r.빠진것.length === 0;
}

const 직접 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (직접) {
  if (process.argv.includes('--시험')) process.exit(자가시험() ? 0 : 1);
  const 시험통과 = 자가시험();
  console.log('');
  const 통과 = 낸다();
  process.exit(시험통과 && 통과 ? 0 : 1);
}
