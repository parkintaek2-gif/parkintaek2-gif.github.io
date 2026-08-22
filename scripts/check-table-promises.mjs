/**
 * **「표가 뒤에 있다」는 약속이 참말인가.** (2번 지시 19:4x)
 *
 * 우리 공유 카드 47장에 모두 이렇게 적혀 있다 — 「every figure has a table behind it」.
 * 그 한 줄이 참말이려면 두 가지가 서야 한다.
 *
 *   ① 세어서 파는 표가 **어느 지면엔가 나와 있어야** 한다.
 *      아무 지면도 안 읽는 자료 파일은 사는 사람에게 **없는 것과 같다.**
 *   ② 기사의 **대표 수**가 그 기사가 건 지면 어딘가에 실제로 있어야 한다.
 *      기사가 「자세한 것은 표에」라고 해 놓고 그 표에 그 수가 없으면 약속이 빈다.
 *
 * ⛔ 어느 기사가 비었는지 **손으로 고르지 않는다.** 자가 뽑고, 자가 부르는 순서대로 채운다.
 *    손으로 고르면 「고치기 쉬운 것」부터 고르게 되고, 그건 고른 것이다.
 * ⛔ 면제는 **낱낱이 까닭을 적는다.** 까닭 없는 면제가 하나라도 있으면 이 자가 껍데기가 된다.
 */
import fs from 'node:fs';

const 자료칸 = 'src/data';
const 지면칸 = 'src/pages/wikitip';
const 기사칸 = 'content/kculturewire';

/**
 * 면제표 — 까닭을 적는다. **「아직 안 만들었다」는 까닭이 아니다.**
 * 그건 할 일이지 면제가 아니고, 면제로 적으면 영영 안 만든다.
 */
export const 면제 = {
  'wikitip-og-cards.json':
    '지면에 낼 자료가 아니다. 공유 카드에 박을 수를 사람이 골라 둔 목록이고, 손님이 볼 것은 카드 자체다.',
  'wikitip-page-corrections.json':
    '/corrections 가 이 파일을 컴포넌트를 거쳐 읽는다. 지면 소스에 이름이 안 나오지만 화면에는 나온다.',
  'wikitip-debut-counts.json':
    '이 자료의 결론이 「추이로 쓰면 안 된다」다. 지면에 내면 그 표가 다시 남을 속인다. '
    + '지우지 않고 남긴 까닭은 다음 사람이 같은 질의를 하고 같은 착각을 하기 때문이다.',
  /* ── 2026-08-22 에 늘어난 셋. 낱낱이 까닭을 적는다 ── */
  'wikitip-next-step.json':
    '**우리 손님이 우리 안에서 걷는지**를 우리 서버 로그로 잰 것이다(쿠키·IP 없이). '
    + '이것은 지면에 낼 표가 아니라 **일을 정하는 자**다 — 「문을 더 낼 것인가 옮길 것인가」를 '
    + '이 수로 정한다. 손님이 우리 지면에서 볼 것은 한국 대중문화의 수이고, 우리 주간 방문 수가 아니다. '
    + '⛔ 「아직 지면을 안 만들었다」가 아니다. 낼 자리가 아니라고 정한 것이다.',
  'wikitip-ctr-gap.json':
    '**우리 지면 중 어느 것이 1페이지에 있으면서 안 눌리나**를 적은 일감 목록이다. '
    + '손님이 볼 표가 아니다 — 「이 지면은 안 눌립니다」를 그 지면에 적을 수는 없다. '
    + '⛔ 「아직 지면을 안 만들었다」가 아니라, 낼 자리가 아니라고 정한 것이다. '
    + '이 목록으로 고친 결과는 4주 뒤 같은 자로 다시 재서 확인한다.',
  'wikitip-keyword-demand.json':
    '무엇을 만들지 고를 때 쓰는 자다(자동완성에 그 말이 나오나 · 위키백과를 몇 명이 열었나). '
    + '⛔ 이것을 지면에 내면 손님이 **검색량**으로 읽는다. 우리는 유료 검색량 자료가 없고 '
    + '이 수는 검색량이 아니다. 못 하는 말을 하게 만드는 표는 내지 않는다. '
    + '이 자로 고른 결과는 /most-read · /born-on 으로 이미 나가 있다.',
  'wikitip-places-outside.json':
    '「우리 한국 장소 목록에 한국이 아닌 곳이 19곳 있었다」는 **정정의 근거 자료**다. '
    + '지면이 아니라 카드·영상·사회관계망 꾸러미와 `check-kcw-places-in-korea.mjs` 가 읽는다. '
    + '그 결론은 /corrections 에 사람 말로 실려 있다 — 근거 파일을 표로 또 내면 같은 말이 두 번이 된다.',
  'the-decline-that-was-not-there':
    '낼 표가 없어서 지면을 안 만들었다. 이 기사의 결론이 「이 수는 추이로 쓰면 안 된다」인데, '
    + '못 믿는 수로 표를 만들면 그 표가 다시 남을 속인다. pages 를 비운 것이 이 기사의 정직이다.',
};

