/**
 * 「한 지역만 다르다」 기사를 자료에 대고 맞춘다.
 *
 *   one-region-is-not-like-the-others   esports — 다섯은 몰려 있고 하나가 떨어져 있다
 *
 * ⛔ 이 검사가 특히 지키는 것은 **반례**다.
 *    「베테랑이 적으니 연승이 많다」는 그럴듯해서, 다음 사람이 그 문장을 넣고 싶어진다.
 *    자료에 그 설명이 깨지는 두 지역이 박혀 있고, 기사가 그걸 안 말하면 선다.
 *
 * ⚠ 작은 지역(일본 50명)에서 한 명이 몇 포인트인지 안 적으면 움직임을 크게 읽게 된다. 그것도 잡는다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/one-region-is-not-like-the-others.md';
const 자료길 = 'src/data/wikitip-hot-streak.json';

/** 자료가 스스로 맞는지 다시 센다. 적어 둔 값을 그대로 안 믿는다 */
export function 다시무리(rows, 벌어짐 = 5) {
  const s = [...rows].sort((a, b) => a.hotPc - b.hotPc);
  const 무리 = [s[0]];
  for (let i = 1; i < s.length; i++) {
    if (s[i].hotPc - 무리[무리.length - 1].hotPc <= 벌어짐) 무리.push(s[i]); else break;
  }
  return { 무리, 바깥: s.slice(무리.length), 폭: +(무리[무리.length - 1].hotPc - 무리[0].hotPc).toFixed(1) };
}

