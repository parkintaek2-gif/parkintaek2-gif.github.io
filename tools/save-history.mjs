#!/usr/bin/env node
/**
 * save-history.mjs — **여섯 유닛의 대화기록을 사본으로 뜬다.** (윈도 예약작업이 부른다)
 *
 * ── 왜 이 파일이 생겼나 (2026-09-01 21:1x · 5번) ────────────────────────────
 * 사장님 — 「**세션이 닫히지 않기 위해 조치를 취하고, 중간 중간에 히스토리를 저장해**」
 *
 * 그날 1번을 새 계정으로 옮기는 동안 대화기록 425MB가 사라질 위험이 실제로 있었다.
 * 미리 사본을 떠 두었기 때문에 살았다. 사장님은 그 일을 보고 「미리 해 두라」로
 * 규칙을 만드신 것이다.
 *
 * ⚠ 창이 죽으면 잃는 것은 파일이 아니라 **맥락**이다. 새 창은 문서를 읽어 따라잡을
 *   수 있지만, 「왜 그렇게 정했는지」는 대화에만 있고 문서에는 없다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────────────────────
 * ⛔ **사장님 화면에 아무것도 안 띄운다.** 창도 소리도 없다.
 *    (2026-09-01 사장님 — 「깨우는 애 좀 팝업안되 게 해라..정신 사납다」)
 * ⛔ 사본은 설정 뿌리 «밖»에 둔다 — 뿌리째 날아가는 사고에서 같이 죽지 않게.
 * ⛔ 바뀐 파일만 옮긴다(크기·시각이 같으면 건너뛴다). 매번 통째로 복사하면 느려지고,
 *    느리면 예약이 겹쳐 쌓인다.
 * ⛔ 못 뜬 것을 조용히 넘기지 않는다 — 몇 개를 못 떴는지 세어 적는다.
 * ⛔ 사본을 무한히 쌓지 않는다. 날짜별로 두고 «이레»가 지난 것은 지운다.
 *
 * 쓰는 법
 *   node tools/save-history.mjs                한 번 뜬다
 *   node tools/save-history.mjs --예약등록      윈도 예약작업으로 건다(매시 :10)
 *   node tools/save-history.mjs --예약해제
 *   node tools/save-history.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 이칸 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(이칸, '..');
const 집 = os.homedir();
const 사본칸 = path.join(집, '대화기록-사본');
const 작업이름 = 'KLifeDesign-대화기록-사본';
const 남길날수 = 7;

/** 유닛 번호 → 설정 뿌리. ⚠ 좌석 검사(check-seat-split.mjs)와 «같은 값»이어야 한다. */
const 유닛뿌리 = {
  1: '.claude-u1', 2: '.claude-u2', 3: '.claude-u3',
  4: '.claude-u4', 5: '.claude-u5', 6: '.claude-u6',
};

const 오늘 = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const 이제 = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16);

/** 바뀐 것만 옮긴다 — 크기와 시각이 같으면 건너뛴다 */
function 옮긴다(원본, 사본) {
  try {
    const a = fs.statSync(원본);
    let b = null;
    try { b = fs.statSync(사본); } catch { /* 없으면 새로 뜬다 */ }
    if (b && b.size === a.size && Math.abs(b.mtimeMs - a.mtimeMs) < 1000) return '같다';
    fs.mkdirSync(path.dirname(사본), { recursive: true });
    fs.copyFileSync(원본, 사본);
    fs.utimesSync(사본, a.atime, a.mtime);
    return '떴다';
  } catch (e) {
    return `못 떴다(${e.code || e.message})`;
  }
}

export function 한번뜬다() {
  const 날 = 오늘();
  const 결과 = [];
  for (const [번호, 뿌리이름] of Object.entries(유닛뿌리)) {
    const pr = path.join(집, 뿌리이름, 'projects');
    if (!fs.existsSync(pr)) { 결과.push({ 번호, 상태: '자리 없음', 떴다: 0, 같다: 0, 못떴다: 0 }); continue; }
    let 떴다 = 0, 같다 = 0, 못떴다 = 0;
    const 걷는다 = (칸, 아래) => {
      let 목록 = [];
      try { 목록 = fs.readdirSync(칸, { withFileTypes: true }); } catch { 못떴다++; return; }
      for (const e of 목록) {
        const 원 = path.join(칸, e.name);
        if (e.isDirectory()) { 걷는다(원, path.join(아래, e.name)); continue; }
        if (!e.name.endsWith('.jsonl')) continue;
        const r = 옮긴다(원, path.join(사본칸, 날, `u${번호}`, 아래, e.name));
        if (r === '떴다') 떴다++; else if (r === '같다') 같다++; else 못떴다++;
      }
    };
    걷는다(pr, '.');
    결과.push({ 번호, 상태: '됐다', 떴다, 같다, 못떴다 });
  }
  return { 날, 결과 };
}

/** 이레 지난 사본은 지운다 — 무한히 쌓으면 디스크가 찬다 */
export function 낡은것치운다(오늘날 = 오늘(), 남길 = 남길날수) {
  if (!fs.existsSync(사본칸)) return [];
  const 자른날 = new Date(new Date(`${오늘날}T00:00:00+09:00`).getTime() - 남길 * 86400000);
  const 지운것 = [];
  for (const 이름 of fs.readdirSync(사본칸)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(이름)) continue;
    if (new Date(`${이름}T00:00:00+09:00`) >= 자른날) continue;
    try { fs.rmSync(path.join(사본칸, 이름), { recursive: true, force: true }); 지운것.push(이름); }
    catch { /* 못 지우면 다음 번에 다시 해 본다 */ }
  }
  return 지운것;
}

