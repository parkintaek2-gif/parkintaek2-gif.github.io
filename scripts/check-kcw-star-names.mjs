#!/usr/bin/env node
/**
 * check-kcw-star-names.mjs — **나간 제목에 스타 이름이 실제로 들었나.**
 *
 * ── 🔴 왜 만들었나 (2026-08-21) ────────────────────────────────
 * 사장님: 「스타 이름을 **항상** 제목과 본문에 놓아 검색 유입되도록 하라」(8/20)
 *         「스스로 발전해야 한다」(8/21)
 *
 * 나는 그 지시를 받은 뒤 새로 내는 것에만 이름을 넣었다. 그리고
 * **이미 나간 것이 몇 장이나 그런지는 한 번도 세어 보지 않았다.**
 * ⛔ 「검색 유입은 1번 몫이라 못 잰다」고 적어 두고, 내 손 안에 있는 이것조차 안 쟀다.
 *   우리 정정 대장에 그 이름이 이미 있다 — `limit-never-tested`.
 *
 * ⭐ 그래서 지시를 **자**로 바꾼다. 이름 목록은 지어내지 않고 **우리 자료에서** 온다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **이름을 손으로 안 적는다.** `sea-actors`·`sea-musicians`·`korean-people` 에서 읽는다.
 * ⛔ **짧은 이름을 안 쓴다.** 「V」·「IU」·「Rain」 같은 두세 글자는 딴 낱말에 걸린다 —
 *    낱말 단위로 맞추고, 그래도 흔한 영어 낱말이면 뺀다. 겹치면 **거짓 초록**이 된다.
 * ⛔ **막지 않는다.** 세기만 한다. 옛 제목을 지금 와서 다 바꾸는 것은 사람이 정할 일이다.
 * ⛔ 「없다」를 잰 것으로만 말한다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-star-names.mjs
 *   node scripts/check-kcw-star-names.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 기사방 = path.join(뿌리, 'content', 'kculturewire');
export const 지면방 = path.join(뿌리, 'src', 'pages', 'wikitip');

/**
 * ⛔ 이 낱말들은 스타 이름이면서 흔한 영어 낱말이라 **거짓으로 걸린다.**
 *   「Rain」·「V」·「Key」 가 제목에 있다고 그 스타를 말한 것이 아니다.
 */
export const 위험한이름 = new Set(['V', 'IU', 'Rain', 'Key', 'Sun', 'Moon', 'Sky', 'Ten',
  'One', 'Dawn', 'Chen', 'Mark', 'Max', 'Nana', 'Bang', 'Winter', 'Summer', 'Xiumin', 'D.O.',
  /*
   * 🔴 2026-08-21 — 처음 재니 「9.5%」가 나왔는데 그 안에 **거짓 초록**이 섞여 있었다.
   *   제 자가 「Seven」·「June」·「Win」·「Since」를 스타 이름으로 잡았다. 전부 실재하는
   *   가수 이름이면서 흔한 영어 낱말이라, 제목에 그 낱말이 있다고 그 가수를 말한 것이 아니다.
   *   ⭐ 짐작으로 넣지 않았다 — 제목에 실제로 걸린 한 낱말 이름을 뽑아 보고 넣었다.
   * ⚠ 「Jay」는 「Jay Park」 안에서 또 걸려 한 제목의 이름 수를 부풀렸다. 긴 이름이 이긴다.
   */
  'Seven', 'June', 'Win', 'Since', 'Jay', 'One Day', 'Solar', 'Bada', 'Boa', 'Crush']);

/** 이름 하나가 제목에 낱말 단위로 들었나. ⛔ 조각으로 안 맞춘다 */
export function 들었나(제목, 이름) {
  if (!제목 || !이름 || 이름.length < 3) return false;
  /**
   * ⛔ 정규식을 안 쓴다. 이름에 마침표가 든 것이 있고(D.O. · T.O.P), 그것을 탈출시키려다
   *   따옴표 두 겹을 지나며 역슬래시가 먹혔다. 낱말 경계를 **직접** 본다 — 짧고 안 깨진다.
   */
  const 낱말글자 = (c) => c !== undefined && /[A-Za-z0-9-]/.test(c);
  const 큰제목 = 제목.toLowerCase();
  const 큰이름 = 이름.toLowerCase();
  for (let i = 큰제목.indexOf(큰이름); i !== -1; i = 큰제목.indexOf(큰이름, i + 1)) {
    if (!낱말글자(큰제목[i - 1]) && !낱말글자(큰제목[i + 큰이름.length])) return true;
  }
  return false;
}

/** ⛔ 짧거나 흔한 이름은 목록에서 뺀다 — 뺀 수를 밝힌다 */
export function 쓸이름(이름들) {
  const 쓸것 = []; const 뺀것 = [];
  for (const n of new Set(이름들)) {
    if (!n || n.length < 3 || 위험한이름.has(n)) 뺀것.push(n);
    else 쓸것.push(n);
  }
  return { 쓸것: 쓸것.sort((a, b) => b.length - a.length), 뺀것 };
}

/** 제목에서 걸린 이름 전부 */
export function 걸린이름(제목, 이름들) {
  return 이름들.filter((n) => 들었나(제목, n));
}

