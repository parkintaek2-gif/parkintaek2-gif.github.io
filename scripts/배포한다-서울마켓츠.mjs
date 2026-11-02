#!/usr/bin/env node
/**
 * 배포한다-서울마켓츠.mjs
 *   서울마켓츠(세 사이트를 함께 내는 서버) 운영 배포를 다시 올린다.
 *
 * ── 왜 이 파일이 있나 (2026-11-03) ────────────────────────────────
 *   윈도에서 노드가 `npx.cmd` 를 못 띄운다(EINVAL). ctype 본체(.js)를 노드로
 *   직접 띄우는 것이 이 저장소의 확립된 방식이다 — 심는다-다리열쇠.mjs 와 같다.
 *
 * ⛔ 서 있는 폴더와 `-t` 가 짝이어야 한다 — dataeconomics 폴더 / web.
 * ⚠ 설정(.cloudtype/app.yaml)을 바꾼 것이 아니면 `apply` 가 아니라 `update` 다.
 *
 * 쓰는 법
 *   node scripts/배포한다-서울마켓츠.mjs
 */
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ctype자리 } from './심는다-다리열쇠.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 짝 = '@parkintaek2/seoulmarkets:main';
const 대상 = 'web';

const 위치 = ctype자리();
if (!위치) {
  console.log('🔴 ctype 본체를 찾지 못했다');
  process.exit(1);
}

console.log('■ 재배포를 시작한다 — ' + 대상 + ' / ' + 짝);
const 아이 = spawn(process.execPath, [위치, 'update', 대상, '-t', 짝], {
  cwd: 뿌리, stdio: 'inherit',
});
아이.on('close', (번호) => {
  console.log(번호 === 0 ? '\n✅ 재배포 명령이 받아들여졌다' : '\n🔴 실패 — 종료 번호 ' + 번호);
  process.exit(번호 === 0 ? 0 : 1);
});
