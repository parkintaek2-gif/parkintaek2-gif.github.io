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

/** ⚠ 저장소 **바깥**이다. klifemap 세션도 같은 경로를 본다. */
const LOCK = path.resolve('C:/Users/USER/Documents/GitHub/.cloudtype-deploy-lock.json');
const 나 = { project: 'seoulmarkets', stage: '@parkintaek2/seoulmarkets:main', app: 'web' };
const 상대 = { project: 'klifemap', stage: '@parkintaek2/klifemap:main', app: 'klifemap-app' };
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
function 상태(stage, app) {
  const out = ctype(['ls', '-t', stage]).replace(/\x1b\[[0-9;]*m/g, '');
  for (const line of out.split(/\r?\n/)) {
    const c = line.trim().split(/\s{2,}/);
    if (c[0] === app) return { status: c[2] ?? '?', updated: c.slice(-1)[0] ?? '' };
  }
  return { status: '알 수 없음', updated: '', raw: out.slice(0, 300) };
}

function 락읽기() {
  if (!existsSync(LOCK)) return null;
  try {
    const j = JSON.parse(readFileSync(LOCK, 'utf8'));
    const 지난분 = (Date.now() - new Date(j.startedAt).getTime()) / 60000;
    return { ...j, 지난분 };
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

async function main() {
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
    console.error(`⛔ 이 프로젝트가 이미 배포 중이다 (${락.지난분.toFixed(1)}분 전 시작).`);
    process.exit(1);
  }

  // ── ② 상대 스테이지가 안정적인가 ───────────────────────────
  const 상대상태 = 상태(상대.stage, 상대.app);
  console.log(`  ${상대.project.padEnd(13)} ${상대상태.status}   (갱신 ${상대상태.updated})`);
  const 내상태 = 상태(나.stage, 나.app);
  console.log(`  ${나.project.padEnd(13)} ${내상태.status}   (갱신 ${내상태.updated})`);

  const 막힘 = [];
  if (상대상태.status !== 'Running') {
    막힘.push(`${상대.project} 이 ${상대상태.status} 다 — 배포 중인 것을 밀면 둘 다 죽는다`);
  }
  if (내상태.status === 'Starting') {
    막힘.push(`이 프로젝트가 이미 Starting 이다 — 앞선 배포가 아직 안 끝났다`);
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
    let 결과 = 'Starting';
    for (let i = 0; i < 30; i++) {
      await sleep(20000);
      결과 = 상태(나.stage, 나.app).status;
      console.log(`  ${(i + 1) * 20}초 · ${결과}`);
      if (결과 === 'Running') break;
    }

    if (결과 === 'Running') {
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