/** 파일에서 제목 한 줄을 꺼낸다 — 기사는 앞말 title, 지면은 const TITLE */
export function 제목뽑기(글, 기사인가) {
  if (기사인가) {
    const m = /^title:\s*["'](.+?)["']\s*$/m.exec(글);
    return m ? m[1] : null;
  }
  const m = /const TITLE\s*=\s*([\s\S]*?);\n/.exec(글);
  if (!m) return null;
  /* 여러 줄 이어붙인 제목도 한 줄로 모은다. 템플릿 자리는 ○ 로 둔다 — 이름이 아니다 */
  return m[1].replace(/\$\{[^}]*\}/g, '○').match(/['"`]([^'"`]*)['"`]/g)
    ?.map((s) => s.slice(1, -1)).join('') ?? null;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };
  재본다('이름이 들면 잡는다', 들었나('BTS tops three Wikipedias', 'BTS'), true);
  재본다('하이픈 이름도 잡는다', 들었나('Go Youn-jung leads', 'Go Youn-jung'), true);
  /* 🔴 조각으로 맞추면 거짓 초록이 된다 */
  재본다('⛔⛔ 조각으로 안 맞춘다', 들었나('Jungkookie fan site', 'Jungkook'), false);
  재본다('⛔ 두 글자 이하는 안 본다', 들었나('The V shape', 'V'), false);
  재본다('대소문자를 안 가린다', 들었나('bae suzy', 'Bae Suzy'), true);

  const r = 쓸이름(['BTS', 'V', 'Rain', 'Bae Suzy', '']);
  재본다('⛔ 짧고 흔한 이름을 뺀다', r.쓸것.sort(), ['BTS', 'Bae Suzy'].sort());
  재본다('⛔ 뺀 것을 숨기지 않는다', r.뺀것.length, 3);

  재본다('기사 제목을 꺼낸다', 제목뽑기('---\ntitle: "Hello there"\ndek: "x"\n---\n', true), 'Hello there');
  재본다('지면 제목을 이어 붙인다',
    제목뽑기("const TITLE = 'IU is a Rooster, '\n  + 'Bae Suzy a Dog';\n", false),
    'IU is a Rooster, Bae Suzy a Dog');
  /* ⛔ 템플릿 자리를 이름으로 세면 안 된다 */
  재본다('⛔ 템플릿 자리는 이름이 아니다',
    제목뽑기('const TITLE = `${n} stars`;\n', false), (s) => !/\$/.test(s));
  재본다('⛔ 제목이 없으면 null', 제목뽑기('nothing here', true), null);

  console.log(`제목에 이름이 들었나 보는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  /* ⛔ 이름은 우리 자료에서 온다 — 손으로 안 적는다 */
  const 날것 = [];
  for (const p of ['archive/raw/wikipedia/sea-actors.json', 'archive/raw/wikipedia/sea-musicians.json']) {
    const f = path.join(뿌리, p);
    if (!fs.existsSync(f)) continue;
    for (const x of JSON.parse(fs.readFileSync(f, 'utf8')).people ?? []) 날것.push(x.name);
  }
  const kp = path.join(뿌리, 'archive/raw/wikidata/korean-people.json');
  if (fs.existsSync(kp)) for (const x of JSON.parse(fs.readFileSync(kp, 'utf8')).사람 ?? []) 날것.push(x.name);
  const { 쓸것: 이름들, 뺀것 } = 쓸이름(날것);

  const 줄 = [];
  for (const [방, 기사인가] of [[기사방, true], [지면방, false]]) {
    if (!fs.existsSync(방)) continue;
    for (const f of fs.readdirSync(방).filter((x) => x.endsWith(기사인가 ? '.md' : '.astro'))) {
      const 글 = fs.readFileSync(path.join(방, f), 'utf8');
      const 제목 = 제목뽑기(글, 기사인가);
      if (!제목) continue;
      줄.push({ 갈래: 기사인가 ? '기사' : '지면', 파일: f, 제목, 이름: 걸린이름(제목, 이름들) });
    }
  }

  const 기사 = 줄.filter((r) => r.갈래 === '기사');
  const 지면 = 줄.filter((r) => r.갈래 === '지면');
  const 몫 = (a) => (a.length ? `${a.filter((r) => r.이름.length).length}/${a.length} `
    + `(${((100 * a.filter((r) => r.이름.length).length) / a.length).toFixed(1)}%)` : '0/0');

  console.log(`이름 목록 ${이름들.length}개 (짧거나 흔해서 뺀 것 ${뺀것.length}개)`);
  console.log(`\n제목에 스타 이름이 든 것`);
  console.log(`   기사  ${몫(기사)}`);
  console.log(`   지면  ${몫(지면)}`);
  console.log(`   합계  ${몫(줄)}`);

  console.log(`\n⛔ 이름이 없는 제목 — 최근 것부터 (검색어가 안 걸리는 자리다)`);
  for (const r of 줄.filter((x) => !x.이름.length).slice(-16)) {
    console.log(`   ${r.갈래} ${r.파일.padEnd(34)} ${r.제목.slice(0, 66)}`);
  }
  console.log(`\n⭐ 이름이 든 제목 — 몇 개나 들었나`);
  for (const r of 줄.filter((x) => x.이름.length).sort((a, b) => b.이름.length - a.이름.length).slice(0, 8)) {
    console.log(`   ${String(r.이름.length).padStart(2)}개  ${r.파일.padEnd(34)} ${r.이름.slice(0, 5).join(' · ')}`);
  }
  console.log('\n⚠ 이 자는 세기만 한다. 옛 제목을 바꿀지는 사람이 자리마다 본다.');
}
