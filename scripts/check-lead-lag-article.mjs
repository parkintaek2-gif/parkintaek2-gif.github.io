#!/usr/bin/env node
/**
 * 63편째(**하나의 줄**)가 자료와 맞나.
 *
 * ⛔ 이 자의 요점 두 개 —
 *   ① **물음이 성립하는지부터 적었나.** 57.6% 가 같은 주에 뜬다는 것을 뒤로 미루면
 *      「이웃이 신호다」를 파는 셈이 된다.
 *   ② **순위표를 안 만들었나.** 나라 순서를 지면·기사 어디에도 안 냈는지 본다.
 * ⛔ CRLF 를 먼저 누른다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/one-queue-not-a-signal.md';
const 자료길 = 'src/data/wikitip-lead-lag.json';
const 지면길 = 'src/pages/wikitip/lead-lag.astro';

export function 본문만(원문) {
  const 눌린 = String(원문).replace(/\r\n/g, '\n').replace(/−/g, '-');
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
    return new RegExp(`(?<![0-9.,])${뭉갠}(?![0-9.,]?[0-9])`).test(글);
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

/**
 * 나라를 줄세운 자리가 있나. ⛔ 이 매체가 안 하기로 한 것이다.
 * ⚠ iso2 두 글자가 **세 개 넘게 이어 나오면** 순위표로 본다(짝 「AE–AR」은 둘이라 안 걸린다).
 */
