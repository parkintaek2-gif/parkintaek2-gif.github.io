#!/usr/bin/env node
/**
 * measure-kcw-outreach.mjs — **B2B 아웃리치의 답장을 센다.** (⛔ 보내지는 않는다)
 *
 * ── 왜 (2026-08-23) ───────────────────────────────────────────
 * 2번 물음: 「살 사람이 있다는 신호를 싸게 재는 방법이 있을까요」
 * 제 답: 우리 지면 밖에서 재야 합니다 — `/for-industry` 는 색인에 있고 1페이지인데
 * 28일 노출이 9건이고, 살 사람이 칠 만한 말 열둘 중 아홉이 자동완성 흔적 0줄입니다.
 * **검색 채널로는 B2B 문의가 안 만들어집니다.** 그래서 값을 안 부르고 자료를 주는 메일입니다.
 *
 * ⛔ **이 자는 메일을 보내지 않는다.** 세기만 한다. 보내는 것은 사람 몫이다(2번 지시).
 *   재는 자와 하는 자를 갈라 둔다 — 한 자가 둘 다 하면 자기를 통과시킨다.
 *
 * ── ⛔ 무엇을 세지 «않는가» ──────────────────────────────────
 * ⛔ 「반응이 좋다/나쁘다」를 안 쓴다. 넷만 센다 — 보냄 · 답장 · 값물음 · 재요청.
 * ⛔ **답장 없음을 「거절」로 세지 않는다.** 「아직 없다」다. 둘은 다른 말이다.
 * ⛔ 갈래를 합쳐 하나로 만들지 않는다. 가설이 다른 세 갈래(인용·공공·제작)를 따로 센다 —
 *   합치면 어느 가설이 사는지 영원히 모른다.
 *
 * ── 기록 꼴 (`archive/outreach/보낸것.tsv`) ────────────────────
 * ```
 * 보낸날    갈래    곳                  답장날      값물음  재요청  메모
 * 2026-08-25  인용    The Korea Herald    2026-08-26  아니오  예     기사에 인용하겠다고
 * 2026-08-25  제작    Studio Dragon                                   아직 없음
 * ```
 * ⚠ 손으로 적는 표다. 보내는 분이 한 줄 추가한다. 빈 칸은 **비워 둔다** — 0 을 쓰지 않는다.
 *
 * 쓰는 법
 *   node scripts/measure-kcw-outreach.mjs --자가시험
 *   node scripts/measure-kcw-outreach.mjs            (표를 읽어 센다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 표길 = path.join(뿌리, 'archive/outreach/보낸것.tsv');

export const 갈래들 = ['인용', '공공', '제작'];

/** 「예/아니오」를 참·거짓·모름 셋으로 읽는다. ⛔ 빈 칸을 「아니오」로 읽지 않는다 */
export function 예인가(칸) {
  const s = String(칸 ?? '').trim();
  if (!s) return null;                                  // 못 잰 것
  if (/^(예|yes|y|o|참|true)$/i.test(s)) return true;
  if (/^(아니오|아니요|no|n|x|거짓|false)$/i.test(s)) return false;
  return null;                                          // ⛔ 모르는 말은 짐작하지 않는다
}

/** TSV 한 장을 줄로 읽는다. 주석(#)과 머리글은 건너뛴다 */
export function 표읽기(본문) {
  const 줄들 = String(본문 ?? '').split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
  if (!줄들.length) return [];
  const 머리 = 줄들[0].split('\t').map((x) => x.trim());
  const 몸 = 줄들.slice(1);
  return 몸.map((l) => {
    const 칸 = l.split('\t');
    const r = {};
    머리.forEach((h, i) => { r[h] = (칸[i] ?? '').trim(); });
    return r;
  });
}

/**
 * 센다. ⛔ 답장 없음은 「아직 없다」로 따로 센다 — 거절이 아니다.
 */
