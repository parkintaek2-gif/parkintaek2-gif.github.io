#!/usr/bin/env node
/**
 * check-asia-coverage.mjs — **아시아 마켓이 나라별로 «어디까지 찼나»를 센다.**
 *
 * 🔴 사장님 (2026-09-27): 「**아시아마켓 구축도 중요하고**」
 *    앞서 (2026-09-26): 「**아시아마켓츠 마무리했나?**」 · 「**아직 멀었는데 넋놓고 있니?**」
 *
 * ── 왜 이 자가 필요한가 ─────────────────────────────────────────
 * 「어디까지 됐나」를 문서로 적어 두면 그 문서가 늙는다. 실제로 오늘 아침 계획 문서와
 * 자료 폴더가 어긋나 있었다. ⇒ **자료를 직접 세서** 채움도를 낸다.
 *
 * 축은 저장소 CLAUDE.md 가 정한 순서 그대로다 —
 *   ① 회사 명부  ② 재무제표  ③ 공시(중대사건)  ④ 시세·지수
 *   ⑤ 사람(이사회·임원)은 «서비스»다. 주력으로 세지 않는다(사장님 2026-09-14).
 *
 * ⛔ **못 잰 것은 못 쟀다고 적는다. 0 으로 채우지 않는다.**
 * ⛔ 라이선스로 막힌 것은 «비어 있다»가 아니라 «막혔다»로 적는다 — 그 둘은 다른 말이고,
 *   섞으면 다음 사람이 이미 재 본 벽에 또 머리를 박는다.
 *
 * 쓰는 법
 *   node scripts/check-asia-coverage.mjs
 *   node scripts/check-asia-coverage.mjs --자가시험   (영문 별칭 --selftest)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원자료방 = path.join(뿌리, 'archive', 'raw');

/**
 * 나라표 — 축마다 «어느 폴더가 그것인가».
 * ⚠ 폴더 이름을 여기 한 곳에 적는다. 수집기 이름이 바뀌면 여기만 고친다.
 */
export const 나라들 = [
  {
    나라: '한국', 코드: 'KR',
    명부: 'dart-company', 재무: 'dart-financials', 공시: 'dart-breaking', 시세: 'krx',
  },
  {
    나라: '일본', 코드: 'JP',
    명부: 'japan-jpx-companies', 재무: 'japan-edinet-financials',
    공시: 'japan-edinet-breaking', 시세: 'jgb-yields',
  },
  {
    나라: 'UAE 아부다비', 코드: 'AE-AZ',
    명부: 'uae-adx-marketwatch', 재무: 'uae-adx-financials',
    공시: 'uae-adx-disclosures', 시세: 'uae-adx-marketwatch',
  },
  {
    나라: 'UAE 두바이', 코드: 'AE-DU',
    명부: 'dubai-dfm-companies', 재무: 'dubai-dfm-financials',
    공시: 'dubai-dfm-breaking', 시세: null,
  },
  {
    나라: '사우디', 코드: 'SA',
    명부: 'saudi-openfigi-companies', 재무: null, 공시: null, 시세: null,
    /* 🔴 2026-09-26 에 재 봤다. 「못 했다」가 아니라 「막혔다」다 */
    막힘: {
      명부: '이름·티커 벌크 재배포를 OpenFIGI 약관이 명시하지 않는다 — 모으기만 한다',
      재무: 'saudiexchange.sa 약관이 systematic retrieval 을 금지한다. 규제기관도 발행사 명부를 안 낸다',
    },
  },
  {
    나라: '대만', 코드: 'TW',
    명부: null, 재무: 'twse-financials', 공시: null, 시세: null,
  },
  {
    나라: '인도', 코드: 'IN',
    명부: null, 재무: null, 공시: null, 시세: null,
    딸림: { '신용등급': 'india-nse-credit-rating' },
  },
  {
    나라: '중국 상하이', 코드: 'CN-SH',
    명부: null, 재무: null, 공시: 'shanghai-cninfo-breaking', 시세: null,
  },
  {
    나라: '홍콩', 코드: 'HK',
    명부: null, 재무: null, 공시: null, 시세: null,
    막힘: { 명부: 'HKEX 약관이 systematic retrieval to compile a database 를 금지한다 (2026-09 재 봤다)' },
  },
];

export const 축들 = ['명부', '재무', '공시', '시세'];

/** 그 폴더에 벌이 몇이고 마지막이 언제인가. ⛔ 없으면 «없다»를 준다. 0 으로 치지 않는다 */
export function 벌세기(폴더, 방 = 원자료방) {
  if (!폴더) return null;
  const 길 = path.join(방, 폴더);
  if (!fs.existsSync(길)) return null;
  let 것들 = [];
  try { 것들 = fs.readdirSync(길).filter((s) => !s.startsWith('_')); } catch { return null; }
  if (!것들.length) return { 수: 0, 마지막: null };
  const 날 = 것들
    .map((s) => (s.match(/(\d{4})-?(\d{2})-?(\d{2})/) || []).slice(1).join('-'))
    .filter(Boolean)
    .sort();
  return { 수: 것들.length, 마지막: 날.length ? 날[날.length - 1] : null };
}

