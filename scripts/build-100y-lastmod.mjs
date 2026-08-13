#!/usr/bin/env node
/**
 * 백년지도 사이트맵의 **`<lastmod>` 를 만든다.**
 *
 *   node scripts/build-100y-lastmod.mjs --자가시험
 *   node scripts/build-100y-lastmod.mjs           src/data/100yearmap/lastmod.json 을 다시 쓴다
 *
 * ## 🔴 왜 만드나
 *
 *   2026-08-14 에 쟀다 — 네이버가 담고 있는 우리 지면은 **첫 화면 한 장뿐**이다.
 *   우리 쪽을 다 뒤졌다. robots 는 Yeti 를 안 막고, 사이트맵은 4,772장에 0.63MB 로 한도 안이고,
 *   표본 주소는 다 200 이고, 첫 화면에서 **두 걸음이면 400장에 닿는다**(링크로 실제로 걸어 봤다).
 *   ⭐ **딱 하나 없는 것이 `<lastmod>` 였다.**
 *
 *   `<lastmod>` 가 없으면 크롤러는 「무엇이 새것인지」를 못 고른다. 4,772장을 통째로
 *   다시 받아 보든가 아니면 안 온다. 있으면 바뀐 것부터 골라 온다.
 *
 * ## ⛔ 거짓 날짜를 넣지 않는다 — 그것이 이 자의 전부다
 *
 *   빌드한 날을 4,772장에 다 박으면 **매일 전부 바뀌었다는 거짓말**이 된다.
 *   크롤러는 그걸 곧 알아채고 lastmod 를 통째로 무시한다. 없느니만 못하다.
 *
 *   그래서 **git 이 아는 진짜 날**만 쓴다 —
 *     지면 하나의 날 = max(그 지면을 그리는 소스가 바뀐 날, 그 지면이 읽는 자료가 바뀐 날)
 *   git 이 모르면 그 갈래는 **lastmod 를 안 붙인다**. 빈칸이 거짓보다 낫다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/* ⚠ new URL(...).pathname 은 한글 폴더를 %EC.. 로 바꾼다. fileURLToPath 를 쓴다 */
export const 뿌리 = fileURLToPath(new URL('..', import.meta.url));
export const 나갈곳 = 'src/data/100yearmap/lastmod.json';

/** 어느 갈래가 무엇에 기대나. ⚠ sitemap.xml.ts 의 import 목록과 짝이 맞아야 한다 */
export const 갈래 = {
  '/': ['src/pages/100y/index.astro'],
  '/about': ['src/pages/100y/about.astro'],
  '/price': ['src/pages/100y/price.astro', 'src/lib/price.ts'],
  '/terms': ['src/pages/100y/terms.astro'],
  '/privacy': ['src/pages/100y/privacy.astro'],
  '/refund': ['src/pages/100y/refund.astro'],
  '/after': ['src/pages/100y/after/index.astro'],
  '/work': ['src/pages/100y/work/index.astro'],
  '/how-long': ['src/pages/100y/how-long/index.astro'],
  '/size': ['src/pages/100y/size/index.astro'],
  '/data': ['src/pages/100y/data/index.astro'],
  '/research': ['src/pages/100y/research/index.astro'],
  '/sitemap-image.xml': ['src/pages/100y/sitemap-image.xml.ts'],
  '/video': ['src/pages/100y/video/index.astro', 'src/data/100yearmap/videos.json'],
  '/region': ['src/pages/100y/region/index.astro', 'src/data/100yearmap/pages-school.json'],
  '/age': ['src/pages/100y/age/index.astro', 'src/data/100yearmap/age-axis.json'],
  '/major': ['src/pages/100y/major/index.astro', 'src/data/100yearmap/pages-major.json'],
  '/college-major': ['src/pages/100y/college-major/index.astro', 'src/data/100yearmap/major-outcomes.json'],
  '/school': ['src/pages/100y/school/index.astro', 'src/data/100yearmap/pages-school.json'],
  '/university': ['src/pages/100y/university/index.astro', 'src/data/100yearmap/pages-university.json'],

  /* 여러 장짜리 갈래 — 그 갈래 전체가 한 날을 쓴다. 장마다 다른 날을 댈 근거가 없다 */
  '갈래:region': ['src/pages/100y/region/[slug].astro', 'src/data/100yearmap/pages-school.json'],
  '갈래:age': ['src/pages/100y/age/[age].astro', 'src/data/100yearmap/age-axis.json'],
  '갈래:life': ['src/pages/100y/life/[layer].astro', 'src/lib/age-layer.ts', 'src/data/100yearmap/age-axis.json'],
  '갈래:major': ['src/pages/100y/major/[slug].astro', 'src/data/100yearmap/pages-major.json'],
  '갈래:college-major': ['src/pages/100y/college-major/[slug].astro', 'src/data/100yearmap/major-outcomes.json'],
  '갈래:school': [
    'src/pages/100y/school/[code].astro',
    'src/data/100yearmap/pages-school.json',
    'src/data/100yearmap/school-dropout.json',
    'src/data/100yearmap/school-class-size.json',
  ],
  '갈래:university': ['src/pages/100y/university/[id].astro', 'src/data/100yearmap/pages-university.json'],
  '갈래:area': ['src/pages/100y/report/area/[slug].astro', 'src/data/100yearmap/areas.json', 'src/data/100yearmap/pages-school.json'],
  '갈래:report': ['src/pages/100y/report/[code].astro', 'src/data/100yearmap/pages-school.json'],
};

