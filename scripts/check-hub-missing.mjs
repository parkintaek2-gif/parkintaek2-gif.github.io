/**
 * **check-hub-missing** — 「낱장은 잔뜩 있는데 그것을 모으는 «허브»가 없는 갈래」를 찾는다.
 *
 * ── 🔴 왜 이 자가 생겼나 (2026-09-11) ────────────────────────────────
 *   한 시간 안에 **서로 다른 두 사이트에서 같은 병**이 나왔다. 우연이 아니라 우리 버릇이다.
 *
 *     4번 실측   100yearmap  /report/area/<구> 258장이 사는데  /report/area  가 404
 *                허브 여덟 곳을 손으로 열어 봐도 그리로 가는 링크가 «하나도» 없었다
 *     5번 실측   KCW         /star-sign/<자리> 가 사는데(게자리 지면에만 719명)
 *                /star-sign  가 404. 중국어 「韩国明星星座统计」이 4.8위 18회인데 클릭 0 —
 *                「统计(통계)」를 찾는 사람이 원하는 것이 바로 그 «모은 장»이었다
 *
 * ── 왜 나쁜가 — 셋이다 ──────────────────────────────────────────────
 *   ① 손님이 닿을 길이 없다. 사이트맵을 손으로 여는 손님은 없다
 *   ② 「전체 · 목록 · 순위 · 통계」를 찾는 검색을 통째로 못 받는다. 낱장은 그 말에 안 걸린다
 *   ③ 구글이 「이 지면이 이 사이트에서 중요한가」를 읽을 신호(내부링크)가 0 이 된다
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────────────
 * ⛔ **못 받아 온 것을 「허브가 없다」로 세지 않는다.** 사이트맵이 안 열리면 「못 쟀다」다
 * ⛔ 낱장이 «적은» 갈래는 빨간불을 켜지 않는다 — 두세 장짜리에 허브를 만들면 얇은 지면이 된다
 * ⛔ 이 자는 «있다/없다»만 잰다. 허브가 있어도 «좋은가»는 못 잰다. 그건 눈으로 본다
 *
 * ── 쓰는 법 ─────────────────────────────────────────────────────────
 *   node scripts/check-hub-missing.mjs                    세 사이트 다
 *   node scripts/check-hub-missing.mjs --사이트 kcw        하나만
 *   node scripts/check-hub-missing.mjs --문턱 20           낱장 20장 넘는 갈래만
 *   node scripts/check-hub-missing.mjs --자가시험
 */

/* ── 잴 거리 ───────────────────────────────────────────────────────── */

