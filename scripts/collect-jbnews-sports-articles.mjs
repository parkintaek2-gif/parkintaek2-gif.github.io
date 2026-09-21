/* 중부매일 스포츠 자동기사 — 오늘 나온 회차를 «거둬» OneDrive 에 넣는다.
 *
 * 사장님: 「ondrive > 중부 스포츠보도 폴더에 저장하자」
 *
 * 🔴 왜 예약이 직접 저장하지 않고 여기서 거두나 (2026-09-21 실측)
 *   예약된 작업에 파일 저장을 시키면 Claude 가 그 작업을 «로컬 PC 에 묶는다».
 *   묶이면 ① 그 PC(회사 PC)가 꺼진 날은 그 회차가 통째로 비고
 *        ② 모델·권한 단추가 잠겨 Sonnet 5 로 못 바꾼다.
 *   그래서 예약은 기사만 쓰고, 늘 켜져 있는 이 서버가 대화를 읽어 저장한다.
 *
 * 쓰는 법  node 기사거두기.mjs            오늘 것을 거둔다
 *          node 기사거두기.mjs --시험      저장하지 않고 무엇을 거둘지만 본다
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');

const 둘곳 = 'C:\\Users\\User\\OneDrive\\중부 스포츠보도';
const 시험만 = process.argv.includes('--시험');

const 회차 = [
  ['09', 'trig_01GeyrdjqmGjtu3cCt6ynZHm'], ['10', 'trig_01QLALBiamUfmxWngeTULv12'],
  ['11', 'trig_01X5A3DCXwYi2T3bBosKTQnk'], ['12', 'trig_01L4CHPogx1YQCCASeDdDpYe'],
  ['13', 'trig_01RbRLHyxfzAausuMhwqT27F'], ['14', 'trig_01RgAwm6L1q4nBhanUgz3s8N'],
  ['15', 'trig_01EwjhZx3AKXuEyHK82N9DEn'], ['16', 'trig_01ErSZQm2VhuNYMRBi3MCufF'],
  ['17', 'trig_01J9heFLe6AvUJtgd6LXSxsN'],
];

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 오늘날짜(d = new Date()) {
  /* ⛔ toISOString() 금지 — UTC 라 새벽에 하루가 어긋난다. 이 PC 가 이미 KST 다 */
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/* 🔴 화면에서 긁은 글의 «머리»에는 기사가 아닌 것이 붙는다 —
   「Claude 응답: …」 · 「웹 검색됨」 · 「7페이지 읽음」 · 「알림 전송 완료」.
   기사는 «[중부매일 … 기자]» 줄에서 시작하고, 제목·부제목은 그 바로 위 연속된 줄이다.
   2026-09-21 에 이것을 안 걷어서 파일 이름이 「Claude 응답- Chuseok…」 이 됐다. */
