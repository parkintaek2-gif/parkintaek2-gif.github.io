#!/usr/bin/env node
/**
 * 배포 — **혼자 하지 않는다.**
 *
 *   npm run deploy              점검 → 통보 → 배포 → 확인
 *   npm run deploy -- --check   점검만 한다 (배포하지 않는다)
 *   npm run deploy -- --force   경고를 무시하고 강행 (사장님 지시가 있을 때만)
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────
 * 2026-08-03 21:26 에 seoulmarkets 를, 21:30 에 klifemap 을 배포했다.
 * **4분 차이로 겹쳤고 내 롤링 업데이트가 25분 넘게 멈췄다.**
 * 총 1GB 를 나눠 쓰는데 롤링 업데이트에는 순간적으로 **두 배**가 필요하다.
 *
 * 사장님 지시: 「배포는 서로 통보하고 하는 규칙을 공유해라」
 *
 * ⚠ **말로 하는 규칙은 잊힌다.** 그날 나는 세션간 메모에 「곧 apply 합니다」라고
 *   적어 뒀는데도 겹쳤다. 적는 것만으로는 안 막힌다. 그래서 코드로 막는다.
 *   (필수지시 11 — 사람을 거치는 계획을 세우지 않는다. 도구로 푼다)
 *
 * ── 어떻게 막나 ────────────────────────────────────────────────
 * ① **락 파일** — 두 저장소 바깥, 공통 상위 폴더에 둔다.
 *    두 세션이 같은 PC 에서 도니 이 파일 하나로 서로를 본다.
 *      C:\Users\USER\Documents\GitHub\.cloudtype-deploy-lock.json
 *    ⚠ 저장소 안에 두면 안 된다 — 저장소가 달라서 서로 안 보인다.
 * ② **상대 상태 확인** — 상대 스테이지가 Running 이 아니면 멈춘다.
 *    배포 중인 것을 밀면 둘 다 죽는다.
 * ③ **통보** — 세션간 메모에 시각과 함께 자동으로 적는다. 손으로 적지 않는다.
 * ④ **확인** — 뜰 때까지 지켜보고, 실패하면 실패했다고 말한다.
 *
 * 락은 **20분이 지나면 만료**로 본다. 세션이 죽어 락이 남으면 영영 배포를 못 하니까.
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import https from 'node:https';

/** ⚠ 저장소 **바깥**이다. klifemap 세션도 같은 경로를 본다. */
const LOCK = path.resolve('C:/Users/USER/Documents/GitHub/.cloudtype-deploy-lock.json');
/** ⚠ `probe` — 그 프로젝트가 **실제로 살아 있나**를 볼 주소. 표시가 멎었는지 가릴 때 쓴다 */
const 나 = { project: 'seoulmarkets', stage: '@parkintaek2/seoulmarkets:main', app: 'web', probe: 'https://seoulmarkets.com/' };
const 상대 = { project: 'klifemap', stage: '@parkintaek2/klifemap:main', app: 'klifemap-app', probe: 'https://klifemap.ai/' };
const 락만료분 = 20;

const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes('--check');
const FORCE = argv.includes('--force');

const 지금 = () => new Date(); // 이 PC 는 KST 다. 9시간을 더하지 않는다
const 시각 = (d = 지금()) => d.toLocaleString('ko-KR', { hour12: false });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** ⚠ `-t` 없이 부르지 않는다. 없으면 전역 스테이지로 튀어 남의 프로젝트에 배포된다. */
function ctype(args) {
  try {
    return execFileSync('ctype', args, { encoding: 'utf8', timeout: 120000, shell: true });
  } catch (e) {
    return (e.stdout ?? '') + (e.stderr ?? '');
  }
}

/** 스테이지의 앱 상태를 읽는다. 색코드가 섞여 오므로 지운다. */
/**
 * ctype 이 찍어 준 갱신 시각이 몇 분 지났나. 못 읽으면 **null — 짐작하지 않는다.**
 * ⚠ null 을 0 으로 보면 「방금 갱신됐다」가 되어 막는 쪽으로 기울고, 큰 수로 보면 미는 쪽으로 기운다.
 *   못 읽으면 **막는 쪽**이 안전하므로 부르는 자리에서 null 을 「멎지 않았다」로 쓴다.
 */
