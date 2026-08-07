/**
 * 2026-08-08 새벽에 낸 **세 편**을 자료에 대고 맞춘다. (2번 지시 03:0x — 29 → 32편)
 *
 *   a-third-of-what-travels-never-charts-at-home        한국 차트 대 동남아
 *   the-top-tier-is-where-players-stay                  롤 사다리 두 칸
 *   music-has-no-squid-game-and-is-more-concentrated…   화면 대 음악 쏠림
 *
 * ⛔ 수를 여기 손으로 안 적는다. 자료에서 **다시 세서** 기사와 맞춘다.
 * ⛔ 문장은 한 줄로 편 본문에, 표는 원문 줄에 댄다.
 * ⚠ 이 세 편은 셋 다 **못 재는 것**을 같이 말한다. 그 문장이 사라지면 그것도 잡는다.
 */
import fs from 'node:fs';
import readline from 'node:readline';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const CD = 'content/kculturewire';
const 읽기 = (slug) => {
  const 원 = fs.readFileSync(`${CD}/${slug}.md`, 'utf8');
  return { 원, 한줄: 원.replace(/\s+/g, ' ') };
};
const 몫 = (a, b) => +((100 * a) / b).toFixed(1);
/**
 * 기사는 읽기 좋으라고 «54.0%» 로 쓰고 자료는 «54» 로 담는다. **둘 다 받는다.**
 * ⛔ 이걸 안 해서 아홉 군데가 헛울었다. 기사가 아니라 잣대가 틀린 자리다.
 */
const 수꼴 = (n) => `${n}(?:\\.0)?`;

