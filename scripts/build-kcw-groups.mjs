/**
 * build-kcw-groups.mjs — **그룹별 지면 자료.** (`/group/bts`)
 *
 * ── 🔴 왜 이 자료가 생겼나 ───────────────────────────────────
 * 우리 검색 실측에서 **노출이 가장 큰 지면이 BTS 기사**였다(68노출). 그 갈래 수요를 재니 —
 * ```
 *   bts members age        자동완성 1번째 · 그 말로 시작 10줄
 *   bts members birthday   1번째 · 10줄
 *   blackpink members age  1번째 · 10줄
 * ```
 * 손님이 묻는 낱알은 **「그룹 하나의 멤버들」**이고, 우리는 생년월일을 갖고 있었지만
 * 그룹-멤버를 잇는 자료가 없어 그 축으로 한 장도 못 냈다. `collect-korean-groups.mjs` 가
 * 그것을 캤고(428그룹·멤버 1,865명), 이 자가 지면이 쓸 꼴로 접는다.
 *
 * ── 🔴 이 자료가 반드시 지키는 것 — «나이는 움직이는 수다» ───────
 * 우리 지면은 배포할 때만 다시 지어진다. 「지금 서른한 살」을 그대로 적으면 해가 바뀌는
 * 날부터 지면이 거짓을 말한다. 나이 묶음 지면(`/actors-in-their`)에서 겪은 그 함정이다.
 * ⭐ 그래서 **나이와 «태어난 해»를 반드시 같이 낸다.** 나이는 기준 해가 있어야 뜻이 있고,
 *   태어난 날은 영원히 안 변한다. 그러면 지면이 낡아도 읽는 사람이 스스로 고쳐 읽는다.
 *
 * ── ⛔ 이 자료가 «말하지 않는» 것 ────────────────────────────
 * ⛔ **「현재 멤버」라고 말하지 않는다.** P527 은 «있었던» 사람을 담아 탈퇴자도 들어 있고
 *   우리는 그 둘을 못 가른다.
 * ⛔ **적힌 멤버 수와 이름 쓸 수 있는 수를 갈라 낸다.** 위키데이터는 BLACKPINK 를 4명으로
 *   적는데 로제에게 영문 이름이 없다. 「멤버 3명」은 틀린 수다 — 이름을 못 쓰는 것과
 *   사람이 없는 것은 다르다. 428그룹 중 16그룹이 이 경우다.
 * ⛔ **키를 안 낸다.** `bts members height` 도 1번째·10줄이지만 위키데이터에 키가 적힌
 *   한국 연예인이 3.5%뿐이다. 수요가 커도 자료가 못 답하면 안 만든다.
 * ⛔ 멤버 수가 많다고 «큰 그룹»이라고 하지 않는다 — 위키데이터에 실리는 것은 편집자가 정한다.
 *
 * 쓰는 법  node scripts/build-kcw-groups.mjs --자가시험
 *          node scripts/build-kcw-groups.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 캔길 = path.join(뿌리, 'archive/raw/wikidata/korean-groups.json');
const 낼길 = path.join(뿌리, 'src/data/wikitip-groups.json');

/**
 * 지면을 낼 최소 인원(이름을 쓸 수 있는 멤버). **둘짜리 지면은 안 낸다** —
 * 「멤버 나이」를 물으러 온 손님에게 두 줄짜리 표는 열어 준 값을 못 한다.
 * ⛔ 못 미친 그룹을 «지운» 것이 아니다. 세고, 몇 개를 안 냈는지 지면에 적는다.
 */
export const 최소멤버 = 3;

/** 서양 별자리 — 이미 `/star-sign` 열두 장에서 쓰는 것과 «같은 경계»를 쓴다 */
export const 자리표 = [
  ['capricorn', 'Capricorn', '12-22', '01-19'], ['aquarius', 'Aquarius', '01-20', '02-18'],
  ['pisces', 'Pisces', '02-19', '03-20'], ['aries', 'Aries', '03-21', '04-19'],
  ['taurus', 'Taurus', '04-20', '05-20'], ['gemini', 'Gemini', '05-21', '06-20'],
  ['cancer', 'Cancer', '06-21', '07-22'], ['leo', 'Leo', '07-23', '08-22'],
  ['virgo', 'Virgo', '08-23', '09-22'], ['libra', 'Libra', '09-23', '10-22'],
  ['scorpio', 'Scorpio', '10-23', '11-21'], ['sagittarius', 'Sagittarius', '11-22', '12-21'],
];

