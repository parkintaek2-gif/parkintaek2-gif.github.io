#!/usr/bin/env node
/**
 * check-adsense-셋이맞나.mjs
 *   — **네 사이트의 애드센스 «세 자리»가 같은 계정을 가리키나를 라이브에서 잰다.**
 *
 * ── 🔴🔴 왜 지었나 (2026-10-19 21:0x · 5번) ──────────────────────────
 * 사장님 — 「**백년지도 애드센스 건은?**」
 * 재 보니 백년지도만 **소유확인 메타가 없었다.** 로더도 ads.txt 도 맞게 들어가 있어서
 * 화면으로는 아무 흠이 없었다. 애드센스는 사이트를 승인하기 전에 그 지면에서 이 태그를
 * 찾는다 — 없으면 확인이 안 되고, **화면은 멀쩡한데 수만 0** 인 가장 조용한 꼴이 된다.
 *
 * ⭐ 더 나쁜 것은 — `ads.txt` 주석이 **이미 「셋 다 같은 값으로 맞춘다」고 적어 두었다.**
 *   적어 놓고 셋째를 안 넣었다. **말로 하는 규칙은 잊힌다. 그래서 검사로 둔다.**
 *
 * ── 재는 세 자리 ───────────────────────────────────────
 * ```
 * ① 소유확인 메타   <meta name="google-adsense-account" content="ca-pub-…">
 * ② 로더           pagead/js/adsbygoogle.js?client=ca-pub-…
 * ③ ads.txt        google.com, pub-…, DIRECT, …
 * ```
 * 셋이 **같은 pub** 을 가리켜야 한다. 하나라도 어긋나면 승인은 한쪽, 광고는 다른 쪽으로
 * 가서 영영 안 맞는다.
 *
 * ⛔ 「광고 자리(ins.adsbygoogle)」 수는 여기서 판정하지 않는다 — 자동광고는 자리 없이도
 *   붙는다. 그것은 따로 볼 일이고, 이 자는 «계정이 맞나»만 본다.
 *
 * 쓰는 법
 *   node scripts/check-adsense-셋이맞나.mjs
 *   node scripts/check-adsense-셋이맞나.mjs --자가시험
 */
import { execFileSync } from 'node:child_process';

export const 사이트 = [
  ['백년지도', 'https://100yearmap.com/'],
  ['K Culture Wire', 'https://www.kculturewire.com/'],
  ['SeoulMarkets', 'https://seoulmarkets.com/'],
  ['KLifeMap', 'https://klifemap.ai/'],
];

