/**
 * 잰다-배포뒤-손님길이-살았나.mjs
 *   — **배포한 뒤 «손님이 쓰는 길»이 실제로 살아났나.**
 *
 * ── 🔴 왜 지었나 (2026-10-13 15:1x · 5번) ────────────────────────────
 * 사장님: 「**사주 결제 견적 HTTP 502 라는 메일을 받았다. 1번이 보낸 것 같은데, 조치했나?**」
 *
 * 지금 재니 `/api/expert/quote` 는 열 번 두드려 열 번 다 200 이다.
 * ⇒ 그때는 났고 지금은 안 난다. **그 사이에 내가 klifemap 을 네 번 배포했다** —
 *   13:5x · 14:15 · 14:19 · 14:35. 배포는 서버를 다시 띄우고, 그동안 손님은 502 를 본다.
 *   ⛔ 이것은 «그럴듯한 까닭»이지 잰 것이 아니다. 그래서 **재는 자**를 만든다.
 *
 * ⭐⭐ 오늘 내가 놓친 것이 바로 이것이다 —
 *   배포하고 `deployed` 한 줄만 보고 넘어갔다. 지면(klm-dawn.js)은 퍼졌는지 쟀지만
 *   **손님이 돈을 내는 길(API)이 살아났는지는 한 번도 안 쟀다.**
 *   ⛔ 「배포됐다」는 「손님이 쓸 수 있다」가 아니다.
 *
 * ⚠ 이 자는 «지금» 살아 있나만 본다. 배포 중에 몇 초 끊겼는지는 모른다 —
 *   그것은 배포하면서 같이 돌려야 알 수 있다(--지켜본다).
 *
 * 쓰는 법  node scripts/잰다-배포뒤-손님길이-살았나.mjs --자가시험
 *          node scripts/잰다-배포뒤-손님길이-살았나.mjs
 *          node scripts/잰다-배포뒤-손님길이-살았나.mjs --지켜본다 180   (초 단위·배포하며 함께)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
export const 대장 = path.join(뿌리, 'docs', '배포뒤-손님길.tsv');

/**
 * 손님이 쓰는 길 — ⛔ 「홈이 200」을 「팔린다」로 읽지 않는다.
 * 돈이 오가는 길을 따로 둔다. 사장님이 받으신 메일이 바로 그 길이었다.
 */
export const 손님길 = [
  { 이름: 'klifemap 홈', 주소: 'https://klifemap.ai/', 바라는것: [200] },
  { 이름: '사주 견적(돈길)', 주소: 'https://klifemap.ai/api/expert/quote', 바라는것: [200] },
  { 이름: '사주 화면', 주소: 'https://klifemap.ai/saju.html', 바라는것: [200] },
  /* ⚠ 401 이 «맞는» 답인 길이 있다 — 열쇠가 있어야 하는 자리다.
     ⛔ 401 을 흠으로 세면 거짓 빨강이 나고, 200 만 보면 502 를 놓친다. */
  { 이름: '결제 견적(열쇠 필요)', 주소: 'https://klifemap.ai/api/billing/quote', 바라는것: [401, 405] },
  { 이름: 'seoulmarkets 홈', 주소: 'https://seoulmarkets.com/', 바라는것: [200] },
];

/** 판정. ⛔ 「못 물었다」를 「죽었다」로도 「살았다」로도 적지 않는다 */
export function 판정(받은, 바라는것) {
  if (받은 === null || !Number.isFinite(받은)) {
    return { 빛: '⬜', 말: '못 물었다 — 「죽었다」가 아니다' };
  }
  if ((바라는것 ?? []).includes(받은)) return { 빛: '✅', 말: String(받은) + ' — 살아 있다' };
  if (받은 >= 500) {
    return { 빛: '🔴', 말: String(받은) + ' — **손님이 이 길을 못 쓴다** (502 면 서버가 다시 뜨는 중일 수 있다)' };
  }
  return { 빛: '⚠', 말: String(받은) + ' — 바라던 답이 아니다(' + (바라는것 ?? []).join('·') + ')' };
}

