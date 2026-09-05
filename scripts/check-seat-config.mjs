#!/usr/bin/env node
/**
 * check-seat-config.mjs — **자리마다 «단추 · 지킴이 · 실제 대화록»이 같은 곳을 보나.**
 *
 * ── 🔴 왜 생겼나 (2026-09-05) ────────────────────────────────
 * 사장님: 「**1번 열어라 세션입구에서 안 열려…대화가 없단다**」
 *        「**이런 황당한 일이 다시는 반복안되게 조치해**」
 *
 * `seat-watchdog.mjs` 에 낡은 줄 하나가 있었다 —
 * ```
 *   자리폴더 = 번호==='1' ? 'C:\\Users\\USER\\.claude' : `…\\.claude-u${번호}`
 *   주석: 「1번은 아직 예전 계정이다(9월 2일에 옮긴다)」   ← 그날은 9월 5일이었다
 * ```
 * 그래서 셋이 갈라졌다 —
 * ```
 *   단추(1번_KLifeMap.cmd)  →  .claude-u1 에서 resume  →  「대화가 없다」
 *   지킴이                  →  .claude    에서 resume  →  대화는 저기로 쌓임
 * ```
 * ⇒ **나흘 동안 아무도 몰랐다.** 깨울수록 사장님 본인 계정 폴더에만 쌓였고,
 *   사장님이 단추를 누르면 빈 자리가 열렸다. 그리고 그 나흘치 대화는 **되찾지 못했다.**
 *
 * ⭐ 강령 넷째 — 「규칙은 문장이 아니라 검사로 둔다. 말로 하는 규칙은 잊힌다.」
 *   그래서 이 자가 셋을 맞대 본다. 사람이 눈으로 보는 한 또 나흘을 모른다.
 *
 * ── ⛔ 이 자가 안 하는 것 ──────────────────────────────
 * ⛔ 대화록 «안»을 읽지 않는다. 어느 폴더에서 자라는지만 본다
 * ⛔ 못 찾은 것을 「없다」로 적지 않는다 — 「못 쟀다」로 나눠 적는다
 *
 * 쓰는 법
 *   node scripts/check-seat-config.mjs --자가시험
 *   node scripts/check-seat-config.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 입구 = 'C:/Users/USER/Desktop/00_세션입구';
const 현재 = path.join(입구, '_현재');
const 자리들 = ['1', '2', '3', '4', '5', '6'];

/** 단추(.cmd)가 정한 설정폴더를 읽는다 */
export function 단추폴더(cmd글) {
  const m = String(cmd글 ?? '').match(/set\s+CLAUDE_CONFIG_DIR=(.+)/i);
  return m ? m[1].trim() : null;
}

