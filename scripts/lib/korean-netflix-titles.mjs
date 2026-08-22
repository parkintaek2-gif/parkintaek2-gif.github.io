/**
 * 넷플릭스 표에서 「한국 작품」을 고르는 **하나의 규칙**.
 *
 * ── 왜 따로 뺐나 ───────────────────────────────────────────────
 * 2026-08-07 에 /watched 가 라이브에서 14% 틀린 것을 내렸다. 원인은 판정 규칙이었는데
 * 같은 규칙을 build-wikitip-global · build-wikitip-titles 가 **각자 복사해** 쓰고 있었다.
 * 한 곳만 고치면 다른 곳이 틀린 채로 남는다. 그래서 규칙을 여기 한 곳에 둔다.
 *
 * ── 규칙 ───────────────────────────────────────────────────────
 * ① 위키데이터 P495=Q884 로 뽑은 한국 작품 제목과 **글자가 같아야** 후보다.
 * ② 넷플릭스는 작품의 **주 언어**로 English / Non-English 차트를 가른다.
 *    한국 작품이 영어 차트에 오르는 일은 사실상 없다. **영어 차트로 확인된 제목은 뺀다.**
 *    글로벌 표에만 언어 구분이 있으므로 거기서 제목별 딱지를 만들어 나라별 표에도 쓴다.
 * ③ 시간(또는 도달) 상위를 **손으로 본 것**은 따로 뺀다. 아래 NOT_KOREAN 이 그 목록이다.
 *
 * ── ⛔ 이 규칙이 못 하는 것 ─────────────────────────────────────
 * 글로벌 Top10 에 한 번도 안 뜬 제목에는 **언어 딱지가 없다.** 나라별 표에만 뜬 작품이 그렇다.
 * 그런 제목은 ②로 거를 수 없고 ③에 걸리지 않으면 남는다. 지면에 그렇게 적는다.
 * 없는 확인을 있다고 하지 않는다.
 */
import fs from 'node:fs';

const 글로벌방 = 'archive/raw/netflix-top10';

/**
 * 가장 최근 글로벌 표를 고른다.
 * 🔴 2026-08-23 — 전에는 `global-2026-08-04.tsv` 가 **이름으로 박혀** 있었다. 그날 자료를
 *   새로 받자 이름이 `global-2026-08-23.tsv` 로 바뀌어 규칙이 못 돌게 됐다. 자료를 갱신할
 *   때마다 같은 일이 난다 — 그리고 이 규칙이 못 돌면 「어느 작품이 한국 것인가」가 흔들린다.
 * ⛔ 없으면 **못 쟀다고 말하고 선다.** 빈 지도를 돌려주면 영어 차트로 거르는 ②가 조용히
 *   사라지고, 한국 것이 아닌 작품이 한국 표에 남는다.
 */
export function 가장최근글로벌(방 = 글로벌방, 읽기 = fs.readdirSync) {
  let 것들 = [];
  try { 것들 = 읽기(방); } catch { 것들 = []; }
  const 후보 = 것들
    .filter((f) => /^global-\d{4}-\d{2}-\d{2}\.tsv$/.test(f))
    .sort();
  return 후보.length ? `${방}/${후보[후보.length - 1]}` : null;
}
const KOREAN_JSON = 'archive/raw/netflix-top10/korean-titles.json';

/**
 * 손으로 **읽어서** 뺀 것 — 시간 상위를 한 편씩 보고 확인한 목록이다.
 * ⛔ 아래 BY_ATTRIBUTION 과 **섞지 않는다.** 뺀 까닭이 다르고, 기사가 그 수를 인용한다.
 *   섞으면 「손으로 아홉 편을 읽었다」가 어느 날 조용히 열일곱이 된다 — 읽지도 않고.
 */
export const BY_HAND = new Map([
  ['Teach You a Lesson', '중국'],
  ['The Empress', '독일 (Die Kaiserin)'],
  ['Forgotten Love', '폴란드 (Znachor)'],
  ['Hunger', '태국'],
  ['Paradise', '독일'],
  ['Animal', '인도'],
  ['Fighter', '인도'],
  ['The East Palace', '중국 (东宫)'],
  /* 2026-08-07 추가. 위키데이터에 `Friends (2002 TV series)`(한일 합작 드라마)가 있어
     이름으로 맞으면 한국 작품이 된다. 그러나 차트에 오른 것은 **미국 시트콤**이다 —
     나라별 표에서 **108주 · 36나라**(AU·BE·DK·FI…)로 뜬다. 2002년 한국 2부작이 그럴 수 없다. */
  ['Friends', '미국 (NBC 1994) — 108주·36나라'],
]);

/**
 * **읽어서 뺀 것이 아니다.** 우리 판정 질의(`check-title-ambiguity.mjs`)가
 * 「그 이름을 가진 영화·드라마 중 **한국 것이 하나도 없다**」고 답한 편이다.
 */
