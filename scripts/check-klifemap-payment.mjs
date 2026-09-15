#!/usr/bin/env node
/**
 * check-klifemap-payment.mjs — **손님이 «돈을 낼 수 있나»를 잰다.**
 *
 *   node scripts/check-klifemap-payment.mjs            잰다 (막혔으면 종료코드 1)
 *   node scripts/check-klifemap-payment.mjs --적는다     재고 마커까지 남긴다
 *   node scripts/check-klifemap-payment.mjs --자가시험
 *
 * ── 🔴 사장님 지시 (2026-09-12, 원문) ────────────────────────────────────
 *
 * 「**결제가 잘 이뤄지는 지는 해당 유닛 담당자와 총괄이 6시간마다 체크해라.
 *   총괄이 케이라이프맵 일을 담당하고 있으니, 다른 세션이 같이 체크한다.
 *   둘이 체크하므로 3시간에 한번씩 체크하는 게 된다.
 *   결제가 안되면 매출은 0이다. 매우 주의해야 한다**」
 *
 * ── 왜 이 자가 생겼나 ───────────────────────────────────────────────────
 *
 * 2026-09-12 아침에 KLifeMap 유료 서비스가 «사실상 전부 닫혀» 있는 것이 드러났다.
 *
 * ```
 *   /api/auth/providers        []                    소셜 로그인 0 — 손님이 문 앞에서 막힌다
 *   /api/auth/email/send       {"simulated":true}    인증코드가 안 나간다 = 가입이 안 끝난다
 *   /api/billing/toss/status   clientKey "test_ck_…" 돈이 안 들어온다
 *   /api/billing/paypal/status enabled:false         해외 결제 0
 * ```
 *
 * ⛔ 그런데 그것을 «재는 자가 없었다». 서버가 떠 있고 DB 가 성하니 「괜찮다」였고,
 *   5번이 그날 아침 그 상태를 「서비스는 성하다」라고 적어 올리기까지 했다.
 *   사장님: 「아마추어도 해선 안 될 실수이다」
 *
 * ⭐ 그래서 이 자가 재는 것은 «서버가 떠 있나»가 아니라 **«손님이 살 수 있나»**다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 사이트 = 'https://klifemap.ai';

/* ── 판정만 떼어 낸다 (밖에 안 나가고 시험할 수 있게) ───────────────────── */

/**
 * 손님이 «가입»을 끝낼 수 있나.
 * ⚠ 가입에 이메일 인증이 «필수»다(server.js: 인증을 통과한 줄이 없으면 400).
 *   그러니 메일이 안 나가면 소셜 로그인이 유일한 문이고, 그마저 없으면 문이 없다.
 */
export function 들어올수있나({ 로그인, 메일보냄 } = {}) {
  const 문 = [];
  const 것 = Array.isArray(로그인?.providers) ? 로그인.providers : [];
  if (것.length > 0) 문.push('소셜 로그인 ' + 것.length + '가지');
  /* simulated:true 는 «보낸 척»이다. 손님에게 코드가 안 간다 */
  const 메일산다 = 메일보냄 && 메일보냄.ok === true && 메일보냄.simulated !== true;
  if (메일산다) 문.push('이메일 가입');
  return { 열렸나: 문.length > 0, 문 };
}

/**
 * 낸 돈이 «우리에게 들어오나».
 * ⛔ enabled:true 를 「받는다」로 읽지 않는다 — 심사용 테스트 열쇠로도 참이 된다.
 */
export function 돈이들어오나({ 토스, 페이팔 } = {}) {
  const 막힌것 = [];
  if (!토스 || 토스.ok !== true || 토스.enabled !== true) {
    막힌것.push('토스가 꺼져 있다 — 원화로 받을 길이 없다');
  } else if (String(토스.clientKey ?? '').startsWith('test_') || 토스.live === false) {
    막힌것.push('토스가 «심사용 테스트 열쇠»다 — 손님이 눌러도 돈이 안 들어온다');
  }
  if (!페이팔 || 페이팔.enabled !== true) 막힌것.push('페이팔이 꺼져 있다 — 해외 손님은 못 산다');
  /* 국내가 막히면 매출이 «0»이고, 해외만 막히면 «줄어든» 것이다. 둘을 가른다 */
  const 국내막힘 = 막힌것.some((x) => x.includes('토스'));
  return { 들어오나: 막힌것.length === 0, 국내막힘, 막힌것 };
}

