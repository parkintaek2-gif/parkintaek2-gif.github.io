/**
 * 한 번에 **하나만** 빌드한다.
 *
 * 🔴 왜 — 2026-08-07 16:4x, 빌드가 이렇게 죽었다.
 *   `ENOENT: no such file or directory, mkdir 'dist\100y\major'`
 *   여섯 자리가 **같은 작업트리**를 쓴다. 두 자리가 동시에 `astro build` 를 돌리면
 *   한쪽이 dist 를 비우는 사이 다른 쪽이 그 안에 쓰려다 죽는다.
 *   ⚠ 더 나쁜 것은 **죽지 않고 반쯤 섞인 dist 가 남는 것**이다 —
 *     그걸로 판정하면 「나갔다/안 나갔다」가 통째로 틀린다. 오늘 그 근처까지 갔다.
 *
 * ⛔ `node node_modules/astro/bin/astro.mjs build` 를 직접 부르지 마십시오.
 *   이 파일을 부르십시오. 남이 빌드 중이면 **기다렸다가** 돕니다.
 *
 * 쓰는 법
 *   node scripts/build-once.mjs            남이 끝나면 내가 빌드한다 (최대 10분 기다림)
 *   node scripts/build-once.mjs --selftest
 */
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
/** ⚠ 저장소 **안**에 둔다 — 이 자물쇠는 「이 작업트리」 이야기다. .gitignore 에 넣는다 */
export const 자물쇠 = path.join(뿌리, '.build-lock.json');
export const 오래되면분 = 12;   // 빌드가 이보다 오래 걸리면 죽은 것으로 본다

/** 자물쇠를 건 프로세스가 아직 사는가. 죽었으면 남은 자물쇠일 뿐이다. */
export function 살아있나(pid) {
  if (!pid) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

export function 읽기() {
  if (!existsSync(자물쇠)) return null;
  try {
    const j = JSON.parse(readFileSync(자물쇠, 'utf8'));
    return { ...j, 지난분: (Date.now() - new Date(j.언제).getTime()) / 60000, 산다: 살아있나(j.pid) };
  } catch {
    return null;
  }
}

/** 지금 빌드해도 되는가. 안 되면 왜 안 되는지 말로 준다. */
export function 걸어도되나(락, 한계 = 오래되면분) {
  if (!락) return { 된다: true, 왜: '자물쇠가 없다' };
  if (!락.산다) return { 된다: true, 왜: `자물쇠를 건 pid ${락.pid} 가 죽었다` };
  if (락.지난분 >= 한계) return { 된다: true, 왜: `${락.지난분.toFixed(0)}분째라 만료로 본다` };
  return { 된다: false, 왜: `${락.자리 ?? '누군가'} 가 ${락.지난분.toFixed(1)}분째 빌드 중이다` };
}

if (process.argv.includes('--selftest')) {
  const 잰다 = [];
  const 봄 = (이름, 본것, 바란것) => {
    const 같다 = JSON.stringify(본것) === JSON.stringify(바란것);
    잰다.push(같다);
    console.log(`${같다 ? '✅' : '❌'} ${이름}${같다 ? '' : `  본 것 ${JSON.stringify(본것)} / 바란 것 ${JSON.stringify(바란것)}`}`);
  };
  봄('자물쇠가 없으면 걸어도 된다', 걸어도되나(null).된다, true);
  봄('내가 살아 있으면 못 건다', 걸어도되나({ pid: process.pid, 지난분: 1, 산다: true }).된다, false);
  봄('⛔ 죽은 임자면 걸어도 된다', 걸어도되나({ pid: 999999, 지난분: 1, 산다: false }).된다, true);
  봄('오래되면 만료로 본다', 걸어도되나({ pid: process.pid, 지난분: 30, 산다: true }).된다, true);
  봄('살아 있는 pid 를 안다', 살아있나(process.pid), true);
  봄('없는 pid 는 죽었다', 살아있나(999999), false);
  const 틀린것 = 잰다.filter((x) => !x).length;
  console.log(틀린것 ? `\n❌ ${틀린것}개 어긋났다` : `\n✅ ${잰다.length}개 다 맞다`);
  process.exit(틀린것 ? 1 : 0);
}

/* ── 실제로 빌드 ───────────────────────────────────────────────── */

const 자리 = process.env.CLAUDE_SEAT || '이름 없는 창';
const 최대기다림초 = 600;
const 때 = () => new Date().toTimeString().slice(0, 5);

let 기다린초 = 0;
while (true) {
  const r = 걸어도되나(읽기());
  if (r.된다) break;
  if (기다린초 >= 최대기다림초) {
    console.error(`⛔ ${최대기다림초 / 60}분을 기다렸는데 ${r.왜}. 사람이 봐야 한다.`);
    process.exit(1);
  }
  if (기다린초 === 0) console.log(`⏳ ${때()} ${r.왜} — 기다린다`);
  await new Promise((res) => setTimeout(res, 15000));
  기다린초 += 15;
}

writeFileSync(자물쇠, JSON.stringify({ 자리, pid: process.pid, 언제: new Date().toISOString() }));
let 결과 = 1;
try {
  console.log(`${때()} 빌드한다 (${자리})`);
  결과 = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], {
    cwd: 뿌리,
    stdio: 'inherit',
  }).status ?? 1;
} finally {
  // ⚠ 내 자물쇠만 푼다. 만료로 남이 가져갔을 수 있다
  const 지금락 = 읽기();
  if (지금락 && 지금락.pid === process.pid) unlinkSync(자물쇠);
}
/**
 * 🔴 2026-09-02(3번, GEO) — astro build 뒤 100yearmap 지면마다 .md 판을 낸다.
 * ⛔⛔ 이 저장소를 여섯 자리가 같이 쓴다 — 여기서 던지면 **전 유닛 배포가 막힌다.**
 *   그래서 별도 프로세스로 돌리고 종료코드를 무시한다. 실패해도 astro 빌드 결과(결과)만
 *   이 스크립트의 exit code 를 정한다 — .md 가 안 나가도 배포는 막지 않는다.
 */
