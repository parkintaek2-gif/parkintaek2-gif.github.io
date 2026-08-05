#!/usr/bin/env node
/**
 * 폐교한 대학 명단을 받아 지면이 쓸 수 있게 만든다.
 *
 *   node scripts/build-100yearmap-closed.mjs
 *   → archive/raw/kasfo/폐교현황.csv  (원자료. gitignore)
 *   → src/data/100yearmap/closed-universities.json  (빌드가 읽는 것)
 *
 * ⭐ 왜 만드나 (2026-08-05) —
 *   대학 377곳 중 **48곳은 공시 수치가 하나도 없다.** 그중 20곳이 본교인데,
 *   지면에 「이 학교가 지금도 신입생을 받는지 저희는 확인하지 못했습니다」라고 써 뒀다.
 *   **그건 우리가 안 재서 못 쓴 말이지, 알 수 없는 사실이 아니었다.**
 *   교육부 산하 한국사학진흥재단이 폐교 명단을 공개하고 있다.
 *
 * ✅ 이용허락범위 **제한 없음** (공공데이터포털에서 확인. 대학알리미와 같다)
 *   파일데이터는 로그인 없이 받는다. 오픈API 는 활용신청이 필요한데 **쓰지 않는다.**
 *   ⛔ 계정·로그인이 필요한 길은 가지 않는다.
 *
 * ⚠ **원자료는 EUC-KR 이다.** UTF-8 로 읽으면 전부 깨진다(실측 677자).
 * ⚠ 갱신주기 **연간**. 다음 등록 예정 2027-06-30.
 *
 * ⛔ **명단에 없다고 「살아 있다」고 쓰지 않는다.**
 *   통합·개명된 학교는 폐교가 아니라서 이 명단에 안 들어온다.
 *   명단에 있으면 「문을 닫았다」, 없으면 **「폐교 명단에는 없다」**까지만 쓴다.
 *   그 둘은 다르다.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 원자료 = path.join(ROOT, 'archive', 'raw', 'kasfo', '폐교현황.csv');
const OUT = path.join(ROOT, 'src', 'data', '100yearmap', 'closed-universities.json');

const 출처 = {
  기관: '한국사학진흥재단',
  이름: '폐교 및 법인 해산 현황',
  주소: 'https://www.data.go.kr/data/15112170/fileData.do',
  이용허락범위: '제한 없음',
  갱신주기: '연간',
};

/** ⚠ data.go.kr 파일데이터는 이 두 값으로 받는다. 페이지가 바뀌면 다시 찾아야 한다 */
const FILE_ID = 'FILE_000000003652450';
const FILE_SN = '1';
const 내려받기주소 = `https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${FILE_ID}&fileDetailSn=${FILE_SN}`;

async function 받기() {
  const r = await fetch(내려받기주소, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; 100yearmapBot/0.1; +https://100yearmap.com/about)',
      referer: 출처.주소,
    },
    signal: AbortSignal.timeout(40000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 300) throw new Error(`너무 작다 (${buf.length}바이트) — 받은 것이 파일이 아닐 수 있다`);
  fs.mkdirSync(path.dirname(원자료), { recursive: true });
  fs.writeFileSync(원자료, buf);
  return buf;
}

/** `한중대학교(광희학원)` → `한중대학교` */
const 학교이름만 = (s) => String(s).replace(/\s*\(.*$/, '').trim();

const buf = fs.existsSync(원자료) && !process.argv.includes('--refresh')
  ? fs.readFileSync(원자료)
  : await 받기();

/** ⚠ EUC-KR. UTF-8 로 읽으면 통째로 깨진다 */
const 본문 = new TextDecoder('euc-kr').decode(buf);
const 줄 = 본문.trim().split(/\r?\n/);
const 머리 = 줄[0].split(',');

const 목록 = 줄.slice(1).map((l) => {
  const c = l.split(',');
  return {
    구분: c[0]?.trim() ?? null,
    이름: 학교이름만(c[1]),
    법인: (c[1]?.match(/\(([^)]*)\)/) ?? [])[1] ?? null,
    폐교년도: Number(c[2]) || null,
    법인상태: c[3]?.trim() || null,
    지역: c[4]?.trim() || null,
    비고: c[5]?.trim() || null,
  };
}).filter((x) => x.이름);

/** 우리 대학 목록과 맞춰 본다 — 몇이 걸리는지 세어서 남긴다 */
const 대학 = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src', 'data', '100yearmap', 'pages-university.json'), 'utf8'),
);
const 수치있음 = (u) =>
  Boolean(u.취업률 || u.중도탈락률 || u.재학생충원율 || u.전임교원확보율 || u.재적학생 != null);
const 이름집합 = new Map(목록.map((x) => [x.이름, x]));

const 빈곳 = 대학.filter((u) => !수치있음(u));
const 걸린것 = 빈곳.filter((u) => 이름집합.has(u.표시명));
const 안걸린것 = 빈곳.filter((u) => !이름집합.has(u.표시명));
/** ⚠ 수치가 **있는데** 폐교 명단에 있으면 뭔가 어긋난 것이다. 세어서 본다 */
const 이상한것 = 대학.filter((u) => 수치있음(u) && 이름집합.has(u.표시명));

const 결과 = {
  만든날: new Date().toISOString().slice(0, 10),
  출처,
  전체: 목록.length,
  /** 우리 377곳 중 이 명단에 걸린 수 */
  우리목록과걸린수: 걸린것.length,
  자료: 목록,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(결과, null, 1));

console.log(`폐교 명단 ${목록.length}건 — ${출처.기관} · 이용허락범위 ${출처.이용허락범위}`);
console.log(`  우리 대학 377곳 중 수치가 하나도 없는 곳 ${빈곳.length}`);
console.log(`    ✅ 폐교 명단에 있음  ${걸린것.length}`);
걸린것.forEach((u) => {
  const c = 이름집합.get(u.표시명);
  console.log(`        ${u.표시명} — ${c.폐교년도}년 · 법인 ${c.법인상태}`);
});
console.log(`    ⬜ 명단에 없음      ${안걸린것.length}  ← **폐교가 아니라 통합·개명일 수 있다. 못 쟀다**`);
안걸린것.forEach((u) => console.log(`        ${u.표시명}`));
if (이상한것.length) {
  console.log(`\n⚠ 수치가 있는데 폐교 명단에도 있는 곳 ${이상한것.length}곳 — 확인이 필요하다`);
  이상한것.forEach((u) => console.log(`        ${u.표시명}`));
}
console.log(`\n→ ${path.relative(ROOT, OUT)}`);