/** git 이 아는 그 파일의 마지막 커밋 날(YYYY-MM-DD). 모르면 null */
export function 파일날(길, 여기 = 뿌리) {
  if (!fs.existsSync(path.join(여기, 길))) return null;
  try {
    const 답 = execFileSync('git', ['log', '-1', '--format=%cs', '--', 길], {
      cwd: 여기, encoding: 'utf8',
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(답) ? 답 : null;
  } catch {
    return null;
  }
}

/** 여러 날 가운데 **가장 나중**. ⛔ 하나도 없으면 null — 아무 날이나 지어내지 않는다 */
export function 늦은날(날들) {
  const 쓸것 = (날들 ?? []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d ?? '')));
  return 쓸것.length ? 쓸것.slice().sort()[쓸것.length - 1] : null;
}

/** 사이트맵 한 줄의 길이 어느 갈래인가. ⚠ 긴 것부터 본다 — /age 와 /age/32 가 다르다 */
export function 갈래찾기(길) {
  if (길 === '/') return '/';
  const 마디 = 길.split('/').filter(Boolean);
  if (마디.length === 1) return '/' + 마디[0];
  if (마디[0] === 'report' && 마디[1] === 'area') return '갈래:area';
  if (마디[0] === 'report') return '갈래:report';
  return '갈래:' + 마디[0];
}

// ── 자가시험 ────────────────────────────────────────────────────────────────
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 본다 = (이름, 참인가) => { if (참인가) 통과++; else { 실패++; console.error('  ✗ ' + 이름); } };

  본다('① 늦은 날을 고른다', 늦은날(['2026-08-01', '2026-08-13', '2026-08-09']) === '2026-08-13');
  본다('② 🔴 하나도 없으면 null — 날을 지어내지 않는다', 늦은날([]) === null);
  본다('③ 🔴 꼴이 틀린 것은 버린다', 늦은날(['어제', null, '2026-08-02']) === '2026-08-02');
  본다('④ 다 틀리면 null', 늦은날(['어제', undefined]) === null);

  본다('⑤ 첫 화면', 갈래찾기('/') === '/');
  본다('⑥ 고정 지면', 갈래찾기('/price') === '/price');
  본다('⑦ /age 와 /age/32 를 가른다', 갈래찾기('/age') === '/age' && 갈래찾기('/age/32') === '갈래:age');
  본다('⑧ 지역 한 벌', 갈래찾기('/report/area/서울특별시-노원구') === '갈래:area');
  본다('⑨ 학교 한 곳 리포트는 다른 갈래', 갈래찾기('/report/7010057') === '갈래:report');
  본다('⑩ 학교', 갈래찾기('/school/7010057') === '갈래:school');
  본다('⑪ 한글 학과 주소', 갈래찾기('/major/조리과') === '갈래:major');

  본다('⑫ 🔴 없는 파일은 null 이다', 파일날('src/pages/100y/없는것.astro') === null);
  const 진짜 = 파일날('src/lib/price.ts');
  본다('⑬ 있는 파일은 날이 나온다', /^\d{4}-\d{2}-\d{2}$/.test(String(진짜)));

  /* 🔴 이 자의 핵심 — 갈래 표가 **정말 있는 파일**을 가리키나.
     하나라도 없으면 그 갈래는 조용히 lastmod 를 잃는다 */
  const 없는것 = [];
  for (const [이름, 길들] of Object.entries(갈래))
    for (const 길 of 길들) if (!fs.existsSync(path.join(뿌리, 길))) 없는것.push(이름 + ' → ' + 길);
  본다('⑭ 🔴 갈래 표가 가리키는 파일이 다 있다' + (없는것.length ? ' — 없는 것: ' + 없는것.join(', ') : ''),
       없는것.length === 0);

  본다('⑮ 갈래가 스물 넘는다', Object.keys(갈래).length >= 20);

  console.log(실패 === 0 ? `✅ 자가시험 ${통과}개 통과` : `❌ ${실패}개 실패 (통과 ${통과})`);
  process.exit(실패 === 0 ? 0 : 1);
}

if (내가실행됐다) {
  const 답 = {};
  let 빈것 = 0;
  for (const [이름, 길들] of Object.entries(갈래)) {
    const 날 = 늦은날(길들.map((p) => 파일날(p)));
    if (날) 답[이름] = 날; else 빈것++;
  }
  const 글 = JSON.stringify({
    무엇인가: '백년지도 사이트맵 <lastmod> — git 이 아는 진짜 날만 담는다',
    ['⛔']: '손으로 고치지 않는다. node scripts/build-100y-lastmod.mjs 가 다시 쓴다',
    만든자: 'scripts/build-100y-lastmod.mjs',
    날: 답,
  }, null, 2) + '\n';
  fs.writeFileSync(path.join(뿌리, 나갈곳), 글, 'utf8');
  console.log(`✅ ${나갈곳} — 갈래 ${Object.keys(답).length}개에 날을 넣었다` +
    (빈것 ? ` (git 이 모르는 ${빈것}개는 비웠다)` : ''));
  for (const [k, v] of Object.entries(답)) console.log('   ' + k.padEnd(22) + v);
}
