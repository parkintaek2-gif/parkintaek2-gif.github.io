#!/usr/bin/env node
/**
 * collect-1600-report.mjs — 여섯 자리의 「[업무보고]」를 **두 채널 다** 뒤져 한 파일로 모은다.
 *
 * ── 왜 만드는가 (2026-09-05 23:3x · 2번) ─────────────────────────────────
 * 사장님이 「.md 파일 표 다 깨져... pdf 보낸건 1페이지야」 — 열어 보니 «통합»
 * 업무보고에 1번 것 하나만 들어 있었다. send-1600-report.mjs 는 이미 만들어진
 * md 파일을 «보내기만» 하고, build-daily-report.mjs 는 그 md를 «그리기만» 한다.
 * **여섯 자리 보고를 실제로 «모으는» 자가 이 조직에 없었다** — 사람이 두 채널을
 * 손으로 오가며 복사해 붙였고, 오늘 한 채널(dataeconomics)을 통째로 놓쳤다.
 *
 * ⛔ 사람이 기억해서 두 채널을 다 보는 구조를 또 만들지 않는다(강령④).
 *    이 자가 두 채널을 코드로 다 본다.
 *
 * 쓰는 법
 *   node scripts/collect-1600-report.mjs [YYYY-MM-DD] [--out 경로]
 *   node scripts/collect-1600-report.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const dataeco메모 = path.join(뿌리, 'docs', '세션간-메모.md');
const klifemap메모 = 'C:/Users/User/Documents/GitHub/klifemap/docs/1번-4번-메모.md';

/** 1~6번을 헤더 텍스트에서 알아낸다. 번호가 없으면 사이트 이름으로 짐작한다(짐작한 것도 적는다). */
const 유닛단서 = {
  1: [/1번/, /klifemap/i],
  2: [/2번/],
  3: [/3번/, /백년지도/, /100y/i],
  4: [/4번/],
  5: [/5번/, /K ?Culture ?Wire/i, /KCW/],
  6: [/6번/, /SeoulMarkets/i],
};

function 유닛찾기(헤더줄) {
  // 「— 2번께」처럼 날짜 뒤에 붙는 "받는 사람" 표기가 "N번"과 겹쳐 오판되는 걸 막는다
  // (예: "5번 K Culture Wire · ... (16시) — 2번께" 는 5번인데 뒤쪽 "2번"에 걸릴 뻔했다).
  // 유닛 이름은 항상 첫 "·" 앞에 있으므로 그 부분만 본다.
  const 이름부분 = 헤더줄.split('·')[0];
  for (const [n, 패턴들] of Object.entries(유닛단서)) {
    if (패턴들.some((p) => p.test(이름부분))) return Number(n);
  }
  return null;
}

/** 「[진행] N번 HH:MM  했다: ... / 한다: ... / 막힘: ...」 여러 줄짜리 매시 소통을 전부 뽑는다.
 *  1번·4번은 "[업무보고]" 태그를 아예 안 쓰고 이 형식만 쓴다 — 확인된 사실(2026-09-06 2번).
 *  다음 「[진행]」 줄이나 「## 」 줄이 나오기 전까지를 한 절로 본다. */
export function 진행줄뽑기(원문) {
  const 시작패턴 = /^\[진행\]\s*(\d)번\s+(\S+)\s+(.*)$/;
  const 줄들 = 원문.split(/\r?\n/);
  const 결과 = [];
  let 지금 = null;
  for (const 줄 of 줄들) {
    const m = 줄.match(시작패턴);
    if (m) {
      if (지금) 결과.push(지금);
      지금 = { 유닛: Number(m[1]), 시각: m[2], 본문: [m[3]] };
    } else if (/^##\s/.test(줄)) {
      if (지금) { 결과.push(지금); 지금 = null; }
    } else if (지금) {
      지금.본문.push(줄);
    }
  }
  if (지금) 결과.push(지금);
  return 결과.map((s) => ({ ...s, 본문: s.본문.join('\n').trim() }));
}

/** md 파일 하나에서 「## [업무보고] ...」로 시작하는 절을 전부 뽑는다.
 *  각 절은 { 유닛, 시각텍스트, 본문 } — 시각텍스트는 헤더 안 괄호/텍스트 그대로(짐작 안 함). */
export function 보고절뽑기(원문) {
  const 줄들 = 원문.split(/\r?\n/);
  const 절들 = [];
  let 지금 = null;
  for (const 줄 of 줄들) {
    const 새헤더 = /^##\s+\[업무보고\]/.test(줄);
    if (새헤더) {
      if (지금) 절들.push(지금);
      지금 = { 헤더: 줄, 유닛: 유닛찾기(줄), 본문: [] };
    } else if (/^##\s/.test(줄) && 지금) {
      // 다음 절(업무보고 아닌 것) 시작 — 지금 절을 닫는다
      절들.push(지금);
      지금 = null;
    } else if (지금) {
      지금.본문.push(줄);
    }
  }
  if (지금) 절들.push(지금);
  return 절들.map((s) => ({ ...s, 본문: s.본문.join('\n').trim() }));
}

