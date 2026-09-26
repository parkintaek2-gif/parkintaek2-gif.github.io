#!/usr/bin/env node
/**
 * run-jbnews-sports-slot.mjs — 스포츠 회차 하나를 «손으로» 돌리고, 다 써지면 거둬 보낸다.
 *
 * ── 🔴 왜 이것이 필요한가 (2026-09-26 14:0x) ─────────────────────────
 * 사장님: 「**노트북 팝업 관련, e스포츠 기사 메일 못받음**」
 *
 * 사장님이 「휴일인 오늘은 아시안게임 종합, e스포츠 1건 등 2건만」이라고 하셔서
 * 나는 09시·10시 두 회차의 «지시문»을 고쳤다. 그런데 메일이 한 통만 갔다.
 *
 * 까닭 — **10시 예약은 «평일만» 도는 일정이다.**
 *   예약 화면이 그대로 말하고 있었다. 「다음 실행: 9월 28일 오전 10:00」·
 *   마지막 기록 「어제 오전 10:10」. 토요일인 그날은 아예 실행되지 않았다.
 *
 * ⛔ **「지시문을 고쳤다」를 「그 회차가 돈다」로 세지 않는다.**
 *   지시문은 «도는 회차»에만 닿는다. 안 도는 회차의 지시문은 아무 일도 하지 않는다.
 *   회차를 하루만 옮기거나 쉬는 날에 시키려면 «일정»을 먼저 재야 한다.
 *
 * ⛔ 그렇다고 예약 일정을 주말 포함으로 바꾸지 않는다 — 이번 지시는 이틀뿐이고,
 *   일정을 건드리면 그 뒤의 모든 주말에 원치 않는 회차가 돈다. 이틀만 손으로 돌린다.
 *
 * ── 하는 일 ──────────────────────────────────────────────────────
 *   ① 그 회차의 예약 화면을 열어 「지금 실행」을 누른다
 *   ② 다 써질 때까지 기다린다 (기본 12분, 30초마다 본다)
 *   ③ 수집기를 불러 거두고 보낸다 — 보내는 규칙(17시 마감·되풀이 막기)은 그쪽 것을 쓴다
 *
 * 쓰는 법
 *   node scripts/run-jbnews-sports-slot.mjs --회차=10
 *   node scripts/run-jbnews-sports-slot.mjs --slot=10 --wait=15   ← 영문 별칭
 *   node scripts/run-jbnews-sports-slot.mjs --selftest
 *
 * 🔴 **영문 별칭이 정본이다 — 윈도 예약에 거는 것은 반드시 `--slot`.**
 *   한글 인자는 작업 스케줄러를 거치며 CP949 로 깨져 «이름이 다른 인자»가 된다.
 *   그러면 자는 그것을 모르는 인자로 보고 아무 일도 안 하면서 **exit 0** 을 낸다.
 *   조용히 성공한 척하는 것이 제일 나쁘다 — 2026-09-24 에 같은 것을 겪었다.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 온회차, 열여덟시회차, 그만둔회차 } from './collect-jbnews-sports-articles.mjs';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

/** 회차 번호로 예약 번호를 찾는다. ⛔ 표를 여기에 다시 적지 않는다 — 수집기 것이 정본이다. */
export function 예약번호(시, 표 = [...온회차, 열여덟시회차, ...그만둔회차]) {
  const 짝 = (표 ?? []).find(([s]) => String(s) === String(시).padStart(2, '0'));
  return 짝 ? 짝[1] : null;
}

/** 「실행 중」·「생각 중」이 남아 있으면 아직 안 끝난 것이다 */
export function 아직도는가(글) {
  return /실행 중|생각 중|매끄럽게 하는 중|초\s*$/.test(String(글 ?? ''));
}

/** 답이 기사인가 — 길이로 1차만 가른다. 참된 판정은 수집기의 `기사인가()` 가 한다 */
export function 쓸만한길이인가(글, 문턱 = 300) {
  return String(글 ?? '').replace(/\s/g, '').length >= 문턱;
}

const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));

