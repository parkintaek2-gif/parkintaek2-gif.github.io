#!/usr/bin/env node
/**
 * check-klifemap-adsense-ready.mjs — **애드센스 심사자의 눈으로 klifemap 을 잰다.**
 *
 *   node scripts/check-klifemap-adsense-ready.mjs
 *   node scripts/check-klifemap-adsense-ready.mjs --자가시험
 *
 * ── 🔴 왜 만드나 (2026-09-12) ────────────────────────────────────────────
 *
 * 애드센스가 klifemap.ai 를 «거절»했다 — 「지금은 사이트에 광고를 게재하실 수 없습니다.
 * 사이트에 광고를 게재하기 전에 해결해야 할 문제가 있습니다」.
 *
 * 까닭은 애드센스 계정의 「사이트」 화면에 적혀 있는데, 그 계정은 admin@klifedesign.net
 * 소유라 지금 브라우저(parkintaek2@)로는 못 연다. ⇒ **그러면 화면을 기다리지 말고 잰다.**
 *
 * ⛔ 짐작으로 「콘텐츠가 얇아서겠지」라고 적지 않는다. 지면마다 «글자를 세어» 판정한다.
 *
 * ── 애드센스가 실제로 보는 것 (정책 문서 기준) ───────────────────────────
 * ```
 * 1. 가치 있는 콘텐츠      읽을 글이 있나. 도구·입력폼만 있는 지면은 「얇다」로 본다
 * 2. 광고를 놓을 자리      로더만 있고 자리(ins.adsbygoogle)가 없으면 게재할 수 없다
 * 3. 필수 지면            개인정보처리방침 · 이용약관 · 회사소개 · 연락처
 * 4. 사이트가 «작동»하나   죽은 링크 · 가입이 안 되는 상태 따위
 * ```
 */

const 사이트 = 'https://klifemap.ai';

/* ── 판정만 떼어 낸다 ──────────────────────────────────────────────────── */

/** 애드센스가 「가치 있는 콘텐츠」로 볼 만한 두께인가 — 본문 글자 수로 가른다.
 *  ⚠ 선을 «짐작»으로 두지 않는다. 업계에서 흔히 쓰는 최소선이 300단어(한글 약 600자)다.
 *  그 아래는 「얇다」, 1,500자 이상이면 「읽을거리」로 센다. */
export function 두께판정(글자수) {
  if (!Number.isFinite(글자수) || 글자수 < 0) return '못쟀다';
  if (글자수 >= 1500) return '읽을거리';
  if (글자수 >= 600) return '보통';
  return '얇다';
}

/** 광고를 놓을 «자리»가 있나. 로더만 있는 것은 자리가 아니다. */
export function 광고자리있나({ 로더, 자리수 } = {}) {
  if (!로더) return { 된다: false, 말: '애드센스 로더가 지면에 없다' };
  if (!Number.isFinite(자리수) || 자리수 <= 0) {
    return { 된다: false, 말: '로더만 있고 «광고 자리(ins.adsbygoogle)»가 0개다 — 게재할 수 없다' };
  }
  return { 된다: true, 말: '광고 자리 ' + 자리수 + '개' };
}

/** 지면 무리를 보고 한 마디로 */
export function 심사될까(지면들) {
  const 잰것 = 지면들.filter((p) => p.두께 !== '못쟀다');
  const 읽을거리 = 잰것.filter((p) => p.두께 === '읽을거리').length;
  const 얇다 = 잰것.filter((p) => p.두께 === '얇다').length;
  const 막는것 = [];
  /* 애드센스는 «사이트 전체»를 본다. 얇은 지면이 절반을 넘으면 거절 쪽이다 */
  if (잰것.length > 0 && 얇다 / 잰것.length > 0.5) {
    막는것.push(`얇은 지면이 ${얇다}/${잰것.length}장 — 절반을 넘는다`);
  }
  if (읽을거리 < 5) 막는것.push(`읽을거리라 할 지면이 ${읽을거리}장뿐 — 최소선에 못 미친다`);
  const 자리없음 = 지면들.filter((p) => p.광고자리 === 0 && p.로더).length;
  if (자리없음 === 지면들.length && 지면들.length > 0) {
    막는것.push('모든 지면이 «로더만» 있고 광고 자리가 0개다');
  }
  return { 될까: 막는것.length === 0, 막는것, 읽을거리, 얇다, 잰수: 잰것.length };
}

/* ── 실제로 잰다 ───────────────────────────────────────────────────────── */

/** 지면에서 «사람이 읽는 글»만 남긴다 — 태그·스크립트·스타일을 걷어낸다 */
function 본문글자(html) {
  const 몸 = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return 몸.length;
}