function 낸다() {
  const { 날, 결과 } = 한번뜬다();
  const 지운것 = 낡은것치운다(날);
  let 떴다합 = 0, 못떴다합 = 0;
  for (const r of 결과) {
    떴다합 += r.떴다; 못떴다합 += r.못떴다;
    console.log(`  ${r.번호}번  ${r.상태.padEnd(8)} 새로 뜬 것 ${String(r.떴다).padStart(3)} · 그대로 ${String(r.같다).padStart(4)} · 못 뜬 것 ${r.못떴다}`);
  }
  console.log('');
  console.log(`■ ${이제()} — 새로 뜬 것 ${떴다합}개 · 못 뜬 것 ${못떴다합}개 · 사본 자리 ${사본칸}`);
  if (지운것.length) console.log(`  이레 지난 사본 ${지운것.length}일치 지웠다 — ${지운것.join(' ')}`);
  try {
    fs.appendFileSync(path.join(뿌리, 'docs', '대화기록-사본.log'),
      `${이제()}  새로 ${떴다합} · 못 뜬 것 ${못떴다합}${지운것.length ? ` · 지운 날 ${지운것.length}` : ''}\n`, 'utf8');
  } catch { /* 로그를 못 남기는 것으로 사본을 멈추지 않는다 */ }
  /* ⛔ 못 뜬 것이 있으면 조용히 0 으로 끝내지 않는다 */
  return 못떴다합 ? 1 : 0;
}

function 예약등록() {
  const 명령 = `powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command "Set-Location '${뿌리}'; node tools/save-history.mjs *>> '${path.join(뿌리, 'docs', '대화기록-사본.log')}'"`;
  const r = spawnSync('schtasks', ['/create', '/tn', 작업이름, '/tr', 명령, '/sc', 'hourly', '/mo', '1', '/st', '00:10', '/f'], { encoding: 'utf8' });
  console.log((r.stdout || '') + (r.stderr || ''));
  if (r.status !== 0) {
    console.error(`🔴 예약을 못 걸었다(종료 ${r.status}). ⛔ 「걸었다」고 적지 않는다`);
    return 1;
  }
  console.log('✅ 매시 :10 에 사본을 뜬다. 창은 안 뜬다');
  return 0;
}

function 예약해제() {
  const r = spawnSync('schtasks', ['/delete', '/tn', 작업이름, '/f'], { encoding: 'utf8' });
  console.log((r.stdout || '') + (r.stderr || ''));
  return r.status === 0 ? 0 : 1;
}

function 자가시험() {
  let 통과 = 0, 실패 = 0;
  const 본다 = (참, 말) => { if (참) 통과++; else { 실패++; console.log('   🔴', 말); } };

  /* ① 유닛뿌리가 좌석 검사와 같은가 — 두 군데 적으면 반드시 갈라진다 */
  본다(Object.keys(유닛뿌리).length === 6, '유닛이 여섯이 아니다');
  본다(유닛뿌리[1] === '.claude-u1', '1번 뿌리가 .claude-u1 이 아니다(2026-09-01 이전 값)');
  본다(!Object.values(유닛뿌리).includes('.claude'), '기본 뿌리(=사장님 자리)가 목록에 들어 있다');

  /* ② 옮긴다() — 같으면 안 옮기고, 없으면 옮긴다 */
  const 시험칸 = path.join(os.tmpdir(), 'save-history-시험-' + Date.now());
  fs.mkdirSync(시험칸, { recursive: true });
  const 원 = path.join(시험칸, 'a.jsonl'), 사 = path.join(시험칸, '사본', 'a.jsonl');
  fs.writeFileSync(원, '{"x":1}\n');
  본다(옮긴다(원, 사) === '떴다', '처음인데 안 뜬다');
  본다(옮긴다(원, 사) === '같다', '안 바뀐 것을 또 뜬다');
  fs.writeFileSync(원, '{"x":1}\n{"y":2}\n');
  본다(옮긴다(원, 사) === '떴다', '바뀐 것을 안 뜬다');
  본다(fs.readFileSync(사, 'utf8').includes('"y"'), '사본 내용이 원본과 다르다');
  본다(String(옮긴다(path.join(시험칸, '없다.jsonl'), 사)).startsWith('못 떴다'), '없는 원본을 「떴다」고 한다');

  /* ③ 낡은것치운다() — 이레 안쪽은 남기고 밖은 지운다 */
  const 옛사본칸 = 사본칸;
  const 날들 = ['2026-08-20', '2026-08-31', '2026-09-01'];
  for (const d of 날들) fs.mkdirSync(path.join(옛사본칸, d), { recursive: true });
  const 지운것 = 낡은것치운다('2026-09-01', 7);
  본다(지운것.includes('2026-08-20'), '이레 넘은 사본을 안 지운다');
  본다(!지운것.includes('2026-08-31'), '이레 안쪽 사본을 지운다');
  본다(!지운것.includes('2026-09-01'), '오늘 사본을 지운다');
  fs.rmSync(시험칸, { recursive: true, force: true });

  console.log(`\n══ 자가시험 통과 ${통과} · 실패 ${실패} ══ ${실패 ? '🔴' : '✅'}`);
  return 실패;
}

const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험') || 인자.includes('--selftest')) process.exit(자가시험() ? 1 : 0);
else if (인자.includes('--예약등록')) process.exit(예약등록());
else if (인자.includes('--예약해제')) process.exit(예약해제());
else process.exit(낸다());