if (process.argv[1] && process.argv[1].endsWith('check-hot-streak-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  const 본 = [{ hotPc: 18.7 }, { hotPc: 19 }, { hotPc: 30.8 }];
  자가('붙은 것을 무리로', 다시무리(본).무리.length === 2);
  자가('떨어진 것을 바깥으로', 다시무리(본).바깥.length === 1);
  자가('무리 폭', 다시무리(본).폭 === 0.3);
  console.log(`연승 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\s+/g, ' ');
  const 민줄 = 한줄.replace(/\*/g, '');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(38)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 한줄.includes(s), s.length > 40 ? `${s.slice(0, 40)}…` : s);
  /* ⛔ JSON 은 꼬리 0 을 지운다(19.0 → 19). 기사는 표에서 **한 자리로 통일**해 쓴다.
     같은 수인데 자릿수가 달라 「틀렸다」고 하면 자가 사람을 이긴다. 잴 때 한 자리로 맞춘다. */
  const 한자리 = (v) => Number(v).toFixed(1);

  /* ── ① 자료가 스스로 맞나 ── */
  {
    const 재 = 다시무리(d.rows);
    본다('무리 수가 자료와 같나', 재.무리.length === d.cluster.inCluster.length, `${재.무리.length}곳`);
    본다('무리 폭이 자료와 같나', 재.폭 === d.cluster.clusterSpread, `${재.폭}포인트`);
    본다('바깥이 하나인가', 재.바깥.length === 1 && d.cluster.outside.length === 1,
      재.바깥.map((x) => x.region).join(','));
    본다('바깥이 무리보다 얼마나 위인가',
      d.cluster.outside[0].aboveClusterBy === +(재.바깥[0].hotPc - 재.무리[재.무리.length - 1].hotPc).toFixed(1),
      `${d.cluster.outside[0].aboveClusterBy}포인트`);
  }

  /* ── ② 표가 자료와 같나 ── */
  for (const r of [...d.rows].sort((a, b) => a.hotPc - b.hotPc)) {
    const 줄 = `| ${r.region} | ${한자리(r.hotPc)}% | ${한자리(r.veteranPc)}% |`;
    본다(`표 — ${r.region}`, 민줄.includes(줄), 줄.slice(0, 44));
  }
  있나('무리 폭을 적었나', `**${d.cluster.clusterSpread} points wide**`);
  있나('바깥이 얼마나 위인지', `${d.cluster.outside[0].aboveClusterBy} points above the top`);

  /* ── ③ 네 날 다 그런가 ── */
  {
    const 바깥 = d.rows.find((r) => r.region === d.cluster.outside[0].region);
    const 날마다최고 = d.days.every((날) => {
      const 그날 = d.rows.map((r) => r.hotByDay.find((x) => x.day === 날)).filter(Boolean);
      const 최고 = Math.max(...그날.map((x) => x.hotPc));
      return 바깥.hotByDay.find((x) => x.day === 날)?.hotPc === 최고;
    });
    본다('네 날 다 가장 높은가', 날마다최고, `${d.dayCount}일`);
    본다('그 네 값을 적었나',
      한줄.includes(바깥.hotByDay.map((x) => `${x.hotPc}%`).join(', ')), 바깥.hotByDay.map((x) => x.hotPc).join(','));
  }

  /* ── ④ 🔴 반례 — 이 검사의 핵심 ── */
  {
    const ce = d.counterexample;
    본다('반례가 자료에 있나', ce.pair.length === 2 && ce.veteranGap < 1 && ce.hotGap > 10,
      `베테랑 차 ${ce.veteranGap} · 연승 차 ${ce.hotGap}`);
    for (const p of ce.pair) {
      본다(`  반례 표 — ${p.region}`, 민줄.includes(`| ${p.region} | ${한자리(p.veteranPc)}% | ${한자리(p.hotPc)}% |`),
        `${p.veteranPc} / ${p.hotPc}`);
    }
    있나('두 차이를 말했나', `**${ce.veteranGap.toFixed(1)} point${ce.veteranGap === 1 ? '' : 's'} apart on veterans; ${ce.hotGap} points apart`);
    있나('설명이 깨진다고 말했나', 'it is not simply that fewer players stay');
    있나('대신할 설명을 안 낸다고 했나', 'we are not going to invent one');
  }

  /* ── ⑤ 티어별로 다른가 ── */
  {
    const 바깥 = d.rows.find((r) => r.region === d.cluster.outside[0].region);
    const 나머지 = d.rows.filter((r) => r.region !== 바깥.region);
    const 다음챌 = Math.max(...나머지.map((r) => r.hotPc));
    const 다음GM = Math.max(...나머지.map((r) => r.gmHotPc));
    본다('GM 표 — 바깥', 민줄.includes(`| ${바깥.region} | ${한자리(바깥.hotPc)}% | ${한자리(바깥.gmHotPc)}% |`),
      `${바깥.hotPc} / ${바깥.gmHotPc}`);
    본다('GM 표 — 다음', 민줄.includes(`| Next highest region | ${한자리(다음챌)}% | ${한자리(다음GM)}% |`),
      `${다음챌} / ${다음GM}`);
    있나('GM 차이', `**${+(바깥.gmHotPc - 다음GM).toFixed(1)} points**`);
    있나('꼭대기에 있다고 말했나', 'lives in the **top 300**');
  }

  /* ── ⑥ 작은 지역·자리수·멈춘 것 ── */
  {
    const 작은 = [...d.rows].sort((a, b) => a.challengers - b.challengers)[0];
    본다('가장 작은 지역의 한 명 값',
      한줄.includes(`**${작은.challengers} challenger slots**`) && 한줄.includes('two percentage points'),
      `${작은.region} ${작은.challengers}명 · 한 명 ${작은.onePlayerPoints}포인트`);
    const 바깥 = d.rows.find((r) => r.region === d.cluster.outside[0].region);
    본다('자리수를 안 반올림했나', 한줄.includes(`**${바깥.challengers}**`) && 한줄.includes(`**${바깥.gmPlayers}**`),
      `${바깥.challengers} / ${바깥.gmPlayers}`);
    있나('소급이 안 된다고 말했나', 'cannot be backfilled');
    본다('자료에도 멈춤이 적혀 있나', /backfilled/.test(d.stalled), '있다');
  }

  console.log(틀림 ? `\n⛔ 연승 — 안 맞는 것 ${틀림}건` : '\n✅ 연승 — 전부 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
