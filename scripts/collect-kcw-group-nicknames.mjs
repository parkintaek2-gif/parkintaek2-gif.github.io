#!/usr/bin/env node
/**
 * collect-kcw-group-nicknames.mjs — **팬이 실제로 치는 이름을 우리 지면이 쓰는가.**
 *
 * ── 🔴 왜 만드나 (2026-09-05, 실측에서 나왔다) ──────────────
 * 서치콘솔 28일치에 이런 줄이 있었다 —
 * ```
 *   「skz birthday」   노출 4 · 클릭 0 · 순위 **65.5**
 * ```
 * 그런데 우리에겐 `/group/stray-kids` 지면이 있다. 제목까지 맞다 —
 *   「Stray Kids members: birthdays and ages 2026」
 * ⛔ 그 지면에 **「SKZ」라는 낱말이 한 번도 안 나온다.** 재서 확인했다.
 *
 * ⇒ **답은 갖고 있는데 손님이 치는 말을 우리가 안 쓴다.** 그래서 65위다.
 *   이것은 「콘텐트가 없다」가 아니라 «말이 없다»는 문제이고, 고칠 수 있다.
 *
 * ── 무엇을 「팬이 치는 이름」으로 보나 ──────────────────────
 * ⭐ 우리가 지어내지 않는다. **영문 위키백과의 «넘김 주소»(redirect)**를 쓴다 —
 *   누군가 그 이름으로 찾아올 것을 알고 «사람이 직접 만들어 둔» 이름이다.
 *   `/name-spelled` 에서 쓴 것과 같은 자료다. 두 곳에서 다른 자료를 쓰지 않는다.
 *
 * ⛔ 아주 짧은 것(한두 글자)은 뺀다 — 딴 뜻과 부딪힌다.
 * ⛔ 「없는 이름을 지면에 억지로 넣어라」가 아니다. 이 자는 **어디에 구멍이 있나**만 낸다.
 *
 * 쓰는 법
 *   node scripts/collect-kcw-group-nicknames.mjs --자가시험
 *   node scripts/collect-kcw-group-nicknames.mjs [--몇=40]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(__dirname, '..');
const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-group-nicknames.json');

/**
 * 넘김 주소가 «팬이 치는 다른 이름»인가.
 * ⛔ 본이름과 사실상 같은 것(대소문자·띄어쓰기·붙임표만 다른 것)은 «다른 이름»이 아니다.
 */
/**
 * 🔴🔴 [2026-09-05 23:1x] **주장을 자료가 받쳐 주는 데까지 좁혔다.**
 *
 * 처음에는 넘김 주소를 통틀어 「팬이 치는 다른 이름」으로 보려 했다. 재 보니 이런 것이 섞였다 —
 * ```
 *   Who Would Think That Love?   노래 제목
 *   Ahri · Kai'Sa                리그 오브 레전드 캐릭터
 *   Son Ju-yeon · Wong Kahei     멤버 본명
 *   Eyes on Me: The Movie        영화
 * ```
 * ⛔ 걸러 낼수록 규칙이 그 그룹 하나에 맞춰진다. **그러면 발견이 아니라 짜맞추기다.**
 *
 * ⭐ 그래서 «약칭»만 센다. 실측 증거가 가리킨 것도 그것이다 — 「skz birthday」.
 *   약칭은 기계가 딱 가를 수 있다: **대문자·숫자만으로 된 짧은 이름**(SKZ · SVT · TXT · ATZ).
 *   ⛔ 노래 제목도 멤버 본명도 이 꼴이 아니다. 좁히니 시끄러운 것이 «저절로» 빠졌다 —
 *     예외를 하나씩 박아서가 아니다. 그것이 좁힌 것과 짜맞춘 것의 차이다.
 * ⚠ 그 대신 「우리가 놓친 이름」의 수는 작아진다. **작은 참말이 큰 거짓말보다 낫다.**
 */
