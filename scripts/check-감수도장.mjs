#!/usr/bin/env node
/**
 * 감수 도장 관문 — 세 사이트(seoulmarkets · kculturewire · 100yearmap) 판
 *
 * 사장님 지시 (2026-09-10, 원문)
 *   「5번 총괄은 모든 유닛에 대해 감수를 한다. 모든 유닛은 자기 외 유닛에 대해 감수한다.」
 *   그 앞에: 「너는 왜 넋놓고 보고도 안받고 감수도 안했나.. 다 만들고 라이브상태라잖나」
 *
 * 왜 «검사»로 두나
 *   「감수를 먼저 받자」는 문장은 잊힌다. 만드는 쪽은 «다 됐다고 믿을 때» 배포하므로,
 *   기다리는 쪽이 늦는 것은 사람의 잘못이 아니라 구조다. 회사 원칙 —
 *   「규칙은 문장이 아니라 검사로 둔다」.
 *
 * ⚠ 남을 갑자기 막지 않는다 — 「기준선」을 먼저 찍는다
 *   이미 라이브인 지면을 오늘 갑자기 막으면 다른 유닛의 하루가 멈춘다. 그것은
 *   「다른 유닛에 피해」다. 그래서 `--기준선` 으로 지금 상태를 «통과»로 찍어 두고,
 *   그 뒤에 «고치면» 막는다. 관문은 상태를 막는 것이 아니라 «변경»을 막는 것이다.
 *
 * 쓰는 법
 *   node scripts/check-감수도장.mjs                검사 (배포 관문이 부른다)
 *   node scripts/check-감수도장.mjs --자가시험
 *   node scripts/check-감수도장.mjs --기준선        지금 상태를 전부 기준선 통과로 찍는다 (한 번만)
 *   node scripts/check-감수도장.mjs --도장 <파일> --누구 5번 --판정 통과
 *   node scripts/check-감수도장.mjs --고리          누가 누구를 감수하나 본다
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const 도장길 = 'docs/감수도장.tsv';
export const 통과글 = '통과';
export const 기준선글 = '기준선(이미 라이브)';

/**
 * 감수 대상 — 「값을 받는 화면」과 「손님이 보는 첫 화면」.
 * ⛔ 지면 2,900장을 다 넣지 않는다. 다 넣으면 관문이 꺼진다(사람이 검사를 끄는 쪽으로 간다).
 * ⭐ 첫 화면은 이탈이 갈리는 자리이고, 값 받는 화면은 돈이 오가는 자리다. 그 둘만 막는다.
 */
export const 감수대상 = [
  'src/pages/index.astro',            // seoulmarkets 첫 화면
  'src/pages/wikitip/index.astro',    // kculturewire 첫 화면
  'src/pages/100y/index.astro',       // 100yearmap 첫 화면
  'src/pages/100y/price.astro',       // 값을 받는 화면
  'src/pages/100y/refund.astro',      // 환불 고지 — 틀리면 분쟁이 된다
];

/**
 * 감수 «고리» — 사장님 「모든 유닛은 자기 외 유닛에 대해 감수한다」
 * ⚠ 「서로 봐 주자」로만 두면 아무도 안 본 것이 된다. 그래서 «한 사람씩 짝을 정한다».
 *   고리로 두면 빠지는 자리가 없고, 5번은 그 위에서 전부를 본다.
 */
export const 감수고리 = {
  '1번': '3번',   // 1번(KLifeMap)이 만든 것은 3번이 본다
  '3번': '6번',
  '6번': '1번',
  '5번': '3번',   // ⭐ 총괄이 만든 것도 남이 본다 — 오늘 사고가 총괄의 눈이 빈 데서 났다
};
export const 총괄 = '5번';

export function 감수할이(만든이) {
  const 짝 = 감수고리[String(만든이 ?? '').trim()];
  if (!짝) return null;               // ⛔ 모르는 자리를 「아무나」로 채우지 않는다
  return { 짝, 총괄 };
}

export function 해시내기(글) {
  return crypto.createHash('sha256').update(String(글 ?? '').replace(/\r\n/g, '\n'), 'utf8')
    .digest('hex').slice(0, 16);
}

export function 도장줄읽기(줄) {
  const 글 = String(줄 ?? '');
  if (!글.trim() || 글.trim().startsWith('#')) return null;
  const 칸 = 글.split('\t');
  if (칸.length < 5) return null;
  return { 파일: 칸[0].trim(), 해시: 칸[1].trim(), 누구: 칸[2].trim(),
           시각: 칸[3].trim(), 판정: 칸[4].trim(), 왜: (칸[5] ?? '').trim() };
}

