#!/usr/bin/env node
/**
 * 🔗 **짧은 주소 자** — `/y/<이름>` 이 진짜로 사는지 잰다.
 *
 * ## 🔴 왜 (2026-08-10 · 2번 지시)
 *
 *   유튜브 227회에서 0명이 왔다. 까닭 셋 중 **고칠 수 있는 하나**가 이것이었다 —
 *   설명란 주소 셋 중 둘이 한글이라 **잘려 보인다**. 잘린 주소는 옮겨 칠 수도 없다.
 *
 * ## ⚠ 이 자가 재는 것과 **못 재는 것**
 *
 *   ```
 *   ✅ 짧은 주소가 라이브에서 200 인가
 *   ✅ 그 지면이 **어디로 보내는가** — 글자에서 도로 캐내서 목적지와 맞춰 본다
 *   ✅ 목적지 자체가 라이브에서 200 인가   ← 이게 없으면 「짧은 주소는 200 인데 빈 방」이다
 *   ✅ 주소에 아스키 아닌 글자가 없나      ← 잘리는 진짜 까닭
 *   ⛔ **손님이 눌렀는지는 못 잰다.** 그건 로그가 하는 일이다
 *   ⛔ **유튜브 설명이 바뀌었는지도 못 잰다.** 그건 사장님 손이다
 *   ```
 *
 * ```bash
 * node scripts/check-100y-short-links.mjs --자가시험     # 자를 먼저 잰다
 * node scripts/check-100y-short-links.mjs               # 라이브에서 잰다
 * node scripts/check-100y-short-links.mjs --여기 http://127.0.0.1:4321
 * ```
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ⚠ 윈도 절대경로는 import() 가 「protocol 'c:'」로 거부한다. 상대경로로 부른다 */
const { 짧은주소들, 물음표뗀곳 } = await import('../src/lib/short-links.ts');

/** 아스키 밖 글자가 있나 — 유튜브·카톡·문자에서 잘리는 진짜 까닭 */
export function 아스키냐(주소) {
  return /^[\x21-\x7e]+$/.test(주소);
}

