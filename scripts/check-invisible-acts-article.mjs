/**
 * 「우리 K팝 표가 못 보는 사람」 기사와 고친 /data 를 자료에 대고 맞춘다.
 *
 *   the-acts-our-k-pop-panel-cannot-see   music — 못 센다고 적어 두고 안 세어 봤다
 *
 * ⛔ 이 검사가 지키는 것은 **바닥이라는 말**이다.
 *    수가 맞아도 「이게 전부다」로 읽히면 틀린 글이 된다 —
 *    위키데이터에도 없는 사람은 여전히 못 센다. 그 문장이 사라지면 선다.
 *
 * ⚠ 못 물은 칸은 **null 이지 0 이 아니다.** 0 으로 바뀌면 「보고 없었다」가 되어
 *    안 본 것을 본 것처럼 말하게 된다. 그것도 잡는다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/the-acts-our-k-pop-panel-cannot-see.md';
const 지면길 = 'src/pages/wikitip/data.astro';
const 자료길 = 'src/data/wikitip-kpop-invisible.json';
const 패널길 = 'src/data/wikitip-kpop.json';
const 정정길 = 'src/data/wikitip-page-corrections.json';

const 천 = (n) => Number(n).toLocaleString('en-US');
/** 빠진 수와 비율을 자료에서 **다시 센다.** 자료가 적어 둔 값을 그대로 믿지 않는다 */
export function 다시센다(row) {
  if (row.all === null || row.withEn === null) return null;
  return { missing: row.all - row.withEn, missingPc: +((100 * (row.all - row.withEn)) / row.all).toFixed(1) };
}

if (process.argv[1] && process.argv[1].endsWith('check-invisible-acts-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('빠진 수를 다시 센다', 다시센다({ all: 2128, withEn: 816 }).missing === 1312);
  자가('비율을 한 자리로', 다시센다({ all: 2128, withEn: 816 }).missingPc === 61.7);
  자가('못 물은 것은 null', 다시센다({ all: null, withEn: 816 }) === null);
  console.log(`안 보이는 사람 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const k = JSON.parse(fs.readFileSync(패널길, 'utf8'));
  const c = JSON.parse(fs.readFileSync(정정길, 'utf8'));
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\s+/g, ' ');
  /**
   * 굵게 하는 것은 **편집 판단**이다. 어느 칸을 굵게 쓸지까지 자가 정하면 자가 사람을 이긴다.
   * ⛔ 처음에 `**109**` 로 찾다가 굵지 않은 칸 셋을 「틀렸다」고 했다. 기사는 멀쩡했다.
   *   표를 맞출 때는 별표를 걷고 본다. 수가 맞는지만 본다.
   */
  const 민줄 = 한줄.replace(/\*/g, '');
  const 지면 = fs.readFileSync(지면길, 'utf8');
  const 행 = Object.fromEntries(d.rows.map((r) => [r.key, r]));

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(38)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 한줄.includes(s), s.length > 42 ? `${s.slice(0, 42)}…` : s);

  /* ── ① 우리 패널과 자료가 서로 맞나. 이게 이 셈의 검산이다 ── */
  본다('그룹 수가 패널과 같나', 행.groups.withEn === k.groups.n,
    `자료 ${행.groups.withEn} · 패널 ${k.groups.n}`);
  있나('그 검산을 적었나', 'the two queries agree without being told to');
  있나('패널 크기', `**${천(k.roster)} rows**`);
  있나('그룹·사람 나눔', `${천(k.groups.n)} groups and ${천(k.people.n)} people`);

  /* ── ② 갈래마다 수가 자료와 같나. 자료 값이 아니라 **다시 센 값**과 맞춘다 ── */
  for (const r of d.rows) {
    const 재 = 다시센다(r);
    if (재 === null) { 본다(`${r.label} — 못 물은 갈래`, r.all === null || r.withEn === null, '건너뛴다'); continue; }
    본다(`${r.label} 자료가 스스로 맞나`, r.missing === 재.missing && r.missingPc === 재.missingPc,
      `${천(재.missing)} · ${재.missingPc}%`);
    const 줄 = `| ${r.label} | ${천(r.all)} | ${천(r.withEn)} | ${천(재.missing)} | ${재.missingPc}% |`;
    본다(`${r.label} 표 줄`, 민줄.includes(줄), 줄.slice(0, 46));
  }

  /* ── ③ 한국어 문서는 있는데 영어가 없는 사람 ── */
  본다('가수의 한국어 문서', 민줄.includes(`${천(행.singer.koNotEn)} have a Korean Wikipedia article`), 천(행.singer.koNotEn));
  본다('작곡가·래퍼도 적었나',
    한줄.includes(`${천(행.composer.koNotEn)} of the ${천(다시센다(행.composer).missing)} missing composers`)
    && 한줄.includes(`${천(행.rapper.koNotEn)} of the ${천(다시센다(행.rapper).missing)} missing rappers`),
    `작곡가 ${행.composer.koNotEn} · 래퍼 ${행.rapper.koNotEn}`);

  /* ── ④ 못 물은 칸 — null 이지 0 이 아니다 ── */
  본다('그룹 한국어 칸이 null 인가', 행.groups.koNotEn === null, String(행.groups.koNotEn));
  있나('못 물었다고 적었나', 'HTTP 504 three times');
  있나('null 과 0 을 갈랐나', 'is `null`, not `0`');

  /* ── ⑤ 바닥이라고 말하나 — 이 검사의 핵심 ── */
  있나('바닥이라고 말하나', 'a floor on what we miss, not a total');
  본다('자료에도 한계가 적혀 있나', /floor, not a total/.test(d.limit), d.limit.slice(0, 40));
  있나('겹치는 갈래를 안 더한다고 말하나', 'they are never added together');
  본다('자료가 겹침을 경고하나', /must not be summed/.test(d.overlapWarning), '있다');
  있나('까닭을 모른다고 말하나', 'we cannot explain it from these counts');

  /* ── ⑥ 지면이 고쳐졌나 ── */
  {
    const 본문 = 지면.replace(/<!--[\s\S]*?-->/g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    본다('옛 문장이 지면에서 사라졌나', !본문.includes('we cannot say how many there are'),
      본문.includes('we cannot say how many there are') ? '남았다' : '없다');
    본다('지면이 새 자료를 읽나', 지면.includes('wikitip-kpop-invisible.json'), '읽는다');
    본다('지면이 기사로 가는 길을 내나', 본문.includes('/article/the-acts-our-k-pop-panel-cannot-see'), '있다');
  }

  /* ── ⑦ 정정 기록 ── */
  {
    const row = c.rows.find((r) => r.path === '/data' && r.cause === 'limit-never-tested');
    본다('지면 정정이 기록됐나', !!row, row ? row.date : '없다');
    본다('그 원인이 사전에 있나', !!c.causes['limit-never-tested'], '있다');
    본다('기사도 기록됐나', c.articleCauses.some((a) => a.slug === 'the-acts-our-k-pop-panel-cannot-see'), '있다');
  }

  console.log(틀림 ? `\n⛔ 안 보이는 사람 — 안 맞는 것 ${틀림}건` : '\n✅ 안 보이는 사람 — 전부 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