/**
 * 🔴 손님길 셋째 다리 — **산 감명서를 «다시 볼» 수 있나.**
 *
 * 사장님(2026-09-13): 「**비회원 결제는 감명서를 다시 못보잖아**」
 * 사장님(2026-09-15): 「**세 징검다리를 너, 담당 유닛 2이 번갈아 가면서 확인해**」
 *
 * ⚠ KLifeMap 은 SeoulMarkets 와 다르다 — 회원(로그인)이 있고, 「감명 내역」은
 *   로그인한 회원의 화면이다. 그래서 되찾는 «지면 하나»가 아니라 ①안내 지면에
 *   그 기능이 실려 있는가 ②무인증 요청이 «남의 것을 새어 주지 않는가»로 잰다.
 * ⛔ 실제 로그인→목록→상세 왕복까지는 **운영 DB에 테스트 손님을 못 심어** 이 자로는
 *   못 잰다. 그건 klifemap/tools/check-감명다시보기.mjs 를 로컬(배포 전)에서 인자
 *   없이 돌리는 쪽이 맡는다 — 여기서는 «입구가 살아 있나»까지만 잰다. 통과로
 *   부풀리지 않는다(강령 셋째 — 못 잰 것은 못 쟀다고 적는다).
 */
export function 다시볼수있나({ 로그인지면, 목록무인증, 결제무인증 } = {}) {
  if (로그인지면 == null && 목록무인증 == null && 결제무인증 == null) {
    return { 된다: null, 막힌것: [], 까닭: '못 쟀다' };
  }
  const 막힌것 = [];
  if (typeof 로그인지면 === 'string' && !/감명\s*내역/.test(로그인지면)) {
    막힌것.push('login.html 에 「감명 내역」 글자가 없다 — 지면이 빠졌거나 이름이 바뀌었다');
  }
  /* ⛔ 무인증인데 200 이면 «막힘»이 아니라 «남의 것이 새는» 반대 방향 사고다 — 더 나쁘다 */
  if (목록무인증 && 목록무인증.status !== 401) {
    막힌것.push('🔴 토큰 없이 /api/my/sessions 가 ' + 목록무인증.status + ' — 남의 감명 내역이 샐 수 있다');
  }
  if (결제무인증 && 결제무인증.status !== 401) {
    막힌것.push('🔴 토큰 없이 /api/my/payments 가 ' + 결제무인증.status + ' — 남의 결제내역이 샐 수 있다');
  }
  return { 된다: 막힌것.length === 0, 막힌것, 까닭: null };
}

/** 셋을 합쳐 한 마디로 — 사장님이 물으시는 것은 「팔리나」 하나다 */
export function 팔리나(답들) {
  const 문 = 들어올수있나(답들);
  const 돈 = 돈이들어오나(답들);
  const 되 = 다시볼수있나(답들);
  const 막힌것 = [];
  if (!문.열렸나) 막힌것.push('손님이 «가입도 로그인도» 못 한다 — 문이 하나도 없다');
  막힌것.push(...돈.막힌것, ...되.막힌것);
  /* ⛔ 못 쟀으면 «막혔다»로 몰지 않는다. 못 쟀다고 따로 말한다 */
  const 못잰것 = [];
  if (되.된다 === null) 못잰것.push('산 감명서를 다시 볼 수 있나 — 못 쟀다');
  /* 🔴 문이 막혔거나 국내 결제가 막혔으면 매출은 0 이다. 다시보기가 막히면 반쪽만 판 것이라
     심각으로 올린다 — 돈은 받았는데 손님이 산 것을 잃는 사고다 */
  const 심각 = !문.열렸나 || 돈.국내막힘 || 되.된다 === false;
  return {
    판정: 막힌것.length === 0 ? '팔린다' : (심각 ? '매출0' : '줄었다'),
    막힌것,
    못잰것,
    열린문: 문.문,
  };
}

