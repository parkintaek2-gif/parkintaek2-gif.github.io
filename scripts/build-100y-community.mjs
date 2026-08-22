#!/usr/bin/env node
/**
 * **커뮤니티 첫 화면 한 장을 만든다** — `public/100y/community.html`
 *
 * 🔴 2번 지시(8/21 08:2x): 「5번 것을 **베끼십시오. 새로 짜지 마십시오**」
 *    사장님 「케이컬쳐가 잘 만들어야 다른 유닛이 시간과 노력을 아끼고 **그대로 쓰지**」
 *    ⇒ 5번의 `scripts/build-kcw-community.mjs` 틀·CSS·짜임을 **그대로** 가져왔다.
 *      내가 여기서 새로 디자인하면 본을 만든 뜻이 없어진다.
 *
 * ⛔ 다른 것은 딱 하나 — **방을 무엇으로 가르나**.
 *    5번은 스타(띠)로 갈랐다. ⛔ **백년지도는 스타를 안 다룬다**(사장님 8/21).
 *    ⇒ **나이·처지**로 가른다. 3번이 밤새 낸 문들이 그대로 방이 된다.
 *
 * ── ⛔ 이 자가 지키는 것 (5번 본의 규칙을 그대로 따른다) ────────
 * ⛔ **방 이름·수를 지어내지 않는다.** 각 지면의 자료 json 에서 읽는다
 * ⛔ **줄 세운 목록을 안 만든다.** 2번 확인 항목이다
 * ⛔ **단추가 아무 데도 안 간다.** 서버가 없다. 없는 것을 있는 척하지 않는다
 * ⭐ 다만 **그 나이의 지면으로 가는 길**은 진짜로 건다 — 그건 있는 것이다
 *
 * 쓰는 법
 *   node scripts/build-100y-community.mjs
 *   node scripts/build-100y-community.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
/* ⭐ 방 안에 실린 수는 «방을 짓는 자»에게 물어 온다 — 두 벌로 적으면 갈라진다 */
import { 모으기 } from './build-100y-room-0to5.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 낼길 = path.join(뿌리, 'public', '100y', 'community.html');
const 자료방 = path.join(뿌리, 'src', 'data', '100yearmap');
const 읽기 = (이름) => JSON.parse(fs.readFileSync(path.join(자료방, 이름), 'utf8'));

/** ⛔ 단추는 아무 데도 안 간다 — 서버가 없다 */
export const 단추말 = '이 방에 들어가기';

/**
 * 방 — **나이·처지**로 가른다. 수는 그 지면의 자료에서 읽는다.
 * ⛔ 방을 지어내지 않는다. 지면이 있는 자리만 방이 된다.
 */
/** 「0~5세」 방에 실린 것이 몇 개인가 — ⛔ 방을 짓는 자에게 물어 온다. 손으로 안 박는다 */
function 실린것() {
  return 모으기().실린것;
}

