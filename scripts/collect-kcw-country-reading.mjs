/**
 * K Culture Wire — **나라마다, 그 나라 사람이 실제로 읽은 것 중 한국 것은 몇 개인가.**
 *
 * ── 왜 이 자인가 ───────────────────────────────────────────────
 * 사장님 지시(2026-09-07): 「어떤 콘텐트를 만들던지 우린 데이터저널리즘이니 만큼
 *   사람들의 관심을 끌게 «가공한 데이터»를 포함하고」 ·
 *   「다른 분야 케이컬쳐 콘텐트에도 관심가게 할 수 있는 데이터를 꼭 포함해」
 *
 * 오늘 이슈 두 건이 같은 나라를 가리켰다 —
 *   「한국 대통령이 «정체 모를» K팝 팀을 멕시코에 데려간다 · 팬들이 벌써 알아맞히는 중」
 *   「멕시코 Canal 5 가 더빙한 한국 드라마를 산다」
 * ⭐ 팬들은 «짐작»하고 있다. 우리는 그 나라가 «실제로 무엇을 읽었나»를 낼 수 있다.
 *
 * ── ⭐ 이 자만 쓰는 우물 ───────────────────────────────────────
 * Wikimedia `top-per-country` — **나라별로 그날 가장 많이 읽힌 문서**를 준다.
 * 차트 순위(누가 올렸나)가 아니라 **그 나라 사람이 스스로 찾아본 것**이다.
 *
 * ── ⛔ 지키는 것 ───────────────────────────────────────────────
 * ⛔ 상위 목록에 «안 든» 것을 0 으로 안 쓴다 — 「그날 상위에 못 들었다」이지 「아무도 안 읽었다」가 아니다
 * ⛔ 열람수는 원본이 100 단위로 반올림돼 온다(views_ceil). 그대로 적고 정밀한 척 안 한다
 * ⛔ 나라를 줄세워 「한류 강국」이라 안 부른다. 나란히 놓고 무엇이 읽혔는지를 적는다
 * ⛔ 한국 것인지는 이름 눈대중이 아니라 **위키데이터**로 가른다(P27 국적·P495 제작국·P17 나라)
 *
 * 쓰는 법:  node scripts/collect-kcw-country-reading.mjs [--날수=14] [--적는다]
 */
import fs from 'node:fs';
import path from 'node:path';

const UA = { 'User-Agent': 'KCultureWire/1.0 (https://www.kculturewire.com; u5@klifedesign.net)' };
const 한국 = 'Q884';

/* ── 잴 나라 — 「크다」가 아니라 «왜 넣었나»를 옆에 적는다 ───────────── */
export const 나라들 = [
  { 코드: 'MX', 이름: 'Mexico', 까닭: '오늘 이슈 두 건이 이 나라를 가리켰다' },
  { 코드: 'BR', 이름: 'Brazil', 까닭: '라틴아메리카에서 가장 큰 시장' },
  { 코드: 'AR', 이름: 'Argentina', 까닭: '라틴아메리카 비교군' },
  { 코드: 'CL', 이름: 'Chile', 까닭: '라틴아메리카 비교군' },
  { 코드: 'CO', 이름: 'Colombia', 까닭: '라틴아메리카 비교군' },
  { 코드: 'PE', 이름: 'Peru', 까닭: '라틴아메리카 비교군' },
  { 코드: 'ES', 이름: 'Spain', 까닭: '같은 말을 쓰지만 대륙이 다르다 — 말인가 대륙인가를 가른다' },
  { 코드: 'US', 이름: 'United States', 까닭: '영어권 기준선' },
  { 코드: 'GB', 이름: 'United Kingdom', 까닭: '영어권 기준선' },
  { 코드: 'PH', 이름: 'Philippines', 까닭: '동남아 — 우리 손님이 많은 곳' },
  { 코드: 'ID', 이름: 'Indonesia', 까닭: '동남아 최대' },
  { 코드: 'MY', 이름: 'Malaysia', 까닭: '동남아' },
  { 코드: 'TH', 이름: 'Thailand', 까닭: '동남아' },
  { 코드: 'VN', 이름: 'Vietnam', 까닭: '동남아' },
  { 코드: 'IN', 이름: 'India', 까닭: '인구 최대 · 최근 유입이 는 곳' },
  { 코드: 'JP', 이름: 'Japan', 까닭: '이웃' },
  { 코드: 'FR', 이름: 'France', 까닭: '유럽' },
  { 코드: 'DE', 이름: 'Germany', 까닭: '유럽' },
  { 코드: 'PL', 이름: 'Poland', 까닭: '유럽 · 자주 빠지는 곳' },
  { 코드: 'TR', 이름: 'Turkey', 까닭: '드라마 소비가 큰 나라' },
];