export function 줄세움있나(글) {
  return /(?:^|[\s(>])[A-Z]{2}(?:\s*[,·]\s*[A-Z]{2}){3,}/m.test(글);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('앞말을 뗀다', !본문만('---\ntitle: "9999"\n---\n본문 12').includes('9999'));
  자가('CRLF 앞말도 뗀다', !본문만('---\r\ntitle: "9999"\r\n---\r\n본문 12').includes('9999'));
  자가('자리로 본다', 칸자리('| A | 77,385 | 57.6% |', 1, 77385));
  자가('값이 있어도 자리가 다르면 아니다', !칸자리('| A | 77,385 | 57.6% |', 1, 57.6));
  /* ⛔ 8,593 안의 859 에 안 뚫린다 */
  자가('8,593 안의 859 를 859 로 안 읽는다', !낱수있나('8,593 triples', 859));
  자가('자릿점 붙은 수를 읽는다', 낱수있나('there are 8,593 of them', 8593));
  자가('소수도 읽는다', 낱수있나('sits 42.3 points from even', 42.3));
  /* 🔴 이 두 줄이 이 자의 요점이다 — 순위표를 안 만들었나 */
  자가('나라를 넷 이어 적으면 잡는다', 줄세움있나('fastest: US, GB, CA, AU, NZ'));
  자가('짝 하나는 안 잡는다', !줄세움있나('the pair AE–AR is lopsided'));
  자가('가운뎃점 나열도 잡는다', 줄세움있나('KR · JP · TH · VN · ID'));
  console.log(`앞뒤 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  if (!fs.existsSync(자료길)) { console.log(`⬜ 자료가 없다 — ${자료길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 원 = fs.readFileSync(기사길, 'utf8');
  const 본 = 본문만(원);
  const 민본 = 본.replace(/\s+/g, ' ');
  const 나라수 = new Set(d.pairs.flatMap((x) => x.pair.split('–'))).size;
  const 고리 = d.triangles - d.transitiveTriangles;

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(44)} ${값}`); };

  /* ── 같은 주 표. 칸 셋 ── */
  {
    const ㄱ = 표줄(본, 'Arrived in both the same week', 3);
    const ㄴ = 표줄(본, 'One came first', 3);
    본다('같은 주 — 줄', ㄱ.length === 1, `줄 ${ㄱ.length}개`);
    if (ㄱ.length === 1) {
      본다('같은 주 — 수', 칸자리(ㄱ[0], 1, d.sameWeek), d.sameWeek.toLocaleString('en-US'));
      본다('같은 주 — 몫', 칸자리(ㄱ[0], 2, d.sameWeekPc), `${d.sameWeekPc}%`);
    }
    본다('먼저 온 것 — 줄', ㄴ.length === 1, `줄 ${ㄴ.length}개`);
    if (ㄴ.length === 1) {
      본다('먼저 온 것 — 수', 칸자리(ㄴ[0], 1, d.observations - d.sameWeek),
        (d.observations - d.sameWeek).toLocaleString('en-US'));
    }
  }

  /* ── 쏠림 띠 표. 칸 둘 ── */
  for (const b of d.skewBands) {
    const 줄들 = 표줄(본, b.band, 2);
    본다(`띠 ${b.band.slice(0, 24)}`, 줄들.length === 1 && 칸자리(줄들[0], 1, b.pairs), b.pairs);
  }

  /* ── 산문 ── */
  본다('관측 수', 낱수있나(본, d.observations), d.observations.toLocaleString('en-US'));
  본다('작품 수', 낱수있나(본, d.titlesInTwoOrMoreMarkets), d.titlesInTwoOrMoreMarkets);
  본다('잰 짝 수', 낱수있나(본, d.pairsMeasured), d.pairsMeasured);
  본다('전체 짝 수', 낱수있나(본, d.countryPairsObserved), d.countryPairsObserved.toLocaleString('en-US'));
  본다('삼각 수', 낱수있나(본, d.triangles), d.triangles.toLocaleString('en-US'));
  본다('이행 수', 낱수있나(본, d.transitiveTriangles), d.transitiveTriangles.toLocaleString('en-US'));
  본다('나라 수', 낱수있나(본, 나라수), 나라수);
  본다('쏠림 중앙값', 낱수있나(본, d.medianSkew), d.medianSkew);
  본다('문턱', 낱수있나(본, d.minimumTitlesPerPair), `${d.minimumTitlesPerPair}편`);
  본다('주 수', 낱수있나(본, d.weeksSpanned), d.weeksSpanned);
  /* 🔴 2026-08-23 — 여기 「Two」가 박혀 있었다. 고리가 둘에서 하나로 줄자 기사를 사실대로
     고쳤는데 자가 옛 수를 요구해 울었다. **낱말도 자료에서 만든다.** */
  const 고리낱말 = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five'];
  본다('고리 수를 적었나',
    new RegExp(`(${고리낱말[고리] ?? 고리}|${고리}) forms? a loop`, 'i').test(민본),
    `${고리}개`);

  /* ⛔ 지켜야 할 말 */
  본다('🔴 성립하는지부터 적었나',
    /Before asking who leads/i.test(민본) && /nothing to lead/i.test(민본), '같은 주가 먼저 온다');
  본다('신호와 줄을 갈랐다고 적었나',
    /It is not a signal\. It is a queue/i.test(민본) && /loops should be impossible/i.test(민본), '이행성으로 갈랐다');
  본다('죽은 가설을 그대로 실었나',
    /the answer to the scheduler's question is no/i.test(민본), '이웃은 신호가 아니다');
  본다('순위를 안 낸다고 적었나',
    /not printing the order/i.test(민본) && /league table/i.test(민본), '줄세우기를 안 한다');
  본다('까닭을 못 답한다고 적었나',
    /cannot tell you why/i.test(민본) && /chart entry, not a release/i.test(민본), '왜인지는 없다');
  본다('문턱이 우리 것이라고 적었나', /our\s*threshold, not a property of the data/i.test(민본), '20편은 우리가 골랐다');

  /* 🔴 말만 하고 실제로 줄세웠으면 잡는다 */
  본다('기사에 나라 순위표가 없나', !줄세움있나(본), 'iso2 넷 이어 적기 없음');
  if (fs.existsSync(지면길)) {
    const 면 = fs.readFileSync(지면길, 'utf8').replace(/\r\n/g, '\n');
    본다('지면에도 나라 순위표가 없나', !줄세움있나(면), 'iso2 넷 이어 적기 없음');
    본다('지면이 짝 목록을 통째로 안 뿌리나', !/data\.pairs\.map/.test(면), '946짝을 안 나열한다');
  }

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/lead-lag'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/lead-lag"/m.test(원.replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
