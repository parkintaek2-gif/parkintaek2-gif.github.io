#!/usr/bin/env node
/**
 * check-locked-wells.mjs — **「막혔다」고 적힌 우물이 정말 막혀 있나**를 기계가 잰다.
 *
 * ── 왜 생겼나 (2026-09-21 21:2x · 5번) ─────────────────────────────────────
 * 사장님께 「일본은 EDINET 열쇠 발급이 막혀 재무제표가 0이다」라고 보고했다.
 * 사장님: **「EDINET 열쇠 발급>>>어제 했잖아」**
 *
 * 재 보니 열쇠는 `.env` 에 있었고 API 는 이렇게 답했다.
 * ```
 * 2026-09-18  HTTP 200  402건   (유가증권보고서 95건)
 * XBRL 한 건 내려받기  HTTP 200 · 1,261KB · ZIP 맞음
 * ```
 * **막힌 것이 없었다.** 나는 저장소 문서(`docs/편지-EDINET-열쇠-상태.txt`)에 적힌
 * 「MFA 화면에서 끊겼다」를 그대로 옮겼고, 그 문서는 열쇠가 나오기 «전»에 쓴 것이었다.
 *
 * ⛔ **「막혔다」는 그날의 상태다. 다음 날에도 맞다는 보장이 없다.**
 *   그런데 우리 저장소는 막힘을 «문서»에 적어 두고, 다음 세션이 그 문서를 읽고
 *   「아직 막혀 있다」로 옮긴다. 문서는 스스로 낡는데 아무도 다시 안 잰다.
 * ⭐ 그래서 **문장이 아니라 검사로 둔다** — 우리 강령 ④ 그대로다.
 *   이 자가 열쇠마다 «실제로 한 번 불러» 보고, 막혔다던 것이 열렸으면 크게 알린다.
 *
 * 쓰는 법
 *   node scripts/check-locked-wells.mjs
 *   node scripts/check-locked-wells.mjs --자가시험
 *
 * ⛔ 열쇠 값을 화면·로그·커밋 어디에도 안 찍는다. 있고 없고와 응답 코드만 말한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 재는 우물들.
 *   막혔다고적힘 : 저장소 문서가 「못 쓴다」고 말하고 있는가
 *   여는법       : 실제로 한 번 불러 본다. { 열렸나, 말 } 을 돌려준다
 */
export const 우물들 = [
  {
    이름: 'EDINET (일본 금융청 — 재무제표·공시)',
    열쇠이름: 'EDINET_KEY',
    막혔다고적힘: false,   /* 2026-09-21 에 열린 것을 확인하고 내렸다 */
    적힌곳: 'docs/편지-EDINET-열쇠-상태.txt (열쇠가 나오기 전에 쓴 글이다)',
    async 여는법(열쇠) {
      /* 평일을 고른다 — 주말은 0건이라 「안 된다」로 잘못 읽힌다 */
      const d = new Date();
      for (let i = 1; i <= 7; i++) {
        const t = new Date(d); t.setDate(d.getDate() - i);
        if (t.getDay() === 0 || t.getDay() === 6) continue;
        const 날 = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
        const r = await fetch(`https://api.edinet-fsa.go.jp/api/v2/documents.json?date=${날}&type=2&Subscription-Key=${열쇠}`);
        if (!r.ok) return { 열렸나: false, 말: `HTTP ${r.status} (${날})` };
        const j = await r.json().catch(() => null);
        const 건 = (j?.results || []).length;
        if (건) return { 열렸나: true, 말: `${날} ${건}건 · 유가증권보고서 ${(j.results.filter((x) => String(x.docTypeCode) === '120')).length}건` };
      }
      return { 열렸나: false, 말: '이레를 다 봐도 0건' };
    },
  },
];

/** 열쇠를 읽는다 — ⛔ 값을 돌려주되 «절대 찍지 않는다» */
export function 열쇠읽기(이름, 뿌리길 = 뿌리) {
  if (process.env[이름]) return process.env[이름];
  try {
    const 글 = fs.readFileSync(path.join(뿌리길, '.env'), 'utf8');
    return 글.match(new RegExp(`^${이름}=(.+)$`, 'm'))?.[1]?.trim() || '';
  } catch { return ''; }
}

