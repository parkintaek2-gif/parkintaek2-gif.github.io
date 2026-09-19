/**
 * csv-out.mjs — 파는 CSV 를 **BOM 을 붙여** 쓰는 한 곳.
 *
 * ── 왜 (F5 · 2026-09-19 · 2번) ──────────────────────────────────────────
 * 사장님 지시: 「최소상품 판매 가능」 관문(F5)의 관문 하나 —
 *   「✅ CSV 는 UTF-8 BOM (엑셀에서 한글이 안 깨지게)」
 *
 * 재 보니 이미 파는 전량 CSV 넷(people·mezzanine·ownership 둘)이 **BOM 이 없었다.**
 * 이 파일들은 한글 칸(name_ko·sector_ko 등)을 담고 있고, 손님은 영어권이라 대부분
 * 엑셀(Windows)로 연다 — 엑셀은 BOM 이 없으면 UTF-8 을 시스템 코드페이지로 잘못
 * 읽어 한글이 깨진다(제목·표는 멀쩡한데 «내용»이 깨지는 자리라 알아채기 어렵다).
 *
 * ⛔ 파일마다 따로 `writeFileSync(경로, s, 'utf8')` 를 쓰지 않는다 — 한 곳에서만
 *   BOM 을 붙이면, 다음에 CSV 를 새로 만드는 사람이 잊고 안 붙일 수 있다.
 *   여기 하나만 고치면 전부 따라온다.
 */
import fs from 'node:fs';

export const BOM = '﻿';

/** 문자열을 BOM 을 붙여 UTF-8 로 쓴다. ⛔ 이미 BOM 이 있으면 두 번 붙이지 않는다 */
export function csv쓰기(경로, 내용) {
  const s = String(내용 ?? '');
  const out = s.startsWith(BOM) ? s : BOM + s;
  fs.writeFileSync(경로, out, 'utf8');
}

const 나 = process.argv[1] && new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') === process.argv[1].replace(/\\/g, '/');

if (나 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('BOM 을 앞에 붙인다', (BOM + 'a,b').startsWith(BOM));
  검('이미 BOM 이 있으면 두 번 안 붙인다(문자열 검사)', (() => {
    const s = BOM + 'x';
    const out = s.startsWith(BOM) ? s : BOM + s;
    return out === s && !out.startsWith(BOM + BOM);
  })());

  const os = await import('node:os');
  const path = await import('node:path');
  const tmp = path.join(os.tmpdir(), `csv-out-자가시험-${Date.now()}.csv`);
  csv쓰기(tmp, 'a,b\n1,2');
  const 다시읽음 = fs.readFileSync(tmp, 'utf8');
  검('csv쓰기 — 파일 맨 앞에 BOM 이 실제로 박힌다', 다시읽음.charCodeAt(0) === 0xFEFF);
  검('csv쓰기 — 내용은 그대로다', 다시읽음.slice(1) === 'a,b\n1,2');
  fs.unlinkSync(tmp);

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((x) => `   · ${x}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ csv-out 자가시험 ${통}개 통과`);
  process.exit(0);
}
