#!/usr/bin/env node
/**
 * collect-kcw-generation.mjs — **「4세대」·「6세대」라는 말이 자료에서 잡히나**
 * ─────────────────────────────────────────────────────────────────────────────
 * [왜 이 축인가 · 2026-09-08 5번]
 *   오늘 아침 씨앗에 이런 제목이 들어왔다 —
 *     「웃자고 시작한 게 진짜가 된 '6세대 걸그룹' 효리수」 (스타뉴스)
 *   K팝을 「1세대·2세대·…」로 가르는 말은 기사에 매일 쓰이는데, **그 경계가 어디서
 *   왔는지 대는 곳이 없다.** 우리가 가진 것으로 그것을 «잴 수 있다».
 *
 *   ⭐ 그러니 이 자는 「몇 세대가 제일 잘 나가나」를 재는 자가 «아니다».
 *     재는 것은 하나다 — **그 경계선에서 실제로 무엇이 달라지나.**
 *     달라지지 않으면 그것도 답이다. 우리 강령대로 「재 보고 안 된다고 적는 것도 결과」다.
 *
 * [무엇을 재나 · 두 가지]
 *   1. 세대칸별 «분포» — 팀 수 · 통합열람의 중앙값과 사분위 · 멤버몫 중앙값
 *      ⛔ 평균을 앞세우지 않는다. 평균이 규범이 되면 나침반이 아니라 압박이 된다.
 *   2. **경계 시험** — 데뷔연도를 한 해씩 늘어놓고 «해가 바뀔 때» 중앙값이 얼마나
 *      뛰는지 잰다. 그 뜀이 큰 자리가 세대 «경계»에 몰려 있으면 경계가 자료에 있는 것이고,
 *      아무 데나 흩어져 있으면 그 말은 우리가 붙인 이름일 뿐이다.
 *
 * [우물 · 두 곳을 잇는다 — 그물은 한 번만 던진다]
 *   · 열람·멤버몫  `src/data/kcw-member-vs-group.json` (2026-09-07 에 이미 받아 둔 것)
 *   · 데뷔연도      Wikidata SPARQL — P571(설립·창립)
 *   ⇒ 열람을 다시 안 받는다. 380팀 × 8문서를 또 긁을 까닭이 없다.
 *
 * ⚠ 🔴 **세대 경계는 「사실」이 아니라 «관행»이다.** 위키데이터에도, 어느 기관에도
 *   못박아 둔 곳이 없다. 그래서 우리가 쓰는 칸을 아래 `세대칸` 에 **드러내 적어 두고**,
 *   지면과 기사에도 「이것은 우리가 그은 선이다」를 적는다.
 *   ⛔ 이 선을 자료로 내세우지 않는다. 이 자는 그 선을 «시험하는» 자다.
 *
 * ⛔ `SERVICE wikibase:label` 을 쓰지 않는다 — 어제 그것이 말없이 줄을 버렸다(191 → 318).
 * ⛔ 못 받은 연도를 0 이나 「모름」 칸으로 채우지 않는다. 뺀 수를 세어 적는다.
 *
 * [쓰는 법]
 *   node scripts/collect-kcw-generation.mjs --시험만     판정 논리만 (그물 안 던진다)
 *   node scripts/collect-kcw-generation.mjs              재기만 하고 안 쓴다
 *   node scripts/collect-kcw-generation.mjs --적는다      src/data/kcw-generation.json 에 쓴다
 *
 * ⚠ 🔴 **모르는 깃발은 거부한다.** 2026-09-07 에 없는 깃발을 다른 수집기에 주었더니
 *   그 자가 «진짜 수집»을 돌려 자료를 덮어썼고 세 사이트 배포가 막혔다.
 *   그래서 이 검사를 파일 «맨 앞»에 둔다 — 아래에 두면 본문이 먼저 돈다.
 */

