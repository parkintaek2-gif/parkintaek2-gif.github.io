/**
 * check-korean-title-suspects.mjs — **한국 작품 명부에 «남의 작품»이 섞였나를 다시 잰다.**
 *
 * ── 🔴 왜 이 자가 생겼나 ───────────────────────────────────────
 * 「한국 작품」을 고르는 규칙(`lib/korean-netflix-titles.mjs`)은 제목 «글자»로 맞춘다.
 * 그래서 한국 작품과 이름이 같은 남의 작품이 있으면 그것까지 한국 작품이 된다.
 * 규칙 파일은 이 한계를 **이미 적어 두고 있다** — 「글로벌 Top10 에 한 번도 안 뜬 제목에는
 * 언어 딱지가 없다 … 그런 제목은 ②로 거를 수 없고 ③에 걸리지 않으면 남는다」.
 *
 * 그 남은 것을 손으로 골라 둔 칸이 `BY_MARKETS`(열셋)다. ⛔ 그런데 **그 뒤로 자료가 커졌다.**
 * 2026-08-25 새벽에 재 보니 —
 * ```
 *   Dangerous Liaisons   한국 0석 · 유럽 54석 · 아시아 1석 · 2022-07-10~07-31 (3주)
 *                        → 넷플릭스에 2022-07-08 올라온 «프랑스» 영화다. 165석이 잘못 세어졌다
 * ```
 * 손으로 한 번 훑고 끝낸 일은 자료가 자라면 낡는다. 그래서 **다시 돌릴 수 있는 자**로 만든다.
 *
 * ── ⛔ 이 자가 «하지 않는» 것 ──────────────────────────────────
 * ⛔ **스스로 빼지 않는다.** 후보를 «내놓기»만 한다. 빼는 것은 사람이 한 편씩 보고 정하고,
 *   정한 것은 까닭을 한 줄 달아 `BY_MARKETS` 에 적는다. 그것이 그 칸의 뜻이다.
 * ⛔ 「한국 0석」만으로 후보라고 하지 않는다. 한국에서 안 뜬 한국 작품이 있다 —
 *   384편이 한국 0석이고 그것을 다 빼면 **맞는 것을 잃는다.**
 * ⛔ 「이름이 흔하다」로 빼지 않는다. `Keys to the Heart`·`Life Is Beautiful` 은 흔한
 *   이름이지만 한국 작품이 실제로 그 이름을 쓴다. 규칙 파일이 그 둘을 남긴 까닭이 그것이다.
 * ⛔ **합쳐진 작품은 여기서 빼면 안 된다.** `Little Women` 은 2021년 29석(미국 영화)과
 *   2022년 243석(한국 드라마)이 «한 줄»이다. 통째로 빼면 한국 드라마를 잃는다.
 *   그래서 「섞인 것」과 「남의 것」을 갈라 낸다 — 고치는 법이 다르다.
 *
 * 쓰는 법  node scripts/check-korean-title-suspects.mjs --자가시험
 *          node scripts/check-korean-title-suspects.mjs
 *          node scripts/check-korean-title-suspects.mjs --몇개=40
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOT_KOREAN } from './lib/korean-netflix-titles.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 인자 = (이름, 기본) => {
  const 머리 = `--${이름}=`;
  const a = process.argv.find((x) => x.startsWith(머리));
  return a ? a.slice(머리.length) : 기본;
};

/** 아시아 시장 — 한국 작품이 «어디서든» 뜬다면 대개 여기다 */
export const 아시아 = new Set(['KR', 'JP', 'TW', 'HK', 'SG', 'MY', 'TH', 'VN', 'ID', 'PH',
  'IN', 'MO', 'BN', 'KH', 'LA', 'MM', 'LK', 'BD', 'PK', 'NP', 'MV']);

export function 석수(byMarket, 고르개) {
  return (byMarket ?? []).filter((m) => 고르개(m)).reduce((s, m) => s + Number(m.places || 0), 0);
}

/**
 * 한 나라(또는 그 이웃 몇 나라)에 쏠려 있나. 쏠릴수록 「그 나라 작품」일 가능성이 크다.
 * ⛔ 쏠림만으로 단정하지 않는다 — 한국 작품도 한 나라에서만 뜰 수 있다. 그래서 «한국 0석»과
 *   같이 볼 때만 뜻이 있다.
 */
export function 쏠림(byMarket) {
  const a = [...(byMarket ?? [])].sort((x, y) => Number(y.places || 0) - Number(x.places || 0));
  const 합 = a.reduce((s, m) => s + Number(m.places || 0), 0);
  if (!합) return { 몫: null, 맨위: null, 나라수: a.length };
  return { 몫: Number(a[0].places || 0) / 합, 맨위: a[0], 나라수: a.length };
}

