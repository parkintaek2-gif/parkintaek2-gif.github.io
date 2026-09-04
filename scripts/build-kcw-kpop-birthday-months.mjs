/**
 * K팝 그룹 멤버의 «생일이 달마다 고른가»를 잰다.
 * ─────────────────────────────────────────────────────────────────────────────
 * 왜 — Search Console 28일치(2026-08-04~09-01)에서 손님이 이렇게 묻는다.
 *   「kpop birthdays in january」(자리 69.0) · 「kpop idol born in july」(자리 82.0)
 *   자리가 65~82 다. 사실상 «없는» 답이다. 우리는 1,500명 넘는 멤버의 생일을 쥐고 있다.
 *
 * ⚠ 반드시 지킬 것 두 가지
 *   1. **달마다 날수가 다르다.** 그냥 세면 2월이 늘 적게 나온다 — «하루당»으로 고른다
 *   2. 🔴 **1월 1일은 «생년만 알 때 채우는 날»이다.** 실측에서 14명 — 하루 평균 3.5의 «4배»다.
 *      빼고도 결과가 사는지 본다. 안 살면 「못 쟀다」로 적는다
 *
 * ⛔ 「왜 그런가」를 말하지 않는다. 우리가 잰 것은 «그렇다»까지다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { 난수기, 씨앗, 윌슨구간 } from './lib/noise-test.mjs';

export const 달이름 = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
/** 2월은 윤년을 고른 값으로 쓴다 — 400년에 97번이라 28.2425 */
export const 날수 = [31, 28.2425, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** 같은 사람이 여러 그룹에 있을 수 있다 — 이름으로 한 번만 센다 */
export function 사람으로추리기(멤버들) {
  const 통 = new Map();
  for (const m of 멤버들) {
    if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(String(m.born || ''))) continue;
    if (!통.has(m.name)) 통.set(m.name, m);
  }
  return [...통.values()];
}

/** 달별로 세고 «하루당»으로 고른다 */
export function 달별로세기(사람들, 뺄날 = null) {
  const 쓸것 = 뺄날 ? 사람들.filter((m) => m.born.slice(5) !== 뺄날) : 사람들;
  const 셈 = new Array(12).fill(0);
  for (const m of 쓸것) 셈[Number(m.born.slice(5, 7)) - 1] += 1;
  const 이달날수 = [...날수];
  if (뺄날 && /^\d{2}-\d{2}$/.test(뺄날)) 이달날수[Number(뺄날.slice(0, 2)) - 1] -= 1;
  const 합 = 셈.reduce((a, b) => a + b, 0);
  const 총날 = 이달날수.reduce((a, b) => a + b, 0);
  const 고른 = 합 / 총날;
  return {
    합,
    달들: 셈.map((c, i) => ({
      달: 달이름[i], 수: c, 날수: +이달날수[i].toFixed(4),
      하루당: +(c / 이달날수[i]).toFixed(3),
      고른값의배: 고른 ? +((c / 이달날수[i]) / 고른).toFixed(3) : null,
      몫: 합 ? +(c / 합 * 100).toFixed(1) : null,
    })),
    날수쓴것: 이달날수,
  };
}

/**
 * 「달마다 다르다」가 우연인가 — 생일이 «고르게» 뿌려졌다고 놓고 되풀이해 굴린다.
 * ⛔ 5%를 넘으면 「몰려 있다」고 쓰지 않는다 (공용 규칙 · scripts/lib/noise-test.mjs)
 */
export function 잡음시험달(합, 날수목록, 실제폭, 횟수 = 10000, 씨 = 씨앗) {
  const 난수 = 난수기(씨);
  const 총날 = 날수목록.reduce((a, b) => a + b, 0);
  let 이상 = 0;
  for (let t = 0; t < 횟수; t += 1) {
    const 통 = new Array(12).fill(0);
    for (let i = 0; i < 합; i += 1) {
      let r = 난수() * 총날; let j = 0;
      while (r > 날수목록[j] && j < 11) { r -= 날수목록[j]; j += 1; }
      통[j] += 1;
    }
    const h = 통.map((c, i) => c / 날수목록[i]);
    if (Math.max(...h) - Math.min(...h) >= 실제폭 - 1e-9) 이상 += 1;
  }
  const 비율 = +(이상 / 횟수 * 100).toFixed(1);
  return { 횟수, 씨앗: 씨, 우연일확률: 비율, 못쟀다고적어야하나: 비율 > 5 };
}

