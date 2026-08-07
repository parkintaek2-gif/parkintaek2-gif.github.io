/**
 * 산업·웹툰 기사 세 편을 **지면 자료에 대고** 맞춘다.
 *   ① three-labour-markets-not-one
 *   ② twenty-eight-webtoon-platforms
 *   ③ women-in-korean-content-companies
 *
 * ⛔ 수를 여기 손으로 안 적는다. `wikitip-content-industry.json` · `wikitip-webtoon.json`
 *    에서 **읽어서** 기사와 맞춘다. 자료가 새로 나오면 검사가 저절로 따라온다.
 * ⛔ 문장은 한 줄로 편 본문에, 표는 원문 줄에 댄다. 기사는 80자에서 줄이 바뀐다.
 */
import fs from 'node:fs';

const ind = JSON.parse(fs.readFileSync('src/data/wikitip-content-industry.json', 'utf8'));
const web = JSON.parse(fs.readFileSync('src/data/wikitip-webtoon.json', 'utf8'));
const 읽기 = (s) => {
  const 원 = fs.readFileSync(`content/kculturewire/${s}.md`, 'utf8');
  return { 한줄: 원.replace(/\s+/g, ' '), 원 };
};
let 틀림 = 0;
const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(38)} ${값}`); };
const 콤마 = (n) => Number(n).toLocaleString('en-US');
/** 백만원 → 억/조 없이 「₩N.Nm」 꼴. 지면과 같은 자를 쓴다. */
const 백만 = (v) => `₩${(v / 1e6).toFixed(1)}m`;
const 십억 = (v) => `₩${(v / 1000).toFixed(1)}bn`;   // 자료 단위가 백만원이다

/* ── ① 세 노동시장 ── */
{
  const { 한줄, 원 } = 읽기('three-labour-markets-not-one');
  const 이름 = { Broadcasting: 'Broadcasting',
    'Film, video and audio production': 'Film, video and audio',
    'Publishing (includes games)': 'Publishing \\(includes games\\)' };
  for (const g of ind.groups) {
    const 표기 = 이름[g.key];
    if (!표기) { 본다(`① ${g.key}`, false, '기사에 이름을 못 정했다'); continue; }
    /* ⚠ 표는 첫 줄에만 단위(yrs)를 적는다. 자가 그 낱말 하나로 헛돌지 않게 **양쪽 다** 받는다. */
    const re = new RegExp(`\\|\\s*${표기}\\s*\\|\\s*${g.n}\\s*\\|\\s*${콤마(g.staff)}\\s*\\|\\s*\\*{0,2}${g.tenure.toFixed(1)}( yrs)?\\*{0,2}\\s*\\|\\s*\\*{0,2}${백만(g.pay)}\\*{0,2}\\s*\\|\\s*\\*{0,2}${g.female}%\\*{0,2}\\s*\\|\\s*${g.age}( yrs)?\\s*\\|`);
    본다(`① 표 ${g.key.slice(0, 22)}`, re.test(원), `${g.n} · ${콤마(g.staff)} · ${g.tenure.toFixed(1)} · ${백만(g.pay)} · ${g.female}% · ${g.age}`);
  }
  const c = ind.content; const m = ind.market;
  본다('① 표 전체 248',
    new RegExp(`\\|\\s*All ${c.n} together\\s*\\|\\s*${c.n}\\s*\\|\\s*${콤마(c.staff)}\\s*\\|\\s*${c.tenure.toFixed(1)}\\s*\\|\\s*${백만(c.pay)}\\s*\\|\\s*${c.female}%\\s*\\|\\s*${c.age}\\s*\\|`).test(원),
    `${c.n} · ${콤마(c.staff)} · ${c.tenure.toFixed(1)} · ${백만(c.pay)}`);
  본다('① 표 시장',
    new RegExp(`\\|\\s*Whole listed market\\s*\\|\\s*${콤마(m.n)}\\s*\\|\\s*${콤마(m.staff)}\\s*\\|\\s*${m.tenure.toFixed(1)}\\s*\\|\\s*${백만(m.pay)}\\s*\\|\\s*${m.female.toFixed(1)}%\\s*\\|\\s*${m.age}\\s*\\|`).test(원),
    `${콤마(m.n)} · ${콤마(m.staff)} · ${m.tenure.toFixed(1)} · ${백만(m.pay)}`);
  const 방 = ind.groups.find((g) => g.key === 'Broadcasting');
  const 출 = ind.groups.find((g) => g.key.startsWith('Publishing'));
  본다('① 방송이 두 배 가깝다', 방.tenure / 출.tenure >= 1.8 && /almost twice as long/i.test(한줄),
    (방.tenure / 출.tenure).toFixed(2));
  const 영 = ind.groups.find((g) => g.key.startsWith('Film'));
  본다('① 영화 낮은 임금 문장',
    new RegExp(`${백만(영.pay)} against publishing's ${백만(출.pay)}`).test(한줄), `${백만(영.pay)} < ${백만(출.pay)}`);
  본다('① 시장 임금', new RegExp(`listed-market average of ${백만(m.pay)}`).test(한줄), 백만(m.pay));
}

