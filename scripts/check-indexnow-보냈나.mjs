#!/usr/bin/env node
/**
 * check-indexnow-보냈나.mjs — **네 사이트에 색인 통보를 언제 마지막으로 보냈나.** (5번 2026-10-09)
 *
 * ── 🔴🔴 왜 만드나 ─────────────────────────────────────────────────────────
 * `ping-indexnow.mjs` 는 **K Culture Wire 만** 기록을 남긴다(224~258줄).
 * 나머지 셋(서울마켓·백년지도·KLifeMap)은 **언제 보냈는지 아무 데도 안 적힌다.**
 * ⇒ 오늘(10-09) 재 보니 서울마켓은 홈 등 세 장만 보낸 뒤로 **7,949장을 한 번도 안 보냈다.**
 *   klifemap 은 3일간 방문자 3명인데 3,044장이 통보된 적이 없었다.
 *   ⛔ 아무도 몰랐던 까닭은 간단하다 — **재는 자가 없었다.**
 *
 * ⭐ 사장님: 「업무분량의 50% 이상을 방문자늘리기에 써라」·「색인 잊지말고」
 *   색인 통보는 공짜이고 한도가 없다. 안 하는 것은 손해만 있다.
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────────────────
 * ⛔ 통보를 «보내지» 않는다. 언제 보냈나만 말한다 — 보내는 것은 ping-indexnow 의 몫이다.
 * ⛔ 기록이 없으면 「안 보냈다」가 아니라 **「모른다」**다. 세는 칸을 셋으로 둔다.
 * ⚠ 이 자는 「구글이 색인했나」를 못 잰다. 구글은 IndexNow 를 안 쓴다.
 *   잴 수 있는 것은 **「빙·얀덱스·네이버에 알렸나」**뿐이다. 그것만 말한다.
 *
 * 쓰는 법
 *   node scripts/check-indexnow-보냈나.mjs --자가시험
 *   node scripts/check-indexnow-보냈나.mjs
 *   node scripts/check-indexnow-보냈나.mjs --적는다 <호스트> <장수>
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');
export const 기록길 = path.join(뿌리, 'docs', 'indexnow-보낸기록.tsv');

/** 네 사이트. ⛔ 호스트는 ping-indexnow 가 쓰는 꼴 그대로 적는다 */
export const 사이트들 = [
  { 호스트: 'seoulmarkets.com', 이름: '서울마켓' },
  { 호스트: '100yearmap.com', 이름: '백년지도' },
  { 호스트: 'www.kculturewire.com', 이름: 'K Culture Wire' },
  { 호스트: 'klifemap.ai', 이름: 'KLifeMap' },
];

/** 며칠까지 참나. 그 뒤로는 운다 */
export const 참는날 = 7;

/** ⛔ toISOString() 금지 — UTC 라 새벽에 하루가 어긋난다 */
export function 오늘글(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 기록 줄을 읽는다. 머리말(#)과 빈 줄은 버린다 */
export function 줄읽기(글) {
  if (typeof 글 !== 'string') return null;   /* ⛔ 글이 아니면 「없다」가 아니라 null */
  return 글.split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => {
      const [날, 호스트, 장수] = l.split('\t');
      return { 날, 호스트, 장수: Number(장수) };
    })
    .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(String(x.날)) && x.호스트);
}

/** 며칠 지났나. ⛔ 못 재면 null */
export function 며칠전(날, 오늘 = 오늘글()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(날 ?? ''))) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(오늘 ?? ''))) return null;
  const a = new Date(날 + 'T00:00:00');
  const b = new Date(오늘 + 'T00:00:00');
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / 86400000);
}

/**
 * 한 사이트의 판정.
 * @returns {{빛:'✅'|'🔴'|'⬜', 말:string, 지난날:number|null}}
 */
export function 판정(호스트, 줄들, 오늘 = 오늘글(), 선 = 참는날) {
  if (!Array.isArray(줄들)) return { 빛: '⬜', 말: '기록을 못 읽었다 — 「안 보냈다」가 아니다', 지난날: null };
  const 내것 = 줄들.filter((x) => x.호스트 === 호스트);
  if (!내것.length) return { 빛: '⬜', 말: '보낸 기록이 없다 — 모른다', 지난날: null };
  const 날들 = 내것.map((x) => 며칠전(x.날, 오늘)).filter((d) => d !== null);
  if (!날들.length) return { 빛: '⬜', 말: '날짜를 못 읽었다', 지난날: null };
  const 지난날 = Math.min(...날들);
  const 마지막 = 내것.find((x) => 며칠전(x.날, 오늘) === 지난날);
  if (지난날 > 선) return { 빛: '🔴', 말: `${지난날}일 지났다 (마지막 ${마지막.날} · ${마지막.장수 || '?'}장)`, 지난날 };
  return { 빛: '✅', 말: `${지난날}일 전 (${마지막.날} · ${마지막.장수 || '?'}장)`, 지난날 };
}