/** 사이트맵 글에서 주소만 뽑는다 */
export function 주소뽑기(글) {
  return [...String(글 ?? '').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

/**
 * 주소를 «갈래»로 가른다 — `/star-sign/cancer` → 갈래 `/star-sign`.
 * ⚠ 조각이 하나뿐인 주소(`/about`)는 갈래가 «없다». 그건 그 자체가 허브다.
 * ⚠ 조각이 셋 이상이면 «맨 앞 둘»까지만 갈래로 본다 — `/report/area/seoul-mapo` → `/report/area`.
 */
export function 갈래내기(주소) {
  let 길;
  try { 길 = new URL(주소).pathname; } catch { 길 = String(주소 ?? ''); }
  const 조각 = 길.split('/').filter(Boolean);
  if (조각.length < 2) return null;
  return '/' + 조각.slice(0, 조각.length - 1).join('/');
}

/** 갈래마다 낱장이 몇인지 센다 */
export function 갈래세기(주소들) {
  const 셈 = new Map();
  for (const u of 주소들 ?? []) {
    const g = 갈래내기(u);
    if (!g) continue;
    셈.set(g, (셈.get(g) ?? 0) + 1);
  }
  return 셈;
}

/**
 * 🔴 [2026-09-11] 첫 판이 열 갈래에 빨간불을 켰는데 **넷은 헛경보**였다 —
 *   `/title` 은 404 지만 `/titles` 가 200 이고, `/article`→`/articles`, `/tag`→`/tags`,
 *   `/week`→`/weeks`, `/firm`→`/firms` 가 다 그랬다. **허브 이름이 복수형인 집이었다.**
 * ⛔ 헛경보를 켜는 자는 곧 안 보게 된다. 그러면 진짜 빨간불도 같이 묻힌다.
 * ⇒ 낱장 갈래 하나에 «허브 후보를 여럿» 둔다. 하나라도 살면 있는 것이다.  (복수형도-본다)
 * ⚠ 단수↔복수만 본다. 뜻으로 짐작해서 후보를 만들지 않는다 — 그건 내가 지어내는 것이다.
 */
export function 허브후보(갈래) {
  const 것 = [갈래];
  if (/y$/.test(갈래)) 것.push(갈래.slice(0, -1) + 'ies');   /* /country → /countries */
  else if (/(s|x|ch|sh)$/.test(갈래)) 것.push(갈래 + 'es');
  else 것.push(갈래 + 's');
  return [...new Set(것)];
}

/** 살아 있는 응답인가 — 200~399 만 「있다」로 본다 */
/**
 * 🔴 [2026-09-11 · 5번] **이 자가 헛울렸다. 그 까닭과 고침을 여기 적는다.**
 *
 * 이 자는 갈래 이름으로 허브 «주소를 추측»했다 — `/from` 이면 `/from`·`/froms` 를 두드린다.
 * 그런데 **사람은 허브에 다른 이름을 붙인다.** 재 보니 넷이 다 그랬다 —
 *
 * ```
 *   /from/       37장  → 허브는 /hometowns    (37/37 을 건다)
 *   /market/     93장  → 허브는 /by-country   (93/93)
 *   /star-sign/  12장  → 허브는 /born-on      (12/12)
 *   /report/area 258장 → 허브는 /region       (258/258, 라이브 200)
 * ```
 *
 * ⛔ 그래서 **「그 갈래의 낱장을 여럿 거는 지면이 있나」로 판정한다.** 이름은 안 본다.
 * ⚠ 자가 헛울리면 그 옆의 «진짜 빨강»까지 같이 안 믿게 된다. 이번엔 다섯 중 넷이 헛울림이었다.
 *
 * @param 낱장수      그 갈래의 낱장 수
 * @param 거는수       한 지면이 «서로 다른» 낱장을 몇 개 거나 (가장 많이 거는 지면의 수)
 * @returns {boolean} 이름이 무엇이든 그것을 허브로 볼 수 있나
 */
export function 허브노릇하나(낱장수, 거는수) {
  if (!Number.isFinite(낱장수) || 낱장수 <= 0) return false;
  if (!Number.isFinite(거는수) || 거는수 <= 0) return false;
  return 거는수 >= 낱장수 * 0.5;
}

/** 사이트맵 주소 가운데 «한 겹짜리»(/region 처럼)만 — 허브는 거의 언제나 여기에 있다 */
export function 한겹주소(주소들, 밑 = '') {
  const 것 = [];
  for (const u of 주소들 ?? []) {
    /* ⚠ 사이트맵에는 «온전한» 주소만 온다. 상대경로로 풀면 쓰레기까지 주소가 돼 버린다 —
       new URL('%%%', 밑) 는 던지지 않고 '/%%%' 를 내준다 */
    let 길;
    try { 길 = new URL(String(u)).pathname; } catch { continue; }
    const 조각 = 길.split('/').filter(Boolean);
    if (조각.length === 1) 것.push('/' + 조각[0]);
  }
  return [...new Set(것)];
}

export function 살았나(코드) {
  const n = Number(코드);
  return Number.isFinite(n) && n >= 200 && n < 400;
}

/**
 * 판정 — ⛔ 「못 쟀다」를 「없다」로 섞지 않는다.
 *   코드가 null 이면 «못 쟀다»이지 «허브가 없다»가 아니다.
 */
export function 판정(낱장수, 문턱, 허브코드) {
  if (낱장수 < 문턱) return '작다';
  if (허브코드 === null || 허브코드 === undefined) return '못쟀다';
  return 살았나(허브코드) ? '있다' : '없다';
}

/* ── 자가시험 ──────────────────────────────────────────────────────── */

function 자가시험() {
  let 통과 = 0; const 깨짐 = [];
  const 잰다 = (이름, 본값, 바람) => {
    if (JSON.stringify(본값) === JSON.stringify(바람)) 통과++;
    else 깨짐.push(`${이름} — 나온 것 ${JSON.stringify(본값)} · 바란 것 ${JSON.stringify(바람)}`);
  };

  잰다('주소뽑기 — loc 를 집는다',
    주소뽑기('<url><loc>https://a.com/x</loc></url><url><loc>https://a.com/y</loc></url>'),
    ['https://a.com/x', 'https://a.com/y']);
  잰다('주소뽑기 — 빈 글은 0개', 주소뽑기('').length, 0);
  잰다('주소뽑기 — 앞뒤 공백을 턴다', 주소뽑기('<loc>  https://a.com/x  </loc>'), ['https://a.com/x']);

  잰다('갈래내기 — 두 조각', 갈래내기('https://a.com/star-sign/cancer'), '/star-sign');
  잰다('갈래내기 — 세 조각은 앞 둘까지', 갈래내기('https://a.com/report/area/seoul-mapo'), '/report/area');
  /* ⚠ 한 조각짜리는 그 자체가 허브다 — 갈래가 없다 */
  잰다('갈래내기 — 한 조각은 갈래 없음', 갈래내기('https://a.com/about'), null);
  잰다('갈래내기 — 뿌리는 갈래 없음', 갈래내기('https://a.com/'), null);
  잰다('갈래내기 — 주소가 아니어도 경로로 읽는다', 갈래내기('/title/abc'), '/title');

  const 셈 = 갈래세기(['https://a.com/t/1', 'https://a.com/t/2', 'https://a.com/p/1', 'https://a.com/about']);
  잰다('갈래세기 — 갈래별 수', [...셈.entries()].sort(), [['/p', 1], ['/t', 2]]);
  잰다('갈래세기 — 빈 것', 갈래세기(null).size, 0);

  잰다('살았나 — 200', 살았나(200), true);
  잰다('살았나 — 301 도 산 것', 살았나(301), true);
  잰다('살았나 — 404', 살았나(404), false);
  잰다('살았나 — 0(못 닿음)', 살았나(0), false);

  /* 🔴 이 셋이 이 자의 뼈대다 */
  잰다('판정 — 낱장이 적으면 빨간불 안 켠다', 판정(3, 10, 404), '작다');
  잰다('판정 — 많은데 허브 404 면 없다', 판정(258, 10, 404), '없다');
  잰다('판정 — 많고 허브 200 이면 있다', 판정(546, 10, 200), '있다');
  /* ⛔ 못 쟀다를 없다로 섞으면 남의 사이트가 잠깐 죽었을 때 헛경보가 난다 */
  잰다('판정 — 못 쟀으면 「없다」가 아니다', 판정(258, 10, null), '못쟀다');

  /* 🔴 헛경보 넷을 낸 자리 — 복수형 허브 */
  잰다('허브후보 — 단수에 복수를 더한다', 허브후보('/title'), ['/title', '/titles']);
  잰다('허브후보 — y 는 ies 로', 허브후보('/country'), ['/country', '/countries']);
  잰다('허브후보 — s 로 끝나면 es', 허브후보('/class'), ['/class', '/classes']);
  잰다('허브후보 — 이미 복수면 겹치지 않는다', 허브후보('/data').length, 2);

  /* 🔴 [2026-09-11] 이름이 다른 허브 — 이 자가 헛울린 자리다 */
  잰다('허브노릇 — 절반 넘게 걸면 이름이 달라도 허브다', 허브노릇하나(37, 37), true);
  잰다('허브노릇 — 딱 절반이면 허브로 본다', 허브노릇하나(100, 50), true);
  잰다('허브노릇 — 절반에 못 미치면 허브가 아니다', 허브노릇하나(108, 7), false);
  잰다('허브노릇 — 0개면 허브가 아니다', 허브노릇하나(258, 0), false);
  잰다('⛔ 허브노릇 — 못 쟀으면(NaN) 「허브다」로 만들지 않는다', 허브노릇하나(258, NaN), false);
  잰다('허브노릇 — 낱장이 0이면 판정하지 않는다', 허브노릇하나(0, 5), false);
  잰다('한겹주소 — 한 겹만 고른다',
    한겹주소(['https://a.com/region', 'https://a.com/report/area/x', 'https://a.com/']), ['/region']);
  잰다('한겹주소 — 같은 것은 한 번만', 한겹주소(['https://a.com/x', 'https://a.com/x']).length, 1);
  잰다('한겹주소 — 주소가 아니면 조용히 건너뛴다', 한겹주소(['%%%', 'https://a.com/y']), ['/y']);

  console.log(`■ 자가시험 ${통과 + 깨짐.length}가지 — 통과 ${통과} · 깨짐 ${깨짐.length}`);
  for (const d of 깨짐) console.log('   🔴 ' + d);
  return 깨짐.length === 0;
}

/* ── 몸통 ──────────────────────────────────────────────────────────── */

const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

const 고르기 = (이름, 기본) => {
  const i = 인자.indexOf(이름);
  return i >= 0 && 인자[i + 1] ? 인자[i + 1] : 기본;
};
const 문턱 = Number(고르기('--문턱', '10'));
const 고른사이트 = 고르기('--사이트', null);

const 사이트들 = [
  ['kcw', 'https://www.kculturewire.com'],
  ['100y', 'https://100yearmap.com'],
  ['seoulmarkets', 'https://seoulmarkets.com'],
].filter(([이름]) => !고른사이트 || 이름 === 고른사이트);

const 받기 = async (u) => {
  try {
    const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(25000) });
    return { 코드: r.status, 글: r.ok ? await r.text() : '' };
  } catch { return { 코드: null, 글: '' }; }
};