export function 갱신지난분(적힌시각, 지금 = new Date()) {
  const t = Date.parse(String(적힌시각 ?? '').trim().replace(' ', 'T'));
  if (Number.isNaN(t)) return null;
  const 분 = (지금.getTime() - t) / 60000;
  return 분 < 0 ? 0 : 분;
}

/** 그 주소가 실제로 열리나. 못 열리면 false — 배포 중일 수 있으니 막는 쪽으로 쓴다 */
function 살아서열리나(주소) {
  if (!주소) return Promise.resolve(false);
  return new Promise((r) => {
    https
      .get(주소, { timeout: 10000 }, (res) => { res.resume(); r(res.statusCode >= 200 && res.statusCode < 400); })
      .on('error', () => r(false))
      .on('timeout', function () { this.destroy(); r(false); });
  });
}

function 상태(stage, app) {
  const out = ctype(['ls', '-t', stage]).replace(/\x1b\[[0-9;]*m/g, '');
  for (const line of out.split(/\r?\n/)) {
    const c = line.trim().split(/\s{2,}/);
    if (c[0] === app) return { status: c[2] ?? '?', updated: c.slice(-1)[0] ?? '' };
  }
  return { status: '알 수 없음', updated: '', raw: out.slice(0, 300) };
}

/**
 * 락을 건 프로세스가 아직 살아 있는가.
 *
 * ⚠ **죽은 프로세스는 배포하고 있지 않다.** 그런데 락은 남는다.
 *   2026-08-07 하루에 **세 번** 이 자물쇠에 막혔다 — 배포가 중간에 끊길 때마다 남았고,
 *   그때마다 20분을 기다리거나 손으로 지웠다. 손으로 지우는 것은 **위험하다** —
 *   진짜 도는 배포를 지울 수 있다. 그래서 **pid 가 살아 있는지로 가린다.**
 *
 * ⛔ 다른 프로젝트(klifemap)의 pid 는 이 PC 의 것이지만 확실치 않을 수 있어,
 *   **내 프로젝트 락에만** 이 판정을 쓴다. 남의 것은 시간으로만 만료시킨다.
 */
export function 살아있나(pid) {
  if (!pid) return true; // pid 가 없는 옛 락은 살아 있는 것으로 본다(안전한 쪽)
  try {
    process.kill(pid, 0); // 신호 0 은 죽이지 않는다. 있는지만 묻는다
    return true;
  } catch (e) {
    return e.code === 'EPERM'; // 남의 계정 것이면 살아 있는 것이다
  }
}

function 락읽기() {
  if (!existsSync(LOCK)) return null;
  try {
    const j = JSON.parse(readFileSync(LOCK, 'utf8'));
    const 지난분 = (Date.now() - new Date(j.startedAt).getTime()) / 60000;
    return { ...j, 지난분, 임자살아있다: 살아있나(j.pid) };
  } catch {
    return null; // 깨진 락은 없는 것으로 본다
  }
}

function 락걸기(사유) {
  writeFileSync(
    LOCK,
    JSON.stringify({ project: 나.project, stage: 나.stage, startedAt: 지금().toISOString(), pid: process.pid, note: 사유 }, null, 2),
  );
}

function 락풀기() {
  const j = 락읽기();
  // 남의 락은 절대 지우지 않는다
  if (j && j.project === 나.project) unlinkSync(LOCK);
}

/** 세션간 메모에 자동으로 적는다. 손으로 적으면 잊는다. */
function 통보(문구) {
  const p = path.resolve('docs/세션간-메모.md');
  if (!existsSync(p)) return;
  appendFileSync(p, `\n${문구}\n`, 'utf8');
}

/**
 * 라이브 URL 을 직접 찔러 응답 코드를 본다.
 * ⚠ 판정을 **시간이 아니라 실제 상태**로 하기 위함이다. ctype 감시가 컨테이너
 *   기동보다 짧게 끊겨도, 라이브가 200 이면 서비스는 뜬 것이다.
 *   (실제 공개 URL 이라 fetch 의 Host 문제는 없다 — 호스트 라우팅 시험과 다르다)
 */
async function 라이브확인() {
  try {
    const r = await fetch('https://seoulmarkets.com/', { method: 'HEAD', redirect: 'manual' });
    return r.status;
  } catch {
    return 0;
  }
}

/**
 * **새로 나가는 지면을 미리 골라 둔다** — 배포가 끝났는지 ctype 표시가 아니라 이것으로 안다.
 *
 * ⚠ 2026-08-07 새벽에 배포를 네 번 했는데 **네 번 다 600초를 「Starting」으로 태우고
 *   「판정 보류」로 끝났다.** 라이브는 네 번 다 200 이었다. ctype 표시가 멎어 있는 것이지
 *   배포가 안 된 것이 아니었다. 한 번에 10분씩, 하룻밤에 40분을 버렸다.
 *
 * 그래서 판정을 **표시가 아니라 내용**으로 바꾼다.
 *   빌드 결과(dist)에는 있는데 **라이브에는 아직 404 인 주소**를 찾아 두고,
 *   그 주소가 200 이 되는 순간 「나갔다」로 본다. 이건 표시가 아니라 사실이다.
 *
 * ⛔ 고칠 것이 지면 추가가 아니라 **글자 수정뿐이면 새 주소가 없다.** 그때는 못 쓴다 —
 *   빈 배열을 돌려주고, 부르는 쪽이 옛 방식(ctype 표시 + 라이브 200)으로 되돌아간다.
 *   ⚠ 없는 것을 있는 척하지 않는다.
 */
async function 새주소찾기(최대 = 3) {
  const 뿌리 = path.resolve('dist');
  if (!existsSync(뿌리)) return [];

  // ⚠ dist 가 낡으면 판정이 틀린다. **낡았는지 맞히려 들지 않고 여기서 새로 빌드한다.**
  //   시각을 견주는 방식으로 두 번 어긋났다(2026-08-07 03:0x·05:0x). 어긋날 자리를 없앤다.
  //   빌드는 30초 안팎이고 배포는 그보다 훨씬 길다 — 그만한 값을 한다.
  try {
    console.log('판정에 쓸 지면 목록을 만든다 — 빌드한다(30초 안팎)…');
    // ⚠ npx 도 npx.cmd 도 부르지 않는다 — 셸에 따라 못 찾는다(둘 다 겪었다).
    // 🔴 astro 를 **직접** 부르지 않는다 — 여섯 자리가 같은 작업트리를 쓴다.
    //   두 자리가 동시에 빌드하면 한쪽이 dist 를 비우는 사이 다른 쪽이 죽거나,
    //   더 나쁘게는 **반쯤 섞인 dist** 가 남아 판정이 통째로 틀린다(2026-08-07 16:4x 실제로 겪음).
    //   build-once 가 자물쇠를 쥐고 하나씩 돌린다.
    execFileSync(process.execPath, [path.join('scripts', 'build-once.mjs')], { stdio: 'ignore' });
  } catch {
    console.log('⚠ 빌드가 안 됐다 — 지면 판정을 쓰지 않고 옛 방식으로 돈다.');
    return [];
  }

  // ① 라이브 사이트맵 셋을 받아 **지금 나가 있는 주소**를 모은다. 요청 세 번이면 된다.
  //    ⛔ dist 의 지면을 하나씩 찔러 보지 않는다 — 3,900 번을 쏘게 된다.
  const 호스트들 = ['https://seoulmarkets.com', 'https://100yearmap.com', 'https://www.kculturewire.com'];
  const 산것 = new Set();
  for (const h of 호스트들) {
    try {
      const t = await (await fetch(`${h}/sitemap.xml`)).text();
      for (const m of t.matchAll(/<loc>([^<]+)<\/loc>/g)) 산것.add(m[1].replace(/\/$/, ''));
    } catch { /* 못 받으면 그 호스트는 못 본 것으로 둔다 */ }
  }
  if (!산것.size) return [];

  // ② dist 의 지면을 주소로 바꿔 사이트맵에 없는 것을 고른다
  //    ⚠ dist 는 지우고 다시 만들지 않아 **옛 빌드의 찌꺼기가 남을 수 있다.**
  //      저장소에 없는 지면이 dist 에만 남으면 영영 404 이고, 그것을 판정에 쓰면
  //      배포가 끝났는데도 끝까지 기다린다. 아직 실제로 겪지는 않았고 미리 막아 둔다.
  //      **이번 빌드에서 다시 쓰인 파일만** 본다 — index.html 은 매 빌드 다시 쓰인다.
  const { readdirSync, statSync } = await import('node:fs');
  const 기준시각 = existsSync(path.join(뿌리, 'index.html'))
    ? statSync(path.join(뿌리, 'index.html')).mtimeMs - 10 * 60 * 1000
    : 0;
  const 후보 = [];
  const 걷기 = (d, 앞) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== '_astro') 걷기(p, `${앞}/${e.name}`); }
      else if (e.name.endsWith('.html') && statSync(p).mtimeMs >= 기준시각)
        후보.push(`${앞}/${e.name.replace(/\.html$/, '')}`);
    }
  };
  걷기(뿌리, '');

  const 주소로 = (길) =>
    길.startsWith('/100y/') ? `https://100yearmap.com${길.slice(5)}`
    : 길.startsWith('/wikitip/') ? `https://www.kculturewire.com${길.slice(8)}`
    : `https://seoulmarkets.com${길}`;

  const { createHash } = await import('node:crypto');
  const 지문 = (글) => createHash('md5').update(글.replace(/\r\n/g, '\n')).digest('hex');

  const 잰다 = [];
  // ① 새로 나갈 지면 — 라이브에 아직 없는 것
  for (const 길 of 후보) {
    if (잰다.length >= 최대) break;
    if (/\/(404|index)$/.test(길)) continue;
    // ⚠ 한글·점이 든 주소는 판정에 쓰지 않는다. 인코딩 때문에 **영영 200 이 안 되는** 것을
    //   골라 놓으면 배포가 끝났는데도 끝까지 기다린다. 2026-08-07 시험에서 실제로 하나 잡혔다.
    if (!/^[/a-z0-9\-_/]+$/i.test(길)) continue;
    const u = 주소로(길);
    if (산것.has(u)) continue;
    try {
      const r = await fetch(u, { method: 'HEAD', redirect: 'manual' });
      if (r.status === 404) 잰다.push({ url: u, 기댓값: null });   // 200 이 되면 나간 것
    } catch { /* 못 재면 넘긴다 */ }
  }

  // ⚠ 지문표는 **새 지면이 있든 없든 남긴다.** 여기서 일찍 돌아가 버리면 표가 영영 안 생기고,
  //   다음에 자료만 고친 배포가 왔을 때 또 못 잰다. 실제로 한 번 그렇게 비어 있었다.
  {
    const { readFileSync } = await import('node:fs');
    const 이번지문 = new Map();
    for (const 길 of 후보) {
      if (/\/(404|index)$/.test(길) || !/^[/a-z0-9\-_/]+$/i.test(길)) continue;
      if (!산것.has(주소로(길))) continue;
      try {
        이번지문.set(길, 지문(readFileSync(path.join(뿌리, `${길}.html`), 'utf8')));
      } catch { /* 못 읽으면 넘긴다 */ }
    }
    var 이번지문표 = 이번지문;                  // 아래 ②에서 다시 쓴다
    var 지난지문표 = 지문표읽기();
    지문표쓰기(이번지문);
  }

  if (잰다.length) return 잰다;

  // ② 새 지면이 없으면 — **자료·글자만 고친 배포**다. 바뀐 지면의 지문으로 판정한다.
  //    ⭐ 컨테이너 빌드가 내 빌드와 **바이트까지 같은 것**을 확인했다(2026-08-07 08:3x).
  //
  //    🔴 2026-08-07 16:0x — 여기에 구멍이 있었다. **실제로 5번 자료가 안 나갔는데 「나갔다」고 했다.**
  //      옛 방식은 dist 를 걸으며 앞에서부터 60장만 라이브와 견줬다. 지면이 4,700장이라
  //      앞 60장은 거의 다 백년지도 것이고, **바뀐 K팝 지면은 영영 안 걸렸다.**
  //      그래서 「바뀐 곳이 없다」로 보고 옛 방식(200)으로 되돌아가 무조건 통과했다.
  //
  //    ✅ 고친 방법 — **지난 배포 때의 dist 지문표를 남겨 두고, 이번 dist 와 견준다.**
  //      바뀐 지면이 어느 것인지 **자기 PC 안에서 정확히** 알아낸다. 라이브를 4,700번 찌르지 않는다.
  const 이번지문 = 이번지문표;
  const 지난지문 = 지난지문표;

  // 지난 표가 있으면 **바뀐 지면만** 골라 낸다. 없으면(첫 배포) 옛 방식으로 되돌아간다
  const 바뀐것 = 지난지문
    ? [...이번지문.keys()].filter((길) => 지난지문.get(길) !== 이번지문.get(길))
    : null;

  if (!지난지문) {
    console.log('⬜ 지난 배포의 지문표가 없다 — 이번에 만들어 둔다. 이번 판정은 옛 방식으로 돈다');
    return 잰다;
  }
  if (!바뀐것.length) {
    console.log('⬜ 지난 배포와 견줘 바뀐 지면이 없다 — 자료·글자도 그대로다');
    return 잰다;
  }
  console.log(`바뀐 지면 ${바뀐것.length}장을 찾았다 (지난 배포와 견줌). 그중 앞 3장으로 판정한다`);

  for (const 길 of 바뀐것.slice(0, 3)) {
    const u = 주소로(길);
    try {
      const 라이브 = 지문(await (await fetch(u)).text());
      // 이미 같으면 이번 배포로 바뀔 것이 없는 지면이다(누가 먼저 냈을 수 있다)
      if (라이브 !== 이번지문.get(길)) 잰다.push({ url: u, 기댓값: 이번지문.get(길) });
    } catch { /* 못 재면 넘긴다 */ }
  }
  return 잰다;
}

