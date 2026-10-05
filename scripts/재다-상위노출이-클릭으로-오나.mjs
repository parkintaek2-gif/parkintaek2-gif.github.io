#!/usr/bin/env node
/**
 * 재다-상위노출이-클릭으로-오나.mjs — **「10위 안에 떠 있다」가 「손님이 온다」인가.**
 *
 * ── 🔴 왜 만드나 (2026-10-06 · 5번) ───────────────────────────────────
 * 1번이 백년지도에서 짚었다 — 「지면 차원 평균 순위는 속아 넘어가기 쉽다」.
 * 제가 직접 재 보니 맞았고, **네 사이트 전부에서 같은 모양**이었다.
 *
 * ```
 *              지면평균   질의평균   숨긴노출   10위안   클릭
 * 100yearmap    6.2위     61.5위      97%      505장      0
 * seoulmarkets 20.0위     53.7위      81%      546장      8
 * kculturewire  7.9위     39.7위      98%      205장      3
 * ```
 * 「지면 평균 6위」는 좋아 보이지만, **사람이 실제로 치는 말(식별되는 질의)로는 40~62위**다.
 * 그 사이를 메우는 것은 구글이 숨긴 극희귀 질의 수백 개이고, 그것이 평균을 끌어올린다.
 *
 * ⛔ 이 수를 메모에만 적어 두면 다음 사람이 또 손으로 잰다. 그래서 자로 만든다.
 * ⚠ 이 자는 **관문이 아니다.** 빨간불로 배포를 막지 않는다 — 고칠 곳을 가리키는 자다.
 *
 * ── ⛔ 이 자가 «가르지 못하는» 것 ──────────────────────────────────────
 * 10위 안 노출이 많은데 클릭이 안 나오면 까닭이 둘인데, **GSC 자료로는 못 가른다.**
 * ```
 * ㉠ 그 말을 치는 사람이 거의 없다 (구글이 숨길 만큼 희귀하다)
 * ㉡ 뜨기는 뜨는데 «우리 지면이 그 물음의 답이 아니다»
 * ```
 * 숨겨진 질의는 볼 수 없으므로 자료로는 영영 못 가른다.
 * 가를 길은 하나뿐이다 — **검색량이 있는 말로 지면 몇 장을 세워 보고 그것만 따로 재는 것.**
 * ⛔ 못 가르는 것을 가른 척 적지 않는다. 화면에 둘 다 적는다.
 *
 * 쓰는 법
 *   node scripts/재다-상위노출이-클릭으로-오나.mjs --자가시험
 *   node scripts/재다-상위노출이-클릭으로-오나.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
export const 뿌리 = path.resolve(여기, '..');
export const 자료방 = path.join(뿌리, 'src', 'data');

/**
 * 자리별 클릭률 어림.
 * ⚠ **바깥에서 가져온 수다. 우리가 잰 것이 아니다.** 그래서 낮은 쪽으로 잡는다 —
 *   낮게 잡고도 실제가 한참 모자라면 그것은 분명한 것이다.
 * ⛔ 이 수로 「우리 클릭률이 나쁘다」를 단정하지 않는다. 「이만큼 차이가 난다」까지만 말한다.
 */
export const 자리별클릭률 = { 1: 0.20, 2: 0.12, 3: 0.08, 4: 0.06, 5: 0.05, 6: 0.04, 7: 0.03, 8: 0.025, 9: 0.02, 10: 0.02 };

export const 사이트들 = [
  { 이름: '100yearmap', 질의: 'gsc-100y-2026', 지면: 'gsc-100y-page-2026' },
  { 이름: 'seoulmarkets', 질의: 'gsc-seoulmarkets-2026', 지면: 'gsc-seoulmarkets-page-2026' },
  { 이름: 'kculturewire', 질의: 'gsc-kcw-2026', 지면: 'gsc-kcw-page-2026' },
  { 이름: 'klifemap', 질의: 'gsc-klifemap-2026', 지면: 'gsc-klifemap-page-2026' },
];