/** 쏠림 — 어느 만큼 모으면 절반이 되나. */
export function 절반까지(값들) {
  const v = [...값들].sort((a, b) => b - a);
  const T = v.reduce((a, b) => a + b, 0);
  let s = 0;
  for (let i = 0; i < v.length; i++) { s += v[i]; if (s >= 0.5 * T) return i + 1; }
  return v.length;
}
/** 상위 한 자리(10%)가 가진 몫. */
export function 상위10몫(값들) {
  const v = [...값들].sort((a, b) => b - a);
  const T = v.reduce((a, b) => a + b, 0);
  return +((100 * v.slice(0, Math.round(v.length * 0.1)).reduce((a, b) => a + b, 0)) / T).toFixed(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-three-new-articles.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('절반까지 — 하나가 절반이면 1', 절반까지([10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]) === 1);
  자가('절반까지 — 고르면 반쯤', 절반까지([1, 1, 1, 1]) === 2);
  자가('상위10% 몫 — 고르면 10%쯤', 상위10몫(Array(10).fill(1)) === 10);
  자가('상위10% 몫 — 하나가 다 가지면 큰 값', 상위10몫([100, 0, 0, 0, 0, 0, 0, 0, 0, 0]) === 100);
  console.log(`새 세 편 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(32)} ${값}`); };

  /* ── ① 한국 차트 대 동남아 ── */
  {
    const { 한줄, 원 } = 읽기('a-third-of-what-travels-never-charts-at-home');
    const K = JSON.parse(fs.readFileSync('src/data/wikitip-korea-signal.json', 'utf8'));
    const T = JSON.parse(fs.readFileSync('src/data/wikitip-titles.json', 'utf8'));
    const wk = new Map(T.rows.map((r) => [r.title, r]));
    const R = K.rows;
    const 없 = R.filter((r) => r.koreaWeeks === 0);
    const 있 = R.filter((r) => r.koreaWeeks > 0);
    본다('① 패널·한국 0주', 한줄.includes(`**${R.length} Korean titles**`) && 한줄.includes(`**${없.length} have never once appeared`), `${R.length} · ${없.length}`);
    const 평국 = (g) => (g.reduce((s, r) => s + wk.get(r.title).countries, 0) / g.length).toFixed(2);
    const 평주 = (g) => (g.reduce((s, r) => s + wk.get(r.title).weeks, 0) / g.length).toFixed(1);
    const 일위 = (g) => 몫(g.filter((r) => wk.get(r.title).peak === 1).length, g.length);
    본다('① 표 「Also charted」', new RegExp(`Also charted in Korea \\| ${있.length} \\| \\*\\*${평국(있)}\\*\\* \\| ${평주(있)} \\| ${일위(있)}%`).test(원),
      `${있.length} · ${평국(있)} · ${평주(있)} · ${일위(있)}%`);
    본다('① 표 「Never charted」', new RegExp(`Never charted in Korea \\| ${없.length} \\| \\*\\*${평국(없)}\\*\\* \\| ${평주(없)} \\| \\*\\*${일위(없)}%`).test(원),
      `${없.length} · ${평국(없)} · ${평주(없)} · ${일위(없)}%`);
    for (const [lo, hi, 이름] of [[1, 3, '1–3'], [4, 9, '4–9'], [10, 999, '10 or more']]) {
      const g = R.filter((r) => r.koreaWeeks >= lo && r.koreaWeeks <= hi);
      본다(`① 사다리 ${이름}`, new RegExp(`\\| ${이름} \\| ${g.length} \\| ${평국(g)} \\|`).test(원), `${g.length} · ${평국(g)}`);
    }
    const 여섯없 = R.filter((r) => r.koreaWeeks === 0 && wk.get(r.title).countries === 6).length;
    const 여섯 = R.filter((r) => wk.get(r.title).countries === 6).length;
    const 하나 = R.filter((r) => wk.get(r.title).countries === 1);
    본다('① 6개국인데 한국 0주', 한줄.includes(`**${여섯없} titles`) && 한줄.includes(`${몫(여섯없, 여섯)}% of the titles that swept`), `${여섯없}/${여섯} = ${몫(여섯없, 여섯)}%`);
    본다('① 1개국 중 한국 0주',
      한줄.includes(`${하나.filter((r) => r.koreaWeeks === 0).length} of the ${하나.length}`)
      && 한줄.includes(`${몫(하나.filter((r) => r.koreaWeeks === 0).length, 하나.length)}% of the single-market`),
      `${하나.filter((r) => r.koreaWeeks === 0).length}/${하나.length}`);
    for (const k of ['Films', 'TV']) {
      const g = R.filter((r) => r.type === k);
      const p = 몫(g.filter((r) => r.koreaWeeks === 0).length, g.length);
      본다(`① ${k} 한국 0주 몫`, 한줄.includes(`${p}%`), `${p}%`);
    }
    /* 이름을 댄 편이 정말 그런가 — 여기가 제일 아프다 */
    for (const [이름, 한국, 나라] of [['Young Lady and Gentleman', 0, 6], ['The Penthouse: War in Life', 0, 6],
      ['Guardian: The Lonely and Great God', 14, 1], ['Nocturnal', 13, 1]]) {
      const r = R.find((x) => x.title === 이름); const w = wk.get(이름);
      본다(`① «${이름.slice(0, 22)}»`, !!r && r.koreaWeeks === 한국 && w.countries === 나라 && 한줄.includes(이름),
        r ? `한국 ${r.koreaWeeks}주 · ${w.countries}개국` : '패널에 없다');
    }
    본다('① 못 재는 것을 말하나', /never had the chance/.test(한줄) && /aired on Korean television/.test(한줄), '두 문장 다');
  }

  /* ── ② 롤 사다리 두 칸 ── */
  {
    const { 한줄, 원 } = 읽기('the-top-tier-is-where-players-stay');
    const C = JSON.parse(fs.readFileSync('src/data/wikitip-ladder-churn.json', 'utf8'));
    for (const r of C.rows) {
      const 차 = +(r.vetPc - r.gmVetPc).toFixed(1);
      const 줄 = 원.split('\n').find((l) => l.startsWith(`| ${r.region} |`));
      const 맞나 = (l, n, 끝 = '%') => !!l && new RegExp(`${수꼴(n)}${끝 === '%' ? '%' : ''}`).test(l);
      const ok = 맞나(줄, r.vetPc) && 맞나(줄, r.gmVetPc) && 맞나(줄, 차, '');
      본다(`② 고인물 ${r.region}`, ok, `${r.vetPc} · ${r.gmVetPc} · ${차}p`);
      const 뜨 = 원.split('\n').filter((l) => l.startsWith(`| ${r.region} |`)).slice(-1)[0];
      본다(`② 연승 ${r.region}`, 맞나(뜨, r.hotPc) && 맞나(뜨, r.gmHotPc), `${r.hotPc} · ${r.gmHotPc}`);
    }
    본다('② 모든 지역이 위가 더 굳었나', C.rows.every((r) => r.vetPc > r.gmVetPc) && /Every row is positive/.test(한줄), '전부 양수');
    본다('② 날 수', 한줄.includes(`${C.days} days`) || /four days/.test(한줄), C.days);
    /* 「끝은 안 바뀌고 가운데는 바뀐다」 — 실제로 그런가 */
    const 순 = C.series.map((d) => Object.entries(d).filter(([k]) => k !== 'date').sort((a, b) => b[1] - a[1]).map(([k]) => k));
    본다('② 늘 한국이 첫째', 순.every((s) => s[0] === 'Korea') && /Korea is highest on all four days/.test(한줄), '네 날 다');
    본다('② 끝 둘은 늘 NA·SEA', 순.every((s) => ['North America', 'Southeast Asia'].includes(s[5])), '네 날 다');
    본다('② 가운데가 바뀐다고 말하나', new Set(순.map((s) => s.join('>'))).size > 1 && /middle\s*is not stable/.test(한줄), `순서 ${new Set(순.map((s) => s.join('>'))).size}가지`);
    본다('② 사람 식별자를 안 담는다고 말하나', /identifiers/.test(한줄) && /puuid/.test(한줄), '앞말·본문');
  }

  /* ── ③ 화면 대 음악 쏠림 ── */
  {
    const { 한줄, 원 } = 읽기('music-has-no-squid-game-and-is-more-concentrated-anyway');
    /* 화면은 원자료에서 **다시 센다** — 우리 상위 50 표를 안 믿는다 */
    const ko = koreanTitleFilter();
    const agg = new Map();
    const rl = readline.createInterface({ input: fs.createReadStream('archive/raw/netflix-top10/global.ndjson'), crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line.trim()) continue;
      let r; try { r = JSON.parse(line); } catch { continue; }
      if (!ko.keepRow(r.제목, r.구분)) continue;
      agg.set(r.제목, (agg.get(r.제목) || 0) + (r.시청시간 || 0));
    }
    const 화 = [...agg.values()];
    const d = 'archive/raw/star-pageviews';
    const f = fs.readdirSync(d).filter((x) => /^kpop-\d+\.json$/.test(x)).sort().pop();
    const 음원 = JSON.parse(fs.readFileSync(path0(d, f), 'utf8')).사람;
    const 음 = 음원.map((p) => p.합);

    본다('③ 패널 크기', 한줄.includes(`**${화.length} titles**`) && 한줄.includes(`**${음.length.toLocaleString('en-US')} K-pop acts`), `${화.length} · ${음.length}`);
    const T화 = 화.reduce((a, b) => a + b, 0); const T음 = 음.reduce((a, b) => a + b, 0);
    본다('③ 가장 큰 하나', 한줄.includes(`**${몫(Math.max(...화), T화)}%**`) && 한줄.includes(`**${몫(Math.max(...음), T음)}%**`),
      `${몫(Math.max(...화), T화)}% · ${몫(Math.max(...음), T음)}%`);
    본다('③ 절반까지 — 화면', new RegExp(`\\| Screen \\| ${절반까지(화)} titles \\| \\*\\*${수꼴(몫(절반까지(화), 화.length))}%\\*\\* \\| ${수꼴(상위10몫(화))}%`).test(원),
      `${절반까지(화)} · ${몫(절반까지(화), 화.length)}% · ${상위10몫(화)}%`);
    본다('③ 절반까지 — 음악', new RegExp(`\\| Music \\| ${절반까지(음)} acts \\| \\*\\*${수꼴(몫(절반까지(음), 음.length))}%\\*\\* \\| \\*\\*${수꼴(상위10몫(음))}%`).test(원),
      `${절반까지(음)} · ${몫(절반까지(음), 음.length)}% · ${상위10몫(음)}%`);
    /* 오징어게임 빼고도 음악이 더 가파른가 — 기사의 뒤집기가 여기에 걸려 있다 */
    const 화2 = [...화].sort((a, b) => b - a).slice(1);
    본다('③ 오징어게임 뺀 값', 한줄.includes(`**${상위10몫(화2)}%**`) && 상위10몫(화2) < 상위10몫(음), `${상위10몫(화2)}% < ${상위10몫(음)}%`);
    const 중앙 = [...음].sort((a, b) => a - b)[Math.floor(음.length / 2)];
    본다('③ 중앙값·0인 것', 한줄.includes(`**${중앙.toLocaleString('en-US')} lookups`) && 음.filter((x) => x === 0).length === 0, `중앙 ${중앙} · 0인 것 ${음.filter((x) => x === 0).length}`);
    본다('③ 두 자를 안 더한다고 말하나', /does not license adding the two numbers together/.test(한줄), '문장 있음');
    본다('③ 영어 문서 없는 팀을 밝히나', /no English Wikipedia article/.test(한줄), '문장 있음');
  }

  if (틀림) { console.error(`\n❌ ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`); process.exit(1); }
  console.log('\n✅ 새 세 편 전부 기사와 자료가 맞는다');
}

/** path.join 을 이 파일 하나 때문에 들여오지 않는다. */
function path0(a, b) { return `${a}/${b}`; }