async function 돌린다(시, 기다림분) {
  const trig = 예약번호(시);
  if (!trig) { console.log(`🔴 ${시}시 — 예약 번호를 못 찾았다`); process.exit(1); }

  const { createRequire } = await import('node:module');
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');

  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await b.newPage();
  try {
    await page.goto(`https://claude.ai/scheduled-task/${trig}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await 잠깐(9000);

    const 눌렀나 = await page.evaluate(() => {
      const t = [...document.querySelectorAll('button')].find((e) => /지금 실행/.test(e.textContent || ''));
      if (!t) return false;
      t.click();
      return true;
    });
    if (!눌렀나) { console.log(`🔴 ${시}시 — 「지금 실행」 단추를 못 찾았다`); process.exit(1); }
    console.log(`✅ ${시}시 — 「지금 실행」을 눌렀다`);

    /* 다 써질 때까지 본다 — 30초마다 */
    const 끝 = Date.now() + 기다림분 * 60_000;
    let 마지막 = '';
    while (Date.now() < 끝) {
      await 잠깐(30_000);
      마지막 = await page.evaluate(() => {
        const n = [...document.querySelectorAll('[data-testid="assistant-message"]')];
        return n.length ? n[n.length - 1].innerText : '';
      });
      const 남 = Math.round((끝 - Date.now()) / 60_000);
      if (!아직도는가(마지막) && 쓸만한길이인가(마지막)) {
        console.log(`✅ ${시}시 — 다 썼다 (${마지막.length}자)`);
        break;
      }
      console.log(`   … 아직 쓰는 중 (${마지막.length}자 · 남은 시간 ${남}분)`);
    }
    if (아직도는가(마지막) || !쓸만한길이인가(마지막)) {
      console.log(`🟡 ${시}시 — 기다린 시간 안에 안 끝났다. 수집기는 그래도 한 번 불러 본다`);
    }
  } finally {
    await page.close();
    b.disconnect();
  }

  /* 거두고 보내는 규칙은 수집기가 쥔다 — 여기에 다시 적지 않는다 */
  console.log('■ 거두러 간다');
  const r = spawnSync(process.execPath, [path.join(뿌리, 'scripts', 'collect-jbnews-sports-articles.mjs')],
    { cwd: 뿌리, stdio: 'inherit' });
  process.exit(r.status ?? 0);
}

function 자가시험() {
  let 통과 = 0; let 탈 = 0;
  const 검 = (이름, 참) => { if (참) { 통과++; console.log('✅', 이름); } else { 탈++; console.log('🔴', 이름); } };

  검('10시 예약 번호를 찾는다', /^trig_/.test(예약번호('10') ?? ''));
  검('한 자리 수도 찾는다', 예약번호('9') === 예약번호('09'));
  검('없는 회차는 null', 예약번호('03') === null);
  검('⛔ null 표에도 안 터진다', 예약번호('10', null) === null);
  검('18시도 찾는다', /^trig_/.test(예약번호('18') ?? ''));
  검('그만둔 17시도 찾는다 — 되살릴 때 필요하다', /^trig_/.test(예약번호('17') ?? ''));

  검('「실행 중」은 아직 도는 것', 아직도는가('실행 중'));
  검('「Claude가 생각 중입니다」도 마찬가지', 아직도는가('Claude가 생각 중입니다'));
  검('🔴 겪은 그 화면 — 「매끄럽게 하는 중 / 2분 34초 / 실행 중」', 아직도는가('매끄럽게 하는 중\n2분 34초\n실행 중'));
  검('다 쓴 기사는 도는 것이 아니다', !아직도는가('[e스포츠] T1, 젠지 꺾고 결승 진출'));
  검('⛔ 빈 글·null 에도 안 터진다', !아직도는가('') && !아직도는가(null));

  검('300자 넘으면 쓸만하다', 쓸만한길이인가('가'.repeat(400)));
  검('🔴 49자짜리는 기사가 아니다 — 그날 실제로 이것이 왔다', !쓸만한길이인가('매끄럽게 하는 중 2분 34초 실행 중'));
  검('⛔ 빈 글·null 에도 안 터진다', !쓸만한길이인가('') && !쓸만한길이인가(null));
  검('공백은 안 센다', !쓸만한길이인가(' '.repeat(500)));

  검('🔴 영문 별칭을 받는다 — 윈도 예약이 쓰는 것이 이것이다', 값집기(['--slot=10'], ['slot', '회차']) === '10');
  검('한글 이름도 그대로 받는다', 값집기(['--회차=10'], ['slot', '회차']) === '10');
  검('기다림도 둘 다 받는다',
    값집기(['--wait=15'], ['wait', '기다림']) === '15' && 값집기(['--기다림=15'], ['wait', '기다림']) === '15');
  검('없으면 null — 기본값으로 떨어진다', 값집기(['--다른것=3'], ['slot', '회차']) === null);
  검('⛔ 빈 인자·null 에도 안 터진다', 값집기([], ['slot']) === null && 값집기(null, ['slot']) === null);
  검('⛔ 비슷한 이름에 안 걸린다', 값집기(['--slots=10'], ['slot']) === null);

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통과} 통과`);
  process.exit(탈 ? 1 : 0);
}

/** 인자에서 값을 집는다 — 한글 이름과 영문 별칭 둘 다 받는다 */
export function 값집기(인자, 이름들) {
  for (const n of 이름들) {
    const 것 = (인자 ?? []).find((a) => String(a).startsWith(`--${n}=`));
    if (것) return String(것).slice(n.length + 3);
  }
  return null;
}

const 인자 = process.argv.slice(2);
if (인자.includes('--selftest') || 인자.includes('--자가시험')) 자가시험();
else {
  const 시 = 값집기(인자, ['slot', '회차']);
  const 분 = Number(값집기(인자, ['wait', '기다림'])) || 12;
  if (!시) { console.log('쓰는 법: node scripts/run-jbnews-sports-slot.mjs --slot=10'); process.exit(1); }
  await 돌린다(시, 분);
}