/** 몇 번 두드려 몇 번 성했나 — ⛔ 한 번 200 을 「성하다」로 읽지 않는다 */
export function 성한비율(답들, 바라는것) {
  const 잰것 = (답들 ?? []).filter((v) => v !== null && Number.isFinite(v));
  if (!잰것.length) return null;
  const 성한것 = 잰것.filter((v) => (바라는것 ?? []).includes(v)).length;
  return 성한것 / 잰것.length;
}

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0;
  let 실패 = 0;
  const 본다 = (말, 참) => {
    if (참) { 통과 += 1; console.log('  ✅ ' + 말); } else { 실패 += 1; console.log('  🔴 ' + 말); }
  };

  본다('🔴 돈이 오가는 길을 따로 둔다 — 「홈이 200」을 「팔린다」로 읽지 않는다',
    손님길.some((g) => /돈길/.test(g.이름)));
  본다('⛔ 열쇠가 필요한 길은 401 이 «맞는» 답이다 — 흠으로 세면 거짓 빨강이 난다',
    손님길.some((g) => g.바라는것.includes(401)));
  본다('✅ 바라던 답이면 초록', 판정(200, [200]).빛 === '✅');
  본다('✅ 401 을 바라는 길에서 401 은 초록', 판정(401, [401, 405]).빛 === '✅');
  본다('🔴🔴 502 는 빨강 — 사장님이 받으신 그 수다', 판정(502, [200]).빛 === '🔴');
  본다('   그 말에 «손님이 이 길을 못 쓴다»가 든다',
    /손님이 이 길을 못 쓴다/.test(판정(502, [200]).말));
  본다('   502 면 «다시 뜨는 중»일 수 있다고 짚는다 — 배포가 흔한 까닭이다',
    /다시 뜨는 중/.test(판정(502, [200]).말));
  본다('⚠ 404 는 ⚠ — 죽은 것과 다르다', 판정(404, [200]).빛 === '⚠');
  본다('⬜ 못 물었으면 ⬜ — ⛔ 「죽었다」가 아니다', 판정(null, [200]).빛 === '⬜');

  본다('성한 비율을 센다', 성한비율([200, 200, 502, 200], [200]) === 0.75);
  본다('⛔ 못 잰 것은 분모에서 뺀다 — 0 으로 세면 거짓 빨강이 난다',
    성한비율([200, null, 200], [200]) === 1);
  본다('⛔ 다 못 쟀으면 null — 1 도 0 도 아니다', 성한비율([null, null], [200]) === null);
  본다('⛔ 빈 값에도 안 터진다', 성한비율(null, [200]) === null);

  console.log(String.fromCharCode(10) + '자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
async function 한번(주소) {
  try {
    const r = await fetch(주소 + (주소.includes('?') ? '&' : '?') + 'z=' + Date.now(),
      { redirect: 'follow', signal: AbortSignal.timeout(20000) });
    return r.status;
  } catch { return null; }
}

async function 잰다(지켜볼초) {
  const 엔 = String.fromCharCode(10);
  const 탭 = String.fromCharCode(9);
  const 끝날때 = Date.now() + (지켜볼초 ?? 0) * 1000;
  const 모음 = new Map(손님길.map((g) => [g.이름, []]));
  let 바퀴 = 0;
  console.log('■ 배포 뒤 «손님이 쓰는 길»이 살아났나'
    + (지켜볼초 ? ' — ' + 지켜볼초 + '초 지켜본다' : '') + 엔);
  do {
    바퀴 += 1;
    for (const g of 손님길) 모음.get(g.이름).push(await 한번(g.주소));
    if (지켜볼초 && Date.now() < 끝날때) await new Promise((r) => setTimeout(r, 5000));
  } while (지켜볼초 && Date.now() < 끝날때);

  let 나쁨 = 0;
  const 적을것 = [];
  for (const g of 손님길) {
    const 답들 = 모음.get(g.이름);
    const 비율 = 성한비율(답들, g.바라는것);
    const 마지막 = 판정(답들[답들.length - 1], g.바라는것);
    const 나쁜답 = [...new Set(답들.filter((v) => v !== null && !g.바라는것.includes(v)))];
    const 빛 = 비율 === null ? '⬜' : (비율 === 1 ? '✅' : (나쁜답.some((v) => v >= 500) ? '🔴' : '⚠'));
    console.log('  ' + 빛 + ' ' + g.이름.padEnd(22)
      + (비율 === null ? '못 쟀다' : Math.round(비율 * 100) + '% 성함 (' + 답들.length + '번 두드림)')
      + (나쁜답.length ? '  ⛔ 나온 답: ' + 나쁜답.join('·') : '')
      + '  · 마지막 ' + 마지막.말.split(' —')[0]);
    if (빛 === '🔴') 나쁨 += 1;
    적을것.push([new Date().toLocaleString('sv-SE').replace(' ', 'T'), g.이름,
      비율 === null ? '못쟀다' : Math.round(비율 * 100) + '%',
      답들.length + '번', 나쁜답.join('·') || '-'].join(탭));
  }
  if (!fs.existsSync(대장)) {
    fs.writeFileSync(대장, ['# 배포 뒤 손님길 — 때/길/성한비율/두드린수/나온 나쁜 답',
      '# 🔴 사장님 2026-10-13: 「사주 결제 견적 HTTP 502 라는 메일을 받았다」',
      '# ⛔ 「배포됐다」는 「손님이 쓸 수 있다」가 아니다. 배포 뒤 이 자를 돌린다.',
      ''].join(엔), 'utf8');
  }
  fs.appendFileSync(대장, 적을것.join(엔) + 엔, 'utf8');
  console.log('');
  console.log('  ✔ 대장에 적었다 — docs/배포뒤-손님길.tsv');
  console.log('  ⛔ 「지금 성하다」를 「아까도 성했다」로 읽지 않는다 —');
  console.log('     배포 중에 끊긴 것은 지나가면 안 보인다. --지켜본다 로 배포와 «함께» 돌린다.');
  return 나쁨 ? 1 : 0;
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else {
    const i = process.argv.indexOf('--지켜본다');
    const v = i >= 0 ? Number(process.argv[i + 1]) : NaN;
    process.exit(await 잰다(Number.isFinite(v) && v > 0 ? Math.floor(v) : 0));
  }
}
