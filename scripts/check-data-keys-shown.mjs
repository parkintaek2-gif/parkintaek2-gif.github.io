/**
 * **센 것을 안 보여 주는 열쇠**를 잡는다. (K Culture Wire 지면 자료)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-07 에 `unlabelledTitles`(204편)가 몇 주째 자료에 있었는데 **어느 지면도 안 썼다.**
 * 그때는 「한계 열쇠」만 골라 검사를 걸었다. 2026-08-08 에 전부 세어 보니 **12개**가 더 있었다 —
 * 작품 이름 16개(`examples`), 판정 448편(`perTitle`), 거르기 전 편수(`before`), 겹치는 이름 20개…
 * 전부 **읽는 사람이 우리를 확인할 수 있게 하는 것**인데 자료 파일 안에서만 살아 있었다.
 *
 * ⭐ 「센 것」과 「보여 준 것」은 다르다. 세어 두고 안 보여 주면 안 센 것과 읽기가 같다.
 * ⛔ 그러니 **안 보여 주려면 까닭을 적어야 한다.** 아래 면제표에 없는 열쇠가 지면에 안 나가면 선다.
 *    조용히 빠지는 길을 남기지 않는다 — 조용히 빠지던 것을 잡으려고 만든 검사다.
 *
 * 면제는 셋뿐이다.
 *   ① 기록용   — generated·source 같은 것. 지면에 낼 값이 아니다
 *   ② 딴 데가 씀 — 지면 말고 **상품/다른 자료**가 읽는다. 어디가 읽는지 파일로 적고, 정말 읽는지 본다
 *   ③ 비면 면제 — 한계 열쇠는 **0이면** 낼 것이 없다. 0이 아니게 되는 날 이 검사가 선다
 *
 * 쓰는 법: node scripts/check-data-keys-shown.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA = 'src/data';
const 읽는곳 = ['src/pages/wikitip', 'src/components', 'src/layouts'];

/** ① 기록용 — 만든 때·출처·단위. 값이 아니라 꼬리표다. */
const 기록용 = /^(generated|source|sourceKo|unit|unitKo|unitMean|privacy|note|주의|갱신|출처)$/;

/**
 * ② ③ 면제표. **까닭 없이 못 들어온다.**
 *   쓰는곳: 지면 아닌 소비자 파일. 그 파일이 정말 이 열쇠를 부르는지 검사가 확인한다.
 *   비면면제: 값이 「비었다」면 넘어간다. 차면 선다.
 */
const 면제 = [
  {
    파일: 'wikitip-global.json', 열쇠: 'bothCharts',
    까닭: '같은 값을 wikitip-screen-split.json 이 들고 있고 /screen-split 이 그것을 쓴다. 한 값을 두 지면에서 두 번 낼 일이 아니다',
    같은값: { 파일: 'wikitip-screen-split.json', 열쇠: 'bothCharts' },
  },
  {
    파일: 'wikitip-title-ambiguity.json', 열쇠: 'frontPage',
    까닭: '첫 화면은 wikitip-charts.json 의 이름겹침 딱지로 이미 같은 것을 보여 준다. 이 칸은 상품 표본이 읽는다',
    쓰는곳: 'scripts/build-product-sample.mjs',
  },
  {
    파일: 'wikitip-title-ambiguity.json', 열쇠: 'unreachable',
    까닭: '위키데이터에 못 물어본 편수. **0이면 밝힐 것이 없다.** 0이 아니게 되면 지면이 말해야 한다',
    비면면제: (v) => !v || v.titles === 0,
  },
  {
    파일: 'wikitip-kpop.json', 열쇠: 'rosterQueriesMissed',
    까닭: '명단 질의가 실패한 횟수. **0이면 밝힐 것이 없다.** 0이 아니게 되면 명단이 덜 찬 것이라 지면이 말해야 한다',
    비면면제: (v) => !v,
  },
];

/** 지면·부품이 자료를 무슨 이름으로 읽는지 모은다. */
export function 읽는지면(디렉들) {
  const 글들 = [];
  for (const d of 디렉들) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.astro') || x.endsWith('.ts'))) {
      글들.push({ 이름: `${path.basename(d)}/${f}`, 글: fs.readFileSync(path.join(d, f), 'utf8') });
    }
  }
  return 글들;
}

