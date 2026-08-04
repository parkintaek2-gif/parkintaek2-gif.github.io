#!/usr/bin/env node
/**
 * **사명이 바뀐 회사**의 영문명을 채운다.
 *
 *   npm run subjects:renames             재기만 한다 (파일 안 고침)
 *   npm run subjects:renames -- --write  `src/lib/subjects.mjs` 에 넣는다
 *
 * ── 왜 이게 남아 있었나 ────────────────────────────────────────
 * 손 사전 + DART 이름매칭으로 **98.0%** 까지 왔는데 372종목(1,323건)이 남았다.
 * 남은 것을 보니 전부 **사명이 바뀌었거나 합병된 회사**다.
 *
 *   롯데제과 → 롯데웰푸드     아주캐피탈 → 우리금융캐피탈
 *   쌍용양회 → 쌍용C&E        포스코 ICT → POSCO DX
 *
 * DART `corpCode.xml` 은 **지금 이름만** 갖고 있다. 옛 이름으로는 안 찾힌다.
 *
 * ── ⚠ 리포트에 종목코드가 없다 ─────────────────────────────────
 * 처음엔 「리포트의 `code` 로 붙이면 되겠다」고 했는데 **틀렸다.**
 * 실측하니 **66,186건 중 66,071건(99.8%)에 `code` 가 없다.**
 * 2007년부터 쌓인 것이라 옛 수집기에 그 필드가 없었다. 코드 다리는 못 쓴다.
 *
 * ── 그래서 주식시세를 다리로 쓴다 ───────────────────────────────
 * 오늘 받은 주식시세 아카이브에는 **날마다의 종목명과 코드**가 다 있다.
 * 사명이 바뀌면 **같은 코드에 이름이 두 개 이상** 생긴다. 그게 다리다.
 *
 *   ① 옛이름 → (주식시세) 코드 → 그 코드의 다른 이름 → 손사전/DART
 *   ② 옛이름 → (주식시세) 코드 → DART 의 `stock_code` → 영문 법인명
 *
 * ── ⚠ 편집 판단 — 「현재 법인명」이다 ───────────────────────────
 * 2018년 「아주캐피탈」 리포트에 `WOORI FINANCIAL CAPITAL` 이 붙는다.
 * **법인은 같지만 발행 당시의 이름이 아니다.** 그래도 채우기로 했다 —
 * 영문 이용자는 **지금 이름으로 찾고**, `null` 보다는 낫다.
 * 대신 **그 사실을 사전에 적어 둔다.** 적지 않으면 나중에 아무도 모른다.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describeSubject } from '../src/lib/subjects.mjs';

const SUBJECTS_FILE = path.resolve('src/lib/subjects.mjs');
const STOCKS = path.resolve('archive/raw/stocks');
const CORPCODE = path.resolve('archive/raw/dart-corpcode/CORPCODE.xml');
const RESEARCH = path.resolve('archive/raw/research');

const 영문 = (ko) => { const v = describeSubject(ko); return typeof v === 'string' && v.trim() ? v : null; };

/** 주식시세에서 이름↔코드 양방향 표를 만든다 */
export function 종목표(dir = STOCKS) {
  const 이름별코드 = new Map(), 코드별이름 = new Map();
  if (!existsSync(dir)) return { 이름별코드, 코드별이름 };
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.ndjson'))) {
    for (const l of readFileSync(path.join(dir, f), 'utf8').split('\n')) {
      if (!l.trim()) continue;
      let r; try { r = JSON.parse(l); } catch { continue; }
      if (!r.코드 || !r.이름) continue;
      이름별코드.set(r.이름, r.코드);
      if (!코드별이름.has(r.코드)) 코드별이름.set(r.코드, new Set());
      코드별이름.get(r.코드).add(r.이름);
    }
  }
  return { 이름별코드, 코드별이름 };
}