console.log('■ 낱장은 있는데 «모으는 허브»가 없는 갈래를 찾는다');
console.log(`   문턱 ${문턱}장 — 이보다 적은 갈래는 빨간불을 안 켠다(얇은 허브를 만들지 않기 위해서다)`);
console.log('');

let 빨간불 = 0; let 못쟀다 = 0;
for (const [이름, 밑] of 사이트들) {
  const 사이트맵 = await 받기(`${밑}/sitemap.xml`);
  if (!살았나(사이트맵.코드)) {
    console.log(`⬜ ${이름.padEnd(13)} 사이트맵을 못 받았다 (${사이트맵.코드 ?? '못 닿음'}) — 「못 쟀다」로 적는다`);
    못쟀다++;
    continue;
  }
  let 주소 = 주소뽑기(사이트맵.글);
  /* ⚠ 사이트맵 색인(sitemap 안에 sitemap) 이면 한 겹 더 들어간다 */
  const 속맵 = 주소.filter((u) => /sitemap[^/]*\.xml$/i.test(u));
  if (속맵.length) {
    for (const s of 속맵.slice(0, 12)) {
      const r = await 받기(s);
      if (살았나(r.코드)) 주소 = 주소.concat(주소뽑기(r.글));
    }
  }
  주소 = [...new Set(주소.filter((u) => !/sitemap[^/]*\.xml$/i.test(u)))];

  const 셈 = [...갈래세기(주소).entries()].filter(([, n]) => n >= 문턱).sort((a, b) => b[1] - a[1]);
  console.log(`━━ ${이름} — 주소 ${주소.length}개 · ${문턱}장 넘는 갈래 ${셈.length}개`);

  for (const [갈래, n] of 셈) {
    /* ⚠ 후보를 «다» 두드린 뒤에 판정한다. 하나라도 살면 허브가 있는 것이다 */
    let r = { 코드: null }; let 산것 = null;
    for (const 후보 of 허브후보(갈래)) {
      const x = await 받기(밑 + 후보);
      if (살았나(x.코드)) { r = x; 산것 = 후보; break; }
      if (r.코드 === null) r = x;                /* 못 닿은 것과 404 를 가르기 위해 첫 답을 쥔다 */
      else if (x.코드 !== null) r = x;
    }
    let 결 = 판정(n, 문턱, r.코드);
    /* 🔴 이름 추측이 「없다」고 해도 곧바로 믿지 않는다 — 이름이 «다른» 허브를 찾는다.
       2026-09-11 에 다섯 중 넷이 이 갈래로 헛울렸다(/hometowns · /by-country · /born-on · /region) */
    let 딴이름 = null;
    if (결 === '없다') {
      let 으뜸 = 0;
      /* ⚠ 자르는 수를 80 으로 뒀다가 또 헛울렸다 — KCW 는 한 겹 주소가 그보다 많아서
         정작 허브인 /hometowns 가 잘려 나갔다. 「덜 보고 없다고 하는 것」이 이 자의 병이다 */
      for (const 후보 of 한겹주소(주소, 밑)) {
        const x = await 받기(밑 + 후보);
        if (!살았나(x.코드)) continue;
        const 맞 = x.글.match(new RegExp(`href="${갈래}/[^"#]+"`, 'g'));
        const 수 = 맞 ? new Set(맞).size : 0;
        if (수 > 으뜸) { 으뜸 = 수; 딴이름 = { 길: 후보, 수 }; }
      }
      if (허브노릇하나(n, 으뜸)) 결 = '있다';
    }
    if (결 === '없다') {
      빨간불++;
      console.log(`   🔴 ${갈래.padEnd(24)} 낱장 ${String(n).padStart(4)}장인데 허브가 없다`
        + (딴이름 ? ` (가장 많이 거는 지면도 ${딴이름.길} 에서 ${딴이름.수}개뿐)` : ' (거는 지면이 하나도 없다)'));
    } else if (딴이름) {
      console.log(`   ✅ ${갈래.padEnd(24)} 낱장 ${String(n).padStart(4)}장 · 허브는 «이름이 다르다» — ${딴이름.길} (${딴이름.수}개를 건다)`);
      continue;
    } else if (결 === '못쟀다') {
      못쟀다++;
      console.log(`   ⬜ ${갈래.padEnd(24)} 낱장 ${String(n).padStart(4)}장 — 허브를 «못 쟀다»(못 닿음)`);
    } else {
      console.log(`   ✅ ${갈래.padEnd(24)} 낱장 ${String(n).padStart(4)}장 · 허브 ${산것 ?? 갈래} (${r.코드})`);
    }
  }
  console.log('');
}

if (빨간불) {
  console.log(`🔴 허브가 없는 갈래 ${빨간불}개 — **손님이 그 낱장들에 닿을 길이 없다**`);
  console.log('   ⛔ 「사이트맵에 있으니 구글은 찾는다」로 넘기지 않는다. 사이트맵을 여는 손님은 없다.');
  console.log('   ✅ 허브를 낼 때도 얇게 내지 않는다 — 모아 놓기만 하면 그것도 얇은 지면이다.');
}
if (못쟀다) console.log(`⬜ 못 잰 것 ${못쟀다}개 — 「없다」가 아니다. 다시 잰다.`);
if (!빨간불 && !못쟀다) console.log('✅ 낱장이 많은 갈래는 모두 허브가 있다');
process.exit(빨간불 ? 1 : 0);