/** 한 자료 파일을 읽는 지면들과, 거기서 붙인 변수 이름. */
export function 변수이름(글, 파일) {
  const m =글.match(new RegExp(`import\\s+(\\w+)\\s+from\\s+['"][^'"]*${파일.replace('.', '\\.')}['"]`));
  return m ? m[1] : null;
}

if (process.argv[1] && process.argv[1].endsWith('check-data-keys-shown.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 본다 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  본다('import 에서 변수 이름을 뽑는다',
    변수이름("import data from '../../data/wikitip-titles.json';", 'wikitip-titles.json') === 'data');
  본다('딴 파일 import 는 안 잡는다',
    변수이름("import data from '../../data/wikitip-reach.json';", 'wikitip-titles.json') === null);
  본다('기록용은 값으로 안 센다', 기록용.test('generated') && !기록용.test('examples'));
  본다('면제에 까닭이 다 적혀 있다', 면제.every((e) => e.까닭 && e.까닭.length > 20));
  본다('면제는 셋 중 하나의 근거를 든다',
    면제.every((e) => e.쓰는곳 || e.비면면제 || e.같은값));
  console.log(`안 보여 준 열쇠 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const 글들 = 읽는지면(읽는곳);
  const 넘음 = [];

  /* 면제표부터 검사한다 — **면제가 낡는 것**이 이 검사가 썩는 길이다. */
  for (const e of 면제) {
    const 길 = path.join(DATA, e.파일);
    if (!fs.existsSync(길)) { 넘음.push(`면제표가 없는 자료 ${e.파일} 을 가리킨다`); continue; }
    const j = JSON.parse(fs.readFileSync(길, 'utf8'));
    if (!(e.열쇠 in j)) { 넘음.push(`면제표의 ${e.파일}·${e.열쇠} 가 자료에 없다. 낡은 면제는 지운다`); continue; }
    if (e.쓰는곳) {
      if (!fs.existsSync(e.쓰는곳)) 넘음.push(`${e.파일}·${e.열쇠} 를 쓴다는 ${e.쓰는곳} 이 없다`);
      else if (!fs.readFileSync(e.쓰는곳, 'utf8').includes(e.열쇠)) {
        넘음.push(`${e.쓰는곳} 이 ${e.열쇠} 를 안 부른다. 「딴 데가 쓴다」가 더는 사실이 아니다`);
      }
    }
    if (e.같은값) {
      const 짝 = path.join(DATA, e.같은값.파일);
      if (!fs.existsSync(짝) || !(e.같은값.열쇠 in JSON.parse(fs.readFileSync(짝, 'utf8')))) {
        넘음.push(`${e.파일}·${e.열쇠} 의 짝 ${e.같은값.파일}·${e.같은값.열쇠} 가 없다`);
      }
    }
    if (e.비면면제 && !e.비면면제(j[e.열쇠])) {
      넘음.push(`${e.파일}·${e.열쇠} 가 이제 비어 있지 않다(${JSON.stringify(j[e.열쇠])}). 지면이 이것을 말해야 한다`);
    }
  }

  /* 이제 안 쓰는 열쇠를 찾는다. */
  const 면제열쇠 = new Set(면제.map((e) => `${e.파일}·${e.열쇠}`));
  let 본열쇠 = 0;
  for (const f of fs.readdirSync(DATA).filter((x) => /^wikitip-.*\.json$/.test(x))) {
    const j = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
    const 쓰는곳 = 글들.map((p) => ({ ...p, 변수: 변수이름(p.글, f) })).filter((p) => p.변수);
    if (!쓰는곳.length) continue;      // 지면이 아예 안 읽는 자료는 다른 검사 몫이다
    for (const k of Object.keys(j)) {
      if (기록용.test(k)) continue;
      본열쇠++;
      if (면제열쇠.has(`${f}·${k}`)) continue;
      if (쓰는곳.some((p) => p.글.includes(`${p.변수}.${k}`))) continue;
      넘음.push(`${f}·${k} 를 세어 두고 **어느 지면도 안 보여 준다**. 지면에 내거나 면제표에 까닭을 적는다`);
    }
  }

  if (넘음.length) {
    console.log(`\n⛔ 안 보여 준 열쇠 검사 — ${넘음.length}건`);
    for (const s of 넘음) console.log(`   · ${s}`);
    process.exit(1);
  }
  console.log(`✅ 안 보여 준 열쇠 검사 — 값 열쇠 ${본열쇠}개가 다 지면에 나간다 (까닭 적고 뺀 것 ${면제.length}개)`);
}