/** DART corpCode.xml 에서 종목코드 → 영문 법인명 */
export function dart종목코드표(file = CORPCODE) {
  const m = new Map();
  if (!existsSync(file)) return m;
  const xml = readFileSync(file, 'utf8');
  const 값 = (c, t) => {
    const r = c.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`));
    return r ? r[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
  };
  for (const g of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const sc = 값(g[1], 'stock_code'), en = 값(g[1], 'corp_eng_name');
    if (/^\d{6}$/.test(sc) && en) m.set(sc, en);
  }
  return m;
}

/** 리포트에서 아직 영문명이 없는 종목명과 건수 */
function 미충족목록() {
  const m = new Map();
  let 전체 = 0, 채움 = 0;
  for (const d of readdirSync(RESEARCH)) {
    let L; try { L = readdirSync(path.join(RESEARCH, d)); } catch { continue; }
    for (const f of L) {
      let j; try { j = JSON.parse(readFileSync(path.join(RESEARCH, d, f), 'utf8')); } catch { continue; }
      if (!j.stock) continue;
      전체++;
      if (영문(j.stock)) { 채움++; continue; }
      m.set(j.stock, (m.get(j.stock) ?? 0) + 1);
    }
  }
  return { 미충족: m, 전체, 채움 };
}

function main() {
  const 쓰기 = process.argv.includes('--write');
  const { 이름별코드, 코드별이름 } = 종목표();
  const dart = dart종목코드표();
  console.log(`주식시세 코드 ${코드별이름.size} · DART 상장 영문명 ${dart.size}`);

  const { 미충족, 전체, 채움 } = 미충족목록();
  console.log(`리포트 ${전체.toLocaleString()} · 지금 커버 ${채움.toLocaleString()} (${(채움 / 전체 * 100).toFixed(2)}%)`);
  console.log(`아직 없는 종목 ${미충족.size}개 · ${[...미충족.values()].reduce((a, b) => a + b, 0)}건\n`);

  const 추가 = [];   /* [옛이름, 영문, 경로, 건수] */
  const 남음 = [];
  for (const [이름, n] of 미충족) {
    const 코드 = 이름별코드.get(이름);
    if (!코드) { 남음.push([이름, n, '2020년 이전에 상장폐지 — 주식시세에 없다']); continue; }
    let 찾음 = null;
    for (const 다른 of 코드별이름.get(코드)) {
      if (다른 === 이름) continue;
      const en = 영문(다른);
      if (en) { 찾음 = [en, `사명변경(${다른})`]; break; }
    }
    if (!찾음 && dart.has(코드)) 찾음 = [dart.get(코드), 'DART stock_code'];
    if (찾음) 추가.push([이름, 찾음[0], 찾음[1], n]);
    else 남음.push([이름, n, '코드는 있으나 영문명 출처가 없다']);
  }

  const 건 = 추가.reduce((a, b) => a + b[3], 0);
  console.log(`✅ 채울 수 있는 것 ${추가.length}종목 · ${건}건`);
  for (const [k, en, 경로, n] of 추가.slice(0, 12)) console.log(`   ${k} → ${en}  [${경로}] ${n}건`);
  console.log(`\n합치면 ${((채움 + 건) / 전체 * 100).toFixed(2)}%  (지금 ${(채움 / 전체 * 100).toFixed(2)}%)`);
  console.log(`\n남는 것 ${남음.length}종목 · ${남음.reduce((a, b) => a + b[1], 0)}건`);
  for (const [k, n, why] of 남음.sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`   ${k} ${n}건 — ${why}`);

  if (!쓰기) { console.log('\n(보기만 했다. 실제로 넣으려면 --write)'); return; }
  if (!추가.length) { console.log('\n넣을 것이 없다.'); return; }

  const 원본 = readFileSync(SUBJECTS_FILE, 'utf8');
  const 시작 = '/* ── 사명변경 자동 채움 시작';
  const 끝 = '/* ── 사명변경 자동 채움 끝 ── */';
  const a = 원본.indexOf(시작), b = 원본.indexOf(끝);
  if (a === -1 || b === -1) {
    console.error('✕ src/lib/subjects.mjs 에서 「사명변경 자동 채움」 표시를 못 찾았다.');
    console.error('   `export const RENAMED_SUBJECTS = {};` 를 표시 사이에 두어야 한다.');
    process.exit(1);
  }
  const 키표기 = (k) => (/^[A-Za-z_가-힣][A-Za-z0-9_가-힣]*$/.test(k) ? k : JSON.stringify(k));
  const 항목 = 추가
    .sort((x, y) => x[0].localeCompare(y[0], 'ko'))
    .map(([k, v, 경로]) => `  ${키표기(k)}: ${JSON.stringify(v)},   /* ${경로} */`)
    .join('\n');
  const 새블록 =
    `${시작} · scripts/fill-subjects-from-renames.mjs 가 만든다 ──\n` +
    ` *\n` +
    ` * **사명이 바뀌었거나 합병된 회사**다. 옛 이름으로는 DART 에서 안 찾힌다.\n` +
    ` * 주식시세 아카이브에서 「같은 코드에 이름이 둘 이상」인 것을 다리로 삼았다.\n` +
    ` *\n` +
    ` * ⚠ **여기 값은 「현재 법인명」이다.** 발행 당시의 이름이 아니다 —\n` +
    ` *   2018년 「아주캐피탈」 리포트에 \`WOORI FINANCIAL CAPITAL\` 이 붙는다.\n` +
    ` *   법인은 같으므로 틀린 값은 아니지만, **시점이 다르다**는 것을 알고 써야 한다.\n` +
    ` *   영문 이용자는 지금 이름으로 찾으므로 \`null\` 보다 낫다는 편집 판단이다.\n` +
    ` *\n` +
    ` * ⚠ **이 선언은 지우지 않는다.** 비어 있어도 있어야 한다 —\n` +
    ` *   \`describeSubject\` 가 참조하므로 없으면 모듈이 통째로 죽는다.\n` +
    ` *   다시 만들려면 \`npm run subjects:renames -- --write\`.\n` +
    ` */\n` +
    `export const RENAMED_SUBJECTS = {\n${항목}\n};\n`;
  writeFileSync(SUBJECTS_FILE, 원본.slice(0, a) + 새블록 + 원본.slice(b));
  console.log(`\n✅ ${추가.length}개를 RENAMED_SUBJECTS 에 넣었다.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
