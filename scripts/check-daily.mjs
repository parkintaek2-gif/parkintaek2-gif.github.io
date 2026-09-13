#!/usr/bin/env node
/**
 * check-daily.mjs — **하루 세 번 도는 점검표.**
 * ─────────────────────────────────────────────────────────────────────────
 * 사장님 지시 (2026-09-13): 「유료/무료 사이트에 따라 매일 체크해야 할 사항을
 *   모든 유닛이 토론을 해서 정해라. 체크리스트를 만들고 **하루 시작할 때, 여섯시간 뒤,
 *   하루 마감할 때** 체크하는 게좋겠다」
 *
 *   node scripts/check-daily.mjs                 지금 시각에 맞는 때를 골라 전부 잰다
 *   node scripts/check-daily.mjs --때 아침        때를 박아서 잰다
 *   node scripts/check-daily.mjs --사이트 klifemap 한 사이트만
 *   node scripts/check-daily.mjs --자가시험        자가시험만 돌고 끝낸다
 *
 * 🔴 이 자가 지키는 것
 *   ⛔ 「못 잰 것」을 «통과»로 세지 않는다. 손으로 볼 것은 손으로 볼 것이라고 내놓는다.
 *      못 잰 하나를 초록으로 칠하면 그 옆의 진짜 고장까지 안 보게 된다.
 *   ⛔ 못 잰 것 때문에 전체를 빨강으로 만들지도 않는다 — 「고칠 수 없는 빨강」은 아무도 안 본다.
 *      나가는 값(exit code)은 «잰 것 가운데 깨진 것»으로만 정한다.
 *   ✅ 항목은 src/data/daily-checklist.mjs 에만 있다. 여기서 항목을 또 적지 않는다.
 */
import https from 'node:https';
import { 사이트, 때, 볼것, 지금때, 잴수있나, 길찾기, 항목 } from '../src/data/daily-checklist.mjs';

const 인자 = process.argv.slice(2);
const 값 = (이름) => { const i = 인자.indexOf(이름); return i >= 0 ? 인자[i + 1] : null; };

/** 한 번 받아 온다. 던지지 않는다 — 못 받은 것도 «결과»다 */
export function 받기(주소, 시간 = 15000) {
  return new Promise((풀기) => {
    const 끝났나 = { 됐다: false };
    const 한번만 = (v) => { if (!끝났나.됐다) { 끝났나.됐다 = true; 풀기(v); } };
    const req = https.get(주소, { timeout: 시간 }, (res) => {
      let 글 = '';
      res.on('data', (d) => { 글 += d; if (글.length > 400000) req.destroy(); });
      res.on('end', () => 한번만({ 코드: res.statusCode, 글 }));
    });
    req.on('timeout', () => { req.destroy(); 한번만({ 코드: 0, 글: '', 왜: '시간 초과' }); });
    req.on('error', (e) => 한번만({ 코드: 0, 글: '', 왜: String(e.message || e) }));
  });
}

/** 결제가 사나 — 사이트마다 보는 곳이 다르다 */
export function 결제판정(사이트코드, 답) {
  if (!답 || 답.코드 !== 200) return { 산다: false, 왜: '응답 ' + (답 ? 답.코드 : '?') + (답 && 답.왜 ? ' · ' + 답.왜 : '') };
  let j = null;
  try { j = JSON.parse(답.글); } catch { return { 산다: false, 왜: 'JSON 이 아니다 — 옛 서버이거나 지면이 왔다' }; }

  if (사이트코드 === 'seoulmarkets') {
    if (j.enabled !== true) return { 산다: false, 왜: '결제가 꺼져 있다' };
    if (j.live !== true) return { 산다: false, 왜: 'live 가 아니다 — 시험 모드다' };
    return { 산다: true, 왜: 'enabled·live · ' + (j.currency || '?') };
  }
  /* 🔴 klifemap 은 «결제 갈래»(/api/billing/paypal/status)를 본다.
     ⛔ /api/health 의 degraded 로 판정하지 않는다 — 그것은 소셜 로그인 열쇠가 없어서도 뜬다.
       2026-09-13 에 결제가 멀쩡히 산 채로 빨강이 떴다. 헛우는 자는 아무도 안 본다.
     ⚠ 로그인이 막힌 것은 «문» 항목(door)이 따로 잡는다. 둘을 한 칸에 섞지 않는다. */
  if (j.enabled === true) return { 산다: true, 왜: '페이팔 enabled' };
  if (j.enabled === false) return { 산다: false, 왜: '페이팔이 꺼져 있다 — 해외 손님은 못 산다' };
  return { 산다: false, 왜: '결제 갈래가 답을 안 준다' };
}

