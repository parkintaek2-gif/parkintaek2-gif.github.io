#!/usr/bin/env node
/**
 * **대조자가 뱉은 「기사 A · 자료 B」를 기사에 반영한다.** (`--기사 <md> --자 <checker>`)
 *
 * ── 왜 ────────────────────────────────────────────────────────
 *   한국 작품 규칙을 고치니 기사 18편 · 170칸이 어긋났다. 손으로 치면 오타가 난다.
 *   ⛔ 그렇다고 「A 를 B 로」 전역 치환하면 **엉뚱한 줄이 바뀐다**(`24` 는 어디에나 있다).
 *
 * ── ⭐ 어떻게 ────────────────────────────────────────────────
 *   대조자는 `표1 2021 작품 — 기사 169 · 자료 165` 처럼 **표 번호와 줄 이름**까지 준다.
 *   그래서 **그 표의 그 줄 안에서만**, 값이 A 인 칸 하나를 B 로 바꾼다.
 *   ⛔ 그 줄에 A 가 둘 이상이면 **건드리지 않고 남긴다.** 어느 칸인지 모르는 채 고치지 않는다.
 *   ⚠ 천 단위 쉼표를 쓴 칸(`4,091`)도 같은 수로 본다. 쓰던 모양은 그대로 지킨다.
 *
 * ── ⛔ 이 자가 안 하는 것 ────────────────────────────────────
 * ⛔ 본문 문장은 안 건드린다. 표 줄만 본다. 본문은 사람이 읽고 고친다 —
 *    문장은 수가 바뀌면 **말도 바뀌어야** 할 때가 있다(「몰타」가 「크로아티아」가 되는 것처럼).
 * ⛔ 고친 뒤 대조자를 다시 돌려 **0건**이 되는지는 사람이 확인한다. 이 자는 확인까지 하지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** `표1 2021 작품 — 기사 169 · 자료 165` → {표:1, 줄:'2021', 기사:'169', 자료:'165'} */
export function 뜯기(줄) {
  const m = String(줄).match(/표(\d+)\s+(.+?)\s+—\s+기사\s+(-?[\d.]+)\s+·\s+자료\s+(-?[\d.]+)/);
  if (!m) return null;
  const 뒤 = m[2].trim().split(/\s+/);
  return { 표: +m[1], 줄: 뒤.slice(0, -1).join(' ') || 뒤[0], 기사: m[3], 자료: m[4] };
}

/** 마크다운 표를 순서대로 모은다. 각 표는 줄 번호 목록이다. */
export function 표들(글) {
  const 줄들 = 글.split('\n');
  const 표 = []; let 안 = null;
  for (let i = 0; i < 줄들.length; i += 1) {
    const s = 줄들[i].trim();
    if (s.startsWith('|')) { if (!안) { 안 = []; 표.push(안); } 안.push(i); } else 안 = null;
  }
  return 표;
}

