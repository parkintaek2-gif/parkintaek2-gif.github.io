#!/usr/bin/env node
/**
 * **「쓰면 안 된다」로 판정한 자료를 «만지는 자»가 다 막혔나.**
 *
 * ── 🔴 왜 (2026-10-11 16:1x · 5번) ──────────────────────────────────
 * 오늘 11:5x 에 HKEX 약관을 원문으로 읽고 🔴(쓰면 안 된다)로 판정했다.
 * 그리고 수집기 **둘**에 자물쇠를 걸었다 — 그런데 **셋째를 빠뜨렸다.**
 * ```
 *   collect-hongkong-hkex-disclosures.mjs    ✅ 걸었다
 *   collect-hongkong-hkex-financials.mjs     ✅ 걸었다
 *   extract-hongkong-financial-figures.mjs   🔴 «빠뜨렸다» — 16:1x 에 다른 검사가 알려 줬다
 * ```
 * ⭐ 빠뜨린 그 자가 **약관이 콕 집어 막는 일**을 한다 — PDF 를 열어(web scraping)
 *   수치를 뽑아(text/data mining) 모은다(compilations). 수집기보다 더 깊이 들어간다.
 *
 * ⭐⭐ **자물쇠는 «갈래»가 아니라 «그 자료를 만지는 자 전부»에 건다.**
 *   수집기만 막고 가공기를 두면 자료는 그대로 쌓인다. 한 줄 비어 있으면 길이 열려 있는 것이다.
 *   ⇒ 그 규칙을 글로 갖지 않고 이 자로 둔다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────────────
 * ⛔ **대장이 정본이다.** 막힌 갈래 목록을 이 파일에 손으로 적지 않는다 —
 *   적어 두면 대장에 🔴 가 하나 더 늘 때 이 자가 모른 채 초록이 된다.
 * ⛔ **검사(`check-`)는 세지 않는다.** 그 자들은 «재는» 자지 «만지는» 자가 아니다.
 *   재려면 그 이름을 입에 올려야 하는데, 그것까지 막으면 잴 수가 없다.
 * ⚠ 갈래 이름이 **짧으면 안 본다** — 「krx」 같은 짧은 말은 다른 자에도 흔히 들어 있어
 *   엉뚱한 자를 열아홉 개나 잡았다(실측). 긴 이름만 본다.
 * ⚠ 「읽는 코드를 아예 끊어 둔」 갈래는 자물쇠 꼴이 다르다 — `면제` 에 까닭을 적어 둔다.
 *
 *   node scripts/check-막힌자료를-만지는자가-다-막혔나.mjs
 *   node scripts/check-막힌자료를-만지는자가-다-막혔나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 자물쇠로 삼는 깃발 — 이 글자가 있어야 「막혔다」로 본다 */
export const 자물쇠말 = '약관을-읽었고-라이선스가-있다';

/** 짧은 이름은 다른 자에 흔히 들어 있어 엉뚱한 것을 잡는다. 긴 이름만 본다 */
export const 최소이름길이 = 12;

/**
 * 면제 — **왜 자물쇠 꼴이 다른가**를 같이 적는다.
 * ⛔ 「귀찮아서」는 까닭이 아니다. 자물쇠가 필요 없는 «구조적» 까닭만 적는다.
 */