/* ⚠ 2026-08-09 덧붙임 — **여기 적은 근거가 실제보다 셌다.**
   그 판정 질의는 `rdfs:label` 을 **대소문자까지** 맞춘다. 위키데이터가 한국 영화를
   `LAND`·`DETOUR`·`Deliver Us From Evil` 로 적어 두면 한국 것만 빠지고 외국 것만 남는다.
   그러니 「한국을 하나도 안 돌려줬다」는 「한국 작품이 없다」가 아니라 **「이름표로는 못 찾았다」**다.
   ⭐ 그래서 아래 여덟 편을 다시 봤다 — `korean-titles-keyed.json` 에 **Q번호가 붙는 것이 하나도 없다.**
      게다가 여덟 편 모두 괄호 안의 차트 증거(필리핀에서만 13주 따위)를 따로 갖고 있다.
      **근거 둘이 같은 쪽을 가리키므로 여덟 편은 그대로 둔다.** 근거 한 줄만 고쳐 적는다. */
export const BY_ATTRIBUTION = new Map([
  /* 2026-08-08 추가 — **여덟 편을 한 근거로 뺀다.**
     손으로 하나씩 고른 것이 아니다. 우리 **판정 질의**(그 이름을 가진 영화·드라마의 나라 전부,
     `check-title-ambiguity.mjs`)가 이 여덟에 대해 **한국을 하나도 안 돌려줬다.**
     같은 질의로 낸 79.8% / 17% / 3.2% 를 우리는 지면·상품·기사에 싣고 있다.
     그 자가 「한국 작품이 아니다」라고 답한 것을 한국 작품 명단에 두면 **우리 방법론과 어긋난다.**
     ⛔ 이것은 「겹침(모른다)」이 아니다. 겹침은 한국이 **들어 있고** 딴 나라도 있는 것이다.
        여기 여덟은 한국이 **아예 없다.** 두 경우를 한 딱지로 묶고 있었던 것이 잘못이었다.
     ⚠ 넷플릭스 나라별 표의 자국 쏠림도 같은 쪽을 가리킨다(아래 괄호). 근거를 겹쳐 적는다. */
  ['Wildflower', '필리핀·영국·미국 (한국 없음) — 필리핀에서만 13주'],
  ['Long Live Love!', '태국 (한국 없음) — 태국에서만 4주'],
  ['Glorious Days', '인도네시아 (한국 없음) — 인도네시아에서만 3주'],
  ['Waterworld', '미국 (한국 없음) — 1995년작, 19나라'],
  ['Re/Member', '일본 (한국 없음) — 27나라'],
  ['Into the Storm', '호주·페루·영국·미국 (한국 없음) — 11나라'],
  ['You and Me', '호주·이란·뉴질랜드·중국·소련·영국·미국 (한국 없음) — 필리핀에서만 1주'],
  ['Feng Shui', '중국·필리핀 (한국 없음) — 필리핀에서만 1주'],
]);

/**
 * **뜬 시장으로 뺀 것** — 2026-08-10 추가. 근거가 위 둘과 또 다르므로 **또 섞지 않는다.**
 *
 * 🔴 이 목록이 생긴 까닭. 「못맞춤 14편에 위키데이터 열쇠를 하나씩 붙인다」가 그날의 계획이었다.
 *   붙이기 전에 **어느 시장에서 떴는지**를 붙여 보니 거꾸로였다 —
 *   `Undercover` 48자리는 **한국에 한 자리도 없고** 네덜란드 16 · 벨기에 6 이었다.
 *   후보로 나온 Q97961569(언더커버 · JTBC)를 붙였으면 **가짜 한국 자리 48개**를 만들었다.
 *
 * ⭐ 근거 셋이 **다 맞을 때만** 뺀다(`scripts/check-foreign-in-korean-list.mjs` 가 잰다) —
 *   ① 한국 차트에 한 자리도 없다  ② 위키데이터가 그 이름에 **한국 작품을 하나도** 안 붙였다
 *   ③ 가장 많이 뜬 시장이 위키데이터가 아는 **그 나라**다(자국 쏠림)
 *
 * ⛔ ②가 빠지면 안 뺀다. `Keys to the Heart`(그것만이 내 세상)·`Life Is Beautiful`
 *   (인생은 아름다워)는 셋 중 ①③이 맞았지만 **한국 작품이 같은 이름을 쓴다.** 그대로 뒀다.
 *   빼면 우리 것을 잃는다.
 * ⚠ 「빼지 않는다」는 상시 규칙을 어기는 것이 아니다. 그 규칙은 **근거 없이** 빼지 말라는 것이고,
 *   여기 열셋은 근거가 뜬 시장이다. 근거를 한 줄씩 옆에 적어 둔다.
 */