export function 도장줄쓰기({ 파일, 해시, 누구, 시각, 판정, 왜 }) {
  return [파일, 해시, 누구, 시각, 판정, 왜 ?? ''].join('\t');
}

/** 같은 파일에 도장이 여럿이면 «마지막»이 산다 */
export function 도장모으기(글) {
  const 표 = new Map();
  String(글 ?? '').split(/\r?\n/).forEach((줄) => {
    const 한줄 = 도장줄읽기(줄);
    if (한줄 && 한줄.파일) 표.set(한줄.파일, 한줄);
  });
  return 표;
}

/** 판정이 통과인가 — 기준선도 통과로 본다(이미 라이브인 것을 갑자기 막지 않는다) */
export function 통과인가(판정) {
  const 글 = String(판정 ?? '').trim();
  return 글 === 통과글 || 글 === 기준선글;
}

export function 감수검사(대상들, 도장표, 읽기) {
  const 막을것 = [];
  (대상들 ?? []).forEach((파일) => {
    let 글 = null;
    try { 글 = 읽기(파일); } catch { 글 = null; }
    if (글 == null) { 막을것.push({ 파일, 왜: '파일을 못 읽었다' }); return; }

    const 도장 = 도장표 instanceof Map ? 도장표.get(파일) : (도장표 ?? {})[파일];
    if (!도장) { 막을것.push({ 파일, 왜: '감수 도장이 없다' }); return; }
    if (!통과인가(도장.판정)) {
      막을것.push({ 파일, 왜: `감수 판정이 「${도장.판정 || '빈칸'}」이다` + (도장.왜 ? ` — ${도장.왜}` : '') });
      return;
    }
    if (도장.해시 !== 해시내기(글)) {
      막을것.push({ 파일, 왜: `감수 뒤에 고쳤다 (도장 ${도장.해시} · 지금 ${해시내기(글)})` });
    }
  });
  return 막을것;
}

/** 감수할 때 보는 여섯 줄 — 자기 유닛 것이 아닌 지면을 볼 때 «무엇을 보나»가 없으면 통과만 찍힌다 */
export const 감수여섯줄 = [
  '1  첫 화면 맨 위에 «손님이 얻는 것»이 한 문장으로 있나 (우리 소개가 아니라)',
  '2  화면에 한국어가 새지 않았나 (seoulmarkets·kculturewire 는 영문 전용)',
  '3  못 쟀거나 못 읽은 것을 «못 쟀다»고 적나 (0·보통·미확인으로 안 채우나)',
  '4  수가 나오면 «그 수가 어디서 왔나»가 지면에 적혀 있나',
  '5  값·환불·기간을 말하는 화면이면 그 값이 지금 값과 같나',
  '6  폰 크기로 띄웠을 때 첫 화면에 무엇이 보이나 (표가 옆으로 넘치지 않나)',
];

export function 판정글(막을것) {
  if (!막을것 || 막을것.length === 0) return '✅ 감수 도장 — 첫 화면·값 받는 화면 모두 통과';
  return ['⛔ 감수 도장 관문에 막혔다 — 배포하지 않는다']
    .concat(막을것.map((m) => `   · ${m.파일} — ${m.왜}`))
    .concat(['', '   ▶ 감수 고리: 1번→3번 · 3번→6번 · 6번→1번 · 5번→3번 (그 위에 5번이 전부를 본다)',
             '   ▶ 감수한 이가 도장을 찍는다:',
             '     node scripts/check-감수도장.mjs --도장 <파일> --누구 <내번호> --판정 통과',
             '   ▶ 무엇을 보나: node scripts/check-감수도장.mjs --고리'])
    .join('\n');
}

/** ⚠ 이 PC 는 이미 KST 다. 9시간을 더하지 않고 toISOString() 도 쓰지 않는다 */
export function 한국시각(날 = new Date()) {
  const 두자 = (n) => String(n).padStart(2, '0');
  return `${날.getFullYear()}-${두자(날.getMonth() + 1)}-${두자(날.getDate())} ` +
         `${두자(날.getHours())}:${두자(날.getMinutes())} KST`;
}

/* ───────────────────────── 자가시험 ───────────────────────── */

