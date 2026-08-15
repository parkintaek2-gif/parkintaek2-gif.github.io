/**
 * **기사 본문의 「N of M」이 짝 자료에 실제로 있는 수인가.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 8/15 에 같은 병으로 세 번 물렸다.
 * ```
 *   92편  작품을 35 → 59 로 늘리자 기사에 박힌 수가 거짓이 됐다 — 하루에 두 번 정정
 *   OG    「12 of 16」이 자료가 19/26 일 때까지 살아 있었다
 *   지면  「Twenty-three months」가 글자로 굳어, 창이 24달로 자라자 거짓이 됐다
 * ```
 * ⭐ 공통점 — **손으로 박은 수는 자료가 자라도 안 따라온다.**
 *   기사는 발행 시점의 글이니 굳는 것이 당연하다. 문제는 **굳은 줄 모르는 것**이다.
 *
 * ── 어떻게 ─────────────────────────────────────────────────────
 * 기사 앞말의 `pages:` 로 짝 지면(.astro)을 찾고, 그 지면이 import 하는 자료를 연다.
 * ⭐ **지면의 import 가 정본이다.** 이름 규칙으로 짐작하지 않는다 —
 *   `/wave-and-floor` 의 자료는 `wikitip-wave-floor.json` 이다. 규칙이 안 맞는다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **빨강으로 세우지 않는다.** 기사는 발행 시점의 글이고, 어긋난 것이 늘 흠은 아니다.
 *    ⚠ 사람이 열어 보고 「이건 정정할 것인가, 그때의 사실인가」를 묻는다.
 * ⛔ **분자와 분모를 따로 본다.** 분모(표본 크기)가 어긋난 것이 훨씬 위험하다 —
 *    자료가 자란 표다.
 * ⛔ **정정이 이미 달린 기사는 세지 않는다.** 그건 이미 본 자리다.
 * ⛔ 남의 기사(100y · seoulmarkets)는 안 본다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-article-numbers.mjs
 *   node scripts/check-kcw-article-numbers.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 글방 = path.join(뿌리, 'content', 'kculturewire');
export const 지면방 = path.join(뿌리, 'src', 'pages', 'wikitip');
export const 자료방 = path.join(뿌리, 'src', 'data');

/** 앞말에서 짝 지면 길을 뽑는다 */
export function 짝지면(글) {
  const m = 글.match(/^pages:\n((?:\s+-\s+.*\n)+)/m);
  if (!m) return [];
  return [...m[1].matchAll(/-\s+"?([^"\n]+?)"?\s*$/gm)].map((x) => x[1].trim());
}

/**
 * ⭐ 지면이 **실제로 import 하는** 자료 이름. 이름 규칙으로 짐작하지 않는다.
 * ⚠ `/wave-and-floor` 의 자료는 `wikitip-wave-floor.json` 이다 — 규칙이 안 맞는다.
 */
export function 지면이쓰는자료(지면글) {
  return [...지면글.matchAll(/from\s+'\.\.\/\.\.\/data\/([\w-]+)\.json'/g)].map((m) => m[1]);
}

/** 자료 안의 모든 수를 모은다 */
export function 수모으기(o, 쌓 = new Set()) {
  if (typeof o === 'number') 쌓.add(o);
  else if (o && typeof o === 'object') for (const v of Object.values(o)) 수모으기(v, 쌓);
  return 쌓;
}

/**
 * ⭐ 본문에서 「N of M」 꼴을 뽑는다.
 * ⛔ 앞말은 보지 않는다 — dek 과 title 은 본문이 아니다… 가 아니라, **본다.**
 *   ⚠ 지면에 나가는 것은 dek 도 마찬가지다. 8/15 의 OG 카드가 그 자리였다.
 */
export function 몫뽑기(글) {
  return [...글.matchAll(/\b(\d[\d,]*)\s+of\s+(?:the\s+|our\s+)?(\d[\d,]*)\b/g)]
    .map((m) => ({ 통째: m[0], 분자: Number(m[1].replace(/,/g, '')), 분모: Number(m[2].replace(/,/g, '')) }));
}

