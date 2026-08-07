#!/usr/bin/env node
/**
 * 상호 검사 — **등기부 글자와 다른 상호가 코드에 남아 있으면 실패한다**
 *
 * 왜 만드나 (2026-08-06)
 *   상호 변경등기 교합이 끝나 새 이름을 넣는 날, 저장소 곳곳이 **「K라이프디자인」**(영문 K)이었다.
 *   등기부는 **「케이라이프디자인」**(한글 케이)이다. 사장님께 여쭤 보고서야 알았다.
 *   그대로 배포했으면 네 사이트 푸터·About·JSON-LD·외부로 나가는 편지가 전부
 *   **등기부에 없는 법인명**을 달고 나갔을 것이다. 금융·교육은 YMYL 이라 이게 제일 나쁘다.
 *
 *   ⭐ 사람이 기억하는 대신 이 파일이 지킨다.
 *      상호는 **사람이 부르는 말이 아니라 등기부 글자**로 적는다.
 *
 * 보는 것 둘
 *   ① 옛 상호(옆커폰세종)가 **코드**에 남아 있나 — 문서·이력에는 남아 있어도 된다
 *   ② 틀린 표기(K라이프디자인·케이라이프 디자인 …)가 **어디든** 있나 — 문서까지 본다
 *
 * ⚠ 검사가 헛도는지 먼저 확인한다 — `--selftest`
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..'
);

/** 🔴 등기부 상호. 이 한 줄이 정본이다 */
const 정본 = '주식회사 케이라이프디자인';

/** 틀린 표기들. 「케이」를 K 로 쓰거나 띄어 쓴 것 */
const 틀린표기 = [
  /주식회사 ?K ?라이프ㅤ?디자인/,
  /주식회사 케이라이프 디자인/,
  /주식회사 케이 라이프디자인/,
  /\bK라이프디자인/,
];

/** 옛 상호. **코드**에 남아 있으면 안 된다 (문서·메모는 이력이라 둔다) */
const 옛상호 = /옆커폰세종|Yeopkeopon/;

/** ⚠ 예외 — **「그건 틀린 표기다」라고 설명하는 줄**은 걸리면 안 된다.
 *  순위 검사(`check-100yearmap-copy.mjs`)가 「순위가 아닙니다」를 예외로 두는 것과 같은 자리다.
 *  이 예외가 없으면 규칙을 적어 둔 주석 때문에 검사가 늘 빨갛게 되고, 그러면 아무도 안 본다. */
const 예외 = /(아니다|아니라|옛 이름|옛 상호|이전 상호|틀린 표기|잘못 적|적혀 있었|바꿨다|였다)/;

const 볼폴더 = ['src', 'scripts', 'public'];
const 문서도볼폴더 = ['docs'];
/** 건너뛰는 것 — **이력을 적어 둔 파일**이다. 고치면 기록이 거짓이 된다.
 *  🔴 `사장님-지시-대장.md` 를 넣은 이유 (2026-08-06 21:2x · 5번이 「npm test 가 깨졌다」고 알림)
 *     그 파일은 **사장님 말씀 원문**이다. 08-05 15:45 에 사장님이 「주식회사 K라이프디자인」이라
 *     하신 그대로 적혀 있는데, 내 검사가 그것을 「틀린 표기」로 잡아 전원의 npm test 를 멈췄다.
 *     원문을 고쳐 통과시키는 것은 **기록을 조작하는 것**이다. 검사가 비켜 가야 맞다.
 *     ⚠ 검사를 만들 때 「무엇을 지키는가」만 보고 「무엇을 건드리면 안 되는가」를 안 봤다. */
const 건너뛸것 =
  /(node_modules|dist|\.git|archive|세션간-메모\.md|작업일지\.md|사장님-지시-대장\.md|사장님말씀-대장\.md|숙지-사장님지시|check-legal-name\.mjs)/;

const 파일모으기 = (d, 담을곳) => {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (건너뛸것.test(p)) continue;
    if (e.isDirectory()) 파일모으기(p, 담을곳);
    else if (/\.(astro|ts|tsx|mjs|js|json|md|txt|xml|html)$/.test(e.name)) 담을곳.push(p);
  }
};

const 코드파일 = [];
for (const d of 볼폴더) 파일모으기(path.join(ROOT, d), 코드파일);
const 문서파일 = [];
for (const d of 문서도볼폴더) 파일모으기(path.join(ROOT, d), 문서파일);

function 검사(파일들, { 옛상호도보나 }) {
  const 걸림 = [];
  for (const f of 파일들) {
    const 내용 = fs.readFileSync(f, 'utf8');
    내용.split('\n').forEach((line, i) => {
      if (예외.test(line)) return;                       // 「그건 틀린 표기다」라고 적은 줄
      // 한 줄에 여러 정규식이 걸려도 **한 번만** 센다
      if (틀린표기.some((r) => r.test(line))) {
        걸림.push({ f, 줄: i + 1, 종류: '틀린 상호 표기', 글: line.trim().slice(0, 90) });
      } else if (옛상호도보나 && 옛상호.test(line)) {
        걸림.push({ f, 줄: i + 1, 종류: '옛 상호가 코드에 남음', 글: line.trim().slice(0, 90) });
      }
    });
  }
  return 걸림;
}

// ── 자가시험 — 일부러 틀린 값을 넣어 **실제로 잡히는지** 본다 ──────────
{
  const 나쁜예 = ['주식회사 K라이프디자인입니다', '발행 주체는 K라이프디자인', '주식회사 케이라이프 디자인'];
  const 좋은예 = [`발행 주체는 ${정본}입니다`, 'KLifeDesign InC.'];
  let 실패 = 0;
  for (const s of 나쁜예) if (!틀린표기.some((r) => r.test(s))) { console.log(`  ⛔ 자가시험: 못 잡았다 — ${s}`); 실패++; }
  for (const s of 좋은예) if (틀린표기.some((r) => r.test(s))) { console.log(`  ⛔ 자가시험: 멀쩡한 것을 잡았다 — ${s}`); 실패++; }
  if (실패) { console.log('⛔ 검사기 자체가 틀렸다. 고치기 전에는 못 쓴다'); process.exit(1); }
  if (process.argv.includes('--selftest')) { console.log('✅ 자가시험 통과 (나쁜 예 3 · 좋은 예 2)'); process.exit(0); }
}

const 걸림 = [...검사(코드파일, { 옛상호도보나: true }), ...검사(문서파일, { 옛상호도보나: false })];

console.log(`상호 검사 — 코드 ${코드파일.length}개 · 문서 ${문서파일.length}개 (자가시험 5건 통과)`);
if (!걸림.length) {
  console.log(`✅ 「${정본}」과 어긋난 곳 0건`);
  process.exit(0);
}
for (const g of 걸림) {
  console.log(`  ⛔ ${path.relative(ROOT, g.f)}:${g.줄}  [${g.종류}]  ${g.글}`);
}
console.log(`\n⛔ ${걸림.length}건 — 상호는 **등기부 글자 그대로** 「${정본}」로 적는다`);
process.exit(1);