/** 들어오는 문 — oauth 가 꺼져 있으면 살 사람이 못 들어온다 */
export function 문판정(답) {
  if (!답 || 답.코드 !== 200) return { 산다: false, 왜: '응답 ' + (답 ? 답.코드 : '?') };
  let j = null;
  try { j = JSON.parse(답.글); } catch { return { 산다: false, 왜: 'JSON 이 아니다' }; }
  const 옵션 = (j.checks && j.checks.optional) || {};
  if (옵션.oauth === 'not_configured') {
    const 자세히 = 옵션.oauthDetail ? Object.keys(옵션.oauthDetail).join('·') : '';
    return { 산다: false, 왜: '소셜 로그인이 통째로 꺼졌다' + (자세히 ? ' (' + 자세히 + ')' : '') };
  }
  return { 산다: true, 왜: 옵션.oauth || 'ok' };
}

async function 한사이트(사이트코드, 때코드) {
  const s = 사이트[사이트코드];
  const 볼것들 = 볼것(사이트코드, 때코드);
  const 줄들 = [];
  for (const it of 볼것들) {
    if (!잴수있나(it, 사이트코드)) {
      줄들.push({ 항목: it, 잼: false, 표시: '⬜', 말: '손으로 본다 — ' + ((it.봄 && (it.봄[사이트코드] || it.봄.전체)) || '') });
      continue;
    }
    const 길 = 길찾기(it, 사이트코드);
    const 답 = await 받기(s.주소.replace(/\/$/, '') + 길);
    let 됐나, 말;
    if (it.코드 === 'pay-live') { const r = 결제판정(사이트코드, 답); 됐나 = r.산다; 말 = r.왜; }
    else if (it.코드 === 'door') { const r = 문판정(답); 됐나 = r.산다; 말 = r.왜; }
    else { 됐나 = 답.코드 === 200; 말 = String(답.코드) + (답.왜 ? ' · ' + 답.왜 : ''); }
    줄들.push({ 항목: it, 잼: true, 됐나, 표시: 됐나 ? '✅' : '🔴', 말 });
  }
  return 줄들;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  const 흠 = [];
  const 재다 = (이름, 참) => { if (!참) 흠.push(이름); };

  재다('아침은 7시 전', 지금때(new Date(2026, 8, 13, 6, 0)) === '아침');
  재다('7시도 아침', 지금때(new Date(2026, 8, 13, 7, 0)) === '아침');
  재다('13시는 낮', 지금때(new Date(2026, 8, 13, 13, 0)) === '낮');
  재다('20시는 낮', 지금때(new Date(2026, 8, 13, 20, 59)) === '낮');
  재다('21시는 마감', 지금때(new Date(2026, 8, 13, 21, 0)) === '마감');
  재다('자정은 아침', 지금때(new Date(2026, 8, 13, 0, 30)) === '아침');

  재다('유료는 결제를 본다', 볼것('seoulmarkets', '아침').some((x) => x.코드 === 'pay-live'));
  재다('⛔ 무료는 결제를 안 본다', !볼것('kculturewire', '아침').some((x) => x.코드 === 'pay-live'));
  재다('무료는 발행을 본다', 볼것('kculturewire', '마감').some((x) => x.코드 === 'publish-today'));
  재다('⛔ 유료에 발행 항목은 안 건다', !볼것('seoulmarkets', '마감').some((x) => x.코드 === 'publish-today'));
  재다('전 사이트는 200 을 본다', ['seoulmarkets', 'klifemap', 'kculturewire', '100yearmap']
    .every((c) => 볼것(c, '아침').some((x) => x.코드 === 'page-200')));
  재다('아카이빙은 마감에만', 볼것('seoulmarkets', '아침').every((x) => x.코드 !== 'archive-gap')
    && 볼것('seoulmarkets', '마감').some((x) => x.코드 === 'archive-gap'));
  재다('모르는 사이트는 빈 목록', 볼것('없는곳', '아침').length === 0);
  재다('모르는 때도 빈 목록', 볼것('seoulmarkets', '한밤중').length === 0);
  재다('세 때에 다 볼 것이 있다', ['아침', '낮', '마감'].every((t) => 볼것('klifemap', t).length > 0));

  재다('손 항목은 못 잰다', !잴수있나({ 재는법: '손' }, 'seoulmarkets'));
  재다('길이 없으면 못 잰다', !잴수있나({ 재는법: 'http', 길: {} }, 'seoulmarkets'));
  재다('전체 길이면 잰다', 잴수있나({ 재는법: 'http', 길: { 전체: '/' } }, 'seoulmarkets'));
  재다('사이트 길이 있으면 잰다', 잴수있나({ 재는법: 'json', 길: { klifemap: '/x' } }, 'klifemap'));
  재다('⛔ 남의 길로 재지 않는다', !잴수있나({ 재는법: 'json', 길: { klifemap: '/x' } }, 'seoulmarkets'));

  재다('결제 — 켜지고 live 면 산다', 결제판정('seoulmarkets', { 코드: 200, 글: '{"enabled":true,"live":true,"currency":"USD"}' }).산다);
  재다('⛔ live 가 아니면 안 산 것', !결제판정('seoulmarkets', { 코드: 200, 글: '{"enabled":true,"live":false}' }).산다);
  재다('⛔ 꺼져 있으면 안 산다', !결제판정('seoulmarkets', { 코드: 200, 글: '{"enabled":false}' }).산다);
  재다('⛔ 지면이 오면 안 산 것', !결제판정('seoulmarkets', { 코드: 200, 글: '<!DOCTYPE html>' }).산다);
  재다('⛔ 404 면 안 산다', !결제판정('seoulmarkets', { 코드: 404, 글: '' }).산다);
  재다('klifemap — 페이팔이 꺼지면 안 산 것', !결제판정('klifemap', { 코드: 200, 글: '{"ok":true,"enabled":false}' }).산다);
  재다('klifemap — 페이팔이 켜지면 산다', 결제판정('klifemap', { 코드: 200, 글: '{"ok":true,"enabled":true}' }).산다);
  /* 🔴 이 셋이 오늘 겪은 헛울음을 막는다 — 로그인이 죽어도 «결제»는 판정이 바뀌지 않는다 */
  재다('klifemap — degraded 여도 결제가 켜졌으면 산다',
    결제판정('klifemap', { 코드: 200, 글: '{"enabled":true,"status":"degraded"}' }).산다);
  재다('klifemap — 답이 애매하면 안 산 것으로 본다', !결제판정('klifemap', { 코드: 200, 글: '{"ok":true}' }).산다);
  재다('klifemap — 지면이 오면 안 산 것', !결제판정('klifemap', { 코드: 200, 글: '<!DOCTYPE html>' }).산다);

  재다('문 — oauth 가 꺼지면 안 산 것',
    !문판정({ 코드: 200, 글: '{"checks":{"optional":{"oauth":"not_configured","oauthDetail":{"google":"off"}}}}' }).산다);
  재다('문 — 붙어 있으면 산다', 문판정({ 코드: 200, 글: '{"checks":{"optional":{"oauth":"configured"}}}' }).산다);

  재다('항목마다 «왜»가 있다', 항목.every((x) => x.왜 && x.왜.length > 10));
  재다('항목 코드가 겹치지 않는다', new Set(항목.map((x) => x.코드)).size === 항목.length);
  재다('때 이름이 다 실재한다', 항목.every((x) => x.때들.every((t) => Boolean(때[t]))));
  재다('갈래는 셋뿐이다', 항목.every((x) => ['paid', 'free', 'all'].includes(x.갈래)));

  return 흠;
}