/* ── 자가시험 ───────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 것 = []; const 다 = (이름, 참) => 것.push({ 이름, 참: !!참 });
  const 줄 = 줄읽기('# 머리말\n2026-10-09\tseoulmarkets.com\t7949\n2026-10-01\tklifemap.ai\t3044\n');

  다('머리말을 버린다', 줄.length === 2);
  다('장수를 수로 읽는다', 줄[0].장수 === 7949);
  다('글이 아니면 null — 「없다」가 아니다', 줄읽기(null) === null);
  다('날짜가 아닌 줄은 버린다', 줄읽기('아무말\t아무것\t3').length === 0);

  다('같은 날이면 0일', 며칠전('2026-10-09', '2026-10-09') === 0);
  다('달을 넘어도 센다', 며칠전('2026-09-30', '2026-10-09') === 9);
  다('날짜가 아니면 null', 며칠전('어제', '2026-10-09') === null);

  다('오늘 보냈으면 ✅', 판정('seoulmarkets.com', 줄, '2026-10-09').빛 === '✅');
  다('🔴 참는 선을 넘으면 운다', 판정('klifemap.ai', 줄, '2026-10-09').빛 === '🔴');
  다('선 안이면 안 운다', 판정('klifemap.ai', 줄, '2026-10-05').빛 === '✅');
  다('⬜ 기록이 없으면 「모른다」 — 「안 보냈다」가 아니다',
    판정('100yearmap.com', 줄, '2026-10-09').빛 === '⬜');
  다('⬜ 기록을 못 읽어도 「모른다」', 판정('x', null).빛 === '⬜');
  다('가장 최근 것으로 센다', (() => {
    const z = 줄읽기('2026-10-01\ta.com\t1\n2026-10-08\ta.com\t2\n');
    return 판정('a.com', z, '2026-10-09').지난날 === 1;
  })());
  다('마지막 장수를 그대로 말한다', /7949장/.test(판정('seoulmarkets.com', 줄, '2026-10-09').말));

  const 진 = 것.filter((x) => !x.참);
  console.log(`IndexNow 보냈나 — 자체 점검 ${것.length - 진.length}/${것.length}`);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  process.exit(진.length ? 1 : 0);
}

/* 🔴🔴 [2026-10-09 · 5번] **가져오면 도는 자였다.**
   `ping-indexnow.mjs` 가 이 파일에서 `기록길`·`오늘글` 만 가져다 쓰는데, 가져오는 순간
   아래 「잰다」가 통째로 돌아 **통보 결과 대신 이 자의 보고가 찍혔다.**
   ⛔ 내보낼 것이 있는 자는 반드시 **직접 불렸을 때만** 돌아야 한다.
   ⚠ `process.argv[1]` 과 이 파일이 같은지로 가른다. */
const { pathToFileURL } = await import('node:url');
const 직접불렸나 = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (!직접불렸나) {
  /* 가져다 쓰는 쪽이다 — 아무것도 찍지 않고 여기서 멈춘다 */
} else {

/* ── 적는다 ─────────────────────────────────────────────────────────────── */
const 적기자리 = process.argv.indexOf('--적는다');
if (적기자리 > -1) {
  const 호스트 = process.argv[적기자리 + 1];
  const 장수 = process.argv[적기자리 + 2];
  if (!호스트) { console.log('⛔ 쓰는 법: --적는다 <호스트> <장수>'); process.exit(1); }
  if (!fs.existsSync(기록길)) {
    fs.writeFileSync(기록길, '# IndexNow 보낸 기록 — 날\t호스트\t장수\n', 'utf8');
  }
  fs.appendFileSync(기록길, `${오늘글()}\t${호스트}\t${Number(장수) || 0}\n`, 'utf8');
  console.log(`✔ 적었다 — ${오늘글()} · ${호스트} · ${Number(장수) || 0}장`);
  console.log('   ⭐ 커밋·푸시까지 해야 남는다');
  process.exit(0);
}

/* ── 잰다 ───────────────────────────────────────────────────────────────── */
console.log('■ 색인 통보(IndexNow)를 언제 마지막으로 보냈나');
console.log(`   ⚠ 이 자는 「구글이 색인했나」를 못 잰다 — 구글은 IndexNow 를 안 쓴다`);
console.log(`   ⛔ 기록이 없으면 「안 보냈다」가 아니라 「모른다」다\n`);

const 줄들 = fs.existsSync(기록길) ? 줄읽기(fs.readFileSync(기록길, 'utf8')) : [];
let 운다 = 0; let 모름 = 0;
for (const { 호스트, 이름 } of 사이트들) {
  const 판 = 판정(호스트, 줄들);
  if (판.빛 === '🔴') 운다 += 1;
  if (판.빛 === '⬜') 모름 += 1;
  console.log(`  ${판.빛} ${이름.padEnd(14)} ${판.말}`);
}

console.log('');
if (운다) {
  console.log(`🔴 ${운다}곳이 ${참는날}일을 넘겼다 — 공짜이고 한도가 없다. 안 하면 손해만 있다`);
  console.log('   ✅ 보내는 법 — ping-indexnow.mjs 에 --host 를 주어 돌리고, 여기에 --적는다 로 적는다');
}
if (모름) console.log(`⬜ ${모름}곳은 기록이 없어 «모른다» — 0 으로 읽지 않는다`);
if (!운다 && !모름) console.log('✅ 네 곳 다 최근에 알렸다');
process.exit(운다 ? 1 : 0);
}
