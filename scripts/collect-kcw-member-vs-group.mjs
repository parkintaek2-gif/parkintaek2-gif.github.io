#!/usr/bin/env node
/**
 * collect-kcw-member-vs-group.mjs — **팬은 「팀」을 읽나, 「사람」을 읽나**
 * ─────────────────────────────────────────────────────────────────────────────
 * [왜 이 축인가 · 2026-09-07 5번]
 *   오늘 롱테일 축 셋을 하루에 다 썼다(webtoon · group-afterlife · what-countries-read).
 *   그래서 저녁에 쓸 만한 씨앗 넷이 들어왔는데 **넷 다 이미 쓴 축**에 붙는 것이었다.
 *   ⛔ 같은 축에 같은 구조로 한 편을 더 얹으면 편수는 늘고 값은 안 는다.
 *   ⇒ 그러니 **축을 하루에 하나씩 새로 쌓는다.** 이것이 그 하나다.
 *
 *   ⭐ 이 축은 아직 우리에게 «없던» 것이다. 지금까지는 팀 문서 하나만 셌다 —
 *     팀 문서와 «멤버 문서»를 나란히 놓은 자가 없었다.
 *
 * [무엇을 재나]
 *   한 팀의 관심이 «팀 문서»에 있나, «멤버 문서»에 있나. 달별 열람으로 잰다.
 *   ```
 *   멤버몫 = 멤버 문서 열람 합 / (팀 문서 열람 + 멤버 문서 열람 합)
 *   ```
 *   ⭐ 이 하나로 나오는 물음이 여럿이다 —
 *     · 어느 팀이 「사람으로 읽히나」  (멤버몫이 큰 팀)
 *     · 어느 팀이 「팀으로만 읽히나」  (멤버몫이 작은 팀 — 이름은 알지만 멤버는 모른다)
 *     · 한 멤버가 팀 관심을 «혼자 가져가나» (으뜸멤버몫)
 *
 * [내일 이슈를 여기에 붙인다]
 *   Soyeon(i-dle) 솔로 앨범 · MINHO(SHINee) 2nd Mini 가 어제 창에 들어왔다.
 *   「솔로를 내면 팀이 읽히나 사람이 읽히나」를 이 자로 답할 수 있다.
 *   ⛔ 다만 «발표일 자료»는 없다. 그러니 「솔로 발표 뒤에 올랐다」고 말하지 않는다 —
 *     지금 누구를 읽고 있나까지만 적는다. 못 잰 것은 못 쟀다고 적는다.
 *
 * [우물]
 *   Wikidata SPARQL — 팀은 group-afterlife 와 «같은 조건»으로 잡고(P31/P279* 네 분류 ·
 *   나라 P495/P17/P740 중 하나가 한국), 멤버는 P527(부분으로 가진다) 과
 *   P463(소속) 양쪽으로 잡는다. 한쪽만 쓰면 팀마다 채운 속성이 달라 빠진다.
 *   Wikimedia Pageviews — per-article, en.wikipedia, all-access, agent=user, monthly.
 *
 * ⛔ `SERVICE wikibase:label` 을 쓰지 않는다. 오늘 그것이 «말없이 줄을 버려»
 *   191 → 318 로 갈렸다(에스파가 통째로 빠졌다). 이름은 영문 위키 제목에서 얻는다.
 * ⛔ 한 번에 받으면 답이 정확히 196,608자에서 잘린다. LIMIT/OFFSET 으로 쪽을 나눈다.
 *
 * [쓰는 법]
 *   node scripts/collect-kcw-member-vs-group.mjs --시험만     판정 논리만 (그물 안 던진다)
 *   node scripts/collect-kcw-member-vs-group.mjs              재기만 하고 안 쓴다
 *   node scripts/collect-kcw-member-vs-group.mjs --적는다      src/data 에 쓴다
 *   node scripts/collect-kcw-member-vs-group.mjs --맛보기 40   팀 40개만 (빨리 보려고)
 *
 * ⚠ 🔴 **모르는 깃발은 거부한다.** 오늘 없는 깃발(`--시험만`)을 다른 수집기에 주었더니
 *   그 자가 «진짜 수집»을 돌려 자료를 덮어썼고 세 사이트 배포가 막혔다.
 *   그래서 이 검사를 파일 «맨 앞»에 둔다 — 아래에 두면 본문이 먼저 돈다.
 */