/**
 * 생일에서 별자리. ⚠ 염소자리는 해를 넘는다 — 12-22 부터 01-19 까지다.
 * ⛔ 경계일을 확정으로 말하지 않는다. 경계는 해마다 몇 시간씩 흔들린다 — 지면에 그렇게 적는다.
 */
export function 별자리(born) {
  const m = String(born ?? '').match(/^\d{4}-(\d{2}-\d{2})$/);
  if (!m) return null;
  const md = m[1];
  for (const [슬러그, 이름, 부터, 까지] of 자리표) {
    if (부터 > 까지) { if (md >= 부터 || md <= 까지) return { slug: 슬러그, name: 이름 }; }
    else if (md >= 부터 && md <= 까지) return { slug: 슬러그, name: 이름 };
  }
  return null;
}

/**
 * 기준 해에 몇 살인가 — **태어난 해만** 쓴다(만 나이가 아니다).
 * ⛔ 이 수를 지면에 «혼자» 적지 않는다. 반드시 기준 해와 태어난 날을 같이 적는다.
 */
export function 나이(born, 기준해) {
  const m = String(born ?? '').match(/^(\d{4})/);
  return m ? 기준해 - Number(m[1]) : null;
}

export function 달이름(born) {
  const m = String(born ?? '').match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const 달 = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'][Number(m[1]) - 1];
  return 달 ? `${Number(m[2])} ${달}` : null;
}

export function 짓는다(캔것, 기준해) {
  const 모두 = (캔것.그룹 ?? []).map((g) => {
    const 이름있는 = (g.members ?? []).filter((m) => m.name);
    const 생일있는 = 이름있는.filter((m) => m.born);
    /* ⛔ 생일 없는 사람을 «빼지» 않는다. 이름은 실리되 나이 칸이 비는 것이 맞다 */
    const 멤버 = 이름있는.map((m) => ({
      name: m.name,
      born: m.born ?? null,
      bornText: 달이름(m.born),
      age: 나이(m.born, 기준해),
      sign: 별자리(m.born),
      birthplace: m.birthplace ?? null,
      languages: m.languages ?? null,
    })).sort((a, b) => String(a.born ?? '9999').localeCompare(String(b.born ?? '9999')));
    const 해들 = 생일있는.map((m) => Number(String(m.born).slice(0, 4))).sort((a, b) => a - b);
    return {
      slug: g.slug,
      name: g.name,
      membersRecorded: g.membersRecorded ?? 이름있는.length,
      membersNamed: 이름있는.length,
      membersWithBirthday: 생일있는.length,
      oldestBornYear: 해들.length ? 해들[0] : null,
      youngestBornYear: 해들.length ? 해들[해들.length - 1] : null,
      birthplacesKnown: 이름있는.filter((m) => m.birthplace).length,
      members: 멤버,
    };
  }).sort((a, b) => b.membersNamed - a.membersNamed || a.name.localeCompare(b.name));

  const 문턱넘은것 = 모두.filter((g) => g.membersNamed >= 최소멤버);
  /*
   * 🔴 주소가 겹치면 한 지면이 다른 지면을 «조용히» 덮는다. 빌드는 안 멈춘다.
   * 실제로 걸렸다 — 위키데이터에 「BB Girls」가 둘 있다(Q492721 멤버 10명 · Q25542911 4명).
   * 멤버가 겹치는 걸 보면 «같은 그룹의 다른 시기»다.
   * ⛔ 그렇다고 둘을 합치지 않는다. 같은 그룹인지 우리가 확인한 것이 아니다 —
   *   멤버가 많은 쪽을 남기고, **뺀 쪽을 까닭과 함께 적는다.** 조용히 사라지게 두지 않는다.
   */
  const 낼것 = [];
  const 본것 = new Map();
  const 겹쳐서뺀것 = [];
  for (const g of 문턱넘은것) {
    const 앞 = 본것.get(g.slug);
    if (!앞) { 본것.set(g.slug, g); 낼것.push(g); continue; }
    const 이긴것 = g.membersNamed > 앞.membersNamed ? g : 앞;
    const 진것 = 이긴것 === g ? 앞 : g;
    겹쳐서뺀것.push({
      slug: g.slug, kept: 이긴것.name, keptMembers: 이긴것.membersNamed,
      dropped: 진것.name, droppedMembers: 진것.membersNamed,
      why: '같은 주소가 되는 이름이 위키데이터에 둘 있다. 멤버가 많은 쪽을 남겼다 — 합치지 않았다',
    });
    if (이긴것 === g) {
      본것.set(g.slug, g);
      낼것.splice(낼것.indexOf(앞), 1, g);
    }
  }
  const 겹침 = [];

  return {
    builtAt: new Date().toISOString(),
    refYear: 기준해,
    groupsSeen: 모두.length,
    minMembersToList: 최소멤버,
    groupsNotListed: 모두.length - 낼것.length,
    whyNotListed: `이름을 쓸 수 있는 멤버가 ${최소멤버}명에 못 미치는 그룹은 지면을 내지 않는다. 세기는 셌다`,
    whyNoHeight: '키(P2048)는 한국 연예인 9,249명 중 320명(3.5%)에게만 적혀 있다. '
      + '「bts members height」가 자동완성 1번째·10줄로 수요가 컸지만, 3.5%로 답하면 '
      + '틀린 답을 자신 있게 내는 지면이 된다. 그래서 안 만들었다',
    whyNotCurrentMembers: '위키데이터 P527 은 «있었던» 멤버를 담는다. 탈퇴한 사람도 들어 있고 '
      + '우리는 그 둘을 못 가른다. 그래서 「현재 멤버」라고 말하지 않는다',
    slugCollisions: 겹침,
    droppedForSameSlug: 겹쳐서뺀것,
    groups: 낼것,
  };
}