/* ── 실제로 잰다 ───────────────────────────────────────────────────────── */

async function 물어본다(길, 보낼것) {
  try {
    const r = await fetch(사이트 + 길, {
      method: 보낼것 ? 'POST' : 'GET',
      headers: 보낼것 ? { 'Content-Type': 'application/json' } : undefined,
      body: 보낼것 ? JSON.stringify(보낼것) : undefined,
      signal: AbortSignal.timeout(25000),
    });
    return await r.json();
  } catch { return null; }
}

/** 셋째 다리용 — GET 하나를 status 만 뽑아 온다(본문은 로그인 지면만 필요하다) */
async function 상태만(길) {
  try {
    const r = await fetch(사이트 + 길, { signal: AbortSignal.timeout(15000) });
    return { status: r.status };
  } catch { return null; }
}

async function 잰다() {
  const [토스, 페이팔, 로그인, 로그인지면글, 목록무인증, 결제무인증] = await Promise.all([
    물어본다('/api/billing/toss/status'),
    물어본다('/api/billing/paypal/status'),
    물어본다('/api/auth/providers'),
    fetch(사이트 + '/login.html', { signal: AbortSignal.timeout(15000) }).then((r) => r.text()).catch(() => null),
    상태만('/api/my/sessions'),
    상태만('/api/my/payments'),
  ]);
  /* ⚠ 우리 주소로만 찔러 본다 — 손님 주소로 메일을 보내지 않는다 */
  const 메일보냄 = await 물어본다('/api/auth/email/send', { email: 'u5@klifedesign.net' });

  const 답 = 팔리나({ 토스, 페이팔, 로그인, 메일보냄, 로그인지면: 로그인지면글, 목록무인증, 결제무인증 });
  const 때 = new Date();

  console.log('■ klifemap 결제 점검 — ' + 때.toLocaleString('ko-KR'));
  console.log('   ⭐ 재는 것은 「서버가 떠 있나」가 아니라 «손님이 살 수 있나»다\n');
  console.log('   들어오는 문   ' + (답.열린문.length ? 답.열린문.join(' · ') : '🔴 «하나도 없다»'));
  console.log('   토스          ' + (토스 ? ('enabled=' + 토스.enabled + ' · live=' + 토스.live +
    ' · key=' + String(토스.clientKey ?? '').slice(0, 8) + '…') : '못 쟀다'));
  console.log('   페이팔        ' + (페이팔 ? ('enabled=' + 페이팔.enabled) : '못 쟀다'));
  console.log('   인증메일      ' + (메일보냄
    ? (메일보냄.simulated === true ? '🔴 simulated — «보낸 척»만 한다' : '나간다')
    : '못 쟀다'));
  console.log('   다시 보기     ' + (목록무인증 && 결제무인증
    ? ('login.html 「감명 내역」 ' + (typeof 로그인지면글 === 'string' && /감명\s*내역/.test(로그인지면글) ? '있음' : '없음')
      + ' · 무인증 sessions=' + 목록무인증.status + ' payments=' + 결제무인증.status)
    : '못 쟀다'));
  console.log('');
  for (const x of 답.못잰것) console.log('   ⬜ ' + x);

  if (답.판정 === '팔린다') {
    console.log('   ✅ 팔린다 — 손님이 들어와서 돈을 내고 다시 볼 수 있다');
  } else if (답.판정 === '줄었다') {
    console.log('   ⚠ 국내는 팔리는데 한쪽이 막혔다');
    for (const x of 답.막힌것) console.log('      · ' + x);
  } else {
    console.log('   🔴🔴 **매출 0** — 손님이 돈을 낼 수 없거나 산 것을 잃는다');
    for (const x of 답.막힌것) console.log('      · ' + x);
    console.log('');
    console.log('   ✅ 고치는 길 — Cloudtype 스테이지 시크릿에 넣고 다시 띄운다');
    console.log('      TOSS_CLIENT_KEY · TOSS_SECRET_KEY');
    console.log('      🔴 [2026-09-12 19:1x 실측] **실키가 «아직 발급된 적이 없다».**');
    console.log('         토스 개발자센터 라이브 갈피 — live_ck_/live_sk_ 둘 다 «없음»,');
    console.log('         개별 연동 키 칸도 비었고 화면이 「내 키는 전자결제 신청하고');
    console.log('         확인할 수 있어요 · 이용 신청하기」라고 말한다.');
    console.log('         ⇒ 막힌 것은 코드도 배포도 아니고 «전자결제 이용 신청»이다.');
    console.log('         ⛔ 이 자리에 원래 「단건 계약 완료 — 실키가 있다」라고 적혀 있었다.');
    console.log('            확인 안 하고 적은 거짓이었고, 그 한 줄이 사람을 엉뚱한 데로 보냈다.');
    console.log('      OAUTH_GOOGLE/NAVER/KAKAO_CLIENT_ID·SECRET  (손님이 들어오는 문)');
    console.log('      SMTP_* 또는 NCP_*                          (가입 인증코드)');
    console.log('   ⛔ klifemap 에 ctype apply 를 «env 선언 없이» 치지 않는다 — 그것이 09-11 에 다 지웠다');
  }

  if (process.argv.includes('--적는다')) {
    const 곳 = path.join(뿌리, 'docs', '고정업무-마커');
    fs.mkdirSync(곳, { recursive: true });
    const 날 = 때.getFullYear() + '-' + String(때.getMonth() + 1).padStart(2, '0') + '-' +
      String(때.getDate()).padStart(2, '0');
    const 시 = String(때.getHours()).padStart(2, '0');
    const 이름 = `${날}-${시}시-결제점검.txt`;
    fs.writeFileSync(path.join(곳, 이름),
      [`잰 때   ${때.toLocaleString('ko-KR')}`,
       `잰 자리  5번(총괄)`,
       `판정    ${답.판정}`,
       `열린문  ${답.열린문.join(' · ') || '없다'}`,
       ...답.막힌것.map((x) => `막힘    ${x}`)].join('\n') + '\n');
    console.log('\n   ✅ 마커를 남겼다 — docs/고정업무-마커/' + 이름);
    console.log('   ⛔ 「봤다」는 증거가 아니다. 마커가 증거다');
  }

  return 답.판정 === '팔린다' ? 0 : 1;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */

function 자가시험() {
  let 통과 = 0; const 깨짐 = [];
  const 검 = (이름, 나옴, 바람) => {
    if (JSON.stringify(나옴) === JSON.stringify(바람)) 통과++;
    else 깨짐.push(`${이름} — 나온 것 ${JSON.stringify(나옴)} · 바란 것 ${JSON.stringify(바람)}`);
  };

  /* 🔴 2026-09-12 08:0x 에 실제로 온 답 */
  const 그날 = {
    토스: { ok: true, enabled: true, live: false, clientKey: 'test_ck_AQ92ymxN34PzJ55D7pKj3ajRKXvd' },
    페이팔: { ok: true, enabled: false },
    로그인: { ok: true, providers: [] },
    메일보냄: { ok: true, simulated: true },
  };
  검('그날 답은 «매출0»', 팔리나(그날).판정, '매출0');
  검('문이 하나도 없다고 집어낸다', 팔리나(그날).열린문, []);
  검('막힌 것 셋을 다 센다', 팔리나(그날).막힌것.length, 3);

  검('⛔ simulated 는 «나간다»가 아니다',
    들어올수있나({ 로그인: { providers: [] }, 메일보냄: { ok: true, simulated: true } }).열렸나, false);
  검('메일이 진짜 나가면 문이 하나 열린 것이다',
    들어올수있나({ 로그인: { providers: [] }, 메일보냄: { ok: true } }).문, ['이메일 가입']);
  검('소셜만 있어도 문은 열린 것이다',
    들어올수있나({ 로그인: { providers: ['google'] }, 메일보냄: { ok: true, simulated: true } }).열렸나, true);

  검('⛔ test_ 열쇠는 «안 들어온다»',
    돈이들어오나({ 토스: { ok: true, enabled: true, live: true, clientKey: 'test_ck_x' },
      페이팔: { enabled: true } }).들어오나, false);
  검('실키면 들어온다',
    돈이들어오나({ 토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
      페이팔: { enabled: true } }).들어오나, true);
  검('페이팔만 꺼지면 «국내막힘»이 아니다',
    돈이들어오나({ 토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
      페이팔: { enabled: false } }).국내막힘, false);
  검('페이팔만 꺼진 것은 «줄었다»이지 매출0 이 아니다',
    팔리나({ 토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
      페이팔: { enabled: false }, 로그인: { providers: ['google'] },
      메일보냄: { ok: true } }).판정, '줄었다');

  const 다열림 = {
    토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
    페이팔: { ok: true, enabled: true },
    로그인: { ok: true, providers: ['google', 'naver', 'kakao'] },
    메일보냄: { ok: true },
  };
  검('다 열리면 팔린다', 팔리나(다열림).판정, '팔린다');
  검('열린 문을 둘 다 센다', 팔리나(다열림).열린문.length, 2);

  검('⛔ 아무것도 못 받았으면 «팔린다»고 하지 않는다', 팔리나({}).판정, '매출0');
  검('못 받았을 때 토스를 «꺼졌다»로 적는다',
    돈이들어오나({}).막힌것[0].includes('토스가 꺼져 있다'), true);

  /* ── 손님길 셋째 다리 — 다시 보기 ─────────────────────────────────── */
  검('아무것도 안 주면 못 쟀다(null) — 막혔다로 몰지 않는다', 다시볼수있나({}).된다, null);
  검('login.html 에 「감명 내역」 글자가 없으면 잡는다',
    다시볼수있나({ 로그인지면: '로그인 화면입니다', 목록무인증: { status: 401 }, 결제무인증: { status: 401 } })
      .막힌것.some((x) => x.includes('감명 내역')), true);
  검('「감명 내역」 있고 둘 다 401 이면 된다',
    다시볼수있나({ 로그인지면: '감명 내역 목록', 목록무인증: { status: 401 }, 결제무인증: { status: 401 } }).된다, true);
  검('🔴🔴 무인증인데 sessions 가 200 이면 «남의 것이 샌다»로 잡는다(막힘보다 나쁘다)',
    다시볼수있나({ 로그인지면: '감명 내역', 목록무인증: { status: 200 }, 결제무인증: { status: 401 } })
      .막힌것.some((x) => x.includes('샐 수 있다')), true);
  검('🔴 무인증인데 payments 가 200 이어도 잡는다',
    다시볼수있나({ 로그인지면: '감명 내역', 목록무인증: { status: 401 }, 결제무인증: { status: 200 } })
      .막힌것.some((x) => x.includes('결제내역')), true);

  검('다시보기가 막히면 국내 결제가 살아 있어도 매출0 이다(반쪽만 판 것)',
    팔리나({ 토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
      페이팔: { enabled: true }, 로그인: { providers: ['google'] }, 메일보냄: { ok: true },
      로그인지면: '로그인', 목록무인증: { status: 200 }, 결제무인증: { status: 401 } }).판정, '매출0');
  검('셋 다 열리면 팔린다', 팔리나({
    토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
    페이팔: { enabled: true }, 로그인: { providers: ['google'] }, 메일보냄: { ok: true },
    로그인지면: '감명 내역', 목록무인증: { status: 401 }, 결제무인증: { status: 401 },
  }).판정, '팔린다');
  검('다시보기를 못 쟀으면 「못잰것」에 남는다(팔린다를 부풀리지 않되 막지도 않는다)',
    팔리나(다열림).못잰것.some((x) => x.includes('다시 볼 수 있나')), true);

  console.log(`■ 자가시험 ${통과 + 깨짐.length}가지 — 통과 ${통과} · 깨짐 ${깨짐.length}`);
  for (const d of 깨짐) console.log('   🔴 ' + d);
  return 깨짐.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
else process.exit(await 잰다());
