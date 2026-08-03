#!/usr/bin/env node
/**
 * DART `corpCode.xml` 로 **종목 영문명**을 채운다.
 *
 *   npm run subjects:dart            무엇이 채워지는지 보기만 한다 (파일 안 고침)
 *   npm run subjects:dart -- --write `src/lib/subjects.mjs` 에 실제로 넣는다
 *
 * ── 왜 이 경로인가 ─────────────────────────────────────────────
 * 사장님 스케줄 문서: 「**8월의 핵심은 영문 정규화다.** 해외에 파는 상품의 실체이고,
 * 마켓플레이스 등재의 전제이고, 아무것에도 안 막힌다」
 *
 * 손으로 599개를 넣어 86.1% 까지 왔는데 **남은 게 2,190종목**이다. 손으로는 못 한다.
 * 그리고 **음차로 지어내면 안 된다** — 상장사의 공식 영문 표기는 회사가 정한 것이다
 * (SK hynix · NCSOFT · AMOREPACIFIC 처럼 대소문자까지 회사 것이다).
 *
 * **DART 는 회사가 신고한 영문 법인명을 그대로 갖고 있다.** 그래서 이것이 정답지다.
 *
 * ── ⚠ 법인명과 종목명은 다르다 ─────────────────────────────────
 * DART 는 **법인명**(corp_name)이고 우리 아카이브는 **종목명**이다.
 *   법인 「주식회사 카카오」   종목 「카카오」
 *   법인 「NAVER」            종목 「NAVER」
 * 그래서 접두·접미의 법인 표기를 떼고 맞춘다. 그래도 안 맞는 것은 **그냥 둔다** —
 * 억지로 맞추면 틀린 이름이 들어간다. `null` 이 틀린 값보다 낫다.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describeSubject, SUBJECT_STATS } from '../src/lib/subjects.mjs';

const XML = path.resolve('archive/raw/dart-corpcode/CORPCODE.xml');
const INDEX = path.resolve('archive/index/research.ndjson');
const SUBJECTS = path.resolve('src/lib/subjects.mjs');

/** 법인 표기를 떼어 종목명 꼴로 만든다. */
export function 정규화(s) {
  return s
    .replace(/^\(주\)|^주식회사\s*/g, '')
    .replace(/\(주\)$|주식회사$/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * `<list>` 한 덩이에서 태그 값을 뽑는다.
 *
 * ⚠ **엔티티를 반드시 푼다.** 안 풀면 `SHIN HEUNG ENERGY &amp; ELECTRONICS` 가
 *   그대로 화면에 나간다. 실제로 처음에 그렇게 나왔다.
 *   회사명에 `&` 는 흔하다(SK C&C · AT&T 꼴).
 */
function 값(덩이, 태그) {
  const m = 덩이.match(new RegExp(`<${태그}>([\\s\\S]*?)</${태그}>`));
  if (!m) return '';
  return m[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function 사전만들기(xml) {
  const 이름맵 = new Map();   // 정규화된 국문 → 영문
  let 상장 = 0;
  let 영문보유 = 0;
  for (const m of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const 덩이 = m[1];
    const 종목코드 = 값(덩이, 'stock_code');
    const 국문 = 값(덩이, 'corp_name');
    const 영문 = 값(덩이, 'corp_eng_name');
    if (종목코드) 상장++;
    if (!국문 || !영문) continue;
    영문보유++;
    /*
     * ⚠ 상장사를 **먼저** 넣는다.
     *   같은 이름의 비상장 법인이 덮어쓰면 엉뚱한 회사의 영문명이 붙는다.
     *   Map 은 나중 것이 이기므로, 비상장은 이미 있으면 건너뛴다.
     */
    const 키 = 정규화(국문);
    if (종목코드) 이름맵.set(키, 영문);
    else if (!이름맵.has(키)) 이름맵.set(키, 영문);
  }
  return { 이름맵, 상장, 영문보유 };
}

function main() {
  const 쓰기 = process.argv.includes('--write');
  if (!existsSync(XML)) {
    console.error(`✕ ${XML} 이 없다. 먼저 \`npm run collect:dart:corpcode\` 로 받고 압축을 푼다.`);
    process.exit(1);
  }

  const { 이름맵, 상장, 영문보유 } = 사전만들기(readFileSync(XML, 'utf8'));
  console.log(`DART 고유번호 — 상장 ${상장.toLocaleString()} · 영문명 보유 ${영문보유.toLocaleString()} · 이름표 ${이름맵.size.toLocaleString()}`);

  if (!existsSync(INDEX)) {
    console.error(`✕ ${INDEX} 가 없다. \`node scripts/build-research-index.mjs\` 를 먼저 돌린다.`);
    process.exit(1);
  }

  /* 아카이브에 실제로 나오는 종목만 대상으로 한다. 안 나오는 이름을 넣을 이유가 없다 */
  const 건수 = new Map();
  for (const 줄 of readFileSync(INDEX, 'utf8').split('\n')) {
    if (!줄) continue;
    const r = JSON.parse(줄);
    if (r.s) 건수.set(r.s, (건수.get(r.s) ?? 0) + 1);
  }
  const 총 = [...건수.values()].reduce((a, b) => a + b, 0);

  let 이미 = 0;
  let 새로 = 0;
  const 추가 = [];
  const 못찾음 = [];
  for (const [이름, c] of 건수) {
    if (describeSubject(이름)) { 이미 += c; continue; }
    const 영문 = 이름맵.get(정규화(이름));
    if (영문) { 새로 += c; 추가.push([이름, 영문, c]); }
    else 못찾음.push([이름, c]);
  }
  추가.sort((a, b) => b[2] - a[2]);

  console.log(`\n현재 커버  ${(이미 / 총 * 100).toFixed(1)}%  (${이미.toLocaleString()}/${총.toLocaleString()})`);
  console.log(`DART 로 추가 ${추가.length.toLocaleString()}종목 · ${새로.toLocaleString()}건`);
  console.log(`합치면     ${((이미 + 새로) / 총 * 100).toFixed(1)}%`);
  console.log(`끝내 못 찾음 ${못찾음.length.toLocaleString()}종목 · ${못찾음.reduce((s, x) => s + x[1], 0).toLocaleString()}건`);

  console.log('\n--- 추가 표본 15 ---');
  console.log(추가.slice(0, 15).map(([k, v, c]) => `  ${k}(${c}) = ${v}`).join('\n'));
  console.log('\n--- 못 찾은 것 표본 10 (사명 변경·합병·상폐일 수 있다) ---');
  console.log(못찾음.sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, c]) => `  ${k}(${c})`).join('\n'));

  if (!쓰기) { console.log('\n(보기만 했다. 실제로 넣으려면 --write)'); return; }

  /* ── 사전에 넣는다 ────────────────────────────────────────
     ⚠ 손으로 넣은 599개를 **건드리지 않는다.** 그건 사람이 확인한 값이다.
       DART 분은 별도 블록으로 뒤에 붙여, 나중에 출처를 구분할 수 있게 한다. */
  const 원본 = readFileSync(SUBJECTS, 'utf8');
  /*
   * ⚠ **덧붙이지 않고 표시 사이를 갈아 끼운다.**
   *   처음엔 파일 끝에 붙였는데, 다시 돌리면 `DART_SUBJECTS` 가 두 번 선언돼 깨졌다.
   *   그리고 블록을 손으로 지웠더니 `describeSubject` 가 참조하던 이름이 사라져
   *   **모듈이 통째로 죽었다.** 그래서 빈 선언을 항상 두고 그 안만 바꾼다.
   */
  const 시작 = '/* ── DART 자동 채움 시작';
  const 끝 = '/* ── DART 자동 채움 끝 ── */';
  const a = 원본.indexOf(시작);
  const b = 원본.indexOf(끝);
  if (a === -1 || b === -1) {
    console.error('✕ src/lib/subjects.mjs 에서 DART 자동 채움 표시를 못 찾았다.');
    console.error('   `export const DART_SUBJECTS = {};` 를 표시 사이에 두어야 한다.');
    process.exit(1);
  }
  const 키표기 = (k) => (/^[A-Za-z_가-힣][A-Za-z0-9_가-힣]*$/.test(k) ? k : JSON.stringify(k));
  const 항목 = 추가.map(([k, v]) => `  ${키표기(k)}: ${JSON.stringify(v)},`).join('\n');
  const 새블록 =
    `${시작} · scripts/fill-subjects-from-dart.mjs 가 만든다 ──\n` +
    ` *\n` +
    ` * 출처: DART \`corpCode.xml\` 의 \`corp_eng_name\` — **회사가 금감원에 신고한 영문 법인명**이다.\n` +
    ` * 위의 손 사전과 달리 사람이 눈으로 확인하지 않았다. 이상한 것을 발견하면 위로 옮겨 고친다.\n` +
    ` *\n` +
    ` * ⚠ **이 선언은 지우지 않는다.** 비어 있어도 있어야 한다 —\n` +
    ` *   \`describeSubject\` 가 참조하므로 없으면 모듈이 통째로 죽는다. 실제로 한 번 그랬다.\n` +
    ` *   다시 만들려면 \`npm run subjects:dart -- --write\`.\n` +
    ` */\n` +
    `export const DART_SUBJECTS = {\n${항목}\n};\n`;
  writeFileSync(SUBJECTS, 원본.slice(0, a) + 새블록 + 원본.slice(b));
  console.log(`\n✅ ${추가.length.toLocaleString()}개를 src/lib/subjects.mjs 의 DART_SUBJECTS 에 넣었다.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