const 아는깃발 = new Set(['--시험만', '--적는다', '--맛보기']);
{
  const 준것 = process.argv.slice(2);
  const 모르는것 = [];
  for (let i = 0; i < 준것.length; i++) {
    const a = 준것[i];
    if (!a.startsWith('--')) continue;               // 값은 건너뛴다
    if (!아는깃발.has(a)) 모르는것.push(a);
    if (a === '--맛보기') i++;                        // 다음 것은 이 깃발의 값이다
  }
  if (모르는것.length) {
    console.error(`⛔ 모르는 깃발입니다: ${모르는것.join(' ')}`);
    console.error(`   아는 깃발: ${[...아는깃발].join(' · ')}`);
    console.error('   ⚠ 없는 깃발을 주면 «진짜 수집»이 도는 일이 오늘 있었습니다. 그래서 여기서 멈춥니다.');
    process.exit(2);
  }
}

const UA = { 'User-Agent': 'KCultureWire/1.0 (https://www.kculturewire.com; cs@klifedesign.net)' };

/* ── 셈 (순수 함수 · 자가시험 대상) ───────────────────────────────────── */

/** 달 문자열('2026-08')을 수로 — 견주기 쉽게 */
export function 달수(달) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(달 || ''));
  if (!m) return null;
  return Number(m[1]) * 12 + Number(m[2]);
}

/** 창 안의 달 이름들을 만든다. 끝달을 «넣지 않는다» — 그 달은 아직 안 끝났다 */
export function 창달들(끝달, 몇달) {
  const n = 달수(끝달);
  if (n === null || !Number.isInteger(몇달) || 몇달 < 1) return [];
  const 것 = [];
  for (let i = 몇달; i >= 1; i--) {
    const t = n - i;
    const y = Math.floor((t - 1) / 12);
    const m = t - y * 12;
    것.push(`${y}-${String(m).padStart(2, '0')}`);
  }
  return 것;
}

/**
 * 「이것이 잰 수인가」.
 *
 * 🔴 [2026-09-07] 이 함수가 없어서 자가시험 둘이 걸렸다. `Number(null)` 은 **0** 이고
 *   `Number('')` 도 **0** 이다. 그래서 「열람을 못 읽었다(null)」가 「열람이 0회다」로
 *   조용히 바뀌어 통과했다. 오늘 하루에 여러 번 나온 그 자리다 —
 *   **못 잰 것을 0 으로 채우면 안 된다.** 0 은 «재 봤더니 0» 일 때만 쓴다.
 */
export function 잰수인가(v) {
  if (v === null || v === undefined || v === '') return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}

/**
 * 팀 하나를 잰다.
 * ⛔ 멤버가 «한 명도» 영문 문서를 안 가진 팀은 재지 않는다 — 0 으로 채우면
 *   「멤버를 아무도 안 읽는다」로 읽히는데, 사실은 «잴 문서가 없다»는 것이다.
 */