export function 기사만(본문) {
  const 전 = String(본문 || '').replace(/\r/g, '');
  const 줄 = 전.split('\n');
  const i = 줄.findIndex((s) => /^\s*\[중부매일.*기자\]/.test(s));
  if (i < 0) return 전.trim();
  /* 기자명 줄 위의 «비지 않은 줄 최대 둘»이 제목·부제목이다.
     ⚠ 빈 줄로 경계를 찾으려 했더니 「알림 전송 완료」가 제목 덩이에 딸려 왔다 —
       도구 흔적과 제목 사이에 빈 줄이 늘 있지는 않다. 그래서 «개수»로 자른다. */
  const 머리 = [];
  for (let j = i - 1; j >= 0 && 머리.length < 2; j--) {
    const t = 줄[j].trim();
    if (!t) { if (머리.length) break; continue; }        /* 제목을 이미 잡았으면 빈 줄에서 멈춘다 */
    if (/^(웹 검색됨|명령 실행함|알림 전송 완료|[\d,]+페이지 읽음|Claude 응답)/.test(t)) break;
    if (/(웹 검색됨|명령 실행함|페이지 읽음)/.test(t)) break;
    머리.unshift(줄[j]);
  }
  return [...머리, '', ...줄.slice(i)].join('\n').trim();
}
export function 제목뽑기(본문) {
  const 줄 = 기사만(본문).split('\n').map((s) => s.trim()).filter(Boolean);
  for (const s of 줄) {
    const t = s.replace(/^#+\s*/, '').replace(/^\*+|\*+$/g, '').trim();
    if (!t || /^\[중부매일/.test(t)) continue;
    return t.replace(/^(제목|부제목)\s*[:：]\s*/, '').slice(0, 60);
  }
  return '제목없음';
}
export function 파일이름(날, 시, 제목) {
  /* 윈도에서 못 쓰는 글자를 걷어낸다 — \ / : * ? " < > | 그리고 줄바꿈 */
  const 깨끗 = String(제목).replace(/[\\/:*?"<>|\r\n]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 60);
  return `${날}_${시}시_${깨끗 || '제목없음'}.md`;
}
export function 기사인가(본문) {
  const t = String(본문 || '');
  if (t.length < 300) return false;                       /* 너무 짧으면 기사가 아니다 */
  if (/^주말이라 쉰다|^공휴일이라 쉰다/m.test(t.trim())) return false;
  return true;
}
if (process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, 참) => 잰다.push([이름, !!참]);
  본다('오늘날짜가 KST 로 나온다', 오늘날짜(new Date(2026, 8, 21)) === '2026-09-21');
  본다('자정 직후에도 그날이다', 오늘날짜(new Date(2026, 8, 21, 0, 5)) === '2026-09-21');
  본다('제목을 첫 줄에서 뽑는다', 제목뽑기('# 손흥민 1골 1도움\n\n[중부매일 박인택 기자]') === '손흥민 1골 1도움');
  본다('기자명 줄은 제목이 아니다', 제목뽑기('[중부매일 박인택 기자]\n손흥민 결승골 터졌다') === '손흥민 결승골 터졌다');
  본다('「제목:」 머리를 걷는다', 제목뽑기('제목: 손흥민 멀티골 폭발') === '손흥민 멀티골 폭발');
  본다('제목이 없으면 그렇다고 한다', 제목뽑기('') === '제목없음');
  /* 🔴 실제로 겪은 꼴 — 도구 흔적이 머리에 붙는다 */
  const 긁은것 = 'Claude 응답: Chuseok 2026 is Sep 24–26.\n웹 검색됨, 명령 실행함\n\n7페이지 읽음\n\n알림 전송 완료\n\n'
    + '손흥민, 왼발 감아차기 선제골 폭발\n애런 롱 퇴장 속 10명 버틴 LAFC\n\n[중부매일 박인택 기자]\n\n본문이 여기서 시작한다.';
  본다('도구 흔적을 걷어낸다', !기사만(긁은것).includes('Claude 응답'));
  본다('「웹 검색됨」도 걷어낸다', !기사만(긁은것).includes('웹 검색됨'));
  본다('「알림 전송 완료」도 걷어낸다', !기사만(긁은것).includes('알림 전송 완료'));
  본다('제목 줄부터 시작한다', 기사만(긁은것).startsWith('손흥민, 왼발 감아차기'));
  본다('부제목을 안 잃는다', 기사만(긁은것).includes('애런 롱 퇴장 속'));
  본다('본문을 안 잃는다', 기사만(긁은것).includes('본문이 여기서 시작한다'));
  본다('긁은 것에서 제목을 바로 뽑는다', 제목뽑기(긁은것) === '손흥민, 왼발 감아차기 선제골 폭발');
  본다('기자명 줄이 없으면 통째로 둔다', 기사만('제목\n\n본문') === '제목\n\n본문');
  /* 🔴 도구 흔적과 제목 사이에 «빈 줄이 없는» 꼴 — 실제로 이렇게 왔다 */
  const 빈줄없이 = '알림 전송 완료\n손흥민, 왼발 감아차기 선제골 폭발\n애런 롱 퇴장 속 10명 버틴 LAFC\n\n[중부매일 박인택 기자]\n\n본문.';
  본다('빈 줄이 없어도 흔적을 걷는다', !기사만(빈줄없이).includes('알림 전송 완료'));
  본다('빈 줄이 없어도 제목을 잡는다', 제목뽑기(빈줄없이) === '손흥민, 왼발 감아차기 선제골 폭발');
  본다('빈 줄이 없어도 부제목을 남긴다', 기사만(빈줄없이).includes('애런 롱 퇴장 속'));
  본다('제목이 셋이어도 둘만 가져온다', 기사만('가\n나\n다\n\n[중부매일 박인택 기자]\n\n본문.').startsWith('나'));
  본다('파일이름에 날짜와 시가 든다', 파일이름('2026-09-21', '09', '가나다라마') === '2026-09-21_09시_가나다라마.md');
  본다('못 쓰는 글자를 갈아 끼운다', !/[\\/:*?"<>|]/.test(파일이름('2026-09-21', '09', 'a/b:c*d?e"f<g>h|i')));
  본다('줄바꿈도 갈아 끼운다', !/\n/.test(파일이름('2026-09-21', '09', '가나\n다라')));
  본다('제목이 비면 제목없음', 파일이름('2026-09-21', '09', '   ') === '2026-09-21_09시_제목없음.md');
  본다('짧은 글은 기사가 아니다', 기사인가('짧다') === false);
  본다('주말 회차는 기사가 아니다', 기사인가('주말이라 쉰다\n' + 'ㅇ'.repeat(400)) === false);
  본다('긴 글은 기사다', 기사인가('ㅇ'.repeat(400)) === true);
  본다('빈 글은 기사가 아니다', 기사인가('') === false);
  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ ${잰다.length}가지 모두 통과`);
  process.exit(진.length ? 1 : 0);
}
/* ─────────────────────────────────────────────────────────── */

const 날 = 오늘날짜();
if (!시험만) fs.mkdirSync(둘곳, { recursive: true });

const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await b.newPage();
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
let 거둠 = 0, 건너 = 0, 없음 = 0;
try {
  await page.setViewport({ width: 1500, height: 1200 });
  for (const [시, trig] of 회차) {
    await page.goto(`https://claude.ai/scheduled-task/${trig}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    for (let i = 0; i < 20; i++) { await 잠깐(2000); if (await page.evaluate(() => /지금 실행/.test(document.body.innerText))) break; }
    await 잠깐(2000);

    /* 「기록」의 «맨 위»(가장 새 회차)를 누른다 */
    const 자리 = await page.evaluate(() => {
      const 다 = [...document.querySelectorAll('*')].filter((e) => /오늘 오전|오늘 오후|수동/.test(e.textContent || ''));
      const 안쪽 = 다.filter((e) => ![...e.children].some((c) => /오늘 오전|오늘 오후|수동/.test(c.textContent || '')));
      if (!안쪽.length) return null;
      /* 화면에서 가장 위에 있는 것이 가장 새 회차다 */
      const e = 안쪽.map((x) => ({ x, r: x.getBoundingClientRect() })).filter((s) => s.r.width > 0)
        .sort((a, z) => a.r.y - z.r.y)[0];
      if (!e) return null;
      e.x.scrollIntoView({ block: 'center' });
      const r = e.x.getBoundingClientRect();
      return { 글: e.x.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (!자리) { console.log(`  ${시}시 ⬜ 오늘 회차 없음`); 없음++; continue; }

    const 앞 = page.url();
    await page.mouse.click(자리.x, 자리.y);
    await 잠깐(9000);
    if (page.url() === 앞) { console.log(`  ${시}시 🔴 회차 대화가 안 열렸다 (${자리.글})`); 없음++; continue; }
    for (let i = 0; i < 20; i++) { await 잠깐(2500); if (await page.evaluate(() => document.querySelectorAll('[data-testid="assistant-message"]').length > 0)) break; }
    await 잠깐(3000);

    const 본문 = await page.evaluate(() => {
      const n = [...document.querySelectorAll('[data-testid="assistant-message"]')];
      return n.length ? n[n.length - 1].innerText : '';
    });
    if (!기사인가(본문)) { console.log(`  ${시}시 ⬜ 기사가 아니다 (${본문.length}자)`); 없음++; continue; }

    const 이름 = 파일이름(날, 시, 제목뽑기(본문));
    const 길 = path.join(둘곳, 이름);
    if (fs.existsSync(길)) { console.log(`  ${시}시 ⏭ 이미 있다 — ${이름}`); 건너++; continue; }
    if (시험만) { console.log(`  ${시}시 🔎 거둘 것 — ${이름} (${본문.length}자)`); 거둠++; continue; }
    fs.writeFileSync(길, 기사만(본문), 'utf8');
    거둠++;
    console.log(`  ${시}시 ✅ ${이름} (${본문.length}자)`);
  }
  console.log(`\n■ 거둠 ${거둠} · 이미 있음 ${건너} · 없음 ${없음}`);
  if (!시험만) console.log('■ 둔 곳 ' + 둘곳);
} finally { try { await page.close(); } catch {} b.disconnect(); }