/**
 * dist 지면의 지문표. **저장소 바깥**에 둔다 — 커밋에 섞이면 diff 가 지저분해지고,
 * 다른 세션이 같은 저장소를 쓰는데 이 표는 **이 PC 의 마지막 배포** 이야기라서 그렇다.
 */
const 지문표 = path.resolve('C:/Users/USER/Documents/GitHub/.cloudtype-dist-manifest.json');

function 지문표읽기() {
  if (!existsSync(지문표)) return null;
  try {
    const j = JSON.parse(readFileSync(지문표, 'utf8'));
    return new Map(Object.entries(j.지면 ?? {}));
  } catch {
    return null; // 깨진 표는 없는 것으로 본다
  }
}

function 지문표쓰기(표) {
  try {
    writeFileSync(
      지문표,
      JSON.stringify({ 만든때: 지금().toISOString(), 지면: Object.fromEntries(표) }, null, 0),
    );
  } catch { /* 못 써도 배포는 계속한다 */ }
}

async function main() {
  // --probe 는 판정에 쓸 「새로 나갈 지면」만 보여준다. 배포도 락도 건드리지 않는다.
  if (process.argv.includes('--probe')) {
    const 새주소 = await 새주소찾기();
    console.log(
      새주소.length
        ? `새로 나갈 지면 ${새주소.length}개:\n  ${새주소.map((x) => (x.기댓값 ? `${x.url}  (지문으로 잰다)` : x.url)).join('\n  ')}`
        : '새로 나갈 지면이 없다 — 이번 배포는 옛 방식으로 판정한다',
    );
    return;
  }

  console.log(`배포 점검 — ${시각()} KST\n`);

  // ── ① 남의 락이 걸려 있나 ──────────────────────────────────
  const 락 = 락읽기();
  if (락 && 락.project !== 나.project) {
    if (락.지난분 < 락만료분) {
      console.error(`⛔ ${락.project} 이(가) 배포 중이다 — ${락.지난분.toFixed(1)}분 전에 시작.`);
      console.error(`   메모리를 나눠 쓴다. 끝날 때까지 기다린다.`);
      console.error(`   락: ${LOCK}`);
      process.exit(1);
    }
    console.log(`⚠ ${락.project} 락이 ${락.지난분.toFixed(0)}분째다 — 만료로 본다. 지우고 진행한다.`);
    unlinkSync(LOCK);
  }
  if (락 && 락.project === 나.project && 락.지난분 < 락만료분) {
    // ⚠ 락을 건 프로세스가 죽었으면 배포는 이미 끝났거나 끊긴 것이다. 20분을 기다릴 이유가 없다
    if (!락.임자살아있다) {
      console.log(`⚠ 내 락이 ${락.지난분.toFixed(0)}분째인데 **건 프로세스(pid ${락.pid})가 죽어 있다** — 치우고 진행한다.`);
      unlinkSync(LOCK);
    } else {
      console.error(`⛔ 이 프로젝트가 이미 배포 중이다 (${락.지난분.toFixed(1)}분 전 시작 · pid ${락.pid} 살아 있음).`);
      process.exit(1);
    }
  }

  // ── ② 상대 스테이지가 안정적인가 ───────────────────────────
  const 상대상태 = 상태(상대.stage, 상대.app);
  console.log(`  ${상대.project.padEnd(13)} ${상대상태.status}   (갱신 ${상대상태.updated})`);
  const 내상태 = 상태(나.stage, 나.app);
  console.log(`  ${나.project.padEnd(13)} ${내상태.status}   (갱신 ${내상태.updated})`);

  const 막힘 = [];
  if (상대상태.status !== 'Running') {
    /* ⚠⚠ 2026-08-08 02:1x — **이 자리에서 한 시간 반을 잃었다.**
     *   klifemap 이 01:58 에 Starting 으로 찍힌 뒤 표시가 그대로 멎었다.
     *   1번은 그 뒤 배포한 적이 없고 klifemap.ai 는 99ms 에 200 을 줬는데도
     *   내 배포가 **네 번** 막혔다.
     *
     *   같은 교훈이 이 파일 141줄에 이미 적혀 있었다 —
     *   「ctype 표시가 멎어 있는 것이지 배포가 안 된 것이 아니었다」.
     *   그런데 그걸 **내 프로젝트에만** 적용하고 상대 프로젝트에는 안 썼다.
     *
     * ⛔ 그렇다고 표시를 무시하지는 않는다. 진짜 도는 배포를 밀면 둘 다 죽는다.
     *    **두 가지가 같이 맞을 때만** 멎은 표시로 본다 —
     *      ① 표시가 12분 넘게 그대로다   ② 상대 사이트가 200 을 준다
     *    진짜 배포 중이면 표시가 방금 갱신되거나 사이트가 흔들린다. */
    const 지난분 = 갱신지난분(상대상태.updated);
    const 상대살았나 = await 살아서열리나(상대.probe);
    const 멎은표시 = 지난분 !== null && 지난분 >= 12 && 상대살았나;

    if (멎은표시) {
      console.log(
        `\n⚠ ${상대.project} 표시가 ${Math.round(지난분)}분째 ${상대상태.status} 인데 ` +
        `${상대.probe} 는 200 이다. **표시가 멎은 것으로 본다.**`,
      );
      console.log('   (진짜 배포 중이면 표시가 방금 갱신되거나 사이트가 흔들린다)');
    } else {
      막힘.push(
        `${상대.project} 이 ${상대상태.status} 다 — 배포 중인 것을 밀면 둘 다 죽는다` +
        (지난분 === null ? '' : ` (${Math.round(지난분)}분째 · 사이트 ${상대살았나 ? '200' : '안 열림'})`),
      );
    }
  }
  if (내상태.status === 'Starting') {
    /* ⚠⚠ 2026-08-08 02:3x — **같은 것을 한 번 더 겪었다.**
     *   02:16 배포가 「나갔다」로 끝나면서 스스로 「(ctype 표시 Starting)」이라고 적어 놓고도,
     *   02:28 다음 배포에서 그 표시에 제 발이 걸렸다.
     *   상대 프로젝트만 고치고 **내 쪽에 같은 자를 안 댄 것**이다.
     *
     * ⛔ 락이 진짜 방패다 — 이 저장소는 나만 배포한다. 락이 비었으면 도는 배포가 없다.
     *    표시는 거들 뿐이므로, 상대 쪽과 **같은 잣대**로 본다.
     *      ① 표시가 12분 넘게 그대로다   ② 내 사이트가 200 을 준다 */
    const 지난분 = 갱신지난분(내상태.updated);
    const 내가살았나 = await 살아서열리나(나.probe);
    const 멎은표시 = 지난분 !== null && 지난분 >= 12 && 내가살았나;

    if (멎은표시) {
      console.log(
        `\n⚠ 내 표시가 ${Math.round(지난분)}분째 Starting 인데 ${나.probe} 는 200 이다. ` +
        '**표시가 멎은 것으로 본다.**',
      );
      console.log('   (락이 비어 있으므로 도는 배포는 없다 — 이 저장소는 내가 혼자 배포한다)');
    } else {
      막힘.push(
        '이 프로젝트가 이미 Starting 이다 — 앞선 배포가 아직 안 끝났다' +
        (지난분 === null ? '' : ` (${Math.round(지난분)}분째 · 사이트 ${내가살았나 ? '200' : '안 열림'})`),
      );
    }
  }

  // ⚠ 스테이지가 klifemap 으로 넘어간 채 끝나면 다음 명령이 남의 것을 건드린다
  ctype(['ls', '-t', 나.stage]);

  if (막힘.length) {
    console.error('\n⛔ 배포하지 않는다.');
    막힘.forEach((m) => console.error('   · ' + m));
    if (!FORCE) {
      console.error('\n   정말 해야 하면 --force (사장님 지시가 있을 때만).');
      process.exit(1);
    }
    console.error('\n⚠ --force 로 강행한다.');
  }

  if (CHECK_ONLY) {
    console.log('\n--check 였다. 배포하지 않고 끝낸다.');
    return;
  }

  // ── ③ 락 걸고 통보 ─────────────────────────────────────────
  // 배포 **전에** 새로 나갈 주소를 잡아 둔다. 나간 뒤에 재면 이미 200 이라 뭐가 새 것인지 모른다.
  const 새주소 = await 새주소찾기();
  console.log(
    새주소.length
      ? `이번에 새로 나갈 지면 ${새주소.length}개를 판정에 쓴다:\n  ${새주소.map((x) => (x.기댓값 ? `${x.url}  (지문으로 잰다)` : x.url)).join('\n  ')}`
      : '새로 나갈 지면이 없다(글자 수정뿐인 듯하다) — 옛 방식(ctype 표시 + 라이브 200)으로 판정한다',
  );

  락걸기('ctype apply');
  통보(
    `> 🚀 **[SeoulMarkets] 배포 시작 ${시각()} KST** — \`${나.stage}\`\n` +
      `> 끝나면 이 줄 아래에 결과가 붙습니다. 락: \`${LOCK}\``,
  );
  console.log(`\n락 걸었다. 세션간 메모에 통보했다.\n배포한다 — ${나.stage}`);

  try {
    // ⚠ -t 를 절대 빼지 않는다
    const out = ctype(['apply', '-f', '.cloudtype/app.yaml', '-t', 나.stage]);
    console.log(out.trim().split('\n').slice(-2).join('\n'));

    // ── ④ 뜰 때까지 지켜본다 — **시간이 아니라 실제 상태로 판정한다** ──
    // ⚠ 옛 감시 한도(400초)가 컨테이너 기동보다 짧아 **성공을 「미완」으로 오판**했다
    //   (2026-08-05 두 번). 사람이 「실패했네」 하고 다시 돌리면 롤링에 메모리가 두 배 든다.
    //   그래서 ① 한도를 600초로 늘리고 ② 그래도 Running 을 못 보면 **라이브 URL 로 실제를 본다**
    //   ③ ⛔ 조용히 「실패/미완」이라고 적지 않는다 — 「판정 보류, 눈으로 확인」으로 적는다.
    // ⭐ 2026-08-07 — **표시 말고 내용으로 판정한다.** 새로 나갈 주소가 200 이 되면 끝난 것이다.
    //   ctype 표시가 멎어도 이건 사실이라 안 흔들린다. 없으면 옛 방식으로 되돌아간다.
    let 결과 = 'Starting';
    let 내용확인 = null;
    for (let i = 0; i < 30; i++) {
      await sleep(20000);
      결과 = 상태(나.stage, 나.app).status;

      if (새주소.length) {
        const { createHash } = await import('node:crypto');
        const 잰것 = await Promise.all(새주소.map(async ({ url, 기댓값 }) => {
          try {
            if (!기댓값) return (await fetch(url, { method: 'HEAD', redirect: 'manual' })).status;
            // 글자만 고친 지면은 **지문이 같아지면** 나간 것이다
            const 글 = await (await fetch(url)).text();
            const h = createHash('md5').update(글.replace(/\r\n/g, '\n')).digest('hex');
            return h === 기댓값 ? 200 : 0;
          } catch { return 0; }
        }));
        // ⚠ **하나라도 200 이면 새 빌드가 서고 있는 것이다.**
        //   「전부 200」으로 두었더니 한 장이 안 떠서 600초를 다 태웠다(2026-08-07 06:0x).
        //   지면이 안 뜨는 데는 다른 까닭이 있을 수 있고(주소 규칙·noindex·라우팅),
        //   그것은 배포가 끝났나와 다른 문제다. 안 뜬 것은 **이름을 적어 남긴다.**
        const 뜬것 = 새주소.filter((_, k) => 잰것[k] === 200);
        console.log(`  ${(i + 1) * 20}초 · ${결과} · 새 지면 ${잰것.join('/')}`);
        if (뜬것.length) { 내용확인 = { 뜬것: 뜬것.map((x)=>x.url), 안뜬것: 새주소.filter((x) => !뜬것.includes(x)).map((x)=>x.url) }; break; }
      } else {
        console.log(`  ${(i + 1) * 20}초 · ${결과}`);
      }
      if (결과 === 'Running') break;
    }

    if (내용확인) {
      // 새로 낸 지면이 실제로 200 이다. ctype 표시가 무엇이든 나간 것이다.
      const 못뜬줄 = 내용확인.안뜬것.length
        ? `\n> ⚠ **아직 404 인 것** — ${내용확인.안뜬것.join(' · ')}\n` +
          `> 배포와 별개 문제다. 주소 규칙·라우팅을 눈으로 본다.`
        : '';
      통보(
        `> ✅ **[SeoulMarkets] 배포 완료 ${시각()} KST** — 새 지면이 라이브에 떴다.\n` +
          내용확인.뜬것.map((u) => `> · ${u} 200`).join('\n') +
          `\n> (ctype 표시는 \`${결과}\` — 표시가 아니라 지면으로 판정했다)` + 못뜬줄,
      );
      console.log(`\n✅ 새 지면 ${내용확인.뜬것.length}개 라이브 200 — 나갔다 (ctype 표시 ${결과})`);
      if (내용확인.안뜬것.length) console.log(`⚠ 아직 404: ${내용확인.안뜬것.join(' · ')}`);
    } else if (결과 === 'Running') {
      const code = await 라이브확인();
      통보(`> ✅ **[SeoulMarkets] 배포 완료 ${시각()} KST** — 상태 \`Running\` · 라이브 \`${code}\``);
      console.log(`\n✅ Running · 라이브 ${code}`);
    } else {
      // Running 을 못 봤다. **시간 초과일 뿐 성공일 수 있다** — 라이브로 확인한다.
      const code = await 라이브확인();
      if (code === 200) {
        통보(
          `> 🔶 **[SeoulMarkets] 배포 판정 보류 ${시각()} KST** — ctype 은 \`${결과}\` 이나 라이브 200.\n` +
            `> ⛔ **재배포하지 마십시오.** 기동이 감시보다 느린 것일 수 있습니다. 라이브를 눈으로 확인하십시오.`,
        );
        console.log(`\n🔶 판정 보류 — ctype ${결과} · 라이브 200. 재배포 금지, 눈으로 확인.`);
      } else {
        통보(
          `> ⚠ **[SeoulMarkets] 배포 판정 불가 ${시각()} KST** — ctype \`${결과}\` · 라이브 \`${code}\`.\n` +
            `> 서비스는 구버전으로 계속 돕니다. **재배포 전에 라이브를 눈으로 확인하십시오** — 「실패」로 단정하지 마십시오.`,
        );
        console.log(`\n⚠ 판정 불가 — ctype ${결과} · 라이브 ${code}. 재배포 전 눈으로 확인.`);
      }
    }
  } finally {
    락풀기();
    ctype(['ls', '-t', 나.stage]); // 전역 스테이지를 우리 것으로 되돌려 둔다
    console.log('락 풀었다.');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    락풀기();
    console.error(e);
    process.exit(1);
  });
}
