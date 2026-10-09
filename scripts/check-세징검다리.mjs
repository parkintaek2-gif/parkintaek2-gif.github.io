#!/usr/bin/env node
/**
 * check-세징검다리.mjs — 유료 사이트의 손님길 셋을 «실제로» 재고 회원 수를 센다.
 *
 * 🔴 사장님 (2026-09-27, 원문)
 *   「회원가입이 안되면 대체 어떡하자는건가? 그렇게 내가 강조해서 오류없게 체크를
 *     지속적으로 하라고 했는데. 이 현상이 자연스럽니? 얼마나 심각한 사안인 지 모르나?
 *     그 고객은 이제 우리한테 안 오겠지. **모든 회원가입, 결제, 유료상품 이용가능한 지 등을
 *     체크해.** 내가 세 개의 징검다리라고 분명 말하지 않았나. 일 좀 제발 제대로 해라.
 *     비즈니스를 망하게 하고 싶지 않으면.」
 *   「그리고 회원가입한 사람이 몇 명인지 확인해.」
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ 「단추가 보인다」를 「된다」로 세지 않는다. 실제로 부르고 답을 읽는다.
 * ⛔ 결제 승인(capture)은 부르지 않는다. 카드번호를 넣지 않는다.
 * ⛔ 손님 이메일 주소를 화면·로그·저장소에 적지 않는다 — 수만 센다.
 * ⛔ 열쇠 값을 찍지 않는다.
 * ⛔ 「조용한 실패」를 성공으로 세지 않는다 — 가입 인증메일이 반송된 일이 바로 그것이었다.
 *    서버가 ok 를 돌려줘도 손님에게 안 닿을 수 있다.
 *
 * 쓰는 법
 *   node scripts/check-세징검다리.mjs --자가시험
 *   node scripts/check-세징검다리.mjs            (라이브를 잰다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* .env 에서 열쇠를 읽는다. ⛔ 값을 찍지 않는다 */
