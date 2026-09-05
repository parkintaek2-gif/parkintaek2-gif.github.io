#!/usr/bin/env node
/**
 * backup-my-transcript.mjs — 2번(나) 자리의 최신 대화록(.jsonl)을 원드라이브로 복사한다.
 *
 * ── 왜 (2026-09-05 · 2번) ────────────────────────────────────────
 * 사장님 지시: 「원드라이브에 매일 1시 백업을 걸어라. 너도 해」.
 * 세션이 먹통→강제재시작되면 이 기기 로컬에만 있는 대화록(내 생각의 원본)이
 * 유실될 수 있다(실제 작업물은 git에 매번 커밋돼 안전하다 — 이건 그 나머지
 * 한 조각을 지키는 것).
 *
 * ⛔ 살아 있는 세션 파일을 «잠그지» 않는다. 읽기 복사만 한다.
 * ⛔ 덮어쓰지 않는다 — 날짜별로 쌓는다(어제 백업이 오늘 것 때문에 사라지지 않는다).
 *
 * 쓰는 법
 *   node scripts/backup-my-transcript.mjs
 */
import { readdirSync, statSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const 뿌리 = 'C:/Users/User/.claude-u2/projects';
const 백업폴더 = 'C:/Users/User/OneDrive/세션 운영자료/대화록백업/2번';

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
  console.log('⛔ 대화록을 못 찾았다 — .claude-u2/projects 아래에 jsonl이 없다');
  process.exit(1);
}

// 가장 최근에 바뀐 것 = 지금 살아있는(또는 마지막) 대화록으로 본다
후보.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
const 최신 = 후보[0];

const 오늘 = new Date().toISOString().slice(0, 10);
mkdirSync(백업폴더, { recursive: true });
const 목적지 = path.join(백업폴더, `${오늘}_${path.basename(최신)}`);

copyFileSync(최신, 목적지);
console.log(`✅ 백업 완료 — ${최신} → ${목적지}`);
console.log(`   크기 ${(statSync(최신).size / 1024 / 1024).toFixed(1)}MB · 마지막수정 ${statSync(최신).mtime.toLocaleString('ko-KR')}`);
