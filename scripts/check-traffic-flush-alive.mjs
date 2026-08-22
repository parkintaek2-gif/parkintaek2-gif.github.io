#!/usr/bin/env node
/**
 * check-traffic-flush-alive.mjs — **유입 집계가 아직 흘러 쓰이고 있나**를 본다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-22 (5번). 하루치 유입 파일의 마지막 갱신이 **오전 10:26** 에 멈춰 있었다.
 * 그때 시각은 19:40 이었다. 어제까지는 매일 23:5x 까지 적혀 있었다 —
 * ```
 * 8/18 23:58 · 8/19 23:55 · 8/20 23:50 · 8/21 23:52 · 8/22 10:26  ← 여기
 * ```
 * 까닭: 집계는 메모리에 쌓이고 일정 시간마다 R2 로 흘려 쓴다. 한 서버가 네 집을 내는데
 * 여섯 자리가 오후 내내 배포했고, **배포는 컨테이너를 새로 띄운다.** 흘려 쓰기 전에 죽으면
 * 그때까지 센 것이 사라진다. 종료 신호를 받아 마지막으로 쓰는 자리도 없었다.
 *
 * ⭐ 둘을 고쳤다 — 간격을 10분→3분, 그리고 `server.mjs` 에 종료 신호 흘려쓰기.
 *   ⛔ 그런데 **고친 것이 사는지 어떻게 아나.** SIGTERM 은 윈도우에서 JS 까지 오지 않아
 *     내 창에서는 확인이 안 된다. 그래서 **운영에서 재는 자**를 둔다. 이 자다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * 그날치 파일의 `갱신` 이 **지금으로부터 얼마나 뒤졌나**. 많이 뒤졌으면 또 새고 있는 것이다.
 * ⛔ 밤에는 손님이 없어 흘려 쓸 것도 없다 — 요청이 없으면 흘려 쓰기도 안 돈다.
 *   그래서 **하루 요청이 어느 정도 있는 시간대에만** 잰다(기본 09~23시 KST).
 * ⚠ R2 자격이 없으면 「못 쟀다」로 넘어간다. 「샌다」고 말하지 않는다.
 *
 * 쓰는 법  node scripts/check-traffic-flush-alive.mjs --자가시험
 *          node scripts/check-traffic-flush-alive.mjs [--뒤짐한계분=40]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function 환경읽기() {
  try {
    const 본문 = fs.readFileSync(path.join(뿌리, '.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 그만 */ }
}

/**
 * 한국어 `toLocaleString('ko-KR')` 로 적힌 시각을 분으로 읽는다.
 * 꼴: `2026. 8. 22. 오전 10:26:35`
 * ⛔ `Date.parse` 로 넘기지 않는다 — 이 꼴을 못 읽고 NaN 을 준다(그러면 자가 조용히 통과한다).
 */
export function 적힌시각읽기(글) {
  const m = String(글 ?? '').match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  let 시 = Number(m[5]);
  if (m[4] === '오후' && 시 !== 12) 시 += 12;
  if (m[4] === '오전' && 시 === 12) 시 = 0;
  return {
    year: Number(m[1]), month: Number(m[2]), day: Number(m[3]),
    hour: 시, minute: Number(m[6]), second: Number(m[7] ?? 0),
  };
}

/** 두 시각 사이 분. ⚠ 같은 날 안에서만 쓴다(하루치 파일이다) */
export function 뒤진분(적힌, 지금) {
  if (!적힌) return null;
  const a = 적힌.hour * 60 + 적힌.minute;
  const b = 지금.hour * 60 + 지금.minute;
  return b - a;
}

