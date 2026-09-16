#!/usr/bin/env node
/**
 * check-content-types.mjs — **dist 에 있는 확장자가 서버 타입표에 다 있나.**
 *
 *   node scripts/check-content-types.mjs
 *   node scripts/check-content-types.mjs --라이브     실제로 나가는 타입까지 잰다
 *   node scripts/check-content-types.mjs --자가시험
 *
 * ── 🔴 왜 만드나 — 같은 사고를 «두 번» 당했다 ────────────────────────────
 *
 * ```
 * 2026-08-30  .mp4 가 표에 없었다 → 우리 영상이 검색에 «영상으로» 안 잡혔다.
 *             28일 영상 검색 노출이 네 사이트 모두 0 이었다
 * 2026-09-16  .webmanifest 가 표에 없었다 → 아이폰이 매니페스트를 파싱 못 해
 *             홈 화면 이름이 계속 「seoulmarkets」로 떴다
 *             사장님: 「어제 작업한 건데, 왜 그러지?」
 * ```
 *
 * ⭐ 두 번 다 **아무 데도 빨간불이 안 켜졌다.** 서버는 200 을 내고 파일도 멀쩡히 나간다.
 *   다만 `application/octet-stream` 이라, 우리가 건 `nosniff` 와 만나면
 *   브라우저·크롤러가 **그것을 그 종류로 다루기를 거부한다.**
 *   ⇒ 사람 눈에는 아무 일도 없어 보이고, 기계 눈에만 없는 것이 된다.
 *
 * ⛔ 첫 사고 때 「새 미디어를 쓰기 시작하면 여기부터 더한다」고 «주석으로» 적어 두었다.
 *   그리고 또 당했다. **말로 적은 규칙은 잊힌다. 그래서 검사로 둔다.**
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 안 재도 되는 것 — 손님에게 그 꼴로 나갈 일이 없는 부스러기 */
export const 봐줄확장자 = new Set([
  '', '.map',            /* 소스맵은 브라우저가 알아서 찾는다 */
  '.gz', '.br',          /* 눌린 것은 원본 타입을 따른다 */
  '.gitkeep', '.ds_store',
]);

/** server.mjs 의 TYPES 표에서 확장자만 뽑는다. ⛔ 손으로 옮겨 적지 않는다 */
export function 표읽기(글) {
  const m = String(글 ?? '').match(/const TYPES = \{([\s\S]*?)\n\};/);
  if (!m) return null;
  const 것 = [...m[1].matchAll(/'(\.[a-z0-9]+)'\s*:/gi)].map((x) => x[1].toLowerCase());
  return new Set(것);
}

/** dist 를 훑어 «실제로 나가는» 확장자를 센다 */
export function 확장자세기(칸, 센것 = new Map()) {
  let 목록 = [];
  try { 목록 = fs.readdirSync(칸, { withFileTypes: true }); } catch { return 센것; }
  for (const e of 목록) {
    const p = path.join(칸, e.name);
    if (e.isDirectory()) { 확장자세기(p, 센것); continue; }
    const 확 = path.extname(e.name).toLowerCase();
    if (!센것.has(확)) 센것.set(확, { 수: 0, 보기: p });
    센것.get(확).수 += 1;
  }
  return 센것;
}

export function 빠진것(센것, 표) {
  const 것 = [];
  for (const [확, v] of 센것) {
    if (봐줄확장자.has(확)) continue;
    if (표.has(확)) continue;
    것.push({ 확장자: 확, 수: v.수, 보기: v.보기 });
  }
  return 것.sort((a, b) => b.수 - a.수);
}