/** 그 머리로 시작하는 가장 나중 파일. ⛔ 없으면 null — 「0개」가 아니다 */
export function 가장나중(머리, 방 = 자료방, 목록읽기 = null) {
  let 것;
  try { 것 = 목록읽기 ? 목록읽기() : fs.readdirSync(방); } catch { return null; }
  const 고른것 = 것.filter((n) => n.startsWith(머리) && n.endsWith('.json')).sort();
  return 고른것.length ? 고른것[고른것.length - 1] : null;
}

export const 합 = (줄들, 칸) => (줄들 || []).reduce((s, r) => s + (r[칸] ?? 0), 0);

/** 노출로 무게를 준 평균 순위. ⛔ 노출이 0이면 null — 0 으로 적지 않는다 */
export function 가중순위(줄들) {
  const n = 합(줄들, 'impressions');
  if (!n) return null;
  return (줄들 || []).reduce((s, r) => s + (r.position ?? 0) * (r.impressions ?? 0), 0) / n;
}

/**
 * 10위 안 지면에서 «기대 클릭»과 «실제 클릭»을 잰다.
 * ⛔ 10위 밖은 세지 않는다 — 자리별 클릭률 어림이 거기서는 믿을 것이 못 된다.
 */
export function 십위안재기(지면줄들, 클릭률 = 자리별클릭률) {
  let 노출 = 0; let 기대 = 0; let 클릭 = 0; let 장수 = 0;
  for (const r of 지면줄들 || []) {
    if (!(r.position <= 10)) continue;
    const 자리 = Math.max(1, Math.min(10, Math.round(r.position)));
    장수 += 1;
    노출 += r.impressions ?? 0;
    기대 += (r.impressions ?? 0) * 클릭률[자리];
    클릭 += r.clicks ?? 0;
  }
  return { 장수, 노출, 기대: Number(기대.toFixed(1)), 클릭 };
}

/** 구글이 질의를 숨긴 몫. ⛔ 지면 노출이 0이면 null — 못 쟀다 */
export function 숨긴몫(지면노출, 질의노출) {
  if (!지면노출) return null;
  const v = (지면노출 - 질의노출) / 지면노출;
  return Math.max(0, Math.min(1, v));
}