/** 지면 글에서 소유확인 메타의 pub 을 뽑는다 */
export function 메타pub(글) {
  const m = String(글 ?? '').match(/google-adsense-account"\s*content="ca-(pub-\d+)"/);
  return m ? m[1] : null;
}

/** 지면 글에서 로더가 부르는 pub 을 뽑는다 */
export function 로더pub(글) {
  const m = String(글 ?? '').match(/adsbygoogle\.js\?client=ca-(pub-\d+)/);
  return m ? m[1] : null;
}

/** ads.txt 에 적힌 pub 들 — 주석(#)은 뺀다 */
export function adstxtpub(글) {
  return String(글 ?? '').split(/\r?\n/)
    .filter((l) => !l.trim().startsWith('#'))
    .map((l) => (l.match(/\b(pub-\d+)\b/) || [])[1])
    .filter(Boolean);
}

/** 한 사이트의 판정 */
export function 판정(지면글, adstxt글) {
  const 메타 = 메타pub(지면글);
  const 로더 = 로더pub(지면글);
  const 목록 = adstxtpub(adstxt글);
  const 탈 = [];
  if (!로더) 탈.push('로더가 없다');
  if (!메타) 탈.push('소유확인 메타가 없다');
  if (메타 && 로더 && 메타 !== 로더) 탈.push(`메타(${메타})와 로더(${로더})가 다르다`);
  if (로더 && !목록.includes(로더)) 탈.push(`ads.txt 에 ${로더} 이 없다`);
  return { 메타, 로더, adstxt: 목록, 탈 };
}

/* ── 자가시험 ───────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  let 통과 = 0, 깨짐 = 0;
  const 본다 = (이름, 한것, 바란것) => {
    const a = JSON.stringify(한것), b = JSON.stringify(바란것);
    if (a === b) { 통과++; console.log('  ✅ ' + 이름); }
    else { 깨짐++; console.log('  🔴 ' + 이름 + '\n     한 것  ' + a + '\n     바란 것 ' + b); }
  };

  const 좋은지면 = '<meta name="google-adsense-account" content="ca-pub-3547185342873229" />'
    + '<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3547185342873229">';
  const 좋은ads = '# 주석에 pub-9999999999999999 가 있어도 세지 않는다\n'
    + 'google.com, pub-5113515144381167, DIRECT, f08c47fec0942fa0\n'
    + 'google.com, pub-3547185342873229, DIRECT, f08c47fec0942fa0\n';

  본다('메타 pub 을 뽑는다', 메타pub(좋은지면), 'pub-3547185342873229');
  본다('로더 pub 을 뽑는다', 로더pub(좋은지면), 'pub-3547185342873229');
  본다('ads.txt 주석은 안 센다', adstxtpub(좋은ads), ['pub-5113515144381167', 'pub-3547185342873229']);
  본다('셋이 맞으면 탈 없다', 판정(좋은지면, 좋은ads).탈, []);

  /* 🔴 2026-10-19 백년지도가 바로 이 꼴이었다 — 로더·ads.txt 는 맞고 메타만 없었다 */
  const 메타없는지면 = '<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3547185342873229">';
  본다('메타가 없으면 잡는다', 판정(메타없는지면, 좋은ads).탈, ['소유확인 메타가 없다']);

  const 어긋난지면 = '<meta name="google-adsense-account" content="ca-pub-5113515144381167" />'
    + '<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3547185342873229">';
  본다('메타와 로더가 다르면 잡는다', 판정(어긋난지면, 좋은ads).탈,
    ['메타(pub-5113515144381167)와 로더(pub-3547185342873229)가 다르다']);

  본다('ads.txt 에 없으면 잡는다',
    판정(좋은지면, 'google.com, pub-5113515144381167, DIRECT, f08c47fec0942fa0\n').탈,
    ['ads.txt 에 pub-3547185342873229 이 없다']);
  본다('로더가 없으면 잡는다', 판정('<meta name="google-adsense-account" content="ca-pub-3547185342873229" />', 좋은ads).탈,
    ['로더가 없다']);
  본다('빈 지면은 둘 다 잡는다', 판정('', 좋은ads).탈, ['로더가 없다', '소유확인 메타가 없다']);

  console.log(`\n  ${깨짐 ? '🔴' : '✅'} ${통과}/${통과 + 깨짐}`);
  process.exit(깨짐 ? 1 : 0);
}

/* ── 잰다 ──────────────────────────────────────────── */
const 가져온다 = (주소) => {
  try {
    return execFileSync('curl', ['-s', '-L', '--max-time', '25', 주소], { encoding: 'utf8', maxBuffer: 40e6 });
  } catch { return null; }
};

console.log('■ 애드센스 세 자리가 같은 계정을 가리키나 — ' + new Date().toLocaleString('ko-KR') + '\n');
let 탈난곳 = 0, 못잰곳 = 0;
for (const [이름, 주소] of 사이트) {
  const 지면 = 가져온다(주소);
  const ads = 가져온다(new URL('/ads.txt', 주소).href);
  if (지면 === null || ads === null) {
    console.log('⬜ ' + 이름.padEnd(16) + '못 쟀다 — 지면이나 ads.txt 를 못 받았다');
    못잰곳++; continue;
  }
  const r = 판정(지면, ads);
  if (!r.탈.length) {
    console.log('✅ ' + 이름.padEnd(16) + r.로더);
  } else {
    console.log('🔴 ' + 이름.padEnd(16) + r.탈.join(' · '));
    탈난곳++;
  }
}

console.log('\n' + (탈난곳 ? `🔴 어긋난 곳 ${탈난곳}` : '✅ 네 곳 다 맞다')
  + (못잰곳 ? ` · 못 잰 곳 ${못잰곳}` : ''));
console.log('⛔ 이것은 「계정이 맞나」다. 「광고가 나가나」는 애드센스 화면이 말한다.');
if (탈난곳 || 못잰곳) process.exitCode = 1;