/* ────────────────────────── 자가시험 ────────────────────────── */
function 자가시험() {
  const 시험 = [];
  const T = (이름, 참) => 시험.push([이름, !!참]);

  T('별자리 — 한가운데', 별자리('1993-03-09').slug === 'pisces');
  T('별자리 — 경계 첫날', 별자리('1994-02-19').slug === 'pisces');
  T('별자리 — 경계 끝날', 별자리('1994-03-20').slug === 'pisces');
  /* ⚠ 염소자리는 해를 넘는다. `/star-sign` 열두 장에서와 같은 자리다 */
  T('별자리 — 염소자리가 해를 넘는다(12월)', 별자리('1992-12-25').slug === 'capricorn');
  T('별자리 — 염소자리가 해를 넘는다(1월)', 별자리('1993-01-05').slug === 'capricorn');
  T('별자리 — 못 읽으면 null(0 이 아니다)', 별자리('모름') === null);
  T('별자리 — 빈 값도 null', 별자리(undefined) === null);
  /* 366일을 다 훑어 어느 날도 빠지지 않는지 본다 */
  let 빠진날 = 0;
  for (let m = 1; m <= 12; m += 1) {
    for (let d = 1; d <= 31; d += 1) {
      const s = `2024-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (!Number.isFinite(new Date(s).getTime()) || new Date(s).getUTCMonth() + 1 !== m) continue;
      if (!별자리(s)) 빠진날 += 1;
    }
  }
  T('별자리 — 한 해 어느 날도 빠지지 않는다', 빠진날 === 0);

  T('나이 — 태어난 해로만 센다', 나이('1992-12-04', 2026) === 34);
  T('나이 — 못 읽으면 null', 나이('모름', 2026) === null);

  T('달이름 — 사람이 읽는 꼴', 달이름('1993-03-09') === '9 March');
  T('달이름 — 앞의 0을 안 남긴다', 달이름('1993-03-01') === '1 March');
  T('달이름 — 못 읽으면 null', 달이름('1993-03') === null);

  const 캔것 = {
    그룹: [
      { slug: 'big', name: 'Big', membersRecorded: 4, members: [
        { name: 'A', born: '1992-12-04', birthplace: 'Gwacheon', languages: 54 },
        { name: 'B', born: '1993-03-09', birthplace: null, languages: 55 },
        { name: 'C', born: null, birthplace: 'Busan', languages: 10 },
      ] },
      { slug: 'small', name: 'Small', membersRecorded: 2, members: [
        { name: 'D', born: '1999-01-01', birthplace: null, languages: 1 },
        { name: 'E', born: '2000-01-01', birthplace: null, languages: 1 },
      ] },
    ],
  };
  const out = 짓는다(캔것, 2026);
  T('짓기 — 최소 인원 아래는 안 낸다', out.groups.length === 1 && out.groups[0].slug === 'big');
  T('짓기 — 못 낸 그룹을 «센다»', out.groupsNotListed === 1);
  T('짓기 — 본 그룹 수는 둘 다 센다', out.groupsSeen === 2);
  /* 🔴 이 둘이 BLACKPINK 에서 틀릴 뻔한 자리다 */
  T('짓기 — 적힌 멤버 수를 그대로 담는다', out.groups[0].membersRecorded === 4);
  T('짓기 — 이름 쓸 수 있는 수와 «갈라» 담는다', out.groups[0].membersNamed === 3);
  T('짓기 — 생일 없는 멤버를 «빼지 않고» 나이만 비운다',
    out.groups[0].members.length === 3 && out.groups[0].members.some((m) => m.age === null));
  T('짓기 — 생일 있는 멤버 수를 따로 센다', out.groups[0].membersWithBirthday === 2);
  T('짓기 — 태어난 해 범위를 낸다',
    out.groups[0].oldestBornYear === 1992 && out.groups[0].youngestBornYear === 1993);
  T('짓기 — 태어난 곳 아는 수를 센다', out.groups[0].birthplacesKnown === 2);
  T('짓기 — 기준 해를 손으로 안 적고 담는다', out.refYear === 2026);
  T('짓기 — 키를 왜 «안» 냈는지 적는다', String(out.whyNoHeight).includes('3.5%'));
  T('짓기 — 「현재 멤버」가 아닌 까닭을 적는다', String(out.whyNotCurrentMembers).includes('탈퇴'));
  T('짓기 — 주소가 안 겹친다', out.slugCollisions.length === 0);
  T('짓기 — 생일 이른 사람부터 세운다', out.groups[0].members[0].name === 'A');

  /*
   * 🔴 주소 겹침 — 실제로 걸린 자리다. 위키데이터에 「BB Girls」가 둘 있었다
   * (Q492721 멤버 10명 · Q25542911 4명, 멤버가 겹치니 같은 그룹의 다른 시기).
   * ⛔ 합치지 않는다. 큰 쪽을 남기고 «뺀 쪽을 적는다» — 조용히 사라지게 두지 않는다.
   */
  const 겹친것 = 짓는다({
    그룹: [
      { slug: 'same', name: 'Same', membersRecorded: 3, members: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] },
      { slug: 'same', name: 'Same', membersRecorded: 5, members: [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }, { name: 'e' }] },
    ],
  }, 2026);
  T('겹침 — 한 주소에 한 지면만 남는다', 겹친것.groups.length === 1);
  T('겹침 — 멤버가 «많은» 쪽을 남긴다', 겹친것.groups[0].membersNamed === 5);
  T('겹침 — 뺀 쪽을 «적는다»(조용히 안 지운다)', 겹친것.droppedForSameSlug.length === 1);
  T('겹침 — 뺀 까닭을 적는다', String(겹친것.droppedForSameSlug[0].why).includes('합치지 않았다'));
  T('겹침 — 뺀 쪽 멤버 수도 적는다', 겹친것.droppedForSameSlug[0].droppedMembers === 3);

  const 진 = 시험.filter(([, ok]) => !ok);
  for (const [이름] of 진) console.error(`❌ ${이름}`);
  if (진.length) { console.error(`⛔ build-kcw-groups 자가시험 ${진.length}개 실패`); process.exit(1); }
  console.log(`✅ build-kcw-groups 자가시험 통과 (${시험.length})`);
}

/* ────────────────────────── 실행 ────────────────────────── */
if (process.argv.includes('--자가시험')) {
  자가시험();
} else {
  if (!existsSync(캔길)) {
    console.error(`⛔ 캔 자료가 없다 — ${캔길}. collect-korean-groups.mjs 를 먼저 돌린다`);
    process.exit(1);
  }
  const 캔것 = JSON.parse(readFileSync(캔길, 'utf8'));
  const out = 짓는다(캔것, new Date().getFullYear());
  if (out.slugCollisions.length) {
    console.error('⛔ 주소가 겹치는 그룹이 있다 — 한 지면이 다른 지면을 조용히 덮는다:');
    for (const c of out.slugCollisions) console.error(`   · ${c.slug} — 「${c.a}」와 「${c.b}」`);
    process.exit(1);
  }
  writeFileSync(낼길, `${JSON.stringify(out, null, 1)}\n`);
  console.log(`■ 본 그룹 ${out.groupsSeen}개 중 지면을 내는 곳 ${out.groups.length}개`
    + ` (${최소멤버}명 미만 ${out.groupsNotListed}개는 안 낸다)`);
  console.log(`  기준 해 ${out.refYear} — 나이는 이 해 기준이고 지면에 그렇게 적는다`);
  for (const n of ['BTS', 'Blackpink', 'Stray Kids']) {
    const g = out.groups.find((x) => x.name === n);
    console.log(`  ${n.padEnd(12)} ${g ? `적힌 ${g.membersRecorded}명 · 이름 ${g.membersNamed}명 · 생일 ${g.membersWithBirthday}명` : '⛔ 지면 안 남'}`);
  }
  console.log(`냈다 — ${path.relative(뿌리, 낼길)}`);
}
