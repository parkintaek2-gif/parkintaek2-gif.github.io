/**
 * 「여덟 가지로 틀렸다」 기사를 **정정 기록**에 대고 맞춘다.
 *
 *   eight-ways-we-have-been-wrong   screen — 21건이 여덟 가지 꼴이다
 *
 * ⛔ 이 기사는 「우리가 틀렸던 것」을 센다. 여기가 틀리면 제일 나쁘다.
 *    수를 손으로 안 적고 `wikitip-page-corrections.json` 에서 **다시 세서** 맞춘다.
 *
 * ⛔ 이 검사가 특히 지키는 것은 **「자가 없다」는 고백**이다.
 *    자가 없는 넷을 슬그머니 지우거나, 자를 안 만들고 「있다」고 적으면 선다.
 *    자랑은 저절로 늘고 고백은 저절로 준다 — 그래서 고백 쪽에 자를 댄다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/eight-ways-we-have-been-wrong.md';
const 기록길 = 'src/data/wikitip-page-corrections.json';
const 천 = (n) => Number(n).toLocaleString('en-US');
const 낱 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty', 'twenty-one'];

/** 원인별로 지면·기사 건수를 다시 센다 */
export function 원인별(기록) {
  const m = new Map();
  const 넣기 = (원인, 어디) => {
    if (!m.has(원인)) m.set(원인, { pages: 0, articles: 0 });
    m.get(원인)[어디]++;
  };
  for (const r of 기록.rows) 넣기(r.cause, 'pages');
  for (const a of 기록.articleCauses) 넣기(a.cause, 'articles');
  return m;
}

if (process.argv[1] && process.argv[1].endsWith('check-eight-ways-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  const 본보기 = { rows: [{ cause: 'a' }, { cause: 'a' }, { cause: 'b' }], articleCauses: [{ cause: 'a' }] };
  자가('지면을 센다', 원인별(본보기).get('a').pages === 2);
  자가('기사를 따로 센다', 원인별(본보기).get('a').articles === 1);
  자가('안 나온 원인은 없다', !원인별(본보기).has('c'));
  console.log(`여덟 가지 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const c = JSON.parse(fs.readFileSync(기록길, 'utf8'));
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\s+/g, ' ');
  const 민줄 = 한줄.replace(/\*/g, '');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(40)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 한줄.includes(s), s.length > 40 ? `${s.slice(0, 40)}…` : s);
  /* ⚠ 기사는 문장 첫머리 수를 낱말로 쓰고 대문자로 시작한다. **자가 문장 꼴까지 정하면 안 된다** —
     대소문자를 무시하고, 숫자와 낱말을 둘 다 받는다. */
  const 소문자 = 한줄.toLowerCase();
  const 아무거나 = (무엇, ...꼴) => 본다(무엇, 꼴.some((s) => 소문자.includes(String(s).toLowerCase())), 꼴[0]);

  const 전체 = c.rows.length + c.articleCauses.length;
  const 원인수 = Object.keys(c.causes).length;
  const 셈 = 원인별(c);

  /* ── ① 크기 ── */
  본다('전체 건수', 한줄.includes(`**${전체} corrections**`) || 한줄.includes(`${낱[전체]} corrections`),
    `${전체}건`);
  있나('지면·기사로 나눔', `${천(c.rows.length)} on data pages and ${천(c.articleCauses.length)} in articles`);
  본다('원인 가짓수', 한줄.includes(`There are ${낱[원인수]} kinds`), `${원인수}가지`);

  /* ── ② 원인마다 자료와 같은가. 표의 두 수를 다시 센 값과 맞춘다 ── */
  for (const [원인, v] of 셈) {
    const 지킴 = c.guards[원인];
    /* ⛔ 처음엔 표에 ✅·⛔ 를 썼는데 **그건 우리 내부 기호**다.
       새는 말 검사가 잡았고 그 자가 맞다 — 영문 기사에는 말로 적는다. */
    const 표시 = 지킴 ? 'yes' : 'not yet';
    const 줄 = `| ${v.pages} | ${v.articles} | ${표시} |`;
    본다(`${원인}`, 민줄.includes(줄) || 민줄.split(줄).length > 1, `${v.pages}·${v.articles} ${표시}`);
  }
  본다('원인이 다 표에 있나', 셈.size === 원인수, `${셈.size} / ${원인수}`);

  /* ── ③ 가장 큰 원인 ── */
  {
    const 가장 = [...셈].sort((a, b) => (b[1].pages + b[1].articles) - (a[1].pages + a[1].articles))[0];
    const n = 가장[1].pages + 가장[1].articles;
    본다('가장 큰 원인의 크기',
      한줄.includes(`produced ${낱[n]} of the ${낱[전체]}`) || 한줄.includes(`produced ${n} of the ${전체}`),
      `${가장[0]} ${n}건`);
    본다('그게 이름 맞추기인가', 가장[0] === 'title-text', 가장[0]);
    아무거나('지면·기사 쪽을 적었나',
      `${가장[1].pages} pages and in ${가장[1].articles} articles`,
      `${낱[가장[1].pages]} pages and in ${낱[가장[1].articles]} articles`);
  }

  /* ── ④ 🔴 자가 없는 것 — 이 검사의 핵심 ── */
  {
    const 있는것 = Object.values(c.guards).filter(Boolean);
    const 없는것 = Object.entries(c.guards).filter(([, v]) => !v).map(([k]) => k);
    아무거나('자가 있는 것 수',
      `${낱[있는것.length]} of the ${낱[원인수]} kinds now **fail the build**`,
      `${있는것.length} of the ${원인수} kinds now **fail the build**`);
    본다('자가 없다고 적은 수', 한줄.includes(`${낱[없는것.length].charAt(0).toUpperCase()}${낱[없는것.length].slice(1)} do not`)
      || 한줄.includes(`${낱[없는것.length]} do not`), `${없는것.length}가지`);
    /* 없는 넷을 **하나씩** 적었나. 뭉뚱그리면 목록이 아니다 */
    const 짧은말 = {
      'attribution-contradiction': 'attribution query contradicting',
      'kosis-two-level': 'Two-level classification',
      'unmeasured-sentence': 'never measured',
      'pay-denominator': 'Denominators that quietly include',
    };
    for (const k of 없는것) {
      본다(`  «${k}» 를 목록에 적었나`, !!짧은말[k] && 한줄.includes(짧은말[k]), 짧은말[k] ?? '말이 안 정해졌다');
    }
    있나('빈틈을 낸다고 말하나', 'publishing the gap rather than the coverage');
  }

  /* ── ⑤ 자로 댄 파일이 **실제로 있나** ── */
  for (const [원인, 길] of Object.entries(c.guards)) {
    if (!길) continue;
    본다(`  자가 실제로 있나 — ${원인}`, fs.existsSync(길), 길);
  }
  본다('자 설명이 기록에 있나', /work list/.test(c.guardNote ?? ''), '있다');

  /* ── ⑥ 정정이 언제 끝나는가 ── */
  있나('세 가지가 다 돼야 끝난다고 말하나', 'the number is fixed, everything');
  있나('오늘 새 꼴이 나왔다고 적었나', 'appeared **today**');

  console.log(틀림 ? `\n⛔ 여덟 가지 — 안 맞는 것 ${틀림}건` : '\n✅ 여덟 가지 — 전부 기록과 맞는다');
  process.exit(틀림 ? 1 : 0);
}
