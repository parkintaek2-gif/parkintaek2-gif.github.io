/**
 * 우리가 추적하는 사람 634명의 «한글 이름»을 위키데이터에서 받아 온다.
 *
 * 🔴 [2026-09-09 02:4x · 5번] **왜 필요한가 — 이슈 판정이 한글 이름을 못 알아본다.**
 *
 * 커뮤니티·SNS 수집기(`collect-community-desk.mjs`)는 «낱말표»로 갈래를 가른다.
 * 그런데 구글 트렌드에서 오는 것은 대개 «사람 이름 한 낱말»이다. 이름은 낱말표에 없다.
 * 2026-09-08 자료를 세 보니 이랬다 —
 * ```
 *   갈래없음 673건 · 그중 구글 트렌드 31건
 *   그 31건 가운데 «한글 두~다섯 글자» 제목이 20건
 *     최준희 10000+ · 김영옥 5000+ · 박항서 1000+ · 엄태웅 1000+ · 전도연 100+ …
 * ```
 * ⇒ 하루에 가장 많이 검색되는 사람 이름들이 통째로 «갈래없음»으로 샌다.
 *   그러면 「이슈+롱테일 4편」의 씨앗이 눈앞에 있는데도 안 보인다.
 *
 * ⛔ **까닭은 우리 자료에 한글 이름이 «한 개도» 없다는 것이다.**
 *   `wikitip-people.json` 634명 전부가 로마자 표기뿐이다(Lee You-mi …).
 *   위키데이터에는 한글 라벨(`labels.ko`)과 딴이름(`aliases.ko`)이 있다. 받아 오면 된다.
 *
 * ⭐ 그리고 이 자료는 이름을 «잇는 데»만 쓴다 — 지면에 한국어를 내지 않는다
 *   (사장님 「우리 손님은 영어권이다」). 화면에 나가는 것은 그대로 로마자다.
 *
 * 쓰는 법
 * ```
 * node scripts/collect-kcw-korean-names.mjs --적는다
 * node scripts/collect-kcw-korean-names.mjs --자가시험
 * ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LF = String.fromCharCode(10);
const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 사람길 = 'src/data/wikitip-people.json';
/**
 * ⛔ **src/data/ 에 두지 않는다.** 그 폴더는 «지면이 읽는 자료»만 두는 자리다 —
 *   표 약속 검사가 「세어 놓고 아무 지면도 안 읽는 자료」로 잡는다(2026-09-09 에 실제로 잡혔다).
 *   이 자료는 지면에 안 나간다(화면에 한국어를 내지 않는다). 그러니 아카이브가 제자리다.
 */
export const 낼길 = 'archive/raw/wikidata/korean-entertainers-ko-names.json';
const 한번에 = 50;   /* wbgetentities 가 한 번에 받는 최대 */

/** 잰 수인지 밝힌다 — Number(null)===0 이 「못 쟀다」를 0 으로 바꾸지 못하게 */
export function 잰수인가(v) { return typeof v === 'number' && Number.isFinite(v); }

/** 한글 이름꼴인가. ⛔ 로마자·숫자가 섞이면 아니다 */
export function 한글이름인가(s) {
  const t = String(s ?? '').trim();
  if (!t) return false;
  return /^[가-힣]{2,6}$/.test(t);
}

/**
 * 한 사람의 위키데이터 뭉치에서 한글 이름들을 뽑는다.
 * ⛔ 라벨이 없으면 «빈 배열»이 아니라 null 이다 — 「이름이 없다」와 「못 받았다」를 가른다.
 */
export function 한글이름뽑기(뭉치) {
  if (!뭉치 || typeof 뭉치 !== 'object') return null;
  const 낸다 = [];
  const 라벨 = 뭉치.labels?.ko?.value;
  if (한글이름인가(라벨)) 낸다.push(String(라벨).trim());
  for (const a of 뭉치.aliases?.ko ?? []) {
    const v = String(a?.value ?? '').trim();
    if (한글이름인가(v) && !낸다.includes(v)) 낸다.push(v);
  }
  return 낸다;
}

/** QID 들을 50개씩 자른다 */
export function 묶기(것들, 크기 = 한번에) {
  const 낸다 = [];
  for (let i = 0; i < (것들 ?? []).length; i += 크기) 낸다.push(것들.slice(i, i + 크기));
  return 낸다;
}

/**
 * 이름 → 사람 표를 만든다. ⛔ 한 이름에 두 사람이 걸리면 «버린다» —
 * 잘못 이어 붙이는 것이 안 잇는 것보다 나쁘다(같은 이름의 딴 사람을 우리 사람으로 셀 수 있다).
 */
