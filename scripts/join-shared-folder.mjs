/**
 * 바탕화면 「공동 폴더」를 OneDrive 쪽 한 벌로 합치고, 바탕화면에는 정션(바로가기)을 둔다.
 *
 * 왜
 *   사장님 지시(2026-08-06 00:19): 「폴더를 바탕화면과 onedrive에 같이 올려.
 *   항상 동기화해서 내가 모바일이든 pc든 볼 수 있게」
 *   두 폴더를 **따로** 두면 갈라진다 — 실제로 감수용 리포트 폴더가 7장 어긋나 있었다.
 *   한 벌만 두고 바탕화면은 그 자리를 가리키게 한다.
 *
 * ⚠ 파일이 열려 있으면 폴더를 못 지운다. 그래서 **될 때까지 다시 해 본다.**
 *   ⛔ 지우기 전에 OneDrive 쪽에 같은 내용이 있는지 **해시로 확인**한다. 없으면 손대지 않는다.
 *
 * 쓰는 법
 *   node scripts/join-shared-folder.mjs            한 번 해 본다
 *   node scripts/join-shared-folder.mjs --지킨다     될 때까지 1분마다 다시 해 본다 (최대 40분)
 *   node scripts/join-shared-folder.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const 바탕 = 'C:\\Users\\USER\\Desktop\\공동 폴더';
export const 원드 = 'C:\\Users\\USER\\OneDrive\\공동 폴더';

export function 해시(파일) {
  return crypto.createHash('sha256').update(fs.readFileSync(파일)).digest('hex');
}

/** 바탕화면 쪽 파일이 전부 OneDrive 에 **같은 내용으로** 있는가. 아니면 지우면 안 된다. */
export function 잃을것있나(바탕경로 = 바탕, 원드경로 = 원드) {
  const 잃을것 = [];
  for (const 이름 of fs.readdirSync(바탕경로)) {
    const a = path.join(바탕경로, 이름);
    if (fs.statSync(a).isDirectory()) continue;
    const b = path.join(원드경로, 이름);
    if (!fs.existsSync(b)) { 잃을것.push(`${이름} — 저쪽에 없다`); continue; }
    if (해시(a) !== 해시(b)) 잃을것.push(`${이름} — 내용이 다르다`);
  }
  return 잃을것;
}

export function 정션인가(경로) {
  try {
    return fs.lstatSync(경로).isSymbolicLink();
  } catch {
    return false;
  }
}

function 한번() {
  if (!fs.existsSync(원드)) return { 됐나: false, 왜: 'OneDrive 쪽 폴더가 없다 — 손대지 않는다' };
  if (정션인가(바탕)) return { 됐나: true, 왜: '이미 정션이다' };
  if (!fs.existsSync(바탕)) {
    execFileSync('cmd', ['/c', 'mklink', '/J', 바탕, 원드]);
    return { 됐나: true, 왜: '정션을 새로 걸었다' };
  }

  const 잃을것 = 잃을것있나();
  if (잃을것.length) return { 됐나: false, 왜: `⛔ 지우면 잃는다 — ${잃을것.join(' · ')}` };

  try {
    fs.rmSync(바탕, { recursive: true, force: true });
  } catch (e) {
    return { 됐나: false, 왜: `아직 못 지운다(누가 열어 두었다) — ${e.code ?? e.message}` };
  }
  execFileSync('cmd', ['/c', 'mklink', '/J', 바탕, 원드]);
  return { 됐나: true, 왜: '합치고 정션을 걸었다' };
}

/* ── 실행 ─────────────────────────────────────────────────────────── */

if (process.argv.includes('--selftest')) {
  const 잰다 = [];
  const 재기 = (이름, 본것, 바란것) => {
    const 같다 = JSON.stringify(본것) === JSON.stringify(바란것);
    잰다.push(같다);
    console.log(`${같다 ? '✅' : '❌'} ${이름}${같다 ? '' : `\n   본 것 ${JSON.stringify(본것)}\n   바란 것 ${JSON.stringify(바란것)}`}`);
  };

  const 임시 = path.join(process.env.TEMP, `join-test-${process.pid}`);
  const A = path.join(임시, 'a'), B = path.join(임시, 'b');
  fs.mkdirSync(A, { recursive: true });
  fs.mkdirSync(B, { recursive: true });
  fs.writeFileSync(path.join(A, '같다.txt'), '한 줄');
  fs.writeFileSync(path.join(B, '같다.txt'), '한 줄');
  재기('같으면 잃을 것이 없다', 잃을것있나(A, B), []);

  fs.writeFileSync(path.join(A, '저쪽에없다.txt'), '나만 있다');
  재기('저쪽에 없으면 잡는다', 잃을것있나(A, B).length, 1);

  fs.writeFileSync(path.join(B, '저쪽에없다.txt'), '다른 내용');
  재기('내용이 다르면 잡는다', 잃을것있나(A, B)[0].includes('내용이 다르다'), true);

  재기('보통 폴더는 정션이 아니다', 정션인가(A), false);
  fs.rmSync(임시, { recursive: true, force: true });

  const 틀린것 = 잰다.filter((x) => !x).length;
  console.log(틀린것 ? `\n❌ ${틀린것}개 어긋났다` : `\n✅ ${잰다.length}개 다 맞다`);
  process.exit(틀린것 ? 1 : 0);
}

const 지킨다 = process.argv.includes('--지킨다');
let 남은번 = 지킨다 ? 40 : 1;
while (남은번-- > 0) {
  const r = 한번();
  console.log(`${r.됐나 ? '✅' : '⏳'} ${r.왜}`);
  if (r.됐나 || !지킨다) break;
  if (r.왜.startsWith('⛔')) break; // 잃을 게 있으면 되풀이해도 소용없다
  await new Promise((res) => setTimeout(res, 60_000));
}
