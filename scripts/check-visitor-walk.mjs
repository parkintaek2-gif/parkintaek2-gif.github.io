/**
 * **손님으로 한 바퀴 걷는다.** 빌드 결과(dist)를 읽는 사람 눈으로 본다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-08 04:0x. 두 시간 동안 기사를 열두 편 내면서 **지면을 한 번도 안 걸어 봤다.**
 * 걸어 보니 `/contact`·`/subscribe` 꼬리말에 회사 이름이 **`[object Object]`** 로 나가고 있었다.
 * `{PUBLISHER}` 가 객체인데 그대로 찍었다. 빌드도 검사도 통과하는 종류의 잘못이다 —
 * **문법이 맞고 뜻이 틀린 것**은 사람이 화면을 봐야 걸린다. 그 「사람이 보는 일」을 자로 만든다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 *   ① 죽은 링크 — 지면끼리 거는 길이 실제로 있나
 *   ② 얇은 지면 — 본문이 너무 짧으면 손님이 헛걸음한다
 *   ③ 나가는 길 — 기사에서 다른 곳으로 갈 수 있나
 *   ④ 머리말 — title · description · canonical (검색이 이걸 본다)
 *   ⑤ **화면에 새는 것** — undefined · NaN · [object Object]
 *
 * ⛔ 「보기 좋은가」는 안 본다. 그건 사람 몫이다. 여기서 보는 것은 **깨졌나**뿐이다.
 *
 * 쓰는 법: node scripts/check-visitor-walk.mjs   (dist 가 있어야 한다)
 */
import fs from 'node:fs';
import path from 'node:path';

const D = 'dist/wikitip';
/** ⛔ 빌드 format 이 `file` 이라 첫 화면은 `dist/wikitip/index.html` 이 아니라 **`dist/wikitip.html`** 이다.
    이걸 몰라 처음 돌렸을 때 25장 전부 「죽은 링크 /」로 울렸다. 잣대가 틀린 것이었다. */
const 첫화면 = 'dist/wikitip.html';

const 얇은기준 = 900;   // 자 — 이보다 짧으면 손님이 읽을 것이 없다
const 나가는길기준 = 3; // 기사 하나에서 다른 곳으로 가는 길

export function 본문(h) {
  return h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ')
    .trim();
}
export function 링크(h) {
  return [...new Set([...h.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))];
}
/** 우리 안쪽 주소가 실제 파일로 있나. */
export function 있나(u, 있음 = fs.existsSync) {
  if (/^https?:|^mailto:|^#/.test(u)) return true;
  const p = u.split('#')[0].split('?')[0];
  if (p === '/') return 있음(첫화면);
  return [`${D}${p}.html`, `${D}${p}/index.html`, `${D}${p}`].some((x) => 있음(x));
}

if (process.argv[1] && process.argv[1].endsWith('check-visitor-walk.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('태그를 걷어 낸다', 본문('<p>a <b>b</b></p>') === 'a b');
  자가('style 안은 본문이 아니다', 본문('<style>x{y:1}</style><p>a</p>') === 'a');
  자가('링크를 겹치지 않게 뽑는다', 링크('<a href="/a">1</a><a href="/a">2</a>').length === 1);
  자가('바깥 주소는 늘 살아 있다고 본다', 있나('https://x.com', () => false));
  자가('첫 화면은 wikitip.html 로 찾는다', 있나('/', (p) => p === 첫화면));
  자가('없는 주소는 잡는다', !있나('/nope', () => false));
  console.log(`손님 걸음 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(D)) { console.error(`⛔ ${D} 가 없다 — node scripts/build-once.mjs 를 먼저 돌린다`); process.exit(1); }
  const 지면 = fs.readdirSync(D).filter((f) => f.endsWith('.html'));
  const 기사디렉 = `${D}/article`;
  const 기사 = fs.existsSync(기사디렉) ? fs.readdirSync(기사디렉).filter((f) => f.endsWith('.html')) : [];

  const 문제 = [];
  for (const [묶음, 목록, 앞] of [['지면', 지면, D], ['기사', 기사, 기사디렉]]) {
    for (const f of 목록) {
      const h = fs.readFileSync(path.join(앞, f), 'utf8');
      const t = 본문(h);
      const 이름 = 묶음 === '기사' ? `article/${f}` : f;
      const 안쪽 = 링크(h).filter((u) => !/^https?:|^mailto:|^#/.test(u));

      /* 404 지면은 원래 얇고 canonical 이 없다 — 손님이 머무는 자리가 아니다. */
      const 예외 = f === '404.html';
      if (!예외 && t.length < 얇은기준) 문제.push(`${이름} — 본문 ${t.length}자. ${얇은기준}자보다 얇다`);
      const 깨짐 = 안쪽.filter((u) => !있나(u));
      if (깨짐.length) 문제.push(`${이름} — 죽은 링크 ${깨짐.length}개: ${깨짐.slice(0, 3).join(' · ')}`);
      if (!/<title>[^<]{10,}<\/title>/.test(h)) 문제.push(`${이름} — title 이 없거나 열 자보다 짧다`);
      if (!예외 && !/name="description" content="[^"]{40,}"/.test(h)) 문제.push(`${이름} — description 이 없거나 짧다`);
      if (!예외 && !/rel="canonical"/.test(h)) 문제.push(`${이름} — canonical 이 없다`);
      /* ⑤ 화면에 새는 것 — 이 검사를 만든 까닭이다 */
      for (const 샌것 of ['[object Object]', 'undefined', 'NaN']) {
        if (t.includes(샌것)) 문제.push(`🔴 ${이름} — 화면에 «${샌것}» 이 나간다`);
      }
      if (묶음 === '기사' && 안쪽.filter((u) => u.startsWith('/')).length < 나가는길기준) {
        문제.push(`${이름} — 나가는 길이 ${안쪽.filter((u) => u.startsWith('/')).length}개뿐이다`);
      }
    }
  }

  console.log(`걸어 본 것 — 지면 ${지면.length}장 · 기사 ${기사.length}편`);
  if (문제.length) {
    console.log(`\n⛔ 손님 걸음 — ${문제.length}건`);
    for (const s of 문제) console.log(`   · ${s}`);
    process.exit(1);
  }
  console.log('✅ 걸리는 것 0건 — 죽은 링크·얇은 지면·새는 값 없음');
}
