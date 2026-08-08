/**
 * 여는 달 날짜가 **어느 기계에서 그려도 같은가.**
 *
 * ── 🔴 왜 만들었나 (2026-08-08 17:5x) ──────────────────────────────
 * 라이브 `/subscribe` 를 열어 보니 이렇게 나가 있었다.
 *
 * ```
 * 내 화면(KST)   Free for the opening month, 15 August to 14 September   ← 맞다
 * 라이브(UTC)    Free for the opening month, 14 August to 13 September   ← 손님이 본 것
 * ```
 *
 * `toLocaleDateString` 에 `timeZone` 을 안 주면 **그리는 기계의 시간대**로 나온다.
 * 내 기계는 KST, 내보내는 기계는 UTC 였다. **내 빌드에서는 영원히 맞았다.**
 *
 * ⛔ 그래서 이 자는 「내 화면에서 맞나」를 안 묻는다. **시간대를 바꿔 놓고 두 번 그려 본다.**
 *    달라지면 선다 — 그것이 라이브에서만 나는 병을 여기서 잡는 유일한 방법이다.
 * ⛔ 8/15 는 우리 출시일이다. 하루 이른 날짜는 「무료가 언제 시작하나」를 틀리게 말한 것이다.
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const 값길 = 'src/data/wikitip-price.ts';
const 지면들 = ['dist/wikitip/data.html', 'dist/wikitip/subscribe.html'];

/** 상수에서 사람이 읽는 꼴을 **자가 따로** 만든다. 지면 함수를 그대로 안 믿는다 */
export function 손으로꼴(s) {
  const 달 = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return `${+m[3]} ${달[+m[2] - 1]}`;
}

/**
 * 시간대에 기대는 꼴이 남아 있나. `timeZone` 을 명시했으면 봐준다.
 *
 * ⚠ **주석은 안 본다.** 처음 판은 「이 병이 이랬다」고 적어 둔 주석의 예시 코드를
 *   병으로 잡았다. 병을 적어 둔 글이 병으로 세면 다음 사람은 설명을 지운다.
 */
export function 시간대의존(원문) {
  const 코드 = 원문
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
  const 걸린 = [];
  /*
   * ⚠ **날짜만 본다.** 처음 판은 `toLocale\w*String` 으로 잡아 숫자의 `toLocaleString()`
   *   예순 곳까지 끌고 왔다. 그건 다른 병(자릿점)이고, 다른 자로 따로 잰다 —
   *   한 자에 두 병을 담으면 고칠 수 없는 자가 되고, 고칠 수 없는 자는 꺼진다.
   */
  for (const m of 코드.matchAll(/toLocale(?:Date|Time)String\s*\(([^)]*)\)/g)) {
    if (!/timeZone/.test(m[1])) 걸린.push(m[0].slice(0, 60));
  }
  /* `toLocaleString` 은 날짜 꼴(month·day·year)을 달라고 할 때만 날짜다 */
  for (const m of 코드.matchAll(/toLocaleString\s*\(([^)]*)\)/g)) {
    if (/\b(month|day|year|weekday|hour)\b/.test(m[1]) && !/timeZone/.test(m[1])) {
      걸린.push(m[0].slice(0, 60));
    }
  }
  for (const m of 코드.matchAll(/\.get(Date|Month|FullYear|Hours|Day)\s*\(\s*\)/g)) 걸린.push(m[0]);
  return 걸린;
}

