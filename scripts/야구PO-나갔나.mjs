#!/usr/bin/env node
/**
 * 야구PO-나갔나.mjs — **일요일 저녁, 야구 기사가 «실제로 나갔는지» 보고 안 갔으면 외친다.**
 *
 * ── 🔴 왜 (2026-10-24 · 사장님) ───────────────────────────────────
 * 「내일 프로야구 플레이오프 1차전 2시에 대구에서 삼성과 기아가 경기를 한다.
 *  이것도 나중에 기사써야함..조치해놔」
 *
 * 오늘 하루에만 **세 겹의 자물쇠가 저마다 따로** 사장님이 시키신 기사를 막고 있었다 —
 * 회차가 뜨는 시각, 회차 지침의 「주말이라 쉰다」, 거두는 자의 주말 자물쇠.
 * 셋 다 열었고 재 봤지만, ⛔ **「열어 뒀다」를 「나갔다」로 읽지 않는다.**
 *
 * ⭐ 이 자는 고치지 않는다. **안 나갔으면 세션간 메모에 5번을 불러 세운다.**
 *   사람이 안 보고 있어도 자가 본다.
 *
 * 실행: node scripts/야구PO-나갔나.mjs   ·   검사: node scripts/야구PO-나갔나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 보낸메일길 = path.join(뿌리, 'docs', '보낸메일.tsv');
export const 메모길 = path.join(뿌리, 'docs', '세션간-메모.md');
export const 보는날 = '2026-10-25';

/** 제목이 그날 야구 PO 기사인가 — 회차 이름으로도, 소재로도 알아본다 */
export function 야구기사인가(제목) {
  const t = String(제목 ?? '');
  if (!/\[스포츠/.test(t)) return false;
  /* ⛔ \b 는 한글 앞뒤에서 «경계로 치지 않는다» — \b15시\b 는 영영 안 맞는다 */
  return /플레이오프|PO\s*1차전|야구|삼성|KIA|기아/i.test(t) || /(^|\s)15시(\s|$)/.test(t);
}

/** 그날 보낸메일 줄 가운데 야구 기사가 있나 */
export function 나갔나(줄들, 날 = 보는날) {
  for (const 줄 of 줄들) {
    const 칸 = String(줄).split('\t');
    if (칸.length < 4) continue;
    if (!String(칸[0]).startsWith(날)) continue;
    if (야구기사인가(칸[3])) return 칸[0];                 /* 보낸 시각을 돌려준다 */
  }
  return null;
}

export function 부르는글(때, 갔나) {
  const p = (n) => String(n).padStart(2, '0');
  const 날 = `${때.getFullYear()}-${p(때.getMonth() + 1)}-${p(때.getDate())}`;
  const 시각 = `${p(때.getHours())}:${p(때.getMinutes())}`;
  if (갔나) {
    return `\n## [자물쇠→5번] ${날} ${시각} · ✅ 야구 PO 1차전 기사가 나갔습니다 (${갔나})\n`;
  }
  return [
    '',
    `## [자물쇠→5번] ${날} ${시각} · 🔴 야구 PO 1차전 기사가 «아직 안 나갔습니다»`,
    '',
    '사장님이 어제 직접 이르신 기사입니다 — 「내일 프로야구 플레이오프 1차전 2시에',
    '대구에서 삼성과 기아가 경기를 한다. 이것도 나중에 기사써야함..조치해놔」',
    '',
    '열어 둔 길 — 「스포츠 15시」 회차를 빌려 18:00 에 띄우고, 거두는 자는 10분마다 돌며,',
    '오늘은 자정까지 열려 있습니다(밤까지여는날).',
    '',
    '⭐ 지금 할 것',
    '   ① 회차가 떴는지 본다 — node scripts/잰다-회차목록.mjs 의 「스포츠 15시」 마지막 실행',
    '   ② 떴는데 안 거둬졌으면 손으로 거둔다 — node scripts/collect-jbnews-sports-articles.mjs --회차=15',
    '   ③ 회차가 아예 안 떴으면 내가 직접 쓴다 (중부매일 자체기사 지침 v7)',
    '',
    '⛔ 「열어 뒀다」를 「나갔다」로 읽지 마십시오. 이 줄은 자가 재서 적은 것입니다.',
    '',
  ].join('\n');
}

function 자가시험() {
  const 것 = [];
  const 참 = (이름, 값) => 것.push([이름, !!값]);
  const 줄 = (날시, 제목) => `${날시}\tu5@klifedesign.net\tparkintaek2@gmail.com\t${제목}\tid`;

  참('🔴 야구 기사를 알아본다',
    나갔나([줄('2026-10-25 18:31', '[스포츠·데스킹후] 2026-10-25 — 삼성, KIA 꺾고 PO 1차전 선승')]) === '2026-10-25 18:31');
  참('회차 이름(15시)으로도 알아본다',
    나갔나([줄('2026-10-25 18:40', '[스포츠] 2026-10-25 15시 — 웹 검색함')]) === '2026-10-25 18:40');
  참('⛔ 같은 날 다른 기사를 야구로 세지 않는다',
    나갔나([줄('2026-10-25 11:20', '[스포츠·데스킹후] 2026-10-25 — 롤드컵 2라운드 종합')]) === null);
  참('⛔ KBL 기사를 야구로 세지 않는다',
    나갔나([줄('2026-10-25 16:10', '[스포츠·데스킹후] 2026-10-25 — 창원 LG, 원주 DB 제압')]) === null);
  참('⛔ 다른 날 야구 기사를 오늘 것으로 세지 않는다',
    나갔나([줄('2026-10-18 20:00', '[스포츠·데스킹후] 2026-10-18 — 준PO 삼성 승')]) === null);
  참('⛔ 결제 메일을 기사로 세지 않는다',
    나갔나([줄('2026-10-25 18:00', '[결제] 끝났습니다')]) === null);
  참('⛔ 빈 줄·짧은 줄에 걸려 넘어지지 않는다', 나갔나(['', 'abc', '\t\t']) === null);
  참('안 나갔으면 할 일을 적어 준다', /지금 할 것/.test(부르는글(new Date(), null)));
  참('나갔으면 짧게 적는다', /✅ 야구 PO 1차전 기사가 나갔습니다/.test(부르는글(new Date(), '2026-10-25 18:31')));
  참('⛔ 안 나간 것을 나갔다고 적지 않는다',
    !/✅ 야구 PO 1차전 기사가 나갔습니다/.test(부르는글(new Date(), null))
    && /«아직 안 나갔습니다»/.test(부르는글(new Date(), null)));

  for (const [이름, 됐나] of 것) console.log((됐나 ? '✅ ' : '🔴 ') + 이름);
  const 깨진것 = 것.filter(([, v]) => !v).length;
  console.log(깨진것 ? `\n🔴 자가시험 ${깨진것} 깨졌다` : `\n✅ 자가시험 ${것.length} 통과`);
  return 깨진것 ? 1 : 0;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험());
  const 이제 = new Date();
  let 줄들 = [];
  try { 줄들 = fs.readFileSync(보낸메일길, 'utf8').split(/\r?\n/); }
  catch (e) { console.log('⬜ 보낸메일 기록을 못 읽었다 — ' + e.message + ' (0 으로 치지 않는다)'); }
  const 갔나 = 나갔나(줄들);
  fs.appendFileSync(메모길, 부르는글(이제, 갔나), 'utf8');
  console.log(`[${이제.toTimeString().slice(0, 8)}] ` + (갔나 ? `✅ 나갔다 — ${갔나}` : '🔴 아직 안 나갔다 — 메모에 5번을 불러 세웠다'));
}