/* ── 문서가 아닌 것 — 대문·검색·관리 지면 ────────────────────────── */
export const 문서아님 = [
  /^Main_Page$/i, /^Portada$/i, /^Wikipedia:/i, /^Wikipedia_?talk:/i, /^Especial:/i,
  /^Special:/i, /^Sp.cial:/i, /^Speciaal:/i, /^Spezial:/i, /^Specjalna:/i,
  /^Halaman_Utama$/i, /^Trang_Ch/i, /^Hauptseite$/i, /^Accueil/i,
  /^Wikip.dia:/i, /^Portal:/i, /^Categor/i, /^Category:/i, /^Musamman:/i,
  /^Vikipedi:/i, /^Ana_?[Ss]ayfa$/i, /^Strona_g/i, /^P.gina_?[Pp]rincipal$/i,
  /RecentChanges$/i, /^Istimewa:/i, /^Espesyal:/i, /^Toiminnot:/i,
];

export function 문서인가(제목) {
  const t = String(제목 ?? '');
  if (!t) return false;
  /* ⭐ 한글·일본어·태국어 대문은 위 정규식으로 못 잡는다 — 낱낱이 적는다 */
  const 대문들 = ['대문', 'メインページ', 'หน้าหลัก', '首页', '首頁', 'Bosh_Sahifa', 'Trang_Chính', 'Página_principal', 'Pàgina_principal'];
  if (대문들.includes(t)) return false;
  return !문서아님.some((re) => re.test(t));
}

/* ⭐ 「위키백과」판만 본다 — 위키낱말사전·위키문헌은 읽는 결이 다르다 */
export function 위키백과인가(프로젝트) {
  return /^[a-z-]+\.wikipedia$/.test(String(프로젝트 ?? ''));
}

/** 100 단위로 반올림돼 온 수 — 그대로 쓰되 「대략」임을 이름에 남긴다 */
export function 대략열람(a) {
  const v = a?.views_ceil ?? a?.views;
  return Number.isFinite(Number(v)) ? Number(v) : null;
}

/** 한국 것인가 — 위키데이터 항목 하나를 보고 판정한다 */
export function 한국것인가(항목) {
  const c = 항목?.claims;
  if (!c) return { 한국: false, 까닭: '주장이 없다' };
  const 본다 = (P) => (c[P] ?? []).map((s) => s?.mainsnak?.datavalue?.value?.id).filter(Boolean);
  if (본다('P27').includes(한국)) return { 한국: true, 까닭: '국적이 한국(P27)' };
  if (본다('P495').includes(한국)) return { 한국: true, 까닭: '제작국이 한국(P495)' };
  if (본다('P17').includes(한국)) return { 한국: true, 까닭: '나라가 한국(P17)' };
  return { 한국: false, 까닭: '한국을 가리키는 주장이 없다' };
}

/** 나라 하나의 셈 — ⛔ 상위에 못 든 것을 0 으로 안 쓴다 */
export function 나라재기({ 이름, 코드, 잰날수, 본문서, 한국문서, 한국열람, 전체열람 }) {
  if (!잰날수) return null;
  const 몫 = 전체열람 ? +(한국열람 / 전체열람 * 100).toFixed(2) : null;
  return {
    이름, 코드, 잰날수,
    본문서, 한국문서,
    한국열람, 전체열람, 몫,
    하루평균한국문서: +(한국문서 / 잰날수).toFixed(2),
  };
}