/** 지킴이가 정한 설정폴더 — 자리 번호를 넣으면 나온다 */
export function 지킴이폴더(지킴이글, 번호) {
  const s = String(지킴이글 ?? '');
  /* 🔴 예외가 «다시» 생기면 여기서 잡는다. 낡은 예외가 오늘 그 사고를 만들었다 */
  /* ⚠ 조건과 `?` 사이에 줄바꿈이 있다. `[^\n]*` 로 두었다가 자가시험이 잡았다 —
     실제 사고를 낸 코드가 여러 줄이었으니, 그 여러 줄을 그대로 넣어 시험한 것이 옳았다 */
  const 예외 = s.match(/번호\s*===\s*['"](\d)['"][\s\S]{0,80}?\?\s*'([^']+)'/);
  if (예외 && 예외[1] === String(번호)) return { 폴더: 예외[2].replace(/\\\\/g, '\\'), 예외인가: true };
  const 보통 = s.match(/`([^`]*\.claude-u\$\{번호\})`/);
  if (보통) return { 폴더: 보통[1].replace(/\$\{번호\}/, String(번호)).replace(/\\\\/g, '\\'), 예외인가: false };
  return { 폴더: null, 예외인가: false };
}

/** 두 길이 같은 곳을 가리키나 — 윈도는 대소문자·빗금을 안 가린다 */
export function 같은길인가(a, b) {
  const 다듬 = (s) => String(s ?? '').trim().replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  if (!a || !b) return false;
  return 다듬(a) === 다듬(b);
}

/** 그 설정폴더 안에서 오늘 자란 대화록이 몇 개인가 */
export function 오늘자란수(설정폴더, 오늘시작밀리초, 읽기 = fs) {
  const 뿌리 = path.join(String(설정폴더).replace(/\\/g, '/'), 'projects');
  if (!읽기.existsSync(뿌리)) return null;   /* ⛔ 없으면 0 이 아니라 «못 쟀다» 다 */
  let n = 0;
  for (const d of 읽기.readdirSync(뿌리, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const 방 = path.join(뿌리, d.name);
    for (const f of 읽기.readdirSync(방)) {
      if (!f.endsWith('.jsonl')) continue;
      try { if (읽기.statSync(path.join(방, f)).mtimeMs >= 오늘시작밀리초) n += 1; } catch { /* 지나간다 */ }
    }
  }
  return n;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실 = []; let 통 = 0;
  const 같나 = (이름, 본, 기대) => {
    const a = JSON.stringify(본); const b = JSON.stringify(기대);
    if (a === b) 통 += 1; else 실.push(`${이름}: ${a} ≠ ${b}`);
  };

  같나('단추에서 설정폴더를 읽는다',
    단추폴더('set CLAUDE_SEAT=1\nset CLAUDE_CONFIG_DIR=C:\\Users\\USER\\.claude-u1\ncd /d x'),
    'C:\\Users\\USER\\.claude-u1');
  같나('없으면 null 이다', 단추폴더('set CLAUDE_SEAT=1'), null);
  같나('빈 글도 null 이다', 단추폴더(''), null);

  /* 🔴 오늘 사고를 낸 그 줄을 그대로 넣어 본다 */
  const 낡은지킴이 = "const 자리폴더 = 번호 === '1' || 번호 === 1\n"
    + "      ? 'C:\\\\Users\\\\USER\\\\.claude'\n"
    + '      : `C:\\\\Users\\\\USER\\\\.claude-u${번호}`;';
  같나('2026-09-05 사고 — 1번 예외를 잡는다', 지킴이폴더(낡은지킴이, 1).예외인가, true);
  같나('그 예외가 가리키던 곳', 지킴이폴더(낡은지킴이, 1).폴더, 'C:\\Users\\USER\\.claude');
  같나('예외가 아닌 자리는 보통 길을 쓴다', 지킴이폴더(낡은지킴이, 3).폴더, 'C:\\Users\\USER\\.claude-u3');
  같나('예외가 아닌 자리는 예외 표시가 안 붙는다', 지킴이폴더(낡은지킴이, 3).예외인가, false);

  const 고친지킴이 = 'const 자리폴더 = `C:\\\\Users\\\\USER\\\\.claude-u${번호}`;';
  같나('고친 뒤에는 1번도 예외가 아니다', 지킴이폴더(고친지킴이, 1).예외인가, false);
  같나('고친 뒤 1번 폴더', 지킴이폴더(고친지킴이, 1).폴더, 'C:\\Users\\USER\\.claude-u1');

  같나('같은 길이면 같다', 같은길인가('C:\\Users\\USER\\.claude-u1', 'C:/Users/USER/.claude-u1'), true);
  같나('대소문자를 안 가린다', 같은길인가('C:\\Users\\User\\.claude-u1', 'c:/users/USER/.claude-u1'), true);
  같나('꼬리 빗금을 안 가린다', 같은길인가('C:/x/', 'C:/x'), true);
  같나('⛔ 다른 길은 다르다', 같은길인가('C:/Users/USER/.claude', 'C:/Users/USER/.claude-u1'), false);
  같나('⛔ 한쪽이 없으면 같다고 하지 않는다', 같은길인가(null, 'C:/x'), false);

  /* 오늘자란수 — 가짜 파일칸으로 잰다 */
  const 가짜 = {
    existsSync: (p) => !String(p).includes('없는곳'),
    readdirSync: (p, o) => (o?.withFileTypes
      ? [{ name: 'C--a', isDirectory: () => true }]
      : ['새것.jsonl', '낡은것.jsonl', '아무것.txt']),
    statSync: (p) => ({ mtimeMs: String(p).includes('새것') ? 2000 : 1000 }),
  };
  같나('오늘 자란 것만 센다', 오늘자란수('C:/x', 1500, 가짜), 1);
  같나('다 낡았으면 0 이다', 오늘자란수('C:/x', 5000, 가짜), 0);
  같나('⛔ 폴더가 없으면 0 이 아니라 null(못 쟀다)', 오늘자란수('C:/없는곳', 0, 가짜), null);

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 자리 설정 검사 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

/* ── 실제로 잰다 ─────────────────────────────────────────────── */
if (내가실행됐다) {
  const 오늘시작 = new Date(); 오늘시작.setHours(0, 0, 0, 0);
  const 지킴이길 = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seat-watchdog.mjs');
  const 지킴이글 = fs.existsSync(지킴이길) ? fs.readFileSync(지킴이길, 'utf8') : '';

  const 흠 = []; const 못잰것 = []; const 줄 = [];
  for (const n of 자리들) {
    const cmd = fs.existsSync(입구)
      ? fs.readdirSync(입구).find((f) => f.startsWith(`${n}번_`) && f.endsWith('.cmd'))
      : null;
    if (!cmd) { 못잰것.push(`${n}번 — 단추(.cmd)를 못 찾았다`); continue; }
    const 단추 = 단추폴더(fs.readFileSync(path.join(입구, cmd), 'utf8'));
    const { 폴더: 지킴, 예외인가 } = 지킴이폴더(지킴이글, n);

    if (!단추) 흠.push(`${n}번 — 단추에 CLAUDE_CONFIG_DIR 이 없다. 사장님 자리(admin)로 열린다`);
    if (예외인가) 흠.push(`${n}번 — 지킴이가 이 자리만 «예외»로 두고 ${지킴} 로 깨운다. 2026-09-05 사고가 이것이었다`);
    if (단추 && 지킴 && !같은길인가(단추, 지킴)) {
      흠.push(`${n}번 — 단추는 ${단추} 인데 지킴이는 ${지킴} 다. 단추를 누르면 빈 자리가 열린다`);
    }

    const 자란곳 = [];
    for (const 후보 of ['C:/Users/USER/.claude', ...자리들.map((k) => `C:/Users/USER/.claude-u${k}`)]) {
      const c = 오늘자란수(후보, 오늘시작.getTime());
      if (c === null) continue;
      if (c > 0) 자란곳.push(`${path.basename(후보)}:${c}`);
    }
    줄.push(`   ${n}번  단추 ${path.basename(단추 ?? '?')} · 지킴이 ${path.basename(지킴 ?? '?')}`);
    if (n === 자리들[0]) 줄.push(`         (오늘 대화록이 자란 곳 — 전체: ${자란곳.join(' · ') || '없음'})`);
  }

  /**
   * 🔴 사장님 자리에서 대화록이 자라면 그 자체가 흠이다.
   *
   * ⚠ 창을 «오늘»이 아니라 «최근 세 시간»으로 둔다. 묻는 것이 「오늘 그런 적이 있나」가 아니라
   *   **「지금도 그러고 있나」**이기 때문이다. 고친 직후에는 그날 앞부분의 흔적이 남아 있고,
   *   그것 때문에 온 유닛의 `npm test` 가 하루 종일 서면 아무도 이 검사를 안 보게 된다.
   * ⛔ 느슨하게 한 것이 아니다 — 세 시간 안에 다시 자라면 **아직 안 고쳐진 것**이고, 그때 선다.
   */
  const 세시간전 = Date.now() - 3 * 3600e3;
  const 사장님자리 = 오늘자란수('C:/Users/USER/.claude', 세시간전);
  if (사장님자리 === null) 못잰것.push('C:/Users/USER/.claude 를 못 읽었다');
  else if (사장님자리 > 0) {
    흠.push(`.claude(사장님 본인 자리)에서 «최근 세 시간에» 대화록 ${사장님자리}개가 자랐다`
      + ' — 어느 자리가 남의 자리에 쓰고 있다');
  }

  console.log('# 자리 설정 검사 — 단추·지킴이·대화록이 같은 곳을 보나\n');
  for (const l of 줄) console.log(l);
  if (못잰것.length) {
    console.log('\n⬜ 못 쟀다 (0 으로 치지 않는다)');
    for (const s of 못잰것) console.log(`   · ${s}`);
  }
  if (!흠.length) { console.log('\n✅ 여섯 자리가 다 제 폴더를 본다'); process.exit(0); }
  console.error(`\n🔴 어긋난 자리 ${흠.length}건`);
  for (const s of 흠) console.error(`   · ${s}`);
  console.error('\n⛔ 이대로 두면 단추를 눌러도 빈 자리가 열리고, 그 사이 대화는 남의 폴더에 쌓인다.');
  console.error('   2026-09-05 에 1번이 나흘을 그렇게 있었고, 그 나흘치 대화는 되찾지 못했다.');
  process.exit(1);
}