/** 한 나라의 채움을 재서 줄 하나로 만든다 */
export function 나라재기(나라, 방 = 원자료방) {
  const 칸 = {};
  for (const 축 of 축들) {
    const 막힌까닭 = 나라.막힘?.[축];
    const 잰것 = 벌세기(나라[축], 방);
    if (잰것 && 잰것.수) 칸[축] = { 꼴: '있다', ...잰것, 막힌까닭 };
    else if (막힌까닭) 칸[축] = { 꼴: '막혔다', 막힌까닭 };
    else 칸[축] = { 꼴: '없다' };
  }
  const 찬수 = 축들.filter((a) => 칸[a].꼴 === '있다').length;
  const 막힌수 = 축들.filter((a) => 칸[a].꼴 === '막혔다').length;
  return { ...나라, 칸, 찬수, 막힌수 };
}

/** 다음에 손댈 곳 — «막힌 것이 아니라 비어 있는 것» 가운데 앞 축부터 */
export function 다음할것(잰것들) {
  const 것 = [];
  for (const r of 잰것들) {
    for (const 축 of 축들) {
      if (r.칸[축].꼴 !== '없다') continue;
      것.push({ 나라: r.나라, 축, 찬수: r.찬수 });
      break;                       /* 한 나라에 하나씩만 — 앞 축이 먼저다 */
    }
  }
  /* 이미 많이 찬 나라를 먼저 마무리한다. 반쯤 선 나라가 상품이 되기 더 가깝다 */
  것.sort((a, z) => z.찬수 - a.찬수);
  return 것;
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; const 실패 = [];
  const 본다 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패.push(이름); console.log('❌ ' + 이름); } };

  본다('⛔ 없는 폴더는 null — 0 으로 치지 않는다', 벌세기('없는폴더') === null);
  본다('⛔ 폴더 이름이 null 이면 null', 벌세기(null) === null);
  본다('⛔ 밑줄로 시작하는 것은 벌이 아니다 (_coverage.json)',
    (벌세기('uae-adx-financials')?.수 ?? 0) < 106);

  /* 🔴 「막혔다」와 「없다」는 다른 말이다 — 섞으면 이미 재 본 벽에 또 박는다 */
  const 사우디 = 나라재기(나라들.find((n) => n.코드 === 'SA'));
  본다('🔴 사우디 재무는 «막혔다»로 적힌다', 사우디.칸.재무.꼴 === '막혔다');
  본다('🔴 막힌 까닭이 함께 적힌다', /systematic retrieval/.test(사우디.칸.재무.막힌까닭 ?? ''));
  const 홍콩 = 나라재기(나라들.find((n) => n.코드 === 'HK'));
  본다('🔴 홍콩 명부도 «막혔다»다 — 2026-09 에 재 봤다', 홍콩.칸.명부.꼴 === '막혔다');

  const 일본 = 나라재기(나라들.find((n) => n.코드 === 'JP'));
  본다('일본은 재무가 차 있다', 일본.칸.재무.꼴 === '있다');
  본다('찬 축을 센다', 일본.찬수 >= 3);

  /* ⛔ 막힌 것을 「다음 할 것」으로 올리면 안 된다 */
  const 다음 = 다음할것([사우디, 홍콩, 일본]);
  본다('⛔ 막힌 축은 다음 할 것에 안 오른다',
    !다음.some((d) => d.나라 === '사우디' && d.축 === '재무'));
  본다('한 나라에 한 줄만 오른다',
    new Set(다음.map((d) => d.나라)).size === 다음.length);

  console.log(`\n${실패.length ? '❌' : '✅'} 자가시험 ${통과}${실패.length ? ' · 실패 ' + 실패.length : ' 통과'}`);
  return !실패.length;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1);
} else if (내가진입점) {
  const 잰것 = 나라들.map((n) => 나라재기(n));
  const 표시 = { 있다: '✅', 막혔다: '⛔', 없다: '⬜' };

  console.log('■ 아시아 마켓 채움도 — 자료를 직접 세었다\n');
  console.log(`${'나라'.padEnd(16)} ${축들.map((a) => a.padEnd(7)).join('')} 찬 축`);
  console.log('─'.repeat(58));
  for (const r of 잰것) {
    const 칸글 = 축들.map((a) => (표시[r.칸[a].꼴] + '     ')).join('');
    console.log(`${r.나라.padEnd(16)} ${칸글} ${r.찬수}/4${r.막힌수 ? ` (막힘 ${r.막힌수})` : ''}`);
  }

  console.log('\n■ 벌 수와 마지막 날');
  for (const r of 잰것) {
    const 있는것 = 축들.filter((a) => r.칸[a].꼴 === '있다');
    if (!있는것.length) continue;
    console.log(`  ${r.나라} — ${있는것.map((a) => `${a} ${r.칸[a].수}벌${r.칸[a].마지막 ? `(~${r.칸[a].마지막})` : ''}`).join(' · ')}`);
  }

  const 막힌것 = [];
  for (const r of 잰것) for (const a of 축들) {
    if (r.칸[a].꼴 === '막혔다') 막힌것.push(`${r.나라} ${a} — ${r.칸[a].막힌까닭}`);
  }
  if (막힌것.length) {
    console.log('\n⛔ 재 보고 «안 된다»고 적은 것 — 다시 머리를 박지 않는다');
    for (const s of 막힌것) console.log(`  · ${s}`);
  }

  console.log('\n▶ 다음에 손댈 곳 (반쯤 선 나라부터, 앞 축부터)');
  for (const d of 다음할것(잰것).slice(0, 6)) {
    console.log(`  ${d.찬수}/4  ${d.나라} — ${d.축}`);
  }
  console.log('\n⚠ 사람(이사회·임원)은 축에 넣지 않았다 — 사장님이 「서비스 정도」로 정하셨다(2026-09-14).');
}
