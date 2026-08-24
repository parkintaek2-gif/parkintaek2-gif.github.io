/**
 * check-sitemap-freshness.mjs — **구글이 마지막에 읽은 사이트맵이 «지금 것»인가.**
 *
 * ── 🔴 왜 이 자가 생겼나 ───────────────────────────────────────
 * 2026-08-24 밤에 회사 전체가 사이트맵을 크게 고쳤다 —
 * ```
 *   5번  그림 177 → 1,125장 · 영상 9 → 21편
 *   3번  그림 0 → 1,196장 · 영상 0 → 10편
 *   6번  영상 0 → 51편
 * ```
 * 그런데 다음 날 새벽에 구글에 물어 보니 **구글이 마지막에 읽은 판에는 그림 177·영상 9**로
 * 남아 있었다. 즉 **고친 것을 구글이 아직 못 봤다.** 우리는 「냈다」고 적고 넘어갔는데
 * 구글 쪽 장부에는 옛 수가 그대로였다.
 *
 * ⭐ 이 자가 답하는 것은 하나다 — **「구글이 마지막에 읽은 날이 우리가 고친 날보다 뒤인가」**
 *   뒤가 아니면 다시 내면 된다. 다시 내는 것은 한 번의 PUT 이고 값이 거의 안 든다.
 *
 * ── ⛔ 이 자가 «말하지 않는» 것 ────────────────────────────────
 * ⛔ 「색인됐다」를 말하지 않는다. 사이트맵을 읽는 것과 지면을 넣는 것은 다른 일이다.
 *   실제로 들어갔는지는 `check-kcw-indexed.mjs` 로 따로 잰다.
 * ⛔ 구글이 내는 `indexed` 칸을 그대로 쓰지 않는다 — 그 칸은 오래전부터 0 으로만 온다.
 *   0 을 「하나도 색인 안 됐다」로 읽으면 거짓이 된다. 그래서 «못 잰 칸»으로 적는다.
 * ⛔ 다시 낸다고 구글이 바로 오지 않는다. 「냈다」까지만 말한다.
 *
 * 쓰는 법  node scripts/check-sitemap-freshness.mjs --자가시험
 *          node scripts/check-sitemap-freshness.mjs
 *          node scripts/check-sitemap-freshness.mjs --사이트=sc-domain:100yearmap.com
 *          node scripts/check-sitemap-freshness.mjs --다시낸다
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 인자 = (이름, 기본) => {
  const 머리 = `--${이름}=`;
  const a = process.argv.find((x) => x.startsWith(머리));
  return a ? a.slice(머리.length) : 기본;
};

/**
 * 구글이 읽은 날이 우리가 고친 날보다 «뒤»인가.
 * ⛔ 하나라도 모르면 「낡았다」로 «단정하지 않는다» — 「못 쟀다」로 돌려준다.
 *   못 잰 것을 낡은 것으로 적으면 멀쩡한 사이트맵을 자꾸 다시 내게 된다.
 */
export function 낡았나(읽은날, 고친날) {
  if (!읽은날 || !고친날) return { 판정: '못 쟀다', 낡음: null };
  const r = new Date(읽은날).getTime();
  const c = new Date(고친날).getTime();
  if (!Number.isFinite(r) || !Number.isFinite(c)) return { 판정: '못 쟀다', 낡음: null };
  return r >= c ? { 판정: '싱싱하다', 낡음: false } : { 판정: '낡았다', 낡음: true };
}

/**
 * 구글이 내는 contents 를 사람이 읽을 줄로. `indexed` 는 늘 0 으로 와서 «못 잰 칸»으로 적는다.
 * ⛔ 0 을 「색인 0장」이라고 쓰지 않는다 — 그것이 이 자에서 가장 쉽게 나올 거짓말이다.
 */
export function 내용글(contents) {
  const 줄 = [];
  for (const c of contents ?? []) {
    const n = Number(c?.submitted ?? 0);
    줄.push(`${String(c?.type ?? '?')} ${n.toLocaleString('en-US')}장 제출`);
  }
  return 줄.length ? 줄.join(' · ') : '내용 칸이 비었다(못 쟀다)';
}

