#!/usr/bin/env node
/**
 * find-kcw-top-movers.mjs — **오늘 튀어 오른 한국 이름을, 한 번에 묻는다.**
 *
 * ── 🔴 왜 다시 만드나 (2026-09-01) ───────────────────────────
 * 사장님 상시 지시: 「**오늘의 핫이슈에 맞는 스타의 데이터를 보여줘**」
 *
 * 앞선 자(`find-todays-spike-deep.mjs`)는 **이름 120개 × 판 5개**를 하나씩 물었다.
 * 오늘 돌려 보니 **561건 중 533건이 429(막힘)** 였다.
 * ⛔ 그런데 화면에는 「튄 것 0개」라고 떴다. 없는 것이 아니라 **못 물어본 것**이다.
 *   (다행히 그 자는 «막힌 수»를 따로 세고 있었다. 그래서 533 이 보였다)
 *
 * ⭐ 재시도를 늘리는 것은 임시방편이다. **묻는 방식을 바꾼다.**
 *   위키미디어는 「그날 가장 많이 읽힌 문서 1000개」를 **판마다 한 번에** 준다.
 *   `/metrics/pageviews/top/<판>/all-access/<연>/<월>/<일>`
 *
 * ```
 * 옛 방식   이름 120 × 판 5          = 600번  → 95%가 막혔다
 * 새 방식   판 5 × 날 2(오늘·견줄날)  =  10번  → 안 막힌다
 * ```
 *
 * ⭐ 그리고 이쪽이 «더 낫다» — 옛 방식은 **우리 명단에 있는 이름만** 찾았다.
 *   오늘 뜬 스타가 우리 명단에 없으면 영영 못 봤다. 이 자는 그날의 1000개를 다 보고
 *   그 안에서 한국 이름을 고른다. **모르던 이름도 찾는다.**
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ 「없다」와 「못 잤다」를 갈라 적는다. 판이 하나라도 막히면 그렇게 적는다.
 * ⛔ 어제치는 아직 «확정 전»이라 404 가 난다 — 그것을 「0」으로 안 친다.
 * ⛔ 왜 튀었는지는 말하지 않는다. 위키백과는 까닭을 안 적는다.
 * ⚠ 「읽힘」은 인기도 시청도 아니다. 문서가 열린 횟수다.
 *
 * 쓰는 법
 *   node scripts/find-kcw-top-movers.mjs --자가시험
 *   node scripts/find-kcw-top-movers.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 볼 판. 동남아 넷 + 영어 */
export const 판들 = ['vi.wikipedia', 'id.wikipedia', 'th.wikipedia', 'ms.wikipedia', 'en.wikipedia'];

/** 이 아래로는 배수가 쉽게 튀어 이야깃거리가 아니다 */
export const 바닥 = 300;

/** 이만큼 넘게 뛰어야 「튀었다」고 부른다 */
export const 튄배 = 2.0;

/** 문서가 아니라 «장치»인 것들 — 세면 안 된다 */
export const 뺄것 = [
  /^Trang_Chính$/i, /^Special:/i, /^Đặc_biệt:/i, /^Istimewa:/i, /^Halaman_Utama$/i,
  /^Main_Page$/i, /^หน้าหลัก$/i, /^Laman_Utama$/i, /^Wikipedia:/i, /^Portal:/i,
  /^Trợ_giúp:/i, /^Bantuan:/i, /^Thể_loại:/i, /^Kategori:/i, /^Category:/i,
];

export function 장치인가(문서) {
  const s = String(문서 ?? '');
  if (!s) return true;
  return 뺄것.some((re) => re.test(s));
}

/**
 * 이 문서 이름이 «한국 사람·작품»인가.
 * ⛔ 짐작으로 고르지 않는다 — 우리가 쥔 이름 목록에 있는 것만 고른다.
 * ⚠ 위키 문서 이름은 밑줄로 이어져 있다(`Song_Kang`). 견줄 때 공백으로 편다.
 */
export function 우리이름인가(문서, 아는이름집합) {
  const s = String(문서 ?? '').replace(/_/g, ' ').trim();
  if (!s || !(아는이름집합 instanceof Set)) return false;
  return 아는이름집합.has(s.toLowerCase());
}

/**
 * 오늘과 견줄 날을 놓고 배수를 낸다.
 * ⛔ 견줄 값이 바닥 아래면 «배수를 안 낸다» — 3회가 30회 되는 것은 이야기가 아니다.
 */
export function 배수(오늘, 견줌, 바닥값 = 바닥) {
  if (!Number.isFinite(오늘) || !Number.isFinite(견줌)) return null;
  if (오늘 < 바닥값) return null;
  if (견줌 <= 0) return null;
  return +(오늘 / 견줌).toFixed(2);
}

