/**
 * broadcast-visitors-dwell.mjs — **방문자수·체류시간을 전 유닛에 보내는 것을 한 줄로 만든다.**
 *
 * ── 왜 이 파일이 생겼나 ────────────────────────────────────────
 * 사장님 지시(2026-08-24):
 *   「방문자수. 체류시간 네가 모든 유닛에 **업무보고 1시간전에** 보내라. **2번통해서도 보내고**」
 *
 * 이것은 **하루 두 번 되풀이되는 일**이다(09:00 · 22:00). 그런데 나는 그때마다 자를 두 개
 * 따로 돌리고, 나온 것을 손으로 옮겨 적고, 손으로 표를 만들어 메모에 붙여 왔다.
 * ⛔ 되풀이되는 일을 손으로 하면 **빠뜨리는 날이 온다.** 사장님 말씀 —
 *   「매일 하는 것은 사장님 손을 쓰지 않는다. 반복을 없애는 쪽으로 스스로 고친다」.
 * 그래서 자를 두 개 돌리고 표를 짜고 메모에 붙이는 것까지 여기서 한다.
 *
 * ── ⛔ 이 자가 반드시 지키는 것 (다 겪고 박은 것이다) ──────────
 * ⛔ **못 잰 자리는 0 이 아니라 「못 쟀다」로 적는다.** 0 은 「아무도 안 왔다」는 뜻이고
 *   못 잼은 「모른다」는 뜻이다. 둘을 섞으면 받는 쪽이 없는 사실을 읽는다.
 * ⛔ **체류시간은 「구글이 붙어 있다고 본 시간」**이다. 탭을 숨기면 안 센다 —
 *   읽은 시간의 **아래쪽 어림**이다. 이 문장을 빼고 숫자만 보내지 않는다.
 * ⛔ **세션 수를 초와 «같이» 적는다.** 세션이 몇십 개인 자리의 평균은 흔들린다.
 *   숫자만 크게 적으면 받는 쪽이 그것을 확정된 값으로 읽는다.
 * ⛔ 평균을 평균내지 않는다. 합÷합으로 낸다.
 * ⛔ 자가 하나라도 실패하면 **그 자리만** 「못 쟀다」로 두고 나머지는 보낸다.
 *   첫 실패에서 멈추면 앞쪽 하나 때문에 뒤가 전부 침묵한다 — 그 흠을 이미 겪었다.
 *
 * ── 쓰기 ───────────────────────────────────────────────────────
 *   node scripts/broadcast-visitors-dwell.mjs --잰다            재서 화면에만 보여 준다
 *   node scripts/broadcast-visitors-dwell.mjs --잰다 --붙인다   메모에도 붙인다
 *   node scripts/broadcast-visitors-dwell.mjs --자가시험
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 어느 호스트가 어느 유닛인가. ⛔ 이것을 짐작하지 않는다 — GA4 속성 하나(549135289)가
 * 네 사이트를 다 담고 있어서 한 번 재면 여섯 자리 것이 같이 나온다. 그 갈라 붙이는 표다.
 * ⚠ `127.0.0.1`·`localhost` 는 우리가 만든 것이니 **누구 것도 아니다** — 아래에 안 넣는다.
 */
export const 자리표 = [
  { 유닛: '3번', 이름: '백년지도', 호스트: ['100yearmap.com', 'www.100yearmap.com'] },
  { 유닛: '1·4번', 이름: 'KLifeMap', 호스트: ['klifemap.ai', 'www.klifemap.ai'] },
  { 유닛: '5번', 이름: 'K Culture Wire', 호스트: ['kculturewire.com', 'www.kculturewire.com'] },
  { 유닛: '6번', 이름: 'SeoulMarkets', 호스트: ['seoulmarkets.com', 'www.seoulmarkets.com'] },
];

/** 우리가 만든 것이라 아무 유닛 것도 아닌 호스트 */
export const 우리것 = ['127.0.0.1', 'localhost', 'parkintaek2-gif.github.io'];

