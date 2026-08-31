#!/usr/bin/env node
/**
 * check-2h.mjs — **두 시간마다 도는 체크리스트.** (`docs/5번-업무매뉴얼.md`)
 *
 * ── 🔴 왜 (2026-08-31 · 사장님 지시) ─────────────────────────
 * > 「**업무매뉴얼을 만들어, 그안에 체크리스트를 만들고...매일 2시간마다 한번씩 체크해...
 * >  매뉴얼과 체크리스트는 길어야 2장 분량(A4)으로 짧게, 길면 대충본다**」
 *
 * ⭐ 「길면 대충본다」가 알맹이다. 그래서 이 자도 **화면에 일곱 줄만** 낸다.
 * ⛔ 그리고 «눈으로 훑고 넘어가지» 못하게 한다 — 종이 체크리스트는 손이 먼저 체크한다.
 *   ⇒ 사람이 아니라 **자가 확인한다.** 못 재는 항목은 「못 쟀다」로 낸다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ 「못 쟀다」와 「안 됐다」를 갈라서 낸다. 못 잰 것을 통과로 안 친다.
 * ⛔ 남의 유닛 것을 재지 않는다 — 내 몫만 본다.
 * ⚠ 쉬는 시간(01:00~10:59)에는 「몫이 모자라다」를 흠으로 안 낸다. 아직 낼 시간이 아니다.
 *
 * 쓰는 법
 *   node scripts/check-2h.mjs --자가시험
 *   node scripts/check-2h.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { 쉬는시간인가 } from './lib/work-hours.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 하루 몫 — ⛔ 여기 한 곳에만 적는다 */
export const 하루몫 = { 텍스트: 6, 새영상: 3, 버전업: 1 };

/**
 * 정해진 시각의 보고. ⛔ 시각이 바뀌면 **여기 한 곳만** 고친다.
 *
 * 🔴 [2026-08-31] 사장님: 「**제때 보고해. 체크리스트에 넣어. 뭐하자는 거야**」
 *   그날 16시 보고를 18시가 넘어서야 냈다. 앞 자리를 고치는 데 몰두해 «시계를 안 봤다».
 *   ⛔ 더 나쁜 것은, 바로 그날 체크리스트를 만들면서 **이 항목을 안 넣은 것**이다.
 *     몫과 소통은 보면서 「16시 보고를 냈나」는 안 봤다.
 * ⭐ 우리 규칙이 「규칙은 문장이 아니라 검사로 둔다」이다. 보고 시각도 같다.
 */
export const 정해진보고 = [
  { 시: 16, 이름: '업무보고', 표: /\[5번 → 2번\][^\n]*업무보고/ },
  { 시: 22, 이름: '방문자 방송', 표: /\[5번\][^\n]*방문자수·체류시간/ },
];

/**
 * 지금이 몇 시인가를 보고 «보고를 냈어야 하나»를 가른다.
 * ⛔ 마감 전에는 흠으로 안 잡는다 — 다만 **한 시간 전부터 미리 알린다.**
 *   늦고 나서 잡는 자는 늦는 것을 못 막는다.
 */
export function 보고상태(시, 냈나, 마감시) {
  if (!Number.isFinite(시) || !Number.isFinite(마감시)) return null;   /* ⛔ 못 쟀다 */
  if (냈나) return { 됐나: true, 말: '냈다' };
  if (시 >= 마감시) return { 됐나: false, 말: `🔴 **${마감시}시가 지났는데 아직 안 냈다** (지금 ${시}시)` };
  if (시 === 마감시 - 1) return { 됐나: true, 말: `⏰ 곧 ${마감시}시다 — 지금 쓴다` };
  return { 됐나: true, 말: `${마감시}시까지` };
}

/** 한 줄로 낸다. ⛔ 못 잰 것은 ✗ 가 아니라 ⬜ 다 */
export function 줄(번호, 이름, 값) {
  const 표 = 값 === null ? '⬜' : (값.됐나 ? '✅' : '🔴');
  return `${표} ${번호} ${이름.padEnd(14)} ${값 === null ? '못 쟀다' : 값.말}`;
}

