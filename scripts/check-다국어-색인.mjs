#!/usr/bin/env node
/**
 * check-다국어-색인.mjs — **검색 색인을 «네 말 전부»로 잰다.**
 *
 * 🔴🔴 사장님 지시 (2026-10-02) — 「**검색색인 다국어로 반드시 작업**」
 *   앞서 못 박아 두신 것 (2026-09-01) — 「**다국어도 전부**」
 *
 * 우리 색인 검사자는 한국어 주소만 재고 있었다. 그런데 KLifeMap 은 ko·en·zh·ja
 * 네 말로 판다. 한국어만 재고 「색인됐다」고 적으면 **바깥 말 손님 셋은 못 본 것**이다.
 *
 * ⚠ 이 자가 특히 노리는 병 — **한글이 바깥 말 지면으로 새는 것.**
 *   `<html lang="en">` 인데 본문이 한국어면 구글은 그 지면을 영어로 안 쳐 준다.
 *   2026-09 에 실제로 「the spirit here: 장성(將星)」 같은 꼴이 영어 화면에 나갔다.
 *
 * 재는 것 넷
 *   ① 말마다 «읽을 글자»가 선(1,800)을 넘나
 *   ② 바깥 말 지면에 **한글이 섞여 있지 않나**
 *   ③ canonical 이 «제 말»을 가리키나 (한국어로 고정되면 나머지는 영영 색인 안 된다)
 *   ④ html lang 이 맞나
 *
 * 쓰는 법
 *   node scripts/check-다국어-색인.mjs
 *   node scripts/check-다국어-색인.mjs --자가시험
 */

export const 말들 = ['ko', 'en', 'zh', 'ja'];
export const 글자선 = 1800;
export const 한글섞임선 = 10;   /* 바깥 말 지면에서 한글이 이 %를 넘으면 샌 것이다 */

export const 볼지면 = [
  'mansecalendar.html', 'saju.html', 'mingli-gunghap.html', 'mingli-taekil.html',
  'ilzin.html', 'daily.html', 'horoscope.html', 'astro.html',
];

export const 주소만들기 = (지면, 말) =>
  `https://klifemap.ai/${지면}${말 === 'ko' ? '' : `?lang=${말}`}`;

/** 구글이 읽을 수 있는 «본문 글자»만 — CSS·자바스크립트는 안 센다 */
export function 읽을글자(html) {
  const 본 = String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const 몸 = (본.match(/<body[\s\S]*<\/body>/i) || [본])[0];
  return 몸.replace(/<[^>]+>/g, '\n')
    .split('\n').map((s) => s.replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, '').trim())
    .filter((s) => s.length >= 2).join(' ').replace(/\s{2,}/g, ' ').trim();
}

/** 한글이 몇 %인가 — 한자는 세지 않는다(중국어·일본어 지면에 한자는 당연하다) */
export function 한글비율(글) {
  const s = String(글 ?? '');
  const 전체 = (s.match(/[가-힣ㄱ-ㆎ一-鿿ぁ-んァ-ヶa-zA-Z]/g) || []).length;
  if (!전체) return 0;
  const 한글 = (s.match(/[가-힣ㄱ-ㆎ]/g) || []).length;
  return Math.round((한글 / 전체) * 100);
}

export function 머리값(html, 이름) {
  if (이름 === 'canonical') {
    const m = String(html ?? '').match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    return m ? m[1] : null;
  }
  if (이름 === 'lang') {
    const m = String(html ?? '').match(/<html[^>]*\slang=["']([^"']+)["']/i);
    return m ? m[1] : null;
  }
  return null;
}

/** 한 지면·한 말을 판정한다 */
export function 판정(말, 잰것) {
  if (!잰것) return { 빛: '⬜', 흠: ['못 쟀다'] };
  const 흠 = [];
  if (잰것.글자수 < 글자선) 흠.push(`글자 ${잰것.글자수}자 (선 ${글자선})`);
  if (말 !== 'ko' && 잰것.한글 > 한글섞임선) 흠.push(`🔴 한글이 ${잰것.한글}% 샜다`);
  if (잰것.lang !== 말) 흠.push(`html lang 이 ${잰것.lang ?? '없음'}`);
  if (!잰것.canonical) 흠.push('canonical 이 없다');
  else if (말 !== 'ko' && !잰것.canonical.includes(`lang=${말}`)) 흠.push('🔴 canonical 이 제 말을 안 가리킨다');
  else if (말 === 'ko' && /lang=/.test(잰것.canonical)) 흠.push('canonical 이 한국어를 안 가리킨다');
  return { 빛: 흠.some((x) => x.startsWith('🔴')) ? '🔴' : 흠.length ? '🟡' : '✅', 흠 };
}

