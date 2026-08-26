/**
 * unit-hosts.mjs — **호스트 이름 → 유닛** 표 한 곳. (2026-08-26 · 5번)
 *
 * ## 왜 파일을 따로 뺐나
 *
 * 이 표는 `broadcast-visitors-dwell.mjs` 안에 있었다. 그런데 그 파일은 **직접 실행될 것**을
 * 전제로 지어져 있어서(맨 아래에서 `--잰다` 가 없으면 `process.exit(1)`), 다른 자가
 * 표만 **불러다 쓰려고만 해도 거기서 종료**됐다.
 *
 * ⛔ 그러면 표를 복사하게 된다. 복사하면 사이트가 하나 늘 때 **한쪽만 고쳐지고**,
 *   그때부터 두 자가 서로 다른 수를 낸다. 어느 쪽이 맞는지는 아무도 모른다.
 * ⭐ 자료(표)와 실행(재기)을 갈랐다. 표는 여기, 재는 것은 각자.
 *
 * ## ⛔ 모르는 호스트를 버리지 않는다
 *
 * 표에 없는 호스트가 나오면 «모름»으로 남긴다. 버리면 합이 조용히 줄고 아무도 모른다 —
 * 실제로 `port-0-web-…cloudtype.app` 이 그렇게 섞여 든다. 그것도 사람이 본 것이다.
 */

/** GA4 속성 하나(549135289)가 네 사이트를 함께 센다. 그래서 «호스트»로 갈라야 한다. */
export const 자리표 = [
  { 유닛: '3번', 이름: '백년지도', 호스트: ['100yearmap.com', 'www.100yearmap.com'] },
  { 유닛: '1·4번', 이름: 'KLifeMap', 호스트: ['klifemap.ai', 'www.klifemap.ai'] },
  { 유닛: '5번', 이름: 'K Culture Wire', 호스트: ['kculturewire.com', 'www.kculturewire.com'] },
  { 유닛: '6번', 이름: 'SeoulMarkets', 호스트: ['seoulmarkets.com', 'www.seoulmarkets.com'] },
];

/** 우리가 띄운 것이라 손님이 아닌 호스트. ⛔ 빼되, 뺐다고 화면에 적는다 */
export const 우리것 = ['127.0.0.1', 'localhost', 'parkintaek2-gif.github.io'];

/** 호스트 이름을 유닛으로 옮긴다. 모르는 호스트는 **버리지 않고** 「모름」으로 남긴다 */
export function 유닛찾기(호스트) {
  const h = String(호스트 ?? '').trim().toLowerCase();
  if (!h) return '모름';
  if (우리것.includes(h)) return '우리것';
  for (const r of 자리표) if (r.호스트.includes(h)) return r.유닛;
  return '모름';
}

/** 화면에 쓸 유닛 차례. ⛔ 「몇 등」이 아니라 늘 같은 차례로 보이게 하려는 것뿐이다 */
export const 유닛차례 = ['3번', '5번', '1·4번', '6번'];

/* ── 자가시험 ───────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('unit-hosts.mjs')
  && process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  const 검 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  검('호스트를 유닛으로 옮긴다', 유닛찾기('www.kculturewire.com') === '5번');
  검('www 없는 것도 옮긴다', 유닛찾기('kculturewire.com') === '5번');
  검('대문자가 섞여도 옮긴다', 유닛찾기('WWW.KLifeMap.AI') === '1·4번');
  검('앞뒤 빈칸이 있어도 옮긴다', 유닛찾기('  seoulmarkets.com ') === '6번');
  /* ⛔ 모르는 호스트를 조용히 버리지 않는다 — 버리면 합이 줄고 아무도 모른다 */
  검('모르는 호스트는 버리지 않고 「모름」이다', 유닛찾기('example.com') === '모름');
  검('빈 것도 「모름」이다', 유닛찾기('') === '모름' && 유닛찾기(null) === '모름');
  검('우리가 띄운 것은 「우리것」으로 갈린다', 유닛찾기('localhost') === '우리것');
  검('네 자리가 다 있다', 자리표.length === 4);
  검('유닛차례에 네 자리가 다 있다',
    유닛차례.length === 4 && 자리표.every((r) => 유닛차례.includes(r.유닛)));
  /* ⚠ 호스트가 두 표에 겹치면 어느 유닛인지 갈리지 않는다 */
  검('호스트가 두 유닛에 겹치지 않는다', (() => {
    const 본것 = new Set();
    for (const r of 자리표) for (const h of r.호스트) { if (본것.has(h)) return false; 본것.add(h); }
    return true;
  })());

  console.log(실 === 0 ? `✅ unit-hosts 자가시험 통과 (${통})` : `⛔ ${실}개 실패 / ${통}개 통과`);
  process.exit(실 === 0 ? 0 : 1);
}
