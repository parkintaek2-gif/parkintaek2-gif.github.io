/**
 * check-100y-content-evidence.mjs — 밖으로 나가는 콘텐트의 수가 «그 수가 있는 지면»을 대나
 *
 * 🔴 왜 — 우리가 스스로 정한 규칙이 두 군데에 적혀 있다.
 *   videos.json     *「화면에 뜨는 수는 전부 «그 수가 있는 지면»을 댈 수 있어야 한다. 못 대면 뺀다」*
 *   deploy-quiz     *「근거 json 도 함께 센다. **근거 없는 장은 밖에 못 내보낸다(수를 못 댄다)**」*
 *
 *   2026-08-16 에 재 봤더니 지켜지지 않고 있었다 —
 *     · 개봉 카드뉴스(8/15)의 수 11개 중 **10개**를 어느 지면도 갖고 있지 않았다
 *     · 빚·월급꼭대기 영상이 대는 나이대별 수가 「/age」에 없었다
 *     · 서른둘 영상이 견주는 25·40세 수가 「/age/32」에 없었다
 *       ⚠ 이 줄을 「**」로 감싸 쓰다 «별+슬래시»가 주석을 닫아 자가 안 돌았다. 주석 안에서 조심한다
 *   콘텐트가 지면보다 앞서 나가면 이렇게 된다. **그때마다 지면에 실어 메웠고**, 다시 안 벌어지게 자로 만든다.
 *
 * ── 이 자를 만들며 세 번 틀렸다. 세 번 다 «자가 낸 빨강»을 눈으로 보고서야 알았다 ──
 *   ① 영상 자를 import 했더니 **곧바로 렌더링이 시작됐다**(puppeteer 가 뜨고 영상이 다시 만들어졌다).
 *      → 영상 자마다 「내가직접불렸나」 가드를 넣어 고쳤다. 가드 없는 자는 여기서 **안 부른다**.
 *   ② 태그만 지우고 `<style>` 을 안 걷어 **CSS 를 화면 글로 셌다**(opacity:0.860 · scale(1.35)).
 *   ③ 숫자가 **차오르는 중간값**을 셌다(41.8% — 52.5% 로 가는 길의 한 칸).
 *      → **두 칸 이상 머문 수**만 요구한다.
 *
 * ⛔ 이 자는 배포를 막지 않는다. **보는 눈**이다. 빨강이 있어도 배포는 다른 자가 정한다.
 * ⚠ dist 를 읽는다 — 빌드가 최신이 아니면 헛것이 나온다. 「못 쟀다」로 적을 뿐 없다고 단정하지 않는다.
 *
 * 쓰는 법  node scripts/check-100y-content-evidence.mjs [--자세히]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자세히 = process.argv.includes('--자세히');

/** 소수 · 천단위 · 「%일명세」 앞의 수만 본다. 쪽번호·색값은 안 본다 */
export const 수캐기 = (t) =>
  [...String(t).matchAll(/\d[\d,]*\.\d+|\d{1,3}(?:,\d{3})+|\d+(?=\s*[%일명세])/g)].map((x) => x[0]);
export const 민들기 = (h) =>
  String(h).replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');

/** ⛔ 두 칸 이상에 머문 수만 요구한다 — 차오르는 중간값을 걸러내려고 */
export function 볼수들(대장글, 칸들) {
  if (!칸들?.length) return [...new Set(수캐기(대장글))];
  const 셈 = new Map();
  for (const 칸 of 칸들)
    for (const s of new Set(수캐기(민들기(칸)))) 셈.set(s, (셈.get(s) || 0) + 1);
  for (const s of new Set(수캐기(대장글))) if (!셈.has(s)) 셈.set(s, 2);
  return [...셈].filter(([, n]) => n >= 2).map(([s]) => s);
}

/** 지면 주소 → dist 파일. 우리 빌드는 /work → dist/100y/work.html 꼴이다 */
export function 지면파일(주소) {
  const 몸 = String(주소).replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '');
  for (const 후보 of [`dist/100y/${몸}.html`, `dist/100y/${몸}/index.html`])
    if (fs.existsSync(path.join(뿌리, 후보))) return 후보;
  return null;
}
export const 지면에있나 = (지면글, 수) => {
  const n = Number(String(수).replace(/,/g, ''));
  return [String(수), n.toLocaleString(), String(n)].some((꼴) => 지면글.includes(꼴));
};

