/**
 * 「이 줄이 «살아 있는 코드»인가」를 가른다 — 주석과 시험 견본을 걷어 낸다.
 *
 * ── 🔴🔴 왜 한 곳에 두나 (2026-09-09 05:5x · 5번) ──────────────────────────
 *
 * 저장소에 UTC 날짜 결함을 잡는 자가 «둘» 있다.
 * ```
 *   scripts/check-kst-date.mjs    UTC 로 날짜를 만드는 자리를 센다 (톱니 · 늘면 깨진다)
 *   scripts/check-utc-today.mjs   그 가운데 «세는 데 쓰는» 것만 골라 잡는다
 * ```
 * 둘 다 «찾는 무늬»를 자기 글에 적어 두어야 한다(머리글 설명 · 자가시험 견본).
 * ⇒ **서로의 견본을 결함으로 잡는다.** 오늘 실제로 두 방향 다 났다 —
 * ```
 *   check-utc-today  →  check-kst-date 의 견본 8줄을 「UTC 로 센다」로 잡았다
 *   check-kst-date   →  check-utc-today 에 내가 새로 넣은 견본 5줄을 잡아 톱니가 13 → 18
 * ```
 *
 * ⛔ **파일 이름 목록으로 빼지 않는다.** 그러면 그 파일에 «진짜» 결함이 생겨도 영영 안 잡힌다.
 *   이름으로 빼는 것은 검사를 끄는 것과 같다.
 * ⛔ 견본을 한 줄로 줄여 피하지도 않는다 — 다음 사람이 두 줄로 쓰면 또 난다.
 * ✅ 그래서 «줄 단위 판정»을 한 곳에 두고 둘이 같이 쓴다. 규칙이 하나면 두 자가 안 싸운다.
 *
 * ⚠ 완벽한 파서가 아니다. 한 줄 안에서만 본다 — 여러 줄에 걸친 문자열은 못 가른다.
 *   ⭐ 그때는 «살아 있는 쓰임»으로 남긴다. 놓치는 쪽보다 잡는 쪽에 선다.
 */

/** 주석 줄인가 — 규칙을 «인용»한 줄까지 잡으면 자기 머리글에 걸린다 */
export function 주석줄인가(줄) {
  const t = String(줄 ?? '').trim();
  return t.startsWith('*') || t.startsWith('//') || t.startsWith('/*');
}

/**
 * 그 자리가 «따옴표 안»인가. 앞에서부터 따옴표를 세어 본다.
 *
 * 🔴 [2026-09-09 05:3x] 첫 판이 **템플릿 안 `${…}` 를 문자열로 봤다.**
 *   `` `때: ${new Date().toISOString()}` `` 은 백틱 안이지만 `${}` 속은 «살아 있는 코드»다.
 *   ⇒ 그것을 견본으로 지워 버려 「찍기만 하는 자」가 11 → 10 으로 줄었고,
 *     `check-utc-today.mjs` 의 카나리아 단정이 그것을 잡았다.
 *   ⭐ 「여럿 있다」를 수로 못박아 둔 것이 살렸다.
 */
export function 따옴표안인가(줄, 자리) {
  const s = String(줄 ?? '');
  if (!(자리 >= 0 && 자리 < s.length)) return false;
  let 홑 = false; let 겹 = false; let 백 = false;
  let 속깊이 = 0;      /* `${` 안에 몇 겹 들어와 있나 */
  for (let i = 0; i < 자리; i += 1) {
    const c = s[i];
    if (c === '\\') { i += 1; continue; }
    if (백 && c === '$' && s[i + 1] === '{') { 속깊이 += 1; i += 1; continue; }
    if (백 && 속깊이 > 0 && c === '}') { 속깊이 -= 1; continue; }
    /* `${}` 속에서는 따옴표를 세지 않는다 — 그 안은 코드다 */
    if (백 && 속깊이 > 0) continue;
    if (c === "'" && !겹 && !백) 홑 = !홑;
    else if (c === '"' && !홑 && !백) 겹 = !겹;
    else if (c === '`' && !홑 && !겹) 백 = !백;
  }
  /* 백틱 안이라도 `${}` 속이면 코드다 — 문자열이 아니다 */
  if (백 && 속깊이 > 0) return false;
  return 홑 || 겹 || 백;
}

/**
 * 살아 있는 쓰임만 남긴 글을 낸다.
 *   · 주석 줄은 통째로 버린다
 *   · 따옴표 «안»에 든 무늬는 `<시험견본>` 으로 바꾼다 (줄 자체는 남긴다 —
 *     그 줄의 다른 부분이 판정에 쓰일 수 있다)
 *
 * @param 글    파일 글 전체
 * @param 무늬  지울 무늬 (전역 플래그가 붙어 있어야 한다)
 */
export function 살아있는글(글, 무늬) {
  const 본 = 무늬 instanceof RegExp
    ? new RegExp(무늬.source, 무늬.flags.includes('g') ? 무늬.flags : `${무늬.flags}g`)
    : /new Date\((?:[^()]|\([^()]*\))*\)\s*\.toISOString\(\)/g;
  return String(글 ?? '').split(/\r?\n/).map((줄) => {
    if (주석줄인가(줄)) return '';
    본.lastIndex = 0;
    const 지울자리 = [];
    let m;
    while ((m = 본.exec(줄)) !== null) {
      if (따옴표안인가(줄, m.index)) 지울자리.push([m.index, m.index + m[0].length]);
      if (m.index === 본.lastIndex) 본.lastIndex += 1;   /* 빈 매치로 멈추지 않게 */
    }
    let 낸다 = 줄;
    for (let k = 지울자리.length - 1; k >= 0; k -= 1) {
      const [a, b] = 지울자리[k];
      낸다 = `${낸다.slice(0, a)}<시험견본>${낸다.slice(b)}`;
    }
    return 낸다;
  }).join('\n');
}

/** 이 자를 «세는 자»가 쓸 수 있게 밝힌다 — 잰 수인지 아닌지 */
export function 잰수인가(v) { return typeof v === 'number' && Number.isFinite(v); }
