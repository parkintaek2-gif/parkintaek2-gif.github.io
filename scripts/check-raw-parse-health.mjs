#!/usr/bin/env node
/**
 * **원자료에서 조용히 건너뛰는 줄이 몇이나 되나.**
 *
 * ── 왜 이 자가 생겼나 ─────────────────────────────────────────
 * 🔴 2026-08-09 12:35 에 8번이 적었다 — *「실패를 삼키는 catch 는 「거짓 안심」이 아니라
 *   **「거짓 진단」**을 만든다. 남이 몇 시간을 엉뚱한 데서 찾게 한다」*. 맞는 말이라 내 것을 세 봤다.
 *
 * 내 자·수집기 95개에서 **삼키는 catch 29곳**이 나왔다. 세어 보니 거의 다 이 꼴이다 —
 *
 *     let r; try { r = JSON.parse(line); } catch { continue; }
 *
 * ⭐ 이건 **일부러 그런 것**이다. 원자료 한 줄이 깨졌다고 수집기가 멎으면 안 된다.
 * ⛔ 그런데 **조용하다.** 파일이 반쯤 깨져도 수만 조용히 작아지고 아무도 안 운다.
 *   오늘 아침 「빙 색인 0건」이 바로 그 꼴이었다 — 못 잰 것이 0 으로 보였다.
 *
 * ── 그래서 catch 를 지우지 않고, **침묵이 비어 있음을 증명한다** ─
 * 스무 곳을 손대는 대신 여기서 한 번 센다. 지금 0 이면 그 스무 곳의 침묵은 오늘 **무해하다.**
 * 늘어나면 이 자가 운다. ⛔ 「0 이 나왔다」가 아니라 **「0 인 것을 쟀다」**로 만드는 것이 요점이다.
 *
 * 쓰는 법: node scripts/check-raw-parse-health.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

/** 수집기들이 실제로 읽는 원자료. ⛔ 없으면 「깨졌다」가 아니라 「없다」로 적는다 */
const 볼것 = [
  { 길: 'archive/raw/netflix-top10/countries.ndjson', 이름: '나라별 Top10' },
  { 길: 'archive/raw/netflix-top10/global.ndjson', 이름: '글로벌 Top10' },
];

/** 깨진 줄이 이 몫을 넘으면 운다. ⛔ 0.1% 는 「거의 없다」이지 「없다」가 아니다 */
export const 참아줄몫 = 0.1;

/** 빈 줄은 자료가 아니다. 깨진 줄과 갈라 센다 */
export function 줄판정(줄) {
  if (!줄.trim()) return 'empty';
  try { JSON.parse(줄); return 'ok'; } catch { return 'broken'; }
}

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(3);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('성한 줄은 ok', 줄판정('{"a":1}') === 'ok');
  자가('깨진 줄은 broken', 줄판정('{"a":') === 'broken');
  자가('빈 줄은 empty', 줄판정('   ') === 'empty');
  자가('빈 줄을 깨진 것으로 안 센다', 줄판정('') !== 'broken');
  /* 🔴 이 두 줄을 처음엔 자가('이름', 값, 바람) 꼴로 썼다 — 자가() 는 **참거짓**을 받는다.
     그래서 하나는 0.1 이 참이라 **엉뚱하게 통과**하고 있었다. 자가시험도 자가시험이 필요하다 */
  자가('몫', 몫(1, 1000) === 0.1);
  자가('몫 — 밑이 0 이면 null', 몫(0, 0) === null);
  console.log(`원자료 성함 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  let 운다 = 0;
  for (const f of 볼것) {
    if (!fs.existsSync(f.길)) {
      /* ⛔ archive 는 git 이 안 담는다. 다른 창에는 없다 — 「깨졌다」가 아니라 「없다」다 */
      console.log(`⬜ ${f.이름} — 파일이 없다(archive 는 git 이 안 담는다). **못 쟀다**`);
      continue;
    }
    let 성함 = 0; let 깨짐 = 0; let 빔 = 0;
    const 보기 = [];
    const rl = readline.createInterface({ input: fs.createReadStream(f.길), crlfDelay: Infinity });
    let n = 0;
    for await (const 줄 of rl) {
      n += 1;
      const v = 줄판정(줄);
      if (v === 'ok') 성함 += 1;
      else if (v === 'empty') 빔 += 1;
      else { 깨짐 += 1; if (보기.length < 3) 보기.push(`${n}번째: ${줄.slice(0, 60)}`); }
    }
    const pc = 몫(깨짐, 성함 + 깨짐);
    const 나쁨 = pc !== null && pc > 참아줄몫;
    if (나쁨) 운다 += 1;
    console.log(`${나쁨 ? '❌' : '  '} ${f.이름.padEnd(14)} 성한 줄 ${성함.toLocaleString('en-US').padStart(9)}`
      + ` · 깨진 줄 ${String(깨짐).padStart(5)} (${pc === null ? '—' : `${pc}%`})`
      + ` · 빈 줄 ${String(빔).padStart(4)}`);
    for (const b of 보기) console.log(`     ⛔ ${b}`);
  }

  if (운다) {
    console.log(`\n⛔ 깨진 줄이 ${참아줄몫}% 를 넘는 파일이 ${운다}개다.`);
    console.log('   수집기들은 그 줄을 **조용히 건너뛴다** — 수가 조용히 작아진다. 원자료부터 본다.');
    process.exit(1);
  }
  console.log('\n✅ 수집기가 조용히 건너뛰는 줄이 없다 — 스무 곳의 `catch { continue }` 는 오늘 무해하다.');
  console.log('⛔ 「0 이 나왔다」가 아니라 **「0 인 것을 쟀다」**다. 늘면 이 자가 운다.');
  process.exit(0);
}