export const BY_MARKETS = new Map([
  ['Undercover', '벨기에 (한국 없음) — 한국 0자리 · 네덜란드 16 · 벨기에 6 · 24나라'],
  ['UFO', '터키 (한국 없음) — 한국 0자리 · 터키 5 · 12나라'],
  ["Let's Dance", '프랑스 (한국 없음) — 한국 0자리 · 프랑스·뉴칼레도니아·레위니옹뿐'],
  ['Motherland', '영국 (한국 없음) — 한국 0자리 · 아일랜드·영국뿐'],
  ['Black Jack', '일본 (한국 없음) — 한국 0자리 · 일본에서만 2자리'],
  ['Whistleblower', '일본 (한국 없음) — 한국 0자리 · 일본에서만 2자리'],
  ['Bigman', '네덜란드 (한국 없음) — 한국 0자리 · 네덜란드에서만 2자리'],
  ['#Iamhere', '프랑스 (한국 없음) — 한국 0자리 · 프랑스에서만 1자리'],
  ['#Manhole', '일본 (한국 없음) — 한국 0자리 · 일본에서만 1자리'],
  ['Supernova', '폴란드 (한국 없음) — 한국 0자리 · 폴란드에서만 1자리'],
  /* ⚠ 아래 셋은 **자가 못 잡았다.** ③(자국 쏠림)이 안 맞는다 — 위키데이터가 그 나라를
     아직 모른다(스페인 2025 · 인도 · 스웨덴). ①②는 맞고, 뜬 시장이 한 곳뿐이라 손으로 봤다.
     ⛔ 자가 잡은 열과 **같은 칸에 두되 까닭을 갈라 적는다.** 「자가 잡았다」를 부풀리지 않는다. */
  ['Superstar', '스페인 (한국 없음) — 한국 0자리 · 스페인에서만 2자리 · 2025 · ⚠ 손으로 봄'],
  ['Oh My God', '인도 (한국 없음) — 한국 0자리 · 인도에서만 1자리 · ⚠ 손으로 봄'],
  ['StartUp', '스웨덴 (한국 없음) — 한국 0자리 · 스웨덴에서만 1자리 · ⚠ 손으로 봄'],
]);

/** 세 목록을 합친 것. **거르는 쪽은 이것만 쓴다.** 세는 쪽은 위 셋을 따로 쓴다. */
export const NOT_KOREAN = new Map([...BY_HAND, ...BY_ATTRIBUTION, ...BY_MARKETS]);
/* ⚠ 확신이 없는 것은 **넣지 않는다.** 첫 화면 이번 주 칸의 `Desire`·`Spooky in Love`·
   `The Apartment Job` 은 어느 나라 것인지 확인하지 못했다. 짐작으로 빼면 맞는 것을 잃는다.
   확인되면 그때 넣는다. 못 한 확인을 한 것처럼 두지 않는다. */

/** 손으로 본 깊이 — 지면에 그대로 적는다. 이 아래는 안 봤다. */
export const AUDITED = { tv: 30, film: 20 };

/**
 * 아랍·히브리·키릴·일본·중국 문자가 들어 있나.
 *
 * 🔴 2026-08-09 08:4x — 작품 지면을 만들다가 잡았다. 주소가 빈 제목 22개가
 *   **아랍어·히브리어·우크라이나어·일본어**였다. 그것들이 「한국 작품」으로 세어지고 있었다.
 *
 * ── 왜 빼도 되나 — **재서 확인했다** ─────────────────────────
 * ⛔ 「아시아에서 안 떴으니 한국 것이 아니다」는 **근거가 못 된다.** 진짜 한국 작품 141편(15.4%)도
 *    아시아 열 곳 어디에도 안 떴다(Breathless 250자리 · Oasis 239자리).
 * ⭐ 진짜 근거는 이것이다 — **넷플릭스는 이 자료에서 제목을 현지어로 안 옮긴다.**
 *      Squid Game 은 아랍 10개국에서 **라틴 제목 그대로** 445자리를 잡았다
 *      이집트 차트의 서로 다른 제목 1,530개 중 아랍 문자는 **10개(0.7%)** 뿐이다
 *      이스라엘 1,825개 중 히브리 문자는 **4개(0.2%)**
 *    옮긴다면 저 몫이 100% 가까워야 한다. 안 그렇다 → 비라틴 제목은 **그 나라 작품**이다.
 * ⚠ 그렇다면 왜 한국 명단에 있었나 — 위키데이터 질의가 **언어를 안 가리고 이름표를 받아서**다.
 *    한국 작품 항목에 딴 나라 작품의 아랍어 이름표가 붙어 있으면 글자로 맞아 버린다.
 * ⛔ 그래서 NOT_KOREAN 에 **손 목록으로 넣지 않는다.** 그건 「손으로 읽었다」는 수를 부풀린다.
 *    규칙으로 막는다 — 이 자료에서 한글이 든 제목은 **0개**이고 라틴이 아닌 한국 제목도 0개다.
 */