/**
 * 사장님이 말씀하신 것은 「업무보고 **1시간 전**」이다.
 * ⚠ 보고 시각이 바뀌면 이 시각도 따라 바뀐다 — 「보고 1시간 전」이 기준이고 이 수는 그 결과다.
 */
export const 보낼시각 = ['09:00', '22:00'];
export const 보고시각 = ['10:00', '23:00'];

/**
 * 자리마다 초를 낸다. **합÷합이다** — 평균을 평균내지 않는다.
 * ⛔ 세션이 0이면 0초가 아니라 **못 잼**(null)이다.
 */
export function 세션당초(붙은초합, 세션합) {
  if (!Number.isFinite(붙은초합) || !Number.isFinite(세션합)) return null;
  if (세션합 <= 0) return null;
  if (붙은초합 < 0) return null;
  return 붙은초합 / 세션합;
}

/**
 * 이 수를 **말해도 되는가**. 세션이 너무 적으면 평균이 흔들려서 확정된 값처럼 보내면 안 된다.
 * ⛔ 「말하지 말라」가 아니다 — 「흔들린다고 «같이» 적어라」다. 안 보내는 것이 아니다.
 */
export const 흔들리는세션 = 30;
export function 흔들리나(세션) {
  if (!Number.isFinite(세션)) return null;   // 못 잰 것은 흔들림도 모른다
  return 세션 < 흔들리는세션;
}

/** 숫자를 사람이 읽는 꼴로. ⛔ null 은 0 이 아니다 — 「못 쟀다」로 나온다 */
export function 수글(v, 꼬리 = '') {
  if (v === null || v === undefined || !Number.isFinite(v)) return '못 쟀다';
  return `${Math.round(v).toLocaleString('en-US')}${꼬리}`;
}

/** 호스트 이름을 유닛으로 옮긴다. 모르는 호스트는 **버리지 않고** 「모르는 자리」로 남긴다 */
export function 유닛찾기(호스트) {
  const h = String(호스트 ?? '').trim().toLowerCase();
  if (!h) return null;
  if (우리것.includes(h)) return '우리것';
  for (const r of 자리표) if (r.호스트.includes(h)) return r.유닛;
  return '모름';
}

/** 자 하나를 돌린다. ⛔ 실패해도 던지지 않는다 — 그 자리만 못 잰 것으로 둔다 */
export function 자돌리기(파일, 인자) {
  try {
    const out = execFileSync(process.execPath, [path.join(뿌리, 'scripts', 파일), ...인자],
      { cwd: 뿌리, encoding: 'utf8', maxBuffer: 1e8, timeout: 180000 });
    return { 됐나: true, 글: out };
  } catch (e) {
    return { 됐나: false, 글: String(e?.stdout ?? '') + String(e?.stderr ?? ''), 까닭: String(e?.message ?? '').slice(0, 200) };
  }
}

/**
 * `ga4-report.mjs` 화면에서 호스트별 줄을 뜯는다.
 * ⚠ 자기 화면을 정규식으로 뜯는 것은 깨지기 쉽다. 그래서 **한 줄도 못 뜯으면 「못 쟀다」**로
 *   내려놓는다 — 조용히 0을 내지 않는다. 그것이 이 함수가 지키는 유일한 약속이다.
 */
export function 호스트줄뜯기(글) {
  const 줄들 = String(글 ?? '').split(/\r?\n/);
  const 결과 = [];
  for (const l of 줄들) {
    const m = l.match(/^\s{2,}([A-Za-z0-9.:-]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d.]+)\s*$/);
    if (!m) continue;
    if (!m[1].includes('.') && m[1] !== 'localhost') continue;   // 표 머리글 같은 줄을 배제
    결과.push({
      호스트: m[1],
      순방문: Number(m[2].replace(/,/g, '')),
      세션: Number(m[3].replace(/,/g, '')),
      열림: Number(m[4].replace(/,/g, '')),
      하루평균: Number(m[5]),
    });
  }
  return 결과;
}

