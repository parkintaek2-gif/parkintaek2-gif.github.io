#!/usr/bin/env node
/**
 * collect-kcw-korea-vs-english.mjs — **한국에서 큰 사람이 영어권에서도 큰가.**
 *
 * ── 왜 만드나 (2026-09-05) ──────────────────────────────────
 * 오늘 밤 네이버·다음 연예면 머리에 이것이 올라왔다 —
 *   「임영웅 10주년 콘서트, 고양종합운동장 사흘에 약 9만 5천 명」
 *
 * ⭐ 우리 손님은 영어권이다. 그래서 물음이 이렇게 선다 —
 *   **「국내 스타디움을 사흘 채우는 사람이 영어권에서는 몇 명에게 읽히는가.」**
 *   이것은 우리 축(위키백과 열람수)이 «한국어와 영어를 나란히» 잴 수 있어서 답이 나온다.
 *
 * ⛔ 「덜 유명하다」고 말하지 않는다. 우리가 재는 것은 **어느 말로 읽히나** 하나다.
 * ⛔ 두 수를 더하지 않는다 — 한 사람이 두 문서를 다 열 수 있어 더할 수 없는 둘이다.
 * ⛔ 콘서트 관객 수는 «남의 수»다. 온 까닭이지 우리 증거가 아니다.
 *
 * 쓰는 법
 *   node scripts/collect-kcw-korea-vs-english.mjs --자가시험
 *   node scripts/collect-kcw-korea-vs-english.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(__dirname, '..');
const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-korea-vs-english.json');

/**
 * 잴 사람 — **한국에서 크게 도는 갈래 둘**을 나란히 둔다.
 *   트로트  국내 공연·방송에서 가장 크게 도는 갈래인데 영문 매체가 거의 안 다룬다
 *   아이돌  영문 매체가 가장 많이 다루는 갈래
 * ⚠ 「누가 유명한가」로 고른 것이 아니라 **「어느 갈래가 어느 말로 읽히나」**를 보려고 짝지은 것이다.
 */
export const 사람들 = [
  { en: 'Lim Young-woong', ko: '임영웅', label: 'Lim Young-woong', 갈래: 'Trot' },
  { en: 'Young Tak', ko: '영탁', label: 'Young Tak', 갈래: 'Trot' },
  { en: 'Jang Min-ho', ko: '장민호 (가수)', label: 'Jang Minho', 갈래: 'Trot' },
  { en: 'Jimin', ko: '지민 (가수)', label: 'Jimin', 갈래: 'Idol' },
  { en: 'Rosé (singer)', ko: '로제 (가수)', label: 'Rosé', 갈래: 'Idol' },
  { en: 'IU (singer)', ko: '아이유', label: 'IU', 갈래: 'Solo' },
];

