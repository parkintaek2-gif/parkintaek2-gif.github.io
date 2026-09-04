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
import { 못재면멈춘다 } from './lib/dist-ready.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ⛔ 덜 지어진 dist 를 재면 «거짓 빨강»이나 «거짓 초록»이 나온다. 그럴 땐 안 잰다 */
if (!process.argv.includes('--자가시험')) 못재면멈춘다(뿌리, 'check-kcw-korean-leak');

/** 한국어 낱말 하나가 **뜻을 달고 있는가**. 앞뒤 어느 쪽이든 로마자 짝이 있으면 정당하다 */
export function 뜻이있나(글, 자리, 낱말) {
  const 뒤 = 글.slice(자리 + 낱말.length, 자리 + 낱말.length + 26);
  const 앞 = 글.slice(Math.max(0, 자리 - 90), 자리);
  /**
   * 🔴🔴 [2026-09-04 · 5번] **이 자가 2,796장 가운데 2,795장에서 빨강이었다.**
   *   ─────────────────────────────────────────────────────────────────────
   *   전부 한 가지 때문이었다 — 꼬리말의 법정 신고번호 **「Mail-order licence 2026-세종-0591 (Sejong)」**.
   *   「세종」 바로 뒤가 `-0591 (Sejong)` 이라, 옛 무늬(`한국어 뒤 곧바로 괄호`)에 안 걸렸다.
   *
   *   ⛔ **그래서 이 검사는 사실상 꺼져 있었다.** 모든 지면이 빨강이면 아무도 «새 빨강»을 못 본다.
   *     ⭐ 오늘 아침 표 약속 검사는 «우연히 통과»해서 아무것도 보증하지 못하고 있었다.
   *       이 자는 «전부 걸려서» 아무것도 보증하지 못하고 있었다. **반대인데 결과가 같다.**
   *   🔴 그 사이에 내가 실제로 한국어를 흘렸다 — `/surge-floor` 에 자료 파일의 우리말 메모
   *     세 줄(「왜 튀었나 …」)을 그대로 뿌렸다. 이 자가 초록이었다면 바로 잡혔을 것이다.
   *
   *   ✅ 고친 방식 — 신고번호를 «예외로 박지 않았다». 그것은 이 한 줄만 눈감는 것이고,
   *     같은 꼴이 또 나오면 또 못 잡는다. 대신 **「한국어와 로마자 뜻 사이에 숫자·붙임표가
   *     끼어도 뜻이 있는 것으로 본다」**로 규칙을 넓혔다. 신고번호가 바로 그 꼴이다.
   *   ⚠ 넓히면 느슨해진다. 그래서 여전히 **괄호나 줄표를 요구한다** — 「배급 Distribution」처럼
   *     그냥 이어 붙인 것은 통과되지 않는다. 아래 자가시험이 그 경계를 지킨다.
   */
  if (/^[\s0-9)」\-–—]{0,12}[(–—-]\s*[A-Za-z]/.test(뒤)) return true;   // 원문 → (뜻)
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

/**
 * 🔴 [2026-09-04] **`noindex` 를 단 지면은 손님 지면이 아니다.**
 *   신고번호 예외를 고쳐 2,795장이 1장으로 줄었는데, 남은 그 하나가
 *   `video/review/index.html` 이었다 — 우리가 영상을 검수하려고 만든 내부 지면이고,
 *   `noindex,nofollow` 에 사이트맵에도 없다. 거기 사장님 지시 원문이 우리말로 적혀 있다.
 *   ⭐ 그것은 «누출»이 아니라 «내부 문서»다. 그 한 장 때문에 빨강이면 다시 꺼진 검사가 된다.
 *   ⛔ 다만 «조용히 건너뛰지 않는다» — 몇 장을 왜 건너뛰었는지 화면에 적는다.
 *     검사가 무엇을 안 봤는지 안 적으면 그것도 거짓 초록이다.
 */
export function 손님지면인가(글) {
  return !/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(String(글 ?? ''));
}

/**
 * 🔴 **`--selftest` 만 보고 돌면 안 된다.** 이 자가 import 되면 부르는 쪽의 argv 를
 *   제 것으로 알고 제 자가시험을 돌린 뒤 `process.exit` 한다 — **남의 시험이 통째로
 *   안 돈다.** 8/15 에 세 빌더가 하루 종일 그랬고, 화면엔 초록이 떴다.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
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

  /* 🔴🔴 [2026-09-04] 이 자가 2,795장에서 빨강이던 까닭 — 법정 신고번호. 여기서 굳힌다 */
  참('⭐ 법정 신고번호는 통과 — 뜻이 숫자 뒤에 붙어 있다',
    맨몸한국어('<p>Mail-order licence 2026-세종-0591 (Sejong)</p>').length === 0);
  참('숫자가 끼어도 줄표 뜻은 통과',
    맨몸한국어('<p>세종 0591 — Sejong</p>').length === 0);
  참('⛔ 그래도 느슨해지지 않았다 — 그냥 이어 붙인 것은 잡는다',
    맨몸한국어('<td>배급 Distribution</td>').includes('배급'));
  참('⛔ 숫자만 뒤에 있고 뜻이 없으면 잡는다',
    맨몸한국어('<td>배급 12345</td>').includes('배급'));
  참('⛔ 열두 자를 넘게 떨어진 로마자는 뜻으로 안 본다',
    맨몸한국어('<td>배급 0000000000000000 (Distribution)</td>').includes('배급'));
  참('⛔ 우리말 메모를 그대로 뿌린 꼴은 잡는다 (오늘 내가 그랬다)',
    맨몸한국어('<li>왜 튀었나 — 사건·발매·기사가 이 자료에 없다</li>').length > 0);
  참('괄호가 닫힌 뒤 맨몸이면 잡는다', 맨몸한국어('<p>Survey (한국콘텐츠진흥원) 배급</p>').includes('배급'));
  참('한국어가 없으면 빈 목록', 맨몸한국어('<p>nothing here</p>').length === 0);
  참('태그 안 글자는 안 센다', 맨몸한국어('<p lang="ko"></p>').length === 0);
  /* 🔴 [2026-09-04] noindex 를 단 내부 지면은 손님 지면이 아니다 — 다만 «세어서» 알린다 */
  참('noindex 지면은 손님 지면이 아니다',
    손님지면인가('<meta name="robots" content="noindex,nofollow">') === false);
  참('보통 지면은 손님 지면이다', 손님지면인가('<meta name="robots" content="index,follow">') === true);
  참('robots 태그가 없어도 손님 지면이다', 손님지면인가('<p>hi</p>') === true);
  참('⛔ 따옴표가 홑따옴표여도 알아본다',
    손님지면인가("<meta name='robots' content='noindex'>") === false);
  참('⛔ 빈 값에도 안 죽는다', 손님지면인가(null) === true);
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [이름] of 진) console.log(`   🔴 ${이름}`);
  process.exit(진.length ? 1 : 0);
}

