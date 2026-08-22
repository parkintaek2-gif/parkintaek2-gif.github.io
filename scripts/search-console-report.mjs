#!/usr/bin/env node
/**
 * Search Console 실측 — 서비스 계정으로 «손님이 실제로 친 검색어»를 읽는다.
 *
 * ── 왜 만드나 (2026-08-22) ────────────────────────────────────────────
 * 5번이 15:30 보고에서 청했다 — 「넷 중 유일하게 손님이 실제로 친 말을 준다.
 * 소유확인은 이미 됐고 승인은 한 번이면 된다. 여섯 자리가 다 쓴다.」
 * 사장님이 구글 클라우드에서 서비스 계정을 만들고 세 사이트(seoulmarkets·100yearmap·
 * kculturewire) Search Console에 「전체」 권한으로 등록했다. 이 자가 그걸로 읽는다.
 *
 * ⛔ 이 자는 googleapis 패키지를 쓰지 않는다 — JWT 서명 + fetch 만으로 된다.
 *   의존성 하나 늘리는 것보다 이게 더 짧고, 이미 Node 내장 crypto 로 충분하다.
 *
 * 쓰기:
 *   node scripts/search-console-report.mjs https://seoulmarkets.com/ --days 28
 *   node scripts/search-console-report.mjs https://100yearmap.com/ --days 28
 */
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';

/* store.mjs 와 같은 방식 — Node 가 .env 를 자동으로 안 읽는다. 직접 읽는다 */
(function 환경파일읽기() {
  try {
    const 본문 = readFileSync(path.resolve('.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const 값 = m[2].trim().replace(/^["']|["']$/g, '');
      if (process.env[m[1]] === undefined) process.env[m[1]] = 값;
    }
  } catch { /* .env 없으면 정상 */ }
})();

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const 사이트 = process.argv[2];
const 일수 = Number(arg('--days', 28));

if (!사이트 || !(사이트.startsWith('http') || 사이트.startsWith('sc-domain:'))) {
  console.error('쓰기: node scripts/search-console-report.mjs https://seoulmarkets.com/ [--days 28]');
  console.error('     또는 (도메인 속성이면)  node scripts/search-console-report.mjs sc-domain:seoulmarkets.com');
  process.exit(1);
}
if (!키파일) { console.error('⛔ GOOGLE_APPLICATION_CREDENTIALS 가 .env 에 없다'); process.exit(1); }

const 키 = JSON.parse(readFileSync(키파일, 'utf8'));

/** 서비스 계정 JWT를 손으로 서명한다(구글 OAuth2 JWT Bearer 흐름) */
function jwt만들기() {
  const 지금 = Math.floor(Date.now() / 1000);
  const 헤더 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const 몸 = Buffer.from(JSON.stringify({
    iss: 키.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: 지금,
    exp: 지금 + 3600,
  })).toString('base64url');
  const 서명대상 = `${헤더}.${몸}`;
  const 서명 = createSign('RSA-SHA256').update(서명대상).sign(키.private_key, 'base64url');
  return `${서명대상}.${서명}`;
}

async function 토큰받기() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt만들기(),
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`토큰 실패: ${JSON.stringify(j)}`);
  return j.access_token;
}

async function main() {
  /* 2026-08-22 5번 — 선택 인자를 더했다. ⛔ 기본값은 그대로라 다른 자리 출력은 안 바뀐다.
     --행수=1000  더 많이 본다(구글 최대 25,000)
     --축=page    검색어 대신 «어느 지면이 노출됐나»를 본다 */
  const 행수 = Number((process.argv.find((a) => a.startsWith('--행수='))?.split('=')[1]) ?? 25);
  const 축 = (process.argv.find((a) => a.startsWith('--축='))?.split('=')[1]) ?? 'query';
  /* 2026-08-22 5번 — «어느 검색어가 이 한 지면에 닿았나»를 보려고 걸름을 더했다.
     ⛔ 인자를 안 주면 걸름이 아예 안 들어간다 — 6번·3번이 쓰는 기본 출력은 그대로다.
     ⚠ contains 라 부분 일치다. /market/japan 은 /market/japan 하나지만
       /title/the-moon 처럼 짧은 조각은 남의 지면까지 잡을 수 있다. 그럴 땐 전체 주소를 준다.
     쓰는 법  --지면=/market/nicaragua */
  const 지면 = (process.argv.find((a) => a.startsWith('--지면='))?.split('=')[1]) ?? null;
  /**
   * 🔴 2026-08-22 실측 — Git Bash 가 `--지면=/market/nicaragua` 를 윈도 경로로 바꿔
   *   `C:/Program Files/Git/market/nicaragua` 로 넘겼다(MSYS 경로 변환).
   *   그러면 걸름에 아무것도 안 맞아 **0건이 조용히 나온다** — 「닿는 검색어가 없다」로 잘못 읽힌다.
   *   ⭐ 그래서 여기서 세운다. **못 잰 것을 없는 것으로 적지 않는다.**
   *   앞에 `MSYS_NO_PATHCONV=1` 을 붙이거나 PowerShell 에서 돌린다.
   */
  if (지면 && /^[A-Za-z]:[\/]/.test(지면)) {
    console.error(`⛔ --지면 값이 윈도 경로로 바뀌었다 — ${지면}`);
    console.error('   MSYS_NO_PATHCONV=1 을 앞에 붙이거나 PowerShell 에서 돌린다. 0건은 「없다」가 아니다.');
    process.exit(1);
  }
  const 걸름 = 지면 ? [{ filters: [{ dimension: 'page', operator: 'contains', expression: 지면 }] }] : undefined;
  const 토큰 = await 토큰받기();
  const 끝 = new Date(); 끝.setDate(끝.getDate() - 2);           // 구글은 최근 2~3일치가 아직 안 갖춰졌다
  const 시작 = new Date(끝); 시작.setDate(시작.getDate() - 일수);
  const 날짜문자 = (d) => d.toISOString().slice(0, 10);

  const r = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(사이트)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: 날짜문자(시작),
        endDate: 날짜문자(끝),
        dimensions: [축],
        rowLimit: 행수,
        ...(걸름 ? { dimensionFilterGroups: 걸름 } : {}),
      }),
    },
  );
  const j = await r.json();
  if (j.error) { console.error(`🔴 ${사이트}: ${j.error.message}`); process.exit(1); }
  const 행 = j.rows ?? [];
  console.log(`${사이트} — ${날짜문자(시작)} ~ ${날짜문자(끝)} · ${축 === 'page' ? '지면' : '검색어'} ${행.length}개(최대 ${행수})`);
  if (!행.length) { console.log('   (아직 자료 없음 — 등록 직후면 정상이다. 며칠 걸린다)'); return; }
  for (const row of 행) {
    console.log(`   노출 ${String(row.impressions).padStart(6)} · 클릭 ${String(row.clicks).padStart(4)} · 순위 ${row.position.toFixed(1)}   ${row.keys[0]}`);
  }
}

main().catch((e) => { console.error('🔴 실패:', e.message); process.exit(1); });