const 아는깃발 = new Set(['--시험만', '--적는다']);
{
  const 모르는것 = process.argv.slice(2).filter((a) => a.startsWith('--') && !아는깃발.has(a));
  if (모르는것.length) {
    console.error(`⛔ 모르는 깃발입니다: ${모르는것.join(' ')}`);
    console.error(`   아는 깃발: ${[...아는깃발].join(' · ')}`);
    console.error('   ⚠ 없는 깃발을 주면 «진짜 수집»이 도는 일이 있었습니다. 그래서 여기서 멈춥니다.');
    process.exit(2);
  }
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 들온것 = path.join(ROOT, 'src', 'data', 'kcw-member-vs-group.json');
const 나갈것 = path.join(ROOT, 'src', 'data', 'kcw-generation.json');
const UA = { 'User-Agent': 'KCultureWire/1.0 (https://www.kculturewire.com; cs@klifedesign.net)' };

/* ── 우리가 그은 선 ───────────────────────────────────────────────────────
 * ⚠ 이것은 «관행»이다. 기사에 쓰이는 대로 적었을 뿐이고 어느 기관도 못박지 않았다.
 *   그래서 코드에 드러내 두고, 이 자가 이 선을 시험한다.
 * ⚠ 1996 앞은 세대 이름이 붙기 전이다 — 억지로 「0세대」로 만들지 않는다.
 */
export const 세대칸 = [
  { 이름: 'Before the labels', 영문: 'Before the labels (pre-1996)', 첫해: null, 끝해: 1995 },
  { 이름: '1st', 영문: 'First (1996-2002)', 첫해: 1996, 끝해: 2002 },
  { 이름: '2nd', 영문: 'Second (2003-2011)', 첫해: 2003, 끝해: 2011 },
  { 이름: '3rd', 영문: 'Third (2012-2017)', 첫해: 2012, 끝해: 2017 },
  { 이름: '4th', 영문: 'Fourth (2018-2022)', 첫해: 2018, 끝해: 2022 },
  { 이름: '5th', 영문: 'Fifth (2023-2025)', 첫해: 2023, 끝해: 2025 },
  { 이름: '6th', 영문: 'Sixth (2026-)', 첫해: 2026, 끝해: null },
];

/* ── 셈 (순수 함수 · 자가시험 대상) ───────────────────────────────────── */

/**
 * 「이것이 잰 수인가」.
 * 🔴 `Number(null)` 은 0 이고 `Number('')` 도 0 이다. 그래서 「못 읽었다」가
 *   「0회다」로 조용히 바뀐다. 2026-09-07 에 이 자리에서 자가시험 둘이 걸렸다.
 */
export function 잰수인가(v) {
  if (v === null || v === undefined || v === '') return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}

/**
 * 위키데이터의 때 문자열에서 «해»만 뽑는다.
 * ⛔ `new Date()` 로 파싱하지 않는다 — 위키데이터에는 `-0500-00-00T00:00:00Z` 처럼
 *   달·날이 0 인 값과 기원전 값이 섞여 있어서 Date 가 조용히 다른 해로 옮긴다.
 * ⚠ 앞이 `-` 면 기원전이다. K팝 팀에는 없어야 하지만 있으면 «버린다» — 짐작하지 않는다.
 */
export function 해뽑기(때) {
  const s = String(때 || '');
  const m = /^\+?(\d{4})-\d{2}-\d{2}T/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  if (!Number.isInteger(y) || y < 1900 || y > 2100) return null;   // 팀 창립 연도로 말이 안 된다
  return y;
}

/** 데뷔연도를 세대칸 이름으로. 못 가르면 null — 「모름」 칸을 만들지 않는다 */
export function 세대(해, 칸 = 세대칸) {
  if (!Number.isInteger(해)) return null;
  for (const c of 칸) {
    if (c.첫해 !== null && 해 < c.첫해) continue;
    if (c.끝해 !== null && 해 > c.끝해) continue;
    return c.이름;
  }
  return null;
}

/** 중앙값. 빈 것이면 null — 0 으로 안 채운다 */
export function 중앙값(수들) {
  if (!Array.isArray(수들)) return null;
  const v = 수들.filter((x) => 잰수인가(x)).map(Number).sort((a, b) => a - b);
  if (!v.length) return null;
  const 가 = Math.floor((v.length - 1) / 2);
  const 나 = Math.ceil((v.length - 1) / 2);
  return (v[가] + v[나]) / 2;
}

/**
 * 사분위 — 분포를 보여 주려고 낸다.
 * ⚠ 사분위를 세는 법이 여럿이다(R 의 type 1~9). 우리는 «가장 가까운 자리»로 센다.
 *   그 말을 자료에 적어 두어, 남이 다른 셈으로 다른 값을 얻어도 다투지 않게 한다.
 */
export function 사분위(수들) {
  if (!Array.isArray(수들)) return null;
  const v = 수들.filter((x) => 잰수인가(x)).map(Number).sort((a, b) => a - b);
  if (v.length < 4) return null;                       // 넷 미만이면 사분위를 말하지 않는다
  const 자리 = (p) => v[Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))))];
  return { q1: 자리(0.25), q2: 중앙값(v), q3: 자리(0.75) };
}