/** 우리 쪽이 마지막으로 고친 때 — 지은 사이트맵 파일의 수정 시각을 쓴다 */
export function 우리가고친때(파일, 보기 = { existsSync, statSync }) {
  if (!보기.existsSync(파일)) return null;
  try { return new Date(보기.statSync(파일).mtime).toISOString(); } catch { return null; }
}

async function 토큰(스코프) {
  const 키길 = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'C:/Users/USER/secrets/search-console-sa.json';
  if (!existsSync(키길)) throw new Error(`열쇠 파일이 없다 — ${키길}`);
  const sa = JSON.parse(readFileSync(키길, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const b = Buffer.from(JSON.stringify({
    iss: sa.client_email, scope: 스코프, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  })).toString('base64url');
  const s = createSign('RSA-SHA256').update(`${h}.${b}`).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${b}.${s}` }),
  });
  if (!r.ok) throw new Error(`토큰 못 받았다 — HTTP ${r.status}`);
  return (await r.json()).access_token;
}

/* ────────────────────────── 자가시험 ────────────────────────── */
function 자가시험() {
  const 시험 = [];
  const T = (이름, 참) => 시험.push([이름, !!참]);

  T('낡았나 — 읽은 날이 뒤면 싱싱하다',
    낡았나('2026-08-25T00:00:00Z', '2026-08-24T00:00:00Z').낡음 === false);
  T('낡았나 — 읽은 날이 앞이면 낡았다',
    낡았나('2026-08-23T00:00:00Z', '2026-08-24T00:00:00Z').낡음 === true);
  T('낡았나 — 같은 때면 싱싱하다',
    낡았나('2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z').낡음 === false);
  /* 🔴 못 잰 것을 낡은 것으로 «안» 적는다 — 그러면 멀쩡한 것을 자꾸 다시 내게 된다 */
  T('낡았나 — 읽은 날을 모르면 «못 쟀다»(낡았다가 아니다)',
    낡았나(null, '2026-08-24T00:00:00Z').판정 === '못 쟀다');
  T('낡았나 — 고친 날을 모르면 «못 쟀다»',
    낡았나('2026-08-24T00:00:00Z', null).판정 === '못 쟀다');
  T('낡았나 — 못 쟀을 때 낡음은 false 가 아니라 null',
    낡았나(null, null).낡음 === null);
  T('낡았나 — 읽을 수 없는 날짜도 «못 쟀다»',
    낡았나('어제', '2026-08-24T00:00:00Z').판정 === '못 쟀다');

  T('내용글 — 갈래와 장수를 적는다', 내용글([{ type: 'web', submitted: 1549 }]).includes('1,549장'));
  T('내용글 — 갈래를 여럿 이어 적는다',
    내용글([{ type: 'web', submitted: 1 }, { type: 'image', submitted: 2 }]).includes('·'));
  /* ⛔ 구글의 indexed 칸(늘 0)을 «색인 0장»으로 옮겨 적지 않는다 */
  T('내용글 — indexed 0 을 「색인 0장」으로 «안» 적는다',
    !/색인/.test(내용글([{ type: 'web', submitted: 10, indexed: 0 }])));
  T('내용글 — 빈 값에 안 터진다', 내용글(undefined).includes('못 쟀다'));

  const 가짜 = {
    existsSync: (p) => p === '있다',
    statSync: () => ({ mtime: new Date('2026-08-25T01:00:00Z') }),
  };
  T('우리가고친때 — 파일 시각을 읽는다',
    우리가고친때('있다', 가짜) === '2026-08-25T01:00:00.000Z');
  T('우리가고친때 — 없으면 null(0 이 아니다)', 우리가고친때('없다', 가짜) === null);

  const 진 = 시험.filter(([, ok]) => !ok);
  for (const [이름] of 진) console.error(`❌ ${이름}`);
  if (진.length) { console.error(`⛔ check-sitemap-freshness 자가시험 ${진.length}개 실패`); process.exit(1); }
  console.log(`✅ check-sitemap-freshness 자가시험 통과 (${시험.length})`);
}

/* ────────────────────────── 실행 ────────────────────────── */
if (process.argv.includes('--자가시험')) {
  자가시험();
} else {
  const 사이트 = 인자('사이트', 'sc-domain:kculturewire.com');
  const 지은사이트맵 = path.resolve(뿌리, 인자('지은사이트맵', 'dist/wikitip/sitemap.xml'));
  const 다시낸다 = process.argv.includes('--다시낸다');

  const 고친때 = 우리가고친때(지은사이트맵);
  console.log(`■ ${사이트}`);
  console.log(`  우리가 마지막으로 «지은» 사이트맵  ${고친때 ? 고친때.slice(0, 16).replace('T', ' ') : '못 쟀다 — 지은 파일이 없다'}`);
  console.log('');

  let t;
  try { t = await 토큰('https://www.googleapis.com/auth/webmasters'); } catch (e) {
    console.error(`⛔ ${e.message}`);
    console.error('   «못 쟀다»다. 0 으로도 「싱싱하다」로도 적지 않는다');
    process.exit(1);
  }
  const s = encodeURIComponent(사이트);
  const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${s}/sitemaps`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!r.ok) {
    console.error(`⛔ 사이트맵 목록을 못 받았다 — HTTP ${r.status}`);
    console.error('   ⚠ 403 이면 그 속성에 이 서비스계정이 안 붙어 있는 것이다 — 못 쟀다');
    process.exit(1);
  }
  const 목록 = (await r.json()).sitemap ?? [];
  if (!목록.length) {
    console.log('⛔ 구글에 «제출된 사이트맵이 0개»다. 이건 못 잰 것이 아니라 «없는» 것이다');
    process.exit(0);
  }

  const 낼것 = [];
  for (const sm of 목록) {
    const 읽은날 = sm.lastDownloaded ?? null;
    const { 판정, 낡음 } = 낡았나(읽은날, 고친때);
    const 표 = 낡음 === true ? '🔴' : 낡음 === false ? '✅' : '⬜';
    console.log(`${표} ${sm.path}`);
    console.log(`   구글이 마지막에 «읽은» 날 ${읽은날 ? 읽은날.slice(0, 16).replace('T', ' ') : '없음'}  → ${판정}`);
    console.log(`   그때 구글이 본 것 — ${내용글(sm.contents)}`);
    if (Number(sm.errors ?? 0) || Number(sm.warnings ?? 0)) {
      console.log(`   ⚠ 오류 ${sm.errors ?? 0} · 경고 ${sm.warnings ?? 0}`);
    }
    if (낡음 === true) 낼것.push(sm.path);
  }
  console.log('');

  if (!낼것.length) {
    console.log('✅ 구글이 읽은 판이 우리가 지은 판보다 뒤다 — 다시 낼 것이 없다');
  } else if (!다시낸다) {
    console.log(`🔴 낡은 사이트맵 ${낼것.length}개 — 구글이 «고치기 전 판»을 들고 있다.`);
    console.log('   다시 내려면 같은 줄에 --다시낸다 를 붙인다.');
  } else {
    for (const p of 낼것) {
      const rr = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${s}/sitemaps/${encodeURIComponent(p)}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${t}` },
      });
      console.log(`   ${p} → HTTP ${rr.status}${rr.ok ? '  ✅ 다시 냈다' : '  ⛔ 못 냈다'}`);
    }
  }
  console.log('');
  console.log('⛔ 「다시 냈다」는 «구글이 왔다»는 뜻이 아니다. 언제 올지는 구글이 정한다.');
  console.log('⛔ 그리고 사이트맵을 읽는 것과 지면이 색인되는 것은 다른 일이다 —');
  console.log('   실제로 들어갔는지는 check-kcw-indexed.mjs 로 따로 잰다.');
}