/* ── 자가시험 ─────────────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0; let 실 = 0;
  const 봐 = (말, 참) => { if (참) { 통++; console.log('  ✅ ' + 말); } else { 실++; console.log('  🔴 ' + 말); } };

  봐('대문은 문서가 아니다', !문서인가('Main_Page') && !문서인가('Portada'));
  봐('한글·일어 대문도 문서가 아니다', !문서인가('대문') && !문서인가('メインページ'));
  봐('검색 지면은 문서가 아니다', !문서인가('Especial:Buscar') && !문서인가('Special:Search'));
  봐('관리 지면은 문서가 아니다', !문서인가('Wikipedia:Featured_pictures'));
  봐('최근바뀜은 어느 말이든 문서가 아니다', !문서인가('Musamman:RecentChanges') && !문서인가('Special:RecentChanges'));
  봐('보통 문서는 문서다', 문서인가('BTS') && 문서인가('El_juego_del_calamar'));
  봐('빈 제목은 문서가 아니다', !문서인가('') && !문서인가(null));
  봐('위키백과판만 본다', 위키백과인가('es.wikipedia') && !위키백과인가('ha.wiktionary'));
  봐('언어코드에 하이픈이 있어도 위키백과다', 위키백과인가('zh-yue.wikipedia'));

  봐('views_ceil 을 읽는다', 대략열람({ views_ceil: 3400 }) === 3400);
  봐('views 만 있으면 그것을 읽는다', 대략열람({ views: 12 }) === 12);
  봐('⛔ 수가 없으면 0 이 아니라 null 이다', 대략열람({}) === null);

  const 사람 = { claims: { P27: [{ mainsnak: { datavalue: { value: { id: 'Q884' } } } }] } };
  const 작품 = { claims: { P495: [{ mainsnak: { datavalue: { value: { id: 'Q884' } } } }] } };
  const 남 = { claims: { P27: [{ mainsnak: { datavalue: { value: { id: 'Q17' } } } }] } };
  봐('국적이 한국이면 한국 것', 한국것인가(사람).한국 === true);
  봐('제작국이 한국이면 한국 것', 한국것인가(작품).한국 === true);
  봐('일본 국적은 한국 것이 아니다', 한국것인가(남).한국 === false);
  봐('⛔ 주장이 없으면 까닭을 남긴다', 한국것인가({}).까닭 === '주장이 없다');
  봐('까닭을 늘 적는다', typeof 한국것인가(사람).까닭 === 'string' && 한국것인가(사람).까닭.length > 0);

  const n = 나라재기({ 이름: 'Mexico', 코드: 'MX', 잰날수: 14, 본문서: 500, 한국문서: 20, 한국열람: 40000, 전체열람: 1000000 });
  봐('몫을 백분율로 낸다', n.몫 === 4);
  봐('하루평균을 낸다', n.하루평균한국문서 === 1.43);
  봐('⛔ 잰 날이 0 이면 셈을 내지 않는다', 나라재기({ 이름: 'X', 코드: 'XX', 잰날수: 0 }) === null);
  봐('전체 열람이 0 이면 몫은 0 이 아니라 null', 나라재기({ 이름: 'X', 코드: 'XX', 잰날수: 3, 본문서: 0, 한국문서: 0, 한국열람: 0, 전체열람: 0 }).몫 === null);

  console.log(`\n나라별 읽은 것을 재는 자 — 자가시험 ${통}가지 통과 · ${실}가지 실패`);
  if (실) process.exit(1);
  return 통;
}

/* ── 받아오기 ─────────────────────────────────────────────────── */
async function 받기(주소) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(주소, { headers: UA });
      if (r.ok) return await r.json();
      if (r.status === 404) return null;            // 그날 자료가 아직 없다
      if (r.status === 429) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue; }
      return { 못받음: r.status };
    } catch (e) {
      if (i === 2) return { 못받음: e.message };
      await new Promise((s) => setTimeout(s, 800));
    }
  }
  return { 못받음: '세 번 다 실패' };
}

const 두자리 = (n) => String(n).padStart(2, '0');

