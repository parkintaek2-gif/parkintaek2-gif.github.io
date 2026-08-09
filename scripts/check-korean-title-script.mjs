#!/usr/bin/env node
/**
 * **한국 작품 명단에 라틴이 아닌 제목이 섞였나.**
 *
 * ── 왜 이 자가 생겼나 ─────────────────────────────────────────
 * 🔴 2026-08-09 08:4x — 작품 지면을 만들다가, 주소가 빈 제목 22개가 나왔다.
 *   **아랍어·히브리어·우크라이나어·일본어** 제목이 「한국 작품」으로 세어지고 있었다.
 *   212 자리를 잘못 세고 있었다(전체 한국 자리 37,962 중 0.56%).
 *
 * ── 왜 그것이 한국 작품이 아닌가 — 재서 확인했다 ─────────────
 * ⛔ 「아시아에서 안 떴다」는 근거가 못 된다 — 진짜 한국 작품 141편(15.4%)도 그렇다.
 * ⭐ 진짜 근거는 **넷플릭스가 이 자료에서 제목을 현지어로 안 옮긴다**는 것이다.
 *      Squid Game 은 아랍 10개국에서 라틴 제목 그대로 445자리를 잡았다
 *      이집트 차트의 서로 다른 제목 1,530개 중 아랍 문자는 10개(0.7%)
 *      이스라엘 1,825개 중 히브리 문자는 4개(0.2%)
 *    옮긴다면 저 몫이 100% 가까워야 한다.
 *
 * ⛔ 이 자는 **고친 것이 다시 새는지**를 본다. 원자료(위키데이터 이름표)는 앞으로도
 *   언어를 안 가리고 올 수 있다. 거르는 쪽이 살아 있는지 여기서 잰다.
 *
 * 쓰는 법: node scripts/check-korean-title-script.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter, 비라틴글자 } from './lib/korean-netflix-titles.mjs';

const 나라판 = 'archive/raw/netflix-top10/countries.ndjson';

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('아랍 문자를 잡는다', 비라틴글자('أصحاب ...ولا أعزّ'));
  자가('히브리 문자를 잡는다', 비라틴글자('נדל״ן-סיפור אהבה'));
  자가('키릴 문자를 잡는다', 비라틴글자('Потяг до Різдва'));
  자가('일본 문자를 잡는다', 비라틴글자('ボイリング・ポイント／沸騰'));
  자가('한글도 잡는다', 비라틴글자('오징어 게임'));
  /* ⛔ 악센트 붙은 라틴을 잡으면 진짜 한국 작품을 잃는다 — Café Minamdang 이 그렇다 */
  자가('악센트 라틴은 안 잡는다', !비라틴글자('Café Minamdang'));
  자가('보통 라틴은 안 잡는다', !비라틴글자('Squid Game'));
  자가('대문자만 있는 것도 안 잡는다', !비라틴글자('LAND'));
  console.log(`한국 제목 문자 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const ko = koreanTitleFilter();
  const 샌것 = new Map();
  let 한국자리 = 0;
  const rl = readline.createInterface({ input: fs.createReadStream(나라판), crlfDelay: Infinity });
  for await (const 줄 of rl) {
    if (!줄.trim()) continue;
    let r;
    try { r = JSON.parse(줄); } catch { continue; }
    if (r.iso2 === 'RU') continue;
    if (!ko.keepTitle(r.제목)) continue;
    한국자리 += 1;
    if (비라틴글자(r.제목)) 샌것.set(r.제목, (샌것.get(r.제목) || 0) + 1);
  }

  const 자리 = [...샌것.values()].reduce((s, x) => s + x, 0);
  console.log(`한국이라 센 자리 ${한국자리.toLocaleString('en-US')} · 그중 라틴이 아닌 제목 ${샌것.size}편 ${자리}자리`);
  if (!샌것.size) {
    console.log('✅ 라틴이 아닌 제목이 한국 작품으로 세어지지 않는다');
    process.exit(0);
  }
  console.log('\n⛔ 다시 새고 있다 — scripts/lib/korean-netflix-titles.mjs 의 거르는 쪽을 본다');
  for (const [t, c] of [...샌것].sort((a, b) => b[1] - a[1])) console.log(`   · ${String(c).padStart(3)}자리  ${t}`);
  process.exit(1);
}