if (process.argv[1] && path.basename(process.argv[1]) === 'check-100y-content-evidence.mjs') {
  const 줄 = [];
  let 빨강 = 0, 못잼 = 0;

  /* ── ① 숏영상 ── 대장의 이름·한줄 + (가드가 있으면) 화면 전체 ── */
  const v = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/100yearmap/videos.json'), 'utf8'));
  for (const 영상 of v.영상) {
    const 지면 = 지면파일(영상.댈지면);
    if (!지면) { 줄.push(['⬜', `영상 ${영상.슬러그}`, `댈지면을 dist 에서 못 찾았다(${영상.댈지면}) — 못 쟀다`]); 못잼++; continue; }

    let 칸들 = [];
    try {
      const 자길 = path.join(뿌리, 영상.자 || '');
      // ⛔ 가드 없는 자는 부르지 않는다. 부르는 순간 렌더링이 시작된다
      if (영상.자 && fs.existsSync(자길) && fs.readFileSync(자길, 'utf8').includes('내가직접불렸나')) {
        const m = await import('file:///' + 자길.replace(/\\/g, '/'));
        if (typeof m.칸HTML === 'function') 칸들 = Array.from({ length: 40 }, (_, i) => m.칸HTML(i * 0.5));
      }
    } catch { /* 못 부르면 대장 글만 본다 */ }

    const 대장글 = [영상.이름, 영상.한줄].filter(Boolean).join(' ');
    const 지면글 = 민들기(fs.readFileSync(path.join(뿌리, 지면), 'utf8'));
    const 못댐 = 볼수들(대장글, 칸들).filter((s) => !지면에있나(지면글, s));
    if (못댐.length) 빨강++;
    줄.push([못댐.length ? '🔴' : '✅', `영상 ${영상.슬러그}`,
      `[${칸들.length ? '화면 전체' : '대장 글만'}] ${영상.댈지면}` + (못댐.length ? ` — 못 대는 수: ${못댐.join(' · ')}` : '')]);
  }

  /* ── ② 카드뉴스 ── «.근거.json» 이 있나, 그 안의 수가 지면에 있나 ── */
  const 카드방 = path.join(뿌리, 'public/100y/cardnews');
  const 벌 = new Map();
  for (const f of fs.readdirSync(카드방)) {
    const m = f.match(/^(.+?)-\d+\.png$/);
    if (m) 벌.set(m[1], (벌.get(m[1]) || 0) + 1);
  }
  let 근거없음 = 0;
  for (const [이름] of [...벌].sort()) {
    const 근거길 = path.join(카드방, `${이름}.근거.json`);
    if (!fs.existsSync(근거길)) {
      근거없음++; 빨강++;
      줄.push(['🔴', `카드 ${이름}`, '근거 json 이 없다 — 밖에 못 내보낸다']);
      continue;
    }
    /* ⚠ 근거 파일이 **두 꼴**이다(2026-08-16 에 세어 보고 알았다) —
       ① 배열 그대로 [{수,뜻,지면}] 147벌  ② {지역,장수,근거:[…]} 63벌.
       한 꼴만 알고 도는 자를 만들었다가 63벌에서 「iterable 이 아니다」로 넘어졌다.
       ⛔ 모르는 꼴이면 «틀렸다»가 아니라 «못 쟀다»로 적는다 */
    const 날 = JSON.parse(fs.readFileSync(근거길, 'utf8'));
    const 근거 = Array.isArray(날) ? 날 : Array.isArray(날?.근거) ? 날.근거 : null;
    if (!근거) {
      못잼++;
      줄.push(['⬜', `카드 ${이름}`, `근거 json 의 꼴을 모른다(칸: ${Object.keys(날 || {}).join(',')}) — 못 쟀다`]);
      continue;
    }
    const 나쁜 = [];
    for (const r of 근거) {
      const 지면 = 지면파일(r.지면);
      if (!지면) { 나쁜.push(`${r.수}: 지면을 못 찾음(${r.지면})`); continue; }
      const 지면글 = 민들기(fs.readFileSync(path.join(뿌리, 지면), 'utf8'));
      if (!지면에있나(지면글, r.수)) 나쁜.push(`${r.수}(${r.뜻})`);
    }
    if (나쁜.length) 빨강++;
    줄.push([나쁜.length ? '🔴' : '✅', `카드 ${이름}`,
      `근거 ${근거.length}개` + (나쁜.length ? ` — 지면이 못 대는 수: ${나쁜.join(' · ')}` : '')]);
  }

  console.log('백년지도 콘텐트 — 화면의 수가 지면을 대나\n');
  console.log(`  영상 ${v.영상.length}편 · 카드 ${벌.size}벌`);
  console.log(`  🔴 못 대는 것        ${빨강}`);
  console.log(`  🔴 근거 json 없는 벌 ${근거없음}`);
  console.log(`  ⬜ 못 잰 것          ${못잼}`);

  const 볼것 = 자세히 ? 줄 : 줄.filter(([표]) => 표 !== '✅');
  if (볼것.length) {
    console.log('');
    for (const [표, 누구, 말] of 볼것) console.log(`  ${표} ${String(누구).padEnd(32)} ${말}`);
  } else console.log('\n  ✅ 다 댄다 (자세히 보려면 --자세히)');

  console.log('\n⛔ 이 자는 배포를 막지 않는다. **보는 눈**이다.');
  console.log('⚠ dist 를 읽는다 — 빌드가 최신이 아니면 헛것이 나온다. 먼저 build-once 를 돌린다.');
}