/** 칸 하나를 A → B 로. 쉼표 모양을 지킨다. 그 줄에 A 가 하나뿐일 때만 바꾼다. */
export function 칸바꾸기(줄, 기사, 자료) {
  const 칸 = 줄.split('|');
  const 같나 = (c) => c.replace(/[*_\s,%]/g, '') === String(기사).replace(/,/g, '');
  const 맞은 = [];
  for (let i = 0; i < 칸.length; i += 1) if (같나(칸[i])) 맞은.push(i);
  if (맞은.length !== 1) return null;                 /* ⛔ 둘이면 어느 칸인지 모른다 */
  const i = 맞은[0];
  const 쉼표 = /,/.test(칸[i]);
  const 새값 = 쉼표 ? Number(자료).toLocaleString('en-US') : String(자료);
  칸[i] = 칸[i].replace(String(기사).replace(/,/g, '').replace(/(\d)(?=(\d{3})+$)/g, '$1,'), 새값)
    .replace(new RegExp(`\\b${String(기사).replace('.', '\\.')}\\b`), 새값);
  return 칸.join('|');
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('뜯기', 뜯기('   표1 2021 작품 — 기사 169 · 자료 165'),
    { 표: 1, 줄: '2021', 기사: '169', 자료: '165' });
  재본다('뜯기 — 소수', 뜯기('표2 2022 윗10 — 기사 45.4 · 자료 45.7'),
    { 표: 2, 줄: '2022', 기사: '45.4', 자료: '45.7' });
  재본다('뜯기 — 줄 이름이 두 낱말', 뜯기('표1 South Korea 가운데 넓이 — 기사 2 · 자료 3').줄, 'South Korea 가운데');
  재본다('뜯기 — 아니면 null', 뜯기('그냥 글'), null);
  재본다('표들 — 두 표', 표들('| a |\n| b |\n\n글\n\n| c |').length, 2);
  재본다('칸바꾸기', 칸바꾸기('| 2021 | 169 | 4091 |', '169', '165'), '| 2021 | 165 | 4091 |');
  재본다('칸바꾸기 — 쉼표 모양을 지킨다', 칸바꾸기('| 2021 | 4,091 |', '4091', '4072'), '| 2021 | 4,072 |');
  재본다('칸바꾸기 — 굵게도', 칸바꾸기('| x | **70.3** |', '70.3', '70.2'), '| x | **70.2** |');
  재본다('칸바꾸기 — 퍼센트', 칸바꾸기('| x | 45.4% |', '45.4', '45.7'), '| x | 45.7% |');
  /* ⛔ 이것이 이 자의 안전장치다 */
  재본다('칸바꾸기 — 그 줄에 둘이면 안 건드린다', 칸바꾸기('| 24 | 24 |', '24', '23.9'), null);
  console.log(`기사 수 반영자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 기사길 = process.argv[process.argv.indexOf('--기사') + 1];
  const 자길 = process.argv[process.argv.indexOf('--자') + 1];
  if (!기사길 || !자길) { console.error('쓰는 법: --기사 <md> --자 <scripts/check-*.mjs>'); process.exit(1); }
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, [자길], { encoding: 'utf8', maxBuffer: 1e9 });
  const 할것 = `${r.stdout}${r.stderr}`.split('\n').map(뜯기).filter(Boolean);
  if (!할것.length) { console.log('✅ 바꿀 것이 없다'); process.exit(0); }

  let 글 = fs.readFileSync(기사길, 'utf8');
  let 됨 = 0; const 남은 = [];
  for (const x of 할것) {
    const 줄들 = 글.split('\n');
    const 표 = 표들(글)[x.표 - 1];
    if (!표) { 남은.push(`${JSON.stringify(x)} — 표 ${x.표} 이 없다`); continue; }
    /**
     * ⭐ 줄 찾기는 두 길이다.
     *   ① 대조자가 준 줄 이름이 기사 표에 그대로 있으면 그 줄.
     *   ② 없으면 — 대조자마다 이름표가 다르다(`1위/구간` 대 `| 1 |`) —
     *      **그 표 안에서 그 값이 딱 한 줄에만** 있을 때 그 줄로 본다.
     * ⛔ 두 줄 이상이면 안 건드린다. 「아마 이 줄일 것」으로 고치지 않는다.
     */
    let 자리 = 표.find((i) => 줄들[i].replace(/[*_]/g, '').includes(x.줄));
    if (자리 === undefined) {
      const 될것 = 표.filter((i) => 칸바꾸기(줄들[i], x.기사, x.자료) !== null);
      if (될것.length === 1) [자리] = 될것;
      else {
        남은.push(`${JSON.stringify(x)} — 「${x.줄}」 줄이 없고, 값 ${x.기사} 를 가진 줄이 ${될것.length}개다`);
        continue;
      }
    }
    const 새줄 = 칸바꾸기(줄들[자리], x.기사, x.자료);
    if (!새줄) { 남은.push(`${JSON.stringify(x)} — 그 줄에 ${x.기사} 가 하나가 아니다`); continue; }
    줄들[자리] = 새줄; 글 = 줄들.join('\n'); 됨 += 1;
  }
  fs.writeFileSync(기사길, 글);
  console.log(`${path.basename(기사길)} — ${할것.length}건 중 ${됨}건 반영`);
  for (const s of 남은) console.log(`  ⚠ 손으로 봐야 한다: ${s}`);
}