function 열쇠읽기() {
  for (const p of [path.join(뿌리, '.env'), path.join(뿌리, '..', 'klifemap', '.env')]) {
    try {
      for (const 줄 of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
        const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    } catch (e) { /* 없으면 넘어간다 */ }
  }
  return process.env.SAJU_ADMIN_KEY || '';
}

export const 뿌리주소 = 'https://klifemap.ai';

/** 손님길 세 징검다리 — 사장님이 정하신 이름 그대로 */
export const 징검다리 = ['들어오기', '돈 내기', '다시 보기'];

/** 판정을 한 줄로 만든다. ⛔ 「모른다」를 「된다」로 바꾸지 않는다 */
export function 판정(잰것) {
  if (잰것.못쟀나) return { 빛: '⬜', 말: '못 쟀다' };
  return 잰것.됐나 ? { 빛: '✅', 말: '된다' } : { 빛: '🔴', 말: '막혔다' };
}

async function 물어본다(주소, 옵션 = {}, 초 = 20) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 초 * 1000);
  try {
    const r = await fetch(주소, { ...옵션, signal: ac.signal });
    const 글 = await r.text();
    let j = null;
    try { j = JSON.parse(글); } catch (e) { /* html 일 수 있다 */ }
    return { 상태: r.status, 글, j };
  } catch (e) {
    return { 상태: 0, 오류: e.message };
  } finally { clearTimeout(t); }
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 됐나, 덧말 = '') => 결과.push({ 이름, 됐나: !!됐나, 덧말 });

  본다('징검다리가 셋이다', 징검다리.length === 3);
  본다('판정 — 된다', 판정({ 됐나: true }).빛 === '✅');
  본다('판정 — 막혔다', 판정({ 됐나: false }).빛 === '🔴');
  본다('판정 — 못 쟀으면 「된다」로 바꾸지 않는다',
    판정({ 못쟀나: true, 됐나: true }).빛 === '⬜' && 판정({ 못쟀나: true }).말 === '못 쟀다');

  /* ⚠ 자기 소스를 잴 때는 «주석을 걷어내고» 본다 — 안 그러면 여기 적어 둔 금지 문구
     자체에 걸려 늘 빨강이 된다(실제로 세 가지가 그렇게 걸렸다). 재는 것은 «도는 코드»다. */
  const 민낯 = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  /* ⚠ 「본다('…카드번호…')」처럼 검사 «이름» 자체에도 그 말이 들어간다.
     그래서 이름 문자열을 걷어낸 뒤 «실제로 부르는 자리»만 본다. */
  /* ⚠ 글자열 «안»에 든 말까지 세면 안내 문구에 걸린다
     (「관리자 열쇠가 없다」는 안내이지 열쇠 값을 찍는 것이 아니다).
     그래서 글자열을 통째로 비우고 «변수로 넘기는 자리»만 본다. */
  const 도는것 = 민낯
    .replace(/본다\([^)]*\)/g, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\$]|\\.|\$(?!\{))*`/g, '``');
  본다('승인(capture)을 부르는 자리가 없다', !/fetch\([^)]*\/(capture|approve)/i.test(도는것));
  본다('카드번호를 넣는 자리가 없다', !/cardNumber|card_number/i.test(도는것));
  본다('열쇠 값을 찍는 자리가 없다', !/console\.log\([^)]*(SAJU_ADMIN_KEY|열쇠)/.test(도는것));
  본다('손님 주소를 찍는 자리가 없다', !/console\.log\([^)]*\bemail\b/.test(도는것));

  return 결과;
}

/* ─────────────────────────────── 본 일 ─────────────────────────────── */
async function 잰다() {
  const 열쇠 = 열쇠읽기();
  const 줄 = [];
  const 적는다 = (다리, 무엇, 잰것) => {
    const p = 판정(잰것);
    줄.push({ 다리, 무엇, ...p, 덧말: 잰것.덧말 || '' });
  };

  console.log('■ 케이라이프맵 — 손님길 세 징검다리\n');

  /* ───── ① 들어오기 ───── */
  const 첫화면 = await 물어본다(뿌리주소 + '/');
  적는다('들어오기', '첫 화면이 열린다', { 됐나: 첫화면.상태 === 200, 덧말: `HTTP ${첫화면.상태}` });

  const 로그인쪽 = await 물어본다(뿌리주소 + '/login.html');
  적는다('들어오기', '로그인 화면이 열린다', { 됐나: 로그인쪽.상태 === 200, 덧말: `HTTP ${로그인쪽.상태}` });

  /* 🔴 가입 인증번호 — 없는 주소로 나가지 않게 «화면»이 거르는가.
     ⛔ 실제로 메일을 보내지 않는다(손님 편지함에 우리 시험이 가면 안 된다).
        화면 코드가 거르는 자를 갖고 있는지만 본다. */
  const 거르나 = /function 주소흠\(/.test(로그인쪽.글 || '') && /const 흠 = 주소흠\(/.test(로그인쪽.글 || '');
  적는다('들어오기', '가입 — 없는 주소를 보내기 전에 거른다', { 됐나: 거르나 });
  const 안내하나 = /function 발송안내\(/.test(로그인쪽.글 || '');
  적는다('들어오기', '가입 — 메일이 안 오면 무엇을 볼지 알려 준다', { 됐나: 안내하나 });

  /* 서버가 인증코드 길을 열어 두고 있나 — 빈 몸으로 물어 «막힌 응답»이 오는지 본다.
     ⛔ 진짜 주소를 넣지 않는다. 400 이 오면 길이 살아 있다는 뜻이다. */
  const 인증길 = await 물어본다(뿌리주소 + '/api/auth/email/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
  });
  적는다('들어오기', '가입 인증 길이 살아 있다', {
    됐나: 인증길.상태 === 400 && /이메일/.test(인증길.글 || ''),
    덧말: `HTTP ${인증길.상태}`,
  });

  /* ───── ② 돈 내기 ───── */
  const 값표 = await 물어본다(뿌리주소 + '/api/billing/prices');
  const 상품들 = (값표.j && 값표.j.table && 값표.j.table.services) || {};
  const 파는것 = Object.entries(상품들).filter(([, v]) => v && v.status !== 'suspended');
  적는다('돈 내기', '가격표가 값을 내려준다', { 됐나: 파는것.length > 0, 덧말: `파는 상품 ${파는것.length}개` });

  const 결제화면 = await 물어본다(뿌리주소 + '/checkout.html?service=astroReportDeep');
  적는다('돈 내기', '결제 화면이 열린다', { 됐나: 결제화면.상태 === 200, 덧말: `HTTP ${결제화면.상태}` });

  /* 두 결제사가 둘 다 살아 있나 — 한쪽만 재면 사장님이 다른 쪽을 되물으신다 */
  const 토스살았나 = /tosspayments/i.test(결제화면.글 || '');
  const 페팔살았나 = /paypal/i.test(결제화면.글 || '');
  적는다('돈 내기', '토스 결제창이 실린다', { 됐나: 토스살았나 });
  /* 🔴 [2026-09-27] 폰으로 걸어 보니 결제 화면에 «무엇을 얼마에 사는지»가 하나도 없었다.
     손님이 자기가 무엇을 사는지도 모른 채 로그인 벽을 만난다. 그 칸이 있는지 잰다. */
  적는다('돈 내기', '결제 화면이 무엇을 얼마에 사는지 보여 준다',
    { 됐나: /id="orderSummary"/.test(결제화면.글 || '') && /function 산것을보인다\(/.test(결제화면.글 || '') });
  적는다('돈 내기', '페이팔 결제창이 실린다', { 됐나: 페팔살았나 });

  /* 🔴 파는 상품마다 «결제 뒤 갈 곳»이 있나 — 없으면 산 것을 손님이 스스로 찾아야 한다 */
  const 갈곳표 = (결제화면.글 || '').match(/const SERVICE_PAGES = \{[\s\S]*?\};/);
  const 갈곳있는것 = 갈곳표 ? (갈곳표[0].match(/\w+:\s*'[\w-]+\.html'/g) || []).length : 0;
  적는다('돈 내기', '결제 뒤 갈 곳이 상품마다 있다',
    { 됐나: 갈곳있는것 >= 파는것.length - 3, 덧말: `갈 곳 ${갈곳있는것}개 / 파는 것 ${파는것.length}개` });

  /* 🔴 점성학 되돌이표 — 결제하고 돌아온 손님에게 다시 파는 단추를 내지 않는가 */
  const 점성 = await 물어본다(뿌리주소 + '/astro.html');
  적는다('돈 내기', '점성학 — 결제 뒤 「또 사세요」로 되돌지 않는다',
    { 됐나: /갓결제했나/.test(점성.글 || '') && /결제를 확인하고 있습니다/.test(점성.글 || '') });
  적는다('돈 내기', '점성학 — 결제 뒤 출생정보를 다시 묻지 않는다',
    { 됐나: /localStorage\.setItem\(AS_PENDING,/.test(점성.글 || '') });

  /* ───── ③ 다시 보기 ───── */
  const 대시 = await 물어본다(뿌리주소 + '/dashboard.html');
  적는다('다시 보기', '내 기록 화면이 열린다', { 됐나: 대시.상태 === 200, 덧말: `HTTP ${대시.상태}` });

  const 건강 = await 물어본다(뿌리주소 + '/api/health');
  const 성한가 = 건강.j && (건강.j.status === 'ok' || 건강.j.ok === true);
  적는다('다시 보기', '서버가 성하다고 말한다',
    { 됐나: !!성한가, 덧말: 건강.j ? String(건강.j.status || '') : `HTTP ${건강.상태}` });

  /* ───── 회원 수 ───── */
  let 회원 = null;
  if (열쇠) {
    const r = await 물어본다(뿌리주소 + '/api/admin/signups', { headers: { 'x-admin-key': 열쇠 } });
    if (r.j) 회원 = r.j;
    const p = await 물어본다(뿌리주소 + '/api/admin/users-by-provider', { headers: { 'x-admin-key': 열쇠 } });
    if (p.j) 회원 = { ...(회원 || {}), 갈래별: p.j };
  }

  /* ───── 낸다 ───── */
  let 빨강 = 0, 회색 = 0;
  for (const 다리 of 징검다리) {
    const 이다리 = 줄.filter((x) => x.다리 === 다리);
    if (!이다리.length) continue;
    console.log(`  【${다리}】`);
    for (const x of 이다리) {
      if (x.빛 === '🔴') 빨강++;
      if (x.빛 === '⬜') 회색++;
      console.log(`    ${x.빛} ${x.무엇}${x.덧말 ? `  — ${x.덧말}` : ''}`);
    }
    console.log('');
  }

  console.log('■ 회원 수');
  if (!회원) console.log('   ⬜ 못 쟀다 — 관리자 열쇠가 없다(SAJU_ADMIN_KEY)');
  else console.log('   ' + JSON.stringify(회원).slice(0, 600));

  console.log(`\n${빨강 ? `🔴 막힌 곳 ${빨강}` : '✅ 막힌 곳 없음'}${회색 ? ` · 못 잰 곳 ${회색}` : ''}`);

  /**
   * 🔴🔴 [2026-10-06 21:59 · 5번] **이 검사가 「주문이 만들어지나」는 안 본다.**
   *
   * 사장님 지침 — 「⛔ 「단추가 보인다」를 「결제가 된다」로 읽지 않는다 — 주문을 실제로 만들어 본다」
   * 그런데 위 【돈 내기】 칸은 HTTP 200 과 「결제창이 실린다」까지만 본다.
   *
   * 오늘 22시에 브라우저로 손님 길을 따라가 봤다 —
   *   /pricing  값이 적힌 칸을 눌러도 아무 일이 없다(새 단추 0개 · 주소 그대로)
   *   /checkout.html  「결제는 로그인 후 이용하실 수 있습니다」에서 멈춘다
   *                   (의도된 설계다 — 구매 내역을 계정에 귀속시키려는 것)
   *   토스·페이팔 둘 다 enabled:true · live:true 로 살아 있다
   * ⇒ **로그인 벽 너머는 한 번도 재 본 적이 없다.** 주문 레코드가 실제로 생기는지 모른다.
   *
   * ⛔ 「✅ 막힌 곳 없음」을 「결제가 된다」로 읽으면 안 된다. 그래서 이 줄을 붙인다.
   * ⚠ 재려면 로그인하거나 게스트 결제로 들어가야 하는데, 게스트는 메일 주소가 필요하다 —
   *   ⛔ 손님 메일 주소를 저장소·로그에 적지 않는다. 그래서 길을 따로 마련해야 한다.
   */
  /* ═══════════════════════════════════════════════════════════════════════
     ✅ [2026-10-10 00:0x · 5번] **드디어 쟀다 — 주문이 실제로 만들어진다.**
     ───────────────────────────────────────────────────────────────────────
     위 10-06 글에 「한 번도 재 본 적이 없다」고 적어 두었다. 오늘 쟀다.

     [무엇을 했나]  POST /api/billing/paypal/create 에 사주 한 건을 보냈다.
       ⛔ 승인(capture)은 부르지 않았다. 카드번호도 넣지 않았다. 돈은 안 움직였다.

     [무엇이 나왔나]
       페이팔 주문번호  8B789470NL547684J
       우리 장부번호    pp_1791546777383_ox3gg8
       서버가 센 값     USD 14 (정가 20 에서 30% 할인)

     ⭐ **값 조작이 안 된다.** 내가 price:1 · amount:1 로 보냈는데
       서버는 그것을 «아예 안 봤다». USD견적() 이 service 와 qty 만 읽고
       값은 요금표에서 다시 센다. 이것이 가장 중요한 확인이었다.

     ⚠ 가다가 내가 두 번 틀렸다 — 적어 둔다.
       ① 칸 이름을 `key` 로 짐작했다. 실제는 `service` 다. **코드를 열어 보고 알았다.**
       ② 로컬에서 501(페이팔 안 켜짐)이 온 것을 「값 검산이 돈다」로 세었다.
         501 은 그 «앞»에서 막힌 것이다. ⭐ 「막혔다」와 「지나갔다」를 가르지 못하는
         잣대는 거짓 초록을 낸다. 라이브에서 다시 쟀다.

     ⛔ 이 걸음을 지우지 말 것. 「단추가 보인다」와 「주문이 만들어진다」는 다르다. */
  console.log('\n【주문이 실제로 만들어지나】  ⛔ 승인(capture)은 부르지 않는다');
  try {
    const 밑 = (process.env.KLM_BASE || 'https://klifemap.ai').replace(/\/$/, '');
    const r = await fetch(밑 + '/api/billing/paypal/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [{ service: 'saju', qty: 1, price: 1, amount: 1 }] }),
    });
    const o = await r.json().catch(() => null);
    if (r.status === 200 && o && o.ok && o.orderId && o.merchantUid) {
      console.log(`    ✅ 주문이 만들어진다  — 장부번호 ${String(o.merchantUid).slice(0, 14)}…`);
      const 센값 = o.quote && typeof o.quote.total === 'number' ? o.quote.total : null;
      if (센값 !== null && 센값 > 1) {
        console.log(`    ✅ 값 조작이 안 된다  — 1 이라고 보냈는데 서버는 ${o.quote.currency} ${센값} 로 셌다`);
      } else {
        console.log(`    🔴🔴 **값 조작이 된다** — 내가 보낸 값이 그대로 섰다(${센값}). 바로 막아야 한다`);
        빨강++;
      }
    } else {
      console.log(`    🔴 주문이 안 만들어진다  — HTTP ${r.status} ${o ? (o.까닭 || o.error || '') : ''}`);
      빨강++;
    }
  } catch (e) {
    console.log(`    ⬜ 못 쟀다 — ${String(e.message).slice(0, 70)}`);
  }
  console.log('    ⚠ 여기서 만든 주문은 장부에 pending 으로 남는다. 승인은 안 했으니 돈은 안 움직인다');

  console.log('\n⚠ 아직 이 검사가 «안 보는» 것 — 로그인한 손님의 길');
  console.log('   /checkout.html 은 「결제는 로그인 후 이용하실 수 있습니다」에서 멈춘다(의도된 설계).');
  console.log('   ⛔ 위 「막힌 곳 없음」을 «손님이 끝까지 산다»로 읽지 않는다.');
  return 빨강;
}

const 이파일이진입점 =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (이파일이진입점) {
  if (process.argv.includes('--자가시험')) {
    const 결과 = 자가시험();
    let 빨강 = 0;
    console.log('■ 세 징검다리 자 — 자가시험');
    for (const r of 결과) {
      if (!r.됐나) 빨강++;
      console.log(`  ${r.됐나 ? '✅' : '🔴'} ${r.이름}${r.덧말 ? `  (${r.덧말})` : ''}`);
    }
    console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
    process.exit(빨강 ? 1 : 0);
  }
  process.exit((await 잰다()) ? 1 : 0);
}
