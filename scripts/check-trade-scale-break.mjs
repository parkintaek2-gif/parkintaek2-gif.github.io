#!/usr/bin/env node
/**
 * check-trade-scale-break.mjs — 🔒 잠금쇠.
 *
 * 무서운 까닭(2026-08-27): 주석이 «이미 있었는데도» 넉 달 뒤 다른 기사가 같은 함정에 빠졌다.
 * 사람이 기억해서 지키는 구조라 그렇다. 강령 ④ — 「규칙은 문장이 아니라 검사로 둔다」.
 *
 * 무엇을 잡나: trade-country-monthly.json(관세청/KOSIS, 2026-03 스케일 브레이크)을 근거로 하면서
 *   본문에 «절대 달러 수준»($…bn/조 원 등)을 실은 기사가, 그 브레이크를 밝히는 주석이 없으면 운다.
 *   → 절대 수준은 브레이크를 가로지르면 못 믿는다. 비율/순위로 쓰거나, 밝히거나, 내려야 한다.
 *   [[6번-무역데이터-스케일브레이크]]
 *
 * 자가시험(늘 통과하는 자는 자가 아니다 — 깨뜨려 본다):
 *   node scripts/check-trade-scale-break.mjs --self-test
 * 전체 검사:
 *   node scripts/check-trade-scale-break.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART = path.join(ROOT, 'content', 'articles');

// 이 데이터셋을 근거로 삼았다는 표지 (출처/본문)
const TRADE_SOURCE = /DT_1R11006|korea customs|관세청|customs partner-country|trade-country-monthly/i;
// 절대 «달러 수준» — $12bn / $12.3bn / +$5.0bn (수·소수 모두). 퍼센트·비율은 안 잡는다.
const ABS_DOLLAR = /[+\-−]?\$\s?\d+(?:\.\d+)?\s?(?:bn|billion|B)\b/;
// 브레이크를 밝히는 주석
const DISCLOSED = /scale break|scale-break|스케일\s*브레이크|break from march|march 2026 (?:break|scale)|반영해 (?:비율|순위)|reported as shares because|ranked rather than levelled|not the (?:precise|exact) (?:deficit|dollar)/i;

function splitFrontmatter(rawIn) {
  const raw = String(rawIn).replace(/\r\n/g, '\n'); // CRLF 정규화 — 줄바꿈에 좌우되지 않게
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { fm: '', body: raw };
  return { fm: m[1], body: m[2] };
}

// 한 기사가 위험한가: (근거가 무역데이터) && (본문에 절대 달러 수준) && (브레이크 주석 없음)
export function isRisky(raw) {
  const { fm, body } = splitFrontmatter(raw);
  if (/^draft:\s*true/m.test(fm)) return false;        // 내린 것은 손님에게 안 나간다
  const wholeForSource = fm + '\n' + body;
  if (!TRADE_SOURCE.test(wholeForSource)) return false; // 이 데이터셋 근거 아님
  if (!ABS_DOLLAR.test(body)) return false;             // 절대 달러 수준을 안 씀 (비율/순위만)
  if (DISCLOSED.test(fm + '\n' + body)) return false;   // 브레이크를 밝혔음
  return true;                                          // 근거가 무역+절대달러+주석없음 → 운다
}

function scan() {
  const files = fs.readdirSync(ART).filter((f) => f.endsWith('.md'));
  const bad = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(ART, f), 'utf8');
    if (isRisky(raw)) bad.push(f);
  }
  return bad;
}

function selfTest() {
  const source = 'sources:\n  - org: "Korea Customs Service (via KOSIS)"\n    api: "table DT_1R11006_FRM101 / 360"';
  // ① 나쁜 기사 — 무역근거 + 절대달러 + 주석없음 → 반드시 잡혀야 한다 (깨뜨리기)
  const badArt = `---\ntitle: "x"\n${source}\ndraft: false\n---\nKorea's surplus with the US rose to **$50.0bn** in H1 2026.\n`;
  // ② 좋은 기사 A — 브레이크를 밝힘 → 통과
  const okDisclosed = `---\ntitle: "x"\n${source}\ndraft: false\n---\nKorea's deficit is **$22.7bn**, but there is a scale break from March 2026, so we report the ranking.\n`;
  // ③ 좋은 기사 B — 비율만 (절대 달러 없음) → 통과
  const okShares = `---\ntitle: "x"\n${source}\ndraft: false\n---\nChina is **23.5% of imports**; the US **17.7% of exports**.\n`;
  // ④ 좋은 기사 C — 무역데이터 근거가 아님(달러는 있으나 다른 출처) → 통과
  const okOther = `---\ntitle: "x"\nsources:\n  - org: "Bank of Korea"\n---\nThe won moved to **$1.3bn** in reserves.\n`;
  // ⑤ 내린 나쁜 기사 — draft:true 라 손님에게 안 나간다 → 통과
  const okDraft = `---\ntitle: "x"\n${source}\ndraft: true\n---\nKorea's surplus rose to **$50.0bn** in H1 2026.\n`;

  const cases = [
    ['badArt(잡혀야)', badArt, true],
    ['okDisclosed', okDisclosed, false],
    ['okShares', okShares, false],
    ['okOther', okOther, false],
    ['okDraft', okDraft, false],
  ];
  let pass = 0;
  for (const [name, raw, want] of cases) {
    const got = isRisky(raw);
    const ok = got === want;
    console.log(`${ok ? '✅' : '❌'} ${name}: risky=${got} (want ${want})`);
    if (ok) pass++;
  }
  if (pass === cases.length) { console.log(`\n✅ 자가시험 ${pass}/${cases.length} 통과 — 나쁜 것은 잡고 좋은 것은 통과`); process.exit(0); }
  console.error(`\n❌ 자가시험 ${pass}/${cases.length} — 검사가 헛돈다`); process.exit(1);
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  const bad = scan();
  if (bad.length === 0) { console.log('✅ 무역 절대달러 스케일-브레이크 검사 — 넘은 곳 0건'); process.exit(0); }
  console.error('🔴 스케일-브레이크 위험 기사 (절대 달러 수준 + 브레이크 주석 없음):');
  for (const f of bad) console.error('  · ' + f);
  console.error('\n→ 비율·순위로 바꾸거나, 브레이크를 밝히거나, draft:true 로 내리십시오. [[6번-무역데이터-스케일브레이크]]');
  process.exit(1);
}

const IS_MAIN = import.meta.url === `file://${process.argv[1]}` || fileURLToPath(import.meta.url) === process.argv[1];
if (IS_MAIN) main();
