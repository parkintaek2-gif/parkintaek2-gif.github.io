/**
 * 서울 자치구의 **한글 이름**을 위키데이터에서 받는다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 89편은 두 자료를 맞대야 한다 — 위키 읽힘은 「Gangnam District」, KOSIS 입장객은 「강남구」다.
 * ⛔ **내가 매핑을 손으로 적지 않는다.** 스물다섯 줄쯤이라 적고 싶어지지만, 손으로 적은 표는
 *   틀려도 아무도 모른다. 8/13 에 Q번호를 외워 적었다가 러시아 사람과 폴란드 성당을 집었다.
 * ⭐ Q번호는 이미 갖고 있다. **VALUES 로 주면 SPARQL 이 가볍다** — 「모든 X 찾기」는 죽는다.
 *
 * 쓰는 법
 *   node scripts/collect-seoul-district-names.mjs
 *   node scripts/collect-seoul-district-names.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** ⚠ KOSIS 는 「강남구」로 적는다. 위키데이터 라벨이 「강남구」면 그대로, 아니면 붙인다 */
export function 구이름다듬기(라벨) {
  const s = String(라벨 ?? '').trim();
  if (!s) return null;
  if (/[구군시]$/.test(s)) return s;
  return `${s}구`;
}

/** 🔴 res.complete 이 false 면 **잘린 응답**이다. end 가 떠도 믿지 않는다 */
function 받기(url) {
  return new Promise((resolve, reject) => {
    let 끝 = false;
    const 한번만 = (f, v) => { if (!끝) { 끝 = true; clearTimeout(t); f(v); } };
    /* ⚠ req.setTimeout 은 **쉬는 시간** 재기다. 찔끔찔끔 오는 서버엔 안 걸린다. 밖에서 센다 */
    const t = setTimeout(() => { try { req.destroy(); } catch { /* */ } 한번만(reject, new Error('시간 초과')); }, 60000);
    const req = https.get(url, { headers: { 'User-Agent': 'KCultureWire/seat5 (data journalism)', Accept: 'application/sparql-results+json' } }, (res) => {
      const 조각 = [];
      res.on('data', (c) => 조각.push(c));
      res.on('end', () => {
        if (res.complete === false) return 한번만(reject, new Error('응답이 잘렸다'));
        /* ⚠ Buffer 로 이어 붙인다. 글자로 이으면 조각 경계에서 한글이 쪼개진다 */
        return 한번만(resolve, Buffer.concat(조각).toString('utf8'));
      });
    });
    req.on('error', (e) => 한번만(reject, e));
  });
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  참('구로 끝나면 그대로', 구이름다듬기('강남구') === '강남구');
  참('안 붙어 있으면 붙인다', 구이름다듬기('강남') === '강남구');
  참('군도 그대로', 구이름다듬기('옹진군') === '옹진군');
  참('시도 그대로', 구이름다듬기('용인시') === '용인시');
  참('빈 것은 null', 구이름다듬기('') === null && 구이름다듬기(null) === null);
  참('앞뒤 빈칸을 턴다', 구이름다듬기('  종로구  ') === '종로구');
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 원 = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive/raw/wikipedia/sea-places.json'), 'utf8'));
const 줄들 = 원.rows ?? 원.places ?? 원.people ?? [];
/* ⭐ 「district of Seoul」 이라 자료가 스스로 적어 두었다. 내가 이름으로 짐작하지 않는다 */
const 구들 = 줄들.filter((r) => (r.kinds ?? []).some((k) => /district of Seoul/i.test(k)));
console.log(`위키 자료에서 서울 자치구 ${구들.length}개를 골랐다`);

const q목록 = 구들.map((r) => `wd:${r.q}`).join(' ');
const sparql = `SELECT ?q ?ko WHERE { VALUES ?q { ${q목록} } ?q rdfs:label ?ko . FILTER(LANG(?ko)="ko") }`;
const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;

let 몸;
for (let 번 = 1; 번 <= 3; 번 += 1) {
  try { 몸 = await 받기(url); break; } catch (e) {
    console.log(`   ⚠ ${번}번째 실패 — ${e.message}`);
    if (번 === 3) { console.error('🔴 세 번 다 실패했다'); process.exit(1); }
    await new Promise((s) => setTimeout(s, 3000 * 번));
  }
}
/* ⚠ JSON.parse 를 try 안에서 한다 — 잘린 응답이 여기서 터지면 재시도를 못 탄다 */
let 답; try { 답 = JSON.parse(몸); } catch { console.error('🔴 답이 JSON 이 아니다'); process.exit(1); }

const 한글 = new Map();
for (const b of 답.results.bindings) {
  한글.set(b.q.value.split('/').pop(), 구이름다듬기(b.ko.value));
}

const 나감 = {
  generated: new Date().toISOString().slice(0, 10),
  source: 'Wikidata labels (CC0), Korean label of each Seoul district',
  districts: 구들.map((r) => ({
    q: r.q,
    nameEn: r.name,
    nameKo: 한글.get(r.q) ?? null,
    seaPerMillionTotal: r.seaPerMillionTotal,
    seaEditionsWithArticle: r.seaEditionsWithArticle,
  })),
};
/* ⛔ 한글을 못 받은 것을 조용히 넘기지 않는다. 그 구는 견줌에서 빠진다 */
나감.withoutKorean = 나감.districts.filter((d) => !d.nameKo).map((d) => d.nameEn);

const 길 = path.join(뿌리, 'archive/raw/wikidata/seoul-districts.json');
fs.mkdirSync(path.dirname(길), { recursive: true });
fs.writeFileSync(길, `${JSON.stringify(나감, null, 2)}\n`);
console.log(`✅ ${path.relative(뿌리, 길)}`);
console.log(`   한글 이름을 받은 것 ${나감.districts.length - 나감.withoutKorean.length}/${나감.districts.length}`);
if (나감.withoutKorean.length) console.log(`   ⚠ 못 받은 것: ${나감.withoutKorean.join(', ')}`);
for (const d of 나감.districts.slice(0, 6)) {
  console.log(`   ${String(d.nameEn).padEnd(24)} ${String(d.nameKo ?? '—').padEnd(8)} ${d.seaPerMillionTotal}`);
}
