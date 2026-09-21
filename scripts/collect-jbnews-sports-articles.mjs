/* 중부매일 스포츠 자동기사 — 오늘 나온 회차를 «거둬» 사장님께 **메일로 보낸다.**
 *
 * 🔴 [2026-09-21 바뀜] 사장님 지시 —
 *   「스포츠기사 자동발행되면 나한테 메일로 보내는 걸로 하자. **원드라이브에 저장하지는 말고.**
 *    메일주소는 **언제든 바꿀 수 있게** 해놓고. parkintaek@naver.com 으로 일단」
 *
 *   ⇒ 그 전에는 `C:\Users\User\OneDrive\중부 스포츠보도` 에 .md 로 넣었다. 그것을 걷었다.
 *   ⇒ 받는 주소는 **`docs/중부매일-스포츠-받는곳.txt` 맨 윗줄**에 있다.
 *     코드를 안 고치고 그 한 줄만 바꾸면 받는 곳이 바뀐다.
 *
 * 🔴 왜 예약이 직접 보내지 않고 여기서 거두나 (2026-09-21 실측)
 *   예약된 작업에 파일 저장·외부 호출을 시키면 Claude 가 그 작업을 «로컬 PC 에 묶는다».
 *   묶이면 ① 그 PC(회사 PC)가 꺼진 날은 그 회차가 통째로 비고
 *        ② 모델·권한 단추가 잠겨 Sonnet 5 로 못 바꾼다.
 *   그래서 예약은 기사만 쓰고, 늘 켜져 있는 이 서버가 대화를 읽어 보낸다.
 *
 * 쓰는 법  node scripts/collect-jbnews-sports-articles.mjs          오늘 것을 거둬 보낸다
 *          node scripts/collect-jbnews-sports-articles.mjs --시험    안 보내고 무엇을 보낼지만 본다
 *          node scripts/collect-jbnews-sports-articles.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 받는곳파일 = path.join(뿌리, 'docs', '중부매일-스포츠-받는곳.txt');
/* 이미 보낸 것을 두 번 안 보내려고 «보낸 자국»만 남긴다 — 기사 본문은 안 쌓는다 */
const 자국방 = path.join(뿌리, 'docs', '고정업무-마커', '중부매일-스포츠-보낸자국');
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
/**
 * 받는 곳을 읽는다 — **파일 한 줄**이 정본이다.
 *
 * 🔴 왜 파일인가 — 사장님이 「메일주소는 언제든 바꿀 수 있게 해놓고」라고 하셨다.
 *   코드 안에 박아 두면 바꿀 때마다 나를 불러야 한다. 파일이면 그 줄만 고치면 된다.
 * ⛔ 못 읽으면 **안 보낸다.** 기본 주소로 몰래 보내지 않는다 —
 *   받는 곳이 바뀐 줄 모르고 옛 주소로 나가는 것이 제일 나쁘다.
 */
export function 받는곳읽기(글) {
  if (글 == null) return null;
  const 것 = String(글).split('\n')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('#'))
    .flatMap((s) => s.split(','))
    .map((s) => s.trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  return 것.length ? [...new Set(것)] : null;
}

/**
 * 메일 제목 — **맨 앞에 `[스포츠]`**.
 * 사장님 (2026-09-21): 「메일 제목에 [스포츠]라고 앞에 넣어줘」
 * ⇒ 사장님 편지함에서 한눈에 갈라 보이게 하는 것이 이 표의 일이다.
 */
