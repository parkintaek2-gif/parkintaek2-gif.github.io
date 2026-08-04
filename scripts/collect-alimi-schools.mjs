/**
 * 대학알리미 — **학교별** 수치 수집
 *
 * ⚠ 지역별(getRegional*)과 다르다. 학교 하나당 호출 한 번이라 **지표 하나에 377회**가 든다.
 *   일일 트래픽은 오퍼레이션당 1,000회이므로 지표 하나는 하루에 두 번까지만 다시 받을 수 있다.
 *   → 받은 것은 무조건 archive/ 에 남기고, 이미 있으면 다시 부르지 않는다.
 *
 * ⚠ getComparison* 는 **svyYr 와 schlId 를 둘 다** 줘야 한다. 하나만 주면 조용히 0건이 온다.
 *   (오류가 아니라 빈 응답이라 「승인이 안 됐나」로 오해하기 쉽다)
 *
 * 백년지도가 이걸로 무엇을 하나 —
 *   중도탈락은 「그 길로 간 사람들이 얼마나 남았나」다. 대학 페이지의 첫 숫자가 된다.
 *   ⛔ 등수를 매기지 않는다. 전체 평균과의 차이만 쓴다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'archive', 'raw', 'alimi');
const KEY = (fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^DATAGO_KEY_ALIMI=(.*)$/m) || [])[1]?.trim();
if (!KEY) throw new Error('.env 에 DATAGO_KEY_ALIMI 가 없다');

const { svyYr, list: 대학 } = JSON.parse(fs.readFileSync(path.join(OUT, 'universities.json'), 'utf8'));

const parseItems = (xml) => {
  const out = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const o = {};
    for (const f of m[1].matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)) o[f[1]] = f[2].trim();
    out.push(o);
  }
  return out;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(svc, op, params) {
  const q = new URLSearchParams({ serviceKey: KEY, pageNo: '1', numOfRows: '100', ...params });
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://apis.data.go.kr/B340014/${svc}${op}?${q}`);
      const t = await r.text();
      // ⚠ data.go.kr 은 오류도 HTTP 200 으로 준다. resultCode 를 봐야 한다.
      //   ⚠ 그런데 게이트웨이 단에서 막히면 resultCode 자체가 없고 <errMsg> 만 온다.
      //     (동시 호출을 5개로 올렸더니 384건이 이렇게 왔다 — 「?」로 뭉뚱그리면 원인을 못 본다)
      const code = (t.match(/<resultCode>(\d+)</) || [])[1];
      if (code === undefined) {
        const m = (t.match(/<errMsg>([^<]*)</) || t.match(/<returnAuthMsg>([^<]*)</) || [])[1];
        throw new Error(m ? `게이트웨이: ${m}` : `모르는 응답: ${t.slice(0, 90).replace(/\s+/g, ' ')}`);
      }
      if (code !== '00') throw new Error(`resultCode=${code}`);
      return parseItems(t);
    } catch (e) {
      if (i === 2) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

/** 동시 5개까지만. 상대 서버를 두들기지 않는다 */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const k = i++;
        try {
          out[k] = await fn(items[k], k);
        } catch (e) {
          out[k] = { _error: String(e.message || e) };
        }
      }
    }),
  );
  return out;
}

const 지표 = [
  ['StudentService', '/getComparisonDropOutStudentCrntSt', 'dropout', '중도탈락'],
  ['StudentService', '/getComparisonEnrolledStudentCrntSt', 'enrolled', '재적학생'],
];

// ⚠ 동시 5개는 게이트웨이가 막았다. 2개로 내린다. 느려도 다시 부르는 것보다 싸다
//   (트래픽은 오퍼레이션당 하루 1,000회다 — 실패분 재호출도 그 한도를 먹는다)
const 동시 = 2;

for (const [svc, op, file, name] of 지표) {
  const dest = path.join(OUT, `school-${file}.json`);

  // 이미 받은 것은 다시 안 부른다. **실패한 것만** 다시 부른다(이어받기)
  let 기존 = new Map();
  if (fs.existsSync(dest)) {
    for (const r of JSON.parse(fs.readFileSync(dest, 'utf8')).rows) {
      if (!r._error && r.items) 기존.set(r.schlId, r);
    }
  }
  const 남은것 = 대학.filter((u) => !기존.has(u.schlId));
  if (남은것.length === 0) {
    console.log(`${name} — ${기존.size}개교 전부 있다. 건너뛴다`);
    continue;
  }
  console.log(`${name} — 이미 ${기존.size} · 받을 것 ${남은것.length}개교 (동시 ${동시})`);

  let done = 0;
  const 새것 = await mapLimit(남은것, 동시, async (u) => {
    const items = await call(svc, op, { svyYr, schlId: u.schlId });
    if (++done % 50 === 0) console.log(`  ${done}/${남은것.length}`);
    return { schlId: u.schlId, schlKrnNm: u.schlKrnNm, items };
  });
  새것.forEach((r, i) => 기존.set(남은것[i].schlId, r._error ? { schlId: 남은것[i].schlId, schlKrnNm: 남은것[i].schlKrnNm, _error: r._error } : r));

  const rows = 대학.map((u) => 기존.get(u.schlId));
  const 오류목록 = {};
  rows.filter((r) => r._error).forEach((r) => (오류목록[r._error] = (오류목록[r._error] || 0) + 1));
  const 값있음 = rows.filter((r) => r.items && r.items.length).length;
  const 빈것 = rows.filter((r) => !r._error && (!r.items || r.items.length === 0)).length;
  fs.writeFileSync(dest, JSON.stringify({ svyYr, op, rows }, null, 1));
  console.log(`  저장 ${path.basename(dest)} — 값 ${값있음} · 빈 응답 ${빈것} · 오류 ${rows.length - 값있음 - 빈것}`);
  if (Object.keys(오류목록).length) console.log('  남은 오류:', JSON.stringify(오류목록));
}

console.log('끝. 원자료 →', path.relative(ROOT, OUT));
