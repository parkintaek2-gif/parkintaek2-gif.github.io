#!/usr/bin/env node
/**
 * 공공데이터 수집기 — 아카이브가 목적이다.
 *
 * 왜 이게 사업의 1순위인가
 *   공공 API 는 과거를 소급해 주지 않는다. 특히 관세청 10일 단위 잠정치는
 *   **나중에 확정치로 덮인다.** 11일 오전에 안 받으면 그 회차의 잠정치는
 *   1년 뒤에 돈을 줘도 못 산다. 아카이브가 곧 해자다.
 *
 * 그래서 이 수집기의 원칙은 세 줄이다.
 *   1. **덮어쓰지 않는다.** 파일 경로에 수집 시각을 넣는다. 같은 기간을 다시 받아도
 *      새 파일이 된다. 잠정치와 확정치가 나란히 남아야 개정 이력이 자산이 된다.
 *   2. **원본을 그대로 저장한다.** 파싱 실패나 스키마 변경이 있어도 원본이 있으면
 *      나중에 다시 만들 수 있다. 정규화본은 원본에서 파생될 뿐이다.
 *   3. **실패해도 다음 데이터셋으로 간다.** 하나가 죽었다고 그날 수집이 통째로
 *      빠지면 안 된다. 결과는 매니페스트에 남긴다.
 *
 * 사용법
 *   DATA_GO_KR_KEY=... node scripts/collect.mjs
 *   DATA_GO_KR_KEY=... node scripts/collect.mjs --only=nitemtrade --dry
 *
 * 환경변수
 *   DATA_GO_KR_KEY   공공데이터포털 인증키(Decoding 키). 필수
 *   ARCHIVE_DIR      저장 위치. 기본 ./archive
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { put, storeStatus, remoteEnabled } from '../src/lib/store.mjs';

const KEY = process.env.DATA_GO_KR_KEY ?? '';
const ARCHIVE = path.resolve(process.env.ARCHIVE_DIR ?? 'archive');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const ONLY = argv.find((a) => a.startsWith('--only='))?.slice(7);

/* ────────────────────────────────────────────────────────────────
   데이터셋 등록부

   endpoint 가 null 인 것은 공공데이터포털 상세 페이지에 호출 URL 이
   노출돼 있지 않아 **아직 확인하지 못한 것**이다. 추측해서 넣지 않는다.
   활용신청 후 Swagger 에서 확인해 채운다. (docs/데이터-출처-라이선스.md 참조)
   ──────────────────────────────────────────────────────────────── */
export const DATASETS = [
  {
    id: 'nitemtrade',
    label: '품목별 국가별 수출입실적 (HS코드 × 국가)',
    dataGoKrId: '15100475',
    licence: '제한 없음',
    endpoint: 'https://apis.data.go.kr/1220000/nitemtrade/getNitemtradeList',
    /** 조회 기간은 1년 이내로 제한된다. 전월 한 달치를 매일 받아 개정을 추적한다. */
    params: () => {
      const ym = prevMonth();
      return { strtYymm: ym, endYymm: ym, cntyCd: 'US' };
    },
    note: '국가코드는 별도 참조표가 필요하다. 우선 주요 교역국부터 넓힌다.',
  },
  {
    id: 'import-flash-item',
    label: '수입 주요품목별 10일 단위 잠정치',
    dataGoKrId: '15157901',
    licence: '제한 없음',
    endpoint: null, // ← 활용신청 후 Swagger 에서 확인
    params: () => ({}),
    note: '1~10일은 11일, 1~20일은 21일, 1~말일은 익월 1일 제공. ⭐ 최우선 수집 대상',
  },
  {
    id: 'export-flash-item',
    label: '수출 주요품목별 10일 단위 잠정치',
    dataGoKrId: null, // 목록에 존재는 확인. 상세 ID 미확인
    licence: '제한 없음(추정 — 확인 필요)',
    endpoint: null,
    params: () => ({}),
    note: '⭐ 최우선. 한국 수출은 글로벌 무역 선행지표다',
  },
  {
    id: 'export-flash-country',
    label: '수출 주요국가별 10일 단위 잠정치',
    dataGoKrId: null,
    licence: '제한 없음(추정 — 확인 필요)',
    endpoint: null,
    params: () => ({}),
  },
  {
    id: 'itemtrade',
    label: '품목별 수출입실적 (HS 2·4·6·10단위)',
    dataGoKrId: '15101609',
    licence: '제한 없음',
    endpoint: null,
    params: () => ({}),
  },
  {
    id: 'cntytrade',
    label: '국가별 수출입실적',
    dataGoKrId: '15101612',
    licence: '제한 없음',
    endpoint: null,
    params: () => ({}),
  },
  {
    id: 'trade-general',
    label: '수출입총괄',
    dataGoKrId: '15102108',
    licence: '제한 없음',
    endpoint: null,
    params: () => ({}),
  },
];