export function 메일제목(날, 시, 제목) {
  const 깨끗 = String(제목 || '제목없음').replace(/[\r\n\t]+/g, ' ').trim() || '제목없음';
  return `[스포츠] ${날} ${시}시 — ${깨끗}`;
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

  /* 🔴 [2026-09-21] 사장님 — 「메일 제목에 [스포츠]라고 앞에 넣어줘」 */
  본다('⭐ 제목 «맨 앞»에 [스포츠] 가 붙는다', 메일제목('2026-09-21', '09', '손흥민 결승골').startsWith('[스포츠] '));
  본다('날짜와 시가 든다', 메일제목('2026-09-21', '09', '가').includes('2026-09-21 09시'));
  본다('기사 제목이 그대로 든다', 메일제목('2026-09-21', '09', '손흥민 결승골').includes('손흥민 결승골'));
  본다('제목에 줄바꿈이 없다', !/[\r\n]/.test(메일제목('2026-09-21', '09', '가나\n다라')));
  본다('제목이 비면 제목없음', 메일제목('2026-09-21', '09', '  ').endsWith('제목없음'));

  /* 🔴 [2026-09-21] 사장님 — 「메일주소는 언제든 바꿀 수 있게 해놓고」 */
  본다('받는 곳을 첫 줄에서 읽는다',
    받는곳읽기('parkintaek@naver.com\n# 주석').join() === 'parkintaek@naver.com');
  본다('주석 줄은 셈에서 뺀다', 받는곳읽기('# a@b.com\nc@d.com').join() === 'c@d.com');
  본다('빈 줄도 뺀다', 받는곳읽기('\n\nc@d.com\n\n').join() === 'c@d.com');
  본다('쉼표로 여럿을 받는다', 받는곳읽기('a@b.com, c@d.com').length === 2);
  본다('줄을 나눠서도 여럿을 받는다', 받는곳읽기('a@b.com\nc@d.com').length === 2);
  본다('같은 주소가 두 번 있으면 하나로', 받는곳읽기('a@b.com\na@b.com').length === 1);
  본다('⛔ 주소가 없으면 null — 기본값으로 몰래 보내지 않는다', 받는곳읽기('# 주석만 있다') === null);
  본다('⛔ 파일을 못 읽으면 null', 받는곳읽기(null) === null);
  본다('⛔ 메일 꼴이 아닌 글은 주소가 아니다', 받는곳읽기('나한테 보내줘') === null);

  /* 🔴 [2026-09-22] 「다음 실행: 오늘 오전 9:00」을 기록 줄로 오인해 아홉 회차가 다 헛돌았다 */
  const 회차꼴 = (t) => /오늘 오전|오늘 오후|수동/.test(t) && !/다음 실행|예정|반복/.test(t);
  본다('⭐ 「다음 실행: 오늘 오전 9:00」은 기록이 아니다', 회차꼴('다음 실행: 오늘 오전 9:00') === false);
  본다('「오늘 오전 9:03 · 자동」은 기록이다', 회차꼴('오늘 오전 9:03 · 자동') === true);
  본다('「오늘 오후 6:15 · 수동」도 기록이다', 회차꼴('오늘 오후 6:15 · 수동') === true);
  본다('「반복 평일 오전 9:00」은 기록이 아니다', 회차꼴('반복 평일 오전 9:00') === false);
  본다('상관없는 글은 기록이 아니다', 회차꼴('지침') === false);
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

/* 받는 곳 — 파일 한 줄이 정본이다. ⛔ 못 읽으면 «안 보낸다» */
let 받는곳 = null;
try { 받는곳 = 받는곳읽기(fs.readFileSync(받는곳파일, 'utf8')); } catch { /* 아래에서 잡는다 */ }
if (!받는곳) {
  console.error(`🔴 받는 곳을 못 읽었다 — ${path.relative(뿌리, 받는곳파일)} 맨 윗줄에 메일 주소를 적는다.`);
  console.error('⛔ 옛 주소로 몰래 보내지 않는다. 받는 곳이 바뀐 줄 모르고 나가는 것이 제일 나쁘다.');
  process.exit(2);
}
console.log('■ 받는 곳 :', 받는곳.join(' · '));
if (!시험만) fs.mkdirSync(자국방, { recursive: true });

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

    /* 「기록」의 «맨 위»(가장 새 회차)를 누른다.
       🔴 [2026-09-22] **「다음 실행: 오늘 오전 9:00」을 기록 줄로 오인했다.**
         그 줄에도 「오늘 오전」이 들어 있다. 날이 바뀌어 오늘 회차가 «아직 없을 때»
         비로소 드러났다 — 어제는 기록 줄이 위에 있어 우연히 가려져 있었다.
       ⛔ 「다음 실행」·「예정」이 든 줄은 «앞으로 할 일»이지 «한 일»이 아니다. */
    const 자리 = await page.evaluate(() => {
      const 회차꼴 = (t) => /오늘 오전|오늘 오후|수동/.test(t) && !/다음 실행|예정|반복/.test(t);
      const 다 = [...document.querySelectorAll('*')].filter((e) => 회차꼴(e.textContent || ''));
      const 안쪽 = 다.filter((e) => ![...e.children].some((c) => 회차꼴(c.textContent || '')));
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

    const 제목 = 제목뽑기(본문);
    const 자국 = path.join(자국방, `${날}_${시}시.txt`);
    if (fs.existsSync(자국)) { console.log(`  ${시}시 ⏭ 이미 보냈다`); 건너++; continue; }
    if (시험만) { console.log(`  ${시}시 🔎 보낼 것 — ${메일제목(날, 시, 제목)} (${본문.length}자)`); 거둠++; continue; }

    /* 기사 전문을 임시 파일로 두고 send-mail 에 넘긴다 —
       ⛔ 셸 명령줄에 본문을 그대로 올리지 않는다. 백틱·따옴표가 셸에 먹힌 전례가 있다. */
    const 임시 = path.join(자국방, `_보낼글-${시}.txt`);
    fs.writeFileSync(임시, 기사만(본문), 'utf8');
    try {
      execFileSync('node', [path.join(뿌리, 'scripts', 'send-mail.mjs'),
        `--받는곳=${받는곳.join(',')}`, `--제목=${메일제목(날, 시, 제목)}`, `--글=${임시}`, '--보낸다'],
      { cwd: 뿌리, encoding: 'utf8', stdio: 'pipe' });
      fs.writeFileSync(자국, `${new Date().toLocaleString('ko-KR')}\n${메일제목(날, 시, 제목)}\n받는곳 ${받는곳.join(' · ')}\n`, 'utf8');
      거둠++;
      console.log(`  ${시}시 📮 보냈다 — ${제목.slice(0, 50)}`);
    } catch (e) {
      console.log(`  ${시}시 🔴 못 보냈다 — ${String(e?.message ?? e).slice(0, 120)}`);
      없음++;
    } finally { try { fs.rmSync(임시, { force: true }); } catch { /* 넘어간다 */ } }
  }
  console.log(`\n■ 보냄 ${거둠} · 이미 보냄 ${건너} · 없거나 실패 ${없음}`);
  if (!시험만) console.log('■ 받는 곳 ' + 받는곳.join(' · ') + `  (바꾸려면 ${path.relative(뿌리, 받는곳파일)} 맨 윗줄)`);
} finally { try { await page.close(); } catch {} b.disconnect(); }
