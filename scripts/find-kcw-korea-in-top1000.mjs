/**
 * 세계 상위 1,000 안에 «한국» 몇 장인가 — 매일 잴 수 있는 자
 *
 * ⭐ 사장님 상시 지시 — 「오늘 뜨거운 이슈의 스타를 우리 데이터로 보여준다」.
 *    이 자가 그 «오늘»을 잡아 준다. 어제 상위 1000에서 한국 것을 골라 낸다.
 *
 * ── 🔴 2026-09-01 에 이 자가 두 번 틀렸다. 둘 다 여기 박아 둔다 ──────────
 *
 * ① **주소로 짝지으면 안 된다.** 처음에 위키데이터에 `<https://en.wikipedia.org/wiki/X>`
 *    꼴로 물었더니 «상위 1000에 없는 문서»가 섞여 나왔다. 되짚을 방법이 없다.
 *    ⇒ 제목 → QID → 한국인가, 세 걸음으로 나누고 «슬러그를 그대로 지킨다».
 *
 * ② 🔴 **`redirects=1` 을 쓰면 안 된다.** 넘겨진 뒤 제목이 바뀌면 내가 물어본 슬러그와
 *    짝이 끊긴다. `Mousetrap_(TV_series)`(한국 드라마 「들쥐」, 그날 세계 157위)가
 *    영어 낱말 `Mousetrap`(쥐덫)에 붙어 돌아왔고, 나는 쥐덫을 확인하고
 *    「한국 것이 아니다」로 «버릴 뻔했다». 하루치 기사가 통째로 날아갈 뻔한 것이다.
 *    ⇒ `normalized` 는 되짚고 `redirects` 는 «아예 켜지 않는다».
 *
 * ⚠ 못 잰 것을 0 으로 안 쓴다 — QID 가 안 붙거나 조회가 막힌 장수를 따로 센다.
 */
import fs from 'node:fs';

export const UA = 'KCultureWire/1.0 (https://www.kculturewire.com; u5@klifedesign.net)';
export const 한국 = 'wd:Q884';
/** 🔴 이 값을 true 로 바꾸지 말 것. 위 ②를 읽으십시오. */
export const 넘김따라가기 = false;
export const 제목묶음 = 50;    // mediawiki titles= 한도
export const QID묶음 = 200;

export const 묶음 = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

/** 상위 1000 목록에서 셀 것이 아닌 줄을 걸러 낸다 */
export const 셀것인가 = (슬러그) => !/^(Main_Page|Special:|Wikipedia:|Portal:|-$)/.test(슬러그);

/**
 * mediawiki 응답에서 «내가 물어본 슬러그» 로 되짚는다.
 * 🔴 normalized 만 되짚는다 — redirects 는 켜지 않으므로 여기 없다.
 */
export function 되짚기(질의결과) {
  const 되돌림 = {};
  for (const x of (질의결과.query?.normalized ?? [])) 되돌림[x.to] = x.from;
  const 짝 = {};
  for (const p of Object.values(질의결과.query?.pages ?? {})) {
    const 원제목 = 되돌림[p.title] ?? p.title;
    const q = p.pageprops?.wikibase_item;
    if (q) 짝[원제목.replace(/ /g, '_')] = q;
  }
  return 짝;
}

const 자자 = async (f, n = 3) => { for (let i = 0; i < n; i++) { try { const r = await f(); if (r.ok) return r; } catch { /* 다시 */ } } return null; };

export async function 상위1000(판, Y, M, D) {
  const r = await 자자(() => fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${판}.wikipedia/all-access/${Y}/${M}/${D}`, { headers: { 'user-agent': UA } }));
  if (!r) return null;
  return (await r.json()).items[0].articles.map((a) => ({ 순위: a.rank, 슬러그: a.article, 열람: a.views }));
}

export async function 한국것찾기(판, 목록) {
  const arts = 목록.filter((a) => 셀것인가(a.슬러그));
  const 슬러그QID = {}; let 제목못잼 = 0;
  for (const c of 묶음(arts, 제목묶음)) {
    const 주소 = `https://${판}.wikipedia.org/w/api.php?action=query&format=json&prop=pageprops&ppprop=wikibase_item`
      + (넘김따라가기 ? '&redirects=1' : '')
      + '&titles=' + encodeURIComponent(c.map((a) => a.슬러그.replace(/_/g, ' ')).join('|'));
    const r = await 자자(() => fetch(주소, { headers: { 'user-agent': UA } }));
    if (!r) { 제목못잼 += c.length; continue; }
    const 짝 = 되짚기(await r.json());
    const 붙은수 = Object.keys(짝).length;
    제목못잼 += Math.max(0, c.length - 붙은수);
    Object.assign(슬러그QID, 짝);
  }
  const QID슬러그 = {};
  for (const [s, q] of Object.entries(슬러그QID)) (QID슬러그[q] = QID슬러그[q] ?? []).push(s);

  const 결과 = []; let QID못잼 = 0;
  for (const c of 묶음(Object.keys(QID슬러그), QID묶음)) {
    const Q = `SELECT ?item ?itemLabel WHERE { VALUES ?item { ${c.map((x) => 'wd:' + x).join(' ')} } `
      + `{ ?item wdt:P495 ${한국} } UNION { ?item wdt:P27 ${한국} } `
      + 'SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }';
    const r = await 자자(() => fetch('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded', accept: 'application/sparql-results+json' },
      body: 'query=' + encodeURIComponent(Q),
    }));
    if (!r) { QID못잼 += c.length; continue; }
    for (const b of (await r.json()).results.bindings) {
      const q = b.item.value.split('/').pop();
      for (const s of (QID슬러그[q] ?? [])) {
        const a = arts.find((x) => x.슬러그 === s);
        if (!a) continue;   // ⛔ 상위 1000 에 없는 슬러그는 버린다 — 위 ①
        결과.push({ QID: q, 슬러그: s, 이름: b.itemLabel.value, 순위: a.순위, 열람: a.열람 });
      }
    }
  }
  결과.sort((a, b) => a.순위 - b.순위);
  return { 훑은것: arts.length, 못잰것: 제목못잼 + QID못잼, 한국: 결과 };
}

