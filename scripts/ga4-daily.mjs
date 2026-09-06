#!/usr/bin/env node
/**
 * ga4-daily.mjs — **순방문자를 «하루 단위»로 낸다.** 사이트별로 갈라서.
 * ────────────────────────────────────────────────────────────────────────────
 * [사장님 지시 — 2026-09-06]
 *   > 「**순방문자 하루 단위로 집계해야지. 왜 한달 평균치보다 요즘 하루 방문자가
 *   > 떨어지는 데 왜 그런지 이유가 뭔지 분석해**」
 *
 * [왜 이 자가 따로 필요한가]
 *   `ga4-report.mjs` 는 **기간 합계**만 낸다 — 「30일 805명, 하루 27명꼴」.
 *   ⛔ 그 「27명꼴」은 «평균»이라 **오르는 중인지 떨어지는 중인지 안 보인다.**
 *      떨어지고 있어도 평균은 그럴듯하게 나온다. 그것이 사장님이 짚으신 것이다.
 *   ⭐ 그래서 날짜를 축으로 둔다. 추세는 날짜 축이 있어야 보인다.
 *
 * [⛔ 이 자가 «하지 않는» 것]
 *   · 「왜 떨어졌나」를 지어내지 않는다. 수만 낸다. 까닭은 사람이 다른 자료와 맞춰 본다
 *   · GA4 가 덜 세는 것을 보정하지 않는다 — 광고차단·쿠키거부로 늘 «바닥값»이다
 *   · 오늘치를 넣지 않는다. 하루가 안 끝났으므로 늘 낮게 나와 「떨어졌다」로 오독된다
 *
 * [쓰는 법]
 *   node scripts/ga4-daily.mjs --자가시험
 *   node scripts/ga4-daily.mjs --days 30
 *   node scripts/ga4-daily.mjs --days 30 --유입      어디서 왔나까지 함께 본다
 */
import { readFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 갈래 = 'https://www.googleapis.com/auth/analytics.readonly';

/** 우리 사이트인가 — 시험서버·백업·localhost 는 손님이 아니다 */
export function 우리것인가(호스트) {
  const h = String(호스트 ?? '').toLowerCase();
  if (!h) return false;
  if (/^(localhost|127\.0\.0\.1)/.test(h)) return false;
  if (h.includes('cloudtype.app')) return false;      /* 배포 확인용 주소 */
  if (h.includes('github.io')) return false;          /* 백업 경로 */
  return /(100yearmap|klifemap|kculturewire|seoulmarkets)\./.test(h);
}

/** www 를 떼어 한 사이트로 묶는다 — www 와 민얼굴이 갈리면 수가 반으로 쪼개져 보인다 */
export function 사이트이름(호스트) {
  return String(호스트 ?? '').toLowerCase().replace(/^www\./, '');
}

/**
 * 앞뒤 반을 갈라 견준다 — 「요즘 떨어지나」를 재는 가장 단순한 자다.
 * ⚠ 이것은 «추세»이지 «까닭»이 아니다. 떨어졌다는 것만 말하고 왜인지는 말하지 않는다.
 */
export function 앞뒤견줌(날짜별) {
  const 날들 = Object.keys(날짜별).sort();
  if (날들.length < 4) return null;   /* 나흘도 안 되면 앞뒤를 가를 수 없다 */
  const 반 = Math.floor(날들.length / 2);
  const 합 = (것들) => 것들.reduce((a, d) => a + (날짜별[d] || 0), 0);
  const 앞 = 합(날들.slice(0, 반));
  const 뒤 = 합(날들.slice(날들.length - 반));
  const 앞평균 = 앞 / 반;
  const 뒤평균 = 뒤 / 반;
  return {
    앞평균, 뒤평균, 반,
    바뀜: 앞평균 ? (뒤평균 - 앞평균) / 앞평균 : null,
    첫날: 날들[0], 끝날: 날들[날들.length - 1],
  };
}

/** GA4 가 주는 20260906 을 사람이 읽는 꼴로 */
export function 날짜풀기(s) {
  const v = String(s ?? '');
  return /^\d{8}$/.test(v) ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6)}` : v;
}

/** 막대 — 눈으로 추세를 본다. 표만 있으면 사람이 못 읽는다 */
export function 막대(값, 최대, 폭 = 34) {
  if (!최대 || 최대 <= 0) return '';
  return '█'.repeat(Math.max(값 > 0 ? 1 : 0, Math.round((값 / 최대) * 폭)));
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
const 내가직접돌았나 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (내가직접돌았나 && process.argv.includes('--자가시험')) {
  let 통과 = 0; let 실패 = 0;
  const 참 = (이름, 값) => { if (값) 통과++; else { 실패++; console.log('  🔴', 이름); } };

  참('우리 사이트를 센다', 우리것인가('kculturewire.com') === true);
  참('www 도 우리 것이다', 우리것인가('www.klifemap.ai') === true);
  참('localhost 는 뺀다', 우리것인가('localhost') === false);
  참('127.0.0.1 도 뺀다', 우리것인가('127.0.0.1') === false);
  참('cloudtype 확인주소는 뺀다', 우리것인가('port-0-web-x.sel3.cloudtype.app') === false);
  참('github.io 백업은 뺀다', 우리것인가('parkintaek2-gif.github.io') === false);
  참('빈 값을 견딘다', 우리것인가('') === false);
  참('null 을 견딘다', 우리것인가(null) === false);

  참('www 를 떼어 묶는다', 사이트이름('www.kculturewire.com') === 'kculturewire.com');
  참('민얼굴은 그대로', 사이트이름('klifemap.ai') === 'klifemap.ai');

  참('날짜를 푼다', 날짜풀기('20260906') === '2026-09-06');
  참('이미 푼 것은 그대로', 날짜풀기('2026-09-06') === '2026-09-06');

  const 떨어짐 = { '2026-09-01': 10, '2026-09-02': 10, '2026-09-03': 5, '2026-09-04': 5 };
  const r = 앞뒤견줌(떨어짐);
  참('앞뒤를 갈라 견준다', r.앞평균 === 10 && r.뒤평균 === 5);
  참('떨어진 것을 음수로 낸다', r.바뀜 === -0.5);
  참('나흘 미만이면 못 견준다', 앞뒤견줌({ '2026-09-01': 1 }) === null);
  참('빈 것을 견딘다', 앞뒤견줌({}) === null);

  참('막대가 최대에서 꽉 찬다', 막대(10, 10, 10).length === 10);
  참('0 은 빈 막대', 막대(0, 10, 10) === '');
  /* ⭐ 아주 작은 값도 한 칸은 보여야 한다 — 안 그리면 「0명」과 구분이 안 된다 */
  참('작은 값도 한 칸은 그린다', 막대(1, 1000, 34).length === 1);
  참('최대가 0이면 빈 막대', 막대(5, 0) === '');

  console.log(`\n하루 단위 방문자 — 자가시험 ${통과} 통과 · ${실패} 실패`);
  process.exit(실패 ? 1 : 0);
}

if (내가직접돌았나) {
  const 인자 = (이름, 기본) => {
    const i = process.argv.indexOf(`--${이름}`);
    if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
    return process.argv.find((a) => a.startsWith(`--${이름}=`))?.split('=')[1] ?? 기본;
  };
  const 일 = Number(인자('days', '30'));

  /* .env 를 읽는다 — 다른 자와 같은 길 */
  const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const env = path.join(뿌리, '.env');
  if (existsSync(env)) {
    for (const 줄 of readFileSync(env, 'utf8').split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const 속성 = process.env.GA4_PROPERTY_ID;
  if (!키파일 || !existsSync(키파일)) { console.log('⚠ 서비스 계정 키가 없다 — **못 쟀다.**'); process.exit(0); }
  if (!속성) { console.log('⚠ GA4_PROPERTY_ID 가 없다 — **못 쟀다.**'); process.exit(0); }

  const 키 = JSON.parse(readFileSync(키파일, 'utf8'));
  const 지금 = Math.floor(Date.now() / 1000);
  const 헤더 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const 몸 = Buffer.from(JSON.stringify({
    iss: 키.client_email, scope: 갈래, aud: 'https://oauth2.googleapis.com/token',
    iat: 지금, exp: 지금 + 3600,
  })).toString('base64url');
  const 대상 = `${헤더}.${몸}`;
  const jwt = `${대상}.${createSign('RSA-SHA256').update(대상).sign(키.private_key, 'base64url')}`;
  const tr = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const tj = await tr.json();
  if (!tj.access_token) { console.log('🔴 토큰 실패 — **못 쟀다.**'); process.exit(1); }

  const 재기 = async (차원들) => {
    const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tj.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        /* ⛔ 오늘치는 넣지 않는다 — 하루가 안 끝나 늘 낮게 나오고, 그것이 「떨어졌다」로 오독된다 */
        dateRanges: [{ startDate: `${일}daysAgo`, endDate: 'yesterday' }],
        dimensions: 차원들.map((n) => ({ name: n })),
        metrics: [{ name: 'totalUsers' }],
        limit: 100000,
      }),
    });
    const j = await r.json();
    if (!j.rows) { console.log('🔴 GA4 가 줄을 안 줬다 — **못 쟀다.**', JSON.stringify(j).slice(0, 200)); return []; }
    return j.rows.map((x) => ({ 값: x.dimensionValues.map((v) => v.value), 수: Number(x.metricValues[0].value) }));
  };

  const 줄들 = await 재기(['date', 'hostName']);
  const 날짜별 = {};          /* 전체 */
  const 사이트날짜별 = {};    /* 사이트 → 날짜 → 수 */
  for (const r of 줄들) {
    const [d, h] = r.값;
    if (!우리것인가(h)) continue;
    const 날 = 날짜풀기(d);
    const s = 사이트이름(h);
    날짜별[날] = (날짜별[날] || 0) + r.수;
    (사이트날짜별[s] ??= {})[날] = (사이트날짜별[s][날] || 0) + r.수;
  }

  const 날들 = Object.keys(날짜별).sort();
  if (!날들.length) { console.log('⬜ 잰 줄이 없다 — **못 쟀다.**'); process.exit(0); }
  const 최대 = Math.max(...Object.values(날짜별));

  console.log(`■ 순방문자 — 하루 단위 (어제까지 ${날들.length}일 · 우리 네 사이트 합)\n`);
  console.log('   날짜          사람   추세');
  for (const d of 날들) {
    const 요일 = ['일', '월', '화', '수', '목', '금', '토'][new Date(d + 'T00:00:00').getDay()];
    console.log(`   ${d}(${요일}) ${String(날짜별[d]).padStart(5)}   ${막대(날짜별[d], 최대)}`);
  }

  const 견줌 = 앞뒤견줌(날짜별);
  if (견줌) {
    const 화살 = 견줌.바뀜 < -0.05 ? '🔴 떨어지는 중' : 견줌.바뀜 > 0.05 ? '✅ 오르는 중' : '⬜ 거의 그대로';
    console.log(`\n■ 앞 ${견줌.반}일 vs 뒤 ${견줌.반}일 — ${화살}`);
    console.log(`   앞 ${견줌.반}일 하루 평균  ${견줌.앞평균.toFixed(1)}명`);
    console.log(`   뒤 ${견줌.반}일 하루 평균  ${견줌.뒤평균.toFixed(1)}명   (${(견줌.바뀜 * 100).toFixed(0)}%)`);
    const 전체평균 = Object.values(날짜별).reduce((a, b) => a + b, 0) / 날들.length;
    console.log(`   ${날들.length}일 전체 평균      ${전체평균.toFixed(1)}명  ← 「하루 ${Math.round(전체평균)}명꼴」이라 말해 온 수`);
    if (견줌.뒤평균 < 전체평균) {
      console.log(`   ⚠ 요즘 하루가 전체 평균보다 ${(전체평균 - 견줌.뒤평균).toFixed(1)}명 낮다 — 사장님이 짚으신 것이 이것이다.`);
    }
  }

  console.log('\n■ 사이트별 — 뒤 이레');
  const 사이트들 = Object.keys(사이트날짜별).sort((a, b) =>
    Object.values(사이트날짜별[b]).reduce((x, y) => x + y, 0) - Object.values(사이트날짜별[a]).reduce((x, y) => x + y, 0));
  const 뒤이레 = 날들.slice(-7);
  console.log(`   사이트                 ${뒤이레.map((d) => d.slice(5)).join('  ')}   앞뒤`);
  for (const s of 사이트들) {
    const 줄 = 뒤이레.map((d) => String(사이트날짜별[s][d] || 0).padStart(5)).join(' ');
    const g = 앞뒤견줌(사이트날짜별[s]);
    const 표 = g ? `${g.바뀜 > 0 ? '+' : ''}${(g.바뀜 * 100).toFixed(0)}%` : '못 잼';
    console.log(`   ${s.padEnd(22)} ${줄}   ${표.padStart(6)}`);
  }

  if (process.argv.includes('--유입')) {
    console.log('\n■ 어디서 왔나 — 앞 절반 vs 뒤 절반');
    const 유입줄 = await 재기(['date', 'sessionDefaultChannelGroup']);
    const 길별 = {};
    for (const r of 유입줄) {
      const [d, c] = r.값;
      (길별[c] ??= {})[날짜풀기(d)] = (길별[c][날짜풀기(d)] || 0) + r.수;
    }
    const 길들 = Object.keys(길별).sort((a, b) =>
      Object.values(길별[b]).reduce((x, y) => x + y, 0) - Object.values(길별[a]).reduce((x, y) => x + y, 0));
    console.log('   들어온 길                 앞 하루평균   뒤 하루평균     바뀜');
    for (const c of 길들) {
      const g = 앞뒤견줌(길별[c]);
      if (!g) { console.log(`   ${c.padEnd(24)}  (날이 모자라 못 견줌)`); continue; }
      const 표 = `${g.바뀜 > 0 ? '+' : ''}${(g.바뀜 * 100).toFixed(0)}%`;
      console.log(`   ${c.padEnd(24)} ${g.앞평균.toFixed(1).padStart(9)} ${g.뒤평균.toFixed(1).padStart(12)} ${표.padStart(8)}`);
    }
  }

  console.log('\n⚠ GA4 는 광고차단·쿠키거부로 **덜 세는 쪽**이다. 바닥값으로 읽는다.');
  console.log('⛔ 이 자는 «떨어졌다»까지만 말한다. 까닭은 다른 자료와 맞춰 봐야 안다 —');
  console.log('   발행 편수(그날 낸 것) · GSC 노출·클릭 · 색인된 지면 수를 나란히 놓고 본다.');
}