/**
 * 두 칸의 «사분위 구간»이 얼마나 겹치나 — 0 이면 안 겹치고 1 이면 한쪽이 다른 쪽에 든다.
 *
 * ⭐ 왜 이것을 재나: 중앙값만 견주면 「3세대가 4세대보다 크다」로 끝난다. 그런데 칸 «안»의
 *   퍼짐이 칸 «사이»의 차이보다 크면 그 말은 한 팀을 두고는 아무것도 못 말한다.
 *   겹침을 함께 내면 손님이 그것을 스스로 본다.
 */
export function 겹침(가, 나) {
  if (!가 || !나) return null;
  const a1 = Number(가.q1); const a3 = Number(가.q3);
  const b1 = Number(나.q1); const b3 = Number(나.q3);
  if (![a1, a3, b1, b3].every(Number.isFinite)) return null;
  if (a3 < a1 || b3 < b1) return null;
  const 겹 = Math.min(a3, b3) - Math.max(a1, b1);
  if (겹 <= 0) return 0;
  const 좁은쪽 = Math.min(a3 - a1, b3 - b1);
  if (!(좁은쪽 > 0)) return 1;                          // 한쪽이 한 점이고 그 안에 든다
  return Math.min(1, Number((겹 / 좁은쪽).toFixed(4)));
}

/**
 * 🔴 **경계 시험** — 이 자의 본디 물음이다.
 *
 * 데뷔연도를 한 해씩 늘어놓고, 「해 N」과 「해 N+1」의 중앙값이 몇 배 뛰는지 잰다.
 * 그 뜀을 큰 것부터 줄세우고, 위쪽 몇 자리가 «세대 경계»에 앉아 있는지 센다.
 *
 * ⚠ 팀이 적은 해는 뜀이 잡음이다. 그래서 `최소팀` 을 두어 양쪽 해에 그만큼 있어야 센다.
 * ⚠ 이 자는 「세대가 없다」를 증명하지 못한다. 잴 수 있는 것은 하나다 —
 *   **우리 자료에서 가장 크게 갈리는 자리가 그 선인가.** 그 말만 한다.
 */
