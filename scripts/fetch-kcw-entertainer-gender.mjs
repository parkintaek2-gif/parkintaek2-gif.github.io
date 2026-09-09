/**
 * fetch-kcw-entertainer-gender.mjs — 명부 9,249명의 **성별(P21)** 을 위키데이터에서 캐 온다.
 *
 * ── 🔴 왜 캐나 (2026-09-09 08:5x · 5번 · 이슈에서 나왔다) ─────────────────────
 * 커뮤니티 수집 08:00 몫에서 6시간 안에 든 씨앗 하나 —
 *   `[Reddit r/kpop] SEVENTEEN's DK Enlists in Army, Shares Buzz Cut Photos` (1.7시간 전)
 *
 * 「누가 다음에 입대하나」는 영어권에서 가장 많이 찾는 K팝 물음 가운데 하나다.
 * 그런데 그 물음에 답하려면 **생년과 성별이 둘 다** 있어야 한다 —
 * 한국의 병역 의무는 «남성»에게 있고, 나이로 시기가 정해진다.
 *
 *   생년   ✅ 있다 — `korean-entertainers-birth.json` 9,249명
 *   성별   🔴 **없었다** — 우리 자료의 어느 파일에도 칸이 없다
 *
 * ⛔ 그래서 이 축은 「못 쟀다」였다. 모르는 것을 적을 수는 없다(강령 ① 가공하지 않은 사실만).
 * ⭐ 그러니 «자료를 받는다». 알고 나서 적는다.
 *
 * ── ⛔ 왜 `fetch-kcw-entertainer-roles.mjs` 에 칸을 더하지 않았나 ────────────
 * 그 파일은 스스로 두 번 「이 물음에 칸 하나를 더한다」고 적어 두었고 그것이 이 집 방식이다.
 * 그런데 그 자의 산출물(`korean-entertainers-roles.json`)을 **생일 지면 366장이 읽는다.**
 * 다시 돌리면 그 파일을 덮어쓰고, 묶음 하나가 실패하면 366장이 함께 흔들린다.
 * ⇒ **읽는 자가 많은 파일을 이슈 하나 때문에 다시 쓰지 않는다.** 따로 받는다.
 *
 * ── ⚠ 이 자료가 «무엇이 아닌가» — 이 절을 지우지 않는다 ──────────────────────
 * ```
 * ⛔ 법적 신분이 아니다.        위키데이터에 «편집자가 적어 둔 것»이다. 공식 기록이 아니다
 * ⛔ 병역 판정이 아니다.        국적·이중국적·신체등급·연기 사유를 우리는 모른다.
 *                            명부에는 일본·중국·태국 국적 멤버도 섞여 있고 우리는 그것을 못 가른다
 * ⛔ 예측이 아니다.            「이 사람이 몇 년에 입대한다」를 우리가 말하지 않는다
 * ✅ 우리가 말할 수 있는 것.    「명부의 남성 가운데 이 생년이 N명이다」 — 분포다
 * ⬜ 안 적힌 사람은 «미확인».   0 이나 다른 성별로 밀어 넣지 않는다
 * ```
 *
 * ⚠ 성별은 사람에 관한 자료다. **분포로만 쓴다.** 개인 지면에 성별을 판정처럼 적지 않는다.
 *
 * 쓰는 법
 *   node scripts/fetch-kcw-entertainer-gender.mjs --잰다      실제로 받는다
 *   node scripts/fetch-kcw-entertainer-gender.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원자료 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 낼길 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-gender.json');

const 끝점 = 'https://query.wikidata.org/sparql';
const 머리 = { 'user-agent': 'KCultureWire/1.0 (parkintaek2@gmail.com)' };

/**
 * P21 의 Q번호 → 우리가 쓰는 이름.
 * ⛔ 여기 없는 값은 «기타»로 남긴다. 남성·여성 어느 쪽으로도 밀어 넣지 않는다.
 */
export const 성별표 = {
  Q6581097: '남성',
  Q6581072: '여성',
  Q1097630: '간성',
  Q1052281: '트랜스여성',
  Q2449503: '트랜스남성',
  Q48270: '논바이너리',
};

/**
 * 한 사람의 P21 Q번호들 → 우리가 쓸 «성별».
 *
 * ⛔ 아무것도 안 적혀 있으면 **미확인**이다. 흔한 쪽으로 채우지 않는다.
 * ⛔ 두 값이 적혀 있으면(고쳐 쓰는 중이거나 이력이 있는 경우) **여럿**으로 둔다 —
 *    하나를 골라 적으면 그것은 우리가 판정한 것이 된다.
 */
export function 성별고르기(q들) {
  const 것 = [...new Set([...(q들 ?? [])].filter(Boolean))];
  if (!것.length) return '미확인';
  const 이름들 = [...new Set(것.map((q) => 성별표[q]).filter(Boolean))];
  if (!이름들.length) return '기타';
  if (이름들.length > 1) return '여럿';
  return 이름들[0];
}

/** 한 묶음 SPARQL. ⚠ 200명씩 — 더 크면 위키데이터가 끊는다 */
export function 물음짓기(q들) {
  const values = q들.map((q) => `wd:${q}`).join(' ');
  return `SELECT ?p ?g WHERE {
  VALUES ?p { ${values} }
  OPTIONAL { ?p wdt:P21 ?g }
}`;
}

const 자다 = (ms) => new Promise((r) => setTimeout(r, ms));

