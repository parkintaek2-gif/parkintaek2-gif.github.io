#!/usr/bin/env node
/**
 * 백년지도 **오픈 점검** — `docs/오픈-점검표.md` Ⅲ 을 기계가 재게 한다
 *
 *   node scripts/check-100yearmap-launch.mjs           빌드 산출물(dist/100y)을 잰다
 *   node scripts/check-100yearmap-launch.mjs --live    라이브(100yearmap.com)를 잰다
 *
 * ⭐ 왜 만드나 (2번 지적 2026-08-05) — **「만든 사람은 자기 실수를 못 본다」.**
 *   8/13 21:00 에 2번이 교차감사를 한다. 그 전에 내가 스스로 재는 것을 손으로 하면
 *   내가 보고 싶은 것만 본다. **기계가 세게 한다.**
 *
 * ⛔ 이 검사가 재는 것은 **기계로 잴 수 있는 것뿐**이다.
 *   「3초 안에 뭐 하는 곳인지 아는가」·「375px 에서 표가 깨지는가」는 **눈으로 봐야 한다.**
 *   그건 이 검사가 「못 쟀다」고 말한다. 통과로 세지 않는다.
 *
 * ⚠ 한글 주소를 셸로 시험하지 않는다. 여기서도 Node fetch 로만 잰다.
 */
import fs from 'node:fs';
import path from 'node:path';
/* 🔴 규칙은 한 곳에 있다. 검사도 **같은 값**을 불러 쓴다 — 따로 적으면 검사가 헛돈다 */
import { 최소분모 } from '../src/lib/school-rules.ts';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const DIST = path.join(ROOT, 'dist', '100y');
const LIVE = process.argv.includes('--live');
const ORIGIN = 'https://100yearmap.com';

const 결과 = [];
const 재기 = (항목, 통과, 말) => 결과.push({ 항목, 상태: 통과 ? '✅' : '⛔', 말 });
const 못잼 = (항목, 말) => 결과.push({ 항목, 상태: '⬜', 말 });

/** dist 에서 읽거나 라이브에서 받는다 */
async function 가져오기(경로) {
  if (LIVE) {
    try {
      const r = await fetch(ORIGIN + 경로, { signal: AbortSignal.timeout(20000) });
      return r.ok ? await r.text() : null;
    } catch {
      return null;
    }
  }
  // build.format:'file' — `/major` 는 `major.html`, `/` 는 `../100y.html`
  const 후보 =
    경로 === '/'
      ? [path.join(ROOT, 'dist', '100y.html')]
      : [
          path.join(DIST, 경로.replace(/^\//, '') + '.html'),
          path.join(DIST, 경로.replace(/^\//, '')),
        ];
  for (const p of 후보) if (fs.existsSync(p) && fs.statSync(p).isFile()) return fs.readFileSync(p, 'utf8');
  return null;
}

/** dist 안의 모든 지면 */
function 모든지면() {
  const out = [];
  const 훑기 = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) 훑기(p);
      else if (e.name.endsWith('.html')) out.push(p);
    }
  };
  if (fs.existsSync(DIST)) 훑기(DIST);
  const 첫 = path.join(ROOT, 'dist', '100y.html');
  if (fs.existsSync(첫)) out.push(첫);
  return out;
}

const 태그 = (t, re) => (t?.match(re) ?? [])[1] ?? null;

// ── 3-2 신뢰 (YMYL) ────────────────────────────────────────
const 첫화면 = await 가져오기('/');
if (!첫화면) {
  console.log('⛔ 첫 화면을 못 읽었다. 빌드가 안 돼 있거나 라이브가 죽었다.');
  process.exit(1);
}

const about = await 가져오기('/about');
재기('About 지면', Boolean(about), about ? '있다' : '**없다** — 법인명·주소·연락처·발행 목적을 담은 지면이 필요하다');

const 푸터법인 = /주식회사|Co\.,? ?Ltd/.test(첫화면);
재기('푸터에 발행 주체', 푸터법인, 푸터법인 ? '법인명이 있다' : '없다');

const jsonld = /application\/ld\+json/.test(첫화면);
재기('JSON-LD', jsonld, jsonld ? '있다' : '없다');

const 언론표현 = /언론사|인터넷신문으로 등록|보도 목적|우리 기자/.test(첫화면);
재기('「언론사」 표현 없음', !언론표현, 언론표현 ? '⛔ 쓰고 있다 — 아직 등록 전이다' : '0건');

// ── 3-3 검색 ───────────────────────────────────────────────
const robots = await 가져오기('/robots.txt');
재기('robots.txt', Boolean(robots), robots ? `${robots.length}바이트` : '없다');

const sitemap = await 가져오기('/sitemap.xml');
const smN = sitemap ? (sitemap.match(/<loc>/g) ?? []).length : 0;
재기('sitemap.xml', smN > 0, smN ? `${smN.toLocaleString()} URL` : '없다');

const 자매 = /seoulmarkets\.com/.test(첫화면);
재기('사이트 간 링크', 자매, 자매 ? '서울마켓으로 걸려 있다' : '없다 — 마케팅 두 축 중 하나다');

const canonical = 태그(첫화면, /<link rel="canonical" href="([^"]+)"/);
재기('canonical', Boolean(canonical), canonical ?? '없다');