/**
 * 지면 소스를 다 이어 붙인다 — 어느 지면이 어느 자료를 읽는지 이름으로 본다.
 *
 * 🔴 2026-08-10 00:4x — **이 자가 `title/` · `market/` · `firm/` 을 안 보고 있었다.**
 *   맨 위 `.astro` 와 `article/` 만 읽었다. 작품 지면 530장·시장 93장·회사 8장이
 *   통째로 안 보였고, 그 지면들만 읽는 자료를 「아무 지면도 안 읽는다」고 잘못 세웠다.
 *   ⛔ 사이트맵이 정확히 같은 병으로 시장 93장을 빠뜨린 적이 있다(이 저장소 sitemap.xml.ts 주석).
 *   ⭐ 그래서 방 이름을 적지 않는다. **아래로 다 걷는다.** 방이 늘어도 자가 저절로 따라온다.
 */
export function 지면소스(읽기 = fs) {
  const 조각 = [];
  const 걷는다 = (방) => {
    for (const e of 읽기.readdirSync(방, { withFileTypes: true })) {
      if (e.isDirectory()) { 걷는다(`${방}/${e.name}`); continue; }
      if (e.name.endsWith('.astro') || e.name.endsWith('.ts')) {
        조각.push(읽기.readFileSync(`${방}/${e.name}`, 'utf8'));
      }
    }
  };
  걷는다(지면칸);
  걷는다('src/components');
  return 조각.join('\n');
}

/**
 * 수를 맞댈 꼴로 만든다. 자릿점과 기호를 떼고 **첫 수 하나**만 남긴다.
 *
 * 🔴 2026-08-09 07:3x — 처음 판은 숫자가 아닌 것을 **다 지워 이어 붙였다.**
 *   그래서 `22 of 24` 가 `2224` 가 되고, 지면에 「22 of 24」가 버젓이 있는데도
 *   「표가 뒤에 없다」고 울었다. ⛔ **자가 못 재는 것을 「없다」로 부른 것**이다.
 *   수가 둘인 카드를 못 쓰게 만드는 대신 자를 고친다.
 */
export function 맨수(s) {
  if (typeof s !== 'string') return null;
  const m = s.replace(/(\d),(?=\d{3}\b)/g, '$1').match(/\d+(?:\.\d+)?/);
  return m ? m[0] : null;
}

/**
 * 한 수를 **받아들일 여러 꼴**로 낸다.
 *
 * 🔴 2026-08-08 20:2x — 자가 `/staying-power` 를 「표에 그 수가 없다」고 불렀다. **있었다.**
 *    기사는 `1.20×`, 지면은 자료에서 읽어 `1.2×` 로 낸다(JSON 이 꼬리 0 을 안 담는다).
 *    **같은 수다.** 자릿수까지 자가 정하면 자가 글을 이긴다 — 오늘만 이 자리에서 다섯 번 걸렸다.
 */
export function 받을꼴(v) {
  if (typeof v !== 'string' || !v.length) return [];
  const 꼴 = new Set([v]);
  const n = Number(v);
  if (Number.isFinite(n)) {
    꼴.add(String(n));                    // 1.20 → 1.2 · 19.0 → 19
    if (Number.isInteger(n)) 꼴.add(n.toFixed(1));  // 19 → 19.0
    else 꼴.add(n.toFixed(2));            // 1.2 → 1.20
  }
  return [...꼴];
}

/**
 * **대표값에 수가 없는 편**을 위한 꼴. 카드의 대표값이 「June」·「Five」처럼 낱말일 때가 있다.
 *
 * 🔴🔴 2026-08-22 — 그런 편 둘을 자가 「약속이 비었다」로 불렀다. **약속은 지켜져 있었다** —
 *   `/look-vs-fly` 지면에 「June」이 두 번 있었다. 까닭은 `맨수('June') → null` 이고
 *   `받을꼴(null) → []` 이라 **볼 것이 없어 늘 거짓**이 되는 것이었다.
 *   ⭐ 수가 없다는 것은 「약속이 비었다」가 아니다. 자가 볼 것을 못 만든 것이다.
 *   ⛔ 자가 못 다루는 꼴을 만나면 **글을 탓하기 전에 자를 넓힌다.**
 * ⚠ 낱말 수는 지면이 숫자로 적었을 수 있다(「Five」 ↔ 「5」). 둘 다 받는다.
 */
