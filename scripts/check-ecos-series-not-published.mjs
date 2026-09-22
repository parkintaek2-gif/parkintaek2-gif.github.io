/**
 * check-ecos-series-not-published.mjs — **판정이 안 난 ECOS 계열이 손님 지면에 나가지 않게 막는다.**
 *
 *   node scripts/check-ecos-series-not-published.mjs --자가시험
 *   node scripts/check-ecos-series-not-published.mjs            지금 저장소를 잰다
 *
 * ── 🔴 왜 (2026-09-22 · 5번) ────────────────────────────────────────────
 * 한국은행 **「통계정보이용지침」 원문**을 읽어 판정이 «계열마다» 갈린다는 것을 알았다.
 *
 *   「한국은행이 작성한 통계정보는 출처를 명시하는 한 **상업적 용도를 포함하여**
 *    무료로 자유롭게 사용, 가공 및 재배포할 수 있습니다」
 *   「**타 기관에서 작성한** 통계정보는 출처를 명시하여 **비상업적으로** 이용할 수 있지만,
 *    상업적으로 이용하고자 하는 경우에는 해당 통계작성기관(저작자)의 **승인을 받은 후에**
 *    이용하여야 합니다」   ← 지침이 든 「상업적 이용 사례」에 「유료사이트에 등재」가 있다
 *
 * ⇒ **「ECOS 에서 받았다」가 허락이 아니다.** 그 표를 «누가 작성했나»가 정한다.
 *   StatisticTableList 의 `ORG_NAME` 으로 쟀다 —
 *     817Y002 시장금리(일별)          ORG_NAME 「한국은행」  🟢 내도 된다
 *     901Y124 은행대출금 연체율        ORG_NAME 「은행연합회」 🔴 승인 전에는 못 낸다
 *     151Y001 · 181Y012 · 181Y015    ORG_NAME null        ⬜ null 의 뜻을 아직 못 쟀다
 *
 * ⛔ 우리는 광고를 싣는 매체다 — 지침이 말하는 「상업적 이용」에 곧바로 해당한다.
 * ⛔ 「일단 내고 나중에 확인」이 이 저장소의 되풀이되는 사고다(고용24 492건 · 주식발행정보 15만행).
 *
 * [이 자가 재는 것 하나] — 🔴·⬜ 계열의 자료 파일을 «지면이 읽고 있나».
 *   읽고 있으면 그 자리에서 빨강. 읽지 않으면(그냥 쌓아 둔 것이면) 초록.
 * ⛔ 이 자는 「약관이 무엇을 말하나」를 재지 않는다. 그것은 대장(docs/라이선스-대장.tsv)이 적는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/**
 * 아직 «못 내는» 자료 파일 — 값이 그 까닭이다.
 * 판정이 🟢 로 바뀌면 여기서 «빼는 것»이 푸는 길이다. 대장과 함께 고친다.
 */
export const 못내는자료 = {
  'korea-household-debt.json':
    '901Y124 는 은행연합회 작성(🔴 승인 필요) · 151Y001·181Y012·181Y015 는 ORG_NAME null(⬜ 못 쟀다)',
};

/** 지면이 이 자료를 읽고 있나 — import·fetch·경로 어느 꼴이든 이름이 나오면 읽는 것으로 본다 */
export function 읽는가(소스, 파일이름) {
  if (!소스 || !파일이름) return false;
  return String(소스).includes(String(파일이름));
}