/* ── 자가시험 ──────────────────────────────────────────────── */
if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패 += 1; console.log('🔴 ' + 이름); } };

  검('한국어 주소에는 lang 을 안 붙인다', 주소만들기('a.html', 'ko') === 'https://klifemap.ai/a.html');
  검('바깥 말은 lang 을 붙인다', 주소만들기('a.html', 'ja').endsWith('a.html?lang=ja'));

  검('🔴 CSS 를 글자로 세지 않는다',
    읽을글자('<head><style>body{color:red;padding:20px;margin:0}</style></head><body>가나다</body>').length <= 4);
  검('본문은 센다', 읽을글자('<body><h1>제목</h1><p>본문</p></body>').includes('제목'));

  검('한글 비율을 센다 — 영문 속 한글', 한글비율('abcd가나') === 33);
  검('⛔ 한자는 한글로 안 센다 (중·일 지면에 한자는 당연하다)', 한글비율('天地玄黃') === 0);
  검('일본 가나도 한글이 아니다', 한글비율('ひらがなカタカナ') === 0);
  검('⛔ 빈 것에도 안 터진다', 한글비율('') === 0 && 한글비율(null) === 0);

  검('canonical 을 뽑는다',
    머리값('<link rel="canonical" href="https://a/b?lang=en">', 'canonical') === 'https://a/b?lang=en');
  검('html lang 을 뽑는다', 머리값('<html lang="ja">', 'lang') === 'ja');
  검('⛔ 없으면 null', 머리값('<html>', 'lang') === null);

  const 성한것 = { 글자수: 3000, 한글: 2, lang: 'en', canonical: 'https://a/b.html?lang=en' };
  검('✅ 다 맞으면 초록', 판정('en', 성한것).빛 === '✅');
  검('🔴 한글이 새면 빨강', 판정('en', { ...성한것, 한글: 70 }).빛 === '🔴');
  검('🔴 canonical 이 제 말을 안 가리키면 빨강',
    판정('en', { ...성한것, canonical: 'https://a/b.html' }).빛 === '🔴');
  검('🟡 글자가 모자라면 노랑', 판정('en', { ...성한것, 글자수: 500 }).빛 === '🟡');
  검('🟡 html lang 이 틀리면 노랑', 판정('en', { ...성한것, lang: 'ko' }).빛 === '🟡');
  검('한국어는 lang 없는 canonical 이 맞다',
    판정('ko', { 글자수: 3000, 한글: 90, lang: 'ko', canonical: 'https://a/b.html' }).빛 === '✅');
  검('⛔ 못 쟀으면 흰불', 판정('en', null).빛 === '⬜');

  console.log(`\n${실패 === 0 ? '✅' : '🔴'} 자가시험 ${통과 + 실패}개 중 통과 ${통과}개`);
  process.exit(실패 === 0 ? 0 : 1);
}

/* ── 실제로 잰다 ───────────────────────────────────────────── */
const 구글인척 = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };

console.log('■ 검색 색인 — 네 말 전부로 잰다 (사장님 「검색색인 다국어로 반드시 작업」)\n');
console.log('   지면'.padEnd(26) + 말들.map((m) => m.padStart(7)).join('') + '   흠');

const 모은흠 = [];
for (const 지면 of 볼지면) {
  const 칸 = [];
  const 흠모음 = [];
  for (const 말 of 말들) {
    let 잰것 = null;
    try {
      const r = await fetch(주소만들기(지면, 말), { headers: 구글인척 });
      if (r.ok) {
        const html = await r.text();
        const 글 = 읽을글자(html);
        잰것 = {
          글자수: 글.length, 한글: 한글비율(글),
          lang: 머리값(html, 'lang'), canonical: 머리값(html, 'canonical'),
        };
      }
    } catch { /* 못 재면 null */ }
    const p = 판정(말, 잰것);
    칸.push(p.빛.padStart(7));
    if (p.흠.length) 흠모음.push(`${말}: ${p.흠.join(', ')}`);
    if (p.빛 === '🔴') 모은흠.push({ 지면, 말, 흠: p.흠 });
  }
  console.log(`   ${지면.padEnd(24)}${칸.join('')}   ${흠모음[0] ? 흠모음[0].slice(0, 44) : ''}`);
  for (const h of 흠모음.slice(1)) console.log(`   ${''.padEnd(24)}${''.padEnd(28)}   ${h.slice(0, 44)}`);
}

console.log(`\n■ 말별 요약`);
console.log(`   잰 것 ${볼지면.length}지면 × ${말들.length}말 = ${볼지면.length * 말들.length}자리`);
if (모은흠.length) {
  console.log(`\n🔴 빨간불 ${모은흠.length}자리 — 바깥 말 손님이 못 찾는 자리다`);
  for (const x of 모은흠.slice(0, 12)) console.log(`   · ${x.지면} [${x.말}] ${x.흠.join(' · ')}`);
  process.exitCode = 1;
} else {
  console.log('\n✅ 네 말 모두 색인될 꼴을 갖췄다');
}