async function 받기(q들, 가져오기 = fetch) {
  const res = await 가져오기(`${끝점}?format=json&query=${encodeURIComponent(물음짓기(q들))}`, { headers: 머리 });
  if (!res.ok) throw new Error(`위키데이터 ${res.status} — 반쯤 받은 것으로 수를 내지 않는다`);
  const j = await res.json();
  const 모음 = new Map();
  for (const b of j.results.bindings) {
    const q = b.p.value.split('/').pop();
    if (!모음.has(q)) 모음.set(q, new Set());
    if (b.g) 모음.get(q).add(b.g.value.split('/').pop());
  }
  return 모음;
}

async function 다받기() {
  const 사람들 = JSON.parse(fs.readFileSync(원자료, 'utf8')).사람;
  console.log(`원자료 ${사람들.length.toLocaleString('en-US')}명`);

  const 묶음크기 = 200;
  const 사람 = {};
  let 못받은묶음 = 0;
  const 못받은사람 = [];

  for (let i = 0; i < 사람들.length; i += 묶음크기) {
    const 조각 = 사람들.slice(i, i + 묶음크기);
    let 답 = null;
    for (let 번 = 0; 번 < 3 && !답; 번 += 1) {
      try { 답 = await 받기(조각.map((x) => x.q)); } catch (e) {
        console.log(`\n  ⚠ ${i}~ 묶음 ${번 + 1}번째 실패 — ${e.message}`);
        await 자다(3000 * (번 + 1));
      }
    }
    if (!답) {
      /* 🔴 못 받은 것을 «미확인»과 섞지 않는다. 섞으면 「위키데이터에 안 적혀 있다」로 읽힌다 */
      못받은묶음 += 1;
      for (const x of 조각) { 사람[x.q] = '못받음'; 못받은사람.push(x.q); }
    } else {
      for (const x of 조각) 사람[x.q] = 성별고르기(답.get(x.q));
    }
    process.stdout.write(`\r  받는 중 ${Math.min(i + 묶음크기, 사람들.length).toLocaleString('en-US')}/${사람들.length.toLocaleString('en-US')}`);
    await 자다(900);
  }
  console.log('');

  const 셈 = {};
  for (const v of Object.values(사람)) 셈[v] = (셈[v] ?? 0) + 1;

  const 답 = {
    잰때: new Date().toLocaleString('ko-KR'),
    출처: 'Wikidata SPARQL — P21 (sex or gender)',
    이것이무엇인가: '명부 9,249명 가운데 위키데이터에 성별이 적힌 사람의 그 값. 분포로만 쓴다.',
    이것이아닌것: [
      '법적 신분이 아니다 — 위키데이터 편집자가 적어 둔 것이다',
      '병역 판정이 아니다 — 국적·신체등급·연기 사유를 우리는 모른다',
      '예측이 아니다 — 누가 언제 입대한다를 우리가 말하지 않는다',
      '개인 지면에 판정처럼 적을 자료가 아니다',
    ],
    사람수: Object.keys(사람).length,
    셈,
    못받은묶음,
    못받은사람수: 못받은사람.length,
    사람,
  };

  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.writeFileSync(낼길, JSON.stringify(답, null, 1), 'utf8');
  console.log(`✅ ${낼길}`);
  console.log(`   ${Object.entries(셈).map(([k, v]) => `${k} ${v.toLocaleString('en-US')}`).join(' · ')}`);
  if (못받은묶음) console.log(`⚠ 못 받은 묶음 ${못받은묶음}개 — 「못받음」으로 남겼다. 미확인과 «다른 것»이다.`);
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (나 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('물음에 VALUES 가 들어간다', 물음짓기(['Q1', 'Q2']).includes('VALUES ?p { wd:Q1 wd:Q2 }'));
  검('물음이 P21 을 묻는다', 물음짓기(['Q1']).includes('wdt:P21'));
  검('P21 은 OPTIONAL 이다 — 없는 사람도 답에 남아야 한다', 물음짓기(['Q1']).includes('OPTIONAL'));
  검('남성을 알아본다', 성별고르기(['Q6581097']) === '남성');
  검('여성을 알아본다', 성별고르기(['Q6581072']) === '여성');
  검('⛔ 안 적힌 사람은 미확인 — 흔한 쪽으로 채우지 않는다', 성별고르기([]) === '미확인');
  검('⛔ null 도 미확인', 성별고르기(null) === '미확인');
  검('⛔ undefined 도 미확인', 성별고르기(undefined) === '미확인');
  검('⛔ 표에 없는 Q번호는 기타 — 남녀로 밀어 넣지 않는다', 성별고르기(['Q99999999']) === '기타');
  검('⛔ 두 값이면 여럿 — 하나를 골라 적지 않는다', 성별고르기(['Q6581097', 'Q6581072']) === '여럿');
  검('같은 값이 두 번 와도 하나로 본다', 성별고르기(['Q6581097', 'Q6581097']) === '남성');
  검('빈 값이 섞여 와도 견딘다', 성별고르기([null, 'Q6581072', '']) === '여성');
  검('논바이너리도 표에 있다', 성별고르기(['Q48270']) === '논바이너리');
  검('⚠ 「이것이아닌것」 절이 코드 주석에 살아 있다', fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').includes('병역 판정이 아니다'));

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ 성별 캐는 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

if (나 && process.argv.includes('--잰다')) await 다받기();
else if (나) {
  console.log('쓰는 법: node scripts/fetch-kcw-entertainer-gender.mjs --잰다 | --자가시험');
}