async function 본일() {
  const 흠 = 자가시험();
  console.log(흠.length ? '🔴 자가시험 실패:\n  - ' + 흠.join('\n  - ') : '✅ 자가시험 ' + (35 - 흠.length) + '/35');
  if (흠.length) process.exit(1);
  if (인자.includes('--자가시험')) return;

  const 때코드 = 값('--때') || 지금때();
  const 고른사이트 = 값('--사이트');
  const 볼사이트들 = 고른사이트 ? [고른사이트] : Object.keys(사이트);

  console.log('\n■ 일일 점검 — ' + 때[때코드].이름 + '(' + 때[때코드].시 + '시) · '
    + new Date().toLocaleString('ko-KR'));
  console.log('  ' + 때[때코드].설명 + '\n');

  let 깨진것 = 0, 손으로볼것 = 0, 잰것 = 0;
  for (const c of 볼사이트들) {
    const s = 사이트[c];
    if (!s) { console.log('🔴 모르는 사이트: ' + c); continue; }
    console.log((s.유료 ? '💰 유료 ' : '   무료 ') + s.이름 + '  (' + s.자리 + ')');
    for (const 줄 of await 한사이트(c, 때코드)) {
      console.log('     ' + 줄.표시 + ' ' + 줄.항목.이름.padEnd(16, ' ') + ' ' + 줄.말);
      if (!줄.잼) { 손으로볼것 += 1; continue; }
      잰것 += 1;
      if (!줄.됐나) { 깨진것 += 1; console.log('        ↳ ' + 줄.항목.왜); }
    }
    console.log('');
  }

  console.log('잰 것 ' + 잰것 + '개 가운데 깨진 것 ' + 깨진것 + '개 · 손으로 볼 것 ' + 손으로볼것 + '개');
  if (손으로볼것) console.log('⬜ 손으로 볼 것은 «통과»가 아니다. 아직 자가 없다는 뜻이다.');
  if (깨진것) {
    console.log('\n⛔ 깨진 것부터 고친다. 유료 사이트의 결제는 그 자리에서 본다 — 매출이 0 이 되는 자리다.');
    process.exit(1);
  }
  console.log('✅ 잰 것은 다 살아 있다.');
}

if (process.argv[1] && process.argv[1].endsWith('check-daily.mjs')) {
  본일().catch((e) => { console.log('🔴 ' + String(e && e.message ? e.message : e)); process.exit(1); });
}