/* ── 자가시험 ───────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 실패 = []; let 센것 = 0;
  const 검 = (이름, 참) => { 센것 += 1; if (!참) 실패.push(이름); };

  // ① 🔴 넘김을 따라가면 안 된다 — 2026-09-01 결함
  검('① redirects 를 켜지 않는다', 넘김따라가기 === false);

  // ② 되짚기가 normalized 를 «되돌린다»
  const 짝 = 되짚기({ query: {
    normalized: [{ from: 'Mousetrap (TV series)', to: 'Mousetrap (TV series)' }],
    pages: { 1: { title: 'Mousetrap (TV series)', pageprops: { wikibase_item: 'Q140198906' } } },
  } });
  검('② 슬러그가 그대로 남는다', 짝['Mousetrap_(TV_series)'] === 'Q140198906');
  검('② 쥐덫에 붙지 않는다', 짝.Mousetrap === undefined);

  // ③ QID 없는 문서는 짝에 안 들어간다 (0 으로 안 센다)
  const 짝2 = 되짚기({ query: { pages: { 1: { title: 'Foo' } } } });
  검('③ QID 없으면 버린다', Object.keys(짝2).length === 0);

  // ④ 셀 것 거르기
  검('④ Main_Page 는 안 센다', 셀것인가('Main_Page') === false);
  검('④ Special: 는 안 센다', 셀것인가('Special:Search') === false);
  검('④ 보통 문서는 센다', 셀것인가('Mousetrap_(TV_series)') === true);

  // ⑤ 묶음이 다 담긴다
  검('⑤ 묶음이 빠뜨리지 않는다', 묶음([1, 2, 3, 4, 5], 2).flat().length === 5);

  console.log(실패.length ? `⛔ ${센것}개 중 ${실패.length}개 실패\n   ` + 실패.join('\n   ') : `✅ 자가시험 ${센것}개 다 통과`);
  process.exit(실패.length ? 1 : 0);
}

/* ── 돌리기 ─────────────────────────────────────────────────── */
if (!process.argv.includes('--자가시험')) {
  const 판 = 'en';
  const 며칠전 = Number(process.argv[process.argv.indexOf('--며칠전') + 1]) || 2;
  const x = new Date(Date.now() - 며칠전 * 864e5);
  const [Y, M, D] = [x.getFullYear(), String(x.getMonth() + 1).padStart(2, '0'), String(x.getDate()).padStart(2, '0')];
  const 목록 = await 상위1000(판, Y, M, D);
  if (!목록) { console.log(`⬜ ${Y}-${M}-${D} 상위 1000 을 **못 받았다**. 어제치는 확정 전이라 없을 수 있다.`); process.exit(0); }
  const r = await 한국것찾기(판, 목록);
  console.log(`\n■ ${판}.wikipedia 상위 1,000 · ${Y}-${M}-${D}`);
  console.log(`   훑은 것 ${r.훑은것}장 · ⬜ 못 잰 것 ${r.못잰것}장(0 으로 안 씀) · ⭐ 한국 ${r.한국.length}장\n`);
  for (const k of r.한국) console.log(`   #${String(k.순위).padStart(4)}  ${String(k.열람).padStart(7)}회  ${k.이름}  [${k.슬러그}]`);
  if (!r.한국.length) console.log('   — 한 장도 없다. 그것도 결과다.');
  const 길 = 'src/data/kcw-korea-in-top1000.json';
  fs.writeFileSync(길, JSON.stringify({ 판, 날: `${Y}-${M}-${D}`, ...r }, null, 1));
  console.log(`\n   → ${길}`);
}