export function 약칭인가(본이름, 넘김) {
  const 원 = String(넘김 ?? '').trim();
  if (!원) return false;
  /* 대문자·숫자로만 된 2~6자. 「SKZ」·「SVT」·「TXT」·「f(x)」는 아니고 「FX」는 맞다 */
  if (!/^[A-Z0-9][A-Z0-9.&/-]{1,5}$/.test(원)) return false;
  if (/^[0-9]+$/.test(원)) return false;                        /* 숫자만은 이름이 아니다 */
  const 다듬 = (t) => String(t ?? '').toLowerCase().replace(/[\s\-_.()·'&/]/g, '');
  if (다듬(원) === 다듬(본이름)) return false;                    /* 본이름과 사실상 같은 것 */
  return true;
}

export function 다른이름인가(본이름, 넘김, 멤버들 = []) {
  const 다듬 = (s) => String(s ?? '').toLowerCase().replace(/[\s\-_.()·']/g, '');
  const 원 = String(넘김 ?? '').trim();
  const a = 다듬(본이름); const b = 다듬(원);
  if (!b || b === a) return false;
  if (b.length < 3) return false;              /* 두 글자 이하는 딴 뜻과 부딪힌다 */
  if (/^\d+$/.test(b)) return false;           /* 숫자만인 것은 이름이 아니다 */
  if (b.includes('disambiguation')) return false;
  /* 「Stray Kids discography」처럼 «다른 것»을 가리키는 넘김은 이름이 아니다 */
  if (/(discography|filmography|members|songs|albums|tour|videography|awards)$/i.test(원)) return false;
  /**
   * 🔴 [2026-09-05] 첫 판에서 이것들이 「팬이 치는 이름」으로 섞여 나왔다 —
   * ```
   *   Pentagon  → Regular pentagon · Pentagonal symmetry · 5-gon      (도형이다)
   *   Seventeen → Seventeen (Magazine) · 17 (film) · 17 (song)        (잡지·영화·노래다)
   *   Now United→ All Day (Now United song) · Paraná (song)           (노래다)
   *   WJSN      → Son Ju-yeon · Eunseo (Singer) · List of WJSN …      (멤버·목록이다)
   * ```
   * ⛔ **이름이 같은 딴 것을 「별명」으로 세면 발견이 통째로 거짓이 된다.**
   *   그대로 냈으면 「263개 그룹에 이름 수천 개가 빠졌다」는 큰 수가 나왔을 것이고, 다 헛것이다.
   * ⭐ 그래서 셋을 더 조인다 — ① 괄호 안이 노래·앨범·영화·잡지 따위인 것 ② 「List of …」
   *   ③ 멤버 이름. 남는 것만 «그 그룹을 가리키는 다른 이름»이다.
   */
  if (/^list of /i.test(원)) return false;
  /* ⚠ 그 낱말은 괄호 «끝»에 오는 것이 더 흔하다 — 「All Day (Now United song)」.
     처음엔 괄호 «맨 앞»만 봐서 그것을 놓쳤고, 자가시험이 잡았다. 어느 자리든 본다. */
  if (/\([^)]*\b(song|album|ep|single|film|magazine|band|musical group|group|tv series|manga|novel|book|company|video game|shape|geometry|singer|rapper|actor|actress)\b[^)]*\)/i.test(원)) return false;
  if (/(pentagonal|polygon|symmetry|-gon\b|lateral)/i.test(원)) return false;   /* 도형 낱말 */
  for (const m of 멤버들) if (다듬(m) && 다듬(m) === b) return false;            /* 멤버 이름은 그룹 별명이 아니다 */
  return true;
}

/** 그 이름이 지면 글에 «낱말로» 들어 있나. ⛔ 부분일치로 세지 않는다 */
export function 지면에있나(글, 이름) {
  const s = String(글 ?? '').toLowerCase();
  const n = String(이름 ?? '').trim().toLowerCase();
  if (!n) return false;
  /* 낱말 경계로 본다 — 「skz」가 「skzoo」에 걸려 「있다」로 세면 안 된다 */
  const 벗김 = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${벗김}([^a-z0-9]|$)`).test(s);
}

/**
 * 🔴 그 이름의 문서가 «정말 그 그룹»인가부터 본다.
 *   Pentagon 을 그냥 물으면 위키백과는 «도형» 문서를 준다. 그 넘김들을 별명으로 세면 다 헛것이다.
 */
/**
 * 위키백과가 준 «한 줄 설명»이 그룹을 가리키나. ⛔ 그물이 아니라 여기가 도형·잡지를 막는 자리다.
 * 🔴 처음엔 「Regular pentagon」 같은 넘김을 «별명 판정»에서 걸러 내려 했는데, 그것은 잘못된 자리였다.
 *   Pentagon 넘김이 도형인 까닭은 «우리가 도형 문서에 물었기» 때문이다. 물음을 고쳐야지
 *   답을 걸러 낼 일이 아니다. 자가시험이 그것을 잡아 줬다.
 */
export function 그룹설명인가(설명) {
  const s = String(설명 ?? '').toLowerCase();
  if (!s) return false;
  return /(band|group|duo|trio|girl|boy)/.test(s);
}

async function 그룹문서찾기(이름) {
  const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(이름.replace(/ /g, '_')),
    { headers: { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' } });
  if (!r.ok) return null;
  const j = await r.json();
  const 설명 = String(j.description ?? '').toLowerCase();
  return { title: j.title, 설명: j.description, 그룹인가: 그룹설명인가(j.description) };
}

async function 넘김받기(제목) {
  const u = 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=redirects'
    + `&rdlimit=max&rdnamespace=0&titles=${encodeURIComponent(제목)}&redirects=1`;
  const r = await fetch(u, { headers: { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' } });
  if (!r.ok) return null;
  const j = await r.json();
  const 쪽들 = j?.query?.pages ?? {};
  for (const k of Object.keys(쪽들)) {
    if (k === '-1') return null;
    return (쪽들[k].redirects ?? []).map((x) => x.title);
  }
  return null;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실 = []; let 통 = 0;
  const 같나 = (이름, 본, 기대) => {
    const a = JSON.stringify(본); const b = JSON.stringify(기대);
    if (a === b) 통 += 1; else 실.push(`${이름}: ${a} ≠ ${b}`);
  };

  /* 🔴 이 자가 생긴 그 사례 */
  같나('SKZ 는 Stray Kids 의 다른 이름이다', 다른이름인가('Stray Kids', 'SKZ'), true);
  같나('⛔ 띄어쓰기만 다른 것은 다른 이름이 아니다', 다른이름인가('Stray Kids', 'StrayKids'), false);
  같나('⛔ 대소문자만 다른 것도 아니다', 다른이름인가('Stray Kids', 'stray kids'), false);
  같나('⛔ 붙임표만 다른 것도 아니다', 다른이름인가('Girls Generation', "Girls' Generation"), false);
  같나('⛔ 두 글자는 안 센다', 다른이름인가('Exo', 'EX'), false);
  같나('⛔ 숫자만인 것은 이름이 아니다', 다른이름인가('Twice', '2026'), false);
  같나('⛔ 음반 목록은 이름이 아니다', 다른이름인가('Stray Kids', 'Stray Kids discography'), false);
  같나('⛔ 멤버 목록도 이름이 아니다', 다른이름인가('Twice', 'Twice members'), false);
  같나('세 글자 이상 딴 이름은 센다', 다른이름인가('Seventeen', 'SVT'), true);
  /* 🔴 [2026-09-05] 첫 판에서 «이름이 같은 딴 것»이 별명으로 섞여 나왔다. 그 사례들을 굳힌다 */
  /* ⭐ 도형은 «별명 판정»이 아니라 «문서가 그룹인가»에서 막는다 — 자가시험이 자리를 바로잡아 줬다 */
  같나('⛔ 도형 문서는 그룹이 아니다', 그룹설명인가('shape with five sides'), false);
  같나('⛔ 잡지 문서도 그룹이 아니다', 그룹설명인가('American magazine'), false);
  같나('✅ 보이밴드 설명은 그룹이다', 그룹설명인가('South Korean boy band'), true);
  같나('✅ 걸그룹 설명도 그룹이다', 그룹설명인가('South Korean girl group'), true);
  같나('⛔ 설명이 비면 그룹이 아니다', 그룹설명인가(''), false);
  같나('⛔ 괄호 안이 잡지면 아니다', 다른이름인가('Seventeen', 'Seventeen (Magazine)'), false);
  같나('⛔ 괄호 안이 노래면 아니다', 다른이름인가('Now United', 'All Day (Now United song)'), false);
  같나('⛔ 괄호 안이 영화면 아니다', 다른이름인가('Seventeen', '17 (film)'), false);
  같나('⛔ List of ... 는 아니다', 다른이름인가('WJSN', 'List of WJSN concert tours'), false);
  같나('⛔ 멤버 이름은 그룹 별명이 아니다', 다른이름인가('WJSN', 'Son Ju-yeon', ['Son Ju-yeon','Eunseo']), false);
  같나('⭐ 조여도 진짜 별명은 살아남는다', 다른이름인가('Stray Kids', 'SKZ', ['Bang Chan','Felix']), true);

  같나('지면에 낱말로 있으면 있다', 지면에있나('The SKZ members are ...', 'SKZ'), true);
  같나('대소문자를 안 가린다', 지면에있나('the skz members', 'SKZ'), true);
  /* 🔴 부분일치로 세면 「있다」가 거짓이 된다 */
  같나('⛔ SKZOO 안의 skz 를 「있다」로 세지 않는다', 지면에있나('SKZOO plush toys', 'SKZ'), false);
  같나('⛔ 없으면 없다', 지면에있나('Stray Kids members: birthdays', 'SKZ'), false);
  같나('빈 이름은 없다로 둔다', 지면에있나('아무 글', ''), false);
  같나('정규식 글자가 든 이름도 안 터진다', 지면에있나('f(x) members', 'f(x)'), true);

  /* 🔴 [2026-09-05 23:1x] 주장을 «약칭»으로 좁혔다. 그 경계를 시험으로 굳힌다 */
  같나('SKZ 는 약칭이다', 약칭인가('Stray Kids','SKZ'), true);
  같나('SVT 도 약칭이다', 약칭인가('Seventeen','SVT'), true);
  같나('⛔ 노래 제목은 약칭이 아니다', 약칭인가('Now United','Who Would Think That Love?'), false);
  같나('⛔ 멤버 본명은 약칭이 아니다', 약칭인가('WJSN','Son Ju-yeon'), false);
  같나('⛔ 게임 캐릭터도 약칭이 아니다', 약칭인가('K/DA','Ahri'), false);
  같나('⛔ 한 글자는 안 센다', 약칭인가('Exo','X'), false);
  같나('⛔ 일곱 자는 약칭으로 안 본다', 약칭인가('Twice','ABCDEFG'), false);
  같나('⛔ 숫자만은 이름이 아니다', 약칭인가('Twice','2026'), false);
  같나('⛔ 본이름과 사실상 같은 것은 약칭이 아니다', 약칭인가('EXO','EXO'), false);
  같나('⭐ 좁혔더니 시끄러운 것이 저절로 빠진다 — 영화 제목', 약칭인가('Iz*One','Eyes on Me: The Movie'), false);

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 그룹 별명 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

/* ── 실제로 잰다 ─────────────────────────────────────────────── */
if (내가실행됐다) {
  const 몇 = Number((process.argv.find((a) => a.startsWith('--몇='))?.split('=')[1]) ?? 0) || 0;
  const 그룹자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-groups.json'), 'utf8'));
  let 그룹들 = 그룹자료.groups ?? [];
  if (몇) 그룹들 = 그룹들.slice(0, 몇);

  /**
   * 🔴 [2026-09-05] 처음엔 `dist/` 의 지은 지면을 읽었다. 그런데 여섯 자리가 같은 작업트리를
   *   쓰다 보니 **다른 유닛의 빌드가 dist 를 씻어** 세 번 연속 「지면이 없다」가 나왔다.
   * ⭐ 그래서 «원본»에서 잰다. 그 지면의 글은 결국 **틀(`[group].astro`) + 그 그룹의 자료 한 줄**로
   *   만들어지므로, 둘을 이어 붙이면 지면에 무슨 낱말이 나가는지 그대로 알 수 있다.
   *   ⛔ 빌드 경쟁을 안 타고, 「지어진 것」이 아니라 「짓는 근거」를 보므로 더 정확하다.
   */
  const 틀길 = path.join(뿌리, 'src/pages/wikitip/group/[group].astro');
  const 틀 = fs.existsSync(틀길) ? fs.readFileSync(틀길, 'utf8') : '';
  if (!틀) { console.error('⛔ 그룹 지면 틀을 못 찾았다 — 못 쟀다'); process.exit(1); }

  const 줄들 = []; const 못잰것 = [];
  for (const g of 그룹들) {
    /* 지면에 실제로 나가는 낱말 = 틀의 글 + 그 그룹 자료(이름·멤버 이름 들) */
    const 글 = 틀 + ' ' + JSON.stringify(g);

    /* 🔴 먼저 «그 이름의 문서가 정말 그 그룹인지» 본다 — Pentagon 은 도형 문서로 간다 */
    let 문서 = null;
    try { 문서 = await 그룹문서찾기(g.name); } catch { 문서 = null; }
    if (!문서) { 못잰것.push(`${g.name} — 영문 위키백과 문서를 못 찾았다`); continue; }
    if (!문서.그룹인가) { 못잰것.push(`${g.name} — 그 이름의 문서가 그룹이 아니다: 「${문서.설명}」`); continue; }

    let 넘김 = null;
    try { 넘김 = await 넘김받기(문서.title); } catch { 넘김 = null; }
    if (넘김 === null) { 못잰것.push(`${g.name} — 위키백과에서 넘김을 못 받았다`); continue; }

    /* ⭐ «약칭»만 센다 — 좁힌 까닭은 위 `약칭인가` 주석에 있다 */
    const 다른이름들 = 넘김.filter((x) => 약칭인가(문서.title, x));
    const 빠진것 = 다른이름들.filter((x) => !지면에있나(글, x));
    줄들.push({
      slug: g.slug, name: g.name,
      aliases: 다른이름들.length, missing: 빠진것.length,
      missingNames: 빠진것.slice(0, 8),
      members: g.membersNamed ?? null,
    });
  }

  줄들.sort((a, b) => b.missing - a.missing || b.aliases - a.aliases);
  const 잰것 = 줄들.length;
  const 별명있는것 = 줄들.filter((r) => r.aliases > 0);
  const 하나라도빠진것 = 줄들.filter((r) => r.missing > 0);
  const 별명총수 = 줄들.reduce((s, r) => s + r.aliases, 0);
  const 빠진총수 = 줄들.reduce((s, r) => s + r.missing, 0);

  const 낼것 = {
    measuredAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    source: 'English Wikipedia redirects (MediaWiki API, prop=redirects, namespace 0) — names readers '
      + 'actually type, created by people who expected someone to arrive that way',
    measures: 'For each group page we publish, how many of those alternative names appear anywhere on '
      + 'the page, counted as whole words',
    groupsChecked: 잰것,
    groupsWithAliases: 별명있는것.length,
    groupsMissingAtLeastOne: 하나라도빠진것.length,
    aliasesTotal: 별명총수,
    aliasesMissing: 빠진총수,
    notMeasured: [
      'How often anyone searches each alternative name. Search Console shows us a few, not all of them',
      'Whether adding a name would raise our ranking. That is a claim about Google we cannot test from here',
      'Names people use that nobody has made a Wikipedia redirect for. Those are invisible to this count',
    ],
    unmeasured: 못잰것,
    rows: 줄들,
  };
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2) + '\n', 'utf8');
  console.log(`📁 적었다 — ${path.relative(뿌리, 낼곳)}`);
  console.log(`   잰 그룹 ${잰것} · 다른 이름이 있는 그룹 ${별명있는것.length} · 하나라도 빠진 그룹 ${하나라도빠진것.length}`);
  console.log(`   다른 이름 ${별명총수}개 중 지면에 없는 것 ${빠진총수}개`);
  for (const r of 줄들.slice(0, 8)) console.log(`   · ${r.name.padEnd(22)} 이름 ${r.aliases} · 빠짐 ${r.missing} — ${r.missingNames.join(', ')}`);
  if (못잰것.length) console.log(`   ⬜ 못 잰 것 ${못잰것.length}건`);
}