async function 주된일() {
  const 통 = 자가시험();
  const 날수 = Number((process.argv.find((a) => a.startsWith('--날수=')) || '').split('=')[1]) || 14;
  const 적나 = process.argv.includes('--적는다');

  /* 어제까지 — 오늘치는 아직 안 찬다 */
  const 끝 = new Date(); 끝.setDate(끝.getDate() - 1);
  const 날들 = [];
  for (let i = 0; i < 날수; i++) {
    const d = new Date(끝); d.setDate(d.getDate() - i);
    날들.push({ y: d.getFullYear(), m: 두자리(d.getMonth() + 1), d: 두자리(d.getDate()) });
  }
  const 첫 = 날들[날들.length - 1]; const 막 = 날들[0];
  const 창 = `${첫.y}-${첫.m}-${첫.d} ~ ${막.y}-${막.m}-${막.d}`;
  console.log(`\n■ ${나라들.length}개 나라 × ${날수}일 — ${창}\n`);

  /* 1. 나라별로 그날 상위 문서를 긁는다 */
  const 나라별 = [];
  const 못받은날 = [];
  for (const 나라 of 나라들) {
    const 쌓 = new Map();
    let 받은날 = 0;
    for (const t of 날들) {
      const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top-per-country/${나라.코드}/all-access/${t.y}/${t.m}/${t.d}`;
      const j = await 받기(u);
      if (!j || j.못받음) { 못받은날.push({ 나라: 나라.코드, 날: `${t.y}-${t.m}-${t.d}`, 까닭: j?.못받음 ?? '자료 없음(404)' }); continue; }
      받은날++;
      for (const a of (j.items?.[0]?.articles ?? [])) {
        if (!위키백과인가(a.project)) continue;
        if (!문서인가(a.article)) continue;
        const v = 대략열람(a);
        if (v == null) continue;
        const 열쇠 = `${a.project}|${a.article}`;
        const 앞 = 쌓.get(열쇠) ?? { 프로젝트: a.project, 제목: a.article, 열람합: 0, 나온날: 0 };
        앞.열람합 += v; 앞.나온날 += 1;
        쌓.set(열쇠, 앞);
      }
    }
    나라별.push({ 나라, 받은날, 쌓 });
    console.log(`  ${나라.코드} ${나라.이름.padEnd(16)} 받은날 ${받은날}/${날수} · 문서 ${쌓.size}`);
  }

  /* 2. 나온 문서를 위키데이터로 가른다 — 프로젝트별 50개씩 «묶어» 물어 후보를 좁힌다 */
  const 모든문서 = new Map();
  for (const { 쌓 } of 나라별) for (const k of 쌓.keys()) 모든문서.set(k, null);
  console.log(`\n■ 서로 다른 문서 ${모든문서.size.toLocaleString('en-US')}개를 위키데이터로 가른다`);

  const 사이트이름 = (p) => p.replace('.wikipedia', '').replace(/-/g, '_') + 'wiki';
  const 프로젝트별 = new Map();
  for (const k of 모든문서.keys()) {
    const i = k.indexOf('|');
    const p = k.slice(0, i); const t = k.slice(i + 1);
    if (!프로젝트별.has(p)) 프로젝트별.set(p, []);
    프로젝트별.get(p).push(t);
  }

  /* ⭐ 묶어 물으면 «어느 제목이 어느 항목인지»를 못 되짚는다.
     그래서 묶음 물음은 «이 묶음에 한국 것이 있나»를 보는 데만 쓰고,
     한국 것이 든 묶음은 하나씩 다시 물어 확정한다. ⛔ 묶음째로 한국이라 찍지 않는다. */
  const 확정후보 = [];
  const 못가른것 = [];
  for (const [p, 제목들] of 프로젝트별) {
    for (let i = 0; i < 제목들.length; i += 50) {
      const 묶음 = 제목들.slice(i, i + 50);
      const u = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims'
        + `&sites=${사이트이름(p)}&titles=${묶음.map((t) => encodeURIComponent(t.replace(/_/g, ' '))).join('|')}`;
      const j = await 받기(u);
      if (!j || j.못받음 || !j.entities) { 못가른것.push({ 프로젝트: p, 몇개: 묶음.length, 까닭: j?.못받음 ?? '답이 비었다' }); continue; }
      const 한국것수 = Object.values(j.entities).filter((e) => e && e.missing === undefined && 한국것인가(e).한국).length;
      if (한국것수 > 0) for (const t of 묶음) 확정후보.push({ p, t });
    }
  }
  console.log(`  한국 것이 든 묶음의 문서 ${확정후보.length}개 — 하나씩 다시 본다`);

  let 확정 = 0;
  for (const { p, t } of 확정후보) {
    const u = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels&languages=en'
      + `&sites=${사이트이름(p)}&titles=${encodeURIComponent(t.replace(/_/g, ' '))}`;
    const j = await 받기(u);
    const ent = j?.entities ? Object.values(j.entities).find((e) => e && e.missing === undefined) : null;
    if (!ent) continue;
    const 판 = 한국것인가(ent);
    if (!판.한국) continue;
    모든문서.set(`${p}|${t}`, { 한국: true, 까닭: 판.까닭, q: ent.id, 라벨: ent.labels?.en?.value ?? null });
    확정++;
  }
  console.log(`  ⭐ 하나씩 다시 봐서 «확정»된 한국 문서 ${확정}개`);

  /* 3. 나라별로 센다 */
  const 줄 = [];
  for (const { 나라, 받은날, 쌓 } of 나라별) {
    let 한국문서 = 0; let 한국열람 = 0; let 전체열람 = 0;
    const 무엇 = [];
    for (const [열쇠, v] of 쌓) {
      전체열람 += v.열람합;
      const 판 = 모든문서.get(열쇠);
      if (판?.한국) {
        한국문서++; 한국열람 += v.열람합;
        무엇.push({ 제목: v.제목.replace(/_/g, ' '), 프로젝트: v.프로젝트, 열람: v.열람합, 나온날: v.나온날, 이름: 판.라벨, q: 판.q });
      }
    }
    무엇.sort((a, b) => b.열람 - a.열람);
    const n = 나라재기({ 이름: 나라.이름, 코드: 나라.코드, 잰날수: 받은날, 본문서: 쌓.size, 한국문서, 한국열람, 전체열람 });
    if (n) 줄.push({ ...n, 까닭: 나라.까닭, 무엇: 무엇.slice(0, 15) });
  }
  줄.sort((a, b) => (b.몫 ?? -1) - (a.몫 ?? -1));

  console.log('\n■ 나라별 — 그 나라 상위 읽은 것 중 한국 것');
  for (const r of 줄) {
    console.log(`  ${r.코드}  한국 문서 ${String(r.한국문서).padStart(3)}개 · 열람 몫 ${r.몫 === null ? '못 잼' : r.몫 + '%'}`
      + (r.무엇[0] ? `  맨위: ${r.무엇[0].제목} (${r.무엇[0].열람.toLocaleString('en-US')})` : '  ⬜ 상위에 든 한국 것 없음'));
  }

  const 낼것 = {
    잰때: new Date().toLocaleString('ko-KR'),
    창, 날수,
    우물: 'Wikimedia REST — pageviews/top-per-country (all-access) · 판정은 Wikidata P27·P495·P17',
    이것이무엇인가: '나라마다 그날 가장 많이 읽힌 위키백과 문서 목록을 날마다 모아, 그중 한국 것이 몇 개이고 열람의 몇 %인지 센 것이다.',
    이것이아닌것: [
      '⛔ 「그 나라에서 한국 문서가 읽힌 총량」이 아니다 — «상위 목록에 든 것»만 센다.',
      '⛔ 상위에 못 든 것은 0 이 아니라 «못 잰 것»이다. 0 으로 채우지 않았다.',
      '⛔ 열람수는 원본이 100 단위로 반올림해 준다(views_ceil). 정밀한 수가 아니다.',
      '⛔ 시청·구매가 아니라 «찾아본 것»이다.',
    ],
    못받은날: 못받은날.slice(0, 40),
    못받은날수: 못받은날.length,
    못가른것,
    서로다른문서: 모든문서.size,
    한국으로확정된문서: 확정,
    나라: 줄,
  };

  if (적나) {
    const 어디 = path.join('src', 'data', 'kcw-country-reading.json');
    fs.writeFileSync(어디, JSON.stringify(낼것, null, 1), 'utf8');
    console.log(`\n📁 적었다 — ${어디}`);
  } else {
    console.log('\n⬜ --적는다 를 안 줘서 파일로 안 적었다.');
  }
  console.log(`자가시험 ${통}가지 통과.`);
}

if (process.argv.includes('--시험만')) { 자가시험(); }
else { 주된일().catch((e) => { console.error('🔴', e); process.exit(1); }); }
