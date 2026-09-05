#!/usr/bin/env node
/**
 * backup-my-transcript-u4.mjs — 4번(나) 자리의 최신 대화록(.jsonl)을 원드라이브로 복사한다.
 *
 * ── 왜 (2026-09-05 · 4번) ────────────────────────────────────────
 * 사장님 지시: 「원드라이브에 매일 1시 백업을 걸어라. 너도 해」(2번이 먼저 만든
 * scripts/backup-my-transcript.mjs 의 4번판). 세션이 먹통→강제재시작되면 이 기기
 * 로컬에만 있는 대화록(내 생각의 원본)이 유실될 수 있다(실제 작업물은 git에 매번
 * 커밋돼 안전하다 — 이건 그 나머지 한 조각을 지키는 것).
 *
 * ⚠ scripts/save-history.mjs(5번, 9/1)가 이미 여섯 자리 전부를 매시 :10 에
 *   ~/대화기록-사본 으로 복사하지만 그곳은 **원드라이브가 아니다**(로컬 홈).
 *   사장님이 원하신 것은 원드라이브(클라우드) 사본이라 이 자를 따로 둔다.
 *
 * ⛔ 살아 있는 세션 파일을 «잠그지» 않는다. 읽기 복사만 한다.
 * ⛔ 덮어쓰지 않는다 — 날짜별로 쌓는다(어제 백업이 오늘 것 때문에 사라지지 않는다).
 *
 * ── 고침 (2026-09-06 · 4번) ──────────────────────────────────────
 * 6번·2번이 자기 백업 자에서 먼저 잡은 것과 «같은 병» — `toISOString()`은 UTC라
 * KST 00시~09시 사이엔 «어제» 날짜로 찍힌다. 01:00 KST 예약이 매번 이 창 안에서
 * 도니 이 자는 늘 하루 전 날짜로 찍히고 있었다(오늘 01:00 실행분이 2026-09-05로
 * 잘못 찍힌 것을 확인·이름만 2026-09-06으로 바로잡음, 내용은 그대로).
 *
 * 쓰는 법
 *   node scripts/backup-my-transcript-u4.mjs
 */
import { readdirSync, statSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const 뿌리 = 'C:/Users/User/.claude-u4/projects';
const 백업폴더 = 'C:/Users/User/OneDrive/세션 운영자료/대화록백업/4번';

function 재귀jsonl(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const it of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, it.name);
    if (it.isDirectory()) 재귀jsonl(p, out);
    else if (it.name.endsWith('.jsonl') && !p.includes('subagents')) out.push(p);
  }
  return out;
}

const 후보 = 재귀jsonl(뿌리);
if (후보.length === 0) {
  console.log('⛔ 대화록을 못 찾았다 — .claude-u4/projects 아래에 jsonl이 없다');
  process.exit(1);
}

// 가장 최근에 바뀐 것 = 지금 살아있는(또는 마지막) 대화록으로 본다
후보.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
const 최신 = 후보[0];

const 오늘 = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
mkdirSync(백업폴더, { recursive: true });
const 목적지 = path.join(백업폴더, `${오늘}_${path.basename(최신)}`);

copyFileSync(최신, 목적지);
console.log(`✅ 백업 완료 — ${최신} → ${목적지}`);
console.log(`   크기 ${(statSync(최신).size / 1024 / 1024).toFixed(1)}MB · 마지막수정 ${statSync(최신).mtime.toLocaleString('ko-KR')}`);
