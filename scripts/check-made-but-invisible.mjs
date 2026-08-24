/**
 * check-made-but-invisible.mjs — **「만들어 놓고 안 보이는 것」을 한 번에 훑는다.** 전 유닛이 쓴다.
 *
 * ── 🔴 왜 (2026-08-24 밤) ─────────────────────────────────────
 * 사장님 「모두 하던 일을 멈추고 방문자가 왜 없는지를 분석하라」.
 * 그 밤에 **같은 종류의 흠을 세 번** 찾았다 —
 * ```
 *   ① 숏영상 21편   → VideoObject 스키마 0장
 *   ② 숏영상 21편   → 비디오 사이트맵 9편 (12편이 손으로 적은 목록에서 빠져 있었다)
 *   ③ 카드뉴스 474장 → 지면에 0벌 · 사이트맵에 0장
 *   ④ 오늘 낸 기사의 OG 카드 1장이 아예 안 만들어져 있었다 (공유하면 그림이 안 뜬다)
 * ```
 * 넷 다 **만드는 값은 다 치르고 노출은 0**이었다. 그리고 넷 다 아무도 안 알려 줬다 —
 * 화면에는 아무 표시도 안 난다. 몇 달이 지나도 모른다.
 *
 * ⭐ 그래서 규칙을 문장이 아니라 **검사**로 둔다. 다섯 번째가 있으면 여기서 잡힌다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * ① 서버에 있는 파일이 «어디엔가» 걸려 있나 — 지면이든 사이트맵이든
 * ② 사이트맵이 가리키는 것이 «실제로» 있나 — 죽은 주소를 구글에 주면 손해다
 * ③ 갈래마다 몇 %가 보이나 — 낱장 이름을 다 대면 못 읽으니 갈래로 묶어 보여 준다
 *
 * ⛔ 이 자는 «막지» 않는다. 새 그림을 만든 직후에는 잠깐 안 걸려 있는 것이 정상이고,
 *   막으면 사람이 검사를 끄게 된다. **세어서 보여 주고, 나빠지면 크게 적는다.**
 * ⚠ dist 가 없으면 「못 쟀다」로 끝낸다. 「통과」로 적지 않는다.
 *
 *   node scripts/check-made-but-invisible.mjs
 *   node scripts/check-made-but-invisible.mjs --방=public/100y --맵=dist/100y/sitemap.xml --지면=dist/100y
 *   node scripts/check-made-but-invisible.mjs --자가시험
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const 인자 = (이름, 기본) => {
  const 머리 = `--${이름}=`;
  const a = process.argv.find((x) => x.startsWith(머리));
  return a ? a.slice(머리.length) : 기본;
};

/** 우리가 «내놓은 것»으로 치는 확장자. ⛔ 소스·자료 파일을 세면 늘 안 걸린 것으로 나온다 */
export const 볼확장자 = ['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.webm', '.svg', '.pdf', '.csv', '.tsv'];

/**
 * **아는 예외.** 걸린 데가 없는 것이 «맞는» 파일이다.
 * ⛔ 여기에 넣는 것은 「보기 싫어서」가 아니라 **까닭을 적을 수 있을 때만**이다.
 *   까닭 없이 넣기 시작하면 이 자가 아무것도 안 잡는 자가 된다.
 * ⚠ 목록이 길어지면 그것 자체가 흠이다 — 지금은 하나다.
 */
export const 아는예외 = [
  {
    길: 'og.svg',
    왜: '2026-08-08 까지 기사 36편이 다 이 한 장을 공유 카드로 달고 있었다. SVG 는 '
      + '카카오톡·X·페이스북이 안 그려서 기사마다 PNG 를 만들어 바꿨다. 코드에서는 아무도 '
      + '안 쓰고 주석 넷에만 남아 있다. ⛔ 그래도 «지우지 않는다» — 그때 나간 공유 링크가 '
      + '밖에서 이 주소를 가리키고 있을 수 있고, 지우면 그것이 404 가 된다. 28KB 다.',
  },
];

