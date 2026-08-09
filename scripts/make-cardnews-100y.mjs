/**
 * make-cardnews-100y.mjs — **지역 한 벌 → 카드뉴스(캐러셀) 여러 장** (사장님 지시 2026-08-09)
 *
 * 배포 퀴즈에서 「카드뉴스가 있나」가 **0장**이라 만든다. 6번은 이 칸을 0% 에서 98% 로 올렸다.
 * 세로 1080×1350(인스타·스레드 캐러셀). 색·폰트는 og 카드 엔진(`make-og-100y-pages.mjs`)과 같다.
 *
 * ```
 * node scripts/make-cardnews-100y.mjs --자가시험     자가시험 10건만 돈다(그림 안 만든다)
 * node scripts/make-cardnews-100y.mjs 서울특별시-노원구 [slug ...]
 * node scripts/make-cardnews-100y.mjs               한 벌로 파는 곳 전부
 * ```
 * 출력: `public/100y/cardnews/<slug>-N.png` · `public/100y/cardnews/<slug>.근거.json`
 *
 * ## 🔴 이 자가 지키는 것 — **카드에 있는 수는 전부 지면에 있는 수다**
 *
 *   2번 규칙 — *「영상에 나오는 숫자마다 그 수가 있는 지면 주소를 적으십시오.
 *   못 대는 숫자는 영상에서 빼십시오」*. 카드도 똑같다.
 *   그래서 카드 글에서 **숫자를 도로 캐내어** 근거 목록에 없으면 **만들지 않고 멈춘다**(자가시험 6).
 *   ⛔ 「대 봤다」고 말로 적지 않는다. 자가 대 본다.
 *
 * ## ⛔ 하지 않는 것
 *
 *   ```
 *   ⛔ 등수·순위·1등·상위 몇 %      집 규칙이다. 자가시험 10 이 글자로 막는다
 *   ⛔ 평균만 싣기                  퍼짐(낮은값~높은값)을 먼저 그린다
 *   ⛔ 분모 작은 갈래 싣기           전국 30곳 미만 갈래는 뺀다(최소분모 30)
 *   ⛔ 진학률 없는 학교를 빼고 세기   못 잰 곳도 장에 적는다
 *   ```
 *
 * ⚠ 가르는 규칙(어느 학교가 어느 구인가)은 `src/lib/school-area.ts` **한 곳**에서 온다.
 *   여기에 다시 적지 않는다 — 두 벌이 되면 지면과 카드의 곳 수가 갈린다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { 지역가르기, 열쇠만들기, 슬러그풀기, 한벌로팔만한가, 한벌최소 } from '../src/lib/school-area.ts';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const 자료방 = path.join(ROOT, 'src', 'data', '100yearmap');
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');

/** ⚠ 전국 갈래 가운데값을 낼 때 이보다 적은 갈래는 싣지 않는다. 집 규칙(최소분모 30) */
const 최소분모 = 30;
const 값글자 = '9,900원';
const 집 = 'https://100yearmap.com';

/** 지면과 같은 값이다. `public/100y/style.css` 의 토큰을 옮겨 적었다 */
const 색 = { 바탕: '#12151c', 결: '#1a1e27', 금: '#c9a84c', 금연한: '#e8d9a8', 글: '#e9e9ee', 흐림: '#9aa0ac', 선: '#262b36' };
const 고딕 = "'Malgun Gothic','맑은 고딕','Noto Sans KR',sans-serif";
const 명조 = "'Noto Serif KR','Batang','바탕',serif";

/** XML 에 그대로 넣으면 깨지는 글자를 막는다 */
export const 막는다 = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 폭(글자수)에 맞춰 줄로 나눈다. ⚠ 한글은 띄어쓰기 단위로만 자른다 */
export function 줄나눔(글, 폭) {
  const 말 = String(글).split(/\s+/).filter(Boolean);
  const 줄 = [];
  let 현재 = '';
  for (const w of 말) {
    if (현재 && (현재 + ' ' + w).length > 폭) { 줄.push(현재); 현재 = w; }
    else 현재 = (현재 + ' ' + w).trim();
  }
  if (현재) 줄.push(현재);
  return 줄;
}

/**
 * 🔴 **안에서 정렬한다.** 부르는 쪽이 정렬해 주기를 기대하지 않는다.
 * 지면에서 2026-08-08 04:2x 에 이걸로 틀렸다 — 정렬 안 된 배열의 가운데를 집어
 * 「일반고 24.5% · 자율고 26.2%」가 뒤집혔다. 총계는 그럴듯해서 안 걸렸다.
 */
export function 중간값(a) {
  if (!a || !a.length) return null;
  const b = [...a].sort((x, y) => x - y);
  const m = b.length >> 1;
  return Math.round((b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2) * 10) / 10;
}