export function 방들() {
  const 어린이집 = 읽기('nursery-none.json');
  const 유치원 = 읽기('kindergarten.json');
  const 소아과 = 읽기('pediatrics.json');
  const 방과후 = 읽기('afterschool.json');
  const 첫일 = 읽기('first-job.json');
  const 직장 = 읽기('longest-job.json');
  const 계속일 = 읽기('keep-working.json');
  const 남은해 = 읽기('years-left.json');
  const 혼인 = 읽기('marriage-age.json');
  const 돌봄 = 읽기('care.json');
  const 아침 = 읽기('breakfast.json');
  const 집 = 읽기('home.json');
  const 지출 = 읽기('spending.json');
  const 반려동물 = 읽기('pets.json');
  const 여행 = 읽기('travel.json');
  const 승진 = 읽기('promotion.json');
  const 운동 = 읽기('exercise.json');
  const 혼자 = 읽기('oneperson.json');

  return [
    {
      나이: '0~5세', 이름: '아이를 맡길 데를 찾는 사람',
      수: `어린이집이 한 곳도 없는 지역 ${어린이집.해별[어린이집.최신].전국}곳`,
      곁말: `유치원은 전국 ${유치원.전국.곳.toLocaleString()}곳`,
      지면: '/nursery', 지면말: '어린이집이 없는 지역 보기',
      /* ⭐ 2번 10:2x — 「한 방을 골라 그 «안»을 채우십시오」. 이 방만 안이 있다.
         ⛔ 실린 수를 손으로 안 박는다. 방을 짓는 자에게 물어 온다 */
      방: '/community/0to5', 실린것: 실린것(),
    },
    {
      나이: '아플 때', 이름: '밤에 아이가 열이 난 사람',
      수: `소아청소년과 «의원»이 없는 시·군·구 ${소아과.없는곳수}곳`,
      곁말: `그중 ${소아과.병원급.아예없는곳}곳은 병원급도 없습니다`,
      지면: '/pediatrics', 지면말: '어디에 없는지 보기',
    },
    {
      나이: '6~9세', 이름: '학교가 한 시에 끝나는 아이의 부모',
      수: `초등 방과후 참여율 ${(방과후.학교급[0]).참여율}%`,
      곁말: `읍면이 ${(방과후.지역[4]).참여율}%로 대도시보다 높습니다`,
      지면: '/afterschool', 지면말: '참여율 보기',
    },
    {
      나이: '10대', 이름: '아침을 거르는 아이의 부모',
      수: `10~18세 ${아침.열대.몫}%가 어제 아침을 걸렀다`,
      곁말: `⛔ 맨 위 칸은 10대가 아닙니다 — ${아침.가장많이거르는칸.칸} ${아침.가장많이거르는칸.몫}%`,
      지면: '/breakfast', 지면말: '나이칸마다 몇 %인지 보기',
    },
    {
      나이: '20대', 이름: '첫 일자리를 기다리는 사람',
      수: `졸업 뒤 첫 취업까지 평균 ${첫일.평균소요}개월`,
      곁말: `3년 넘게 걸린 사람도 ${첫일.걸린.find((r) => r.칸 === '3년 이상').몫}% 있습니다`,
      지면: '/first-job', 지면말: '얼마 만에 들어갔나 보기',
    },
    {
      나이: '30대', 이름: '아직 결혼하지 않은 사람',
      수: `30~34세 가운데 아직 미혼 ${혼인.서른칸.전체.미혼몫}%`,
      곁말: `같은 해 평균 초혼은 ${혼인.초혼.끝.남편}세 — 재는 것이 다릅니다`,
      지면: '/marriage-age', 지면말: '나이칸마다 몇 %인지 보기',
    },
    {
      나이: '40~50대', 이름: '집을 가진 나이를 세어 보는 사람',
      수: `집을 가진 가구의 ${집.가장많은칸.몫}%가 ${집.가장많은칸.칸}`,
      곁말: `⛔ 소유율이 아닙니다 — 집을 가진 가구를 나이로 가른 몫입니다`,
      지면: '/home', 지면말: '나이대마다 몇 %인지 보기',
    },
    {
      나이: '40대', 이름: '한 달 돈이 어디로 가는지 보는 사람',
      수: `가구주 40대 가구의 한 달 소비지출 ${Math.round(지출.마흔.소비지출 / 1000) / 10}만원`,
      곁말: `그중 교육이 ${지출.마흔항목.find((r) => r.항목 === '교육').몫}% — 40대에서만 솟아 있습니다`,
      지면: '/spending', 지면말: '열두 항목으로 보기',
    },
    {
      나이: '50대', 이름: '오래 다닌 곳을 그만둔 사람',
      수: `그만둔 나이 평균 ${직장.넓게.나이.평균}세`,
      곁말: `까닭 맨 위는 사업 부진·휴업·폐업 ${직장.넓게.까닭.까닭별[0].몫}%`,
      지면: '/longest-job', 지면말: '왜 그만두었나 보기',
    },
    {
      나이: '55~79세', 이름: '그만두고도 계속 일하고 싶은 사람',
      수: `${계속일.원함몫}%가 앞으로도 일하고 싶다`,
      곁말: `까닭 맨 위는 ${계속일.까닭[0].까닭}`,
      지면: '/keep-working', 지면말: '까닭 보기',
    },
    {
      나이: '65세~', 이름: '돌봄이 필요해진 부모를 둔 사람',
      수: `85세 이상 ${돌봄.나이별.find((r) => r.칸 === '85세이상').몫}%가 장기요양 인정`,
      곁말: `65~69세는 ${돌봄.나이별.find((r) => r.칸 === '65~69세').몫}% — 나이칸마다 아주 다릅니다`,
      지면: '/care', 지면말: '나이칸마다 몇 %인지 보기',
    },
    {
      나이: '0~100세', 이름: '남은 해를 세어 보는 사람',
      수: `갓 태어난 아이에게 ${남은해.나이별.find((r) => r.나이 === 0).전체}년`,
      곁말: '0세부터 100세까지 한 살씩 있습니다',
      지면: '/years-left', 지면말: '내 나이로 찾기',
    },
    {
      나이: '전 연령', 이름: '반려동물을 기르는(또는 기를까 하는) 사람',
      수: `지금 기르는 가구 ${반려동물.전체.양육몫}%`,
      곁말: `기르는 가구 안에서는 나이대로 개·고양이 비중이 갈립니다`,
      지면: '/pets', 지면말: '나이대별로 보기',
    },
    {
      나이: '전 연령', 이름: '1년에 여행을 며칠이나 가는지 궁금한 사람',
      수: `1인 평균 국내여행 ${여행.최신칸.국내전체}일`,
      곁말: `${여행.가장많은연령.칸}가 가장 많고, 코로나 전 평균엔 아직 못 미칩니다`,
      지면: '/travel', 지면말: '나이대별로 보기',
    },
    {
      나이: '직장인', 이름: '승진 앞둔 사람',
      수: `임원급 성별 만족도 차 ${승진.맨위차.맨위}점`,
      곁말: '다른 직급(최대 ' + 승진.맨위차.나머지최대 + '점)보다 뚜렷이 큽니다',
      지면: '/promotion', 지면말: '직급별로 보기',
    },
    {
      나이: '전 연령', 이름: '운동·동호회로 몸을 움직이는 사람',
      수: `${운동.동호회최고.최고칸} 동호회 참여 ${운동.동호회최고.최고값}%로 가장 높습니다`,
      곁말: '나이 들수록 계속 오르지는 않습니다 — 70세 이상은 20대보다도 낮습니다',
      지면: '/exercise', 지면말: '나이대별로 보기',
    },
    {
      나이: '전 연령', 이름: '혼자 사는 사람',
      수: `${혼자['⭐ 40대가 움푹 꺼진다'].최고칸.칸} ${혼자['⭐ 40대가 움푹 꺼진다'].최고칸.비중}%로 가장 많습니다`,
      곁말: `${혼자['⭐ 40대가 움푹 꺼진다'].최저칸.칸}이 오히려 가장 적습니다(${혼자['⭐ 40대가 움푹 꺼진다'].최저칸.비중}%)`,
      지면: '/oneperson', 지면말: '나이대별로 보기',
    },
  ];
}