/**
 * 판정 — 무엇을 알려야 하나.
 * ⭐ **제일 중요한 것은 「막혔다더니 열렸다」다.** 그것이 일을 되살리는 신호다.
 */
export function 판정(막혔다고적힘, 열쇠있나, 열렸나) {
  if (!열쇠있나) return { 등급: '🔴', 말: '열쇠가 없다 — 이것은 진짜 막힘이다' };
  if (열렸나 && 막혔다고적힘) return { 등급: '⭐', 말: '문서는 막혔다는데 «열린다» — 문서를 고치고 일을 시작한다' };
  if (열렸나) return { 등급: '✅', 말: '열린다' };
  if (막혔다고적힘) return { 등급: '⬜', 말: '적힌 대로 아직 막혀 있다' };
  return { 등급: '🔴', 말: '열려 있어야 하는데 «안 열린다» — 그 사이 끊겼다' };
}

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);
  검('열쇠가 없으면 진짜 막힘이다', 판정(true, false, false).등급 === '🔴');
  검('열쇠가 없으면 「열렸다」여도 막힘이다', 판정(false, false, true).등급 === '🔴');
  검('⭐ 막혔다더니 열리면 크게 알린다', 판정(true, true, true).등급 === '⭐');
  검('그때 문서를 고치라고 말한다', 판정(true, true, true).말.includes('문서를 고치고'));
  검('그냥 열리면 초록', 판정(false, true, true).등급 === '✅');
  검('적힌 대로 막혀 있으면 흠이 아니다', 판정(true, true, false).등급 === '⬜');
  검('열려 있어야 하는데 안 열리면 빨강', 판정(false, true, false).등급 === '🔴');
  검('그때 「그 사이 끊겼다」고 말한다', 판정(false, true, false).말.includes('끊겼다'));
  검('EDINET 이 목록에 있다', 우물들.some((w) => w.열쇠이름 === 'EDINET_KEY'));
  검('EDINET 은 이제 «막힘»으로 안 적혀 있다', 우물들.find((w) => w.열쇠이름 === 'EDINET_KEY').막혔다고적힘 === false);
  검('우물마다 여는 법이 있다', 우물들.every((w) => typeof w.여는법 === 'function'));
  검('⛔ 열쇠 값을 찍는 코드가 없다',
    !fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').match(/console\.log\([^)]*열쇠\s*[,)]/));
  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

if (내가진입점) {
  console.log('■ 막혔다는 우물이 정말 막혀 있나 —',
    new Date().toLocaleString('ko-KR'), '\n');
  let 되살릴것 = 0, 흠 = 0;
  for (const w of 우물들) {
    const 열쇠 = 열쇠읽기(w.열쇠이름);
    let 결과 = { 열렸나: false, 말: '안 재 봤다' };
    if (열쇠) { try { 결과 = await w.여는법(열쇠); } catch (e) { 결과 = { 열렸나: false, 말: String(e?.message ?? e).slice(0, 80) }; } }
    const p = 판정(w.막혔다고적힘, !!열쇠, 결과.열렸나);
    if (p.등급 === '⭐') 되살릴것++;
    if (p.등급 === '🔴') 흠++;
    console.log(`   ${p.등급} ${w.이름}`);
    console.log(`      열쇠 ${열쇠 ? '있다' : '없다'} · ${결과.말}`);
    console.log(`      ⇒ ${p.말}`);
    if (w.적힌곳) console.log(`      (문서: ${w.적힌곳})`);
  }
  if (되살릴것) console.log(`\n⭐ ${되살릴것}개가 «막혔다더니 열렸다» — 그 나라 일을 지금 시작한다`);
  else if (흠) console.log(`\n🔴 흠 ${흠}개`);
  else console.log('\n✅ 적힌 것과 실제가 같다');
  process.exit(흠 ? 1 : 0);
}