async function 잰다() {
  /* 심사자가 실제로 들어가 볼 만한 지면들 — 대문·상품·필수지면을 섞는다 */
  const 볼것 = [
    '/', '/about.html', '/pricing.html', '/privacy.html', '/terms.html', '/refund.html',
    '/saju.html', '/astro.html', '/tarot.html', '/liuyao.html', '/gwansang.html',
    '/mingli-gunghap.html', '/mingli-sungmyung.html', '/mingli-taekil.html',
    '/horoscope.html', '/daily.html', '/cards.html', '/reviews.html',
    '/ai-report.html', '/coaching.html', '/stardb.html', '/mansecalendar.html',
    '/rising-sign.html', '/ilzin.html', '/psychometrics.html', '/events.html',
  ];

  console.log('■ 애드센스 심사자의 눈으로 klifemap.ai 를 잰다 — ' + new Date().toLocaleString('ko-KR'));
  console.log('  ⛔ 「콘텐츠가 얇아서겠지」라고 짐작하지 않는다. 지면마다 글자를 «센다»\n');

  const 지면들 = [];
  for (const 길 of 볼것) {
    try {
      const r = await fetch(사이트 + 길, { signal: AbortSignal.timeout(25000) });
      const html = await r.text();
      const 글자 = 본문글자(html);
      const 로더 = /adsbygoogle\.js|ca-pub-\d+/.test(html);
      const 자리 = (html.match(/class="[^"]*adsbygoogle/g) || []).length;
      const 두께 = r.ok ? 두께판정(글자) : '못쟀다';
      지면들.push({ 길, 상태: r.status, 글자, 두께, 로더, 광고자리: 자리 });
      const 표 = 두께 === '얇다' ? '🔴' : (두께 === '보통' ? '⚠' : '✅');
      console.log(`  ${표} ${길.padEnd(26)} HTTP ${r.status}  ${String(글자).padStart(6)}자  ${두께.padEnd(6)}  광고자리 ${자리}`);
    } catch (e) {
      지면들.push({ 길, 상태: 0, 글자: -1, 두께: '못쟀다', 로더: false, 광고자리: 0 });
      console.log(`  ⬜ ${길.padEnd(26)} 못 쟀다 — ${e.message.slice(0, 40)}`);
    }
  }

  const 답 = 심사될까(지면들);
  console.log('');
  console.log(`  읽을거리 ${답.읽을거리}장 · 얇은 지면 ${답.얇다}장 · 잰 것 ${답.잰수}장`);
  console.log('');
  if (답.될까) {
    console.log('  ✅ 애드센스가 막을 만한 자리는 안 보인다');
  } else {
    console.log('  🔴 애드센스가 막을 만한 자리');
    for (const x of 답.막는것) console.log('     · ' + x);
    console.log('');
    console.log('  ✅ 고치는 길 — 판정 «도구»만으로는 안 된다. 읽을 글이 붙어야 한다');
    console.log('     · 각 판정 지면에 「이것이 무엇이고 어떻게 보는가」를 1,500자 이상 붙인다');
    console.log('     · 원전 인용은 이미 있다 — 그 위에 «우리 말로 푼 설명»을 얹는다');
    console.log('     ⛔ 글자 수를 채우려고 늘리지 않는다. 손님이 읽을 까닭이 있어야 한다');
  }
  return 답.될까 ? 0 : 1;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */

function 자가시험() {
  let 통과 = 0; const 깨짐 = [];
  const 검 = (이름, 나옴, 바람) => {
    if (JSON.stringify(나옴) === JSON.stringify(바람)) 통과++;
    else 깨짐.push(`${이름} — 나온 것 ${JSON.stringify(나옴)} · 바란 것 ${JSON.stringify(바람)}`);
  };

  검('1,500자면 읽을거리', 두께판정(1500), '읽을거리');
  검('600자면 보통', 두께판정(600), '보통');
  검('599자면 얇다', 두께판정(599), '얇다');
  검('⛔ 못 쟀으면 «얇다»가 아니라 «못쟀다»', 두께판정(-1), '못쟀다');
  검('숫자가 아니면 못쟀다', 두께판정(null), '못쟀다');

  검('🔴 로더만 있고 자리가 0이면 «못 놓는다»',
    광고자리있나({ 로더: true, 자리수: 0 }).된다, false);
  검('로더가 아예 없어도 못 놓는다', 광고자리있나({ 로더: false, 자리수: 3 }).된다, false);
  검('둘 다 있으면 된다', 광고자리있나({ 로더: true, 자리수: 2 }).된다, true);

  /* 🔴 2026-09-12 에 실제로 잰 모양 — 얇은 지면이 절반을 넘었다 */
  const 그날 = [
    { 길: '/liuyao.html', 두께: '얇다', 로더: true, 광고자리: 0 },
    { 길: '/tarot.html', 두께: '보통', 로더: true, 광고자리: 0 },
    { 길: '/gwansang.html', 두께: '읽을거리', 로더: true, 광고자리: 0 },
    { 길: '/daily.html', 두께: '얇다', 로더: true, 광고자리: 0 },
    { 길: '/cards.html', 두께: '얇다', 로더: true, 광고자리: 0 },
  ];
  검('그날 모양은 «막힌다»', 심사될까(그날).될까, false);
  검('얇은 지면이 절반 넘는 것을 집어낸다',
    심사될까(그날).막는것.some((x) => x.includes('절반을 넘는다')), true);
  검('광고 자리가 0인 것도 집어낸다',
    심사될까(그날).막는것.some((x) => x.includes('광고 자리가 0개')), true);

  const 좋은것 = Array.from({ length: 10 }, (_, i) =>
    ({ 길: '/p' + i, 두께: '읽을거리', 로더: true, 광고자리: 2 }));
  검('두껍고 자리도 있으면 통과', 심사될까(좋은것).될까, true);
  검('⛔ 못 쟀은 지면은 «셈에서 뺀다»',
    심사될까([{ 두께: '못쟀다', 로더: false, 광고자리: 0 }]).잰수, 0);

  console.log(`■ 자가시험 ${통과 + 깨짐.length}가지 — 통과 ${통과} · 깨짐 ${깨짐.length}`);
  for (const d of 깨짐) console.log('   🔴 ' + d);
  return 깨짐.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
else process.exit(await 잰다());