const 낱말수 = {
  one: '1', two: '2', three: '3', four: '4', five: '5', six: '6',
  seven: '7', eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12',
};
export function 낱말꼴(v) {
  if (typeof v !== 'string' || !v.trim().length) return [];
  const 말 = v.trim();
  const 꼴 = new Set([말]);
  const 숫 = 낱말수[말.toLowerCase()];
  if (숫) 꼴.add(숫);
  return [...꼴];
}

/**
 * frontmatter 의 pages 를 읽는다.
 *
 * 🔴 2026-08-08 20:2x — 자가 `korean-netflix-titles-one-body` 를 「건 지면이 없다」고 불렀다.
 *    **있었다.** 그 파일만 줄 끝이 CRLF 라 `[ \t]*\n` 이 `\r\n` 을 못 넘었다.
 *    저장소에 CRLF 파일과 LF 파일이 섞여 있다(git 이 체크아웃에서 바꾼다).
 *    ⛔ 줄 끝을 먼저 눌러 놓고 읽는다. 8/7 에 `check-article-reach` 가 같은 자리에서
 *       **딱 한 편**을 「닿을 수 없다」고 불렀다. 같은 병을 두 번 앓지 않는다.
 */
export function 걸린지면(원문) {
  const 눌린 = 원문.replace(/\r\n/g, '\n');
  const m = 눌린.match(/^pages:[ \t]*\n((?:[ \t]*-[ \t]*"[^"]+"[ \t]*\n)*)/m);
  if (!m) return [];
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

if (process.argv[1] && process.argv[1].endsWith('check-table-promises.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('자릿점을 뗀다', 맨수('37,962') === '37962');
  자가('기호를 뗀다', 맨수('$39') === '39');
  자가('꼬리 점을 뗀다', 맨수('1.32×') === '1.32');
  자가('숫자가 없으면 null', 맨수('none') === null);
  /* 🔴 이 셋이 07:3x 에 자를 고친 까닭이다 — 수가 둘이면 이어 붙어 있었다 */
  자가('수가 둘이면 첫 수만', 맨수('22 of 24') === '22');
  자가('수가 둘이어도 소수를 살린다', 맨수('35.3% vs 5.6%') === '35.3');
  자가('자릿점 뒤 수를 안 이어 붙인다', 맨수('1,008 of 2,000') === '1008');
  자가('1.20 은 1.2 로도 받는다', 받을꼴('1.20').includes('1.2'));
  자가('19 는 19.0 으로도 받는다', 받을꼴('19').includes('19.0'));
  자가('1.2 는 1.20 으로도 받는다', 받을꼴('1.2').includes('1.20'));
  자가('빈 것은 빈 배열', 받을꼴('').length === 0);
  /* 🔴 2026-08-22 — 낱말 대표값이 늘 「약속이 비었다」가 되던 자리. 자가 볼 것을 못 만들었을 뿐이었다 */
  자가('⭐ 낱말 대표값은 그 낱말로 본다', 낱말꼴('June').includes('June'));
  자가('⭐ 낱말 수는 숫자로도 받는다', 낱말꼴('Five').includes('5'));
  자가('큰 글자를 가리지 않는다', 낱말꼴('FIVE').includes('5'));
  자가('⛔ 낱말꼴도 빈 것은 빈 배열', 낱말꼴('  ').length === 0);
  자가('⛔ 수가 있는 대표값은 낱말꼴이 아니다', 맨수('2.2×') === '2.2');
  자가('pages 를 읽는다',
    걸린지면('a: 1\npages:\n  - "/x"\n  - "/y"\nb: 2\n').join() === '/x,/y');
  자가('pages 가 비면 빈 배열', 걸린지면('a: 1\nb: 2\n').length === 0);
  /* ⚠ 저장소에 CRLF 파일과 LF 파일이 섞여 있다. 이 한 줄이 없어 딱 한 편을 놓쳤다 */
  자가('줄 끝이 CRLF 여도 읽는다',
    걸린지면('a: 1\r\npages:\r\n  - "/x"\r\nb: 2\r\n').join() === '/x');
  자가('면제에 까닭이 다 있다',
    Object.values(면제).every((v) => typeof v === 'string' && v.length > 20));
  console.log(`표 약속 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(40)} ${값}`); };

  /* ── ① 아무 지면도 안 읽는 자료 파일 ── */
  const 소스 = 지면소스();
  const 자료들 = fs.readdirSync(자료칸).filter((x) => /^wikitip-.*\.json$/.test(x));
  const 안보임 = 자료들.filter((f) => !소스.includes(f.replace('.json', '')) && !면제[f]);
  본다('세어 놓고 아무 지면도 안 읽는 자료', 안보임.length === 0,
    안보임.length ? `🔴 ${안보임.length}개 — ${안보임.join(' · ')}` : `자료 ${자료들.length}개 다 지면에 나온다`);

  /* ── ② 기사의 대표 수가 걸린 지면에 실제로 있나 ── */
  /*
   * 🔴 먼저 **빌드가 있나**를 본다. 없으면 「약속이 비었다」가 아니라 「못 쟀다」다.
   *   처음 판은 dist 가 비었을 때 46편 전부를 「표가 없다」로 불렀다. 여섯 자리가 같은 dist 를
   *   쓰므로 남의 빌드 중에 재면 늘 그렇게 된다. **없는 것을 틀린 것으로 부르지 않는다.**
   */
  const 빌드칸 = 'dist/wikitip';
  const 빌드있나 = fs.existsSync(빌드칸)
    && fs.readdirSync(빌드칸).filter((x) => x.endsWith('.html')).length > 5;
  if (!빌드있나) {
    console.log('⬜ 빌드가 없어 ②를 **못 쟀다** — node scripts/build-once.mjs 뒤에 다시 부른다');
    console.log('   (여섯 자리가 같은 dist 를 쓴다. 남의 빌드 중일 수 있다)');
    process.exit(1);
  }

  const 카드 = JSON.parse(fs.readFileSync(`${자료칸}/wikitip-og-cards.json`, 'utf8')).chosen;
  const { 제안 } = await import('./make-og-articles.mjs');
  const 빈약속 = []; const 못잼 = [];
  let 본기사 = 0;
  for (const f of fs.readdirSync(기사칸).filter((x) => x.endsWith('.md'))) {
    const slug = f.replace(/\.md$/, '');
    if (면제[slug]) continue;
    const s = fs.readFileSync(`${기사칸}/${f}`, 'utf8');
    const dek = (s.match(/^dek: "(.*)"$/m) || [])[1] || '';
    const fig = (카드[slug] && 카드[slug].figure) || (제안(dek) || {}).figure;
    const 지면 = 걸린지면(s);
    본기사++;
    if (!fig) { 빈약속.push(`${slug} (대표 수를 못 뽑았다)`); continue; }
    if (!지면.length) { 빈약속.push(`${slug} [${fig}] → 건 지면이 없다`); continue; }
    const 수 = 맨수(fig);
    /* 지면 파일이 dist 에 없는 것과, 있는데 수가 없는 것은 **다른 말**이다 */
    const 있는지면 = 지면.filter((p) => fs.existsSync(`dist/wikitip${p}.html`));
    if (!있는지면.length) { 못잼.push(`${slug} → ${지면.join(',')}`); continue; }
    /* ⭐ 수가 있으면 수로, 없으면 낱말로 본다. 자가 볼 것이 아예 없는 상태를 만들지 않는다 */
    const 꼴들 = 수 ? 받을꼴(수) : 낱말꼴(fig);
    if (!꼴들.length) { 못잼.push(`${slug} → 대표값 «${fig}» 에서 볼 것을 못 만들었다`); continue; }
    const 보임 = 있는지면.some((p) => {
      const t = fs.readFileSync(`dist/wikitip${p}.html`, 'utf8')
        .replace(/<[^>]+>/g, ' ').replace(/,/g, '');
      return 꼴들.some((v) => t.includes(v));
    });
    if (!보임) 빈약속.push(`${slug} [${fig}] → ${있는지면.join(',')}`);
  }
  본다('대표 수가 걸린 지면에 있나', 빈약속.length === 0,
    빈약속.length ? `🔴 ${빈약속.length}편 — ${빈약속.join(' · ')}` : `기사 ${본기사}편 다 표가 뒤에 있다`);
  if (못잼.length) console.log(`  ⬜ 걸린 지면이 dist 에 없어 못 잰 기사 ${못잼.length}편 — ${못잼.join(' · ')}`);

  /*
   * ── ③ 면제에 까닭이 다 있나 ──
   * ⛔ 처음엔 「면제가 셋 이하」로 막아 놨다. **버렸다.** 오늘 넷째가 정직한 면제였는데
   *    그 문턱 때문에 「면제 대신 억지 지면을 만들까」를 잠깐 생각했다.
   *    수를 막는 것은 정직을 막는 것이다. 막을 것은 **까닭 없는 면제**뿐이다.
   */
  const 까닭없음 = Object.entries(면제).filter(([, v]) => !v || v.length < 20).map(([k]) => k);
  본다('면제마다 까닭이 있나', 까닭없음.length === 0,
    까닭없음.length ? `🔴 ${까닭없음.join(' · ')}` : `${Object.keys(면제).length}개 다 까닭이 적혀 있다`);

  console.log(`\n지면 ${fs.readdirSync(지면칸).filter((x) => x.endsWith('.astro')).length}장 · 자료 ${자료들.length}개 · 기사 ${본기사}편`);
  console.log(틀림 ? `⛔ 약속이 빈 것 ${틀림}갈래` : '✅ 표 약속 — 카드의 「every figure has a table behind it」이 참말이다');
  process.exit(틀림 ? 1 : 0);
}
