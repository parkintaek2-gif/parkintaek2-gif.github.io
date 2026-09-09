/**
 * build-kcw-group-mix.mjs — **한국 그룹 428개를 «남·여·혼성»으로 가른다.** (`/group-mix`)
 *
 * ── 🔴 왜 만들었나 (2026-09-09 10:3x · 5번) ─────────────────────────────────
 * 오늘 성별(P21)을 9,249명 받았다(`fetch-kcw-entertainer-gender.mjs`).
 * 그러니 이제 **그룹을 성별 구성으로 가를 수 있다.** 그 전에는 못 하던 일이다.
 *
 * 그리고 이것은 영어권 독자가 실제로 찾는 물음이다 —
 * 「are there co-ed k-pop groups?」·「mixed gender kpop group」.
 * ⛔ 그런데 그 답을 «세어서» 내는 곳이 없다. 사람들이 이름 몇 개(KARD·AKMU)를 댈 뿐이다.
 * ⭐ 우리는 428개를 다 세서 답한다. 그것이 우리 자리다.
 *
 * ── 🔴 이 지면이 반드시 지키는 것 ──────────────────────────────────────────
 * ```
 * ⛔ 「12개가 혼성이다」로 끝내지 않는다. **12는 «최소치»다** —
 *    128개 그룹에 성별이 안 적힌 멤버가 섞여 있어, 전원남으로 센 것이 실은 혼성일 수 있다.
 *    그 수를 지면에 «함께» 낸다
 * ⛔ 성별이 하나도 안 적힌 그룹 49개는 «세지 않는다». 0 으로도 남성으로도 밀지 않는다
 * ⛔ 「혼성이 드물다」를 «까닭»과 함께 말하지 않는다 — 우리 자료에 까닭이 없다.
 *    업계 관행인지 기록 편향인지 우리는 못 가른다
 * ⛔ 밴드와 아이돌 그룹을 «가르지 않는다». 자우림은 밴드다. 위키데이터는 그 둘을 한 속성으로
 *    묶어 두었고, 우리가 임의로 가르면 그것은 우리 판정이 된다. 그래서 섞인 채로 내고 그렇게 적는다
 * ⛔ 멤버는 «있었던» 사람이다(P527). 탈퇴한 사람도 들어 있고 우리는 그 둘을 못 가른다
 * ⚠ 수를 손으로 적지 않는다. 전부 자료에서 센다
 * ```
 *
 * 쓰는 법
 *   node scripts/build-kcw-group-mix.mjs
 *   node scripts/build-kcw-group-mix.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 그룹길 = path.join(뿌리, 'archive/raw/wikidata/korean-groups.json');
const 성별길 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-gender.json');
const 낼길 = path.join(뿌리, 'src/data/kcw-group-mix.json');

/** ⚠ 시각은 KST. UTC 로 바꾸면 새벽에 하루 어긋난다 */
export function 날꼴(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const 날 = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${날}`;
}

/**
 * 한 그룹을 가른다.
 * @returns {{갈래:'men'|'women'|'coed'|'unknown', 남:number, 여:number, 모름:number, 멤버:number}}
 *
 * ⛔ 성별이 하나도 안 적히면 `unknown` 이다. 「남성 그룹」으로 밀지 않는다.
 * ⛔ 그리고 `모름 > 0` 이면 그 판정은 «흔들릴 수 있는» 것이다. 그 수를 함께 돌려준다.
 */
export function 그룹갈래(멤버들, 성별표) {
  const it = Array.isArray(멤버들) ? 멤버들 : [];
  let 남 = 0; let 여 = 0; let 모름 = 0;
  for (const m of it) {
    const v = 성별표?.[m?.q];
    if (v === '남성') 남 += 1;
    else if (v === '여성') 여 += 1;
    else 모름 += 1;
  }
  let 갈래 = 'unknown';
  if (남 > 0 && 여 > 0) 갈래 = 'coed';
  else if (남 > 0) 갈래 = 'men';
  else if (여 > 0) 갈래 = 'women';
  return { 갈래, 남, 여, 모름, 멤버: it.length };
}

/**
 * 판정이 «뒤집힐 수 있나» — 한쪽 성별만 잡혔는데 모르는 멤버가 남아 있으면 그렇다.
 * ⭐ 이 칸이 지면에서 정직함을 만든다. 「12개」를 「최소 12개」로 바꿔 주는 것이 이것이다.
 */
export function 뒤집힐수있나(r) {
  if (!r) return false;
  return (r.갈래 === 'men' || r.갈래 === 'women') && Number(r.모름) > 0;
}

function 짓기() {
  const g = JSON.parse(fs.readFileSync(그룹길, 'utf8'));
  const 성별표 = JSON.parse(fs.readFileSync(성별길, 'utf8')).사람;

  const 것들 = [];
  for (const x of g.그룹 ?? []) {
    const r = 그룹갈래(x.members, 성별표);
    것들.push({
      name: x.name, slug: x.slug, q: x.q,
      kind: r.갈래, men: r.남, women: r.여, sexNotRecorded: r.모름,
      membersRecorded: x.membersRecorded ?? null, membersNamed: r.멤버,
      couldFlip: 뒤집힐수있나(r),
    });
  }

  const 셈 = { men: 0, women: 0, coed: 0, unknown: 0 };
  for (const x of 것들) 셈[x.kind] += 1;
  const 갈린것 = 셈.men + 셈.women + 셈.coed;
  const 뒤집힐것 = 것들.filter((x) => x.couldFlip).length;

  /* 혼성은 멤버 수가 많은 것부터. ⛔ 「유명한 순」으로 세우지 않는다 — 우리에게 유명도 자료가 없다 */
  const 혼성 = 것들.filter((x) => x.kind === 'coed').sort((a, b) => (b.men + b.women) - (a.men + a.women));

  const 답 = {
    builtOn: 날꼴(),
    source: 'Wikidata (CC0) — P527 group members, P21 sex or gender',
    whatThisIs: `Every one of the ${것들.length} Korean music groups on Wikidata, sorted into all-men, all-women and co-ed by the sex recorded for each member.`,
    whatThisIsNot: [
      'Not a complete count of co-ed groups. It is a floor — see couldFlipCount.',
      'Not a claim about why. Nothing here says whether co-ed groups are rare by industry practice or by how Wikidata is written.',
      'Not idol groups only. Rock bands are in the same Wikidata property and are not separated here.',
      'Not current line-ups. Wikidata lists people who were members; former members are included.',
    ],
    groups: 것들.length,
    classified: 갈린것,
    counts: 셈,
    couldFlipCount: 뒤집힐것,
    coedShareOfClassified: 갈린것 ? Math.round((셈.coed / 갈린것) * 1000) / 10 : null,
    coed: 혼성,
    all: 것들,
  };

  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.writeFileSync(낼길, JSON.stringify(답, null, 1), 'utf8');
  console.log(`✅ ${낼길}`);
  console.log(`   그룹 ${것들.length} · 갈린 것 ${갈린것} — 남 ${셈.men} · 여 ${셈.women} · 혼성 ${셈.coed} · 성별 없음 ${셈.unknown}`);
  console.log(`   ⚠ 판정이 뒤집힐 수 있는 그룹 ${뒤집힐것}개 — 그래서 혼성 ${셈.coed}개는 «최소치»다`);
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (나 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };
  const S = { a: '남성', b: '여성', c: '남성', d: '미확인' };

  검('전원 남성', 그룹갈래([{ q: 'a' }, { q: 'c' }], S).갈래 === 'men');
  검('전원 여성', 그룹갈래([{ q: 'b' }], S).갈래 === 'women');
  검('혼성', 그룹갈래([{ q: 'a' }, { q: 'b' }], S).갈래 === 'coed');
  검('⛔ 성별이 하나도 없으면 unknown — 남성으로 안 밀어넣는다', 그룹갈래([{ q: 'd' }], S).갈래 === 'unknown');
  검('⛔ 멤버가 아예 없어도 unknown', 그룹갈래([], S).갈래 === 'unknown');
  검('⛔ null 도 견딘다', 그룹갈래(null, S).갈래 === 'unknown');
  검('⛔ 성별표가 없어도 견딘다', 그룹갈래([{ q: 'a' }], null).갈래 === 'unknown');
  검('모르는 멤버를 «세어» 돌려준다', 그룹갈래([{ q: 'a' }, { q: 'd' }], S).모름 === 1);
  검('미확인은 남·여 어느 쪽에도 안 들어간다', (() => { const r = 그룹갈래([{ q: 'a' }, { q: 'd' }], S); return r.남 === 1 && r.여 === 0; })());

  검('🔴 한쪽만 잡혔고 모르는 멤버가 있으면 «뒤집힐 수 있다»',
    뒤집힐수있나(그룹갈래([{ q: 'a' }, { q: 'd' }], S)) === true);
  검('⛔ 이미 혼성이면 뒤집힐 것이 없다',
    뒤집힐수있나(그룹갈래([{ q: 'a' }, { q: 'b' }, { q: 'd' }], S)) === false);
  검('⛔ 모르는 멤버가 없으면 뒤집히지 않는다',
    뒤집힐수있나(그룹갈래([{ q: 'a' }], S)) === false);
  검('⛔ unknown 은 뒤집힐 대상이 아니다 (아직 아무 판정도 안 했다)',
    뒤집힐수있나(그룹갈래([{ q: 'd' }], S)) === false);
  검('⛔ null 도 견딘다', 뒤집힐수있나(null) === false);

  검('날꼴 — KST 자정 직후에도 그날', 날꼴(new Date(2026, 8, 9, 0, 30)) === '2026-09-09');
  검('🔴 「12는 최소치다」가 코드에 살아 있다',
    fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').includes('«최소치»다'));
  검('🔴 「밴드와 아이돌을 가르지 않는다」가 코드에 살아 있다',
    fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').includes('밴드와 아이돌 그룹을 «가르지 않는다»'));

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ 그룹 성별 구성 세는 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

if (나) 짓기();
