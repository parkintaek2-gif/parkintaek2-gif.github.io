#!/usr/bin/env node
/**
 * **남이 우리를 인용할 수 있나** — 계정 없이 손님이 오는 통로가 열려 있나.
 *
 * 🔴 2026-08-09 사장님 경고: 「___ 때문에 안 됩니다」라고 쓰기 전에
 *    **그것이 실제로 막은 사례가 몇 건인지** 재라. 0건이면 까닭이 아니다.
 *
 * ⛔ 그 자를 내 「채널 계정이 없어 0건 나갔다」에 대 봤다. 그 말은 참이다(문안이 못 나갔다).
 *    ⚠ 그런데 **계정 없이 손님이 오는 통로**를 다 챙겼는지는 안 봤었다. 그래서 이 자를 만든다.
 *
 * ⛔ 이 자가 보는 것 — 계정이 하나도 없어도 되는 셋뿐이다
 *    ① RSS 가 있고 **리더가 찾을 수 있나**(head 의 alternate)
 *    ② 지면마다 **인용하는 법**이 있나 — 없으면 남이 우리를 걸 줄을 모른다
 *    ③ 기계가 읽을 딱지(JSON-LD)가 있나
 * ⛔ 라이브가 아니라 **지은 것(dist)** 을 본다 — 배포 전에도 서야 한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 방 = 'dist/wikitip';

/** head 에 RSS 를 걸었나. ⛔ 눈에 보이는 링크만으로는 리더가 못 찾는다 */
export function 리더가찾나(html) {
  return /<link[^>]+rel=["']?alternate["']?[^>]*application\/(rss|atom)\+xml/i.test(html)
    || /<link[^>]+application\/(rss|atom)\+xml[^>]*rel=["']?alternate/i.test(html);
}

/** 인용하는 법이 있나 */
export function 인용안내있나(html) {
  return /Citing this page/i.test(html) && /Please cite as/i.test(html);
}

/** 기계가 읽을 딱지 */
export function 딱지있나(html) {
  return /application\/ld\+json/i.test(html);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('alternate 를 찾는다',
    리더가찾나('<link rel="alternate" type="application/rss+xml" href="/rss.xml">'));
  자가('차례가 바뀌어도 찾는다',
    리더가찾나('<link type="application/rss+xml" rel="alternate" href="/rss.xml">'));
  /* ⛔ 눈에 보이는 링크만 있는 것은 통과가 아니다 — 리더는 head 를 본다 */
  자가('눈에 보이는 링크만이면 아니다', !리더가찾나('<a href="/rss.xml">RSS</a>'));
  자가('인용 안내를 찾는다', 인용안내있나('<b>Citing this page.</b> … Please cite as …'));
  자가('반쪽이면 아니다', !인용안내있나('<b>Citing this page.</b> 그냥 이렇게만'));
  자가('딱지를 찾는다', 딱지있나('<script type="application/ld+json">{}</script>'));
  console.log(`인용 가능 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(방)) {
    console.log(`⬜ 지은 것이 없다 — ${방}. 「안 됐다」가 아니라 **못 쟀다**(빌드 먼저).`);
    process.exit(0);
  }

  /* 표본 — 첫 화면 · 목록 · 자료 지면 하나 · 기사 하나 */
  const 기사방 = `${방}/article`;
  const 기사 = fs.existsSync(기사방)
    ? fs.readdirSync(기사방).filter((f) => f.endsWith('.html')).sort() : [];
  const 볼것 = [
    ['첫 화면', `${방}.html`],
    ['기사 목록', `${방}/articles.html`],
    ['자료 지면', `${방}/rank-tells.html`],
    ['자료 착륙', `${방}/data.html`],
    ...(기사.length ? [['기사 하나', `${기사방}/${기사[0]}`]] : []),
  ].filter(([, p]) => fs.existsSync(p));

  if (!볼것.length) { console.log('⬜ 볼 지면이 없다 — 못 쟀다'); process.exit(0); }

  let 틀림 = 0;
  console.log(`인용 가능 검사 — 지면 ${볼것.length}장`);
  for (const [이름, p] of 볼것) {
    const h = fs.readFileSync(p, 'utf8');
    const a = 리더가찾나(h); const b = 인용안내있나(h); const c = 딱지있나(h);
    if (!a || !b) 틀림 += 1;
    console.log(`  ${a && b ? '  ' : '❌'} ${이름.padEnd(10)} RSS ${a ? '✅' : '❌'} · 인용안내 ${b ? '✅' : '❌'} · 기계딱지 ${c ? '✅' : '⬜'}`);
  }

  /* RSS 자체 */
  const rss = `${방}/rss.xml`;
  if (fs.existsSync(rss)) {
    const 글 = (fs.readFileSync(rss, 'utf8').match(/<item>/g) || []).length;
    console.log(`  ${글 ? '  ' : '❌'} RSS 안의 글 ${글}편`);
    if (!글) 틀림 += 1;
  } else {
    console.log('  ❌ rss.xml 이 없다');
    틀림 += 1;
  }

  console.log(틀림 ? `\n⛔ 막힌 통로 ${틀림}건 — 계정이 없어도 이건 우리가 여는 것이다`
    : '\n✅ 계정 없이 손님이 올 통로가 다 열려 있다');
  process.exit(틀림 ? 1 : 0);
}