export function 경계시험(해별수들, 칸 = 세대칸, 최소팀 = 4) {
  if (!해별수들 || typeof 해별수들 !== 'object') return null;
  const 해들 = Object.keys(해별수들).map(Number).filter(Number.isInteger).sort((a, b) => a - b);
  if (해들.length < 3) return null;

  /* 경계는 「어느 칸의 첫해」다. 그 해가 시작될 때 갈린다 */
  const 경계해 = new Set(칸.map((c) => c.첫해).filter((y) => Number.isInteger(y)));

  const 틈 = [];
  for (const y of 해들) {
    const 앞 = 해별수들[y]; const 뒤 = 해별수들[y + 1];
    if (!Array.isArray(앞) || !Array.isArray(뒤)) continue;
    if (앞.length < 최소팀 || 뒤.length < 최소팀) continue;
    const a = 중앙값(앞); const b = 중앙값(뒤);
    if (a === null || b === null || !(a > 0) || !(b > 0)) continue;
    틈.push({
      해: y + 1,                                    // 「이 해가 시작될 때」 갈렸다
      앞중앙값: a, 뒤중앙값: b,
      뜀: Number((Math.max(a, b) / Math.min(a, b)).toFixed(3)),
      경계인가: 경계해.has(y + 1),
      앞팀수: 앞.length, 뒤팀수: 뒤.length,
    });
  }
  if (!틈.length) return null;

  const 줄세운 = [...틈].sort((a, b) => b.뜀 - a.뜀);
  const 잰경계수 = 틈.filter((t) => t.경계인가).length;
  const 볼자리 = Math.min(잰경계수 || 1, 줄세운.length);
  const 위쪽 = 줄세운.slice(0, 볼자리);

  return {
    잰틈수: 틈.length,
    잰경계수,
    위쪽에든경계수: 위쪽.filter((t) => t.경계인가).length,
    /* 아무 관계가 없을 때 기대되는 수 — 손님이 스스로 견주게 낸다 */
    우연이면기대: 볼자리 && 틈.length ? Number((볼자리 * 잰경계수 / 틈.length).toFixed(2)) : null,
    줄세운,
  };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */

let 걸린것 = 0;
function 본다(무엇, 참인가) {
  if (!참인가) { console.error(`  🔴 ${무엇}`); 걸린것++; }
}

function 자가시험() {
  본다('null 은 잰 수가 아니다', 잰수인가(null) === false);
  본다('빈 글자는 잰 수가 아니다', 잰수인가('') === false);
  본다('0 은 잰 수다', 잰수인가(0) === true);
  본다('음수는 잰 수가 아니다', 잰수인가(-1) === false);
  본다('글자는 잰 수가 아니다', 잰수인가('열람') === false);

  본다('해를 뽑는다', 해뽑기('2013-06-13T00:00:00Z') === 2013);
  본다('+ 가 붙어도 뽑는다', 해뽑기('+2013-06-13T00:00:00Z') === 2013);
  본다('달·날이 0 이어도 해는 뽑는다', 해뽑기('+1996-00-00T00:00:00Z') === 1996);
  본다('기원전은 버린다', 해뽑기('-0500-00-00T00:00:00Z') === null);
  본다('빈 것은 null', 해뽑기('') === null);
  본다('말이 안 되는 해는 버린다', 해뽑기('+1200-01-01T00:00:00Z') === null);

  본다('1996 은 1세대 첫해', 세대(1996) === '1st');
  본다('1995 는 이름 붙기 전', 세대(1995) === 'Before the labels');
  본다('2002 는 아직 1세대', 세대(2002) === '1st');
  본다('2003 은 2세대', 세대(2003) === '2nd');
  본다('2013 은 3세대', 세대(2013) === '3rd');
  본다('2020 은 4세대', 세대(2020) === '4th');
  본다('2024 는 5세대', 세대(2024) === '5th');
  본다('2026 은 6세대', 세대(2026) === '6th');
  본다('끝해가 없는 칸은 뒤로 열려 있다', 세대(2030) === '6th');
  본다('해가 아니면 못 가른다', 세대(null) === null);
  본다('실수는 못 가른다', 세대(2013.5) === null);

  본다('중앙값 홀수', 중앙값([3, 1, 2]) === 2);
  본다('중앙값 짝수', 중앙값([1, 2, 3, 4]) === 2.5);
  본다('중앙값은 못 잰 것을 빼고 센다', 중앙값([1, null, 3]) === 2);
  본다('빈 것은 null — 0 이 아니다', 중앙값([]) === null);
  본다('전부 못 잰 것이면 null', 중앙값([null, '']) === null);
  본다('배열이 아니면 null', 중앙값('123') === null);

  본다('넷 미만이면 사분위를 말하지 않는다', 사분위([1, 2, 3]) === null);
  {
    const q = 사분위([1, 2, 3, 4, 5]);
    본다('사분위 가운데는 중앙값이다', q && q.q2 === 3);
    본다('사분위가 오름차순이다', q && q.q1 <= q.q2 && q.q2 <= q.q3);
  }

  본다('안 겹치면 0', 겹침({ q1: 1, q3: 2 }, { q1: 5, q3: 6 }) === 0);
  본다('한쪽이 다른 쪽에 다 들면 1', 겹침({ q1: 0, q3: 10 }, { q1: 4, q3: 6 }) === 1);
  본다('반만 겹치면 0.5', 겹침({ q1: 0, q3: 2 }, { q1: 1, q3: 3 }) === 0.5);
  본다('맞닿기만 하면 0', 겹침({ q1: 0, q3: 2 }, { q1: 2, q3: 4 }) === 0);
  본다('한쪽이 없으면 null', 겹침(null, { q1: 1, q3: 2 }) === null);
  본다('거꾸로 된 구간은 null', 겹침({ q1: 3, q3: 1 }, { q1: 1, q3: 2 }) === null);

  {
    /* 경계(2003)에서만 크게 갈리는 자료를 지어 넣는다 — 자가 그것을 집어야 한다 */
    const 해별 = {};
    for (let y = 2000; y <= 2006; y++) 해별[y] = [10, 10, 10, 10];
    for (let y = 2003; y <= 2006; y++) 해별[y] = [100, 100, 100, 100];
    const r = 경계시험(해별);
    본다('경계 시험이 돈다', r !== null);
    본다('가장 큰 뜀이 2003 이다', r && r.줄세운[0].해 === 2003);
    본다('그 자리가 경계로 표시된다', r && r.줄세운[0].경계인가 === true);
    본다('우연이면 기대되는 수를 함께 낸다', r && Number.isFinite(r.우연이면기대));
  }
  {
    /* 팀이 적은 해는 세지 않는다 */
    const 해별 = { 2010: [1, 2], 2011: [100, 200] };
    본다('팀이 적으면 틈을 안 센다', 경계시험(해별) === null);
  }
  본다('자료가 없으면 null', 경계시험({}) === null);
  본다('객체가 아니면 null', 경계시험(null) === null);

  if (걸린것) { console.error(`\n🔴 자가시험 ${걸린것}가지 걸렸다`); process.exit(1); }
  console.log('✅ 자가시험 42가지 통과');
}

/* ── 그물 ─────────────────────────────────────────────────────────────── */

async function 받기(주소) {
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(주소, { headers: UA });
      if (r.ok) return await r.text();
      if (r.status === 404) return null;
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 3000 * (i + 1)));
        continue;
      }
      return { 못받음: r.status };
    } catch (e) {
      if (i === 4) return { 못받음: e.message };
      await new Promise((s) => setTimeout(s, 900));
    }
  }
  return { 못받음: '다섯 번 다 실패' };
}