/* ── 유틸 ──────────────────────────────────────────────────────── */

/**
 * 한국 시각(KST, UTC+9) 기준 날짜 부품.
 *
 * UTC 를 쓰면 안 된다. 관세청 발표는 **한국 시각 1·11·21일 09:00** 이고,
 * 그 시각은 UTC 로는 아직 전날이다. UTC 로 계산하면 발표 당일을 하루 전으로
 * 착각해 그 회차를 통째로 놓친다. (실제로 --dry 에서 202607 이어야 할 것이
 * 202606 으로 나왔다.)
 */
function kstParts(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate() };
}

/** 전월을 YYYYMM 으로. 관세청 확정치는 전월 기준이다. */
function prevMonth(now = new Date()) {
  const { y, m } = kstParts(now);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  return `${py}${String(pm).padStart(2, '0')}`;
}

/** 수집 시각. 파일명에 들어가므로 초 단위까지. */
function stamp(d = new Date()) {
  return d.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/** 파라미터를 파일명에 쓸 수 있게. 값이 없으면 'default'. */
function slug(params) {
  const s = Object.entries(params)
    .map(([k, v]) => `${k}-${v}`)
    .join('_')
    .replace(/[^\w.-]/g, '');
  return s || 'default';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 재시도. 공공 API 는 순간적으로 죽는 일이 잦아 한 번 실패로 포기하면 손해다.
 * 다만 인증 오류(키가 틀림)는 재시도해도 소용없으므로 즉시 던진다.
 */
async function fetchWithRetry(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { accept: 'application/xml, application/json;q=0.9' },
        signal: AbortSignal.timeout(30_000),
      });
      const body = await res.text();
      if (res.status === 401 || res.status === 403) {
        throw new Error(`인증 실패 (HTTP ${res.status}) — 인증키를 확인하십시오`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { body, contentType: res.headers.get('content-type') ?? '' };
    } catch (e) {
      last = e;
      if (String(e.message).includes('인증 실패')) throw e;
      if (i < tries - 1) await sleep(2000 * (i + 1));
    }
  }
  throw last;
}

/**
 * 공공데이터포털은 오류를 HTTP 200 + 본문으로 돌려준다.
 * 본문을 안 보면 「성공했는데 빈 파일」이 조용히 쌓인다. 그게 제일 나쁘다.
 */
function looksLikeError(body) {
  const m = body.match(/<returnAuthMsg>([^<]*)<|<errMsg>([^<]*)<|<resultMsg>([^<]*)</);
  if (m) {
    const msg = (m[1] || m[2] || m[3] || '').trim();
    if (msg && !/^(NORMAL|정상|OK|SUCCESS)/i.test(msg)) return msg;
  }
  if (/SERVICE[_ ]?KEY[_ ]?IS[_ ]?NOT[_ ]?REGISTERED/i.test(body))
    return '등록되지 않은 인증키';
  if (/LIMITED[_ ]NUMBER[_ ]OF[_ ]SERVICE/i.test(body)) return '일일 호출 한도 초과';
  return null;
}

/* ── 수집 ──────────────────────────────────────────────────────── */

