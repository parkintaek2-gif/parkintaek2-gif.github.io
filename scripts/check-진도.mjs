#!/usr/bin/env node
/**
 * check-진도.mjs — **내가 시킨 일이 어디까지 왔나를 «자»가 잰다.**
 *
 *   node scripts/check-진도.mjs
 *   node scripts/check-진도.mjs --자리 6번
 *   node scripts/check-진도.mjs --자가시험
 *
 * ── 🔴 왜 만드나 (2026-09-16 · 사장님) ───────────────────────────────────
 *
 * 사장님: 「**각 세션별로 작업 진행 상황을 네가 알아서 체크헀어야 하는 거야**」
 *
 * 그날 사장님이 「진도율은?」 하고 물으셔서야 내가 처음 쟀다. 재 보니 —
 * ```
 *   값조사 1단계   세 자리 중 «1번만» 끝나 있었다 (마감 그날 낮 12시)
 *   3번            20:48 에 「새 지시 없음」이라고 적고 있었다. 지시는 있었다
 *   6번·2번        내가 시킨 일을 이미 끝냈는데 «나는 몰랐다»
 * ```
 * ⛔ 앞의 둘은 밀린 것이고 뒤의 하나는 «끝난 줄도 몰랐던 것»이다. 셋 다 내 잘못이다.
 *   시키는 것까지는 했는데 **재는 것을 내 기억에 맡겼다.**
 *
 * ⭐ 내가 이미 알고 있던 규칙이었다 —
 *   「시킨 뒤에는 시각을 정해 내가 직접 확인한다. 시키고 잊는 것은 안 시킨 것과 같다」
 *   그런데 그 확인을 «자»로 안 만들어서, 바쁜 날 제일 먼저 무너졌다.
 *   바로 16시 보고를 놓쳤을 때와 같은 병이다. 그때 얻은 답이 여기에도 그대로 걸린다 —
 *   **잡히는 것은 지켜지고, 안 잡히는 것만 빠진다.**
 *
 * ── 이 자가 지키는 것 ────────────────────────────────────────────────────
 * ```
 * ✅ 지시를 내릴 때 «판정하는 법»을 함께 적는다. 그 판정을 여기에 코드로 옮긴다
 * ⛔ 「했다고 하더라」로 세지 않는다 — 파일·라이브·자료를 직접 본다
 * ⬜ 못 재는 것은 «못 쟀다»고 적는다. 0 으로도 초록으로도 치지 않는다
 * ⛔ 마감이 지났는데 안 됐으면 «늦었다»고 적는다. 「거의 다 됐다」로 넘기지 않는다
 * ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 형제 = path.resolve(뿌리, '../klifemap');

const 읽기 = (길) => { try { return fs.readFileSync(길, 'utf8'); } catch { return null; } };
const 있나 = (길) => fs.existsSync(path.isAbsolute(길) ? 길 : path.join(뿌리, 길));

/** 이 PC 는 이미 한국시간이다. ⛔ toISOString() 을 쓰지 않는다 */
export function 시각글(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
    + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

export function 늦었나(마감, 이제 = new Date()) {
  /* ⛔ Date.parse 는 「아무거나:00」 같은 것도 더러 읽어 낸다. 꼴부터 막는다 —
     안 막으면 마감이 깨진 줄을 «안 늦었다»로 조용히 넘긴다 */
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(String(마감 ?? ''))) return null;
  const t = Date.parse(String(마감).replace(' ', 'T') + ':00');
  if (!Number.isFinite(t)) return null;
  return 이제.getTime() > t;
}

/**
 * 🔴 **내가 지금 시켜 둔 일 전부.** 지시를 내리면 «여기에도» 한 줄 더한다.
 * ⛔ 여기 안 적힌 지시는 아무도 안 잰다 — 그러면 시킨 것이 아니다.
 */