function 자가시험() {
  let 통과 = 0, 실패 = 0;
  const 자가 = (이름, 참인가) => {
    if (참인가) { 통과 += 1; console.log('  ✅ ' + 이름); }
    else { 실패 += 1; console.log('  ⛔ ' + 이름); }
  };
  console.log('자가시험 — scripts/check-감수도장.mjs (세 사이트 판)');

  자가('같은 글은 같은 해시', 해시내기('가나') === 해시내기('가나'));
  자가('다른 글은 다른 해시', 해시내기('가나') !== 해시내기('가다'));
  자가('CRLF 와 LF 를 같게 본다', 해시내기('가\r\n나') === 해시내기('가\n나'));

  const 줄 = 'a.astro\th1\t3번\tt\t통과\t';
  자가('줄을 읽는다', 도장줄읽기(줄).누구 === '3번');
  자가('주석은 버린다', 도장줄읽기('# x') === null);
  자가('칸이 모자라면 버린다', 도장줄읽기('a\tb') === null);
  자가('쓴 줄을 다시 읽으면 같다',
    도장줄읽기(도장줄쓰기({ 파일: 'a', 해시: 'h', 누구: '6번', 시각: 't', 판정: '통과', 왜: '' })).누구 === '6번');

  const 표 = 도장모으기('a\th1\t3번\tt1\t보류\t왜1\na\th2\t3번\tt2\t통과\t');
  자가('같은 파일은 마지막 도장이 산다', 표.get('a').판정 === '통과');
  자가('줄 수만큼 세지 않는다', 표.size === 1);

  자가('통과는 통과다', 통과인가('통과') === true);
  자가('⭐ 기준선도 통과로 본다', 통과인가(기준선글) === true);
  자가('보류는 통과가 아니다', 통과인가('보류') === false);
  자가('빈칸은 통과가 아니다', 통과인가('') === false);
  자가('null 은 통과가 아니다', 통과인가(null) === false);

  const 글 = '<h1>x</h1>';
  const 좋은표 = 도장모으기(도장줄쓰기({ 파일: 'a', 해시: 해시내기(글), 누구: '3번', 시각: 't', 판정: '통과', 왜: '' }));
  자가('도장이 맞으면 통과', 감수검사(['a'], 좋은표, () => 글).length === 0);
  자가('🔴 도장이 없으면 막는다', 감수검사(['a'], 도장모으기(''), () => 글)[0].왜 === '감수 도장이 없다');
  자가('🔴 감수 뒤에 고치면 막는다', /고쳤다/.test(감수검사(['a'], 좋은표, () => 글 + 'x')[0].왜));
  자가('⛔ 못 읽은 파일을 통과로 세지 않는다',
    감수검사(['a'], 좋은표, () => { throw new Error('없다'); })[0].왜 === '파일을 못 읽었다');
  자가('⛔ null 을 돌려줘도 통과로 세지 않는다',
    감수검사(['a'], 좋은표, () => null)[0].왜 === '파일을 못 읽었다');
  자가('⛔ 하나가 막히면 나머지가 좋아도 막는다',
    감수검사(['a', 'b'], 좋은표, (p) => (p === 'a' ? 글 : null)).length === 1);

  // 고리 — 자기가 자기를 감수하지 않는다
  자가('🔴 자기가 자기를 감수하지 않는다',
    Object.entries(감수고리).every(([만든이, 짝]) => 만든이 !== 짝));
  자가('네 자리가 모두 짝이 있다', ['1번', '3번', '5번', '6번'].every((u) => 감수할이(u) !== null));
  자가('⭐ 총괄이 만든 것도 남이 본다', 감수할이('5번').짝 !== '5번');
  자가('모르는 자리는 「아무나」로 채우지 않는다', 감수할이('9번') === null);
  자가('빈 자리도 null 이다', 감수할이('') === null);
  자가('짝과 함께 총괄을 낸다', 감수할이('1번').총괄 === '5번');

  // 대상 목록 — 낡으면 관문이 헛것을 막거나 놓친다
  자가('감수대상이 다섯이다', 감수대상.length === 5);
  자가('감수대상은 모두 src/pages 아래다', 감수대상.every((p) => p.startsWith('src/pages/')));
  자가('세 사이트 첫 화면이 다 들어 있다',
    ['src/pages/index.astro', 'src/pages/wikitip/index.astro', 'src/pages/100y/index.astro']
      .every((p) => 감수대상.includes(p)));
  자가('⛔ 지면을 2,900장 다 넣지 않았다 (관문이 꺼지지 않게)', 감수대상.length <= 12);

  자가('여섯 줄 체크리스트가 있다', 감수여섯줄.length === 6);
  자가('체크리스트에 «못 쟀다»가 들어 있다', 감수여섯줄.some((줄) => 줄.includes('못 쟀다')));
  자가('체크리스트에 한국어 누출이 들어 있다', 감수여섯줄.some((줄) => 줄.includes('한국어')));

  자가('통과글에 ✅ 가 있다', 판정글([]).includes('✅'));
  자가('막힌 글에 고리가 적힌다', 판정글([{ 파일: 'a', 왜: 'b' }]).includes('감수 고리'));
  자가('시각이 KST 로 난다', /KST$/.test(한국시각(new Date(2026, 8, 10, 13, 5))));
  자가('시각에 9시간을 더하지 않는다', 한국시각(new Date(2026, 8, 10, 13, 5)).includes('13:05'));

  console.log(`\n통과 ${통과} · 실패 ${실패}`);
  return 실패 === 0;
}