/** 날짜를 API 가 원하는 꼴로. ⛔ toISOString 은 UTC 다 — 여기서는 UTC 가 맞다 */
export function 날꼴(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}`;
}

export function 며칠전(기준, n) {
  const d = new Date(기준);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  let 센것 = 0;
  const 검 = (이름, 참) => { 센것 += 1; if (!참) 실패.push(이름); };

  검('대문 문서를 뺀다', 장치인가('Trang_Chính') === true);
  검('Special 도 뺀다', 장치인가('Special:Search') === true);
  검('영어 대문도 뺀다', 장치인가('Main_Page') === true);
  검('⛔ 사람 문서는 안 뺀다', 장치인가('Song_Kang') === false);
  검('⛔ 빈 값은 장치로 본다', 장치인가('') === true && 장치인가(null) === true);

  const 집 = new Set(['song kang', 'iu']);
  검('밑줄을 펴서 맞춘다', 우리이름인가('Song_Kang', 집) === true);
  검('대소문자를 안 가린다', 우리이름인가('IU', 집) === true);
  검('⛔ 모르는 이름은 false', 우리이름인가('Trang_Chính', 집) === false);
  검('⛔ 집합이 아니면 false', 우리이름인가('Song_Kang', ['song kang']) === false);

  검('배수를 낸다', 배수(1000, 400) === 2.5);
  검('⛔ 오늘이 바닥 아래면 안 낸다', 배수(50, 5) === null);
  검('⛔ 견줄 값이 0이면 안 낸다', 배수(1000, 0) === null);
  검('⛔ 수가 아니면 null', 배수(null, 400) === null && 배수(1000, 'x') === null);

  검('날꼴을 만든다', 날꼴(new Date(Date.UTC(2026, 7, 31))) === '2026/08/31');
  검('한 자리 달·날에 0을 붙인다', 날꼴(new Date(Date.UTC(2026, 0, 5))) === '2026/01/05');
  검('⛔ 날짜가 아니면 null', 날꼴('2026-08-31') === null && 날꼴(new Date('x')) === null);
  검('며칠 전을 센다', 날꼴(며칠전(Date.UTC(2026, 7, 31), 7)) === '2026/08/24');

  return { 실패, 센것 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const { 실패, 센것 } = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ find-kcw-top-movers 자가시험 통과 (${센것})`);
  process.exit(0);
}