/**
 * 글에서 수를 도로 캐낸다. `55.5%` · `9,900원` · `26곳` 에서 `55.5` · `9900` · `26` 을 뽑는다.
 * ⚠ 이 자가 있어야 「카드에 적힌 수가 근거에 있나」를 **글자가 아니라 수로** 견줄 수 있다.
 */
export function 숫자캐기(글) {
  return (String(글).match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((s) => Number(s.replace(/,/g, '')));
}

/** ⛔ 집 규칙으로 못 쓰는 말. 자가시험 10 이 모든 장을 훑는다 */
const 금지말 = ['등수', '순위', '몇 위', '1등', '일등', '상위', '꼴찌', '명문', '랭킹'];

const 읽기 = (f) => JSON.parse(fs.readFileSync(path.join(자료방, f), 'utf8'));

/** 자료를 한 번만 읽어 둔다 */
function 자료들() {
  const schools = 읽기('pages-school.json');
  const 진로자료 = 읽기('school-career.json');
  const areas = 읽기('areas.json');
  const 진로표 = new Map(진로자료.자료.map((r) => [r.code, r]));
  const 학교표 = new Map(schools.map((x) => [x.code, x]));
  /** 전국 갈래별 「그 밖」 가운데값 — **「낮은 것이 나쁜 것이 아니다」를 숫자로 받친다** */
  const 갈래표 = new Map();
  for (const r of 진로자료.자료) {
    const x = 학교표.get(r.code);
    if (!x || r.그밖율 == null) continue;
    const k = String(x.고교유형 ?? '').trim();
    if (!k) continue;
    if (!갈래표.has(k)) 갈래표.set(k, []);
    갈래표.get(k).push(r.그밖율);
  }
  const 갈래그밖 = new Map([...갈래표].map(([k, v]) => [k, { 곳: v.length, 가운데: 중간값(v) }]));
  return { schools, 진로자료, areas, 진로표, 갈래그밖 };
}

/**
 * 한 지역의 카드 글과 **근거**를 짠다. ⛔ 그림은 여기서 안 그린다 — 자가시험이 글만 보고 판정한다.
 * @returns {{slug:string, 이름:string, 장들:Array<{꼴:string,큰수?:string,머리?:string,줄들:string[]}>, 근거:Array<{수:number,뜻:string,지면:string}>}|null}
 */
export function 짜기(slug, 자료) {
  const 푼것 = 슬러그풀기(slug);
  if (!푼것) return null;
  const 단위 = 자료.areas.단위.find((a) => a.slug === slug);
  if (!단위) return null;
  if (!한벌로팔만한가(Number(단위.곳))) return null;

  const 열쇠 = 열쇠만들기(푼것.시도, 푼것.이름);
  const 곳들 = 자료.schools
    .filter((x) => 지역가르기(x.주소)?.열쇠 === 열쇠)
    .map((x) => ({ ...x, 진로: 자료.진로표.get(x.code) ?? null }));
  if (곳들.length === 0) return null;

  const 잰곳 = 곳들.filter((x) => x.진로?.진학률 != null);
  const 못잰곳 = 곳들.filter((x) => x.진로?.진학률 == null);
  /** ⚠ 잰 곳이 한벌최소보다 적으면 퍼짐이 퍼짐이 아니다. 카드로 안 낸다 */
  if (잰곳.length < 한벌최소) return null;

  const 값들 = 잰곳.map((x) => x.진로.진학률).sort((a, b) => a - b);
  const 낮은값 = 값들[0];
  const 높은값 = 값들[값들.length - 1];
  const 가운데 = 중간값(값들);

  /** 이 구에 실제로 있는 갈래만. ⛔ 없는 갈래를 보기로 들지 않는다 */
  const 이구갈래 = [...new Set(곳들.map((x) => String(x.고교유형 ?? '').trim()).filter(Boolean))]
    .map((k) => ({ 갈래: k, ...(자료.갈래그밖.get(k) ?? { 곳: 0, 가운데: null }) }))
    .filter((g) => g.가운데 != null && g.곳 >= 최소분모)
    .sort((a, b) => a.가운데 - b.가운데);

  const 지면 = `${집}/report/area/${slug}`;
  const 근거 = [
    { 수: 곳들.length, 뜻: `${푼것.이름} 고등학교 수`, 지면 },
    { 수: 잰곳.length, 뜻: '진학률을 잰 곳', 지면 },
    { 수: 못잰곳.length, 뜻: '진학률이 없는 곳', 지면 },
    { 수: 낮은값, 뜻: '가장 낮은 진학률(%)', 지면 },
    { 수: 높은값, 뜻: '가장 높은 진학률(%)', 지면 },
    { 수: 가운데, 뜻: '가운데값(%)', 지면 },
    { 수: 9900, 뜻: '한 벌 값(원)', 지면: `${집}/price` },
  ];
  for (const g of 이구갈래) 근거.push({ 수: g.가운데, 뜻: `전국 ${g.갈래} 「그 밖」 가운데값(%)`, 지면 });

  /**
   * ⚠ 출처 장에 적히는 수도 **손으로 적지 않는다.** 공시연도·누리 유형은 자료가 준 값이다.
   *   자가시험 ⑨ 가 이걸 먼저 잡았다 — 「2024」와 「제1유형의 1」이 근거에 없다고 멈췄다.
   */
  const 출처 = 자료.진로자료.통계.출처;
  const 공시연도 = Number(출처.공시연도);
  const 누리유형 = Number(String(출처.이용허락범위).match(/제(\d+)유형/)?.[1]);
  근거.push({ 수: 공시연도, 뜻: '공시연도', 지면 });
  근거.push({ 수: 누리유형, 뜻: '공공누리 유형', 지면 });

  const 장들 = [];
  장들.push({ 꼴: '표지', 큰수: `${곳들.length}곳`, 줄들: [`${푼것.시도} ${푼것.이름}`, '고등학교를 한 장에'] });
  장들.push({
    꼴: '사실', 머리: '잰 것과 못 잰 것',
    줄들: [
      `진학률이 있는 곳 ${잰곳.length}곳,`,
      `없는 곳 ${못잰곳.length}곳입니다.`,
      '',
      '없는 곳도 자리에 두고',
      '왜 없는지 적었습니다.',
    ],
  });
  장들.push({
    꼴: '사실', 머리: '퍼짐',
    줄들: [
      `가장 낮은 곳 ${낮은값}%,`,
      `가장 높은 곳 ${높은값}%,`,
      `가운데 ${가운데}%.`,
      '',
      '어디쯤인지만 보여드립니다.',
    ],
  });
  if (이구갈래.length >= 2) {
    장들.push({
      꼴: '사실', 머리: '낮은 곳이 나쁜 곳이 아닙니다',
      줄들: [
        '갈래마다 「그 밖」 칸이',
        '원래 다릅니다.',
        '',
        ...이구갈래.map((g) => `${g.갈래} ${g.가운데}%`),
        '',
        '재수를 택한 학생이 그 칸으로',
        '가고, 진학률에서 빠집니다.',
      ],
    });
  }
  장들.push({
    꼴: '사실', 머리: '어디서 온 수인가',
    줄들: [
      '학교알리미 공개용데이터',
      `「${출처.공시항목}」 ${공시연도}년`,
      `공공누리 제${누리유형}유형(출처표시)`,
      '',
      '사람 수는 공시된 값이고,',
      '비율과 가운데값은 저희가 냈습니다.',
    ],
  });
  장들.push({
    꼴: '마무리', 머리: '학원을 팔지 않습니다',
    줄들: [
      '그래서 안 다녀도 된다고',
      '말할 수 있습니다.',
      '',
      `${푼것.이름} 한 벌 ${값글자}`,
      '프로필 링크에서 보실 수 있습니다.',
    ],
  });

  return { slug, 이름: `${푼것.시도} ${푼것.이름}`, 장들, 근거 };
}

/* ────────────────────────────── 그림 ────────────────────────────── */

const W = 1080, H = 1350, M = 90;
const 틀 = (속, 쪽, 총) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${색.바탕}"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${색.금}"/>
  <text x="${M}" y="118" font-family="${명조}" font-size="34" font-weight="bold" fill="${색.금}" letter-spacing="4">백년지도</text>
  <text x="${W - M}" y="118" text-anchor="end" font-family="${고딕}" font-size="28" fill="${색.흐림}">${쪽} / ${총}</text>
  ${속}
  <text x="${M}" y="${H - 66}" font-family="${고딕}" font-size="26" fill="${색.흐림}">등수를 매기지 않습니다</text>
  <text x="${W - M}" y="${H - 66}" text-anchor="end" font-family="${고딕}" font-size="26" fill="${색.금}">100yearmap.com</text>
</svg>`;

function 그리기(장, 쪽, 총) {
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
    s += '\n  ' + 장.줄들.map((l, i) => (l === '' ? '' : `<text x="${M}" y="${시작 + i * 68}" font-family="${고딕}" font-size="48" fill="${색.글}">${막는다(l)}</text>`)).filter(Boolean).join('\n  ');
  }
  return 틀(s, 쪽, 총);
}

/* ────────────────────────────── 자가시험 ────────────────────────────── */

function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 조건) => 결과.push({ 이름, 됐나: !!조건 });

  본다('① 줄나눔이 폭을 안 넘는다', 줄나눔('가나다 라마바 사아자 차카타', 8).every((l) => l.length <= 8));
  본다('② 줄나눔이 글자를 안 흘린다', 줄나눔('가나다 라마바 사아자', 8).join(' ') === '가나다 라마바 사아자');
  본다('③ 막는다가 & 를 막는다', 막는다('가&나<다') === '가&amp;나&lt;다');
  본다('④ 중간값이 안에서 정렬한다', 중간값([9, 1, 5]) === 5 && 중간값([26.2, 17.3, 20]) === 20);
  본다('⑤ 중간값이 짝수면 평균낸다', 중간값([10, 20]) === 15 && 중간값([]) === null);
  본다('⑥ 숫자캐기가 쉼표·소수를 푼다', JSON.stringify(숫자캐기('9,900원 · 55.5% · 26곳')) === JSON.stringify([9900, 55.5, 26]));

  let 자료 = null;
  try { 자료 = 자료들(); } catch (e) { 본다(`⑦ 자료를 읽는다 (터졌다: ${e.message})`, false); }
  if (자료) {
    본다('⑦ 자료를 읽는다', 자료.schools.length > 2000 && 자료.갈래그밖.size > 0);

    const 짠것 = 짜기('서울특별시-노원구', 자료);
    본다('⑧ 노원구가 짜인다', 짠것 && 짠것.장들.length >= 5 && 짠것.근거.length >= 7);

    if (짠것) {
      /** 🔴 이 시험이 이 자의 전부다 — **카드에 적힌 수가 근거에 다 있나** */
      const 근거수 = new Set(짠것.근거.map((g) => g.수));
      const 못댄것 = [];
      for (const 장 of 짠것.장들) {
        for (const 줄 of [장.큰수 ?? '', 장.머리 ?? '', ...장.줄들]) {
          for (const n of 숫자캐기(줄)) if (!근거수.has(n)) 못댄것.push(`${n} (${줄})`);
        }
      }
      본다(`⑨ 카드의 수가 전부 근거에 있다${못댄것.length ? ` — 못 댄 것: ${못댄것.slice(0, 3).join(' · ')}` : ''}`, 못댄것.length === 0);

      const 온글 = 짠것.장들.flatMap((장) => [장.머리 ?? '', ...장.줄들]).join(' ');
      const 걸린말 = 금지말.filter((w) => 온글.includes(w));
      본다(`⑩ 금지말이 없다${걸린말.length ? ` — ${걸린말.join(' · ')}` : ''}`, 걸린말.length === 0);
    } else {
      본다('⑨ 카드의 수가 전부 근거에 있다', false);
      본다('⑩ 금지말이 없다', false);
    }
  }

  const 실패 = 결과.filter((r) => !r.됐나);
  for (const r of 결과) console.log(`${r.됐나 ? '  ✅' : '  ❌'} ${r.이름}`);
  console.log(`자가시험 ${결과.length - 실패.length}/${결과.length}`);
  return 실패.length === 0;
}

/* ────────────────────────────── 실행 ────────────────────────────── */

const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
}

/** ⛔ 자가시험이 깨지면 그림을 안 만든다. 깨진 자로 2,000장을 찍는 것이 제일 나쁘다 */
if (!자가시험()) {
  console.log('❌ 자가시험이 깨졌다. 그림을 만들지 않는다.');
  process.exit(1);
}

const sharp = (await import('sharp')).default;
fs.mkdirSync(낼방, { recursive: true });
const 자료 = 자료들();
const 대상 = 인자.length ? 인자 : 자료.areas.단위.filter((a) => 한벌로팔만한가(Number(a.곳))).map((a) => a.slug);

let 만든벌 = 0, 만든장 = 0;
const 건너뜀 = [];
for (const slug of 대상) {
  const 짠것 = 짜기(slug, 자료);
  if (!짠것) { 건너뜀.push(slug); continue; }
  const 총 = 짠것.장들.length;
  for (let i = 0; i < 총; i++) {
    const png = await sharp(Buffer.from(그리기(짠것.장들[i], i + 1, 총))).png().toBuffer();
    fs.writeFileSync(path.join(낼방, `${slug}-${i + 1}.png`), png);
    만든장++;
  }
  fs.writeFileSync(path.join(낼방, `${slug}.근거.json`), JSON.stringify({ 지역: 짠것.이름, 장수: 총, 근거: 짠것.근거 }, null, 1));
  만든벌++;
}
console.log(`카드뉴스 ${만든벌}벌 · ${만든장}장 → public/100y/cardnews/`);
if (건너뜀.length) console.log(`⚠ 건너뜀 ${건너뜀.length}곳 (잰 곳이 ${한벌최소}곳 미만): ${건너뜀.slice(0, 5).join(' · ')}`);
console.log('⚠ 한 장을 실제로 열어 글이 안 잘리는지 보고 커밋한다. 근거 json 은 글 쓸 때 그대로 쓴다.');