/** 오늘 낸 편수를 원부에서 센다. ⛔ 파일이 없으면 null — 0 이 아니다 */
export function 오늘낸영상(원부, 오늘) {
  const v = 원부?.videos;
  if (!Array.isArray(v)) return null;
  const 오늘것 = v.filter((x) => x?.uploadDate === 오늘);
  return {
    버전업: 오늘것.filter((x) => String(x.set).endsWith('-voiced')).length,
    새것: 오늘것.filter((x) => !String(x.set).endsWith('-voiced')).length,
  };
}

/** 오늘 낸 기사 수. ⛔ 못 읽으면 null */
export function 오늘낸기사(파일글들, 오늘) {
  if (!Array.isArray(파일글들)) return null;
  return 파일글들.filter((s) => new RegExp(`^pubDate:\\s*${오늘}`, 'm').test(String(s ?? ''))).length;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('된 것은 ✅', 줄('①', '새 지시', { 됐나: true, 말: '없음' }).startsWith('✅'));
  검('안 된 것은 🔴', 줄('①', '새 지시', { 됐나: false, 말: 'x' }).startsWith('🔴'));
  검('⛔ 못 잰 것은 ✗ 가 아니라 ⬜ 다', 줄('①', '새 지시', null).startsWith('⬜'));
  검('못 잰 줄은 「못 쟀다」라고 적는다', 줄('①', '새 지시', null).includes('못 쟀다'));

  const 원부 = { videos: [
    { set: 'actors-voiced', uploadDate: '2026-08-31' },
    { set: 'actors', uploadDate: '2026-08-21' },
    { set: 'shelf', uploadDate: '2026-08-31' },
  ] };
  검('버전업과 새 영상을 갈라 센다',
    JSON.stringify(오늘낸영상(원부, '2026-08-31')) === JSON.stringify({ 버전업: 1, 새것: 1 }));
  검('다른 날은 안 센다', 오늘낸영상(원부, '2026-08-30').버전업 === 0);
  검('⛔ 원부를 못 읽으면 null — 0 이 아니다', 오늘낸영상(null, '2026-08-31') === null);
  검('⛔ videos 가 배열이 아니어도 null', 오늘낸영상({ videos: 'x' }, '2026-08-31') === null);

  검('오늘 기사를 센다',
    오늘낸기사(['---\npubDate: 2026-08-31\n---', '---\npubDate: 2026-08-30\n---'], '2026-08-31') === 1);
  검('⛔ 못 읽으면 null', 오늘낸기사(null, '2026-08-31') === null);
  검('⚠ 날짜가 겹치는 다른 칸을 안 센다',
    오늘낸기사(['---\ndataAsOf: 2026-08-31\n---'], '2026-08-31') === 0);

  검('하루 몫이 한 곳에 있다', 하루몫.텍스트 === 6 && 하루몫.새영상 === 3 && 하루몫.버전업 === 1);

  /* 🔴 사장님 「제때 보고해. 체크리스트에 넣어」 — 늦은 것을 «늦기 전에» 잡는다 */
  검('⭐ 마감이 지났는데 안 냈으면 🔴', 보고상태(18, false, 16).됐나 === false);
  검('마감이 지났어도 냈으면 ✅', 보고상태(18, true, 16).됐나 === true);
  검('⏰ 한 시간 전이면 미리 알린다', 보고상태(15, false, 16).말.includes('곧 16시'));
  검('⛔ 이른 시각을 흠으로 안 잡는다', 보고상태(11, false, 16).됐나 === true);
  검('마감 «정각»도 지난 것으로 본다', 보고상태(16, false, 16).됐나 === false);
  검('⛔ 시각을 못 읽으면 null — 통과가 아니다', 보고상태(null, false, 16) === null);
  검('정해진 보고가 둘 다 적혀 있다',
    정해진보고.length === 2 && 정해진보고.some((b) => b.시 === 16) && 정해진보고.some((b) => b.시 === 22));

  return 실패;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ 두 시간 체크리스트 — 자가시험 19 통과');
  process.exit(0);
}