function 다음날짜(날짜) {
  const d = new Date(날짜 + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10);
}

/** 파일에서 그 날짜의 줄 구간만 자른다(그 날짜 문자열이 처음 나오는 줄 ~ 다음날 문자열이 처음 나오는 줄 전). */
function 날짜구간줄들(원문, 날짜) {
  const 줄들 = 원문.split(/\r?\n/);
  const 시작 = 줄들.findIndex((줄) => 줄.includes(날짜));
  if (시작 === -1) return [];
  const 다음날 = 다음날짜(날짜);
  let 끝 = 줄들.length;
  for (let i = 시작 + 1; i < 줄들.length; i++) { if (줄들[i].includes(다음날)) { 끝 = i; break; } }
  return 줄들.slice(시작, 끝);
}

/** 시각문자열("16:0x","22:2x" 등)의 시(hour)만 뽑는다 — 분은 뭉개져 있어(x) 못 믿는다. */
function 시각의시(시각) {
  const m = 시각.match(/^(\d{1,2}):/);
  return m ? Number(m[1]) : null;
}

/** 두 채널을 다 읽어 유닛별 «가장 늦게 온» [업무보고] 절 하나씩 고른다.
 *  [업무보고] 태그가 아예 없는 유닛(1번·4번 — 확인된 사실)은 같은 날짜 구간 안에서
 *  목표시각에 가장 가까운 [진행] 매시소통으로 대신하고, 대신한 것임을 표시한다. */
export function 모으기(날짜 = 오늘날짜(), 목표시 = 16) {
  const 파일들 = [dataeco메모, klifemap메모];
  const 후보 = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const 진행후보 = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const 파일 of 파일들) {
    let 원문;
    try { 원문 = fs.readFileSync(파일, 'utf8'); } catch { continue; }
    for (const 절 of 보고절뽑기(원문)) {
      if (!절.유닛) continue;
      if (!절.헤더.includes(날짜)) continue; // 그 날짜 것만
      후보[절.유닛].push(절);
    }
    const 구간줄들 = 날짜구간줄들(원문, 날짜);
    if (구간줄들.length) {
      for (const 절 of 진행줄뽑기(구간줄들.join('\n'))) {
        진행후보[절.유닛]?.push(절);
      }
    }
  }
  const 골라낸것 = {};
  const 못찾은것 = [];
  const 대신한것 = [];
  for (let n = 1; n <= 6; n++) {
    if (후보[n].length > 0) {
      골라낸것[n] = 후보[n][후보[n].length - 1]; // 파일 안에서는 나중 것이 더 늦다(그 파일이 시간순으로 쌓이므로)
      continue;
    }
    if (진행후보[n].length > 0) {
      // 목표시각에 가장 가까운 것을 고른다(같으면 더 늦은 걸 고름 — 배열 뒤가 늦은 것)
      let 최선 = null, 최선차 = Infinity;
      for (const 절 of 진행후보[n]) {
        const 시 = 시각의시(절.시각);
        if (시 === null) continue;
        const 차 = Math.abs(시 - 목표시);
        if (차 <= 최선차) { 최선 = 절; 최선차 = 차; }
      }
      if (최선) { 골라낸것[n] = { ...최선, 대신함: true }; 대신한것.push(n); continue; }
    }
    못찾은것.push(n);
  }
  return { 골라낸것, 못찾은것, 대신한것 };
}

function 오늘날짜() { return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10); }

