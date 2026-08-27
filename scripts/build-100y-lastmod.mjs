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

  /* 2026-08-27 — 5번이 kculturewire에서 겪은 것과 같은 흠(손으로 적은 짝이 새 지면을
     빠뜨림)을 백년지도 사이트맵에서도 발견해 35갈래를 채운다. 각 지면이 실제로 import 하는
     data/100yearmap/*.json 을 grep 으로 뽑아 넣었다 — 지어내지 않았다 */
  '/elementary': ['src/pages/100y/elementary/index.astro', 'src/data/100yearmap/elementary.json'],
  '/nursery': ['src/pages/100y/nursery/index.astro', 'src/data/100yearmap/nursery-none.json', 'src/data/100yearmap/kindergarten.json'],
  '/nursery-fill': ['src/pages/100y/nursery-fill/index.astro', 'src/data/100yearmap/nursery-fill.json'],
  '/hiking': ['src/pages/100y/hiking/index.astro', 'src/data/100yearmap/hiking.json'],
  '/golf': ['src/pages/100y/golf/index.astro', 'src/data/100yearmap/golf.json'],
  '/workout': ['src/pages/100y/workout/index.astro', 'src/data/100yearmap/workout.json'],
  '/cycling': ['src/pages/100y/cycling/index.astro', 'src/data/100yearmap/cycling.json'],
  '/swimming': ['src/pages/100y/swimming/index.astro', 'src/data/100yearmap/swimming.json'],
  '/soccer': ['src/pages/100y/soccer/index.astro', 'src/data/100yearmap/soccer.json'],
  '/parental-leave': ['src/pages/100y/parental-leave/index.astro', 'src/data/100yearmap/parental-leave.json'],
  '/kindergarten': ['src/pages/100y/kindergarten/index.astro', 'src/data/100yearmap/kindergarten.json'],
  '/longest-job': ['src/pages/100y/longest-job/index.astro', 'src/data/100yearmap/longest-job.json'],
  '/afterschool': ['src/pages/100y/afterschool/index.astro', 'src/data/100yearmap/afterschool.json'],
  '/years-left': ['src/pages/100y/years-left/index.astro', 'src/data/100yearmap/years-left.json'],
  '/healthy-years': ['src/pages/100y/healthy-years/index.astro', 'src/data/100yearmap/healthy-years.json', 'src/data/100yearmap/years-left.json'],
  '/pediatrics': ['src/pages/100y/pediatrics/index.astro', 'src/data/100yearmap/pediatrics.json'],
  '/keep-working': ['src/pages/100y/keep-working/index.astro', 'src/data/100yearmap/keep-working.json', 'src/data/100yearmap/longest-job.json'],
  '/first-job': ['src/pages/100y/first-job/index.astro', 'src/data/100yearmap/first-job.json', 'src/data/100yearmap/longest-job.json'],
  '/marriage-age': ['src/pages/100y/marriage-age/index.astro', 'src/data/100yearmap/marriage-age.json', 'src/data/100yearmap/first-job.json'],
  '/care': ['src/pages/100y/care/index.astro', 'src/data/100yearmap/care.json', 'src/data/100yearmap/years-left.json', 'src/data/100yearmap/keep-working.json'],
  '/breakfast': ['src/pages/100y/breakfast/index.astro', 'src/data/100yearmap/breakfast.json', 'src/data/100yearmap/first-job.json'],
  '/home': ['src/pages/100y/home/index.astro', 'src/data/100yearmap/home.json', 'src/data/100yearmap/longest-job.json', 'src/data/100yearmap/marriage-age.json'],
  '/spending': ['src/pages/100y/spending/index.astro', 'src/data/100yearmap/spending.json', 'src/data/100yearmap/home.json'],
  '/pets': ['src/pages/100y/pets/index.astro', 'src/data/100yearmap/pets.json'],
  '/travel': ['src/pages/100y/travel/index.astro', 'src/data/100yearmap/travel.json'],
  '/promotion': ['src/pages/100y/promotion/index.astro', 'src/data/100yearmap/promotion.json'],
  '/exercise': ['src/pages/100y/exercise/index.astro', 'src/data/100yearmap/exercise.json'],
  '/oneperson': ['src/pages/100y/oneperson/index.astro', 'src/data/100yearmap/oneperson.json'],
  '/lifelong': ['src/pages/100y/lifelong/index.astro', 'src/data/100yearmap/lifelong.json'],
  '/retire-income': ['src/pages/100y/retire-income/index.astro', 'src/data/100yearmap/retire-income.json'],
  '/polytech': ['src/pages/100y/polytech/index.astro', 'src/data/100yearmap/polytech.json'],
  '/pension': ['src/pages/100y/pension/index.astro', 'src/data/100yearmap/pension-recipients.json'],
  '/training-card': ['src/pages/100y/training-card/index.astro', 'src/data/100yearmap/training-card.json'],
  '/before': [
    'src/pages/100y/before/index.astro', 'src/data/100yearmap/nursery-none.json', 'src/data/100yearmap/kindergarten.json',
    'src/data/100yearmap/pediatrics.json', 'src/data/100yearmap/afterschool.json', 'src/data/100yearmap/elementary.json',
    'src/data/100yearmap/breakfast.json',
  ],
  '/ages': [
    'src/pages/100y/ages/index.astro', 'src/data/100yearmap/nursery-none.json', 'src/data/100yearmap/kindergarten.json',
    'src/data/100yearmap/afterschool.json', 'src/data/100yearmap/pediatrics.json', 'src/data/100yearmap/elementary.json',
    'src/data/100yearmap/longest-job.json', 'src/data/100yearmap/years-left.json', 'src/data/100yearmap/healthy-years.json',
    'src/data/100yearmap/keep-working.json', 'src/data/100yearmap/first-job.json', 'src/data/100yearmap/marriage-age.json',
    'src/data/100yearmap/care.json', 'src/data/100yearmap/breakfast.json', 'src/data/100yearmap/home.json',
    'src/data/100yearmap/spending.json', 'src/data/100yearmap/pets.json', 'src/data/100yearmap/travel.json',
    'src/data/100yearmap/promotion.json', 'src/data/100yearmap/exercise.json', 'src/data/100yearmap/oneperson.json',
    'src/data/100yearmap/lifelong.json', 'src/data/100yearmap/retire-income.json', 'src/data/100yearmap/polytech.json',
    'src/data/100yearmap/pension-recipients.json', 'src/data/100yearmap/training-card.json',
  ],

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

  /* 🔴 2026-08-27 — ⑭는 «틀린 것»만 잡지 «빠뜨린 것»은 못 잡는다. 5번이 kculturewire에서
     겪은 것과 같은 흠(고정 지면을 만들었는데 갈래에 안 넣음)이 백년지도에도 35갈래나
     있었다. sitemap.xml.ts 의 고정 경로(`path: '/word'`, 나머지 슬래시 없는 것)를 직접
     읽어 갈래 표에 짝이 있는지 대조한다 — 새 지면을 만들고 여기 안 넣으면 이 시험이 잡는다 */
  const 사이트맵글 = fs.readFileSync(path.join(뿌리, 'src/pages/100y/sitemap.xml.ts'), 'utf8');
  const 고정경로들 = [...new Set([...사이트맵글.matchAll(/path:\s*'(\/[a-z0-9-]+)'/g)].map((m) => m[1]))];
  const 안낀것 = ['/', ...고정경로들].filter((p) => !(p in 갈래));
  본다('⑯ 🔴 sitemap.xml.ts 의 고정 지면이 갈래 표에 다 있다' + (안낀것.length ? ' — 빠진 것: ' + 안낀것.join(', ') : ''),
       안낀것.length === 0);

  본다('⑰ 갈래가 쉰 넘는다', Object.keys(갈래).length >= 50);

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