export function 팀재기({ 이름, 제목, q, 팀열람, 멤버들, 최소멤버 = 1, 최소열람 = 100 }) {
  if (!Array.isArray(멤버들) || 멤버들.length < 최소멤버) {
    return { 못잼: '멤버 가운데 영문 문서를 가진 사람이 없다 — 잴 것이 없다' };
  }
  if (!잰수인가(팀열람)) return { 못잼: '팀 문서 열람을 못 읽었다' };
  const 팀합 = Number(팀열람);

  const 성한멤버 = 멤버들.filter((m) => 잰수인가(m.열람));
  if (!성한멤버.length) return { 못잼: '멤버 열람을 하나도 못 읽었다' };

  const 멤버합 = 성한멤버.reduce((a, m) => a + Number(m.열람), 0);
  const 통합 = 팀합 + 멤버합;
  if (통합 < 최소열람) return { 못잼: `창 동안 열람이 ${통합}뿐이다(${최소열람} 필요) — 잡음이다` };

  const 줄세운 = [...성한멤버].sort((a, b) => Number(b.열람) - Number(a.열람));
  const 으뜸 = 줄세운[0];

  return {
    이름, 제목, q,
    멤버수: 성한멤버.length,
    팀열람: 팀합,
    멤버열람: 멤버합,
    통합열람: 통합,
    멤버몫: Number((멤버합 / 통합).toFixed(4)),
    으뜸멤버: 으뜸.이름,
    으뜸멤버열람: Number(으뜸.열람),
    /* 으뜸 한 사람이 «멤버 관심» 가운데 얼마를 가져가나. 멤버가 한 명이면 1 이다 */
    으뜸멤버몫: Number((Number(으뜸.열람) / 멤버합).toFixed(4)),
    멤버들: 줄세운.map((m) => ({ 이름: m.이름, 열람: Number(m.열람) })),
  };
}

/**
 * 「이것은 하위유닛인가」 — 🔴 **맛보기에서 잡은 교란이다.**
 *
 * 팀 30개로 먼저 재 보니 「사람으로 읽힌다」 위쪽이 죄다 하위유닛이었다 —
 * ```
 * Got the Beat 95.6% · Route 0 97.9% · Moonbin & Sanha 96.3% · BtoB 4U 98.3%
 * ```
 * ⛔ 이것을 섞어 두면 「한국 팀은 사람으로 읽힌다」가 «참인 것처럼» 나온다. 그런데 까닭이
 *   다르다 — **하위유닛은 팀 이름 자체가 안 알려진 것**이다. 소녀시대를 아는 사람이
 *   「Route 0」을 모르는 것은 관심이 사람에게 있다는 뜻이 아니라, 그 «이름»을 모른다는 뜻이다.
 *
 * ✅ 그래서 가른다. 자료를 더 안 받고 갈 수 있다 — 우리가 이미 팀↔멤버 짝을 다 갖고 있다.
 *   한 팀의 멤버가 «우리 목록의 다른 팀»에도 속해 있으면 그 사람은 겹치는 멤버다.
 *   그 비율이 높으면 하위유닛으로 본다.
 *
 * ⚠ 이 자는 «짐작»이다. 위키데이터에 하위유닛을 못박은 속성이 없어서 대신 세는 것이다.
 *   그러니 자료에 「짐작인가」를 함께 적고, 지면에도 그 말을 적는다.
 * ⚠ 선을 0.5 로 둔다 — 멤버 절반 이상이 다른 팀에도 있으면 독립된 팀으로 보기 어렵다.
 */
export function 하위유닛인가(멤버수, 겹치는멤버수, 선 = 0.5) {
  if (!Number.isInteger(멤버수) || 멤버수 < 1) return null;
  if (!Number.isInteger(겹치는멤버수) || 겹치는멤버수 < 0) return null;
  if (겹치는멤버수 > 멤버수) return null;                 // 셈이 어긋났다 — 짐작하지 않는다
  return 겹치는멤버수 / 멤버수 >= 선;
}

