#!/usr/bin/env node
/**
 * 지킨다-한국시리즈-끝나면-시킨다.mjs
 *   — **한국시리즈 경기가 끝나는 그 자리에서 기사를 시키고 거둔다.**
 *
 * 🔴 사장님 (2026-11-04)
 *   「**중부매일계정이 어제 끝난 한국시리즈 기사를 썼다.
 *     한국시리즈는 경기 종료후 바로 기사를 쓰게 조치해**」
 *
 * ⚠ 왜 예약(cron)으로 안 하나
 *   예약은 «정해진 시각»에 뜬다. 야구는 끝나는 시각이 정해져 있지 않다 —
 *   11월 3일 1차전은 8대 7 접전이라 네 시간 가까이 갔다.
 *   22시에 예약을 걸면 어떤 날은 경기 중에 뜨고 어떤 날은 한 시간을 묵힌다.
 *   ⇒ 점수판을 2분마다 읽다가 «끝났다»가 뜨면 그때 시킨다.
 *
 * 하는 일 네 가지
 *   ① 2분마다 네이버 점수판을 읽는다 (경기 지면 안에서 부른다 — 머리가 맞아야 답한다)
 *   ② 상태가 「종료」로 바뀌면 지시문을 만든다 (점수·이닝은 «읽은 것»만 넣는다)
 *   ③ 중부매일 계정 회차 대화에 그 지시를 넣는다
 *   ④ 다 쓰면 거둬서 docs/ 에 적고 화면에 한 줄 찍는다 → 5번이 데스킹해서 사장님께 보낸다
 *
 * ⛔ 점수를 지어내지 않는다. 못 읽으면 「못 읽었다」고 적고 «시키지 않는다».
 * ⛔ 사장님 크롬 창을 닫지 않는다 — disconnect() 만.
 * ⛔ 기사를 이 자가 사장님께 «보내지 않는다» — 데스킹을 거치라는 사장님 지시(11-03)다.
 *
 * 쓰는 법
 *   node scripts/지킨다-한국시리즈-끝나면-시킨다.mjs                 오늘 경기를 지킨다
 *   node scripts/지킨다-한국시리즈-끝나면-시킨다.mjs --날 2026-11-04
 *   node scripts/지킨다-한국시리즈-끝나면-시킨다.mjs --한번만         한 번만 읽고 끝낸다(점검용)
 *   node scripts/지킨다-한국시리즈-끝나면-시킨다.mjs --시킨다지않는다  끝난 것만 알리고 안 시킨다
 *   node scripts/지킨다-한국시리즈-끝나면-시킨다.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 한국시리즈에 오른 두 팀. ⛔ 다른 경기를 한국시리즈로 세지 않는다 */
export const 두팀 = ['삼성', 'KT'];

