/**
 * Riot 랭크 사다리 수집기 — **오늘 안 뜨면 영영 못 뜬다.**
 *
 * ── 왜 이것부터인가 ──────────────────────────────────────────────
 * 2026-08-02 에 개발자 API 를 전부 재 봤다(`scripts/probe-riot.mjs`).
 * **프로 e스포츠 경기 데이터는 개발자 API 에 없다**(403). 기획서가 그걸 전제하고
 * 있었는데 사실이 아니었다. 대신 **랭크 사다리는 전 지역이 열린다.**
 *
 * 그리고 사다리는 **소급이 안 된다.** 오늘의 챌린저 분포는 내일 다시 못 받는다.
 * 관세청 10일 잠정치가 확정치로 덮인 뒤 원본이 없는 것과 같다.
 * 아카이브가 이 사업의 해자라는 전제가 여기에도 그대로 걸린다 —
 * **하루 안 뜨면 그 하루는 영영 빈다.**
 *
 * ── 무엇을 만드는가 ──────────────────────────────────────────────
 * 「한국이 왜 강한가」를 프로 경기 없이 재는 방법이다.
 * 지역별 사다리 **모집단 수준**을 비교한다 — 아무도 세지 않는 숫자다.
 *
 *   KR(한국) · SG(동남아) · VN(베트남) · JP(일본) · NA(북미) · EUW(유럽서)
 *   동남아·베트남을 넣은 이유는 WikiTip 의 1차 시장이 그쪽이기 때문이다.
 *
 * ── ⚠ 개인정보는 담지 않는다 ────────────────────────────────────
 * 응답에는 `puuid`(플레이어 식별자)가 들어 있다. **저장하지 않는다.**
 *
 * 우리가 파는 것은 「누가」가 아니라 **「어떤 분포인가」**다. 식별자를 쌓아 두면
 * 쓰지도 않을 개인정보를 떠안고, Riot 정책상 삭제 요구 대응 의무도 생긴다.
 * 원본을 남기는 원칙이 있지만 **개인 식별자는 그 원칙의 대상이 아니다.**
 * LP·승패는 식별자 없이도 분포를 온전히 재현한다.
 *
 * 실행
 *   node scripts/collect-riot-ladder.mjs            전 지역
 *   node scripts/collect-riot-ladder.mjs --only kr  한 지역만
 *
 * ⚠ Personal Key 는 **24시간 만료**다. 만료되면 developer.riotgames.com 에서
 *   REGENERATE 해서 `.env` 의 RIOT_API_KEY 를 갈아 끼운다.
 * ⚠ 상업 이용(광고)은 **Production 승인 뒤**다. 수집·검증은 비상업이라 지금 해도 된다.
 */

import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { put } from '../src/lib/store.mjs';

/* store.mjs 가 이미 .env 를 읽지만, 이 파일만 단독으로 돌 때를 위해 한 번 더 본다.
   이미 들어 있으면 덮지 않으므로 중복 호출이 해롭지 않다. */