/** 어느 쪽으로 읽히나를 «말»로 — 선을 코드에 못박아 두고 지면과 기사가 같은 말을 쓰게 한다 */
export function 어느쪽(멤버몫) {
  const v = Number(멤버몫);
  if (!Number.isFinite(v)) return null;
  if (v >= 0.75) return '사람으로 읽힌다';
  if (v >= 0.5) return '사람 쪽이 조금 크다';
  if (v >= 0.25) return '팀 쪽이 조금 크다';
  return '팀으로만 읽힌다';
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = [];
  const 본다 = (이름, 실제, 기대) => 것.push([이름, JSON.stringify(실제), JSON.stringify(기대)]);

  본다('달수를 읽는다', 달수('2026-08'), 2026 * 12 + 8);
  본다('꼴이 틀리면 null', 달수('2026-8'), null);
  본다('빈 것도 null', 달수(''), null);

  본다('창 열두 달 — 끝달을 «안» 넣는다', 창달들('2026-09', 12).length, 12);
  본다('창의 마지막은 끝달 바로 앞', 창달들('2026-09', 12).slice(-1)[0], '2026-08');
  본다('창의 처음', 창달들('2026-09', 12)[0], '2025-09');
  본다('⭐ 해를 넘는다', 창달들('2026-02', 3), ['2025-11', '2025-12', '2026-01']);
  본다('몇달이 0이면 빈 것', 창달들('2026-09', 0).length, 0);
  본다('끝달이 틀리면 빈 것', 창달들('안됨', 12).length, 0);

  const 셋 = [{ 이름: 'A', 열람: 600 }, { 이름: 'B', 열람: 300 }, { 이름: 'C', 열람: 100 }];
  const r = 팀재기({ 이름: '팀', 제목: '팀', q: 'Q1', 팀열람: 1000, 멤버들: 셋 });
  본다('멤버 합', r.멤버열람, 1000);
  본다('통합', r.통합열람, 2000);
  본다('멤버몫은 절반', r.멤버몫, 0.5);
  본다('으뜸은 가장 많이 읽힌 사람', r.으뜸멤버, 'A');
  본다('으뜸멤버몫 = 600/1000', r.으뜸멤버몫, 0.6);
  본다('멤버들이 «많은 순»으로 줄선다', r.멤버들.map((m) => m.이름), ['A', 'B', 'C']);

  본다('⛔ 멤버가 없으면 재지 않는다 — 0 으로 안 채운다',
    !!팀재기({ 이름: '팀', 제목: '팀', q: 'Q1', 팀열람: 1000, 멤버들: [] }).못잼, true);
  본다('⛔ 멤버 자리가 배열이 아니면 재지 않는다',
    !!팀재기({ 이름: '팀', 제목: '팀', q: 'Q1', 팀열람: 1000, 멤버들: null }).못잼, true);
  본다('⛔ 팀 열람을 못 읽으면 재지 않는다',
    !!팀재기({ 이름: '팀', 제목: '팀', q: 'Q1', 팀열람: null, 멤버들: 셋 }).못잼, true);
  본다('⭐ 팀 열람이 0인 것은 «못 읽은 것»이 아니다 — 잰다',
    팀재기({ 이름: '팀', 제목: '팀', q: 'Q1', 팀열람: 0, 멤버들: 셋 }).멤버몫, 1);
  본다('⛔ 열람이 너무 적으면 잡음이라 안 쓴다',
    !!팀재기({ 이름: '팀', 제목: '팀', q: 'Q1', 팀열람: 10, 멤버들: [{ 이름: 'A', 열람: 5 }] }).못잼, true);
  본다('⭐ 열람 못 읽은 멤버는 «빼고» 센다 — 0 으로 안 채운다',
    팀재기({ 이름: '팀', 제목: '팀', q: 'Q1', 팀열람: 500,
      멤버들: [{ 이름: 'A', 열람: 500 }, { 이름: 'B', 열람: null }] }).멤버수, 1);
  본다('멤버가 한 명이면 으뜸멤버몫은 1',
    팀재기({ 이름: '팀', 제목: '팀', q: 'Q1', 팀열람: 500, 멤버들: [{ 이름: 'A', 열람: 500 }] }).으뜸멤버몫, 1);

  본다('멤버몫 0.9 → 사람으로 읽힌다', 어느쪽(0.9), '사람으로 읽힌다');
  본다('경계 0.75 는 사람 쪽', 어느쪽(0.75), '사람으로 읽힌다');
  본다('0.6 → 사람 쪽이 조금 크다', 어느쪽(0.6), '사람 쪽이 조금 크다');
  본다('0.5 도 사람 쪽이 조금 크다', 어느쪽(0.5), '사람 쪽이 조금 크다');
  본다('0.3 → 팀 쪽이 조금 크다', 어느쪽(0.3), '팀 쪽이 조금 크다');
  본다('0.1 → 팀으로만 읽힌다', 어느쪽(0.1), '팀으로만 읽힌다');
  본다('⭐ 수가 아니면 null — 「팀으로만」으로 안 읽는다', 어느쪽('많음'), null);
  본다('빈 것도 null', 어느쪽(undefined), null);

  본다('⭐ null 은 잰 수가 아니다 — Number(null)===0 에 속지 않는다', 잰수인가(null), false);
  본다('빈 글자도 잰 수가 아니다', 잰수인가(''), false);
  본다('undefined 도 아니다', 잰수인가(undefined), false);
  본다('0 은 «잰» 수다', 잰수인가(0), true);
  본다('음수는 열람이 될 수 없다', 잰수인가(-1), false);
  본다('글자로 온 수는 받는다', 잰수인가('500'), true);
  본다('말은 안 받는다', 잰수인가('많음'), false);

  본다('⭐ 멤버 넷 중 셋이 겹치면 하위유닛', 하위유닛인가(4, 3), true);
  본다('절반이면 선에 걸려 하위유닛', 하위유닛인가(4, 2), true);
  본다('넷 중 하나만 겹치면 아니다', 하위유닛인가(4, 1), false);
  본다('아무도 안 겹치면 아니다', 하위유닛인가(5, 0), false);
  본다('⭐ 겹치는 수가 멤버 수보다 크면 null — 짐작하지 않는다', 하위유닛인가(3, 4), null);
  본다('멤버가 0이면 null', 하위유닛인가(0, 0), null);
  본다('정수가 아니면 null', 하위유닛인가(4, 1.5), null);
  본다('음수도 null', 하위유닛인가(4, -1), null);

  let 흠 = 0;
  for (const [이름, 실제, 기대] of 것) {
    if (실제 !== 기대) { 흠++; console.log(`  ⛔ ${이름} — 나온 것 ${실제} · 기대 ${기대}`); }
  }
  console.log(흠 ? `⛔ 자가시험 ${것.length}개 중 ${흠}개 실패` : `✅ 자가시험 ${것.length}개 통과`);
  return 흠;
}

