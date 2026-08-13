#!/usr/bin/env node
/**
 * make-cardnews-100y-free.mjs — **무료 지역 카드뉴스** (사장님 지시 2026-08-14)
 *
 * 🔴 왜 따로 짓나 — 8/14 02:3x 에 쟀더니 이랬다.
 *   ```
 *   파는 지면 114장   카드 63벌
 *   무료 지면 144장   카드 **0벌**   ← 규칙상 영원히 안 나온다
 *   ```
 *   기존 자(`make-cardnews-100y.mjs`)는 **「진학률을 잰 곳이 10 이상」**일 때만 만든다.
 *   퍼짐(분포)을 그리는 카드이기 때문이다. 그런데 **무료 지면은 다 10곳 미만**이라
 *   한 벌도 안 나온다. **8/15 에 여는 것이 무료 지면인데 데려올 카드가 없다.**
 *
 * ## ⭐ 그래서 이 자는 «퍼짐을 그리지 않는다»
 *
 *   ```
 *   ⛔ 안 한다   가운데값 · 퍼짐 · 「어디쯤인지」 · 비율 견주기   ← 분모가 작아 뜻을 잃는다
 *   ✅ 한다      그 지역에 **학교가 몇 곳**, **이름이 무엇**, **몇 곳이 진학률을 냈나**
 *               못 잰 곳은 «못 잰 곳»이라고 그대로 적는다
 *   ```
 *   우리 규칙(최소분모 30 · 한벌최소 10)을 어기지 않는다 — **비율을 아예 안 쓴다.**
 *
 * ⛔ 등수·순위를 쓰지 않는다.  ⛔ 값을 손으로 박지 않는다(price.ts · school-area.ts 에서 온다).
 * ⭐ 재는 자는 `scripts/lib/재기-공통.mjs` 에서 가져온다.
 *
 *   node scripts/make-cardnews-100y-free.mjs --자가시험
 *   node scripts/make-cardnews-100y-free.mjs [slug ...]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { 지역가르기, 열쇠만들기, 슬러그풀기, 한벌로팔만한가 } from '../src/lib/school-area.ts';
import { 숫자캐기, 다짐줄지우기 } from './lib/재기-공통.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const 자료방 = path.join(ROOT, 'src', 'data', '100yearmap');
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 집 = 'https://100yearmap.com';

const W = 1080, H = 1350, M = 92;
const 색 = { 바탕: '#12151c', 글: '#e9e9ee', 금: '#c9a84c', 금연한: '#e0c877', 흐림: '#7d7d8a', 선: '#2a2f3a' };
const 명조 = 'Batang, 바탕, serif';
const 고딕 = "'Malgun Gothic', '맑은 고딕', system-ui, sans-serif";

const 막는다 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const 읽기 = (f) => JSON.parse(fs.readFileSync(path.join(자료방, f), 'utf8'));

export function 줄나눔(글, 폭) {
  const 낱말 = String(글).split(' ');
  const 줄 = [];
  let 이번 = '';
  for (const w of 낱말) {
    if (!이번) { 이번 = w; continue; }
    if ((이번 + ' ' + w).length <= 폭) 이번 += ' ' + w;
    else { 줄.push(이번); 이번 = w; }
  }
  if (이번) 줄.push(이번);
  return 줄;
}

/** 카드 바닥에 세울 «데려올 주소» — ⛔ 마지막 장에만 두지 않는다 */
export function 갈곳글자(slug) {
  return slug ? `100yearmap.com/report/area/${slug}` : '100yearmap.com';
}

function 자료들() {
  const 줄뽑기 = (x) => (Array.isArray(x) ? x : Array.isArray(x?.줄) ? x.줄 : Object.values(x).find(Array.isArray) ?? []);
  const schools = 줄뽑기(읽기('pages-school.json'));
  const 진로표 = new Map(줄뽑기(읽기('school-career.json')).map((r) => [String(r.code ?? r.코드), r]));
  const areas = 읽기('areas.json');
  return { schools, 진로표, areas };
}

/**
 * 무료 지역 한 곳을 짠다. ⛔ 파는 곳(10곳 이상)이면 만들지 않는다 — 그건 저쪽 자의 몫이다.
 * ⚠ `지역가르기` 는 **학교 하나의 «주소»**를 받는 자다(목록이 아니다).
 *   처음에 목록을 넘겼다가 null 이 나와 터졌다. 기존 자와 같은 꼴로 맞췄다.
 */