if (결과 === 0) {
  try {
    const md결과 = spawnSync(process.execPath, ['scripts/build-100y-markdown.mjs'], {
      cwd: 뿌리,
      stdio: 'inherit',
      timeout: 60000,
    });
    if (md결과.status !== 0) console.log('⚠ 100y 마크다운 판 생성 실패 — 배포는 계속한다(.html은 정상)');
  } catch (e) {
    console.log(`⚠ 100y 마크다운 판 생성 중 오류(무시하고 계속) — ${e.message}`);
  }
}

/**
 * 🔴 2026-09-02(6번, GEO [5번→6번] ②) — astro build 뒤 SeoulMarkets 기사마다 .md 판을 낸다.
 * ⛔⛔ 위 100y 블록과 같은 이유로 별도 프로세스·종료코드 무시 — .md가 안 나가도 배포는 막지 않는다.
 */
if (결과 === 0) {
  try {
    const md결과 = spawnSync(process.execPath, ['scripts/build-seoulmarkets-markdown.mjs'], {
      cwd: 뿌리,
      stdio: 'inherit',
      timeout: 60000,
    });
    if (md결과.status !== 0) console.log('⚠ SeoulMarkets 마크다운 판 생성 실패 — 배포는 계속한다(.html은 정상)');
  } catch (e) {
    console.log(`⚠ SeoulMarkets 마크다운 판 생성 중 오류(무시하고 계속) — ${e.message}`);
  }
}

/**
 * 🔴 2026-09-03(5번) — KCW 기사마다 .md 판을 낸다.
 *   같은 GEO 지시를 3번·6번은 했는데 **5번만 빠져 있었다.** 오늘 낸 여섯 편의 .md 판이
 *   라이브에서 전부 404 인 것을 재서 알았다.
 * ⛔ 위 두 블록과 같은 이유로 종료코드 무시 — .md 가 안 나가도 배포는 막지 않는다.
 */
if (결과 === 0) {
  try {
    const kcw결과 = spawnSync(process.execPath, ['scripts/build-kcw-markdown.mjs'], {
      cwd: 뿌리,
      stdio: 'inherit',
      timeout: 60000,
    });
    if (kcw결과.status !== 0) console.log('⚠ KCW 마크다운 판 생성 실패 — 배포는 계속한다(.html은 정상)');
  } catch (e) {
    console.log(`⚠ KCW 마크다운 판 생성 중 오류(무시하고 계속) — ${e.message}`);
  }
}

/**
 * 🔴 2026-09-02(6번, GEO [5번→6번] ③) — 표 있는 기사마다 Dataset 구조화데이터가 실제로 나갔는지 잰다.
 * ⛔⛔ 위 블록들과 같은 이유로 별도 프로세스·종료코드 무시 — 알림용일 뿐 배포를 막지 않는다.
 */
if (결과 === 0) {
  try {
    spawnSync(process.execPath, ['scripts/check-seoulmarkets-dataset-schema.mjs'], {
      cwd: 뿌리,
      stdio: 'inherit',
      timeout: 60000,
    });
  } catch (e) {
    console.log(`⚠ Dataset 구조화데이터 확인 중 오류(무시하고 계속) — ${e.message}`);
  }
}

console.log(결과 === 0 ? `✅ ${때()} 빌드 끝` : `⛔ ${때()} 빌드 실패`);
process.exit(결과);