async function 라이브잰다() {
  /* 손님이 실제로 받는 타입을 몇 개만 찔러 본다 */
  const 볼것 = [
    ['/manifest.webmanifest', /manifest\+json/],
    ['/llms.txt', /text\/plain/],
    ['/sitemap.xml', /xml/],
    ['/favicon.svg', /svg/],
  ];
  console.log('\n■ 라이브에서 실제로 나가는 타입');
  for (const [길, 바람] of 볼것) {
    try {
      const r = await fetch('https://seoulmarkets.com' + 길, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
      const t = r.headers.get('content-type') ?? '(없다)';
      const ok = 바람.test(t);
      console.log('  ' + (ok ? '✅' : '🔴') + ' ' + 길.padEnd(24) + t);
    } catch (e) {
      console.log('  ⬜ ' + 길.padEnd(24) + '못 쟀다 — ' + String(e.message).slice(0, 40));
    }
  }
}

function 본일() {
  const 글 = (() => { try { return fs.readFileSync(path.join(뿌리, 'server.mjs'), 'utf8'); } catch { return null; } })();
  const 표 = 표읽기(글);
  if (!표) { console.log('🔴 server.mjs 의 TYPES 표를 못 읽었다 — 표 꼴이 바뀌었나 본다'); return 1; }

  const dist = path.join(뿌리, 'dist');
  if (!fs.existsSync(dist)) {
    console.log('⬜ dist 가 없다 — 먼저 빌드한다. (0 으로 치지 않는다)');
    return 0;
  }
  const 센것 = 확장자세기(dist);
  const 빠짐 = 빠진것(센것, 표);

  console.log('■ 서버 타입표 — dist 확장자 ' + 센것.size + '가지 · 표에 ' + 표.size + '가지');
  if (!빠짐.length) {
    console.log('  ✅ 빠진 것 없다. 모든 파일이 제 타입으로 나간다.');
    return 0;
  }
  console.log('  🔴 표에 «없는» 확장자 ' + 빠짐.length + '가지 — 이것들은 octet-stream 으로 나간다\n');
  for (const x of 빠짐) {
    console.log('     ' + x.확장자.padEnd(14) + String(x.수).padStart(5) + '개   예: '
      + path.relative(뿌리, x.보기));
  }
  console.log('\n  ⛔ 우리는 nosniff 를 건다 — 브라우저가 «추측하지 않는다».');
  console.log('     그래서 이 파일들은 200 으로 나가지만 그 «종류»로는 안 쓰인다.');
  console.log('     서버는 멀쩡해 보이고 기계 눈에만 없는 것이 된다.');
  console.log('  ✅ 고치는 곳 — server.mjs 의 TYPES 표에 한 줄 더한다.');
  return 1;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  const 가짜 = "const TYPES = {\n  '.html': 'text/html',\n  '.mp4': 'video/mp4',\n};";
  const 표 = 표읽기(가짜);
  재다('표읽기: 확장자를 뽑는다', 표 && 표.has('.html') && 표.has('.mp4'));
  재다('표읽기: 개수가 맞다', 표 && 표.size === 2);
  재다('⛔ 표읽기: 표가 없으면 null', 표읽기('아무 글') === null);
  재다('⛔ 표읽기: 빈 것도 견딘다', 표읽기(null) === null && 표읽기('') === null);

  const 센것 = new Map([
    ['.html', { 수: 10, 보기: 'a.html' }],
    ['.webmanifest', { 수: 1, 보기: 'manifest.webmanifest' }],
    ['.map', { 수: 3, 보기: 'x.map' }],
    ['', { 수: 2, 보기: 'CNAME' }],
  ]);
  const 빠짐 = 빠진것(센것, 표);
  재다('🔴 표에 없는 것을 잡는다', 빠짐.length === 1 && 빠짐[0].확장자 === '.webmanifest');
  재다('⛔ 봐줄 것(.map·확장자 없음)은 안 잡는다',
    !빠짐.some((x) => x.확장자 === '.map' || x.확장자 === ''));
  재다('많은 것부터 보여 준다', 빠진것(new Map([
    ['.a', { 수: 1, 보기: 'x' }], ['.b', { 수: 9, 보기: 'y' }],
  ]), new Set()).map((x) => x.확장자).join() === '.b,.a');

  /* 🔴 우리가 두 번 당한 것이 지금 표에 있나 — 이것이 이 자의 핵심 시험이다 */
  const 진짜 = (() => { try { return fs.readFileSync(path.join(뿌리, 'server.mjs'), 'utf8'); } catch { return ''; } })();
  const 진짜표 = 표읽기(진짜);
  재다('🔴 .mp4 가 표에 있다 (2026-08-30 사고)', !!진짜표 && 진짜표.has('.mp4'));
  재다('🔴 .webmanifest 가 표에 있다 (2026-09-16 사고)', !!진짜표 && 진짜표.has('.webmanifest'));
  재다('.md 가 표에 있다 (GEO — AI 가 읽는 꼴)', !!진짜표 && 진짜표.has('.md'));

  const 실패 = 것.filter((x) => !x.됐나);
  console.log('■ 자가시험 ' + (것.length - 실패.length) + '/' + 것.length);
  for (const x of 실패) console.log('  🔴 ' + x.이름);
  return 실패.length === 0;
}

/** 일일 점검이 부르는 공통 입구 */
export function 일일점검(사이트코드) {
  if (사이트코드 && 사이트코드 !== 'seoulmarkets') return { 됐나: null, 말: '한 서버가 셋을 서비스한다 — SeoulMarkets 칸에서만 잽니다' };
  const 글 = (() => { try { return fs.readFileSync(path.join(뿌리, 'server.mjs'), 'utf8'); } catch { return null; } })();
  const 표 = 표읽기(글);
  if (!표) return { 됐나: null, 말: 'TYPES 표를 못 읽었다' };
  const dist = path.join(뿌리, 'dist');
  if (!fs.existsSync(dist)) return { 됐나: null, 말: 'dist 가 없다 — 못 쟀다' };
  const 빠짐 = 빠진것(확장자세기(dist), 표);
  if (!빠짐.length) return { 됐나: true, 말: '모든 확장자가 제 타입으로 나간다' };
  return {
    됐나: false,
    말: '🔴 octet-stream 으로 나가는 확장자 ' + 빠짐.length + '가지 — '
      + 빠짐.slice(0, 4).map((x) => x.확장자 + '(' + x.수 + ')').join(' · '),
  };
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
else if (process.argv[1] && process.argv[1].endsWith('check-content-types.mjs')) {
  const 코드 = 본일();
  if (process.argv.includes('--라이브')) await 라이브잰다();
  process.exit(코드);
}
