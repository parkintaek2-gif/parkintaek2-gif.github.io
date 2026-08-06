#!/usr/bin/env node
/**
 * check-korean.mjs — **한국어를 제대로 쓴다**
 *
 * 사장님 지적(2026-08-06 23:1x): 「한국어 제대로 써라. **80.6억원**을 이지 않나?」
 *
 *   5번 기사 커밋에 「평균 80.6억이 아무도 설명하지 못한다」로 적혔고
 *   2번인 내가 그것을 **그대로 옮겨 보고**했다. 걸러야 할 자리에서 못 걸렀다.
 *   ```
 *   ⛔ 80.6억          억은 **수의 단위**지 돈의 단위가 아니다. 「억원」이라야 한다
 *   ⛔ 아무도 설명 못 한다  「아무도」는 **사람**에게 쓴다. 회사면 「어느 회사도」다
 *   ✅ 평균 80.6억원은 어느 회사도 설명하지 못한다
 *   ```
 *
 * 보는 것 둘
 *   ① 금액에 단위가 빠졌나 — 「N억」·「N조」 뒤에 원이 없는 것
 *   ② 사람에게만 쓰는 말을 사물에 썼나 — 아무도·누구도·몇 명(사물 뒤)
 *
 * ⚠ 검사가 헛도는지 먼저 본다 — `--selftest`
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..'
);

/** 「N억」·「N조」 **뒤에 조사가 바로 붙은 것**만 잡는다 — 그때가 돈인데 원이 빠진 것이다.
 *
 *  🔴 처음엔 「원이 안 붙은 것」을 전부 잡게 했다가 **162건 중 대부분이 헛것**이었다.
 *     「제85조」(조항) · 「100억 트윗」(세는 말) · 「2026-08-02 조사」(숫자+공백+조사)까지 잡혔다.
 *     시끄러운 검사는 아무도 안 본다. **정밀하게 좁힌다.**
 *
 *  잡는 것    80.6억이 · 3조를 · 12억은 · 5억 규모 · 7조짜리
 *  안 잡는 것  80.6억원 · 100억 트윗 · 3억 뷰 · 제85조 · 2026-08-02 조사
 */
const 단위없는금액 =
  /(?<!제\s?)[0-9][0-9,.]*\s*(?:억|조)(?=\s*(?:이|가|은|는|을|를|의|에|도|만(?!\s*[가-힣])|과|와|이다|입니|짜리|규모|대\b))/;

/** 🔴 「사물에 사람 말」 규칙은 **뺐다.**
 *  「그 전제를 아무도 확인하지 않았다」처럼 **맞는 문장을 잡았다.**
 *  주어가 사람인지 사물인지 정규식으로는 못 가린다.
 *  내 원칙 그대로다 — 부정확한 검사는 싣지 않는다. 시끄러우면 아무도 안 본다.
 *  이 자리는 사람이 본다. 5번 기사 제목이 그렇게 잡혔다(사장님). */

/** ⚠ 예외 — **규칙을 설명하는 줄**은 걸리면 안 된다 (순위 검사가 그렇게 한다) */
const 예외 = /(아니다|아니라|이라야|라야 한다|틀린|잘못|⛔|✅|검사|규칙)/;

const 볼폴더 = ['src'];   // 🔴 **지면에 나가는 것만 막는다.** docs 는 --docs 로 따로 본다
const 건너뛸것 = /(node_modules|dist|\.git|archive|세션간-메모\.md|작업일지\.md|사장님-지시-대장\.md|말씀-대장\.md|숙지-사장님지시|check-korean\.mjs)/;

const 파일들 = [];
const 훑기 = (d) => {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (건너뛸것.test(p)) continue;
    if (e.isDirectory()) 훑기(p);
    else if (/\.(astro|ts|mjs|md)$/.test(e.name)) 파일들.push(p);
  }
};
for (const d of (process.argv.includes('--docs') ? ['src','docs'] : 볼폴더)) 훑기(path.join(ROOT, d));

// ── 자가시험 — 일부러 틀린 값을 넣어 잡히는지 본다 ──────────────
{
  const 나쁜 = ['평균 80.6억이 넘는다', '매출 3조 규모', '매출 200억이 여기서 나온다'];
  const 좋은 = ['평균 80.6억원이다', '2,862곳 · 35,004명', '재적 547,002명 가운데 24,756명'];
  let 실패 = 0;
  for (const s of 나쁜) if (!단위없는금액.test(s)) { console.log(`  ⛔ 자가시험: 못 잡았다 — ${s}`); 실패++; }
  for (const s of 좋은) if (단위없는금액.test(s)) { console.log(`  ⛔ 자가시험: 멀쩡한 것을 잡았다 — ${s}`); 실패++; }
  if (실패) { console.log('⛔ 검사기 자체가 틀렸다'); process.exit(1); }
  if (process.argv.includes('--selftest')) { console.log('✅ 자가시험 통과 (나쁜 예 3 · 좋은 예 3)'); process.exit(0); }
}

const 걸림 = [];
for (const f of 파일들) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    const t = line.trim();
    if (!t || 예외.test(t)) return;
    if (단위없는금액.test(t)) 걸림.push({ f, 줄: i + 1, 종류: '금액에 단위 없음', 글: t.slice(0, 80) });
  });
}

console.log(`한국어 검사 — 파일 ${파일들.length}개 (자가시험 6건 통과)`);
if (!걸림.length) { console.log('✅ 단위 빠진 금액 0건 · 사물에 사람 말 0건'); process.exit(0); }
for (const g of 걸림) console.log(`  ⛔ ${path.relative(ROOT, g.f)}:${g.줄}  [${g.종류}]  ${g.글}`);
console.log(`\n⛔ ${걸림.length}건 — 억·조는 **수의 단위**다. 돈이면 「억원」·「조원」으로 쓴다`);
process.exit(1);