/** 유닛별로 합친다. ⛔ 합계를 「전체」로 쓰지 않는다 — GA4 는 차원을 붙이면 사람을 다시 센다 */
export function 유닛별로(줄들) {
  const 통 = new Map();
  for (const r of 줄들 ?? []) {
    const u = 유닛찾기(r.호스트);
    if (u === '우리것' || u === null) continue;
    const v = 통.get(u) ?? { 유닛: u, 순방문: 0, 세션: 0, 열림: 0, 호스트: [] };
    v.순방문 += r.순방문; v.세션 += r.세션; v.열림 += r.열림;
    v.호스트.push(r.호스트);
    통.set(u, v);
  }
  return [...통.values()].sort((a, b) => b.순방문 - a.순방문);
}

/**
 * 체류 자의 화면에서 «유닛마다 한 줄»만 뜯는다.
 * ⛔ 내 갈래별 표까지 보내지 않는다 — 받는 쪽이 쓸 것은 자기 유닛 줄이다.
 *   남의 유닛 사람이 내 `/article` 초를 봐도 쓸 데가 없고, 표가 길면 자기 줄을 못 찾는다.
 * ⚠ 「## 유닛마다」 아래 «유닛 이름으로 시작하는 줄»만 고른다. 자리표에 있는 이름으로만
 *   고르므로, 화면 꼴이 바뀌면 0줄이 나오고 부르는 쪽이 「못 쟀다」로 적는다 — 조용히 안 넘긴다.
 */