export function 비라틴글자(제목) {
  return /[֐-׿؀-ۿЀ-ӿ぀-ヿ一-鿿가-힯]/.test(String(제목));
}

/**
 * 제목 → 'ne'(Non-English) | 'en'(English) 딱지. 넷플릭스 글로벌 표가 붙인 것이지 우리가 정한 게 아니다.
 * 글로벌 표에 없는 제목은 이 지도에 없다 — 「모른다」이지 「한국 것이 아니다」가 아니다.
 */
export function buildLanguageMap() {
  const 원제목 = JSON.parse(fs.readFileSync(KOREAN_JSON, 'utf8')).제목;
  const korean = new Set(원제목.filter((t) => !비라틴글자(t)));
  const 글로벌길 = 가장최근글로벌();
  if (!글로벌길) {
    throw new Error(`⛔ 못 쟀다 — ${글로벌방} 에 global-<날짜>.tsv 가 없다. `
      + '`npm run collect:netflix` 로 받은 뒤 다시 부른다. (빈 지도를 돌려주지 않는다)');
  }
  const lines = fs.readFileSync(글로벌길, 'utf8').trim().split(/\r?\n/);
  const head = lines[0].split('\t');
  const iTitle = head.indexOf('show_title');
  const iCat = head.indexOf('category');
  const lang = new Map();
  for (const line of lines.slice(1)) {
    const c = line.split('\t');
    const t = c[iTitle];
    if (!korean.has(t)) continue;
    const l = /Non-English/i.test(c[iCat]) ? 'ne' : 'en';
    const prev = lang.get(t);
    /* 한 제목이 양쪽 차트에 다 나오면 **서로 다른 두 작품이 이름만 같은 것**이다.
       뒤에 온 것으로 덮으면 앞의 것을 잃는다. 'both' 로 두고 지면에 「못 가렸다」로 적는다. */
    lang.set(t, prev && prev !== l ? 'both' : l);
  }
  return { korean, lang };
}

/**
 * 한 판정기를 돌려준다.
 *   keep(title)     → 이 제목을 한국 작품으로 세도 되나
 *   why(title)      → 뺐다면 왜 뺐나 ('en' | 'hand' | null)
 *   unlabelled 는 언어 딱지가 없어 ②를 못 건 제목 수 — 지면에 적을 값이다.
 */
export function koreanTitleFilter() {
  const { korean, lang } = buildLanguageMap();
  const droppedEn = new Set();
  const droppedHand = new Set();
  const unlabelled = new Set();
  const both = new Set();

  /**
   * 글로벌 표처럼 **줄마다 언어가 적혀 있을 때** 쓴다. 줄의 언어로 바로 가른다.
   * 이름이 같은 두 작품이 섞여 있어도 한국 쪽 줄만 남으므로 잃는 것이 없다.
   */
  const keepRow = (title, category) => {
    if (!korean.has(title)) return false;
    if (NOT_KOREAN.has(title)) { droppedHand.add(title); return false; }
    if (!/Non-English/i.test(category || '')) { droppedEn.add(title); return false; }
    return true;
  };

  /**
   * 나라별 표처럼 **언어가 안 적혀 있을 때** 쓴다. 글로벌에서 만든 제목별 딱지를 빌려 쓴다.
   * 딱지가 없으면(글로벌 Top10 에 한 번도 안 뜬 작품) 거를 근거가 없어 남긴다 — 세어서 지면에 적는다.
   * 'both' 는 이름이 같은 두 작품이라 나라별 표에서는 **못 가른다.** 남기고 세어 둔다.
   */
  const keepTitle = (title) => {
    if (!korean.has(title)) return false;
    if (NOT_KOREAN.has(title)) { droppedHand.add(title); return false; }
    const l = lang.get(title);
    if (l === 'en') { droppedEn.add(title); return false; }
    if (l === 'both') both.add(title);
    if (l === undefined) unlabelled.add(title);
    return true;
  };

  return {
    keepRow, keepTitle, korean, lang,
    stats: () => ({
      droppedEnglishChart: [...droppedEn],
      droppedByHand: [...droppedHand],
      /* ⛔ 2026-08-08. 뺀 까닭이 둘로 갈렸다. 합계만 내면 지면이 「손으로 읽었다」를
         읽지도 않은 편까지 세어 말한다. **까닭별로도 낸다.** */
      droppedByHandRead: [...droppedHand].filter((t) => BY_HAND.has(t)),
      droppedByAttribution: [...droppedHand].filter((t) => BY_ATTRIBUTION.has(t)),
      unlabelled: unlabelled.size,
      ambiguous: [...both],
    }),
  };
}
