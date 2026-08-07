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
import { readFileSync } from 'node:fs';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const { 살아있나, 갱신지난분, 헛돌았나, 상대가배포중인가 } = await import(pathToFileURL(path.join(여기, 'deploy.mjs')).href);

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

/**
 * 2026-08-08 새벽 — **상대 프로젝트 표시가 멎은 것**을 배포 중으로 보고 네 번 막혔다.
 * 한 시간 반을 잃었다. 표시가 얼마나 지났는지 못 재면 그 판정을 할 수 없다.
 */
console.log('\n표시가 얼마나 지났나 — 못 읽으면 짐작하지 않는다');
const 때 = new Date('2026-08-08T02:11:00');
봄('12분 지난 것을 12로 읽는다', Math.round(갱신지난분('2026-08-08 01:59:00', 때)), 12);
봄('방금 것은 0 에 가깝다', Math.round(갱신지난분('2026-08-08 02:11:00', 때)), 0);
봄('⭐ 못 읽으면 null — 0 으로 밀지 않는다', 갱신지난분('아무말', 때), null);
봄('빈 값도 null', 갱신지난분('', 때), null);
봄('undefined 도 null', 갱린지난분를안전하게(갱신지난분, undefined, 때), null);
봄('⚠ 미래 시각은 0 으로 본다(시계가 어긋난 것)', 갱신지난분('2026-08-08 03:00:00', 때), 0);

/* 2026-08-08 02:3x — 화면에 「12분째」라 적어 놓고 막았다. 판정은 11.6 으로 했다.
 * ⛔ 적은 수와 잰 수가 다르면 사람이 도구를 못 믿는다. 내림으로 맞췄다. */
봄('⭐ 적은 수와 잰 수가 같다 — 11분 38초는 11이다',
  갱신지난분('2026-08-08 02:18:54', new Date('2026-08-08T02:30:32')), 11);
봄('12분을 넘겨야 12다',
  갱신지난분('2026-08-08 02:18:00', new Date('2026-08-08T02:30:30')), 12);

function 갱린지난분를안전하게(f, a, b) { try { return f(a, b); } catch { return '던졌다'; } }

/**
 * 🔴 2026-08-08 05:3x — **배포가 「✅ 나갔다」로 끝났는데 아무것도 안 나갔다.**
 *
 * 부른 자리가 저장소가 아니어서 ctype 이 `.cloudtype/app.yaml` 을 못 찾았다.
 * 그런데 **조용히 넘어가고 있던 통을 되살렸다** — 60초 만에 Running,
 * 라이브 200. 그래서 나간 줄 알았다. 3번이 낸 길은 라이브에 없었다.
 *
 * ⛔ 멎는 것은 눈에 보인다. **「성공」이라 말하며 안 나가는 것은 안 보인다.**
 */
console.log('\n헛돌았나 — ctype 이 「파일이 없다」를 조용히 넘긴다');
봄('⭐ not found 가 보이면 헛돈 것이다',
  헛돌았나('file "C:\\Users\\USER\\Desktop\\00_세션입구\\.cloudtype\\app.yaml" not found'), true);
봄('대소문자를 가리지 않는다', 헛돌았나('File Not Found'), true);
봄('no such file 도 잡는다', 헛돌았나('no such file or directory'), true);
봄('⭐ 멀쩡한 출력은 헛돈 것이 아니다', 헛돌았나('deployment applied\nRunning'), false);
봄('빈 출력도 아니다', 헛돌았나(''), false);
봄('없는 값도 아니다', 헛돌았나(undefined), false);

/**
 * 🔴 2026-08-08 — **오늘만 네 번 상대 표시에 막혔다**(06:28·07:03·07:19·08:08).
 * 네 번 다 klifemap.ai 는 200 이었고 1번은 그 사이 커밋하고 있었다.
 * 네 번째는 11분째라 12분 문턱에 1분 모자라 막혔다 — 문턱은 임의의 수다.
 * ⭐ 락이 더 나은 자다. 락은 우리가 쓰는 사실이고 ctype 표시는 남이 보여 주는 화면이다.
 */
console.log('\n상대가 배포 중인가 — 표시가 아니라 락으로 본다');
const 산락 = (덧) => ({ project: 'klifemap', 임자살아있다: true, 지난분: 2, ...덧 });
봄('⭐ 락이 아예 없으면 아무도 안 하고 있다', 상대가배포중인가(null, 'klifemap'), false);
봄('상대가 쥐고 있으면 배포 중이다', 상대가배포중인가(산락(), 'klifemap'), true);
봄('⭐ 내 락이면 상대가 하는 게 아니다', 상대가배포중인가(산락({ project: 'seoulmarkets' }), 'klifemap'), false);
봄('⭐ 임자가 죽었으면 남은 자국일 뿐이다', 상대가배포중인가(산락({ 임자살아있다: false }), 'klifemap'), false);
봄('너무 오래된 락은 만료로 본다', 상대가배포중인가(산락({ 지난분: 25 }), 'klifemap', 20), false);
봄('만료 직전은 아직 살아 있다', 상대가배포중인가(산락({ 지난분: 19 }), 'klifemap', 20), true);
봄('지난분을 모르면 막는 쪽으로 둔다', 상대가배포중인가(산락({ 지난분: undefined }), 'klifemap'), true);

/* 🔴 자리를 안 박아 둔 것이 뿌리였다. 이 파일이 어디서 불려도 저장소를 가리켜야 한다 */
console.log('\n자리(cwd)에 안 기대나 — 어디서 불러도 저장소를 본다');
const 배포소스 = readFileSync(path.join(여기, 'deploy.mjs'), 'utf8');
봄('⭐ 설계도를 상대경로로 주지 않는다',
  /'\.cloudtype\/app\.yaml'/.test(배포소스), false);
봄('⭐ ctype 을 저장소에서 돌린다', /cwd:\s*뿌리/.test(배포소스), true);
봄('⭐ 저장소 뿌리를 제 파일 자리에서 잡는다',
  /뿌리\s*=\s*path\.resolve\(path\.dirname\(fileURLToPath/.test(배포소스), true);
봄('⭐ dist 를 「뿌리」라는 같은 이름으로 가리지 않는다',
  /const 뿌리 = path\.resolve\('dist'\)/.test(배포소스), false);

const 틀린것 = 잰다.filter((x) => !x).length;
console.log(틀린것 ? `\n❌ ${틀린것}개 어긋났다` : `  ${잰다.length} 통과 · 0 실패`);
process.exit(틀린것 ? 1 : 0);