export const 맡은일 = [
  /* ── 값 정하기 (사장님: 조사 → 토론 → 숙의 → 결론) ───────────────── */
  {
    자리: '1번', 이름: '값조사 — 해외 5곳', 마감: '2026-09-16 12:00',
    잰다: () => {
      const g = 읽기(path.join(뿌리, 'docs/값조사-기업신용정보.md'));
      if (g === null) return { 됐나: null, 말: '문서를 못 읽었다' };
      const 칸 = (g.split('## Ⅱ.')[0] ?? '');
      const n = (칸.match(/^### \d\./gm) ?? []).length;
      return { 됐나: n >= 5, 말: '적힌 곳 ' + n + '/5' };
    },
  },
  {
    자리: '3번', 이름: '값조사 — 국내 5곳', 마감: '2026-09-16 12:00',
    잰다: () => {
      const g = 읽기(path.join(뿌리, 'docs/값조사-기업신용정보.md'));
      if (g === null) return { 됐나: null, 말: '문서를 못 읽었다' };
      const 칸 = (g.split('## Ⅱ.')[1] ?? '').split('## Ⅲ.')[0] ?? '';
      if (/\(3번이 채운다\)/.test(칸)) return { 됐나: false, 말: '칸이 «비어 있다»' };
      return { 됐나: 칸.trim().length > 200, 말: '적힌 글자 ' + 칸.trim().length + '자' };
    },
  },
  {
    자리: '6번', 이름: '값조사 — 개인·소형 4곳', 마감: '2026-09-16 12:00',
    잰다: () => {
      const g = 읽기(path.join(뿌리, 'docs/값조사-기업신용정보.md'));
      if (g === null) return { 됐나: null, 말: '문서를 못 읽었다' };
      const 칸 = (g.split('## Ⅲ.')[1] ?? '');
      if (/\(6번이 채운다\)/.test(칸)) return { 됐나: false, 말: '칸이 «비어 있다»' };
      return { 됐나: 칸.trim().length > 200, 말: '적힌 글자 ' + 칸.trim().length + '자' };
    },
  },

  /* ── 손님길 (사장님: 결제가 안되는 사이트는 정말 쓰레기야) ─────────── */
  {
    자리: '2번', 이름: 'KLifeMap 자에 «다시 보기» 다리', 마감: '2026-09-16 21:00',
    잰다: () => {
      const g = 읽기(path.join(뿌리, 'scripts/손님길-자물쇠.mjs'));
      if (g === null) return { 됐나: null, 말: '자물쇠 자를 못 읽었다' };
      const 칸 = (g.split("코드: 'klifemap'")[1] ?? '').slice(0, 400);
      return { 됐나: /다시 보기/.test(칸), 말: /다시 보기/.test(칸) ? '셋 다 잰다' : '아직 둘만 잰다' };
    },
  },
  {
    자리: '6번', 이름: '회원가입 1단계 — 결제칸 이메일 + 산 사람에게 편지',
    마감: '2026-09-16 21:00',
    잰다: () => {
      const 보냄 = 있나('src/lib/gmail-send.mjs');
      const s = 읽기(path.join(뿌리, 'server.mjs')) ?? '';
      const 붙었나 = /gmail-send/.test(s);
      const p = 읽기(path.join(뿌리, 'src/lib/paypal.mjs')) ?? '';
      const 메일뽑나 = /email_address|산사람메일/.test(p);
      const 칸 = [보냄 && '보내는 조각', 붙었나 && '서버에 붙음', 메일뽑나 && '구매자 메일 뽑음']
        .filter(Boolean);
      return { 됐나: 보냄 && 붙었나 && 메일뽑나, 말: 칸.length ? 칸.join(' · ') : '아직 없다' };
    },
  },

  /* ── 주력 한 줄 (계획 F1 — 병목) ──────────────────────────────────── */
  {
    자리: '6번', 이름: 'F1 재무 — 2023년 + 분기 + 계정 일곱', 마감: '2026-09-17 21:00',
    잰다: () => {
      const g = 읽기(path.join(뿌리, 'src/data/korea-financials-tape.json'));
      if (g === null) return { 됐나: null, 말: '재무 테이프를 못 읽었다' };
      let 줄 = [];
      try { const j = JSON.parse(g); 줄 = j.rows ?? j; } catch { return { 됐나: null, 말: '못 읽었다' }; }
      const 해 = [...new Set(줄.map((r) => r.year ?? r.fiscalYear))].filter(Boolean).sort();
      const 계정 = Object.keys(줄[0] ?? {});
      const 새계정 = ['current_assets', 'current_liabilities', 'retained_earnings',
        'finance_costs', 'short_term_borrowings', 'long_term_borrowings', 'bonds']
        .filter((k) => 계정.includes(k));
      return {
        됐나: 해.length >= 3 && 새계정.length >= 7,
        말: '해 ' + 해.join('·') + ' (' + 해.length + '/3) · 새 계정 ' + 새계정.length + '/7',
      };
    },
  },

  /* ── 새 나라 (사장님: 아시아마켓츠인데 도쿄가 빠지면 안된다) ──────── */
  {
    자리: '1번', 이름: '도쿄 — 라이선스 판정 + EDINET 무료 열쇠', 마감: '2026-09-16 21:00',
    잰다: () => {
      const g = 읽기(path.join(뿌리, 'docs/데이터-출처-라이선스.md')) ?? '';
      const 적혔나 = /EDINET|JPX/i.test(g);
      return { 됐나: 적혔나, 말: 적혔나 ? '라이선스 문서에 적혔다' : '아직 안 적혔다' };
    },
  },
  {
    자리: '1번', 이름: '도쿄 — 수집기 둘', 마감: '2026-09-17 21:00',
    잰다: () => {
      const 것 = ['scripts/collect-japan-jpx-listings.mjs', 'scripts/collect-japan-edinet.mjs']
        .filter((f) => 있나(f));
      return { 됐나: 것.length === 2, 말: '만든 자 ' + 것.length + '/2' };
    },
  },

  /* ── 남의 저장소에 있는 것 ────────────────────────────────────────── */
  {
    자리: '2번', 이름: 'KLifeMap 첫 화면 — 무료 맨 위, 바로 아래 값표',
    마감: '2026-09-16 12:00',
    잰다: () => {
      const g = 읽기(path.join(형제, 'public/index.html'));
      if (g === null) return { 됐나: null, 말: '형제 저장소 첫 화면을 못 읽었다' };
      /* 무료 칸이 값표(원) 보다 «먼저» 나오나 */
      const 무료 = g.indexOf('무료');
      const 값 = g.search(/[0-9],?[0-9]{3}원/);
      if (무료 < 0 || 값 < 0) return { 됐나: null, 말: '무료 칸이나 값표를 못 찾았다' };
      return { 됐나: 무료 < 값, 말: 무료 < 값 ? '무료가 값표보다 위에 있다' : '아직 값표가 위다' };
    },
  },
];

export function 잰다전부(목록 = 맡은일, 이제 = new Date()) {
  return 목록.map((x) => {
    let r;
    try { r = x.잰다(); } catch (e) { r = { 됐나: null, 말: '재다가 막혔다 — ' + e.message.slice(0, 60) }; }
    return { ...x, ...r, 늦음: r.됐나 === true ? false : 늦었나(x.마감, 이제) };
  });
}

function 본일() {
  const 고른자리 = (() => { const i = process.argv.indexOf('--자리'); return i > 0 ? process.argv[i + 1] : null; })();
  const 이제 = new Date();
  let 것 = 잰다전부(맡은일, 이제);
  if (고른자리) 것 = 것.filter((x) => x.자리 === 고른자리);

  console.log('■ 시킨 일이 어디까지 왔나 — ' + 이제.toLocaleString('ko-KR'));
  console.log('  ⛔ 「했다고 하더라」로 세지 않는다. 파일·자료를 직접 본다\n');

  let 됐다 = 0; let 안됐다 = 0; let 못쟀다 = 0;
  for (const 자리 of ['1번', '2번', '3번', '6번']) {
    const 몫 = 것.filter((x) => x.자리 === 자리);
    if (!몫.length) continue;
    console.log('── ' + 자리 + ' ──');
    for (const x of 몫) {
      const 표 = x.됐나 === true ? '✅' : (x.됐나 === null ? '⬜' : (x.늦음 ? '🔴' : '⏳'));
      if (x.됐나 === true) 됐다 += 1; else if (x.됐나 === null) 못쟀다 += 1; else 안됐다 += 1;
      console.log('  ' + 표 + ' ' + x.이름);
      console.log('      마감 ' + x.마감 + (x.늦음 ? '  ⚠ 지났다' : '') + ' · ' + x.말);
    }
    console.log('');
  }
  console.log('잰 것 ' + 것.length + ' · 됐다 ' + 됐다 + ' · 안 됐다 ' + 안됐다 + ' · 못 쟀다 ' + 못쟀다);
  const 늦은것 = 것.filter((x) => x.늦음 && x.됐나 !== true);
  if (늦은것.length) {
    console.log('\n🔴 마감이 지났는데 안 된 것 ' + 늦은것.length + '개 —');
    for (const x of 늦은것) console.log('   · ' + x.자리 + ' ' + x.이름);
    console.log('   ⛔ 「거의 다 됐다」로 넘기지 않는다. 그 자리에 가서 무엇이 막혔는지 묻는다.');
  }
  return 늦은것.length ? 1 : 0;
}

/** 일일 점검이 부르는 공통 입구 */
export function 일일점검(사이트코드) {
  if (사이트코드 && 사이트코드 !== 'seoulmarkets') return { 됐나: null, 말: '하루 한 번 — SeoulMarkets 칸에서만 잽니다' };
  const 것 = 잰다전부();
  const 늦은것 = 것.filter((x) => x.늦음 && x.됐나 !== true);
  const 된것 = 것.filter((x) => x.됐나 === true).length;
  if (!늦은것.length) return { 됐나: true, 말: '시킨 일 ' + 것.length + '개 중 ' + 된것 + '개 됐고, 늦은 것 없다' };
  return {
    됐나: false,
    말: '🔴 마감이 지난 것 ' + 늦은것.length + '개 — '
      + 늦은것.map((x) => x.자리 + ' ' + x.이름).join(' · ').slice(0, 150),
  };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('맡은일이 비어 있지 않다', 맡은일.length >= 8);
  재다('자리가 다 적혀 있다', 맡은일.every((x) => /^[1-6]번$/.test(x.자리)));
  재다('마감이 다 적혀 있다', 맡은일.every((x) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(x.마감)));
  재다('재는 법이 다 코드로 있다', 맡은일.every((x) => typeof x.잰다 === 'function'));
  재다('⛔ 5번(나)은 안 넣는다 — 내 일은 내가 챙긴다',
    !맡은일.some((x) => x.자리 === '5번'));

  재다('늦었나: 지난 마감은 참', 늦었나('2026-09-15 12:00', new Date(2026, 8, 16, 1, 0)) === true);
  재다('늦었나: 안 지난 마감은 거짓', 늦었나('2026-09-20 12:00', new Date(2026, 8, 16, 1, 0)) === false);
  재다('⛔ 늦었나: 못 읽으면 null', 늦었나('아무거나') === null);

  const 가짜 = [
    { 자리: '6번', 이름: 'ㄱ', 마감: '2026-09-15 12:00', 잰다: () => ({ 됐나: false, 말: '' }) },
    { 자리: '6번', 이름: 'ㄴ', 마감: '2026-09-15 12:00', 잰다: () => ({ 됐나: true, 말: '' }) },
    { 자리: '6번', 이름: 'ㄷ', 마감: '2026-09-20 12:00', 잰다: () => { throw new Error('x'); } },
  ];
  const r = 잰다전부(가짜, new Date(2026, 8, 16, 1, 0));
  재다('안 된 채로 마감이 지나면 늦음', r[0].늦음 === true);
  재다('⛔ 된 것은 마감이 지나도 늦음이 아니다', r[1].늦음 === false);
  재다('⛔ 재다가 막히면 «못 쟀다»(null)로 둔다 — 안 됐다로 몰지 않는다', r[2].됐나 === null);
  재다('재다가 막혀도 다른 것을 계속 잰다', r.length === 3);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log('■ 자가시험 ' + (것.length - 실패.length) + '/' + 것.length);
  for (const x of 실패) console.log('  🔴 ' + x.이름);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
else if (process.argv[1] && process.argv[1].endsWith('check-진도.mjs')) process.exit(본일());