export const 면제 = [
  {
    갈래: 'krx',
    잰다: '읽는 코드를 2026-10-06 에 «아예 끊었다» — 자물쇠를 걸 자가 남아 있지 않다. '
      + '사장님 「뭘 이걸 지우고, 유료로 사나?」로 자료는 지우지 않되 읽는 길만 끊은 것이다. '
      + '⚠ 이름이 세 글자라 아래 길이 자에도 걸리지 않는다 — 두 까닭이 겹쳐 있다.',
  },
  {
    갈래: 'uae-adx-marketwatch',
    잰다: '🔴 [2026-10-11 16:2x · 5번] **이 갈래는 「쌓되 싣지 않는다」로 다룬다 — 자물쇠 꼴이 다르다.** '
      + '처음에 이 자가 세 파일을 「자물쇠 없음」으로 울렸는데, 하나씩 열어 보니 전부 '
      + '2026-09-18 에 ADX 약관 원문을 읽고 «실어 나가는 자리»를 막아 둔 것이었다 — '
      + 'build-screener-data 머리글에 약관 30~38절이 통째로 인용돼 있고, '
      + 'uae-company-facts.json 에는 marketCapNote 로 「Market capitalisation is deliberately NOT '
      + 'carried in this file. ADX terms of use do not permit republishing」이 박혀 있다. '
      + '⇒ 실측: 그 파일 111줄 가운데 marketCap 이 든 줄은 0건이다. 시가총액은 «배수를 가르는 데만» 쓴다. '
      + '⭐ 받는 것을 막는 길(HKEX)과 «싣는 것»을 막는 길(ADX)은 다르다 — 약관이 다르기 때문이다. '
      + 'ADX 는 받는 것 자체를 막지 않고 sell·distribute·publish 를 막는다. '
      + '⛔ 그래서 이 갈래에 HKEX 식 자물쇠를 걸면 «받는 것»까지 막혀 소급 안 되는 자료를 잃는다. '
      + '⚠⚠ 처음에 여기에 「싣지 않는가는 check-시세를-그대로-내놓나.mjs 가 잰다」고 적었다가 '
      + '**지웠다 — 그 자는 ADX 를 안 본다(실측 0건).** 면제에 거짓 근거를 적으면 그것이 끈 것이다. '
      + '⇒ 대신 아래 `싣는지재기()` 가 이 자 안에서 직접 잰다.',
    싣는지잰다: {
      파일: 'src/data/uae-company-facts.json',
      없어야할칸: 'marketCap',
      왜: 'ADX 약관이 publish·distribute 를 막는다. 시가총액은 배수를 가르는 데만 쓰고 담지 않는다',
    },
  },
];

/**
 * 「쌓되 싣지 않는다」로 다루는 갈래가 **정말 안 싣고 있나.**
 * ⛔ 면제에 적어 두고 안 재면 그것은 끈 것이다. 적은 말을 자로 뒷받침한다.
 * ⚠ 머리말(`_meta`)에 「안 담는다」고 «적어 둔 글자»는 세지 않는다 — 줄에 든 것만 본다.
 */
export function 싣는지재기(줄들, 없어야할칸) {
  if (!Array.isArray(줄들)) return { 잴수있나: false, 걸린줄: 0 };
  const 걸린줄 = 줄들.filter((r) => r && typeof r === 'object'
    && JSON.stringify(r).includes(String(없어야할칸))).length;
  return { 잴수있나: true, 걸린줄, 전체: 줄들.length };
}

/** 대장에서 🔴 로 판정된 갈래 이름을 꺼낸다 — ⛔ 손으로 적지 않는다 */
export function 막힌갈래찾기(대장글) {
  const 모음 = [];
  for (const 줄 of String(대장글 ?? '').split(/\r?\n/)) {
    if (!줄.trim() || 줄.startsWith('#')) continue;
    const 칸 = 줄.split('\t');
    if (칸.length < 3) continue;
    const 폴더 = String(칸[0]).trim();
    const 판정 = String(칸[2] ?? '');
    if (폴더 && 판정.includes('🔴')) 모음.push(폴더);
  }
  return 모음;
}

/** 이 자가 실제로 볼 갈래 — 짧은 이름과 면제를 거른다 */
export function 볼갈래(막힌것, 면제목록 = 면제) {
  const 면제이름 = new Set((면제목록 ?? []).map((x) => x.갈래));
  return (막힌것 ?? []).filter((g) => g.length >= 최소이름길이 && !면제이름.has(g));
}

/** 한 자가 그 갈래를 만지나 — 그리고 막혔나 */
export function 만지나(글, 갈래들) {
  const s = String(글 ?? '');
  return (갈래들 ?? []).some((g) => g && s.includes(g));
}
export function 막혔나(글) {
  return String(글 ?? '').includes(자물쇠말);
}

/** 재는 자는 세지 않는다 — 재려면 이름을 입에 올려야 한다 */
export function 재는자인가(파일이름) {
  return /^check-/.test(String(파일이름 ?? ''));
}

