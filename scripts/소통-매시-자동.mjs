#!/usr/bin/env node
/**
 * 소통-매시-자동.mjs — 매시 소통에서 «기계가 할 수 있는 몫»을 기계에 넘긴다
 * ─────────────────────────────────────────────────────────────────────────────
 * 사장님 물음(2026-09-20): 「**소통하는 것은 자동화가 안되나, 소통 내용까지 다 확인하는 걸
 *   전제로 함**」
 *
 * ⭐ 답 — **반은 된다. 반은 되면 안 된다.** 그 선을 이 자가 긋는다.
 *
 *   기계가 할 몫 (여기서 한다)          사람(세션)이 할 몫 (여기서 «안» 한다)
 *   ─────────────────────────────    ─────────────────────────────────
 *   두 채널의 «새 글»을 모은다            그 글을 읽고 무슨 뜻인지 판단한다
 *   누가 몇 시간 조용한지 잰다            조용한 자리에 무엇을 시킬지 정한다
 *   🔴·막힘·안 됨 을 뽑아 앞에 세운다     그 막힘을 뚫는다
 *   대장에 «잰 사실»을 적는다             대장에 «내가 무엇을 했고 할 것인가»를 적는다
 *   빠진 시각을 스스로 센다               내용을 확인했다고 도장을 찍는다
 *
 * 🔴 **이 자는 「소통했다」를 대신 적지 않는다.** 적으면 대장이 거짓말을 한다.
 *   대신 「읽을 것」을 차려 놓고, 세션이 읽은 뒤 --읽었다 로 도장을 찍는다.
 *   도장이 두 판(두 시간) 넘게 안 찍히면 🔴 다 — 사장님이 말씀하신 「내용까지 다 확인」이
 *   지켜지지 않는다는 뜻이기 때문이다.
 *
 * 쓰는 법
 *   node scripts/소통-매시-자동.mjs                  모으고 차려 놓는다 (예약이 매시 부른다)
 *   node scripts/소통-매시-자동.mjs --읽었다 "<한 줄>"  읽었다고 도장을 찍고 대장에 적는다
 *   node scripts/소통-매시-자동.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { 도는자리 } from './lib/도는자리.mjs';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');
const 형제 = path.resolve(뿌리, '../klifemap');
export const 요약방 = path.join(뿌리, 'docs', '소통-요약');
export const 읽을것길 = path.join(뿌리, 'docs', '소통-읽을것.md');
const 대장길 = path.join(뿌리, 'docs/매시소통.tsv');

export const 채널들 = [
  { 이름: '이 저장소', 길: path.join(뿌리, 'docs/세션간-메모.md') },
  { 이름: 'klifemap', 길: path.join(형제, 'docs/1번-4번-메모.md') },
];

/* ⛔ toISOString() 을 쓰지 않는다 — 이 PC 는 이미 KST 다 */
export function 시각글(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
    + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
export function 날짜글(d = new Date()) { return 시각글(d).slice(0, 10); }

/* ── 새 글 고르기 ─────────────────────────────────────────────────────────
   메모는 1만 줄이 넘는다. 매번 다 읽지 않는다 — «지난번에 어디까지 봤나»를 적어 두고
   그 뒤만 본다. ⚠ 줄 번호로 기억하면 남이 가운데를 고칠 때 어긋난다. 그래서 «줄 수»가
   아니라 마지막으로 본 제목 글자를 함께 적어 두고, 못 찾으면 꼬리 400줄만 본다. */
export function 새글고르기(글, 지난제목) {
  const 줄들 = String(글 ?? '').split(/\r?\n/);
  const 제목자리 = [];
  for (let i = 0; i < 줄들.length; i += 1) if (/^## \[/.test(줄들[i])) 제목자리.push(i);
  if (!제목자리.length) return { 글들: [], 마지막제목: 지난제목 ?? null };

  let 시작 = 0;
  if (지난제목) {
    const i = 제목자리.findIndex((n) => 줄들[n].trim() === 지난제목.trim());
    시작 = i >= 0 ? i + 1 : Math.max(0, 제목자리.length - 12);
  } else {
    시작 = Math.max(0, 제목자리.length - 12);
  }
  const 글들 = [];
  for (let k = 시작; k < 제목자리.length; k += 1) {
    const 첫 = 제목자리[k];
    const 끝 = k + 1 < 제목자리.length ? 제목자리[k + 1] : 줄들.length;
    글들.push({ 제목: 줄들[첫].trim(), 본문: 줄들.slice(첫 + 1, 끝).join('\n') });
  }
  return { 글들, 마지막제목: 줄들[제목자리[제목자리.length - 1]].trim() };
}

/** 🔴·막힘·안 됨 — 먼저 읽어야 할 줄만 뽑는다 */
export function 눈에띄는줄(본문) {
  return String(본문 ?? '').split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && /🔴|막혔|막힘|안 됐|안 된다|못 했|못한|실패|죽었|0건|내려갔/.test(l))
    .slice(0, 4);
}

/** 제목에서 보낸 자리를 뽑는다 — 「## [5번 → 1번] …」 */
export function 보낸자리(제목) {
  const m = /^## \[(\d+번)/.exec(String(제목 ?? ''));
  return m ? m[1] : null;
}

/* ── 조용한 자리 ──────────────────────────────────────────────────────── */
export function 조용한지(마지막분, 지금분, 견디는분 = 90) {
  if (마지막분 === null || 마지막분 === undefined) return true;
  return (지금분 - 마지막분) > 견디는분;
}

function 대장마지막(누구) {
  if (!fs.existsSync(대장길)) return null;
  const 줄들 = fs.readFileSync(대장길, 'utf8').split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'));
  for (let i = 줄들.length - 1; i >= 0; i -= 1) {
    const 칸 = 줄들[i].split('\t');
    if ((칸[1] ?? '').trim() === 누구) return 칸[0].trim();
  }
  return null;
}

function 분으로(시각문) {
  if (!시각문) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(시각문);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() / 60000;
}

function 마지막커밋(누구) {
  try {
    const s = execFileSync('git', ['log', '-1', '--grep=^' + 누구, '--format=%cd',
      '--date=format:%Y-%m-%d %H:%M'], { cwd: 뿌리, encoding: 'utf8' }).trim();
    return s || null;
  } catch (e) { return null; }
}

/* ── 본 몫 ────────────────────────────────────────────────────────────── */
function 차린다() {
  const 이제 = new Date();
  const 지금분 = 이제.getTime() / 60000;
  fs.mkdirSync(요약방, { recursive: true });
  const 표길 = path.join(요약방, '.본자리.json');
  let 본자리 = {};
  try { 본자리 = JSON.parse(fs.readFileSync(표길, 'utf8')); } catch (e) { /* 첫 판 */ }

  console.log('■ 매시 소통 — 모아 놓는다 · ' + 시각글(이제));
  console.log('   ⭐ 읽고 판단하는 것은 «세션 몫»이다. 이 자는 차려 놓기만 한다\n');

  const 모은것 = [];
  for (const c of 채널들) {
    if (!fs.existsSync(c.길)) { console.log('   ⬜ ' + c.이름 + ' — 채널 파일이 없다'); continue; }
    const { 글들, 마지막제목 } = 새글고르기(fs.readFileSync(c.길, 'utf8'), 본자리[c.이름]);
    본자리[c.이름] = 마지막제목;
    for (const g of 글들) 모은것.push({ 채널: c.이름, ...g, 눈: 눈에띄는줄(g.본문) });
    console.log('   ' + c.이름 + ' — 새 글 ' + 글들.length + '개');
  }
  fs.writeFileSync(표길, JSON.stringify(본자리, null, 1));

  /* 조용한 자리 — 자리 목록은 이 파일에 두지 않는다(check-자리목록-한곳.mjs) */
  const 자리들 = 도는자리;
  const 조용 = [];
  for (const w of 자리들) {
    const 소통 = 분으로(대장마지막(w));
    const 커밋 = 분으로(마지막커밋(w));
    const 늦은 = [소통, 커밋].filter((x) => x !== null).sort((a, b) => b - a)[0] ?? null;
    const 몇분 = 늦은 === null ? null : Math.round(지금분 - 늦은);
    if (조용한지(늦은, 지금분)) 조용.push({ 자리: w, 몇분 });
    console.log('   ' + w + ' — 마지막 기척 '
      + (몇분 === null ? '없다' : 몇분 + '분 전') + (조용한지(늦은, 지금분) ? '  🔴 조용하다' : ''));
  }

  /* 읽을 것을 차린다 */
  const 줄 = ['# 소통 — 읽을 것 (자동으로 차림 · ' + 시각글(이제) + ')', '',
    '⭐ 이 파일은 «기계가 모은 것»이다. 읽고 판단하는 것은 세션 몫이다.',
    '   다 읽었으면 도장을 찍는다 —  node scripts/소통-매시-자동.mjs --읽었다 "무엇을 했고 무엇을 할 것인가"', ''];
  if (조용.length) {
    줄.push('## 🔴 조용한 자리');
    for (const q of 조용) 줄.push('- ' + q.자리 + ' — ' + (q.몇분 === null ? '기척 없음' : q.몇분 + '분째 조용'));
    줄.push('');
  }
  줄.push('## 새 글 ' + 모은것.length + '개', '');
  for (const g of 모은것) {
    줄.push('### ' + g.제목 + '   `' + g.채널 + '`');
    if (g.눈.length) for (const l of g.눈) 줄.push('  🔴 ' + l);
    줄.push('');
  }
  if (!모은것.length) 줄.push('(새 글 없음)', '');
  fs.writeFileSync(읽을것길, 줄.join('\n'));

  /* 도장이 얼마나 안 찍혔나 */
  const 도장길 = path.join(요약방, '.읽음도장.json');
  let 도장 = null;
  try { 도장 = JSON.parse(fs.readFileSync(도장길, 'utf8')); } catch (e) { /* 없다 */ }
  const 도장분 = 분으로(도장 && 도장.때);
  const 밀린 = 도장분 === null ? null : Math.round(지금분 - 도장분);
  console.log('\n   차렸다 — docs/소통-읽을것.md (새 글 ' + 모은것.length + '개'
    + (조용.length ? ' · 조용한 자리 ' + 조용.length : '') + ')');
  if (밀린 === null || 밀린 > 125) {
    console.log('   🔴 읽음 도장이 ' + (밀린 === null ? '한 번도 안 찍혔다' : 밀린 + '분째 안 찍혔다')
      + ' — 사장님 전제는 「소통 내용까지 다 확인」이다');
    return 1;
  }
  console.log('   ✅ 읽음 도장 ' + 밀린 + '분 전');
  return 0;
}

function 읽었다(말) {
  const 이제 = new Date();
  if (String(말 ?? '').trim().length < 10) {
    console.log('⛔ 열 글자 미만은 소통이 아니다. 무엇을 했고 무엇을 할 것인지 적는다');
    return 1;
  }
  fs.mkdirSync(요약방, { recursive: true });
  fs.writeFileSync(path.join(요약방, '.읽음도장.json'),
    JSON.stringify({ 때: 시각글(이제) }));
  const 씻기 = (s) => String(s).replace(/[\t\r\n]+/g, ' ').trim();
  fs.appendFileSync(대장길, 시각글(이제) + '\t5번\t' + 씻기(말) + '\n');
  console.log('✅ 도장을 찍고 대장에 적었다 — ' + 시각글(이제));
  return 0;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
function 자가시험() {
  let 산 = 0; let 죽 = 0;
  const 재다 = (말, 참) => { if (참) { 산 += 1; } else { 죽 += 1; console.log('   ✕ ' + 말); } };

  재다('시각글이 KST 꼴이다 (toISOString 이면 T 가 낀다)',
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(시각글(new Date(2026, 8, 20, 1, 5))));
  재다('새벽 1시도 그날이다', 날짜글(new Date(2026, 8, 20, 1, 5)) === '2026-09-20');

  const 글 = ['머리말', '## [1번 → 5번] 09:00 가', 'ㄱ내용', '## [2번 → 5번] 10:00 나', '🔴 막혔다',
    '## [5번 → 전 유닛] 11:00 다', '잘 된다'].join('\n');
  재다('지난번에 본 제목 뒤만 고른다',
    새글고르기(글, '## [1번 → 5번] 09:00 가').글들.length === 2);
  재다('처음이면 꼬리만 고른다(다 읽지 않는다)', 새글고르기(글, null).글들.length === 3);
  재다('마지막 제목을 돌려준다',
    새글고르기(글, null).마지막제목 === '## [5번 → 전 유닛] 11:00 다');
  재다('못 찾는 제목이면 꼬리로 물러난다', 새글고르기(글, '## [9번] 없는 것').글들.length === 3);
  재다('제목이 없으면 빈 채로 돌려준다', 새글고르기('아무 제목 없음', null).글들.length === 0);

  재다('🔴 줄을 뽑는다', 눈에띄는줄('그냥 줄\n🔴 막혔다\n또 그냥').length === 1);
  재다('막힘·못함도 뽑는다', 눈에띄는줄('못 했다\n안 됐다').length === 2);
  재다('넉 줄까지만 뽑는다', 눈에띄는줄('🔴a\n🔴b\n🔴c\n🔴d\n🔴e').length === 4);
  재다('평범한 글에서는 아무것도 안 뽑는다', 눈에띄는줄('잘 됩니다\n다음도 합니다').length === 0);

  재다('보낸 자리를 뽑는다', 보낸자리('## [1번 → 5번] 09:00 가') === '1번');
  재다('꼴이 다르면 null', 보낸자리('## 그냥 제목') === null);

  const 지금 = 1000;
  재다('90분을 넘기면 조용하다', 조용한지(900, 지금) === true);
  재다('방금 기척이 있으면 안 조용하다', 조용한지(970, 지금) === false);
  재다('기척이 아예 없으면 조용하다', 조용한지(null, 지금) === true);
  재다('견디는 시간을 바꿀 수 있다', 조용한지(900, 지금, 200) === false);

  재다('채널이 둘이고 길이 서로 다르다',
    채널들.length === 2 && 채널들[0].길 !== 채널들[1].길);

  console.log('   자가시험 ' + 산 + '개 통과' + (죽 ? ' · ' + 죽 + '개 실패' : ''));
  return 죽 === 0;
}

const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
} else if (인자.includes('--읽었다')) {
  process.exit(읽었다(인자[인자.indexOf('--읽었다') + 1]));
} else {
  process.exit(차린다());
}
