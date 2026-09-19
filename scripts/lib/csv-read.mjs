/**
 * csv-read.mjs — RFC4180 꼴 CSV 를 읽어 {머리칸, 줄들(객체배열)} 로 돌려준다.
 *
 * ── 왜 (F5 · 2026-09-19 · 2번) ──────────────────────────────────────────
 * 이미 만든 전량 CSV(사람마다 다른 빌더가 만든다)를 다시 만들지 않고 «그대로 읽어»
 * Parquet 으로도 낸다 — 재수집(네트워크·DART API) 없이 «같은 판»을 두 꼴로 준다.
 *
 * ⛔ 이 자가 지키는 것
 * ⛔ 줄바꿈 정규식(`split('\n')`)으로 안 가른다 — 따옴표 안에 줄바꿈이 있으면 그
 *   자리에서 표가 깨진다. 문자 하나씩 훑는다.
 * ⛔ 빈 칸을 0/undefined 로 바꾸지 않는다 — 빈 문자열 그대로 낸다. 숫자로 바꾸는
 *   일은 이 자의 몫이 아니다(parquet-out.mjs 의 칸타입 이 값을 보고 스스로 정한다).
 */
import fs from 'node:fs';

/** 문자열 전체를 파싱한다. BOM 이 있으면 걷어낸다 */
export function csv파싱(text) {
  let s = String(text ?? '');
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);

  const 줄들 = [];
  let 칸 = [];
  let 값 = '';
  let 따옴표안 = false;
  let i = 0;
  const n = s.length;

  const 칸끝 = () => { 칸.push(값); 값 = ''; };
  const 줄끝 = () => { 칸끝(); 줄들.push(칸); 칸 = []; };

  while (i < n) {
    const c = s[i];
    if (따옴표안) {
      if (c === '"') {
        if (s[i + 1] === '"') { 값 += '"'; i += 2; continue; }
        따옴표안 = false; i += 1; continue;
      }
      값 += c; i += 1; continue;
    }
    if (c === '"') { 따옴표안 = true; i += 1; continue; }
    if (c === ',') { 칸끝(); i += 1; continue; }
    if (c === '\r') { i += 1; continue; } // CRLF — \r 은 버리고 \n 에서 줄을 끊는다
    if (c === '\n') { 줄끝(); i += 1; continue; }
    값 += c; i += 1;
  }
  /* 마지막 줄에 개행이 없어도 놓치지 않는다 */
  if (값 !== '' || 칸.length > 0) 줄끝();

  /* ⛔ 꼬리에 빈 줄(파일 끝 개행 하나)이 남으면 «빈 행»으로 세지 않는다 */
  while (줄들.length && 줄들[줄들.length - 1].length === 1 && 줄들[줄들.length - 1][0] === '') 줄들.pop();

  if (!줄들.length) return { 머리칸: [], 줄들: [] };
  const 머리칸 = 줄들[0];
  const 행들 = 줄들.slice(1).map((칸값들) => {
    const o = {};
    머리칸.forEach((k, idx) => { o[k] = 칸값들[idx] ?? ''; });
    return o;
  });
  return { 머리칸, 줄들: 행들 };
}

/** 파일을 읽어 바로 파싱한다 */
export function csv파일읽기(경로) {
  return csv파싱(fs.readFileSync(경로, 'utf8'));
}

const 나 = process.argv[1] && new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') === process.argv[1].replace(/\\/g, '/');

if (나 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('머리칸·값을 가른다', (() => {
    const r = csv파싱('a,b\n1,2\n3,4');
    return r.머리칸.join(',') === 'a,b' && r.줄들.length === 2 && r.줄들[0].a === '1' && r.줄들[1].b === '4';
  })());
  검('BOM 을 걷어낸다', csv파싱('﻿a,b\n1,2').머리칸.join(',') === 'a,b');
  검('따옴표 안 쉼표를 값으로 본다', csv파싱('a,b\n"1,000",2').줄들[0].a === '1,000');
  검('겹따옴표는 한 개로 되돌린다', csv파싱('a\n"he said ""hi"""').줄들[0].a === 'he said "hi"');
  검('따옴표 안 줄바꿈도 한 값으로 본다(표가 안 깨진다)', (() => {
    const r = csv파싱('a,b\n"line1\nline2",2');
    return r.줄들.length === 1 && r.줄들[0].a === 'line1\nline2' && r.줄들[0].b === '2';
  })());
  검('CRLF 를 견딘다', csv파싱('a,b\r\n1,2\r\n').줄들.length === 1);
  검('빈 값은 빈 문자열이지 0 이 아니다', csv파싱('a,b\n,2').줄들[0].a === '');
  검('⛔ 파일 끝 개행 하나로 빈 행을 만들지 않는다', csv파싱('a,b\n1,2\n').줄들.length === 1);
  검('빈 문자열이면 줄 0개', csv파싱('').줄들.length === 0 && csv파싱('').머리칸.length === 0);
  검('006860 처럼 앞자리 0 문자열이 그대로 남는다(숫자로 안 바꾼다)', csv파싱('code\n006860').줄들[0].code === '006860');

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((x) => `   · ${x}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ csv-read 자가시험 ${통}개 통과`);
  process.exit(0);
}