async function collectOne(ds, runStamp) {
  const base = { id: ds.id, label: ds.label, at: new Date().toISOString() };

  if (!ds.endpoint) {
    return { ...base, status: 'skipped', reason: '엔드포인트 미확인 (활용신청 후 Swagger 확인)' };
  }

  const params = ds.params();
  const url = new URL(ds.endpoint);
  // serviceKey 는 이미 인코딩된 문자열을 다시 인코딩하면 깨진다.
  // URLSearchParams 를 쓰지 않고 직접 붙이는 이유다.
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const full = `${url.toString()}&serviceKey=${KEY}`;

  if (DRY) {
    // KEY 가 빈 문자열이면 replace('') 가 맨 앞에 끼어들어 URL 이 망가진다.
    return { ...base, status: 'dry', url: KEY ? full.replaceAll(KEY, '***') : full, params };
  }

  try {
    const { body, contentType } = await fetchWithRetry(full);
    const err = looksLikeError(body);
    if (err) return { ...base, status: 'error', reason: err, bytes: body.length };

    const ext = contentType.includes('json') ? 'json' : 'xml';
    // 키를 슬래시로 짓는다. 로컬에서는 디렉터리가 되고 오브젝트 스토리지에서는
    // 그대로 키가 된다 — 같은 경로 규칙을 양쪽이 공유해야 나중에 대조가 된다.
    const key = `raw/${ds.id}/${runStamp.slice(0, 10)}/${slug(params)}__${runStamp}.${ext}`;

    // 원칙 1 — 덮어쓰지 않는다.
    if (existsSync(path.join(ARCHIVE, key))) {
      return { ...base, status: 'exists', file: key };
    }

    const saved = await put(key, body, ext === 'json' ? 'application/json' : 'application/xml');

    return {
      ...base,
      status: 'ok',
      file: key,
      bytes: body.length,
      params,
      // 원격 저장 실패는 수집 자체를 실패로 만들지 않는다. 디스크에는 남아 있고,
      // 나중에 다시 올릴 수 있다. 다만 **조용히 넘어가지 않는다** — 매니페스트에 남긴다.
      ...(saved.remote ? { remote: true } : {}),
      ...(saved.remoteError ? { remoteError: saved.remoteError } : {}),
    };
  } catch (e) {
    return { ...base, status: 'error', reason: e.message };
  }
}

async function main() {
  const runStamp = stamp();

  if (!KEY && !DRY) {
    console.error(
      [
        '',
        '  DATA_GO_KR_KEY 가 없습니다.',
        '',
        '  공공데이터포털(data.go.kr) 로그인 → 아래 데이터셋에서 「활용신청」 →',
        '  마이페이지 > 오픈API > 인증키에서 **일반 인증키(Decoding)** 를 복사하십시오.',
        '',
        ...DATASETS.filter((d) => d.dataGoKrId).map(
          (d) => `    https://www.data.go.kr/data/${d.dataGoKrId}/openapi.do   ${d.label}`,
        ),
        '',
        '  그다음:  $env:DATA_GO_KR_KEY="키"; npm run collect',
        '',
      ].join('\n'),
    );
    process.exit(1);
  }

  const targets = ONLY ? DATASETS.filter((d) => d.id === ONLY) : DATASETS;
  if (!targets.length) {
    console.error(`--only=${ONLY} 에 해당하는 데이터셋이 없습니다.`);
    process.exit(1);
  }

  const results = [];
  for (const ds of targets) {
    const r = await collectOne(ds, runStamp);
    results.push(r);
    const mark =
      { ok: '✓', exists: '=', skipped: '·', dry: '?', error: '✗' }[r.status] ?? '?';
    const tail =
      r.status === 'ok'
        ? `${r.bytes.toLocaleString()}B  ${r.file}`
        : // --dry 는 「무엇을 부를 것인가」를 보려고 돌리는 것이므로 URL 을 보여준다
          (r.reason ?? r.file ?? r.url ?? '');
    console.log(`  ${mark} ${ds.label.padEnd(34)} ${tail}`);
    await sleep(400); // 예의. 공공 API 를 몰아치지 않는다
  }

  if (!DRY) {
    await put(
      `manifest/${runStamp}.json`,
      JSON.stringify({ runStamp, store: storeStatus(), results }, null, 2),
      'application/json',
    );
  }

  const ok = results.filter((r) => r.status === 'ok').length;
  const bad = results.filter((r) => r.status === 'error').length;
  const skip = results.filter((r) => r.status === 'skipped').length;
  const remoteBad = results.filter((r) => r.remoteError).length;
  console.log(`\n  수집 ${ok} · 실패 ${bad} · 미확인 ${skip} · 대상 ${results.length}`);

  // ⚠ 아카이브가 이 사업의 해자다. 원격 저장이 꺼져 있으면 재배포 한 번에 사라진다.
  //   조용히 넘어가면 몇 달 뒤에야 알게 되고, 그때는 이미 늦다.
  if (!DRY && !remoteEnabled) {
    console.log(
      '\n  ⚠ 원격 저장이 꺼져 있습니다. 로컬 디스크에만 남습니다.\n' +
        '     Cloudtype 컨테이너에는 영구 디스크가 없어 재배포하면 사라집니다.\n' +
        '     ARCHIVE_S3_ENDPOINT / _BUCKET / _KEY_ID / _SECRET 을 설정하십시오.',
    );
  }
  if (remoteBad) {
    console.log(`  ⚠ 원격 저장 실패 ${remoteBad}건 — 매니페스트의 remoteError 를 보십시오.`);
  }

  // 하나라도 성공했으면 성공으로 본다. 스케줄러가 매일 죽는 것을 막는다.
  process.exit(bad > 0 && ok === 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
