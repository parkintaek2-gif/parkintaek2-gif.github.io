#!/usr/bin/env node
/**
 * 잰다-회원가입.mjs — **그날 회원가입이 몇 건인가.**
 *
 * ── 🔴 왜 (2026-10-29 · 5번) ─────────────────────────────────────────
 * 사장님이 2026-08-22 에 정하신 보고 양식에는 네 칸이 있다 —
 * 순방문자수 · 매출(B2B) · 매출(B2C) · **회원가입**.
 * 그런데 오늘 23시 보고에서 회원가입 칸을 「⚠ 못 잼」으로 냈다.
 * **재는 장치가 아예 없었다.** 매일 들어가는 항목인데 몇 달째 비어 있었던 것이다.
 *
 * ⛔ 「없다」와 「못 쟀다」를 가른다 — 창구가 안 열리면 0 이라 적지 않는다.
 * ⛔ 손님 이름·메일 주소를 한 글자도 찍지 않는다. 문 이름과 수뿐이다.
 * ⛔ 열쇠를 화면에 찍지 않는다.
 *
 * 쓰는 법
 *   node scripts/잰다-회원가입.mjs              어제·오늘
 *   node scripts/잰다-회원가입.mjs --날수=14     최근 14일
 *   node scripts/잰다-회원가입.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 장부있는곳 = 'C:\\Users\\User\\Documents\\GitHub\\klifemap';

/** .env 에서 한 줄 읽는다 — ⛔ 값을 밖으로 내지 않는다 */
export function 열쇠를읽는다(env글, 이름) {
  const m = String(env글 ?? '').match(new RegExp('^\\s*' + 이름 + '\\s*=\\s*(.*)$', 'm'));
  if (!m) return null;
  const v = m[1].trim().replace(/^['"]|['"]$/g, '');
  return v || null;
}

/** 창구가 준 것을 「날 → 건수」로 고른다. ⛔ 못 읽으면 null 이다 */
export function 날별로고른다(받은것) {
  const 들 =받은것?.signups;
  if (!Array.isArray(들)) return null;
  const 표 = new Map();
  for (const x of 들) {
    if (!x) continue;
    const 날 = String(x.day ?? x.날 ?? x.date ?? '').slice(0, 10);
    const 수 = Number(x.count ?? x.수 ?? x.n);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(날) || !Number.isFinite(수)) continue;
    표.set(날, (표.get(날) || 0) + Math.max(0, Math.floor(수)));
  }
  return 표.size ? 표 : new Map();
}

/** 그 날 몇 건인가. ⛔ 표에 그 날이 아예 없으면 «0 건»이 맞다 — 창구가 답했으니까 */
export function 그날몇건(표, 날) {
  if (!(표 instanceof Map)) return null;
  return 표.get(날) ?? 0;
}

export function 오늘날짜() {
  return new Date().toLocaleDateString('sv-SE');   /* KST 그대로. ⛔ toISOString 금지 */
}

export function 어제날짜() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('sv-SE');
}