/** 제어문자를 씻는다 — 위키데이터가 원문 그대로 흘려보내는 것이 있다 */
function 제어문자씻기(글) {
  return String(글).replace(new RegExp('[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]', 'g'), ' ');
}

/**
 * Q번호 묶음의 P571(설립) 을 받는다.
 * ⚠ 한 번에 380개를 VALUES 로 주면 답이 잘린 적이 있다. 묶어서 나눠 받는다.
 * ⚠ 한 팀에 P571 이 여럿 있을 수 있다(재결성 등). **가장 이른 것**을 데뷔로 본다 —
 *   그 선택을 자료에 적어 둔다.
 */
async function 설립연도받기(q들, 한묶음 = 120) {
  const 것 = new Map();
  for (let i = 0; i < q들.length; i += 한묶음) {
    const 묶음 = q들.slice(i, i + 한묶음);
    const q = `SELECT ?item ?when WHERE {
      VALUES ?item { ${묶음.map((x) => `wd:${x}`).join(' ')} }
      ?item wdt:P571 ?when .
    }`;
    const 주소 = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q);
    const 날글 = await 받기(주소);
    if (!날글 || 날글.못받음) throw new Error(`위키데이터를 못 받았다(${i}번째 묶음): ` + JSON.stringify(날글));
    let 쪽;
    try { 쪽 = JSON.parse(제어문자씻기(날글)); }
    catch (e) { throw new Error(`답을 못 읽었다(${i}번째 묶음, ${날글.length}자) — 잘렸을 수 있다: ` + e.message); }
    for (const 줄 of 쪽.results.bindings) {
      const qid = String(줄.item.value).split('/').pop();
      const 해 = 해뽑기(줄.when && 줄.when.value);
      if (해 === null) continue;
      const 이미 = 것.get(qid);
      if (!Number.isInteger(이미) || 해 < 이미) 것.set(qid, 해);   // 가장 이른 것
    }
    process.stdout.write(`\r  설립연도 ${Math.min(i + 한묶음, q들.length)}/${q들.length}   `);
  }
  process.stdout.write('\n');
  return 것;
}