/** 지면 글자에서 **진짜 가는 곳**을 도로 캐낸다 — 우리가 적어 둔 값을 믿지 않는다 */
export function 가는곳캐기(글) {
  const 새로고침 = 글.match(/http-equiv=["']refresh["'][^>]*content=["']\s*\d+\s*;\s*url=([^"']+)["']/i)?.[1];
  const 링크 = 글.match(/<a[^>]+href=["']([^"']+)["']/i)?.[1];
  const 자바 = 글.match(/location\.replace\(\s*["']([^"']+)["']\s*\)/)?.[1];
  return { 새로고침, 링크, 자바 };
}

/** 셋이 다 같은 곳을 보나 — 하나만 어긋나도 손님이 갈리는 자리다 */
export function 셋이같나(캔것) {
  const 값들 = [캔것.새로고침, 캔것.링크, 캔것.자바].filter(Boolean);
  return 값들.length === 3 && new Set(값들).size === 1;
}

/** 검색에 담지 말라고 말하고 있나 — 진짜 지면과 겨루면 안 된다 */
export function 담지말라했나(글) {
  return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(글);
}

/* ── 자가시험 ────────────────────────────────────────────────── */
function 자가시험() {
  const 결과 = [];
  const 잰다 = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  잰다('① 아스키만 있는 주소를 통과시킨다', 아스키냐('/y/jongno'));
  잰다('② 한글이 든 주소를 잡아낸다', !아스키냐('/report/area/서울특별시-종로구'));
  잰다('③ 빈칸이 든 주소를 잡아낸다', !아스키냐('/y/jong no'));

  const 본 = `<meta name="robots" content="noindex, nofollow" />
    <meta http-equiv="refresh" content="0; url=/age/32?from=yt-100y&at=age" />
    <a href="/age/32?from=yt-100y&at=age">가기</a>
    <script>location.replace("/age/32?from=yt-100y&at=age");</script>`;
  const 캔것 = 가는곳캐기(본);
  잰다('④ 새로고침·링크·자바 셋을 다 캐낸다', 캔것.새로고침 && 캔것.링크 && 캔것.자바);
  잰다('⑤ 셋이 같으면 같다고 한다', 셋이같나(캔것));
  잰다('⑥ 하나가 어긋나면 잡아낸다',
    !셋이같나(가는곳캐기(본.replace('<a href="/age/32?from=yt-100y&at=age"', '<a href="/age/33"'))));
  잰다('⑦ noindex 를 읽는다', 담지말라했나(본));
  잰다('⑧ noindex 가 없으면 없다고 한다', !담지말라했나('<meta name="robots" content="index" />'));

  /* ⛔ 명단 자체를 잰다 — 자가 아무리 정확해도 명단이 틀리면 소용없다 */
  잰다('⑨ 짧은 주소 키가 다 아스키다', 짧은주소들.every((x) => /^[a-z0-9-]+$/.test(x.키)));
  잰다('⑩ 키가 겹치지 않는다', new Set(짧은주소들.map((x) => x.키)).size === 짧은주소들.length);
  잰다('⑪ 가는 곳이 다 우리 지면 안이다', 짧은주소들.every((x) => x.가는곳.startsWith('/') && !x.가는곳.startsWith('//')));
  잰다('⑫ 딱지가 **하나도 빠짐없이** 붙어 있다', 짧은주소들.every((x) => /[?&]from=yt-100y&at=/.test(x.가는곳)));
  잰다('⑬ 짧은 주소가 짧은 주소로 보내지 않는다', 짧은주소들.every((x) => !x.가는곳.startsWith('/y/')));
  잰다('⑭ 물음표뗀곳 이 물음표 뒤를 뗀다', 물음표뗀곳('/age/32?from=yt-100y') === '/age/32');
  /* 🔴 자가 거짓 404 를 냈던 자리다. 두 번 감싸면 %25 가 되어 없는 지면이 된다 */
  잰다(
    '⑯ 이미 감싸인 주소를 **또 감싸지 않는다**',
    한번만감싸기('/report/area/%EC%84%9C%EC%9A%B8') === '/report/area/%EC%84%9C%EC%9A%B8',
  );
  잰다('⑰ 안 감싸인 한글은 감싼다', 한번만감싸기('/report/area/서울') === '/report/area/%EC%84%9C%EC%9A%B8');
  잰다(
    '⑱ 짧은 주소 넷의 목적지가 다 한 번만 감싸여 있다',
    짧은주소들.every((x) => 한번만감싸기(물음표뗀곳(x.가는곳)) === 물음표뗀곳(x.가는곳)),
  );
  잰다('⑮ 밖에 적은 자리를 다 적어 뒀다', 짧은주소들.every((x) => x.적은곳 && x.말));

  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  const 진 = 결과.filter((r) => !r.참).length;
  console.log(`\n자가시험 ${결과.length - 진}/${결과.length}`);
  return 진 === 0;
}

/* ── 라이브에서 재기 ─────────────────────────────────────────── */

/**
 * 🔴 **두 번 감싸지 않는다** — 이 자가 처음에 「그 방 404」를 냈는데 **거짓이었다.**
 *
 *   ```
 *   가는곳 = /report/area/%EC%84%9C…   ← short-links.ts 가 이미 감싸 뒀다
 *   encodeURI(그것)  →  /report/area/%25EC%84%9C…   🔴 % 가 %25 로 또 감싸진다
 *   ```
 *   손으로 다시 재 보니 그 지면은 **200** 이었다. 자가 틀렸던 것이다.
 * ⚠ 그래서 **이미 감싸인 것은 그대로 두고**, 아스키 아닌 글자가 있을 때만 감싼다.
 */
export function 한번만감싸기(길) {
  const s = String(길);
  if (/%[0-9A-Fa-f]{2}/.test(s)) return s; /* 이미 감싸여 있다 */
  return encodeURI(s);
}

async function 두드리기(주소) {
  try {
    const r = await fetch(주소, { redirect: 'manual', headers: { 'User-Agent': '100yearmap-selfcheck' } });
    return { 상태: r.status, 글: r.status === 200 ? await r.text() : '' };
  } catch (e) {
    return { 상태: 0, 글: '', 탈: String(e?.message ?? e) };
  }
}

async function 라이브(여기) {
  console.log(`\n🔗 짧은 주소 ${짧은주소들.length}개 — ${여기}\n`);
  let 진 = 0;
  for (const 것 of 짧은주소들) {
    const 짧은 = `${여기}/y/${것.키}`;
    const a = await 두드리기(짧은);

    /* ① 짧은 주소가 사는가 */
    const 산다 = a.상태 === 200;
    /* ② 어디로 보내나 — 글자에서 도로 캐낸다 */
    const 캔것 = 산다 ? 가는곳캐기(a.글) : {};
    const 맞나 = 산다 && 셋이같나(캔것) && 캔것.새로고침 === 것.가는곳;
    /* ③ 목적지가 진짜 있는가 — ⛔ 이걸 안 재면 「200 인 빈 방」을 못 잡는다 */
    const 곳 = 물음표뗀곳(것.가는곳);
    const b = await 두드리기(`${여기}${한번만감싸기(곳)}`);
    const 방있나 = b.상태 === 200;
    const 안담나 = 산다 && 담지말라했나(a.글);

    const 좋나 = 산다 && 맞나 && 방있나 && 안담나 && 아스키냐(`/y/${것.키}`);
    if (!좋나) 진 += 1;

    console.log(`${좋나 ? '✅' : '🔴'} /y/${것.키}   ${것.말}`);
    console.log(`     짧은 주소  ${a.상태}${a.탈 ? ` (${a.탈})` : ''}   · 아스키 ${아스키냐(`/y/${것.키}`) ? '✅' : '🔴'} · noindex ${안담나 ? '✅' : '🔴'}`);
    console.log(`     보내는 곳  ${캔것.새로고침 ?? '(못 캠)'}`);
    if (산다 && !맞나) console.log(`     🔴 어긋남 — 링크 ${캔것.링크} · 자바 ${캔것.자바}`);
    console.log(`     그 방      ${b.상태}   ${곳}`);
    console.log(`     적은 곳    ${것.적은곳}`);
    console.log('');
  }
  console.log(`짧은 주소 ${짧은주소들.length - 진}/${짧은주소들.length} 살아 있음`);
  return 진 === 0;
}

const 인자 = process.argv.slice(2);
const 여기 = 인자[인자.indexOf('--여기') + 1] ?? 'https://100yearmap.com';
const 좋나 = 인자.includes('--자가시험') ? 자가시험() : await 라이브(여기.replace(/\/$/, ''));
process.exit(좋나 ? 0 : 1);
