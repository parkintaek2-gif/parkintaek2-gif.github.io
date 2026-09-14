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
const 멈춤쪽지 = path.join(뿌리, 'docs/영업/영업메일-멈춤.txt');

/**
 * 🔴 멈춤쪽지가 있으면 «한 통도» 안 보낸다.
 * 사장님(2026-09-14): 「메일 보내는 것도 멈춰...다 완료되면 보내라」
 *                    「사이트 소개(제일 위)..도 다 바꾼 뒤에 메일 보내」
 * ⛔ 예약을 지우는 것만으로는 못 막는다 — 손으로 쳐도 나가기 때문이다.
 * ✅ 다시 열 때는 쪽지 파일을 지운다. 코드를 고치지 않는다.
 */
export function 멈췄나(쪽지 = 멈춤쪽지) {
  try { return fs.existsSync(쪽지) ? fs.readFileSync(쪽지, 'utf8').trim() : null; }
  catch (e) { return null; }
}
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

/**
 * 🔴 [2026-09-14] 사장님이 원칙을 바꾸셨다 (원문):
 *   「이 원칙은 «한달 안에는 두번 보내지 않는다. 단, 상품이 늘어난 경우에는
 *    예외로 보낼 수 있다»로 바꿔」
 *
 * ⛔ 앞선 원칙은 「한 번 보낸 곳에 두 번 보내지 않는다」였다. 두 가지가 틀렸다 —
 *   1. 영영 안 보내면 한 달 뒤 다시 두드릴 길이 없다
 *   2. 그런데 정작 «두 번 보내는 것»을 못 막았다. 기관 이름이 「… Investors」와
 *      「… Investors, LLC」로 조금 달라 다른 곳으로 세는 바람에,
 *      2026-09-12·13 에 Kopernik·Pzena 두 곳이 같은 편지를 이틀 새 두 번 받았다.
 *   ⇒ 그래서 «주소»로 센다. 이름이 아니라 주소가 그 곳을 정한다.
 */
export const 다시보내는간격일 = 30;

/** 지금 팔고 있는 나라 묶음. 여기가 늘면 «상품이 늘어난 것»이고, 그때는 한 달 안이라도 보낸다 */
export const 지금상품판 = 'korea+uae';

/** 그 줄이 가리키는 주소 — 이름이 아니라 이것이 «같은 곳»을 정한다 */
export function 주소(줄) {
  return String((줄 && (줄.메일 || 줄.받는곳)) || '').toLowerCase().trim();
}

/** 「2026. 9. 12. 오후 2:21:22」 같은 한국어 시각 글을 Date 로. 못 읽으면 null */
export function 한국날짜읽기(글) {
  if (!글) return null;
  const m = String(글).match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(오전|오후)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  let 시 = Number(m[5]);
  if (m[4] === '오후' && 시 < 12) 시 += 12;
  if (m[4] === '오전' && 시 === 12) 시 = 0;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 시, Number(m[6]), Number(m[7] || 0));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 마지막으로 편지가 나간 뒤 며칠 지났나. 언제 보냈는지 모르면 null */
export function 며칠지났나(줄, 지금 = new Date()) {
  const d = 한국날짜읽기(줄 && (줄.제때보낸때 || 줄.보낸시각 || 줄.보낸때));
  if (!d) return null;
  return (지금 - d) / 86400000;
}

/**
 * 이 곳에 «지금» 편지를 보내도 되나.
 * ⚠ 넘기는 줄은 그 «주소»의 기록을 합친 것이어야 한다. 줄 하나만 보면 또 두 번 보낸다.
 */
export function 다시보내야하나(줄, 지금 = new Date(), 상품판 = 지금상품판) {
  if (!줄 || !주소(줄)) return false;
  /* 제 시각(현지 업무시간)에 아직 한 번도 안 나간 곳은 그 한 번을 마저 보낸다.
     보내고 나면 제때보냄 이 서므로 저절로 끝난다 */
  if (!줄.제때보냄) return true;
  const 지난날 = 며칠지났나(줄, 지금);
  if (지난날 === null) return false;                 /* 언제 보냈는지 모르면 안 보낸다 */
  if (지난날 >= 다시보내는간격일) return true;        /* 한 달이 지났다 */
  /* 한 달 안이라도 «상품이 늘었으면» 예외로 보낸다 — 사장님 지시 */
  return Boolean(줄.보낸상품판) && 줄.보낸상품판 !== 상품판;
}