try {
  for (const 줄 of readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) {
    const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch { /* 환경변수로 들어온 경우 */ }

const KEY = process.env.RIOT_API_KEY ?? '';
if (!KEY) {
  console.error('✕ RIOT_API_KEY 가 없다. developer.riotgames.com 에서 받아 .env 에 넣어라.');
  process.exit(1);
}

/** 지역. `시장` 은 왜 이 지역을 보는가 — 나중에 지우지 않도록 이유를 데이터에 남긴다. */
const 지역들 = [
  { id: 'kr', host: 'kr.api.riotgames.com', 이름: 'Korea', 시장: '기준선 — 「한국이 왜 강한가」의 한국' },
  { id: 'sg2', host: 'sg2.api.riotgames.com', 이름: 'Southeast Asia', 시장: 'WikiTip 1차 시장' },
  { id: 'vn2', host: 'vn2.api.riotgames.com', 이름: 'Vietnam', 시장: 'WikiTip 확장 시장' },
  { id: 'jp1', host: 'jp1.api.riotgames.com', 이름: 'Japan', 시장: '비교군 — 인접 아시아' },
  { id: 'na1', host: 'na1.api.riotgames.com', 이름: 'North America', 시장: '비교군 — 영어권' },
  { id: 'euw1', host: 'euw1.api.riotgames.com', 이름: 'Europe West', 시장: '비교군 — 최대 서버' },
];

const 쉬기 = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 한 번 부른다. **429(한도 초과)는 재시도한다** — Personal Key 는 100req/2min 이라
 * 지역을 돌다 보면 실제로 걸린다. 그때 조용히 건너뛰면 그 지역의 그날이 빈다.
 */
async function 부르기(url, 재시도 = 3) {
  for (let i = 0; i < 재시도; i++) {
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': KEY, Accept: 'application/json' },
      signal: AbortSignal.timeout(25_000),
    });
    if (res.ok) return res.json();
    if (res.status === 429) {
      const 대기 = Number(res.headers.get('retry-after') ?? 10);
      console.log(`    ⏳ 한도. ${대기}초 쉰다 (${i + 1}/${재시도})`);
      await 쉬기((대기 + 1) * 1000);
      continue;
    }
    if (res.status === 401 || res.status === 403) {
      // 키 만료가 여기로 온다. **조용히 넘기지 않는다** — 오늘 하루가 통째로 빈다.
      const t = await res.text().catch(() => '');
      throw new Error(`인증 실패 ${res.status}. 키가 만료됐을 수 있다(Personal Key 는 24시간). ${t.slice(0, 120)}`);
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error('429 재시도 소진');
}

/** 백분위. 정렬된 배열에서 뽑는다. */
function 백분위(정렬된, p) {
  if (정렬된.length === 0) return null;
  const i = Math.min(정렬된.length - 1, Math.max(0, Math.round((p / 100) * (정렬된.length - 1))));
  return 정렬된[i];
}

/**
 * 한 리그의 분포를 낸다.
 * **puuid·summonerId 를 여기서 버린다.** 이 함수 밖으로 식별자가 안 나간다.
 */
function 분포(entries) {
  const lp = entries.map((e) => e.leaguePoints ?? 0).sort((a, b) => a - b);
  const 판수 = entries.map((e) => (e.wins ?? 0) + (e.losses ?? 0));
  const 총승 = entries.reduce((s, e) => s + (e.wins ?? 0), 0);
  const 총패 = entries.reduce((s, e) => s + (e.losses ?? 0), 0);
  const 총판 = 총승 + 총패;
  return {
    players: entries.length,
    lp: {
      min: lp[0] ?? null,
      p25: 백분위(lp, 25),
      median: 백분위(lp, 50),
      p75: 백분위(lp, 75),
      p90: 백분위(lp, 90),
      max: lp[lp.length - 1] ?? null,
      mean: lp.length ? Math.round(lp.reduce((a, b) => a + b, 0) / lp.length) : null,
    },
    games: {
      total: 총판,
      mean_per_player: 판수.length ? Math.round(총판 / 판수.length) : null,
      max_per_player: 판수.length ? Math.max(...판수) : null,
    },
    /** 승률. 사다리 위쪽은 50% 에 수렴하므로 **차이 자체가 기사거리**다 */
    win_rate: 총판 ? Number(((총승 / 총판) * 100).toFixed(2)) : null,
    veteran: entries.filter((e) => e.veteran).length,
    hot_streak: entries.filter((e) => e.hotStreak ?? false).length,
    /** ⚠ puuid·summonerId 는 담지 않는다. 파일 머리 참조 */
    lp_values: lp, // 식별자 없는 순수 분포. 나중에 히스토그램을 다시 그릴 수 있다
  };
}

async function main() {
  const 만 = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
  const 대상 = 만 ? 지역들.filter((r) => r.id === 만 || r.id.startsWith(만)) : 지역들;
  if (대상.length === 0) {
    console.error(`✕ --only ${만} 에 맞는 지역이 없다. ${지역들.map((r) => r.id).join(', ')}`);
    process.exit(1);
  }

  /* ⚠ 이 PC 는 KST 다. toISOString() 은 UTC 라 새벽에 하루가 어긋난다.
     아카이브의 날짜 폴더가 어긋나면 「그날이 빈 것」과 구분이 안 된다. */
  const 지금 = new Date();
  const 날짜 = 지금.toLocaleString('sv-SE').slice(0, 10);
  const 시각 = 지금.toLocaleString('sv-SE');

  console.log(`Riot 랭크 사다리 — ${시각} KST`);
  console.log(`지역 ${대상.length}곳 · 소급이 안 되므로 하루도 빠뜨리지 않는다`);
  console.log('');

  const 결과 = {};
  const 실패 = [];

  for (const 지 of 대상) {
    process.stdout.write(`  ${지.id.padEnd(5)} ${지.이름.padEnd(16)}`);
    try {
      const ch = await 부르기(`https://${지.host}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`);
      await 쉬기(1200); // Personal Key 는 100req/2min. 넉넉히 띄운다
      const gm = await 부르기(`https://${지.host}/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5`);
      await 쉬기(1200);

      결과[지.id] = {
        region_name: 지.이름,
        why_tracked: 지.시장,
        challenger: 분포(ch.entries ?? []),
        grandmaster: 분포(gm.entries ?? []),
      };
      const c = 결과[지.id].challenger;
      console.log(
        `챌린저 ${String(c.players).padStart(4)}명 · LP 중앙 ${String(c.lp.median).padStart(4)} · 최고 ${String(c.lp.max).padStart(4)} · 승률 ${c.win_rate}%`,
      );
    } catch (e) {
      console.log(`✕ ${e.message}`);
      실패.push({ region: 지.id, error: e.message });
      // 한 지역이 죽어도 나머지는 받는다. 다만 **무엇이 빠졌는지 파일에 적는다**
    }
  }

  if (Object.keys(결과).length === 0) {
    console.error('');
    console.error('✕ 한 지역도 못 받았다. 키가 만료됐을 가능성이 크다.');
    console.error('  developer.riotgames.com 에서 REGENERATE 후 .env 의 RIOT_API_KEY 교체.');
    process.exit(1);
  }

  const 문서 = {
    collected_at_kst: 시각,
    day: 날짜,
    source: {
      api: 'Riot Games Developer API',
      endpoints: ['/lol/league/v4/challengerleagues', '/lol/league/v4/grandmasterleagues'],
      queue: 'RANKED_SOLO_5x5',
      key_type: 'Personal Key (24h)',
      commercial_status: 'Production approval NOT granted — non-commercial collection only',
    },
    /** 왜 식별자가 없는지 파일 안에서도 알 수 있게 남긴다. 나중에 「빠졌다」고 오해하지 않도록 */
    privacy: 'Player identifiers (puuid, summonerId) are intentionally not stored. Distributions only.',
    regions: 결과,
    ...(실패.length ? { failed: 실패 } : {}),
  };

  const 키 = `raw/riot-ladder/${날짜}/solo-queue.json`;
  const r = await put(키, JSON.stringify(문서, null, 2), 'application/json');

  /* ── 발행용 요약을 저장소 안에 쓴다 ─────────────────────────────
     원본은 archive/(gitignore)와 R2 에 있는데 **둘 다 빌드 컨테이너에 없다.**
     `/v1/research` 가 바로 그것 때문에 503 이었다. 같은 실수를 지면에서 반복하지 않는다.

     그래서 **지면이 쓸 최소한만 저장소에 남긴다.** lp_values(지역당 300개 배열)는
     뺀다 — 지면에는 백분위만 나가고, 원본 분포가 필요하면 아카이브에서 본다.
     파생물이라 커밋해도 아깝지 않고, 크기는 몇 KB 다. */
  const 요약 = {
    collected_at_kst: 시각,
    day: 날짜,
    source: 문서.source,
    privacy: 문서.privacy,
    regions: Object.fromEntries(
      Object.entries(결과).map(([id, v]) => [
        id,
        {
          region_name: v.region_name,
          challenger: { ...v.challenger, lp_values: undefined },
          grandmaster: { ...v.grandmaster, lp_values: undefined },
        },
      ]),
    ),
  };
  const 요약경로 = path.resolve('src/data/riot-ladder.json');
  await mkdir(path.dirname(요약경로), { recursive: true });
  await writeFile(요약경로, JSON.stringify(요약, null, 2) + '\n');

  console.log('');
  console.log(`  로컬  ${r.local}`);
  if (r.remote) console.log(`  R2    ${r.remote}`);
  else if (r.remoteError) console.log(`  ⚠ R2 실패 — ${r.remoteError}  (로컬에는 남았다)`);
  else console.log('  · R2 미설정 — 로컬에만 저장됐다');

  if (실패.length) {
    console.log('');
    console.log(`  ⚠ 못 받은 지역 ${실패.length}곳: ${실패.map((f) => f.region).join(', ')}`);
    console.log('    파일에 failed 로 적어 뒀다. 조용히 빠지지 않는다.');
  }
}

main().catch((e) => {
  console.error('');
  console.error('✕', e.message);
  process.exit(1);
});