/**
 * 해가 **끊겼다가 다시 나오나**. 끊긴 앞쪽이 아주 작으면 «다른 작품»이 붙었을 자리다.
 * ⛔ 시즌2·재진입도 끊긴다. 그래서 이것만으로 판정하지 않는다 —
 *   8/25 에 이 신호 하나로 976편 중 111편이 걸렸는데 대부분이 멀쩡한 시즌2였다.
 *   ⭐ 그때 「111편이 틀렸다」고 적지 않은 것이 맞았다. 여기서는 «작은 앞쪽»만 본다.
 */
export function 앞쪽꼬리(byYear, 작다 = 0.15) {
  const a = [...(byYear ?? [])].map((y) => ({ year: Number(y.year), places: Number(y.places || 0) }))
    .sort((x, y) => x.year - y.year);
  if (a.length < 2) return null;
  const 합 = a.reduce((s, y) => s + y.places, 0);
  if (!합) return null;
  const 첫 = a[0];
  const 틈 = a[1].year - 첫.year;
  if (틈 < 2) return null;                    /* 붙어 있으면 같은 작품일 수 있다 */
  if (첫.places / 합 > 작다) return null;      /* 앞쪽이 크면 «본체»다 — 꼬리가 아니다 */
  return { 해: 첫.year, 석: 첫.places, 몫: 첫.places / 합, 틈 };
}

/**
 * 한 편을 재서 «후보인가»를 낸다.
 * ⭐ 두 갈래로 갈라 낸다 — 고치는 법이 다르기 때문이다.
 *   남의것   통째로 남의 작품일 수 있다 → 확인되면 BY_MARKETS 에 넣어 «뺀다»
 *   섞인것   한국 작품에 남의 작품이 «붙어» 있다 → 빼면 안 된다. 그 해만 덜어 내야 한다
 */
export function 재기(t) {
  const kr = 석수(t.byMarket, (m) => m.iso2 === 'KR');
  const as = 석수(t.byMarket, (m) => 아시아.has(m.iso2));
  const s = 쏠림(t.byMarket);
  const 꼬리 = 앞쪽꼬리(t.byYear);

  const 합 = 석수(t.byMarket, () => true);
  /*
   * 🔴 처음에 「아시아 «전체» 0석」으로 두었다가 **내가 확정한 편을 놓쳤다.**
   * `Dangerous Liaisons` 는 아시아가 «1석»이라 그 조건을 비껴갔다 — 한국 0 · 유럽 54 ·
   * 아시아 1 · 3주짜리 프랑스 영화인데도 자가 조용했다.
   * ⭐ 자를 세우면 **내가 이미 아는 참인 편에 대 본다.** 안 대 보면 「후보 0편」을
   *   「깨끗하다」로 읽게 된다. 그래서 0 이 아니라 «몫»으로 본다.
   */
  const 아시아몫 = 합 ? as / 합 : null;
  const 까닭 = [];
  let 갈래 = null;
  if (kr === 0 && (as === 0 || (아시아몫 !== null && 아시아몫 < 0.05))) {
    갈래 = '남의것';
    까닭.push(as === 0 ? '한국 0석 · 아시아 전체 0석'
      : `한국 0석 · 아시아 ${as}석뿐(전체의 ${Math.round(아시아몫 * 100)}%)`);
    if (s.맨위 && s.몫 !== null && s.몫 >= 0.3) {
      까닭.push(`${s.맨위.name} 에 ${Math.round(s.몫 * 100)}% 쏠림`);
    }
    if (s.나라수 <= 3) 까닭.push(`뜬 나라 ${s.나라수}곳뿐`);
  }
  if (꼬리) {
    /* 앞쪽 꼬리는 «남의것»과 같이 나올 수도 있다. 그때는 둘 다 적는다 */
    갈래 = 갈래 ? '남의것+섞인것' : '섞인것';
    까닭.push(`${꼬리.해}년에 ${꼬리.석}석(전체의 ${Math.round(꼬리.몫 * 100)}%)만 있고 ${꼬리.틈}해 끊김`);
  }
  return 갈래 ? { 갈래, 까닭, kr, as, 쏠림: s } : null;
}

