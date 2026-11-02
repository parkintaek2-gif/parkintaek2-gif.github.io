#!/usr/bin/env node
/**
 * 보낸다-세사이트집계를-케이라이프맵에.mjs
 *   서울마켓츠·백년지도·케이컬처와이어의 그 날 방문자 집계를
 *   **케이라이프맵 관리자 화면으로 보낸다.**
 *
 * ── 🔴 왜 (2026-11-02 · 사장님) ──────────────────────────────────
 *   「케이라이프맵 관리자 페이지에 세 사이트 방문자 등의 집계를 볼 수 있게 해」
 *   세 사이트는 서버가 다르다. 사장님이 화면 둘을 번갈아 여실 까닭이 없다.
 *
 * ── 왜 서버끼리 바로 안 보내고 이 자리를 두었나 ───────────────────
 *   서버끼리 보내려면 서울마켓츠 쪽에 열쇠를 하나 심어야 한다. 그런데
 *   **서울마켓츠 저장소는 공개**라 열쇠에서 나온 값을 거기 적을 수 없고,
 *   배포에 열쇠를 심는 것은 이 자리에서 막혀 있다(사장님 허락이 필요하다).
 *   ⇒ 그때까지는 이 PC 가 다리를 놓는다. 두 열쇠가 다 여기 있다.
 *   ⚠ server.mjs 에 서버끼리 보내는 길은 이미 넣어 두었다. 배포에 KLM_ADMIN_KEY 만
 *     심으면 그 길이 저절로 돌고, 이 자리는 그때 없애면 된다.
 *
 * ⛔ 열쇠를 화면에 한 글자도 찍지 않는다.
 * ⛔ 개인을 가리키는 것은 보내지 않는다 — 수와 접속 정보 목록뿐이다.
 *
 * 쓰는 법
 *   node scripts/보낸다-세사이트집계를-케이라이프맵에.mjs
 *   node scripts/보낸다-세사이트집계를-케이라이프맵에.mjs --자체검사
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 케이라이프맵 = process.env.KLM_BASE || 'https://klifemap.ai';

/** 오늘 날짜(한국시간). ⛔ toISOString 금지 · ⛔ getTimezoneOffset 으로 날짜를 만들지 않는다 */
export function 오늘(d = new Date()) {
  const 칸 = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d).forEach((x) => { 칸[x.type] = x.value; });
  return `${칸.year}-${칸.month}-${칸.day}`;
}

/** 케이라이프맵 열쇠를 읽는다. ⛔ 값을 돌려만 주고 찍지 않는다 */
export function 열쇠읽기() {
  for (const p of [path.join(뿌리, '..', 'klifemap', '.env'), path.join(뿌리, '.env')]) {
    try {
      const m = fs.readFileSync(p, 'utf8').match(/^SAJU_ADMIN_KEY\s*=\s*(.+)$/m);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    } catch (e) { /* 없으면 다음 자리 */ }
  }
  return process.env.SAJU_ADMIN_KEY || '';
}

/** 보낼 만한 집계인가 — 빈 것을 보내 라이브 수치를 지우면 안 된다 */
export function 보낼만한가(표) {
  if (!표 || typeof 표 !== 'object') return false;
  const 이름들 = Object.keys(표);
  if (!이름들.length) return false;
  return 이름들.some((n) => Number(표[n]?.방문자 ?? 0) > 0 || Number(표[n]?.자동 ?? 0) > 0);
}

/* ── 자체 검사 ──────────────────────────────────────────────────── */
export function 자체검사() {
  const T = [];
  const 참 = (이름, x) => T.push([이름, !!x]);
  참('⛔ 날짜를 한국시간으로 낸다', 오늘(new Date('2026-11-02T15:01:00Z')) === '2026-11-03');
  참('🔴 재는 기계가 어디 있든 같은 날을 낸다', 오늘(new Date('2026-11-02T01:00:00Z')) === '2026-11-02');
  참('⛔ 빈 집계는 안 보낸다 — 라이브 수치를 지울 수 있다', !보낼만한가({}) && !보낼만한가(null));
  참('⛔ 모두 0 인 집계도 안 보낸다', !보낼만한가({ 'a.com': { 방문자: 0, 자동: 0 } }));
  참('수가 하나라도 있으면 보낸다', 보낼만한가({ 'a.com': { 방문자: 0, 자동: 3 } }));
  T.forEach(([이름, x]) => console.log((x ? '  ✅ ' : '  ❌ ') + 이름));
  const 깨짐 = T.filter((x) => !x[1]).length;
  console.log(깨짐 ? `\n■ 자체 검사 ${깨짐}건 실패` : '\n■ 자체 검사 모두 통과');
  return 깨짐 === 0;
}

async function 한번보낸다() {
  const 날짜 = 오늘();
  const 방문 = await import('../src/lib/방문자집계.mjs');
  const 표 = await 방문.지난날집계(날짜);
  if (!보낼만한가(표)) {
    console.log(`[다리] ${날짜} — 보낼 집계가 없다. 아무것도 안 보냈다`);
    return false;
  }
  const 열쇠 = 열쇠읽기();
  if (!열쇠) { console.log('[다리] 🔴 케이라이프맵 열쇠를 못 읽었다'); return false; }

  const r = await fetch(`${케이라이프맵}/api/admin/visitors/outside`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-key': 열쇠 },
    body: JSON.stringify({ 날짜, 사이트: 표 }),
    signal: AbortSignal.timeout(30000),
  });
  const o = await r.json().catch(() => null);
  if (!r.ok || !o?.ok) {
    console.log(`[다리] 🔴 못 보냈다 — HTTP ${r.status} ${o ? String(o.error ?? '') : ''}`);
    return false;
  }
  const 줄 = Object.entries(표)
    .map(([n, v]) => `${n} 방문자 ${v.방문자}·조회 ${v.조회수}·자동 ${v.자동}`).join(' / ');
  console.log(`[다리] ✅ ${날짜} 세 사이트를 보냈다 (${o.받은사이트}곳) — ${줄}`);
  return true;
}

const 이파일이진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (이파일이진입점) {
  if (process.argv.includes('--자체검사')) process.exit(자체검사() ? 0 : 1);
  else process.exit((await 한번보낸다()) ? 0 : 1);
}
