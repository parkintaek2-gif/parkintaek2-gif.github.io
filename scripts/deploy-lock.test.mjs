/**
 * 배포 자물쇠 — **죽은 프로세스가 남긴 락**을 산 것으로 보지 않는지 잰다.
 *
 * 왜 이 검사가 있나 — 2026-08-07 하루에 **세 번** 이 자물쇠에 막혔다.
 * 배포가 중간에 끊길 때마다 락이 남았고, 그때마다 20분을 기다리거나 손으로 지웠다.
 * ⛔ 손으로 지우는 것이 위험하다 — 진짜 도는 배포를 지울 수 있다.
 * 그래서 **pid 가 살아 있는지**로 가르게 고쳤고, 그 판정을 여기서 잰다.
 */
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const { 살아있나 } = await import(pathToFileURL(path.join(여기, 'deploy.mjs')).href);

const 잰다 = [];
const 봄 = (이름, 본것, 바란것) => {
  const 같다 = 본것 === 바란것;
  잰다.push(같다);
  console.log(`  ${같다 ? '✅' : '❌'} ${이름}${같다 ? '' : `  본 것 ${본것} / 바란 것 ${바란것}`}`);
};

console.log('배포 자물쇠 — 죽은 임자 가리기');
봄('나 자신은 살아 있다', 살아있나(process.pid), true);
봄('없는 pid 는 죽었다', 살아있나(999999), false);
봄('⚠ pid 가 없는 옛 락은 살아 있는 것으로 본다(안전한 쪽)', 살아있나(undefined), true);
봄('0 도 마찬가지다', 살아있나(0), true);

const 틀린것 = 잰다.filter((x) => !x).length;
console.log(틀린것 ? `\n❌ ${틀린것}개 어긋났다` : `  ${잰다.length} 통과 · 0 실패`);
process.exit(틀린것 ? 1 : 0);
