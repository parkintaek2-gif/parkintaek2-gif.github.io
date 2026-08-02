#!/usr/bin/env node
/**
 * collect-dart.mjs — 금감원 전자공시(DART) 수집기.
 * ─────────────────────────────────────────────────────────────────────────
 * [왜 이게 급한가]
 * **공시는 이 사이트의 유일한 당일 발행 경로다.**
 * 시세는 공공데이터포털을 거쳐 T+1 로 오지만, DART 는 금감원이 직접 열어 둔 API 라
 * **접수되는 즉시** 나온다. `docs/데이터-출처-라이선스.md` 의 「가격은 T+1, 공시는 즉시」가
 * 이것이다.
 *
 * 그리고 **소급이 안 된다.** 공시 목록은 조회되지만, 우리가 「그때 무엇이 언제 올라왔나」를
 * 남기지 않으면 나중에 못 만든다. 리서치 아카이브를 오늘 채운 것과 같은 이유다.
 *
 * [2026-08-02 KST] 공공데이터포털이 「전환 작업」으로 회원가입을 막아 놓은 상태라
 * 포털 경유 데이터가 전부 대기 중이다. **DART 직접 경로가 지금 유일하게 열린 문이다.**
 *
 * ── 원칙 (collect.mjs 와 같다) ──────────────────────────────────
 * 1. **덮어쓰지 않는다.** 접수번호가 곧 파일명이라 같은 공시를 두 번 받지 않는다
 * 2. **원본을 그대로 저장한다.** 파싱 실패나 스키마 변경이 있어도 다시 만들 수 있다
 * 3. **실패해도 다음으로 간다.** 하나가 죽었다고 그날 수집이 통째로 빠지면 안 된다
 *
 * ⚠ **공시 원문(PDF·XBRL 본문)은 받지 않는다.** 목록과 메타데이터만 받는다.
 *   본문 전재는 하지 않는다는 원칙이 리포트와 같다. 필요하면 원문 링크를 건다.
 *
 * 사용
 *   DART_API_KEY=... node scripts/collect-dart.mjs              오늘치
 *   DART_API_KEY=... node scripts/collect-dart.mjs --days=7     최근 7일
 *   DART_API_KEY=... node scripts/collect-dart.mjs --corpcode   고유번호 전체 갱신
 *   DART_API_KEY=... node scripts/collect-dart.mjs --dry        받지 않고 확인만
 *
 * 환경변수
 *   DART_API_KEY   opendart.fss.or.kr 인증키. 필수
 *   ARCHIVE_DIR    저장 위치. 기본 ./archive
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { put, storeStatus, remoteEnabled } from '../src/lib/store.mjs';

const KEY = process.env.DART_API_KEY ?? '';
const ARCHIVE = path.resolve(process.env.ARCHIVE_DIR ?? 'archive');
const BASE = 'https://opendart.fss.or.kr/api';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const CORPCODE = argv.includes('--corpcode');
const DAYS = Number(argv.find((a) => a.startsWith('--days='))?.slice(7)) || 1;

/** 예의. DART 는 분당 호출 제한이 있다(공식 문서 확인 필요). 넉넉히 둔다. */
const GAP = 400;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
const dash = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

/**
 * DART 응답의 status 코드.
 * ⚠ **HTTP 200 이어도 status 가 000 이 아니면 실패다.** 이걸 안 보면 빈 결과를
 *   성공으로 착각한다 — Cloudtype 라우트에서 겪은 「조용한 실패」와 같은 유형이다.
 */
const STATUS = {
  '000': '정상',
  '010': '등록되지 않은 키',
  '011': '사용할 수 없는 키(오픈API에 등록되지 않았거나 일시적 사용중지)',
  '012': '접근할 수 없는 IP',
  '013': '조회된 데이터가 없음',
  '020': '요청 제한 초과',
  '021': '조회 가능한 회사 개수 초과',
  '100': '필드의 부적절한 값',
  '101': '부적절한 접근',
  '800': '시스템 점검',
  '900': '정의되지 않은 오류',
  '901': '사용자 계정의 개인정보보유기간 만료',
};