/** ⛔ 정정이 달린 기사는 이미 본 자리다 */
export function 정정달렸나(글) {
  return /^corrections:/m.test(글) || /\ncorrection:/m.test(글);
}

/**
 * ⭐⭐ **기사가 자료보다 얼마나 낡았나.**
 *
 * 🔴 8/15 — 이 자를 처음 돌려 「655 of 1,355 — 48.3%」를 잡았다. 자료는 `1,329명 · 49.5%`
 *   였다. 어긋난다. 그런데 열어 보니 그 기사는 **8/7 발행이고 `dataAsOf` 를 명시**했다.
 *   ⛔ **그때의 사실이지 오류가 아니다.** 기사는 발행 시점의 글이다.
 *
 * ⭐ 그래서 이 자는 「정정하라」가 아니라 **「얼마나 낡았나」**를 잰다. 며칠 낡았는지를
 *   같이 내면, 사람이 「이만큼 벌어졌으면 다시 쓸 때다」를 스스로 정할 수 있다.
 * ⚠ `dataAsOf` 가 없는 기사는 낡음을 잴 수 없다 — 그건 **더** 위험하다. 그렇게 적는다.
 */
export function 얼마나낡았나(글, 자료잰날) {
  const m = 글.match(/^dataAsOf:\s*"?(\d{4}-\d{2}-\d{2})/m);
  if (!m) return { known: false, why: 'the article does not say when its data was read' };
  if (!자료잰날) return { known: false, articleAsOf: m[1], why: 'the data file does not say when it was built' };
  const 하루 = 24 * 60 * 60 * 1000;
  return {
    known: true,
    articleAsOf: m[1],
    dataBuilt: 자료잰날,
    daysBehind: Math.round((Date.parse(자료잰날) - Date.parse(m[1])) / 하루),
  };
}

/** 자료가 언제 지어졌는지. ⚠ 자료마다 칸 이름이 다르다 */
export function 자료잰날(자료) {
  for (const k of ['generatedAt', 'generated', 'builtAt', 'asOf']) {
    const v = 자료?.[k];
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  }
  return null;
}

/**
 * ⭐ 어긋난 것만 남긴다.
 *
 * 🔴🔴 처음엔 **짝 지면의 자료만** 봤고, 그래서 기사 13편에 빨강을 냈다.
 *   열어 보니 그 수들은 **다 있었다** — 다만 기사가 낀 지면이 아닌 딴 자료에 있었다.
 *   기사 하나가 여러 자료를 가로질러 인용한다. 내가 그물을 좁게 친 것이다.
 *   ⛔ 거짓 빨강은 그냥 흠이 아니다. **다음 사람은 안 열고 믿는다.**
 *
 * ⭐ 그래서 두 단계로 가른다 —
 * ```
 *   🔴 어느 자료에도 없다        진짜 위험. 자라난 표에 굳은 수가 남았거나, 지어낸 수다
 *   ⚠ 짝 자료엔 없고 딴 데 있다   알리되 가벼이. 기사가 자료를 가로질러 인용한 것일 수 있다
 * ```
 * @param 짝수들 짝 지면이 쓰는 자료의 수들
 * @param 온수들 내 자료 **전부**의 수들
 */
export function 어긋난것(몫들, 짝수들, 온수들 = 짝수들) {
  return 몫들
    .map((q) => {
      /**
       * ⭐ **어느 수가 없는지 낱낱이 남긴다.**
       * 🔴 8/15 — 처음엔 「분자든 분모든 하나라도 없으면 무겁다」로 두고, 찍을 때는
       *   분모를 찍었다. 그래서 **있는 수(1355)를 「어디에도 없다」로 고발했다.**
       *   셈은 맞고 표시가 틀렸다 — 그날 하루 내내 겪은 바로 그 병이다.
       */
      const 없는것 = [];
      if (!짝수들.has(q.분자)) 없는것.push({ 값: q.분자, 자리: '분자', 아예없음: !온수들.has(q.분자) });
      if (!짝수들.has(q.분모)) 없는것.push({ 값: q.분모, 자리: '분모', 아예없음: !온수들.has(q.분모) });
      return { ...q, 없는것, 분자없음: !짝수들.has(q.분자), 분모없음: !짝수들.has(q.분모) };
    })
    .filter((q) => q.없는것.length)
    /* ⛔ 「무겁다」는 **없는 그 수가 어디에도 없을 때**다 */
    .map((q) => ({ ...q, 무거움: q.없는것.some((x) => x.아예없음) }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  참('짝 지면을 뽑는다',
    짝지면('pages:\n  - "/one-out"\n  - "/half-life"\nsources:\n').join() === '/one-out,/half-life');
  참('따옴표가 없어도 뽑는다', 짝지면('pages:\n  - /one-out\n').join() === '/one-out');
  참('⛔ 없으면 빈 것', 짝지면('title: "x"\n').length === 0);

  /* 🔴 이름 규칙으로 짐작하면 틀린다 — `/wave-and-floor` → `wikitip-wave-floor.json` */
  참('⭐ 지면의 import 가 정본이다',
    지면이쓰는자료("import d from '../../data/wikitip-wave-floor.json';")[0] === 'wikitip-wave-floor');
  참('여러 자료를 쓰면 다 뽑는다',
    지면이쓰는자료("from '../../data/wikitip-a.json'\nfrom '../../data/wikitip-b.json'").length === 2);
  참('⛔ 자료가 아닌 import 는 안 뽑는다',
    지면이쓰는자료("import X from '../../layouts/WikiTip.astro';").length === 0);

  const 수 = 수모으기({ a: 3, b: { c: 26, d: [19, 12] }, e: 'x' });
  참('깊은 곳의 수도 모은다', 수.has(19) && 수.has(26) && 수.has(3));
  참('⛔ 글자는 안 모은다', !수.has('x'));

  참('「N of M」을 뽑는다', 몫뽑기('we measured 19 of 26 titles').length === 1);
  참('분자·분모를 가른다',
    몫뽑기('19 of 26')[0].분자 === 19 && 몫뽑기('19 of 26')[0].분모 === 26);
  참('the 가 껴도 뽑는다', 몫뽑기('9 of the 16 titles')[0].분모 === 16);
  참('our 가 껴도 뽑는다', 몫뽑기('12 of our 59 titles')[0].분모 === 59);
  참('쉼표가 든 수도 뽑는다', 몫뽑기('1,200 of 3,400')[0].분자 === 1200);
  참('⛔ 없으면 빈 것', 몫뽑기('nothing here').length === 0);

  /* 🔴 8/15 — OG 카드가 「12 of 16」인데 자료는 19/26 이었다 */
  const 어긋 = 어긋난것(몫뽑기('12 of 16 titles'), 수모으기({ measured: 19, outOf: 26 }));
  참('⛔⛔ 자료에 없는 수를 잡는다', 어긋.length === 1);
  참('분자·분모 둘 다 없다고 적는다', 어긋[0].분자없음 && 어긋[0].분모없음);
  참('⭐ 어디에도 없으면 무겁게 본다', 어긋[0].무거움 === true);
  참('⭐ 자료와 맞으면 안 잡는다',
    어긋난것(몫뽑기('19 of 26'), 수모으기({ measured: 19, outOf: 26 })).length === 0);

  /**
   * 🔴🔴 8/15 — 처음엔 짝 자료만 보고 기사 13편에 빨강을 냈다. 열어 보니 그 수들은
   *   **다 있었다** — 딴 자료에 있었다. ⛔ 거짓 빨강은 다음 사람이 안 열고 믿게 만든다.
   */
  const 딴데있음 = 어긋난것(몫뽑기('317 of 1005'),
    수모으기({ measured: 19 }), 수모으기({ a: 317, b: 1005 }));
  참('⭐⭐ 딴 자료에 있으면 무겁게 안 본다', 딴데있음.length === 1 && 딴데있음[0].무거움 === false);
  참('⛔ 그래도 알리기는 한다', 딴데있음[0].분모없음 === true);
  참('⭐ 어느 자료에도 없으면 무겁다',
    어긋난것(몫뽑기('7 of 99'), 수모으기({ a: 1 }), 수모으기({ a: 1 }))[0].무거움 === true);
  /* ⚠ 온수들을 안 주면 짝수들로 친다 — 예전 뜻 그대로 */
  참('⛔ 온수들이 없으면 짝수들로 친다',
    어긋난것(몫뽑기('7 of 99'), 수모으기({ a: 1 }))[0].무거움 === true);

  /**
   * 🔴🔴 8/15 — 「655 of 1,355」에서 **없는 것은 분자 655** 인데 표시가 분모 1355 를
   *   찍어, **있는 수를 「어디에도 없다」로 고발했다.** 셈은 맞고 표시가 틀렸다.
   */
  const 분자만없음 = 어긋난것(몫뽑기('655 of 1355'),
    수모으기({ n: 1355 }), 수모으기({ n: 1355 }));
  참('⛔⛔ 없는 수를 정확히 짚는다',
    분자만없음[0].없는것.length === 1 && 분자만없음[0].없는것[0].값 === 655);
  참('⛔ 있는 수를 고발하지 않는다',
    !분자만없음[0].없는것.some((x) => x.값 === 1355));
  참('⭐ 자리도 적는다', 분자만없음[0].없는것[0].자리 === '분자');
  const 둘다없음 = 어긋난것(몫뽑기('12 of 16'), 수모으기({ n: 1 }), 수모으기({ n: 1 }));
  참('둘 다 없으면 둘 다 적는다', 둘다없음[0].없는것.length === 2);

  참('정정 달린 기사를 알아본다', 정정달렸나('corrections:\n  - date: 2026-08-15\n'));
  참('⛔ 안 달린 것은 아니다', 정정달렸나('title: "x"\n') === false);

  /* 🔴 8/15 — 어긋난 줄 알았던 것이 「그때의 사실」이었다 */
  const 낡음 = 얼마나낡았나('dataAsOf: 2026-08-07T00:00:00+09:00\n', '2026-08-15');
  참('⭐⭐ 며칠 낡았는지 잰다', 낡음.known && 낡음.daysBehind === 8);
  참('기사가 읽은 날을 남긴다', 낡음.articleAsOf === '2026-08-07');
  참('⛔ dataAsOf 가 없으면 못 잰다고 말한다',
    얼마나낡았나('title: "x"\n', '2026-08-15').known === false);
  참('⚠ 못 재는 까닭을 적는다',
    /does not say when its data was read/.test(얼마나낡았나('title: x\n', '2026-08-15').why));
  참('⛔ 자료가 날짜를 안 적어도 못 잰다',
    얼마나낡았나('dataAsOf: 2026-08-07\n', null).known === false);
  참('⭐ 같은 날이면 0', 얼마나낡았나('dataAsOf: 2026-08-15\n', '2026-08-15').daysBehind === 0);

  참('자료가 잰 날을 찾는다', 자료잰날({ generatedAt: '2026-08-15' }) === '2026-08-15');
  참('다른 이름도 찾는다', 자료잰날({ generated: '2026-08-15T03:00:00Z' }) === '2026-08-15');
  참('⛔ 없으면 null', 자료잰날({ n: 3 }) === null && 자료잰날(null) === null);

  참('⭐ 글방이 있다', fs.existsSync(글방) && fs.existsSync(지면방));

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 기사들 = fs.readdirSync(글방).filter((f) => f.endsWith('.md'));
  let 봄 = 0; let 건너뜀 = 0; const 표 = [];

  /* ⭐ 내 자료 **전부**의 수 — 「어느 자료에도 없다」를 가리는 데 쓴다 */
  const 온수들 = new Set();
  for (const f of fs.readdirSync(자료방).filter((x) => x.startsWith('wikitip-') && x.endsWith('.json'))) {
    try { 수모으기(JSON.parse(fs.readFileSync(path.join(자료방, f), 'utf8')), 온수들); } catch { /* 건너뛴다 */ }
  }

  for (const f of 기사들) {
    const 글 = fs.readFileSync(path.join(글방, f), 'utf8');
    if (정정달렸나(글)) { 건너뜀 += 1; continue; }

    /* 짝 지면들이 쓰는 자료를 모두 모은다 — 기사가 여러 지면을 낀다 */
    const 수들 = new Set();
    let 자료찾음 = false; let 늦은날 = null;
    for (const 길 of 짝지면(글)) {
      const 지면길 = path.join(지면방, `${길.replace(/^\//, '').replace(/\/$/, '')}.astro`);
      if (!fs.existsSync(지면길)) continue;
      for (const 이름 of 지면이쓰는자료(fs.readFileSync(지면길, 'utf8'))) {
        const 자료길 = path.join(자료방, `${이름}.json`);
        if (!fs.existsSync(자료길)) continue;
        자료찾음 = true;
        const 자료 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
        수모으기(자료, 수들);
        const 날 = 자료잰날(자료);
        if (날 && (!늦은날 || 날 > 늦은날)) 늦은날 = 날;
      }
    }
    if (!자료찾음) continue;
    봄 += 1;

    const 어긋 = 어긋난것(몫뽑기(글), 수들, 온수들);
    if (어긋.length) 표.push({ f, 어긋, 낡음: 얼마나낡았나(글, 늦은날) });
  }

  console.log(`기사 ${기사들.length}편 중 짝 자료를 찾은 ${봄}편을 본다`);
  console.log(`⏭ 정정이 이미 달린 ${건너뜀}편은 건너뛴다 — 그건 이미 본 자리다\n`);

  const 무거운것 = 표.filter((x) => x.어긋.some((q) => q.무거움));
  /* ⛔ 무거운 것만 낱낱이 보인다. 가벼운 것을 같이 늘어놓으면 무거운 것이 묻힌다 */
  for (const { f, 어긋, 낡음 } of 무거운것) {
    /* ⭐ 낡음을 먼저 말한다 — 「어긋났다」보다 「며칠 벌어졌다」가 참이다 */
    const 낡은말 = 낡음.known
      ? (낡음.daysBehind > 0 ? `기사 ${낡음.articleAsOf} · 자료가 ${낡음.daysBehind}일 앞섰다` : '기사와 자료가 같은 날')
      : `⚠ ${낡음.why}`;
    console.log(`🔴 ${f}   (${낡은말})`);
    for (const q of 어긋.filter((q2) => q2.무거움).slice(0, 4)) {
      /* ⛔ 없는 그 수를 그대로 찍는다. 짐작해서 찍으면 있는 수를 고발한다 */
      const 없음 = q.없는것.filter((x) => x.아예없음).map((x) => `${x.값}(${x.자리})`).join(', ');
      console.log(`      「${q.통째}」 — ${없음} 가 **내 자료 어디에도 없다**`);
    }
  }
  const 가벼운수 = 표.length - 무거운것.length;
  if (가벼운수) {
    console.log(`\n· 짝 자료엔 없지만 딴 자료엔 있는 기사 ${가벼운수}편 — 기사가 자료를 가로질러`);
    console.log('  인용한 것일 수 있다. 🔴 처음엔 이것들을 빨강으로 냈고, 열어 보니 전부 있었다.');
  }
  if (!무거운것.length) console.log('✅ 내 자료 어디에도 없는 수는 없다');

  const 날짜없음 = 표.filter((x) => !x.낡음.known);
  console.log(`\n무거운 기사 ${무거운것.length}편 · 가벼운 것 ${가벼운수}편.`);
  if (날짜없음.length) {
    console.log(`⚠ 그중 ${날짜없음.length}편은 **낡음을 잴 수 없다** — `
      + '`dataAsOf` 가 없거나 자료가 지은 날을 안 적었다. 그게 더 위험하다.');
  }
  console.log('⚠ 이 자는 세기만 한다. 열어 보고 물을 것 — **정정할 것인가, 그때의 사실인가.**');
  console.log('   ⭐ `dataAsOf` 를 적은 기사가 그때의 수를 말하는 것은 **오류가 아니다.**');
}