async function 주된일() {
  자가시험();
  if (process.argv.includes('--시험만')) return;

  if (!fs.existsSync(들온것)) {
    console.error(`⛔ ${path.relative(ROOT, 들온것)} 가 없다. 먼저 collect-kcw-member-vs-group.mjs --적는다 를 돌린다`);
    process.exit(1);
  }
  const 앞자료 = JSON.parse(fs.readFileSync(들온것, 'utf8'));
  const 팀들 = 앞자료.팀 || [];
  if (!팀들.length) { console.error('⛔ 앞 자료에 팀이 없다'); process.exit(1); }
  console.log(`앞 자료 ${팀들.length}팀 (잰때 ${앞자료.잰때} · 창 ${앞자료.창 ? JSON.stringify(앞자료.창) : '적혀 있지 않다'})`);

  const q들 = 팀들.map((t) => t.q).filter((x) => /^Q\d+$/.test(String(x || '')));
  console.log(`Q번호 ${q들.length}개로 설립연도를 받는다`);
  const 연도 = await 설립연도받기(q들);
  console.log(`  받은 것 ${연도.size}팀 · 못 받은 것 ${q들.length - 연도.size}팀`);

  /* ── 이어 붙인다. ⛔ 연도를 못 받은 팀은 «뺀다» — 「모름」 칸을 만들지 않는다 ── */
  const 줄 = [];
  const 못잰것 = [];
  for (const t of 팀들) {
    const 해 = 연도.get(t.q);
    if (!Number.isInteger(해)) { 못잰것.push({ 이름: t.이름, q: t.q, 까닭: '위키데이터에 설립연도(P571)가 없다' }); continue; }
    const 칸 = 세대(해);
    if (칸 === null) { 못잰것.push({ 이름: t.이름, q: t.q, 까닭: `설립연도 ${해} 를 우리 칸으로 못 갈랐다` }); continue; }
    줄.push({
      이름: t.이름, 제목: t.제목, q: t.q,
      데뷔해: 해, 세대: 칸,
      멤버수: t.멤버수,
      통합열람: t.통합열람, 팀열람: t.팀열람, 멤버열람: t.멤버열람,
      멤버몫: t.멤버몫,
      하위유닛짐작: t.하위유닛짐작 === true,
    });
  }
  console.log(`이어 붙인 것 ${줄.length}팀 · 뺀 것 ${못잰것.length}팀`);

  /* ── 세대칸별 분포 ────────────────────────────────────────────────────
   * ⚠ 하위유닛을 «뺀 판»으로 센다. 어제 재 보니 하위유닛은 팀 이름이 안 알려져서
   *   멤버몫을 위로 끌어올렸다. 세대별로 하위유닛 수가 다르면 그것이 세대 차이로 보인다.
   *   ⇒ 두 판을 다 낸다. 뺀 판을 본판으로 삼고, 넣은 판도 함께 적어 손님이 견주게 한다.
   */
  const 칸별 = (판) => 세대칸.map((c) => {
    const 것 = 판.filter((x) => x.세대 === c.이름);
    return {
      세대: c.이름, 영문: c.영문, 첫해: c.첫해, 끝해: c.끝해,
      팀수: 것.length,
      통합열람중앙값: 중앙값(것.map((x) => x.통합열람)),
      통합열람사분위: 사분위(것.map((x) => x.통합열람)),
      멤버몫중앙값: 중앙값(것.map((x) => x.멤버몫)),
      멤버수중앙값: 중앙값(것.map((x) => x.멤버수)),
    };
  });

  const 본유닛 = 줄.filter((x) => !x.하위유닛짐작);
  const 칸별본판 = 칸별(본유닛);
  const 칸별전체 = 칸별(줄);

  /* 이웃한 칸끼리 사분위가 얼마나 겹치나 */
  const 이웃겹침 = [];
  for (let i = 0; i < 칸별본판.length - 1; i++) {
    const 가 = 칸별본판[i]; const 나 = 칸별본판[i + 1];
    이웃겹침.push({
      가: 가.세대, 나: 나.세대,
      가팀수: 가.팀수, 나팀수: 나.팀수,
      겹침: 겹침(가.통합열람사분위, 나.통합열람사분위),
    });
  }

  /* ── 경계 시험 ─────────────────────────────────────────────────────── */
  const 해별 = {};
  for (const x of 본유닛) {
    (해별[x.데뷔해] ||= []).push(x.통합열람);
  }
  const 시험 = 경계시험(해별);

  const 낼것 = {
    잰때: (() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())} KST`; })(),
    열람창: 앞자료.창 ?? null,
    우물: [
      'Wikidata SPARQL — P571 (inception). Where an act has several, the earliest is taken.',
      'Reading and member share are reused from kcw-member-vs-group.json — not re-fetched.',
    ],
    이것이무엇인가: 'Korean acts binned by the year they were founded, against how much they are read in English.',
    이것이아닌것: [
      'It is not a ranking of generations. The bins are a press convention, not a fact, and this file exists to test them.',
      'It cannot say a generation label is wrong. It can say whether the years where reading breaks are the years the label puts the break.',
      'Founding year is not always debut year. Wikidata records inception; some acts trained for years before releasing.',
    ],
    선: {
      세대칸,
      사분위셈: 'nearest-rank on the sorted values',
      경계시험최소팀: 4,
      하위유닛: '본판에서 뺐다 — 앞 자료의 하위유닛짐작 을 그대로 쓴다',
    },
    셈: {
      앞자료팀수: 팀들.length,
      설립연도받은팀수: 연도.size,
      이어붙인팀수: 줄.length,
      본유닛팀수: 본유닛.length,
      하위유닛팀수: 줄.length - 본유닛.length,
      뺀팀수: 못잰것.length,
    },
    칸별: 칸별본판,
    칸별하위유닛포함: 칸별전체,
    이웃겹침,
    경계시험: 시험,
    팀: 줄.sort((a, b) => a.데뷔해 - b.데뷔해 || b.통합열람 - a.통합열람),
    못잰것,
  };

  /* ── 눈으로 보는 자리 ─────────────────────────────────────────────── */
  console.log('\n=== 세대칸별 (하위유닛 뺀 판) ===');
  for (const c of 칸별본판) {
    if (!c.팀수) { console.log(`  ${c.세대.padEnd(18)} 팀 0 — 잰 것이 없다`); continue; }
    const q = c.통합열람사분위;
    console.log(`  ${c.세대.padEnd(18)} 팀 ${String(c.팀수).padStart(3)} · 열람중앙값 ${String(Math.round(c.통합열람중앙값)).padStart(9)}`
      + (q ? ` · 사분위 ${Math.round(q.q1)}~${Math.round(q.q3)}` : ' · 사분위 못 냄(넷 미만)')
      + ` · 멤버몫 ${c.멤버몫중앙값 === null ? '못 쟀다' : (c.멤버몫중앙값 * 100).toFixed(1) + '%'}`);
  }

  console.log('\n=== 이웃한 칸의 사분위 겹침 ===');
  for (const x of 이웃겹침) {
    console.log(`  ${x.가.padEnd(18)} ↔ ${x.나.padEnd(18)} ${x.겹침 === null ? '못 쟀다' : (x.겹침 * 100).toFixed(0) + '%'}`
      + ` (팀 ${x.가팀수}·${x.나팀수})`);
  }

  console.log('\n=== 경계 시험 — 해가 바뀔 때 중앙값이 뛰는 자리 ===');
  if (!시험) {
    console.log('  ⬜ 못 쟀다 — 한 해에 팀이 넷 넘는 자리가 모자라다');
  } else {
    console.log(`  잰 틈 ${시험.잰틈수}개 중 세대 경계는 ${시험.잰경계수}개`);
    console.log(`  가장 크게 뛴 ${시험.잰경계수}자리 안에 든 경계: ${시험.위쪽에든경계수}개 (우연이면 ${시험.우연이면기대}개 기대)`);
    console.log('  --- 크게 뛴 자리 여덟 ---');
    for (const t of 시험.줄세운.slice(0, 8)) {
      console.log(`   ${t.해} 들어설 때 ${String(t.뜀).padStart(6)}배`
        + ` ${t.경계인가 ? '◀ 세대 경계' : ''}  (${Math.round(t.앞중앙값)} → ${Math.round(t.뒤중앙값)} · 팀 ${t.앞팀수}·${t.뒤팀수})`);
    }
  }

  if (!process.argv.includes('--적는다')) {
    console.log('\n⬜ 재기만 했다. 쓰려면 --적는다');
    return;
  }
  fs.writeFileSync(나갈것, JSON.stringify(낼것, null, 2) + '\n', 'utf8');
  console.log(`\n✅ 적었다 — ${path.relative(ROOT, 나갈것)}`);
}

/* 🔴 이 파일을 «불러 쓸» 때 본문이 돌면 안 된다.
 *   2026-09-07 에 build-kcw-star-signs.mjs 가 이 보호막이 없어서, 불러 쓴 쪽에서
 *   자료를 다시 쓰고 process.exit(1) 까지 냈다. 그래서 여기 못박아 둔다. */
const 내가직접돌았나 = (() => {
  try { return process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]); }
  catch { return false; }
})();

if (내가직접돌았나) {
  주된일().catch((e) => { console.error('🔴', e.message); process.exit(1); });
}