/** 재도 되는 시간대인가 — 손님이 없는 새벽엔 흘려 쓸 것도 없다 */
export const 잴시간인가 = (시, { 부터 = 9, 까지 = 23 } = {}) => 시 >= 부터 && 시 <= 까지;

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const t = 적힌시각읽기('2026. 8. 22. 오전 10:26:35');
  검('한국어 시각을 읽는다', t && t.hour === 10 && t.minute === 26 && t.day === 22);
  검('오후를 24시로 바꾼다', 적힌시각읽기('2026. 8. 21. 오후 11:52:40').hour === 23);
  검('오후 12시는 12시다', 적힌시각읽기('2026. 8. 21. 오후 12:05:00').hour === 12);
  검('오전 12시는 0시다', 적힌시각읽기('2026. 8. 21. 오전 12:05:00').hour === 0);
  검('초가 없어도 읽는다', 적힌시각읽기('2026. 8. 21. 오후 1:05').hour === 13);
  검('⛔ 못 읽으면 null (조용히 통과하지 않는다)', 적힌시각읽기('어제') === null);
  검('⛔ 빈 것도 null', 적힌시각읽기('') === null && 적힌시각읽기(null) === null);

  검('뒤진 분을 센다', 뒤진분({ hour: 10, minute: 26 }, { hour: 19, minute: 40 }) === 554);
  검('막 흘려 썼으면 0에 가깝다', 뒤진분({ hour: 19, minute: 38 }, { hour: 19, minute: 40 }) === 2);
  검('⛔ 못 읽은 시각은 null', 뒤진분(null, { hour: 19, minute: 40 }) === null);

  검('낮에는 잰다', 잴시간인가(14) === true);
  검('⛔ 새벽에는 안 잰다', 잴시간인가(4) === false);
  검('⛔ 자정 넘어서도 안 잰다', 잴시간인가(0) === false);
  검('경계를 포함한다', 잴시간인가(9) === true && 잴시간인가(23) === true);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-traffic-flush-alive 자가시험 통과 (14)');
  process.exit(0);
}

환경읽기();
const { get, remoteEnabled } = await import(new URL('../src/lib/store.mjs', import.meta.url).href);
if (!remoteEnabled) {
  console.log('⚠ 못 쟀다 — R2 자격이 이 창에 없다. 「샌다」고 말하지 않는다');
  process.exit(0);
}

const 한계 = Number((process.argv.find((a) => a.startsWith('--뒤짐한계분='))?.split('=')[1]) ?? 40);
const 지금 = new Date();
const 날 = `${지금.getFullYear()}${String(지금.getMonth() + 1).padStart(2, '0')}${String(지금.getDate()).padStart(2, '0')}`;

if (!잴시간인가(지금.getHours())) {
  console.log(`⚠ 못 쟀다 — 지금 ${지금.getHours()}시다. 손님이 없는 시간엔 흘려 쓸 것도 없다`);
  process.exit(0);
}

const raw = await get(`raw/traffic/${날}.json`);
if (!raw) {
  console.log(`❌ 오늘치(${날})가 R2 에 아예 없다 — 흘려 쓰기가 한 번도 안 돌았다`);
  process.exit(1);
}
const j = JSON.parse(Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw));
const 적힌 = 적힌시각읽기(j.갱신);
if (!적힌) {
  console.log(`❌ 갱신 시각을 못 읽었다 — «${j.갱신}». 자가 이 꼴을 모르면 조용히 통과한다`);
  process.exit(1);
}
const 뒤짐 = 뒤진분(적힌, { hour: 지금.getHours(), minute: 지금.getMinutes() });

console.log(`유입 흘려쓰기 검사 — 오늘치 ${날} · 마지막 갱신 ${j.갱신}`);
console.log(`  지금과의 차 ${뒤짐}분 (한계 ${한계}분)`);
if (뒤짐 > 한계) {
  console.log(`❌ ${뒤짐}분 뒤졌다 — 세던 것이 또 새고 있다`);
  console.log('   ⭐ 볼 곳 둘: traffic.mjs 의 FLUSH_MS · server.mjs 의 종료 신호 흘려쓰기.');
  console.log('   ⚠ 배포가 잦은 날 이 자가 먼저 운다. 그게 이 자를 만든 까닭이다.');
  process.exit(1);
}
console.log('✅ 유입 집계가 흘러 쓰이고 있다');