/** 지면 쪽 파일인가 — 손님에게 가는 것만 본다 */
export function 지면인가(길) {
  const p = String(길 ?? '').replace(/\\/g, '/');
  if (!/^src\//.test(p)) return false;
  if (/^src\/data\//.test(p)) return false;            /* 자료 그 자체는 지면이 아니다 */
  return /\.(astro|ts|tsx|js|jsx|mjs|md|mdx)$/.test(p);
}

/** 폴더를 훑어 파일 길을 모은다 */
function 훑기(뿌리길, 여기 = 뿌리길, 모음 = []) {
  for (const 것 of fs.readdirSync(여기, { withFileTypes: true })) {
    const 길 = path.join(여기, 것.name);
    if (것.isDirectory()) { if (!/node_modules|\.git|dist/.test(것.name)) 훑기(뿌리길, 길, 모음); }
    else 모음.push(path.relative(뿌리, 길));
  }
  return 모음;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);

  본다('이름이 나오면 읽는 것으로 본다',
    읽는가("import d from '../data/korea-household-debt.json'", 'korea-household-debt.json'));
  본다('fetch 로 불러도 잡는다',
    읽는가("await fetch('/data/korea-household-debt.json')", 'korea-household-debt.json'));
  본다('⛔ 다른 자료는 안 잡는다', !읽는가("import d from '../data/gulf.json'", 'korea-household-debt.json'));
  본다('⛔ 빈 것에 안 터진다', !읽는가(null, 'x') && !읽는가('x', null) && !읽는가('', ''));

  본다('astro 는 지면이다', 지면인가('src/pages/data/korea-debt.astro'));
  본다('컴포넌트도 지면이다', 지면인가('src/components/Chart.tsx'));
  본다('🔴 src/data 는 지면이 아니다 — 쌓아 두는 자리다', !지면인가('src/data/korea-household-debt.json'));
  본다('⛔ src 밖은 안 본다', !지면인가('scripts/collect-korea-household-debt-ecos.mjs'));
  본다('⛔ archive 는 안 본다', !지면인가('archive/raw/korea-household-debt-ecos/a.json'));
  본다('윈도 역슬래시도 읽는다', 지면인가('src\\pages\\x.astro'));
  본다('⛔ 빈 길은 지면이 아니다', !지면인가('') && !지면인가(null));

  본다('못 내는 자료가 적혀 있다', Object.keys(못내는자료).length >= 1);
  본다('까닭이 비어 있지 않다', Object.values(못내는자료).every((v) => v && v.length > 20));
  본다('🔴 은행연합회 건이 까닭에 적혀 있다',
    Object.values(못내는자료).some((v) => v.includes('은행연합회')));

  /* ⭐ 대장과 짝이 맞나 — 한쪽만 고쳐지면 여기서 걸린다 */
  const 대장 = fs.readFileSync(path.join(뿌리, 'docs', '라이선스-대장.tsv'), 'utf8');
  본다('⭐ 대장에도 은행연합회 건이 적혀 있다', 대장.includes('은행연합회'));
  본다('⭐ 대장에 지침 원문이 인용돼 있다', 대장.includes('상업적 용도를 포함하여'));

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 실제로 잰다 ──────────────────────────────────────────── */
const 지면들 = 훑기(path.join(뿌리, 'src')).filter(지면인가);
console.log(`■ 손님 지면 ${지면들.length}개를 훑는다`);

const 샌것 = [];
for (const [자료, 까닭] of Object.entries(못내는자료)) {
  for (const 길 of 지면들) {
    let 소스 = '';
    try { 소스 = fs.readFileSync(path.join(뿌리, 길), 'utf8'); } catch { continue; }
    if (읽는가(소스, 자료)) 샌것.push([길, 자료, 까닭]);
  }
}

if (!샌것.length) {
  console.log('✅ 판정 안 난 ECOS 계열을 읽는 지면 0개 — 쌓아 두기만 하고 있다');
  for (const [자료, 까닭] of Object.entries(못내는자료)) console.log(`   ⬜ ${자료} — ${까닭}`);
  process.exit(0);
}
console.log(`🔴 판정 안 난 ECOS 계열이 지면에 났다 — ${샌것.length}곳`);
for (const [길, 자료, 까닭] of 샌것) console.log(`   ⛔ ${길}  ←  ${자료}\n      ${까닭}`);
console.log('   ✅ 푸는 길: ① 판정을 받아 대장을 고치고 이 자의 «못내는자료»에서 뺀다');
console.log('             ② 아니면 그 지면에서 그 계열을 뺀다');
process.exit(1);
