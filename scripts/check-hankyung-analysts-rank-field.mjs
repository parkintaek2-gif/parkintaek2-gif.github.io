#!/usr/bin/env node
/**
 * check-hankyung-analysts-rank-field.mjs — 「순위」 필드가 «이름 정렬 행번호»일 뿐인
 * 함정을 다시 밟지 않게 막는다.
 *
 *   node scripts/check-hankyung-analysts-rank-field.mjs            검사
 *   node scripts/check-hankyung-analysts-rank-field.mjs --자가시험   자가시험만
 *
 * ── 🔴 왜 만드나 (2026-09-21 · 1번) ───────────────────────────────────────
 * `collect-seoulmarkets-hankyung-analysts.mjs` 가 부르는 API 요청은
 * `sort={"key":"writerName","orderBy":"asc"}` — 이름 가나다순이다. 그런데 응답의
 * 「rank」 필드(우리 꼴 「순위」)를 기사가 «성과 순위»로 읽어 "top-ranked analyst"라고
 * 냈다가 정정했다(content/articles/an-analyst-leaderboard-we-called-ranked-turned-out-to-be-alphabetical.md,
 * commit f9c03edaf). 정정 기사 본문은 "앞으로는 순번을 rank로 부르기 전에 옆 점수 칸이
 * 단조인지 먼저 잰다"고 «문장으로만» 다짐했다.
 *
 * ⛔ 문장으로 다짐한 규칙은 잊힌다(강령 ④ — 규칙은 «검사»로 둔다). 겪은 것은 자가시험이
 *   달린 검사로 굳힌다. 그래서 이 자를 만든다.
 *
 * ── 이 자가 하는 일 둘 ────────────────────────────────────────────────────
 * ① 최근 아카이브(archive/raw/hankyung-consensus/analysts-*.json)의 이름 순서가
 *    가나다순이고 점수가 그 순번에 대해 단조가 아니면 — 그 자료의 「순위」 필드는
 *    지금도 함정 상태라고 알린다(수집기 쪽 API가 다시 이름정렬로 돌아왔는지 감시).
 * ② content/articles/*.md 를 훑어, 이 애널리스트 자료(태그 "analysts" 또는
 *    "hankyung"·"consensus")를 인용하면서 "top-ranked" · "ranked #1" · "#1-ranked" ·
 *    "#1 by score" 같은 순위 주장을 하는데 **오늘 correction 이 없는** 기사를 잡는다
 *    (f9c03edaf 로 이미 고쳐진 두 편은 정정을 갖고 있어 통과한다).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');

/** 이름들이 한국어 오름차순(가나다순)으로 정확히 정렬돼 있나 */
export function 가나다순인가(이름들) {
  if (!Array.isArray(이름들) || 이름들.length < 2) return false;
  for (let i = 1; i < 이름들.length; i += 1) {
    if (String(이름들[i - 1]).localeCompare(String(이름들[i]), 'ko') > 0) return false;
  }
  return true;
}

/** 점수들이 그 순번(1이 가장 좋다고 가정)에 대해 단조감소인가 — 진짜 순위표라면 이래야 한다 */
export function 점수단조감소인가(점수들) {
  const 값 = (점수들 || []).filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (값.length < 2) return null; /* 못 쟀다 */
  for (let i = 1; i < 값.length; i += 1) if (값[i] > 값[i - 1]) return false;
  return true;
}

