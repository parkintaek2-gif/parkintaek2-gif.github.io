#!/usr/bin/env node
/**
 * snapshot-klifemap-db.mjs — 살아 있는 klifemap DB 의 **찢어지지 않는** 사본을 뜬다.
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-08 · 5번] 원드라이브 복구용 묶음을 만들다가 여기서 죽었다 —
 *   「The process cannot access the file 'klifemap\db\beomjin.sqlite3'
 *    because it is being used by another process」
 *   ⇒ **살아 있는 서비스가 그 파일을 쥐고 있다.** klifemap 은 매출이 나는 서비스다.
 *
 * ⛔ 두 가지를 «하지 않는다»
 *   · 서비스를 멈추지 않는다 — 강령 「klifemap 을 죽이지 않는다」
 *   · 살아 있는 파일을 그냥 복사하지 않는다 — 쓰는 중에 복사하면 «찢어진» DB 가 된다.
 *     그 사본은 열리기는 해도 줄이 빠져 있을 수 있고, 그것을 «백업했다»고 부르면 거짓이다.
 *
 * ✅ SQLite 는 이런 자리를 위해 온라인 백업을 갖고 있다.
 *   `better-sqlite3` 의 `db.backup()` 이 그것이다 — 쓰는 것을 막지 않고 «한 시점»을 뜬다.
 *   ⚠ 열 때 `readonly: true` 로 연다. 우리는 읽기만 한다.
 *
 * 쓰는 법
 *   node scripts/snapshot-klifemap-db.mjs                 (기본 자리에 뜬다)
 *   node scripts/snapshot-klifemap-db.mjs --낼곳 D:\a.db
 *   node scripts/snapshot-klifemap-db.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const klifemap = 'C:/Users/User/Documents/GitHub/klifemap';
export const 원본후보 = [
  path.join(klifemap, 'db/beomjin.sqlite3'),
  path.join(klifemap, 'beomjin.sqlite3'),
];

/** 어느 것이 «본» DB 인가 — 큰 쪽이다. ⛔ 이름으로 짐작하지 않는다 */
export function 본DB고르기(후보들, 재기 = (p) => (fs.existsSync(p) ? fs.statSync(p).size : null)) {
  const 있는것 = 후보들.map((p) => ({ 길: p, 크기: 재기(p) })).filter((x) => x.크기 != null);
  if (!있는것.length) return null;
  있는것.sort((a, b) => b.크기 - a.크기);
  return 있는것[0];
}

/** 잰 수인가 — `Number(null) === 0` 이 「못 잼」을 「0바이트」로 바꾸는 것을 막는다 */
export function 잰수인가(v) {
  if (v == null) return false;
  return Number.isFinite(Number(v));
}

/**
 * 사본이 «쓸 만한가»를 잰다.
 * ⛔ 파일이 생긴 것으로 「됐다」고 하지 않는다 — 열어서 줄을 세어 본다.
 */
export function 사본이쓸만한가({ 원본크기, 사본크기, 표수, 줄수 }) {
  const 흠 = [];
  if (!잰수인가(사본크기) || Number(사본크기) <= 0) 흠.push('사본이 0바이트다');
  if (!잰수인가(표수) || Number(표수) <= 0) 흠.push('표가 한 개도 없다 — 빈 DB 다');
  /* ⚠ VACUUM 을 거치면 사본이 «작아지는 것이 정상»이다. 그래서 작다고 흠이 아니다.
     다만 «너무» 작으면(원본의 10% 미만) 뜨다가 끊긴 것으로 본다. */
  if (잰수인가(원본크기) && 잰수인가(사본크기) && Number(사본크기) < Number(원본크기) * 0.10) {
    흠.push(`사본이 원본의 10% 미만이다 (${사본크기} / ${원본크기})`);
  }
  if (잰수인가(줄수) && Number(줄수) === 0) 흠.push('줄이 0개다 — 회원·결제가 비었다');
  return 흠;
}

const 내가입구인가 = !!process.argv[1]
  && process.argv[1].split(/[\\/]/).pop() === new URL(import.meta.url).pathname.split('/').pop();