/* ────────────────────────── 자가시험 ────────────────────────── */
function 자가시험() {
  const 시험 = [];
  const T = (이름, 참) => 시험.push([이름, !!참]);

  T('석수 — 고르개대로 더한다',
    석수([{ iso2: 'KR', places: 3 }, { iso2: 'FR', places: 5 }], (m) => m.iso2 === 'KR') === 3);
  T('석수 — 빈 값에 안 터진다', 석수(undefined, () => true) === 0);
  T('아시아 — 한국이 들어 있다', 아시아.has('KR'));
  T('아시아 — 프랑스는 아니다', !아시아.has('FR'));

  const s = 쏠림([{ iso2: 'FR', name: 'France', places: 8 }, { iso2: 'BE', name: 'Belgium', places: 2 }]);
  T('쏠림 — 맨 위 나라를 찾는다', s.맨위.iso2 === 'FR');
  T('쏠림 — 몫을 낸다', Math.abs(s.몫 - 0.8) < 1e-9);
  T('쏠림 — 나라 수를 센다', s.나라수 === 2);
  T('쏠림 — 석이 0이면 몫은 «null»(0 이 아니다)', 쏠림([{ iso2: 'FR', places: 0 }]).몫 === null);
  T('쏠림 — 빈 값에 안 터진다', 쏠림(undefined).나라수 === 0);

  /* 앞쪽꼬리 — 시즌2를 «안» 잡아야 한다. 8/25 에 이 자리에서 111편을 헛잡았다 */
  T('앞쪽꼬리 — 작은 앞쪽 + 큰 틈이면 잡는다',
    앞쪽꼬리([{ year: 2021, places: 29 }, { year: 2023, places: 400 }]) !== null);
  T('앞쪽꼬리 — 앞쪽이 크면 «본체»라 안 잡는다(시즌2)',
    앞쪽꼬리([{ year: 2023, places: 592 }, { year: 2025, places: 9 }]) === null);
  T('앞쪽꼬리 — 틈이 한 해면 안 잡는다',
    앞쪽꼬리([{ year: 2021, places: 5 }, { year: 2022, places: 400 }]) === null);
  T('앞쪽꼬리 — 해가 하나면 null', 앞쪽꼬리([{ year: 2023, places: 10 }]) === null);
  T('앞쪽꼬리 — 빈 값에 안 터진다', 앞쪽꼬리(undefined) === null);
  T('앞쪽꼬리 — 석이 다 0이면 null', 앞쪽꼬리([{ year: 2021, places: 0 }, { year: 2024, places: 0 }]) === null);

  /* 재기 — 두 갈래를 «갈라» 낸다. 섞인 것을 「남의것」으로 적으면 한국 작품을 잃는다 */
  const 남 = 재기({ byMarket: [{ iso2: 'FR', name: 'France', places: 8 }], byYear: [{ year: 2022, places: 8 }] });
  T('재기 — 한국·아시아 0석이면 «남의것»', 남 && 남.갈래 === '남의것');
  /* 🔴 이 셋이 «자가 나를 놓쳤던» 자리다. Dangerous Liaisons 는 아시아가 1석이라
     「아시아 0석」 조건을 비껴갔다. 아는 참인 편을 시험에 박아 둔다 */
  /* ⚠ 이 시험을 처음엔 «작은 수»로 적었다가 자가 안 잡았다 — 아시아 1/13 은 7.7% 라
     문턱(5%)을 넘는다. 실제 Dangerous Liaisons 는 1/165 = 0.6% 다.
     ⭐ 시험 자료는 «실제 비율»로 적는다. 그러지 않으면 자가 아니라 시험이 틀린다 */
  const DL = 재기({
    byMarket: [{ iso2: 'FR', name: 'France', places: 54 }, { iso2: 'AT', name: 'Austria', places: 50 },
      { iso2: 'DE', name: 'Germany', places: 60 }, { iso2: 'JP', name: 'Japan', places: 1 }],
    byYear: [{ year: 2022, places: 165 }],
  });
  T('재기 — 아시아가 «1석»이어도 몫이 작으면 잡는다(Dangerous Liaisons 꼴)',
    DL && DL.갈래.includes('남의것'));
  T('재기 — 그 까닭에 아시아 석 수를 적는다', DL && DL.까닭.join(' ').includes('아시아 1석'));
  const 한국작품 = 재기({
    byMarket: [{ iso2: 'KR', name: 'South Korea', places: 1 }, { iso2: 'FR', name: 'France', places: 20 }],
    byYear: [{ year: 2024, places: 21 }],
  });
  T('재기 — 한국에 «한 석이라도» 있으면 남의것으로 안 잡는다', 한국작품 === null);
  const 섞 = 재기({
    byMarket: [{ iso2: 'KR', name: 'South Korea', places: 10 }, { iso2: 'JP', name: 'Japan', places: 5 }],
    byYear: [{ year: 2021, places: 29 }, { year: 2023, places: 400 }],
  });
  T('재기 — 한국 석이 있는데 앞쪽 꼬리면 «섞인것»', 섞 && 섞.갈래 === '섞인것');
  T('재기 — 섞인것을 «남의것»으로 적지 않는다(빼면 한국 작품을 잃는다)',
    섞 && !섞.갈래.includes('남의것'));
  const 멀쩡 = 재기({
    byMarket: [{ iso2: 'KR', name: 'South Korea', places: 10 }],
    byYear: [{ year: 2023, places: 592 }, { year: 2025, places: 9 }],
  });
  T('재기 — 한국 석이 있고 시즌2뿐이면 후보가 아니다', 멀쩡 === null);
  T('재기 — 까닭을 반드시 적는다', 남.까닭.length > 0);

  const 진 = 시험.filter(([, ok]) => !ok);
  for (const [이름] of 진) console.error(`❌ ${이름}`);
  if (진.length) { console.error(`⛔ check-korean-title-suspects 자가시험 ${진.length}개 실패`); process.exit(1); }
  console.log(`✅ check-korean-title-suspects 자가시험 통과 (${시험.length})`);
}