function 자가시험() {
  let 흠 = 0;
  const 봐 = (참, 말) => { if (!참) { 흠++; console.log('  🔴 ' + 말); } else console.log('  ✅ ' + 말); };
  const 가짜 = `# 제목\n\n## [업무보고] 6번 SeoulMarkets · 2026-09-05 (16시)\n\n내용 6번\n\n## [업무보고] 백년지도(3번) · 2026-09-05 (16시)\n\n내용 3번\n\n## [업무보고] 5번 K Culture Wire · 2026-09-05 (16시) — 2번께\n\n내용 5번\n\n## [진행] 5번 아무거나\n\n무시되어야 함\n`;
  const 절들 = 보고절뽑기(가짜);
  봐(절들.length === 3, '업무보고 절 세 개를 찾는다(진행 절은 안 섞인다)');
  봐(절들[0].유닛 === 6, '6번(SeoulMarkets)을 번호로 알아낸다');
  봐(절들[1].유닛 === 3, '3번(백년지도, 괄호 표기)을 알아낸다');
  봐(절들[2].유닛 === 5, '5번을 알아낸다 — 뒤에 붙은 "— 2번께"의 "2번"에 안 낚인다');
  봐(절들[0].본문.includes('내용 6번'), '본문을 제대로 자른다');
  봐(절들[1].본문 === '내용 3번', '다음 업무보고 절 앞에서 정확히 끊는다');

  const 가짜진행 = `머리말\n\n[진행] 4번 15:1x  했다: 뭔가 A.\n한다: 뭔가 B.\n막힘: 없음\n\n[진행] 1번 16:0x  했다: 매시보고.\n한다: 계속.\n막힘: 없음\n\n## [업무보고] 아무거나\n\n무시되는 본문\n`;
  const 진행절들 = 진행줄뽑기(가짜진행);
  봐(진행절들.length === 2, '[진행] 절 두 개를 찾는다("## " 뒤 본문은 안 섞는다)');
  봐(진행절들[0].유닛 === 4 && 진행절들[0].시각 === '15:1x', '4번 15:1x를 알아낸다');
  봐(진행절들[0].본문.includes('한다: 뭔가 B.'), '다음 줄(한다:)도 같은 절에 붙는다');
  봐(진행절들[1].유닛 === 1, '1번 16:0x를 알아낸다');

  const 가짜메모 = `# 2026-09-05\n\n[진행] 1번 15:4x  했다: A.\n한다: B.\n막힘: 없음\n\n[진행] 1번 22:0x  했다: C.\n한다: D.\n막힘: 없음\n\n# 2026-09-06\n\n[진행] 1번 09:0x  했다: 다른 날짜라 안 들어가야 함.\n`;
  const { 골라낸것: 대신결과, 대신한것 } = (() => {
    fs.mkdirSync(path.dirname(dataeco메모), { recursive: true });
    const 임시 = dataeco메모 + '.자가시험임시';
    fs.writeFileSync(임시, 가짜메모, 'utf8');
    const 원본읽기 = fs.readFileSync;
    fs.readFileSync = (p, enc) => (p === dataeco메모 ? 원본읽기(임시, enc) : (() => { throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' }); })());
    try { return 모으기('2026-09-05', 16); } finally { fs.readFileSync = 원본읽기; fs.rmSync(임시); }
  })();
  봐(대신한것.includes(1), '[업무보고] 없는 유닛은 [진행]으로 대신한다');
  봐(대신결과[1]?.대신함 === true, '대신한 것임을 표시한다');
  봐(대신결과[1]?.시각 === '15:4x', '목표시각(16시)에 더 가까운 15:4x를 고른다(22:0x 아님)');
  봐(!대신결과[1]?.본문.includes('다른 날짜'), '다음날(2026-09-06) 항목은 안 섞는다');

  console.log(흠 ? `\n🔴 흠 ${흠}개` : '\n✅ 흠 없다');
  process.exit(흠 ? 1 : 0);
}

const argv = process.argv.slice(2);
if (argv.includes('--자가시험')) { 자가시험(); }
else {
  const 날짜 = argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? 오늘날짜();
  const 목표시인자 = argv.find((a) => /^--목표시=\d+$/.test(a));
  const 목표시 = 목표시인자 ? Number(목표시인자.split('=')[1]) : 16;
  const { 골라낸것, 못찾은것, 대신한것 } = 모으기(날짜, 목표시);
  const oi = argv.indexOf('--out');
  const 출력 = oi >= 0 ? argv[oi + 1] : null;

  const 유닛이름 = { 1: '1번 KLifeMap', 2: '2번 조율', 3: '3번 백년지도', 4: '4번 방문자유입', 5: '5번 K Culture Wire', 6: '6번 SeoulMarkets' };
  let out = `# 업무보고 통합 · ${날짜}\n\n`;
  for (let n = 1; n <= 6; n++) {
    if (골라낸것[n]?.대신함) {
      out += `## ${유닛이름[n]}\n\n⚠ [업무보고] 형식이 없어 가장 가까운 정시 소통([진행] ${골라낸것[n].시각})으로 대신함\n\n${골라낸것[n].본문}\n\n`;
    } else if (골라낸것[n]) {
      out += `## ${유닛이름[n]}\n\n${골라낸것[n].본문}\n\n`;
    } else {
      out += `## ${유닛이름[n]}\n\n⬜ 못 찾았다 — 이 날짜의 [업무보고]도 [진행]도 두 채널 어디에도 없다\n\n`;
    }
  }

  console.log(`■ ${날짜} — ${6 - 못찾은것.length}/6 유닛 찾음` + (대신한것.length ? ` (그중 ${대신한것.join(',')}번은 [진행]으로 대신함)` : '') + (못찾은것.length ? ` · 완전히 못 찾은 자리: ${못찾은것.join(',')}번` : ''));
  if (출력) { fs.writeFileSync(출력, out, 'utf8'); console.log(`✅ 썼다 — ${출력}`); }
  else console.log(out);
}