export function 이름표만들기(사람들) {
  const 셈 = new Map();
  for (const p of 사람들 ?? []) {
    for (const 이름 of p.한글이름 ?? []) {
      if (!셈.has(이름)) 셈.set(이름, []);
      셈.get(이름).push(p.slug);
    }
  }
  const 표 = {}; const 겹친것 = [];
  for (const [이름, 슬러그들] of 셈) {
    const 낱 = [...new Set(슬러그들)];
    if (낱.length === 1) 표[이름] = 낱[0];
    else 겹친것.push({ 이름, 슬러그들: 낱 });
  }
  return { 표, 겹친것 };
}

async function 받기(qids) {
  const 주소 = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels|aliases'
    + `&languages=ko&ids=${qids.join('|')}`;
  const r = await fetch(주소, { headers: { 'User-Agent': 'KCultureWire/1.0 (data journalism; u5@klifedesign.net)' } });
  if (!r.ok) throw new Error(`위키데이터 ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(String(j.error.info ?? ' 알 수 없는 오류').slice(0, 120));
  return j.entities ?? {};
}

const 내가 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('한글 이름을 알아본다', 한글이름인가('최준희') === true);
  검('⛔ 로마자는 아니다', 한글이름인가('Lee You-mi') === false);
  검('⛔ 섞인 것도 아니다', 한글이름인가('아이유 IU') === false);
  검('⛔ 한 글자는 안 받는다 — 아무 글에나 박힌다', 한글이름인가('김') === false);
  검('⛔ 일곱 글자는 안 받는다', 한글이름인가('가나다라마바사') === false);
  검('⛔ 빈 것은 아니다', 한글이름인가('') === false && 한글이름인가(null) === false);

  검('라벨을 뽑는다', (한글이름뽑기({ labels: { ko: { value: '전도연' } } }) ?? [])[0] === '전도연');
  검('딴이름도 뽑는다',
    (한글이름뽑기({ labels: { ko: { value: '아이유' } }, aliases: { ko: [{ value: '이지은' }] } }) ?? []).length === 2);
  검('⛔ 같은 이름을 두 번 넣지 않는다',
    (한글이름뽑기({ labels: { ko: { value: '아이유' } }, aliases: { ko: [{ value: '아이유' }] } }) ?? []).length === 1);
  검('⛔ 로마자 딴이름은 버린다',
    (한글이름뽑기({ labels: { ko: { value: '아이유' } }, aliases: { ko: [{ value: 'IU' }] } }) ?? []).length === 1);
  검('⛔ 이름이 없으면 빈 배열 — 터지지 않는다', (한글이름뽑기({}) ?? []).length === 0);
  검('⛔ 뭉치가 없으면 null — 「이름 없음」과 가른다', 한글이름뽑기(null) === null);

  검('50개씩 묶는다', 묶기(Array.from({ length: 634 }, (_, i) => i)).length === 13);
  검('마지막 묶음이 나머지다', 묶기(Array.from({ length: 634 }, (_, i) => i)).at(-1).length === 34);
  검('⛔ 빈 것을 묶으면 빈 것', 묶기([]).length === 0);
  검('⛔ 없는 것을 묶어도 안 터진다', 묶기(null).length === 0);

  {
    const { 표, 겹친것 } = 이름표만들기([
      { slug: 'a', 한글이름: ['전도연'] },
      { slug: 'b', 한글이름: ['김영옥', '김영옥이'] },
    ]);
    검('이름표를 만든다', 표['전도연'] === 'a' && 표['김영옥'] === 'b');
    검('한 사람의 딴이름도 다 담는다', 표['김영옥이'] === 'b');
    검('겹친 것 없으면 빈 목록', 겹친것.length === 0);
  }
  {
    const { 표, 겹친것 } = 이름표만들기([
      { slug: 'a', 한글이름: ['이상우'] },
      { slug: 'b', 한글이름: ['이상우'] },
    ]);
    검('🔴 한 이름에 두 사람이면 «버린다» — 잘못 잇는 것이 안 잇는 것보다 나쁘다',
      표['이상우'] === undefined);
    검('버린 것을 이름으로 밝힌다', 겹친것.length === 1 && 겹친것[0].이름 === '이상우');
  }
  검('잰수인가 — 수만 참', 잰수인가(3) === true && 잰수인가(null) === false);

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}${LF}${실.map((s) => `   · ${s}`).join(LF)}`);
    process.exit(1);
  }
  console.log(`✅ 한글 이름 수집 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가) {
  const 사람들 = JSON.parse(fs.readFileSync(path.join(뿌리, 사람길), 'utf8')).people ?? [];
  const qid별 = new Map();
  for (const p of 사람들) if (p.q && /^Q[0-9]+$/.test(p.q)) qid별.set(p.q, p);
  console.log(`■ 우리가 추적하는 사람 ${사람들.length}명 · QID 가 있는 것 ${qid별.size}명`);

  const 묶음들 = 묶기([...qid별.keys()]);
  const 낸다 = []; let 못받은 = 0; const 못받은묶음 = [];
  for (const [i, 묶음] of 묶음들.entries()) {
    let 뭉치들 = null;
    try { 뭉치들 = await 받기(묶음); }
    catch (e) {
      못받은 += 묶음.length; 못받은묶음.push(String(e.message).slice(0, 80));
      console.log(`   ⬜ ${i + 1}/${묶음들.length} 묶음을 못 받았다 — ${String(e.message).slice(0, 70)}`);
      continue;
    }
    for (const [q, 뭉치] of Object.entries(뭉치들)) {
      const 사람 = qid별.get(q);
      if (!사람) continue;
      const 이름들 = 한글이름뽑기(뭉치);
      낸다.push({ slug: 사람.slug, name: 사람.name, q, 한글이름: 이름들 ?? [] });
    }
    process.stdout.write(`   ${i + 1}/${묶음들.length} 묶음 받음\r`);
  }
  console.log('');

  const 이름있는것 = 낸다.filter((x) => x.한글이름.length);
  const { 표, 겹친것 } = 이름표만들기(낸다);

  console.log(`■ 한글 이름을 받은 사람 ${이름있는것.length}명 / 물어본 ${qid별.size}명`);
  console.log(`   이름표에 든 이름 ${Object.keys(표).length}개`);
  if (겹친것.length) {
    console.log(`   ⚠ 한 이름에 두 사람이 걸려 «버린» 것 ${겹친것.length}개 —`);
    for (const x of 겹친것.slice(0, 6)) console.log(`      · ${x.이름}  (${x.슬러그들.join(' · ')})`);
    console.log('   ⛔ 잘못 잇는 것이 안 잇는 것보다 나쁘다. 버린 것이 맞다.');
  }
  if (못받은) console.log(`   🔴 못 받은 사람 ${못받은}명 — ${[...new Set(못받은묶음)].join(' · ')}`);

  /* 어제 트렌드에 실제로 몇이 걸리나를 «재서» 낸다 — 만들고 「됐다」고 하지 않는다 */
  try {
    const 어제 = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive/raw/community-desk/2026-09-08.json'), 'utf8'));
    const 없 = (어제.담은것 ?? []).filter((x) => x.유닛 === '갈래없음');
    const 걸린것 = 없.filter((x) => 표[String(x.제목 ?? '').trim()]);
    console.log('');
    console.log(`■ 어제(09-08) 갈래없음 ${없.length}건에 대 봤다 — 이 표로 ${걸린것.length}건이 걸린다`);
    for (const x of 걸린것.slice(0, 12)) {
      console.log(`   · ${x.제목}  → /person/${표[String(x.제목).trim()]}   (${x.곳} ${x.검색량 ?? ''})`);
    }
    if (!걸린것.length) console.log('   ⬜ 한 건도 안 걸린다 — 어제 트렌드에 오른 사람이 우리 634명 밖이라는 뜻이다');
  } catch { console.log('   ⬜ 어제 자료를 못 읽어 대 보지 못했다'); }

  if (process.argv.includes('--적는다')) {
    const 낼것 = {
      잰때: new Date().toLocaleString('ko-KR'),
      우물: 'https://www.wikidata.org/w/api.php  (wbgetentities · labels|aliases · ko)',
      이것이무엇인가: '우리가 추적하는 사람의 한글 이름 ↔ 지면 슬러그. 이슈 판정에서 «이름 한 낱말»을 알아보려고 만들었다.',
      이것이아닌것: '지면에 내는 자료가 아니다. 화면에 한국어를 내지 않는다(손님이 영어권이다).',
      물어본사람수: qid별.size,
      이름받은사람수: 이름있는것.length,
      못받은사람수: 못받은,
      겹쳐서버린이름: 겹친것,
      이름표: 표,
      사람들: 낸다,
    };
    fs.writeFileSync(path.join(뿌리, 낼길), `${JSON.stringify(낼것, null, 1)}${LF}`, 'utf8');
    console.log('');
    console.log(`✅ 적었다 — ${낼길}`);
  } else {
    console.log('');
    console.log('⭐ 적으려면 --적는다 를 붙인다.');
  }
}