/** 어떤 «날»이 유난히 몰렸나 — 채워 넣은 날짜를 찾는 자리다 */
export function 몰린날(사람들, 몇 = 5) {
  const 셈 = {};
  for (const m of 사람들) { const k = m.born.slice(5); 셈[k] = (셈[k] || 0) + 1; }
  const 하루평균 = 사람들.length / 366;
  return Object.entries(셈).sort((a, b) => b[1] - a[1]).slice(0, 몇)
    .map(([날, 수]) => ({ 날, 수, 하루평균의배: +(수 / 하루평균).toFixed(2) }));
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
export function 재기() {
  const 참 = []; const 거 = [];
  const 봄 = (이름, 값) => (값 ? 참 : 거).push(이름);

  const 멤 = [
    { name: 'A', born: '1994-01-01' }, { name: 'A', born: '1994-01-01' },
    { name: 'B', born: '1995-03-15' }, { name: 'C', born: '1996-07-04' },
    { name: 'D', born: '알 수 없음' }, { name: 'E', born: '1997-02-28' },
  ];
  const 사람 = 사람으로추리기(멤);
  봄('같은 사람을 두 번 세지 않는다', 사람.length === 4);
  봄('날짜 꼴이 아니면 버린다', !사람.some((m) => m.born === '알 수 없음'));

  const r = 달별로세기(사람);
  봄('달별로 센다', r.합 === 4 && r.달들[0].수 === 1 && r.달들[6].수 === 1);
  봄('⚠ 2월 날수를 28.2425 로 쓴다 (그냥 세면 2월이 늘 적다)', r.달들[1].날수 === 28.2425);
  봄('하루당으로 고른다', r.달들[2].하루당 === +(1 / 31).toFixed(3));

  const 뺀 = 달별로세기(사람, '01-01');
  봄('🔴 1월 1일을 뺄 수 있다', 뺀.합 === 3 && 뺀.달들[0].수 === 0);
  봄('뺀 날만큼 1월 날수도 준다', 뺀.달들[0].날수 === 30);

  const 몰 = 몰린날([{ born: '1990-01-01' }, { born: '1991-01-01' }, { born: '1992-05-05' }]);
  봄('가장 몰린 날을 찾는다', 몰[0].날 === '01-01' && 몰[0].수 === 2);
  봄('하루평균의 몇 배인지 함께 낸다', 몰[0].하루평균의배 > 1);

  /* ⭐ 자가 «울릴 수 있음»과 «안 울림»을 둘 다 보인다 */
  const 고른것 = 잡음시험달(1200, 날수, 0.01, 500);
  봄('폭이 아주 좁으면 «우연으로 설명된다»', 고른것.우연일확률 > 5 && 고른것.못쟀다고적어야하나 === true);
  const 넓은것 = 잡음시험달(1200, 날수, 5, 500);
  봄('폭이 아주 넓으면 «우연이 아니다»', 넓은것.우연일확률 <= 5 && 넓은것.못쟀다고적어야하나 === false);
  봄('결과에 씨앗을 실어 준다', 고른것.씨앗 === 씨앗);
  봄('같은 씨앗이면 같은 답', 잡음시험달(1200, 날수, 0.5, 300).우연일확률 === 잡음시험달(1200, 날수, 0.5, 300).우연일확률);

  봄('빈 목록이면 합이 0 이고 배는 null', (() => { const z = 달별로세기([]); return z.합 === 0 && z.달들[0].고른값의배 === null; })());
  return { 참: 참.length, 거: 거.length, 틀린것: 거 };
}

const 나인가 = import.meta.url.endsWith(encodeURI(path.basename(String(process.argv[1] || 'x'))));
if (나인가) {
  const r = 재기();
  if (process.argv.includes('--재기')) {
    console.log(`자가시험 ${r.참}/${r.참 + r.거}`);
    if (r.거) { console.log('🔴 틀린 것:'); r.틀린것.forEach((x) => console.log('   · ' + x)); process.exit(1); }
    process.exit(0);
  }
  if (r.거) { console.log(`🔴 자가시험 ${r.거}가지 깨졌다 — 멈춘다`); r.틀린것.forEach((x) => console.log('   · ' + x)); process.exit(1); }
  console.log(`자가시험 ${r.참}/${r.참}\n`);

  const 뿌리 = process.cwd();
  const g = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-groups.json'), 'utf8'));
  const 사람 = 사람으로추리기(g.groups.flatMap((x) => x.members || []));
  const 전부 = 달별로세기(사람);
  const 뺀것 = 달별로세기(사람, '01-01');
  const 폭 = (x) => Math.max(...x.달들.map((d) => d.하루당)) - Math.min(...x.달들.map((d) => d.하루당));
  const 시험전부 = 잡음시험달(전부.합, 전부.날수쓴것, 폭(전부));
  const 시험뺀것 = 잡음시험달(뺀것.합, 뺀것.날수쓴것, 폭(뺀것));
  const 몰 = 몰린날(사람, 6);

  const 낸것 = {
    무엇인가: 'K팝 그룹 멤버의 생일이 달마다 고른가 — 하루당으로 고르고, 잡음시험을 붙였다',
    출처: 'Wikidata (P569 생일), CC0 · 우리가 쥔 K팝 그룹 명단',
    그룹수: g.groups.length,
    멤버자리: g.groups.reduce((a, x) => a + (x.members || []).length, 0),
    사람수: 사람.length,
    잰때: new Date().toLocaleString('ko-KR'),
    전부, 시험전부,
    한날뺀것: { 뺀날: '01-01', 뺀사람: 사람.length - 뺀것.합, ...뺀것 },
    시험한날뺀것: 시험뺀것,
    몰린날: 몰,
    '⚠ 못 쟀다': '왜 그런지는 못 쟀다. 잰 것은 「달마다 다르다」까지다. 출생 계절성인지, 명단이 치우친 것인지 가르지 못했다',
  };
  const 길 = path.join(뿌리, 'src/data/kcw-kpop-birthday-months.json');
  fs.writeFileSync(길, `${JSON.stringify(낸것, null, 1)}\n`, 'utf8');

  console.log(`사람 ${사람.length}명 (그룹 ${g.groups.length} · 멤버 자리 ${낸것.멤버자리})`);
  console.log('\n[전부]');
  [...전부.달들].sort((a, b) => b.하루당 - a.하루당).forEach((d, i) => {
    if (i < 3 || i > 8) console.log(`  ${d.달.padEnd(10)} ${String(d.수).padStart(4)}명 · 고른 값의 ${d.고른값의배}배`);
  });
  console.log(`  잡음시험 — 우연일 확률 ${시험전부.우연일확률}%`);
  console.log('\n[1월 1일을 뺀 것]  ⚠ 생년만 알 때 채우는 날이다');
  console.log(`  뺀 사람 ${낸것.한날뺀것.뺀사람}명`);
  [...뺀것.달들].sort((a, b) => b.하루당 - a.하루당).forEach((d, i) => {
    if (i < 3 || i > 8) console.log(`  ${d.달.padEnd(10)} ${String(d.수).padStart(4)}명 · 고른 값의 ${d.고른값의배}배`);
  });
  console.log(`  잡음시험 — 우연일 확률 ${시험뺀것.우연일확률}%`);
  console.log(시험뺀것.못쟀다고적어야하나 ? '  ⛔ 우연으로 설명된다 — 「몰려 있다」고 쓰지 않는다' : '  ⭐ 우연으로는 설명이 안 된다');
  console.log('\n[가장 몰린 날]');
  몰.forEach((x) => console.log(`  ${x.날} ${x.수}명 · 하루평균의 ${x.하루평균의배}배`));
  console.log(`\n냈다 — ${길}`);
}
