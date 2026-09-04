/**
 * 「**자리는 좋은데 아무도 안 누르는 지면**」을 네 사이트에서 찾는다.
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-04] 사장님이 잡아 주신 것 —
 *   구글이 「지난 28일 동안 5회의 클릭수를 기록했습니다」를 보내왔고, 사장님 말씀:
 *   「**이런 거 몇 번 왔는데... 그냥 겨우 5회 그런식으로 대수롭지 않게 넘겼지**」
 *
 *   ⚠ 내가 이것을 「«우리»가 넘겼다」로 읽었더니 사장님이 바로잡아 주셨다 —
 *     「**내가 메일을 그냥 무시했다고**」 · 「**너네한테 말안했다고**」
 *
 *   🔴 그래서 고칠 것은 «태도»가 아니라 «구조»다.
 *     그 알림은 **애초에 우리에게 오지 않는다.** 사장님 편지함으로 가고,
 *     우리 메일 권한은 gmail.send 뿐이라 읽지 못한다.
 *     ⛔ 사장님이 알려 주시기를 기다리지 않는다. **우리가 정기적으로 잰다.**
 *
 *   그리고 그 5회 안에 답이 들어 있었다 — 수가 작아서 오히려 또렷했다 —
 *
 *     클릭 2회를 받은 지면   자리 9.7위 · 노출 14 · CTR 14.3%
 *     클릭 0인 지면          자리 7.1위 · 노출 50 · CTR  0.0%
 *
 *   **같은 10위권인데 하나는 14.3%, 하나는 0%다.** 자리가 아니라 제목이 가른 것이다.
 *
 * ⛔ 그래서 이 자를 만든다. 사람이 기억해서 지키는 구조를 만들지 않는다.
 *   («규칙은 문장이 아니라 검사로 둔다» — 강령 4번)
 *
 * ⚠ 이 자는 «무엇을 고칠지»를 정해 주지 않는다. 고칠 «자리»만 짚는다.
 *   제목을 어떻게 바꿀지는 그 자료를 아는 유닛이 정한다.
 */
import fs from 'node:fs';
import path from 'node:path';

/** 이 자리 안에 있으면 「사람 눈앞에 있다」고 본다 */
export const 눈앞자리 = 10;
/** 이만큼은 보여야 «안 눌린 것»이라 말할 수 있다. 노출 2회에 클릭 0 은 아무 말도 아니다 */
export const 최소노출 = 10;

export const 사이트들 = [
  { 딱지: 'kcw', 이름: 'K Culture Wire', 유닛: '5번', 밑: 'https://www.kculturewire.com' },
  { 딱지: '100y', 이름: '백년지도', 유닛: '3번', 밑: 'https://100yearmap.com' },
  { 딱지: 'seoulmarkets', 이름: 'SeoulMarkets', 유닛: '6번', 밑: 'https://seoulmarkets.com' },
  { 딱지: 'klifemap', 이름: 'KLifeMap', 유닛: '1번', 밑: 'https://klifemap.ai' },
];

/** GSC 지면별 파일에서 줄을 꺼낸다. 꼴이 두 가지라 둘 다 받는다 */
export function 줄뽑기(자료) {
  const rows = (자료 && (자료.rows || 자료.행 || 자료.데이터)) || [];
  return rows.map((r) => ({
    주소: r.key || r.page || r.url || (Array.isArray(r.keys) ? r.keys[0] : null),
    노출: Number(r.impressions ?? r.노출 ?? 0),
    클릭: Number(r.clicks ?? r.클릭 ?? 0),
    자리: r.position == null && r.자리 == null ? null : Number(r.position ?? r.자리),
  })).filter((x) => x.주소);
}

/**
 * 「눈앞에 있는데 안 눌린 것」을 고른다.
 * ⛔ 자리를 모르면 «없는 것»으로 치지 않는다 — 못 쟀다고 따로 센다.
 */
export function 새는자리(줄들, { 자리문턱 = 눈앞자리, 노출문턱 = 최소노출 } = {}) {
  const 샘 = []; const 못쟀다 = [];
  for (const x of 줄들) {
    if (x.클릭 > 0) continue;
    if (x.노출 < 노출문턱) continue;
    if (x.자리 == null || !Number.isFinite(x.자리)) { 못쟀다.push(x); continue; }
    if (x.자리 <= 자리문턱) 샘.push(x);
  }
  샘.sort((a, b) => b.노출 - a.노출);
  return { 샘, 못쟀다 };
}