export function 짜기(slug, 자료) {
  const 푼것 = 슬러그풀기(slug);
  if (!푼것) return null;
  const 단위 = 자료.areas.단위.find((a) => a.slug === slug);
  if (!단위) return null;
  if (한벌로팔만한가(Number(단위.곳))) return null;   // ⛔ 파는 곳은 저쪽 자가 만든다

  const 열쇠 = 열쇠만들기(푼것.시도, 푼것.이름);
  const 곳들 = 자료.schools.filter((x) => 지역가르기(x.주소)?.열쇠 === 열쇠);
  if (곳들.length === 0) return null;
  const 잰곳 = 곳들.filter((x) => 자료.진로표.get(String(x.code))?.진학률 != null);
  const 지면 = `${집}/report/area/${slug}`;

  const 근거 = [
    { 수: 곳들.length, 뜻: `${푼것.이름} 고등학교 수`, 지면 },
    { 수: 잰곳.length, 뜻: '진학률을 낸 곳', 지면 },
    { 수: 곳들.length - 잰곳.length, 뜻: '진학률이 없는 곳', 지면 },
  ];

  const 장들 = [];
  장들.push({ 꼴: '표지', 큰수: `${곳들.length}곳`, 줄들: [`${푼것.시도} ${푼것.이름}`, '고등학교를 한 장에'] });

  /* ⛔ 비율을 쓰지 않는다. **이름과 수**만 적는다 */
  장들.push({
    꼴: '속', 머리: '어느 학교가 있나',
    줄들: 곳들.slice(0, 8).map((x) => `· ${x.title}`),
  });

  장들.push({
    꼴: '속', 머리: '진학률은 몇 곳이 냈나',
    줄들: [
      `고등학교 ${곳들.length}곳 가운데`,
      `진학률을 낸 곳 ${잰곳.length}곳,`,
      `없는 곳 ${곳들.length - 잰곳.length}곳입니다.`,
      '',
      '⛔ 없는 곳을 빼고 세지 않았습니다.',
      '나라가 낸 공시에 그 줄이 없습니다.',
    ],
  });

  /* ⚠ 이 카드가 «퍼짐을 안 그리는 까닭»을 손님에게 그대로 말한다 */
  장들.push({
    꼴: '속', 머리: '여기서는 견주지 않습니다',
    줄들: [
      `${푼것.이름}은 고등학교가 ${곳들.length}곳입니다.`,
      '열 곳이 안 되면 「어디쯤인지」가',
      '뜻을 잃습니다. 그래서 이 지역은',
      '퍼짐을 그리지 않습니다.',
      '',
      '숫자는 지면에 그대로 있습니다.',
    ],
  });

  장들.push({
    꼴: '마무리', 머리: '학원을 팔지 않습니다',
    줄들: [
      '그래서 안 다녀도 된다고',
      '말할 수 있습니다.',
      '',
      `${푼것.이름} 고등학교 ${곳들.length}곳을`,
      '한 장에 — 아래 주소에서',
    ],
  });

  return { slug, 이름: `${푼것.시도} ${푼것.이름}`, 장들, 근거, 곳수: 곳들.length };
}

const 틀 = (속, 쪽, 총, 갈곳) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${색.바탕}"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${색.금}"/>
  <text x="${M}" y="118" font-family="${명조}" font-size="34" font-weight="bold" fill="${색.금}" letter-spacing="4">백년지도</text>
  <text x="${W - M}" y="118" text-anchor="end" font-family="${고딕}" font-size="28" fill="${색.흐림}">${쪽} / ${총}</text>
  ${속}
  <text x="${M}" y="${H - 66}" font-family="${고딕}" font-size="24" fill="${색.흐림}">등수를 매기지 않습니다</text>
  <text x="${W - M}" y="${H - 66}" text-anchor="end" font-family="${고딕}" font-size="24" fill="${색.금}">${막는다(갈곳)}</text>