/* ── 그물 ─────────────────────────────────────────────────────────────── */

async function 받기(주소, 꼴 = 'json') {
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(주소, { headers: UA });
      if (r.ok) return 꼴 === 'json' ? await r.json() : await r.text();
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
  let 씻은수 = 0;
  const 씻김 = String(글).replace(new RegExp('[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]', 'g'), () => { 씻은수++; return ' '; });
  return { 글: 씻김, 씻은수 };
}

async function 쪽나눠받기(질의몸, 한쪽 = 400) {
  const 받은 = [];
  for (let 건너 = 0; 건너 < 40000; 건너 += 한쪽) {
    const q = `${질의몸} LIMIT ${한쪽} OFFSET ${건너}`;
    const su = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q);
    const 날글 = await 받기(su, 'text');
    if (!날글 || 날글.못받음) throw new Error(`위키데이터를 못 받았다(OFFSET ${건너}): ` + JSON.stringify(날글));
    let 쪽;
    try { 쪽 = JSON.parse(제어문자씻기(String(날글)).글); }
    catch (e) { throw new Error(`답을 못 읽었다(OFFSET ${건너}, ${String(날글).length}자) — 잘렸을 수 있다: ` + e.message); }
    const 줄 = 쪽.results.bindings;
    받은.push(...줄);
    if (줄.length < 한쪽) break;
  }
  return 받은;
}

