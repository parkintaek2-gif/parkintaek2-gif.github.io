/**
 * 새 URL 을 IndexNow 로 통보한다. Bing·Yandex·Naver·Seznam 이 이 프로토콜을 받는다.
 * (구글은 IndexNow 를 쓰지 않는다 — 구글은 사이트맵 + Search Console 로 간다)
 *
 *   node scripts/ping-indexnow.mjs                          # 서울마켓 전체 (지금까지와 똑같다)
 *   node scripts/ping-indexnow.mjs /article/foo /macro      # 서울마켓, 지정한 경로만
 *   node scripts/ping-indexnow.mjs --host 100yearmap.com    # 백년지도 전체
 *   node scripts/ping-indexnow.mjs --host 100yearmap.com /after /work
 *   node scripts/ping-indexnow.mjs --all                    # 등록된 사이트 전부
 *   node scripts/ping-indexnow.mjs --all --dry              # **보내지 않고** 몇 건인지만 본다
 *
 * 발행 후 한 번 돌리면 된다. 하루 수백 건씩 남발하지 말 것.
 * ⚠ 고친 뒤 확인하려고 그냥 돌리면 **진짜 통보가 나간다.** 확인은 `--dry` 로 한다.
 *
 * 🔴 **Git Bash 에서 경로 인자를 주지 마라.** `/macro` 를 윈도우 경로로 바꿔 버린다 —
 *   실제로 이렇게 됐다(8/6 실측).
 *
 *     node scripts/ping-indexnow.mjs /macro
 *     → 스크립트가 받은 것: `c:/Program Files/Git/macro`
 *
 *   **PowerShell 이나 cmd 에서 돌린다.** 굳이 Git Bash 를 써야 하면 `MSYS_NO_PATHCONV=1` 를 앞에 붙인다.
 *   ⭐ 이 사고는 예전부터 있었는데 **조용히 이상한 URL 을 보내고 끝났다.**
 *      지금은 아래 「남의 호스트 섞임」 검사가 잡아서 **보내기 전에 멈춘다.**
 *
 * ─────────────────────────────────────────────────────────────
 * 🔴 **한 사이트만 박혀 있었다** (2026-08-06 · 2번이 찾아 3번에게 넘김)
 *
 *   const HOST = 'seoulmarkets.com';   ← 여기 하나뿐이었다
 *
 * 그래서 `100yearmap.com` 은 Bing·Yandex 에 **한 번도 알려진 적이 없었다.**
 * 2,483장을 만들어 놓고 통보를 안 한 셈이다.
 *
 * ⛔ **서울마켓 동작을 깨지 않는다** — 6번이 매 발행마다 쓴다.
 *   인자가 없으면 **예전과 똑같이** 돈다(같은 사이트맵 규칙 · 같은 본문).
 *
 * ⚠ **사이트마다 사이트맵 규칙이 다르다.** 이걸 놓치면 조용히 0건이 된다 —
 *   서울마켓은 `dist/sitemap-*.xml` **여러 장**, 백년지도는 `dist/100y/sitemap.xml` **한 장**이다.
 *
 * 🔴 **키 파일이 그 호스트에서 열려야 한다.** IndexNow 는 `keyLocation` 을 실제로 가져가 본다.
 *   8/6 실측 — `seoulmarkets.com/<키>.txt` **200**, `100yearmap.com/<키>.txt` **404** 였다.
 *   `public/100y/` 에 같은 키 파일을 놓아 고쳤다. **새 사이트를 붙이면 키 파일부터 놓는다.**
 *   (키 파일은 원래 공개해서 쓰는 것이다. 다만 값을 로그에 찍지 않는다)
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const KEY = (await readFile(new URL('./.indexnow-key', import.meta.url), 'utf8')).trim();

/**
 * 사이트 등록부 — **새 사이트를 붙이려면 여기 한 줄만 더한다.**
 * ⚠ 붙이기 전에 `https://<호스트>/<키>.txt` 가 **200 인지 먼저 재 본다.** 404 면 통보가 거절된다.
 */
const 사이트들 = {
  'seoulmarkets.com': {
    이름: '서울마켓',
    폴더: '',                                    // dist/
    고르기: (f) => /^sitemap-.*\.xml$/.test(f),  // ⚠ 여러 장. 색인용 `sitemap.xml` 은 뺀다 — 예전 그대로
  },
  '100yearmap.com': {
    이름: '백년지도',
    폴더: '100y/',                               // dist/100y/
    고르기: (f) => f === 'sitemap.xml',          // 한 장
  },
  // ⬜ kculturewire.com — 5번 쪽에 아직 사이트맵이 없다(8/6 확인). 생기면 여기 한 줄 더한다
};

