/**
 * **영어 지면에 한국어가 뜻 없이 나가는 것을 막는다.**
 *
 * 🔴 2026-08-14 — 작품 지면 530장에 「배급·제작·첫방송」이 뜻 없이 나가고 있었다.
 *   ⭐ 6번을 재려고 만든 자를 나에게 대서 찾았다. 그러지 않았으면 못 봤다.
 *
 * ⛔ 한국어를 **금지하는 검사가 아니다.** 출처를 밝히는 원문 병기는 정당하고 오히려 옳다:
 *     ✅ Korea Creative Content Agency (한국콘텐츠진흥원)      영문이 앞, 원문이 괄호
 *     ✅ 근속연수 (average years of service)                원문이 앞, 뜻이 괄호
 *     🔴 배급                                              뜻이 어디에도 없다 ← 이것만 잡는다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 한국어 낱말 하나가 **뜻을 달고 있는가**. 앞뒤 어느 쪽이든 로마자 짝이 있으면 정당하다 */
export function 뜻이있나(글, 자리, 낱말) {
  const 뒤 = 글.slice(자리 + 낱말.length, 자리 + 낱말.length + 14);
  const 앞 = 글.slice(Math.max(0, 자리 - 90), 자리);
  if (/^\s*[)」]?\s*[(–—-]\s*[A-Za-z]/.test(뒤)) return true;        // 원문 → (뜻)
  /**
   * ⭐ **괄호 안이면 통과다.** 「Content Industry Survey (한국콘텐츠진흥원 콘텐츠산업조사)」 처럼
   *   괄호 안에 원문이 **여러 낱말** 들어가는 것이 정상이다. 처음엔 괄호 바로 뒤 한 낱말만
   *   봐서, 둘째 낱말부터 빨강으로 셌다. ⛔ 자가 거칠면 옳은 것을 고치게 만든다.
   *   여는 괄호를 만나기 전에 닫는 괄호가 없으면 「아직 괄호 안」이다.
   */
  const 열림 = Math.max(앞.lastIndexOf('('), 앞.lastIndexOf('「'));
  const 닫힘 = Math.max(앞.lastIndexOf(')'), 앞.lastIndexOf('」'));
  if (열림 > 닫힘 && /[A-Za-z]/.test(앞.slice(0, 열림).slice(-40))) return true;
  return false;
}

/** 지면 하나에서 **뜻 없는 한국어**만 뽑는다 */
export function 맨몸한국어(글) {
  const 벗김 = 글.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  const 맨몸 = [];
  for (const m of 벗김.matchAll(/[가-힣][가-힣\s]{0,15}/g)) {
    const 낱 = m[0].trim();
    if (!낱 || !뜻이있나(벗김, m.index, 낱)) 맨몸.push(낱);
  }
  return [...new Set(맨몸)];
}

if (process.argv.includes('--selftest')) {
  const 잼 = [];
  const 참 = (이름, 값) => 잼.push([이름, !!값]);
  참('원문 뒤에 뜻이 붙으면 통과', 맨몸한국어('<p>근속연수 (average years of service)</p>').length === 0);
  참('영문 뒤 괄호 안 원문은 통과', 맨몸한국어('<p>Korea Creative Content Agency (한국콘텐츠진흥원)</p>').length === 0);
  참('낫표 병기도 통과', 맨몸한국어('<p>Webtoon Industry Survey 「웹툰산업실태조사」</p>').length === 0);
  참('맨몸 한국어는 잡는다', 맨몸한국어('<td>배급</td>').includes('배급'));
  참('뜻 옮긴 뒤 원문 병기는 통과', 맨몸한국어('<td>Distribution (배급)</td>').length === 0);
  참('줄표 뜻도 통과', 맨몸한국어('<p>매도만 가능 — sell only</p>').length === 0);
  /* 🔴 8/14 여기서 옳은 것을 여섯 장 빨강으로 셀 뻔했다 — 괄호 안 **둘째 낱말부터** 놓쳤다 */
  참('괄호 안 원문이 여러 낱말이어도 통과',
    맨몸한국어('<p>Content Industry Survey (한국콘텐츠진흥원 콘텐츠산업조사), via KOSIS</p>').length === 0);
  참('닫는 괄호 뒤 낫표 원문도 통과',
    맨몸한국어('<p>DART (금융감독원 전자공시) 「직원 등의 현황」</p>').length === 0);
  참('괄호가 닫힌 뒤 맨몸이면 잡는다', 맨몸한국어('<p>Survey (한국콘텐츠진흥원) 배급</p>').includes('배급'));
  참('한국어가 없으면 빈 목록', 맨몸한국어('<p>nothing here</p>').length === 0);
  참('태그 안 글자는 안 센다', 맨몸한국어('<p lang="ko"></p>').length === 0);
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [이름] of 진) console.log(`   🔴 ${이름}`);
  process.exit(진.length ? 1 : 0);
}

/* 지어진 결과물을 본다 — 소스가 아니라 **손님이 받는 것**을 본다 */
const 방 = path.join(뿌리, 'dist', 'wikitip');
if (!fs.existsSync(방)) { console.log('⚠ dist/wikitip 이 없다. 먼저 짓는다'); process.exit(0); }

const 지면들 = [];
(function 걷기(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) 걷기(p); else if (e.name.endsWith('.html')) 지면들.push(p);
  }
}(방));

const 빨강 = [];
for (const f of 지면들) {
  const 맨몸 = 맨몸한국어(fs.readFileSync(f, 'utf8'));
  if (맨몸.length) 빨강.push([path.relative(방, f), 맨몸]);
}

console.log(`영어 지면 ${지면들.length}장에서 **뜻 없는 한국어**를 찾는다`);
/**
 * 🔴 2026-08-14 — 빌드가 중간에 죽어 지면이 0장일 때 이 검사가 **✅ 를 냈다.**
 *   ⛔ 「볼 것이 없었다」와 「봤는데 없었다」는 다른 말이다. 오늘 「만든 값이 0」을 겪고도
 *     내 검사가 같은 거짓말을 했다. 아무것도 안 본 검사는 통과가 아니다.
 */
if (지면들.length < 100) {
  console.log(`🔴 지면이 ${지면들.length}장뿐이다 — 빌드가 덜 됐다. **아무것도 안 보고 통과시키지 않는다**`);
  process.exit(1);
}
if (!빨강.length) { console.log('✅ 빨강 0건'); process.exit(0); }
console.log(`🔴 빨강 ${빨강.length}장`);
for (const [f, 낱] of 빨강.slice(0, 25)) console.log(`   ${f.padEnd(46)} ${낱.slice(0, 4).join(' / ')}`);
if (빨강.length > 25) console.log(`   … 그리고 ${빨강.length - 25}장 더`);
process.exit(1);
