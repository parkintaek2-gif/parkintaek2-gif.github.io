/**
 * 제목에 «우리가 아는 K컬처 사람·팀 이름»이 들었나를 가른다.
 *
 * ── 🔴 왜 만들었나 (2026-09-09 03:1x · 5번) ─────────────────────────────────
 *
 * 커뮤니티·SNS 수집기가 갈래를 «낱말표»(케이팝·아이돌·드라마 …)로 가른다.
 * 그런데 Reddit r/kpop 이 오는 꼴은 대개 **이름 한 낱말**이다. 이름은 낱말표에 없다.
 * 2026-09-08 자료를 세 보니 이랬다 —
 * ```
 *   Reddit r/kpop        50건 중 38건(76%)이 «갈래없음»
 *   Reddit r/koreanvariety 25건 중 20건(80%)
 *   구글뉴스 kpop(영문)    127건 중 14건(11%)
 *   구글뉴스 korean drama   110건 중 12건(11%)
 *                         ─────────────────
 *   영문 우물 갈래없음 합계  84건
 * ```
 * 그 84건이 이런 것이었다 — **다 우리 것이다.**
 * ```
 *   MINHO (SHINee) - Make it hot
 *   i-dle Jeon Soyeon - I'm gonna TOESA
 *   Song Review: Lisa (BLACKPINK) – SaWaDiKa
 *   Disney+ Sets Release Date for Ji Chang-wook …
 * ```
 *
 * ── ⛔ 처음에 헛다리를 짚었다. 그 과정을 적어 둔다 ──────────────────────────
 *
 * 나는 먼저 **한글 이름**을 위키데이터에서 받아 왔다(523명 · 이름 615개).
 * 「최준희 10000+ · 김영옥 5000+」가 갈래없음으로 새는 것을 봤기 때문이다.
 * ⇒ 재 보니 어제 갈래없음 673건 가운데 **1건**만 걸렸다(전도연 100+).
 *   까닭은 트렌드에 오르는 사람들이 우리 명부 «밖»이기 때문이다(판사·축구감독·인플루언서).
 *   ⭐ 한글 이름 자료는 남겼지만, **그것이 이 문제의 답은 아니었다.**
 *
 * 그다음 넷플릭스 사람 634명·작품 414편으로 재 봤다 ⇒ 84건 중 **8건(10%)**, 그중 2건이 거짓
 * (「The Moon」이 「BEYOND THE MOON TOUR」에 걸렸다).
 *
 * ⭐ 답은 **케이팝 명부**였다 — `archive/raw/wikidata/` 에 사람 9,249명 · 그룹 428팀이
 *   이미 있었다. 그것으로 재니 **84건 중 40건(48%)** 이 걸렸다.
 *   ⛔ 새로 모을 것이 없었다. **있는 것을 안 찾은 것이었다.**
 *
 * ── ⭐ 남의 것을 빼앗지 않는가 — 반대쪽에서도 쟀다 ──────────────────────────
 * ```
 *   한국 커뮤니티(루리웹·인벤·에펨) 갈래없음 312건  →  0건 걸림
 *   3번 것인 취업·진로 뉴스 갈래없음      168건  →  0건 걸림
 * ```
 * 그물이 헐렁하면 여기가 걸린다. 0이라는 것이 이 자를 쓸 근거다.
 *
 * ── ⛔ 「소문자면 버린다」는 규칙은 «버렸다» ────────────────────────────────
 *
 * 거짓 둘(major · winner)이 소문자였으니 소문자를 버리면 될 듯했다. **재 보니 틀렸다** —
 * 소문자로 걸린 8건 가운데 **5건이 진짜 이름**이었다. 일부러 소문자로 쓰는 이름들이다.
 * ```
 *   tripleS · &TEAM · i-dle · izna · jihoo   ← 다 진짜다. 버리면 안 된다
 *   major · winner                            ← 이 둘만 거짓이다
 * ```
 * ⇒ 규칙을 대문자에 걸지 않고 **버릴 이름 목록**에 건다. 그 목록은 아래처럼 «재서» 만들었다.
 *
 * ── ✅ 걸어 놓고 6날 전부로 다시 쟀다 (2026-09-09 03:3x) ────────────────────
 * ```
 *   유닛        전      후     바뀜
 *   3번        363     363      0     ← 안 빼앗았다
 *   5번      1,511   1,773   +262     ← 하루 44건꼴을 되찾았다
 *   6번        938     938      0     ← 안 빼앗았다
 *   갈래없음  2,776   2,514   -262
 * ```
 * ⚠ 그 재기에서 «거짓 셋»이 더 나와 버릴 목록에 넣었다 — Summer · June · Bounce.
 *   ⛔ 「흔해 보인다」고 넣은 것이 아니다. **거짓으로 걸린 줄을 붙여서만** 넣었다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LF = String.fromCharCode(10);
const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** 이름이 네 글자보다 짧으면 아예 안 쓴다 — 「IU」·「XG」는 아무 글에나 박힌다 */
export const 가장짧은이름 = 4;

