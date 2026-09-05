#!/usr/bin/env node
/**
 * backup-claude-u6-onedrive.mjs — 6번 세션설정칸(.claude-u6)을 원드라이브로 매일 복제한다.
 *
 * 왜 (2026-09-05 밤): 6번 재개-번호 건에서 로컬(이 기기 한 대)에만 있는 세션자료가
 * 사라지면 못 되찾는다는 게 드러났다. 다른 자리도 같은 조치를 했다 — 「너도 해」.
 *
 * robocopy /MIR 대신 날짜 폴더에 쌓는다 — 오늘 자료가 깨진 채 미러되면 어제 것까지
 * 같이 잃는다. 오래된 날짜 폴더는 이 자가 스스로 정리한다(기본 14일 넘는 것만 지움).
 *
 * 쓰는 법
 *   node scripts/backup-claude-u6-onedrive.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

const 원본 = 'C:\\Users\\USER\\.claude-u6';
const 대상뿌리 = 'C:\\Users\\User\\OneDrive\\SeoulMarkets 백업\\claude-u6-세션백업';
const 보관일수 = 14;

if (!existsSync(원본)) {
  console.error(`⛔ 원본이 없다 — ${원본}`);
  process.exit(1);
}

const 오늘 = new Date().toISOString().slice(0, 10);
const 대상 = path.join(대상뿌리, 오늘);
mkdirSync(대상뿌리, { recursive: true });

console.log(`■ ${원본} → ${대상}`);
/* robocopy 는 성공해도 종료코드가 0이 아닐 수 있다 — 0~7은 정상, 8 이상만 진짜 실패다 */
const 결과 = spawnSync('robocopy', [원본, 대상, '/E', '/R:2', '/W:2', '/NFL', '/NDL', '/NJH'], {
  encoding: 'utf8',
  windowsHide: true,
});
const 코드 = 결과.status ?? 99;
if (코드 >= 8) {
  console.error(`⛔ robocopy 실패(코드 ${코드})`);
  console.error(결과.stdout || 결과.stderr);
  process.exit(1);
}
console.log(`✅ 복제됨 (robocopy 코드 ${코드}, 0~7 정상)`);

/* 오래된 날짜 폴더 정리 */
if (existsSync(대상뿌리)) {
  const 지금 = Date.now();
  for (const 이름 of readdirSync(대상뿌리)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(이름)) continue;
    const 칸 = path.join(대상뿌리, 이름);
    const st = statSync(칸);
    const 지난일 = (지금 - st.mtimeMs) / 86400000;
    if (지난일 > 보관일수) {
      rmSync(칸, { recursive: true, force: true });
      console.log(`  🗑 ${이름} 지움(${Math.round(지난일)}일 지남)`);
    }
  }
}