if (process.argv.includes('--자가시험')) {
  let 총 = 0; let 흠 = 0;
  const 본다 = (이름, 참) => { 총 += 1; if (참) console.log('  ✅ ' + 이름); else { 흠 += 1; console.log('  ❌ ' + 이름); } };

  본다('열쇠를 읽는다', 열쇠를읽는다('A=1\nSAJU_ADMIN_KEY=abc\n', 'SAJU_ADMIN_KEY') === 'abc');
  본다('따옴표를 벗긴다', 열쇠를읽는다('SAJU_ADMIN_KEY="abc"', 'SAJU_ADMIN_KEY') === 'abc');
  본다('⛔ 없으면 null — 빈 글자가 아니다', 열쇠를읽는다('A=1', 'SAJU_ADMIN_KEY') === null);
  본다('⛔ 빈 값도 null', 열쇠를읽는다('SAJU_ADMIN_KEY=', 'SAJU_ADMIN_KEY') === null);

  본다('⛔ 창구가 답을 안 하면 null — 0 이 아니다', 날별로고른다(null) === null);
  본다('⛔ 모양이 다르면 null', 날별로고른다({ signups: '아니다' }) === null);
  const 표 = 날별로고른다({ signups: [{ day: '2026-10-29', count: 3 }, { day: '2026-10-28', count: 1 }] });
  본다('날별로 센다', 그날몇건(표, '2026-10-29') === 3);
  본다('창구가 답했는데 그 날이 없으면 0 건이다', 그날몇건(표, '2026-10-01') === 0);
  본다('⛔ 표가 없으면 0 이 아니라 null', 그날몇건(null, '2026-10-29') === null);
  본다('한 날이 여럿으로 와도 합친다',
    그날몇건(날별로고른다({ signups: [{ day: '2026-10-29', count: 2 }, { day: '2026-10-29', count: 3 }] }), '2026-10-29') === 5);
  본다('⛔ 날 모양이 틀린 줄은 버린다',
    그날몇건(날별로고른다({ signups: [{ day: '어제', count: 9 }, { day: '2026-10-29', count: 1 }] }), '2026-10-29') === 1);
  본다('⛔ 음수를 그대로 받지 않는다',
    그날몇건(날별로고른다({ signups: [{ day: '2026-10-29', count: -5 }] }), '2026-10-29') === 0);
  본다('빈 목록은 «빈 표»다 — null 이 아니다', 날별로고른다({ signups: [] }) instanceof Map);
  본다('오늘·어제가 다르다', 오늘날짜() !== 어제날짜());

  console.log('\n  ' + (총 - 흠) + '/' + 총 + ' 통과');
  process.exit(흠 ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const 날수인자 = (process.argv.find((a) => a.startsWith('--날수=')) || '').slice(5);
  const 날수 = Math.max(2, Math.min(90, Number(날수인자) || 7));

  let env = '';
  try { env = fs.readFileSync(path.join(장부있는곳, '.env'), 'utf8'); } catch (e) { /* 아래에서 막는다 */ }
  const 열쇠 = 열쇠를읽는다(env, 'SAJU_ADMIN_KEY');
  if (!열쇠) {
    console.log('⬜ 관리자 열쇠를 못 읽었다 — 「가입 0건」이 아니라 «못 쟀다»다');
    console.log('   klifemap/.env 의 SAJU_ADMIN_KEY 를 본다');
    process.exit(1);
  }

  let 받은것 = null;
  try {
    const r = await fetch('https://klifemap.ai/api/admin/signups?days=' + 날수, {
      headers: { 'x-admin-key': 열쇠 }, signal: AbortSignal.timeout(25000),
    });
    if (!r.ok) {
      console.log('⬜ 창구가 안 열렸다 (' + r.status + ') — «못 쟀다»다. 0 으로 치지 않는다');
      process.exit(1);
    }
    받은것 = await r.json();
  } catch (e) {
    console.log('⬜ 창구에 못 닿았다 — ' + String(e.message).slice(0, 80) + '. «못 쟀다»다');
    process.exit(1);
  }

  const 표 = 날별로고른다(받은것);
  if (!표) {
    console.log('⬜ 창구가 준 것을 못 읽었다 — 모양이 바뀌었을 수 있다. «못 쟀다»다');
    process.exit(1);
  }

  const 오늘 = 오늘날짜();
  const 어제 = 어제날짜();
  console.log('■ KLifeMap 회원가입 — 보고 양식의 「회원가입」 칸에 넣는 수');
  console.log('');
  console.log('   오늘 ' + 오늘 + '   ' + 그날몇건(표, 오늘) + '건');
  console.log('   어제 ' + 어제 + '   ' + 그날몇건(표, 어제) + '건');
  console.log('');

  const 날들 = [...표.keys()].sort().slice(-날수);
  if (날들.length) {
    console.log('── 최근 ' + 날들.length + '일 ' + '─'.repeat(34));
    const 가장큰 = Math.max(...날들.map((d) => 표.get(d) || 0), 1);
    for (const d of 날들) {
      const n = 표.get(d) || 0;
      console.log('   ' + d + '  ' + String(n).padStart(3) + '건  ' + '█'.repeat(Math.round((n / 가장큰) * 30)));
    }
  } else {
    console.log('   ⬜ 이 기간에 가입이 한 건도 없다 (창구는 답했다 — 못 잰 것이 아니다)');
  }
  process.exit(0);
}