function 자가시험() {
  let 탈 = 0;
  const 검 = (이름, 참, 덧 = '') => { if (!참) { 탈 += 1; console.log(`🔴 ${이름} ${덧}`); } };

  const 대장 = [
    '# 폴더\t출처\t판정\t근거',
    'hongkong-hkex-financials\t홍콩거래소\t🔴\t재배포 금지',
    'krx\tKRX OPEN API\t🔴\t읽는 코드를 끊었다',
    'dart-company\tDART\t🟢\t공공누리 1유형',
    'saudi-openfigi-companies\tOpenFIGI\t⬜\t약관 미독',
  ].join('\n');

  검('🔴 대장에서 🔴 갈래만 꺼낸다',
    막힌갈래찾기(대장).join(' ') === 'hongkong-hkex-financials krx');
  검('⛔ 🟢·⬜ 는 안 꺼낸다', !막힌갈래찾기(대장).includes('dart-company'));
  검('⛔ 주석 줄은 건너뛴다', !막힌갈래찾기(대장).includes('# 폴더'));
  검('⛔ 빈 글에 안 터진다', 막힌갈래찾기('').length === 0 && 막힌갈래찾기(null).length === 0);

  /* 🔴 짧은 이름이 엉뚱한 자를 잡는다 — 실측으로 겪었다 */
  검('🔴 짧은 이름(krx)은 안 본다 — 다른 자에 흔히 들어 있어 열아홉 개를 잘못 잡았다',
    볼갈래(['hongkong-hkex-financials', 'krx']).join(' ') === 'hongkong-hkex-financials');
  검('🔴 면제에 적힌 갈래도 뺀다',
    볼갈래(['hongkong-hkex-financials', 'krx'], [{ 갈래: 'hongkong-hkex-financials', 잰다: 'x' }]).length === 0);
  검('⛔ 면제마다 까닭을 적는다', 면제.every((x) => x.잰다 && x.잰다.length > 20));

  /* 🔴🔴 [2026-10-11 16:2x] **면제에 적어 두고 안 재면 그것은 끈 것이다.**
     처음에 「싣지 않는가는 다른 자가 잰다」고 적었는데, 그 자는 ADX 를 안 봤다(실측 0건).
     ⇒ 면제에 「싣는지잰다」를 달면 본 실행이 그것을 «직접» 돌린다. */
  검('🔴 「쌓되 싣지 않는다」 면제에는 재는 자리가 붙는다',
    면제.filter((x) => /쌓되 싣지 않는다/.test(x.잰다)).every((x) => x.싣는지잰다 && x.싣는지잰다.파일));
  검('🔴 안 실렸으면 걸린 줄이 0', 싣는지재기([{ a: 1 }, { b: 2 }], 'marketCap').걸린줄 === 0);
  검('🔴 실렸으면 그 줄을 센다', 싣는지재기([{ marketCap: 9 }, { b: 2 }], 'marketCap').걸린줄 === 1);
  검('⛔ 줄을 못 찾으면 «못 쟀다» — 0 으로 읽지 않는다',
    싣는지재기(null, 'marketCap').잴수있나 === false);
  검('⛔ 머리말에 적힌 설명 글자는 안 센다 — 줄에 든 것만 본다',
    싣는지재기([{ a: 1 }], 'marketCap').걸린줄 === 0);

  검('🔴 그 갈래를 만지는 자를 잡는다', 만지나("읽기('archive/raw/hongkong-hkex-financials')", ['hongkong-hkex-financials']));
  검('⛔ 안 만지는 자는 안 잡는다', 만지나("읽기('archive/raw/dart-company')", ['hongkong-hkex-financials']) === false);
  검('🔴 자물쇠가 있으면 막힌 것으로 본다', 막혔나(`if (!process.argv.includes('--${자물쇠말}'))`));
  검('⛔ 자물쇠가 없으면 안 막힌 것', 막혔나('const a = 1;') === false);
  검('⛔ 재는 자는 세지 않는다 — 재려면 이름을 입에 올려야 한다',
    재는자인가('check-licence-register.mjs') && !재는자인가('collect-hongkong-hkex-financials.mjs'));

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : '\n✅ 자가시험 17개 통과');
  if (탈) process.exit(1);
}