export function 예외인가(상대길) {
  const s = String(상대길 ?? '').replace(/\\/g, '/');
  return 아는예외.some((x) => s === x.길 || s.endsWith(`/${x.길}`));
}

export function 볼파일인가(이름) {
  const s = String(이름 ?? '').toLowerCase();
  return 볼확장자.some((e) => s.endsWith(e));
}

/**
 * 갈래 이름 — 첫 폴더로 묶는다. ⛔ 낱장 이름을 다 대면 못 읽는다.
 * ⚠ 뿌리에 흩어진 것은 «파일 이름의 앞토막»으로 묶는다(카드뉴스가 그 꼴이다).
 */
export function 갈래이름(상대길) {
  const s = String(상대길 ?? '').replace(/^[\\/]+/, '').replace(/\\/g, '/');
  if (!s) return '(뿌리)';
  const 조각 = s.split('/');
  if (조각.length > 1) return 조각[0];
  /* 뿌리 낱장 — 확장자를 떼고 마지막 `-무엇` 을 떼어 앞토막을 갈래로 본다 */
  const 이름 = 조각[0].replace(/\.[a-z0-9]+$/i, '');
  const m = 이름.match(/^(.+?)-(sq|v|\d+)(-\d+)?$/);
  return m ? '(낱장) ' + m[1].split('-').slice(0, 2).join('-') : '(낱장)';
}

/** 그 주소가 글 안에 «있나». ⛔ 파일 이름만 찾지 않는다 — 같은 이름이 여럿일 수 있다 */
export function 걸렸나(상대길, 글들) {
  const s = String(상대길 ?? '').replace(/\\/g, '/');
  if (!s) return false;
  return (글들 ?? []).some((g) => g.includes(s));
}