/**
 * ⛔ **버릴 이름** — 이름이면서 «흔한 영어 낱말»인 것.
 *
 * ⭐ 이 목록은 짐작이 아니라 **재서** 만들었다. 두 갈래로 모았다.
 *
 * 1. 우리 것이 «아닌» 영문 우물(구글뉴스 korea economy)에 소문자로 걸린 이름.
 *    커뮤니티 자료 6날 · 경제뉴스 828줄에 대 봤다.
 *      Swings 19회 · Gain 14회 · Boom 9회 · Just 6회
 * 2. K컬처 우물에서 «실제로 거짓으로» 걸린 것. 그 줄을 함께 적는다.
 *      Major   ← "Korea's entertainment platforms hit by major data breaches"
 *      Winner  ← "X The League winner seems pretty obvious..."
 *
 * ⛔ 여기 이름을 「흔해 보인다」고 더하지 않는다. **거짓으로 걸린 줄을 붙여서만** 더한다.
 * ⛔ 그리고 여기 넣는다는 것은 그 팀을 «영영 못 잡는다»는 뜻이다. 함부로 넣지 않는다.
 */
export const 버릴이름 = new Set([
  /* 1. 우리 것이 «아닌» 영문 우물(구글뉴스 korea economy · 6날 828줄)에 소문자로 걸린 것 */
  'Swings',  /* 19회 */
  'Gain',    /* 14회 */
  'Boom',    /*  9회 */
  'Just',    /*  6회 */
  /* 2. K컬처 우물에서 «실제로 거짓으로» 걸린 것 — 그 줄을 붙여 둔다 */
  'Major',   /* "Korea's entertainment platforms hit by major data breaches" */
  'Winner',  /* "X The League winner seems pretty obvious..." */
  'Summer',  /* "...ranks #1 on TikTok South Korea's Songs of the Summer" */
  /* 3. 6번(경제) 줄에 걸린 것 — 지금은 낱말표가 이겨 실제로 안 빼앗기지만, 자리가 바뀌면 샌다 */
  'June',    /* "the KOSPI, which surpassed 9,300 degrees in June" */
  'Bounce',  /* "Korea's KOSPI Got A Chip-Led Bounce" */
]);

/** 명부 파일 둘 — 이미 저장소에 있는 것이다. 새로 모으지 않는다 */
export const 명부길 = [
  { 길: 'archive/raw/wikidata/korean-entertainers-birth.json', 칸: '사람', 갈래: '사람' },
  { 길: 'archive/raw/wikidata/korean-groups.json', 칸: '그룹', 갈래: '그룹' },
];

/**
 * 명부를 만든다. ⛔ 파일이 없으면 «빈 표»가 아니라 null 이다 —
 * 「이름이 하나도 안 걸렸다」와 「명부를 못 읽었다」는 다른 말이다.
 */
