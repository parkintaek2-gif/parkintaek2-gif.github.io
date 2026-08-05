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

// ── 3-1 그릇 · 눈으로 봐야 하는 것 ──────────────────────────
못잼('첫 화면 3초 판정', '사람이 봐야 한다. 8/13 교차감사에서 2번이 본다');
못잼('375px 가로 스크롤', '실제 브라우저로 봐야 한다. 스크린샷을 남긴다');
못잼('인쇄 페이지 나눔', '@media print 는 넣었고 대비도 쟀는데, 실제 출력은 아직 못 봤다');

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