function 자가시험() {
  let 통 = 0; let 탈 = 0;
  const 검 = (이름, 참) => { if (참) { 통++; console.log('✅', 이름); } else { 탈++; console.log('🔴', 이름); } };

  검('자리별 클릭률이 열 자리 다 있다', Object.keys(자리별클릭률).length === 10);
  검('⛔ 1위가 10위보다 높다 — 거꾸로 적으면 기대가 거꾸로 난다',
    자리별클릭률[1] > 자리별클릭률[10]);

  검('노출로 무게를 준다 — 많이 뜬 쪽이 평균을 끈다',
    가중순위([{ position: 1, impressions: 99 }, { position: 100, impressions: 1 }]) < 5);
  검('⛔ 노출이 0이면 null — 0위라고 적지 않는다',
    가중순위([{ position: 5, impressions: 0 }]) === null && 가중순위([]) === null);

  const r = 십위안재기([
    { position: 1, impressions: 100, clicks: 0 },
    { position: 50, impressions: 900, clicks: 0 },   /* 10위 밖 — 안 센다 */
  ]);
  검('⛔ 10위 밖은 안 센다', r.노출 === 100 && r.장수 === 1);
  검('기대 클릭을 자리로 센다 — 1위 100노출이면 20', Math.abs(r.기대 - 20) < 0.01);
  검('실제 클릭을 그대로 센다', r.클릭 === 0);
  검('⛔ 빈 것에도 안 터진다', 십위안재기([]).노출 === 0 && 십위안재기(null).노출 === 0);
  검('⛔ position 이 없는 줄은 안 센다 — 0위로 읽지 않는다',
    십위안재기([{ impressions: 5, clicks: 1 }]).장수 === 0);

  검('숨긴 몫을 잰다 — 1000 가운데 50만 식별되면 95%',
    Math.abs(숨긴몫(1000, 50) - 0.95) < 0.001);
  검('⛔ 지면 노출이 0이면 null', 숨긴몫(0, 0) === null);
  검('⛔ 질의가 지면보다 많아도 음수를 내지 않는다', 숨긴몫(10, 20) === 0);

  검('⛔ 파일이 없으면 null — 「0개」가 아니다', 가장나중('없는머리', 자료방, () => []) === null);
  검('가장 나중 파일을 고른다',
    가장나중('x-', 자료방, () => ['x-2026-01-01.json', 'x-2026-09-09.json', 'y-2026-12-31.json'])
      === 'x-2026-09-09.json');

  검('사이트 넷을 다 본다', 사이트들.length === 4);

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통} 통과`);
  process.exit(탈 ? 1 : 0);
}

function 주다() {
  if (process.argv.includes('--자가시험')) return 자가시험();

  const 읽기 = (f) => { const a = JSON.parse(fs.readFileSync(path.join(자료방, f), 'utf8')); return a.rows ?? a; };

  console.log('■ 「10위 안에 떠 있다」가 「손님이 온다」인가 — 사이트마다 잰다');
  console.log('   ⚠ 「기대 클릭」은 바깥에서 가져온 자리별 클릭률 어림이다. 우리가 잰 수가 아니다.');
  console.log('     낮은 쪽으로 잡았다 — 낮게 잡고도 모자라면 그것은 분명한 것이다.\n');
  console.log('사이트          지면평균  질의평균  숨긴노출  10위안   노출  기대클릭  실제클릭');
  console.log('─'.repeat(82));

  const 못잰것 = [];
  for (const s of 사이트들) {
    const qf = 가장나중(s.질의);
    const pf = 가장나중(s.지면);
    if (!qf || !pf) { 못잰것.push(`${s.이름} — ${!qf ? '질의' : '지면'} 파일이 없다`); continue; }
    const 질의 = 읽기(qf); const 지면 = 읽기(pf);
    const 지면노출 = 합(지면, 'impressions');
    const 숨 = 숨긴몫(지면노출, 합(질의, 'impressions'));
    const t = 십위안재기(지면);
    const 모자람 = t.기대 > 0 ? t.클릭 / t.기대 : null;
    console.log(`${s.이름.padEnd(15)}`
      + `${String(가중순위(지면)?.toFixed(1) ?? '—').padStart(7)}위`
      + `${String(가중순위(질의)?.toFixed(1) ?? '—').padStart(8)}위`
      + `${String(숨 == null ? '—' : Math.round(숨 * 100) + '%').padStart(9)}`
      + `${String(t.장수 + '장').padStart(8)}`
      + `${String(t.노출).padStart(7)}`
      + `${String(t.기대.toFixed(0)).padStart(9)}`
      + `${String(t.클릭).padStart(9)}`
      + (모자람 == null ? '' : `   (${Math.round(모자람 * 100)}%)`));
    console.log(`${''.padEnd(15)}  (질의 ${qf} · 지면 ${pf})`);
  }

  for (const x of 못잰것) console.log(`⚠ 못 쟀다 — ${x}`);

  console.log('\n⭐ 10위 안 클릭이 기대에 한참 못 미치면 까닭은 둘이다 —');
  console.log('   ㉠ 그 말을 치는 사람이 거의 없다 (구글이 질의를 숨길 만큼 희귀하다)');
  console.log('   ㉡ 뜨기는 뜨는데 «우리 지면이 그 물음의 답이 아니다»');
  console.log('⛔ 이 자는 그 둘을 «가르지 못한다» — 숨겨진 질의는 볼 수 없다.');
  console.log('   가를 길은 하나뿐이다: 검색량이 «있는» 말로 지면 몇 장을 세우고 그것만 따로 재는 것.');
  console.log('⚠ 이 자는 관문이 아니다 — 배포를 막지 않는다. 고칠 곳을 가리킬 뿐이다.');
  process.exit(0);
}

/* ⛔ 「걸림돌 없는 꼭대기 부름」을 만들지 않는다 — import 한 쪽의 걸음을 가로챈다 */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) 주다();