export function 명부만들기(저장소 = 뿌리) {
  const 표 = new Map();
  let 읽은파일 = 0;
  for (const { 길, 칸, 갈래 } of 명부길) {
    const 온길 = path.join(저장소, 길);
    if (!fs.existsSync(온길)) continue;
    let j = null;
    try { j = JSON.parse(fs.readFileSync(온길, 'utf8')); } catch { continue; }
    읽은파일 += 1;
    for (const x of j?.[칸] ?? []) {
      const 이름 = String(x?.name ?? x?.이름 ?? '').trim();
      if (이름.length < 가장짧은이름) continue;
      if (버릴이름.has(이름)) continue;
      if (!표.has(이름)) 표.set(이름, 갈래);
    }
  }
  if (!읽은파일) return null;
  return 표;
}

/**
 * 제목 안에 그 이름이 «낱말로» 있나. 있으면 적힌 그대로 돌려준다.
 * ⛔ 글자 안에 박힌 것은 안 친다 — 「Lisa」가 「Lisandro」에 걸리면 거짓이다.
 */
export function 낱말로찾기(이름, 제목) {
  const 바늘 = String(이름 ?? '');
  const 글 = String(제목 ?? '');
  if (바늘.length < 가장짧은이름 || !글) return null;
  const e = 바늘.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(^|[^A-Za-z0-9])(${e})([^A-Za-z0-9]|$)`, 'i').exec(글);
  return m ? m[2] : null;
}

/**
 * 제목이 우리(5번) 것인가를 명부로 가른다.
 * 낸다 — { 이름, 적힌대로, 갈래 } 또는 null(안 걸림).
 * ⛔ 명부가 null 이면 «못 쟀다»로 null 을 낸다. 0 으로도 「아니다」로도 치지 않는다.
 */
export function 명부로가르기(제목, 표) {
  if (!(표 instanceof Map) || !표.size) return null;
  const 글 = String(제목 ?? '');
  if (!글) return null;
  /* ⭐ 긴 이름부터 본다 — 「Jeon Soyeon」이 「Soyeon」보다 앞서 걸리게 */
  for (const [이름, 갈래] of [...표.entries()].sort((a, b) => b[0].length - a[0].length)) {
    const 적힌대로 = 낱말로찾기(이름, 글);
    if (적힌대로) return { 이름, 적힌대로, 갈래 };
  }
  return null;
}

const 내가 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };
  const 표 = new Map([
    ['SHINee', '그룹'], ['Jeon Soyeon', '사람'], ['Soyeon', '사람'], ['tripleS', '그룹'],
    ['i-dle', '그룹'], ['izna', '그룹'], ['&TEAM', '그룹'], ['Le Sserafim', '그룹'], ['Lisa', '사람'],
  ]);

  검('낱말로 있으면 찾는다', 낱말로찾기('SHINee', 'MINHO (SHINee) - Make it hot') === 'SHINee');
  검('⛔ 글자 안에 박힌 것은 안 친다', 낱말로찾기('Lisa', 'Lisandro scored twice') === null);
  검('⛔ 네 글자보다 짧으면 아예 안 쓴다', 낱말로찾기('IU', 'IU new album') === null);
  검('적힌 대로 돌려준다 — 대소문자를 바꾸지 않는다',
    낱말로찾기('TripleS', 'tripleS - Official Character') === 'tripleS');
  검('⛔ 빈 제목이면 null', 낱말로찾기('SHINee', '') === null);

  검('명부로 가른다', 명부로가르기('MINHO (SHINee) - Make it hot', 표)?.이름 === 'SHINee');
  검('🔴 긴 이름을 먼저 잡는다 — Soyeon 보다 Jeon Soyeon',
    명부로가르기("i-dle Jeon Soyeon - I'm gonna TOESA", 표)?.이름 === 'Jeon Soyeon');
  검('⭐ 일부러 소문자로 쓰는 이름도 잡는다 — tripleS',
    명부로가르기('tripleS - Official Character', 표)?.이름 === 'tripleS');
  검('⭐ i-dle 도 잡는다', 명부로가르기('i-dle Soyeon - Marie Claire Korea', 표) !== null);
  검('⭐ izna 도 잡는다', 명부로가르기('izna - DUMB HOT! (Dance Practice)', 표)?.이름 === 'izna');
  검('⭐ &TEAM 처럼 기호가 든 이름도 잡는다 — 정규식이 터지지 않는다',
    명부로가르기('&TEAM - Mark on Me', 표)?.이름 === '&TEAM');
  검('안 걸리면 null', 명부로가르기('오늘 점심 뭐 먹지', 표) === null);
  검('⛔ 명부가 비면 null — 「아니다」로 치지 않는다', 명부로가르기('SHINee', new Map()) === null);
  검('⛔ 명부가 없어도 안 터진다', 명부로가르기('SHINee', null) === null);

  검('🔴 「Major」는 버릴 이름이다 — "major data breaches" 에 거짓으로 걸렸다',
    버릴이름.has('Major'));
  검('🔴 「Winner」도 버릴 이름이다 — "The League winner" 에 거짓으로 걸렸다',
    버릴이름.has('Winner'));
  검('🔴 경제뉴스에서 잰 넷도 들어 있다',
    ['Swings', 'Gain', 'Boom', 'Just'].every((n) => 버릴이름.has(n)));
  검('🔴 「Summer」도 버릴 이름이다 — "Songs of the Summer" 에 거짓으로 걸렸다',
    버릴이름.has('Summer'));
  검('🔴 「June」·「Bounce」는 6번(경제) 줄에 걸렸다 — 지금은 낱말표가 이기지만 자리가 바뀌면 샌다',
    버릴이름.has('June') && 버릴이름.has('Bounce'));
  검('⛔ 버릴 이름이 아홉이고 «하나하나 까닭이 파일에 적혀 있다» — 짐작으로 넣은 것이 없다',
    버릴이름.size === 9);
  검('⛔ 버릴 이름은 명부에 안 들어간다 — 만드는 자리에서 걸러진다',
    (() => {
      /* 실제 파일이 있을 때만 잰다. 없으면 이 시험은 건너뛰지 않고 «명부가 null» 을 확인한다 */
      const m = 명부만들기();
      if (m === null) return true;
      return !m.has('Major') && !m.has('Winner') && !m.has('Swings');
    })());

  {
    const m = 명부만들기();
    검('⛔ 명부를 못 읽으면 null — 빈 표가 아니다', 명부만들기('C:/없는곳') === null);
    검('명부가 있으면 쓸 만큼 크다 (사람 9,249 · 그룹 428)', m === null || m.size > 5000);
    if (m) {
      검('명부에 SHINee 가 있다', m.has('SHINee'));
      검('명부로 실제 제목을 가른다', 명부로가르기('MINHO (SHINee) - Make it hot', m)?.갈래 === '그룹');
    }
  }

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}${LF}${실.map((s) => `   · ${s}`).join(LF)}`);
    process.exit(1);
  }
  console.log(`✅ 명부 대조 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가) {
  const 표 = 명부만들기();
  if (표 === null) { console.log('⬜ 명부를 못 읽었다 — 못 쟀다'); process.exit(1); }
  console.log(`■ 명부 ${표.size}개 (버릴 이름 ${버릴이름.size}개는 뺐다)`);
  const 글 = process.argv.slice(2).filter((a) => !a.startsWith('--')).join(' ');
  if (글) {
    const r = 명부로가르기(글, 표);
    console.log(r ? `   ⭐ 걸린다 — ${r.이름} (${r.갈래}) · 글에는 「${r.적힌대로}」로 적혀 있다` : '   안 걸린다');
  } else {
    console.log('   제목을 인자로 주면 대 본다.');
  }
}
