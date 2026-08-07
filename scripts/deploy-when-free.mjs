/**
 * 앞 배포가 끝날 때까지 기다렸다가 내보낸다.
 *
 * 왜 — 배포 도구는 앞 배포가 `Starting` 이면 **바르게 멈춘다.** 그런데 그때 손을 떼면
 *   고친 것이 라이브에 안 나간 채로 남는다. 8/6 에 5번이 그렇게 **2시간 40분**을 기다렸다.
 *   ⛔ 사람이 「이따 다시 해야지」로 들고 있으면 잊는다. 도구가 들고 있게 한다.
 *
 * 쓰는 법
 *   node scripts/deploy-when-free.mjs          3분마다 최대 8번(=24분) 다시 해 본다
 *   node scripts/deploy-when-free.mjs --번 12  횟수를 바꾼다
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

const 몇번 = Number(process.argv[process.argv.indexOf('--번') + 1]) || 8;
const 쉬는초 = 180;

const 때 = () => new Date().toTimeString().slice(0, 5);

for (let i = 1; i <= 몇번; i++) {
  const r = spawnSync(process.execPath, [path.join(여기, 'deploy.mjs')], {
    cwd: 뿌리,
    encoding: 'utf8',
  });
  const 글 = (r.stdout ?? '') + (r.stderr ?? '');
  const 마지막 = 글.trim().split('\n').slice(-3).join('\n');

  if (r.status === 0) {
    console.log(`✅ ${때()} ${i}번째에 나갔다\n${마지막}`);
    process.exit(0);
  }

  // 앞 배포가 도는 중이면 기다린다. 그 밖의 실패는 기다려도 안 풀린다
  // ⚠ **상대 프로젝트(klifemap)가 Starting 인 것도 기다리면 풀린다.**
  //   처음엔 이걸 「기다려도 안 풀리는 실패」로 보고 바로 멈췄다(2026-08-07 19:43).
  //   두 프로젝트가 같은 서버를 나눠 쓰므로 상대가 뜰 때까지 기다리는 것이 맞다.
  const 기다릴만한가 = /이미 Starting|이미 배포 중|배포 중이다|Starting 다/.test(글);
  if (!기다릴만한가) {
    console.log(`⛔ ${때()} 기다려도 안 풀리는 실패다. 멈춘다.\n${마지막}`);
    process.exit(1);
  }

  console.log(`⏳ ${때()} ${i}/${몇번} — 앞 배포가 아직 돈다. ${쉬는초 / 60}분 뒤 다시 한다`);
  if (i < 몇번) await new Promise((res) => setTimeout(res, 쉬는초 * 1000));
}

console.log(`⛔ ${때()} ${몇번}번을 다 썼는데 못 나갔다. 사람이 봐야 한다.`);
process.exit(1);