/** 인자 하나를 집는다. ⛔ 값이 없으면 다음 인자를 값으로 삼지 않는다 */
export function 인자(이름, argv = process.argv) {
  const i = argv.indexOf('--' + 이름);
  if (i < 0) return null;
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

/** 경기가 끝났나.
 *  ⚠ 네이버는 끝난 경기에 statusCode=RESULT, statusInfo=종료 를 준다.
 *  ⛔ 「점수가 있다」를 「끝났다」로 읽지 않는다 — 1회만 지나도 점수는 있다. */
export function 끝났나(g) {
  const c = String(g?.statusCode || '').toUpperCase();
  const s = String(g?.statusInfo || '');
  if (c === 'RESULT') return true;
  if (s.includes('종료')) return true;
  return false;
}

/** 한국시리즈 경기인가 — 두 팀 이름이 모두 들어 있어야 한다 */
export function 한국시리즈경기인가(g, 팀 = 두팀) {
  const 이름 = [g?.homeTeamName, g?.awayTeamName, g?.homeTeamCode, g?.awayTeamCode]
    .map((x) => String(x || '')).join(' ');
  return 팀.every((t) => 이름.includes(t));
}

/** 점수를 사람이 읽는 한 줄로 */
export function 한줄(g) {
  const 홈 = g.homeTeamName || g.homeTeamCode;
  const 원 = g.awayTeamName || g.awayTeamCode;
  return 원 + ' ' + (g.awayTeamScore ?? '-') + ' : ' + (g.homeTeamScore ?? '-') + ' ' + 홈
    + '  [' + (g.statusInfo || g.statusCode || '') + ']  ' + (g.stadium || '');
}

/** 몇 차전인가 — **치른 경기를 센다.**
 *
 *  🔴 [2026-11-04] 처음에는 일정 날짜를 코드에 박아 두고 그 자리로 셌다.
 *    그런데 그 일정은 내가 검색으로 짐작한 것이었다 — 검색은 1차전 날짜마저
 *    11월 2일이라 적었고, 점수판이 보여 준 실제 1차전은 11월 3일이었다.
 *    ⛔ 짐작한 표로 「2차전」이라 적으면 제목부터 틀린다.
 *  ⇒ 점수판에서 읽은 «끝난 한국시리즈 경기»를 세고, 오늘 것을 더해 차전을 낸다.
 *    못 세면 null 을 돌려주고, 부르는 쪽은 차전을 «아예 안 쓴다».
 *
 *  @param 앞선경기들  오늘보다 앞선 날짜의 한국시리즈 경기들 (점수판에서 읽은 것)
 */
export function 몇차전(앞선경기들) {
  if (!Array.isArray(앞선경기들)) return null;
  const 끝난것 = 앞선경기들.filter((g) => 끝났나(g));
  /* 오늘 경기가 그 다음 차전이다 */
  return 끝난것.length + 1;
}

/** 회차 대화에 넣을 지시문을 만든다.
 *  ⛔ 점수·기록을 이 자가 지어내지 않는다 — 점수판에서 읽은 것만 넣고,
 *    나머지는 «네가 확인해서 쓰라»고 시킨다. */
export function 지시문(날, 차전, g) {
  const 홈 = g.homeTeamName || g.homeTeamCode;
  const 원 = g.awayTeamName || g.awayTeamCode;
  const 홈점 = g.homeTeamScore;
  const 원점 = g.awayTeamScore;
  const 이긴팀 = 홈점 > 원점 ? 홈 : 원점 > 홈점 ? 원 : null;
  const 진팀 = 이긴팀 === 홈 ? 원 : 이긴팀 === 원 ? 홈 : null;
  const 점수 = 이긴팀 ? Math.max(홈점, 원점) + '대 ' + Math.min(홈점, 원점) : null;
  const 줄 = [];
  줄.push('지금 끝난 한국시리즈 ' + (차전 ? 차전 + '차전' : '경기') + ' 결과 기사를 지금 바로 써 주십시오. 다른 종목은 쓰지 마십시오.');
  줄.push('');
  줄.push('방금 네이버 점수판에서 제가 직접 읽은 것입니다. 이 셋은 확인된 사실입니다.');
  줄.push('  날짜 ' + 날 + ' · 장소 ' + (g.stadium || '확인해서 쓰십시오'));
  줄.push('  ' + 원 + ' ' + 원점 + ' : ' + 홈점 + ' ' + 홈 + ' (경기 종료)');
  if (이긴팀) 줄.push('  ' + 이긴팀 + '이(가) ' + 점수 + '로 ' + 진팀 + '을(를) 이겼습니다.');
  줄.push('');
  줄.push('나머지는 직접 확인해서 쓰십시오. 지어내지 마십시오.');
  줄.push('  이닝별 점수 · 승리투수 · 패전투수 · 세이브 · 홈런 친 선수와 회차 · 주요 타자 기록');
  줄.push('  네이버 스포츠 경기 기록을 먼저 보고, 스타뉴스나 스포츠경향 현장 기사로 한 번 더 맞춰 보십시오.');
  줄.push('  한 매체에만 있는 것은 쓰지 마십시오. 다음 경기 선발은 구단이 공식으로 예고한 것만 쓰십시오.');
  줄.push('');
  줄.push('투수를 바꾼 대목을 쓸 때는 아웃카운트와 이닝 수를 서로 더해 보십시오. 11월 3일 원고가 그 자리에서 틀렸습니다.');
  줄.push('제목 앞에 [프로야구] 를 붙이고 명사로 맺으십시오. 기록은 부제목으로 내리십시오.');
  줄.push('추천 키워드는 세 개만 적고 해시태그 묶음은 넣지 마십시오.');
  줄.push('본문 첫머리에 [중부매일 박인택 기자] 를 넣고 글 끝에 바이라인을 또 쓰지 마십시오.');
  줄.push('사진은 연합뉴스에서 찾아 주소까지 적어 주십시오. 못 찾으면 못 찾았다고 적으십시오.');
  줄.push('');
  줄.push('제목, 부제목, 사진 제목과 캡션, 본문 차례로 주십시오. 메일로 보내지 마십시오. 제가 데스킹해서 보냅니다.');
  return 줄.join('\n');
}

const 이파일이진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

/* ── 자가시험 ────────────────────────────────────────────── */
if (이파일이진입점 && process.argv.includes('--자가시험')) {
  let 탈 = 0;
  const 재본다 = (이름, 참인가) => { if (참인가) console.log('  ✅ ' + 이름); else { console.log('  🔴 ' + 이름); 탈 += 1; } };
  console.log('■ 자가시험');

  재본다('RESULT 는 끝난 것이다', 끝났나({ statusCode: 'RESULT' }));
  재본다('statusInfo 종료도 끝난 것이다', 끝났나({ statusInfo: '종료' }));
  재본다('경기전은 안 끝난 것이다', !끝났나({ statusCode: 'BEFORE', statusInfo: '경기전' }));
  재본다('진행중은 안 끝난 것이다', !끝났나({ statusCode: 'STARTED', statusInfo: '7회초' }));
  /* 🔴 점수가 있다고 끝난 것이 아니다 — 이 자리에서 거짓 발행이 난다 */
  재본다('점수가 있어도 진행중이면 안 끝난 것이다',
    !끝났나({ statusCode: 'STARTED', statusInfo: '3회말', homeTeamScore: 2, awayTeamScore: 1 }));
  재본다('빈 것은 안 끝난 것이다', !끝났나({}) && !끝났나(null));

  const ks = { homeTeamName: 'KT', awayTeamName: '삼성', statusCode: 'RESULT', homeTeamScore: 8, awayTeamScore: 7, stadium: '수원' };
  재본다('삼성-KT 는 한국시리즈다', 한국시리즈경기인가(ks));
  재본다('한화-LG 는 한국시리즈가 아니다',
    !한국시리즈경기인가({ homeTeamName: '한화', awayTeamName: 'LG' }));
  재본다('한 팀만 맞으면 한국시리즈가 아니다',
    !한국시리즈경기인가({ homeTeamName: 'KT', awayTeamName: 'LG' }));

  재본다('앞선 경기가 없으면 1차전', 몇차전([]) === 1);
  재본다('앞선 경기 하나가 끝났으면 2차전',
    몇차전([{ statusCode: 'RESULT' }]) === 2);
  재본다('앞선 경기 둘이 끝났으면 3차전',
    몇차전([{ statusCode: 'RESULT' }, { statusInfo: '종료' }]) === 3);
  /* 🔴 우천 취소처럼 «안 치른» 날은 세지 않는다 — 날짜로 세면 여기서 틀린다 */
  재본다('취소된 날은 차전으로 안 센다',
    몇차전([{ statusCode: 'RESULT' }, { statusCode: 'CANCEL', statusInfo: '취소' }]) === 2);
  재본다('못 읽으면 null', 몇차전(null) === null);

  const g = 지시문('2026-11-04', 2, ks);
  재본다('지시문에 점수가 들어간다', g.includes('삼성 7 : 8 KT'));
  재본다('지시문이 이긴 팀을 적는다', g.includes('KT이(가) 8대 7로'));
  재본다('지시문이 차전을 적는다', g.includes('2차전'));
  재본다('지시문이 메일을 막는다', g.includes('메일로 보내지 마십시오'));
  재본다('지시문이 지어내기를 막는다', g.includes('지어내지 마십시오'));
  재본다('지시문이 한 줄짜리가 아니다', g.split('\n').length > 10);
  /* 🔴 무승부면 「이겼다」를 적으면 안 된다 */
  const 무 = 지시문('2026-11-04', 2, { ...ks, homeTeamScore: 3, awayTeamScore: 3 });
  재본다('무승부면 이긴 팀을 안 적는다', !무.includes('이겼습니다'));

  재본다('한줄이 점수와 상태를 적는다', 한줄(ks).includes('삼성 7 : 8 KT') && 한줄(ks).includes('RESULT'));
  재본다('인자는 값이 없으면 null', 인자('날', ['--날', '--한번만']) === null);
  재본다('인자를 집는다', 인자('날', ['--날', '2026-11-04']) === '2026-11-04');

  console.log(탈 ? '\n🔴 ' + 탈 + '가지 떨어졌다' : '\n✅ 모두 통과');
  process.exit(탈 ? 1 : 0);
}

/* ── 본체 ────────────────────────────────────────────────── */
if (이파일이진입점 && !process.argv.includes('--자가시험')) {
  const 날 = 인자('날') || new Date().toLocaleDateString('sv-SE'); /* KST. ⛔ toISOString 금지 */
  const 한번만 = process.argv.includes('--한번만');
  const 안시킨다 = process.argv.includes('--시킨다지않는다');
  const 사이 = 120000;            /* 2분마다 */
  const 끝낼때 = Date.now() + 6 * 3600 * 1000; /* 여섯 시간 뒤에는 스스로 그만둔다 */

  const { 쓸포트를마련한다 } = await import(
    (await import('node:url')).pathToFileURL('C:\\Users\\User\\Documents\\GitHub\\klifemap\\scripts\\크롬을-띄운다.mjs').href);
  const 포트 = await 쓸포트를마련한다({});
  if (!포트.포트) { console.log('🔴 크롬을 못 띄웠다 — ' + 포트.누구); process.exit(1); }

  const require2 = createRequire('C:\\Users\\User\\Documents\\GitHub\\klifemap\\package.json');
  const puppeteer = require2('puppeteer-core');

  async function 읽는다() {
    const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + 포트.포트, defaultViewport: null, protocolTimeout: 240000 });
    const page = await b.newPage();
    try {
      await page.goto('https://m.sports.naver.com/kbaseball/schedule/index', { waitUntil: 'domcontentloaded', timeout: 90000 });
      await new Promise((r) => setTimeout(r, 2500));
      /* ⚠ 오늘 것만 읽으면 「몇 차전인가」를 못 센다 — 시리즈가 시작된 뒤부터 함께 읽는다 */
      const 부터 = new Date(날 + 'T00:00:00');
      부터.setDate(부터.getDate() - 20);
      const 받은 = await page.evaluate(async (a, d) => {
        const u = 'https://api-gw.sports.naver.com/schedule/games?fields='
          + encodeURIComponent('basic,schedule,baseball')
          + '&upperCategoryId=kbaseball&fromDate=' + a + '&toDate=' + d + '&size=200';
        try {
          const r = await fetch(u, { headers: { accept: 'application/json' } });
          return { 상태: r.status, 글: await r.text() };
        } catch (e) { return { 상태: 0, 글: String(e && e.message) }; }
      }, 부터.toLocaleDateString('sv-SE'), 날);
      if (받은.상태 !== 200) return { 못쟀다: '창구가 안 열렸다 (' + 받은.상태 + ')' };
      let j = null;
      try { j = JSON.parse(받은.글); } catch (e) { return { 못쟀다: '답을 못 읽었다' }; }
      const 모두 = (j?.result?.games || []).filter((x) => 한국시리즈경기인가(x));
      const 오늘것 = 모두.filter((x) => String(x.gameDate || x.gameDateTime || '').replace(/-/g, '').startsWith(날.replace(/-/g, '')));
      const 앞선것 = 모두.filter((x) => !오늘것.includes(x));
      if (!오늘것.length) return { 못쟀다: '그 날 한국시리즈 경기를 못 찾았다' };
      return { 경기: 오늘것[0], 앞선것 };
    } finally { await page.close().catch(() => {}); b.disconnect(); }
  }

  console.log('■ 한국시리즈 지킴 — ' + 날 + ' · 2분마다 점수판을 읽는다');
  let 알린상태 = '';
  for (;;) {
    const r = await 읽는다().catch((e) => ({ 못쟀다: String(e && e.message).slice(0, 120) }));
    if (r.못쟀다) {
      console.log('⬜ ' + new Date().toLocaleTimeString('ko-KR') + ' — ' + r.못쟀다);
    } else {
      const 상태 = String(r.경기.statusInfo || r.경기.statusCode || '');
      if (상태 !== 알린상태) { console.log('   ' + new Date().toLocaleTimeString('ko-KR') + ' · ' + 한줄(r.경기)); 알린상태 = 상태; }
      if (끝났나(r.경기)) {
        const 차전 = 몇차전(r.앞선것);
        console.log('🔔 경기가 끝났다 — ' + (차전 ? 차전 + '차전 · ' : '') + 한줄(r.경기)
          + '  (앞서 치른 경기 ' + (r.앞선것 || []).filter((x) => 끝났나(x)).length + '게임)');
        if (안시킨다) break;
        const 지시길 = path.join(뿌리, 'docs', '지시-중부매일-' + 날.replace(/-/g, '') + '-KS' + (차전 || '') + '.txt');
        fs.writeFileSync(지시길, 지시문(날, 차전, r.경기), 'utf8');
        console.log('   지시문을 적었다 — ' + 지시길);
        /* ⚠ 09시 회차는 «매일» 도니 주말에도 대화가 있다. 평일 회차를 쓰면 토·일에 빈다 */
        const 돈것 = spawnSync(process.execPath,
          [path.join(뿌리, 'scripts', '시킨다-중부매일-기사.mjs'), '--회차', '09', '--글', 지시길],
          { encoding: 'utf8', timeout: 600000 });
        const 찍힌것 = String(돈것.stdout || '') + String(돈것.stderr || '');
        console.log(찍힌것.split('\n').filter((x) => x.trim()).slice(-6).join('\n'));
        const 대화 = (찍힌것.match(/https:\/\/claude\.ai\/chat\/[0-9a-f-]+/) || [])[0];
        if (!대화) { console.log('🔴 대화 주소를 못 집었다 — 손으로 거둔다'); break; }
        console.log('   다 쓸 때까지 기다린다…');
        const 받을곳 = path.join(뿌리, 'docs', '기사-중부매일-' + 날.replace(/-/g, '') + '-KS' + (차전 || '') + '-회차원고.txt');
        const 거둔것 = spawnSync(process.execPath,
          [path.join(뿌리, 'scripts', '받는다-중부매일-대화에서-기사.mjs'), '--대화', 대화, '--받는곳', 받을곳],
          { encoding: 'utf8', timeout: 900000 });
        console.log(String(거둔것.stdout || '').split('\n').filter((x) => x.trim()).slice(-4).join('\n'));
        if (fs.existsSync(받을곳)) {
          console.log('✅ 거뒀다 — ' + 받을곳 + ' (' + fs.statSync(받을곳).size + '바이트)');
          console.log('⭐ 5번은 이것을 데스킹해서 사장님께 보낸다. 이 자는 «보내지 않는다».');
        } else {
          console.log('🔴 못 거뒀다 — 대화를 손으로 연다: ' + 대화);
        }
        break;
      }
    }
    if (한번만) break;
    if (Date.now() > 끝낼때) { console.log('🔴 여섯 시간이 지나도록 안 끝났다 — 그만둔다. 손으로 본다'); break; }
    await new Promise((r2) => setTimeout(r2, 사이));
  }
}

export default { 끝났나, 한국시리즈경기인가, 지시문, 몇차전, 한줄, 인자, 두팀 };
