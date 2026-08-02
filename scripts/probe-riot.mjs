/**
 * Riot 개발자 API — **무엇이 실제로 받아지는지 확정한다.**
 *
 * ── 왜 이걸 먼저 하는가 ──────────────────────────────────────────
 * `docs/콘텐츠-기획-3매체.md` 는 e스포츠 콘텐츠로 이걸 적어 뒀다.
 *
 *   · 한국 선수·팀의 **국제 대회 성적** 집계
 *   · 동남아 팬의 각도 — 자국 선수의 한국 리그 기록
 *   · 메타 변화 추이 (챔피언 픽·밴)
 *
 * 그런데 **기획이 「Riot 공식 API 가 있고 무료다」에서 멈춰 있다.** 그 API 에
 * 프로 경기 데이터가 들어 있는지는 아무도 확인하지 않았다.
 * 오늘 배운 것이 정확히 이것이다 — **「접근 가능한가」가 아니라 「무엇이 나오는가」와
 * 「어느 경로인가」를 먼저 본다.** (관세청: 포털 경유는 되고 UNIPASS 직접은 안 된다)
 *
 * 키가 **24시간짜리 Personal Key** 라 지금 재 두지 않으면 내일 다시 못 잰다.
 * 그래서 수집기를 짜기 전에 이 파일로 사실부터 굳힌다.
 *
 * ── 안 하는 것 ──────────────────────────────────────────────────
 * `esports-api.lolesports.com` 은 **찌르지 않는다.** lolesports.com 이 내부적으로
 * 쓰는 문서화되지 않은 주소다. 접근은 되겠지만 그건 「되니까 쓴다」이고,
 * 우리가 KRX 를 안 긁는 것과 같은 이유로 안 쓴다. 공식 문서에 있는 것만 잰다.
 *
 * 실행
 *   node scripts/probe-riot.mjs
 *
 * ⚠ Personal Key 는 20req/1s · 100req/2min 이다. 사이를 띄운다.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

/* .env 를 직접 읽는다 — store.mjs 와 같은 이유(런타임 의존성 0개). */
function 환경파일읽기() {
  try {
    for (const 줄 of readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 환경변수로 온 것으로 본다 */ }
}
환경파일읽기();

const KEY = process.env.RIOT_API_KEY ?? '';
if (!KEY) {
  console.error('✕ RIOT_API_KEY 가 없다. .env 에 넣어라.');
  process.exit(1);
}

const 쉬기 = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 한 번 찌른다. **키를 URL 에 넣지 않는다** — 헤더로 보낸다.
 * 쿼리스트링에 넣으면 로그·리퍼러·에러 메시지에 그대로 남는다.
 */
async function 찌르기(라벨, url, { 기대 = 200 } = {}) {
  const t = Date.now();
  let res;
  let 본문 = '';
  try {
    res = await fetch(url, {
      headers: { 'X-Riot-Token': KEY, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20_000),
    });
    본문 = await res.text();
  } catch (e) {
    console.log(`  ✕ ${라벨.padEnd(38)} 연결실패 ${e.message}`);
    return { 라벨, url: 가리기(url), ok: false, status: null, error: e.message };
  }

  const ms = Date.now() - t;
  const 표 = { 200: '✅', 400: '⚠', 401: '🔒', 403: '🔒', 404: '·', 415: '⚠', 429: '⏳' };
  const 아이콘 = res.ok ? '✅' : (표[res.status] ?? '✕');

  let 요약 = '';
  try {
    const j = JSON.parse(본문);
    if (Array.isArray(j)) 요약 = `배열 ${j.length}건`;
    else if (j.status?.message) 요약 = j.status.message;
    else 요약 = Object.keys(j).slice(0, 6).join(',');
  } catch {
    요약 = 본문.slice(0, 60).replace(/\s+/g, ' ');
  }

  console.log(`  ${아이콘} ${라벨.padEnd(38)} ${String(res.status).padEnd(4)} ${String(ms).padStart(5)}ms  ${요약.slice(0, 70)}`);
  return { 라벨, url: 가리기(url), ok: res.ok, status: res.status, ms, 요약, 본문: res.ok ? 본문 : null };
}

/** 저장·출력용. 혹시 URL 에 키가 섞였어도 새지 않게 한 번 더 막는다. */
const 가리기 = (s) => s.replace(/RGAPI-[0-9a-f-]+/gi, 'RGAPI-***');

const 결과 = [];
const 재기 = async (...a) => { const r = await 찌르기(...a); 결과.push(r); await 쉬기(400); return r; };

console.log('Riot 개발자 API — 무엇이 나오는지 잰다');
console.log(`키 ${KEY.slice(0, 10)}…${KEY.slice(-4)}  (Personal Key 는 24시간 만료)`);
console.log('');

/* ── ① 계정·플랫폼: 살아 있는가 ──────────────────────────────── */
console.log('① 기본 — 키가 살아 있고 어느 지역이 열리는가');
for (const [지역, host] of [
  ['한국', 'kr.api.riotgames.com'],
  ['북미', 'na1.api.riotgames.com'],
  ['유럽서', 'euw1.api.riotgames.com'],
  ['동남아', 'sg2.api.riotgames.com'],
  ['베트남', 'vn2.api.riotgames.com'],
  ['일본', 'jp1.api.riotgames.com'],
]) {
  await 재기(`플랫폼상태 ${지역}`, `https://${host}/lol/status/v4/platform-data`);
}

/* ── ② 랭킹 — 「한국이 왜 강한가」의 실제 재료가 될 수 있는가 ── */
console.log('');
console.log('② 랭킹 사다리 — 프로 경기가 아니라 **랭크 상위권**은 받아지는가');
await 재기('챌린저 KR', 'https://kr.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5');
await 재기('그랜드마스터 KR', 'https://kr.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5');
await 재기('챌린저 NA', 'https://na1.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5');
await 재기('챌린저 SG', 'https://sg2.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5');

/* ── ③ 관전 — 지금 무슨 챔피언이 쓰이는가(메타) ──────────────── */
console.log('');
console.log('③ 관전 — 메타(픽·밴) 재료가 되는가');
await 재기('주요경기 KR', 'https://kr.api.riotgames.com/lol/spectator/v5/featured-games');

/* ── ④ 프로 e스포츠 — 기획서가 전제한 것. **여기가 핵심이다** ── */
console.log('');
console.log('④ ⭐ 프로 e스포츠 — 기획서의 「국제 대회 성적」이 공식 API 에 있는가');
await 재기('esports 리그(개발자API)', 'https://kr.api.riotgames.com/lol/esports/v1/leagues', { 기대: 404 });
await 재기('tournament-stub', 'https://americas.api.riotgames.com/lol/tournament-stub/v5/providers', { 기대: 404 });
await 재기('clash 토너먼트 KR', 'https://kr.api.riotgames.com/lol/clash/v1/tournaments');

/* ── ⑤ 다른 종목 ────────────────────────────────────────────── */
console.log('');
console.log('⑤ 다른 종목 — TFT · 발로란트');
await 재기('TFT 챌린저 KR', 'https://kr.api.riotgames.com/tft/league/v1/challenger');
await 재기('발로란트 콘텐츠 AP', 'https://ap.api.riotgames.com/val/content/v1/contents');
await 재기('발로란트 랭킹 AP', 'https://ap.api.riotgames.com/val/ranked/v1/leaderboards/by-act/00000000-0000-0000-0000-000000000000');

/* ── ⑥ 정적 데이터(Data Dragon) — 키가 필요 없고 공개다 ──────── */
console.log('');
console.log('⑥ Data Dragon — 키 없이 공개된 정적 데이터');
{
  const r = await fetch('https://ddragon.leagueoflegends.com/api/versions.json').catch(() => null);
  if (r?.ok) {
    const v = await r.json();
    console.log(`  ✅ 버전 목록 ${v.length}개 · 최신 ${v[0]}`);
    결과.push({ 라벨: 'ddragon 버전', ok: true, status: 200, 요약: `최신 ${v[0]}`, 키필요: false });
    const c = await fetch(`https://ddragon.leagueoflegends.com/cdn/${v[0]}/data/ko_KR/champion.json`).catch(() => null);
    if (c?.ok) {
      const j = await c.json();
      const n = Object.keys(j.data).length;
      console.log(`  ✅ 챔피언 ${n}개 (한국어) — 영문·베트남어 등 다국어 제공`);
      결과.push({ 라벨: 'ddragon 챔피언', ok: true, status: 200, 요약: `${n}개`, 키필요: false });
    }
  } else {
    console.log('  ✕ ddragon 접근 실패');
  }
}

/* ── 정리 ───────────────────────────────────────────────────── */
const 됨 = 결과.filter((r) => r.ok);
console.log('');
console.log('═'.repeat(78));
console.log(`열린 것 ${됨.length} / 잰 것 ${결과.length}`);
console.log('');
for (const r of 됨) console.log(`  ✅ ${r.라벨}`);
const 막힘 = 결과.filter((r) => !r.ok);
if (막힘.length) {
  console.log('');
  for (const r of 막힘) console.log(`  ✕ ${r.라벨.padEnd(30)} ${r.status ?? '-'}  ${(r.요약 ?? r.error ?? '').slice(0, 50)}`);
}

const 출력 = path.resolve('archive/probe');
mkdirSync(출력, { recursive: true });
const 파일 = path.join(출력, `riot-${new Date().toLocaleString('sv-SE').slice(0, 10)}.json`);
writeFileSync(
  파일,
  JSON.stringify(
    {
      /* 이 PC 는 KST 다. toISOString 은 UTC 라 새벽에 날짜가 어긋난다 */
      잰시각_KST: new Date().toLocaleString('sv-SE'),
      키종류: 'Personal Key (24시간)',
      결과: 결과.map(({ 본문, ...r }) => r), // 본문은 저장하지 않는다 — 재배포 근거를 확정하기 전이다
    },
    null,
    2,
  ),
);
console.log('');
console.log(`기록 ${파일}`);