/** ⛔ 평균이 아니라 중간값 — 컴백 하루가 평균을 통째로 민다 */
export function 중간값(수들) {
  const s = [...수들].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/**
 * 한국어 대 영어 — **몇 곱절인가.**
 * ⛔ 「몫」으로 내지 않는다. 두 수는 서로 겹칠 수 있어 하나의 전체를 이루지 않는다.
 */
export function 곱절(한국어, 영어) {
  if (!Number.isFinite(한국어) || !Number.isFinite(영어) || 영어 === 0) return null;
  const v = 한국어 / 영어;
  /**
   * 🔴 [2026-09-05] 한 자리로 반올림했더니 지민(61/2091 = 0.029)이 **「0배」**로 찍혔다.
   *   0 은 「한국어로 아무도 안 읽는다」는 뜻이 되는데 그것은 사실이 아니다 —
   *   하루 61명이 읽는다. **반올림이 0 을 만들면 그것은 수가 아니라 거짓말이다.**
   * ⭐ 그래서 1 보다 작으면 자리를 더 준다. 화면에서는 뒤집어 「영어가 몇 곱절」로 말한다.
   */
  if (v < 1) return Math.round(v * 1000) / 1000;
  return Math.round(v * 10) / 10;
}

/** 1 보다 작을 때 뒤집어 읽는다 — 「영어가 한국어의 몇 곱절」 */
export function 뒤집은곱절(한국어, 영어) {
  if (!Number.isFinite(한국어) || !Number.isFinite(영어) || 한국어 === 0) return null;
  return Math.round((영어 / 한국어) * 10) / 10;
}

/** 문서가 사람인가 — 동음이의로 넘어간 것을 잡는다 */
export function 사람문서인가(요약) {
  const 설명 = String(요약?.description ?? '');
  if (!설명) return { 맞다: false, 까닭: '설명이 비었다' };
  if (/동음이의|disambiguation|may refer to|Topics referred to/i.test(설명)) {
    return { 맞다: false, 까닭: `동음이의 문서다 — 「${설명}」` };
  }
  if (!/(singer|actor|actress|가수|배우|rapper|entertainer|방송인)/i.test(설명)) {
    return { 맞다: false, 까닭: `사람 문서가 아니다 — 「${설명}」` };
  }
  return { 맞다: true, 까닭: 설명 };
}

export function 여덟자리(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

async function 요약받기(위키, 제목) {
  const r = await fetch(`https://${위키}.wikipedia.org/api/rest_v1/page/summary/`
    + encodeURIComponent(제목.replace(/ /g, '_')),
  { headers: { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' } });
  return r.ok ? r.json() : null;
}

async function 열람받기(위키, 제목, 처음, 끝) {
  const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${위키}.wikipedia/all-access/user/`
    + encodeURIComponent(제목.replace(/ /g, '_')) + `/daily/${처음}/${끝}`;
  const r = await fetch(u, { headers: { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.items ?? []).map((x) => ({ date: String(x.timestamp).slice(0, 8), views: x.views }));
}

/* ── 자가시험 ───────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실 = []; let 통 = 0;
  const 같나 = (이름, 본, 기대) => {
    const a = JSON.stringify(본); const b = JSON.stringify(기대);
    if (a === b) 통 += 1; else 실.push(`${이름}: ${a} ≠ ${b}`);
  };

  같나('중간값 홀수', 중간값([5, 1, 3]), 3);
  같나('중간값 짝수', 중간값([1, 3]), 2);
  같나('중간값 빈 것은 null 이지 0 이 아니다', 중간값([]), null);
  같나('중간값은 하루 튄 것에 안 밀린다', 중간값([10, 11, 12, 9, 90000]), 11);

  같나('곱절을 한 자리로 낸다', 곱절(300, 100), 3);
  같나('1 보다 작아도 그대로 낸다', 곱절(50, 100), 0.5);
  같나('⛔ 영어가 0 이면 null 이다(무한대로 적지 않는다)', 곱절(300, 0), null);
  같나('⛔ 한쪽이 없으면 null 이다', 곱절(null, 100), null);
  /* 🔴 반올림이 0 을 만들면 그것은 수가 아니라 거짓말이다 */
  같나('1 보다 작으면 자리를 더 준다 — 0 으로 뭉개지 않는다', 곱절(61, 2091), 0.029);
  같나('뒤집으면 영어가 몇 곱절인지 나온다', 뒤집은곱절(61, 2091), 34.3);
  같나('⛔ 한국어가 0 이면 뒤집을 수 없다', 뒤집은곱절(0, 100), null);

  같나('한국어 설명의 가수를 사람으로 본다', 사람문서인가({ description: '대한민국의 가수' }).맞다, true);
  같나('영어 설명의 singer 도 사람이다', 사람문서인가({ description: 'South Korean singer (born 1991)' }).맞다, true);
  같나('트로트 가수도 사람이다', 사람문서인가({ description: '대한민국의 트로트 가수' }).맞다, true);
  /* 🔴 실제로 걸린 것 — ko 「정국」이 동음이의 문서였다 */
  같나('⛔ 한국어 동음이의 문서를 사람으로 세지 않는다',
    사람문서인가({ description: '위키미디어 동음이의어 문서' }).맞다, false);
  같나('⛔ 영어 동음이의도 마찬가지', 사람문서인가({ description: 'Topics referred to by the same term' }).맞다, false);
  같나('⛔ 설명이 없으면 안 맞다로 둔다', 사람문서인가({}).맞다, false);

  같나('여덟자리', 여덟자리(new Date('2026-09-05T23:00:00')), '20260905');
  같나('사람마다 두 말이 다 있다', 사람들.every((p) => p.en && p.ko), true);
  같나('트로트와 아이돌을 나란히 뒀다',
    [...new Set(사람들.map((p) => p.갈래))].sort(), ['Idol', 'Solo', 'Trot']);

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 한국어 대 영어 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

/* ── 실제로 받는다 ───────────────────────────────────────────── */
if (내가실행됐다) {
  const 오늘 = new Date();
  const 끝 = 여덟자리(오늘);
  const 처음 = 여덟자리(new Date(오늘.getTime() - 60 * 86400e3));

  const 줄들 = []; const 못잰것 = [];
  for (const p of 사람들) {
    const 영요약 = await 요약받기('en', p.en);
    const 한요약 = await 요약받기('ko', p.ko);
    if (!영요약) { 못잰것.push(`${p.label} — no English Wikipedia article`); continue; }
    if (!한요약) { 못잰것.push(`${p.label} — no Korean Wikipedia article`); continue; }
    const a = 사람문서인가(영요약); const b = 사람문서인가(한요약);
    if (!a.맞다) { 못잰것.push(`${p.label} (en) — ${a.까닭}`); continue; }
    if (!b.맞다) { 못잰것.push(`${p.label} (ko) — ${b.까닭}`); continue; }

    const 영줄 = await 열람받기('en', 영요약.title, 처음, 끝);
    const 한줄 = await 열람받기('ko', 한요약.title, 처음, 끝);
    if (!영줄.length || !한줄.length) { 못잰것.push(`${p.label} — no pageview rows`); continue; }

    const 영 = 중간값(영줄.slice(-30).map((x) => x.views));
    const 한 = 중간값(한줄.slice(-30).map((x) => x.views));
    줄들.push({
      label: p.label, kind: p.갈래,
      enTitle: 영요약.title, koTitle: 한요약.title,
      enReads: 영, koReads: 한, times: 곱절(한, 영), timesEnglish: 뒤집은곱절(한, 영),
    });
    console.log(`✅ ${p.label.padEnd(16)} ${p.갈래.padEnd(5)} 한국어 ${String(한).padStart(6)} · 영어 ${String(영).padStart(6)} → ${곱절(한, 영)}배`);
  }

  줄들.sort((a, b) => (b.times ?? 0) - (a.times ?? 0));
  const 트로트 = 줄들.filter((r) => r.kind === 'Trot');
  const 아이돌 = 줄들.filter((r) => r.kind !== 'Trot');

  const 낼것 = {
    measuredAt: 오늘.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    source: 'Wikimedia Pageviews API — ko.wikipedia and en.wikipedia, all-access, user agents only (bots excluded)',
    measures: 'Median daily Wikipedia reads over the last 30 days, Korean edition against English edition, '
      + 'for the same person',
    trotMedianTimes: 중간값(트로트.map((r) => r.times)),
    otherMedianTimes: 중간값(아이돌.map((r) => r.times)),
    notMeasured: [
      'Concert attendance, sales or streams. Those are other people\'s figures and we did not count them',
      'How well known anyone is. This counts which language an encyclopedia page is opened in, nothing else',
      'A share of one audience. One reader can open both pages, so the two counts cannot be added',
      'Six people is a small set, chosen to put two kinds side by side rather than to represent an industry',
    ],
    unmeasured: 못잰것,
    rows: 줄들,
  };
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2) + '\n', 'utf8');
  console.log(`\n📁 적었다 — ${path.relative(뿌리, 낼곳)}`);
  console.log(`   트로트 중간값 ${낼것.trotMedianTimes}배 · 그 밖 ${낼것.otherMedianTimes}배`);
  for (const s of 못잰것) console.log(`   ⬜ ${s}`);
}