/* ────────────────────────── 실행 ────────────────────────── */
if (process.argv.includes('--자가시험')) {
  자가시험();
} else {
  const 길 = path.join(뿌리, 인자('자료', 'src/data/wikitip-title-pages.json'));
  if (!existsSync(길)) {
    console.error(`⛔ 자료가 없다 — ${길}. 못 잰 것을 0 으로 안 적는다`);
    process.exit(1);
  }
  const d = JSON.parse(readFileSync(길, 'utf8'));
  const t = d.titles ?? [];
  const 몇개 = Number(인자('몇개', '25'));

  const 이미뺀것 = new Set([...NOT_KOREAN.keys()].map((k) => String(k).toLowerCase()));
  const 남의것 = [];
  const 섞인것 = [];
  let 이미뺀채로남음 = 0;

  for (const x of t) {
    if (이미뺀것.has(String(x.title).toLowerCase())) { 이미뺀채로남음++; continue; }
    const r = 재기(x);
    if (!r) continue;
    const 줄 = { title: x.title, type: x.type, places: x.places, markets: x.markets, ...r };
    if (r.갈래.includes('남의것')) 남의것.push(줄); else 섞인것.push(줄);
  }
  남의것.sort((a, b) => b.places - a.places);
  섞인것.sort((a, b) => b.places - a.places);

  const 전체석 = t.reduce((s, x) => s + Number(x.places || 0), 0);
  console.log(`■ 작품 ${t.length}편 · 석 ${전체석.toLocaleString('en-US')}`);
  console.log(`  이미 「한국 것이 아니다」로 뺀 이름 ${NOT_KOREAN.size}개`
    + (이미뺀채로남음 ? ` · 그중 자료에 아직 남은 것 ${이미뺀채로남음}편 ⚠ 빌드를 다시 돌려야 한다` : ''));
  console.log('');

  const 보이기 = (이름, 목록, 설명) => {
    const 석 = 목록.reduce((s, x) => s + Number(x.places || 0), 0);
    console.log(`■ ${이름} — ${목록.length}편 · ${석.toLocaleString('en-US')}석`
      + ` (전체 석의 ${전체석 ? (100 * 석 / 전체석).toFixed(1) : '?'}%)`);
    console.log(`  ${설명}`);
    for (const x of 목록.slice(0, 몇개)) {
      console.log(`  ${String(x.places).padStart(5)}석 ${String(x.markets).padStart(3)}시장  ${x.title}  [${x.type}]`);
      console.log(`         ${x.까닭.join(' · ')}`);
    }
    if (목록.length > 몇개) console.log(`  … 그리고 ${목록.length - 몇개}편 더 (--몇개=N 으로 더 본다)`);
    console.log('');
  };

  보이기('통째로 남의 작품일 수 있는 것', 남의것,
    '확인되면 BY_MARKETS 에 «까닭 한 줄»과 함께 넣어 뺀다');
  보이기('한국 작품에 남의 작품이 «붙은» 것', 섞인것,
    '⛔ 통째로 빼면 «한국 작품을 잃는다». 그 해만 덜어 내야 한다');

  console.log('⛔ 이 자는 스스로 빼지 않는다. 후보를 내놓을 뿐이다 —');
  console.log('   한 편씩 열어 보고, 뺄 것만 까닭을 달아 lib/korean-netflix-titles.mjs 에 적는다.');
  console.log('⛔ 「한국 0석」만으로 빼지 않는다. 한국에서 안 뜬 한국 작품이 있다.');
  console.log('⛔ 여기 뜬 수를 「틀린 석 수」로 «옮겨 적지 않는다» — 확인 전까지는 후보일 뿐이다.');
}