function 제목뽑기(주소값) {
  return decodeURIComponent(String(주소값 || '').split('/wiki/')[1] || '').replace(/_/g, ' ');
}

/** 한 문서의 창 동안 열람 합. 못 읽으면 null — 0 으로 안 채운다 */
async function 열람합(제목, 첫달, 끝달) {
  const 시 = `${첫달.replace('-', '')}01`;
  const 끝 = `${끝달.replace('-', '')}01`;
  const u = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia'
    + `/all-access/user/${encodeURIComponent(제목.replace(/ /g, '_'))}/monthly/${시}/${끝}`;
  const j = await 받기(u);
  if (!j || j.못받음 || !Array.isArray(j.items)) return null;
  return j.items.reduce((a, it) => a + Number(it.views || 0), 0);
}

async function 주된일() {
  const 흠 = 자가시험();
  if (흠) process.exit(1);
  if (process.argv.includes('--시험만')) return;

  const 적나 = process.argv.includes('--적는다');
  const 맛보기 = (() => {
    const i = process.argv.indexOf('--맛보기');
    if (i === -1) return 0;
    const n = Number(process.argv[i + 1]);
    return Number.isInteger(n) && n > 0 ? n : 0;
  })();

  const 이제 = new Date();
  const 끝달 = `${이제.getFullYear()}-${String(이제.getMonth() + 1).padStart(2, '0')}`;
  const 달들 = 창달들(끝달, 12);
  const 첫달 = 달들[0];
  const 마지막달 = 달들[달들.length - 1];
  console.log(`창 — ${첫달} ~ ${마지막달} (열두 달 · 안 끝난 ${끝달} 은 뺐다)`);

  /* 1. 팀 — group-afterlife 와 «같은 조건». 조건이 다르면 두 지면이 서로 안 맞는다 */
  console.log('팀을 받는다 (Wikidata)…');
  const 팀줄 = await 쪽나눠받기(`SELECT DISTINCT ?g ?en WHERE {
    VALUES ?kind { wd:Q215380 wd:Q2088357 wd:Q641066 wd:Q5741069 }
    ?g wdt:P31/wdt:P279* ?kind .
    { ?g wdt:P495 wd:Q884 } UNION { ?g wdt:P17 wd:Q884 } UNION { ?g wdt:P740/wdt:P17 wd:Q884 }
    ?en schema:about ?g ; schema:isPartOf <https://en.wikipedia.org/> .
  } ORDER BY ?g`);

  const 팀 = new Map();
  for (const b of 팀줄) {
    const q = b.g.value.split('/entity/')[1];
    const 제목 = 제목뽑기(b.en.value);
    if (!q || !제목 || 팀.has(q)) continue;
    팀.set(q, { q, 이름: 제목, 제목, 멤버: [] });
  }
  console.log(`  팀 ${팀.size}개 (영문 문서 있는 것만)`);

  /* 2. 멤버 — P527 과 P463 «양쪽»으로. 한쪽만 쓰면 팀마다 채운 속성이 달라 빠진다 */
  console.log('멤버를 받는다 (P527 · P463 양쪽)…');
  const 멤버줄 = await 쪽나눠받기(`SELECT DISTINCT ?g ?m ?men WHERE {
    VALUES ?kind { wd:Q215380 wd:Q2088357 wd:Q641066 wd:Q5741069 }
    ?g wdt:P31/wdt:P279* ?kind .
    { ?g wdt:P495 wd:Q884 } UNION { ?g wdt:P17 wd:Q884 } UNION { ?g wdt:P740/wdt:P17 wd:Q884 }
    { ?g wdt:P527 ?m } UNION { ?m wdt:P463 ?g }
    ?men schema:about ?m ; schema:isPartOf <https://en.wikipedia.org/> .
  } ORDER BY ?g ?m`);

  let 짝수 = 0;
  for (const b of 멤버줄) {
    const gq = b.g.value.split('/entity/')[1];
    const t = 팀.get(gq);
    if (!t) continue;
    const 제목 = 제목뽑기(b.men.value);
    if (!제목 || 제목 === t.제목) continue;                    // 자기 자신은 멤버가 아니다
    if (t.멤버.some((m) => m.제목 === 제목)) continue;
    t.멤버.push({ 제목, 이름: 제목 });
    짝수++;
  }
  const 멤버있는팀 = [...팀.values()].filter((t) => t.멤버.length);
  console.log(`  팀–멤버 짝 ${짝수}개 · 멤버가 «있는» 팀 ${멤버있는팀.length}개 / ${팀.size}개`);
  if (!멤버있는팀.length) throw new Error('멤버를 하나도 못 받았다 — 질의를 다시 본다');

  /* 3. 열람 — 팀 문서와 멤버 문서를 «같은 창»으로 */
  /* 🔴 하위유닛을 가른다 — 자료를 더 안 받는다. 이미 가진 팀↔멤버 짝으로 센다.
     ⚠ 「몇 팀에 속하나」는 «전체 목록»으로 센다. 맛보기로 자른 뒤에 세면 겹침이 줄어
       하위유닛이 본래 팀으로 잘못 보인다 — 그래서 자르기 «전»에 여기서 센다. */
  const 몇팀에 = new Map();
  for (const t of 멤버있는팀) for (const m of t.멤버) 몇팀에.set(m.제목, (몇팀에.get(m.제목) || 0) + 1);
  for (const t of 멤버있는팀) {
    t.겹치는멤버수 = t.멤버.filter((m) => (몇팀에.get(m.제목) || 0) > 1).length;
    t.하위유닛 = 하위유닛인가(t.멤버.length, t.겹치는멤버수);
  }
  const 하위수 = 멤버있는팀.filter((t) => t.하위유닛 === true).length;
  console.log(`  하위유닛으로 «짐작»되는 팀 ${하위수}개 — 멤버 절반 이상이 다른 팀에도 있다`);

  const 볼팀 = 맛보기 ? 멤버있는팀.slice(0, 맛보기) : 멤버있는팀;
  console.log(`열람을 받는다 — 팀 ${볼팀.length} + 멤버 ${볼팀.reduce((a, t) => a + t.멤버.length, 0)}…`);

  const 잰것 = [];
  const 못잰것 = [];
  let 한것 = 0;
  for (const t of 볼팀) {
    const 팀열람 = await 열람합(t.제목, 첫달, 마지막달);
    for (const m of t.멤버) m.열람 = await 열람합(m.제목, 첫달, 마지막달);
    const r = 팀재기({ 이름: t.이름, 제목: t.제목, q: t.q, 팀열람, 멤버들: t.멤버 });
    if (r.못잼) 못잰것.push({ 이름: t.이름, 제목: t.제목, q: t.q, 까닭: r.못잼 });
    else {
      r.어느쪽 = 어느쪽(r.멤버몫);
      r.겹치는멤버수 = t.겹치는멤버수;
      r.하위유닛짐작 = t.하위유닛;
      잰것.push(r);
    }
    if (++한것 % 50 === 0) console.log(`  … ${한것}/${볼팀.length}`);
  }

  잰것.sort((a, b) => b.통합열람 - a.통합열람);
  console.log(`\n잰 팀 ${잰것.length}개 · 못 잰 팀 ${못잰것.length}개`);

  const 갈래 = {};
  for (const r of 잰것) 갈래[r.어느쪽] = (갈래[r.어느쪽] || 0) + 1;
  for (const k of ['사람으로 읽힌다', '사람 쪽이 조금 크다', '팀 쪽이 조금 크다', '팀으로만 읽힌다']) {
    const n = 갈래[k] || 0;
    console.log(`  ${k.padEnd(16)} ${String(n).padStart(4)}팀  (${(n / 잰것.length * 100).toFixed(1)}%)`);
  }
  console.log('\n열람이 가장 많은 열 팀 —');
  for (const r of 잰것.slice(0, 10)) {
    console.log(`  ${r.이름.padEnd(22)} 멤버몫 ${(r.멤버몫 * 100).toFixed(1).padStart(5)}%  `
      + `으뜸 ${r.으뜸멤버}(${(r.으뜸멤버몫 * 100).toFixed(0)}%)  ${r.어느쪽}`);
  }

  if (!적나) {
    console.log('\n⬜ --적는다 를 안 주어 «안 썼다». 위 수만 보고 판단하십시오.');
    return;
  }

  const 나갈것 = {
    /* 🔴 [2026-09-08] 여기에 `toLocaleString('ko-KR')` 을 썼더니 「오후」가 자료에 박혔고,
       그 자료를 쓰는 지면에서 **한국어가 손님 화면으로 샜다**(check-kcw-korean-leak 이 잡음).
       ⛔ 자료에 적는 시각은 지면에 그대로 나갈 수 있다. 그러니 «영어권 손님이 읽을 꼴»로 적는다.
       ⚠ 이 PC 는 이미 KST 다 — 9시간을 더하지 않고 toISOString() 도 쓰지 않는다. */
    잰때: (() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())} KST`; })(),
    창: `${첫달} ~ ${마지막달}`,
    우물: 'Wikidata SPARQL (팀은 P31/P279* 음악그룹·음악앙상블·걸그룹·보이밴드 · 나라 P495/P17/P740 중 하나가 한국 · 멤버는 P527 과 P463 양쪽) + Wikimedia Pageviews per-article, en.wikipedia, all-access, agent=user, monthly',
    이것이무엇인가: '한 팀의 관심이 «팀 문서»에 있나 «멤버 문서»에 있나를 열두 달 열람으로 잰 것',
    이것이아닌것: '인기 순위가 아니다. 솔로 발표의 효과도 아니다 — 발표일 자료가 없어 못 쟀다',
    선: { '사람으로 읽힌다': '멤버몫 ≥ 0.75', '사람 쪽이 조금 크다': '≥ 0.5', '팀 쪽이 조금 크다': '≥ 0.25', '팀으로만 읽힌다': '< 0.25' },
    셈: { 잰팀: 잰것.length, 못잰팀: 못잰것.length, 갈래 },
    팀: 잰것,
    못잰것,
  };

  /* ⚠ 쓰기 «전»에 열쇠가 다 있는지 본다 — 오늘 지면이 읽는 열쇠 둘이 빠진 자료를
     덮어써서 세 사이트 배포가 막혔다. 그 일을 여기서 되풀이하지 않는다. */
  const 있어야할열쇠 = ['잰때', '창', '우물', '이것이무엇인가', '이것이아닌것', '선', '셈', '팀', '못잰것'];
  const 빠진열쇠 = 있어야할열쇠.filter((k) => !(k in 나갈것));
  if (빠진열쇠.length) throw new Error(`열쇠가 빠졌다: ${빠진열쇠.join(' · ')} — 쓰지 않는다`);
  if (!나갈것.팀.length) throw new Error('팀이 0개다 — 쓰지 않는다');

  const fs = await import('node:fs');
  const 곳 = new URL('../src/data/kcw-member-vs-group.json', import.meta.url);
  fs.writeFileSync(곳, JSON.stringify(나갈것, null, 1), 'utf8');
  console.log(`\n✅ 썼다 — src/data/kcw-member-vs-group.json (팀 ${잰것.length})`);
  console.log('⬜ 다음 — 이 자료로 지면과 기사를 «같은 커밋»에 낸다. 자료만 두면 축이 아니다.');
}

await 주된일();