async function api(endpoint, params) {
  const url = new URL(`${BASE}/${endpoint}`);
  url.searchParams.set('crtfc_key', KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();

  // 013(데이터 없음)은 오류가 아니다. 그날 공시가 없을 수 있다.
  if (j.status !== '000' && j.status !== '013') {
    throw new Error(`DART ${j.status} — ${STATUS[j.status] ?? j.message ?? '알 수 없음'}`);
  }
  return j;
}

/**
 * 고유번호 전체(corpCode) — **리서치 아카이브와 잇는 열쇠다.**
 *
 * 우리 리서치 아카이브는 종목코드 6자리(005930)를 쓰고 DART 는 고유번호 8자리를 쓴다.
 * 이 표가 있어야 「이 회사의 목표주가」와 「이 회사의 공시」가 한 줄에 놓인다.
 * **없으면 두 데이터가 영영 따로 논다.**
 *
 * zip(xml) 로 오므로 파일로 받아 두고, 파싱은 별도로 한다.
 */
async function corpCode() {
  const url = new URL(`${BASE}/corpCode.xml`);
  url.searchParams.set('crtfc_key', KEY);
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  // 오류일 때는 zip 이 아니라 JSON 이 온다. 앞 몇 바이트로 가른다.
  if (buf.length < 1000 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
    let msg = buf.toString('utf8').slice(0, 300);
    try {
      const j = JSON.parse(msg);
      msg = `DART ${j.status} — ${STATUS[j.status] ?? j.message}`;
    } catch {}
    throw new Error(`corpCode 가 zip 이 아니다: ${msg}`);
  }

  const key = `raw/dart-corpcode/${stamp()}.zip`;
  await put(key, buf, 'application/zip');
  console.log(`  고유번호 전체 저장 — ${(buf.length / 1024 / 1024).toFixed(1)}MB → ${key}`);
  console.log('  ⚠ 압축 파일이다. 파싱은 별도 단계에서 한다(종목코드 ↔ 고유번호 매핑).');
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

/**
 * 공시 목록 — 하루치.
 *
 * page_count 최대 100. 페이지를 끝까지 넘긴다.
 * **접수번호(rcept_no)가 파일명이라 같은 공시를 두 번 저장하지 않는다.**
 */
async function listDay(de) {
  let page = 1;
  let total = 0;
  let saved = 0;
  let skipped = 0;

  for (;;) {
    const j = await api('list.json', {
      bgn_de: de,
      end_de: de,
      page_no: page,
      page_count: 100,
    });

    if (j.status === '013' || !j.list?.length) break;
    total = Number(j.total_count ?? 0);

    for (const r of j.list) {
      const key = `raw/dart/${dash(r.rcept_dt)}/${r.rcept_no}.json`;
      if (existsSync(path.join(ARCHIVE, key))) {
        skipped++;
        continue;
      }
      if (DRY) {
        saved++;
        continue;
      }
      // ⚠ 원문은 받지 않는다. 목록 레코드 + 원문 링크만 남긴다.
      await put(
        key,
        JSON.stringify(
          {
            ...r,
            /** 원문은 저장하지 않는다. 필요하면 이 주소로 간다. */
            docUrl: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${r.rcept_no}`,
            collectedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
        'application/json',
      );
      saved++;
    }

    if (page * 100 >= total) break;
    page++;
    await sleep(GAP);
  }
  return { total, saved, skipped };
}

async function main() {
  if (!KEY) {
    console.error('❌ DART_API_KEY 가 없습니다.');
    console.error('   opendart.fss.or.kr → 로그인 → 인증키 신청/관리 에서 발급받아');
    console.error('   .env 에 DART_API_KEY=... 로 넣으십시오. (.env 는 .gitignore 에 있습니다)');
    process.exit(1);
  }

  mkdirSync(path.join(ARCHIVE, 'raw/dart'), { recursive: true });

  if (CORPCODE) {
    await corpCode();
    return;
  }

  const runStamp = stamp();
  let sumSaved = 0;
  let sumSkip = 0;
  const days = [];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(ymd(d));
  }
  days.reverse();

  console.log(`  ${days[0]} ~ ${days.at(-1)} · ${DAYS}일치${DRY ? ' (--dry)' : ''}`);

  for (const de of days) {
    try {
      const { total, saved, skipped } = await listDay(de);
      sumSaved += saved;
      sumSkip += skipped;
      console.log(`  ${dash(de)}  공시 ${total.toLocaleString()}건 · 새로 ${saved} · 이미 ${skipped}`);
    } catch (e) {
      // 실패해도 다음 날로 간다. 하나가 죽었다고 통째로 빠지면 안 된다.
      console.log(`  ${dash(de)}  실패: ${e.message}`);
    }
    await sleep(GAP);
  }

  if (!DRY) {
    await put(
      `manifest/dart/${runStamp}.json`,
      JSON.stringify({ runStamp, days, saved: sumSaved, skipped: sumSkip, store: storeStatus() }, null, 2),
      'application/json',
    );
  }

  console.log(`\n  새로 ${sumSaved.toLocaleString()}건 · 이미 있던 것 ${sumSkip.toLocaleString()}건`);
  if (!remoteEnabled) console.log('  ⚠ 원격 저장이 꺼져 있습니다. 이 PC 에만 있습니다.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
