#!/usr/bin/env node
/**
 * check-seoulmarkets-dataset-schema.mjs — 표가 있는 기사마다 Dataset 구조화데이터가 실제로 나갔는가.
 *
 * ── 왜 (2026-09-02, GEO 지시 [5번→6번] ③) ──────────────────────────────
 * 「구조화 데이터에 Dataset·Table을 더한다 — 금융 표가 인용되기 가장 쉽다」.
 * `src/pages/article/[...id].astro`가 본문 첫 표의 머리글을 읽어 `Dataset` JSON-LD를 낸다
 * (표 없으면 안 낸다 — 없는 걸 있다고 안 한다). 이 자는 **빌드된 HTML**에서 실제로 나갔는지 잰다.
 *
 * ⛔ 표 추출 정규식은 [...id].astro의 것과 «똑같이» 유지한다 — 하나 고치면 둘 다 고친다.
 *
 * 쓰는 법
 *   node scripts/check-seoulmarkets-dataset-schema.mjs --자가시험
 *   node scripts/check-seoulmarkets-dataset-schema.mjs        (build-once.mjs 뒤에 실행 — dist/article 필요)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기사폴더 = path.join(뿌리, 'content/articles');
const distDir = path.join(뿌리, 'dist/article');

/** 본문 첫 markdown 표의 머리글 칸들을 뽑는다. 표 없으면 null(0으로 안 채운다).
 *  ⚠ [...id].astro의 표찾기()와 정규식이 같아야 한다 — 갈라지면 이 검사가 거짓말을 한다. */
export function 표찾기(본문) {
  const m = 본문.match(/^\|(.+)\|\r?\n\|[\s:|-]+\|\r?\n(?:\|.*\|\r?\n?)+/m);
  if (!m) return null;
  const 칸들 = m[1].split('|').map((s) => s.trim()).filter(Boolean);
  return 칸들.length ? 칸들 : null;
}

if (process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 검 = (m, ok) => { if (ok) 통과++; else { 실패++; console.log('  ❌', m); } };

  검('표 있으면 머리글을 뽑는다', JSON.stringify(표찾기('앞글\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n')) === JSON.stringify(['a', 'b']));
  검('표 없으면 null', 표찾기('그냥 본문입니다. 표가 없습니다.') === null);
  검('구분선 없는 파이프 줄은 표 아님', 표찾기('| a | b |\n그냥 다음 줄입니다.\n') === null);
  검('머리글만 있고 데이터 행 없으면 null', 표찾기('| a | b |\n| --- | --- |\n') === null);
  검('본문 중간의 표도 찾는다', 표찾기('앞 문단.\n\n또 문단.\n\n| x |\n| --- |\n| 1 |\n') !== null);

  console.log(실패 === 0 ? `✅ 자가시험 — 통과 ${통과} · 실패 0` : `❌ 자가시험 — 통과 ${통과} · 실패 ${실패}`);
  process.exit(실패 === 0 ? 0 : 1);
}

if (!fs.existsSync(distDir)) {
  console.error('⛔ dist/article 이 없다 — 먼저 node scripts/build-once.mjs 를 돌린다.');
  process.exit(1);
}

const 파일들 = fs.readdirSync(기사폴더).filter((f) => f.endsWith('.md'));
let 표있음 = 0, 냄 = 0, 빠짐 = 0;
const 빠진목록 = [];
for (const 파일 of 파일들) {
  const slug = 파일.replace(/\.md$/, '');
  const 원문 = fs.readFileSync(path.join(기사폴더, 파일), 'utf8');
  if (/^draft:\s*true/m.test(원문)) continue;
  const 본문 = 원문.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  if (!표찾기(본문)) continue;
  표있음++;
  const htmlPath = path.join(distDir, `${slug}.html`);
  if (!fs.existsSync(htmlPath)) { 빠짐++; 빠진목록.push(slug); continue; }
  const html = fs.readFileSync(htmlPath, 'utf8');
  if (html.includes('"@type":"Dataset"') || html.includes('"@type": "Dataset"')) 냄++;
  else { 빠짐++; 빠진목록.push(slug); }
}

console.log(`■ Dataset 구조화데이터 — 표 있는 기사 ${표있음}편 중 ${냄}편 나감 · ${빠짐}편 안 나감`);
if (빠진목록.length) {
  console.log('  빠진 것:');
  for (const s of 빠진목록.slice(0, 20)) console.log(`    · ${s}`);
  if (빠진목록.length > 20) console.log(`    ... 외 ${빠진목록.length - 20}편`);
  process.exit(1);
}