/* ── ② 웹툰 ── */
{
  const { 한줄, 원 } = 읽기('twenty-eight-webtoon-platforms');
  const 줄 = (k) => web.rows.find((r) => r.key === k);
  const 전 = 줄('All businesses'); const 플 = 줄('Platforms'); const 콘 = 줄('Content providers');
  본다('② 전체 사업체', new RegExp(`\\*\\*${전.n} businesses\\*\\*`).test(한줄), 전.n);
  for (const [k, 표기] of [['Platforms', 'Platforms'], ['Content providers', 'Content providers']]) {
    const r = 줄(k);
    본다(`② 표 ${k}`, new RegExp(`\\|\\s*${표기}\\s*\\|\\s*${r.n}\\s*\\|\\s*\\*{0,2}${십억(r.mean)}\\*{0,2}\\s*\\|\\s*${r.under1}%\\s*\\|\\s*${r.over10}%\\s*\\|`).test(원),
      `${r.n} · ${십억(r.mean)} · ${r.under1}% · ${r.over10}%`);
  }
  본다('② 배수', new RegExp(`\\*\\*A platform averages ${Math.round(플.mean / 콘.mean)} times the revenue`).test(한줄),
    Math.round(플.mean / 콘.mean));
  본다('② 76.4% 문장', new RegExp(`\\*\\*${전.under1}% of all webtoon businesses take less than ₩1bn`).test(한줄), `${전.under1}%`);
  const 소 = 줄('Under 10 staff'); const 대 = 줄('50+ staff');
  본다('② 10명 미만', new RegExp(`\\*\\*${소.n} of ${전.n} businesses — more than half — have fewer than ten people\\.\\*\\*`).test(한줄), 소.n);
  본다('② 10명 미만 평균', new RegExp(`average annual revenue\\s*is ₩${Math.round(소.mean)}m`).test(한줄), `₩${Math.round(소.mean)}m`);
  본다('② 50+ 배수', new RegExp(`roughly ${Math.round(대.mean / 소.mean)} times as much`).test(한줄), Math.round(대.mean / 소.mean));
  const 기 = 줄('Planning and production'); const 서 = 줄('Webtoon service provision');
  본다('② 기획제작', new RegExp(`\\*\\*Planning and production is the largest group`).test(한줄)
    && new RegExp(`${기.n} of the ${전.n} businesses make the work; they average ${십억(기.mean)}`).test(한줄), `${기.n} · ${십억(기.mean)}`);
  본다('② 서비스 배수', new RegExp(`The ${서.n} that run the service where it is read average\\s*${Math.round(서.mean / 기.mean)} times that`).test(한줄),
    Math.round(서.mean / 기.mean));
  본다('② 75% 의존', new RegExp(`\\*\\*${전.dep75}% of businesses take three-quarters or more`).test(한줄)
    && new RegExp(`under ten staff — it is ${소.dep75}%`).test(한줄)
    && new RegExp(`over ₩10bn it drops to ${줄('Revenue ₩10bn+').dep75}%`).test(한줄),
  `${전.dep75}% · ${소.dep75}% · ${줄('Revenue ₩10bn+').dep75}%`);
}

/* ── ③ 여성 비중 ── */
{
  const { 한줄, 원 } = 읽기('women-in-korean-content-companies');
  const c = ind.content; const m = ind.market;
  본다('③ 전체 대 시장', new RegExp(`\\*\\*${c.female}% of staff are women\\*\\* — against \\*\\*${m.female.toFixed(1)}%\\*\\*`).test(한줄),
    `${c.female}% vs ${m.female.toFixed(1)}%`);
  본다('③ 시장 회사 수', new RegExp(`all ${콤마(m.n)} listed companies`).test(한줄), m.n);
  for (const [k, 표기] of [['Film, video and audio production', 'Film, video and audio production'],
    ['Broadcasting', 'Broadcasting'], ['Publishing (includes games)', 'Publishing \\(includes games\\)']]) {
    const g = ind.groups.find((x) => x.key === k);
    본다(`③ 표 ${k.slice(0, 20)}`,
      new RegExp(`\\|\\s*${표기}\\s*\\|\\s*${콤마(g.staff)}\\s*\\|\\s*\\*{0,2}${g.female}%\\*{0,2}\\s*\\|`).test(원),
      `${콤마(g.staff)} · ${g.female}%`);
  }
  const 영 = ind.groups.find((g) => g.key.startsWith('Film'));
  const 출 = ind.groups.find((g) => g.key.startsWith('Publishing'));
  const 벌어짐 = (영.female - 출.female).toFixed(1);
  본다('③ 안쪽 격차', new RegExp(`spread inside the sector is ${벌어짐} points`).test(한줄), `${벌어짐}점`);
  본다('③ 시장과의 격차', new RegExp(`The gap to the rest of the market is ${Math.round(c.female - m.female)}`).test(한줄),
    Math.round(c.female - m.female));
  본다('③ 출판 몫', new RegExp(`largest at ${콤마(출.staff)}, three-quarters of the sector's staff`).test(한줄)
    && 출.staff / c.staff > 0.7, `${(100 * 출.staff / c.staff).toFixed(0)}%`);
}

if (틀림) { console.error(`\n❌ ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`); process.exit(1); }
console.log('\n✅ 세 편 전부 기사와 자료가 맞는다');
