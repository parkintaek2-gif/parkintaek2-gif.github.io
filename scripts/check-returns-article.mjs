#!/usr/bin/env node
/**
 * 59편째(**돌아온 줄 알았더니 시즌 2**)가 자료와 맞나.
 *
 * ⛔ 오늘 세운 두 규칙 그대로 —
 *   ① 표는 **칸 자리**로 본다 ② 산문의 수는 **경계**로 본다(「940」 안의 94 에 안 뚫린다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/the-return-that-was-a-second-season.md';
const 자료길 = 'src/data/wikitip-returns.json';
const 지면길 = 'src/pages/wikitip/returns.astro';

export function 본문만(원문) {
  const 눌린 = 원문.replace(/\r\n/g, '\n').replace(/−/g, '-');
  const 조각 = 눌린.split(/^---$/m);
  return (조각.length >= 3 ? 조각.slice(2).join('---') : 눌린).replace(/[*_]/g, '');
}

export function 받을꼴(v) {
  const 꼴 = new Set([String(v)]);
  const n = Number(v);
  if (Number.isFinite(n)) {
    꼴.add(String(n));
    꼴.add(n.toLocaleString('en-US'));
    if (Number.isInteger(n)) 꼴.add(n.toFixed(1));
  }
  return [...꼴];
}

export function 낱수있나(글, v) {
  return 받을꼴(v).some((s) => {
    const 뭉갠 = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![0-9.])${뭉갠}(?!\\.?[0-9])`).test(글);
  });
}

export function 칸들(줄) {
  return 줄.split('|').map((c) => c.trim()).filter((c) => c !== '');
}

export function 칸값(칸) {
  return 칸.replace(/\s*\(.*$/, '').replace(/[%p]$/, '').replace(/,/g, '').trim();
}

export function 표줄(본문, 이름, 칸수) {
  return 본문.split('\n')
    .filter((l) => l.trim().startsWith(`| ${이름} |`))
    .filter((l) => 칸들(l).length === 칸수);
}

export function 칸자리(줄, n, v) {
  const c = 칸들(줄);
  if (n >= c.length) return false;
  return 받을꼴(v).map((s) => s.replace(/,/g, '')).includes(칸값(c[n]));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('앞말을 뗀다', !본문만('---\ntitle: "9999"\n---\n본문 12').includes('9999'));
  자가('자리로 본다', 칸자리('| 4 weeks | 940 | 425 |', 1, 940));
  자가('값이 있어도 자리가 다르면 아니다', !칸자리('| 4 weeks | 940 | 425 |', 1, 425));
  자가('자릿점 붙은 칸도 읽는다', 칸자리('| 2 weeks | 1,096 |', 1, 1096));
  자가('표를 칸 수로 가른다', 표줄('| A | 1 |\n| A | 1 | 2 |', 'A', 2).length === 1);
  /* ⛔ 이 두 줄이 오늘 여섯 번 뚫린 자리다 */
  자가('940 안의 94 를 94 로 안 읽는다', !낱수있나('there are 940 gaps', 94));
  자가('낱낱의 수는 읽는다', 낱수있나('94.8% came back alone', 94.8));
  console.log(`복귀 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 원 = fs.readFileSync(기사길, 'utf8');
  const 본 = 본문만(원);
  const 민본 = 본.replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(46)} ${값}`); };

  /* ── 세 갈래 표. 칸 셋 ── */
  const 갈래 = [
    ['Season label changed — a new season, not a return', d.seasonChanged, d.seasonChangedPc],
    ['Same season — the title genuinely came back', d.sameSeason, d.sameSeasonPc],
    ['No season label on one side — we cannot tell', d.unknownSeason, d.unknownSeasonPc],
  ];
  for (const [이름, n, pc] of 갈래) {
    const 줄들 = 표줄(본, 이름, 3);
    본다(`${이름.slice(0, 26)} — 줄`, 줄들.length === 1, `줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    본다(`${이름.slice(0, 26)} — 칸수(2째)`, 칸자리(줄들[0], 1, n), n);
    본다(`${이름.slice(0, 26)} — 몫(3째)`, 칸자리(줄들[0], 2, pc), `${pc}%`);
  }

  /* ── 문턱 표. 칸 다섯 ── */
  for (const t of d.thresholds) {
    const 줄들 = 표줄(본, `${t.weeks} weeks`, 5);
    본다(`문턱 ${t.weeks}주 — 줄`, 줄들.length === 1, `줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    본다(`문턱 ${t.weeks}주 — 틈(2째)`, 칸자리(줄들[0], 1, t.gaps), t.gaps);
    본다(`문턱 ${t.weeks}주 — 바뀜(3째)`, 칸자리(줄들[0], 2, t.seasonChanged), t.seasonChanged);
    본다(`문턱 ${t.weeks}주 — 같음(4째)`, 칸자리(줄들[0], 3, t.sameSeason), t.sameSeason);
    본다(`문턱 ${t.weeks}주 — 못가림(5째)`, 칸자리(줄들[0], 4, t.unknown), t.unknown);
  }

  /* ── 산문 ── */
  본다('잰 칸 수', 낱수있나(본, d.cellsMeasured), d.cellsMeasured.toLocaleString('en-US'));
  본다('틈 수', 낱수있나(본, d.gaps), d.gaps);
  본다('문턱', 낱수있나(본, d.thresholdWeeks), `${d.thresholdWeeks}주`);
  본다('가장 오래 비운 주', 낱수있나(본, Math.max(...d.longestReturns.map((x) => x.gapWeeks))), '223');
  본다('시즌 딱지 몫', 낱수있나(본, d.seasonLabelPc), `${d.seasonLabelPc}%`);
  본다('곁에 새 시즌 수', 낱수있나(본, d.pulledByOtherSeason), d.pulledByOtherSeason);
  본다('곁에 새 시즌 몫', 낱수있나(본, d.pulledByOtherSeasonPc), `${d.pulledByOtherSeasonPc}%`);
  본다('혼자 몫', 낱수있나(본, d.alonePc), `${d.alonePc}%`);
  본다('이어진 칸', 낱수있나(본, d.contiguousCells), d.contiguousCells.toLocaleString('en-US'));
  본다('복귀 작품 수', 낱수있나(본, d.returnTitles.length), d.returnTitles.length);
  본다('시장 수', 낱수있나(본, d.marketCount), d.marketCount);

  /* ⛔ 지켜야 할 말 */
  본다('첫 눈이 틀렸다고 적었나',
    /first thing we saw was wrong/i.test(민본) && /It is a second season/i.test(민본), '223주는 시즌 2였다');
  본다('가설을 죽였다고 적었나',
    /had to drop/i.test(민본) && /not the one we set out to confirm/i.test(민본), '5.2% 뿐이었다');
  본다('못 가린 줄을 밀지 않는다고 적었나',
    /not small print/i.test(민본) && /stay in their own row/i.test(민본), '21.8% 는 따로 둔다');
  본다('문턱이 우리 것이라고 적었나', /our choice, not Netflix/i.test(민본), '4주는 우리가 골랐다');
  본다('까닭을 못 답한다고 적었나',
    /It cannot tell you why/i.test(민본) && /does not publish the reason/i.test(민본), '왜인지는 없다');
  본다('드문 일이라고 적었나', /Returning is the exception/i.test(민본), '트렌드로 안 읽히게');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);

  /* ── 시장 띠 절. ⛔ 기울기를 혼자 내보내지 않는다 ── */
  if (fs.existsSync(지면길) && Array.isArray(d.byMarketBand)) {
    const 면 = fs.readFileSync(지면길, 'utf8').replace(/\r\n/g, '\n');
    const 민면 = 면.replace(/\s+/g, ' ');
    본다('띠 절이 자료를 읽나', /data\.byMarketBand\.map/.test(면), `띠 ${d.byMarketBand.length}개`);
    본다('띠 절이 칸당·기회당을 같이 내나',
      /b\.perCellPc/.test(면) && /b\.perChancePc/.test(면), '두 열이 나란히');
    본다('기회당이 없으면 기울기를 안 판다',
      /per opportunity/i.test(민면) && /artefact of run length/i.test(민면), '착시라고 적었다');
    본다('자가 막는다고 적었나', /1\.5 points/.test(민면), '수집기가 1.5%p 넘으면 거부');
    for (const b of d.byMarketBand) {
      const 손 = new RegExp(`>\\s*${String(b.perChancePc).replace('.', '\\.')}\\s*%`).test(면);
      본다(`띠 「${b.band}」 를 손으로 안 박았나`, !손, `${b.perCellPc}% / ${b.perChancePc}%`);
    }
    const 벌어짐 = Math.max(...d.byMarketBand.map((x) => x.perChancePc))
      - Math.min(...d.byMarketBand.map((x) => x.perChancePc));
    본다('기회당이 평평한가', 벌어짐 <= 1.5, `가장 벌어진 것 ${벌어짐.toFixed(2)}%p`);
  }
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/returns'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/returns"/m.test(원.replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