</svg>`;

function 그리기(장, 쪽, 총, 갈곳) {
  let s = '';
  if (장.꼴 === '표지') {
    s += `<text x="${M}" y="470" font-family="${명조}" font-size="180" font-weight="bold" fill="${색.글}" letter-spacing="-4">${막는다(장.큰수)}</text>`;
    s += `<line x1="${M}" y1="540" x2="${W - M}" y2="540" stroke="${색.선}" stroke-width="1"/>`;
    s += 장.줄들.map((l, i) => `<text x="${M}" y="${630 + i * 74}" font-family="${고딕}" font-size="56" font-weight="bold" fill="${색.글}">${막는다(l)}</text>`).join('\n  ');
  } else {
    const 색머리 = 장.꼴 === '마무리' ? 색.금연한 : 색.금;
    const 머리줄 = 줄나눔(장.머리 ?? '', 20);
    s += 머리줄.map((l, i) => `<text x="${M}" y="${250 + i * 56}" font-family="${고딕}" font-size="42" font-weight="bold" fill="${색머리}">${막는다(l)}</text>`).join('\n  ');
    const 시작 = 250 + 머리줄.length * 56 + 70;
    s += '\n  ' + 장.줄들.map((l, i) => (l === '' ? '' : `<text x="${M}" y="${시작 + i * 62}" font-family="${고딕}" font-size="42" fill="${색.글}">${막는다(l)}</text>`)).filter(Boolean).join('\n  ');
  }
  return 틀(s, 쪽, 총, 갈곳);
}

/* ── 자가시험 ────────────────────────────────────────────── */
function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 조건) => 결과.push({ 이름, 됐나: !!조건 });
  const 같나 = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  본다('① 줄나눔이 폭을 안 넘는다', 줄나눔('가나다 라마바 사아자 차카타', 8).every((l) => l.length <= 8));
  본다('② 갈 곳이 그 지역을 가리킨다', 갈곳글자('경상북도-울릉군') === '100yearmap.com/report/area/경상북도-울릉군');
  본다('③ 바닥 주소가 모든 장에 선다',
    틀('', 1, 6, '100yearmap.com/report/area/가').includes('report/area/가') &&
    틀('', 6, 6, '100yearmap.com/report/area/가').includes('report/area/가'));
  본다('④ 주소 안의 수는 안 센다', 같나(숫자캐기('100yearmap.com/report/area/가 9곳'), [9]));

  let 자료 = null;
  try { 자료 = 자료들(); } catch (e) { 본다('⑤ 자료를 읽는다 (터졌다: ' + e.message + ')', false); }
  if (자료) {
    본다('⑤ 자료를 읽는다', 자료.schools.length > 2000 && 자료.진로표.size > 1000 && 자료.areas.단위.length > 100);

    const 짠것 = 짜기('경상남도-함안군', 자료);
    본다('⑥ 무료 지역이 짜인다', 짠것 && 짠것.장들.length >= 5);
    본다('⑦ ⛔ 파는 지역은 안 짠다(저쪽 자의 몫)', 짜기('서울특별시-노원구', 자료) === null);

    if (짠것) {
      const 근거수 = new Set(짠것.근거.map((g) => g.수));
      const 못댄것 = [];
      for (const 장 of 짠것.장들) {
        for (const 줄 of [장.큰수 ?? '', 장.머리 ?? '', ...장.줄들]) {
          for (const n of 숫자캐기(줄)) if (!근거수.has(n)) 못댄것.push(`${n} (${줄})`);
        }
      }
      본다(`⑧ 카드의 수가 전부 근거에 있다${못댄것.length ? ` — 못 댄 것: ${못댄것.slice(0, 3).join(' · ')}` : ''}`, 못댄것.length === 0);

      const 온글 = 짠것.장들.flatMap((장) => [장.머리 ?? '', ...장.줄들]).join(' ');
      /* 🔴 이 자의 뿌리 — **비율을 쓰지 않는다.** 분모가 작아 뜻을 잃기 때문이다 */
      본다('⑨ ⛔ 퍼센트를 쓰지 않는다', !/%/.test(온글));
      본다('⑩ ⛔ 가운데값·퍼짐을 말하지 않는다', !/가운데값|중앙값|퍼짐 안에서|어디쯤인지 봅니다/.test(온글));
      const 금지말 = ['등수', '순위', '몇 위', '1등', '상위', '꼴찌', '명문'];
      const 걸린말 = 금지말.filter((w) => 다짐줄지우기(온글).includes(w));
      본다(`⑪ 금지말이 없다${걸린말.length ? ` — ${걸린말.join(' · ')}` : ''}`, 걸린말.length === 0);
      본다('⑫ 못 잰 곳을 밝힌다', /없는 곳|빼고 세지 않았/.test(온글));
    }
  }

  for (const r of 결과) console.log((r.됐나 ? '  ✅ ' : '  ❌ ') + r.이름);
  const 진 = 결과.filter((r) => !r.됐나).length;
  console.log(`자가시험 ${결과.length - 진}/${결과.length}`);
  return 진 === 0;
}

/* ── 내기 ────────────────────────────────────────────────── */
const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('⛔ 자가시험이 막았다. 카드를 만들지 않는다'); process.exit(1); }

const 자료 = 자료들();
const 고른것 = 인자.filter((x) => !x.startsWith('--'));
const 할것 = 고른것.length
  ? 고른것
  : 자료.areas.단위.filter((단위) => !한벌로팔만한가(Number(단위.곳))).map((단위) => 단위.slug);

/* ⚠ sharp 는 **이 저장소** 것을 쓴다. klifemap 쪽에서 찾다가 「Cannot find module」로 섰다 */
const sharp = (await import('sharp')).default;
fs.mkdirSync(낼방, { recursive: true });

let 벌 = 0, 장수 = 0, 건너뜀 = 0;
for (const slug of 할것) {
  const 짠것 = 짜기(slug, 자료);
  if (!짠것) { 건너뜀++; continue; }
  const 총 = 짠것.장들.length;
  for (let i = 0; i < 총; i++) {
    const png = await sharp(Buffer.from(그리기(짠것.장들[i], i + 1, 총, 갈곳글자(짠것.slug)))).png().toBuffer();
    fs.writeFileSync(path.join(낼방, `${slug}-무료-${i + 1}.png`), png);
    장수++;
  }
  fs.writeFileSync(path.join(낼방, `${slug}-무료.근거.json`), JSON.stringify(짠것.근거, null, 2), 'utf8');
  벌++;
}
console.log(`\n무료 카드뉴스 ${벌}벌 · ${장수}장 → public/100y/cardnews/`);
if (건너뜀) console.log(`⚠ 건너뜀 ${건너뜀}곳 (파는 곳이라 저쪽 자가 만든다)`);
console.log('⚠ 한 장을 실제로 열어 글이 안 잘리는지 보고 커밋한다');
