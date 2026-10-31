#!/usr/bin/env node
/**
 * check-케이리뷰-기자이름.mjs — 케이리뷰에 기자 이름이 들어가지 않았나
 *
 * 사장님 2026-10-31 「케이리뷰에 기자 이름 쓰면 안됨」
 *   중부매일 기사를 리라이트하다 보면 「[중부매일 박인택 기자]」 머리나 「○○○ 기자」 가 따라 들어온다.
 *   ⇒ content/kcw-reviews/*.md 의 본문·머리말 어디에도 「이름 + 기자」 꼴이 없어야 한다.
 *   ⚠ 「기자회견」「기자단」 같은 낱말은 이름이 아니므로 통과한다.
 *
 * 쓰는 법: node scripts/check-케이리뷰-기자이름.mjs   (걸리면 종료값 1)
 *         node scripts/check-케이리뷰-기자이름.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = fileURLToPath(new URL('..', import.meta.url));
const 폴더 = path.join(뿌리, 'content', 'kcw-reviews');
const 꼴 = /(?:\[[^\]]*기자\]|[가-힣]{2,4}\s?기자(?!회견|단|실|들|석|간담))/g;

export function 찾는다(글) {
  return [...String(글).matchAll(꼴)].map((m) => m[0]);
}

if (process.argv.includes('--자가시험')) {
  const 본다 = (이름, v) => { console.log((v ? '✅ ' : '🔴 ') + 이름); if (!v) process.exitCode = 1; };
  본다('「[중부매일 박인택 기자]」를 잡는다', 찾는다('[중부매일 박인택 기자] 한화생명이').length === 1);
  본다('「박인택 기자」를 잡는다', 찾는다('글 박인택 기자').length === 1);
  본다('「기자회견」은 통과', 찾는다('감독은 기자회견에서').length === 0);
  본다('「취재 기자단」은 통과', 찾는다('취재 기자단이 모였다').length === 0);
  process.exit();
}

let 걸림 = 0;
for (const f of fs.readdirSync(폴더).filter((x) => x.endsWith('.md'))) {
  const 찾음 = 찾는다(fs.readFileSync(path.join(폴더, f), 'utf8'));
  if (찾음.length) { 걸림 += 1; console.log(`🔴 ${f} — ${[...new Set(찾음)].join(', ')}`); }
}
if (걸림) { console.log(`\n🔴 기자 이름이 든 케이리뷰 ${걸림}건 — 지우고 다시 돌린다`); process.exit(1); }
console.log('✅ 케이리뷰에 기자 이름 없음');