/* ───────────────────────── 실행 ───────────────────────── */

const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
function 인자(이름) { const i = process.argv.indexOf(이름); return i >= 0 ? process.argv[i + 1] : null; }

function 머리말쓰기() {
  fs.mkdirSync(path.dirname(도장길), { recursive: true });
  if (!fs.existsSync(도장길)) {
    fs.writeFileSync(도장길,
      '# 감수 도장 — 첫 화면과 값 받는 화면은 감수 없이 배포하지 않는다\n' +
      '# 사장님 지시(2026-09-10): 「5번 총괄은 모든 유닛에 대해 감수를 한다.\n' +
      '#                        모든 유닛은 자기 외 유닛에 대해 감수한다」\n' +
      '# 고리: 1번→3번 · 3번→6번 · 6번→1번 · 5번→3번 (그 위에 5번이 전부를 본다)\n' +
      '# 파일\t해시\t감수한이\t시각\t판정\t왜\n', 'utf8');
  }
}

function 찍기(파일, 누구, 판정, 왜) {
  let 글;
  try { 글 = fs.readFileSync(파일, 'utf8'); }
  catch { console.error('⛔ 도장을 못 찍었다 — 파일을 못 읽었다: ' + 파일); return false; }
  머리말쓰기();
  const 줄 = 도장줄쓰기({ 파일: 파일.replace(/\\/g, '/'), 해시: 해시내기(글), 누구, 시각: 한국시각(), 판정, 왜 });
  fs.appendFileSync(도장길, 줄 + '\n', 'utf8');
  console.log((통과인가(판정) ? '✅' : '⚠') + ' ' + 줄);
  return true;
}

if (내가실행됐다) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

  if (process.argv.includes('--고리')) {
    console.log('감수 고리 — 사장님 「모든 유닛은 자기 외 유닛에 대해 감수한다」\n');
    for (const [만든이, 짝] of Object.entries(감수고리)) {
      console.log(`  ${만든이} 이 만든 것 → ${짝} 이 본다  (그 위에 ${총괄} 이 전부를 본다)`);
    }
    console.log('\n감수할 때 보는 여섯 줄 — 하나라도 아니면 통과가 아니다\n');
    감수여섯줄.forEach((줄) => console.log('  ' + 줄));
    console.log('\n⛔ 「거의 됐다」로 통과시키지 않는다. ⛔ 라이브가 된 뒤에 여는 것은 감수가 아니다.');
    process.exit(0);
  }

  if (process.argv.includes('--기준선')) {
    // ⚠ 이미 라이브인 것을 갑자기 막지 않는다. 지금 상태를 기준선으로 두고 «변경»부터 막는다.
    let 센것 = 0;
    for (const 파일 of 감수대상) {
      if (찍기(파일, 총괄, 기준선글, '오늘 이미 라이브인 상태를 기준선으로 둔다 — 이 뒤에 고치면 감수를 받는다')) 센것 += 1;
    }
    console.log(`\n기준선 ${센것}/${감수대상.length} 개를 찍었다.`);
    if (센것 !== 감수대상.length) { console.error('⛔ 다 못 찍었다 — 목록이 낡았는지 본다'); process.exit(1); }
    process.exit(0);
  }

  const 찍을것 = 인자('--도장');
  if (찍을것) {
    const 누구 = 인자('--누구');
    if (!누구) { console.error('⛔ --누구 를 적으십시오. 누가 감수했는지 없으면 도장이 아닙니다'); process.exit(1); }
    process.exit(찍기(찍을것, 누구, 인자('--판정') || 통과글, 인자('--왜') || '') ? 0 : 1);
  }

  let 도장글 = '';
  try { 도장글 = fs.readFileSync(도장길, 'utf8'); } catch { 도장글 = ''; }
  const 막을것 = 감수검사(감수대상, 도장모으기(도장글), (p) => fs.readFileSync(p, 'utf8'));
  console.log(판정글(막을것));
  process.exit(막을것.length === 0 ? 0 : 1);
}