/** 최근 analysts-*.json 파일 경로 (없으면 null) */
export function 최근파일(아카이브칸) {
  if (!fs.existsSync(아카이브칸)) return null;
  const 후보 = fs.readdirSync(아카이브칸)
    .filter((f) => /^analysts-\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  return 후보.length ? path.join(아카이브칸, 후보[후보.length - 1]) : null;
}

/** 오늘 이 필드를 다룬 기사에 corrections: 절이 있나(간단히 문자열로 확인) */
export function correction있나(md) {
  return /^corrections:\s*$/m.test(md) || /^corrections:/m.test(md);
}

/**
 * 이 기사가 «순위 주장을 하는» 것이 아니라 «그 순위 주장이 틀렸다고 설명하는» 것인가.
 * ⚠ 정정 설명글(오늘의 an-analyst-leaderboard-...) 은 자기 frontmatter 에 corrections: 절이
 *   없다(정정 대상이 «원 기사» 라서다) — 그런데도 위험표현을 그대로 인용하므로 ②에 걸린다.
 *   실제로 이 오탐을 재서 확인했다(2026-09-21). 그래서 "alphabetical" 이라는, 이 함정을
 *   «설명중»이라는 특정성 높은 낱말이 같은 글에 있으면 자기설명중으로 보고 뺀다 — 진짜로
 *   순위를 잘못 주장만 하는 미래의 새 글은 이 낱말을 쓸 까닭이 없다
 */
export function 자기설명중인가(md) {
  return /alphabetical/i.test(md);
}

const 위험표현 = [/top-ranked/i, /ranked\s*#\s*1\b/i, /#\s*1[- ]ranked/i, /#\s*1\s+by\s+score/i];

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = [];
  const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나: !!됐나 });

  재다('가나다순 — 맞으면 true', 가나다순인가(['가영', '나영', '다영']));
  재다('가나다순 — 하나라도 어긋나면 false', !가나다순인가(['나영', '가영', '다영']));
  재다('가나다순 — 두 명 미만이면 false(못 쟀다로 다룸)', !가나다순인가(['가영']));
  재다('가나다순 — 배열이 아니면 false', !가나다순인가(null));

  재다('점수단조감소 — 실제로 감소하면 true', 점수단조감소인가([9, 8, 7, 6]) === true);
  재다('점수단조감소 — 오르내리면 false(함정 상태)', 점수단조감소인가([8.16, 7.79, 8.1, 9.4]) === false);
  재다('점수단조감소 — 값이 하나뿐이면 null(못 쟀다)', 점수단조감소인가([9]) === null);
  재다('점수단조감소 — NaN·null 은 걸러내고 잰다', 점수단조감소인가([9, null, 7, NaN, 6]) === true);

  재다('correction있나 — 있으면 true', correction있나('---\ntitle: x\ncorrections:\n  - date: 2026-09-21\n---\n'));
  재다('correction있나 — 없으면 false', !correction있나('---\ntitle: x\nexcluded:\n  - "x"\n---\n'));

  재다('자기설명중인가 — alphabetical 낱말이 있으면 true', 자기설명중인가('We called it top-ranked but it was alphabetical.'));
  재다('자기설명중인가 — 없으면 false', !자기설명중인가('The analyst was top-ranked by score.'));

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

const 내가직접불렸나 = path.basename(process.argv[1] || '') === 'check-hankyung-analysts-rank-field.mjs';

if (내가직접불렸나) {
  if (!자가시험()) process.exit(1);
  if (process.argv.includes('--자가시험')) process.exit(0);
  console.log('');

  let 나쁨 = false;

  /* ① 아카이브 함정 상태 감시 */
  const 아카이브칸 = path.join(뿌리, 'archive/raw/hankyung-consensus');
  const 파일 = 최근파일(아카이브칸);
  if (!파일) {
    console.log('⬜ ① analysts-*.json 아카이브가 없다 — 못 쟀다');
  } else {
    const d = JSON.parse(fs.readFileSync(파일, 'utf8'));
    const 줄들 = d.줄들 || [];
    const 이름들 = 줄들.map((r) => r.이름).filter(Boolean);
    const 점수들 = 줄들.map((r) => r.점수);
    const 가나다순 = 가나다순인가(이름들);
    const 단조감소 = 점수단조감소인가(점수들);
    console.log(`① ${path.basename(파일)} — ${이름들.length}명, 이름 가나다순: ${가나다순} · 점수 단조감소: ${단조감소}`);
    if (가나다순 && 단조감소 === false) {
      console.log('  ⚠ 이 자료의 「순위」 필드는 이름 정렬 행번호일 뿐이지 성과 순위가 아니다.');
      console.log('     기사에서 이 필드를 «순위/rank/#1» 로 부르면 안 된다(계속되는 지면 함정 상태).');
    } else if (!가나다순) {
      console.log('  ✅ 이름이 가나다순이 아니다 — 지면이 정렬 방식을 바꾼 것으로 보인다. 「순위」 필드를 다시 검증할 때다.');
    }
  }

  /* ② 정정 없이 순위 주장을 남긴 기사 찾기 */
  const 기사칸 = path.join(뿌리, 'content/articles');
  const 걸린것 = [];
  for (const f of fs.readdirSync(기사칸).filter((x) => x.endsWith('.md'))) {
    const md = fs.readFileSync(path.join(기사칸, f), 'utf8');
    const 애널리스트자료인용 = /analysts?\b/i.test(md) && /(hankyung|consensus|analyst\/ranking)/i.test(md);
    if (!애널리스트자료인용) continue;
    const 위험있나 = 위험표현.some((re) => re.test(md));
    if (위험있나 && !correction있나(md) && !자기설명중인가(md)) 걸린것.push(f);
  }
  console.log(`\n② 애널리스트 자료를 인용하며 순위 주장을 하는데 정정이 없는 기사 — ${걸린것.length}편`);
  if (걸린것.length) { console.log(`  🔴 ${걸린것.join(' · ')}`); 나쁨 = true; }
  else console.log('  ✅ 없음');

  console.log(나쁨 ? '\n🔴 정정 없이 남은 순위 주장이 있다.' : '\n✅ 통과.');
  process.exit(나쁨 ? 1 : 0);
}
