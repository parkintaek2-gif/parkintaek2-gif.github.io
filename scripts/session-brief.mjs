#!/usr/bin/env node
/**
 * 세션 시작 브리핑 — **사장님이 같은 말을 반복하지 않게 한다.**
 *
 * ── 왜 만드는가 ─────────────────────────────────────────────────
 * 사장님 지시(2026-08-03 00:3x KST):
 *   「컨텍스트 다 썼다고 새 세션에서 해야 하는 게 너무 번거로워. 같은 말을 계속 반복하니까」
 *
 * 지금까지 새 세션은 사장님이 **말로 브리핑해 줘야** 일을 시작했다.
 *   「git pull 하고 세션간-메모 끝부터 읽어라」
 *   「인계 문서 읽고 이어서 해」
 *   「ctype 은 -t 없이 안 나간다」
 * **그걸 사람이 기억해서 말해야 하는 구조가 잘못된 것이다.**
 *
 * SessionStart 훅으로 이 파일이 자동으로 돌아 결과를 컨텍스트에 주입한다.
 * 사장님은 이제 **바로 일을 시키면 된다.**
 *
 * ── 무엇을 넣고 무엇을 안 넣는가 ────────────────────────────────
 * CLAUDE.md 가 이미 자동으로 읽힌다. 거기 있는 것을 또 넣지 않는다 —
 * **중복은 컨텍스트만 먹고 주의를 흐린다.** 여기 넣는 것은 CLAUDE.md 가 못 담는
 * **「지금 상태」**뿐이다. 문서는 어제 것이고 이 파일은 방금 것이다.
 *
 *   ① 최근 커밋        내가 직전 세션에서 무엇을 했나
 *   ② 세션간 메모 꼬리  옆 세션(klifemap)이 나에게 남긴 말 — 놓치면 두 번 일한다
 *   ③ 대기·만료 항목    Riot 키 만료처럼 시각이 걸린 것
 *   ④ 사이트 상태      말이 아니라 실측. 「적힌 상태와 실제가 다르다」를 여러 번 겪었다
 *
 * ⚠ 느리면 안 된다. 세션 시작이 늦어지면 결국 훅을 꺼 버린다.
 *   네트워크 확인은 짧은 타임아웃으로 하고, 실패해도 브리핑은 나간다.
 *
 * 시험
 *   echo '{}' | node scripts/session-brief.mjs
 */

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.join(import.meta.dirname, '..'));
const 줄 = [];