/** 기록을 «주소»로 합친다. 같은 곳이면 한 줄로 본다 */
export function 주소로합친다(줄들) {
  const 통 = new Map();
  for (const x of 줄들 || []) {
    const a = 주소(x);
    if (!a) continue;
    const 앞 = 통.get(a);
    if (!앞) {
      통.set(a, { 주소: a, 줄: x, 메일: a, 기관: x.기관, 지역: x.지역,
        제때보냄: Boolean(x.제때보냄), 보낸상품판: x.보낸상품판,
        제때보낸때: x.제때보낸때, 보낸시각: x.보낸시각 });
      continue;
    }
    앞.제때보냄 = 앞.제때보냄 || Boolean(x.제때보냄);
    앞.지역 = 앞.지역 || x.지역;
    const 새때 = 한국날짜읽기(x.제때보낸때 || x.보낸시각);
    const 옛때 = 한국날짜읽기(앞.제때보낸때 || 앞.보낸시각);
    if (새때 && (!옛때 || 새때 > 옛때)) {
      앞.제때보낸때 = x.제때보낸때; 앞.보낸시각 = x.보낸시각; 앞.보낸상품판 = x.보낸상품판; 앞.줄 = x;
    }
  }
  return [...통.values()];
}

export function 오늘글(날 = new Date()) {
  return 날.getFullYear() + '-' + String(날.getMonth() + 1).padStart(2, '0') + '-' + String(날.getDate()).padStart(2, '0');
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  const 흠 = [];
  let 잰수 = 0;
  const 재다 = (n, t) => { 잰수 += 1; if (!t) 흠.push(n); };

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

  재다('제 시각에 아직 안 보낸 곳은 마저 보낸다', 다시보내야하나({ 메일: 'a@b.c' }) === true);
  재다('주소가 없으면 안 보낸다', 다시보내야하나({}) === false);
  재다('🔴 멈춤쪽지가 있으면 사유를 읽어 낸다', 멈췄나(path.join(뿌리, 'package.json')) !== null);
  재다('멈춤쪽지가 없으면 null 이다', 멈췄나(path.join(뿌리, '없는쪽지-' + Date.now() + '.txt')) === null);
  재다('빈 줄도 견딘다', 다시보내야하나(null) === false);
  재다('받는곳 칸만 있어도 주소로 본다', 주소({ 받는곳: ' A@B.C ' }) === 'a@b.c');

  /* 🔴 사장님이 바꾸신 원칙 — 한 달 · 상품이 늘면 예외 */
  const 지금 = new Date(2026, 8, 14, 9, 0, 0);
  const 보냄 = (판) => ({ 메일: 'a@b.c', 제때보냄: true, 제때보낸때: '2026. 9. 13. 오후 10:00:00', 보낸상품판: 판 });
  재다('한 달 안에는 두 번 안 보낸다', 다시보내야하나(보냄('korea+uae'), 지금, 'korea+uae') === false);
  재다('🔴 상품이 늘면 한 달 안이라도 보낸다', 다시보내야하나(보냄('korea'), 지금, 'korea+uae') === true);
  재다('한 달이 지나면 보낸다', 다시보내야하나(보냄('korea+uae'), new Date(2026, 9, 20, 9, 0, 0), 'korea+uae') === true);
  재다('29일째는 아직 안 보낸다', 다시보내야하나(보냄('korea+uae'), new Date(2026, 9, 12, 9, 0, 0), 'korea+uae') === false);
  재다('언제 보냈는지 모르면 안 보낸다', 다시보내야하나({ 메일: 'a@b.c', 제때보냄: true, 보낸상품판: 'korea+uae' }, 지금, 'korea+uae') === false);
  재다('옛 기록(상품판 없음)은 한 달 전엔 안 보낸다', 다시보내야하나({ 메일: 'a@b.c', 제때보냄: true, 제때보낸때: '2026. 9. 13. 오후 10:00:00' }, 지금, 'korea+uae') === false);

  재다('한국어 시각을 읽는다', 한국날짜읽기('2026. 9. 12. 오후 2:21:22').getHours() === 14);
  재다('오전 12시는 0시다', 한국날짜읽기('2026. 9. 12. 오전 12:05:00').getHours() === 0);
  재다('못 읽는 글은 null', 한국날짜읽기('언젠가') === null);
  재다('빈 것도 null', 한국날짜읽기('') === null);
  재다('하루 지나면 1일', Math.round(며칠지났나({ 보낸시각: '2026. 9. 13. 오후 10:00:00' }, new Date(2026, 8, 14, 22, 0, 0))) === 1);

  /* 🔴 실제로 저지른 것 — 이름이 달라 같은 주소에 두 번 보냈다 */
  const 겹친것 = 주소로합친다([
    { 기관: 'Kopernik Global Investors', 받는곳: 'contact@kopernikglobal.com', 보낸시각: '2026. 9. 12. 오후 2:21:22' },
    { 기관: 'Kopernik Global Investors, LLC', 메일: 'contact@kopernikglobal.com', 지역: '뉴욕', 제때보냄: true, 제때보낸때: '2026. 9. 13. 오후 10:37:53', 보낸상품판: 'korea+uae' },
  ]);
  재다('🔴 이름이 달라도 주소가 같으면 한 곳이다', 겹친것.length === 1);
  재다('합치면 제때보냄이 산다', 겹친것[0].제때보냄 === true);
  재다('합친 곳에는 한 달 안에 또 안 보낸다', 다시보내야하나(겹친것[0], 지금, 'korea+uae') === false);
  재다('빈 명단도 견딘다', 주소로합친다([]).length === 0 && 주소로합친다(null).length === 0);

  return { 흠, 잰수 };
}