/** 백분율. ⛔ 분모가 0이면 0%가 아니라 못 잼이다 */
export function 몫(위, 아래) {
  if (!Number.isFinite(위) || !Number.isFinite(아래) || 아래 <= 0) return null;
  return (100 * 위) / 아래;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('그림·영상을 본다', 볼파일인가('a.png') && 볼파일인가('b.MP4') && 볼파일인가('c.jpg'));
  /* ⛔ 소스나 자료를 세면 늘 「안 걸렸다」가 나와서 자가 못 쓰게 된다 */
  검('⭐ 소스·자료는 안 본다', !볼파일인가('x.ts') && !볼파일인가('y.json') && !볼파일인가('z.html'));
  검('빈 것은 안 본다', !볼파일인가('') && !볼파일인가(null));

  검('폴더로 묶는다', 갈래이름('video/actors.mp4') === 'video');
  검('깊은 폴더도 첫 칸으로', 갈래이름('cardnews/fame/01.png') === 'cardnews');
  검('낱장은 앞토막으로 묶는다', 갈래이름('a-battle-in-vietnam-sq-3.png').startsWith('(낱장)'));
  검('같은 벌은 같은 갈래로',
    갈래이름('a-battle-in-vietnam-sq-3.png') === 갈래이름('a-battle-in-vietnam-sq-5.png'));
  검('빈 것은 뿌리', 갈래이름('') === '(뿌리)' && 갈래이름(null) === '(뿌리)');

  검('글 안에 있으면 걸린 것', 걸렸나('video/a.mp4', ['<video src="/video/a.mp4">']));
  검('없으면 안 걸린 것', 걸렸나('video/z.mp4', ['<video src="/video/a.mp4">']) === false);
  /* 역슬래시로 온 경로도 같게 본다 — 윈도우에서 돈다 */
  검('⭐ 역슬래시 경로도 찾는다', 걸렸나('video\\a.mp4', ['/video/a.mp4']));
  검('빈 것을 넣어도 안 터진다', 걸렸나(null, null) === false && 걸렸나('a', null) === false);

  검('몫을 낸다', 몫(1, 4) === 25);
  /* ⛔ 분모가 0이면 「0%가 보인다」가 아니라 「못 잰다」다 */
  검('⭐ 분모가 0이면 못 잼', 몫(0, 0) === null);
  검('못 잰 값은 못 잼', 몫(null, 4) === null);

  검('아는 예외를 알아본다', 예외인가('og.svg') === true);
  검('폴더 밑에 있어도 알아본다', 예외인가('wikitip/og.svg') === true);
  검('다른 파일은 예외가 아니다', 예외인가('og/x.png') === false && 예외인가('') === false);
  /* 🔴 예외를 «까닭 없이» 늘리면 이 자가 아무것도 안 잡는 자가 된다.
     그래서 목록 자체를 검사한다 — 까닭이 짧으면 그건 까닭을 안 적은 것이다 */
  검('⭐ 예외마다 까닭이 적혀 있다',
    아는예외.every((x) => typeof x.왜 === 'string' && x.왜.length >= 40));
  검('⭐ 예외가 너무 많아지지 않았나 — 다섯을 넘으면 그것 자체가 흠이다',
    아는예외.length <= 5);

  if (실패.length) {
    console.error(`❌ 자가시험 ${실패.length}건 실패\n` + 실패.map((s) => `   · ${s}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ check-made-but-invisible 자가시험 통과 (20)');
  process.exit(0);
}

const 파일방 = path.join(뿌리, 인자('방', 'public/wikitip'));
const 맵길 = path.join(뿌리, 인자('맵', 'dist/wikitip/sitemap.xml'));
const 지면방 = path.join(뿌리, 인자('지면', 'dist/wikitip'));

console.log('만들어 놓고 «안 보이는» 것을 찾는다\n');

if (!existsSync(파일방)) { console.log(`⬜ **못 쟀다** — ${파일방} 이 없다`); process.exit(0); }
if (!existsSync(맵길)) {
  console.log('⬜ **못 쟀다** — 사이트맵이 없다. 먼저 npm run build 를 돌린다.');
  console.log('   ⚠ 저장소를 여섯이 나눠 쓰므로 남이 빌드 중이면 dist 가 잠시 사라진다.');
  console.log('   ⛔ 「통과」로 적지 않는다.');
  process.exit(0);
}

/* 내놓은 파일을 다 모은다 */
const 파일들 = [];
(function 걷기(d, 위) {
  let 들 = [];
  try { 들 = readdirSync(d); } catch { return; }
  for (const f of 들) {
    const p = path.join(d, f);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) 걷기(p, 위 ? `${위}/${f}` : f);
    else if (볼파일인가(f)) 파일들.push({ 상대: 위 ? `${위}/${f}` : f, 크기: st.size });
  }
}(파일방, ''));

/* 어디에 걸렸는지 볼 «글»들 — 사이트맵과 지어진 지면 전부 */
const 글들 = [readFileSync(맵길, 'utf8')];
(function 지면걷기(d) {
  let 들 = [];
  try { 들 = readdirSync(d); } catch { return; }
  for (const f of 들) {
    const p = path.join(d, f);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) 지면걷기(p);
    else if (f.endsWith('.html')) { try { 글들.push(readFileSync(p, 'utf8')); } catch { /* 지나간다 */ } }
  }
}(지면방));

console.log(`내놓은 파일 ${파일들.length}개 · 훑은 글 ${글들.length}개(사이트맵 1 + 지면 ${글들.length - 1})\n`);

/* 갈래마다 센다 */
const 통 = new Map();
for (const f of 파일들) {
  const g = 갈래이름(f.상대);
  if (!통.has(g)) 통.set(g, { 갈래: g, 다: 0, 걸림: 0, 안걸린것: [], 바이트: 0, 예외: 0 });
  const v = 통.get(g);
  v.다++; v.바이트 += f.크기;
  /* ⛔ 아는 예외는 «걸림»으로도 «안 걸림»으로도 세지 않는다 — 따로 센다.
     걸림에 넣으면 100% 라는 거짓이 되고, 안 걸림에 넣으면 영원히 빨간 줄이 남는다 */
  if (예외인가(f.상대)) { v.예외 = (v.예외 ?? 0) + 1; v.다--; continue; }
  if (걸렸나(f.상대, 글들)) v.걸림++;
  else v.안걸린것.push(f.상대);
}

const 줄들 = [...통.values()].sort((a, b) => b.안걸린것.length - a.안걸린것.length || b.다 - a.다);
console.log('갈래                     파일   걸림   안 걸림   보이는 몫   낭비된 크기');
for (const v of 줄들) {
  const m = 몫(v.걸림, v.다);
  const 낭비 = v.다 ? Math.round((v.바이트 * v.안걸린것.length) / v.다 / 1024) : 0;
  console.log(`${v.갈래.slice(0, 22).padEnd(23)} ${String(v.다).padStart(5)} ${String(v.걸림).padStart(6)}`
    + ` ${String(v.안걸린것.length).padStart(8)}   ${(m === null ? '못 잼' : `${m.toFixed(0)}%`).padStart(8)}`
    + `   ${v.안걸린것.length ? `${낭비} KB` : '—'}`);
}

const 안걸린합 = 줄들.reduce((s, v) => s + v.안걸린것.length, 0);
const 낭비합 = 줄들.reduce((s, v) => s + (v.다 ? (v.바이트 * v.안걸린것.length) / v.다 : 0), 0);

console.log(`\n■ 어디에도 안 걸린 파일  ${안걸린합}개 / ${파일들.length}개`
  + ` (${(몫(안걸린합, 파일들.length) ?? 0).toFixed(0)}%) · 약 ${Math.round(낭비합 / 1024)} KB`);

if (안걸린합 > 0) {
  console.log('\n⛔ **만드는 값은 다 치르고 노출은 0인 것들이다.** 갈래마다 몇 개씩 —');
  for (const v of 줄들.filter((x) => x.안걸린것.length).slice(0, 6)) {
    console.log(`   ${v.갈래} (${v.안걸린것.length}개): ${v.안걸린것.slice(0, 3).join(', ')}${v.안걸린것.length > 3 ? ' …' : ''}`);
  }
  console.log('\n   ⇒ 지면에 걸거나 사이트맵에 넣는다. 둘 다 아니면 «지우는 것»도 답이다 —');
  console.log('     안 쓸 것을 저장소에 두면 다음 사람이 또 세어 보게 된다.');
}

/* 반대쪽 — 사이트맵이 가리키는 것이 실제로 있나 */
const 맵글 = 글들[0];
const 가리킨것 = [
  ...[...맵글.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((m) => m[1]),
  ...[...맵글.matchAll(/<video:content_loc>([^<]+)<\/video:content_loc>/g)].map((m) => m[1]),
  ...[...맵글.matchAll(/<video:thumbnail_loc>([^<]+)<\/video:thumbnail_loc>/g)].map((m) => m[1]),
];
const 죽은것 = [];
for (const u of 가리킨것) {
  const 상대 = u.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '');
  if (![path.join(파일방, 상대), path.join(지면방, 상대)].some((p) => existsSync(p))) 죽은것.push(상대);
}
console.log(`\n■ 사이트맵이 가리키는 그림·영상 ${가리킨것.length}개 중 «파일이 없는» 것 ${죽은것.length}개`
  + ` ${죽은것.length ? '🔴' : '✅'}`);
for (const x of 죽은것.slice(0, 5)) console.log(`   ${x}`);
if (죽은것.length) console.log('   ⛔ 죽은 주소를 구글에 주면 그 사이트맵 전체가 의심받는다.');

console.log('\n⚠ 이 자는 «막지» 않는다. 새 그림을 만든 직후엔 잠깐 안 걸린 것이 정상이다.');
console.log('  ⛔ 그래도 「몇 달째 0%」인 갈래가 있으면 그것은 정상이 아니다 — 위 표를 그 눈으로 본다.');
