#!/usr/bin/env node
/**
 * KDI 발간물 수집기.
 *
 *   npm run collect:kdi                  **승인된 구분 전부**
 *   npm run collect:kdi -- --cd=A,C,D    구분을 지정
 *   npm run collect:kdi -- --dry         저장하지 않고 표본만 본다
 *
 * ── 키가 없으면 어떻게 되나 ────────────────────────────────────
 * **실패로 처리하지 않는다.** 승인 전까지 키가 없는 것이 정상이다.
 * 「키가 아직 없다」고 말하고 정상 종료한다 — 그래야 매일 도는 작업에 걸어 둘 수 있고,
 * 키가 들어온 날부터 저절로 돌기 시작한다.
 *
 * 승인 신청: 2026-08-03 20:05 KST 「등록 되었습니다」 확인
 * 신청 범위: 활용목적 「웹사이트 활용」
 *
 * ⚠ **처음엔 A 만 승인돼 기본값을 'A' 로 박아 뒀다.** 2026-08-05 에 확인하니
 *   **여섯 구분이 전부 열려 있었다**(A 838 · B 96 · C 17 · D 60 · E 20 · F 180).
 *   그런데 기본값이 'A' 라 **승인된 1,211건 중 838건만 받고 있었다.**
 *   승인 상태를 코드에 박아 두면, 승인이 늘어도 **모르고 지나간다.**
 *   그래서 기본값을 **전 구분**으로 바꾼다 — 안 열린 구분은 어차피 조용히 0 이다.
 *
 * ⚠ KDI 발간물 목록(데이터셋 15091316)은 **공공누리 제1유형** 이다 —
 *   출처표시하면 상업적 이용·가공이 된다. 다만 **경제동향 본문(3083751)은 제3유형
 *   (변경금지)** 이라 못 쓴다. 우리는 가공해서 파는 회사다. 서지정보만 받는다.
 *
 * ⚠ 신청서에 적어 낸 약속을 지킨다 — PDF·본문 전문은 받지 않는다.
 *   `src/lib/kdi.mjs` 가 서지정보만 뽑고 나머지는 애초에 응답에 없다.
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { put, storeStatus } from '../src/lib/store.mjs';
import { fetchKdi, kdiReady, KDI_CODES } from '../src/lib/kdi.mjs';

const ARCHIVE = path.resolve(process.env.ARCHIVE_DIR ?? 'archive');
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const CDS = (argv.find((a) => a.startsWith('--cd='))?.slice(5) ?? Object.keys(KDI_CODES).join(','))
  .split(',')
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

async function main() {
  if (!CDS.some((c) => kdiReady(c))) {
    console.log('KDI 인증키가 아직 없다 (KDI_API_KEY).');
    console.log('  신청은 2026-08-03 20:05 KST 에 접수됐다. 승인 메일에 키가 온다.');
    console.log('  키가 오면 .env 와 Cloudtype 환경변수에 넣으면 이 스크립트가 저절로 돈다.');
    return; // ⚠ 실패가 아니다. 종료코드 0
  }

  const 잘못 = CDS.filter((c) => !KDI_CODES[c]);
  if (잘못.length) {
    console.error(`모르는 구분: ${잘못.join(', ')} — 아는 것: ${Object.keys(KDI_CODES).join(', ')}`);
    process.exit(1);
  }

  console.log(`KDI 수집 — ${CDS.join(', ')}${DRY ? ' · DRY' : ''}`);
  const 실행 = stamp();
  let 전체 = 0;
  let 영문있음 = 0;

  for (const cd of CDS) {
    let r;
    try {
      r = await fetchKdi(cd);
    } catch (e) {
      console.log(`  ${cd} ${KDI_CODES[cd].ko} — 실패: ${e.message}`);
      continue;
    }
    const 영문 = r.items.filter((x) => x.titleEn).length;
    const 영문요약 = r.items.filter((x) => x.summaryEn).length;
    console.log(
      `  ${cd} ${KDI_CODES[cd].ko.padEnd(14)} ${String(r.items.length).padStart(5)}건` +
        ` · 영문제목 ${영문} · 영문요약 ${영문요약}`,
    );

    if (!DRY) {
      for (const it of r.items) {
        /* 키는 원문 링크의 해시로 잡는다. 재실행이 덮어쓰기가 되어 중복이 안 쌓인다.
           (제목은 개정되면 바뀌고, 발행일은 같은 날 여러 건이라 유일하지 않다) */
        const id = createHash('sha256').update(String(it.url ?? it.titleKo ?? '')).digest('hex').slice(0, 16);
        const 날 = it.date ?? '날짜없음';
        await put(`raw/kdi/${날}/${cd}-${id}.json`, JSON.stringify(it, null, 2), 'application/json');
      }
    }
    전체 += r.items.length;
    영문있음 += 영문;
  }

  if (DRY) {
    console.log('\nDRY — 저장하지 않는다.');
    return;
  }

  await put(
    `manifest/kdi/${실행}.json`,
    JSON.stringify({ 실행, 구분: CDS, 건수: 전체, 영문제목: 영문있음, store: storeStatus() }, null, 2),
    'application/json',
  );
  console.log(`\n저장 ${전체}건 → ${ARCHIVE}/raw/kdi/`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