if (내가실행됐다) {
  const 이제 = new Date();
  const 오늘 = 이제.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10);
  const 시각 = 이제.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(11, 16);
  const 쉼 = 쉬는시간인가(이제);
  const 돌리기 = (자, 인자 = []) => {
    try { execFileSync('node', [path.join(뿌리, 'scripts', 자), ...인자], { cwd: 뿌리, encoding: 'utf8', stdio: 'pipe' }); return true; }
    catch { return false; }
  };
  const 읽기 = (p) => { try { return JSON.parse(fs.readFileSync(path.join(뿌리, p), 'utf8')); } catch { return null; } };

  console.log(`■ 두 시간 체크 — ${오늘} ${시각}${쉼 ? '  🌙 쉬는 시간이다' : ''}\n`);

  /* ① 새 지시 */
  let 지시 = null;
  try {
    const 글 = execFileSync('node', [path.join(뿌리, 'scripts/check-kcw-new-orders.mjs')], { cwd: 뿌리, encoding: 'utf8' });
    const 수 = (글.match(/^\s+· /gm) ?? []).length;
    지시 = { 됐나: true, 말: `메모 꼬리 ${수}줄 읽었다 — 나에게 온 것은 열어 본다` };
  } catch { 지시 = null; }
  console.log(줄('①', '새 지시', 지시));

  /* ② 2번과 소통 — 이번 «시»에 낸 것이 있나 */
  let 소통 = null;
  try {
    const 메모 = fs.readFileSync(path.join(뿌리, 'docs/세션간-메모.md'), 'utf8');
    const 마지막 = [...메모.matchAll(/\[5번 → 2번[^\]]*\][^\n]*\((\d{2}):/g)].pop();
    소통 = 마지막
      ? { 됐나: 마지막[1] === 시각.slice(0, 2), 말: `마지막 ${마지막[1]}시 — 지금 ${시각.slice(0, 2)}시` }
      : { 됐나: false, 말: '아직 한 번도 없다' };
  } catch { 소통 = null; }
  console.log(줄('②', '2번 소통', 소통));

  /* ③ 오늘 몫 */
  const 영상 = 오늘낸영상(읽기('src/data/wikitip-video.json'), 오늘);
  let 기사 = null;
  try {
    const 방 = path.join(뿌리, 'content/kculturewire');
    기사 = 오늘낸기사(fs.readdirSync(방).filter((f) => f.endsWith('.md')).map((f) => fs.readFileSync(path.join(방, f), 'utf8')), 오늘);
  } catch { 기사 = null; }
  const 몫 = (영상 === null || 기사 === null) ? null : {
    /* ⚠ 쉬는 시간에는 「모자라다」를 흠으로 안 낸다 — 아직 낼 시간이 아니다 */
    됐나: 쉼 || (기사 >= 하루몫.텍스트 && 영상.새것 >= 하루몫.새영상 && 영상.버전업 >= 하루몫.버전업),
    말: `텍스트 ${기사}/${하루몫.텍스트} · 새 영상 ${영상.새것}/${하루몫.새영상} · 버전업 ${영상.버전업}/${하루몫.버전업}`,
  };
  console.log(줄('③', '오늘 몫', 몫));

  /*
   * ③-2 🔴 정해진 시각의 보고 — 사장님 「제때 보고해. 체크리스트에 넣어」
   * ⛔ 오늘 «날짜 뒤»에 그 보고가 있었나로 본다. 어제 것이 오늘을 보증하면 안 된다.
   */
  let 보고 = null;
  try {
    const 메모 = fs.readFileSync(path.join(뿌리, 'docs/세션간-메모.md'), 'utf8');
    /* 오늘 날짜가 처음 나오는 자리 뒤만 본다 — ⚠ 어제 것을 오늘 것으로 안 센다 */
    const 오늘부터 = 메모.slice(메모.indexOf(오늘) >= 0 ? 메모.indexOf(오늘) : 메모.length);
    const 시 = Number(시각.slice(0, 2));
    const 것들 = 정해진보고.map((b) => ({ ...b, 상태: 보고상태(시, b.표.test(오늘부터), b.시) }));
    const 늦은것 = 것들.filter((x) => x.상태 && !x.상태.됐나);
    보고 = {
      됐나: !늦은것.length,
      말: 것들.map((x) => `${x.이름} ${x.상태?.말 ?? '못 쟀다'}`).join(' · '),
    };
  } catch { 보고 = null; }
  console.log(줄('③-2', '정해진 보고', 보고));

  /* ④ 라이브 */
  let 라이브 = null;
  try {
    const 코드 = execFileSync('curl', ['-s', '-o', process.platform === 'win32' ? 'NUL' : '/dev/null',
      '-w', '%{http_code}', '--max-time', '20', 'https://www.kculturewire.com/'], { encoding: 'utf8' }).trim();
    라이브 = { 됐나: 코드 === '200', 말: `홈 ${코드}` };
  } catch { 라이브 = null; }
  console.log(줄('④', '라이브', 라이브));

  /* ⑤ 검사 묶음 — ⛔ 첫 실패에서 멈추지 않는다. 다 돌리고 갈라 적는다 */
  /*
   * 🔴 [2026-08-31] **`check-kcw-frontmatter.mjs` 를 여기 안 넣어 두었다가 하루 몫을 잃을 뻔했다.**
   *   기사 제목이 138자(한도 120)라 **빌드가 통째로 섰고**, 그날 기사 셋이 하나도 안 나갔다.
   *   배포 자는 「✅ 라이브 200」이라고 했다 — 홈이 살아 있으니 200 은 맞다. 그래서 조용했다.
   *   ⇒ 헛배포를 네 번 돌리고 남 탓까지 할 뻔한 뒤에야 지역 빌드를 돌려 찾았다.
   * ⛔⛔ 그 자는 **8/15 에 똑같은 일(dek 274자)을 겪고 이미 만들어 둔 것**이었다.
   *   자가 없던 게 아니라 **내가 안 돌렸다.** 그래서 목록에 박는다 — 기억에 맡기지 않는다.
   * ⭐ 빌드는 2분, 이 자는 1초다. 내기 전에 이것부터 돈다.
   */
  /* ⚠ 2026-09-01 — `check-no-riot` 를 더했다. 사장님이 내린 것이 되살아나지 않게,
     그리고 **너무 많이 지우지 않았나**까지 잰다(위키백과 e스포츠는 살아 있어야 한다) */
  const 검사들 = ['check-kcw-frontmatter.mjs', 'check-kcw-video-lists.mjs',
    'check-kcw-article-backlinks.mjs', 'check-kcw-names-in-title.mjs', 'check-no-riot.mjs'];
  const 결과 = 검사들.map((자) => ({ 자, 통과: 돌리기(자) }));
  const 진것 = 결과.filter((r) => !r.통과).map((r) => r.자.replace(/^check-kcw-|\.mjs$/g, ''));
  console.log(줄('⑤', '검사 묶음', { 됐나: !진것.length, 말: 진것.length ? `걸린 것: ${진것.join(' · ')}` : `${결과.length}개 다 통과` }));

  /* ⑥ 막힌 것 — 사람만 풀 수 있는 것을 «세어서» 낸다 */
  const 막힘 = ['🔴 Riot 열쇠(사장님 손·CAPTCHA)', '🔴 www 301(6번 확인 대기)'];
  console.log(줄('⑥', '막힌 것', { 됐나: false, 말: 막힘.join(' · ') }));

  /* ⑦ 진행 줄 */
  let 진행 = null;
  try {
    const 메모 = fs.readFileSync(path.join(뿌리, 'docs/세션간-메모.md'), 'utf8');
    const 마지막 = [...메모.matchAll(/^\[진행\] 5번 \((\d{2}):/gm)].pop();
    진행 = 마지막 ? { 됐나: 마지막[1] === 시각.slice(0, 2), 말: `마지막 ${마지막[1]}시` } : { 됐나: false, 말: '없다' };
  } catch { 진행 = null; }
  console.log(줄('⑦', '[진행] 한 줄', 진행));

  const 흠 = [지시, 소통, 몫, 보고, 라이브, 진행].filter((x) => x === null || x.됐나 === false).length;
  console.log(`\n${흠 ? `⛔ 손댈 것 ${흠}개 — 위에서 🔴·⬜ 를 먼저 한다.` : '✅ 일곱 자리 다 섰다.'}`);
  console.log('⚠ ③이 뒤처졌는데 다른 일을 하고 있으면 그것이 잘못이다.');
  process.exit(흠 ? 1 : 0);
}