export function 판짓기(방) {
  const 칸 = 방.map((r) => `      <article class="room">
        <p class="sign">${r.나이}</p>
        <h2>${r.이름}</h2>
        <p class="born">${r.수}</p>
        <p class="also">${r.곁말}</p>
        <p class="count"><a href="${r.지면}">${r.지면말} →</a></p>
${r.방
    /* ⭐ 안이 채워진 방만 진짜로 들어가진다. 나머지는 그대로 눌리지 않는다 —
       빈 방을 열어 놓는 것이 「없는 것을 있는 척」이다(2번 10:2x) */
    ? `        <a class="cta live" href="${r.방}">${단추말} · ${r.실린것}개</a>`
    : `        <button class="cta" disabled aria-disabled="true">${단추말}</button>`}
      </article>`).join('\n');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>나이로 나눈 방 &mdash; 백년지도 커뮤니티</title>
<meta name="description" content="백년지도 커뮤니티 첫 본. 방을 나이와 처지로 나눴습니다 — 0~5세 아이를 맡길 데를 찾는 사람부터, 오래 다닌 곳을 그만둔 사람까지.">
<meta name="robots" content="noindex">
<style>
  :root{ --ink:#14161a; --ink-2:#5b6270; --line:#e6e8ec; --bg:#fbfbfc; --card:#fff;
         --accent:#b4472a; --accent-soft:#fdf3f0; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216; --card:#181b21;
    --accent:#e8825f; --accent-soft:#261915; } }
  :root[data-theme="dark"]{ --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216;
    --card:#181b21; --accent:#e8825f; --accent-soft:#261915; }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
    -webkit-font-smoothing:antialiased;word-break:keep-all}
  .wrap{max-width:1080px;margin:0 auto;padding:48px 20px 80px}
  h1{font-size:clamp(28px,4vw,40px);line-height:1.15;margin:0 0 12px;letter-spacing:-.02em}
  .lead{color:var(--ink-2);margin:0 0 8px;max-width:62ch}
  .note{color:var(--ink-2);font-size:14px;margin:0 0 32px;max-width:62ch}
  .warn{background:var(--accent-soft);border-left:3px solid var(--accent);
    padding:14px 16px;border-radius:6px;margin:0 0 36px;max-width:62ch;font-size:14px}
  .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
  .room{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px}
  .sign{margin:0 0 6px;font-size:12px;letter-spacing:.1em;
    color:var(--accent);font-weight:700}
  .room h2{margin:0 0 6px;font-size:21px;letter-spacing:-.01em}
  .born,.also,.count{margin:0 0 6px;font-size:13px;color:var(--ink-2)}
  .count{margin-bottom:14px}
  .count a{color:var(--accent)}
  .cta{display:block;width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--line);
    background:transparent;color:var(--ink-2);font:inherit;font-size:14px;cursor:not-allowed;
    text-align:center}
  /* ⭐ 안이 채워진 방만 이 꼴이 된다 — 눌러 보고 빈 방이면 다시 안 온다(2번 10:2x) */
  .cta.live{border-color:var(--accent);color:var(--accent);cursor:pointer;
    text-decoration:none;font-weight:600}
  footer{margin-top:48px;padding-top:20px;border-top:1px solid var(--line);
    color:var(--ink-2);font-size:13px;max-width:62ch}
</style>
</head>
<body>
  <div class="wrap">
    <h1>나이로 나눈 방</h1>
    <p class="lead">방을 나이와 처지로 나눴습니다. 0~5세 아이를 맡길 데를 찾는 사람부터,
      오래 다닌 곳을 그만둔 사람까지 ${방.length}개입니다.</p>
    <p class="note">방마다 적힌 수는 저희가 공공데이터로 잰 것입니다. 각 방의 링크를 누르면
      그 수를 낸 지면으로 갑니다.
      ${방.length}개 가운데 <strong>${방.filter((r) => r.방).length}개</strong>는 <strong>안이 채워져 있어 들어가실 수 있습니다</strong> —
      나머지는 아직 문패뿐이라 <strong>일부러 눌리지 않게</strong> 두었습니다.</p>

    <p class="warn"><strong>백년지도는 스타를 다루지 않습니다.</strong> 그래서 방을 사람 이름이 아니라
      <strong>나이와 처지</strong>로 갈랐습니다. 같은 자리에 있는 사람끼리 모이는 것이 이 방의 뜻입니다.
      줄을 세우지 않고, 누가 낫다고도 쓰지 않습니다.</p>

    <div class="grid">
${칸}
    </div>

    <footer>
      <p><strong>이것은 첫 본입니다.</strong> 서버도, 로그인도, 글쓰기도 아직 없습니다.
      그래서 <strong>안이 아직 빈 방의 「${단추말}」 단추는 일부러 눌리지 않게</strong> 두었습니다 —
      눌러 보고 빈 방이면 안 하느니만 못합니다. 없는 것을 있는 척하지 않습니다.
      다만 <strong>지면으로 가는 길과, 안이 채워진 방으로 들어가는 길은 진짜</strong>입니다.</p>
      <p>백년지도 &middot; 100yearmap.com</p>
    </footer>
  </div>
</body>
</html>
`;
}

const 내가실행됐다 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-100y-community.mjs';

if (내가실행됐다 && process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 방 = 방들();
  const 판 = 판짓기(방);
  const 민 = 판.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다(`① 방이 ${방.length}장이다`, 방.length >= 5);
  본다('② ⛔ 줄 세운 목록이 없다 — ol 도 순위 낱말도 없다',
    !/<ol[\s>]/.test(판) && !['순위', '등수', '랭킹', '몇 위'].some((w) => 민.includes(w)));
  본다('③ ⛔ 스타 이름이 없다 — 백년지도는 스타를 안 다룬다',
    !['아이유', '정국', '카리나', '손흥민', '방탄'].some((w) => 민.includes(w)));
  const 찬방 = 방.filter((r) => r.방);
  본다(`④ ⛔ 안이 빈 방 ${방.length - 찬방.length}개의 단추는 안 눌린다`,
    (판.match(/<button class="cta" disabled/g) || []).length === 방.length - 찬방.length);
  본다(`⑤ ⭐ 안이 찬 방 ${찬방.length}개만 진짜로 들어가진다 — 실린 수를 단추에 적었다`,
    찬방.length > 0 && 찬방.every((r) => 판.includes(`href="${r.방}"`) && 판.includes(`${r.실린것}개`)));
  본다('⑥ ⭐ 방마다 그 나이의 지면으로 가는 길이 있다',
    방.every((r) => 판.includes(`href="${r.지면}"`)));
  본다('⑦ 5번 본의 짜임을 그대로 썼다 — .grid · .room · .warn · .cta',
    ['class="grid"', 'class="room"', 'class="warn"', 'class="cta"'].every((c) => 판.includes(c)));
  본다('⑧ 없는 것을 있는 척하지 않는다고 적었다', 민.includes('없는 것을 있는 척하지 않습니다'));
  본다('⑨ 스타를 안 다룬다고 맨 위 상자에 적었다', 민.includes('백년지도는 스타를 다루지 않습니다'));

  console.log(`\n방 ${방.length}장 · 안이 찬 방 ${찬방.length}개 · 지면으로 가는 길 ${방.length}개`);
  process.exit();
}

if (내가실행됐다) {
  const 방 = 방들();
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.writeFileSync(낼길, 판짓기(방), 'utf8');
  console.log(`✅ ${path.relative(뿌리, 낼길)} — 방 ${방.length}장`);
  console.log(`   안이 찬 방 ${방.filter((r) => r.방).length}개 · 지면으로 가는 길 ${방.length}개 · 안이 빈 방의 단추는 안 눌린다`);
}