/**
 * 🔴 2026-08-24 07:4x — **이 자의 본 검사가 안 잠겨 있었다.**
 *   위 머리말(줄 49)에 「이 자가 import 되면 남의 시험이 통째로 안 돈다」고 적어 두었는데,
 *   그것은 **자가시험 쪽만** 잠근 것이었다. 본 검사는 그대로 열려 있었다.
 *   오늘 `check-kcw-earning-pages.mjs` 에서 `맨몸한국어` 를 들여왔더니, 그 자를 부르는
 *   순간 **이 자가 1,539장을 훑고 `process.exit` 해 버려** 남의 검사가 통째로 죽었다.
 * ⛔ 판단을 나눠 쓰라고 export 해 두고, 들여오면 죽게 만들어 두었던 것이다.
 *   그러면 다음 사람은 베끼는 쪽을 고르고, 두 판단이 어긋난다.
 * ⭐ 그래서 본 검사도 「내가 직접 불렸을 때만」으로 잠근다.
 */
const 직접불렸나 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (!직접불렸나) {
  /* 들여쓰기용으로 불린 것이다 — 판단 함수만 내주고 아무것도 안 한다 */
} else {
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
let 건너뛴것 = 0;
for (const f of 지면들) {
  const 글 = fs.readFileSync(f, 'utf8');
  if (!손님지면인가(글)) { 건너뛴것 += 1; continue; }
  const 맨몸 = 맨몸한국어(글);
  if (맨몸.length) 빨강.push([path.relative(방, f), 맨몸]);
}

console.log(`영어 지면 ${지면들.length}장에서 **뜻 없는 한국어**를 찾는다`);
if (건너뛴것) {
  console.log(`⬜ 안 본 것 ${건너뛴것}장 — noindex 를 단 «내부» 지면이다(손님이 받지 않는다).`);
  console.log('   ⚠ 이것을 「깨끗하다」로 읽지 않는다. 안 본 것은 안 본 것이다.');
}
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
} /* ← 직접불렸나 */