/**
 * 🔴 [2026-09-04] **처방을 가르는 층.** 이것이 없으면 자가 «틀린 일»을 시킨다.
 *
 * `/market/nicaragua` 는 자리 7.7위에 노출 195, 클릭 0 이라 「제목을 고쳐라」로 잡혔다.
 * 그런데 검색어를 보니 —
 *
 *   노출 62 · 검색어 「https://www.netflix.com/tudum/top10?week=2024-11-03」
 *   노출 37 · 검색어 「"https://www.netflix.com/tudum/top10?week=20…」
 *
 * **넷플릭스 «자기 주소»를 검색한 사람들이다.** 그들은 넷플릭스를 찾는 것이지 우리를 찾는 게 아니다.
 * ⛔ 제목을 아무리 고쳐도 안 누른다. 이건 «제목 문제»가 아니라 «손님이 딴 데» 인 것이다.
 *
 * 그래서 검색어를 보고 셋으로 가른다.
 */
export function 왜안눌리나(검색어들) {
  const 합 = 검색어들.reduce((a, b) => a + (b.노출 || 0), 0);
  if (!검색어들.length || !합) return { 판정: '못 쟀다', 까닭: '이 지면에 붙은 검색어 자료가 없다' };
  /* 주소를 통째로 검색한 것 — 남의 지면을 찾는 사람이다 */
  const 주소찾기 = 검색어들.filter((q) => /^["']?https?:\/\/|^["']?www\./i.test(String(q.검색어 || '').trim()))
    .reduce((a, b) => a + b.노출, 0);
  if (주소찾기 / 합 >= 0.5) {
    return { 판정: '손님이 딴 데', 몫: +(주소찾기 / 합 * 100).toFixed(0), 까닭: '노출의 절반 넘게가 «주소를 그대로 검색»한 것이다 — 남의 지면을 찾는 사람이다' };
  }
  /* 우리 이름을 찾은 것 — 이미 우리를 아는 사람이다 */
  const 우리이름 = 검색어들.filter((q) => /kculturewire|k culture wire|100yearmap|백년지도|seoulmarkets|klifemap/i.test(String(q.검색어 || '')))
    .reduce((a, b) => a + b.노출, 0);
  if (우리이름 / 합 >= 0.5) {
    return { 판정: '우리 이름', 몫: +(우리이름 / 합 * 100).toFixed(0), 까닭: '우리 이름으로 온 노출이다 — 제목보다 «그 지면이 답인가»를 본다' };
  }
  return { 판정: '제목 문제', 몫: 100, 까닭: '뜻이 있는 검색어로 눈앞에 떴는데 안 눌렸다 — 제목·dek 을 고친다' };
}

/** 지면별로 검색어를 모은다 (query+page 자료가 있을 때만) */
export function 검색어모으기(qp) {
  const 통 = new Map();
  for (const r of (qp && (qp.rows || [])) || []) {
    const p = r.page || r.url;
    if (!p) continue;
    if (!통.has(p)) 통.set(p, []);
    통.get(p).push({ 검색어: r.key ?? r.query, 노출: Number(r.impressions || 0), 클릭: Number(r.clicks || 0) });
  }
  return 통;
}

/** 잘 눌린 지면 — 무엇을 흉내 낼지 보여 준다 */
export function 잘된자리(줄들, 몇 = 5) {
  return 줄들.filter((x) => x.클릭 > 0 && x.노출 >= 3)
    .map((x) => ({ ...x, ctr: x.클릭 / x.노출 * 100 }))
    .sort((a, b) => b.ctr - a.ctr).slice(0, 몇);
}

/** 가장 최근 지면별 파일을 고른다 */
export function 최근파일(칸, 딱지) {
  if (!fs.existsSync(칸)) return null;
  const 것들 = fs.readdirSync(칸)
    .filter((f) => f.startsWith(`gsc-${딱지}-page-`) && f.endsWith('.json'))
    .sort();
  return 것들.length ? path.join(칸, 것들[것들.length - 1]) : null;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
export function 재기() {
  const 참 = []; const 거 = [];
  const 봄 = (이름, 값) => (값 ? 참 : 거).push(이름);

  const 줄 = 줄뽑기({ rows: [
    { key: '/a', impressions: 50, clicks: 0, position: 7.1 },
    { key: '/b', impressions: 14, clicks: 2, position: 9.7 },
    { key: '/c', impressions: 172, clicks: 1, position: 32.3 },
    { key: '/d', impressions: 3, clicks: 0, position: 4.0 },
    { key: '/e', impressions: 31, clicks: 0, position: 55.8 },
    { key: '/f', impressions: 40, clicks: 0 },
  ] });
  봄('여섯 줄을 다 읽는다', 줄.length === 6);
  봄('주소가 없는 줄은 버린다', 줄뽑기({ rows: [{ impressions: 9 }] }).length === 0);

  const { 샘, 못쟀다 } = 새는자리(줄);
  봄('🔴 자리는 좋은데 클릭 0 인 곳을 찾는다', 샘.length === 1 && 샘[0].주소 === '/a');
  봄('⛔ 클릭이 있는 곳은 안 센다', !샘.some((x) => x.주소 === '/b'));
  봄('⛔ 자리가 멀면 안 센다 (55.8위)', !샘.some((x) => x.주소 === '/e'));
  봄('⛔ 노출이 너무 적으면 안 센다 (3회)', !샘.some((x) => x.주소 === '/d'));
  봄('⬜ 자리를 모르면 «없는 것»이 아니라 «못 쟀다»로 센다', 못쟀다.length === 1 && 못쟀다[0].주소 === '/f');

  const 잘 = 잘된자리(줄);
  봄('⭐ 가장 잘 눌린 곳을 CTR 순으로 낸다', 잘[0].주소 === '/b' && Math.round(잘[0].ctr) === 14);

  /* ── 처방을 가르는 층 ── */
  봄('🔴 주소를 그대로 검색한 것은 «손님이 딴 데»로 가른다',
    왜안눌리나([{ 검색어: 'https://www.netflix.com/tudum/top10?week=2024-11-03', 노출: 62 },
      { 검색어: '"https://www.netflix.com/tudum/top10?week=2024"', 노출: 37 },
      { 검색어: 'korean netflix', 노출: 5 }]).판정 === '손님이 딴 데');
  봄('뜻이 있는 검색어면 «제목 문제»로 가른다',
    왜안눌리나([{ 검색어: 'korean drama netflix', 노출: 40 }, { 검색어: 'squid game country', 노출: 20 }]).판정 === '제목 문제');
  봄('우리 이름으로 온 것은 따로 가른다',
    왜안눌리나([{ 검색어: 'kculturewire', 노출: 30 }, { 검색어: 'korean drama', 노출: 5 }]).판정 === '우리 이름');
  봄('⬜ 검색어 자료가 없으면 «못 쟀다» — 「제목 문제」로 단정하지 않는다',
    왜안눌리나([]).판정 === '못 쟀다');
  봄('노출이 0 뿐이어도 못 쟀다로 둔다', 왜안눌리나([{ 검색어: 'x', 노출: 0 }]).판정 === '못 쟀다');
  const 통 = 검색어모으기({ rows: [
    { key: 'a', page: '/x', impressions: 3, clicks: 1 },
    { key: 'b', page: '/x', impressions: 2, clicks: 0 },
    { key: 'c', page: '/y', impressions: 9, clicks: 0 }] });
  봄('지면별로 검색어를 모은다', 통.get('/x').length === 2 && 통.get('/y').length === 1);
  봄('지면이 없는 줄은 버린다', 검색어모으기({ rows: [{ key: 'a', impressions: 1 }] }).size === 0);

  봄('빈 자료에서 지어내지 않는다', 새는자리(줄뽑기({})).샘.length === 0);
  봄('문턱을 낮추면 더 잡힌다', 새는자리(줄, { 자리문턱: 60 }).샘.length === 2);
  봄('노출 문턱을 낮추면 더 잡힌다', 새는자리(줄, { 노출문턱: 1 }).샘.length === 2);
  봄('사이트 넷을 다 본다', 사이트들.length === 4);
  return { 참: 참.length, 거: 거.length, 틀린것: 거 };
}

const 나인가 = import.meta.url.endsWith(encodeURI(path.basename(String(process.argv[1] || 'x'))));
if (나인가) {
  const r = 재기();
  if (process.argv.includes('--재기')) {
    console.log(`자가시험 ${r.참}/${r.참 + r.거}`);
    if (r.거) { console.log('🔴 틀린 것:'); r.틀린것.forEach((x) => console.log('   · ' + x)); process.exit(1); }
    process.exit(0);
  }
  if (r.거) { console.log(`🔴 자가시험 ${r.거}가지 깨졌다 — 멈춘다`); r.틀린것.forEach((x) => console.log('   · ' + x)); process.exit(1); }
  console.log(`자가시험 ${r.참}/${r.참}\n`);
  console.log('■ 「자리는 눈앞인데 아무도 안 누르는 지면」 — 가장 값싼 유입 개선\n');

  let 합 = 0;
  for (const s of 사이트들) {
    const 길 = 최근파일(path.join(process.cwd(), 'src', 'data'), s.딱지);
    if (!길) { console.log(`  ⬜ ${s.이름.padEnd(16)} 지면별 GSC 자료가 없다 — 못 쟀다`); continue; }
    const 줄 = 줄뽑기(JSON.parse(fs.readFileSync(길, 'utf8')));
    const { 샘, 못쟀다 } = 새는자리(줄);
    const 노출합 = 줄.reduce((a, b) => a + b.노출, 0);
    const 클릭합 = 줄.reduce((a, b) => a + b.클릭, 0);
    const 눈앞노출 = 줄.filter((x) => x.자리 != null && x.자리 <= 눈앞자리).reduce((a, b) => a + b.노출, 0);
    합 += 샘.length;
    console.log(`── ${s.이름} (${s.유닛}) · ${path.basename(길)}`);
    console.log(`   노출 ${노출합.toLocaleString()} · 클릭 ${클릭합} · CTR ${노출합 ? (클릭합 / 노출합 * 100).toFixed(2) : '0.00'}%`
      + ` · 10위 안 노출 ${눈앞노출.toLocaleString()} (${노출합 ? (눈앞노출 / 노출합 * 100).toFixed(1) : '0'}%)`);
    /* 검색어 자료가 있으면 «왜» 안 눌리는지까지 가른다 */
    const qp길 = (() => {
      const 것들 = fs.readdirSync(path.join(process.cwd(), 'src', 'data'))
        .filter((f) => f.startsWith(`gsc-${s.딱지}-qp-`) && f.endsWith('.json')).sort();
      return 것들.length ? path.join(process.cwd(), 'src', 'data', 것들[것들.length - 1]) : null;
    })();
    const 검색어통 = qp길 ? 검색어모으기(JSON.parse(fs.readFileSync(qp길, 'utf8'))) : new Map();

    if (!샘.length) console.log('   ✅ 새는 자리 없음');
    const 갈래셈 = {};
    for (const x of 샘) {
      const 판 = 왜안눌리나(검색어통.get(x.주소) || []);
      x._판정 = 판;
      갈래셈[판.판정] = (갈래셈[판.판정] || 0) + 1;
    }
    if (샘.length) {
      console.log('   판정 — ' + Object.entries(갈래셈).map(([k, v]) => `${k} ${v}곳`).join(' · '));
    }
    for (const x of 샘.slice(0, 6)) {
      const 표 = { '제목 문제': '🔴', '손님이 딴 데': '⛔', '우리 이름': '⭐', '못 쟀다': '⬜' }[x._판정.판정] || '·';
      console.log(`   ${표} 노출 ${String(x.노출).padStart(4)} · 자리 ${x.자리.toFixed(1).padStart(5)} · [${x._판정.판정}] ${x.주소.replace(s.밑, '').slice(0, 50)}`);
    }
    if (샘.length > 6) console.log(`   … 그 밖 ${샘.length - 6}곳`);
    if (!qp길) console.log('   ⬜ 검색어(qp) 자료가 없어 «왜 안 눌리는지»는 못 쟀다');
    if (못쟀다.length) console.log(`   ⬜ 자리를 몰라 «못 잰» 지면 ${못쟀다.length}곳`);
    const 잘 = 잘된자리(줄, 2);
    if (잘.length) {
      console.log('   ⭐ 흉내 낼 것 (가장 잘 눌린 지면):');
      for (const x of 잘) console.log(`      CTR ${x.ctr.toFixed(1)}% · 자리 ${x.자리 == null ? '?' : x.자리.toFixed(1)} · ${x.주소.replace(s.밑, '').slice(0, 58)}`);
    }
    console.log('');
  }
  console.log(`■ 합계 — 눈앞인데 안 눌린 자리 ${합}곳`);
  console.log('');
  console.log('■ 판정마다 «할 일이 다르다» — 여기를 섞으면 헛일을 한다');
  console.log('   🔴 제목 문제    제목·dek 을 고친다. ⛔ 새 글을 쓰지 않는다');
  console.log('   ⛔ 손님이 딴 데  ⛔ **제목을 고쳐도 소용없다.** 남의 주소를 검색한 사람이 스쳐 간 것이다');
  console.log('                   그 노출은 «우리 수»가 아니다. CTR 을 셈할 때 빼고 본다');
  console.log('   ⭐ 우리 이름    이미 우리를 아는 사람이다. 제목보다 «그 지면이 답인가»를 본다');
  console.log('   ⬜ 못 쟀다     검색어(qp) 자료가 없다. 먼저 받는다 —');
  console.log('                   node scripts/fetch-gsc.mjs   (사이트별 query+page)');
  console.log('');
  console.log('⛔ 「수가 작아서 의미 없다」로 닫지 않는다. 작을수록 원인이 또렷하다.');
  console.log('⚠ 고친 뒤 다시 재야 고친 것이다. 「고쳤다」로 끝내지 않는다.');
}