export function 체류줄뜯기(글) {
  const 줄들 = String(글 ?? '').split(/\r?\n/);
  const 유닛이름 = 자리표.map((r) => r.유닛);
  const 결과 = [];
  let 안에있나 = false;
  for (const l of 줄들) {
    const t = l.trim();
    if (/^##\s*유닛마다/.test(t)) { 안에있나 = true; 결과.push(t); continue; }
    if (!안에있나) continue;
    if (/^##/.test(t)) break;                       // 다음 칸이 시작되면 끝
    if (/^유닛\s/.test(t)) { 결과.push(t); continue; }  // 표 머리글은 남긴다
    if (유닛이름.some((u) => t.startsWith(u))) 결과.push(t);
  }
  /* 머리글만 있고 유닛 줄이 없으면 못 잰 것이다 — 머리글 하나를 「쟀다」로 세지 않는다 */
  const 유닛줄수 = 결과.filter((t) => 유닛이름.some((u) => t.startsWith(u))).length;
  return 유닛줄수 > 0 ? 결과 : [];
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('세션이 0이면 0초가 아니라 못 잼', 세션당초(100, 0) === null);
  검('합÷합으로 낸다', 세션당초(300, 6) === 50);
  검('음수 초는 못 잼', 세션당초(-1, 5) === null);
  검('세션이 못 잼이면 초도 못 잼', 세션당초(300, null) === null);

  검('세션이 적으면 흔들린다고 말한다', 흔들리나(12) === true);
  검('세션이 넉넉하면 안 흔들린다', 흔들리나(400) === false);
  검('못 잰 세션은 흔들림도 모른다', 흔들리나(null) === null);
  /* ⭐ 문턱 자체를 검사에 박지 않는다 — 문턱을 옮기면 이 검사가 같이 틀려야 뜻이 있다 */
  검('문턱 바로 아래는 흔들리고 바로 위는 안 흔들린다',
    흔들리나(흔들리는세션 - 1) === true && 흔들리나(흔들리는세션) === false);

  검('⛔ null 은 0 으로 안 적는다', 수글(null) === '못 쟀다');
  검('0 은 0 으로 적는다 — 못 잼과 다르다', 수글(0) === '0');
  검('큰 수에 쉼표를 넣는다', 수글(9249) === '9,249');
  검('꼬리를 붙인다', 수글(39, '초') === '39초');

  검('호스트를 유닛으로 옮긴다', 유닛찾기('www.kculturewire.com') === '5번');
  검('www 없는 것도 같은 유닛', 유닛찾기('kculturewire.com') === '5번');
  검('대문자로 와도 옮긴다', 유닛찾기('WWW.SeoulMarkets.com') === '6번');
  검('우리가 만든 것은 아무 유닛 것도 아니다', 유닛찾기('127.0.0.1') === '우리것');
  /* ⛔ 모르는 호스트를 조용히 버리지 않는다 — 버리면 합이 줄고 아무도 모른다 */
  검('모르는 호스트는 버리지 않고 「모름」이다', 유닛찾기('example.com') === '모름');
  검('빈 것은 null', 유닛찾기('') === null && 유닛찾기(null) === null);

  const 샘플 = 호스트줄뜯기([
    '   호스트                          순방문  세션  지면열림  하루평균',
    '   100yearmap.com                   333   348      446      11.9',
    '   kculturewire.com                  63    66       85       2.3',
    '   www.kculturewire.com              48    58       75       1.7',
    '   127.0.0.1                          7     8       27       0.3',
  ].join('\n'));
  검('호스트 줄을 뜯는다', 샘플.length === 4);
  검('머리글 줄은 안 뜯는다', !샘플.some((r) => r.호스트 === '호스트'));
  검('수를 숫자로 뜯는다', 샘플[0].순방문 === 333 && 샘플[0].세션 === 348);
  /* 🔴 이 자의 목숨줄 — 한 줄도 못 뜯으면 0장이 나오고, 그것을 「방문자 0」으로 읽으면 안 된다 */
  검('⭐ 아무것도 못 뜯으면 빈 배열이다 — 부르는 쪽이 「못 쟀다」로 읽어야 한다',
    호스트줄뜯기('아무 상관 없는 글').length === 0);
  검('빈 것을 넣어도 안 터진다', 호스트줄뜯기(null).length === 0);

  const 합 = 유닛별로(샘플);
  검('www 와 non-www 를 한 유닛으로 합친다',
    합.find((x) => x.유닛 === '5번')?.순방문 === 111);
  검('우리가 만든 것은 합에서 뺀다', !합.some((x) => x.유닛 === '우리것'));
  검('많은 자리가 먼저 온다', 합[0].유닛 === '3번');
  검('합친 호스트를 남긴다 — 어디서 나온 수인지 뒤에서 확인할 수 있게',
    합.find((x) => x.유닛 === '5번')?.호스트.length === 2);

  검('보낼 시각은 보고 한 시간 전이다', 보낼시각.length === 보고시각.length
    && 보낼시각.every((t, i) => Number(t.slice(0, 2)) + 1 === Number(보고시각[i].slice(0, 2))));

  const 체류화면 = [
    '## 유닛마다 — 세션당 머문 시간',
    '유닛                         세션       세션당      붙은세션       열림당',
    '3번 100yearmap             354     31.3초       20%     11.5초',
    '5번 K Culture Wire         124     39.8초       23%     14.2초',
    '## 내 지면 — 열린 지면 43장',
    '/article             19     33     27     21.4초',
  ].join('\n');
  const 뜯은것 = 체류줄뜯기(체류화면);
  검('유닛 줄을 뜯는다', 뜯은것.some((l) => l.startsWith('3번')) && 뜯은것.some((l) => l.startsWith('5번')));
  검('표 머리글을 남긴다', 뜯은것.some((l) => l.startsWith('유닛 ')));
  /* ⛔ 남의 유닛 사람에게 내 갈래별 표를 보내지 않는다 — 자기 줄을 못 찾게 된다 */
  검('⭐ 내 갈래별 표는 안 뜯는다', !뜯은것.some((l) => l.startsWith('/article')));
  검('다음 칸이 시작되면 멈춘다', !뜯은것.some((l) => l.includes('내 지면')));
  /* 🔴 목숨줄 — 꼴이 바뀌면 0줄이 나와야 하고, 부르는 쪽이 「못 쟀다」로 적는다 */
  검('⭐ 유닛 줄이 하나도 없으면 빈 배열이다 — 머리글만으로 「쟀다」가 되지 않는다',
    체류줄뜯기('## 유닛마다 — 세션당 머문 시간\n유닛   세션   세션당').length === 0);
  검('아무 상관 없는 글이면 빈 배열', 체류줄뜯기('그냥 글').length === 0);
  검('빈 것을 넣어도 안 터진다', 체류줄뜯기(null).length === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 ${실패.length}건 실패\n` + 실패.map((s) => `   · ${s}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ broadcast-visitors-dwell 자가시험 통과 (33)');
  process.exit(0);
}

if (!process.argv.includes('--잰다')) {
  console.error('⛔ --잰다 나 --자가시험 을 준다');
  process.exit(1);
}

/* ── 여기서부터 실제로 잰다 ────────────────────────────────── */
console.log('■ 방문자수·체류시간 — 전 유닛에 보낼 것을 한 번에 잰다');
console.log(`  보낼 시각은 업무보고 1시간 전(${보낼시각.join(' · ')})이다. 늦으면 늦었다고 적고 보낸다.\n`);

const 방문 = 자돌리기('ga4-report.mjs', []);
const 체류 = 자돌리기('measure-kcw-dwell.mjs', ['--잰다']);

const 호스트줄 = 방문.됐나 ? 호스트줄뜯기(방문.글) : [];
const 유닛줄 = 유닛별로(호스트줄);

console.log('## ① 방문자수 — 유닛마다 한 줄');
if (!방문.됐나) {
  console.log(`   ⛔ **못 쟀다** — ga4-report 가 실패했다: ${방문.까닭}`);
  console.log('   ⛔ 0 으로 적지 않는다. 못 잰 것은 못 잼이다.');
} else if (유닛줄.length === 0) {
  console.log('   ⛔ **못 쟀다** — 자는 돌았는데 호스트 줄을 한 줄도 못 뜯었다(화면 꼴이 바뀐 듯하다).');
  console.log('   ⛔ 「방문자 0」이 아니다. 자를 먼저 고쳐야 한다.');
} else {
  console.log('   유닛      사이트              순방문   세션   지면열림   하루평균');
  for (const u of 유닛줄) {
    const 이름 = 자리표.find((r) => r.유닛 === u.유닛)?.이름 ?? '(모르는 자리)';
    const 하루 = u.순방문 / 28;
    console.log(`   ${u.유닛.padEnd(8)} ${이름.padEnd(18)} ${String(u.순방문).padStart(6)}`
      + ` ${String(u.세션).padStart(6)} ${String(u.열림).padStart(9)}   ${하루.toFixed(1)}`);
  }
  console.log('   ⚠ 28일 창이다. GA4 는 광고차단·쿠키거부로 **덜 세는 쪽**이니 바닥값으로 읽는다 —');
  console.log('     「이보다 적을 수는 없다」가 우리가 말할 수 있는 전부다.');
  const 모름 = 호스트줄.filter((r) => 유닛찾기(r.호스트) === '모름');
  if (모름.length) console.log(`   ⚠ 어느 유닛인지 모르는 호스트 ${모름.length}개: ${모름.map((r) => r.호스트).join(', ')}`);
}

console.log('\n## ② 체류시간');
if (!체류.됐나) {
  console.log(`   ⛔ **못 쟀다** — measure-kcw-dwell 이 실패했다: ${체류.까닭}`);
} else {
  /* 자기 화면을 다시 뜯지 않는다 — 그 자가 이미 사람이 읽는 꼴로 낸다. 그대로 옮긴다 */
  const 알맹이 = 체류줄뜯기(체류.글);
  if (!알맹이.length) console.log('   ⛔ **못 쟀다** — 자는 돌았는데 읽을 줄이 없다.');
  else for (const l of 알맹이) console.log(`   ${l}`);
}

console.log('\n## ③ 이 수를 읽는 법 — ⛔ 이 세 줄을 빼고 숫자만 보내지 않는다');
console.log('   · **체류시간은 「구글이 붙어 있다고 본 시간」이다.** 탭을 숨기면 안 센다 —');
console.log('     사람이 읽은 시간의 **아래쪽 어림**이다.');
console.log(`   · **세션 수를 초와 같이 본다.** 세션이 ${흔들리는세션}개 아래인 자리의 평균은 흔들린다.`);
console.log('   · **못 잰 자리는 0 이 아니라 「못 쟀다」다.** 0 은 아무도 안 왔다는 뜻이다.');

if (process.argv.includes('--붙인다')) {
  const 메모 = path.join(뿌리, 'docs/세션간-메모.md');
  if (!existsSync(메모)) { console.log('\n⚠ 메모 파일이 없다 — 화면에만 두고 끝낸다'); process.exit(0); }
  const 이전 = readFileSync(메모, 'utf8');
  const crlf = 이전.includes('\r\n');
  /* ⛔ 무엇을 붙였는지 사람이 읽을 수 있게 머리글을 단다. 숫자만 붙이면 나중에 못 찾는다 */
  const 붙일글 = ['', '## [5번] 방문자수·체류시간 — 전 유닛께', '',
    '사장님 지시(2026-08-24)로 업무보고 1시간 전에 보내는 것입니다. 자기 유닛 줄을',
    '업무보고에 그대로 쓰실 수 있습니다.', '',
    '```',
    ...(유닛줄.length
      ? ['유닛      사이트              순방문   세션   지면열림   하루평균',
        ...유닛줄.map((u) => {
          const 이름 = 자리표.find((r) => r.유닛 === u.유닛)?.이름 ?? '(모르는 자리)';
          return `${u.유닛.padEnd(8)} ${이름.padEnd(18)} ${String(u.순방문).padStart(6)}`
            + ` ${String(u.세션).padStart(6)} ${String(u.열림).padStart(9)}   ${(u.순방문 / 28).toFixed(1)}`;
        })]
      : ['⛔ 방문자수 — 못 쟀습니다. 0 이 아니라 못 잼입니다.']),
    '```', '',
    /* ⛔ 체류시간을 빼고 보내지 않는다 — 사장님이 말씀하신 것은 «둘»이다.
       처음 이 자를 쓸 때 방문자만 붙여 놓고 지시의 절반을 빠뜨렸다 */
    '체류시간(같은 28일 창):', '',
    '```',
    ...(체류.됐나 && 체류줄뜯기(체류.글).length
      ? 체류줄뜯기(체류.글)
      : ['⛔ 체류시간 — 못 쟀습니다. 0 이 아니라 못 잼입니다.']),
    '```', '',
    '⚠ 28일 창입니다. GA4 는 광고차단·쿠키거부로 **덜 세는 쪽**이라 바닥값으로 읽으십시오.',
    '⚠ **체류시간은 「구글이 붙어 있다고 본 시간」**입니다. 탭을 숨기면 안 세니 읽은 시간의',
    '아래쪽 어림입니다. ⚠ 세션이 적은 자리의 평균은 흔들립니다 — 초와 세션을 같이 보십시오.',
    '⛔ 못 잰 자리는 0 이 아니라 「못 쟀다」로 적었습니다.', '',
    '— **5번**', ''].join('\n');
  appendFileSync(메모, crlf ? 붙일글.replace(/\n/g, '\r\n') : 붙일글);
  console.log('\n✅ 메모에 붙였다 — docs/세션간-메모.md');
} else {
  console.log('\n⚠ 아직 안 붙였다. 붙이려면 --붙인다');
}