if (process.argv[1] && process.argv[1].endsWith('check-price-dates.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('꼴을 만든다', 손으로꼴('2026-08-15') === '15 August');
  자가('앞의 0 을 뗀다', 손으로꼴('2026-09-04') === '4 September');
  자가('꼴이 아니면 null', 손으로꼴('2026/08/15') === null);
  자가('timeZone 없는 것을 잡는다',
    시간대의존("x.toLocaleDateString('en-GB', { day: 'numeric' })").length === 1);
  자가('timeZone 있으면 안 잡는다',
    시간대의존("x.toLocaleDateString('en-GB', { timeZone: 'Asia/Seoul' })").length === 0);
  자가('getDate 도 잡는다', 시간대의존('d.getDate()').length === 1);
  자가('숫자 자릿점은 이 자가 안 본다', 시간대의존('n.toLocaleString()').length === 0);
  자가('날짜 꼴을 부르면 본다', 시간대의존("d.toLocaleString('en-GB', { month: 'long' })").length === 1);
  자가('주석 안의 예시는 안 잡는다',
    시간대의존("/* 앞판: x.toLocaleDateString('en-GB', {}) 였다 */ const a = 1;").length === 0);
  자가('한 줄 주석도 안 본다',
    시간대의존(["// x.toLocaleDateString('en-GB', {})", 'const a = 1;'].join('\n')).length === 0);
  /* ⚠ 주석을 지운다고 **코드까지 지우면** 자가 늘 통과한다. 그 반대쪽도 시험한다 */
  자가('주석 뒤의 코드는 여전히 본다',
    시간대의존(['// 설명', "d.toLocaleDateString('en-GB', {})"].join('\n')).length === 1);
  자가('URL 의 // 는 주석이 아니다',
    시간대의존("const u = 'https://x.y'; d.toLocaleDateString('en-GB', {});").length === 1);
  console.log(`여는 달 날짜 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(40)} ${값}`); };

  const 원문 = fs.readFileSync(값길, 'utf8');
  const 상수 = Object.fromEntries(
    [...원문.matchAll(/^export const (FREE_FROM|FREE_UNTIL) = '([\d-]+)';/gm)].map((m) => [m[1], m[2]]),
  );
  본다('여는 달 상수를 둘 읽었나', Object.keys(상수).length === 2,
    `${상수.FREE_FROM ?? '?'} ~ ${상수.FREE_UNTIL ?? '?'}`);
  if (Object.keys(상수).length !== 2) process.exit(1);

  /* ── ① 시간대를 바꿔 놓고 두 번 그린다. 이것이 이 자의 핵심이다 ── */
  const 그려보기 = (tz) => execFileSync(
    'node',
    ['--experimental-strip-types', '-e', "import('./src/data/wikitip-price.ts').then((m)=>process.stdout.write(m.여는달()))"],
    { env: { ...process.env, TZ: tz }, encoding: 'utf8' },
  ).trim();
  /* ⚠ 나라를 넓게 잡는다 — UTC 하나만 보면 「하루 뒤」 쪽 시간대를 못 본다 */
  const 시간대들 = ['UTC', 'Asia/Seoul', 'America/Los_Angeles', 'Pacific/Kiritimati'];
  const 그린것 = 시간대들.map((tz) => [tz, 그려보기(tz)]);
  const 가지 = new Set(그린것.map(([, v]) => v));
  본다('시간대를 바꿔도 같은 글자인가', 가지.size === 1,
    가지.size === 1 ? [...가지][0] : 그린것.map(([t, v]) => `${t}=${v}`).join(' · '));

  /* ── ② 그린 글자가 상수와 맞나. 함수가 스스로 일관되게 틀릴 수도 있다 ── */
  const 바라는 = `${손으로꼴(상수.FREE_FROM)} to ${손으로꼴(상수.FREE_UNTIL)}`;
  본다('상수에서 나온 글자와 같나', [...가지][0] === 바라는, `${[...가지][0]} / 바라는 ${바라는}`);

  /* ── ③ 시간대에 기대는 꼴이 파일에 남아 있나 ── */
  const 걸린 = 시간대의존(원문);
  본다('시간대에 기대는 꼴이 남았나', 걸린.length === 0,
    걸린.length ? `🔴 ${걸린.join(' · ')}` : '없다');

  /* ── ④ 빌드된 지면이 그 글자를 담고 있나 ── */
  for (const p of 지면들) {
    if (!fs.existsSync(p)) {
      본다(`${p.split('/').pop()} 가 dist 에 있나`, false, '🔴 빌드부터 해야 한다');
      continue;
    }
    const s = fs.readFileSync(p, 'utf8').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
    본다(`${p.split('/').pop()} 에 여는 달`, s.includes(바라는), 바라는);
  }

  /* ── ⑤ 같은 병이 **지면 쪽에도** 있었다. 폴더 전체를 훑는다 ──────────
     값만 고치고 끝내면 45편의 「자료 기준일」이 하루 이른 채로 남는다. */
  const 훑을것 = [
    ...fs.readdirSync('src/pages/wikitip').filter((f) => f.endsWith('.astro')).map((f) => `src/pages/wikitip/${f}`),
    ...fs.readdirSync('src/pages/wikitip/article').map((f) => `src/pages/wikitip/article/${f}`),
    'src/layouts/WikiTip.astro',
  ].filter((p) => fs.existsSync(p));
  const 샌곳 = 훑을것
    .map((p) => [p, 시간대의존(fs.readFileSync(p, 'utf8'))])
    .filter(([, v]) => v.length);
  본다('지면에 시간대 안 못박은 날짜가 있나', 샌곳.length === 0,
    샌곳.length ? `🔴 ${샌곳.map(([p, v]) => `${p.split('/').pop()}(${v.length})`).join(' · ')}` : `${훑을것.length}장 다 못박혔다`);

  /* ── ⑥ 실제로 그린 것이 맞나 — 기사 45편의 「자료 기준일」을 다 본다 ──
     ⚠ 규칙만 있고 화면을 안 보면, 다음에 다른 길로 같은 병이 들어와도 조용하다. */
  const 달이름 = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  let 본기사 = 0; let 어긋난기사 = [];
  for (const f of fs.readdirSync('content/kculturewire').filter((x) => x.endsWith('.md'))) {
    const md = fs.readFileSync(`content/kculturewire/${f}`, 'utf8');
    const m = /^dataAsOf:\s*(\d{4})-(\d{2})-(\d{2})/m.exec(md);
    const html = `dist/wikitip/article/${f.replace(/\.md$/, '')}.html`;
    if (!m || !fs.existsSync(html)) continue;
    /* frontmatter 는 KST 로 적는다. 화면에도 그 날짜가 그대로 나와야 한다 */
    const 바라는날 = `${+m[3]} ${달이름[+m[2] - 1]} ${m[1]}`;
    본기사++;
    const s = fs.readFileSync(html, 'utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    if (!s.includes(바라는날)) 어긋난기사.push(`${f.replace(/\.md$/, '')} → ${바라는날}`);
  }
  본다('기사의 자료 기준일이 맞게 그려졌나', 어긋난기사.length === 0,
    어긋난기사.length ? `🔴 ${어긋난기사.length}편 — ${어긋난기사.slice(0, 3).join(' · ')}` : `${본기사}편 다 맞다`);

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 여는 달·기사 날짜 — 어느 시간대에서 그려도 같다');
  process.exit(틀림 ? 1 : 0);
}