function 본일() {
  const { 흠, 잰수 } = 자가시험();
  console.log(흠.length ? '🔴 자가시험 실패:\n  - ' + 흠.join('\n  - ') : '✅ 자가시험 ' + (잰수 - 흠.length) + '/' + 잰수);
  if (흠.length) process.exit(1);
  if (process.argv.includes('--자가시험')) return;

  const 멈춤사유 = 멈췄나();
  if (멈춤사유 && !process.argv.includes('--잰다')) {
    console.log('\n🔴 영업 메일이 «멈춤»이다 — 한 통도 안 보낸다.');
    console.log('   쪽지: ' + 멈춤쪽지);
    멈춤사유.split('\n').forEach((줄) => console.log('   │ ' + 줄));
    console.log('   ✅ 다시 열려면 그 파일을 지운다. 코드를 고치지 않는다.');
    return;
  }

  const 기록 = JSON.parse(fs.readFileSync(기록파일, 'utf8'));
  기록.보낸것 = Array.isArray(기록.보낸것) ? 기록.보낸것 : [];
  const 지금시 = new Date().getHours();
  const 잰다 = process.argv.includes('--잰다');

  console.log('\n■ 지금 한국시간 ' + 지금시 + '시 — 어디에 보낼 때인가');
  for (const k of Object.keys(지역)) {
    console.log('   ' + (보낼때인가(k, 지금시) ? '✅' : '⬜') + ' ' + k.padEnd(6, ' ')
      + ' 현지 09~11시 = 한국 ' + 한국시(k, 9) + '~' + 한국시(k, 11) + '시  (' + 지역[k].도시 + ')');
  }

  /* 🔴 주소로 합쳐서 본다 — 이름이 달라도 같은 주소면 한 곳이다 */
  const 합친것 = 주소로합친다(기록.보낸것);
  const 지금때 = new Date();
  const 할것 = 합친것.filter((x) => 다시보내야하나(x, 지금때, 지금상품판));
  console.log('\n■ 보낼 곳 ' + 할것.length + '개  (아는 곳 ' + 합친것.length + ' 중)');
  console.log('   규칙: 한 달(' + 다시보내는간격일 + '일) 안에는 두 번 안 보낸다 · 상품이 늘면 예외 · 지금 상품판 ' + 지금상품판);
  let 보냄 = 0, 아직 = 0;
  for (const x of 할것) {
    const z = x.지역;
    if (!z || !지역[z]) { console.log('   ⬜ ' + (x.기관 || x.메일) + ' — 지역을 모른다. 명단에 나라를 적어야 한다'); 아직 += 1; continue; }
    if (!보낼때인가(z, 지금시)) { console.log('   ⏳ ' + (x.기관 || x.메일) + ' — ' + z + ', 한국 ' + 한국시(z, 9) + '시에 보낸다'); 아직 += 1; continue; }
    if (잰다) { console.log('   ▶ ' + (x.기관 || x.메일) + ' — 지금 보낼 때다(재기만 함)'); 보냄 += 1; continue; }
    try {
      execFileSync('node', [path.join(뿌리, 'scripts/send-mail.mjs'),
        '--받는곳=' + x.메일,
        /* 🔴 [2026-09-14] 「Korean」 한 마디가 우리를 «한국 전문업체»로 분류시킨다.
           아시아 전체를 사는 펀드에게는 그것이 «내 담당이 아니다»로 읽힌다.
           ⛔ 그렇다고 「Asia」라고만 쓰면 일본·중국이 있다고 읽는다 — 지금은 없다.
           ✅ 그래서 «우산 + 지금 열린 것»을 함께 적는다. 과장이 아니고 좁지도 않다. */
        '--제목=' + (x.제목 || 'Asia & Gulf filings data in English — Korea, UAE etc.'),
        '--글=' + path.join(뿌리, 'docs/영업/영업편지-기관투자자-영문.txt'),
        '--보낸다'], { cwd: 뿌리, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000 });
      /* 합친 줄이 아니라 «원래 줄»에 적어야 기록이 남는다 */
      const 적을곳 = x.줄 || x;
      적을곳.제때보냄 = true;
      적을곳.제때보낸때 = new Date().toLocaleString('ko-KR');
      적을곳.보낸상품판 = 지금상품판;
      x.제때보냄 = true;
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