export function 세기(줄들) {
  const 빈칸 = () => ({ 보냄: 0, 답장: 0, 아직없음: 0, 값물음: 0, 재요청: 0 });
  const 통 = { 전체: 빈칸() };
  for (const g of 갈래들) 통[g] = 빈칸();

  for (const r of 줄들 ?? []) {
    const g = 갈래들.includes(r.갈래) ? r.갈래 : null;
    const 넣기 = (칸) => {
      통.전체[칸] += 1;
      if (g) 통[g][칸] += 1;
    };
    if (!String(r.보낸날 ?? '').trim()) continue;        // ⛔ 아직 안 보낸 줄은 안 센다
    넣기('보냄');
    if (String(r.답장날 ?? '').trim()) 넣기('답장');
    else 넣기('아직없음');
    if (예인가(r.값물음) === true) 넣기('값물음');
    if (예인가(r.재요청) === true) 넣기('재요청');
  }
  return 통;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('예를 읽는다', 예인가('예') === true && 예인가('yes') === true);
  검('아니오를 읽는다', 예인가('아니오') === false && 예인가('no') === false);
  검('⛔ 빈 칸은 «모름» — 아니오가 아니다', 예인가('') === null && 예인가(undefined) === null);
  검('⛔ 모르는 말도 «모름»', 예인가('글쎄') === null);

  const 본문 = [
    '# 주석은 건너뛴다',
    '보낸날\t갈래\t곳\t답장날\t값물음\t재요청\t메모',
    '2026-08-25\t인용\tThe Korea Herald\t2026-08-26\t아니오\t예\t인용하겠다고',
    '2026-08-25\t제작\tStudio Dragon\t\t\t\t아직 없음',
    '2026-08-25\t공공\tKOCCA\t2026-08-27\t예\t예\t값을 물었다',
    '\t제작\tSHOWBOX\t\t\t\t아직 안 보냄',
  ].join('\n');

  const 줄 = 표읽기(본문);
  검('네 줄을 읽는다', 줄.length === 4);
  검('머리글로 칸을 짚는다', 줄[0].곳 === 'The Korea Herald');
  검('⛔ 주석을 안 센다', !줄.some((r) => String(r.보낸날).startsWith('#')));

  const t = 세기(줄);
  검('⛔ 안 보낸 줄은 안 센다', t.전체.보냄 === 3);
  검('답장을 센다', t.전체.답장 === 2);
  검('⛔ 답장 없음을 «아직 없다»로 센다 — 거절이 아니다', t.전체.아직없음 === 1);
  검('값물음을 센다', t.전체.값물음 === 1);
  검('재요청을 센다', t.전체.재요청 === 2);
  검('갈래마다 따로 센다', t.인용.답장 === 1 && t.제작.답장 === 0 && t.공공.값물음 === 1);
  검('⛔ 빈 표도 안 터진다', 세기([]).전체.보냄 === 0 && 표읽기('').length === 0);
  검('⛔ 빈 표에서 갈래도 0', 세기(undefined).인용.보냄 === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 실패\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ measure-kcw-outreach 자가시험 통과 (15)');
  process.exit(0);
}

if (!fs.existsSync(표길)) {
  console.log(`⬜ **아직 못 쟀다** — 기록이 없다: ${path.relative(뿌리, 표길)}`);
  console.log('   ⛔ 이것은 「수요가 없다」가 아니다. 아직 한 통도 안 보냈다는 뜻이다.');
  console.log('   보내는 것은 사람 몫이다(2번 지시 2026-08-23). 문안은 docs/5번-B2B아웃리치-문안과열곳.md 에 있다.');
  process.exit(0);
}

const 줄들 = 표읽기(fs.readFileSync(표길, 'utf8'));
const 통 = 세기(줄들);

console.log(`# B2B 아웃리치 — ${path.relative(뿌리, 표길)}`);
console.log(`  줄 ${줄들.length}개\n`);
console.log('갈래      보냄   답장  아직없음  값물음  재요청');
for (const g of [...갈래들, '전체']) {
  const t = 통[g];
  console.log(`${g.padEnd(8)} ${String(t.보냄).padStart(5)} ${String(t.답장).padStart(6)} `
    + `${String(t.아직없음).padStart(9)} ${String(t.값물음).padStart(7)} ${String(t.재요청).padStart(7)}`);
}
console.log('\n⛔ 답장 없음은 «거절»이 아니라 «아직 없다»다.');
console.log('⛔ 갈래를 합쳐 읽지 않는다 — 가설이 다르다(인용은 값을 안 내고 이름을 실어 준다).');
if (통.전체.보냄 < 10) {
  console.log(`⚠ 아직 ${통.전체.보냄}통이다. 열 통이 안 되면 어느 갈래가 사는지 말하지 않는다.`);
}