if (내가입구인가 && process.argv.includes('--자가시험')) {
  const 시험 = [];
  const 재다 = (이름, 참) => 시험.push([이름, !!참]);

  재다('본DB고르기 — 큰 쪽을 고른다',
    본DB고르기(['a', 'b'], (p) => (p === 'a' ? 100 : 5000)).길 === 'b');
  재다('본DB고르기 — 없으면 null', 본DB고르기(['a'], () => null) === null);
  재다('본DB고르기 — 하나만 있으면 그것', 본DB고르기(['a', 'b'], (p) => (p === 'a' ? 7 : null)).길 === 'a');

  재다('잰수인가 — null 은 못 잼', 잰수인가(null) === false);
  재다('잰수인가 — 0 은 잰 값', 잰수인가(0) === true);

  재다('쓸만한가 — 멀쩡하면 흠 0',
    사본이쓸만한가({ 원본크기: 5_000_000, 사본크기: 4_000_000, 표수: 12, 줄수: 340 }).length === 0);
  /* ⭐ VACUUM 을 거치면 작아지는 것이 정상이다 — 그것을 흠으로 세면 늘 빨간불이 된다 */
  재다('쓸만한가 — 조금 작아진 것은 흠이 아니다',
    사본이쓸만한가({ 원본크기: 5_000_000, 사본크기: 2_600_000, 표수: 12, 줄수: 340 }).length === 0);
  재다('쓸만한가 — 0바이트는 잡는다',
    사본이쓸만한가({ 원본크기: 5_000_000, 사본크기: 0, 표수: 0, 줄수: 0 }).some((x) => x.includes('0바이트')));
  재다('쓸만한가 — 표가 없으면 잡는다',
    사본이쓸만한가({ 원본크기: 5_000_000, 사본크기: 4_000_000, 표수: 0, 줄수: 5 }).some((x) => x.includes('표가 한 개도')));
  재다('쓸만한가 — 10% 미만이면 잡는다',
    사본이쓸만한가({ 원본크기: 5_000_000, 사본크기: 100_000, 표수: 3, 줄수: 5 }).some((x) => x.includes('10% 미만')));
  재다('쓸만한가 — 줄이 0이면 잡는다',
    사본이쓸만한가({ 원본크기: 5_000_000, 사본크기: 4_000_000, 표수: 12, 줄수: 0 }).some((x) => x.includes('줄이 0개')));
  재다('쓸만한가 — 못 잰 것은 흠으로 세지 않는다(0 으로 치지 않는다)',
    사본이쓸만한가({ 원본크기: null, 사본크기: 4_000_000, 표수: 12, 줄수: null }).length === 0);

  const 틀린것 = 시험.filter(([, ok]) => !ok);
  for (const [이름, ok] of 시험) console.log(`  ${ok ? '✅' : '⛔'} ${이름}`);
  console.log(`\n자가시험 ${시험.length}건 · 어긋난 것 ${틀린것.length}건`);
  process.exit(틀린것.length ? 1 : 0);
}

if (내가입구인가) {
  const i = process.argv.indexOf('--낼곳');
  const 낼곳 = i > 0 ? process.argv[i + 1] : path.join(os.tmpdir(), 'klifemap-db-스냅샷.sqlite3');

  const 본 = 본DB고르기(원본후보);
  if (!본) { console.log('🔴 klifemap DB 를 못 찾았다 — 뜬 것 없음'); process.exit(1); }
  console.log(`원본  ${본.길}  ${(본.크기 / 1048576).toFixed(1)}MB`);

  /* ⚠ better-sqlite3 는 klifemap 쪽에 있다. 여기엔 없다 — 빌려 쓴다 */
  const require = createRequire(`file:///${klifemap}/package.json`);
  let Database;
  try { Database = require('better-sqlite3'); }
  catch (e) { console.log(`🔴 better-sqlite3 를 못 불렀다 — ${e.message}`); process.exit(1); }

  if (fs.existsSync(낼곳)) fs.rmSync(낼곳);
  const db = new Database(본.길, { readonly: true, fileMustExist: true });
  try {
    /* ⭐ 온라인 백업 — 쓰는 것을 막지 않고 «한 시점»을 뜬다 */
    await db.backup(낼곳);
  } finally { db.close(); }

  /* ⛔ 파일이 생긴 것으로 끝내지 않는다 — 열어서 표와 줄을 센다 */
  const 사본 = new Database(낼곳, { readonly: true, fileMustExist: true });
  let 표수 = 0; let 줄수 = 0; let 큰표 = [];
  try {
    const 표들 = 사본.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    표수 = 표들.length;
    for (const t of 표들) {
      const n = 사본.prepare(`SELECT COUNT(*) AS n FROM "${t.name}"`).get().n;
      줄수 += n;
      큰표.push({ 표: t.name, 줄: n });
    }
    const 온전한가 = 사본.pragma('integrity_check', { simple: true });
    console.log(`무결성 검사  ${온전한가}`);
    if (String(온전한가) !== 'ok') { console.log('🔴 사본이 온전하지 않다'); process.exit(1); }
  } finally { 사본.close(); }

  const 사본크기 = fs.statSync(낼곳).size;
  큰표.sort((a, b) => b.줄 - a.줄);
  console.log(`사본  ${낼곳}  ${(사본크기 / 1048576).toFixed(1)}MB`);
  console.log(`표 ${표수}개 · 줄 합 ${줄수.toLocaleString('ko-KR')}`);
  console.log('줄이 많은 표 —', 큰표.slice(0, 6).map((x) => `${x.표}(${x.줄})`).join(' · '));

  const 흠 = 사본이쓸만한가({ 원본크기: 본.크기, 사본크기, 표수, 줄수 });
  if (흠.length) { for (const x of 흠) console.log(`   ⛔ ${x}`); process.exit(1); }
  console.log('✅ 사본이 쓸 만하다 — 열어서 표와 줄을 세어 확인했다');
  console.log(`낼곳=${낼곳}`);
}