if (내가실행됐다) {
  const 머리 = { 'user-agent': 'KCultureWire/1.0 (https://www.kculturewire.com; u5@klifedesign.net)' };
  const 쉼 = (ms) => new Promise((r) => { setTimeout(r, ms); });

  /** 우리가 아는 한국 이름 — ⛔ 짐작하지 않는다 */
  const 아는이름 = new Set();
  const 자료들 = ['wikitip-people.json', 'wikitip-star-demand.json', 'wikitip-own-star.json'];
  let 이름출처 = 0;
  for (const f of 자료들) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data', f), 'utf8'));
      const 훑 = (o) => {
        if (Array.isArray(o)) { o.forEach(훑); return; }
        if (o && typeof o === 'object') {
          for (const k of ['name', 'wikiPage', '이름', 'star', 'person']) {
            if (typeof o[k] === 'string' && o[k].trim()) { 아는이름.add(o[k].trim().toLowerCase()); 이름출처 += 1; }
          }
          Object.values(o).forEach(훑);
        }
      };
      훑(j);
    } catch { /* 없으면 넘어간다 — 아래에서 몇 개를 봤는지 적는다 */ }
  }

  if (아는이름.size === 0) {
    console.error('⛔ **아는 이름을 하나도 못 읽었다.** 「한국 이름이 안 튀었다」가 아니라 「못 쟀다」다.');
    process.exit(1);
  }

  /** 오늘치는 아직 확정 전이라 404 다. 확정된 마지막 날부터 거슬러 찾는다 */
  async function 하루받기(판, d) {
    const 날 = 날꼴(d);
    const r = await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${판}/all-access/${날}`, { headers: 머리 });
    if (r.status === 404) return { 상태: '아직없다', 날 };
    if (r.status === 429) return { 상태: '막혔다', 날 };
    if (!r.ok) return { 상태: `탈 ${r.status}`, 날 };
    const j = await r.json().catch(() => null);
    const a = j?.items?.[0]?.articles ?? [];
    return { 상태: 'ok', 날, 문서: a };
  }

  console.log('■ 오늘 튀어 오른 한국 이름 — 판마다 «그날의 1000개»를 한 번에 받아 고른다\n');
  console.log(`  아는 이름 ${아는이름.size}개 · 판 ${판들.length}개 · 바닥 ${바닥}회 · ${튄배}배 넘으면 튄 것\n`);

  const 후보 = [];
  const 못잰판 = [];
  let 잰날 = null;

  for (const 판 of 판들) {
    /* 확정된 마지막 날을 찾는다 — ⛔ 404 를 「0회」로 안 친다 */
    let 오늘판 = null;
    for (let 뒤 = 1; 뒤 <= 4 && !오늘판; 뒤 += 1) {
      const r = await 하루받기(판, 며칠전(Date.now(), 뒤));
      await 쉼(300);
      if (r.상태 === 'ok') 오늘판 = r;
      else if (r.상태 === '막혔다') { 못잰판.push(`${판} — 막혔다(429)`); break; }
    }
    if (!오늘판) { if (!못잰판.some((x) => x.startsWith(판))) 못잰판.push(`${판} — 확정된 날을 못 찾았다`); continue; }
    잰날 = 잰날 ?? 오늘판.날;

    /* 견줄 날 — 이레 전 같은 요일. ⚠ 요일 무늬가 있어 「어제」와 견주면 요일 차가 섞인다 */
    const 견줌판 = await 하루받기(판, 며칠전(new Date(`${오늘판.날.replace(/\//g, '-')}T00:00:00Z`), 7));
    await 쉼(300);
    if (견줌판.상태 !== 'ok') { 못잰판.push(`${판} — 견줄 날(${견줌판.날})을 못 받았다: ${견줌판.상태}`); continue; }

    const 견줌 = new Map(견줌판.문서.map((x) => [x.article, x.views]));
    let 이판 = 0;
    for (const x of 오늘판.문서) {
      if (장치인가(x.article)) continue;
      if (!우리이름인가(x.article, 아는이름)) continue;
      const 전 = 견줌.get(x.article);
      /**
       * ⛔ 이레 전 1000위 밖이면 «모른다» — 0 으로 안 친다.
       *
       * 🔴 [2026-09-01] 처음엔 여기서 **바닥 검사를 건너뛰었다.** 그래서 181회짜리가
       *   「튀었다」로 다섯 개 올라왔다. 아래 갈래는 배수를 못 내는 자리라
       *   `배수()` 안의 바닥 검사가 «안 도는» 것을 못 봤다.
       *   ⚠ 검사를 한 함수 안에만 두면, 그 함수를 안 부르는 길에서 조용히 빠진다.
       */
      if (전 === undefined) {
        if (x.views < 바닥) continue;
        후보.push({ 판, 문서: x.article, 오늘: x.views, 견줌: null, 배: null, 날: 오늘판.날 });
        이판 += 1; continue;
      }
      const 배 = 배수(x.views, 전);
      if (배 === null || 배 < 튄배) continue;
      후보.push({ 판, 문서: x.article, 오늘: x.views, 견줌: 전, 배, 날: 오늘판.날 });
      이판 += 1;
    }
    console.log(`  ✅ ${판} — ${오늘판.날} 문서 ${오늘판.문서.length}개 중 우리 이름이 튄 것 ${이판}개`);
  }

  후보.sort((a, b) => (b.배 ?? Infinity) - (a.배 ?? Infinity) || b.오늘 - a.오늘);

  console.log(`\n■ 튄 것 ${후보.length}개${잰날 ? ` · 잰 날 ${잰날} (UTC)` : ''}`);
  for (const c of 후보.slice(0, 20)) {
    const 배말 = c.배 === null ? '이레 전 1000위 «밖»이라 배수를 못 낸다' : `**${c.배}배**  (이레 전 ${c.견줌.toLocaleString()})`;
    console.log(`   ${c.문서.replace(/_/g, ' ')}  [${c.판}]  오늘 ${c.오늘.toLocaleString()} · ${배말}`);
  }
  if (!후보.length) console.log('   ⬜ 아는 이름 중 튄 것이 없다. ⛔ 「없으니 아무거나 만든다」로 가지 않는다.');

  if (못잰판.length) {
    console.log(`\n⬜ **못 잰 판 ${못잰판.length}개** — 숨기지 않고 적는다. 「없다」가 아니다`);
    못잰판.forEach((x) => console.log(`   · ${x}`));
  } else console.log('\n   ✅ 판 다섯 다 쟀다 — 막힌 것 없음');

  console.log('\n## ⛔ 이 표가 «말하지 않는» 것');
  console.log('   · **왜 튀었는지는 모른다.** 위키백과는 까닭을 안 적는다 — 사람이 확인하고 정한다');
  console.log('   · 읽힘은 시청도 인기도 아니다. 문서가 «열린 횟수»다');
  console.log('   · ⚠ 그날의 1000위 안에 든 것만 본다. 1000위 밖에서 튄 이름은 여기 안 나온다');
}
