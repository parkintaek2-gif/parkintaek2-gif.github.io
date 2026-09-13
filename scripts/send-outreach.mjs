#!/usr/bin/env node
/**
 * send-outreach.mjs — **영업 메일을 «받는 나라 업무시간»에 보낸다.**
 * ─────────────────────────────────────────────────────────────────────────
 * 사장님 지시 (2026-09-13, 원문):
 *   「메일은 그 나라 기준 업무시간에 보내」
 *   「보낸 것도 업무시간에 다시 보내...안그러면 사람들이 안읽어」
 *
 * 🔴 무엇을 잘못했나
 *   5번이 첫 열 통을 한국시간 19시에 보냈다. 그 시각은 받는 쪽에서 —
 *     뉴욕 06시(출근 전) · 도쿄 19시(퇴근 뒤) · 싱가포르·홍콩 18시(퇴근 무렵)
 *   첫 영업 편지는 열릴 기회가 한 번뿐이다. 밤에 닿으면 아침 편지 더미 «맨 아래»에 깔린다.
 *
 *   node scripts/send-outreach.mjs                  지금 보낼 때가 된 곳만 보낸다
 *   node scripts/send-outreach.mjs --잰다            누구를 언제 보내는지만 본다(안 보낸다)
 *   node scripts/send-outreach.mjs --자가시험
 *
 * ⛔ 같은 곳에 하루 두 번 보내지 않는다 — 다시보내기는 «한 번»만, 그것도 시각을 맞춰서.
 * ⛔ 주소를 지어내지 않는다. 지면에서 확인된 것만 쓴다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const 뿌리 = path.resolve(import.meta.dirname, '..');
const 기록파일 = path.join(뿌리, 'src/data/seoulmarkets-outreach-log.json');

/**
 * 지역별 «현지 09~11시»가 한국시간 몇 시인가.
 * ⚠ 서머타임이 있는 곳은 한 시간 움직인다 — 창을 넉넉히 둔다(현지 09~11시 겨냥).
 * ⛔ 모르는 지역은 «안 보낸다». 짐작해서 한밤중에 쏘지 않는다.
 */
export const 지역 = {
  뉴욕: { 차: -13, 도시: 'New York / Boston (EDT)' },
  런던: { 차: -8, 도시: 'London (BST)' },
  유럽: { 차: -7, 도시: 'Oslo / Frankfurt / Paris (CEST)' },
  싱가포르: { 차: -1, 도시: 'Singapore / Hong Kong / Shanghai' },
  도쿄: { 차: 0, 도시: 'Tokyo' },
  서울: { 차: 0, 도시: 'Seoul' },
};

/** 그 지역 현지 시각(0~23)을 한국시간 시로 바꾼다 */
export function 한국시(지역키, 현지시) {
  const z = 지역[지역키];
  if (!z) return null;
  let h = (현지시 - z.차) % 24;
  if (h < 0) h += 24;
  return h;
}

/** 지금 한국시간이 그 지역의 «보낼 창»(현지 09~11시) 안인가 */
export function 보낼때인가(지역키, 지금시) {
  const 시작 = 한국시(지역키, 9);
  const 끝 = 한국시(지역키, 11);
  if (시작 === null) return false;
  /* 자정을 넘는 창도 있다 — 뉴욕 09시는 한국 22시, 11시는 한국 24시(=0시) */
  if (시작 <= 끝) return 지금시 >= 시작 && 지금시 < 끝;
  return 지금시 >= 시작 || 지금시 < 끝;
}

/** 이미 «제때» 보낸 곳인가 — 두 번 보내지 않기 위해 */
export function 다시보내야하나(줄) {
  if (!줄) return false;
  if (줄.제때보냄) return false;          /* 제때 보낸 것은 끝 */
  return Boolean(줄.메일);
}