const 조용히 = (cmd) => {
  try {
    return execSync(cmd, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

/* ⚠ 이 PC 는 KST 다. toISOString() 은 UTC 라 새벽에 하루가 어긋난다. */
const 지금 = new Date();
줄.push(`# 세션 브리핑 — ${지금.toLocaleString('sv-SE')} KST (자동 생성)`);
줄.push('');
줄.push('사장님이 말로 브리핑하지 않아도 되도록 훅이 자동으로 넣은 것이다.');
줄.push('**바로 일을 받을 수 있는 상태인지 아래를 보고 판단한다.**');
줄.push('');
줄.push('⚠ **`docs/인계-현재상태.md` 를 먼저 읽는다.** 이 브리핑은 「지금 상태」이고 그 파일은 「왜 그렇게 됐나」다. 사장님이 말로 브리핑하지 않아도 되게 만든 것이다.');
줄.push('');

/* ── ① 최근 커밋 ──────────────────────────────────────────── */
const 커밋 = 조용히('git log --oneline -12');
if (커밋) {
  줄.push('## 직전까지 한 일 (최근 커밋 12개)');
  줄.push('```');
  줄.push(커밋);
  줄.push('```');
  줄.push('');
}

/* 커밋 안 된 변경이 있으면 그것부터 봐야 한다 — 중단된 작업일 수 있다 */
const 상태 = 조용히('git status --short');
if (상태) {
  줄.push('## ⚠ 커밋 안 된 변경이 있다 — 중단된 작업일 수 있다');
  줄.push('```');
  줄.push(상태.split('\n').slice(0, 15).join('\n'));
  줄.push('```');
  줄.push('');
}

/* ── ② 세션간 메모 꼬리 ───────────────────────────────────── */
const 메모경로 = path.join(REPO, 'docs', '세션간-메모.md');
if (existsSync(메모경로)) {
  const 본문 = readFileSync(메모경로, 'utf8').split(/\r?\n/);
  /* 마지막 「## [」 제목 두 개부터 끝까지. 줄 수로 자르면 문단 중간에서 끊긴다. */
  const 제목 = [];
  for (let i = 본문.length - 1; i >= 0 && 제목.length < 2; i--) {
    if (/^##\s*\[/.test(본문[i])) 제목.push(i);
  }
  const 시작 = 제목.length ? 제목[제목.length - 1] : Math.max(0, 본문.length - 60);
  const 꼬리 = 본문.slice(시작).join('\n').trim();
  줄.push('## 옆 세션(KLifeMap)과의 메모 — 끝부분');
  줄.push('');
  줄.push('**놓치면 같은 일을 두 번 한다.** 여기에 요청이 있으면 그것이 최우선이다.');
  줄.push('');
  줄.push(꼬리.slice(0, 3500));
  줄.push('');
  줄.push(`(전문: docs/세션간-메모.md · ${본문.length}줄)`);
  줄.push('');
}

/* ── ③ 시각이 걸린 항목 ───────────────────────────────────── */
const 경고 = [];

/* Riot Personal Key 는 24시간마다 죽는다. 마지막 수집 시각으로 남은 시간을 가늠한다. */
const 사다리 = path.join(REPO, 'src', 'data', 'riot-ladder.json');
if (existsSync(사다리)) {
  try {
    const j = JSON.parse(readFileSync(사다리, 'utf8'));
    const 지난시간 = (지금 - new Date(j.collected_at_kst.replace(' ', 'T'))) / 3600e3;
    경고.push(
      `- **Riot 랭크 사다리** — 마지막 수집 ${j.day} (${지난시간.toFixed(0)}시간 전). ` +
        (지난시간 > 26
          ? '⚠ **하루 이상 비었다. 사다리는 소급이 안 된다.** `npm run collect:riot` 로 확인하라. ' +
            'Personal Key(24h)가 만료됐을 수 있다 — developer.riotgames.com 에서 REGENERATE 후 `.env` 교체.'
          : '정상.'),
    );
  } catch { /* 파일이 깨져도 브리핑은 나간다 */ }
}

/**
 * ⭐ 국민연금 사업장 — **월간 스냅숏이라 놓치면 그 달이 영영 없다.**
 *
 * 포털은 최신 한 벌만 준다. 지난 달 것을 다시 달라고 할 수 없다.
 * Riot 사다리와 같은 종류다 — **소급이 안 된다.**
 * 갱신은 매월 하순(2026-07-23 판 기준, 다음 예정 8-25).
 *
 * 여기서 세는 것은 **달치 파일 개수**다. `latest` 만 보면 덮어써진 걸 못 잡는다.
 */
{
  const dir = path.join(REPO, 'archive', 'raw', 'nps');
  const 달들 = existsSync(dir)
    ? readdirSync(dir).filter((f) => /^workplaces-[0-9]{6}\.csv$/.test(f)).sort()
    : [];
  if (!달들.length) {
    경고.push('- **국민연금 사업장** — 받은 달치가 **하나도 없다.** `node scripts/collect-nps-workplaces.mjs`');
  } else {
    /* ⚠ 자리 번호를 세지 않는다 — slice(12,18) 로 적었다가 「02606」이 나왔다.
         파일명이 바뀌면 조용히 어긋난다. **정규식으로 뽑는다** */
    const 최신 = (달들[달들.length - 1].match(/(\d{6})/) ?? [])[1] ?? '';
    const 올해 = 지금.getFullYear(), 이달 = 지금.getMonth() + 1;
    const 지난달수 = (올해 * 12 + 이달) - (Number(최신.slice(0, 4)) * 12 + Number(최신.slice(4, 6)));
    경고.push(
      /**
       * ⚠ **기준을 3개월로 둔다.** 이 자료는 원래 늦게 나온다 —
       *   2026-07-23 추출분이 **2026-06 치**다. 자격마감일(다음달 15일) 신고분까지 반영하니
       *   구조적으로 1~2개월 지연이다. 2로 잡으면 **정상인데 매번 경고가 뜬다.**
       *   늘 뜨는 경고는 아무도 안 본다 — 거짓 경보를 만들지 않는다.
       */
      `- **국민연금 사업장** — 달치 ${달들.length}개, 최신 ${최신} (${지난달수}개월 전). ` +
        (지난달수 >= 3
          ? '⚠ **석 달 이상 비었다. 월간 스냅숏은 소급이 안 된다.** node scripts/collect-nps-workplaces.mjs'
          : '정상. 이 자료는 원래 1~2개월 늦게 나온다(매월 하순 갱신).'),
    );
  }
}

/* 예약해 둔 알림. **사장님께 알려 드려야 하는 것**이라 맨 앞에 놓는다.
   (2026-08-03 지시 — 「알림 뜨면 나한테도 알려줘」)
   알림 스크립트가 archive/log/alerts.log 에 한 줄씩 남긴다. */
{
  const 로그디렉 = path.join(REPO, 'archive', 'log');
  /**
   * ⚠ 2026-08-03 KST — `alerts.log` **한 개만** 읽고 있었다.
   *   알림 스크립트는 그 파일이 잠기면 `alerts-{날짜}.log` 로 우회해 쓴다.
   *   여기서 그걸 안 읽으면 우회는 **아무 데도 안 닿는 백업**이라 있으나 마나다.
   *   `alerts.test.log` 는 일부러 뺀다 — 시험이 사장님께 알림으로 가면 안 된다.
   */
  const 대상 = existsSync(로그디렉)
    ? readdirSync(로그디렉).filter((f) => /^alerts(-\d{4}-\d{2}-\d{2})?\.log$/.test(f))
    : [];
  const 오늘 = 지금.toLocaleString('sv-SE').slice(0, 10);
  /* 오늘·어제 것만 올린다. 지난 알림이 계속 쌓여 올라오면 아무도 안 본다 */
  const 어제 = new Date(지금.getTime() - 86400e3).toLocaleString('sv-SE').slice(0, 10);
  const 본것 = new Set();
  for (const f of 대상) {
    try {
      for (const l of readFileSync(path.join(로그디렉, f), 'utf8').split(/\r?\n/)) {
        if (!l.trim() || 본것.has(l)) continue;
        if (!l.includes(오늘) && !l.includes(어제)) continue;
        본것.add(l);
        경고.push(`- 🔔 **예약 알림** — ${l} · **사장님께 알려 드릴 것**`);
      }
    } catch { /* 무시 */ }
  }
}

/* 로그에 실패가 찍혀 있으면 조용히 지나가지 않는다 */
for (const [이름, 파일] of [['Riot 수집', 'riot-ladder.log'], ['문서 동기화', 'sync.log']]) {
  const p = path.join(REPO, 'archive', 'log', 파일);
  if (!existsSync(p)) continue;
  try {
    const 본문 = readFileSync(p, 'utf8');
    if (/✕|인증 실패|Error|error:/.test(본문.slice(-2000))) {
      경고.push(`- **${이름} 로그에 실패가 있다** — \`archive/log/${파일}\` 꼬리를 볼 것`);
    }
  } catch { /* 무시 */ }
}

if (경고.length) {
  줄.push('## ⚠ 시각이 걸린 것 · 실패한 것');
  줄.push('');
  줄.push(...경고);
  줄.push('');
}

/* ── ④ 사이트 실측 ────────────────────────────────────────── */
/* 「적힌 상태와 실제 상태가 다를 수 있다」를 여러 번 겪었다. 말이 아니라 재서 넣는다.
   ⚠ 짧은 타임아웃. 세션 시작이 느려지면 결국 훅을 꺼 버린다. */
const 주소 = [
  ['seoulmarkets.com', 'https://seoulmarkets.com/'],
  ['100yearmap.com', 'https://100yearmap.com/'],
  ['klifemap.ai', 'https://klifemap.ai/'],
  ['/v1/research', 'https://seoulmarkets.com/v1/research?limit=1'],
];
const 결과 = await Promise.all(
  주소.map(async ([이름, u]) => {
    try {
      const r = await fetch(u, { method: 'GET', signal: AbortSignal.timeout(6000) });
      return `${이름} ${r.status}`;
    } catch {
      return `${이름} 확인불가`;
    }
  }),
);
줄.push('## 사이트 실측 (방금)');
줄.push('```');
줄.push(결과.join(' · '));
줄.push('```');
if (결과.some((r) => /확인불가|[45]\d\d/.test(r))) {
  줄.push('');
  줄.push('⚠ **200 이 아닌 것이 있다.** 다른 일보다 먼저 본다. klifemap.ai 는 매출이 나는 서비스다.');
}
줄.push('');

줄.push('---');
줄.push('**이 브리핑은 `scripts/session-brief.mjs` 가 만든다.** 내용이 부족하면 그 파일을 고친다.');

/* SessionStart 훅 규약 — additionalContext 가 모델 컨텍스트로 들어간다. */
process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: 줄.join('\n'),
    },
    suppressOutput: true,
  }),
);
