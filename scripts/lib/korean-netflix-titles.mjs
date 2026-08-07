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

const GLOBAL_TSV = 'archive/raw/netflix-top10/global-2026-08-04.tsv';
const KOREAN_JSON = 'archive/raw/netflix-top10/korean-titles.json';

/** 손으로 확인해 뺀 것 — 이름만 같고 한국 작품이 아니다. 확인한 근거를 나라로 적는다. */
export const NOT_KOREAN = new Map([
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
/* ⚠ 확신이 없는 것은 **넣지 않는다.** 첫 화면 이번 주 칸의 `Desire`·`Spooky in Love`·
   `The Apartment Job` 은 어느 나라 것인지 확인하지 못했다. 짐작으로 빼면 맞는 것을 잃는다.
   확인되면 그때 넣는다. 못 한 확인을 한 것처럼 두지 않는다. */

/** 손으로 본 깊이 — 지면에 그대로 적는다. 이 아래는 안 봤다. */
export const AUDITED = { tv: 30, film: 20 };

/**
 * 제목 → 'ne'(Non-English) | 'en'(English) 딱지. 넷플릭스 글로벌 표가 붙인 것이지 우리가 정한 게 아니다.
 * 글로벌 표에 없는 제목은 이 지도에 없다 — 「모른다」이지 「한국 것이 아니다」가 아니다.
 */
export function buildLanguageMap() {
  const korean = new Set(JSON.parse(fs.readFileSync(KOREAN_JSON, 'utf8')).제목);
  const lines = fs.readFileSync(GLOBAL_TSV, 'utf8').trim().split(/\r?\n/);
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
      unlabelled: unlabelled.size,
      ambiguous: [...both],
    }),
  };
}