const og = 태그(첫화면, /og:image" content="([^"]+)"/);
재기('OG 카드', Boolean(og), og ?? '없다 — 카카오톡에 빈 카드가 나간다');

if (!LIVE) {
  const 지면들 = 모든지면();
  const 제목 = new Map();
  const 설명 = new Map();
  let noindex = 0;
  let og없음 = 0;
  let canonical없음 = 0;
  for (const p of 지면들) {
    const t = fs.readFileSync(p, 'utf8');
    const ti = 태그(t, /<title>([^<]*)<\/title>/) ?? '(없음)';
    const de = 태그(t, /<meta name="description" content="([^"]*)"/) ?? '(없음)';
    제목.set(ti, (제목.get(ti) ?? 0) + 1);
    설명.set(de, (설명.get(de) ?? 0) + 1);
    if (/noindex/.test(t)) noindex++;
    if (!/og:image/.test(t)) og없음++;
    if (!/rel="canonical"/.test(t)) canonical없음++;
  }
  const 겹친제목 = [...제목.entries()].filter(([, n]) => n > 1);
  const 겹친설명 = [...설명.entries()].filter(([, n]) => n > 1);

  재기('지면 수', 지면들.length > 0, `${지면들.length.toLocaleString()}장`);
  재기(
    'title 이 지면마다 다른가',
    겹친제목.length === 0,
    겹친제목.length ? `${겹친제목.length}가지가 겹친다 — 예: 「${겹친제목[0][0]}」 ${겹친제목[0][1]}장` : '전부 다르다',
  );
  재기(
    'description 이 지면마다 다른가',
    겹친설명.length === 0,
    겹친설명.length ? `${겹친설명.length}가지가 겹친다 — 예: ${겹친설명[0][1]}장` : '전부 다르다',
  );
  재기('canonical 이 전 지면에', canonical없음 === 0, canonical없음 ? `${canonical없음}장 빠짐` : '전부 있다');
  재기('OG 카드가 전 지면에', og없음 === 0, og없음 ? `${og없음}장 빠짐` : '전부 있다');
  재기(
    'noindex',
    true,
    noindex === 지면들.length
      ? `**전 지면(${noindex.toLocaleString()}장)이 noindex** — 사장님 판단 대기 중이면 정상이다`
      : `${noindex.toLocaleString()}/${지면들.length.toLocaleString()}장`,
  );
  // ⚠ /_astro 로 새어 나간 CSS — 백년지도는 접두사 때문에 404 가 된다. 오류가 안 뜬다
  const 샌것 = 지면들.filter((p) => /<link[^>]+_astro[^>]*\.css/.test(fs.readFileSync(p, 'utf8')));
  재기('CSS 가 /_astro 로 새지 않았나', 샌것.length === 0, 샌것.length ? `⛔ ${샌것.length}장 — 지면이 민얼굴로 나간다` : '없다');
}

// ── 2-8 검색에 열어 놓고 사이트맵에 안 넣은 지면이 있나 ──────
/**
 * 🔴 2026-08-06 — `/after`(대학 이후)를 만들었더니 **검색에는 열려 있는데 사이트맵에 없었다.**
 *
 * 사이트맵은 「이걸 색인해 달라」는 목록이다. 열어 놓고 목록에서 빠뜨리면
 * 그 지면은 스스로 찾아지길 기다리는 수밖에 없다. 반대(사이트맵에 넣고 noindex)는
 * 이미 검사에 있는데, **이쪽 방향은 비어 있었다.**
 *
 * ⚠ 지면 3,800장을 다 견주지 않는다. **고정 지면**만 본다 —
 *   학과·학교·대학은 만드는 곳이 한 곳이라 통째로 빠지지 않는다.
 *   빠뜨리는 것은 늘 **손으로 한 줄씩 적는 고정 지면**이다.
 */
if (!LIVE && sitemap) {
  const 고정지면 = fs
    .readdirSync(DIST, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html') && e.name !== '404.html')
    .map((e) => '/' + e.name.replace(/\.html$/, ''));
  const 빠진것 = [];
  for (const 길 of 고정지면) {
    const 글 = fs.readFileSync(path.join(DIST, 길.slice(1) + '.html'), 'utf8');
    if (/noindex/.test(글)) continue; // 닫아 둔 것은 안 넣는 게 맞다
    if (!sitemap.includes(`${ORIGIN}${길}<`) && !sitemap.includes(`${ORIGIN}${길}</loc>`)) 빠진것.push(길);
  }
  재기(
    '연 지면이 사이트맵에 다 있나',
    빠진것.length === 0,
    빠진것.length
      ? `⛔ 검색엔 열렸는데 사이트맵에 없다 — ${빠진것.join(' · ')}`
      : `고정 지면 ${고정지면.length}장 · 빠진 것 없다`,
  );
}

// ── 2-9 숫자 문장이 스스로 어긋나지 않나 ────────────────────
/**
 * 🔴 **사장님이 직접 잡으신 것** (2026-08-06) — 대학 취업률 문장 8곳
 *
 *     지면    「100명 가운데 **63명**이 취업했습니다. 전국 평균 62.8%보다 0.1%p 낮습니다」
 *     읽히는 것  63 vs 62.8 → **높은데** 왜 낮다는 건가
 *
 * 본문은 반올림, 비교는 원값이었다. **두 숫자가 한 문단에 나란히 서면 독자가 계산한다.**
 *
 * ⚠ 자료가 갱신되면 또 난다. 그래서 **만들어진 지면을 직접 읽어** 잰다 —
 *   자료를 재면 「지면이 그 자료를 어떻게 쓰는지」를 못 본다. 8/6 에 그 차이로 한 번 헛짚었다.
 *
 * 재는 법 — 「전국 평균 A%보다 B%p 높/낮습니다」를 찾고, **그 앞 50자 안에 있는
 * 숫자가 A 와 반대 방향이면** 잡는다. 반올림값이 옆에 서 있으면 여기서 걸린다.
 *
 * ⚠ **아무 숫자나 보면 안 된다.** 처음에 그렇게 만들었더니 머리말의 「재적학생 9,622명」이
 *   걸려 142건이 나왔다. 9,622명은 62.8% 와 견줄 수 있는 숫자가 아니다 — **눈금이 다르다.**
 *   같은 눈금인 것은 둘뿐이다.
 *     ① `…%`            비율 그대로
 *     ② `…명` 중 **100 이하**   「100명 가운데 63명」 꼴이라 비율처럼 읽힌다. 8/6 사고가 이것이었다
 *   9,622명·1,476명 같은 실제 머릿수는 비율로 읽히지 않으므로 뺀다.
 *
 * ⚠ 그런데 **머릿수가 100 이하인 학교가 있다** — 광주가톨릭대는 재적학생이 97명이다.
 *   크기만으로 가르면 그런 학교가 헛걸린다. 그래서 **앞에 붙은 이름표도 본다.**
 *   「재적학생 97명」처럼 머릿수라고 적혀 있으면 비율로 읽지 않는다.
 */
const 머릿수이름표 = /(재적학생|졸업자|취업자|취업대상자|중도탈락자|신입생|정원|전임교원)\s*$/;
const 같은눈금 = (값, 단위) => (단위 === '%' ? true : 값 <= 100);
function 어긋난문장(글) {
  const 걸림 = [];
  const 비교 = /전국 평균[(\s]*([\d.]+)%[)\s]*보다\s*([\d.]+)%p\s*(높|낮)습니다/g;
  for (const m of 글.matchAll(비교)) {
    const 평균 = Number(m[1]);
    const 방향 = m[3] === '높' ? 1 : -1;
    const 앞 = 글.slice(Math.max(0, m.index - 50), m.index);
    for (const t of 앞.matchAll(/([\d,]+(?:\.\d+)?)\s*(%|명)/g)) {
      const v = Number(t[1].replace(/,/g, ''));
      if (!Number.isFinite(v) || !같은눈금(v, t[2])) continue;
      if (머릿수이름표.test(앞.slice(0, t.index))) continue;
      if (Math.sign(v - 평균) === -방향) {
        걸림.push(`「${t[0]}」 옆에서 「전국 평균 ${평균}%보다 ${m[3]}습니다」`);
      }
    }
  }
  return 걸림;
}

/* ⚠ 자가시험 — **8/6 에 실제로 나갔던 문장**을 넣어 이 검사가 그때를 잡는지 본다.
   초록불은 망가뜨려 보기 전까지 아무 뜻이 없다. */
{
  const 그때 = '취업한 사람 63명 취업률 62.5% · 전국 평균 62.8%보다 0.3%p 낮습니다';
  const 지금 = '취업한 비율 62.5% 전국 평균 62.8%보다 0.3%p 낮습니다 · 실제로는 2,345명 중 1,470명';
  const 정상 = '취업한 비율 70.0% 전국 평균 62.8%보다 7.2%p 높습니다';
  /* ⚠ 142건 헛경보를 낸 그 문장. **머릿수는 걸리면 안 된다** */
  const 머릿수 = '재적학생 9,622명 취업한 비율 60.1% 전국 평균 62.8%보다 2.7%p 낮습니다';
  /* ⚠ 광주가톨릭대 — **머릿수가 100 이하인 학교.** 크기만으로 가르면 이게 헛걸린다 */
  const 작은학교 = '재적학생 97명 취업한 비율 0% 전국 평균 62.8%보다 62.8%p 낮습니다';
  for (const [글, 왜] of [[머릿수, '머릿수(9,622명)'], [작은학교, '작은 학교의 머릿수(97명)']]) {
    if (어긋난문장(글).length > 0) {
      console.log(`⛔ 자가시험 실패 — ${왜}를 비율로 잘못 읽는다`);
      process.exit(1);
    }
  }
  if (어긋난문장(그때).length === 0 || 어긋난문장(지금).length > 0 || 어긋난문장(정상).length > 0) {
    console.log('⛔ 자가시험 실패 — 「어긋난 문장」 검사가 헛돈다. 고치기 전에는 결과를 믿지 않는다.');
    process.exit(1);
  }
}

if (!LIVE) {
  const 대학지면 = 모든지면().filter((p) => p.includes(`${path.sep}university${path.sep}`));
  const 걸린곳 = [];
  for (const p of 대학지면) {
    const 글 = fs.readFileSync(p, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
    for (const b of 어긋난문장(글)) 걸린곳.push(`${path.basename(p)} ${b}`);
  }
  재기(
    '반올림이 비교를 뒤집나',
    걸린곳.length === 0,
    걸린곳.length ? `⛔ ${걸린곳.length}건 — ${걸린곳[0]} …` : `대학 ${대학지면.length}장 · 어긋난 곳 없다`,
  );
}

// ── 2-10 나눌 사람이 0명인 학교를 「꼴찌」로 내보내지 않나 ──
/**
 * 🔴 위 검사를 만들다 딸려 나온 것 (2026-08-06 · 10곳)
 *
 *   광주가톨릭대  취업대상자 **0명** → 지면은 「0%가 취업했습니다 · 전국 평균보다 62.8%p 낮습니다」
 *
 * 0/0 이라 **비율이 아예 만들어지지 않는 것**을 전국 꼴찌로 내보내고 있었다.
 * 신학대·가톨릭대·승가대 아홉 곳과 한국에너지공대(2022년 개교)다.
 * 학부모는 「이 학교는 취업이 0」으로 읽는다. **사실과 정반대다.**
 */
if (!LIVE) {
  const 대학자료 = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src', 'data', '100yearmap', 'pages-university.json'), 'utf8'),
  );
  const 셀대상없는곳 = 대학자료.filter((u) => u.취업대상자 === 0 && u.취업률);
  const 새는곳 = [];
  for (const u of 셀대상없는곳) {
    const p = path.join(DIST, u.url.replace(/^\//, '') + '.html');
    if (!fs.existsSync(p)) continue;
    const 글 = fs.readFileSync(p, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
    if (/취업률[^가-힣]{0,12}전국/.test(글) || /0%[^가-힣]{0,12}취업률/.test(글)) 새는곳.push(`${u.표시명} 숫자칸에 0%`);
    else if (!/취업률이 나오지 않습니다/.test(글)) 새는곳.push(`${u.표시명} 「나오지 않습니다」 설명이 없다`);
  }
  재기(
    '나눌 사람 0명을 꼴찌로 쓰나',
    새는곳.length === 0,
    새는곳.length
      ? `⛔ ${새는곳.length}건 — ${새는곳[0]} …`
      : `${셀대상없는곳.length}곳 모두 「셀 대상이 없다」로 나간다`,
  );
}

// ── 2-11 분모가 작은데 비율을 쓰지 않나 ─────────────────────
/**
 * 🔴 **2026-08-06 전 사이트 규칙** (2번) — *「분모가 작으면 비율을 내지 않고 실제 수로 말한다」*
 *
 * 같은 함정에 **세 번** 걸렸다. 형태만 바뀌었다.
 * ```
 * ① 대학 취업률   취업대상자 **0명**인 열 곳이 「전국 꼴찌」로 나갈 뻔했다
 * ② 반올림       62.7 을 63 으로 적고 62.8 과 견줘 방향이 뒤집힌 8곳
 * ③ 학업중단     재학 **3명** 학교가 「학업중단률 100%」로 나갈 뻔했다 (상동고·영월)
 * ```
 * 시골 작은 학교에 그런 딱지가 붙으면 **되돌릴 수 없다.**
 *
 * 재는 법 — 학교 지면에서 「재학생 N명 가운데 … M명」 다음에 **비율(%)이 붙었는데
 * N 이 문턱보다 작으면** 잡는다. 문턱은 수집기와 같아야 한다.
 */
const 작은분모 = 최소분모;
if (!LIVE) {
  const 학교지면 = 모든지면().filter((p) => p.includes(`${path.sep}school${path.sep}`));
  const 걸린곳 = [];
  for (const p of 학교지면) {
    const 글 = fs.readFileSync(p, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
    const m = 글.match(/재학생\s*([\d,]+)명 가운데[\s\S]{0,80}?(\d+)명([\s\S]{0,40})/);
    if (!m) continue;
    const 재학 = Number(m[1].replace(/,/g, ''));
    const 뒤 = m[3] ?? '';
    if (Number.isFinite(재학) && 재학 < 작은분모 && /\d+(\.\d+)?%/.test(뒤)) {
      걸린곳.push(`${path.basename(p)} 재학 ${재학}명인데 비율을 썼다`);
    }
  }
  재기(
    '분모가 작은데 비율을 쓰나',
    걸린곳.length === 0,
    걸린곳.length
      ? `⛔ ${걸린곳.length}건 — ${걸린곳[0]} …`
      : `학교 ${학교지면.length.toLocaleString()}장 · 재학 ${작은분모}명 미만에 비율 쓴 곳 없다`,
  );
}

// ── 2-x 마크다운이 날것으로 찍히나 ─────────────────────────
/**
 * 🔴 **원자료 문자열을 그대로 찍다가 서식 기호가 손님 화면에 나가는 자리**를 잡는다.
 *
 *   2026-08-07 에 1번이 겪었다 — 콘텐츠 렌더러에 표 갈래가 없어 **220편이 파이프째** 찍혔다.
 *   그 말을 듣고 우리 지면 4,700장을 훑었더니 **우리에게도 하나 있었다.**
 *
 *   ```
 *   /research  저자 ["김민섭","양희승","윤참나|최재성"]  → 「윤참나|최재성」이 **한 사람 이름**으로
 *   ```
 *
 *   ⛔ 이런 것은 **오류가 안 뜬다.** 글자를 하나도 안 잃으니 링크도 살고 아무도 안 죽는다.
 *     그래서 검사가 없으면 영영 모른다. 손님만 본다.
 *   ⚠ 코드 블록·표 안의 정상적인 세로줄과 헷갈리지 않게 **본문 글자만** 본다.
 */
{
  const 본문만 = (h) =>
    h
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
  const 무늬 = {
    '굵게(**)': /\*\*[^*\n]{2,60}\*\*/,
    /**
     * ⚠ 여기서 두 번 고쳤다. 그 과정을 남긴다.
     *
     *   1차  파이프 **둘**을 요구했다 → 일부러 깨뜨려 보니 **안 잡혔다.**
     *        실제 사고는 「윤참나|최재성」처럼 하나짜리로도 난다
     *   2차  글자 사이의 한 개를 잡게 넓혔다 → 이번엔 **헛걸렸다.**
     *        KDI 원본 제목이 「2023년 02월호 | 세계화의 재구성」이다. 저쪽 제목의 일부다
     *   3차  **공백 없이 글자에 붙은** 세로줄만 잡는다. 새는 것은 늘 이 모양이다
     *
     * ⭐ 검사를 만들면 **일부러 깨뜨려 본다.** 안 그러면 통과가 「이상 없음」인지
     *   「못 재고 있음」인지 구분이 안 된다 — 오늘 1번이 걸린 것이 바로 그것이다.
     */
    '표 세로줄(|)': /(?:\S\||\|\S)/,
    '표 구분선': /\|\s*-{3,}\s*\|/,
    '머리글(##)': /(^|\s)#{2,4}\s+\S/,
    '링크 대괄호': /\[[^\]\n]{2,40}\]\([^)\s]{4,}\)/,
  };
  const 걸린것 = [];
  const 볼지면 = 모든지면();
  for (const p of 볼지면) {
    let 글;
    try {
      글 = 본문만(fs.readFileSync(p, 'utf8'));
    } catch {
      continue; // 다른 세션 빌드가 dist 를 비우는 중일 수 있다
    }
    for (const [이름, re] of Object.entries(무늬)) {
      const m = re.exec(글);
      if (m) {
        걸린것.push(`${path.basename(p)} ${이름} — ${m[0].replace(/\s+/g, ' ').slice(0, 40)}`);
        break;
      }
    }
  }
  재기(
    '마크다운이 날것으로 찍히나',
    걸린것.length === 0,
    걸린것.length
      ? `⛔ ${걸린것.length}장 — ${걸린것[0]} …`
      : `지면 ${볼지면.length.toLocaleString()}장 · 서식 기호가 새 나간 곳 없다`,
  );
}

// ── 3-1 그릇 · 눈으로 봐야 하는 것 ──────────────────────────
/** ⚠ 아래 셋은 **이 검사가 못 잰다.** 통과로 세지 않는다.
 *  다만 밖에서 잰 것이 있으면 그 결과를 여기 적어 둔다 — 「안 쟀다」와 「재고 나서 이렇다」는 다르다. */
못잼(
  '375px 가로 스크롤',
  '⭐ 2026-08-06 03:1x 크롬으로 **다시 쟀다**(메뉴 칸이 하나 늘어서) — 지면 10곳 · 375·320px ' +
    '**가로 넘침 0 · 낱말 안에서 갈린 메뉴칸 0**. 그때 둘을 잡아 고쳤다 — ' +
    '`/after` 의 숫자칸이 101px 넘쳤고(설명 문장을 3칸 격자에 넣었다), ' +
    '메뉴가 「대학/이후」처럼 낱말 안에서 갈렸다. 지면이 바뀌면 다시 잰다',
);
못잼('첫 화면 3초 판정', '사람이 봐야 한다. 8/13 교차감사에서 2번이 본다');
못잼('인쇄 페이지 나눔', '@media print 는 넣었고 흰 종이 대비도 쟀는데, **실제 출력은 아직 못 봤다**');

// ── 출력 ───────────────────────────────────────────────────
console.log(`백년지도 오픈 점검 — ${LIVE ? '라이브' : 'dist/100y'}\n`);
for (const r of 결과) console.log(`  ${r.상태} ${r.항목.padEnd(26)} ${r.말}`);

const 실패 = 결과.filter((r) => r.상태 === '⛔');
const 못잰것 = 결과.filter((r) => r.상태 === '⬜');
console.log(
  `\n통과 ${결과.length - 실패.length - 못잰것.length} · ⛔ ${실패.length} · ⬜ 못 잼 ${못잰것.length}`,
);
if (실패.length) console.log('\n⛔ 위 항목을 8/13 전에 처리한다.');
process.exit(실패.length ? 1 : 0);
