/**
 * company-slug.mjs — **회사 이름으로 주소를 만든다.** (5번, 2026-09-22)
 *
 * ── 🔴 왜 이 자가 생겼나 ────────────────────────────────────────────────
 * 사장님 지시 (2026-09-22): 「**백년지도의 노하우 적용은 케이라이프맵과 에스마켓에
 * 일단 해. 이 두 사이트가 중요하다**」
 *
 * 그 「노하우」를 재서 알아낸 것은 이것이다 — **한 자료로 지면 수천 장을 찍는 것.**
 *   백년지도  /school 2,525장 · /college-major 837장  → 진짜 손님 7명 → 16명 (유일하게 늘었다)
 *   서울마켓츠 회사 지면 «0장»                          → 진짜 손님 2명 → 2명 (제자리)
 * 그런데 자료는 서울마켓츠가 더 많다 — 한국 상장사 **2,709개사 × 3년**.
 *
 * ⭐ 지면 주소는 한 번 나가면 못 바꾼다. 검색엔진이 그 주소로 색인하고, 바꾸면 그동안
 *   쌓은 것이 날아간다. **그래서 여기가 이 일에서 제일 먼저 굳혀야 하는 자리다.**
 *
 * ── 백년지도에서 그대로 가져온 것 ───────────────────────────────────────
 * 🔴 **이름이 겹치면 구분자를 붙인다.** 백년지도는 「강동고」가 서울·대구·울산에 있어
 *   216장의 제목이 같았다. 검색 결과에 나란히 뜨면 고를 수가 없다.
 *   ⇒ 여기서도 slug 가 겹치면 **종목코드를 뒤에 붙인다.** 안 겹치는 것은 짧게 둔다.
 * 🔴 **겹치는 것에만 붙인다** — 안 겹치는 2,309장까지 길어질 이유가 없다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────────────────
 * ⛔ 「(주)」·「CO.,LTD」 같은 **법인 꼬리표만** 뗀다. 뜻이 있는 말은 안 뗀다 —
 *   HOLDINGS 를 떼면 「하이트진로」와 「하이트진로홀딩스」가 **같은 주소**가 된다.
 *   실제로 둘 다 상장돼 있다(000080 · 000140). GROUP·BANK·PHARM 도 같다.
 * ⛔ 주소에 한글을 쓰지 않는다 — 영문 매체다. 한글 주소는 인코딩되어 읽을 수 없게 된다.
 * ⛔ 이름이 비면 **종목코드로 떨어진다.** 빈 주소를 만들지 않는다.
 */

/** 떼는 법인 꼬리표 — ⛔ 뜻이 있는 말(HOLDINGS·GROUP·BANK…)은 여기 넣지 않는다 */
export const 법인꼬리표 = [
  'CO., LTD.', 'CO.,LTD.', 'CO., LTD', 'CO.,LTD', 'CO. LTD', 'CO.LTD',
  'COMPANY LIMITED', 'CORPORATION', 'INCORPORATED', 'LIMITED',
  'CORP.', 'CORP', 'INC.', 'INC', 'LTD.', 'LTD', 'CO.', 'PLC', 'LLC',
];

/**
 * 법인 꼬리표를 «끝에서만» 뗀다.
 * ⚠ 가운데 있는 것은 안 뗀다 — 「LTD PARTNERS」 같은 이름이 망가진다.
 * ⚠ 여러 개가 겹쳐 붙은 것(「CO., LTD.」 뒤에 「.」)도 훑는다.
 */
export function 꼬리표떼기(이름) {
  let t = String(이름 ?? '').trim();
  if (!t) return '';
  for (let i = 0; i < 4; i++) {          /* 「… CO., LTD.」처럼 두 겹인 것이 있다 */
    const 앞 = t;
    const 큰 = t.toUpperCase();
    for (const 꼬리 of 법인꼬리표) {
      if (큰.endsWith(꼬리)) { t = t.slice(0, t.length - 꼬리.length); break; }
    }
    t = t.replace(/[\s,.·&\-]+$/, '').trim();
    if (t === 앞) break;
  }
  return t.trim();
}

/** 영문 이름 → 주소 조각. 영문자·숫자만 남기고 나머지는 하이픈 하나로 */
export function 주소조각(이름) {
  const t = 꼬리표떼기(이름)
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')   /* 악센트를 뗀다 */
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return t.slice(0, 60).replace(/-+$/, '');
}

/**
 * 회사 한 벌 → { code → slug }.
 * 🔴 **겹치면 종목코드를 붙인다.** 안 겹치면 짧게 둔다(백년지도 노하우).
 * ⛔ 이름이 비거나 영문자가 하나도 없으면 종목코드 자체를 주소로 쓴다.
 * ⚠ 차례를 종목코드로 정렬해 «돌릴 때마다 같은 주소»가 나오게 한다 —
 *   자료 차례가 바뀌었다고 주소가 달라지면 색인이 통째로 날아간다.
 */
