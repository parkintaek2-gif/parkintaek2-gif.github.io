/**
 * **안에서 쓰는 말이 밖으로 나가나** — 빌드 결과에서 잰다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-08 10:3x. 8번이 재고 2번이 넓혀 확인했다. K Culture Wire 의 빌드 결과에
 * **HTML 주석 598개가 61장에 실려 나가고 있었다**(한 장 최대 12개).
 * 그 안에 「2번 파일이라」·「사장님 지시」·「server.mjs 가 Host 를 보고」가 그대로 들어 있었다.
 *
 * 사람 눈에는 안 보인다. **그런데 검색엔진과 AI 크롤러는 읽는다** — 우리 실측에서
 * AI 크롤러가 검색엔진의 8.5배였다. 우리 빌드 구조와 세션 사정이 그쪽으로 나가고 있었다.
 *
 * ── 어떻게 고쳤나 ──────────────────────────────────────────────
 * ⛔ **소스 주석을 지우지 않았다.** 그 주석들이 되돌림을 막고 있다.
 *    `.astro` 템플릿의 `<!-- -->` 를 **JSX 주석**으로 바꿨다. 소스에는 그대로 남고 HTML 에는 안 나간다.
 *    빌드 설정(2번 것)을 건드리지 않고 되는 길이라 이쪽을 골랐다.
 *
 * ── ⚠ 주석만 막으면 다음엔 다른 꼴로 샌다 ─────────────────────
 * 3번이 같은 자리에서 넓히신 대로 **네 무늬**를 본다. 주석 하나로만 시험하면
 * 넓힌 무늬가 도는지 알 수 없으므로 **무늬마다 따로 깨뜨려 본다.**
 */
import fs from 'node:fs';
import path from 'node:path';

const D = 'dist/wikitip';
const 첫화면 = 'dist/wikitip.html';

/** 화면에 보이는 글만 남긴다. 붙은 낱말이 생기지 않게 자리를 빈칸으로 바꾼다 */
export function 본문(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

/** 무늬 넷. 이름과 자를 같이 둔다 — 무엇을 재는지 이름으로 읽히게 */
export const 무늬 = [
  {
    이름: 'HTML 주석',
    잰다: (html) => (html.match(/<!--[\s\S]*?-->/g) || [])
      /* 조건부 주석(<!--[if IE]>)은 브라우저가 읽는 표식이라 남긴다 */
      .filter((c) => !/^<!--\[if\s/i.test(c)),
  },
  {
    이름: 'TODO·FIXME',
    잰다: (html) => 본문(html).match(/\b(TODO|FIXME|XXX|HACK)\b\s*[:：]/g) || [],
  },
  {
    이름: '자리 이름·내부 파일',
    잰다: (html) => 본문(html).match(/[1-8]번\s*(파일|것|세션|이라|께)|server\.mjs|세션간-메모|check-[a-z-]+\.mjs|build-once\.mjs/g) || [],
  },
  {
    이름: '안에서 쓰는 표시',
    잰다: (html) => 본문(html).match(/사장님|배포 대기|커밋|자가시험|⛔|본보기-한벌/g) || [],
  },
];

if (process.argv[1] && process.argv[1].endsWith('check-no-internal-leak.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  const 재본다 = (이름, html) => 무늬.find((m) => m.이름 === 이름).잰다(html).length;
  자가('주석을 잡는다', 재본다('HTML 주석', '<p>a</p><!-- 2번 파일이다 -->') === 1);
  자가('조건부 주석은 넘긴다', 재본다('HTML 주석', '<!--[if IE]><b>x</b><![endif]-->') === 0);
  자가('TODO 를 잡는다', 재본다('TODO·FIXME', '<p>TODO: 나중에 고친다</p>') === 1);
  자가('본문의 TODO 만 잡는다', 재본다('TODO·FIXME', '<script>// TODO: x</script>') === 0);
  자가('자리 이름을 잡는다', 재본다('자리 이름·내부 파일', '<p>이건 2번 파일이라 넘겼다</p>') === 1);
  자가('server.mjs 를 잡는다', 재본다('자리 이름·내부 파일', '<p>server.mjs 가 Host 를 본다</p>') === 1);
  자가('내부 표시를 잡는다', 재본다('안에서 쓰는 표시', '<p>사장님 지시로 고쳤다</p>') === 1);
  자가('깨끗한 지면은 0', 무늬.every((m) => m.잰다('<p>Korean titles on Netflix</p>').length === 0));
  /* ⚠ 태그를 지우면서 낱말이 붙으면 없던 말이 생긴다. 빈칸으로 바꾸는지 본다 */
  자가('태그 자리를 빈칸으로', 본문('<b>2</b><i>번</i>').includes(' '));
  console.log(`새는 말 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(D)) { console.error(`⛔ ${D} 가 없다 — node scripts/build-once.mjs 를 먼저 돌린다`); process.exit(1); }

  const 볼것 = [];
  for (const f of fs.readdirSync(D).filter((x) => x.endsWith('.html'))) 볼것.push([f, path.join(D, f)]);
  const AD = path.join(D, 'article');
  if (fs.existsSync(AD)) for (const f of fs.readdirSync(AD).filter((x) => x.endsWith('.html'))) 볼것.push([`article/${f}`, path.join(AD, f)]);
  if (fs.existsSync(첫화면)) 볼것.push(['(첫 화면)', 첫화면]);
  /* 사이트맵·피드·robots 도 나가는 것이다. 거기에 내부 말이 실리면 같은 사고다 */
  for (const f of ['sitemap.xml', 'rss.xml', 'robots.txt']) {
    const p = path.join(D, f);
    if (fs.existsSync(p)) 볼것.push([f, p]);
  }

  const 걸린것 = new Map();   // 무늬 → [지면, 보기]
  for (const [이름, p] of 볼것) {
    const html = fs.readFileSync(p, 'utf8');
    for (const m of 무늬) {
      const 것 = m.잰다(html);
      if (!것.length) continue;
      if (!걸린것.has(m.이름)) 걸린것.set(m.이름, []);
      걸린것.get(m.이름).push({ 이름, n: 것.length, 보기: String(것[0]).replace(/\s+/g, ' ').slice(0, 70) });
    }
  }

  console.log(`잰 것 — ${볼것.length}장`);
  if (걸린것.size) {
    let 총 = 0;
    for (const [무늬이름, 목록] of 걸린것) {
      const n = 목록.reduce((s, x) => s + x.n, 0);
      총 += n;
      console.log(`\n⛔ ${무늬이름} — ${목록.length}장 ${n}건`);
      for (const x of 목록.slice(0, 3)) console.log(`   · ${x.이름} (${x.n}건) — ${x.보기}`);
      if (목록.length > 3) console.log(`   · 외 ${목록.length - 3}장`);
    }
    console.log(`\n🔴 밖으로 나가는 내부 말 ${총}건. 소스 주석은 지우지 말고 **JSX 주석으로 바꾼다.**`);
    process.exit(1);
  }
  console.log('✅ 네 무늬 전부 0건 — 주석·TODO·자리 이름·내부 표시가 나가지 않는다');
}