export function 오늘글(날 = new Date()) {
  return 날.getFullYear() + '-' + String(날.getMonth() + 1).padStart(2, '0') + '-' + String(날.getDate()).padStart(2, '0');
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  const 흠 = [];
  const 재다 = (n, t) => { if (!t) 흠.push(n); };

  재다('뉴욕 09시 = 한국 22시', 한국시('뉴욕', 9) === 22);
  재다('뉴욕 11시 = 한국 0시', 한국시('뉴욕', 11) === 0);
  재다('런던 09시 = 한국 17시', 한국시('런던', 9) === 17);
  재다('도쿄 09시 = 한국 9시', 한국시('도쿄', 9) === 9);
  재다('싱가포르 09시 = 한국 10시', 한국시('싱가포르', 9) === 10);
  재다('모르는 지역은 null', 한국시('화성', 9) === null);

  재다('한국 22시는 뉴욕에 보낼 때', 보낼때인가('뉴욕', 22) === true);
  재다('한국 23시도 뉴욕에 보낼 때', 보낼때인가('뉴욕', 23) === true);
  재다('⛔ 한국 19시는 뉴욕에 보낼 때가 아니다', 보낼때인가('뉴욕', 19) === false);
  재다('한국 17시는 런던에 보낼 때', 보낼때인가('런던', 17) === true);
  재다('⛔ 한국 19시는 런던에도 늦다', 보낼때인가('런던', 19) === false);
  재다('한국 10시는 싱가포르에 보낼 때', 보낼때인가('싱가포르', 10) === true);
  재다('⛔ 모르는 지역은 언제도 아니다', 보낼때인가('화성', 10) === false);
  /* 🔴 오늘 실제로 저지른 것 — 19시 발송이 어느 지역에도 맞지 않았다 */
  재다('🔴 한국 19시는 뉴욕·도쿄·싱가포르 어디에도 안 맞다',
    !보낼때인가('뉴욕', 19) && !보낼때인가('도쿄', 19) && !보낼때인가('싱가포르', 19));

  재다('제때 보낸 곳은 다시 안 보낸다', 다시보내야하나({ 메일: 'a@b.c', 제때보냄: true }) === false);
  재다('잘못된 때에 보낸 곳은 다시 보낸다', 다시보내야하나({ 메일: 'a@b.c' }) === true);
  재다('주소가 없으면 안 보낸다', 다시보내야하나({}) === false);
  재다('빈 줄도 견딘다', 다시보내야하나(null) === false);

  return 흠;
}

function 본일() {
  const 흠 = 자가시험();
  console.log(흠.length ? '🔴 자가시험 실패:\n  - ' + 흠.join('\n  - ') : '✅ 자가시험 ' + (18 - 흠.length) + '/18');
  if (흠.length) process.exit(1);
  if (process.argv.includes('--자가시험')) return;

  const 기록 = JSON.parse(fs.readFileSync(기록파일, 'utf8'));
  기록.보낸것 = Array.isArray(기록.보낸것) ? 기록.보낸것 : [];
  const 지금시 = new Date().getHours();
  const 잰다 = process.argv.includes('--잰다');

  console.log('\n■ 지금 한국시간 ' + 지금시 + '시 — 어디에 보낼 때인가');
  for (const k of Object.keys(지역)) {
    console.log('   ' + (보낼때인가(k, 지금시) ? '✅' : '⬜') + ' ' + k.padEnd(6, ' ')
      + ' 현지 09~11시 = 한국 ' + 한국시(k, 9) + '~' + 한국시(k, 11) + '시  (' + 지역[k].도시 + ')');
  }

  const 할것 = 기록.보낸것.filter(다시보내야하나);
  console.log('\n다시 보낼 곳 ' + 할것.length + '개 (제때 안 보낸 것)');
  let 보냄 = 0, 아직 = 0;
  for (const x of 할것) {
    const z = x.지역;
    if (!z || !지역[z]) { console.log('   ⬜ ' + (x.기관 || x.메일) + ' — 지역을 모른다. 명단에 나라를 적어야 한다'); 아직 += 1; continue; }
    if (!보낼때인가(z, 지금시)) { console.log('   ⏳ ' + (x.기관 || x.메일) + ' — ' + z + ', 한국 ' + 한국시(z, 9) + '시에 보낸다'); 아직 += 1; continue; }
    if (잰다) { console.log('   ▶ ' + (x.기관 || x.메일) + ' — 지금 보낼 때다(재기만 함)'); 보냄 += 1; continue; }
    try {
      execFileSync('node', [path.join(뿌리, 'scripts/send-mail.mjs'),
        '--받는곳=' + x.메일,
        '--제목=' + (x.제목 || 'Korean filings data in English — SeoulMarkets'),
        '--글=' + path.join(뿌리, 'docs/영업/영업편지-기관투자자-영문.txt'),
        '--보낸다'], { cwd: 뿌리, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000 });
      x.제때보냄 = true;
      x.제때보낸때 = new Date().toLocaleString('ko-KR');
      보냄 += 1;
      console.log('   ✅ ' + (x.기관 || x.메일) + ' — 현지 업무시간에 다시 보냈다');
    } catch (e) {
      console.log('   🔴 ' + (x.기관 || x.메일) + ' — ' + String(e.stdout || e.message).slice(-120).replace(/\s+/g, ' '));
    }
  }
  if (!잰다) fs.writeFileSync(기록파일, JSON.stringify(기록, null, 1), 'utf8');
  console.log('\n보냄 ' + 보냄 + ' · 아직 ' + 아직 + (잰다 ? '  (재기만 했다)' : ''));
  if (아직) console.log('⏳ 남은 곳은 그 지역 시각이 되면 이 자를 다시 돌린다.');
}

if (process.argv[1] && process.argv[1].endsWith('send-outreach.mjs')) 본일();