export function 주소표만들기(회사들) {
  const 것 = [...(회사들 ?? [])]
    .filter((r) => r && r.code)
    .sort((a, b) => String(a.code).localeCompare(String(b.code)));

  const 셈 = new Map();
  for (const r of 것) {
    const s = 주소조각(r.name_en || r.nameEn || '');
    if (!s) continue;
    셈.set(s, (셈.get(s) ?? 0) + 1);
  }

  const 표 = new Map();
  for (const r of 것) {
    const 코드 = String(r.code);
    const s = 주소조각(r.name_en || r.nameEn || '');
    if (!s) { 표.set(코드, 코드); continue; }
    표.set(코드, 셈.get(s) > 1 ? `${s}-${코드}` : s);
  }
  return 표;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv?.[1]?.endsWith('company-slug.mjs') && process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);

  본다('CO.,LTD 를 뗀다', 꼬리표떼기('DONGWHA PHARM.CO.,LTD') === 'DONGWHA PHARM');
  본다('CO., LTD 를 뗀다', 꼬리표떼기('KR MOTORS CO., LTD') === 'KR MOTORS');
  본다('LTD 하나만 있어도 뗀다', 꼬리표떼기('KYUNGBANG LTD') === 'KYUNGBANG');
  본다('Corporation 을 뗀다', 꼬리표떼기('Samyang Holdings Corporation') === 'Samyang Holdings');
  본다('Inc. 를 뗀다', 꼬리표떼기('Yuyu Pharma, Inc.') === 'Yuyu Pharma');
  본다('Limited. 를 뗀다', 꼬리표떼기('Sungchang Enterprise Holdings Limited.') === 'Sungchang Enterprise Holdings');
  본다('꼬리표가 없으면 그대로', 꼬리표떼기('HITE JINRO') === 'HITE JINRO');
  본다('⛔ 빈 것에 안 터진다', 꼬리표떼기('') === '' && 꼬리표떼기(null) === '' && 꼬리표떼기(undefined) === '');

  본다('🔴 HOLDINGS 는 «안» 뗀다 — 떼면 다른 회사와 같은 주소가 된다',
    꼬리표떼기('HITEJINRO HOLDINGS CO., LTD') === 'HITEJINRO HOLDINGS');
  본다('🔴 그래서 하이트진로 둘이 다른 주소가 된다',
    주소조각('HITE JINRO') !== 주소조각('HITEJINRO HOLDINGS CO., LTD'));
  본다('GROUP 도 안 뗀다', /group/.test(주소조각('HANA FINANCIAL GROUP INC.')));
  본다('PHARM 도 안 뗀다', /pharm/.test(주소조각('DONGWHA PHARM.CO.,LTD')));

  본다('주소조각은 소문자에 하이픈', 주소조각('KR MOTORS CO., LTD') === 'kr-motors');
  본다('점·쉼표가 하이픈 하나로', 주소조각('SAM CHUN DANG PHARM CO. LTD') === 'sam-chun-dang-pharm');
  본다('& 를 and 로', 주소조각('HANKOOK & COMPANY CO., LTD.') === 'hankook-and-company');
  본다('숫자는 남는다', 주소조각('SK 3 HOLDINGS CO., LTD') === 'sk-3-holdings');
  본다('⛔ 앞뒤 하이픈이 안 남는다', !/^-|-$/.test(주소조각('  ,,, ABC CO., LTD  ,,, ')));
  본다('⛔ 60자를 넘지 않는다', 주소조각('A'.repeat(200) + ' CO., LTD').length <= 60);
  본다('⛔ 빈 이름은 빈 조각', 주소조각('') === '' && 주소조각(null) === '');
  본다('⛔ 한글만 있으면 빈 조각이 된다 — 종목코드로 떨어뜨리려고', 주소조각('동화약품') === '');

  /* ── 주소표 — 🔴 겹칠 때만 종목코드를 붙인다 (백년지도 노하우) ── */
  const 표 = 주소표만들기([
    { code: '000080', name_en: 'HITE JINRO' },
    { code: '000140', name_en: 'HITEJINRO HOLDINGS CO., LTD' },
    { code: '111111', name_en: 'SAMPLE CO., LTD' },
    { code: '222222', name_en: 'Sample Corporation' },     /* 위와 같은 주소가 된다 */
    { code: '333333', name_en: '동화약품' },                  /* 영문자가 없다 */
  ]);
  본다('안 겹치면 짧게 둔다', 표.get('000080') === 'hite-jinro');
  본다('홀딩스도 짧게 (안 겹친다)', 표.get('000140') === 'hitejinro-holdings');
  본다('🔴 겹치면 종목코드를 붙인다 ①', 표.get('111111') === 'sample-111111');
  본다('🔴 겹치면 종목코드를 붙인다 ②', 표.get('222222') === 'sample-222222');
  본다('🔴 영문자가 없으면 종목코드가 주소다', 표.get('333333') === '333333');
  본다('주소가 다 다르다', new Set([...표.values()]).size === 표.size);

  본다('⛔ 자료 차례가 바뀌어도 주소가 같다', (() => {
    const 벌 = [{ code: 'b', name_en: 'X CO., LTD' }, { code: 'a', name_en: 'X Corporation' }];
    const ㄱ = 주소표만들기(벌);
    const ㄴ = 주소표만들기([...벌].reverse());
    return ㄱ.get('a') === ㄴ.get('a') && ㄱ.get('b') === ㄴ.get('b');
  })());
  본다('⛔ 빈 벌에 안 터진다', 주소표만들기([]).size === 0 && 주소표만들기(null).size === 0);
  본다('⛔ code 없는 줄은 건너뛴다', 주소표만들기([{ name_en: 'NO CODE' }]).size === 0);

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}