const 기본사이트 = 'seoulmarkets.com';

// ── 인자 읽기 ────────────────────────────────────────────────
const 인자 = process.argv.slice(2);
const 전부 = 인자.includes('--all');
const 시늉 = 인자.includes('--dry');
const 호스트자리 = 인자.indexOf('--host');
const 고른호스트 = 호스트자리 >= 0 ? 인자[호스트자리 + 1] : null;
/** `--host x` 와 `--all` 을 뺀 나머지가 경로다 */
const 경로들 = 인자.filter((a, n) => !a.startsWith('--') && n !== 호스트자리 + 1);

if (고른호스트 && !사이트들[고른호스트]) {
  console.error(`모르는 호스트다: ${고른호스트}`);
  console.error(`아는 것 — ${Object.keys(사이트들).join(' · ')}`);
  process.exit(1);
}
if (전부 && 경로들.length) {
  console.error('--all 과 경로를 같이 줄 수 없다. 경로는 한 사이트에만 해당한다.');
  process.exit(1);
}

const 돌릴것 = 전부 ? Object.keys(사이트들) : [고른호스트 ?? 기본사이트];

// ── 사이트맵에서 URL 긁기 ────────────────────────────────────
async function 사이트맵URL(호스트) {
  const 설정 = 사이트들[호스트];
  const dir = new URL(`../dist/${설정.폴더}`, import.meta.url);
  if (!existsSync(dir)) {
    console.error(`⛔ ${호스트}: dist/${설정.폴더} 가 없다. 먼저 빌드했는지 본다.`);
    return [];
  }
  const files = (await readdir(dir)).filter(설정.고르기);
  if (!files.length) {
    /* ⚠ 여기서 조용히 넘어가면 「0건 보냈다」가 성공처럼 보인다. 반드시 말한다 */
    console.error(`⛔ ${호스트}: dist/${설정.폴더} 에서 사이트맵을 못 찾았다. 규칙이 바뀌었나 본다.`);
    return [];
  }
  const out = [];
  for (const f of files) {
    const xml = await readFile(new URL(f, dir), 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) out.push(m[1]);
  }
  return out;
}

// ── 한 사이트 통보 ───────────────────────────────────────────
async function 통보(호스트) {
  const ORIGIN = `https://${호스트}`;
  const urlList = 경로들.length ? 경로들.map((p) => new URL(p, ORIGIN).href) : await 사이트맵URL(호스트);

  if (urlList.length === 0) {
    console.error(`⛔ ${호스트}: 통보할 URL 이 없다.`);
    return false;
  }
  /* ⚠ 사이트맵에 **남의 호스트 URL** 이 섞이면 IndexNow 가 통째로 거절한다. 먼저 거른다 */
  const 남의것 = urlList.filter((u) => new URL(u).host !== 호스트);
  if (남의것.length) {
    console.error(`⛔ ${호스트}: 사이트맵에 다른 호스트 URL 이 ${남의것.length}개 섞여 있다 — ${남의것[0]}`);
    return false;
  }

  if (시늉) {
    console.log(
      `[시늉] ${사이트들[호스트].이름} ${호스트} · ${urlList.length} URL(s) · 안 보냈다\n` +
        `        첫 줄 ${urlList[0]}\n        끝 줄 ${urlList[urlList.length - 1]}`,
    );
    return true;
  }

  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 호스트, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList }),
  });

  console.log(`IndexNow ${res.status} ${res.statusText} — ${사이트들[호스트].이름} ${호스트} · ${urlList.length} URL(s)`);
  if (!res.ok) {
    console.log(await res.text());
    /* 403 은 거의 늘 키 파일이 그 호스트에서 안 열리는 것이다 */
    if (res.status === 403) console.log(`⚠ ${ORIGIN}/<키>.txt 가 200 인지 먼저 본다. 404 면 그것부터 고친다.`);
  }
  return res.ok;
}

let 실패 = 0;
for (const 호스트 of 돌릴것) if (!(await 통보(호스트))) 실패++;
process.exit(실패 ? 1 : 0);