function 본실행() {
  const 대장길 = path.join(뿌리, 'docs/라이선스-대장.tsv');
  if (!fs.existsSync(대장길)) {
    console.log('⬜ 못 쟀다 — docs/라이선스-대장.tsv 가 없다. 「막힌 것이 없다」가 아니다.');
    return;
  }
  const 막힌것 = 막힌갈래찾기(fs.readFileSync(대장길, 'utf8'));
  const 볼것 = 볼갈래(막힌것);
  console.log(`■ 대장에서 🔴(쓰면 안 된다) 갈래 ${막힌것.length}개 · 그중 이 자가 보는 것 ${볼것.length}개`);

  /* ⛔ 면제에 적어 두고 «안 재면» 그것은 끈 것이다. 적은 말을 여기서 뒷받침한다 */
  let 실림 = 0;
  for (const x of 면제) {
    console.log(`   ⬜ 면제 ${x.갈래} — ${x.잰다.slice(0, 70)}…`);
    if (!x.싣는지잰다) continue;
    const { 파일, 없어야할칸, 왜 } = x.싣는지잰다;
    const 길 = path.join(뿌리, 파일);
    if (!fs.existsSync(길)) { console.log(`      ⬜ ${파일} 이 없다 — 못 쟀다(「안 실렸다」가 아니다)`); continue; }
    let j;
    try { j = JSON.parse(fs.readFileSync(길, 'utf8')); } catch (e) {
      console.log(`      ⬜ ${파일} 을 못 읽었다 — ${e.message.slice(0, 50)}`);
      continue;
    }
    const 줄들 = Array.isArray(j) ? j : (j.rows || Object.values(j).find(Array.isArray));
    const r = 싣는지재기(줄들, 없어야할칸);
    if (!r.잴수있나) { console.log(`      ⬜ ${파일} 에서 줄을 못 찾았다 — 못 쟀다`); continue; }
    if (r.걸린줄) {
      실림 += 1;
      console.log(`      🔴 ${파일} — 「${없어야할칸}」이 든 줄 ${r.걸린줄}/${r.전체}`);
      console.log(`         ⛔ ${왜}`);
    } else {
      console.log(`      ✅ ${파일} — 「${없어야할칸}」이 든 줄 0/${r.전체} (안 싣고 있다)`);
    }
  }
  if (!볼것.length) {
    console.log('✅ 볼 갈래가 없다 — 대장에 🔴 가 없거나 전부 면제다');
    return;
  }

  const 스크립트방 = path.join(뿌리, 'scripts');
  const 막힘 = []; const 안막힘 = [];
  for (const f of fs.readdirSync(스크립트방).filter((n) => n.endsWith('.mjs'))) {
    if (재는자인가(f)) continue;
    let 글;
    try { 글 = fs.readFileSync(path.join(스크립트방, f), 'utf8'); } catch { continue; }
    if (!만지나(글, 볼것)) continue;
    (막혔나(글) ? 막힘 : 안막힘).push(f);
  }

  console.log(`\n그 자료를 만지는 자(검사 제외) ${막힘.length + 안막힘.length}개`);
  for (const f of 막힘) console.log(`   ✅ ${f}`);
  if (!안막힘.length) {
    console.log('\n✅ 만지는 자가 다 막혀 있다');
    console.log('   ⚠ 「자물쇠 글자가 있다」를 잰 것이지 «정말 안 돈다»를 잰 것이 아니다 — 둘은 다르다.');
    return;
  }
  console.log(`\n🔴 자물쇠가 «없는» 자 ${안막힘.length}개`);
  for (const f of 안막힘) console.log(`   ⛔ scripts/${f}`);
  console.log('   ⭐ 자물쇠는 «갈래»가 아니라 «그 자료를 만지는 자 전부»에 건다.');
  console.log('     수집기만 막고 가공기를 두면 자료는 그대로 쌓인다.');
  console.log(`   ✅ 고치는 법: 그 자 맨 위에 \`--${자물쇠말}\` 깃발이 없으면 멈추는 줄을 넣고,`);
  console.log('     머리글에 약관 원문 인용과 까닭을 적는다(기존 셋이 본보기다).');
  console.log('   ⛔ 이 자의 `면제` 에 넣어서 끄지 않는다 — 구조적 까닭이 있을 때만 적는다.');
  process.exit(1);
}

if (process.argv.includes('--자가시험')) 자가시험();
else 본실행();
